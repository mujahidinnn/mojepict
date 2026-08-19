"use client";

import "@excalidraw/excalidraw/index.css";
import { useTheme } from "next-themes";
import { PDFDocument } from "pdf-lib";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import type * as ExcalidrawModule from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n/context";
import { FileDown, RotateCcw } from "lucide-react";

// Excalidraw fetches its canvas fonts (the Font Family picker) from a CDN by
// default; self-hosting from /public avoids that external dependency, since
// a blocked/slow CDN silently falls back and makes font switching look broken.
if (typeof window !== "undefined") {
  (window as unknown as { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH =
    "/excalidraw-assets/";
}

const STORAGE_KEY = "mojepict-diagram-maker";

function loadInitialData(): ExcalidrawInitialDataState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function PdfExportButton({
  canvas,
  label,
}: {
  canvas: HTMLCanvasElement;
  label: string;
}) {
  const exportPdf = async () => {
    const dataUrl = canvas.toDataURL("image/png");
    const pngBytes = new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
    const pdf = await PDFDocument.create();
    const embedded = await pdf.embedPng(pngBytes);
    const w = canvas.width * 0.75;
    const h = canvas.height * 0.75;
    const page = pdf.addPage([w, h]);
    page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
    const bytes = await pdf.save();
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram-mojepict.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" className="gap-2" onClick={exportPdf}>
      <FileDown className="h-4 w-4" />
      {label}
    </Button>
  );
}

export default function DiagramMakerPage() {
  const { t, locale } = useI18n();
  const { resolvedTheme } = useTheme();
  // Loaded via a plain client-only import() (rather than next/dynamic) so
  // MainMenu keeps its static .DefaultItems/.Separator members intact -
  // next/dynamic's wrapper component would strip them.
  const [mod, setMod] = useState<typeof ExcalidrawModule | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then(setMod);
  }, []);

  const initialData = useMemo(() => loadInitialData(), []);

  const handleChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Debounced localStorage write; quota errors are swallowed since a
      // diagram with many embedded images can exceed the ~5MB limit and
      // falling back to "just don't autosave" beats crashing the canvas.
      saveTimer.current = setTimeout(() => {
        try {
          const { collaborators: _collaborators, ...persistableAppState } = appState;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ elements, appState: persistableAppState, files }),
          );
        } catch {
          // ignore quota errors
        }
      }, 600);
    },
    [],
  );

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleClear = () => {
    if (!apiRef.current) return;
    setConfirmClearOpen(true);
  };

  const confirmClear = () => {
    apiRef.current?.resetScene();
    localStorage.removeItem(STORAGE_KEY);
    setConfirmClearOpen(false);
  };

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <ToolShell
      title={t("tool.diagram-maker.name")}
      description={t("tool.diagram-maker.description")}
      actions={
        <Button variant="outline" size="sm" className="gap-2" onClick={handleClear}>
          <RotateCcw className="h-4 w-4" />
          {t("tool.diagram-maker.new")}
        </Button>
      }
    >
      {/* Hides the default top-right "Library" trigger, which opens Excalidraw's
          public library marketplace (libraries.excalidraw.com) - out of scope here. */}
      <style>{".default-sidebar-trigger { display: none !important; }"}</style>
      <div className="h-[78vh] min-h-[560px] overflow-hidden rounded-xl border shadow-sm">
        {mod && (
          <mod.Excalidraw
            excalidrawAPI={(api) => (apiRef.current = api)}
            initialData={initialData ?? { appState: { theme } }}
            onChange={handleChange}
            theme={theme}
            langCode={locale === "id" ? "id-ID" : "en"}
            name="mojepict-diagram"
            showDeprecatedFonts
            UIOptions={{
              canvasActions: {
                export: {
                  saveFileToDisk: true,
                  renderCustomUI: (_elements, _appState, _files, canvas) => (
                    <PdfExportButton
                      canvas={canvas}
                      label={t("tool.diagram-maker.export-pdf")}
                    />
                  ),
                },
              },
            }}
          >
            {/* Custom menu: same local/file actions as the default menu, minus
                the Socials block (GitHub/Discord/X) and the live-collaboration
                sign-up prompt - neither applies to a self-hosted, no-backend tool. */}
            <mod.MainMenu>
              <mod.MainMenu.DefaultItems.LoadScene />
              <mod.MainMenu.DefaultItems.SaveToActiveFile />
              <mod.MainMenu.DefaultItems.Export />
              <mod.MainMenu.DefaultItems.ChangeCanvasBackground />
              <mod.MainMenu.Separator />
              <mod.MainMenu.DefaultItems.ClearCanvas />
              <mod.MainMenu.DefaultItems.Help />
            </mod.MainMenu>
          </mod.Excalidraw>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t("tool.diagram-maker.footer")}
      </p>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tool.diagram-maker.confirm-clear")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear}>
              {t("dialog.confirm.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ToolShell>
  );
}
