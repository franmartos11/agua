"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavTabs({
  links,
}: {
  links: { href: string; label: string; badge?: number }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="print:hidden flex gap-1 overflow-x-auto whitespace-nowrap border-b border-border bg-card px-4 sm:px-6">
      {links.map((link) => {
        const active =
          link.href === pathname ||
          (link.href !== "/admin" && link.href !== "/propietario" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
            {link.badge !== undefined && link.badge > 0 && (
              <span className="absolute -top-0.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {link.badge > 9 ? "9+" : link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
