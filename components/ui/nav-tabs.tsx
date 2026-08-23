"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavTabs({ links }: { links: { href: string; label: string }[] }) {
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
              "border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
