/** Converts the DOM of a contentEditable editor into Markdown. Browser-only. */

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/ /g, " ").replace(/([\\`*_[\]])/g, "\\$1");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const kids = () => Array.from(el.childNodes).map(inline).join("");
  switch (el.tagName) {
    case "B":
    case "STRONG":
      return wrap(kids(), "**");
    case "I":
    case "EM":
      return wrap(kids(), "*");
    case "S":
    case "STRIKE":
    case "DEL":
      return wrap(kids(), "~~");
    case "CODE":
      return "`" + (el.textContent ?? "") + "`";
    case "A":
      return `[${kids()}](${el.getAttribute("href") ?? ""})`;
    case "BR":
      return "\n";
    case "IMG":
      return `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})`;
    default:
      return kids();
  }
}

// Keeps the markers outside surrounding whitespace, otherwise "** x **" isn't bold.
function wrap(s: string, m: string) {
  const [, lead, body, trail] = s.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  return body ? lead + m + body + m + trail : s;
}

function list(el: HTMLElement, depth: number): string {
  const ordered = el.tagName === "OL";
  let n = 0;
  return Array.from(el.children)
    .filter((li) => li.tagName === "LI")
    .map((li) => {
      const text: string[] = [];
      const nested: string[] = [];
      li.childNodes.forEach((c) => {
        const tag = (c as HTMLElement).tagName;
        if (tag === "UL" || tag === "OL") nested.push(list(c as HTMLElement, depth + 1));
        else text.push(inline(c));
      });
      const bullet = ordered ? `${++n}.` : "-";
      const line = "  ".repeat(depth) + `${bullet} ${text.join("").trim()}`;
      return [line, ...nested].join("\n");
    })
    .join("\n");
}

function block(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return inline(node).trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const text = () => Array.from(el.childNodes).map(inline).join("").trim();
  const h = el.tagName.match(/^H([1-6])$/);
  if (h) return `${"#".repeat(+h[1])} ${text()}`;
  switch (el.tagName) {
    case "UL":
    case "OL":
      return list(el, 0);
    case "BLOCKQUOTE":
      return Array.from(el.childNodes)
        .map(block)
        .filter(Boolean)
        .join("\n\n")
        .split("\n")
        .map((l) => `> ${l}`.trimEnd())
        .join("\n");
    case "PRE":
      return "```\n" + (el.textContent ?? "").replace(/\n$/, "") + "\n```";
    case "HR":
      return "---";
    case "DIV":
    case "P":
      // Nested blocks (browsers wrap lines in <div>) are flattened recursively.
      if (Array.from(el.children).some((c) => /^(DIV|P|UL|OL|H[1-6]|BLOCKQUOTE|PRE|HR)$/.test(c.tagName))) {
        return Array.from(el.childNodes).map(block).filter(Boolean).join("\n\n");
      }
      return text();
    default:
      return text();
  }
}

export function htmlToMarkdown(root: HTMLElement): string {
  return Array.from(root.childNodes).map(block).filter(Boolean).join("\n\n");
}
