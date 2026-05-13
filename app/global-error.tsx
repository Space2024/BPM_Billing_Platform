"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          textAlign: "center",
        }}>
          <div style={{
            borderTop: "3px solid #1d4ed8",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
          }} />
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</p>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "360px", margin: "0 0 1.5rem" }}>
            We couldn&apos;t load the page. Please try again or contact support if the issue persists.
          </p>
          {error?.digest && (
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <div style={{
            borderBottom: "3px solid #1d4ed8",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
          }} />
        </div>
      </body>
    </html>
  );
}
