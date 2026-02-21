"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ActionButtonProps {
  token: string;
  label: string;
  initialCount: number;
  onCountChange: (count: number) => void;
}

export function ActionButton({ token, label, initialCount, onCountChange }: ActionButtonProps) {
  const [responded, setResponded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`shareal:${token}`);
    if (stored === "yes") setResponded(true);
  }, [token]);

  const handleClick = async () => {
    if (responded || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/spaces/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseType: "yes" }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponded(true);
        localStorage.setItem(`shareal:${token}`, "yes");
        onCountChange(data.count);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  if (responded) {
    return (
      <Button disabled variant="primary" className="w-full bg-success text-white text-base">
        <Check className="h-5 w-5" />
        You&apos;re in!
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} loading={loading} className="w-full text-base">
      {label}
    </Button>
  );
}
