import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// WhatsApp-Kanal V3 (Kunde: ganz basic, flowy, kein Standbild am Ende, keine Kommentare, nichts auf dem Kopf).
// Satz läuft ungeschnitten, Ton unverändert (Originalspur wird beim Zusammenfügen nur kopiert).
// Bei "WhatsApp-Channel": kleine Kanal-Leiste oben links, "Folgen" wird zu "Gefolgt".
// Bei "sichert euch noch ein Passwort": kleine Webseite (wie saliteclothing.com) rechts neben dem Kopf, Passwort tippt sich.
export const WA2 = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * WA2.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.2, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const GREEN = "#25D366";
const CAP_TOP = 1100;
export const CLIP = 2.55;
export const WA2_TOTAL = CLIP;
export const WA2_FRAMES = f(WA2_TOTAL);

const WORDS: [string, number][] = [
  ["KOMMT", 0.0], ["JETZT", 0.58], ["IN DEN", 0.72], ["WHATSAPP", 0.86], ["CHANNEL", 1.14], ["UND", 1.48],
  ["SICHERT", 1.76], ["EUCH", 1.94], ["NOCH EIN", 2.04], ["PASSWORT", 2.28],
];
const T = { wa: 0.86, follow: 1.48, waOut: 1.72, web: 1.76, typeA: 1.92, typeE: 2.3, enter: 2.38 };

const Check: React.FC<{ size: number; p?: number; bg?: string }> = ({ size, p = 1, bg = GREEN }) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <circle r={11} fill={bg} />
    <path d="M-5 0 L-1.5 3.5 L5.5 -3.8" stroke="#FFFFFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={18} strokeDashoffset={18 * (1 - p)} />
  </svg>
);
const Bubble: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40">
    <circle r={19} fill={GREEN} />
    <path d="M-9 -2 a10 9 0 1 1 5 8 l-6 2 l1.5 -5 a9 9 0 0 1 -0.5 -5 z" fill="#FFFFFF" />
  </svg>
);

const Caption: React.FC<{ t: number }> = ({ t }) => {
  let i = -1;
  WORDS.forEach(([, s], k) => {
    if (t >= s) i = k;
  });
  if (i < 0) return null;
  const [w, s] = WORDS[i];
  const p = ease(t, s, 0.14);
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: CAP_TOP, textAlign: "center" }}>
      <div style={{ display: "inline-block", fontFamily: "'Inter'", fontWeight: 700, fontSize: 78, letterSpacing: "0.02em", color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.45)", transform: `translateY(${(1 - p) * 12}px) scale(${0.95 + 0.05 * p})`, opacity: p }}>{w}</div>
    </div>
  );
};

