"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLink({ href, children, style, activeStyle, className, activeClassName }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href + "/"));
  const classes = [className, active && activeClassName].filter(Boolean).join(" ") || undefined;
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={classes}
      style={active && activeStyle ? { ...style, ...activeStyle } : style}
    >
      {children}
    </Link>
  );
}
