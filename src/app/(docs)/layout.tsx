import { DocSidebar } from "@/components/site/doc-sidebar";
import { docsNavSections, examplesNavItems } from "@/lib/docs-nav";

const examplesSection = {
  title: "Examples",
  items: examplesNavItems,
};

const allSections = [...docsNavSections, examplesSection];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <DocSidebar
        sections={[...docsNavSections, examplesSection]}
        className="lg:block"
      />
      <main className="min-h-0 flex-1 overflow-auto py-6 pl-4 pr-6 lg:pl-8">
        <div className="mx-auto min-h-0">{children}</div>
      </main>
    </div>
  );
}
