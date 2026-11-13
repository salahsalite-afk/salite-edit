import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import "./SafetyCard"; // lädt Anton und Inter

// Reduzierte Sicherheitskarte für den Beamer: nur ein paar Sekunden im Bild, daher
// ein großes Bild, vier Schlagworte mit Piktogramm, keine Erklärsätze. 16:9.
export const BEAMER_CLEAN = { fps: 30, width: 1920, height: 1080, frames: 180 };

const C = { paper: "#F4EEDF", ink: "#1E1A17", muted: "#7A6F64", red: "#E3120B" };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const SET = staticFile("card/set_full.png"); // 523x1222

const Icon: React.FC<{ kind: "airbag" | "drop" | "snow" | "shield" }> = ({ kind }) => {
  const s = { fill: "none", stroke: C.ink, strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={92} height={92} viewBox="-46 -46 92 92">
      <circle r={42} fill="none" stroke={C.ink} strokeWidth={4} />
      {kind === "airbag" && (
        <>
          <ellipse rx={24} ry={15} cy={-2} {...s} />
          <path d="M-14 13 L-18 24 L18 24 L14 13" {...s} />
        </>
      )}
      {kind === "drop" && <path d="M0 -24 C10 -10 18 0 18 9 A18 18 0 0 1 -18 9 C-18 0 -10 -10 0 -24 Z" {...s} />}
      {kind === "snow" && (
        <>
          {[0, 60, 120].map((a) => (
            <path key={a} d="M0 -24 L0 24" {...s} transform={`rotate(${a})`} />
          ))}
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M-7 -17 L0 -10 L7 -17" {...s} transform={`rotate(${a})`} />
          ))}
        </>
      )}
      {kind === "shield" && (
        <>
          <path d="M0 -25 L21 -17 L21 2 C21 15 11 22 0 27 C-11 22 -21 15 -21 2 L-21 -17 Z" {...s} />
          <path d="M-9 1 L-2 8 L10 -6" {...s} />
        </>
      )}
    </svg>
  );
};

export const SafetyBeamerClean: React.FC = () => {
  const f = useCurrentFrame();
  const a = (start: number, len = 14) => interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: OUT });

  // Set mittig
  const sh = 860;
  const sw = (sh * 523) / 1222;
  const sx = 960 - sw / 2;
  const sy = 168;
  const setIn = a(4, 18);

  const items: { kind: "airbag" | "drop" | "snow" | "shield"; label: string; side: -1 | 1; y: number; nx: number; ny: number; at: number }[] = [
    { kind: "airbag", label: "AIRBAG-TASCHE", side: -1, y: 400, nx: 0.42, ny: 0.31, at: 22 },
    { kind: "snow", label: "KEINE WINTERJACKE", side: 1, y: 400, nx: 0.82, ny: 0.22, at: 32 },
    { kind: "drop", label: "WASSERDICHT", side: -1, y: 780, nx: 0.28, ny: 0.78, at: 42 },
    { kind: "shield", label: "BULLETPROOF*", side: 1, y: 780, nx: 0.72, ny: 0.68, at: 52 },
  ];
  const LX = 700; // Ende der linken Spalte
  const RX = 1220; // Anfang der rechten Spalte

  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {/* Kopf */}
      <div style={{ position: "absolute", left: 64, top: 52, opacity: a(0) }}>
        <div style={{ fontFamily: "'Anton'", fontSize: 72, lineHeight: 0.95, color: C.ink }}>SICHERHEITSHINWEISE</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 20, letterSpacing: "0.24em", color: C.red, marginTop: 10 }}>SAFETY INSTRUCTIONS</div>
      </div>
      <div style={{ position: "absolute", right: 64, top: 58, textAlign: "right", opacity: a(0) }}>
        <div style={{ display: "inline-block", background: C.ink, color: C.paper, fontFamily: "'Anton'", fontSize: 40, letterSpacing: "0.06em", padding: "8px 22px 6px", borderRadius: 8 }}>
          FIRST CLASS ONLY
        </div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 20, letterSpacing: "0.24em", color: C.ink, marginTop: 12 }}>LETZTE AUSGABE</div>
      </div>

      {/* Set */}
      <Img src={SET} style={{ position: "absolute", left: sx, top: sy + (1 - setIn) * 24, width: sw, height: sh, opacity: setIn }} />

      {/* Hinweislinien */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {items.map((it, i) => {
          const p = a(it.at, 12);
          const x0 = sx + it.nx * sw;
          const y0 = sy + it.ny * sh;
          const x1 = it.side < 0 ? LX + 20 : RX - 20;
          const len = Math.hypot(x1 - x0, it.y - y0);
          return (
            <g key={i}>
              <line x1={x0} y1={y0} x2={x1} y2={it.y} stroke={C.ink} strokeWidth={2.5} strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
              <circle cx={x0} cy={y0} r={8} fill={C.red} stroke={C.paper} strokeWidth={3} opacity={p} />
            </g>
          );
        })}
      </svg>

      {/* Schlagworte */}
      {items.map((it, i) => {
        const p = a(it.at + 6, 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: it.y - 46,
              ...(it.side < 0 ? { right: 1920 - LX } : { left: RX }),
              display: "flex",
              flexDirection: it.side < 0 ? "row-reverse" : "row",
              alignItems: "center",
              gap: 22,
              opacity: p,
              transform: `translateX(${(1 - p) * 20 * it.side}px)`,
            }}
          >
            <Icon kind={it.kind} />
            <div style={{ fontFamily: "'Anton'", fontSize: 56, color: C.ink, lineHeight: 1, whiteSpace: "nowrap" }}>{it.label}</div>
          </div>
        );
      })}

      {/* Fuß */}
      <div style={{ position: "absolute", right: 64, bottom: 34, fontFamily: "'Inter'", fontWeight: 600, fontSize: 15, color: C.muted, opacity: a(70) }}>
        *Satire. Ersetzt weder Gurt noch Airbag.
      </div>
    </AbsoluteFill>
  );
};
