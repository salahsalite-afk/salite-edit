import React from "react";
import { AbsoluteFill, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Beat-Schnitt: 6 Clips in Reihenfolge, Schnitte auf dem Beat (136 BPM, Schlag 0,441 s), Drop nach Clip 1.
// Zoom-Wechsel als Perspektive, Takt-Puls, Animationen passend zum Gesagten. Ton (Stimmen, Beat, Effekte) mischt scripts/cut_mix.py, das Bild wird stumm gerendert.
export const CB = { fps: 60, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * CB.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IO = Easing.inOut(Easing.cubic);
const ease = (t: number, a: number, len = 0.2, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });

export const BEAT = 0.441;
export const DROP = 3.62; // Ausgabezeit des Drops (Beat-Zeit 6,79)
export const BEAT_OFFSET = 6.79 - DROP; // Beat startet bei 3,17 s
const b = (k: number) => DROP + k * BEAT;

// Segmente: Quelle, Ausgabe, Tempo
type Seg = { clip: number; src: number; out: number; dur: number; rate: number; freeze?: boolean };
export const SEGS: Seg[] = [
  { clip: 1, src: 0, out: 0, dur: DROP, rate: 1 },
  { clip: 2, src: 0, out: b(0), dur: 4 * BEAT, rate: 1 },
  { clip: 3, src: 0.12, out: b(4), dur: 7 * BEAT, rate: 1 },
  { clip: 4, src: 0, out: b(11), dur: 4 * BEAT, rate: 2.45 / (4 * BEAT) },
  { clip: 5, src: 0.06, out: b(15), dur: 8 * BEAT, rate: 1 },
  { clip: 6, src: 0, out: b(23), dur: 6.85, rate: 1 },
];
const END_FREEZE = b(40) - (b(23) + 6.85);
export const CB_TOTAL = b(40);
export const CB_FRAMES = f(CB_TOTAL);

// Zoom-Plan: Stützpunkte (Zeit, Fokus im Bild, Zielpunkt auf dem Schirm, Skalierung)
type K = { t: number; fx: number; fy: number; tx: number; ty: number; s: number };
const K0 = (t: number, s = 1): K => ({ t, fx: 540, fy: 960, tx: 540, ty: 960, s });
const ZOOM: K[][] = [
  // 1: Einstieg mit Stoß, langsam rein, vor dem Drop schneller
  [K0(0, 1.12), K0(0.35, 1.0), K0(0.9, 1.0), { t: 3.15, fx: 540, fy: 640, tx: 540, ty: 700, s: 1.08 }, { t: 3.6, fx: 540, fy: 640, tx: 540, ty: 700, s: 1.2 }],
  // 2: Drop, dann Sprung auf das Brust-Logo bei "Puff"
  [K0(b(0), 1.12), K0(b(0) + 0.35, 1.02), K0(4.2, 1.03), { t: 4.36, fx: 620, fy: 720, tx: 620, ty: 760, s: 1.5 }, { t: 5.38, fx: 620, fy: 720, tx: 620, ty: 760, s: 1.58 }],
  // 3: Steine (Brust), dann runter zu den Schuhen
  [K0(b(4), 1.0), { t: 6.3, fx: 640, fy: 760, tx: 560, ty: 820, s: 1.42 }, { t: 7.08, fx: 630, fy: 740, tx: 560, ty: 820, s: 1.42 }, { t: 7.45, fx: 560, fy: 1100, tx: 540, ty: 960, s: 1.1 }, { t: 8.47, fx: 560, fy: 1100, tx: 540, ty: 960, s: 1.14 }],
  // 4: Treppe, durchgehend rein
  [K0(b(11), 1.0), K0(b(15), 1.18)],
  // 5: Totale, Sprung auf "550", raus bei "Winterjacke"
  [K0(b(15), 1.0), K0(10.86, 1.0), { t: 10.98, fx: 930, fy: 760, tx: 640, ty: 820, s: 1.5 }, { t: 12.45, fx: 930, fy: 760, tx: 640, ty: 820, s: 1.56 }, { t: 12.75, fx: 540, fy: 900, tx: 540, ty: 900, s: 1.04 }, K0(b(23), 1.0)],
  // 6: Gesicht bei "live", Paket bei "verpacken", raus beim Account
  [K0(b(23), 1.0), K0(15.05, 1.02), { t: 15.17, fx: 560, fy: 420, tx: 540, ty: 640, s: 1.3 }, { t: 15.7, fx: 560, fy: 420, tx: 540, ty: 640, s: 1.33 }, { t: 15.95, fx: 480, fy: 1350, tx: 540, ty: 1000, s: 1.28 }, { t: 18.95, fx: 480, fy: 1350, tx: 540, ty: 1000, s: 1.34 }, K0(19.25, 1.0), K0(CB_TOTAL, 1.05)],
];
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
  [5.38, 6.28, "GLITZERSTEINE"],
  [6.28, 7.08, "DIE NICHT ABGEHEN"],
  [7.08, 7.6, "PERFEKTER STACK"],
  [7.6, 8.46, "AUF DIE SCHUHE"],
  [10.87, 11.91, "550 GSM"],
  [11.91, 12.23, "DAS HEISST"],
  [12.23, 12.83, "IHR BRAUCHT KEINE"],
  [12.83, 13.74, "WINTERJACKE"],
  [13.76, 14.3, "WIR SIND UM"],
  [14.3, 15.68, "18:30 UHR LIVE"],
  [15.68, 16.3, "WIR VERPACKEN"],
  [16.3, 17.1, "SPECIAL WINTER"],
  [17.1, 17.6, "LONGSLEEVES"],
  [17.6, 18.32, "IN EURER ORDER"],
  [18.32, 18.95, "REIN"],
  [19.02, 19.52, "DER ACCOUNT IST"],
  [19.52, 20.5, "UNTEN VERLINKT"],
];
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find(([a, e]) => t >= a && t < e);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1418, textAlign: "center", fontFamily: "'Inter'", fontWeight: 600, fontSize: 54, color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{c[2]}</div>
  );
};

