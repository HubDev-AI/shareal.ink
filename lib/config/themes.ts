/** Surface page theme — controls background, card style, and overlays */
export interface SurfaceTheme {
  /** CSS class for the page background */
  background: string;
  /** CSS class for the card container */
  card: string;
  /** Show grain texture overlay */
  grain: boolean;
  /** Max width class for the card (responsive) */
  cardWidth: string;
  /** Branding colors */
  accent: string;
  /** Text-only surface: title style */
  textTitle: string;
  /** Text-only surface: decorative quote color */
  quoteAccent: string;
}

/** Default aurora + liquid glass theme */
export const defaultTheme: SurfaceTheme = {
  background: "bg-aurora",
  card: "glass-surface",
  grain: true,
  cardWidth: "w-full max-w-[94vw] sm:max-w-4xl",
  accent: "text-cyan-400",
  textTitle: "text-[28px] sm:text-[38px] font-medium leading-relaxed tracking-[-0.01em]",
  quoteAccent: "text-cyan-500/40",
};
