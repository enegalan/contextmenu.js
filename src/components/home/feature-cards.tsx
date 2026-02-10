import { Zap, Palette, Accessibility } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Smooth",
    description: "Subtle enter/leave animations (fade or slide) with configurable duration and easing.",
  },
  {
    icon: Palette,
    title: "Customizable",
    description: "Theming via CSS variables or tokens, custom renderers, submenu arrows, and platform-aware shortcuts.",
  },
  {
    icon: Accessibility,
    title: "Accessible",
    description: "ARIA roles, full keyboard navigation, and focus management. Screen-reader friendly.",
  },
];

export function FeatureCards() {
  return (
    <section className="border-b border-border/40 px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Why contextmenu.js
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
