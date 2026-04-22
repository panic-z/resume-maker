import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, ElementContent, RootContent, Properties } from "hast";

function rehypeResume() {
  return (tree: Root) => {
    const newChildren: ElementContent[] = [];
    let currentSection: ElementContent[] | null = null;

    for (const node of tree.children) {
      if (node.type !== "element") {
        if (currentSection) {
          currentSection.push(node as ElementContent);
        } else {
          newChildren.push(node as ElementContent);
        }
        continue;
      }

      const el = node as Element;

      if (el.tagName === "h1") {
        el.properties = { ...el.properties, className: "resume-name" };
        if (currentSection) {
          newChildren.push(wrapSection(currentSection));
          currentSection = null;
        }
        newChildren.push(el);
      } else if (el.tagName === "blockquote") {
        el.properties = { ...el.properties, className: "resume-contact" };
        if (currentSection) {
          newChildren.push(wrapSection(currentSection));
          currentSection = null;
        }
        newChildren.push(el);
      } else if (el.tagName === "h2") {
        if (currentSection) {
          newChildren.push(wrapSection(currentSection));
        }
        el.properties = { ...el.properties, className: "resume-section-title" };
        currentSection = [el];
      } else if (el.tagName === "h3") {
        el.properties = { ...el.properties, className: "resume-entry-title" };
        if (currentSection) {
          currentSection.push(el);
        } else {
          newChildren.push(el);
        }
      } else {
        if (currentSection) {
          currentSection.push(el);
        } else {
          newChildren.push(el);
        }
      }
    }

    if (currentSection) {
      newChildren.push(wrapSection(currentSection));
    }

    tree.children = newChildren;
  };
}

function wrapSection(children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: "resume-section" },
    children,
  };
}

function sanitizeUrl(value: Properties[string]): Properties[string] {
  if (typeof value !== "string") return value;

  let normalized = "";
  for (const char of value.trim()) {
    const code = char.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f) continue;
    normalized += char;
  }
  normalized = normalized.toLowerCase();
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:")
  ) {
    return "#";
  }

  return value;
}

function isExternalHttpUrl(value: Properties[string]): value is string {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value);
}

function sanitizeElementTree(node: RootContent | ElementContent): void {
  if (node.type !== "element") return;

  if (node.properties) {
    if ("href" in node.properties) {
      node.properties.href = sanitizeUrl(node.properties.href);
      if (isExternalHttpUrl(node.properties.href)) {
        node.properties.target = "_blank";
        node.properties.rel = "noreferrer noopener";
      }
    }
    if ("src" in node.properties) {
      node.properties.src = sanitizeUrl(node.properties.src);
    }
  }

  for (const child of node.children) {
    sanitizeElementTree(child);
  }
}

function rehypeSanitizeResumeUrls() {
  return (tree: Root) => {
    for (const child of tree.children) {
      sanitizeElementTree(child);
    }
  };
}

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeResume)
  .use(rehypeSanitizeResumeUrls)
  .use(rehypeStringify);

export async function parseResumeToHtml(markdown: string): Promise<string> {
  const file = await htmlProcessor.process(markdown);
  return String(file);
}
