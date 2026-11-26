import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Couch-Dialog (22,7 s), authentisch und spontan: eine Einstellung, Salo auf der Couch mit der Jogger an.
// Glitzersteine und Puffprint als echtes Detail aus dem 4K-Bild (kein Foto, kein Hochskalieren), Stack als kurzes Bild,
// Zoomsprünge auf Salos Reaktionen ("Okay", "Nee"), Passwort-Feld, Insta-Hinweis, 80 % der Passwörter weg,
// Jogger 65 € -> 30 € (Poster) mit Kassen-Sound, "Black Friday" als Stempel. Bild ohne Farbkorrektur.
// Ton: scripts/couch_mix.py (Stimme unverändert, leise Effekte).
export const CO = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * CO.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.25, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const inOut = (t: number, a: number, e: number, len = 0.25) => ease(t, a, len) * (1 - interpolate(t, [e - 0.15, e], [0, 1], clamp));
const RED = "#E3262B";
const YELLOW = "#F2C94C";
export const CO_TOTAL = 22.67;
export const CO_FRAMES = f(CO_TOTAL);

// ---------- Untertitel (iPhone-Stil) ----------
const CAP_SRC: [string, number][] = [
  ["HEY SALO", 0.5], ["ICH BRAUCH DAS", 1.28], ["WAS BRAUCHST", 2.08], ["DU DENN", 2.58],
  ["ICH BRAUCH", 3.16], ["GLITZERSTEINE", 3.42], ["DEN PERFEKTEN", 4.24], ["PUFFPRINT", 4.8], ["UND DEN PERFEKTEN", 5.2], ["STACK", 6.0], ["AUF DIE SCHUHE", 6.24],
  ["OKAY", 7.4], ["UND WIE", 8.32], ["BEKOMME ICH DAS", 8.56],
  ["NUR MIT DEINEM", 9.6], ["PASSWORT", 10.22], ["ABER DU MUSST", 10.8], ["SALITE ANFRAGEN", 11.46], ["AUF INSTA", 12.32],
  ["SO LEICHT", 13.4], ["GEHT DAS", 13.8],
  ["NEE", 15.04], ["ALSO 80 %", 15.42], ["DER PASSWÖRTER", 16.1], ["SIND SCHON WEG", 16.66], ["ABER VIELLEICHT", 17.36], ["HAST DU NOCH", 17.58], ["DIE CHANCE", 17.96], ["ALSO 30 EURO", 18.52],
  ["IST JA WIE", 20.18], ["GESCHENKT", 20.58], ["BLACK FRIDAY", 21.64], ["NE", 22.08],
];
const ENDS: Record<number, number> = { 2.58: 2.95, 6.24: 7.1, 7.4: 7.9, 8.56: 9.3, 12.32: 13.1, 13.8: 14.4, 15.04: 15.42, 18.52: 19.4, 20.58: 21.3 };
const CAPS = CAP_SRC.map(([text, a], i) => {
  const next = CAP_SRC[i + 1];
  return { a, e: ENDS[a] ?? (next ? Math.min(next[1], a + 1.4) : CO_TOTAL), text };
});
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find((x) => t >= x.a && t < x.e);
  if (!c) return null;
  return <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>;
};

