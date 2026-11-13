import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CC, ComicScene, OUT, SCENES, clamp } from "./comicScenes";

// Zwei Beamer-Versionen der Comic-Sicherheitskarte (16:9, 30 fps):
// SafetyComicCard: dezenter, eine Karte mit vier Feldern und Bordkarten-Leiste.
// SafetyComicSlides: Slideshow, sechs Folien nacheinander, harter Schnitt, je 3 Sekunden.
export const COMIC_CARD = { fps: 30, width: 1920, height: 1080, frames: 270 };
export const SLIDE_LEN = 90;
export const COMIC_SLIDES = { fps: 30, width: 1920, height: 1080, frames: SLIDE_LEN * SCENES.length };

// Himmel statt Beige: Verlauf, Comic-Rasterpunkte, ziehende Wolken
const Sky: React.FC = () => {
  const f = useCurrentFrame();
  const clouds = [
    { y: 1010, s: 1.2, sp: 0.5, x0: 200 },
    { y: 560, s: 0.8, sp: 0.35, x0: 1300 },
    { y: 980, s: 1.0, sp: 0.6, x0: 1100 },
    { y: 330, s: 0.7, sp: 0.3, x0: 1700 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #6FC3F2 0%, #A9DCF8 45%, #DDF1FD 100%)" }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 2.2px, transparent 2.6px)", backgroundSize: "18px 18px", opacity: 0.6 }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {clouds.map((c, i) => {
          const x = ((c.x0 + f * c.sp) % 2300) - 250;
          return (
            <path
              key={i}
              transform={`translate(${x} ${c.y}) scale(${c.s})`}
              d="M-120 20 q-34 0 -30 -26 q4 -22 34 -18 q8 -30 44 -24 q20 -26 56 -10 q34 -14 52 14 q36 -2 34 28 q-2 22 -30 22 Z"
              fill="#FFFFFF"
              stroke={CC.ink}
              strokeWidth={4}
              opacity={0.95}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const comicBox: React.CSSProperties = {
  background: "#FFFFFF",
  border: `5px solid ${CC.ink}`,
  boxShadow: `10px 10px 0 ${CC.ink}`,
  borderRadius: 18,
};

const comicTitle = (size: number): React.CSSProperties => ({
  fontFamily: "'Anton'",
  fontSize: size,
  lineHeight: 0.98,
  color: "#FFFFFF",
  WebkitTextStroke: `${Math.max(3, size * 0.05)}px ${CC.ink}`,
  paintOrder: "stroke fill",
  textShadow: `${size * 0.06}px ${size * 0.06}px 0 ${CC.ink}`,
  letterSpacing: "0.01em",
});

const Header: React.FC<{ o: number; small?: boolean }> = ({ o, small }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top: small ? 26 : 30, opacity: o }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div style={comicTitle(small ? 60 : 80)}>SICHERHEITSHINWEISE</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: small ? 17 : 21, letterSpacing: "0.24em", color: CC.ink, marginTop: 12 }}>SAFETY INSTRUCTIONS</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            display: "inline-block",
            background: CC.ink,
            color: CC.paper,
            fontFamily: "'Anton'",
            fontSize: small ? 30 : 38,
            letterSpacing: "0.06em",
            padding: "7px 20px 5px",
            borderRadius: 8,
          }}
        >
          FIRST CLASS ONLY
        </div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: small ? 15 : 18, letterSpacing: "0.18em", color: CC.ink, marginTop: 9 }}>
          SALITE AIR · FAHRSCHUL-EDITION
        </div>
      </div>
    </div>
    
  </div>
);

