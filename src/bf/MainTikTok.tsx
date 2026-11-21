import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";
import { WORDS } from "./mainWords";

// Main-TikTok (Black Week): fertig geschnittenes Video, dazu schlichte Animationen nach Inspo, auf unsere Art.
// Pausen über 0,3 s raus, Ende direkt nach "Dreams". Bilder per Mausklick mit unscharfem Hintergrund,
// Zahlen hinter den Personen (freigestellt), echte Shopify-Mitteilungen hinter euch bei "4.000 Leute".
// Ton (Stimme, Beat, Effekte) mischt scripts/main_mix.py, das Bild wird stumm gerendert.
export const MT = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * MT.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.2, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const RED = "#E3262B";
const TT_RED = "#FE2C55";
const INK = "#111111";

// ---------- Schnitt: Quellbereiche (Pausen raus) ----------
export const EDL: [number, number][] = [
  [0, 9.16],
  [9.42, 29.95],
  [30.29, 40.08],
];
const STARTS = EDL.reduce<number[]>((acc, [a, b], i) => [...acc, i === 0 ? 0 : acc[i - 1] + (EDL[i - 1][1] - EDL[i - 1][0])], []);
export const MT_TOTAL = STARTS[EDL.length - 1] + (EDL[EDL.length - 1][1] - EDL[EDL.length - 1][0]);
export const MT_FRAMES = f(MT_TOTAL);
/** Quellzeit -> Ausgabezeit */
export const o = (s: number) => {
  for (let i = EDL.length - 1; i >= 0; i--) if (s >= EDL[i][0]) return STARTS[i] + Math.min(s, EDL[i][1]) - EDL[i][0];
  return 0;
};
/** Ausgabezeit -> Quellzeit */
const toSrc = (t: number) => {
  for (let i = EDL.length - 1; i >= 0; i--) if (t >= STARTS[i]) return EDL[i][0] + (t - STARTS[i]);
  return 0;
};

// ---------- Kamera (Quellzeiten): Zoomsprünge auf betonten Wörtern ----------
type Z = [number, number, number, number]; // Quellzeit, Skalierung, Fokus x, Fokus y
const ZK: Z[] = [
  [0, 1.15, 540, 900], [0.35, 1.0, 540, 900], [0.63, 1.0, 540, 900], [0.64, 1.12, 480, 880], [1.59, 1.12, 480, 880],
  [1.6, 1.0, 540, 900], [3.22, 1.06, 540, 900],
  [3.233, 1.0, 540, 960], [6.49, 1.0, 540, 960],
  [6.5, 1.0, 540, 960], [7.49, 1.0, 540, 960], [7.5, 1.1, 560, 760], [9.28, 1.1, 560, 760],
  [9.283, 1.0, 540, 960], [13.37, 1.0, 540, 960],
  [13.383, 1.0, 540, 960], [13.77, 1.0, 540, 960], [13.78, 1.12, 500, 880], [18.99, 1.12, 500, 880],
  [19.0, 1.0, 520, 880], [23.1, 1.06, 520, 880], [24.49, 1.06, 520, 880], [24.5, 1.15, 500, 880], [25.39, 1.15, 500, 880],
  [25.4, 1.0, 540, 960], [27.54, 1.0, 540, 960],
  [27.55, 1.0, 540, 900], [29.95, 1.04, 540, 900],
  [30.15, 1.0, 540, 700], [30.79, 1.0, 540, 700], [30.8, 1.08, 540, 620], [34.2, 1.08, 540, 620], [34.21, 1.0, 540, 960], [36.89, 1.0, 540, 960],
  [36.9, 1.0, 520, 880], [38.1, 1.0, 520, 880], [40.08, 1.06, 520, 880],
];
const cam = (s: number) => {
  if (s <= ZK[0][0]) return ZK[0];
  for (let i = 1; i < ZK.length; i++) {
    if (s <= ZK[i][0]) {
      const a = ZK[i - 1];
      const c = ZK[i];
      const p = IO((s - a[0]) / Math.max(0.001, c[0] - a[0]));
      return [s, a[1] + (c[1] - a[1]) * p, a[2] + (c[2] - a[2]) * p, a[3] + (c[3] - a[3]) * p] as Z;
    }
  }
  return ZK[ZK.length - 1];
};

