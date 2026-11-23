import React from "react";
import { AbsoluteFill, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// WhatsApp-Kanal V2 (Kunde: wie letztes Mal, noch flüssiger). Satz läuft ungeschnitten durch, Ton unverändert.
// Während der Stimme: Kanal-Karte mit echten 1.761 Followern, "Folgen" -> "Gefolgt", Glocke an.
// Danach Standbild mit leichtem Zoom: Mitteilung "Dein Passwort ist da", echte TikTok-Kommentare (Video vom 18.11.2026,
// ohne Namen), Hinweis auf den Link-Sticker. Untertitel immer bei y 1100, darunter (1250 bis 1480) frei für den Link.
export const WA2 = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * WA2.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const BACK = Easing.out(Easing.back(1.1));
const ease = (t: number, a: number, len = 0.2, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const GREEN = "#25D366";
const CAP_TOP = 1100;
export const CLIP = 2.55;
export const WA2_TOTAL = 6.9;
export const WA2_FRAMES = f(WA2_TOTAL);

const WORDS: [string, number][] = [
  ["KOMMT", 0.0], ["JETZT", 0.58], ["IN DEN", 0.72], ["WHATSAPP", 0.86], ["CHANNEL", 1.14], ["UND", 1.48],
  ["SICHERT", 1.76], ["EUCH", 1.94], ["NOCH EIN", 2.04], ["PASSWORT", 2.28],
];
const T = { card: 0.86, follow: 1.48, bell: 1.76, cardOut: 2.4, notif: 2.62, cHead: 3.0, c: [3.12, 3.5, 3.88, 4.26], link: 2.9, end: WA2_TOTAL };
// echte Kommentare unter dem TikTok "Nutzt eure Chance" (@sj_salite, 18.11.2026), wörtlich, ohne Emojis und ohne Namen
const COMMENTS: { text: string; date: string; liked?: boolean }[] = [
  { text: "Wann kriege ich mein Passwort", date: "19.11." },
  { text: "Warte noch auf mein passwort", date: "18.11." },
  { text: "Hab geschrieben g", date: "18.11.", liked: true },
  { text: "Alles gemacht Bro bist der beste", date: "18.11." },
];

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
const BellIcon: React.FC<{ size: number; color: string; fill?: string }> = ({ size, color, fill = "none" }) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <path d="M-7 5 L-7 -1 A7 7 0 0 1 7 -1 L7 5 L9 7.5 L-9 7.5 Z" fill={fill} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <path d="M-2.6 9.6 A2.8 2.8 0 0 0 2.6 9.6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    <path d="M0 -8 L0 -10" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const Caption: React.FC<{ t: number }> = ({ t }) => {
  if (t >= CLIP + 0.05) return null;
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

// Kanal-Karte oben (über dem Kopf), während sie spricht
const ChannelCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.card || t >= T.cardOut + 0.3) return null;
  const inP = ease(t, T.card, 0.4, BACK);
  const outP = ease(t, T.cardOut, 0.3, Easing.inOut(Easing.cubic));
  const followed = t >= T.follow;
  const tap = interpolate(t, [T.follow - 0.07, T.follow, T.follow + 0.12], [1, 0.92, 1], clamp);
  const bellOn = t >= T.bell;
  const ring = t >= T.bell && t < T.bell + 0.6 ? Math.sin((t - T.bell) * 34) * 16 * (1 - (t - T.bell) / 0.6) : 0;
  const wave = interpolate(t, [T.bell, T.bell + 0.5], [0, 1], { ...clamp, easing: OUT });
  return (
    <div style={{ position: "absolute", top: 228, left: 60, right: 140, opacity: Math.min(1, inP * 1.5) * (1 - outP), transform: `translateY(${(1 - inP) * -60 - outP * 40}px) scale(${0.94 + 0.06 * inP})` }}>
      <div style={{ background: "#FFFFFF", borderRadius: 30, padding: "18px 20px", boxShadow: "0 18px 44px rgba(0,0,0,0.38)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 19, color: "#667781", marginBottom: 12 }}>
          <Bubble size={26} /> WhatsApp-Kanal
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 78, height: 78, borderRadius: 39, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 48 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, color: "#111B21" }}>
              SALITE <Check size={24} />
            </div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 21, color: "#667781" }}>Kanal · 1.761 Follower</div>
          </div>
          {/* Glocke */}
          <div style={{ position: "relative", width: 62, height: 62, borderRadius: 31, background: bellOn ? GREEN : "#F0F2F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: -5, borderRadius: 36, border: `3px solid ${GREEN}`, transform: `scale(${1 + wave * 0.45})`, opacity: bellOn ? 1 - wave : 0 }} />
            <div style={{ transform: `rotate(${ring}deg)`, transformOrigin: "50% 15%", display: "flex" }}>
              <BellIcon size={34} color={bellOn ? "#FFFFFF" : "#111B21"} fill={bellOn ? "#FFFFFF" : "none"} />
            </div>
          </div>
          {/* Folgen */}
          <div style={{ height: 62, padding: "0 26px", borderRadius: 31, background: followed ? "#E7F8EE" : GREEN, color: followed ? "#0A7A3B" : "#FFFFFF", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontWeight: 700, fontSize: 25, transform: `scale(${tap})` }}>
            {followed ? (
              <>
                <Check size={24} p={ease(t, T.follow, 0.2)} bg="#0A7A3B" /> Gefolgt
              </>
            ) : (
              "Folgen"
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mitteilung oben nach dem Satz
const Notification: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.notif) return null;
  const nIn = ease(t, T.notif, 0.45, BACK);
  const dots = Math.max(0, Math.min(6, Math.floor((t - T.notif - 0.25) / 0.07)));
  return (
    <div style={{ position: "absolute", top: 232 + (1 - nIn) * -200, left: 50, right: 130, opacity: Math.min(1, nIn * 1.4) }}>
      <div style={{ display: "flex", gap: 18, alignItems: "center", background: "rgba(246,246,246,0.97)", borderRadius: 34, padding: "20px 22px", boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ width: 76, height: 76, borderRadius: 18, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 48 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, color: "#111" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>SALITE <Bubble size={24} /></span>
            <span style={{ fontWeight: 600, fontSize: 22, color: "#8A8A8E" }}>jetzt</span>
          </div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 26, color: "#222", marginTop: 4 }}>
            Dein Passwort ist da: <span style={{ letterSpacing: "0.12em" }}>{"●".repeat(dots)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// echte Kommentare, nacheinander
const Comments: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.cHead) return null;
  const h = ease(t, T.cHead, 0.3);
  return (
    <div style={{ position: "absolute", top: 600, left: 60, right: 140 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, opacity: h, transform: `translateY(${(1 - h) * 10}px)` }}>
        <svg width={30} height={30} viewBox="0 0 24 24"><path d="M4 5 h16 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 H10 l-5 4 v-4 H4 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2 Z" fill="#FFFFFF" /></svg>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.16em", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>ECHTE KOMMENTARE</span>
      </div>
      {COMMENTS.map((c, i) => {
        const p = ease(t, T.c[i], 0.35, BACK);
        if (p <= 0) return null;
        return (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: "16px 20px", marginBottom: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.3)", opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -80}px)` }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(135deg, #C9CDD3, #9EA3AA)", flexShrink: 0 }} />
            <div style={{ flex: 1, fontFamily: "'Inter'" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "inline-block", width: 110, height: 16, borderRadius: 8, background: "#C7C7CC", filter: "blur(3px)" }} />
                <span style={{ fontWeight: 600, fontSize: 19, color: "#8A8B91" }}>{c.date}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 31, color: "#161823", marginTop: 4 }}>{c.text}</div>
              {c.liked && <div style={{ fontWeight: 600, fontSize: 19, color: "#FE2C55", marginTop: 4 }}>♥ Ersteller gefällt das</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Hinweis auf den Link-Sticker darunter
const LinkHint: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.link, 0.4);
  if (p <= 0) return null;
  const bob = Math.sin((t - T.link) * 7) * 6;
  return (
    <div style={{ position: "absolute", top: 1170, left: 0, right: 80, display: "flex", flexDirection: "column", alignItems: "center", opacity: p }}>
      <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.22em", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>LINK ANTIPPEN</div>
      <svg width={38} height={38} viewBox="-20 -20 40 40" style={{ marginTop: 4, transform: `translateY(${bob}px)` }}>
        <path d="M0 -14 L0 12 M-9 4 L0 13 L9 4" stroke="#FFFFFF" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const WaChannel2: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / WA2.fps;
  // nach dem Satz: Standbild mit leichtem Zoom (nicht starr) und etwas dunkler, damit die Karten lesbar sind
  const z = interpolate(t, [CLIP, WA2_TOTAL], [1, 1.07], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const dim = interpolate(t, [CLIP - 0.1, CLIP + 0.4], [0, 0.28], clamp);
  const grade = "brightness(1.02) contrast(1.05) saturate(1.04)"; // minimal
  const lastFrame = f(CLIP) - 2;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: "50% 30%", filter: grade }}>
        <Sequence from={0} durationInFrames={f(CLIP)}>
          <OffthreadVideo src={staticFile("wa2/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </Sequence>
        <Sequence from={f(CLIP)} durationInFrames={f(WA2_TOTAL - CLIP)}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile("wa2/clip.mp4")} trimBefore={lastFrame} muted style={{ width: 1080, height: 1920 }} />
          </Freeze>
        </Sequence>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: dim }} />
      <ChannelCard t={t} />
      <Notification t={t} />
      <Comments t={t} />
      <LinkHint t={t} />
      <Caption t={t} />
    </AbsoluteFill>
  );
};
