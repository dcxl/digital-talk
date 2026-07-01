import { jsonData, jsonError } from "@/core/http/responses";
import { getDashboardSummary } from "@/services/dashboard/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return jsonData(summary);
  } catch (error) {
    return jsonError(
      {
        code: "dashboard_summary_error",
        message:
          error instanceof Error ? error.message : "Failed to load dashboard summary",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
