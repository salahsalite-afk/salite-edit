import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Model-Casting (29 s): "Ich brauche mal wieder Models". Ohne Zooms, Swish nach dem Intro ist schon im Original.
// Einblendungen dezent und beiläufig: Karten mit 80 bis 90 % Breite unter den Gesichtern, Hintergrund nur leicht
// unscharf (Mimik bleibt sichtbar). Bilder: Menschenmenge (zukünftige größte Streetwear-Brand), Klappe und
// Shooting-Takes (feste Models), Runway mit Trackies (freshesten Klamotten), Instagram (Bewerbung).
// Handlungsaufruf: Plus weg (Haken), speichern, Kommentar "Ich hab Bock". Stimme unverändert (scripts/models_mix.py).
export const MOD = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * MOD.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.28, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const inOut = (t: number, a: number, e: number, len = 0.28) => ease(t, a, len) * (1 - interpolate(t, [e - 0.16, e], [0, 1], clamp));
const TT_RED = "#FE2C55";
export const MOD_TOTAL = 29.2;
export const MOD_FRAMES = f(MOD_TOTAL);

// ---------- Untertitel (iPhone-Stil, eine Zeile, höchstens 3 Wörter; korrigiert: "Plus weg") ----------
const CAP_SRC: [string, number][] = [
  ["ICH BRAUCHE MAL", 0.0], ["WIEDER MODELS", 0.74], ["JA IHR HÖRT", 1.9], ["RICHTIG", 2.58], ["JA IHR HÖRT", 3.3], ["WIRKLICH RICHTIG", 3.86],
  ["WEIL IHR HABT", 4.72], ["DIE CHANCE", 5.08], ["MIT DER ZUKÜNFTIGEN", 5.56], ["GRÖSSTEN", 6.26], ["STREETWEAR-BRAND", 6.62], ["ZUSAMMENZUARBEITEN", 7.12],
  ["WIE IHR WISST", 8.32], ["BAUEN WIR GERADE", 8.9], ["UNSER KOMPLETT", 9.26], ["NEUES WAREHOUSE UM", 9.96],
  ["DAFÜR SUCHEN WIR", 11.22], ["AUCH FESTE MODELS", 11.88], ["MIT DENEN", 12.58], ["WIR RUND UM", 12.8], ["DIE UHR ARBEITEN", 13.24], ["KÖNNEN", 13.72],
  ["ALSO", 14.32], ["WER BOCK HAT", 14.88], ["IN DEN FRESHESTEN", 15.28], ["KLAMOTTEN ZU SHOOTEN", 16.02],
  ["MACHT JETZT", 16.94], ["DAS PLUS WEG", 17.16], ["SPEICHERT DAS VIDEO", 17.86], ["UND KOMMENTIERT REIN", 18.54], ["ICH HAB BOCK", 19.48],
  ["UND DANN SCHREIBT", 20.12], ["IHR AUF INSTA", 20.58], ["EINMAL EINE", 21.28], ["KLEINE BEWERBUNG DURCH", 21.68],
  ["WIR CHECKEN", 22.64], ["ALLE AB", 23.28], ["WIR FREUEN UNS", 24.14], ["MIT EUCH", 24.78], ["ZUSAMMENZUARBEITEN", 25.04],
  ["MACHT DAS", 26.1], ["PLUS WEG", 26.42], ["SUPPORT YOUNG BOYS", 27.12], ["WITH BIG DREAMS", 28.02],
];
const ENDS: Record<number, number> = { 2.58: 3.12, 7.12: 7.92, 9.96: 11.02, 13.72: 14.0, 16.02: 16.78, 22.34: 22.5, 23.28: 23.88, 25.04: 25.86, 26.42: 26.94 };
type Cap = { a: number; e: number; text: string };
const CAPS: Cap[] = CAP_SRC.map(([text, a], i) => {
  const next = CAP_SRC[i + 1];
  const e = ENDS[a] ?? (next ? Math.min(next[1], a + 1.4) : 29.15);
  return { a, e, text };
});
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (t >= COMMENT.typeA - 0.05 && t < 20.02) return null; // "Ich hab Bock" steht im Kommentar
  const c = CAPS.find((x) => t >= x.a && t < x.e);
  if (!c) return null;
  return <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c.text}</div>;
};

