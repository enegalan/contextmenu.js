export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNavSections: NavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Basic usage", href: "/docs/basic-usage" },
    ],
  },
  {
    title: "API",
    items: [{ title: "API reference", href: "/docs/api-reference" }],
  },
  {
    title: "Customization",
    items: [
      { title: "Configuration", href: "/docs/configuration" },
      { title: "Animations", href: "/docs/animations" },
      { title: "Theming", href: "/docs/theming" },
    ],
  },
  {
    title: "Accessibility",
    items: [{ title: "Accessibility", href: "/docs/accessibility" }],
  },
];

export const examplesNavItems: NavItem[] = [
  { title: "Basic menu", href: "/examples/basic-menu" },
  { title: "Nested menus", href: "/examples/nested-menus" },
  { title: "Custom renderers", href: "/examples/custom-renderers" },
  { title: "Programmatic control", href: "/examples/programmatic-control" },
];

export const docSlugs = [
  "introduction",
  "installation",
  "basic-usage",
  "api-reference",
  "configuration",
  "animations",
  "theming",
  "accessibility",
] as const;

export const exampleSlugs = [
  "basic-menu",
  "nested-menus",
  "custom-renderers",
  "programmatic-control",
] as const;
