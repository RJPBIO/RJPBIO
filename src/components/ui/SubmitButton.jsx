"use client";
import { useState } from "react";
import { Button } from "./Button";

export default function SubmitButton({ loadingLabel = "Procesando…", onClick, children, ...props }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="submit"
      loading={pending}
      loadingLabel={loadingLabel}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const form = e.currentTarget.form;
        if (form && !form.checkValidity()) return;
        setPending(true);
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
