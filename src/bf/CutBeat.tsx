import React from "react";
import { AbsoluteFill, Easing, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Beat-Schnitt: Clips Nummer 1 bis 6 in Reihenfolge, Schnitte auf dem Beat (136 BPM, Schlag 0,441 s), Drop nach Clip 1.
// Version 2 (Kundenwunsch): schlicht. Keine Pfeile, kein Glitzer, keine Pillen. Statt Effekten echte Bilder im Vollbild
// oder bei 90 % Breite, auf den Beat geschnitten. "18:30 Uhr live" ist raus, am Ende der TikTok-Account @sj_salite.
// Ton (Stimmen, Beat, Effekte) mischt scripts/cut_mix.py, das Bild wird stumm gerendert.
export const CB = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * CB.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.2, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });

export const BEAT = 0.441;
export const DROP = 3.62; // Ausgabezeit des Drops (Beat-Zeit 6,79)
const b = (k: number) => DROP + k * BEAT;
export const CB_TOTAL = b(36);
export const CB_FRAMES = f(CB_TOTAL);

// Einstellungen in Reihenfolge. clip: Quelle n1..n6 bzw. schnee; img: Bild (full = 9:16 Vollbild, card = 90 % Breite)
type Shot =
  | { kind: "clip"; file: string; src: number; a: number; e: number; rate?: number; zoom: K[] }
  | { kind: "img"; file: string; a: number; e: number; mode: "full" | "card"; w?: number; h?: number; cy?: number };
type K = { t: number; fx: number; fy: number; tx: number; ty: number; s: number };
const K0 = (t: number, s = 1): K => ({ t, fx: 540, fy: 960, tx: 540, ty: 960, s });
const KF = (t: number, fx: number, fy: number, tx: number, ty: number, s: number): K => ({ t, fx, fy, tx, ty, s });
const J = 1 / 60; // ein Frame: Zoomsprung

const N6_IN = 1.88; // "wir verpacken ..." (ohne "Wir sind um 18:30 Uhr live")
export const SHOTS: Shot[] = [
  // 1: Hook, zwei Zoomsprünge, vor dem Drop langsam rein
  { kind: "clip", file: "n1", src: 0, a: 0, e: b(0), zoom: [K0(0, 1.12), K0(0.3, 1.0), K0(0.9 - J, 1.0), KF(0.9, 540, 900, 540, 960, 1.12), KF(1.96 - J, 540, 900, 540, 960, 1.13), K0(1.96, 1.0), K0(2.9, 1.0), KF(3.6, 540, 640, 540, 700, 1.2)] },
  // 2: Drop, Sprung auf das Brust-Logo bei "Puff"
  { kind: "clip", file: "n2", src: 0, a: b(0), e: b(4), zoom: [K0(b(0), 1.12), K0(b(0) + 0.35, 1.02), K0(4.28 - J, 1.03), KF(4.28, 620, 720, 620, 760, 1.45), KF(b(4), 620, 720, 620, 760, 1.5)] },
  // 3: Glitzersteine (Clip), dann Bild Glitzersteine, Stack, Stack aus dem Chat
  { kind: "clip", file: "n3", src: 0.12, a: b(4), e: b(6), zoom: [K0(b(4), 1.0), KF(b(6), 640, 760, 560, 820, 1.15)] },
  { kind: "img", file: "glitzer", a: b(6), e: b(8), mode: "card", w: 1024, h: 1536 },
  { kind: "img", file: "stack", a: b(8), e: b(10), mode: "full" },
  { kind: "img", file: "stack_chat", a: b(10), e: b(12), mode: "full" },
  // 4: Treppe, schneller, durchgehend rein
  { kind: "clip", file: "n4", src: 0, a: b(12), e: b(16), rate: 2.45 / (4 * BEAT), zoom: [K0(b(12), 1.0), K0(b(16), 1.18)] },
  // 5: 550 GSM, Schnee-Clip bei "das heißt", Bild Winterjacke auf "Winterjacke"
  { kind: "clip", file: "n5", src: 0, a: b(16), e: b(20), zoom: [K0(b(16), 1.0), K0(11.376 - J, 1.0), KF(11.376, 930, 760, 640, 820, 1.45), KF(b(20), 930, 760, 640, 820, 1.5)] },
  { kind: "clip", file: "schnee", src: 0.9, a: b(20), e: b(22), zoom: [K0(b(20), 1.0), K0(b(22), 1.06)] },
  { kind: "img", file: "winterjacke", a: b(22), e: b(24), mode: "full" },
  // 6: Verpacken, Longsleeves im Takt, zurück zum Verpacken, Account
  { kind: "clip", file: "n6", src: N6_IN, a: b(24), e: b(25), zoom: [K0(b(24), 1.0), K0(b(25), 1.05)] },
  { kind: "img", file: "ls_a", a: b(25), e: b(26), mode: "card", w: 1312, h: 1199 },
  { kind: "img", file: "ls_b", a: b(26), e: b(27), mode: "card", w: 1122, h: 1402, cy: 787 },
  { kind: "img", file: "ls_c", a: b(27), e: b(28), mode: "card", w: 850, h: 1536 },
  { kind: "img", file: "ls_d", a: b(28), e: b(29), mode: "card", w: 1122, h: 1402 },
  { kind: "clip", file: "n6", src: N6_IN + (b(29) - b(24)), a: b(29), e: CB_TOTAL, zoom: [KF(b(29), 480, 1350, 540, 1000, 1.25), KF(b(31) - J, 480, 1350, 540, 1000, 1.28), K0(b(31), 1.0), K0(CB_TOTAL, 1.05)] },
];
const N6_END = 6.83; // letzter Frame von Clip 6, danach Standbild

