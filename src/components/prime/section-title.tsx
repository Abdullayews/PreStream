import { cn } from "@/lib/utils";

/**
 * Section heading — Aurora cut. An eyebrow-style heading in the display
 * voice with a small primary accent wedge on the leading edge (theme
 * colored, so active themes color the shelves too). The wedge uses a
 * gradient fade toward the text so it reads as a "spotlight beam".
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
        className="h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-primary/20"
      />
      {children}
    </Tag>
  );
}
