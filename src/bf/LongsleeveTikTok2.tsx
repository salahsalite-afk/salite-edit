import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Longsleeve-Video 2 (25 s): plakativer Hook "Longsleeve for free", Übergang mit Zoom-Unschärfe, dann ruhige Animationen.
// Ibos echter Kommentar als Beweis (Name in der Lieferadresse unscharf), Detailfotos, Ablauf, Black-Friday-Preise
// (Hoodie 79 -> 39, Jogger 65 -> 30 wie auf dem Poster, bis zu 80 % wie immer), Slot bis zum Ende.
// Stimme unverändert, Effekte und Kassen-Sound mischt scripts/ls2_mix.py.
export const LS2 = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * LS2.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.22, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const inOut = (t: number, a: number, e: number, len = 0.22) => ease(t, a, len) * (1 - interpolate(t, [e - 0.14, e], [0, 1], clamp));
const RED = "#E3262B";
const INK = "#111111";
export const LS2_TOTAL = 25.05;
export const LS2_FRAMES = f(LS2_TOTAL);

const WORDS: [string, number][] = [
  ["Longsleeves", 0.0], ["for", 0.78], ["free!", 1.1],
  ["Ein", 1.98], ["Mann,", 2.14], ["ein", 2.5], ["Wort.", 2.62],
  ["Weil", 3.0], ["ihr", 3.06], ["gestern", 3.22], ["bestellt", 3.56], ["habt,", 3.82], ["bekommt", 4.2], ["ihr", 4.26], ["den", 4.4], ["Longsleeve.", 4.52],
  ["Echtes", 5.36], ["Nappaleder,", 5.82], ["100", 6.52], ["Prozent", 6.8], ["Baumwolle.", 7.36],
  ["Hier", 8.16], ["habt", 8.38], ["ihr", 8.6], ["ein", 8.78], ["krasses", 8.94], ["Neck", 9.56], ["Detail.", 9.92],
  ["Alles,", 10.64], ["was", 10.72], ["ihr", 10.84], ["machen", 11.02], ["müsst,", 11.26], ["ist", 11.64], ["jetzt", 11.7], ["bestellen", 11.86],
  ["und", 12.2], ["die", 12.38], ["Order-Nummer", 12.48], ["reinkommentieren.", 12.98],
  ["Ihr", 14.0], ["könnt", 14.22], ["euch", 14.4], ["reichlich", 14.72], ["bedienen.", 15.22],
  ["Ein", 15.78], ["Hoodie", 15.92], ["für", 16.22], ["39", 16.32], ["Euro,", 16.9], ["ein", 17.28], ["Jogger", 17.36], ["für", 17.68], ["30", 17.82], ["Euro,", 18.18],
  ["die", 19.18], ["letzten", 19.26], ["Passwörter", 19.62], ["gehen", 20.1], ["raus.", 20.24],
  ["Und", 21.2], ["vergesst", 21.38], ["nicht,", 21.6], ["das", 21.86], ["Plus", 22.04], ["wegzumachen.", 22.14],
  ["Support", 23.04], ["Young", 23.2], ["Boys", 23.48], ["with", 23.76], ["Big", 24.14], ["Dreams!", 24.58],
];
type Cap = { a: number; e: number; text: string };
const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  let cur: [string, number][] = [];
  WORDS.forEach(([w, s], i) => {
    const next = WORDS[i + 1];
    cur.push([w, s]);
    if (cur.length >= 3 || /[.,!?]$/.test(w) || !next) {
      out.push({ a: cur[0][1], e: next ? Math.min(next[1], s + 1.3) : s + 0.5, text: cur.map(([x]) => x).join(" ").replace(/[.,!?]+$/, "").toUpperCase() });
      cur = [];
    }
  });
  return out;
})();
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (t < 1.95) return null; // im Hook und im Übergang steht der große Text
  const c = CAPS.find((x) => t >= x.a && t < x.e);
  if (!c) return null;
  return <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>;
};

