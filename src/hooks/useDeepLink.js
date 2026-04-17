"use client";
import { useEffect, useState } from "react";
import { parseDeepLink, verifyDeepLink } from "../lib/deeplink";

export function useDeepLink() {
  const [link, setLink] = useState(null);
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const parsed = parseDeepLink(params);
    setLink(parsed);
    if (parsed) verifyDeepLink(parsed).then(setVerified);
  }, []);

  return { link, verified };
}
