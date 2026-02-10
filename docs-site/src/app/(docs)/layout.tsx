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
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <DocSidebar
          sections={[...docsNavSections, examplesSection]}
          className="lg:block"
        />
        <main className="flex-1 overflow-auto py-6 pl-4 pr-6 lg:pl-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
