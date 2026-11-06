import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface Cell {
  text: string;
  x: number;
  w: number;
  align?: "left" | "right";
  bold?: boolean;
}

export const PAGE = { w: 595.28, h: 841.89, margin: 48 };

/** Standard fonts only cover WinAnsi; anything else becomes "?" instead of throwing. */
const clean = (s: string) => s.replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "?");

function wrap(s: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of clean(s).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Tiny top-down text layout on A4 with wrapping, columns and automatic page breaks. */
export async function createPdf() {
  const pdf = await PDFDocument.create();
  const fonts = {
    reg: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  let page = pdf.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - PAGE.margin;
  const inner = PAGE.w - 2 * PAGE.margin;

  const api = {
    inner,
    gap(n = 8) {
      y -= n;
    },
    /** Draws cells side by side on the same baseline; row height = tallest cell. */
    row(cells: Cell[], size = 10) {
      const lh = size * 1.35;
      const laid = cells.map((c) => ({ c, lines: wrap(c.text, c.bold ? fonts.bold : fonts.reg, size, c.w) }));
      const h = Math.max(...laid.map((l) => l.lines.length)) * lh;
      if (y - h < PAGE.margin) {
        page = pdf.addPage([PAGE.w, PAGE.h]);
        y = PAGE.h - PAGE.margin;
      }
      for (const { c, lines } of laid) {
        const font = c.bold ? fonts.bold : fonts.reg;
        lines.forEach((line, i) => {
          const tw = font.widthOfTextAtSize(line, size);
          page.drawText(line, {
            x: c.align === "right" ? c.x + c.w - tw : c.x,
            y: y - size - i * lh,
            size,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        });
      }
      y -= h;
    },
    text(text: string, o: { size?: number; bold?: boolean; align?: "left" | "right" } = {}) {
      api.row([{ text, x: PAGE.margin, w: inner, ...o }], o.size);
    },
    rule() {
      y -= 4;
      page.drawLine({
        start: { x: PAGE.margin, y },
        end: { x: PAGE.w - PAGE.margin, y },
        thickness: 0.7,
        color: rgb(0.6, 0.6, 0.6),
      });
      y -= 6;
    },
    save: () => pdf.save(),
  };
  return api;
}

export function downloadPdf(bytes: Uint8Array, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
