/* DimensionsRow.test — Phase 6H Premium-Fix1 B4 logic.
   Cubre comportamiento legacy (sin sources prop) y nuevo (con sources). */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import DimensionsRow from "./DimensionsRow";

afterEach(() => cleanup());

describe("DimensionsRow — modo legacy (compat existing)", () => {
  it("renderea las 3 dimensiones cuando no se pasa sources prop", () => {
    render(<DimensionsRow focus={60} calm={50} energy={70} />);
    expect(document.querySelectorAll("[data-v2-dim]")).toHaveLength(3);
    expect(document.querySelector('[data-v2-dim="foco"]')).toBeTruthy();
    expect(document.querySelector('[data-v2-dim="calma"]')).toBeTruthy();
    expect(document.querySelector('[data-v2-dim="energia"]')).toBeTruthy();
  });

  it("data-source es 'measured' por default cuando sources prop ausente", () => {
    render(<DimensionsRow focus={60} calm={50} energy={70} />);
    document.querySelectorAll("[data-v2-dim]").forEach((el) => {
      expect(el.getAttribute("data-source")).toBe("measured");
    });
  });

  it("NO renderea ESTIMADO descriptor en modo legacy", () => {
    render(<DimensionsRow focus={60} calm={50} energy={70} />);
    expect(document.querySelectorAll("[data-v2-dim-source-tag]")).toHaveLength(0);
  });
});

describe("DimensionsRow — Phase 6H Premium-Fix1 con sources prop", () => {
  it("all measured → 3 dimensiones visibles, sin ESTIMADO", () => {
    render(
      <DimensionsRow
        focus={75}
        calm={60}
        energy={80}
        sources={{ foco: "measured", calma: "measured", energia: "measured" }}
      />
    );
    expect(document.querySelectorAll("[data-v2-dim]")).toHaveLength(3);
    expect(document.querySelectorAll("[data-v2-dim-source-tag]")).toHaveLength(0);
  });

  it("1 measured + 2 fallback → solo 1 dimension visible (grid 1fr)", () => {
    render(
      <DimensionsRow
        focus={75}
        calm={50}
        energy={50}
        sources={{ foco: "measured", calma: "fallback", energia: "fallback" }}
      />
    );
    const dims = document.querySelectorAll("[data-v2-dim]");
    expect(dims).toHaveLength(1);
    expect(dims[0].getAttribute("data-v2-dim")).toBe("foco");
    const section = document.querySelector("[data-v2-dimensions]");
    expect(section.style.gridTemplateColumns).toBe("repeat(1, 1fr)");
  });

  it("all fallback → componente entero retorna null (NO renderea row vacío)", () => {
    const { container } = render(
      <DimensionsRow
        focus={50}
        calm={50}
        energy={50}
        sources={{ foco: "fallback", calma: "fallback", energia: "fallback" }}
      />
    );
    expect(container.querySelector("[data-v2-dimensions]")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("partial source → muestra ESTIMADO descriptor", () => {
    render(
      <DimensionsRow
        focus={66}
        calm={50}
        energy={50}
        sources={{ foco: "partial", calma: "measured", energia: "measured" }}
      />
    );
    const fooDim = document.querySelector('[data-v2-dim="foco"]');
    expect(fooDim.getAttribute("data-source")).toBe("partial");
    expect(fooDim.querySelector("[data-v2-dim-source-tag]")).toBeTruthy();
    expect(fooDim.querySelector("[data-v2-dim-source-tag]").textContent).toMatch(/ESTIMADO/i);
    // Las measured no tienen tag.
    const calmaDim = document.querySelector('[data-v2-dim="calma"]');
    expect(calmaDim.querySelector("[data-v2-dim-source-tag]")).toBeNull();
  });

  it("2 measured + 1 partial → grid 3fr, partial muestra tag", () => {
    render(
      <DimensionsRow
        focus={70}
        calm={66}
        energy={80}
        sources={{ foco: "measured", calma: "partial", energia: "measured" }}
      />
    );
    expect(document.querySelectorAll("[data-v2-dim]")).toHaveLength(3);
    const section = document.querySelector("[data-v2-dimensions]");
    expect(section.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(document.querySelectorAll("[data-v2-dim-source-tag]")).toHaveLength(1);
  });

  it("mix partial + fallback → fallback oculta, partial muestra tag (grid 2fr)", () => {
    render(
      <DimensionsRow
        focus={70}
        calm={50}
        energy={66}
        sources={{ foco: "measured", calma: "fallback", energia: "partial" }}
      />
    );
    const dims = document.querySelectorAll("[data-v2-dim]");
    expect(dims).toHaveLength(2);
    const section = document.querySelector("[data-v2-dimensions]");
    expect(section.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
    expect(document.querySelectorAll("[data-v2-dim-source-tag]")).toHaveLength(1);
  });
});
