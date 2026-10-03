"use client";

import { useCallback, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { createArchive, extractArchive, type ArchiveEntry, type ArchiveFormat } from "@/lib/archive";
import { Archive, Download, File as FileIcon, FolderOpen, FolderUp, X } from "lucide-react";
import { TwoColumnLayout, InputSection, OutputSection } from "@/components/tools/ToolTemplates";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBytes(data: Uint8Array, filename: string) {
  const blob = new Blob([data as BlobPart]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const FORMAT_EXT: Record<ArchiveFormat, string> = { zip: "zip", tar: "tar", "tar.gz": "tar.gz" };

interface QueuedFile {
  id: string;
  path: string;
  file: File;
}

function CompressPanel() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [format, setFormat] = useState<ArchiveFormat>("zip");
  const [working, setWorking] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        id: uid(),
        // webkitRelativePath is set when the files came from a folder picker, preserving structure in the archive.
        path: file.webkitRelativePath || file.name,
        file,
      })),
    ]);
  }, []);

  const remove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const clearAll = () => setFiles([]);

  const compress = useCallback(async () => {
    if (!files.length) return;
    setWorking(true);
    try {
      const entries: ArchiveEntry[] = await Promise.all(
        files.map(async (f) => ({ path: f.path, data: new Uint8Array(await f.file.arrayBuffer()) })),
      );
      const bytes = createArchive(format, entries);
      downloadBytes(bytes, `archive.${FORMAT_EXT[format]}`);
      toast({ title: t("common.success"), description: t("toast.success.downloaded") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("toast.error.generic") });
    } finally {
      setWorking(false);
    }
  }, [files, format, t, toast]);

  return (
    <TwoColumnLayout>
      <InputSection label={t("tool.archive-tool.filesLabel")}>
        <Dropzone
          multiple
          onFiles={addFiles}
          title={t("tool.archive-tool.dropzone.title")}
          subtitle={t("tool.archive-tool.dropzone.subtitle")}
          icon={<Archive className="h-6 w-6 text-primary" />}
          className="min-h-[160px]"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error -- webkitdirectory is a non-standard but widely supported attribute
          webkitdirectory=""
          multiple
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" className="w-full gap-2" onClick={() => folderInputRef.current?.click()}>
          <FolderUp className="h-4 w-4" />
          {t("tool.archive-tool.selectFolder")}
        </Button>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {t("tool.archive-tool.fileCount").replace("{{count}}", String(files.length))}
              </p>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
                {t("common.clear")}
              </Button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border bg-muted/10 p-3">
                  <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{f.path}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.file.size)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(f.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </InputSection>

      <OutputSection label={t("tool.archive-tool.outputLabel")}>
        <div className="space-y-2">
          <Select value={format} onValueChange={(v) => setFormat(v as ArchiveFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zip">.zip</SelectItem>
              <SelectItem value="tar">.tar</SelectItem>
              <SelectItem value="tar.gz">.tar.gz</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full gap-2" onClick={compress} disabled={!files.length || working}>
          <Download className="h-4 w-4" />
          {working ? t("state.converting") : t("tool.archive-tool.compress")}
        </Button>
      </OutputSection>
    </TwoColumnLayout>
  );
}

function ExtractPanel() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [archiveName, setArchiveName] = useState<string | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null);

  const load = async (file: File) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const extracted = extractArchive(bytes);
      if (!extracted.length) throw new Error("empty");
      setArchiveName(file.name);
      setEntries(extracted);
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("tool.archive-tool.invalidFile"),
      });
    }
  };

  const downloadOne = (entry: ArchiveEntry) => downloadBytes(entry.data, entry.path.split("/").pop() || entry.path);

  const downloadAll = () => {
    if (!entries) return;
    entries.forEach((entry, i) => setTimeout(() => downloadBytes(entry.data, entry.path), i * 150));
  };

  const reset = () => {
    setArchiveName(null);
    setEntries(null);
  };

  return (
    <div className="max-w-screen-md space-y-4">
      {!entries ? (
        <Dropzone
          accept=".zip,.tar,.gz,.tgz"
          onFile={load}
          icon={<FolderOpen className="h-6 w-6 text-primary" />}
          title={t("tool.archive-tool.extractDropzone.title")}
          subtitle={t("tool.archive-tool.extractDropzone.subtitle")}
          className="min-h-[200px]"
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/10 p-3">
            <span className="truncate text-sm font-medium">{archiveName}</span>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={downloadAll}>
                <Download className="h-3.5 w-3.5" />
                {t("tool.archive-tool.downloadAll")}
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                {t("tool.archive-tool.changeFile")}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("tool.archive-tool.fileCount").replace("{{count}}", String(entries.length))}
          </p>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.path} className="flex items-center gap-3 rounded-lg border bg-muted/10 p-3">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{entry.path}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(entry.data.length)}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => downloadOne(entry)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ArchiveToolPage() {
  const { t } = useI18n();

  return (
    <ToolShell title={t("tool.archive-tool.name")} description={t("tool.archive-tool.description")}>
      <Tabs defaultValue="compress" className="space-y-6">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="compress">{t("tool.archive-tool.compress")}</TabsTrigger>
          <TabsTrigger value="extract">{t("tool.archive-tool.extract")}</TabsTrigger>
        </TabsList>
        <TabsContent value="compress">
          <CompressPanel />
        </TabsContent>
        <TabsContent value="extract">
          <ExtractPanel />
        </TabsContent>
      </Tabs>
    </ToolShell>
  );
}
