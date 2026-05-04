"use client";
/* DaysSelector — Phase 6F SP-D
   Client component aislado: select que dispara navegación a la misma
   página con ?days=N. Mantiene el resto del árbol server-side. */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cssVar, font, radius, space } from "@/components/ui/tokens";

const OPTIONS = [
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
  { value: 180, label: "180 días" },
  { value: 365, label: "1 año" },
];

export default function DaysSelector({ current = 90 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("days", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <label
      data-v2-days-selector
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: cssVar.fontMono,
        fontSize: font.size.xs,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: cssVar.textDim,
        fontWeight: font.weight.semibold,
      }}
    >
      Periodo
      <select
        defaultValue={String(current)}
        onChange={handleChange}
        data-testid="days-selector"
        style={{
          appearance: "none",
          background: cssVar.surface,
          color: cssVar.text,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.sm,
          padding: `${space[2]}px ${space[3]}px`,
          fontFamily: cssVar.fontMono,
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
          cursor: "pointer",
        }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