// ---------- Untertitel (iPhone-Stil, höchstens 3 Wörter, aus dem Transkript) ----------
type Cap = { a: number; e: number; text: string };
const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  let cur: [string, number][] = [];
  const flush = (end: number) => {
    if (!cur.length) return;
    const text = cur
      .map(([w]) => w)
      .join(" ")
      .replace(/[.,]+$/, "")
      .toUpperCase();
    out.push({ a: cur[0][1], e: end, text });
    cur = [];
  };
  WORDS.forEach(([w, s], i) => {
    const next = WORDS[i + 1];
    cur.push([w, s]);
    const crossesCut = next && EDL.some(([, b]) => s < b && next[1] >= b);
    if (cur.length >= 3 || /[.,]$/.test(w) || !next || crossesCut) flush(next ? Math.min(next[1], s + 1.4) : s + 0.5);
  });
  return out;
})();
const Captions: React.FC<{ s: number; hidden: boolean }> = ({ s, hidden }) => {
  if (hidden) return null;
  const c = CAPS.find((x) => s >= x.a && s < x.e);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>
  );
};

// ---------- Klick-Karten: Mauszeiger klickt, Bild oder Clip springt auf, Hintergrund unscharf ----------
type Card = { a: number; e: number; w: number; h: number; cy: number; node: (s: number, t: number) => React.ReactNode; dark?: boolean };
const imgNode = (file: string) => () => <Img src={staticFile(`main/img/${file}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
const vidNode = (file: string, a: number, trim: number, rate = 1) => () => (
  <Sequence from={f(o(a))} layout="none">
    <OffthreadVideo src={staticFile(`main/${file}`)} trimBefore={Math.round(trim * 60)} playbackRate={rate} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </Sequence>
);

// Poster: Nylon-Set heranzoomen (nie über Originalgröße)
const NY = { cx: 812, cy: 1180 };
const nylonNode = (s: number) => {
  const p = ease(s, 14.55, 0.7, IO);
  const W = 900;
  const H = 1000;
  const k0 = W / 1440; // ganzes Poster
  const k = k0 + (1 - k0) * p;
  const x = interpolate(p, [0, 1], [0, W / 2 - NY.cx * 1]);
  const y = interpolate(p, [0, 1], [(H - 1800 * k0) / 2, H / 2 - NY.cy * 1]);
  return <Img src={staticFile("main/img/poster.jpg")} style={{ position: "absolute", left: x, top: y, width: 1440 * k, height: 1800 * k, maxWidth: "none" }} />;
};
// Poster-Ausschnitt mit allen Farben (Zeile der Trackies)
const LINEUP = { y0: 800, y1: 1640 };
const lineupNode = () => {
  const k = 972 / 1440;
  return <Img src={staticFile("main/img/poster.jpg")} style={{ position: "absolute", left: 0, top: -LINEUP.y0 * k, width: 1440 * k, height: 1800 * k, maxWidth: "none" }} />;
};

const CARDS: Card[] = [
  { a: 4.15, e: 5.22, w: 810, h: 1012, cy: 860, node: imgNode("poster.jpg") },
  { a: 5.25, e: 6.48, w: 760, h: 1351, cy: 900, node: vidNode("schnee.mp4", 5.25, 0.9), dark: true },
  { a: 9.5, e: 10.62, w: 860, h: 860, cy: 860, node: vidNode("puff.mp4", 9.5, 0.3), dark: true },
  { a: 10.65, e: 11.97, w: 800, h: 1200, cy: 860, node: imgNode("glitzer.jpg") },
  { a: 12.0, e: 13.36, w: 720, h: 1280, cy: 880, node: imgNode("stack.jpg"), dark: true },
  { a: 14.25, e: 18.98, w: 900, h: 1000, cy: 840, node: (s) => nylonNode(s) },
  { a: 27.6, e: 29.93, w: 680, h: 1209, cy: 860, node: vidNode("web.mp4", 27.6, 0.2), dark: true },
  { a: 33.3, e: 34.22, w: 972, h: (LINEUP.y1 - LINEUP.y0) * (972 / 1440), cy: 820, node: lineupNode },
];
const cardState = (c: Card, s: number) => {
  const inP = ease(s, c.a, 0.24);
  const outP = interpolate(s, [c.e - 0.1, c.e], [0, 1], clamp);
  return { inP, outP, on: s >= c.a && s < c.e };
};
const blurAt = (s: number) =>
  CARDS.reduce((m, c) => {
    const b = interpolate(s, [c.a - 0.02, c.a + 0.18, c.e - 0.12, c.e + 0.02], [0, 1, 1, 0], clamp);
    return Math.max(m, b);
  }, 0);

const CardView: React.FC<{ c: Card; s: number; t: number }> = ({ c, s, t }) => {
  const { inP, outP, on } = cardState(c, s);
  if (!on) return null;
  const sc = 0.72 + 0.28 * inP - 0.04 * outP;
  return (
    <div style={{ position: "absolute", left: 540 - c.w / 2, top: c.cy - c.h / 2, width: c.w, height: c.h, borderRadius: 26, overflow: "hidden", background: c.dark ? "#111" : "#FFF", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 3) * (1 - outP), transform: `scale(${sc})` }}>
      {c.node(s, t)}
    </div>
  );
};

// Mauszeiger (Pfeil), fährt rein, klickt, Kreis breitet sich aus
const Cursor: React.FC<{ s: number }> = ({ s }) => {
  const c = CARDS.find((x) => s >= x.a - 0.32 && s < x.a + 0.32);
  if (!c) return null;
  const tx = 600;
  const ty = c.cy + 60;
  const move = ease(s, c.a - 0.32, 0.28, Easing.out(Easing.cubic));
  const x = 860 + (tx - 860) * move;
  const y = 1380 + (ty - 1380) * move;
  const press = interpolate(s, [c.a - 0.04, c.a, c.a + 0.08], [1, 0.82, 1], clamp);
  const fade = 1 - interpolate(s, [c.a + 0.12, c.a + 0.32], [0, 1], clamp);
  const ring = interpolate(s, [c.a, c.a + 0.3], [0, 1], clamp);
  return (
    <>
      {s >= c.a && <div style={{ position: "absolute", left: tx - 70 * ring, top: ty - 70 * ring, width: 140 * ring, height: 140 * ring, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.9)", opacity: 1 - ring }} />}
      <svg width={70} height={90} viewBox="0 0 28 36" style={{ position: "absolute", left: x - 6, top: y - 4, opacity: fade, transform: `scale(${press})`, transformOrigin: "6px 4px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}>
        <path d="M2 2 L2 28 L9 21.5 L13.5 32 L18 30 L13.6 19.8 L23 19.8 Z" fill="#FFFFFF" stroke="#111111" strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
    </>
  );
};

// Hinweise auf der Nylon-Karte
const Chip: React.FC<{ children: React.ReactNode; p: number; style?: React.CSSProperties }> = ({ children, p, style }) => (
  <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", borderRadius: 18, padding: "14px 24px", boxShadow: "0 14px 36px rgba(0,0,0,0.3)", fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, letterSpacing: "0.04em", color: INK, whiteSpace: "nowrap", opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, ...style }}>{children}</div>
);
const NylonInfo: React.FC<{ s: number }> = ({ s }) => {
  if (s < 14.9 || s >= 18.98) return null;
  const out = 1 - interpolate(s, [18.88, 18.98], [0, 1], clamp);
  const pW = ease(s, 14.94, 0.3);
  const pA = ease(s, 15.84, 0.3);
  const pP = ease(s, 17.06, 0.3);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <Chip p={pW} style={{ left: 70, top: 420 }}>
        <svg width={26} height={32} viewBox="0 0 26 32">
          <path d="M13 2 C13 2 3 14 3 20 a10 10 0 0 0 20 0 C23 14 13 2 13 2 Z" fill="#2F7DE1" />
        </svg>
        WASSERDICHT
      </Chip>
      <Chip p={pA} style={{ right: 150, top: 560 }}>LETZTES MAL AUSVERKAUFT</Chip>
      <div style={{ position: "absolute", left: 70, top: 1160, display: "flex", alignItems: "baseline", gap: 22, background: "#FFFFFF", borderRadius: 20, padding: "10px 30px 6px", boxShadow: "0 14px 36px rgba(0,0,0,0.3)", opacity: pP, transform: `scale(${0.85 + 0.15 * pP})`, transformOrigin: "left center" }}>
        <span style={{ fontFamily: "'Anton'", fontSize: 54, color: "#8A8A8A", textDecoration: "line-through" }}>120 €</span>
        <span style={{ fontFamily: "'Anton'", fontSize: 96, color: RED }}>69 €</span>
      </div>
    </div>
  );
};

// SOLD OUT Stempel auf Rot (Poster-Zeile)
const SoldOut: React.FC<{ s: number }> = ({ s }) => {
  const c = CARDS[7];
  if (s < 33.8 || s >= c.e) return null;
  const p = ease(s, 33.8, 0.18);
  const k = 972 / 1440;
  const cx = 540 - 486 + 1295 * k;
  const cy = c.cy - c.h / 2 + (1180 - LINEUP.y0) * k;
  const out = 1 - interpolate(s, [c.e - 0.1, c.e], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: cx - 130, top: cy - 50, width: 260, height: 100, display: "flex", alignItems: "center", justifyContent: "center", border: `6px solid ${RED}`, borderRadius: 10, fontFamily: "'Anton'", fontSize: 54, letterSpacing: "0.04em", color: RED, background: "rgba(255,255,255,0.85)", transform: `rotate(-14deg) scale(${1.5 - 0.5 * p})`, opacity: p * out }}>
      SOLD OUT
    </div>
  );
};

// ---------- Hinter den Personen: Zahlen und Bestellungen (freigestellt) ----------
type FG = { name: string; f0: number; n: number };
const FGS: FG[] = [
  { name: "r69", f0: 97, n: 28 },
  { name: "r550", f0: 223, n: 52 },
  { name: "r10", f0: 793, n: 34 },
  { name: "rord", f0: 1027, n: 79 },
];
const BEHIND: { a: number; e: number; fg: string }[] = [
  { a: 3.25, e: 4.15, fg: "r69" },
  { a: 7.45, e: 9.16, fg: "r550" },
  { a: 26.5, e: 27.55, fg: "r10" },
  { a: 34.25, e: 36.85, fg: "rord" },
];
const Foreground: React.FC<{ s: number }> = ({ s }) => {
  const b = BEHIND.find((x) => s >= x.a && s < x.e);
  if (!b) return null;
  const g = FGS.find((x) => x.name === b.fg)!;
  const idx = Math.max(0, Math.min(g.n - 1, Math.floor(s * 30 + 1e-6) - g.f0));
  return <Img src={staticFile(`main/fg/${g.name}/cut_${String(idx).padStart(4, "0")}.png`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />;
};
const BigText: React.FC<{ text: string; size: number; color: string; top: number; p: number }> = ({ text, size, color, top, p }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: "'Anton'", fontSize: size, lineHeight: 1, color, opacity: p, transform: `scale(${1.08 - 0.08 * p})`, textShadow: "0 10px 40px rgba(0,0,0,0.45)", whiteSpace: "nowrap" }}>{text}</div>
);
const Behind: React.FC<{ s: number }> = ({ s }) => {
  if (s >= 3.25 && s < 4.15) return <BigText text="69 €" size={470} color="#FFFFFF" top={500} p={ease(s, 3.25, 0.2)} />;
  if (s >= 7.45 && s < 9.16) {
    const n = Math.round(550 * interpolate(s, [7.45, 7.95], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));
    const p = ease(s, 7.45, 0.2);
    return (
      <>
        <BigText text={String(n)} size={560} color="#FFFFFF" top={560} p={p} />
        <BigText text="GSM" size={200} color="#FFFFFF" top={1150} p={ease(s, 8.3, 0.2)} />
      </>
    );
  }
  if (s >= 26.5 && s < 27.55) return <BigText text="10/10" size={380} color="#FFFFFF" top={400} p={ease(s, 26.55, 0.2)} />;
  if (s >= 34.25 && s < 36.85) {
    const p = ease(s, 34.25, 0.25);
    return (
      <div style={{ position: "absolute", inset: 0, opacity: p }}>
        <Sequence from={f(o(34.25))} layout="none">
          <OffthreadVideo src={staticFile("main/orders.mp4")} playbackRate={0.62} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover", filter: "brightness(0.55) blur(2px)" }} />
        </Sequence>
      </div>
    );
  }
  return null;
};
// Zähler vor der Person
const Visitors: React.FC<{ s: number }> = ({ s }) => {
  if (s < 34.9 || s >= 36.85) return null;
  const p = ease(s, 34.9, 0.25);
  const n = Math.round(4000 * interpolate(s, [34.95, 35.45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const txt = n.toLocaleString("de-DE");
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1040, display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, letterSpacing: "0.2em", color: "#FFFFFF", textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>LEUTE AUF DER WEBSEITE</div>
      <div style={{ fontFamily: "'Anton'", fontSize: 210, lineHeight: 1.05, color: "#FFFFFF", textShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>{txt}+</div>
    </div>
  );
};

// ---------- Liste: Nylon-Details ----------
const ITEMS: [string, number][] = [
  ["HOCHWERTIGER STICK", 19.28],
  ["YKK ZIP", 20.2],
  ["KARO MUSTER", 21.1],
  ["VERSTELLBARE JOGGER", 22.02],
];
const List: React.FC<{ s: number }> = ({ s }) => {
  if (s < 19.15 || s >= 23.15) return null;
  const p = ease(s, 19.15, 0.3) * (1 - interpolate(s, [23.0, 23.15], [0, 1], clamp));
  return (
    <div style={{ position: "absolute", left: 80, top: 250, width: 760, background: "rgba(255,255,255,0.96)", borderRadius: 28, padding: "26px 34px", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
      <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.28em", color: "#8A8A8A", marginBottom: 10 }}>NYLON TRACKSUIT</div>
      {ITEMS.map(([label, at], i) => {
        const q = ease(s, at, 0.25);
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 0", borderTop: i ? "1px solid #E6E6E6" : "none", opacity: 0.25 + 0.75 * q }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: q > 0 ? INK : "#DDD", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.7 + 0.3 * q})` }}>
              <svg width={22} height={22} viewBox="0 0 22 22">
                <path d="M5 11.5 L9.5 16 L17 6.5" stroke="#FFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - q)} />
              </svg>
            </div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 38, color: INK }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- FOLGEN: TikTok-Profilbild, Plus wird zum Haken ----------
