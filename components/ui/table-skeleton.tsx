import { Skeleton } from "@/components/ui/skeleton";
import { tableWrapClass, theadRowClass, thClass } from "@/components/ui/table";

export function TableSkeleton({ cols = 4, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className={tableWrapClass}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={theadRowClass}>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className={thClass}>
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[8rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
