"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Pause, Play, Square, Upload, VolumeX } from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { downloadTextFile } from "@/lib/export-node";

const ACCEPTED_TYPES = ".txt,.md,text/plain";
// Most browser TTS engines silently stop well before this; only the first
// chunk is read aloud so we cap it instead of letting speech trail off unheard.
const MAX_CHARS = 20000;

export default function TextToVoicePage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [supported, setSupported] = useState(true);
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [spokenAt, setSpokenAt] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      setVoiceURI((prev) => prev || list[0]?.voiceURI || "");
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const groupedVoices = useMemo(() => {
    const groups = new Map<string, SpeechSynthesisVoice[]>();
    for (const v of voices) {
      const list = groups.get(v.lang) ?? [];
      list.push(v);
      groups.set(v.lang, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [voices]);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setText(typeof reader.result === "string" ? reader.result : "");
        toast({ title: t("common.success") || "Success", description: `Loaded "${file.name}".` });
      };
      reader.onerror = () => {
        toast({ title: "Failed", description: "Could not read the file.", variant: "destructive" });
      };
      reader.readAsText(file);
    },
    [t, toast],
  );

  const handlePlay = () => {
    if (!supported || !text.trim()) return;
    // Only cancel when something is actually speaking/queued - calling
    // cancel() unconditionally right before speak() in the same tick is a
    // known Chromium bug where the following speak() can be silently
    // dropped with no error event, so an idle engine should be left alone.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    const utter = new SpeechSynthesisUtterance(text.slice(0, MAX_CHARS));
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    utter.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utter.onend = () => {
      setSpeaking(false);
      setPaused(false);
      setSpokenAt(null);
    };
    utter.onerror = (e) => {
      setSpeaking(false);
      setPaused(false);
      if (e.error === "canceled" || e.error === "interrupted") return;
      toast({ title: "Failed", description: `Speech error: ${e.error}`, variant: "destructive" });
    };
    utter.onboundary = (e) => {
      if (e.name === "word" || e.name === undefined) setSpokenAt(e.charIndex);
    };
    // Defer speak() by one tick so a just-issued cancel() has a chance to
    // flush before the engine is asked to speak again - calling both in the
    // same synchronous task is what triggers the silent-drop bug above.
    setTimeout(() => window.speechSynthesis.speak(utter), 0);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setPaused(true);
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setPaused(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setSpokenAt(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("common.success") || "Success", description: t("toast.success.copied") || "Copied!" });
    } catch {
      toast({ title: "Failed", description: "Could not copy text.", variant: "destructive" });
    }
  };

  const handleDownload = () => downloadTextFile(text, "text-to-voice.txt");

  const handleReset = () => {
    handleStop();
    setText("");
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const currentWord = spokenAt !== null ? (text.slice(spokenAt).match(/^\S+/)?.[0] ?? "") : "";

  return (
    <ToolShell
      title={t("tool.text-to-voice.name") || "Text to Voice"}
      description={
        t("tool.text-to-voice.description") ||
        "Convert typed or uploaded text into natural speech right in the browser, with adjustable voice, speed, pitch, and volume."
      }
    >
      {!supported ? (
        <ToolWorkspace>
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed">
            <ToolEmptyState
              icon={<VolumeX className="h-6 w-6" />}
              title="Speech synthesis isn't supported in this browser"
              hint="Try the latest Chrome, Edge, or Safari."
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
                    Voice
                  </Label>
                  <Select value={voiceURI} onValueChange={setVoiceURI} disabled={voices.length === 0}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="No voices found" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedVoices.map(([lang, list]) => (
                        <SelectGroup key={lang}>
                          <SelectLabel>{lang}</SelectLabel>
                          {list.map((v) => (
                            <SelectItem key={v.voiceURI} value={v.voiceURI}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Speed</Label>
                    <span className="text-xs font-mono">{rate.toFixed(1)}x</span>
                  </div>
                  <Slider value={[rate]} min={0.5} max={2} step={0.1} onValueChange={(v) => setRate(v[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Pitch</Label>
                    <span className="text-xs font-mono">{pitch.toFixed(1)}</span>
                  </div>
                  <Slider value={[pitch]} min={0} max={2} step={0.1} onValueChange={(v) => setPitch(v[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Volume</Label>
                    <span className="text-xs font-mono">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider value={[volume]} min={0} max={1} step={0.05} onValueChange={(v) => setVolume(v[0])} />
                </div>
              </div>

              <ToolActionBar
                primaryLabel="Copy Text"
                primaryIcon={<Copy className="h-4 w-4" />}
                onPrimary={handleCopy}
                primaryDisabled={!text}
                onReset={text ? handleReset : undefined}
                resetDisabled={!text}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleDownload}
                  disabled={!text}
                >
                  <Download className="h-4 w-4" />
                  Download .txt
                </Button>
              </ToolActionBar>
            </>
          }
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-8">
              <div className="flex items-center gap-3">
                {!speaking ? (
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={!text.trim()}
                    aria-label="Play"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors disabled:opacity-40"
                  >
                    <Play className="h-7 w-7 translate-x-0.5" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={paused ? handleResume : handlePause}
                      aria-label={paused ? "Resume" : "Pause"}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg"
                    >
                      {paused ? <Play className="h-7 w-7 translate-x-0.5" /> : <Pause className="h-7 w-7" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleStop}
                      aria-label="Stop"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-input text-muted-foreground hover:bg-muted"
                    >
                      <Square className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium">
                  {speaking ? (paused ? "Paused" : "Speaking…") : "Play"}
                </span>
                {speaking && !paused && currentWord && (
                  <p className="max-w-md px-6 text-center text-sm italic text-muted-foreground">
                    &ldquo;{currentWord}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Text
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {wordCount} words · {charCount} characters
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload .txt
                  </button>
                </div>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                placeholder="Type or paste text here, or upload a .txt file above. Then press play to hear it read aloud."
                className="resize-y text-sm"
              />
              {charCount > MAX_CHARS && (
                <p className="text-[11px] text-amber-600">
                  Only the first {MAX_CHARS.toLocaleString()} characters will be read aloud in one pass.
                </p>
              )}
            </div>
          </div>
        </ToolWorkspace>
      )}
    </ToolShell>
  );
}
