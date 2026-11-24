import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Longsleeve-Video (Black Friday): Ton unverändert (Originalspur wird nur kopiert), Bild minimal gegradet.
// Seriös und glaubwürdig: Infos sitzen unten über den Beinen (Gesichter bleiben frei), Fotos nur kurz und groß.
// Zahlen nur, was gesagt wird oder auf dem Poster steht (69 € statt 144 €, Jogger 30 € statt 65 €, Hoodie 39 € statt 79 €).
export const LS = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * LS.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.22, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const RED = "#E3262B";
const INK = "#111111";
export const LS_TOTAL = 34.94;
export const LS_FRAMES = f(LS_TOTAL);

// ---------- Untertitel (Whisper, Schreibweisen korrigiert) ----------
const WORDS: [string, number][] = [
  ["Longsleeves", 0.0], ["für", 0.88], ["0", 1.14], ["Euro!", 1.48],
  ["Ja", 2.16], ["Jungs,", 2.26], ["es", 2.6], ["ist", 2.82], ["kein", 2.98], ["Cap,", 3.22], ["alles", 3.62], ["was", 3.74], ["ihr", 3.84], ["machen", 3.96], ["müsst,", 4.18], ["ist", 4.4], ["das", 4.48], ["Video", 4.58], ["bis", 4.8], ["zum", 4.94], ["Ende", 5.12], ["schauen.", 5.36],
  ["Wir", 5.74], ["haben", 5.82], ["die", 5.9], ["krasseste", 6.38], ["Black", 6.9], ["Friday", 7.1], ["Aktion!", 7.3],
  ["Und", 7.92], ["das,", 7.94], ["weil", 8.22], ["ihr", 8.32], ["den", 8.48], ["550", 8.8], ["GSM", 9.68], ["Tracksuit", 10.3], ["bekommt.", 10.82],
  ["Für", 11.3], ["was?", 11.5], ["Für", 11.94], ["69", 12.24], ["Euro!", 13.5],
  ["Wäre", 14.18], ["das", 14.4], ["nicht", 14.56], ["genug,", 14.72], ["verschenken", 15.04], ["wir", 15.24], ["5", 15.4], ["kostenlose", 15.7], ["Longsleeves", 16.18], ["in", 16.72], ["den", 16.86], ["Kommentaren.", 17.02],
  ["Echtes", 17.6], ["Nappaleder,", 18.04], ["100", 18.64], ["%", 18.92], ["Baumwolle", 19.42], ["und", 19.92], ["hier", 20.18], ["habt", 20.44], ["ihr", 20.64], ["so", 20.76], ["ein", 20.94], ["krasses", 21.08], ["Neck", 21.56], ["Detail.", 21.86],
  ["Jogger", 22.56], ["für", 22.84], ["30", 23.04], ["Euro,", 23.5], ["Hoodie", 23.98], ["für", 24.28], ["39", 24.38], ["Euro,", 25.02], ["Puff", 25.82], ["Print,", 26.06], ["Glitzersteine,", 26.4], ["perfekter", 27.3], ["Stack.", 27.7],
  ["Also", 27.96], ["gönnt", 28.48], ["euch", 28.76], ["noch", 28.98], ["einen", 29.16], ["Trackie", 29.42], ["und", 29.72], ["ihr", 29.9], ["kriegt", 29.98], ["dazu", 30.24], ["einen", 30.44], ["Longsleeve", 30.62], ["for", 31.12], ["free.", 31.22],
  ["Macht", 32.02], ["das", 32.08], ["Plus", 32.32], ["weg", 32.5], ["sofort!", 32.68], ["Young", 33.26], ["Boys", 33.44], ["with", 33.74], ["Big", 34.12], ["Dreams!", 34.52],
];
type Cap = { a: number; e: number; text: string };
const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  let cur: [string, number][] = [];
  WORDS.forEach(([w, s], i) => {
    const next = WORDS[i + 1];
    cur.push([w, s]);
    if (cur.length >= 3 || /[.,!?]$/.test(w) || !next) {
      out.push({ a: cur[0][1], e: next ? Math.min(next[1], s + 1.3) : s + 0.5, text: cur.map(([x]) => x).join(" ").replace(/[.,!?]+$/, "").replace("100 %", "100 %").toUpperCase() });
      cur = [];
    }
  });
  return out;
})();
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find((x) => t >= x.a && t < x.e);
  if (!c) return null;
  return <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>;
};

