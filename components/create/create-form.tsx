"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "./link-preview";
import type { LinkType, OgMetadata } from "@/lib/types";

type FormState = "idle" | "fetching" | "previewing" | "creating";

export function CreateForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<LinkType>("generic");
  const [actionLabel, setActionLabel] = useState("Interested");
  const [metadata, setMetadata] = useState<OgMetadata | null>(null);
  const [freeTextTitle, setFreeTextTitle] = useState<string | null>(null);
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

  const pollOgJob = useCallback(
    (id: string) => {
      pollRef.current = setInterval(async () => {
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
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Paste a link or type a title");
      return;
    }

    setError(null);
    setState("fetching");
    setMetadata(null);
    setFreeTextTitle(null);

    try {
      const res = await fetch("/api/og", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        setState("idle");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
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
        }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment.");
        setState("previewing");
        return;
      }

      if (!res.ok) {
        setError("Failed to create. Try again.");
        setState("previewing");
        return;
      }

      const data = await res.json();
      router.push(`/${data.token}`);
    } catch {
      setError("Network error. Check your connection.");
      setState("previewing");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (state === "idle" || state === "fetching") {
        handleSubmitInput();
      }
    }
  };

  const showPreview = state !== "idle";
  const showCreateButton = state === "fetching" || state === "previewing" || state === "creating";

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (state !== "idle") {
              setState("idle");
              stopPolling();
              setMetadata(null);
              setJobId(null);
              setFreeTextTitle(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a link or type anything..."
          error={error ?? undefined}
          disabled={state === "creating"}
          autoFocus
        />
        {state === "idle" && input.trim() && (
          <Button onClick={handleSubmitInput} variant="secondary" className="shrink-0">
            Preview
          </Button>
        )}
      </div>

      {showPreview && (
        <LinkPreview
          linkType={linkType}
          metadata={metadata}
          loading={state === "fetching"}
          title={freeTextTitle}
        />
      )}

      {showCreateButton && (
        <Button
          onClick={handleCreate}
          loading={state === "creating"}
          className="w-full text-base"
        >
          Create shareable link
        </Button>
      )}
    </div>
  );
}
