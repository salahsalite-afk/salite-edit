import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Story-TikTok "Meine Freundin ist mit meinem besten Freund fremdgegangen" (Wendung: es geht um den Trackie).
// V2 (Kunde): kein Titel, kein Gesichtskreis, keine Musik. Alles nur kurz einblenden, dazwischen Gesicht und Körpersprache.
// Pärchen-Foto reißt kurz, Billard mit SJ als bestem Freund, iPhone kurz (Mitteilung von "Cindy", Chat öffnet),
// ihre Nachrichten als iMessage-Blasen unter dem Gesicht, Poster, Passwort-Seite, letzte Größen, KOMMENTAR, FOLGEN.
// Ton mischt scripts/story_mix.py, das Bild wird stumm gerendert.
export const ST = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * ST.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.2, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const RED = "#E3262B";
const TT_RED = "#FE2C55";
const INK = "#111111";
export const ST_TOTAL = 33.9;
export const ST_FRAMES = f(ST_TOTAL);

// ---------- Untertitel (Wörter aus Whisper, Schreibweisen korrigiert) ----------
const WORDS: [string, number][] = [
  ["Meine", 0.0], ["Freundin", 0.22], ["ist", 0.62], ["mit", 0.74], ["meinem", 0.88], ["besten", 1.16], ["Freund", 1.48], ["fremdgegangen.", 1.8],
  ["Ja", 2.58], ["Leute,", 2.64], ["ich", 2.8], ["war", 2.9], ["mit", 3.06], ["SJ", 3.26], ["Billard", 3.54], ["spielen", 4.04], ["und", 4.08], ["dann", 4.28], ["habe", 4.38], ["ich", 4.52], ["eine", 4.68], ["Nachricht", 4.88], ["auf", 5.0], ["seinem", 5.16], ["Handy", 5.32], ["gesehen.", 5.6],
  ["Und", 6.24], ["ratet", 6.4], ["mal", 6.78], ["was,", 7.0], ["ich", 7.36], ["sehe", 7.48], ["eine", 7.64], ["Nachricht", 7.8], ["von", 8.36], ["meiner", 8.62], ["Freundin", 8.96], ["auf", 9.52], ["seinem", 9.8], ["Handy,", 10.14],
  ["dass", 10.72], ["es", 10.86], ["einen", 11.04], ["550", 11.24], ["GSM", 12.02], ["Trackie", 12.6], ["für", 13.12], ["69", 13.36], ["Euro", 14.1], ["gibt", 14.4], ["und", 14.64], ["der", 14.86], ["ist", 15.02], ["qualitativ", 15.24], ["viel", 15.82], ["besser", 16.04], ["als", 16.3], ["früher.", 16.58],
  ["Und", 16.92], ["sie", 17.08], ["sagt,", 17.38], ["der", 17.82], ["hat", 17.92], ["immer", 18.14], ["noch", 18.36], ["krassen", 18.58], ["Puff", 18.88], ["und", 19.18], ["immer", 19.34], ["noch", 19.58], ["Glitzersteine,", 19.86], ["die", 20.38], ["nicht", 20.42], ["abgehen", 20.58], ["und", 20.8], ["einen", 21.02], ["perfekten", 21.06], ["Stack", 21.6], ["auf", 21.78], ["die", 21.96], ["Schuhe.", 22.16],
  ["Und", 22.44], ["der", 22.56], ["springende", 22.74], ["Punkt", 23.24], ["ist,", 23.56], ["man", 23.84], ["kann", 24.0], ["den", 24.28], ["Trackie", 24.56], ["nur", 24.9], ["mit", 25.12], ["einem", 25.4], ["Passwort", 25.76], ["kaufen.", 26.38],
  ["Damit", 26.86], ["euch", 27.22], ["sowas", 27.62], ["nicht", 27.94], ["passiert,", 28.12], ["kommentiert", 28.74], ["jetzt", 29.06], ["rein,", 29.38], ["ich", 29.8], ["brauche", 29.8], ["ein", 30.1], ["Passwort.", 30.32],
  ["Macht", 31.04], ["das", 31.16], ["Plus", 31.4], ["weg", 31.58], ["und", 31.78], ["dann", 31.98], ["kriegt", 32.06], ["ihr", 32.32], ["vielleicht", 32.44], ["mit", 32.68], ["Glück", 32.84], ["noch", 32.98], ["ein", 33.16], ["Passwort.", 33.36],
];
type Cap = { a: number; e: number; text: string };
const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  let cur: [string, number][] = [];
  WORDS.forEach(([w, s], i) => {
    const next = WORDS[i + 1];
    cur.push([w, s]);
    if (cur.length >= 3 || /[.,]$/.test(w) || !next) {
      out.push({ a: cur[0][1], e: next ? Math.min(next[1], s + 1.3) : s + 0.5, text: cur.map(([x]) => x).join(" ").replace(/[.,]+$/, "").toUpperCase() });
      cur = [];
    }
  });
  return out;
})();
const Captions: React.FC<{ t: number; hidden: boolean }> = ({ t, hidden }) => {
  const c = !hidden && CAPS.find((x) => t >= x.a && t < x.e);
  if (!c) return null;
  return <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>;
};

