import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, ElementContent } from "hast";

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

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeResume)
  .use(rehypeStringify);

export async function parseResumeToHtml(markdown: string): Promise<string> {
  const file = await htmlProcessor.process(markdown);
  return String(file);
}
