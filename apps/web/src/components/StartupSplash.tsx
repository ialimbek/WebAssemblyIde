import { useEffect, useState } from "react";
import { APP_NAME, APP_VERSION } from "@webassembly-ide/shared";

export function StartupSplash({ minDurationMs }: { minDurationMs?: number }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [durationMs] = useState(() =>
    minDurationMs ?? 3000 + Math.floor(Math.random() * 2001),
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(Boolean(prefersReducedMotion));
    const holdMs = Math.max(3000, Math.min(5000, durationMs));
    const fadeMs = prefersReducedMotion ? 120 : 520;

    // Animate progress from 0 to 100 over holdMs using requestAnimationFrame
    const startTime = Date.now();
    let animFrame: number;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / holdMs) * 100));
      setProgress(pct);
      if (pct < 100) {
        animFrame = requestAnimationFrame(tick);
      }
    };
    animFrame = requestAnimationFrame(tick);

    const hold = window.setTimeout(() => setLeaving(true), holdMs);
    const remove = window.setTimeout(() => setVisible(false), holdMs + fadeMs);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(remove);
      cancelAnimationFrame(animFrame);
    };
  }, [durationMs]);

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
        pointerEvents: "auto",
        cursor: "default",
        userSelect: "none",
      }}
    >
      <style>
        {`@keyframes ideSplashOrbit{to{transform:rotate(360deg)}}@keyframes ideSplashPulse{0%,100%{opacity:.45;transform:scale(.94)}50%{opacity:1;transform:scale(1)}}@keyframes ideSplashSweep{0%{left:-70%}100%{left:100%}}@media (prefers-reduced-motion: reduce){.ide-splash-motion{animation:none!important}}`}
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
              animation: reducedMotion ? "none" : "ideSplashOrbit 2.4s linear infinite",
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
              animation: reducedMotion ? "none" : "ideSplashPulse 2s ease-in-out infinite",
            }}
          >
            CB
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8 }}>
          {APP_NAME}
        </div>
        <div style={{ marginTop: 8, color: "rgba(226,232,240,0.72)", fontSize: 13 }}>
          AI-native coding workspace initializing · v{APP_VERSION}
        </div>
        <div
          style={{
            position: "relative",
            height: 4,
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
              top: 0,
              left: 0,
              bottom: 0,
              width: `${progress}%`,
              borderRadius: 999,
              background: "linear-gradient(90deg, #4ec9b0, #569cd6, #bd93f9)",
              transition: reducedMotion ? "none" : "width 80ms linear",
            }}
          />
          {!reducedMotion && (
            <div
              className="ide-splash-motion"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "-70%",
                width: "70%",
                borderRadius: 999,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                animation: "ideSplashSweep 1.25s cubic-bezier(.65,0,.35,1) infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
