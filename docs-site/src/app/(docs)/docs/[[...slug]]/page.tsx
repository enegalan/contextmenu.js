import { redirect } from "next/navigation";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = slug?.join("/") ?? "";
  if (!path) {
    redirect("/docs/introduction");
  }
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p>Doc: {path}</p>
    </div>
  );
}
