import { cn } from "@/lib/utils";

/**
 * PreStream brand mark — v5 flat cut.
 *
 * A flat rose squircle carrying a bold play triangle with a rounded
 * "stream" bar beneath it — play over stream, the whole brand in two
 * shapes. Deliberately flat (no gradient, sheen or sparkle): it stays
 * crisp from a 16px favicon to print, and reads instantly on any of the
 * 40 themes because the badge color is fixed, not theme-aware.
 * Rendered inline so it scales losslessly.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {/* badge — one flat brand color, fixed across all themes */}
      <rect x="3" y="3" width="42" height="42" rx="13" fill="#e11d48" />
      {/* play — white, rounded joins for crisp small sizes */}
      <path
        d="M17.3 12.3 30.7 21.1 17.3 29.9Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      {/* the stream — a rounded bar flowing under the play */}
      <rect x="15.2" y="34.3" width="17.6" height="3.1" rx="1.55" fill="#fff" />
    </svg>
  );
}

/** Full logo — mark + tight wordmark in the display voice (Cabinet Grotesk). */
export function PreStreamLogo({ className }: { className?: string }) {
  return (
    <span className={cn("group flex items-center gap-2", className)}>
      <span className="relative">
        <LogoMark className="size-9 transition-transform duration-200 group-hover:scale-105 group-active:scale-95" />
      </span>
      <span
        className="font-display text-[19px] font-bold tracking-tight text-foreground"
      >
        PreStream
      </span>
    </span>
  );
}
