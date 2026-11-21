import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Kurzer Aufruf (3,2 s): "Kommt jetzt in den WhatsApp-Channel, dann saved ihr euch noch ein Passwort."
// Wort-für-Wort-Captions (groß, clean), Einstieg mit Kamera-Stoß, kleine Kanal-Karte unter "WhatsApp",
// danach Passwort speichern mit Haken: Chat, DM, Website.
export const WA = { fps: 30, width: 1080, height: 1920 };
const CLIP = 3.2;
const TAIL = 0.6; // letztes Bild steht, bis der Haken fertig ist
export const WA_FRAMES = Math.round((CLIP + TAIL) * WA.fps);
const f = (s: number) => Math.round(s * WA.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.18) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: OUT });
const GREEN = "#25D366";

// Wortzeiten aus Whisper (Sekunden), sehr kurze Wörter zusammengefasst, damit nichts nur einen Frame steht
const WORDS: { w: string; s: number }[] = [
  { w: "KOMMT", s: 0.0 },
  { w: "JETZT", s: 0.54 },
  { w: "IN DEN", s: 0.64 },
  { w: "WHATSAPP", s: 0.84 },
  { w: "CHANNEL", s: 1.02 },
  { w: "DANN", s: 1.5 },
  { w: "SAVED", s: 1.62 },
  { w: "IHR EUCH", s: 1.9 },
  { w: "NOCH EIN", s: 2.24 },
  { w: "PASSWORT", s: 2.38 },
];
const T = { wa: 0.84, waOut: 1.55, follow: 1.25, pass: 1.62, typed: 2.0, saved: 2.45, chips: 2.62, end: CLIP + TAIL };

const Caption: React.FC<{ t: number }> = ({ t }) => {
  let i = -1;
  WORDS.forEach((w, k) => {
    if (t >= w.s) i = k;
  });
  if (i < 0 || t > 3.05) return null;
  const w = WORDS[i];
  const p = ease(t, w.s, 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1180, textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: "'Inter'",
          fontWeight: 700,
          fontSize: 78,
          letterSpacing: "0.02em",
          color: "#FFFFFF",
          textShadow: "0 3px 14px rgba(0,0,0,0.45)",
          transform: `translateY(${(1 - p) * 14}px) scale(${0.94 + 0.06 * p})`,
          opacity: p,
        }}
      >
        {w.w}
      </div>
    </div>
  );
};

// Kleines Sprechblasen-Zeichen (eigene Form, kein Fremdlogo)
const Bubble: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40">
    <circle r={19} fill={GREEN} />
    <path d="M-9 -2 a10 9 0 1 1 5 8 l-6 2 l1.5 -5 a9 9 0 0 1 -0.5 -5 z" fill="#FFFFFF" />
  </svg>
);