// ---------- Animationen ----------
const Pill: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.96)", color: "#111", borderRadius: 30, padding: "12px 22px", fontFamily: "'Inter'", fontWeight: 700, fontSize: 26, letterSpacing: "0.06em", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", whiteSpace: "nowrap", ...style }}>{children}</div>
);

// 1: Bestellungen stapeln sich
const Orders: React.FC<{ t: number }> = ({ t }) => {
  const starts = [0.95, 1.3, 1.65, 2.0];
  const out = ease(t, DROP - 0.12, 0.2, Easing.in(Easing.cubic));
  if (t < starts[0] || t > DROP + 0.1) return null;
  return (
    <div style={{ position: "absolute", left: 50, right: 130, top: 250 }}>
      {starts.map((s, i) => {
        const p = ease(t, s, 0.35);
        if (p <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: (starts.length - 1 - i) * 18 + (1 - p) * -60, opacity: p * (1 - out), transform: `scale(${1 - (starts.filter((x) => x <= t).length - 1 - i) * 0.04}) translateY(${-out * 300}px)`, zIndex: i }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(246,246,246,0.96)", borderRadius: 28, padding: "16px 20px", boxShadow: "0 12px 30px rgba(0,0,0,0.28)" }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: "#1E1712", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={staticFile("brand/salite-s-light.svg")} style={{ height: 38 }} />
              </div>
              <div style={{ flex: 1, fontFamily: "'Inter'" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 24, color: "#111" }}>
                  SALITE <span style={{ fontWeight: 600, fontSize: 20, color: "#8A8A8E" }}>jetzt</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 23, color: "#222", marginTop: 2 }}>Neue Bestellung</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Hinweis-Label mit feiner Linie
const Callout: React.FC<{ t: number; a: number; e: number; x: number; y: number; lx: number; ly: number; text: string }> = ({ t, a, e, x, y, lx, ly, text }) => {
  const p = ease(t, a, 0.3);
  const o = 1 - ease(t, e - 0.2, 0.2);
  if (p <= 0 || o <= 0) return null;
  const len = Math.hypot(lx - x, ly - y);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
        <circle cx={x} cy={y} r={10 + 4 * p} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={p} />
        <line x1={x} y1={y} x2={lx} y2={ly} stroke="#FFFFFF" strokeWidth={3} strokeDasharray={len} strokeDashoffset={len * (1 - p)} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
      </svg>
      <div style={{ position: "absolute", left: lx, top: ly, transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * p})`, opacity: p * o }}>
        <Pill>{text}</Pill>
      </div>
    </>
  );
};

// 3: Glitzer um die Steine
const Sparkles: React.FC<{ t: number; a: number; e: number; cx: number; cy: number }> = ({ t, a, e, cx, cy }) => {
  if (t < a || t > e) return null;
  const pts = [
    [-150, -40, 0.0], [120, -110, 0.12], [170, 60, 0.25], [-90, 120, 0.35], [40, -170, 0.5], [-190, -150, 0.62], [200, -20, 0.75], [-40, 170, 0.9], [110, 150, 1.05], [-170, 40, 1.2],
  ];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {pts.map(([dx, dy, d], i) => {
        const k = ((t - a - d) % 0.7) / 0.7;
        if (t - a < d) return null;
        const s = Math.sin(k * Math.PI);
        return (
          <g key={i} transform={`translate(${cx + dx} ${cy + dy}) scale(${0.4 + s}) rotate(${k * 90})`} opacity={s}>
            <path d="M0 -18 L4 -4 L18 0 L4 4 L0 18 L-4 4 L-18 0 L-4 -4 Z" fill="#FFFFFF" />
            <circle r={4} fill="#FFFFFF" />
          </g>
        );
      })}
    </svg>
  );
};

// 5: Schnee
const Snow: React.FC<{ t: number; a: number; e: number }> = ({ t, a, e }) => {
  const o = ease(t, a, 0.3) * (1 - ease(t, e - 0.3, 0.3));
  if (o <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
      {Array.from({ length: 46 }, (_, i) => {
        const sp = 260 + (i % 7) * 40;
        const x = ((i * 137) % 1080) + Math.sin((t - a) * 1.5 + i) * 30;
        const y = (((i * 263) % 1920) + (t - a) * sp) % 1920;
        const r = 3 + (i % 4) * 2;
        return <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.55 + (i % 3) * 0.15} />;
      })}
    </svg>
  );
};

// 6: LIVE-Plakette
const Live: React.FC<{ t: number; a: number; e: number }> = ({ t, a, e }) => {
  const p = ease(t, a, 0.3, Easing.out(Easing.back(1.4)));
  const o = 1 - ease(t, e - 0.2, 0.2);
  if (p <= 0 || o <= 0) return null;
  const dot = 0.5 + 0.5 * Math.abs(Math.sin((t - a) * 4));
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 80, display: "flex", justifyContent: "center", opacity: o, transform: `scale(${p})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(10,10,10,0.6)", borderRadius: 16, padding: "10px 18px 10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FE2C55", borderRadius: 10, padding: "8px 14px" }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFFFFF", opacity: dot }} />
          <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 26, letterSpacing: "0.1em", color: "#FFFFFF" }}>LIVE</span>
        </div>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, color: "#FFFFFF" }}>18:30 Uhr</span>
      </div>
    </div>
  );
};

