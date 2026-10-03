import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

function inlineRuns(text: string): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p) =>
    p.startsWith("**") && p.endsWith("**")
      ? new TextRun({ text: p.slice(2, -2), bold: true })
      : new TextRun(p),
  );
}

/** Converts the layout-aware markdown from pdf-to-markdown.ts into a .docx file. */
export async function markdownToDocxBlob(markdown: string): Promise<Blob> {
  const lines = markdown.split("\n").filter((l) => !/^<!--.*-->$/.test(l.trim()));
  const children: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        block.push(lines[i]);
        i++;
      }
      const rows = block
        .filter((l) => !/^\|[\s-:|]+\|$/.test(l.trim()))
        .map((l) =>
          l
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim()),
        );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map(
            (r) =>
              new TableRow({
                children: r.map(
                  (c) => new TableCell({ children: [new Paragraph({ children: inlineRuns(c) })] }),
                ),
              }),
          ),
        }),
      );
      children.push(new Paragraph(""));
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)/);
    if (heading) {
      const level =
        heading[1].length === 1
          ? HeadingLevel.HEADING_1
          : heading[1].length === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;
      children.push(new Paragraph({ heading: level, children: inlineRuns(heading[2]) }));
      i++;
      continue;
    }

    const bullet = line.match(/^-\s+(.*)/);
    if (bullet) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: inlineRuns(bullet[1]) }));
      i++;
      continue;
    }

    children.push(new Paragraph({ children: inlineRuns(line) }));
    i++;
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
