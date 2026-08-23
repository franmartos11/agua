import { cn } from "@/lib/cn";

type Variant = "neutral" | "success" | "warning" | "danger" | "info";

const variants: Record<Variant, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-primary-soft text-primary",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

const ESTADO_VARIANT: Record<string, Variant> = {
  pendiente: "warning",
  parcial: "info",
  pagada: "success",
  vencida: "danger",
  ocupado: "success",
  vacio: "neutral",
  construccion: "warning",
  abierto: "info",
  cerrado: "neutral",
  activo: "success",
  inactivo: "neutral",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return <Badge variant={ESTADO_VARIANT[estado] ?? "neutral"}>{estado}</Badge>;
}
