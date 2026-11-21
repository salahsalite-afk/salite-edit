import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Aufruf (Quelle 3,2 s): "Kommt jetzt in den WhatsApp-Channel und savet ihr euch nochmal ein Passwort."
// Nach "Channel" Freeze 1,8 s: Kanal-Karte groß, Übersicht in 3 Schritten, freie Fläche für den Instagram-Link-Sticker.
// Danach TikTok-Glocke (Benachrichtigungen an), Schritt-Leiste oben hakt ab. Wort-für-Wort-Captions.
export const WA = { fps: 30, width: 1080, height: 1920 };
const CUT = 1.44; // Sprechpause nach "Channel"
const FREEZE = 1.8;
const CLIP = 3.2;
const TAIL = 0.6;
export const WA_FRAMES = Math.round((CLIP + FREEZE + TAIL) * WA.fps);
const f = (s: number) => Math.round(s * WA.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.18) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: OUT });
const out = (src: number) => (src < CUT ? src : src + FREEZE); // Quellzeit zu Ausgabezeit
const GREEN = "#25D366";
const TT_RED = "#FE2C55";

// Wortzeiten (Whisper medium, an der Lautstärke-Hüllkurve geprüft)
const WORDS: { w: string; s: number }[] = [
  { w: "KOMMT", s: 0.0 },
  { w: "JETZT", s: 0.62 },
  { w: "IN DEN", s: 0.76 },
  { w: "WHATSAPP", s: 0.88 },
  { w: "CHANNEL", s: 1.14 },
  { w: "UND", s: 1.52 },
  { w: "SAVED", s: 1.78 },
  { w: "IHR EUCH", s: 2.1 },
  { w: "NOCHMAL", s: 2.32 },
  { w: "EIN", s: 2.54 },
  { w: "PASSWORT", s: 2.62 },
].map((w) => ({ ...w, s: out(w.s) }));
const FZ = CUT; // Freeze-Beginn (Ausgabe)
const FE = CUT + FREEZE; // Freeze-Ende
const T = {
  card: FZ + 0.08,
  join: FZ + 0.62,
  steps: FZ + 0.5,
  link: FZ + 0.95,
  bell: out(1.6),
  bellOn: out(1.95),
  pass: out(2.62),
  end: CLIP + FREEZE + TAIL,
};

const Caption: React.FC<{ t: number }> = ({ t }) => {
  if (t >= FZ - 0.02 && t < FE) return null; // im Freeze sprechen die Karten
  let i = -1;
  WORDS.forEach((w, k) => {
    if (t >= w.s) i = k;
  });
  if (i < 0 || t > out(3.05)) return null;
  const w = WORDS[i];
  const p = ease(t, w.s, 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1150, textAlign: "center" }}>
      <div style={{ display: "inline-block", fontFamily: "'Inter'", fontWeight: 700, fontSize: 78, letterSpacing: "0.02em", color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.45)", transform: `translateY(${(1 - p) * 14}px) scale(${0.94 + 0.06 * p})`, opacity: p }}>
        {w.w}
      </div>
    </div>
  );
};

const Check: React.FC<{ size: number; p?: number; bg?: string }> = ({ size, p = 1, bg = GREEN }) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <circle r={11} fill={bg} />
    <path d="M-5 0 L-1.5 3.5 L5.5 -3.8" stroke="#FFFFFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={18} strokeDashoffset={18 * (1 - p)} />
  </svg>
);

// Sprechblasen-Zeichen (eigene Form)
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

