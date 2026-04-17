"use client";
import { Component } from "react";
import { logger } from "../lib/logger";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    logger.error("boundary.catch", {
      name: err?.name,
      message: err?.message,
      stack: info?.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ err: null });
    try {
      location.reload();
    } catch {}
  };

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <section
        role="alert"
        aria-live="assertive"
        style={{
          minBlockSize: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0B0E14",
          color: "#ECFDF5",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxInlineSize: 420,
            textAlign: "center",
            padding: 32,
            border: "1px solid #064E3B",
            borderRadius: 24,
            background: "rgba(5,150,105,.08)",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Algo salió del flujo</h1>
          <p style={{ margin: "0 0 20px", color: "#A7F3D0", lineHeight: 1.5 }}>
            Tu progreso está guardado. Podemos reintentarlo sin perder nada.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            aria-label="Reintentar: recargar aplicación"
            style={{
              border: 0,
              borderRadius: 999,
              paddingBlock: 12,
              paddingInline: 22,
              fontWeight: 700,
              background: "linear-gradient(135deg,#059669,#10B981)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }
}
