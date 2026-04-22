"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const ROUTES = {
  "/":                 ["/pricing", "/signin", "/demo"],
  "/pricing":          ["/signup", "/demo", "/trust"],
  "/demo":             ["/signup", "/pricing"],
  "/signin":           ["/signup", "/recover"],
  "/signup":           ["/signin", "/pricing"],
  "/docs":             ["/signin"],
  "/trust":            ["/trust/subprocessors", "/privacy"],
  "/roi-calculator":   ["/demo", "/pricing"],
};

export default function PrefetchCritical() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    const targets = ROUTES[pathname];
    if (!targets?.length) return;
    const idle = typeof requestIdleCallback === "function"
      ? requestIdleCallback
      : (fn) => setTimeout(fn, 400);
    const id = idle(() => {
      for (const r of targets) {
        try { router.prefetch(r); } catch {}
      }
    }, { timeout: 1500 });
    return () => {
      try {
        if (typeof cancelIdleCallback === "function") cancelIdleCallback(id);
        else clearTimeout(id);
      } catch {}
    };
  }, [pathname, router]);

  return null;
}
