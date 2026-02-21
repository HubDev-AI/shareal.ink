export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-xs font-medium uppercase tracking-[0.2em] text-white ${className ?? ""}`}
      style={{ animation: "label-breathe 6s ease-in-out infinite" }}
    >
      <span className="relative py-3 px-4" style={{ overflow: "visible" }}>
        Apps are coming

        {/* Apple — orbits clockwise */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ overflow: "visible" }}>
          <span style={{ animation: "orbit 22s linear infinite", ["--orbit-r" as string]: "22px" }}>
            <AppleIcon />
          </span>
        </span>

        {/* Android — 180° offset */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ overflow: "visible" }}>
          <span style={{ animation: "orbit 22s linear infinite", animationDelay: "-11s", ["--orbit-r" as string]: "22px" }}>
            <AndroidIcon />
          </span>
        </span>
      </span>
    </span>
  );
}

function AppleIcon() {
  return (
    <svg width="14" height="17" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.532 15.106a1.003 1.003 0 1 1 .001-2.007 1.003 1.003 0 0 1 0 2.007m-11.063 0a1.003 1.003 0 1 1 .001-2.007 1.003 1.003 0 0 1 0 2.007m11.372-4.458 2.005-3.474a.416.416 0 0 0-.152-.567.416.416 0 0 0-.568.152L17.09 10.3a12.573 12.573 0 0 0-5.09-1.06 12.573 12.573 0 0 0-5.09 1.06L4.874 6.76a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.567l2.005 3.474A11.372 11.372 0 0 0 .792 17.394h22.417a11.372 11.372 0 0 0-5.368-6.746" />
    </svg>
  );
}