const cam = (keys: K[], t: number) => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const c = keys[i];
      const p = IO((t - a.t) / Math.max(0.001, c.t - a.t));
      const m = (u: number, v: number) => u + (v - u) * p;
      return { t, fx: m(a.fx, c.fx), fy: m(a.fy, c.fy), tx: m(a.tx, c.tx), ty: m(a.ty, c.ty), s: m(a.s, c.s) };
    }
  }
  return keys[keys.length - 1];
};

// Untertitel (iPhone-Stil, höchstens 3 Wörter)
const CAPS: [number, number, string][] = [
  [0.0, 0.9, "MEHRERE TAUSEND"],
  [0.9, 1.54, "BESTELLUNGEN"],
  [1.54, 1.96, "GS, IHR HABT"],
  [1.96, 2.44, "DEN SHOP"],
  [2.44, 3.6, "AUSEINANDERGENOMMEN"],
  [3.62, 4.28, "HOCHWERTIGER"],
  [4.28, 5.3, "PUFF-PRINT"],
  [5.384, 6.284, "GLITZERSTEINE"],
  [6.284, 7.084, "DIE NICHT ABGEHEN"],
  [7.084, 7.604, "PERFEKTER STACK"],
  [7.604, 8.4, "AUF DIE SCHUHE"],
  [11.376, 12.416, "550 GSM"],
  [12.416, 12.736, "DAS HEISST"],
  [12.736, 13.336, "IHR BRAUCHT KEINE"],
  [13.336, 14.15, "WINTERJACKE"],
  [14.244, 14.864, "WIR VERPACKEN"],
  [14.864, 15.664, "SPECIAL WINTER"],
  [15.664, 16.164, "LONGSLEEVES"],
  [16.164, 16.884, "IN EURER ORDER"],
  [16.884, 17.45, "REIN"],
  [17.584, 18.084, "DER ACCOUNT IST"],
  [18.084, 19.0, "UNTEN VERLINKT"],
];
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find(([a, e]) => t >= a && t < e);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c[2]}</div>
  );
};

// Bild: Vollbild (9:16) oder höchstens 90 % Breite (nie größer als das Original) auf Espresso; nur ein langsames Hineinfahren.
// Helle Karten enden über den Untertiteln (cy), damit weiße Schrift lesbar bleibt.
const Still: React.FC<{ s: Extract<Shot, { kind: "img" }>; t: number }> = ({ s, t }) => {
  const p = (t - s.a) / (s.e - s.a);
  const push = 1 + 0.035 * p;
  if (s.mode === "full") {
    return <Img src={staticFile(`cut/img/${s.file}.jpg`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, transform: `scale(${push})` }} />;
  }
  const w = Math.min(972, s.w ?? 972);
  const h = (w * (s.h ?? 1)) / (s.w ?? 1);
  return (
    <AbsoluteFill style={{ background: "#1E1712" }}>
      <Img src={staticFile(`cut/img/${s.file}.jpg`)} style={{ position: "absolute", left: (1080 - w) / 2, top: (s.cy ?? 930) - h / 2, width: w, height: h, borderRadius: 10, boxShadow: "0 22px 56px rgba(0,0,0,0.35)", transform: `scale(${push})` }} />
    </AbsoluteFill>
  );
};

