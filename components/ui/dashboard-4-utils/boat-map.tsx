"use client";
import { useCallback, useState } from "react";
import type { BoatPosition } from "@/lib/map-config";
import { GoogleBoatMap } from "./google-boat-map";
import { LeafletBoatMap } from "./leaflet-boat-map";
export function BoatMap({
  demo,
  position,
  theme,
}: {
  demo: boolean;
  position?: BoatPosition;
  theme: "light" | "dark";
}) {
  const [fallback, setFallback] = useState(false);
  const handleUnavailable = useCallback(() => setFallback(true), []);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const prototype = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MODE !== "production";
  const mapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ||
    (prototype ? "DEMO_MAP_ID" : undefined);
  if (key && mapId && !fallback)
    return (
      <GoogleBoatMap
        demo={demo}
        position={position}
        theme={theme}
        apiKey={key}
        mapId={mapId}
        onUnavailable={handleUnavailable}
      />
    );
  return (
    <>
      <LeafletBoatMap demo={demo} position={position} />
      {fallback && (
        <p
          role="status"
          className="lg:col-span-4 text-xs text-muted-foreground"
        >
          Google Maps is unavailable; the alternative map is active.
        </p>
      )}
    </>
  );
}