// ---------- Karten: Bild oder Clip-Abschnitte, unter den Gesichtern ----------
type Seg = { at: number; dur: number; file: string; from: number };
type Card = { a: number; e: number; w: number; h: number; cy: number; img?: string; pos?: string; segs?: Seg[] };
const CARDS: Card[] = [
  { a: 5.62, e: 7.95, w: 900, h: 800, cy: 960, img: "crowd.jpg", pos: "50% 60%" },
  { a: 11.25, e: 12.55, w: 940, h: 524, cy: 1000, segs: [{ at: 11.25, dur: 1.3, file: "takeA.mp4", from: 0.35 }] },
  { a: 12.6, e: 14.05, w: 880, h: 860, cy: 940, segs: [{ at: 12.6, dur: 0.72, file: "takeC.mp4", from: 0.2 }, { at: 13.32, dur: 0.73, file: "takeB.mp4", from: 4.75 }] },
  { a: 14.85, e: 16.95, w: 880, h: 880, cy: 930, segs: [{ at: 14.85, dur: 1.05, file: "runway.mp4", from: 1.7 }, { at: 15.9, dur: 1.05, file: "runway.mp4", from: 12.7 }] },
  { a: 24.3, e: 25.85, w: 880, h: 860, cy: 940, segs: [{ at: 24.3, dur: 1.55, file: "takeB.mp4", from: 0.9 }] },
];
// Hintergrund nur leicht unscharf und etwas dunkler, damit Mimik und Körpersprache sichtbar bleiben
const blurAt = (t: number) => CARDS.reduce((m, c) => Math.max(m, interpolate(t, [c.a - 0.02, c.a + 0.2, c.e - 0.14, c.e + 0.02], [0, 1, 1, 0], clamp)), 0);
const CardView: React.FC<{ c: Card; t: number }> = ({ c, t }) => {
  if (t < c.a || t >= c.e) return null;
  const inP = ease(t, c.a, 0.3);
  const outP = interpolate(t, [c.e - 0.14, c.e], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 540 - c.w / 2, top: c.cy - c.h / 2, width: c.w, height: c.h, borderRadius: 24, overflow: "hidden", background: "#111", boxShadow: "0 24px 70px rgba(0,0,0,0.4)", opacity: Math.min(1, inP * 2.5) * (1 - outP), transform: `translateY(${(1 - inP) * 30}px) scale(${0.94 + 0.06 * inP})` }}>
      {c.img && <Img src={staticFile(`v3/img/${c.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.pos ?? "50% 50%" }} />}
      {c.segs?.map((s, i) =>
        t >= s.at && t < s.at + s.dur ? (
          <Sequence key={i} from={f(s.at)} durationInFrames={f(s.dur)} layout="none">
            <OffthreadVideo src={staticFile(`v3/${s.file}`)} startFrom={f(s.from)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        ) : null,
      )}
    </div>
  );
};

// ---------- kleines Label beim zweiten "Ja, ihr hört richtig" ----------
const Casting: React.FC<{ t: number }> = ({ t }) => {
  if (t < 3.3 || t >= 5.58) return null;
  const p = inOut(t, 3.3, 5.58);
  const dot = 0.4 + 0.6 * (Math.sin((t - 3.3) * 6) > 0 ? 1 : 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1300, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(14,14,14,0.72)", borderRadius: 22, padding: "10px 22px" }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: TT_RED, opacity: dot }} />
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.18em", color: "#FFFFFF" }}>MODEL CASTING</span>
      </div>
    </div>
  );
};

// ---------- FOLGEN (oben links) und Speichern darunter ----------
const Follow: React.FC<{ t: number; a: number; check: number; e: number; save?: number }> = ({ t, a, check, e, save }) => {
  if (t < a || t >= e) return null;
  const p = inOut(t, a, e, 0.25);
  const done = t >= check;
  const pop = interpolate(t, [check, check + 0.08, check + 0.2], [1, 1.25, 1], clamp);
  const saved = save !== undefined && t >= save;
  const sp = save !== undefined ? interpolate(t, [save, save + 0.08, save + 0.2], [1, 1.25, 1], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: 60, top: 260, width: 130, opacity: p, transform: `scale(${0.88 + 0.12 * p})`, transformOrigin: "0 0" }}>
      <div style={{ position: "relative", width: 130, height: 160 }}>
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
      {save !== undefined && (
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.45))" }}>
          <svg width={64} height={64} viewBox="0 0 24 24" style={{ transform: `scale(${sp})` }}>
            <path d="M6 3.5 H18 a1 1 0 0 1 1 1 V20.5 L12 16 L5 20.5 V4.5 a1 1 0 0 1 1 -1 Z" fill={saved ? "#FACE15" : "#FFFFFF"} />
          </svg>
          <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, color: "#FFFFFF", marginTop: 4 }}>{saved ? "Gespeichert" : "Speichern"}</span>
        </div>
      )}
    </div>
  );
};

// ---------- KOMMENTAR: schlichte Kommentarleiste, "Ich hab Bock" wird zur Stimme getippt ----------
export const COMMENT = { text: "Ich hab Bock", a: 18.62, typeA: 19.42, typeE: 19.9, sent: 19.95, e: 20.02 };
export const typedAt = (i: number) => COMMENT.typeA + ((COMMENT.typeE - COMMENT.typeA) * i) / COMMENT.text.length;
const CommentBar: React.FC<{ t: number }> = ({ t }) => {
  if (t < COMMENT.a || t >= COMMENT.e) return null;
  const p = ease(t, COMMENT.a, 0.3);
  const n = Math.max(0, Math.min(COMMENT.text.length, Math.floor(((t - COMMENT.typeA) / (COMMENT.typeE - COMMENT.typeA)) * COMMENT.text.length) + (t >= COMMENT.typeA ? 1 : 0)));
  const sent = t >= COMMENT.sent;
  const press = interpolate(t, [COMMENT.sent - 0.04, COMMENT.sent, COMMENT.sent + 0.06], [1, 0.86, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 70, right: 150, top: 1250, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", borderRadius: 44, padding: "12px 12px 12px 14px", boxShadow: "0 14px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: "#D9D9DE", flexShrink: 0 }} />
        <div style={{ flex: 1, fontFamily: "'Inter'", fontWeight: 600, fontSize: 32, color: n === 0 ? "#8A8B91" : "#161823", whiteSpace: "nowrap" }}>
          {n === 0 ? "Kommentar hinzufügen …" : COMMENT.text.slice(0, n)}
          {n > 0 && !sent && <span style={{ color: TT_RED }}>|</span>}
        </div>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: n > 0 ? TT_RED : "#E3E3E5", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})` }}>
          <svg width={26} height={26} viewBox="0 0 20 20"><path d="M10 16 V4 M4.5 9.5 L10 4 L15.5 9.5" stroke="#FFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </div>
  );
};

