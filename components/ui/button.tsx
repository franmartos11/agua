import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "default" | "sm";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "bg-card text-foreground border border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
  danger: "bg-danger-soft text-danger hover:opacity-80",
};

const sizes: Record<Size, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export function buttonVariants({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
