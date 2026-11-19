import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Black-Week-Teaser (19.11.2026): zwei kurze Clips vor einer Hotel-Einfahrt bei Nacht (Hintergrund getauscht,
// scripts/hotel_composite.py), Passwort-Zähler, der weiterläuft, Info-Karte mit Kommentar-Aufruf.
// Ton: Original-Stimmen (in scripts/hotel_mix.sh gemischt), Straßen-Atmo mit Wind, leiser Beat.
export const HOTEL = { fps: 30, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * HOTEL.fps);

const A = 2.93; // Clip Mann: "Ja Leute, morgen 18 Uhr startet unsere Black Week."
const B = 2.93; // Clip Frau: "Über 80 Prozent der Passwörter sind weg."
const CARD = 4.6; // Info-Karte
export const HOTEL_FRAMES = f(A + B + CARD);

const RED = "#E3120B";
const INK = "#111111";
const OUT = Easing.out(Easing.exp);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / HOTEL.fps;
const ease = (t: number, a: number, len = 0.4) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: OUT });

// Untertitel wie native iPhone-Untertitel, höchstens 3 Wörter
const CAPS: { s: number; e: number; t: string }[] = [
  { s: 0.0, e: 0.62, t: "JA LEUTE" },
  { s: 0.64, e: 1.36, t: "MORGEN" },
  { s: 1.38, e: 1.92, t: "18 UHR" },
  { s: 1.94, e: 2.9, t: "STARTET DIE BLACK WEEK" },
  { s: A + 0.0, e: A + 1.1, t: "ÜBER 80 PROZENT" },
  { s: A + 1.12, e: A + 2.08, t: "DER PASSWÖRTER" },
  { s: A + 2.1, e: A + 2.9, t: "SIND WEG" },
];
const Captions: React.FC = () => {
  const t = useT();
  const c = CAPS.find((k) => t >= k.s && t < k.e);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 140, bottom: 420, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 52, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.55)", whiteSpace: "nowrap" }}>
      {c.t}
    </div>
  );
};

const LiveBug: React.FC = () => {
  const t = useT();
  const dot = 0.45 + 0.55 * Math.abs(Math.sin(t * Math.PI));
  return (
    <div style={{ position: "absolute", left: 48, top: 236, display: "flex", alignItems: "center", gap: 12, opacity: ease(t, 0.1) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: RED, padding: "6px 12px 5px", borderRadius: 4 }}>
        <div style={{ width: 11, height: 11, borderRadius: 6, background: "#FFFFFF", opacity: dot }} />
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, letterSpacing: "0.12em", color: "#FFFFFF" }}>LIVE</div>
      </div>
      <div style={{ fontFamily: "'Anton'", fontSize: 30, letterSpacing: "0.05em", color: "#FFFFFF", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>SALITE · BLACK WEEK</div>
    </div>
  );
};

// Termin-Chip auf "morgen 18 Uhr"
const DateChip: React.FC = () => {
  const t = useT();
  const p = ease(t, 1.2, 0.35);
  const o = 1 - ease(t, A - 0.2, 0.2);
  return (
    <div style={{ position: "absolute", top: 1150, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p * o, transform: `scale(${0.85 + 0.15 * p})` }}>
      <div style={{ background: "#FFFFFF", padding: "14px 28px 16px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, letterSpacing: "0.26em", color: RED }}>BLACK WEEK STARTET</div>
        <div style={{ fontFamily: "'Anton'", fontSize: 84, color: INK, lineHeight: 1.05 }}>MORGEN · 18:00</div>
      </div>
    </div>
  );
};

// Passwort-Zähler: läuft auf "80" auf 80 % und kriecht danach weiter (Passwörter gehen aus)
const PassCounter: React.FC<{ start: number; end: number; top?: number }> = ({ start, end, top = 330 }) => {
  const t = useT();
  const inP = ease(t, start, 0.3);
  const o = 1 - ease(t, end - 0.2, 0.2);
  const v =
    t < start + 0.66
      ? interpolate(t, [start, start + 0.66], [0, 0.8], { ...clamp, easing: Easing.out(Easing.cubic) })
      : 0.8 + Math.min(0.08, (t - start - 0.66) * 0.022);
  const pulse = t > start + 0.66 ? 0.6 + 0.4 * Math.abs(Math.sin((t - start) * 5)) : 0;
  return (
    <div style={{ position: "absolute", top, left: 90, right: 150, opacity: inP * o }}>
      <div style={{ background: "rgba(10,10,10,0.72)", padding: "20px 26px 24px", borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 21, letterSpacing: "0.24em", color: "rgba(255,255,255,0.85)" }}>PASSWÖRTER VERGEBEN</div>
          <div style={{ fontFamily: "'Anton'", fontSize: 72, lineHeight: 1, color: "#FFFFFF" }}>{Math.floor(v * 100)} %</div>
        </div>
        <div style={{ marginTop: 14, height: 12, background: "rgba(255,255,255,0.18)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${v * 100}%`, height: "100%", background: RED, borderRadius: 6 }} />
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, opacity: pulse }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: RED }} />
          <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 24, letterSpacing: "0.14em", color: "#FFFFFF" }}>FAST WEG</div>
        </div>
      </div>
    </div>
  );
};

