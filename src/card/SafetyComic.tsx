import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CC, ComicScene, OUT, SCENES, clamp } from "./comicScenes";

// Zwei Beamer-Versionen der Comic-Sicherheitskarte (16:9, 30 fps):
// SafetyComicCard: dezenter, eine Karte mit vier Feldern und Bordkarten-Leiste.
// SafetyComicSlides: Slideshow, sechs Folien nacheinander, harter Schnitt, je 3 Sekunden.
export const COMIC_CARD = { fps: 30, width: 1920, height: 1080, frames: 270 };
export const SLIDE_LEN = 90;
export const COMIC_SLIDES = { fps: 30, width: 1920, height: 1080, frames: SLIDE_LEN * SCENES.length };

const Header: React.FC<{ o: number; small?: boolean }> = ({ o, small }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top: small ? 26 : 30, opacity: o }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div style={{ fontFamily: "'Anton'", fontSize: small ? 56 : 80, lineHeight: 0.95, color: CC.ink }}>SICHERHEITSHINWEISE</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: small ? 17 : 21, letterSpacing: "0.24em", color: CC.red, marginTop: 9 }}>SAFETY INSTRUCTIONS</div>
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
    <div style={{ height: 3, background: CC.ink, marginTop: small ? 12 : 16 }} />
  </div>
);

const Num: React.FC<{ n: number | string; size: number }> = ({ n, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: CC.ink,
      color: CC.paper,
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
    <AbsoluteFill style={{ background: CC.paper }}>
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
              height: 540,
              background: CC.panel,
              border: `3px solid ${CC.ink}`,
              borderRadius: 16,
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
              <div style={{ fontFamily: "'Anton'", fontSize: s.title.length > 16 ? 40 : 48, color: CC.ink, lineHeight: 1 }}>{s.title}</div>
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
          background: "#FFFFFF",
          border: `3px solid ${CC.ink}`,
          borderRadius: 16,
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

      <div style={{ position: "absolute", right: 40, bottom: 20, fontFamily: "'Inter'", fontWeight: 600, fontSize: 15, color: CC.muted, opacity: a(80) }}>
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
    <AbsoluteFill style={{ background: CC.paper }}>
      <Header o={head} small />
      {/* Szene groß links */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 160,
          width: 1040,
          height: 760,
          background: CC.panel,
          border: `3px solid ${CC.ink}`,
          borderRadius: 18,
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
            fontFamily: "'Anton'",
            fontSize: s.title.length > 16 ? 96 : 120,
            lineHeight: 0.98,
            color: CC.ink,
            marginTop: 34,
            opacity: a(6),
            transform: `translateX(${(1 - a(6)) * 40}px)`,
          }}
        >
          {s.title}
        </div>
        <div style={{ height: 6, width: 120 * a(12), background: CC.red, marginTop: 26 }} />
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 38, lineHeight: 1.25, color: CC.sub, marginTop: 24, opacity: a(12) }}>{s.line}</div>
      </div>
      {/* Fortschritt */}
      <div style={{ position: "absolute", left: 1140, bottom: 160, display: "flex", gap: 14 }}>
        {SCENES.map((_, k) => (
          <div key={k} style={{ width: k === i ? 54 : 18, height: 18, borderRadius: 9, background: k === i ? CC.red : k < i ? CC.ink : "#D8CBB4" }} />
        ))}
      </div>
      {s.kind === "bullet" && (
        <div style={{ position: "absolute", right: 40, bottom: 24, fontFamily: "'Inter'", fontWeight: 600, fontSize: 16, color: CC.muted }}>*Satire. Ersetzt weder Gurt noch Airbag.</div>
      )}
    </AbsoluteFill>
  );
};
