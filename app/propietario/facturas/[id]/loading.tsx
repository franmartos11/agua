import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-40 w-full rounded-2xl" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="lg:col-start-2 lg:row-start-1">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="lg:col-start-1 lg:row-start-1 flex flex-col gap-6">
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
