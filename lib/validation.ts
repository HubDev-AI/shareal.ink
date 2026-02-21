type ParsedInput =
  | { type: "url"; value: string }
  | { type: "text"; value: string }
  | { type: "empty" };

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) return { type: "empty" };

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { type: "url", value: trimmed };
    }
    return { type: "text", value: trimmed };
  } catch {
    return { type: "text", value: trimmed };
  }
}
