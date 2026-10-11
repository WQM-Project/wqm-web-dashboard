# Google Maps setup for WQM

The Google map component is prepared with Normal, Satellite, Terrain and Hybrid
views, a single boat marker, recentering and native light/dark roadmap/terrain
palettes. Prototype mode needs only a no-billing Maps Demo Key and automatically
uses Google's `DEMO_MAP_ID` for Advanced Markers. Until a key is set,
the existing Leaflet map remains active. On 12 October 2026, the user's supplied
key was configured locally in prototype mode and Google rendering was verified:
Normal, Satellite, Terrain, Hybrid, light/dark roadmap, popup and recenter controls.
The key is in ignored `.env.local`; its exact Cloud quota and billing status were
not inspected. Local prototype mode does not itself change Google's billing settings.

## No-billing prototype / college showcase

Use this path while evaluating and presenting the prototype, not for production.

1. Open [Maps Demo Key](https://developers.google.com/maps/demo-key) and click
   **Get a Demo Key** while signed into your Google account.
2. Read and accept the terms yourself, then copy the generated key. Do not attach
   a billing account or upgrade the project for this zero-budget workflow.
3. Add the key to the ignored dashboard `.env.local`:

   ```dotenv
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_NO_BILLING_KEY
   NEXT_PUBLIC_GOOGLE_MAPS_MODE=prototype
   ```

   Leave `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` empty for Google's testing map ID.
4. Restart Next.js and verify the Google views, themes, markers and quota before
   the presentation. The prototype key supports satellite/terrain, markers and
   styling. It pauses at its daily limit without charges while no billing is attached.

Google's [Cloud Run codelab](https://codelabs.developers.google.com/codelabs/cloud-run/build-with-google-maps-platform-and-ai)
describes **up to 100 requests per day per API**. The main key documentation
says limits may change, so the actual key/project quota is authoritative.
Map reloads and native-theme changes can create map loads; sensor values are
not equivalent to map requests. Save quota by avoiding unnecessary reloads.
The dashboard switches to Leaflet if Google reports an authentication failure,
its SDK fails, or the map does not load within 20 seconds. A small provider
message identifies the alternative map. Actual Google operation and the key's
quota still need to be checked before the showcase.

## Standard production setup (future, requires billing)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or
   select a WQM project. Use a separate project from unrelated applications.
2. Link a billing account for a standard Maps Platform key. Review the current
   [Maps setup and billing requirements](https://developers.google.com/maps/documentation/javascript/get-api-key).
   The user completes billing/account setup; no billing changes are made by the code.
3. In **APIs & Services → Library**, enable **Maps JavaScript API**.
4. In **APIs & Services → Credentials**, create an **API key** named
   `WQM dashboard browser`. Edit it immediately:
   - Application restrictions: **Websites / HTTP referrers**.
   - Allowed websites for local development:
     `http://localhost:3000/*` and `http://127.0.0.1:3000/*`.
   - API restrictions: **Restrict key → Maps JavaScript API** only.
   - Add the exact deployed dashboard domain when deploying. Do not use a
     wildcard for all websites. This browser key is visible to users by design;
     website and API restrictions are what protect its intended usage.
5. In **Google Maps Platform → Map Management**, create a map ID named
   `WQM boat map`, with **JavaScript → Vector** as its type. Copy its map ID.
   Keep the map ID and key in the same Cloud project.
6. Add these values to the existing ignored `.env.local` in the dashboard repo:

   ```dotenv
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_BROWSER_KEY
   NEXT_PUBLIC_GOOGLE_MAPS_MODE=production
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=YOUR_JAVASCRIPT_MAP_ID
   ```

7. Restart the existing Next.js development server, then open `/dashboard`.
   Verify Normal/Satellite/Terrain/Hybrid selection, light/dark themes, marker
   popup and recentering. Confirm Maps API key/billing errors are absent.

Map styling can later be edited in **Map Styles** and associated with the map
ID. Native light/dark palettes apply to roadmap and terrain; satellite imagery
retains its photographic appearance. Satellite pictures are not live GPS or
live camera imagery. Boat position still needs actual GPS packets.

Google's `colorScheme` is immutable after map creation. The component rebuilds
the map when the dashboard theme changes and preserves its camera and view;
ordinary GPS marker updates and map-type changes reuse the map. Map loads use
the project's Maps Platform quota/billing. Configure suitable usage controls
for the project before publishing.

The integration does not change the database or gateway packet schema, and
never uses database passwords or Supabase keys for Google Maps.

References:
- [Key restrictions](https://developers.google.com/maps/api-security-best-practices)
- [Create a map ID](https://developers.google.com/maps/documentation/javascript/map-ids/get-map-id)
- [Native map colours](https://developers.google.com/maps/documentation/javascript/mapcolorscheme)
- [Official JavaScript loader](https://github.com/googlemaps/js-api-loader)
