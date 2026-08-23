import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <TableSkeleton cols={3} rows={6} />
    </div>
  );
}
