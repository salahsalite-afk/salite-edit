import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import FIGS from "../../public/story/figs.json";

// Lookbook-Line-up als Video: alle Ansichten nebeneinander auf einem bordeauxroten Leoparden-Läufer,
// die Kamera gleitet selbst von Figur zu Figur (kein Wischen), am Ende Totale.
// Dezente Black-Friday-Akzente: Preisschilder mit Linie (alt durchgestrichen, neu in Rot), oben klein BLACK FRIDAY, ONLY WITH PASSWORD.
export const LINEUP = { fps: 30, width: 1080, height: 1920 };
const HOLD = 42; // Frames Stand pro Figur
const GLIDE = 20; // Frames Fahrt zur nächsten Figur
const OUTRO_ZOOM = 30;
const OUTRO_HOLD = 60;

type Meta = { w: number; h: number; top: number; bottom: number; cx: number };
const META = FIGS as Record<string, Meta>;

export type Tag = { label: string; old: string; now: string; side: -1 | 1; at: number }; // at: Höhe am Körper, 0 Kopf bis 1 Fuß
export type LineupProps = { figures: { name: string; tags: Tag[] }[]; info: string };

const HOODIE: Omit<Tag, "side"> = { label: "HOODIE", old: "80 €", now: "39 €", at: 0.3 };
const JOGGER: Omit<Tag, "side"> = { label: "JOGGER", old: "70 €", now: "30 €", at: 0.66 };
const SET: Omit<Tag, "side"> = { label: "TRACKSUIT", old: "130 €", now: "69 €", at: 0.46 };

export const LINEUP_DEFAULT: LineupProps = {
  figures: [
    { name: "fig_3", tags: [{ ...HOODIE, side: -1 }, { ...JOGGER, side: 1 }] },
    { name: "fig_4", tags: [{ ...SET, side: 1 }] },
    { name: "fig_5", tags: [{ ...HOODIE, side: 1 }, { ...JOGGER, side: -1 }] },
    { name: "fig_2", tags: [{ ...SET, side: -1 }] },
    { name: "fig_6", tags: [{ ...JOGGER, side: 1 }] },
  ],
  info: "Model: 186 cm | 71 kg | Size L",
};
export const lineupFrames = (n: number) => n * HOLD + (n - 1) * GLIDE + OUTRO_ZOOM + OUTRO_HOLD;

// Szene
const BODY = 1120; // Körperhöhe
const GAP = 640; // Abstand der Figuren
const X0 = 540;
const FEET = 1500;
const RUG_TOP = 1335;
const RUG_D = 300;

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const faces = [
    new FontFace("Anton", `url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2')`),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format('woff2')`, { weight: "600" }),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-700-normal.woff2")}) format('woff2')`, { weight: "700" }),
  ];
  faces.forEach((f) => f.load().then((x) => document.fonts.add(x)));
};

export const PriceTag: React.FC<{ tag: Tag; ax: number; ay: number; p: number; dark?: boolean }> = ({ tag, ax, ay, p, dark = false }) => {
  const ink = dark ? "#F2ECE1" : "#3A3A38";
  const s = tag.side;
  const boxX = ax + s * 250; // Kante des Schilds zur Figur hin
  const boxY = ay - 70;
  const elbowX = boxX - s * 10;
  const len = Math.abs(ax - boxX) + 80;
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        <polyline
          points={`${ax},${ay} ${ax + s * 50},${boxY + 46} ${elbowX},${boxY + 46}`}
          fill="none"
          stroke={ink}
          strokeWidth={1.8}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - p)}
        />
        <circle cx={ax} cy={ay} r={5} fill="#FFFFFF" stroke={ink} strokeWidth={1.8} opacity={p} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: boxY - 40,
          left: s < 0 ? boxX - 180 : boxX,
          width: 180,
          textAlign: s < 0 ? "right" : "left",
          opacity: interpolate(p, [0.4, 1], [0, 1], { extrapolateLeft: "clamp" }),
          transform: `translateY(${(1 - p) * 10}px)`,
        }}
      >
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 17, letterSpacing: "0.2em", color: dark ? "rgba(242,236,225,0.8)" : "#7A7A76" }}>{tag.label}</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 26, color: dark ? "rgba(242,236,225,0.85)" : "#5E5E5A", textDecoration: "line-through", textDecorationThickness: 2, marginTop: 4 }}>{tag.old}</div>
        <div style={{ display: "inline-block", background: "#D7261E", color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, padding: "4px 12px", marginTop: 6 }}>{tag.now}</div>
      </div>
    </>
  );
};