// TikTok-Account (Live-Profil): Profilbild mit Live-Ring, LIVE-Marke, Handle
const Account: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const p = ease(t, a, 0.3);
  if (p <= 0) return null;
  const k = ((t - a) % 1.2) / 1.2;
  return (
    <div style={{ position: "absolute", left: 0, right: 80, top: 1150, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + 0.06 * p})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, background: "rgba(16,16,16,0.72)", borderRadius: 34, padding: "20px 36px 20px 22px" }}>
        <div style={{ position: "relative", width: 124, height: 124 }}>
          <div style={{ position: "absolute", inset: -6 - 10 * k, borderRadius: "50%", border: "3px solid #FE2C55", opacity: (1 - k) * 0.7 }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", padding: 5, background: "linear-gradient(135deg, #FE2C55, #FF5E8A)" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1E1712", border: "4px solid #101010", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 62 }} />
            </div>
          </div>
          <div style={{ position: "absolute", left: "50%", bottom: -12, transform: "translateX(-50%)", background: "#FE2C55", borderRadius: 6, padding: "3px 10px", fontFamily: "'Inter'", fontWeight: 800, fontSize: 19, letterSpacing: "0.04em", color: "#FFFFFF", border: "2px solid #101010" }}>LIVE</div>
        </div>
        <div style={{ fontFamily: "'Inter'", color: "#FFFFFF" }}>
          <div style={{ fontWeight: 700, fontSize: 44 }}>@sj_salite</div>
          <div style={{ fontWeight: 500, fontSize: 26, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>TikTok</div>
        </div>
      </div>
    </div>
  );
};

export const CutBeat: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / CB.fps;
  const cur = SHOTS.reduce((acc, s, i) => (t >= s.a ? i : acc), 0);
  const shot = SHOTS[cur];
  // Drop: kurzer Stoß und leichtes Wackeln, Einstieg aus der Unschärfe, Treppe mit Bewegungsunschärfe
  const dropD = t - DROP;
  const shake = dropD >= 0 && dropD < 0.25 ? (1 - dropD / 0.25) * 10 : t > 3.0 && t < DROP ? ((t - 3.0) / (DROP - 3.0)) * 2.5 : 0;
  const stairs = SHOTS[6];
  const stairBlur = t >= stairs.a && t < stairs.e ? 6 * Math.max(1 - (t - stairs.a) / 0.2, (t - (stairs.e - 0.2)) / 0.2, 0) : 0;
  const blur = interpolate(t, [0, 0.25], [10, 0], clamp) + stairBlur;
  let camStyle: React.CSSProperties = {};
  if (shot.kind === "clip") {
    const c = cam(shot.zoom, t);
    const s = c.s;
    const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * s, v));
    const x = fit(c.tx - c.fx * s + Math.sin(t * 95) * shake, 1080);
    const y = fit(c.ty - c.fy * s + Math.cos(t * 83) * shake, 1920);
    camStyle = { transform: `translate(${x}px, ${y}px) scale(${s})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined };
  }
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", ...camStyle }}>
        {SHOTS.map((s, i) => {
          if (s.kind !== "clip") return null;
          const last = s.file === "n6" && i === SHOTS.length - 1;
          const playEnd = last ? Math.min(s.e, s.a + (N6_END - s.src)) : s.e;
          return (
            <React.Fragment key={i}>
              <Sequence from={f(s.a)} durationInFrames={Math.max(1, f(playEnd) - f(s.a))}>
                <OffthreadVideo src={staticFile(`cut/${s.file}.mp4`)} trimBefore={Math.round(s.src * 60)} playbackRate={s.rate ?? 1} muted style={{ width: 1080, height: 1920 }} />
              </Sequence>
              {last && playEnd < s.e ? (
                <Sequence from={f(playEnd)} durationInFrames={Math.max(1, f(s.e) - f(playEnd))}>
                  <Freeze frame={0}>
                    <OffthreadVideo src={staticFile("cut/n6.mp4")} trimBefore={Math.round(N6_END * 60)} muted style={{ width: 1080, height: 1920 }} />
                  </Freeze>
                </Sequence>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      {shot.kind === "img" ? <Still s={shot} t={t} /> : null}
      <Account t={t} a={b(32)} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
