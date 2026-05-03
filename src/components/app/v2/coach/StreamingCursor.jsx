"use client";

// Cursor blink "|" 1s steady, no easing — el blink uniforme lee como
// terminal/IDE, NO como animacion decorativa.

export default function StreamingCursor() {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          marginInlineStart: 1,
          width: 8,
          color: "rgba(255,255,255,0.96)",
          fontFamily: "inherit",
          fontWeight: 200,
          animation: "v2CoachCursorBlink 1s steps(2, jump-none) infinite",
        }}
      >
        |
      </span>
      <style jsx global>{`
        @keyframes v2CoachCursorBlink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