// Schritt-Leiste oben: Kanal, Glocke, Passwort
const StepBar: React.FC<{ t: number }> = ({ t }) => {
  const o = ease(t, FZ + 0.25, 0.3);
  if (o <= 0) return null;
  const steps = [
    { n: 1, label: "KANAL", done: T.join },
    { n: 2, label: "GLOCKE", done: T.bellOn },
    { n: 3, label: "PASSWORT", done: T.pass + 0.1 },
  ];
  return (
    <div style={{ position: "absolute", top: 240, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(10,10,10,0.55)", borderRadius: 30, padding: "10px 16px" }}>
        {steps.map((s, i) => {
          const d = ease(t, s.done, 0.25);
          return (
            <React.Fragment key={s.n}>
              {i > 0 && <div style={{ width: 22, height: 2, background: "rgba(255,255,255,0.35)" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {d > 0 ? (
                  <Check size={28} p={d} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 14, border: "2px solid rgba(255,255,255,0.8)", color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>{s.n}</div>
                )}
                <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 19, letterSpacing: "0.14em", color: d > 0 ? "#FFFFFF" : "rgba(255,255,255,0.75)" }}>{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Freeze: Kanal-Karte groß, Übersicht, Link-Hinweis
const FreezeMoment: React.FC<{ t: number }> = ({ t }) => {
  if (t < FZ || t >= FE + 0.2) return null;
  const o = 1 - ease(t, FE - 0.05, 0.2);
  const card = ease(t, T.card, 0.3);
  const joined = t >= T.join;
  const tap = interpolate(t, [T.join - 0.08, T.join, T.join + 0.12], [1, 0.93, 1], clamp);
  const steps = ["WhatsApp-Kanal beitreten", "Glocke an", "Passwort sichern"];
  const link = ease(t, T.link, 0.3);
  const bob = Math.sin((t - T.link) * 7) * 6;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {/* Kanal-Karte */}
      <div style={{ position: "absolute", top: 560, left: 90, right: 170, opacity: card, transform: `translateY(${(1 - card) * 30}px) scale(${0.96 + 0.04 * card})` }}>
        <div style={{ background: "#FFFFFF", borderRadius: 28, padding: "22px 24px", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, color: "#667781", letterSpacing: "0.04em" }}>
            <Bubble size={28} /> WhatsApp-Kanal
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
            <div style={{ width: 92, height: 92, borderRadius: 46, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 58 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontWeight: 700, fontSize: 36, color: "#111B21" }}>
                SALITE <Check size={28} />
              </div>
              <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 21, color: "#667781", marginTop: 2 }}>Drops · Passwörter · zuerst hier</div>
            </div>
          </div>
          <div style={{ marginTop: 18, height: 64, borderRadius: 32, background: joined ? "#E7F8EE" : GREEN, color: joined ? "#0A7A3B" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, transform: `scale(${tap})` }}>
            {joined ? (
              <>
                <Check size={26} p={ease(t, T.join, 0.2)} bg="#0A7A3B" /> Beigetreten
              </>
            ) : (
              "Kanal beitreten"
            )}
          </div>
        </div>
      </div>
      {/* Übersicht */}
      <div style={{ position: "absolute", top: 930, left: 110, right: 190 }}>
        {steps.map((s, i) => {
          const q = ease(t, T.steps + i * 0.12, 0.22);
          const done = i === 0 && joined;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, opacity: q, transform: `translateX(${(1 - q) * -18}px)` }}>
              {done ? (
                <Check size={30} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.92)", color: "#111", fontFamily: "'Inter'", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              )}
              <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{s}</span>
            </div>
          );
        })}
      </div>
      {/* Link-Hinweis: darunter bleibt Platz für den Instagram-Link-Sticker */}
      <div style={{ position: "absolute", top: 1100, left: 0, right: 80, display: "flex", flexDirection: "column", alignItems: "center", opacity: link }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>LINK ANTIPPEN</div>
        <svg width={40} height={40} viewBox="-20 -20 40 40" style={{ marginTop: 6, transform: `translateY(${bob}px)` }}>
          <path d="M0 -14 L0 12 M-9 4 L0 13 L9 4" stroke="#FFFFFF" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// TikTok-Glocke: Aktionsleiste, Glocke klingelt und wird aktiv
const BellMoment: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, T.bell, 0.25);
  if (p <= 0) return null;
  const on = t >= T.bellOn;
  const ring = t >= T.bell + 0.15 && t < T.bellOn + 0.5 ? Math.sin((t - T.bell) * 38) * 16 * Math.max(0, 1 - Math.max(0, t - T.bellOn) / 0.5) : 0;
  const tap = interpolate(t, [T.bellOn - 0.08, T.bellOn, T.bellOn + 0.12], [1, 0.9, 1], clamp);
  const toast = ease(t, T.bellOn + 0.12, 0.25);
  const wave = interpolate(t, [T.bellOn, T.bellOn + 0.5], [0, 1], { ...clamp, easing: OUT });
  const btn: React.CSSProperties = { height: 64, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 25 };
  return (
    <div style={{ position: "absolute", top: 1270, left: 0, right: 80, display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.96)", borderRadius: 18, padding: 12, boxShadow: "0 12px 34px rgba(0,0,0,0.28)" }}>
        <div style={{ ...btn, width: 200, background: "#F1F1F2", color: "#161823" }}>Gefolgt</div>
        <div style={{ ...btn, width: 200, background: "#F1F1F2", color: "#161823" }}>Nachricht</div>
        <div style={{ ...btn, width: 70, position: "relative", background: on ? TT_RED : "#F1F1F2", transform: `scale(${tap})` }}>
          <div style={{ position: "absolute", inset: -6, borderRadius: 14, border: `3px solid ${TT_RED}`, transform: `scale(${1 + wave * 0.35})`, opacity: on ? 1 - wave : 0 }} />
          <div style={{ transform: `rotate(${ring}deg)`, transformOrigin: "50% 15%", display: "flex" }}>
            <BellIcon size={34} color={on ? "#FFFFFF" : "#161823"} fill={on ? "#FFFFFF" : "none"} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, background: "rgba(22,24,35,0.86)", borderRadius: 22, padding: "10px 18px", opacity: toast, transform: `translateY(${(1 - toast) * 10}px)` }}>
        <BellIcon size={24} color="#FFFFFF" fill="#FFFFFF" />
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, color: "#FFFFFF" }}>Benachrichtigungen an</span>
      </div>
    </div>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol: number; len?: number }> = ({ at, src, vol, len = 1 }) => (
  <Sequence from={Math.max(0, f(at))} durationInFrames={f(len)}>
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

export const WaChannel: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / WA.fps;
  // Einstieg: Kamera-Stoß mit Unschärfe und kurzem Blitz
  const hit = interpolate(t, [0, 0.35], [1, 0], { ...clamp, easing: OUT });
  const drift = interpolate(t, [0.35, T.end], [0, 0.035], clamp);
  // Freeze: kleiner Zoom-Stoß, Bild ruhiger und dunkler, damit Karte und Sticker wirken
  const fzIn = ease(t, FZ, 0.25) * (1 - ease(t, FE - 0.05, 0.2));
  const fzPunch = interpolate(t, [FZ, FZ + 0.25], [0.05, 0], clamp) * (t >= FZ ? 1 : 0);
  const scale = 1 + 0.14 * hit + drift + fzPunch;
  const blur = 10 * interpolate(t, [0, 0.2], [1, 0], clamp) + 6 * fzIn;
  const bright = 1 - 0.38 * fzIn;
  const flash = Math.max(interpolate(t, [0, 0.03, 0.22], [0.6, 0.35, 0], clamp), t >= FZ ? interpolate(t, [FZ, FZ + 0.02, FZ + 0.18], [0, 0.45, 0], clamp) : 0);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px) brightness(${bright})` }}>
        <Sequence durationInFrames={f(CUT)}>
          <OffthreadVideo src={staticFile("wa/clip.mp4")} muted />
        </Sequence>
        <Sequence from={f(CUT)} durationInFrames={f(FREEZE)}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile("wa/clip.mp4")} trimBefore={f(CUT) - 1} muted />
          </Freeze>
        </Sequence>
        <Sequence from={f(FE)} durationInFrames={f(CLIP - CUT)}>
          <OffthreadVideo src={staticFile("wa/clip.mp4")} trimBefore={f(CUT)} muted />
        </Sequence>
        <Sequence from={f(CLIP + FREEZE)} durationInFrames={f(TAIL)}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile("wa/clip.mp4")} trimBefore={f(CLIP) - 1} muted />
          </Freeze>
        </Sequence>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1050, height: 600, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0) 100%)" }} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
      <StepBar t={t} />
      <Caption t={t} />
      <FreezeMoment t={t} />
      <BellMoment t={t} />

      {/* Stimme: vor und nach dem Freeze, im Freeze Stille */}
      <Sequence durationInFrames={f(CUT)}>
        <Audio src={staticFile("wa/voice.wav")} />
      </Sequence>
      <Sequence from={f(FE)}>
        <Audio src={staticFile("wa/voice.wav")} trimBefore={f(CUT)} />
      </Sequence>
      <Sfx at={0} src="sfx/hit_low.wav" vol={0.35} />
      <Sfx at={0} src="sfx/whoosh_soft.wav" vol={0.25} len={0.8} />
      <Sfx at={FZ} src="wa/snd/shutter.wav" vol={0.35} len={0.5} />
      <Sfx at={T.card} src="wa/snd/pop.wav" vol={0.25} len={0.3} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={T.steps + i * 0.12} src="sfx/tick.wav" vol={0.1} len={0.3} />
      ))}
      <Sfx at={T.join} src="sfx/click.wav" vol={0.2} len={0.4} />
      <Sfx at={FE - 0.12} src="sfx/whoosh_soft.wav" vol={0.16} len={0.6} />
      <Sfx at={T.bell + 0.15} src="wa/snd/bell.wav" vol={0.32} len={1.3} />
      <Sfx at={T.bellOn} src="sfx/click.wav" vol={0.18} len={0.4} />
      <Sfx at={T.pass + 0.1} src="wa/snd/pop.wav" vol={0.2} len={0.3} />
    </AbsoluteFill>
  );
};
