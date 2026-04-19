"use client";

export function ConfirmForm({ action, message, children, ...rest }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (typeof window !== "undefined" && !window.confirm(message)) {
          e.preventDefault();
        }
      }}
      {...rest}
    >
      {children}
    </form>
  );
}
