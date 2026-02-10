import { NextRequest } from "next/server";
import { EXAMPLES_PRESETS } from "@/lib/examples-presets";
import { EXAMPLES_IFRAME_STYLES } from "@/lib/examples-iframe-styles";

const DEFAULT_PRESET = "basic";

export async function GET(request: NextRequest) {
  const preset = request.nextUrl.searchParams.get("preset") ?? DEFAULT_PRESET;
  const theme = request.nextUrl.searchParams.get("theme") ?? "light";
  const data = EXAMPLES_PRESETS[preset] ?? EXAMPLES_PRESETS[DEFAULT_PRESET];
  let html = data.files["/index.html"];

  const scriptUrl = `/api/examples-script?preset=${encodeURIComponent(preset)}`;
  html = html.replace(
    /<script\s+type="module"\s+src="[^"]*"><\/script>/,
    `<script type="module" src="${scriptUrl}"><\/script>`
  );

  html = html.replace(
    /<html>/,
    theme === "dark" ? "<html class=\"dark\">" : "<html>"
  );

  html = html.replace(
    /<head>/,
    "<head><style>" + EXAMPLES_IFRAME_STYLES.trim() + "</style>"
  );

  html = html.replace(
    /<div id="target" style="[^"]*">/g,
    "<div id=\"target\">"
  );
  html = html.replace(
    /<button id="open-btn" style="[^"]*">/g,
    "<button id=\"open-btn\" type=\"button\">"
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
