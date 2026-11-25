import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Instagram-Story vom Shooting (grauer 550 GSM Trackie, Fellmütze): Besucher am Ende der Customer Journey abholen.
// Dezent, drei Argumente nacheinander, dann Handlungsaufruf. Ton unverändert, Bild minimal gegradet.
// Fakten: 69 € statt 144 € (Poster/Shop), 550 GSM, Black Week bis 27.11. (Poster). Link-Sticker-Zone y 1250 bis 1480 frei.
export const IGS = { fps: 30, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * IGS.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.35, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const RED = "#E3262B";
const INK = "#111111";
export const IGS_TOTAL = 6.66;
export const IGS_FRAMES = f(IGS_TOTAL);
const T = { tag: 0.35, gsm: 2.1, pw: 3.9, end: 4.3, cta: 4.6 };

// Preis-Anhänger mit Faden zur Hüfte
const PriceTag: React.FC<{ t: number; hx: number; hy: number }> = ({ t, hx, hy }) => {
  const p = ease(t, T.tag, 0.45);
  const line = interpolate(t, [T.tag + 0.1, T.tag + 0.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sway = Math.sin(t * 1.6) * 1.6;
  const L = 300;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M 400 760 Q ${(400 + hx) / 2 + 20} ${(760 + hy) / 2 - 10} ${hx} ${hy}`} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - line)} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
        <circle cx={hx} cy={hy} r={6} fill="#FFFFFF" opacity={line} />
      </svg>
      <div style={{ position: "absolute", left: 70, top: 640, width: 340, opacity: p, transform: `translateY(${(1 - p) * 30}px) rotate(${-4 + sway}deg)`, transformOrigin: "85% 10%" }}>
        <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 22, padding: "22px 24px 18px", boxShadow: "0 18px 44px rgba(0,0,0,0.35)" }}>
          <div style={{ position: "absolute", right: 22, top: 16, width: 18, height: 18, borderRadius: 9, border: "3px solid #D8D8D8" }} />
          <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 18, letterSpacing: "0.24em", color: "#6B6B70" }}>550 GSM TRACKIE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 6 }}>
            <span style={{ fontFamily: "'Anton'", fontSize: 96, lineHeight: 1, color: RED }}>69 €</span>
            <span style={{ position: "relative", fontFamily: "'Anton'", fontSize: 42, color: "#9A9A9A" }}>
              144 €
              <span style={{ position: "absolute", left: -4, right: -4, top: "54%", height: 4, background: "#9A9A9A", transform: "rotate(-8deg)" }} />
            </span>
          </div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 18, color: "#6B6B70", marginTop: 4 }}>Hoodie + Jogger</div>
        </div>
      </div>
    </>
  );
};

// Argument: keine Winterjacke
const NoJacket: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.gsm, 0.4);
  if (p <= 0) return null;
  const st = interpolate(t, [T.gsm + 0.45, T.gsm + 0.65], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 70, top: 935, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: INK, borderRadius: 18, padding: "14px 22px" }}>
        <span style={{ position: "relative", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, letterSpacing: "0.04em", color: st > 0.5 ? "rgba(255,255,255,0.55)" : "#FFFFFF" }}>
          WINTERJACKE
          <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 5, borderRadius: 3, background: RED, transform: `scaleX(${st})`, transformOrigin: "left center" }} />
        </span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#FFFFFF", opacity: ease(t, T.gsm + 0.7, 0.3) }}>550 GSM reicht</span>
      </div>
    </div>
  );
};

// Dringlichkeit oben: Passwörter laufen aus, Black Week endet 27.11.
const Urgency: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.pw, 0.4);
  if (p <= 0) return null;
  const q = ease(t, T.end, 0.4);
  const dot = 0.45 + 0.55 * Math.abs(Math.sin((t - T.pw) * 4));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 270, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFFFFF", borderRadius: 30, padding: "14px 28px", boxShadow: "0 12px 30px rgba(0,0,0,0.22)", opacity: p, transform: `translateY(${(1 - p) * -18}px)` }}>
        <span style={{ width: 16, height: 16, borderRadius: 8, background: RED, opacity: dot }} />
        <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 32, letterSpacing: "0.06em", color: INK }}>PASSWÖRTER LAUFEN AUS</span>
      </div>
      <div style={{ background: INK, borderRadius: 24, padding: "10px 22px", opacity: q, transform: `translateY(${(1 - q) * -12}px)` }}>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.14em", color: "#FFFFFF" }}>BLACK WEEK ENDET AM 27.11.</span>
      </div>
    </div>
  );
};

// Handlungsaufruf links über der freien Link-Zone (nicht über den Beinen)
const Cta: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.cta, 0.4);
  if (p <= 0) return null;
  const bob = Math.sin((t - T.cta) * 6) * 6;
  return (
    <div style={{ position: "absolute", left: 70, top: 1120, display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <div style={{ background: INK, borderRadius: 24, padding: "14px 26px" }}>
        <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 28, letterSpacing: "0.14em", color: "#FFFFFF" }}>JETZT PASSWORT SICHERN</span>
      </div>
      <svg width={40} height={40} viewBox="-20 -20 40 40" style={{ marginTop: 6, transform: `translateY(${bob}px)` }}>
        <path d="M0 -14 L0 12 M-9 4 L0 13 L9 4" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const IgStoryShoot: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / IGS.fps;
  // langsam zum Model hineinfahren (max. 1,15, kaum Hochskalierung)
  const k = interpolate(t, [0, IGS_TOTAL], [1.0, 1.15], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const fx = 580;
  const fy = 840;
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})`, filter: "contrast(1.04) saturate(1.03)" }}>
        <OffthreadVideo src={staticFile("igs/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
      </div>
      <PriceTag t={t} hx={x + k * 528} hy={y + k * 905} />
      <NoJacket t={t} />
      <Urgency t={t} />
      <Cta t={t} />
    </AbsoluteFill>
  );
};