// ---------- Kamera ----------
type Z = [number, number, number, number];
const ZK: Z[] = [
  [0, 1.12, 540, 760], [1.1, 1.04, 540, 760], [1.12, 1.12, 540, 760], [1.69, 1.1, 540, 760],
  [1.7, 1.3, 540, 760], [2.05, 1.0, 540, 760], [5.14, 1.03, 540, 760],
  [5.15, 1.0, 540, 760], [10.39, 1.04, 540, 760],
  [10.4, 1.0, 540, 760], [13.67, 1.03, 540, 760],
  [13.69, 1.0, 540, 620], [14.71, 1.0, 540, 620], [14.72, 1.08, 540, 560], [18.5, 1.08, 540, 560], [19.1, 1.0, 540, 620], [25.05, 1.06, 540, 600],
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

// ---------- Hook ----------
const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= 1.7) return null;
  const a = ease(t, 0.02, 0.2, Easing.out(Easing.back(1.6)));
  const b = ease(t, 1.1, 0.16, Easing.out(Easing.back(1.8)));
  const out = 1 - interpolate(t, [1.55, 1.7], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.38)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: "'Anton'", fontSize: 178, lineHeight: 1, color: "#FFFFFF", textShadow: "0 10px 40px rgba(0,0,0,0.5)", opacity: Math.min(1, a * 2), transform: `scale(${1.35 - 0.35 * a})` }}>LONGSLEEVE</div>
      {t >= 0.7 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center", opacity: ease(t, 0.78, 0.15) }}>
          <div style={{ background: RED, borderRadius: 18, padding: "10px 34px 4px", transform: `rotate(-5deg) scale(${t >= 1.1 ? 1.5 - 0.5 * b : 0.9})`, boxShadow: "0 18px 50px rgba(0,0,0,0.4)" }}>
            <span style={{ fontFamily: "'Anton'", fontSize: 150, lineHeight: 1, color: "#FFFFFF" }}>{t >= 1.1 ? "FOR FREE" : "FOR"}</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- Karten ----------
type Card = { a: number; e: number; img: string; w: number; h: number; cy: number; pos?: string; zoom?: [number, number]; white?: boolean };
const CARDS: Card[] = [
  { a: 2.1, e: 4.38, img: "ibo.jpg", w: 860, h: 712, cy: 925, white: true },
  { a: 4.45, e: 5.15, img: "ls_model.jpg", w: 600, h: 800, cy: 850 },
  { a: 5.4, e: 6.45, img: "ls_patch.jpg", w: 660, h: 880, cy: 830 },
  { a: 6.5, e: 7.85, img: "ls_logo.jpg", w: 660, h: 880, cy: 830 },
  { a: 8.9, e: 10.35, img: "ls_patch.jpg", w: 660, h: 880, cy: 830, pos: "62% 45%", zoom: [1.25, 1.45] },
];
const blurAt = (t: number) =>
  [...CARDS.map((c) => [c.a, c.e] as [number, number]), [5.4, 7.85] as [number, number]].reduce((m, [a, e]) => Math.max(m, interpolate(t, [a - 0.02, a + 0.16, e - 0.12, e + 0.02], [0, 1, 1, 0], clamp)), 0);
const CardView: React.FC<{ c: Card; t: number }> = ({ c, t }) => {
  if (t < c.a || t >= c.e) return null;
  const inP = ease(t, c.a, 0.26);
  const outP = interpolate(t, [c.e - 0.12, c.e], [0, 1], clamp);
  const z = c.zoom ? interpolate(t, [c.a, c.e], c.zoom, clamp) : 1 + 0.03 * ((t - c.a) / (c.e - c.a));
  return (
    <div style={{ position: "absolute", left: 540 - c.w / 2, top: c.cy - c.h / 2, width: c.w, height: c.h, borderRadius: 26, overflow: "hidden", background: c.white ? "#FFF" : "#111", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 3) * (1 - outP), transform: `translateY(${(1 - inP) * 40}px) scale(${0.86 + 0.14 * inP - 0.03 * outP})` }}>
      <Img src={staticFile(`ls2/img/${c.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.pos ?? "50% 50%", transform: `scale(${z})`, transformOrigin: c.pos ?? "50% 50%" }} />
    </div>
  );
};
const Chip: React.FC<{ p: number; style?: React.CSSProperties; children: React.ReactNode; dark?: boolean }> = ({ p, style, children, dark }) => (
  <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 12, background: dark ? "rgba(17,17,17,0.9)" : "#FFFFFF", color: dark ? "#FFFFFF" : INK, borderRadius: 20, padding: "12px 24px", boxShadow: "0 14px 36px rgba(0,0,0,0.3)", fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, letterSpacing: "0.04em", whiteSpace: "nowrap", opacity: p, transform: `translateY(${(1 - p) * 18}px) scale(${0.94 + 0.06 * p})`, ...style }}>{children}</div>
);
const Center: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>{children}</div>
);
const DetailChips: React.FC<{ t: number }> = ({ t }) => (
  <Center top={1180}>
    {t >= 5.6 && t < 6.45 && <Chip p={inOut(t, 5.82, 6.45)} style={{ position: "relative" }}>ECHTES NAPPALEDER</Chip>}
    {t >= 6.6 && t < 7.85 && <Chip p={inOut(t, 6.6, 7.85)} style={{ position: "relative" }}>100 % BAUMWOLLE</Chip>}
    {t >= 9.4 && t < 10.35 && <Chip p={inOut(t, 9.56, 10.35)} style={{ position: "relative" }}>NECK DETAIL</Chip>}
  </Center>
);

// ---------- So geht's: bestellen, Order-Nummer kommentieren, Longsleeve gratis ----------
const Steps: React.FC<{ t: number }> = ({ t }) => {
  if (t < 11.7 || t >= 13.72) return null;
  const o = 1 - interpolate(t, [13.58, 13.72], [0, 1], clamp);
  const rows: [string, number][] = [["JETZT BESTELLEN", 11.86], ["ORDER-NUMMER KOMMENTIEREN", 12.6], ["LONGSLEEVE GRATIS", 13.1]];
  return (
    <div style={{ position: "absolute", left: 90, right: 170, top: 960, opacity: o }}>
      <div style={{ background: "rgba(14,14,14,0.82)", borderRadius: 28, padding: "18px 26px", boxShadow: "0 18px 44px rgba(0,0,0,0.4)" }}>
        {rows.map(([label, at], i) => {
          const q = ease(t, at, 0.25);
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 0", borderTop: i ? "1px solid rgba(255,255,255,0.12)" : "none", opacity: 0.25 + 0.75 * q, transform: `translateX(${(1 - q) * -16}px)` }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: i === 2 ? RED : "#FFFFFF", color: i === 2 ? "#FFFFFF" : INK, fontFamily: "'Inter'", fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, letterSpacing: "0.03em", color: "#FFFFFF" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Black Friday Preise (Poster) und 80 % wie immer ----------
const Prices: React.FC<{ t: number }> = ({ t }) => {
  if (t < 14.3 || t >= 18.9) return null;
  const o = 1 - interpolate(t, [18.76, 18.9], [0, 1], clamp);
  const head = ease(t, 14.4, 0.25);
  const row = (label: string, old: string, now: string, a: number, priceAt: number) => {
    const q = ease(t, a, 0.25);
    const pr = ease(t, priceAt, 0.2, Easing.out(Easing.back(1.6)));
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #E6E6E6", opacity: q, transform: `translateX(${(1 - q) * -16}px)` }}>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 34, color: INK }}>{label}</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontFamily: "'Anton'", fontSize: 40, color: "#9A9A9A", textDecoration: "line-through" }}>{old}</span>
          <span style={{ fontFamily: "'Anton'", fontSize: 62, color: RED, display: "inline-block", opacity: pr, transform: `scale(${0.7 + 0.3 * pr})` }}>{now}</span>
        </span>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 110, right: 190, top: 930, opacity: o }}>
      <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 28, padding: "18px 28px 8px", boxShadow: "0 18px 44px rgba(0,0,0,0.35)", opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 26, letterSpacing: "0.2em", color: INK }}>BLACK FRIDAY</span>
          <span style={{ background: RED, color: "#FFF", borderRadius: 12, padding: "6px 14px", fontFamily: "'Inter'", fontWeight: 800, fontSize: 22, letterSpacing: "0.04em" }}>BIS ZU 80 % · WIE IMMER</span>
        </div>
        {t >= 15.8 && row("HOODIE", "79 €", "39 €", 15.92, 16.32)}
        {t >= 17.2 && row("JOGGER", "65 €", "30 €", 17.36, 17.82)}
      </div>
    </div>
  );
};

// ---------- letzte Passwörter ----------
const LastPw: React.FC<{ t: number }> = ({ t }) => {
  if (t < 19.2 || t >= 20.9) return null;
  const p = inOut(t, 19.26, 20.9);
  const dot = 0.45 + 0.55 * Math.abs(Math.sin((t - 19.2) * 5));
  return (
    <Center top={1100}>
      <Chip p={p} dark style={{ position: "relative", fontSize: 34 }}>
        <span style={{ width: 16, height: 16, borderRadius: 8, background: RED, opacity: dot }} />
        LETZTE PASSWÖRTER GEHEN RAUS
      </Chip>
    </Center>
  );
};

// ---------- Slot bis zum Ende (über den Untertiteln) ----------
const WatchBar: React.FC<{ t: number }> = ({ t }) => {
  if (t < 2.0) return null;
  const p = ease(t, 2.0, 0.4);
  const fill = interpolate(t, [2.0, 24.58], [0, 1], clamp);
  const done = t >= 24.58;
  const col = done ? "#22C55E" : RED;
  return (
    <div style={{ position: "absolute", top: 1332, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: p }}>
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

// ---------- Folgen und Accounts ----------
const TT_RED = "#FE2C55";
const Follow: React.FC<{ t: number }> = ({ t }) => {
  if (t < 21.15) return null;
  const p = ease(t, 21.15, 0.25);
  const check = 22.04;
  const done = t >= check;
  const pop = interpolate(t, [check, check + 0.08, check + 0.2], [1, 1.25, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, top: 300, width: 130, height: 160, opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
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
const Accounts: React.FC<{ t: number }> = ({ t }) => {
  if (t < 23.1) return null;
  const row = (name: string, sub: string, a: number, grad: string) => {
    const q = ease(t, a, 0.25);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", borderRadius: 24, padding: "12px 26px 12px 12px", boxShadow: "0 14px 36px rgba(0,0,0,0.35)", opacity: q, transform: `translateY(${(1 - q) * 18}px)` }}>
        <div style={{ width: 60, height: 60, borderRadius: 17, background: grad }} />
        <div style={{ fontFamily: "'Inter'", lineHeight: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 32, color: INK }}>{name}</div>
          <div style={{ fontWeight: 600, fontSize: 20, color: "#6B6B70" }}>{sub}</div>
        </div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {row("@saliteclothing", "Instagram", 23.2, "linear-gradient(45deg, #FEDA75, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5)")}
      {row("@salo_salite", "TikTok", 23.7, "linear-gradient(135deg, #25F4EE, #000 45%, #000 55%, #FE2C55)")}
    </div>
  );
};

export const LongsleeveTikTok2: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / LS2.fps;
  const [, k0, fx, fy] = cam(t);
  // Hook: kurzes Wackeln beim Schlag auf "free"
  const sh = t >= 1.1 && t < 1.35 ? (1 - (t - 1.1) / 0.25) * 12 : t < 0.2 ? (1 - t / 0.2) * 8 : 0;
  const k = k0;
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k) + Math.sin(t * 90) * sh, 1080);
  const y = fit(fy * (1 - k) + Math.cos(t * 77) * sh, 1920);
  const trans = interpolate(t, [1.7, 2.0], [14, 0], clamp) * (t >= 1.7 ? 1 : 0); // Zoom-Unschärfe beim Übergang
  const blur = blurAt(t);
  const filt = `brightness(1.02) contrast(1.05) saturate(1.04)${blur > 0.02 || trans > 0.05 ? ` blur(${blur * 14 + trans}px)` : ""}${blur > 0.02 ? ` brightness(${1 - 0.25 * blur})` : ""}`;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: filt, transform: blur > 0 ? `scale(${1 + 0.04 * blur})` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})` }}>
          <OffthreadVideo src={staticFile("ls2/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </div>
      </div>
      <Hook t={t} />
      {CARDS.map((c, i) => (
        <CardView key={i} c={c} t={t} />
      ))}
      <DetailChips t={t} />
      <Steps t={t} />
      <Prices t={t} />
      <LastPw t={t} />
      <Follow t={t} />
      <Accounts t={t} />
      <WatchBar t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
