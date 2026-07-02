import { jsonData } from "@/core/http/responses";
import {
  listLocalLive2DPackages,
  validateLive2DPackage,
} from "@/services/avatar-runtime/live2d-manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const packages = listLocalLive2DPackages().map((packageId) =>
    validateLive2DPackage({ packageId }),
  );

  return jsonData({
    packages,
  });
}
