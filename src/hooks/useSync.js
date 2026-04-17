"use client";
import { useEffect } from "react";
import { wireBackgroundSync, flushOutbox } from "../lib/sync";

export function useSync() {
  useEffect(() => {
    wireBackgroundSync();
    const onOnline = () => flushOutbox().catch(() => {});
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
}
