import { toBlob, toPng } from "html-to-image";
import { PDFDocument } from "pdf-lib";

/**
 * Shared DOM-node-to-file export helpers. Rendering PNG/PDF from the exact
 * same styled DOM node (instead of re-laying-out data as raw text) is what
 * keeps every export format visually identical to the on-screen preview.
 */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function nodeToPngBlob(node: HTMLElement, pixelRatio = 3): Promise<Blob> {
  const blob = await toBlob(node, { pixelRatio, cacheBust: true });
  if (!blob) throw new Error("Failed to render image.");
  return blob;
}

export async function downloadNodeAsPng(node: HTMLElement, filename: string, pixelRatio = 3) {
  const blob = await nodeToPngBlob(node, pixelRatio);
  triggerDownload(blob, filename);
}

/**
 * Screenshots the node at high pixelRatio and embeds that PNG as a single
 * full-bleed page sized to match its own aspect ratio (96dpi px -> pt), so
 * the PDF page fits the content exactly instead of a fixed A4 frame.
 */
export async function downloadNodeAsPdf(node: HTMLElement, filename: string, pixelRatio = 3) {
  const dataUrl = await toPng(node, { pixelRatio, cacheBust: true });
  const pngBytes = await (await fetch(dataUrl)).arrayBuffer();

  const pdf = await PDFDocument.create();
  const embedded = await pdf.embedPng(pngBytes);
  const PX_TO_PT = 0.75; // 96px/in -> 72pt/in
  const widthPt = (embedded.width / pixelRatio) * PX_TO_PT;
  const heightPt = (embedded.height / pixelRatio) * PX_TO_PT;

  const page = pdf.addPage([widthPt, heightPt]);
  page.drawImage(embedded, { x: 0, y: 0, width: widthPt, height: heightPt });

  const bytes = await pdf.save();
  triggerDownload(new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
}

export function downloadTextFile(text: string, filename: string, mime = "text/plain;charset=utf-8") {
  triggerDownload(new Blob([text], { type: mime }), filename);
}

/** Escapes a value for use inside a CSV field (RFC 4180: quote if it contains a comma, quote, or newline). */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
}

export function downloadCsv(headers: string[], rows: string[][], filename: string) {
  // Leading BOM so Excel opens UTF-8 (e.g. Indonesian text) without mangling it.
  downloadTextFile("﻿" + toCsv(headers, rows), filename, "text/csv;charset=utf-8");
}
