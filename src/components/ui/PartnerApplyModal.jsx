"use client";
import { useState, useEffect, useRef } from "react";
import DemoForm from "@/app/demo/DemoForm";

export default function PartnerApplyModal({
  triggerLabel,
  chipLabel,
  dialogTitle,
  dialogBody,
  locale = "es",
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="bi-partner-trigger"
      >
        <span>{triggerLabel}</span>
        {chipLabel && <span className="bi-partner-trigger-chip" aria-hidden>{chipLabel}</span>}
      </button>

      {open && (
        <div
          className="bi-partner-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-dialog-title"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bi-partner-modal-body">
            <button
              ref={closeRef}
              type="button"
              className="bi-partner-modal-close"
              onClick={() => setOpen(false)}
              aria-label={locale === "en" ? "Close" : "Cerrar"}
            >
              ×
            </button>
            <div className="bi-partner-modal-header">
              <h2 id="partner-dialog-title">{dialogTitle}</h2>
              {dialogBody && <p>{dialogBody}</p>}
              {chipLabel && <span className="chip">{chipLabel}</span>}
            </div>
            <DemoForm source="design-partner" locale={locale} />
          </div>
        </div>
      )}
    </>
  );
}
