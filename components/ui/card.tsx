import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm print:border-0 print:p-0 print:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
