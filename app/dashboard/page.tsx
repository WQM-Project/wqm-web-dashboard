import Dashboard from "@/components/ui/dashboard-4";
import { getDashboardData } from "@/lib/server/dashboard";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata = { title: "WQM — Monitoring workspace" };
export default async function DashboardPage() {
  const initialTheme =
    (await cookies()).get("wqm-dashboard-theme")?.value === "dark"
      ? "dark"
      : "light";
  try {
    return (
      <Dashboard
        initialData={await getDashboardData("demo")}
        initialTheme={initialTheme}
      />
    );
  } catch {
    return <Dashboard initialData={null} initialTheme={initialTheme} />;
  }
}
