import { cn } from "@/lib/utils";

/**
 * PreStream brand mark — v3 "Aurora" cut.
 *
 * A squircle badge carrying the brand's rose→amber gradient (kept as a
 * fixed asset: the logo keeps its identity across the 40 themes), with a
 * bold "P" whose bowl is a play triangle (Pre + Play), a warm gold
 * sparkle, and a new deep inner rim that reads crisply on the dark stage.
 * Rendered inline so gradients stay sharp at any size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="prestream-badge"
          x1="8"
          y1="4"
          x2="42"
          y2="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="0.45" stopColor="#e11d48" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient
          id="prestream-rim"
          x1="24"
          y1="3"
          x2="24"
          y2="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* badge */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="13"
        fill="url(#prestream-badge)"
      />
      {/* inner rim for depth on dark stages */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="13"
        fill="url(#prestream-rim)"
      />
      {/* top-edge sheen */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="13"
        fill="#fff"
        fillOpacity="0.08"
        style={{ clipPath: "inset(0 0 62% 0 round 13px)" }}
      />
      {/* P stem */}
      <path
        d="M16.5 13.5v21"
        stroke="#fff"
        strokeWidth="5.6"
        strokeLinecap="round"
      />
      {/* P bowl — a play triangle */}
      <path
        d="M20.4 14.6 33.2 20.4 20.4 26.2Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* sparkle */}
      <path
        d="M36.2 6.2l1 3.5 3.5 1-3.5 1-1 3.5-1-3.5-3.5-1 3.5-1Z"
        fill="#fde68a"
      />
    </svg>
  );
}

/** Full logo — mark + wordmark in the display voice, "Stream" in brand gradient. */
export function PreStreamLogo({ className }: { className?: string }) {
  return (
    <span className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative">
        <LogoMark className="size-9 transition-transform duration-200 group-hover:scale-105 group-active:scale-95" />
        {/* soft brand glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-rose-500/35 blur-lg"
        />
      </span>
      <span
        className="text-lg font-bold tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-heading, var(--font-space-grotesk)), sans-serif" }}
      >
        Pre
        <span className="text-brand-gradient">Stream</span>
      </span>
    </span>
  );
}
