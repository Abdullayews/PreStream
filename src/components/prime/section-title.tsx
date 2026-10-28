import { cn } from "@/lib/utils";

/**
 * Section heading — big, bold, with a small primary accent tick on the
 * leading edge (theme-colored, so active themes color the shelves too).
 * `text-xl font-semibold tracking-tight` per the design system.
 */
export function SectionTitle({
  children,
  className,
  as: Tag = "h3",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
}) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="h-5 w-1 shrink-0 rounded-full bg-primary/90"
      />
      {children}
    </Tag>
  );
}
