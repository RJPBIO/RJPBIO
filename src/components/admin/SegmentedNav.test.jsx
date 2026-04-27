import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SegmentedNav from "./SegmentedNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/security/policies",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, className, ...rest }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}));

const ITEMS = [
  { href: "/admin/security/policies", label: "Políticas" },
  { href: "/admin/security/sessions", label: "Sesiones" },
  { href: "/admin/security", label: "Reset MFA" },
];

describe("SegmentedNav", () => {
  it("renders all items", () => {
    render(<SegmentedNav items={ITEMS} />);
    expect(screen.getByText("Políticas")).toBeInTheDocument();
    expect(screen.getByText("Sesiones")).toBeInTheDocument();
    expect(screen.getByText("Reset MFA")).toBeInTheDocument();
  });

  it("marks active item via class + aria-current", () => {
    render(<SegmentedNav items={ITEMS} />);
    const active = screen.getByText("Políticas").closest("a");
    expect(active).toHaveClass("bi-admin-segnav-item-active");
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("non-active items lack the active class", () => {
    render(<SegmentedNav items={ITEMS} />);
    const inactive = screen.getByText("Sesiones").closest("a");
    expect(inactive).not.toHaveClass("bi-admin-segnav-item-active");
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("has accessible aria-label on nav", () => {
    render(<SegmentedNav items={ITEMS} ariaLabel="Test nav" />);
    expect(screen.getByLabelText("Test nav")).toBeInTheDocument();
  });
});
