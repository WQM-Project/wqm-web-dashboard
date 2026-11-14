import { cookies } from "next/headers";

import { DashboardLogo } from "@/components/ui/dashboard-4-utils/dashboard-logo";
import { cn } from "@/lib/utils";

// Shown the instant someone opens the dashboard, while the server fetches the
// readings. Matches the workspace theme so there is no flash on arrival.
export default async function DashboardLoading() {
  const dark = (await cookies()).get("wqm-theme")?.value === "dark";
  return (
    <div
      className={cn(
        "wqm-workspace grid min-h-dvh place-items-center bg-background text-foreground",
        dark && "wqm-dark",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="wqm-loading-bar" aria-hidden="true" />
      <div className="flex flex-col items-center gap-4">
        <DashboardLogo theme={dark ? "dark" : "light"} size={56} decorative className="wqm-loading-logo" />
        <div className="wqm-loading-track" aria-hidden="true">
          <span />
        </div>
        <p className="text-sm text-muted-foreground">Loading the latest readings…</p>
      </div>
    </div>
  );
}