// kleine Kanal-Leiste oben links (über der Heizung, nicht auf dem Kopf)
const ChannelPill: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.wa || t >= T.waOut + 0.2) return null;
  const inP = ease(t, T.wa, 0.3);
  const outP = ease(t, T.waOut, 0.2, Easing.inOut(Easing.cubic));
  const followed = t >= T.follow;
  const tap = interpolate(t, [T.follow - 0.06, T.follow, T.follow + 0.1], [1, 0.9, 1], clamp);
  return (
    <div style={{ position: "absolute", top: 240, left: 60, opacity: Math.min(1, inP * 1.6) * (1 - outP), transform: `translateX(${(1 - inP) * -40}px) translateY(${-outP * 16}px) scale(${0.96 + 0.04 * inP})`, transformOrigin: "left center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.96)", borderRadius: 40, padding: "10px 12px 10px 12px", boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "relative", width: 56, height: 56, borderRadius: 28, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 34 }} />
          <div style={{ position: "absolute", right: -4, bottom: -4 }}>
            <Bubble size={24} />
          </div>
        </div>
        <div style={{ fontFamily: "'Inter'", lineHeight: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 24, color: "#111B21" }}>SALITE</div>
          <div style={{ fontWeight: 600, fontSize: 17, color: "#667781" }}>Kanal · 1.761 Follower</div>
        </div>
        <div style={{ height: 46, padding: "0 18px", marginLeft: 4, borderRadius: 23, background: followed ? "#E7F8EE" : GREEN, color: followed ? "#0A7A3B" : "#FFFFFF", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter'", fontWeight: 700, fontSize: 19, transform: `scale(${tap})` }}>
          {followed ? (
            <>
              <Check size={18} p={ease(t, T.follow, 0.18)} bg="#0A7A3B" /> Gefolgt
            </>
          ) : (
            "Folgen"
          )}
        </div>
      </div>
    </div>
  );
};

// kleine Passwort-Seite wie saliteclothing.com, rechts neben dem Kopf
const WebCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.web) return null;
  const inP = ease(t, T.web, 0.3);
  const n = Math.max(0, Math.min(6, Math.floor(((t - T.typeA) / (T.typeE - T.typeA)) * 6)));
  const press = interpolate(t, [T.enter - 0.05, T.enter, T.enter + 0.1], [1, 0.93, 1], clamp);
  const W = 290;
  const H = 560;
  return (
    <div style={{ position: "absolute", top: 260, left: 650, width: W, height: H, borderRadius: 40, background: "#111", padding: 7, boxShadow: "0 18px 44px rgba(0,0,0,0.45)", opacity: Math.min(1, inP * 1.6), transform: `translateX(${(1 - inP) * 60}px) scale(${0.95 + 0.05 * inP})` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: "linear-gradient(180deg, #F7F6FB 0%, #E8E7F4 55%, #DCE3F3 100%)", fontFamily: "'Inter'", textAlign: "center" }}>
        <div style={{ position: "absolute", top: 10, left: "50%", width: 78, height: 22, marginLeft: -39, borderRadius: 11, background: "#000" }} />
        <div style={{ marginTop: 46, fontWeight: 600, fontSize: 11, color: "#6B6B78" }}>saliteclothing.com</div>
        <img src={staticFile("brand/salite-s-dark.svg")} style={{ height: 38, marginTop: 16 }} />
        <div style={{ marginTop: 10, fontWeight: 500, fontSize: 15, letterSpacing: "0.32em", color: "#3A3A44", lineHeight: 1.35 }}>BLACK FRIDAY<br />IS LIVE</div>
        <div style={{ margin: "12px auto 0", width: 224, display: "flex", alignItems: "center", gap: 6, justifyContent: "center", background: "rgba(255,255,255,0.75)", borderRadius: 14, padding: "6px 8px", fontWeight: 600, fontSize: 9.5, letterSpacing: "0.14em", color: "#4A4A55" }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: "#E3262B", opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 5)) }} /> LIVE · BLACK FRIDAY ACCESS OFFEN
        </div>
        <div style={{ marginTop: 26, fontWeight: 700, fontSize: 30, letterSpacing: "0.02em", color: "#18181C" }}>69€ TRACKIE</div>
        <div style={{ margin: "16px auto 0", width: 220, height: 42, borderRadius: 12, background: "#FFFFFF", border: "1.5px solid #D6D6E0", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, boxSizing: "border-box" }}>
          <svg width={14} height={16} viewBox="0 0 20 24"><rect x={2} y={10} width={16} height={12} rx={3} fill="#18181C" /><path d="M5.5 10 V7 a4.5 4.5 0 0 1 9 0 V10" stroke="#18181C" strokeWidth={2.4} fill="none" /></svg>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "0.2em", color: n ? "#18181C" : "#9A9AA6" }}>{n ? "●".repeat(n) : "Passwort"}</span>
        </div>
        <div style={{ margin: "10px auto 0", width: 220, height: 44, borderRadius: 12, background: "#18181C", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, transform: `scale(${press})` }}>Enter Shop</div>
        <div style={{ marginTop: 10, fontWeight: 500, fontSize: 10, color: "#7A7A86" }}>
          Kein Passwort? <span style={{ textDecoration: "underline" }}>DM „Passwort“</span>
        </div>
      </div>
    </div>
  );
};

export const WaChannel2: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / WA2.fps;
  const grade = "brightness(1.02) contrast(1.05) saturate(1.04)"; // minimal
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: grade }}>
        <OffthreadVideo src={staticFile("wa2/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
      </div>
      <ChannelPill t={t} />
      <WebCard t={t} />
      <Caption t={t} />
    </AbsoluteFill>
  );
};
