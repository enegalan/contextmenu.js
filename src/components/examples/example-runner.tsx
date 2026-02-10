"use client";

import { ExamplesPreviewBlock } from "@/components/examples/examples-tabbed";
import { EXAMPLES_MENU_CONFIGS } from "@/lib/examples-menu-configs";

const DOC_PRESET_TO_EXAMPLES: Record<string, string> = {
  "basic-menu": "basic",
  "nested-menus": "nested",
  "custom-renderers": "custom",
  "programmatic-control": "programmatic",
};

export function ExampleRunner({
  preset,
  code: codeProp,
}: {
  preset: string;
  code?: string;
}) {
  const examplesPreset = DOC_PRESET_TO_EXAMPLES[preset] ?? preset;
  const config = EXAMPLES_MENU_CONFIGS[examplesPreset];
  const code = codeProp ?? config?.code ?? "";

  if (!config) {
    return (
      <div className="my-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        No demo preset for &quot;{preset}&quot;.
      </div>
    );
  }

  return (
    <div className="my-8">
      <ExamplesPreviewBlock
        label={config.label}
        description={config.description}
        preset={examplesPreset}
        code={code}
        compact
      />
    </div>
  );
}