// ---------- Kamera: ruhige Zoomsprünge auf betonten Wörtern ----------
type Z = [number, number, number, number];
const ZK: Z[] = [
  [0, 1.08, 540, 700], [0.4, 1.0, 540, 700], [1.87, 1.0, 540, 700],
  [1.883, 1.0, 540, 600], [5.69, 1.04, 540, 600],
  [5.7, 1.0, 540, 600], [6.37, 1.0, 540, 600], [6.38, 1.08, 540, 520], [7.59, 1.08, 540, 520],
  [7.6, 1.0, 540, 600], [12.23, 1.0, 540, 600], [12.24, 1.07, 540, 560], [14.1, 1.07, 540, 560],
  [14.117, 1.0, 540, 600], [17.37, 1.03, 540, 600],
  [17.383, 1.0, 540, 600], [22.44, 1.04, 540, 600],
  [22.45, 1.0, 540, 600], [29.41, 1.0, 540, 600], [29.42, 1.07, 560, 520], [31.9, 1.07, 560, 520], [32.0, 1.0, 540, 600], [34.94, 1.05, 540, 560],
];
const cam = (t: number) => {
  if (t <= ZK[0][0]) return ZK[0];
  for (let i = 1; i < ZK.length; i++) {
    if (t <= ZK[i][0]) {
      const a = ZK[i - 1];
      const c = ZK[i];
      const p = IO((t - a[0]) / Math.max(0.001, c[0] - a[0]));
      return [t, a[1] + (c[1] - a[1]) * p, a[2] + (c[2] - a[2]) * p, a[3] + (c[3] - a[3]) * p] as Z;
    }
  }
  return ZK[ZK.length - 1];
};