// ---------- Kamera (1440er Proxy): Sprung auf die Jogger bei "das", auf Salos Gesicht bei "Okay" und "Nee" ----------
type Z = [number, number, number, number];
const FACE: [number, number] = [760, 470];
const ZK: Z[] = [
  [0, 1.0, 540, 900], [1.55, 1.02, 540, 900],
  [7.39, 1.0, 540, 900], [7.4, 1.25, ...FACE], [8.3, 1.27, ...FACE], [8.31, 1.0, 540, 900],
  [15.03, 1.0, 540, 900], [15.04, 1.22, ...FACE], [15.4, 1.23, ...FACE], [15.41, 1.0, 540, 900],
  [21.63, 1.0, 540, 900], [21.64, 1.12, 700, 620], [22.67, 1.14, 700, 620],
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
// Detailschnitt (4K-Ausschnitt um das Logo, Quelle ab 1,5 s): kurz bei "das" (Hook) und 3,42 bis 5,9 s, bei "Puffprint" enger
const SRC0 = 1.5;
const DETAILS = [
  { a: 1.56, e: 2.07, k0: 1.05, k1: 1.1 },
  { a: 3.42, e: 5.9, k0: 1.0, k1: 1.08, punch: 4.8 },
];
const Detail: React.FC<{ t: number }> = ({ t }) => {
  const DETAIL = DETAILS.find((d) => t >= d.a && t < d.e);
  if (!DETAIL) return null;
  const k = DETAIL.punch === undefined || t < DETAIL.punch ? interpolate(t, [DETAIL.a, DETAIL.punch ?? DETAIL.e], [DETAIL.k0, DETAIL.k1], clamp) : interpolate(t, [DETAIL.punch, DETAIL.e], [1.3, 1.33], clamp);
  const [fx, fy] = [540, 990];
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sequence from={f(DETAIL.a)} durationInFrames={f(DETAIL.e - DETAIL.a) + 2} layout="none">
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile("au/detail.mp4")} startFrom={f(DETAIL.a - SRC0)} muted style={{ width: 1080, height: 1920 }} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- Stack: kurzes Bild ----------
const STACK = { a: 6.0, e: 7.2 };
const Stack: React.FC<{ t: number }> = ({ t }) => {
  if (t < STACK.a || t >= STACK.e) return null;
  const inP = ease(t, STACK.a, 0.3);
  const outP = interpolate(t, [STACK.e - 0.12, STACK.e], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 540 - 370, top: 880 - 450, width: 740, height: 900, borderRadius: 26, overflow: "hidden", boxShadow: "0 26px 70px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 2.5) * (1 - outP), transform: `translateY(${(1 - inP) * 36}px) scale(${0.9 + 0.1 * inP})` }}>
      <Img src={staticFile("au/img/stack.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 82%", transform: `scale(${1 + 0.04 * ((t - STACK.a) / (STACK.e - STACK.a))})` }} />
    </div>
  );
};
const blurAt = (t: number) => interpolate(t, [STACK.a - 0.02, STACK.a + 0.16, STACK.e - 0.12, STACK.e + 0.02], [0, 1, 1, 0], clamp);

// ---------- Passwort-Feld (wie auf der Seite) und Insta-Hinweis ----------
const PW = { a: 9.6, typeA: 9.8, typeE: 10.4, e: 11.3 };
const Password: React.FC<{ t: number }> = ({ t }) => {
  if (t < PW.a || t >= PW.e) return null;
  const p = inOut(t, PW.a, PW.e);
  const n = Math.max(0, Math.min(8, Math.floor(((t - PW.typeA) / (PW.typeE - PW.typeA)) * 8) + (t >= PW.typeA ? 1 : 0)));
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1180, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, width: 640, background: "#FFFFFF", borderRadius: 18, padding: "16px 16px 16px 24px", boxShadow: "0 14px 40px rgba(0,0,0,0.35)" }}>
        <svg width={26} height={30} viewBox="0 0 20 24"><rect x={2} y={10} width={16} height={12} rx={3} fill="#111" /><path d="M5.5 10 V7 a4.5 4.5 0 0 1 9 0 V10" stroke="#111" strokeWidth={2.4} fill="none" /></svg>
        <div style={{ flex: 1, fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: n ? "#111" : "#9A9A9A", letterSpacing: n ? "0.25em" : "0.02em" }}>{n ? "•".repeat(n) : "Passwort"}</div>
        <div style={{ width: 52, height: 52, borderRadius: 26, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={24} height={24} viewBox="0 0 20 20"><path d="M4 10 H15 M10.5 5.5 L15 10 L10.5 14.5" stroke="#FFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </div>
  );
};
const INSTA = { a: 11.4, e: 13.15 };
const Insta: React.FC<{ t: number }> = ({ t }) => {
  if (t < INSTA.a || t >= INSTA.e) return null;
  const p = inOut(t, INSTA.a, INSTA.e);
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1180, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", borderRadius: 24, padding: "12px 26px 12px 12px", boxShadow: "0 14px 36px rgba(0,0,0,0.35)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, padding: 3, background: "linear-gradient(45deg, #FEDA75, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5)", boxSizing: "border-box" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1E1712", border: "3px solid #FFF", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 28 }} />
          </div>
        </div>
        <div style={{ fontFamily: "'Inter'", lineHeight: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 30, color: "#111" }}>@saliteclothing</div>
          <div style={{ fontWeight: 600, fontSize: 20, color: "#6B6B70" }}>Instagram · Passwort anfragen</div>
        </div>
      </div>
    </div>
  );
};

