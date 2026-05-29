import React, { useEffect, useState } from "react";
import { APP_NAME, APP_VERSION } from "@webassembly-ide/shared";

export function StartupSplash({ minDurationMs = 5600 }: { minDurationMs?: number }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(Boolean(prefersReducedMotion));
    const holdMs = Math.max(minDurationMs, prefersReducedMotion ? 5200 : 5600);
    const fadeMs = prefersReducedMotion ? 120 : 520;
    const hold = window.setTimeout(() => setLeaving(true), holdMs);
    const remove = window.setTimeout(() => setVisible(false), holdMs + fadeMs);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(remove);
    };
  }, [minDurationMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} is loading`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 30% 20%, rgba(86,156,214,0.28), transparent 28%), radial-gradient(circle at 70% 65%, rgba(78,201,176,0.20), transparent 34%), linear-gradient(135deg, #08111f 0%, #0b1020 42%, #111827 100%)",
        color: "#f8fafc",
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.012)" : "scale(1)",
        transition: reducedMotion ? "opacity 120ms ease" : "opacity 520ms ease, transform 520ms ease",
        pointerEvents: "none",
      }}
    >
      <style>
        {`@keyframes ideSplashOrbit{to{transform:rotate(360deg)}}@keyframes ideSplashPulse{0%,100%{opacity:.45;transform:scale(.94)}50%{opacity:1;transform:scale(1)}}@keyframes ideSplashFill{0%{transform:scaleX(.08);opacity:.72}55%{transform:scaleX(.72);opacity:.96}100%{transform:scaleX(1);opacity:1}}@keyframes ideSplashSweep{0%{left:-70%}100%{left:100%}}@media (prefers-reduced-motion: reduce){.ide-splash-motion{animation:none!important}}`}
      </style>
      <div style={{ width: 420, maxWidth: "86vw", textAlign: "center" }}>
        <div
          style={{
            width: 132,
            height: 132,
            margin: "0 auto 26px",
            position: "relative",
            borderRadius: 32,
            background: "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.78))",
            boxShadow: "0 28px 80px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            className="ide-splash-motion"
            style={{
              position: "absolute",
              inset: -36,
              background: "conic-gradient(from 0deg, transparent, #4ec9b0, #569cd6, #bd93f9, transparent)",
              animation: "ideSplashOrbit 2.4s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 3,
              borderRadius: 29,
              background: "linear-gradient(145deg, #0f172a, #111827)",
            }}
          />
          <div
            className="ide-splash-motion"
            style={{
              position: "absolute",
              inset: 24,
              borderRadius: 22,
              display: "grid",
              placeItems: "center",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: -2,
              color: "#dbeafe",
              background: "linear-gradient(135deg, rgba(86,156,214,0.25), rgba(78,201,176,0.18))",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
              animation: "ideSplashPulse 2s ease-in-out infinite",
            }}
          >
            WA
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8 }}>
          {APP_NAME}
        </div>
        <div style={{ marginTop: 8, color: "rgba(226,232,240,0.72)", fontSize: 13 }}>
          AI-native WebAssembly workspace initializing · v{APP_VERSION}
        </div>
        <div
          style={{
            position: "relative",
            height: 3,
            margin: "28px auto 0",
            width: 260,
            maxWidth: "70vw",
            overflow: "hidden",
            borderRadius: 999,
            background: "rgba(148,163,184,0.18)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "left center",
              borderRadius: 999,
              background: "linear-gradient(90deg, #4ec9b0, #569cd6, #bd93f9)",
              animation: reducedMotion ? "none" : "ideSplashFill 5.6s cubic-bezier(.2,.7,.2,1) forwards",
              transform: reducedMotion ? "scaleX(1)" : undefined,
            }}
          />
          <div
            className="ide-splash-motion"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "-70%",
              width: "70%",
              borderRadius: 999,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.68), transparent)",
              animation: "ideSplashSweep 1.25s cubic-bezier(.65,0,.35,1) infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