const Follow: React.FC<{ s: number; a: number; check: number; e: number }> = ({ s, a, check, e }) => {
  if (s < a || s >= e) return null;
  const p = ease(s, a, 0.25) * (1 - interpolate(s, [e - 0.2, e], [0, 1], clamp));
  const done = s >= check;
  const pop = interpolate(s, [check, check + 0.08, check + 0.2], [1, 1.25, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, top: 250, width: 130, height: 160, opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
      <div style={{ width: 130, height: 130, borderRadius: 65, background: "#1E1712", border: "4px solid #FFFFFF", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
        <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 66 }} />
      </div>
      <div style={{ position: "absolute", left: 65 - 26, top: 104, width: 52, height: 52, borderRadius: 26, background: done ? "#FFFFFF" : TT_RED, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})` }}>
        {done ? (
          <svg width={30} height={30} viewBox="0 0 22 22">
            <path d="M5 11.5 L9.5 16 L17 6.5" stroke={TT_RED} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width={28} height={28} viewBox="0 0 20 20">
            <path d="M10 3 V17 M3 10 H17" stroke="#FFF" strokeWidth={3.4} strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

// ---------- KOMMENTAR: TikTok-Kommentarleiste, "Ich brauche ein Passwort" wird getippt ----------
export const COMMENT = "Ich brauche ein Passwort";
export const SHEET = { a: 31.25, typeA: 31.42, typeE: 32.55, sent: 32.68, e: 33.25 };
const KEYS = ["qwertzuiopü", "asdfghjklöä", "yxcvbnm"];
export const typedAtSrc = (i: number) => SHEET.typeA + ((SHEET.typeE - SHEET.typeA) * i) / COMMENT.length;
const CommentSheet: React.FC<{ s: number }> = ({ s }) => {
  if (s < SHEET.a || s >= SHEET.e) return null;
  const up = ease(s, SHEET.a, 0.28);
  const down = interpolate(s, [SHEET.e - 0.22, SHEET.e], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const n = Math.max(0, Math.min(COMMENT.length, Math.floor(((s - SHEET.typeA) / (SHEET.typeE - SHEET.typeA)) * COMMENT.length)));
  const sent = s >= SHEET.sent;
  const post = ease(s, SHEET.sent, 0.25);
  const lastKey = n > 0 && !sent ? COMMENT[n - 1].toLowerCase() : "";
  const pressed = n > 0 && !sent && s - typedAtSrc(n - 1) < 0.06;
  const TOP = 1020;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP + (1 - up + down) * 900, height: 1920 - TOP, background: "#FFFFFF", borderRadius: "28px 28px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.25)" }}>
      <div style={{ textAlign: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#161823", marginTop: 24 }}>Kommentare</div>
      <div style={{ position: "absolute", top: 84, left: 36, right: 36, display: "flex", gap: 18, alignItems: "flex-start", opacity: post, transform: `translateY(${(1 - post) * 16}px)` }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: "#D9D9DE", flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 22, color: "#8A8B91" }}>du · jetzt</div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: "#161823", marginTop: 4 }}>{COMMENT}</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 196, left: 24, right: 24, height: 76, borderRadius: 38, background: "#F1F1F2", display: "flex", alignItems: "center", padding: "0 28px", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: sent || n === 0 ? "#8A8B91" : "#161823" }}>
          {sent || n === 0 ? "Kommentar hinzufügen …" : COMMENT.slice(0, n)}
          {!sent && n > 0 && <span style={{ color: TT_RED }}>|</span>}
        </div>
        <div style={{ width: 52, height: 52, borderRadius: 26, background: n > 0 && !sent ? TT_RED : "#E3E3E5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={24} height={24} viewBox="0 0 20 20">
            <path d="M10 16 V4 M4.5 9.5 L10 4 L15.5 9.5" stroke="#FFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, bottom: 0, background: "#D1D3D9", padding: "20px 10px 0" }}>
        {KEYS.map((row, r) => (
          <div key={r} style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            {row.split("").map((k) => {
              const on = pressed && k === lastKey;
              return (
                <div key={k} style={{ width: 86, height: 100, borderRadius: 12, background: on ? "#AEB2BB" : "#FFFFFF", boxShadow: "0 2px 0 rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 40, color: "#111", transform: on ? "scale(1.12) translateY(-10px)" : "none" }}>
                  {k}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 640, height: 100, borderRadius: 12, background: pressed && lastKey === " " ? "#AEB2BB" : "#FFFFFF", boxShadow: "0 2px 0 rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: "#555" }}>Leerzeichen</div>
        </div>
      </div>
    </div>
  );
};

// ---------- Schluss: Black Week Infos ----------
const INFOS: [string, number, boolean][] = [
  ["BLACK FRIDAY", 38.1, false],
  ["ARCHIV SALE", 38.5, false],
  ["BIS ZU 80 %", 38.94, true],
];
const Infos: React.FC<{ s: number }> = ({ s }) => {
  if (s < 38.1) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      {INFOS.map(([label, at, red]) => {
        const p = ease(s, at, 0.25);
        return (
          <div key={label} style={{ background: red ? RED : "#FFFFFF", color: red ? "#FFFFFF" : INK, fontFamily: "'Anton'", fontSize: 84, lineHeight: 1, padding: "18px 40px 14px", borderRadius: 18, boxShadow: "0 18px 44px rgba(0,0,0,0.35)", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})` }}>
            {label}
          </div>
        );
      })}
    </div>
  );
};