// Kanal-Karte unter "WhatsApp"
const ChannelCard: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.wa, 0.25);
  const o = 1 - ease(t, T.waOut - 0.12, 0.12);
  const followed = t >= T.follow;
  const tap = interpolate(t, [T.follow - 0.06, T.follow, T.follow + 0.1], [1, 0.92, 1], clamp);
  if (p <= 0 || o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1300, display: "flex", justifyContent: "center", opacity: p * o, transform: `translateY(${(1 - p) * 26}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.94)", borderRadius: 22, padding: "14px 16px 14px 14px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "relative", width: 64, height: 64, borderRadius: 32, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 40 }} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, color: "#111B21" }}>
            SALITE
            <svg width={22} height={22} viewBox="-11 -11 22 22">
              <circle r={10} fill={GREEN} />
              <path d="M-4.5 0 L-1.2 3.2 L5 -3.4" stroke="#FFFFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter'", fontWeight: 600, fontSize: 18, color: "#667781", marginTop: 2 }}>
            <Bubble size={18} /> WhatsApp-Kanal
          </div>
        </div>
        <div
          style={{
            marginLeft: 6,
            minWidth: 128,
            height: 50,
            borderRadius: 25,
            background: followed ? "#E7F8EE" : GREEN,
            color: followed ? "#0A7A3B" : "#FFFFFF",
            fontFamily: "'Inter'",
            fontWeight: 700,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transform: `scale(${tap})`,
            padding: "0 18px",
          }}
        >
          {followed ? "✓ Gefolgt" : "Folgen"}
        </div>
      </div>
    </div>
  );
};

// Passwort speichern: Feld mit Punkten, Haken, dann Chat · DM · Website
const PasswordSave: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.pass, 0.25);
  if (p <= 0) return null;
  const dots = Math.max(0, Math.min(8, Math.floor(((t - T.pass - 0.12) / (T.typed - T.pass)) * 8)));
  const saved = ease(t, T.saved, 0.22);
  const ring = interpolate(t, [T.saved, T.saved + 0.35], [0, 1], { ...clamp, easing: OUT });
  const chips = ["CHAT", "DM", "WEBSITE"];
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1300, display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.94)", borderRadius: 22, padding: "14px 18px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", minWidth: 520 }}>
        <svg width={40} height={40} viewBox="-20 -20 40 40">
          <circle cx={-6} cy={0} r={8} fill="none" stroke="#111B21" strokeWidth={3.5} />
          <path d="M2 0 H16 M11 0 V6 M15 0 V5" stroke="#111B21" strokeWidth={3.5} strokeLinecap="round" />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 15, letterSpacing: "0.18em", color: "#667781" }}>PASSWORT</div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, color: "#111B21", letterSpacing: "0.18em", height: 36 }}>{"•".repeat(dots)}</div>
        </div>
        <div style={{ position: "relative", width: 52, height: 52 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 26, border: `3px solid ${GREEN}`, transform: `scale(${1 + ring * 0.6})`, opacity: (1 - ring) * (saved > 0 ? 1 : 0) }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: saved > 0 ? GREEN : "#E9EDEF", transform: `scale(${0.7 + 0.3 * Math.max(saved, 0.0001)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={30} height={30} viewBox="-12 -12 24 24">
              <path d="M-6 0 L-1.8 4.2 L6.5 -4.5" stroke="#FFFFFF" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - saved)} />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        {chips.map((c, i) => {
          const q = ease(t, T.chips + i * 0.12, 0.18);
          return (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(17,27,33,0.72)", borderRadius: 18, padding: "8px 14px", opacity: q, transform: `scale(${0.85 + 0.15 * q})` }}>
              <svg width={18} height={18} viewBox="-9 -9 18 18">
                <circle r={8.5} fill={GREEN} />
                <path d="M-3.8 0 L-1 2.8 L4 -2.8" stroke="#FFFFFF" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.14em", color: "#FFFFFF" }}>{c}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.2em", color: "#FFFFFF", textShadow: "0 1px 6px rgba(0,0,0,0.6)", opacity: saved }}>PASSWORT GESICHERT</div>
    </div>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol: number; len?: number }> = ({ at, src, vol, len = 1 }) => (
  <Sequence from={Math.max(0, f(at))} durationInFrames={f(len)}>
    <Audio src={staticFile(`sfx/${src}`)} volume={vol} />
  </Sequence>
);

export const WaChannel: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / WA.fps;
  // Einstieg: Kamera-Stoß mit Unschärfe und kurzem Blitz
  const hit = interpolate(t, [0, 0.35], [1, 0], { ...clamp, easing: OUT });
  const scale = 1 + 0.14 * hit + interpolate(t, [0.35, CLIP], [0, 0.035], clamp);
  const blur = 10 * interpolate(t, [0, 0.2], [1, 0], clamp);
  const flash = interpolate(t, [0, 0.03, 0.22], [0.6, 0.35, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>
        <Sequence durationInFrames={f(CLIP)}>
          <OffthreadVideo src={staticFile("wa/clip.mp4")} muted />
        </Sequence>
        <Sequence from={f(CLIP)} durationInFrames={f(TAIL)}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile("wa/clip.mp4")} trimBefore={f(CLIP) - 1} muted />
          </Freeze>
        </Sequence>
      </AbsoluteFill>
      {/* leichter Verlauf unten, damit Schrift und Karten sauber lesbar sind */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1050, height: 600, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0) 100%)" }} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
      <Caption t={t} />
      <ChannelCard t={t} />
      <PasswordSave t={t} />

      {/* Ton: Stimme (in der Mischung angehoben), leise Effekte */}
      <Audio src={staticFile("wa/voice.wav")} />
      <Sfx at={0} src="hit_low.wav" vol={0.35} len={1} />
      <Sfx at={0} src="whoosh_soft.wav" vol={0.25} len={0.8} />
      <Sfx at={T.wa} src="notify.wav" vol={0.16} len={1} />
      <Sfx at={T.follow} src="click.wav" vol={0.16} len={0.4} />
      {Array.from({ length: 8 }, (_, i) => (
        <Sfx key={i} at={T.pass + 0.12 + ((T.typed - T.pass) * (i + 1)) / 8} src={`keyboard_tap${(i % 3) + 1}.wav`} vol={0.07} len={0.2} />
      ))}
      <Sfx at={T.saved} src="click.wav" vol={0.2} len={0.4} />
      <Sfx at={T.chips} src="tick.wav" vol={0.1} len={0.4} />
    </AbsoluteFill>
  );
};
