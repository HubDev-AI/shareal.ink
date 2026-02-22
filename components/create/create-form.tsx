"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "./link-preview";
import { parseInput } from "@/lib/validation";
import { linkTypeConfig } from "@/lib/config/link-types";
import { IntentTypePills } from "./intent-type-pills";
import { inferIntentType } from "@/lib/infer-intent";
import type { IntentType, LinkType, OgMetadata } from "@/lib/types";

// Matches http(s)://... or bare domains like maps.app.goo.gl/...
const URL_RE = /^(https?:\/\/|[\w-]+\.[\w-]+[./])/i;

type FormState = "idle" | "fetching" | "previewing" | "creating";

interface CreateFormProps {
  onPreviewChange?: (showing: boolean) => void;
}

export function CreateForm({ onPreviewChange }: CreateFormProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<LinkType>("generic");
  const [actionLabel, setActionLabel] = useState("Interested");
  const [metadata, setMetadata] = useState<OgMetadata | null>(null);
  const [freeTextTitle, setFreeTextTitle] = useState<string | null>(null);
  const [intentText, setIntentText] = useState("");
  const [intentType, setIntentType] = useState<IntentType>("share");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (state !== "idle") {
      setIntentType(inferIntentType(intentText, linkType));
    }
  }, [intentText, linkType, state]);

  const pollOgJob = useCallback(
    (id: string) => {
      stopPolling(); // Clear any existing interval first
      let pollCount = 0;
      const MAX_POLLS = 20; // ~30 seconds at 1.5s interval

      pollRef.current = setInterval(async () => {
        pollCount++;

        if (pollCount >= MAX_POLLS) {
          setState("previewing");
          stopPolling();
          return;
        }

        try {
          const res = await fetch(`/api/og/${id}`);
          if (!res.ok) return;
          const data = await res.json();

          if (data.status === "completed" && data.metadata) {
            setMetadata(data.metadata);
            setState("previewing");
            stopPolling();
          } else if (data.status === "failed") {
            setState("previewing");
            stopPolling();
          }
        } catch {
          // Silently continue polling
        }
      }, 1500);
    },
    [stopPolling]
  );

  const handleSubmitInput = async () => {
    const value = input.trim();
    if (!value) {
      setError("Paste a link or type a title");
      return;
    }

    const parsed = parseInput(value);
    if (parsed.type === "too_long") {
      setError(`Too long — max ${parsed.limit} characters`);
      return;
    }

    setError(null);
    setState("fetching");
    onPreviewChange?.(true);
    setMetadata(null);
    setFreeTextTitle(null);

    try {
      const res = await fetch("/api/og", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        setState("idle");
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error ?? "Something went wrong. Try again.");
        setState("idle");
        return;
      }

      const data = await res.json();
      setLinkType(data.linkType);
      setActionLabel(data.suggestedActionLabel);

      if (data.jobId) {
        setJobId(data.jobId);
        setState("fetching");
        pollOgJob(data.jobId);
      } else {
        // Free text — no OG to fetch
        setFreeTextTitle(data.title);
        setState("previewing");
      }
    } catch {
      setError("Network error. Check your connection.");
      setState("idle");
    }
  };

  const handleCreate = async () => {
    setState("creating");
    stopPolling();

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: freeTextTitle ? null : input.trim(),
          jobId,
          title: metadata?.title ?? freeTextTitle,
          description: metadata?.description ?? null,
          linkType,
          primaryActionLabel: actionLabel,
          intentText: intentText.trim() || null,
          intentType,
        }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        setState("previewing");
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error ?? "Failed to create. Try again.");
        setState("previewing");
        return;
      }

      const data = await res.json();
      const surfaceUrl = `${window.location.origin}/${data.token}`;
      try { await navigator.clipboard.writeText(surfaceUrl); } catch {}
      sessionStorage.setItem("link-copied", "1");
      router.push(`/${data.token}`);
    } catch {
      setError("Network error. Check your connection.");
      setState("previewing");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      if (state === "idle") {
        handleSubmitInput();
      } else if (state === "previewing") {
        handleCreate();
      }
    }
  };

  const trimmed = input.trim();
  const isUrl = useMemo(() => URL_RE.test(trimmed), [trimmed]);

  const showPreview = state !== "idle";

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (state !== "idle") {
                setState("idle");
                onPreviewChange?.(false);
                stopPolling();
                setMetadata(null);
                setJobId(null);
                setFreeTextTitle(null);
                setIntentText("");
                setIntentType("share");
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste a link or type anything..."
            disabled={state === "creating"}
            autoFocus
            className="input-glass"
          />
          {state === "idle" && trimmed && (
            <Button onClick={handleSubmitInput} variant="secondary" className="shrink-0 self-stretch border-white/15 bg-white/10 text-white hover:bg-white/15">
              Preview
            </Button>
          )}
        </div>

        {/* Ghost echo — full URL whisper below input */}
        <AnimatePresence>
          {isUrl && trimmed && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-1.5 break-all text-center text-[11px] tracking-wide text-white/25"
            >
              {trimmed}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Error below ghost URL */}
        {error && (
          <p className="mt-1.5 text-center text-sm text-red-300">{error}</p>
        )}
      </div>

      <div
        className="grid transition-all duration-400 ease-in-out"
        style={{ gridTemplateRows: showPreview ? "1fr" : "0fr", opacity: showPreview ? 1 : 0 }}
      >
        <div className="overflow-hidden px-1 -mx-1">
          <div className="space-y-4 pt-1">
            <LinkPreview
              linkType={linkType}
              metadata={metadata}
              loading={state === "fetching"}
              title={freeTextTitle}
              originalUrl={freeTextTitle ? null : input.trim()}
              className="border-white/15 bg-white/8 text-white backdrop-blur-md [&_h3]:text-white [&_p]:text-white/60"
            />

            <div>
              <Textarea
                value={intentText}
                onChange={(e) => setIntentText(e.target.value)}
                placeholder={linkTypeConfig[linkType].intentPlaceholder}
                disabled={state === "creating"}
                maxLength={2000}
                className="input-glass"
              />
              {intentText.length > 1800 && (
                <p className={`mt-1 text-right text-[12px] ${intentText.length >= 2000 ? "text-red-400" : "text-white/30"}`}>
                  {intentText.length}/2000
                </p>
              )}
            </div>

            <IntentTypePills
              value={intentType}
              onChange={setIntentType}
              disabled={state === "creating"}
            />

            <Button
              onClick={handleCreate}
              loading={state === "creating"}
              className="w-full text-base bg-white text-[#040c1f] hover:bg-white/90"
            >
              Create shareable link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
