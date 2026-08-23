import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 2.5c3 4.2 7 8.6 7 12.7a7 7 0 1 1-14 0c0-4.1 4-8.5 7-12.7Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
