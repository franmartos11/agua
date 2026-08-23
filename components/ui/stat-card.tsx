import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <Card className="flex-1 min-w-[10rem]">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", toneClass)}>{value}</p>
    </Card>
  );
}