const ArrowDown: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const p = ease(t, a, 0.3);
  if (p <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: p }}>
      {[0, 1, 2].map((i) => {
        const k = (((t - a) * 1.6 - i * 0.22) % 1 + 1) % 1;
        const o = Math.sin(k * Math.PI);
        return <path key={i} d={`M${470} ${1510 + i * 26} L540 ${1550 + i * 26} L610 ${1510 + i * 26}`} stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />;
      })}
    </svg>
  );
};

// 3: Detailkarte Schuhe (OBJEKT): Ausschnitt aus Clip 3, groß, Hintergrund kurz dunkler
const SHOE = { a: 7.42, e: 8.47, sx: 280, sy: 1380, sw: 660, sh: 540, w: 880 };
const ShoeCard: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, SHOE.a, 0.28);
  if (t < SHOE.a - 0.02 || t >= SHOE.e) return null;
  const k = SHOE.w / SHOE.sw;
  const h = SHOE.sh * k;
  const seg = SEGS[2];
  return (
    <>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)", opacity: p }} />
      <div style={{ position: "absolute", left: (1080 - SHOE.w) / 2, top: 820 - h / 2, width: SHOE.w, height: h, borderRadius: 26, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.55)", border: "4px solid #FFFFFF", transform: `translateY(${(1 - p) * 700}px) rotate(${-3 * p + (1 - p) * -10}deg) scale(${1 + 0.03 * ease(t, SHOE.a + 0.3, 0.8, IO)})` }}>
        <Sequence from={f(seg.out)} durationInFrames={f(seg.dur)}>
          <OffthreadVideo src={staticFile("cut/n3.mp4")} trimBefore={Math.round(seg.src * 60)} muted style={{ position: "absolute", left: -SHOE.sx * k, top: -SHOE.sy * k, width: 1080 * k, height: 1920 * k }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", left: (1080 - SHOE.w) / 2 + 30, top: 820 - h / 2 - 26, opacity: p, transform: "rotate(-3deg)" }}>
        <Pill>STACK</Pill>
      </div>
    </>
  );
};

