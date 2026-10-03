import { zipSync, unzipSync, gzipSync, gunzipSync, strToU8, type Zippable } from "fflate";

export interface ArchiveEntry {
  path: string;
  data: Uint8Array;
}

export type ArchiveFormat = "zip" | "tar" | "tar.gz";

export function createZip(entries: ArchiveEntry[]): Uint8Array {
  const tree: Zippable = {};
  for (const { path, data } of entries) tree[path] = data;
  return zipSync(tree, { level: 6 });
}

export function extractZip(data: Uint8Array): ArchiveEntry[] {
  return Object.entries(unzipSync(data))
    .filter(([path]) => !path.endsWith("/"))
    .map(([path, data]) => ({ path, data }));
}

// --- Minimal USTAR reader/writer. Regular files only (no symlinks/devices) - ---
// everything this tool's own zip creation ever produces, which is enough for
// the "archive your files as .tar.gz" use case this covers.

function octalField(n: number, len: number): Uint8Array {
  const s = Math.floor(n).toString(8).padStart(len - 1, "0") + "\0";
  return strToU8(s);
}

function tarHeaderBlock(path: string, size: number, mtimeSec: number): Uint8Array {
  const block = new Uint8Array(512);
  const write = (offset: number, bytes: Uint8Array) => block.set(bytes.subarray(0, Math.min(bytes.length, 512 - offset)), offset);

  let name = path;
  let prefix = "";
  const nameBytes = strToU8(name);
  if (nameBytes.length > 100) {
    const splitAt = name.length - 100;
    const slash = name.indexOf("/", splitAt);
    if (slash > 0 && slash < 155) {
      prefix = name.slice(0, slash);
      name = name.slice(slash + 1);
    } else {
      name = name.slice(-100); // best effort: can't split cleanly, just truncate
    }
  }

  write(0, strToU8(name));
  write(100, octalField(0o644, 8));
  write(108, octalField(0, 8));
  write(116, octalField(0, 8));
  write(124, octalField(size, 12));
  write(136, octalField(mtimeSec, 12));
  block.fill(0x20, 148, 156); // checksum placeholder: 8 spaces
  block[156] = 0x30; // typeflag '0' = regular file
  write(257, strToU8("ustar\0"));
  write(263, strToU8("00"));
  write(345, strToU8(prefix));

  let sum = 0;
  for (let i = 0; i < 512; i++) sum += block[i];
  write(148, strToU8(sum.toString(8).padStart(6, "0") + "\0 "));

  return block;
}

function pad512(len: number): number {
  return (512 - (len % 512)) % 512;
}

export function createTar(entries: ArchiveEntry[]): Uint8Array {
  const mtimeSec = Math.floor(Date.now() / 1000);
  const parts: Uint8Array[] = [];
  let total = 0;
  for (const { path, data } of entries) {
    const header = tarHeaderBlock(path, data.length, mtimeSec);
    const padding = new Uint8Array(pad512(data.length));
    parts.push(header, data, padding);
    total += header.length + data.length + padding.length;
  }
  const end = new Uint8Array(1024); // two zero blocks mark the end of the archive
  parts.push(end);
  total += end.length;

  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function createTarGz(entries: ArchiveEntry[]): Uint8Array {
  return gzipSync(createTar(entries), { level: 6 });
}

function readOctal(block: Uint8Array, offset: number, len: number): number {
  let s = "";
  for (let i = 0; i < len; i++) {
    const c = block[offset + i];
    if (c === 0 || c === 0x20) break;
    s += String.fromCharCode(c);
  }
  return s ? parseInt(s, 8) : 0;
}

function readStr(block: Uint8Array, offset: number, len: number): string {
  let end = offset;
  while (end < offset + len && block[end] !== 0) end++;
  return new TextDecoder().decode(block.subarray(offset, end));
}

export function extractTar(data: Uint8Array): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  let offset = 0;
  while (offset + 512 <= data.length) {
    const header = data.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break; // end-of-archive marker

    const name = readStr(header, 0, 100);
    const prefix = readStr(header, 345, 155);
    const size = readOctal(header, 124, 12);
    const typeflag = header[156];
    offset += 512;

    const content = data.subarray(offset, offset + size);
    offset += size + pad512(size);

    if (typeflag === 0x30 || typeflag === 0) {
      // regular file ('0' or legacy '\0')
      entries.push({ path: prefix ? `${prefix}/${name}` : name, data: content.slice() });
    }
  }
  return entries;
}

export function extractTarGz(data: Uint8Array): ArchiveEntry[] {
  return extractTar(gunzipSync(data));
}

export function createArchive(format: ArchiveFormat, entries: ArchiveEntry[]): Uint8Array {
  if (format === "zip") return createZip(entries);
  if (format === "tar") return createTar(entries);
  return createTarGz(entries);
}

/** Picks the extraction routine by file signature rather than extension, since gzip has no reliable magic-byte-free alternative. */
export function extractArchive(data: Uint8Array): ArchiveEntry[] {
  if (data[0] === 0x50 && data[1] === 0x4b) return extractZip(data); // "PK"
  if (data[0] === 0x1f && data[1] === 0x8b) return extractTarGz(data); // gzip magic
  return extractTar(data);
}
