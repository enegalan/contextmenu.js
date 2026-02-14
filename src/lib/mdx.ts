import fs from "fs";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { compileMDX } from "next-mdx-remote/rsc";
import { docSlugs, exampleSlugs } from "./docs-nav";
import { mdxComponents } from "@/components/docs/mdx-components";

const contentDir = path.join(process.cwd(), "content");

export interface DocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugFromHeadingText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function getHeadingsFromMdxSource(source: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = source.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h2) {
      const text = h2[1].replace(/\{#[^}]+\}$/, "").trim();
      headings.push({ id: slugFromHeadingText(text), text, level: 2 });
    } else if (h3) {
      const text = h3[1].replace(/\{#[^}]+\}$/, "").trim();
      headings.push({ id: slugFromHeadingText(text), text, level: 3 });
    }
  }
  return headings;
}

interface HastNode {
  children?: HastNode[];
  properties?: Record<string, unknown>;
}

function getRehypePrettyCodeOptions(theme: "light" | "dark") {
  return {
    theme: theme === "dark" ? "github-dark-dimmed" : "github-light",
    onVisitLine(node: HastNode) {
      if (node.children) {
        node.children.forEach((child: HastNode) => {
          if (child.properties) {
            const props = child.properties;
            if (props.className && Array.isArray(props.className)) {
              props.className.push("line");
            }
          }
        });
      }
    },
    onVisitHighlightedLine(node: HastNode) {
      if (node.properties) {
        node.properties.className = node.properties.className ?? [];
        const classes = node.properties.className as string[];
        if (!classes.includes("line--highlighted")) {
          classes.push("line--highlighted");
        }
      }
    },
  };
}

export type DocSection = "docs" | "examples";

export async function getMdxBySlug(
  section: DocSection,
  slug: string,
  theme: "light" | "dark" = "light"
): Promise<{
  content: React.ReactElement;
  frontmatter: Record<string, unknown>;
  headings: DocHeading[];
} | null> {
  const dir = section === "docs" ? "docs" : "examples";
  const filePath = path.join(contentDir, dir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const source = fs.readFileSync(filePath, "utf-8");
  const headings = getHeadingsFromMdxSource(source);
  const rehypePrettyCodeOptions = getRehypePrettyCodeOptions(theme);
  const mdxOptions = {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions] as [typeof rehypePrettyCode, typeof rehypePrettyCodeOptions]],
  };
  const { content, frontmatter } = await compileMDX({
    source,
    options: { mdxOptions, parseFrontmatter: true } as Record<string, unknown>,
    components: mdxComponents,
  });
  return {
    content,
    frontmatter: (frontmatter ?? {}) as Record<string, unknown>,
    headings,
  };
}

export function getDocSlugs(): string[] {
  return [...docSlugs];
}

export function getExampleSlugs(): string[] {
  return [...exampleSlugs];
}

export function getMdxFilePath(section: DocSection, slug: string): string {
  return path.join(contentDir, section === "docs" ? "docs" : "examples", `${slug}.mdx`);
}