export const CutBeat: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / CB.fps;
  const segIdx = SEGS.reduce((acc, s, i) => (t >= s.out ? i : acc), 0);
  const c = cam(ZOOM[Math.min(segIdx, ZOOM.length - 1)], t);
  // Takt-Puls auf jedem Takt nach dem Drop
  let pulse = 0;
  for (let k = 0; k <= 40; k += 4) {
    const d = t - b(k);
    if (d >= 0 && d < 0.18) pulse = Math.max(pulse, (1 - d / 0.18) * 0.018);
  }
  // Drop: Blitz und Wackeln, Einstieg mit Unschärfe
  const dropD = t - DROP;
  const shake = dropD >= 0 && dropD < 0.3 ? (1 - dropD / 0.3) * 14 : t > 2.9 && t < DROP ? ((t - 2.9) / (DROP - 2.9)) * 3 : 0;
  const sx = Math.sin(t * 95) * shake;
  const sy = Math.cos(t * 83) * shake;
  const flash = dropD >= 0 ? interpolate(dropD, [0, 0.02, 0.16], [0, 0.55, 0], clamp) : 0;
  const introBlur = interpolate(t, [0, 0.25], [10, 0], clamp);
  // Treppe: Bewegungsunschärfe am Anfang und Ende
  const s4 = SEGS[3];
  const stairBlur = t >= s4.out && t < s4.out + s4.dur ? 6 * Math.max(1 - (t - s4.out) / 0.2, (t - (s4.out + s4.dur - 0.2)) / 0.2, 0) : 0;
  const s = c.s * (1 + pulse);
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * s, v));
  const x = fit(c.tx - c.fx * s + sx, 1080);
  const y = fit(c.ty - c.fy * s + sy, 1920);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${s})`, filter: `blur(${introBlur + stairBlur}px)` }}>
        {SEGS.map((sg, i) => (
          <Sequence key={i} from={f(sg.out)} durationInFrames={Math.max(1, f(sg.out + sg.dur) - f(sg.out))}>
            <OffthreadVideo src={staticFile(`cut/n${sg.clip}.mp4`)} trimBefore={Math.round(sg.src * 60)} playbackRate={sg.rate} muted style={{ width: 1080, height: 1920 }} />
          </Sequence>
        ))}
        <Sequence from={f(b(23) + 6.85)} durationInFrames={Math.max(1, f(END_FREEZE))}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile("cut/n6.mp4")} trimBefore={Math.round(6.82 * 60)} muted style={{ width: 1080, height: 1920 }} />
          </Freeze>
        </Sequence>
      </div>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />

      <Orders t={t} />
      <Callout t={t} a={4.34} e={5.36} x={600} y={730} lx={300} ly={560} text="PUFF-PRINT" />
      <Sparkles t={t} a={5.5} e={7.05} cx={560} cy={820} />
      <ShoeCard t={t} />
      <Callout t={t} a={10.98} e={12.4} x={850} y={830} lx={470} ly={640} text="550 GSM" />
      <Snow t={t} a={12.45} e={13.76} />
      <Live t={t} a={14.3} e={19.0} />
      <Callout t={t} a={16.3} e={18.95} x={540} y={1150} lx={430} ly={820} text="SPECIAL WINTER LONGSLEEVE" />
      <ArrowDown t={t} a={19.1} />
      <Captions t={t} />

    </AbsoluteFill>
  );
};
