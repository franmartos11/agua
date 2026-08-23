import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-32" />

      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-20 flex-1 min-w-[10rem] rounded-xl" />
        <Skeleton className="h-20 flex-1 min-w-[10rem] rounded-xl" />
        <Skeleton className="h-20 flex-1 min-w-[10rem] rounded-xl" />
        <Skeleton className="h-20 flex-1 min-w-[10rem] rounded-xl" />
      </div>

      <div>
        <Skeleton className="mb-2 h-4 w-28" />
        <TableSkeleton cols={6} rows={4} />
      </div>

      <div>
        <Skeleton className="mb-2 h-4 w-40" />
        <TableSkeleton cols={3} rows={5} />
      </div>
    </div>
  );
}
