import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Trackie-Video (35,7 s), Schnitt wie Longsleeve-Video 2: plakativer Hook ("69 €", 144 € gestrichen, Winterjacke gestrichen),
// ein Übergang nach dem Hook, dann ruhige Einblendungen: Shopify-Mitteilungen bei "Shop auseinandergenommen",
// TikTok-Kommentar "Ich brauch ein Passwort", 550 GSM, kurze Detailbilder (Stack, Glitzersteine, Puffprint), Poster, Folgen.
// Bild ohne Farbkorrektur, Zoomsprünge aus einem 1440er Proxy (kein Hochskalieren). Ton: scripts/trackie_mix.py (Stimme unverändert).
export const TR = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * TR.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.25, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const inOut = (t: number, a: number, e: number, len = 0.25) => ease(t, a, len) * (1 - interpolate(t, [e - 0.15, e], [0, 1], clamp));
const RED = "#E3262B";
const TT_RED = "#FE2C55";
export const TR_TOTAL = 35.7;
export const TR_FRAMES = f(TR_TOTAL);

// ---------- Untertitel (iPhone-Stil); im Hook steht der große Text ----------
const CAP_SRC: [string, number][] = [
  ["JA", 3.46], ["EINMAL UND", 4.12], ["NIE WIEDER", 4.6],
  ["IHR HABT", 5.16], ["DEN SHOP", 5.38], ["AUSEINANDERGENOMMEN", 5.82], ["UND AUCH DIE", 6.6], ["LETZTEN GRÖSSEN", 7.3], ["SIND VERFÜGBAR", 7.84],
  ["SOLD OUT", 9.42], ["DAMIT IHR NOCH", 10.3], ["EIN TRACKIE BEKOMMT", 10.98],
  ["KOMMENTIERT JETZT REIN", 12.4], ["ICH BRAUCH EIN PASSWORT", 13.62],
  ["UND AUSNAHMSWEISE", 15.3], ["PICKEN WIR", 16.36], ["NOCH LEUTE RAUS", 16.86],
  ["SICHER DIR JETZT", 17.76], ["EIN PASSWORT", 18.3], ["MIT EINER DM", 18.72],
  ["550 GSM", 19.94], ["IHR BRAUCHT", 20.96], ["KEINE WINTERJACKE", 21.26],
  ["PERFEKTER STACK", 22.42], ["GLITZERSTEINE", 23.28], ["DIE NICHT ABGEHEN", 23.8], ["UND EIN HOCHWERTIGER", 24.24], ["PUFFPRINT", 25.52],
  ["IHR SEHT", 26.22], ["WIR HABEN BEI", 26.6], ["DEN RESSOURCEN", 26.96], ["ÜBERHAUPT NICHT", 27.64], ["GESPART", 28.34],
  ["DAS IST DER", 28.68], ["HOCHWERTIGSTE TRACKIE", 29.3], ["DEN IHR ÜBERHAUPT", 30.56], ["BEKOMMEN KÖNNT", 31.26],
  ["MACHT DAS", 32.24], ["PLUS WEG", 32.58], ["SUPPORT YOUNG BOYS", 33.66], ["WITH BIG DREAMS", 34.42],
];
const ENDS: Record<number, number> = { 4.6: 5.0, 7.84: 8.6, 10.98: 12.02, 21.26: 22.06, 25.52: 26.08, 31.26: 32.0, 32.58: 33.16 };
const CAPS = CAP_SRC.map(([text, a], i) => {
  const next = CAP_SRC[i + 1];
  return { a, e: ENDS[a] ?? (next ? Math.min(next[1], a + 1.4) : TR_TOTAL), text };
});
export const COMMENT = { text: "Ich brauch ein Passwort", a: 12.4, typeA: 13.6, typeE: 14.95, sent: 15.05, like: 16.36, e: 17.66 };
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (t < 3.3) return null;
  if (t >= COMMENT.typeA - 0.05 && t < COMMENT.sent + 0.2) return null; // wird im Kommentar getippt
  const c = CAPS.find((x) => t >= x.a && t < x.e);
  if (!c) return null;
  return <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>;
};

