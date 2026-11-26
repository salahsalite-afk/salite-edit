import React from "react";
import { AbsoluteFill, Easing, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";
import EDL from "./models_edl.json";

// Model-Casting V2 (28,2 s): "Ich brauche mal wieder Models". Ohne Zooms auf den Sprecher, eigener Swish nach dem Intro bleibt.
// V2 (Kunde): Pausen an den Schnitten raus, Helligkeit der Einstellungen angeglichen, Bilder als Fotoabzüge, die sich stapeln,
// zu jeder Einblendung ein leiser Klang, Glocke beim Folgen, Kamera-Sucher am Anfang und am Ende.
// V3 (Kunde): kein Slot, kein Timecode, kein Blitz, kein Swish an den Schnitten. Pop-up-Foto größer, Kommentar im TikTok-Look.
// V4 (Kunde): ohne Model-Casting-Label, ohne Sucher (Ecken, REC), ohne Untertitel und ohne Instagram-Karte
// (baut der Kunde selbst). Stimme unverändert (scripts/models_mix.py).
export const MOD = { fps: 60, width: 1080, height: 1920 };
const SEG = EDL.seg as [number, number][];
const OUT0: number[] = [];
SEG.reduce((acc, [a, b]) => (OUT0.push(acc), acc + b - a), 0);
export const MOD_FRAMES = OUT0[OUT0.length - 1] + SEG[SEG.length - 1][1] - SEG[SEG.length - 1][0];
const segOf = (fr: number) => {
  for (let i = SEG.length - 1; i >= 0; i--) if (fr >= OUT0[i]) return i;
  return 0;
};
const srcSec = (fr: number) => {
  const i = segOf(fr);
  return (SEG[i][0] + fr - OUT0[i]) / MOD.fps;
};
// Quellzeit -> Ausgabe-Frame (liegt sie in einer herausgenommenen Pause, dann Anfang des nächsten Abschnitts)
const outFr = (s: number) => {
  const q = Math.round(s * MOD.fps);
  for (let i = 0; i < SEG.length; i++) if (q < SEG[i][1]) return OUT0[i] + Math.max(0, q - SEG[i][0]);
  return MOD_FRAMES;
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.28, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
const inOut = (t: number, a: number, e: number, len = 0.28) => ease(t, a, len) * (1 - interpolate(t, [e - 0.16, e], [0, 1], clamp));
const TT_RED = "#FE2C55";

export const COMMENT = { text: "Ich hab Bock", a: 18.62, typeA: 19.4, typeE: 19.76, sent: 19.8, e: 20.42 };
// ---------- Hauptbild: Abschnitte ohne Pausen, Helligkeit pro Einstellung angeglichen ----------
const shotGain = (s: number) => (s < 8.117 ? 1.06 : s < 11.083 ? 0.98 : s < 14.15 ? 1.0 : s < 20.017 ? 0.985 : s < 24.033 ? 1.0 : 1.08);
const GRADE = "contrast(1.05) saturate(1.04)";
const MainVideo: React.FC = () => (
  <>
    {SEG.map(([a, b], i) => (
      <Sequence key={i} from={OUT0[i]} durationInFrames={b - a} layout="none">
        <OffthreadVideo src={staticFile("v3/clip.mp4")} startFrom={a} muted style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
      </Sequence>
    ))}
  </>
);
// ---------- Fotoabzüge: fallen mit 3D-Schwung auf den Stapel, leicht gedreht, Papierrand ----------
const CLIP_LEN: Record<string, number> = { "takeA.mp4": 1.918, "takeB.mp4": 6.02, "takeC.mp4": 3.0, "runway.mp4": 18.0 };
type Print = { a: number; w: number; h: number; cx: number; cy: number; rot: number; img?: string; pos?: string; file?: string; from?: number; label?: string };
type Group = { a: number; e: number; prints: Print[] };
const GROUPS: Group[] = [
  { a: 5.62, e: 7.95, prints: [{ a: 5.62, w: 980, h: 880, cx: 540, cy: 920, rot: -2, img: "crowd.jpg", pos: "50% 58%", label: "POP-UP" }] },
  {
    a: 11.3,
    e: 13.96,
    prints: [
      { a: 11.3, w: 880, h: 491, cx: 540, cy: 880, rot: -3, file: "takeA.mp4", from: 0.35 },
      { a: 12.6, w: 760, h: 760, cx: 560, cy: 905, rot: 3, file: "takeC.mp4", from: 0.2 },
      { a: 13.32, w: 760, h: 760, cx: 525, cy: 915, rot: -1.5, file: "takeB.mp4", from: 4.75 },
    ],
  },
  {
    a: 14.85,
    e: 16.92,
    prints: [
      { a: 14.85, w: 780, h: 780, cx: 540, cy: 895, rot: -2.5, file: "runway.mp4", from: 1.7 },
      { a: 15.9, w: 780, h: 780, cx: 545, cy: 905, rot: 2, file: "runway.mp4", from: 12.7 },
    ],
  },
  { a: 24.3, e: 25.85, prints: [{ a: 24.3, w: 800, h: 780, cx: 540, cy: 900, rot: -2, file: "takeB.mp4", from: 0.9 }] },
];
const blurAt = (s: number) => GROUPS.reduce((m, g) => Math.max(m, interpolate(s, [g.a - 0.02, g.a + 0.22, g.e - 0.14, g.e + 0.02], [0, 1, 1, 0], clamp)), 0);
const PrintMedia: React.FC<{ p: Print; g: Group; fr: number }> = ({ p, g, fr }) => {
  if (p.img) return <Img src={staticFile(`v3/img/${p.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.pos ?? "50% 50%", display: "block" }} />;
  const start = outFr(p.a);
  const dur = outFr(g.e) - start + 2;
  const maxRel = Math.floor((CLIP_LEN[p.file!] - (p.from ?? 0)) * MOD.fps) - 3;
  const v = <OffthreadVideo src={staticFile(`v3/${p.file}`)} startFrom={Math.round((p.from ?? 0) * MOD.fps)} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  return (
    <Sequence from={start} durationInFrames={dur} layout="none">
      {fr - start > maxRel ? <Freeze frame={maxRel}>{v}</Freeze> : v}
    </Sequence>
  );
};
const Prints: React.FC<{ s: number; fr: number }> = ({ s, fr }) => (
  <>
    {GROUPS.map((g, gi) => {
      if (s < g.a || s >= g.e) return null;
      const q = interpolate(s, [g.e - 0.18, g.e], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
      return (
        <div key={gi} style={{ position: "absolute", inset: 0, opacity: 1 - q, transform: `translateY(${q * 70}px)` }}>
          {g.prints.map((p, i) => {
            if (s < p.a) return null;
            const k = ease(s, p.a, 0.42);
            const swing = p.rot >= 0 ? 8 : -8;
            return (
              <div key={i} style={{ position: "absolute", left: p.cx - p.w / 2, top: p.cy - p.h / 2, width: p.w, height: p.h, padding: 14, boxSizing: "border-box", background: "#F7F3EC", borderRadius: 8, boxShadow: "0 28px 60px rgba(20,12,6,0.45), 0 4px 12px rgba(20,12,6,0.25)", opacity: Math.min(1, k * 3), transform: `perspective(1600px) translateY(${(1 - k) * 300}px) rotateX(${(1 - k) * 32}deg) rotate(${p.rot + (1 - k) * swing}deg) scale(${0.9 + 0.1 * k})` }}>
                <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 3, overflow: "hidden", background: "#111" }}>
                  <PrintMedia p={p} g={g} fr={fr} />
                  {p.label && (
                    <div style={{ position: "absolute", left: 18, top: 18, background: "rgba(14,14,14,0.78)", color: "#FFFFFF", borderRadius: 12, padding: "8px 16px", fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.2em", opacity: ease(s, p.a + 0.3, 0.3) }}>{p.label}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    })}
  </>
);

// ---------- FOLGEN (oben links) und Speichern darunter, Fingertipp sichtbar ----------
const Follow: React.FC<{ s: number; a: number; check: number; e: number; save?: number }> = ({ s, a, check, e, save }) => {
  if (s < a || s >= e) return null;
  const p = inOut(s, a, e, 0.25);
  const done = s >= check;
  const pop = interpolate(s, [check, check + 0.08, check + 0.2], [1, 1.25, 1], clamp);
  const saved = save !== undefined && s >= save;
  const sp = save !== undefined ? interpolate(s, [save, save + 0.08, save + 0.2], [1, 1.25, 1], clamp) : 1;
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
const TAPS: [number, number, number][] = [
  [17.33, 125, 390], [17.83, 125, 478], [COMMENT.sent - 0.03, 70 + 860 - 20 - 28, 1310 - 47], [26.39, 125, 390],
];
const Taps: React.FC<{ s: number }> = ({ s }) => (
  <>
    {TAPS.map(([at, x, y], i) => {
      if (s < at || s >= at + 0.4) return null;
      const k = ease(s, at, 0.4, Easing.out(Easing.cubic));
      const dot = 1 - interpolate(s, [at + 0.05, at + 0.2], [0, 1], clamp);
      return (
        <div key={i} style={{ position: "absolute", left: x, top: y }}>
          <div style={{ position: "absolute", left: -18, top: -18, width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,0.75)", opacity: dot, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
          <div style={{ position: "absolute", left: -(18 + 46 * k), top: -(18 + 46 * k), width: 2 * (18 + 46 * k), height: 2 * (18 + 46 * k), borderRadius: "50%", border: "3px solid rgba(255,255,255,0.9)", boxSizing: "border-box", opacity: 0.8 * (1 - k) }} />
        </div>
      );
    })}
  </>
);

// ---------- KOMMENTAR im TikTok-Look: Kommentar-Fenster, Eingabe mit @ und Emoji, roter Senden-Knopf, danach erscheint der Kommentar ----------
const CM = { left: 70, width: 860, bottom: 1310 };
const CommentBar: React.FC<{ s: number }> = ({ s }) => {
  if (s < COMMENT.a || s >= COMMENT.e) return null;
  const p = inOut(s, COMMENT.a, COMMENT.e, 0.3);
  const n = Math.max(0, Math.min(COMMENT.text.length, Math.floor(((s - COMMENT.typeA) / (COMMENT.typeE - COMMENT.typeA)) * COMMENT.text.length) + (s >= COMMENT.typeA ? 1 : 0)));
  const sent = s >= COMMENT.sent;
  const post = ease(s, COMMENT.sent, 0.3);
  const press = interpolate(s, [COMMENT.sent - 0.04, COMMENT.sent, COMMENT.sent + 0.06], [1, 0.86, 1], clamp);
  const typing = n > 0 && !sent;
  return (
    <div style={{ position: "absolute", left: CM.left, width: CM.width, top: CM.bottom, opacity: p, transform: `translateY(calc(-100% + ${(1 - p) * 30}px))` }}>
      <div style={{ background: "#FFFFFF", borderRadius: 24, boxShadow: "0 16px 44px rgba(0,0,0,0.35)", overflow: "hidden" }}>
        <div style={{ position: "relative", height: 62, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, color: "#161823" }}>
          Kommentare
          <svg width={26} height={26} viewBox="0 0 20 20" style={{ position: "absolute", right: 24 }}><path d="M5 5 L15 15 M15 5 L5 15" stroke="#161823" strokeWidth={2.2} strokeLinecap="round" /></svg>
        </div>
        <div style={{ height: 112 * post, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "8px 24px 0", opacity: post }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: "#D9D9DE", flexShrink: 0 }} />
            <div style={{ flex: 1, fontFamily: "'Inter'" }}>
              <div style={{ fontWeight: 600, fontSize: 21, color: "#8A8B91" }}>du</div>
              <div style={{ fontWeight: 500, fontSize: 28, color: "#161823", marginTop: 2 }}>{COMMENT.text}</div>
              <div style={{ fontWeight: 600, fontSize: 19, color: "#8A8B91", marginTop: 4 }}>Gerade eben    Antworten</div>
            </div>
            <svg width={30} height={30} viewBox="0 0 24 24" style={{ marginTop: 18 }}><path d="M12 20 C5 15 3 12 3 8.5 C3 6 5 4 7.5 4 C9.3 4 10.9 5 12 6.6 C13.1 5 14.7 4 16.5 4 C19 4 21 6 21 8.5 C21 12 19 15 12 20 Z" fill="none" stroke="#8A8B91" strokeWidth={1.8} /></svg>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #EDEDED", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: "#D9D9DE", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 62, borderRadius: 31, background: "#F1F1F2", display: "flex", alignItems: "center", padding: "0 18px 0 22px", gap: 14 }}>
            <div style={{ flex: 1, fontFamily: "'Inter'", fontWeight: 500, fontSize: 27, color: typing ? "#161823" : "#8A8B91", whiteSpace: "nowrap" }}>
              {typing ? COMMENT.text.slice(0, n) : "Kommentar hinzufügen …"}
              {typing && <span style={{ color: TT_RED }}>|</span>}
            </div>
            <span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 30, color: "#161823" }}>@</span>
            <svg width={30} height={30} viewBox="0 0 24 24"><circle cx={12} cy={12} r={9} fill="none" stroke="#161823" strokeWidth={1.8} /><circle cx={9} cy={10} r={1.2} fill="#161823" /><circle cx={15} cy={10} r={1.2} fill="#161823" /><path d="M8 14 C9.5 16.2 14.5 16.2 16 14" fill="none" stroke="#161823" strokeWidth={1.8} strokeLinecap="round" /></svg>
          </div>
          {(typing || s < COMMENT.sent + 0.12) && n > 0 && (
            <div style={{ width: 56, height: 56, borderRadius: 28, background: TT_RED, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})`, flexShrink: 0 }}>
              <svg width={26} height={26} viewBox="0 0 20 20"><path d="M10 16 V4 M4.5 9.5 L10 4 L15.5 9.5" stroke="#FFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ModelsTikTok: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const s = srcSec(fr);
  const b = blurAt(s);
  const gain = shotGain(s);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: `brightness(${gain}) ${GRADE}` }}>
        <MainVideo />
      </div>
      {b > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: b, filter: `brightness(${gain * 0.82}) ${GRADE} blur(7px)`, transform: "scale(1.02)" }}>
          <MainVideo />
        </div>
      )}
      <Prints s={s} fr={fr} />
      <Follow s={s} a={16.95} check={17.36} save={17.86} e={19.83} />
      <Follow s={s} a={25.95} check={26.42} e={27.08} />
      <CommentBar s={s} />
      <Taps s={s} />
    </AbsoluteFill>
  );
};
