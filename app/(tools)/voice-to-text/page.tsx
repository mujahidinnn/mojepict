"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Clock, Copy, Download, Mic, MicOff } from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/export-node";

const LANGUAGES = [
  { id: "id-ID", label: "Bahasa Indonesia" },
  { id: "en-US", label: "English (US)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "ja-JP", label: "Japanese (日本語)" },
  { id: "ko-KR", label: "Korean (한국어)" },
  { id: "zh-CN", label: "Chinese (中文)" },
  { id: "de-DE", label: "German (Deutsch)" },
  { id: "ru-RU", label: "Russian (Русский)" },
  { id: "ar-SA", label: "Arabic (العربية)" },
  { id: "es-ES", label: "Spanish (Español)" },
] as const;

type LanguageId = (typeof LANGUAGES)[number]["id"];

interface Segment {
  id: string;
  text: string;
  time: Date;
}

const PUNCTUATION_COMMANDS: Record<string, string> = {
  titik: ".",
  period: ".",
  koma: ",",
  comma: ",",
  "tanda tanya": "?",
  tanya: "?",
  "question mark": "?",
  "tanda seru": "!",
  seru: "!",
  "exclamation mark": "!",
  "baris baru": "\n",
  "new line": "\n",
  "paragraf baru": "\n\n",
  "new paragraph": "\n\n",
};

// Longest phrases first so "tanda tanya" is matched before the shorter "tanya".
const PUNCTUATION_REGEX = new RegExp(
  `\\b(${Object.keys(PUNCTUATION_COMMANDS)
    .sort((a, b) => b.length - a.length)
    .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "gi",
);

function applyPunctuationCommands(raw: string): string {
  const replaced = raw.replace(PUNCTUATION_REGEX, (match) => {
    return PUNCTUATION_COMMANDS[match.toLowerCase()] ?? match;
  });
  return replaced.replace(/ +([.,?!])/g, "$1");
}

export default function VoiceToTextPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState<LanguageId>("id-ID");
  const [continuous, setContinuous] = useState(true);
  const [punctuationCommands, setPunctuationCommands] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Tracks the last text emitted as "final" for each SpeechRecognition
  // result index within the current recognition session. Chrome's
  // continuous mode can re-deliver/revise an already-final result at the
  // same index, which without this guard causes appendFinalChunk to run
  // again and duplicate words in the transcript. Cleared whenever a new
  // recognition session starts, since result indices restart from 0 then.
  const finalizedRef = useRef<Map<number, string>>(new Map());
  const listeningRef = useRef(listening);
  const continuousRef = useRef(continuous);
  const punctuationRef = useRef(punctuationCommands);
  const languageRef = useRef(language);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);
  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);
  useEffect(() => {
    punctuationRef.current = punctuationCommands;
  }, [punctuationCommands]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const appendFinalChunk = useCallback((rawText: string) => {
    const cleaned = punctuationRef.current ? applyPunctuationCommands(rawText) : rawText;
    const text = cleaned.trim();
    if (!text) return;

    setTranscript((prev) => {
      if (!prev) return text;
      const needsSpace = !/[\s\n]$/.test(prev) && !text.startsWith("\n");
      return prev + (needsSpace ? " " : "") + text;
    });
    setSegments((prev) => [...prev, { id: crypto.randomUUID(), text, time: new Date() }]);
  }, []);

  const attachHandlers = useCallback(
    (recognition: SpeechRecognitionLike) => {
      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            const alreadyFinalized = finalizedRef.current.get(i);
            if (alreadyFinalized === text) {
              // Exact re-delivery of a result already committed - skip.
              continue;
            }
            if (alreadyFinalized === undefined) {
              appendFinalChunk(text);
            }
            // If this index was previously finalized with different text,
            // don't re-append (that's the source of the duplication) - just
            // update the record so future re-deliveries are recognized too.
            finalizedRef.current.set(i, text);
          } else {
            interim += text;
          }
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === "no-speech") return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setListening(false);
          toast({
            title: t("common.error") || "Error",
            description: "Microphone access was denied. Please allow mic permission and try again.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: t("common.error") || "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        // Chrome silently stops recognition after a short pause even in
        // continuous mode; restarting here is what makes dictation feel
        // uninterrupted instead of cutting off after a few seconds of silence.
        if (listeningRef.current && continuousRef.current) {
          try {
            // A restarted session renumbers result indices from 0, so
            // finalization tracking from the previous session no longer
            // applies here.
            finalizedRef.current.clear();
            recognition.start();
          } catch {
            // already started; ignore
          }
        } else {
          setListening(false);
        }
      };
    },
    [appendFinalChunk, t, toast],
  );

  const createRecognition = useCallback((): SpeechRecognitionLike | null => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.lang = languageRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    return recognition;
  }, []);

  const handleStart = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) {
      setSupported(false);
      return;
    }
    attachHandlers(recognition);
    recognitionRef.current = recognition;
    finalizedRef.current.clear();
    setInterimText("");
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, [attachHandlers, createRecognition]);

  const handleStop = useCallback(() => {
    setListening(false);
    setInterimText("");
    recognitionRef.current?.stop();
  }, []);

  const handleToggle = () => {
    if (listening) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const handleLanguageChange = (value: LanguageId) => {
    setLanguage(value);
    languageRef.current = value;
    if (recognitionRef.current && listening) {
      const old = recognitionRef.current;
      // Detach handlers first so stopping this instance doesn't trigger its
      // own onend auto-restart (which would resume with the old language).
      old.onend = null;
      old.onresult = null;
      old.onerror = null;
      old.stop();
      recognitionRef.current = null;
      window.setTimeout(() => {
        const recognition = createRecognition();
        if (!recognition) return;
        attachHandlers(recognition);
        recognitionRef.current = recognition;
        finalizedRef.current.clear();
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }, 150);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({ title: t("common.success"), description: t("toast.success.copied") || "Copied to clipboard." });
    } catch {
      toast({
        title: t("common.error") || "Error",
        description: "Failed to copy text.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    downloadTextFile(transcript, "transkrip-suara.txt");
  };

  const handleReset = () => {
    setTranscript("");
    setInterimText("");
    setSegments([]);
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;

  return (
    <ToolShell
      title={t("tool.voice-to-text.name") || "Voice to Text"}
      description={
        t("tool.voice-to-text.description") ||
        "Turn your speech into editable text right in the browser, with live transcription and voice punctuation commands."
      }
    >
      {!supported ? (
        <ToolWorkspace>
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed">
            <ToolEmptyState
              icon={<MicOff className="h-6 w-6" />}
              title="Speech recognition isn't supported in this browser"
              hint="Try the latest Chrome or Edge on desktop or Android."
            />
          </div>
        </ToolWorkspace>
      ) : (
        <ToolWorkspace
          sidebar={
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Language
                  </Label>
                  <Select value={language} onValueChange={(v) => handleLanguageChange(v as LanguageId)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Keep listening</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-restart recognition after pauses instead of stopping.
                    </p>
                  </div>
                  <Switch checked={continuous} onCheckedChange={setContinuous} />
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs font-medium">Voice punctuation commands</Label>
                    <Switch checked={punctuationCommands} onCheckedChange={setPunctuationCommands} />
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Say "titik" / "period", "koma" / "comma", "tanda tanya" / "question mark",
                    "tanda seru" / "exclamation mark", "baris baru" / "new line", or "paragraf baru" /
                    "new paragraph" to insert punctuation as you speak.
                  </p>
                </div>
              </div>

              <ToolActionBar
                primaryLabel="Copy Text"
                primaryIcon={<Copy className="h-4 w-4" />}
                onPrimary={handleCopy}
                primaryDisabled={!transcript}
                onReset={transcript || segments.length > 0 ? handleReset : undefined}
                resetDisabled={!transcript && segments.length === 0}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleDownload}
                  disabled={!transcript}
                >
                  <Download className="h-4 w-4" />
                  Download .txt
                </Button>
              </ToolActionBar>
            </>
          }
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-8">
              <button
                type="button"
                onClick={handleToggle}
                aria-pressed={listening}
                className={cn(
                  "relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-colors",
                  listening ? "bg-rose-500" : "bg-primary",
                )}
              >
                {listening && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-rose-500/60" />
                )}
                {listening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium">{listening ? "Listening…" : "Start"}</span>
                {listening && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                    Recording
                  </Badge>
                )}
              </div>
              {listening && interimText && (
                <p className="max-w-md px-6 text-center text-sm italic text-muted-foreground">
                  {interimText}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transcript
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {wordCount} words · {charCount} characters
                </span>
              </div>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={14}
                placeholder="Your transcribed text will appear here. You can edit it freely at any time."
                className="resize-y font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transcript history
              </Label>
              <Separator />
              {segments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Finalized phrases will show up here with a timestamp.
                </p>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {segments.map((segment) => (
                    <div key={segment.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                      <div className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(segment.time, "HH:mm:ss")}
                      </div>
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">{segment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ToolWorkspace>
      )}
    </ToolShell>
  );
}