// ---------- Fotos: kurz, groß, Hintergrund unscharf ----------
type Card = { a: number; e: number; img: string; w: number; h: number; cy: number; pos?: string; zoom?: [number, number] };
const CARDS: Card[] = [
  { a: 0.05, e: 1.86, img: "ls_flat.jpg", w: 600, h: 800, cy: 700 },
  { a: 17.6, e: 18.6, img: "ls_patch.jpg", w: 760, h: 1013, cy: 820 },
  { a: 18.64, e: 19.88, img: "ls_logo.jpg", w: 760, h: 1013, cy: 820 },
  { a: 21.0, e: 22.4, img: "ls_patch.jpg", w: 760, h: 1013, cy: 820, pos: "62% 45%", zoom: [1.25, 1.45] },
  { a: 22.56, e: 25.7, img: "poster_grey.jpg", w: 330, h: 831, cy: 860 },
  { a: 25.82, e: 26.37, img: "puff.jpg", w: 620, h: 1102, cy: 860, pos: "50% 45%" },
  { a: 26.4, e: 27.27, img: "glitzer.jpg", w: 680, h: 1020, cy: 860 },
  { a: 27.3, e: 27.94, img: "stack.jpg", w: 620, h: 1102, cy: 860 },
];
const blurAt = (t: number) => {
  const hold: [number, number][] = [[25.82, 27.94]];
  return [...CARDS.map((c) => [c.a, c.e] as [number, number]), ...hold].reduce((m, [a, e]) => Math.max(m, interpolate(t, [a - 0.02, a + 0.16, e - 0.12, e + 0.02], [0, 1, 1, 0], clamp)), 0);
};
const CardView: React.FC<{ c: Card; t: number }> = ({ c, t }) => {
  if (t < c.a || t >= c.e) return null;
  const inP = ease(t, c.a, 0.24);
  const outP = interpolate(t, [c.e - 0.1, c.e], [0, 1], clamp);
  const z = c.zoom ? interpolate(t, [c.a, c.e], c.zoom, clamp) : 1 + 0.03 * ((t - c.a) / (c.e - c.a));
  const left = c.a > 22 && c.a < 23 ? 90 : 540 - c.w / 2;
  return (
    <div style={{ position: "absolute", left, top: c.cy - c.h / 2, width: c.w, height: c.h, borderRadius: 26, overflow: "hidden", background: "#111", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 3) * (1 - outP), transform: `scale(${0.8 + 0.2 * inP - 0.03 * outP})` }}>
      <Img src={staticFile(`ls/img/${c.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.pos ?? "50% 50%", transform: `scale(${z})`, transformOrigin: c.pos ?? "50% 50%" }} />
    </div>
  );
};
const Chip: React.FC<{ p: number; style?: React.CSSProperties; children: React.ReactNode; dark?: boolean }> = ({ p, style, children, dark }) => (
  <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 12, background: dark ? "rgba(17,17,17,0.92)" : "#FFFFFF", color: dark ? "#FFFFFF" : INK, borderRadius: 20, padding: "12px 24px", boxShadow: "0 14px 36px rgba(0,0,0,0.35)", fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, letterSpacing: "0.04em", whiteSpace: "nowrap", opacity: p, transform: `translateY(${(1 - p) * 20}px) scale(${0.92 + 0.08 * p})`, ...style }}>{children}</div>
);
const inOut = (t: number, a: number, e: number, len = 0.22) => ease(t, a, len) * (1 - interpolate(t, [e - 0.14, e], [0, 1], clamp));

// ---------- Hook: 1 € durchgestrichen, dann 0 € ----------
const HookPrice: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0.85 || t >= 1.86) return null;
  const p1 = ease(t, 0.88, 0.2);
  const st = interpolate(t, [1.14, 1.28], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const p0 = ease(t, 1.3, 0.22);
  const o = 1 - interpolate(t, [1.74, 1.86], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1130, display: "flex", justifyContent: "center", alignItems: "center", gap: 34, opacity: o }}>
      <div style={{ position: "relative", fontFamily: "'Anton'", fontSize: 150, lineHeight: 1, color: "#FFFFFF", opacity: p1 * (1 - 0.45 * st), textShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
        1 €
        <div style={{ position: "absolute", left: -14, right: -14, top: "50%", height: 14, background: RED, borderRadius: 7, transform: `rotate(-8deg) scaleX(${st})`, transformOrigin: "left center" }} />
      </div>
      <div style={{ fontFamily: "'Anton'", fontSize: 190, lineHeight: 1, color: RED, opacity: p0, transform: `scale(${0.8 + 0.2 * p0})`, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>0 €</div>
    </div>
  );
};

// ---------- bis zum Ende schauen: kleiner roter Balken direkt über den Untertiteln (Kunde: nicht aufs Gesicht) ----------
const WatchBar: React.FC<{ t: number }> = ({ t }) => {
  if (t < 4.4) return null;
  const p = ease(t, 4.4, 0.4);
  const fill = interpolate(t, [4.4, 33.26], [0, 1], clamp);
  const done = t >= 33.26;
  const pop = interpolate(t, [33.26, 33.36, 33.5], [1, 1.08, 1], clamp);
  const col = done ? "#22C55E" : RED;
  return (
    <div style={{ position: "absolute", top: 1332, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 14}px) scale(${pop})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(12,12,12,0.72)", borderRadius: 24, padding: "8px 10px 8px 18px" }}>
        <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 19, letterSpacing: "0.14em", color: "#FFFFFF" }}>{done ? "GESCHAFFT" : "BIS ZUM ENDE"}</span>
        <div style={{ width: 230, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 5, background: col }} />
        </div>
        <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 19, letterSpacing: "0.06em", color: "#FFFFFF", background: col, borderRadius: 16, padding: "5px 12px" }}>LONGSLEEVE 0 €</span>
      </div>
    </div>
  );
};

// ---------- Black Friday, 80 % ----------
const BlackFriday: React.FC<{ t: number }> = ({ t }) => {
  if (t < 6.38 || t >= 7.6) return null;
  const a = inOut(t, 6.38, 7.6);
  const b = inOut(t, 6.9, 7.6);
  return (
    <>
      <Chip p={a} dark style={{ left: 140, top: 990, fontSize: 44, padding: "16px 30px" }}>BLACK FRIDAY</Chip>
      <Chip p={b} style={{ left: 420, top: 1110, background: RED, color: "#FFFFFF", fontFamily: "'Anton'", fontWeight: 400, fontSize: 64, padding: "10px 28px 6px" }}>BIS ZU 80 %</Chip>
    </>
  );
};

// ---------- 550 GSM: dicker Stoff, Winterjacke wird gestrichen ----------
const Gsm: React.FC<{ t: number }> = ({ t }) => {
  if (t < 8.7 || t >= 11.25) return null;
  const p = inOut(t, 8.7, 11.25, 0.3);
  const n = Math.round(550 * interpolate(t, [8.8, 9.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const layers = interpolate(t, [8.8, 9.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const jacket = ease(t, 10.0, 0.25);
  const st = interpolate(t, [10.4, 10.58], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 90, right: 170, top: 900, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <div style={{ background: "rgba(14,14,14,0.86)", borderRadius: 30, padding: "26px 34px", boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <span style={{ fontFamily: "'Anton'", fontSize: 130, lineHeight: 0.9, color: "#FFFFFF" }}>{n}</span>
          <span style={{ fontFamily: "'Anton'", fontSize: 60, lineHeight: 1, color: "#FFFFFF", opacity: ease(t, 9.68, 0.2) }}>GSM</span>
        </div>
        {/* Stoff im Querschnitt: Lagen bauen sich auf */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 5 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const q = interpolate(layers, [i * 0.15, i * 0.15 + 0.4], [0, 1], clamp);
            return <div key={i} style={{ height: 12, borderRadius: 6, width: `${q * 100}%`, background: `rgba(255,255,255,${0.9 - i * 0.12})` }} />;
          })}
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16, opacity: jacket }}>
          <svg width={46} height={46} viewBox="-12 -12 24 24">
            {[0, 60, 120].map((r) => (
              <g key={r} transform={`rotate(${r})`}>
                <path d="M0 -10 V10 M-3 -7 L0 -4 L3 -7 M-3 7 L0 4 L3 7" stroke="#9FD3FF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
              </g>
            ))}
          </svg>
          <div style={{ position: "relative", fontFamily: "'Inter'", fontWeight: 700, fontSize: 46, color: st > 0.5 ? "rgba(255,255,255,0.55)" : "#FFFFFF", letterSpacing: "0.04em" }}>
            WINTERJACKE
            <div style={{ position: "absolute", left: -8, right: -8, top: "52%", height: 9, borderRadius: 5, background: RED, transform: `scaleX(${st})`, transformOrigin: "left center" }} />
          </div>
          <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, color: "#FFFFFF", opacity: ease(t, 10.6, 0.25) }}>brauchst du nicht</span>
        </div>
      </div>
    </div>
  );
};

// ---------- 69 € statt 144 € ----------
const Price69: React.FC<{ t: number }> = ({ t }) => {
  if (t < 12.2 || t >= 14.1) return null;
  const p = inOut(t, 12.24, 14.1);
  const old = inOut(t, 12.6, 14.1);
  const pw = inOut(t, 13.5, 14.1, 0.18);
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 960, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
        <span style={{ fontFamily: "'Anton'", fontSize: 190, lineHeight: 1, color: RED, opacity: p, transform: `scale(${0.85 + 0.15 * p})`, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>69 €</span>
        <span style={{ position: "relative", fontFamily: "'Anton'", fontSize: 70, color: "#FFFFFF", opacity: old * 0.85, textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
          144 €
          <div style={{ position: "absolute", left: -6, right: -6, top: "52%", height: 7, background: RED, borderRadius: 4, transform: "rotate(-8deg)" }} />
        </span>
      </div>
      <Chip p={pw} dark style={{ position: "relative", fontSize: 28 }}>
        <svg width={22} height={26} viewBox="0 0 20 24"><rect x={2} y={10} width={16} height={12} rx={3} fill="#FFF" /><path d="M5.5 10 V7 a4.5 4.5 0 0 1 9 0 V10" stroke="#FFF" strokeWidth={2.4} fill="none" /></svg>
        ALLE PASSWÖRTER SIND SCHON WEG
      </Chip>
    </div>
  );
};

// ---------- 5 kostenlose Longsleeves in den Kommentaren ----------
const FreeFive: React.FC<{ t: number }> = ({ t }) => {
  if (t < 15.3 || t >= 17.4) return null;
  const o = 1 - interpolate(t, [17.26, 17.4], [0, 1], clamp);
  const lab = ease(t, 15.7, 0.25);
  const com = ease(t, 16.86, 0.25);
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 930, display: "flex", flexDirection: "column", alignItems: "center", opacity: o }}>
      <div style={{ display: "flex", gap: 12 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const q = ease(t, 15.4 + i * 0.09, 0.26);
          return (
            <div key={i} style={{ width: 150, height: 200, borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.4)", border: "3px solid #FFFFFF", opacity: q, transform: `translateY(${(1 - q) * 40}px) rotate(${(i - 2) * 3}deg)` }}>
              <Img src={staticFile("ls/img/ls_flat.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 40%" }} />
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, fontFamily: "'Anton'", fontSize: 64, color: "#FFFFFF", textShadow: "0 6px 24px rgba(0,0,0,0.5)", opacity: lab }}>5 LONGSLEEVES GRATIS</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, letterSpacing: "0.12em", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)", opacity: com }}>
        <svg width={30} height={30} viewBox="0 0 24 24"><path d="M4 5 h16 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 H10 l-5 4 v-4 H4 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2 Z" fill="#FFFFFF" /></svg>
        IN DEN KOMMENTAREN
      </div>
    </div>
  );
};

// ---------- Hinweise zu den Detail-Fotos ----------
const DetailChips: React.FC<{ t: number }> = ({ t }) => (
  <>
    {t >= 17.8 && t < 18.6 && <Chip p={inOut(t, 17.85, 18.6)} style={{ left: 180, top: 1180 }}>ECHTES NAPPALEDER</Chip>}
    {t >= 18.7 && t < 19.88 && <Chip p={inOut(t, 18.75, 19.88)} style={{ left: 220, top: 1180 }}>100 % BAUMWOLLE</Chip>}
    {t >= 21.1 && t < 22.4 && <Chip p={inOut(t, 21.5, 22.4)} style={{ left: 250, top: 1180 }}>NECK DETAIL</Chip>}
  </>
);
// Jogger 30 €, Hoodie 39 € (Preise wie auf dem Poster)
const GreyPrices: React.FC<{ t: number }> = ({ t }) => {
  if (t < 22.9 || t >= 25.7) return null;
  const row = (label: string, now: string, old: string, a: number, top: number) => {
    const q = inOut(t, a, 25.7);
    return (
      <Chip p={q} style={{ left: 470, top, alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 30 }}>{label}</span>
        <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 40, color: "#8A8A8A", textDecoration: "line-through" }}>{old}</span>
        <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 60, color: RED }}>{now}</span>
      </Chip>
    );
  };
  return (
    <>
      {row("JOGGER", "30 €", "65 €", 23.04, 760)}
      {t >= 24.3 && row("HOODIE", "39 €", "79 €", 24.38, 900)}
    </>
  );
};
const DetailLabel: React.FC<{ t: number }> = ({ t }) => (
  <>
    {t >= 25.82 && t < 26.37 && <Chip p={inOut(t, 25.86, 26.37, 0.15)} style={{ left: 330, top: 1250 }}>PUFF PRINT</Chip>}
    {t >= 26.4 && t < 27.27 && <Chip p={inOut(t, 26.44, 27.27, 0.15)} style={{ left: 300, top: 1250 }}>GLITZERSTEINE</Chip>}
    {t >= 27.3 && t < 27.94 && <Chip p={inOut(t, 27.34, 27.94, 0.15)} style={{ left: 290, top: 1250 }}>PERFEKTER STACK</Chip>}
  </>
);

// ---------- Trackie + Longsleeve gratis ----------
const Combo: React.FC<{ t: number }> = ({ t }) => {
  if (t < 29.4 || t >= 31.85) return null;
  const a = inOut(t, 29.42, 31.85);
  const b = inOut(t, 30.62, 31.85);
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1000, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
      <Chip p={a} style={{ position: "relative", alignItems: "baseline" }}>
        <span>TRACKIE</span>
        <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 56, color: RED }}>69 €</span>
      </Chip>
      <span style={{ fontFamily: "'Anton'", fontSize: 70, color: "#FFFFFF", opacity: b, textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>+</span>
      <Chip p={b} style={{ position: "relative", alignItems: "baseline" }}>
        <span>LONGSLEEVE</span>
        <span style={{ fontFamily: "'Anton'", fontWeight: 400, fontSize: 56, color: "#1FA84F" }}>0 €</span>
      </Chip>
    </div>
  );
};

// ---------- Schluss: FOLGEN und Instagram ----------
const TT_RED = "#FE2C55";
const Follow: React.FC<{ t: number }> = ({ t }) => {
  if (t < 31.95) return null;
  const p = ease(t, 31.95, 0.25);
  const check = 32.32;
  const done = t >= check;
  const pop = interpolate(t, [check, check + 0.08, check + 0.2], [1, 1.25, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, top: 320, width: 130, height: 160, opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
      <div style={{ width: 130, height: 130, borderRadius: 65, background: "#1E1712", border: "4px solid #FFFFFF", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
        <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 66 }} />
      </div>
      <div style={{ position: "absolute", left: 39, top: 104, width: 52, height: 52, borderRadius: 26, background: done ? "#FFFFFF" : TT_RED, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})` }}>
        {done ? (
          <svg width={30} height={30} viewBox="0 0 22 22"><path d="M5 11.5 L9.5 16 L17 6.5" stroke={TT_RED} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg width={28} height={28} viewBox="0 0 20 20"><path d="M10 3 V17 M3 10 H17" stroke="#FFF" strokeWidth={3.4} strokeLinecap="round" /></svg>
        )}
      </div>
    </div>
  );
};
const IgIcon: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.28, background: "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24"><rect x={3} y={3} width={18} height={18} rx={5.5} fill="none" stroke="#FFF" strokeWidth={2.2} /><circle cx={12} cy={12} r={4.2} fill="none" stroke="#FFF" strokeWidth={2.2} /><circle cx={17.4} cy={6.6} r={1.3} fill="#FFF" /></svg>
  </div>
);
const Instagram: React.FC<{ t: number }> = ({ t }) => {
  if (t < 33.2) return null;
  const a = ease(t, 33.26, 0.25);
  const b = ease(t, 33.74, 0.25);
  const row = (name: string, sub: string, q: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", borderRadius: 24, padding: "12px 24px 12px 12px", boxShadow: "0 14px 36px rgba(0,0,0,0.35)", opacity: q, transform: `translateY(${(1 - q) * 20}px)` }}>
      <IgIcon s={64} />
      <div style={{ fontFamily: "'Inter'", lineHeight: 1.15 }}>
        <div style={{ fontWeight: 700, fontSize: 32, color: INK }}>{name}</div>
        <div style={{ fontWeight: 600, fontSize: 20, color: "#6B6B70" }}>{sub}</div>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1010, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {row("saliteclothing", "Instagram", a)}
      {row("Salo Salité", "Instagram", b)}
    </div>
  );
};

export const LongsleeveTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / LS.fps;
  const [, k, fx, fy] = cam(t);
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  const blur = blurAt(t);
  const grade = "brightness(1.02) contrast(1.05) saturate(1.04)";
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: `${grade}${blur > 0.02 ? ` blur(${blur * 14}px) brightness(${1 - 0.25 * blur})` : ""}`, transform: blur > 0 ? `scale(${1 + 0.04 * blur})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile("ls/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </div>
      </div>
      {CARDS.map((c, i) => (
        <CardView key={i} c={c} t={t} />
      ))}
      <HookPrice t={t} />
      <WatchBar t={t} />
      <BlackFriday t={t} />
      <Gsm t={t} />
      <Price69 t={t} />
      <FreeFive t={t} />
      <DetailChips t={t} />
      <GreyPrices t={t} />
      <DetailLabel t={t} />
      <Combo t={t} />
      <Follow t={t} />
      <Instagram t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