// ---------- Kamera: Zoomsprünge aus dem 1440er Proxy ----------
type Z = [number, number, number, number];
const ZK: Z[] = [
  [0, 1.1, 540, 700], [3.28, 1.04, 540, 700],
  [3.3, 1.25, 540, 700], [3.62, 1.0, 540, 700],
  [4.59, 1.0, 540, 700], [4.6, 1.1, 540, 560], [4.99, 1.1, 540, 560], [5.0, 1.0, 540, 700],
  [9.41, 1.0, 540, 700], [9.42, 1.08, 540, 600], [10.06, 1.08, 540, 600], [10.07, 1.0, 540, 700],
  [26.15, 1.0, 540, 700], [32.06, 1.1, 540, 620], [32.07, 1.0, 540, 700],
  [33.65, 1.0, 540, 700], [33.66, 1.08, 540, 620], [35.7, 1.1, 540, 620],
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

// ---------- Hook: 69 € (144 € gestrichen), TRACKIE, Winterjacke gestrichen ----------
const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= 3.3) return null;
  const out = 1 - interpolate(t, [3.16, 3.3], [0, 1], clamp);
  const a = ease(t, 0.02, 0.22, Easing.out(Easing.back(1.5)));
  const old = ease(t, 0.4, 0.25);
  const oldStrike = interpolate(t, [0.75, 0.9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tr = ease(t, 1.24, 0.2, Easing.out(Easing.back(1.6)));
  const jk = ease(t, 2.12, 0.22);
  const st = interpolate(t, [2.6, 2.76], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.34)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 28 }}>
        <span style={{ fontFamily: "'Anton'", fontSize: 250, lineHeight: 1, color: RED, opacity: Math.min(1, a * 2), transform: `scale(${1.4 - 0.4 * a})`, display: "inline-block", textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>69 €</span>
        <span style={{ position: "relative", fontFamily: "'Anton'", fontSize: 84, color: "#FFFFFF", opacity: old * 0.9, textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
          144 €
          <div style={{ position: "absolute", left: -8, right: -8, top: "52%", height: 8, background: RED, borderRadius: 4, transform: `rotate(-8deg) scaleX(${oldStrike})`, transformOrigin: "left center" }} />
        </span>
      </div>
      {t >= 1.2 && <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontFamily: "'Anton'", fontSize: 150, lineHeight: 1, color: "#FFFFFF", opacity: Math.min(1, tr * 2), transform: `scale(${1.3 - 0.3 * tr})`, textShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>TRACKIE</div>}
      {t >= 2.1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", opacity: jk, transform: `translateY(${(1 - jk) * 20}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(14,14,14,0.85)", borderRadius: 26, padding: "16px 30px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
            <svg width={50} height={50} viewBox="-12 -12 24 24">
              {[0, 60, 120].map((r) => (
                <g key={r} transform={`rotate(${r})`}>
                  <path d="M0 -10 V10 M-3 -7 L0 -4 L3 -7 M-3 7 L0 4 L3 7" stroke="#9FD3FF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
                </g>
              ))}
            </svg>
            <div style={{ position: "relative", fontFamily: "'Inter'", fontWeight: 800, fontSize: 54, letterSpacing: "0.03em", color: st > 0.5 ? "rgba(255,255,255,0.55)" : "#FFFFFF" }}>
              WINTERJACKE
              <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 10, borderRadius: 5, background: RED, transform: `scaleX(${st})`, transformOrigin: "left center" }} />
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- Karten (Bild oder Clip), kurz, unter den Gesichtern ----------
type Card = { a: number; e: number; w: number; h: number; cy: number; img?: string; pos?: string; clip?: string; from?: number };
const CARDS: Card[] = [
  { a: 5.5, e: 6.62, w: 860, h: 735, cy: 930, img: "orders.jpg", pos: "50% 0%" },
  { a: 6.62, e: 8.5, w: 720, h: 900, cy: 900, clip: "orders.mp4", from: 0 },
  { a: 22.42, e: 23.24, w: 740, h: 900, cy: 900, img: "stack.jpg", pos: "50% 82%" },
  { a: 23.28, e: 24.72, w: 740, h: 900, cy: 900, img: "glitzer.jpg", pos: "50% 55%" },
  { a: 24.76, e: 26.1, w: 740, h: 900, cy: 900, img: "puff.jpg", pos: "45% 62%" },
  { a: 29.3, e: 30.95, w: 720, h: 900, cy: 880, img: "poster.jpg", pos: "50% 50%" },
];
// Hintergrund nur leicht unscharf, Mimik bleibt sichtbar
const blurAt = (t: number) => CARDS.reduce((m, c) => Math.max(m, interpolate(t, [c.a - 0.02, c.a + 0.16, c.e - 0.12, c.e + 0.02], [0, 1, 1, 0], clamp)), 0);
const CardView: React.FC<{ c: Card; t: number; prev?: Card }> = ({ c, t, prev }) => {
  if (t < c.a || t >= c.e) return null;
  const chained = prev && Math.abs(prev.e - c.a) < 0.05; // direkt nach einer Karte: nur Bild wechseln, kein neuer Einflug
  const inP = chained ? 1 : ease(t, c.a, 0.3);
  const swap = chained ? ease(t, c.a, 0.18) : 1;
  const outP = interpolate(t, [c.e - 0.12, c.e], [0, 1], clamp);
  const last = !CARDS.some((x) => Math.abs(x.a - c.e) < 0.05);
  const o = last ? 1 - outP : 1;
  return (
    <div style={{ position: "absolute", left: 540 - c.w / 2, top: c.cy - c.h / 2, width: c.w, height: c.h, borderRadius: 26, overflow: "hidden", background: "#111", boxShadow: "0 26px 70px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 2.5) * o, transform: `translateY(${(1 - inP) * 36}px) scale(${(0.9 + 0.1 * inP) * (0.97 + 0.03 * swap)})` }}>
      <div style={{ width: "100%", height: "100%", opacity: swap }}>
        {c.img && <Img src={staticFile(`tr/img/${c.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.pos ?? "50% 50%", transform: `scale(${1 + 0.04 * ((t - c.a) / (c.e - c.a))})` }} />}
        {c.clip && (
          <Sequence from={f(c.a)} durationInFrames={f(c.e - c.a) + 2} layout="none">
            <OffthreadVideo src={staticFile(`tr/${c.clip}`)} startFrom={f(c.from ?? 0)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        )}
      </div>
    </div>
  );
};

// ---------- KOMMENTAR im TikTok-Look; bei "picken" bekommt der Kommentar ein rotes Herz ----------
const CommentPanel: React.FC<{ t: number }> = ({ t }) => {
  if (t < COMMENT.a || t >= COMMENT.e) return null;
  const p = inOut(t, COMMENT.a, COMMENT.e, 0.3);
  const n = Math.max(0, Math.min(COMMENT.text.length, Math.floor(((t - COMMENT.typeA) / (COMMENT.typeE - COMMENT.typeA)) * COMMENT.text.length) + (t >= COMMENT.typeA ? 1 : 0)));
  const sent = t >= COMMENT.sent;
  const post = ease(t, COMMENT.sent, 0.3);
  const press = interpolate(t, [COMMENT.sent - 0.04, COMMENT.sent, COMMENT.sent + 0.06], [1, 0.86, 1], clamp);
  const typing = n > 0 && !sent;
  const liked = t >= COMMENT.like;
  const hp = interpolate(t, [COMMENT.like, COMMENT.like + 0.08, COMMENT.like + 0.22], [1, 1.35, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 70, width: 860, top: 1320, opacity: p, transform: `translateY(calc(-100% + ${(1 - p) * 30}px))` }}>
      <div style={{ background: "#FFFFFF", borderRadius: 24, boxShadow: "0 16px 44px rgba(0,0,0,0.35)", overflow: "hidden" }}>
        <div style={{ position: "relative", height: 62, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, color: "#161823" }}>
          Kommentare
          <svg width={26} height={26} viewBox="0 0 20 20" style={{ position: "absolute", right: 24 }}><path d="M5 5 L15 15 M15 5 L5 15" stroke="#161823" strokeWidth={2.2} strokeLinecap="round" /></svg>
        </div>
        <div style={{ height: 112 * post, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "8px 24px 0", opacity: post }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: "#D9D9DE", flexShrink: 0 }} />
            <div style={{ flex: 1, fontFamily: "'Inter'" }}>
              <div style={{ fontWeight: 600, fontSize: 21, color: "#8A8B91" }}>du</div>
              <div style={{ fontWeight: 500, fontSize: 28, color: "#161823", marginTop: 2 }}>{COMMENT.text}</div>
              <div style={{ fontWeight: 600, fontSize: 19, color: "#8A8B91", marginTop: 4 }}>Gerade eben    Antworten</div>
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <svg width={32} height={32} viewBox="0 0 24 24" style={{ transform: `scale(${hp})` }}><path d="M12 20 C5 15 3 12 3 8.5 C3 6 5 4 7.5 4 C9.3 4 10.9 5 12 6.6 C13.1 5 14.7 4 16.5 4 C19 4 21 6 21 8.5 C21 12 19 15 12 20 Z" fill={liked ? TT_RED : "none"} stroke={liked ? TT_RED : "#8A8B91"} strokeWidth={1.8} /></svg>
              <span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 18, color: "#8A8B91" }}>{liked ? 1 : ""}</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #EDEDED", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: "#D9D9DE", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 62, borderRadius: 31, background: "#F1F1F2", display: "flex", alignItems: "center", padding: "0 18px 0 22px", gap: 14, overflow: "hidden" }}>
            <div style={{ flex: 1, fontFamily: "'Inter'", fontWeight: 500, fontSize: 27, color: typing ? "#161823" : "#8A8B91", whiteSpace: "nowrap" }}>
              {typing ? COMMENT.text.slice(0, n) : "Kommentar hinzufügen …"}
              {typing && <span style={{ color: TT_RED }}>|</span>}
            </div>
            <span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: "#161823" }}>@</span>
            <svg width={30} height={30} viewBox="0 0 24 24"><circle cx={12} cy={12} r={9} fill="none" stroke="#161823" strokeWidth={1.8} /><circle cx={9} cy={10} r={1.2} fill="#161823" /><circle cx={15} cy={10} r={1.2} fill="#161823" /><path d="M8 14 C9.5 16.2 14.5 16.2 16 14" fill="none" stroke="#161823" strokeWidth={1.8} strokeLinecap="round" /></svg>
          </div>
          {n > 0 && t < COMMENT.sent + 0.12 && (
            <div style={{ width: 56, height: 56, borderRadius: 28, background: TT_RED, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})`, flexShrink: 0 }}>
              <svg width={26} height={26} viewBox="0 0 20 20"><path d="M10 16 V4 M4.5 9.5 L10 4 L15.5 9.5" stroke="#FFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Passwort per DM ----------
const Dm: React.FC<{ t: number }> = ({ t }) => {
  if (t < 17.85 || t >= 19.38) return null;
  const p = inOut(t, 17.85, 19.38);
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1270, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFFFFF", borderRadius: 22, padding: "12px 24px", boxShadow: "0 14px 36px rgba(0,0,0,0.3)" }}>
        <svg width={30} height={30} viewBox="0 0 24 24"><path d="M3 11.5 L21 3 L14 21 L11 13 Z M11 13 L21 3" fill="none" stroke="#111" strokeWidth={2} strokeLinejoin="round" /></svg>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, letterSpacing: "0.04em", color: "#111" }}>PASSWORT PER DM</span>
      </div>
    </div>
  );
};

// ---------- 550 GSM: Zähler, Stofflagen, Winterjacke gestrichen ----------
const Gsm: React.FC<{ t: number }> = ({ t }) => {
  if (t < 19.9 || t >= 22.1) return null;
  const p = inOut(t, 19.9, 22.1, 0.3);
  const n = Math.round(550 * interpolate(t, [19.96, 20.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const layers = interpolate(t, [19.96, 20.8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const jacket = ease(t, 21.0, 0.25);
  const st = interpolate(t, [21.48, 21.64], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 100, right: 180, top: 880, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <div style={{ background: "rgba(14,14,14,0.86)", borderRadius: 30, padding: "26px 34px", boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <span style={{ fontFamily: "'Anton'", fontSize: 130, lineHeight: 0.9, color: "#FFFFFF" }}>{n}</span>
          <span style={{ fontFamily: "'Anton'", fontSize: 60, lineHeight: 1, color: "#FFFFFF", opacity: ease(t, 20.38, 0.2) }}>GSM</span>
        </div>
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
        </div>
      </div>
    </div>
  );
};

// ---------- FOLGEN oben links mit Fingertipp ----------
const FOLLOW = { a: 32.2, check: 32.58, e: TR_TOTAL + 1 };
const Follow: React.FC<{ t: number }> = ({ t }) => {
  if (t < FOLLOW.a) return null;
  const p = ease(t, FOLLOW.a, 0.25);
  const done = t >= FOLLOW.check;
  const pop = interpolate(t, [FOLLOW.check, FOLLOW.check + 0.08, FOLLOW.check + 0.2], [1, 1.25, 1], clamp);
  const tap = t >= FOLLOW.check - 0.03 && t < FOLLOW.check + 0.4;
  const k = ease(t, FOLLOW.check - 0.03, 0.4, Easing.out(Easing.cubic));
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: 260, width: 130, height: 160, opacity: p, transform: `scale(${0.88 + 0.12 * p})`, transformOrigin: "0 0" }}>
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
      {tap && (
        <div style={{ position: "absolute", left: 125, top: 390 }}>
          <div style={{ position: "absolute", left: -(18 + 46 * k), top: -(18 + 46 * k), width: 2 * (18 + 46 * k), height: 2 * (18 + 46 * k), borderRadius: "50%", border: "3px solid rgba(255,255,255,0.9)", boxSizing: "border-box", opacity: 0.8 * (1 - k) }} />
        </div>
      )}
    </>
  );
};

export const TrackieTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / TR.fps;
  const [, k, fx, fy] = cam(t);
  const sh = t < 0.22 ? (1 - t / 0.22) * 10 : 0; // kurzes Wackeln beim Schlag auf "69"
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k) + Math.sin(t * 90) * sh, 1080);
  const y = fit(fy * (1 - k) + Math.cos(t * 77) * sh, 1920);
  const trans = t >= 3.3 ? interpolate(t, [3.3, 3.62], [14, 0], clamp) : 0; // Zoom-Unschärfe beim Übergang nach dem Hook
  const b = blurAt(t);
  const filt = [trans > 0.05 || b > 0.02 ? `blur(${trans + b * 7}px)` : "", b > 0.02 ? `brightness(${1 - 0.2 * b})` : ""].join(" ").trim();
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: filt || undefined, transform: b > 0 || trans > 0 ? `scale(${1 + 0.02 * Math.max(b, trans / 14)})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile("tr/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </div>
      </div>
      <Hook t={t} />
      {CARDS.map((c, i) => (
        <CardView key={i} c={c} t={t} prev={CARDS[i - 1]} />
      ))}
      <CommentPanel t={t} />
      <Dm t={t} />
      <Gsm t={t} />
      <Follow t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
