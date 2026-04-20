"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

/* VideoPreview — si `src` se provee renderiza el modal con iframe.
   Sin `src`, degrada honesto a un Link al /demo en vivo (ninguna
   promesa de video inexistente). */
export default function VideoPreview({
  label = "Verlo en 90 segundos",
  src,
  title = "BIO-IGNICIÓN · 90s overview",
  fallbackLabel = "Agendar demo en vivo · 30 min",
  fallbackHref = "/demo",
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!src) {
    return (
      <Link href={fallbackHref} className="bi-video-cta">
        <span className="play" aria-hidden>▶</span>
        {fallbackLabel}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className="bi-video-cta"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="play" aria-hidden>▶</span>
        {label}
      </button>

      {open && (
        <div
          className="bi-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bi-video-modal-body">
            <button
              type="button"
              className="bi-video-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <iframe
              src={src}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>
      )}
    </>
  );
}
