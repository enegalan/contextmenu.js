import fs from "fs";
import path from "path";
import { docSlugs, exampleSlugs } from "./docs-nav";

const contentDir = path.join(process.cwd(), "content");

export interface SearchEntry {
  title: string;
  href: string;
  section: "docs" | "examples";
}

function extractTitleFromMdx(filePath: string): string {
  const raw = fs.readFileSync(filePath, "utf-8");
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return path.basename(filePath, ".mdx");
  const front = match[1];
  const titleMatch = front.match(/title:\s*["']?([^"'\n]+)["']?/);
  return titleMatch ? titleMatch[1].trim() : path.basename(filePath, ".mdx");
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const slug of docSlugs) {
    const filePath = path.join(contentDir, "docs", `${slug}.mdx`);
    const title = fs.existsSync(filePath)
      ? extractTitleFromMdx(filePath)
      : slugToTitle(slug);
    entries.push({ title, href: `/docs/${slug}`, section: "docs" });
  }

  for (const slug of exampleSlugs) {
    const filePath = path.join(contentDir, "examples", `${slug}.mdx`);
    const title = fs.existsSync(filePath)
      ? extractTitleFromMdx(filePath)
      : slugToTitle(slug);
    entries.push({ title, href: `/examples/${slug}`, section: "examples" });
  }

  return entries;
}