const Num: React.FC<{ n: number | string; size: number }> = ({ n, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: CC.red,
      border: `4px solid ${CC.ink}`,
      color: "#FFFFFF",
      fontFamily: "'Anton'",
      fontSize: size * 0.56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {n}
  </div>
);

// ---------- Version A: dezente Karte ----------
export const SafetyComicCard: React.FC = () => {
  const f = useCurrentFrame();
  const a = (s: number, len = 14) => interpolate(f, [s, s + len], [0, 1], { ...clamp, easing: OUT });
  const PW = 442;
  const GX = [40, 506, 972, 1438];
  const appear = [10, 20, 30, 40];
  const stripIn = a(54, 16);
  const stamp = interpolate(f, [72, 79], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Sky />
      <Header o={a(0)} />
      {SCENES.slice(0, 4).map((s, i) => {
        const p = a(appear[i]);
        return (
          <div
            key={s.kind}
            style={{
              position: "absolute",
              left: GX[i],
              top: 196,
              width: PW,
              height: 530,
              ...comicBox,
              overflow: "hidden",
              opacity: p,
              transform: `translateY(${(1 - p) * 26}px)`,
            }}
          >
            <div style={{ position: "absolute", left: -1, top: 64 }}>
              <ComicScene kind={s.kind} t={f - appear[i]} scale={PW / 480} />
            </div>
            <div style={{ position: "absolute", left: 14, top: 12 }}>
              <Num n={i + 1} size={46} />
            </div>
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
              <div style={{ fontFamily: "'Anton'", fontSize: s.title.length > 16 ? 40 : 50, color: CC.ink, lineHeight: 1 }}>{s.title}</div>
              <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 21, color: CC.sub, marginTop: 8, lineHeight: 1.25 }}>{s.line}</div>
            </div>
          </div>
        );
      })}

      {/* Bordkarten-Leiste: First Class und letzte Ausgabe */}
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 776,
          height: 210,
          ...comicBox,
          overflow: "hidden",
          opacity: stripIn,
          transform: `translateY(${(1 - stripIn) * 40}px)`,
          display: "flex",
        }}
      >
        <div style={{ width: 300, background: CC.ink, color: CC.paper, padding: "28px 30px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 18, letterSpacing: "0.2em" }}>SALITE AIR</div>
          <div style={{ fontFamily: "'Anton'", fontSize: 44, lineHeight: 1 }}>BOARDING PASS</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 70, padding: "0 50px" }}>
          {[
            ["KLASSE", "FIRST"],
            ["SITZ", "1A"],
            ["DATUM", "27.11."],
            ["GATE", "PASSWORT"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 16, letterSpacing: "0.18em", color: CC.muted }}>{k}</div>
              <div style={{ fontFamily: "'Anton'", fontSize: 64, color: k === "KLASSE" ? CC.red : CC.ink, lineHeight: 1.05 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ width: 200, borderLeft: `3px dashed ${CC.ink}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          {[3, 1, 2, 1, 3, 1, 2, 2, 1, 3].map((w, i) => (
            <div key={i} style={{ width: 120, height: w * 3, background: CC.ink }} />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1420,
          top: 880,
          transform: `translate(-50%, -50%) rotate(-10deg) scale(${2.6 - stamp * 1.6})`,
          opacity: stamp,
          border: `6px solid ${CC.red}`,
          borderRadius: 10,
          padding: "6px 20px 2px",
          color: CC.red,
          fontFamily: "'Anton'",
          fontSize: 50,
          whiteSpace: "nowrap",
          background: "rgba(255,255,255,0.88)",
        }}
      >
        LETZTE AUSGABE
      </div>

      <div style={{ position: "absolute", right: 40, bottom: 20, fontFamily: "'Inter'", fontWeight: 600, fontSize: 15, color: CC.ink, opacity: a(80) }}>
        *Satire. Ersetzt weder Gurt noch Airbag.
      </div>
    </AbsoluteFill>
  );
};

// ---------- Version B: Slideshow ----------
export const SafetyComicSlides: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(SCENES.length - 1, Math.floor(f / SLIDE_LEN));
  const t = f - i * SLIDE_LEN;
  const s = SCENES[i];
  const a = (st: number, len = 14) => interpolate(t, [st, st + len], [0, 1], { ...clamp, easing: OUT });
  const head = i === 0 ? interpolate(f, [0, 12], [0, 1], { ...clamp, easing: OUT }) : 1;

  return (
    <AbsoluteFill>
      <Sky />
      <Header o={head} small />
      {/* Szene groß links */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 160,
          width: 1040,
          height: 760,
          ...comicBox,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 40, top: 70 }}>
          <ComicScene kind={s.kind} t={t} scale={2} />
        </div>
      </div>
      {/* Text rechts */}
      <div style={{ position: "absolute", left: 1140, right: 60, top: 260 }}>
        <div style={{ opacity: a(2), transform: `translateX(${(1 - a(2)) * 30}px)` }}>
          <Num n={i + 1} size={96} />
        </div>
        <div
          style={{
            ...comicTitle(s.title.length > 16 ? 112 : 140),
            marginTop: 34,
            opacity: a(6),
            transform: `translateX(${(1 - a(6)) * 40}px)`,
          }}
        >
          {s.title}
        </div>
        <div style={{ height: 10, width: 150 * a(12), background: CC.red, border: `3px solid ${CC.ink}`, marginTop: 30 }} />
        <div style={{ display: "inline-block", fontFamily: "'Inter'", fontWeight: 800, fontSize: 38, lineHeight: 1.25, color: CC.ink, marginTop: 26, opacity: a(12), background: "#FFFFFF", border: `4px solid ${CC.ink}`, borderRadius: 14, padding: "12px 20px", boxShadow: `6px 6px 0 ${CC.ink}` }}>{s.line}</div>
      </div>
      {/* Fortschritt */}
      <div style={{ position: "absolute", left: 1140, bottom: 160, display: "flex", gap: 14 }}>
        {SCENES.map((_, k) => (
          <div key={k} style={{ width: k === i ? 54 : 18, height: 18, borderRadius: 9, background: k === i ? CC.red : k < i ? CC.ink : "#FFFFFF", border: `3px solid ${CC.ink}` }} />
        ))}
      </div>
      {s.kind === "bullet" && (
        <div style={{ position: "absolute", right: 40, bottom: 24, fontFamily: "'Inter'", fontWeight: 600, fontSize: 16, color: CC.ink }}>*Satire. Ersetzt weder Gurt noch Airbag.</div>
      )}
    </AbsoluteFill>
  );
};
