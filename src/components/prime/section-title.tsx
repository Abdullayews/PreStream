import { cn } from "@/lib/utils";

/**
 * Section heading — Basement cut: display voice (Cabinet Grotesk), bold,
 * tight tracking, no ornament. Hierarchy comes from size and weight.
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
        "font-display text-[22px] leading-tight font-bold tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
