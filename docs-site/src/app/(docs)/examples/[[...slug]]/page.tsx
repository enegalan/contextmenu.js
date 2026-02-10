import { redirect } from "next/navigation";

export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = slug?.join("/") ?? "";
  if (!path) {
    redirect("/examples/basic-menu");
  }
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p>Example: {path}</p>
    </div>
  );
}
