"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { Button } from "@/components/ui/button";
import { Panel } from "./shared";
import {
  CAMPUS_REFERENCE,
  DEMO_BOAT_LOCATION,
  validPosition,
} from "@/lib/map-config";
import type { BoatPosition } from "@/lib/map-config";
import { dateLabel } from "@/lib/dashboard";

export function LeafletBoatMap({
  demo,
  position,
}: {
  demo: boolean;
  position?: BoatPosition;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [tileError, setTileError] = useState(false);
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
  const mode = hasGps ? "Last GPS fix" : "GPS pending";

  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    let current: LeafletMap | undefined;
    setReady(false);
    setError("");
    setTileError(false);
    void import("leaflet")
      .then((L) => {
        if (disposed || !element.current) return;
        current = L.map(element.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView([latitude, longitude], 16);
        map.current = current;
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(current);
        tiles.on("tileerror", () => {
          if (!disposed) setTileError(true);
        });
        tiles.on("load", () => {
          if (!disposed) setReady(true);
        });
        const campus = L.circleMarker(
          [CAMPUS_REFERENCE.latitude, CAMPUS_REFERENCE.longitude],
          {
            radius: 5,
            color: "var(--muted-foreground)",
            fillColor: "var(--card)",
            fillOpacity: 1,
            weight: 2,
          },
        ).addTo(current);
        campus.bindPopup("IIT Mandi North Campus · approximate reference");
        if (demo || hasGps) {
          const boat = L.marker([latitude, longitude], {
            title: demo
              ? "Boat 01 — location reference"
              : "Boat 01 — last received GPS fix",
            icon: L.divIcon({
              className: "wqm-boat-marker",
              html: '<span class="wqm-boat-marker-label">01</span>',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
          }).addTo(current);
          const popup = document.createElement("div");
          popup.textContent = demo
            ? "Boat 01 · location reference near North Campus. GPS pending."
            : "Boat 01 · last received GPS location.";
          boat.bindPopup(popup);
          L.circle([latitude, longitude], {
            radius: 35,
            color: "var(--wqm-chart-line)",
            fillColor: "var(--wqm-chart-line)",
            fillOpacity: 0.05,
            weight: 1,
            dashArray: "4 4",
          })
            .addTo(current)
            .bindTooltip("Illustrative marker highlight; not GPS accuracy");
        }
        resize = new ResizeObserver(() =>
          current?.invalidateSize({ pan: false }),
        );
        resize.observe(element.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed)
          setError("The map could not be loaded. Refresh the page to retry.");
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      current?.remove();
      if (map.current === current) map.current = null;
    };
  }, [demo, hasGps, latitude, longitude]);

  function recenter() {
    map.current?.setView([latitude, longitude], 16);
  }
  const mapLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
  return (
    <Panel
      id="boat-map"
      className="lg:col-span-4"
      title="Boat location"
      subtitle="IIT Mandi North Campus · Kamand Valley"
      action={
        <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
          {mode}
        </span>
      }
    >
      <div className="relative isolate overflow-hidden rounded-lg border border-border bg-muted">
        <div
          ref={element}
          className="relative z-0 h-80 w-full sm:h-96"
          role="region"
          aria-label="Interactive map near IIT Mandi North Campus"
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
            className="absolute inset-0 z-10 flex items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground"
          >
            {error}
          </div>
        )}
        <div className="absolute bottom-7 left-3 z-10 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Navigation className="size-3.5" />
            {demo ? "Boat 01" : hasGps ? "Boat 01 · GPS" : "Campus reference"}
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
          disabled={!ready}
        >
          <LocateFixed className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-xs text-muted-foreground">
        <p className="max-w-2xl leading-5">
          {demo
            ? "North Campus location reference."
            : hasGps
              ? `Last GPS fix: ${dateLabel(position.recordedAt)} IST. This does not indicate a live connection.`
              : "The gateway packet has no GPS fields yet. Only the campus reference is shown; no real boat location is claimed."}
        </p>
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 whitespace-nowrap rounded px-1 py-1 text-foreground underline underline-offset-4"
        >
          <MapPin className="size-3.5" />
          Open map
        </a>
      </div>
      {tileError && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Some map tiles could not load. Check your connection; the reference
          coordinates remain available.
        </p>
      )}
    </Panel>
  );
}
