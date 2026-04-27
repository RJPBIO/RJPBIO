"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SegmentedNav({ items, ariaLabel = "Sub-navegación" }) {
  const pathname = usePathname();
  return (
    <nav aria-label={ariaLabel} className="bi-admin-segnav">
      {items.map((it) => {
        const active = pathname === it.href || (it.matchPrefix && pathname?.startsWith(it.href + "/"));
        return (
          <Link
            key={it.href}
            href={it.href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={`bi-admin-segnav-item${active ? " bi-admin-segnav-item-active" : ""}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
