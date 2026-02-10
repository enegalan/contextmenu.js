import { NextRequest } from "next/server";
import { EXAMPLES_PRESETS, rewritePresetScriptForCDN } from "@/lib/examples-presets";

const DEFAULT_PRESET = "basic";

export async function GET(request: NextRequest) {
  const preset = request.nextUrl.searchParams.get("preset") ?? DEFAULT_PRESET;
  const data = EXAMPLES_PRESETS[preset] ?? EXAMPLES_PRESETS[DEFAULT_PRESET];
  const js = data.files["/index.js"];
  const rewritten = rewritePresetScriptForCDN(js);
  return new Response(rewritten, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
