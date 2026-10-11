import { getDashboardData } from "@/lib/server/dashboard";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("source") || "demo";
  if (source !== "demo" && source !== "gateway")
    return Response.json({ error: "invalid_source" }, { status: 400 });
  try {
    return Response.json(await getDashboardData(source), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Readings could not be loaded. Try refreshing." },
      { status: 503 },
    );
  }
}