// ---------- 80 % der Passwörter weg (gelber Balken, wie in der Story) ----------
const GONE = { a: 15.45, e: 18.5 };
const Gone: React.FC<{ t: number }> = ({ t }) => {
  if (t < GONE.a || t >= GONE.e) return null;
  const p = inOut(t, GONE.a, GONE.e, 0.35);
  const fill = 0.8 * interpolate(t, [15.6, 16.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1200, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ width: 560, background: "rgba(12,12,12,0.62)", borderRadius: 18, padding: "14px 22px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", color: "rgba(255,255,255,0.95)", marginBottom: 10 }}>
          <span>PASSWÖRTER</span>
          <span style={{ color: YELLOW }}>{Math.round(fill * 100)} % WEG</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.22)" }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 3, background: YELLOW }} />
        </div>
      </div>
    </div>
  );
};

// ---------- Jogger 65 € -> 30 € (Poster) ----------
const PRICE = { a: 18.5, now: 18.64, e: 21.5 };
const Price: React.FC<{ t: number }> = ({ t }) => {
  if (t < PRICE.a || t >= PRICE.e) return null;
  const p = inOut(t, PRICE.a, PRICE.e);
  const pr = ease(t, PRICE.now, 0.22, Easing.out(Easing.back(1.6)));
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1160, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: "12px 28px", boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}>
        <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 30, letterSpacing: "0.06em", color: "#111" }}>JOGGER</span>
        <span style={{ fontFamily: "'Anton'", fontSize: 40, color: "#9A9A9A", textDecoration: "line-through" }}>65 €</span>
        <span style={{ fontFamily: "'Anton'", fontSize: 66, color: RED, display: "inline-block", opacity: pr, transform: `scale(${0.7 + 0.3 * pr})` }}>30 €</span>
      </div>
    </div>
  );
};

// ---------- Black Friday: Stempel ----------
const BF = { a: 21.64 };
const BlackFriday: React.FC<{ t: number }> = ({ t }) => {
  if (t < BF.a) return null;
  const p = ease(t, BF.a, 0.18, Easing.out(Easing.back(1.4)));
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1160, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 2) }}>
      <div style={{ background: "#111", color: "#FFF", borderRadius: 16, padding: "12px 34px 6px", fontFamily: "'Anton'", fontSize: 96, lineHeight: 1, letterSpacing: "0.02em", transform: `rotate(-4deg) scale(${1.3 - 0.3 * p})`, boxShadow: "0 18px 46px rgba(0,0,0,0.45)" }}>BLACK FRIDAY</div>
    </div>
  );
};

export const CouchTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / CO.fps;
  const [, k, fx, fy] = cam(t);
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  const b = blurAt(t);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: b > 0.02 ? `blur(${b * 7}px) brightness(${1 - 0.2 * b})` : undefined, transform: b > 0 ? `scale(${1 + 0.02 * b})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile("au/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </div>
      </div>
      <Detail t={t} />
      <Stack t={t} />
      <Password t={t} />
      <Insta t={t} />
      <Gone t={t} />
      <Price t={t} />
      <BlackFriday t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
