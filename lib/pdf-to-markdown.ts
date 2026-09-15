import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

interface Cell {
  x: number;
  end: number;
  text: string;
}

interface Line {
  y: number;
  size: number;
  bold: boolean;
  text: string;
  cells: Cell[];
}

/** Merges cluster-adjacent x positions (within `tolerance`) into averaged centers, sorted left to right. */
function clusterPositions(xs: number[], tolerance: number): number[] {
  const sorted = [...xs].sort((a, b) => a - b);
  const clusters: { sum: number; count: number }[] = [];
  for (const x of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && x - last.sum / last.count <= tolerance) {
      last.sum += x;
      last.count += 1;
    } else {
      clusters.push({ sum: x, count: 1 });
    }
  }
  return clusters.map((c) => c.sum / c.count);
}

function nearestColumn(x: number, columns: number[]): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  columns.forEach((cx, idx) => {
    const dist = Math.abs(cx - x);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

/**
 * Renders a run of lines as a markdown table, or returns null if it doesn't
 * actually look tabular (fewer than 2 anchor rows, or the anchors' cell
 * start positions don't line up into 2+ stable columns). `isAnchor` marks
 * which lines are full table rows vs. wrapped-cell continuation lines (see
 * `isContinuationCandidate`) - a continuation is folded into whichever
 * column of the previous anchor row it lines up under, instead of becoming
 * its own row.
 */
function renderTableBlock(run: Line[], isAnchor: boolean[]): string[] | null {
  const anchors = run.filter((_, idx) => isAnchor[idx]);
  if (anchors.length < 2) return null;

  const tolerance = Math.max(...anchors.map((l) => l.size)) * 1.2;
  const allX = anchors.flatMap((l) => l.cells.map((c) => c.x));
  const columns = clusterPositions(allX, tolerance);
  if (columns.length < 2) return null;

  const escape = (s: string) => s.replace(/\|/g, "\\|").trim();
  const grid: string[][] = [];
  run.forEach((line, idx) => {
    const target = isAnchor[idx] ? new Array<string>(columns.length).fill("") : grid[grid.length - 1];
    if (!target) return; // a run always starts on an anchor, so this can't happen
    for (const cell of line.cells) {
      const colIdx = nearestColumn(cell.x, columns);
      target[colIdx] = target[colIdx] ? `${target[colIdx]} ${cell.text}` : cell.text;
    }
    if (isAnchor[idx]) grid.push(target);
  });

  const rows = [
    `| ${grid[0].map(escape).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...grid.slice(1).map((row) => `| ${row.map(escape).join(" | ")} |`),
  ];
  return rows;
}

/**
 * A single-cell line counts as a wrapped continuation of the row above (not
 * a new paragraph) when its cell sits well right of that row's first
 * column - which is exactly what an overflowing non-first cell looks like.
 */
function isContinuationCandidate(line: Line, column0X: number, tolerance: number): boolean {
  return line.cells.length === 1 && line.cells[0].x > column0X + tolerance;
}

/**
 * Groups a page's raw text runs into visual lines (bucketed by baseline y),
 * then classifies each line as a table row/heading/bullet/bold run using
 * relative x-gaps and font size - pdf.js exposes no structural info, so
 * position and size are the only signals available. Table detection is a
 * best-effort heuristic: it can miss merged cells or misread tables with
 * inconsistent column spacing.
 */
async function extractPageMarkdown(page: PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  const rows = new Map<
    number,
    { x: number; end: number; str: string; size: number; bold: boolean }[]
  >();

  for (const raw of content.items) {
    if (!("str" in raw) || !raw.str.trim()) continue;
    const size = Math.hypot(raw.transform[2], raw.transform[3]);
    const y = Math.round(raw.transform[5] / 2) * 2; // bucket nearby baselines into one line
    const arr = rows.get(y) ?? [];
    arr.push({
      x: raw.transform[4],
      end: raw.transform[4] + (raw.width ?? 0),
      str: raw.str,
      size,
      bold: /bold/i.test(raw.fontName ?? ""),
    });
    rows.set(y, arr);
  }

  const lines: Line[] = [...rows.entries()]
    .sort(([a], [b]) => b - a) // pdf y-axis grows upward, so read top to bottom
    .map(([y, parts]) => {
      const sorted = parts.sort((a, b) => a.x - b.x);
      const size = Math.max(...sorted.map((p) => p.size));
      const gapThreshold = size * 1.5;

      // Split the line into cells wherever consecutive text runs are spaced
      // further apart than normal word spacing - a proxy for column gaps.
      const cells: Cell[] = [];
      for (const part of sorted) {
        const current = cells[cells.length - 1];
        if (current) {
          const innerGap = part.x - current.end;
          if (innerGap <= gapThreshold) {
            // pdf.js splits text into items at font/style boundaries, not just
            // at spaces, so a merged-in item needs its own separating space
            // unless the gap is near-zero (a same-word split, e.g. a ligature).
            current.text += innerGap > size * 0.12 ? ` ${part.str}` : part.str;
            current.end = Math.max(current.end, part.end);
            continue;
          }
        }
        cells.push({ x: part.x, end: part.end, text: part.str });
      }
      for (const cell of cells) cell.text = cell.text.replace(/\s+/g, " ").trim();

      return {
        y,
        size,
        bold: sorted.some((p) => p.bold),
        text: cells
          .map((c) => c.text)
          .join(" ")
          .trim(),
        cells: cells.filter((c) => c.text),
      };
    })
    .filter((l) => l.text);

  if (!lines.length) return "";

  const sortedSizes = lines.map((l) => l.size).sort((a, b) => a - b);
  const bodySize = sortedSizes[Math.floor(sortedSizes.length / 2)] || 1;

  const out: string[] = [];
  let prevY: number | null = null;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.cells.length >= 2) {
      const column0X = line.cells[0].x;
      const indentTolerance = bodySize * 0.8;
      const isAnchor = [true];
      let j = i + 1;
      // Table rows are often spaced looser than body paragraph lines (extra
      // row padding), so a table run tolerates a wider vertical gap than the
      // paragraph-break threshold below without being cut short. A wrapped
      // cell's overflow line has only one cell and doesn't restart at column
      // 0, so it extends the run too instead of ending it.
      while (
        j < lines.length &&
        lines[j - 1].y - lines[j].y <= bodySize * 2.5 &&
        (lines[j].cells.length >= 2 || isContinuationCandidate(lines[j], column0X, indentTolerance))
      ) {
        isAnchor.push(lines[j].cells.length >= 2);
        j++;
      }
      const table = renderTableBlock(lines.slice(i, j), isAnchor);
      if (table) {
        if (out.length) out.push("");
        out.push(...table);
        prevY = lines[j - 1].y;
        i = j;
        continue;
      }
    }

    const gap = prevY === null ? 0 : prevY - line.y;
    const startsNewBlock = prevY !== null && gap > bodySize * 1.4;
    const ratio = line.size / bodySize;

    const bulletMatch = line.text.match(/^[•▪◦‣·]\s*(.*)/);
    let text: string;
    if (bulletMatch) {
      text = `- ${bulletMatch[1]}`;
    } else if (ratio >= 1.7) {
      text = `# ${line.text}`;
    } else if (ratio >= 1.35) {
      text = `## ${line.text}`;
    } else if (ratio >= 1.15) {
      text = `### ${line.text}`;
    } else if (line.bold) {
      text = `**${line.text}**`;
    } else {
      text = line.text;
    }

    if (startsNewBlock && out.length) out.push("");
    out.push(text);
    prevY = line.y;
    i++;
  }

  return out.join("\n");
}

/** Converts the given 1-indexed pages (in ascending order) into one markdown document. */
export async function convertPagesToMarkdown(
  pdfDoc: PDFDocumentProxy,
  pageNumbers: number[],
): Promise<string> {
  const ordered = [...pageNumbers].sort((a, b) => a - b);
  const sections: string[] = [];
  for (const pageNumber of ordered) {
    const page = await pdfDoc.getPage(pageNumber);
    const md = await extractPageMarkdown(page);
    // An HTML comment marks which page a section came from without adding a
    // visible heading - it stays in the raw markdown (and any copy/download)
    // but renders invisibly wherever the markdown itself gets rendered.
    if (md) sections.push(`<!-- Page ${pageNumber} -->\n\n${md}`);
  }
  return sections.join("\n\n");
}
