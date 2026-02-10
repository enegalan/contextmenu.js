import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getMdxBySlug } from "@/lib/mdx";
import { OnThisPage, OnThisPageMobile } from "@/components/site/on-this-page";

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

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const shikiTheme = themeCookie === "dark" ? "dark" : "light";
  const result = await getMdxBySlug("examples", path, shikiTheme);
  if (!result) {
    notFound();
  }
  const { content, headings } = result;
  return (
    <div className="flex min-h-0 w-full flex-col gap-8 lg:flex-row">
      <OnThisPageMobile headings={headings} className="order-1 shrink-0 lg:hidden" />
      <article className="order-2 min-w-0 flex-1 prose dark:prose-invert prose-neutral max-w-none lg:order-1">
        {content}
      </article>
      <OnThisPage headings={headings} className="order-3 hidden shrink-0 lg:order-2 lg:block" />
    </div>
  );
}
