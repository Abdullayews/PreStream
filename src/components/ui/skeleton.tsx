import { cn } from "@/lib/utils"

/**
 * Aurora skeleton — a soft pulse PLUS a slow diagonal shimmer sweep, so
 * loading states feel like light moving across the stage instead of a
 * bare blinking block. The sweep is a ::before overlay driven by the
 * `shimmer-sweep` keyframes in globals.css (transform-only, GPU cheap).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-accent animate-pulse rounded-lg",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-none",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/8 before:to-transparent",
        "before:[animation:shimmer-sweep_1.8s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
