import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Aufruf (Quelle 3,2 s): "Kommt jetzt in den WhatsApp-Channel und savet ihr euch nochmal ein Passwort."
// Nach "Channel" Freeze 2,6 s, in dem viel passiert: Lade-Linie durch 3 Schritte
// (Kanal beitreten -> Glocke an mit Glocken-Icon -> Passwort kommt als Mitteilung).
// Feste freie Zone für den Instagram-Link-Sticker (y 1280 bis 1480) über das ganze Video: nichts liegt dort.
export const WA = { fps: 30, width: 1080, height: 1920 };
const CUT = 1.48; // nach "Channel" (Wortende), Stimme hallt im Freeze nach (scripts/wa_voice_track.py)
const FREEZE = 3.6;
const CLIP = 3.2;
const TAIL = 0; // Kunde: Ende ohne Standbild, ohne Echo, ohne Blende
export const WA_FRAMES = Math.round((CLIP + FREEZE + TAIL) * WA.fps);
const f = (s: number) => Math.round(s * WA.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const BACK = Easing.out(Easing.back(1.15));
const ease = (t: number, a: number, len = 0.18, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const out = (src: number) => (src < CUT ? src : src + FREEZE);
const GREEN = "#25D366";
const TT_RED = "#FE2C55";
const CAP_TOP = 1100; // Captions immer hier, darunter frei für den Link

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

const FZ = CUT;
const FE = CUT + FREEZE;
const r = (x: number) => FZ + x; // Zeit im Freeze
// ruhiger Ablauf im Freeze (Kunde: nicht hektisch, angenehm zum Zusehen)
const T = {
  line: r(0.35),
  card: r(0.45),
  join: r(1.05),
  step1: r(1.5),
  cardOut: r(1.6),
  bellRow: r(1.7),
  bellTap: r(2.35),
  step2: r(2.75),
  notif: r(2.8),
  step3: r(3.3),
  link: r(0.95),
  pass: out(2.62),
  end: CLIP + FREEZE + TAIL,
};

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
// Glocken-Icon wie ein Emoji (gelb, glänzend), selbst gezeichnet
const GoldBell: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <defs>
      <radialGradient id="gb" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#FFE58A" />
        <stop offset="0.55" stopColor="#FFC531" />
        <stop offset="1" stopColor="#E49A00" />
      </radialGradient>
    </defs>
    <circle cx={0} cy={-36} r={7} fill="#E49A00" />
    <path d="M-30 18 L-30 -4 A30 30 0 0 1 30 -4 L30 18 L40 30 L-40 30 Z" fill="url(#gb)" stroke="#C98400" strokeWidth={3} strokeLinejoin="round" />
    <circle cx={0} cy={38} r={10} fill="#C98400" />
    <path d="M-16 -14 A18 18 0 0 1 -2 -26" stroke="#FFF6C9" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
  </svg>
);

const Caption: React.FC<{ t: number }> = ({ t }) => {
  if (t >= FZ && t < FE) {
    const k = interpolate(t, [FZ, FZ + 0.9], [0, 1], clamp);
    if (k >= 1) return null;
    return (
      <div style={{ position: "absolute", left: 60, right: 140, top: CAP_TOP, textAlign: "center" }}>
        {[0, 1, 2].map((j) => (
          <div key={j} style={{ position: j === 0 ? "relative" : "absolute", left: 0, right: 0, top: 0, display: j === 0 ? "inline-block" : "block", fontFamily: "'Inter'", fontWeight: 700, fontSize: 78, letterSpacing: "0.02em", color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.45)", opacity: (1 - k) * (j === 0 ? 1 : 0.35 / j), transform: `scale(${1 + k * 0.12 * (j + 1)})`, filter: `blur(${k * 6 * (j + 1)}px)` }}>
            CHANNEL
          </div>
        ))}
      </div>
    );
  }
  let i = -1;
  WORDS.forEach((w, k) => {
    if (t >= w.s) i = k;
  });
  if (i < 0 || t > out(3.05)) return null;
  const w = WORDS[i];
  const p = ease(t, w.s, 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: CAP_TOP, textAlign: "center" }}>
      <div style={{ display: "inline-block", fontFamily: "'Inter'", fontWeight: 700, fontSize: 78, letterSpacing: "0.02em", color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.45)", transform: `translateY(${(1 - p) * 14}px) scale(${0.94 + 0.06 * p})`, opacity: p }}>
        {w.w}
      </div>
    </div>
  );
};

// Lade-Linie durch die drei Schritte (im Freeze groß, danach klein oben)
const STEPS = ["KANAL", "GLOCKE", "PASSWORT"];
const progress = (t: number) =>
  interpolate(t, [T.join, T.step1, T.bellTap, T.step2, T.notif + 0.15, T.step3], [0, 0.5, 0.5, 1, 1, 2], { ...clamp, easing: Easing.inOut(Easing.sin) }) / 2;
const doneAt = [T.step1, T.step2, T.step3];

const ProgressLine: React.FC<{ t: number; compact: boolean }> = ({ t, compact }) => {
  const p = progress(t);
  const W = compact ? 560 : 820;
  const node = compact ? 34 : 54;
  const label = compact ? 17 : 22;
  return (
    <div style={{ position: "relative", width: W, height: node + label + 16 }}>
      <div style={{ position: "absolute", left: node / 2, right: node / 2, top: node / 2 - 4, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.28)" }} />
      <div style={{ position: "absolute", left: node / 2, top: node / 2 - 4, height: 8, borderRadius: 4, width: (W - node) * p, background: GREEN, boxShadow: `0 0 14px ${GREEN}` }} />
      {STEPS.map((s, i) => {
        const x = node / 2 + ((W - node) * i) / 2;
        const d = ease(t, doneAt[i], 0.25, BACK);
        const pulse = i === 2 && t >= T.pass && t < T.pass + 0.5 ? 1 + 0.25 * Math.sin(((t - T.pass) / 0.5) * Math.PI) : 1;
        return (
          <div key={s} style={{ position: "absolute", left: x - 70, top: 0, width: 140, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pulse})` }}>
            {d > 0 ? (
              <div style={{ transform: `scale(${0.6 + 0.4 * d})` }}>
                <Check size={node} p={d} />
              </div>
            ) : (
              <div style={{ width: node, height: node, borderRadius: node / 2, background: "rgba(20,20,20,0.75)", border: "3px solid rgba(255,255,255,0.85)", color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 700, fontSize: node * 0.42, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>{i + 1}</div>
            )}
            <div style={{ marginTop: 8, fontFamily: "'Inter'", fontWeight: 700, fontSize: label, letterSpacing: "0.14em", color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

// Freeze-Szene
const FreezeMoment: React.FC<{ t: number }> = ({ t }) => {
  if (t < FZ || t >= FE + 0.15) return null;
  const all = 1 - ease(t, FE - 0.35, 0.45, Easing.inOut(Easing.cubic));
  // 1) Kanal-Karte
  const cIn = ease(t, T.card, 0.5, BACK);
  const cOut = ease(t, T.cardOut, 0.4, Easing.inOut(Easing.cubic));
  const joined = t >= T.join;
  const tap = interpolate(t, [T.join - 0.08, T.join, T.join + 0.12], [1, 0.93, 1], clamp);
  // 2) TikTok-Glocke
  const bIn = ease(t, T.bellRow, 0.45, BACK);
  const bOut = ease(t, T.notif + 0.25, 0.4);
  const on = t >= T.bellTap;
  const ring = t >= T.bellRow + 0.2 && t < T.bellTap + 0.5 ? Math.sin((t - T.bellRow) * 30) * 15 * Math.max(0, 1 - Math.max(0, t - T.bellTap) / 0.5) : 0;
  const bTap = interpolate(t, [T.bellTap - 0.08, T.bellTap, T.bellTap + 0.12], [1, 0.88, 1], clamp);
  const wave = interpolate(t, [T.bellTap, T.bellTap + 0.6], [0, 1], { ...clamp, easing: OUT });
  // Glocken-Emoji steigt auf
  const em = ease(t, T.bellTap + 0.05, 0.5, BACK);
  const emRise = interpolate(t, [T.bellTap, T.notif + 0.5], [0, -150], { ...clamp, easing: OUT });
  const emFade = 1 - ease(t, T.notif + 0.3, 0.4);
  const emSwing = Math.sin((t - T.bellTap) * 16) * 12 * Math.max(0, 1 - (t - T.bellTap) / 1.1);
  // 3) Mitteilung von oben
  const nIn = ease(t, T.notif, 0.55, BACK);
  const dots = Math.max(0, Math.min(6, Math.floor((t - T.notif - 0.2) / 0.07)));
  // Lade-Linie und Link-Hinweis
  const line = ease(t, T.line, 0.5);
  const link = ease(t, T.link, 0.5);
  const bob = Math.sin((t - T.link) * 7) * 6;
  const btn: React.CSSProperties = { height: 74, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28 };
  return (
    <AbsoluteFill style={{ opacity: all }}>
      {/* 3) Mitteilung */}
      <div style={{ position: "absolute", top: 250 + (1 - nIn) * -220, left: 40, right: 120, opacity: Math.min(1, nIn * 1.4) }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", background: "rgba(246,246,246,0.96)", borderRadius: 34, padding: "20px 22px", boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 48 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, color: "#111" }}>
              SALITE <span style={{ fontWeight: 600, fontSize: 22, color: "#8A8A8E" }}>jetzt</span>
            </div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 25, color: "#222", marginTop: 4 }}>
              Dein Passwort ist da: <span style={{ letterSpacing: "0.12em" }}>{"●".repeat(dots)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1) Kanal-Karte */}
      {cOut < 1 && (
        <div style={{ position: "absolute", top: 640, left: 90, right: 170, opacity: cIn * (1 - cOut), transform: `translateX(${-cOut * 420}px) scale(${0.9 + 0.1 * cIn})` }}>
          <div style={{ background: "#FFFFFF", borderRadius: 28, padding: "20px 24px", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, color: "#667781" }}>
              <Bubble size={28} /> WhatsApp-Kanal
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 52 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter'", fontWeight: 700, fontSize: 34, color: "#111B21" }}>
                  SALITE <Check size={26} />
                </div>
                <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 20, color: "#667781" }}>Drops · Passwörter · zuerst hier</div>
              </div>
            </div>
            <div style={{ marginTop: 16, height: 62, borderRadius: 31, background: joined ? "#E7F8EE" : GREEN, color: joined ? "#0A7A3B" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, transform: `scale(${tap})` }}>
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
      )}

      {/* 2) TikTok-Glocke mit Glocken-Icon */}
      {bIn > 0 && bOut < 1 && (
        <div style={{ position: "absolute", top: 760, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: bIn * (1 - bOut), transform: `translateX(${(1 - bIn) * 380}px)` }}>
          <div style={{ position: "relative", display: "flex", gap: 12, background: "rgba(255,255,255,0.97)", borderRadius: 20, padding: 14, boxShadow: "0 14px 38px rgba(0,0,0,0.3)" }}>
            <div style={{ ...btn, width: 230, background: "#F1F1F2", color: "#161823" }}>Gefolgt</div>
            <div style={{ ...btn, width: 230, background: "#F1F1F2", color: "#161823" }}>Nachricht</div>
            <div style={{ ...btn, width: 82, position: "relative", background: on ? TT_RED : "#F1F1F2", transform: `scale(${bTap})` }}>
              <div style={{ position: "absolute", inset: -6, borderRadius: 16, border: `3px solid ${TT_RED}`, transform: `scale(${1 + wave * 0.4})`, opacity: on ? 1 - wave : 0 }} />
              <div style={{ transform: `rotate(${ring}deg)`, transformOrigin: "50% 15%", display: "flex" }}>
                <BellIcon size={40} color={on ? "#FFFFFF" : "#161823"} fill={on ? "#FFFFFF" : "none"} />
              </div>
            </div>
            {/* Glocken-Icon steigt aus dem Knopf */}
            {em > 0 && (
              <div style={{ position: "absolute", right: -10, top: -40 + emRise, opacity: em * emFade, transform: `scale(${em}) rotate(${emSwing}deg)`, transformOrigin: "50% 10%" }}>
                <GoldBell size={120} />
                {[0, 1, 2].map((k) => (
                  <div key={k} style={{ position: "absolute", left: 60 + Math.cos(-0.6 - k * 0.9) * 78, top: 50 + Math.sin(-0.6 - k * 0.9) * 78, width: 16, height: 5, borderRadius: 3, background: "#FFC531", transform: `rotate(${(-0.6 - k * 0.9) * 57}deg)`, opacity: em }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lade-Linie */}
      <div style={{ position: "absolute", top: 930, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: line, transform: `translateY(${(1 - line) * 20}px)` }}>
        <ProgressLine t={t} compact={false} />
      </div>

      {/* Hinweis auf den Link-Sticker darunter */}
      <div style={{ position: "absolute", top: 1170, left: 0, right: 80, display: "flex", flexDirection: "column", alignItems: "center", opacity: link }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>LINK ANTIPPEN</div>
        <svg width={36} height={36} viewBox="-20 -20 40 40" style={{ marginTop: 4, transform: `translateY(${bob}px)` }}>
          <path d="M0 -14 L0 12 M-9 4 L0 13 L9 4" stroke="#FFFFFF" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// nach dem Freeze: kleine Lade-Linie oben, alles abgehakt
const TopSteps: React.FC<{ t: number }> = ({ t }) => {
  const o = ease(t, FE - 0.05, 0.3);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 240, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ background: "rgba(10,10,10,0.5)", borderRadius: 26, padding: "12px 64px 8px" }}>
        <ProgressLine t={t} compact />
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
  const hit = interpolate(t, [0, 0.35], [1, 0], { ...clamp, easing: OUT });
  const drift = interpolate(t, [0.35, T.end], [0, 0.035], clamp);
  const fzIn = ease(t, FZ, 0.6, Easing.inOut(Easing.cubic)) * (1 - ease(t, FE - 0.35, 0.55, Easing.inOut(Easing.cubic)));
  const fzPunch = 0;
  const fzDrift = t >= FZ && t < FE + 0.5 ? interpolate(t, [FZ, FE], [0, 0.05], clamp) * (1 - ease(t, FE - 0.2, 0.7)) : 0;
  const scale = 1 + 0.14 * hit + drift + fzPunch + fzDrift;
  const blur = 10 * interpolate(t, [0, 0.2], [1, 0], clamp) + 7 * fzIn;
  const bright = 1 - 0.42 * fzIn;
  const flash = interpolate(t, [0, 0.03, 0.22], [0.6, 0.35, 0], clamp);
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
        {TAIL > 0 && (
          <Sequence from={f(CLIP + FREEZE)} durationInFrames={f(TAIL)}>
            <Freeze frame={0}>
              <OffthreadVideo src={staticFile("wa/clip.mp4")} trimBefore={f(CLIP) - 1} muted />
            </Freeze>
          </Sequence>
        )}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1000, height: 560, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)" }} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
      <TopSteps t={t} />
      <Caption t={t} />
      <FreezeMoment t={t} />

      <Audio src={staticFile("wa/voice_track.wav")} />
      <Sfx at={0} src="sfx/hit_low.wav" vol={0.35} />
      <Sfx at={0} src="sfx/whoosh_soft.wav" vol={0.25} len={0.8} />
      <Sfx at={FZ + 0.05} src="sfx/whoosh_soft.wav" vol={0.12} len={0.8} />
      <Sfx at={T.card} src="wa/snd/pop.wav" vol={0.25} len={0.3} />
      <Sfx at={T.join} src="sfx/click.wav" vol={0.2} len={0.4} />
      <Sfx at={T.step1} src="sfx/tick.wav" vol={0.14} len={0.3} />
      <Sfx at={T.cardOut} src="sfx/whoosh_soft.wav" vol={0.08} len={0.6} />
      <Sfx at={T.bellRow + 0.2} src="wa/snd/bell.wav" vol={0.22} len={1.3} />
      <Sfx at={T.bellTap} src="sfx/click.wav" vol={0.2} len={0.4} />
      <Sfx at={T.step2} src="sfx/tick.wav" vol={0.14} len={0.3} />
      <Sfx at={T.notif} src="sfx/notify.wav" vol={0.22} len={1} />
      <Sfx at={T.step3} src="wa/snd/pop.wav" vol={0.22} len={0.3} />
      <Sfx at={FE - 0.3} src="sfx/whoosh_soft.wav" vol={0.1} len={0.8} />
      <Sfx at={T.pass} src="wa/snd/pop.wav" vol={0.16} len={0.3} />
    </AbsoluteFill>
  );
};
