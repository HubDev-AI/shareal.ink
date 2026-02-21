/** URLs can be long (query strings, etc.) so allow more. Text should be shorter. */
export const MAX_URL_LENGTH = 2000;
export const MAX_TEXT_LENGTH = 500;

type ParsedInput =
  | { type: "url"; value: string }
  | { type: "text"; value: string }
  | { type: "empty" }
  | { type: "too_long"; limit: number };

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) return { type: "empty" };

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      if (trimmed.length > MAX_URL_LENGTH) return { type: "too_long", limit: MAX_URL_LENGTH };
      return { type: "url", value: trimmed };
    }
  } catch {
    // not a URL
  }

  if (trimmed.length > MAX_TEXT_LENGTH) return { type: "too_long", limit: MAX_TEXT_LENGTH };
  return { type: "text", value: trimmed };
}