// ---------- Instagram: Bewerbung per Nachricht an @saliteclothing ----------
const IG_TAP = 21.92;
const Insta: React.FC<{ t: number }> = ({ t }) => {
  if (t < 20.3 || t >= 22.75) return null;
  const p = inOut(t, 20.3, 22.75);
  const tap = interpolate(t, [IG_TAP - 0.04, IG_TAP, IG_TAP + 0.08], [1, 0.9, 1], clamp);
  const tapped = t >= IG_TAP;
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1150, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#FFFFFF", borderRadius: 28, padding: "16px 18px 16px 16px", boxShadow: "0 14px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, padding: 4, background: "linear-gradient(45deg, #FEDA75, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5)", boxSizing: "border-box" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1E1712", border: "3px solid #FFF", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 38 }} />
          </div>
        </div>
        <div style={{ fontFamily: "'Inter'", lineHeight: 1.2, marginRight: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 32, color: "#111" }}>saliteclothing</div>
          <div style={{ fontWeight: 600, fontSize: 21, color: "#6B6B70" }}>Instagram</div>
        </div>
        <div style={{ background: tapped ? "#EFEFEF" : "#0095F6", color: tapped ? "#111" : "#FFF", borderRadius: 14, padding: "14px 26px", fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, transform: `scale(${tap})` }}>Nachricht</div>
      </div>
    </div>
  );
};

export const ModelsTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / MOD.fps;
  const b = blurAt(t);
  const GRADE = "brightness(1.02) contrast(1.05) saturate(1.04)";
  // ohne Zoom: das scharfe Bild bleibt stehen, eine leicht unscharfe Kopie blendet darüber (Rand verdeckt)
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: GRADE }}>
        <OffthreadVideo src={staticFile("v3/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
      </div>
      {b > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: b, filter: `${GRADE} blur(7px) brightness(0.82)`, transform: "scale(1.02)" }}>
          <OffthreadVideo src={staticFile("v3/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
        </div>
      )}
      <Casting t={t} />
      {CARDS.map((c, i) => (
        <CardView key={i} c={c} t={t} />
      ))}
      <Follow t={t} a={16.95} check={17.36} save={17.86} e={20.02} />
      <Follow t={t} a={25.95} check={26.42} e={MOD_TOTAL + 1} />
      <CommentBar t={t} />
      <Insta t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
