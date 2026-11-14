import ReactMarkdown, { type Components } from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import katex from "katex";
import { fromHtml } from "hast-util-from-html";

/**
 * Models mix several math conventions (and sometimes escape the delimiters).
 * Normalise everything to one canonical $...$ form before remark parses it.
 */
export function normalizeAiMarkdown(content: string): string {
  if (!content) return "";
  let text = content.replace(/\r\n?/g, "\n");

  // "\\times" / "\\( ... \\)" (double-escaped by the model) -> "\times" / "\( ... \)"
  text = text.replace(/\\\\+(?=[A-Za-z()\[\]{}])/g, "\\");
  // Escaped dollar signs that were meant as math delimiters.
  text = text.replace(/\\\$/g, "$");
  // \( ... \) -> $ ... $, \[ ... \] -> $$ ... $$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, body: string) => `$${body.trim()}$`);
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, body: string) => `\n$$\n${body.trim()}\n$$\n`);
  // Backticks around a formula render as literal code; unwrap them.
  text = text.replace(/`(\${1,2}[\s\S]*?\$)`/g, "$1");

  // Models stack "$$...$$" on consecutive lines; without blank lines remark
  // folds them into one paragraph and they render as inline math.
  text = text.replace(/(^|\n)[ \t]*\$\$([^\n$]+?)\$\$[ \t]*(?=\n|$)/g, (_match, lead: string, body: string) => {
    return `${lead}\n$$\n${body.trim()}\n$$\n`;
  });

  // Any doubled backslash left inside a math block (e.g. \\approx) breaks KaTeX.
  text = text.replace(/(\${1,2})([\s\S]*?)\1/g, (_whole: string, delimiter: string, body: string) => {
    const fixed = body.replace(/\\\\+(?=[A-Za-z])/g, "\\");
    return `${delimiter}${fixed}${delimiter}`;
  });

  return text;
}

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
  properties?: Record<string, unknown>;
};

const INLINE_OR_BLOCK_MATH = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
// Only treat leftover text as math when the body actually looks like a formula,
// so prices such as "20.000.000$ ... $8$" are left untouched.
const MATH_LIKE = /[\\^_={}]|^\s*\d+([.,]\d+)?\s*$/;

function renderMath(expression: string, displayMode: boolean): HastNode[] | null {
  const trimmed = expression.trim();
  if (!trimmed || !MATH_LIKE.test(trimmed)) return null;
  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: "html",
    });
    return fromHtml(html).children as HastNode[];
  } catch {
    return null;
  }
}

function convertTextNode(node: HastNode): HastNode[] | null {
  const value = node.value || "";
  if (!value.includes("$")) return null;

  const parts: HastNode[] = [];
  let lastIndex = 0;
  let changed = false;
  INLINE_OR_BLOCK_MATH.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_OR_BLOCK_MATH.exec(value))) {
    const display = match[1] !== undefined;
    const body = display ? match[1] : match[2];
    const rendered = renderMath(body, display);
    if (!rendered) continue;
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }
    if (display) parts.push({ type: "element", tagName: "span", properties: { className: ["math-display"] }, children: rendered });
    else parts.push(...rendered);
    lastIndex = match.index + match[0].length;
    changed = true;
  }
  if (!changed) return null;
  if (lastIndex < value.length) parts.push({ type: "text", value: value.slice(lastIndex) });
  return parts;
}

function rehypeMathFallback() {
  return (tree: HastNode) => {
    const walk = (parent: HastNode) => {
      if (!Array.isArray(parent.children)) return;
      const next: HastNode[] = [];
      for (const child of parent.children) {
        if (
          child.type === "text" &&
          !(parent.type === "element" && (parent.tagName === "code" || parent.tagName === "pre"))
        ) {
          const converted = convertTextNode(child);
          if (converted) {
            next.push(...converted);
            continue;
          }
        }
        walk(child);
        next.push(child);
      }
      parent.children = next;
    };
    walk(tree);
  };
}

export function AiMarkdown({
  content,
  components,
}: {
  content: string;
  components?: Components;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        [rehypeKatex, { throwOnError: false, strict: false }],
        rehypeMathFallback,
      ]}
      components={components}
    >
      {normalizeAiMarkdown(content)}
    </ReactMarkdown>
  );
}
