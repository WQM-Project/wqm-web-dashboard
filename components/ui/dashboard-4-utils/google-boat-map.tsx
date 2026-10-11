"use client";
import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "./shared";
import {
  CAMPUS_REFERENCE,
  DEMO_BOAT_LOCATION,
  validPosition,
} from "@/lib/map-config";
import type { BoatPosition } from "@/lib/map-config";
import { dateLabel } from "@/lib/dashboard";

let configured = false;
const MAP_TYPES = ["roadmap", "satellite", "terrain", "hybrid"] as const;
type MapType = (typeof MAP_TYPES)[number];
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function GoogleBoatMap({
  demo,
  position,
  theme,
  apiKey,
  mapId,
  onUnavailable,
}: {
  demo: boolean;
  position?: BoatPosition;
  theme: "light" | "dark";
  apiKey: string;
  mapId: string;
  onUnavailable: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const info = useRef<google.maps.InfoWindow | null>(null);
  const camera = useRef<{
    center: google.maps.LatLngLiteral;
    zoom: number;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [mapType, setMapType] = useState<MapType>("roadmap");
  const hasGps = !demo && validPosition(position);
  const latitude = demo
    ? DEMO_BOAT_LOCATION.latitude
    : hasGps
      ? position.latitude
      : CAMPUS_REFERENCE.latitude;
  const longitude = demo
    ? DEMO_BOAT_LOCATION.longitude
    : hasGps
      ? position.longitude
      : CAMPUS_REFERENCE.longitude;
  const locationRef = useRef({ latitude, longitude, showBoat: demo || hasGps });
  locationRef.current = { latitude, longitude, showBoat: demo || hasGps };
  const typeRef = useRef(mapType);
  typeRef.current = mapType;

  useEffect(() => {
    let disposed = false;
    let authRejected = false;
    let resize: ResizeObserver | undefined;
    let current: google.maps.Map | null = null;
    let currentMarker: google.maps.marker.AdvancedMarkerElement | null = null;
    let campus: google.maps.Circle | null = null;
    let popupWindow: google.maps.InfoWindow | null = null;
    const listeners: google.maps.MapsEventListener[] = [];
    setReady(false);
    setError("");
    const previousAuthFailure = window.gm_authFailure;
    const authFailure = () => {
      authRejected = true;
      if (!disposed) {
        setError("The map is unavailable. Please check its configuration.");
        setReady(false);
        onUnavailable();
      }
    };
    window.gm_authFailure = authFailure;
    const timer = window.setTimeout(() => {
      if (!disposed) {
        setError(
          "The map is taking too long to load. Refresh the page to retry.",
        );
        onUnavailable();
      }
    }, 20000);
    async function initialize() {
      if (!configured) {
        setOptions({ key: apiKey, v: "weekly", region: "IN" });
        configured = true;
      }
      const [{ Map }, { ColorScheme }, { AdvancedMarkerElement }] =
        await Promise.all([
          importLibrary("maps"),
          importLibrary("core"),
          importLibrary("marker"),
        ]);
      if (disposed || !container.current) return;
      current = new Map(container.current, {
        center: camera.current?.center || {
          lat: locationRef.current.latitude,
          lng: locationRef.current.longitude,
        },
        zoom: camera.current?.zoom || 16,
        mapId,
        colorScheme: theme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT,
        mapTypeId: typeRef.current,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: "cooperative",
      });
      map.current = current;
      campus = new google.maps.Circle({
        map: current,
        center: {
          lat: CAMPUS_REFERENCE.latitude,
          lng: CAMPUS_REFERENCE.longitude,
        },
        radius: 5,
        fillColor: "#737373",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      });
      const label = document.createElement("span");
      label.className = "wqm-boat-marker-label";
      label.textContent = "01";
      currentMarker = new AdvancedMarkerElement({
        map: locationRef.current.showBoat ? current : null,
        position: {
          lat: locationRef.current.latitude,
          lng: locationRef.current.longitude,
        },
        title: "Boat 01",
        gmpClickable: true,
      });
      currentMarker.append(label);
      marker.current = currentMarker;
      const popup = document.createElement("div");
      popup.style.color = "#171717";
      popup.style.fontSize = "12px";
      popup.textContent =
        "Boat 01 · location reference near North Campus. GPS pending.";
      popupWindow = new google.maps.InfoWindow({
        content: popup,
        ariaLabel: "Boat 01 location",
      });
      info.current = popupWindow;
      const activeMarker = currentMarker;
      const openPopup = () => {
        if (current) popupWindow?.open({ map: current, anchor: activeMarker });
      };
      activeMarker.addEventListener("gmp-click", openPopup);
      listeners.push({
        remove: () => activeMarker.removeEventListener("gmp-click", openPopup),
      });
      listeners.push(
        google.maps.event.addListenerOnce(current, "idle", () => {
          if (!disposed && !authRejected) {
            window.clearTimeout(timer);
            setError("");
            setReady(true);
          }
        }),
      );
      resize = new ResizeObserver(() => {
        if (current) google.maps.event.trigger(current, "resize");
      });
      resize.observe(container.current);
    }
    void initialize().catch(() => {
      if (!disposed) {
        window.clearTimeout(timer);
        setError("The map could not be loaded. Refresh the page to retry.");
        onUnavailable();
      }
    });
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      resize?.disconnect();
      if (current) {
        const center = current.getCenter();
        if (center)
          camera.current = {
            center: center.toJSON(),
            zoom: current.getZoom() || 16,
          };
      }
      listeners.forEach((listener) => listener.remove());
      popupWindow?.close();
      if (currentMarker) currentMarker.map = null;
      campus?.setMap(null);
      if (current) google.maps.event.clearInstanceListeners(current);
      if (map.current === current) map.current = null;
      marker.current = null;
      info.current = null;
      container.current?.replaceChildren();
      if (window.gm_authFailure === authFailure)
        window.gm_authFailure = previousAuthFailure;
    };
  }, [apiKey, mapId, theme, onUnavailable]);

  useEffect(() => {
    if (!marker.current || !map.current) return;
    marker.current.position = { lat: latitude, lng: longitude };
    marker.current.map = demo || hasGps ? map.current : null;
    const text = document.createElement("div");
    text.style.color = "#171717";
    text.style.fontSize = "12px";
    text.textContent = hasGps
      ? "Boat 01 · last received GPS fix."
      : "Boat 01 · location reference near North Campus. GPS pending.";
    info.current?.setContent(text);
  }, [latitude, longitude, demo, hasGps, ready]);

  function changeMapType(next: MapType) {
    setMapType(next);
    map.current?.setMapTypeId(next);
  }
  function recenter() {
    map.current?.panTo({ lat: latitude, lng: longitude });
    map.current?.setZoom(16);
  }
  return (
    <Panel
      id="boat-map"
      className="lg:col-span-4"
      title="Boat location"
      subtitle="IIT Mandi North Campus · Kamand Valley"
      action={
        <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
          {hasGps ? "Last GPS fix" : "GPS pending"}
        </span>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Map view
          <select
            aria-label="Google map view"
            value={mapType}
            onChange={(event) => changeMapType(event.target.value as MapType)}
            disabled={!ready || !!error}
            className="rounded-lg border border-border bg-card px-3 py-2 capitalize text-foreground"
          >
            {MAP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "roadmap"
                  ? "Normal"
                  : type[0].toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <span className="text-[11px] text-muted-foreground">
          {mapType === "satellite" || mapType === "hybrid"
            ? "Satellite imagery"
            : theme === "dark"
              ? "Dark map"
              : "Light map"}
        </span>
      </div>
      <div className="relative isolate overflow-hidden rounded-lg border border-border bg-muted">
        <div
          ref={container}
          className="relative z-0 h-80 w-full sm:h-96"
          role="region"
          aria-label="Google map near IIT Mandi North Campus"
        />
        {!ready && !error && (
          <div
            role="status"
            className="absolute inset-0 z-10 flex items-center justify-center bg-muted text-sm text-muted-foreground"
          >
            Loading map…
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="absolute inset-0 z-10 flex items-center justify-center bg-muted px-5 text-center text-sm text-muted-foreground"
          >
            {error}
          </div>
        )}
        <div className="absolute left-3 top-3 z-10 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Navigation className="size-3.5" />
            {demo || hasGps ? "Boat 01" : "Campus reference"}
          </p>
          <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
            {Math.abs(latitude).toFixed(5)}° {latitude >= 0 ? "N" : "S"},{" "}
            {Math.abs(longitude).toFixed(5)}° {longitude >= 0 ? "E" : "W"}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Recenter map"
          className="absolute right-3 top-3 z-10 size-9 rounded-lg bg-card shadow-sm"
          onClick={recenter}
          disabled={!ready || !!error}
        >
          <LocateFixed className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
        <p className="max-w-2xl leading-5">
          {hasGps && position
            ? `Last GPS fix: ${dateLabel(position.recordedAt)} IST.`
            : "North Campus location reference. GPS pending."}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-foreground underline underline-offset-4"
        >
          <MapPin className="size-3.5" />
          Open map
        </a>
      </div>
    </Panel>
  );
}