// ---------- Kamera: Zoomsprünge auf betonten Wörtern ----------
type Z = [number, number, number, number];
const ZK: Z[] = [
  [0, 1.12, 540, 760], [0.3, 1.0, 540, 760], [2.46, 1.0, 540, 760],
  [2.467, 1.0, 540, 620], [5.96, 1.04, 540, 620],
  [5.967, 1.0, 540, 620], [6.39, 1.0, 540, 620], [6.4, 1.13, 540, 600], [10.64, 1.13, 540, 600],
  [10.65, 1.0, 540, 620], [22.36, 1.0, 540, 620],
  [22.367, 1.0, 540, 620], [26.94, 1.0, 540, 620],
  [26.95, 1.0, 540, 620], [27.61, 1.0, 540, 620], [27.62, 1.1, 540, 600], [30.9, 1.1, 540, 600], [31.0, 1.0, 540, 620], [33.9, 1.05, 540, 620],
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

// Zeitfenster, in denen eine Ebene über dem Video liegt (Hintergrund unscharf)
// V2 (Kunde): alles nur kurz einblenden, dazwischen Gesicht und Körpersprache
const OVER: [number, number][] = [
  [0.85, 2.1],
  [3.45, 4.5],
  [4.85, 5.95],
  [8.55, 10.1],
  [22.45, 23.85],
  [24.9, 26.35],
];
const blurAt = (t: number) => OVER.reduce((m, [a, e]) => Math.max(m, interpolate(t, [a - 0.02, a + 0.2, e - 0.15, e + 0.02], [0, 1, 1, 0], clamp)), 0);

// ---------- Hook: TikTok-Titel und Pärchen-Foto, das bei "fremdgegangen" zerreißt ----------
const JAG = [0.5, 0.47, 0.53, 0.46, 0.52, 0.48, 0.55, 0.49, 0.51, 0.46, 0.53, 0.5];
const Torn: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0.85 || t >= 2.1) return null;
  const W = 640;
  const H = 853;
  const p = ease(t, 0.85, 0.2);
  const tear = ease(t, 1.85, 0.25, Easing.out(Easing.cubic));
  const out = interpolate(t, [1.98, 2.1], [1, 0], clamp);
  const pts = JAG.map((x, i) => `${x * 100}% ${(i / (JAG.length - 1)) * 100}%`);
  const left = `polygon(0% 0%, ${pts.join(", ")}, 0% 100%)`;
  const right = `polygon(100% 0%, ${pts.join(", ")}, 100% 100%)`;
  const half = (clip: string, dir: number) => (
    <div style={{ position: "absolute", inset: 0, clipPath: clip, transform: `translateX(${dir * 70 * tear}px) translateY(${tear * 30}px) rotate(${dir * 9 * tear}deg)`, transformOrigin: dir < 0 ? "0% 100%" : "100% 100%" }}>
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", padding: 16, boxSizing: "border-box", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
        <Img src={staticFile("story/img/paar.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 540 - W / 2, top: 520, width: W, height: H, opacity: Math.min(1, p * 2) * out, transform: `scale(${0.9 + 0.1 * p}) rotate(-3deg)` }}>
      {half(left, -1)}
      {half(right, 1)}
    </div>
  );
};

// ---------- Karten (Billard, Poster, Passwort-Seite) ----------
type Card = { a: number; e: number; w: number; h: number; cy: number; node: () => React.ReactNode; click?: boolean };
const CARDS: Card[] = [
  { a: 3.45, e: 4.5, w: 600, h: 1067, cy: 980, node: () => <Img src={staticFile("story/img/billard.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> },
  { a: 22.45, e: 23.85, w: 860, h: 1075, cy: 840, click: true, node: () => <Img src={staticFile("story/img/poster.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> },
  {
    a: 24.9, e: 26.35, w: 640, h: 1138, cy: 840, click: true,
    node: () => (
      <Sequence from={f(24.9)} layout="none">
        <OffthreadVideo src={staticFile("story/web.mp4")} trimBefore={12} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
    ),
  },
];
const CardView: React.FC<{ c: Card; t: number }> = ({ c, t }) => {
  if (t < c.a || t >= c.e) return null;
  const inP = ease(t, c.a, 0.26);
  const outP = interpolate(t, [c.e - 0.1, c.e], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 540 - c.w / 2, top: c.cy - c.h / 2, width: c.w, height: c.h, borderRadius: 26, overflow: "hidden", background: "#111", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 3) * (1 - outP), transform: `scale(${0.74 + 0.26 * inP - 0.04 * outP})` }}>
      {c.node()}
    </div>
  );
};
const Cursor: React.FC<{ t: number }> = ({ t }) => {
  const c = CARDS.find((x) => x.click && t >= x.a - 0.32 && t < x.a + 0.32);
  if (!c) return null;
  const tx = 600;
  const ty = c.cy + 60;
  const m = ease(t, c.a - 0.32, 0.28, Easing.out(Easing.cubic));
  const x = 860 + (tx - 860) * m;
  const y = 1380 + (ty - 1380) * m;
  const press = interpolate(t, [c.a - 0.04, c.a, c.a + 0.08], [1, 0.82, 1], clamp);
  const fade = 1 - interpolate(t, [c.a + 0.12, c.a + 0.32], [0, 1], clamp);
  const ring = interpolate(t, [c.a, c.a + 0.3], [0, 1], clamp);
  return (
    <>
      {t >= c.a && <div style={{ position: "absolute", left: tx - 70 * ring, top: ty - 70 * ring, width: 140 * ring, height: 140 * ring, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.9)", opacity: 1 - ring }} />}
      <svg width={70} height={90} viewBox="0 0 28 36" style={{ position: "absolute", left: x - 6, top: y - 4, opacity: fade, transform: `scale(${press})`, transformOrigin: "6px 4px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}>
        <path d="M2 2 L2 28 L9 21.5 L13.5 32 L18 30 L13.6 19.8 L23 19.8 Z" fill="#FFFFFF" stroke="#111111" strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
    </>
  );
};
const Chip: React.FC<{ children: React.ReactNode; p: number; style?: React.CSSProperties }> = ({ children, p, style }) => (
  <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 14, borderRadius: 20, padding: "12px 26px", boxShadow: "0 14px 36px rgba(0,0,0,0.35)", whiteSpace: "nowrap", opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, ...style }}>{children}</div>
);
const Offer: React.FC<{ t: number }> = ({ t }) => {
  if (t < 22.8 || t >= 26.35) return null;
  const pP = ease(t, 22.9, 0.25);
  const p80 = ease(t, 23.3, 0.22);
  const pPw = ease(t, 25.6, 0.25) * (1 - interpolate(t, [26.25, 26.35], [0, 1], clamp));
  const posterOut = 1 - interpolate(t, [23.75, 23.85], [0, 1], clamp);
  return (
    <>
      <div style={{ opacity: posterOut }}>
        <Chip p={pP} style={{ left: 90, top: 1140, background: "#FFFFFF", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Anton'", fontSize: 54, color: "#8A8A8A", textDecoration: "line-through" }}>144 €</span>
          <span style={{ fontFamily: "'Anton'", fontSize: 96, color: RED }}>69 €</span>
        </Chip>
        <Chip p={p80} style={{ right: 150, top: 1150, background: RED }}>
          <span style={{ fontFamily: "'Anton'", fontSize: 76, color: "#FFFFFF" }}>BIS ZU 80 %</span>
        </Chip>
      </div>
      {t >= 25.55 && (
        <Chip p={pPw} style={{ left: 250, top: 1180, background: INK }}>
          <svg width={30} height={36} viewBox="0 0 20 24">
            <rect x={2} y={10} width={16} height={12} rx={3} fill="#FFF" />
            <path d="M5.5 10 V7 a4.5 4.5 0 0 1 9 0 V10" stroke="#FFF" strokeWidth={2.4} fill="none" />
          </svg>
          <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 36, letterSpacing: "0.06em", color: "#FFFFFF" }}>NUR MIT PASSWORT</span>
        </Chip>
      )}
    </>
  );
};

// ---------- iPhone mit Sperrbildschirm und iMessage ----------
const PH = { x: 250, y: 210, w: 580, h: 1189 };
const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const c = dark ? "#000" : "#FFF";
  return (
    <div style={{ position: "absolute", top: 24, left: 44, right: 40, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 25, color: c }}>
      <span>21:47</span>
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <svg width={30} height={20} viewBox="0 0 30 20">{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 8} y={14 - i * 4} width={5.5} height={6 + i * 4} rx={1.5} fill={c} />)}</svg>
        <span style={{ fontSize: 21 }}>5G</span>
        <svg width={40} height={20} viewBox="0 0 40 20"><rect x={1} y={2} width={33} height={16} rx={5} fill="none" stroke={c} strokeOpacity={0.5} strokeWidth={2} /><rect x={4} y={5} width={22} height={10} rx={3} fill={c} /><rect x={36} y={7} width={3} height={6} rx={1.5} fill={c} fillOpacity={0.5} /></svg>
      </span>
    </div>
  );
};
const MsgIcon: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.24, background: "linear-gradient(180deg, #5CF777, #0ABE34)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={s * 0.68} height={s * 0.6} viewBox="0 0 24 21"><path d="M12 1 C5.9 1 1 4.9 1 9.6 c0 2.6 1.5 4.9 3.9 6.5 L3.8 20 l4.6-2.4 c1.1 0.3 2.3 0.4 3.6 0.4 c6.1 0 11-3.9 11-8.6 S18.1 1 12 1 Z" fill="#FFF" /></svg>
  </div>
);
const LockScreen: React.FC<{ t: number }> = ({ t }) => {
  const nIn = ease(t, 4.95, 0.3);
  const tap = interpolate(t, [8.88, 8.96, 9.06], [1, 0.96, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #20263a 0%, #3b2d4f 55%, #5a3a4a 100%)" }}>
      <StatusBar />
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 26, color: "rgba(255,255,255,0.85)" }}>Samstag, 22. November</div>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 150, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.92)" }}>21:47</div>
      <div style={{ position: "absolute", top: 470, left: 22, right: 22, borderRadius: 34, background: "rgba(245,245,247,0.88)", padding: "22px 24px", display: "flex", gap: 18, alignItems: "center", opacity: nIn, transform: `translateY(${(1 - nIn) * -40}px) scale(${tap})` }}>
        <MsgIcon s={70} />
        <div style={{ flex: 1, fontFamily: "'Inter'" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 25, color: "#1C1C1E" }}>Cindy</span>
            <span style={{ fontWeight: 600, fontSize: 21, color: "#6B6B70" }}>jetzt</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 25, color: "#1C1C1E", marginTop: 6 }}>Benachrichtigung</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: "50%", width: 200, height: 8, marginLeft: -100, borderRadius: 4, background: "rgba(255,255,255,0.8)" }} />
    </AbsoluteFill>
  );
};
type Msg = { at: number; text?: string; img?: string; ih?: number };
const MSGS: Msg[] = [
  { at: 11.0, text: "Es gibt einen 550 GSM Trackie für 69 €" },
  { at: 14.6, text: "und der ist qualitativ viel besser als früher" },
  { at: 17.3, img: "selfie.jpg", ih: 534 },
  { at: 18.5, text: "der hat immer noch krassen Puff" },
  { at: 18.95, img: "puff.jpg", ih: 534 },
  { at: 19.86, text: "und Glitzersteine die nicht abgehen" },
  { at: 21.02, text: "perfekter Stack auf die Schuhe" },
  { at: 21.6, img: "stack.jpg", ih: 534 },
];
const TYPING: [number, number][] = [[9.35, 10.1]];
const Typing: React.FC<{ t: number }> = ({ t }) => {
  const on = TYPING.find(([a, e]) => t >= a && t < e);
  if (!on) return null;
  return (
    <div style={{ alignSelf: "flex-start", marginTop: 10, background: "#E9E9EB", borderRadius: 30, padding: "18px 24px", display: "flex", gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: "#8E8E93", opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t * 6 - i * 0.7) * Math.PI)) }} />
      ))}
    </div>
  );
};
const Chat: React.FC<{ t: number }> = ({ t }) => {
  const visible = MSGS.filter((m) => t >= m.at && m.at < 10.1);
  return (
    <AbsoluteFill style={{ background: "#FFFFFF" }}>
      <StatusBar dark />
      {/* Kopf */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, height: 150, borderBottom: "1px solid #E5E5EA", background: "rgba(249,249,249,0.96)", zIndex: 2 }}>
        <svg width={26} height={44} viewBox="0 0 13 22" style={{ position: "absolute", left: 24, top: 40 }}><path d="M11 2 L2 11 L11 20" stroke="#0A84FF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 84, height: 84, borderRadius: 42, overflow: "hidden", background: "#C7C7CC" }}>
            <Img src={staticFile("story/img/selfie.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "38% 24%", transform: "scale(2.2)", transformOrigin: "38% 30%" }} />
          </div>
          <div style={{ marginTop: 6, fontFamily: "'Inter'", fontWeight: 600, fontSize: 22, color: "#1C1C1E" }}>Cindy ›</div>
        </div>
        <svg width={44} height={30} viewBox="0 0 30 20" style={{ position: "absolute", right: 28, top: 46 }}><rect x={1} y={3} width={19} height={14} rx={4} fill="none" stroke="#0A84FF" strokeWidth={2.4} /><path d="M21 8 L28 4 V16 L21 12 Z" fill="#0A84FF" /></svg>
      </div>
      {/* Verlauf, unten ausgerichtet */}
      <div style={{ position: "absolute", top: 230, bottom: 110, left: 18, right: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
        <div style={{ textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 19, color: "#8E8E93", marginBottom: 12 }}>iMessage<br />Heute 21:46</div>
        {visible.map((m, i) => {
          const p = ease(t, m.at, 0.28);
          const hMax = m.img ? (m.ih ?? 500) + 20 : 220;
          return (
            <div key={i} style={{ maxHeight: hMax * p, overflow: "hidden", display: "flex", flexShrink: 0 }}>
              <div style={{ marginTop: 10, transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: "left bottom", opacity: p }}>
                {m.img ? (
                  <Img src={staticFile(`story/img/${m.img}`)} style={{ width: 300, height: m.ih, objectFit: "cover", borderRadius: 26, display: "block" }} />
                ) : (
                  <div style={{ maxWidth: 440, background: "#E9E9EB", color: "#000", fontFamily: "'Inter'", fontWeight: 600, fontSize: 34, lineHeight: 1.26, padding: "16px 26px", borderRadius: 32 }}>{m.text}</div>
                )}
              </div>
            </div>
          );
        })}
        <Typing t={t} />
      </div>
      {/* Eingabe */}
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 34, height: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: "#E9E9EB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 36, color: "#8E8E93" }}>+</div>
        <div style={{ flex: 1, height: 58, borderRadius: 29, border: "2px solid #D1D1D6", display: "flex", alignItems: "center", padding: "0 22px", fontFamily: "'Inter'", fontWeight: 500, fontSize: 25, color: "#C7C7CC" }}>iMessage</div>
      </div>
      <div style={{ position: "absolute", bottom: 12, left: "50%", width: 200, height: 8, marginLeft: -100, borderRadius: 4, background: "#000" }} />
    </AbsoluteFill>
  );
};
const Phone: React.FC<{ t: number }> = ({ t }) => {
  const seg1 = t >= 4.85 && t < 5.95;
  const seg2 = t >= 8.55 && t < 10.1;
  if (!seg1 && !seg2) return null;
  const a = seg1 ? 4.85 : 8.55;
  const e = seg1 ? 5.95 : 10.1;
  const inP = ease(t, a, 0.22);
  const outP = interpolate(t, [e - 0.14, e], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const open = seg2 ? ease(t, 8.98, 0.3) : 0;
  return (
    <div style={{ position: "absolute", left: PH.x, top: PH.y, width: PH.w, height: PH.h, transform: `translateY(${(1 - inP) * 200 + outP * 240 + 60}px) scale(0.9)`, transformOrigin: "50% 0%", opacity: Math.min(1, inP * 2) * (1 - outP) }}>
      {/* Rahmen */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 92, background: "linear-gradient(145deg, #d9dcdf, #9a9ea3 40%, #e4e6e8 60%, #8b8f94)", boxShadow: "0 40px 90px rgba(0,0,0,0.55)" }} />
      <div style={{ position: "absolute", left: -5, top: 230, width: 6, height: 80, borderRadius: 3, background: "#a3a7ab" }} />
      <div style={{ position: "absolute", left: -5, top: 330, width: 6, height: 80, borderRadius: 3, background: "#a3a7ab" }} />
      <div style={{ position: "absolute", right: -5, top: 300, width: 6, height: 130, borderRadius: 3, background: "#a3a7ab" }} />
      <div style={{ position: "absolute", inset: 9, borderRadius: 84, background: "#000" }} />
      <div style={{ position: "absolute", inset: 19, borderRadius: 76, overflow: "hidden", background: "#000" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - open, transform: `translateY(${-open * 200}px)` }}>
          <LockScreen t={t} />
        </div>
        {seg2 && t >= 8.98 && (
          <div style={{ position: "absolute", inset: 0, opacity: open, transform: `scale(${0.94 + 0.06 * open})` }}>
            <Chat t={t} />
          </div>
        )}
        <div style={{ position: "absolute", top: 16, left: "50%", width: 150, height: 44, marginLeft: -75, borderRadius: 22, background: "#000" }} />
      </div>
    </div>
  );
};
// ---------- SJ als bester Freund (auf dem Billard-Foto) ----------
const SjTag: React.FC<{ t: number }> = ({ t }) => {
  if (t < 3.6 || t >= 4.45) return null;
  const p = ease(t, 3.6, 0.2) * (1 - interpolate(t, [4.35, 4.45], [0, 1], clamp));
  return (
    <div style={{ position: "absolute", left: 560, top: 760, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", borderRadius: 30, padding: "10px 22px 10px 12px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 46, height: 46, borderRadius: 23, background: "#1E1712", color: "#FFF", fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>SJ</div>
        <div style={{ fontFamily: "'Inter'", lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: 28, color: INK }}>SJ</div>
          <div style={{ fontWeight: 600, fontSize: 21, color: "#6B6B70" }}>bester Freund</div>
        </div>
      </div>
      <svg width={120} height={110} style={{ position: "absolute", left: 120, top: 70 }}><path d="M10 4 Q 40 60 104 100" stroke="#FFF" strokeWidth={4} fill="none" strokeLinecap="round" /><circle cx={104} cy={100} r={7} fill="#FFF" /></svg>
    </div>
  );
};

// ---------- Ihre Nachrichten: kurz als iMessage-Blasen, Fotos seitlich, Gesicht bleibt frei ----------
type Bub = { a: number; e: number; text?: string; img?: string; side?: "left" | "right" };
const BUBS: Bub[] = [
  { a: 11.0, e: 12.8, text: "Es gibt einen 550 GSM Trackie für 69 €" },
  { a: 14.6, e: 16.3, text: "und der ist qualitativ viel besser als früher" },
  { a: 17.3, e: 18.5, img: "selfie.jpg", side: "left" },
  { a: 18.6, e: 19.85, text: "der hat immer noch krassen Puff", img: "puff.jpg", side: "right" },
  { a: 19.9, e: 20.95, text: "und Glitzersteine die nicht abgehen" },
  { a: 21.0, e: 22.3, text: "perfekter Stack auf die Schuhe", img: "stack.jpg", side: "left" },
];
const Bubbles: React.FC<{ t: number }> = ({ t }) => {
  const b = BUBS.find((x) => t >= x.a && t < x.e);
  if (!b) return null;
  const p = ease(t, b.a, 0.2);
  const o = 1 - interpolate(t, [b.e - 0.14, b.e], [0, 1], clamp);
  return (
    <>
      {b.img && (
        <div style={{ position: "absolute", left: b.side === "left" ? 60 : 640, top: 560, width: 290, height: 516, borderRadius: 28, overflow: "hidden", boxShadow: "0 18px 44px rgba(0,0,0,0.45)", opacity: p * o, transform: `scale(${0.85 + 0.15 * p}) rotate(${b.side === "left" ? -3 : 3}deg)` }}>
          <Img src={staticFile(`story/img/${b.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {b.text && (
        <div style={{ position: "absolute", left: 70, right: 150, top: 1120, display: "flex", flexDirection: "column", alignItems: "center", opacity: p * o, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <MsgIcon s={30} />
            <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>Cindy</span>
          </div>
          <div style={{ maxWidth: 760, background: "#E9E9EB", color: "#000", fontFamily: "'Inter'", fontWeight: 600, fontSize: 40, lineHeight: 1.22, padding: "18px 30px", borderRadius: 36, boxShadow: "0 14px 36px rgba(0,0,0,0.35)", textAlign: "left" }}>{b.text}</div>
        </div>
      )}
    </>
  );
};

// ---------- Exklusiv: nur noch letzte Größen (passiv, oben) ----------
const LastSizes: React.FC<{ t: number }> = ({ t }) => {
  if (t < 26.45 || t >= 28.55) return null;
  const p = ease(t, 26.45, 0.22) * (1 - interpolate(t, [28.4, 28.55], [0, 1], clamp));
  const q = ease(t, 26.75, 0.22);
  const dot = 0.5 + 0.5 * Math.abs(Math.sin((t - 26.45) * 4));
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: p }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFFFFF", borderRadius: 30, padding: "14px 28px", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", transform: `translateY(${(1 - p) * -20}px)` }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: RED, opacity: dot }} />
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, letterSpacing: "0.04em", color: INK }}>NUR NOCH LETZTE GRÖSSEN</span>
      </div>
      <div style={{ background: INK, borderRadius: 30, padding: "12px 26px", opacity: q, transform: `translateY(${(1 - q) * -14}px)` }}>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, letterSpacing: "0.12em", color: "#FFFFFF" }}>EXKLUSIV · NUR MIT PASSWORT</span>
      </div>
    </div>
  );
};

// ---------- FOLGEN und KOMMENTAR ----------
const Follow: React.FC<{ t: number; a: number; check: number; e: number }> = ({ t, a, check, e }) => {
  if (t < a || t >= e) return null;
  const p = ease(t, a, 0.25) * (1 - interpolate(t, [e - 0.2, e], [0, 1], clamp));
  const done = t >= check;
  const pop = interpolate(t, [check, check + 0.08, check + 0.2], [1, 1.25, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, top: 250, width: 130, height: 160, opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
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
export const COMMENT = "Ich brauche ein Passwort";
export const SHEET = { a: 28.6, typeA: 28.8, typeE: 30.42, sent: 30.55, e: 31.0 };
export const typedAt = (i: number) => SHEET.typeA + ((SHEET.typeE - SHEET.typeA) * i) / COMMENT.length;
const KEYS = ["qwertzuiopü", "asdfghjklöä", "yxcvbnm"];
const CommentSheet: React.FC<{ t: number }> = ({ t }) => {
  if (t < SHEET.a || t >= SHEET.e) return null;
  const up = ease(t, SHEET.a, 0.28);
  const down = interpolate(t, [SHEET.e - 0.22, SHEET.e], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const n = Math.max(0, Math.min(COMMENT.length, Math.floor(((t - SHEET.typeA) / (SHEET.typeE - SHEET.typeA)) * COMMENT.length)));
  const sent = t >= SHEET.sent;
  const post = ease(t, SHEET.sent, 0.25);
  const lastKey = n > 0 && !sent ? COMMENT[n - 1].toLowerCase() : "";
  const pressed = n > 0 && !sent && t - typedAt(n - 1) < 0.06;
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
          <svg width={24} height={24} viewBox="0 0 20 20"><path d="M10 16 V4 M4.5 9.5 L10 4 L15.5 9.5" stroke="#FFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, bottom: 0, background: "#D1D3D9", padding: "20px 10px 0" }}>
        {KEYS.map((row, r) => (
          <div key={r} style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            {row.split("").map((k) => {
              const on = pressed && k === lastKey;
              return <div key={k} style={{ width: 86, height: 100, borderRadius: 12, background: on ? "#AEB2BB" : "#FFFFFF", boxShadow: "0 2px 0 rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 40, color: "#111", transform: on ? "scale(1.12) translateY(-10px)" : "none" }}>{k}</div>;
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

export const StoryTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / ST.fps;
  const [, k, fx, fy] = cam(t);
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  const blur = blurAt(t);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: blur > 0.02 ? `blur(${blur * 16}px) brightness(${1 - 0.3 * blur})` : undefined, transform: blur > 0 ? `scale(${1 + 0.04 * blur})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile("story/story.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </div>
      </div>
      <Torn t={t} />
      {CARDS.map((c, i) => (
        <CardView key={i} c={c} t={t} />
      ))}
      <Offer t={t} />
      <Cursor t={t} />
      <SjTag t={t} />
      <Phone t={t} />
      <Bubbles t={t} />
      <LastSizes t={t} />
      <Follow t={t} a={30.95} check={31.58} e={33.9} />
      <CommentSheet t={t} />
      <Captions t={t} hidden={t >= SHEET.a && t < SHEET.e} />
    </AbsoluteFill>
  );
};
