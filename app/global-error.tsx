"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#040c1f", fontFamily: "system-ui, sans-serif" }}>
        <main style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", padding: "1rem", textAlign: "center",
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.75rem", maxWidth: "28rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
            An unexpected error occurred. Please try again.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{
                borderRadius: "0.75rem", backgroundColor: "#fff", padding: "0.625rem 1.5rem",
                fontSize: "0.875rem", fontWeight: 600, color: "#040c1f", border: "none", cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 500,
                color: "rgba(255,255,255,0.6)", textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
