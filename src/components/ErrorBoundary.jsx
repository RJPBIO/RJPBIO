"use client";
import { Component } from "react";
import { resolveTheme, ty, space, radius } from "../lib/theme";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[BIO-IGNICIÓN] Component error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const { fallback, isDark } = this.props;
      if (fallback) return fallback;

      const { card, border, t2, t3 } = resolveTheme(isDark ?? false);
      return (
        <div style={{
          padding: space[4],
          margin: `${space[2]}px 0`,
          background: card,
          border: `1px solid ${border}`,
          borderRadius: radius.md,
          textAlign: "center",
        }}>
          <div style={ty.caption(t3)}>Componente no disponible</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: space[2],
              padding: `${space[1]}px ${space[3]}px`,
              borderRadius: radius.sm,
              border: `1px solid ${border}`,
              background: "transparent",
              color: t2,
              ...ty.caption(t2),
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