export const MainTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / MT.fps;
  const s = toSrc(t);
  const [, k, fx, fy] = cam(s);
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  const blur = blurAt(s);
  const intro = interpolate(t, [0, 0.2], [8, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: blur + intro > 0.02 ? `blur(${blur * 16 + intro}px) brightness(${1 - 0.25 * blur})` : undefined, transform: blur > 0 ? `scale(${1 + 0.04 * blur})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          {EDL.map(([a, b], i) => (
            <Sequence key={i} from={f(STARTS[i])} durationInFrames={f(STARTS[i] + (b - a)) - f(STARTS[i])}>
              <OffthreadVideo src={staticFile("main/main.mp4")} trimBefore={Math.round(a * 60)} muted style={{ width: 1080, height: 1920 }} />
            </Sequence>
          ))}
          <Behind s={s} />
          <Foreground s={s} />
        </div>
      </div>
      <Visitors s={s} />
      <List s={s} />
      {CARDS.map((c, i) => (
        <CardView key={i} c={c} s={s} t={t} />
      ))}
      <NylonInfo s={s} />
      <SoldOut s={s} />
      <Cursor s={s} />
      <Follow s={s} a={30.35} check={31.0} e={31.3} />
      <Follow s={s} a={36.95} check={37.6} e={38.1} />
      <Infos s={s} />
      <CommentSheet s={s} />
      <Captions s={s} hidden={s >= SHEET.a && s < SHEET.e} />
    </AbsoluteFill>
  );
};