export const LineupPan: React.FC<LineupProps> = ({ figures, info }) => {
  loadFonts();
  const f = useCurrentFrame();
  const n = figures.length;
  const per = HOLD + GLIDE;
  const ease = Easing.inOut(Easing.cubic);

  // Kamera: Mitte in Szenenkoordinaten und Zoom
  const seg = Math.min(n - 1, Math.floor(f / per));
  const local = f - seg * per;
  let camX = X0 + seg * GAP;
  if (seg < n - 1 && local > HOLD) camX += GAP * interpolate(local - HOLD, [0, GLIDE], [0, 1], { extrapolateRight: "clamp", easing: ease });
  camX += interpolate(Math.min(local, HOLD), [0, HOLD], [-10, 10]); // leichtes Weiterdriften im Stand
  const pansEnd = n * HOLD + (n - 1) * GLIDE;
  const z = interpolate(f, [pansEnd, pansEnd + OUTRO_ZOOM], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const midX = X0 + ((n - 1) * GAP) / 2;
  const END_SCALE = 0.56; // Halbtotale: drei Figuren, Preise noch lesbar
  const s = 1 + (END_SCALE - 1) * z;
  const cx = camX + (midX - camX) * z;
  const feetScreen = FEET + (1330 - FEET) * z;

  const arrive = (i: number) => (i === 0 ? 6 : i * per - 4);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #F6F6F5 0%, #F1F1F0 62%, #EAEAE8 100%)", overflow: "hidden" }}>
      {/* Szene */}
      <div style={{ position: "absolute", left: 540 - cx * s, top: feetScreen - FEET * s, width: 1, height: 1, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        {/* Wandschrift, sehr leise, bewegt sich langsamer (Tiefe) */}
        <div
          style={{
            position: "absolute",
            left: cx * 0.45 - 500,
            top: 420,
            whiteSpace: "nowrap",
            fontFamily: "'Anton'",
            fontSize: 380,
            color: "rgba(0,0,0,0.022)",
            letterSpacing: "0.02em",
          }}
        >
          BLACK FRIDAY · BLACK FRIDAY · BLACK FRIDAY
        </div>
        {/* Leoparden-Läufer */}
        <Img src={staticFile("story/rug.png")} style={{ position: "absolute", left: X0 - 560, top: RUG_TOP, width: (n - 1) * GAP + 1120, height: RUG_D }} />
        {/* Figuren */}
        {figures.map((fig, i) => {
          const m = META[fig.name];
          const dispH = BODY / (m.bottom - m.top);
          const dispW = (dispH * m.w) / m.h;
          const x = X0 + i * GAP;
          return (
            <Img
              key={fig.name}
              src={staticFile(`story/${fig.name}.png`)}
              style={{ position: "absolute", left: x - m.cx * dispW, top: FEET - m.bottom * dispH, width: dispW, height: dispH }}
            />
          );
        })}
        {/* Preisschilder */}
        {figures.map((fig, i) =>
          fig.tags.map((tag, j) => {
            const p = interpolate(f, [arrive(i) + j * 8, arrive(i) + j * 8 + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
            const x = X0 + i * GAP;
            const ay = FEET - BODY + tag.at * BODY;
            return (
              <div key={`${i}${j}`} style={{ opacity: 1 - z }}>
                <PriceTag tag={tag} ax={x + tag.side * 95} ay={ay} p={p} />
              </div>
            );
          }),
        )}
      </div>

      {/* oben dezent */}
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: "'Anton'", fontSize: 60, letterSpacing: "0.06em", color: "#161616", lineHeight: 1 }}>BLACK FRIDAY</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 18, letterSpacing: "0.34em", color: "#8A8A86", marginTop: 14 }}>ONLY WITH PASSWORD</div>
      </div>
      {/* unten dezent */}
      <div style={{ position: "absolute", top: 1726, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(0,0,0,0.05)", padding: "15px 28px", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#1A1A1A" }}>{info}</div>
      </div>

      {/* Ton: leiser Swipe bei jeder Fahrt, leiser Tick wenn Preise erscheinen */}
      {Array.from({ length: n - 1 }, (_, i) => (
        <Sequence key={`w${i}`} from={(i + 1) * per - GLIDE - 2} durationInFrames={24}>
          <Audio src={staticFile("sfx/whoosh_soft.wav")} volume={0.28} />
        </Sequence>
      ))}
      <Sequence from={pansEnd - 2} durationInFrames={30}>
        <Audio src={staticFile("sfx/whoosh_soft.wav")} volume={0.22} />
      </Sequence>
    </AbsoluteFill>
  );
};