// Info-Karte vor der Hotel-Einfahrt
const COMMENT = "Ich brauch ein Passwort";
const KEYS = ["qwertzuiopü", "asdfghjklöä", "yxcvbnm"];
const InfoCard: React.FC = () => {
  const t = useT() - (A + B);
  const fr = useCurrentFrame();
  const head = ease(t, 0.05, 0.35);
  const typeA = 1.0;
  const typeB = 2.4;
  const n = Math.max(0, Math.min(COMMENT.length, Math.floor(((t - typeA) / (typeB - typeA)) * COMMENT.length)));
  const sent = t >= typeB + 0.15;
  const post = ease(t, typeB + 0.15, 0.3);
  const lastKey = n > 0 && !sent ? COMMENT[n - 1].toLowerCase() : "";
  const sheet = ease(t, 0.7, 0.35);
  return (
    <AbsoluteFill>
      <Img src={staticFile("lobby/bg_hotel.jpg")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, transform: `scale(${1.08 + 0.03 * (t / CARD)})`, filter: "blur(6px) brightness(0.55)" }} />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.3em", color: "rgba(255,255,255,0.85)" }}>NUR MIT PASSWORT</div>
        <div style={{ fontFamily: "'Anton'", fontSize: 136, color: "#FFFFFF", lineHeight: 1 }}>BLACK WEEK</div>
        <div style={{ display: "inline-block", marginTop: 10, background: RED, color: "#FFFFFF", fontFamily: "'Anton'", fontSize: 58, padding: "4px 22px" }}>20.11. · 18:00 UHR</div>
        <div style={{ marginTop: 26, fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, letterSpacing: "0.06em", color: "#FFFFFF", lineHeight: 1.6, opacity: ease(t, 0.35, 0.4) }}>
          TRACKIES 69 € · DENIM 30 € · LONGSLEEVES 25 €
        </div>
      </div>
      {/* Kommentar-Leiste wie in TikTok */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 960 + (1 - sheet) * 960, bottom: 0, background: "#FFFFFF", borderRadius: "28px 28px 0 0" }}>
        <div style={{ textAlign: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#161823", marginTop: 24 }}>Kommentare</div>
        <div style={{ position: "absolute", top: 80, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: ease(t, 0.9, 0.3) }}>
          <div style={{ background: "#FE2C55", color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, padding: "8px 18px", borderRadius: 8 }}>KOMMENTIERE FÜR DEIN PASSWORT</div>
        </div>
        <div style={{ position: "absolute", top: 150, left: 36, right: 36, display: "flex", gap: 18, opacity: post, transform: `translateY(${(1 - post) * 14}px)` }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: "#D9D9DE" }} />
          <div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 22, color: "#8A8B91" }}>du · jetzt</div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: "#161823", marginTop: 4 }}>{COMMENT}</div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 290, left: 24, right: 24, height: 76, borderRadius: 38, background: "#F1F1F2", display: "flex", alignItems: "center", padding: "0 28px", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: 28, color: sent || n === 0 ? "#8A8B91" : "#161823" }}>
            {sent || n === 0 ? "Kommentar hinzufügen …" : COMMENT.slice(0, n)}
            {!sent && n > 0 && <span style={{ color: "#FE2C55", opacity: Math.floor(fr / 10) % 2 ? 1 : 0 }}>|</span>}
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: n > 0 && !sent ? "#FE2C55" : "#E3E3E5", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28 }}>↑</div>
        </div>
        <div style={{ position: "absolute", top: 400, left: 0, right: 0, bottom: 0, background: "#D1D3D9", padding: "22px 10px 0" }}>
          {KEYS.map((row, r) => (
            <div key={r} style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18 }}>
              {row.split("").map((k) => (
                <div key={k} style={{ width: 86, height: 104, borderRadius: 12, background: k === lastKey ? "#AEB2BB" : "#FFFFFF", boxShadow: "0 2px 0 rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 500, fontSize: 40, color: "#111", transform: k === lastKey ? "scale(1.1) translateY(-8px)" : "none" }}>
                  {k}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol: number; len?: number }> = ({ at, src, vol, len = 1 }) => (
  <Sequence from={f(at)} durationInFrames={f(len)}>
    <Audio src={staticFile(`sfx/${src}`)} volume={vol} />
  </Sequence>
);

export const BlackWeekHotel: React.FC<{ sfxOnly?: boolean }> = () => {
  loadFonts();
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={f(A)}>
        <OffthreadVideo src={staticFile("lobby/comp_mann.mp4")} muted />
      </Sequence>
      <Sequence from={f(A)} durationInFrames={f(B)}>
        <OffthreadVideo src={staticFile("lobby/comp_frau.mp4")} muted />
      </Sequence>
      {t >= A + B && <InfoCard />}
      {t < A + B && <LiveBug />}
      {t < A && <DateChip />}
      {t >= A && t < A + B && <PassCounter start={A} end={A + B} top={1150} />}
      <Captions />
      {/* Effekte (Stimmen, Atmo und Beat kommen in der Mischung dazu) */}
      <Sfx at={1.2} src="click.wav" vol={0.12} len={0.4} />
      <Sfx at={A + 0.66} src="tick.wav" vol={0.16} len={0.4} />
      <Sfx at={A + B} src="whoosh_soft.wav" vol={0.1} len={0.8} />
      {COMMENT.split("").map((c, i) =>
        c === " " ? null : <Sfx key={i} at={A + B + 1.0 + ((2.4 - 1.0) * (i + 1)) / COMMENT.length - 0.02} src={`keyboard_tap${(i % 3) + 1}.wav`} vol={0.1} len={0.2} />,
      )}
      <Sfx at={A + B + 2.55} src="click.wav" vol={0.1} len={0.4} />
    </AbsoluteFill>
  );
};
