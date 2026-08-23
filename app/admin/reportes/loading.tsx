import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-7 w-28" />

      <div>
        <Skeleton className="mb-2 h-4 w-48" />
        <TableSkeleton cols={4} rows={4} />
      </div>

      <div>
        <Skeleton className="mb-2 h-4 w-56" />
        <TableSkeleton cols={6} rows={5} />
      </div>

      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-3 h-20 w-full rounded-xl" />
        <TableSkeleton cols={2} rows={4} />
      </div>
    </div>
  );
}
