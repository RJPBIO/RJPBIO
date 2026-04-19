"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLink({ href, children, style, activeStyle }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href + "/"));
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      style={active ? { ...style, ...activeStyle } : style}
    >
      {children}
    </Link>
  );
}
