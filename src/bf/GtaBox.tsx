import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Boxkampf im Open-World-Game-Look: Minimap, Lebensbalken je Figur, Geldanzeige (69 € Trackie), Fahndungssterne,
// Zielvorgaben, Spezialfähigkeit als Zeitlupe, Charakterwechsel-Rad mit Wechsel-Flug, "Mission Passed" am Ende.
// Material: 4K 60 fps von oben (auf 1080x1920 gedreht), Zeitlupen per ffmpeg minterpolate vorberechnet (0,27x).
// Musik legt der Kunde selbst darunter; hier nur Effekte und Raumton.
export const GFPS = 60;
const f = (s: number) => Math.round(s * GFPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);

// ---------- Zeitleiste ----------
const V0 = 0.55; // Video beginnt unter dem Karten-Intro
type Seg = { kind: "n" | "slow" | "freeze"; file: string; srcFrom: number; srcTo: number; rate: number; out: number; dur: number };
const SEGS: Seg[] = (() => {
  const raw: Omit<Seg, "out">[] = [
    { kind: "n", file: "gta/box.mp4", srcFrom: 0, srcTo: 4.55, rate: 1, dur: 4.55 },
    { kind: "slow", file: "gta/slow1.mp4", srcFrom: 4.55, srcTo: 4.95, rate: 1, dur: 1.483 },
    { kind: "n", file: "gta/box.mp4", srcFrom: 4.95, srcTo: 11.3, rate: 1, dur: 6.35 },
    { kind: "slow", file: "gta/slow2.mp4", srcFrom: 11.3, srcTo: 11.65, rate: 1, dur: 1.283 },
    { kind: "n", file: "gta/box.mp4", srcFrom: 11.65, srcTo: 12.4, rate: 1.3, dur: 0.75 / 1.3 },
    { kind: "n", file: "gta/box.mp4", srcFrom: 12.4, srcTo: 14.75, rate: 1, dur: 2.35 },
    { kind: "freeze", file: "gta/box.mp4", srcFrom: 14.75, srcTo: 14.75, rate: 0, dur: 2.6 },
  ];
  let t = V0;
  return raw.map((s) => {
    const r = { ...s, out: t };
    t += s.dur;
    return r;
  });
})();
export const GTA_FRAMES = f(SEGS[SEGS.length - 1].out + SEGS[SEGS.length - 1].dur);
const toOut = (src: number) => {
  for (const s of SEGS) {
    if (s.kind !== "freeze" && src >= s.srcFrom && src <= s.srcTo) return s.out + ((src - s.srcFrom) / (s.srcTo - s.srcFrom)) * s.dur;
  }
  return SEGS[SEGS.length - 1].out;
};
const SLOW1 = SEGS[1];
const SLOW2 = SEGS[3];
const FAST = SEGS[4];
const END = SEGS[6];

// Treffer (Quellzeit), wer getroffen wird, Schaden in Prozent
type Who = "rot" | "schwarz";
const HITS: { at: number; who: Who; dmg: number }[] = ([
  { src: 1.32, who: "rot", dmg: 7 },
  { src: 3.63, who: "rot", dmg: 7 },
  { src: 4.78, who: "schwarz", dmg: 14 },
  { src: 5.6, who: "rot", dmg: 7 },
  { src: 6.85, who: "schwarz", dmg: 7 },
  { src: 8.05, who: "schwarz", dmg: 7 },
  { src: 9.05, who: "rot", dmg: 7 },
  { src: 9.5, who: "rot", dmg: 7 },
  { src: 10.22, who: "rot", dmg: 7 },
  { src: 10.6, who: "schwarz", dmg: 7 },
  { src: 11.53, who: "schwarz", dmg: 14 },
  { src: 11.93, who: "rot", dmg: 7 },
] as { src: number; who: Who; dmg: number }[]).map((h) => ({ at: toOut(h.src), who: h.who, dmg: h.dmg }));

const T = {
  titleIn: 0.85,
  obj1: 1.6,
  obj1Out: SLOW1.out - 0.1,
  obj2: SLOW1.out + SLOW1.dur + 0.5,
  obj2Out: SLOW2.out - 0.1,
  wheelIn: SLOW2.out + 0.05,
  hover: SLOW2.out + 0.55,
  select: SLOW2.out + SLOW2.dur - 0.1,
  switchMid: FAST.out + 0.05,
  obj3: FAST.out + FAST.dur + 0.15,
  passed: toOut(14.2),
  end: END.out + END.dur,
};
const playerAt = (t: number): Who => (t < T.switchMid ? "rot" : "schwarz");
const STAR_AT = [HITS[0].at, HITS[4].at, HITS[8].at];

const health = (who: Who, t: number) => 100 - HITS.filter((h) => h.who === who && h.at <= t).reduce((a, h) => a + h.dmg, 0);

// ---------- eigene Stadtkarte (keine Spielkarte nachgebaut) ----------
const CityMap: React.FC<{ size: number }> = ({ size }) => {
  const roads: React.ReactNode[] = [];
  for (let i = 0; i <= 2000; i += 140) {
    const w = i % 560 === 0 ? 22 : 10;
    const c = i % 560 === 0 ? "#AEB6BB" : "#7E8990";
    roads.push(<line key={`v${i}`} x1={i} y1={0} x2={i} y2={2000} stroke={c} strokeWidth={w} />);
    roads.push(<line key={`h${i}`} x1={0} y1={i} x2={2000} y2={i} stroke={c} strokeWidth={w} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 2000 2000" style={{ display: "block" }}>
      <rect width={2000} height={2000} fill="#36424A" />
      {[
        [180, 260, 260, 200],
        [760, 1240, 220, 300],
        [1180, 420, 180, 160],
        [300, 1500, 300, 220],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#3E6A4A" />
      ))}
      {roads}
      <path d="M0 1720 L1520 220" stroke="#C9B36A" strokeWidth={26} fill="none" />
      <path d="M1560 0 C1420 520 1700 900 1500 1300 S1380 1800 1460 2000 L2000 2000 L2000 0 Z" fill="#1D5A86" />
      <path d="M1560 0 C1420 520 1700 900 1500 1300 S1380 1800 1460 2000" stroke="#CDBB86" strokeWidth={10} fill="none" />
      {/* Ziel: SALITE */}
      <g transform="translate(1260 560)">
        <circle r={44} fill="#F2C14E" stroke="#111" strokeWidth={6} />
        <text y={18} textAnchor="middle" fontFamily="Anton" fontSize={52} fill="#111">S</text>
      </g>
    </svg>
  );
};

// ---------- HUD ----------
const NAMES: Record<Who, string> = { rot: "ROT", schwarz: "SCHWARZ" };
const PlayerCard: React.FC<{ who: Who; t: number; y: number }> = ({ who, t, y }) => {
  const hp = health(who, t);
  const last = HITS.filter((h) => h.who === who && h.at <= t).pop();
  const since = last ? t - last.at : 99;
  const chunk = last && since < 0.7 ? last.dmg * interpolate(since, [0.25, 0.7], [1, 0], clamp) : 0;
  const flash = since < 0.3 ? 1 - since / 0.3 : 0;
  const active = playerAt(t) === who;
  return (
    <div style={{ position: "absolute", left: 48, top: y, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: 68, height: 68 }}>
        <Img src={staticFile(`gta/p_${who}.png`)} style={{ width: 68, height: 68, borderRadius: 34, border: `3px solid ${active ? "#FFFFFF" : "rgba(255,255,255,0.35)"}`, boxSizing: "border-box" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: `rgba(220,30,30,${0.55 * flash})` }} />
      </div>
      <div>
        <div style={{ fontFamily: "'Anton'", fontSize: 26, letterSpacing: "0.04em", color: "#FFFFFF", textShadow: "0 2px 4px rgba(0,0,0,0.8)", display: "flex", gap: 10, alignItems: "baseline" }}>
          {NAMES[who]}
          {active && <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 15, letterSpacing: "0.16em", color: "#F2C14E" }}>SPIELER</span>}
        </div>
        <div style={{ width: 250, height: 14, background: "rgba(0,0,0,0.6)", border: "2px solid rgba(0,0,0,0.85)", marginTop: 4, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${hp}%`, background: hp < 55 ? "#D9B23C" : "#5DBB5D" }} />
          <div style={{ position: "absolute", left: `${hp}%`, top: 0, bottom: 0, width: `${chunk}%`, background: "#FFFFFF" }} />
        </div>
      </div>
    </div>
  );
};

const Money: React.FC<{ t: number }> = ({ t }) => {
  const pulse = t > T.passed + 0.6 ? Math.max(0, 1 - (t - T.passed - 0.6) / 0.5) : 0;
  const stars = STAR_AT.filter((s) => s <= t).length;
  const starsGone = interpolate(t, [T.passed + 0.2, T.passed + 0.9], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", right: 150, top: 232, textAlign: "right" }}>
      <div style={{ fontFamily: "'Anton'", fontSize: 76, lineHeight: 1, color: "#6FC46F", WebkitTextStroke: "3px #0B1A0B", paintOrder: "stroke fill", transform: `scale(${1 + 0.18 * pulse})`, transformOrigin: "right center" }}>€69</div>
      <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 17, letterSpacing: "0.2em", color: "#FFFFFF", textShadow: "0 1px 3px rgba(0,0,0,0.9)", marginTop: 2 }}>TRACKSUIT</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 10, opacity: starsGone }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const on = i < stars;
          const newest = on && i === stars - 1 && t - STAR_AT[i] < 1.2;
          const blink = newest ? (Math.floor((t - STAR_AT[i]) * 8) % 2 === 0 ? 1 : 0.25) : 1;
          return (
            <svg key={i} width={34} height={34} viewBox="-12 -12 24 24" style={{ opacity: on ? blink : 0.55 }}>
              <path d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.4 L6.5 8.6 L0 4.2 L-6.5 8.6 L-4.3 1.4 L-10 -3.1 L-2.9 -3.1 Z" fill={on ? "#FFFFFF" : "rgba(0,0,0,0.5)"} stroke="#000" strokeWidth={1.4} />
            </svg>
          );
        })}
      </div>
    </div>
  );
};

const Minimap: React.FC<{ t: number }> = ({ t }) => {
  const W = 262;
  const H = 222;
  const S = 1100; // gezeigte Kartenfläche in Kartenpixeln je Breite x 2,6
  const rot = Math.sin(t * 0.35) * 10;
  const p = playerAt(t);
  const slowSpecial = t >= SLOW1.out && t < SLOW1.out + SLOW1.dur;
  const special = slowSpecial ? interpolate(t, [SLOW1.out, SLOW1.out + SLOW1.dur], [100, 0]) : t < SLOW1.out ? 100 : interpolate(t, [SLOW1.out + SLOW1.dur, T.end], [0, 60], clamp);
  return (
    <div style={{ position: "absolute", left: 48, top: 1238 }}>
      <div style={{ width: W, height: H, borderRadius: 12, overflow: "hidden", border: "3px solid rgba(0,0,0,0.85)", position: "relative", background: "#36424A" }}>
        <div style={{ position: "absolute", left: W / 2 - S / 2, top: H / 2 - S / 2, width: S, height: S, transform: `rotate(${rot}deg) translate(${-60 - t * 6}px, ${40 - t * 4}px)` }}>
          <CityMap size={S} />
        </div>
        {/* Gegner */}
        <div style={{ position: "absolute", left: W / 2 + 22, top: H / 2 - 4, width: 14, height: 14, borderRadius: 7, background: "#E5413A", border: "2px solid #000" }} />
        {/* Spieler-Pfeil */}
        <svg width={30} height={30} viewBox="-15 -15 30 30" style={{ position: "absolute", left: W / 2 - 15, top: H / 2 - 15 }}>
          <path d="M0 -12 L9 10 L0 5 L-9 10 Z" fill="#FFFFFF" stroke="#000" strokeWidth={2} />
        </svg>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 5, width: W }}>
        <div style={{ flex: 2, height: 9, background: "rgba(0,0,0,0.6)" }}>
          <div style={{ width: `${health(p, t)}%`, height: "100%", background: "#5DBB5D" }} />
        </div>
        <div style={{ flex: 1, height: 9, background: "rgba(0,0,0,0.6)" }}>
          <div style={{ width: `${special}%`, height: "100%", background: "#F2C14E" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: W + 18, top: H - 46, whiteSpace: "nowrap", fontFamily: "'Inter'", fontWeight: 700, fontStyle: "italic", fontSize: 21, color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
        SALITE LAGER <span style={{ opacity: 0.6 }}>|</span> HAMBURG
      </div>
    </div>
  );
};

const Objective: React.FC<{ t: number; a: number; b: number; children: React.ReactNode }> = ({ t, a, b, children }) => {
  const o = interpolate(t, [a, a + 0.25, b - 0.25, b], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1150, textAlign: "center", opacity: o, fontFamily: "'Inter'", fontWeight: 600, fontSize: 38, color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 2px #000" }}>
      {children}
    </div>
  );
};
const Red: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: "#F0534A" }}>{children}</span>;
const Blue: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: "#5DA9F0" }}>{children}</span>;
const Gold: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: "#F2C14E" }}>{children}</span>;

const MissionTitle: React.FC<{ t: number }> = ({ t }) => {
  const o = interpolate(t, [T.titleIn, T.titleIn + 0.3, T.titleIn + 2.0, T.titleIn + 2.4], [0, 1, 1, 0], clamp);
  const s = interpolate(t, [T.titleIn, T.titleIn + 0.4], [1.15, 1], { ...clamp, easing: OUT });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 470, left: 0, right: 0, textAlign: "center", opacity: o, transform: `scale(${s})` }}>
      <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, letterSpacing: "0.32em", color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}>SALITE PRÄSENTIERT</div>
      <div style={{ fontFamily: "'Anton'", fontSize: 118, color: "#F2C14E", lineHeight: 1.05, transform: "skewX(-8deg)", WebkitTextStroke: "4px #111", paintOrder: "stroke fill", textShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>
        DER 69 € TRACKIE
      </div>
    </div>
  );
};

// Charakterwechsel-Rad
const Wheel: React.FC<{ t: number }> = ({ t }) => {
  const o = interpolate(t, [T.wheelIn, T.wheelIn + 0.2, T.select, T.select + 0.15], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const sel: Who = t >= T.hover ? "schwarz" : "rot";
  const slots = [
    { key: "rot", x: -170, y: -110 },
    { key: "schwarz", x: 170, y: -110 },
    { key: "du", x: 0, y: 175 },
  ];
  return (
    <div style={{ position: "absolute", left: 540, top: 880, opacity: o, transform: `scale(${0.9 + 0.1 * o})` }}>
      <div style={{ position: "absolute", left: -330, top: -330, width: 660, height: 660, borderRadius: 330, background: "radial-gradient(circle, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.62) 70%)", border: "3px solid rgba(255,255,255,0.25)" }} />
      {slots.map((s) => {
        const on = s.key === sel;
        return (
          <div key={s.key} style={{ position: "absolute", left: s.x - 95, top: s.y - 95, width: 190, textAlign: "center" }}>
            {s.key === "du" ? (
              <div style={{ width: 170, height: 170, margin: "0 auto", borderRadius: 85, background: "rgba(20,20,20,0.85)", border: "4px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={70} height={70} viewBox="-20 -24 40 46">
                  <rect x={-14} y={-2} width={28} height={22} rx={4} fill="#FFFFFF" />
                  <path d="M-9 -2 V-10 A9 9 0 0 1 9 -10 V-2" stroke="#FFFFFF" strokeWidth={5} fill="none" />
                </svg>
              </div>
            ) : (
              <Img src={staticFile(`gta/p_${s.key}.png`)} style={{ width: 170, height: 170, borderRadius: 85, border: `6px solid ${on ? "#FFFFFF" : "rgba(255,255,255,0.35)"}`, boxShadow: on ? "0 0 30px rgba(255,255,255,0.75)" : "none", boxSizing: "border-box", filter: on ? "none" : "brightness(0.6)" }} />
            )}
            <div style={{ marginTop: 8, fontFamily: "'Anton'", fontSize: 30, color: on ? "#FFFFFF" : "rgba(255,255,255,0.7)", textShadow: "0 2px 4px #000" }}>{s.key === "du" ? "DU" : NAMES[s.key as Who]}</div>
            {s.key === "du" && <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 16, letterSpacing: "0.12em", color: "#F2C14E" }}>NUR MIT PASSWORT</div>}
          </div>
        );
      })}
    </div>
  );
};

const MissionPassed: React.FC<{ t: number }> = ({ t }) => {
  const a = T.passed;
  const band = interpolate(t, [a, a + 0.35], [0, 1], { ...clamp, easing: OUT });
  const big = interpolate(t, [a + 0.1, a + 0.45], [0, 1], { ...clamp, easing: OUT });
  const sub = interpolate(t, [a + 0.6, a + 0.9], [0, 1], clamp);
  const info = interpolate(t, [a + 1.1, a + 1.4], [0, 1], clamp);
  if (band <= 0) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, height: 470, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 22%, rgba(0,0,0,0.62) 78%, rgba(0,0,0,0) 100%)", opacity: band }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center" }}>
        <div style={{ fontFamily: "'Anton'", fontSize: 128, lineHeight: 1, color: "#F2C14E", transform: `skewX(-8deg) scale(${1.25 - 0.25 * big})`, opacity: big, WebkitTextStroke: "4px #111", paintOrder: "stroke fill" }}>MISSION PASSED</div>
        <div style={{ fontFamily: "'Anton'", fontSize: 54, color: "#FFFFFF", marginTop: 8, opacity: sub, letterSpacing: "0.04em" }}>RESPEKT +</div>
        <div style={{ marginTop: 20, opacity: info, fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#FFFFFF", lineHeight: 1.5 }}>
          BELOHNUNG: <Gold>69 € TRACKIE</Gold>
          <br />
          <span style={{ fontSize: 22, letterSpacing: "0.12em", opacity: 0.85 }}>BLACK WEEK · 20.11. · 18:00 · NUR MIT PASSWORT</span>
        </div>
      </div>
    </>
  );
};

// ---------- Ton ----------
const Sfx: React.FC<{ at: number; src: string; vol: number; len?: number }> = ({ at, src, vol, len = 1.2 }) => (
  <Sequence from={Math.max(0, f(at))} durationInFrames={f(len)}>
    <Audio src={staticFile(`gta/snd/${src}.wav`)} volume={vol} />
  </Sequence>
);

export const GtaBox: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / GFPS;

  // Wackeln und Zoom-Stoß bei Treffern
  let sx = 0;
  let sy = 0;
  let punch = 0;
  let dmgFlash = 0;
  HITS.forEach((h, i) => {
    const d = t - h.at;
    if (d >= 0 && d < 0.25) {
      const k = (1 - d / 0.25) * (h.dmg > 10 ? 1.8 : 1);
      sx += Math.sin(d * 90 + i) * 9 * k;
      sy += Math.cos(d * 77 + i * 2) * 7 * k;
      punch = Math.max(punch, 0.035 * k);
    }
    if (d >= 0 && d < 0.4) dmgFlash = Math.max(dmgFlash, (1 - d / 0.4) * (h.who === playerAt(t) ? 0.75 : 0.4));
  });

  // Spezialfähigkeit (Zeitlupe 1) und Wechsel-Rad (Zeitlupe 2)
  const sp = interpolate(t, [SLOW1.out - 0.05, SLOW1.out + 0.12, SLOW1.out + SLOW1.dur - 0.12, SLOW1.out + SLOW1.dur + 0.05], [0, 1, 1, 0], clamp);
  const wh = interpolate(t, [SLOW2.out, SLOW2.out + 0.15, T.select, T.select + 0.1], [0, 1, 1, 0], clamp);
  // Wechsel-Flug: rausziehen, Karte, wieder rein
  const sw1 = interpolate(t, [T.select - 0.02, T.switchMid], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sw2 = interpolate(t, [T.switchMid + 0.12, T.switchMid + 0.42], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sw = t < T.switchMid + 0.12 ? sw1 : sw2;
  const mapSwitch = interpolate(t, [T.switchMid - 0.08, T.switchMid, T.switchMid + 0.12, T.switchMid + 0.24], [0, 1, 1, 0], clamp);
  // Intro: Karte zoomt rein
  const intro = interpolate(t, [0, V0 + 0.35], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const introMap = interpolate(t, [V0 - 0.05, V0 + 0.3], [1, 0], clamp);
  const introZoom = interpolate(t, [V0, V0 + 0.55], [1.35, 1], { ...clamp, easing: OUT });
  // Ende: eingefroren, leicht entsättigt
  const endDim = interpolate(t, [T.passed, T.passed + 0.5], [0, 1], clamp);

  const scale = (1 + punch) * introZoom * (1 - 0.45 * sw) * (1 + 0.04 * sp);
  const blur = 14 * sw + (t < V0 + 0.3 ? 8 * (1 - interpolate(t, [V0, V0 + 0.3], [0, 1], clamp)) : 0);
  const grade = `contrast(${1.08 + 0.12 * sp}) saturate(${1.2 - 0.75 * sp - 0.85 * wh - 0.5 * endDim}) brightness(${1.02 - 0.25 * wh - 0.15 * endDim}) blur(${blur}px)`;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${scale})`, filter: grade }}>
        {SEGS.map((s, i) => (
          <Sequence key={i} from={f(s.out)} durationInFrames={Math.max(1, f(s.out + s.dur) - f(s.out))}>
            {s.kind === "freeze" ? (
              <Freeze frame={0}>
                <OffthreadVideo src={staticFile(s.file)} trimBefore={Math.round(s.srcFrom * GFPS)} muted style={{ width: "100%", height: "100%" }} />
              </Freeze>
            ) : (
              <OffthreadVideo src={staticFile(s.file)} trimBefore={s.kind === "slow" ? 0 : Math.round(s.srcFrom * GFPS)} playbackRate={s.rate} muted style={{ width: "100%", height: "100%" }} />
            )}
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* Spezialfähigkeit: kühle Färbung und Vignette */}
      <AbsoluteFill style={{ background: "rgba(20,110,130,0.22)", mixBlendMode: "color", opacity: sp }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)", opacity: Math.max(sp, wh) }} />
      {/* Schaden: rote Ränder */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(180,0,0,0) 50%, rgba(190,10,10,0.85) 100%)", opacity: dmgFlash }} />

      {/* Karte: Intro und Wechsel-Flug */}
      {(introMap > 0 || mapSwitch > 0) && (
        <AbsoluteFill style={{ opacity: Math.max(introMap, mapSwitch), alignItems: "center", justifyContent: "center", background: "#36424A" }}>
          <div style={{ transform: `scale(${t < V0 + 0.4 ? 0.9 + 2.2 * intro : 1.4})`, transformOrigin: "center" }}>
            <CityMap size={1920} />
          </div>
          <svg width={60} height={60} viewBox="-30 -30 60 60" style={{ position: "absolute", left: 510, top: 930 }}>
            <circle r={16 + 10 * Math.abs(Math.sin(t * 9))} fill="rgba(255,255,255,0.25)" />
            <path d="M0 -14 L11 12 L0 6 L-11 12 Z" fill="#FFFFFF" stroke="#000" strokeWidth={2.5} />
          </svg>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: interpolate(t, [T.switchMid + 0.1, T.switchMid + 0.14, T.switchMid + 0.3], [0, 0.55, 0], clamp) }} />

      {/* HUD */}
      {t > V0 + 0.2 && t < T.end - 0.01 && (
        <>
          <div style={{ opacity: 1 - wh * 0.6 - endDim * 0.6 }}>
            <PlayerCard who="rot" t={t} y={232} />
            <PlayerCard who="schwarz" t={t} y={318} />
            <Money t={t} />
            <Minimap t={t} />
          </div>
          <MissionTitle t={t} />
          <Objective t={t} a={T.obj1} b={T.obj1Out}>
            Besiege den Typen im <Red>schwarzen Trackie</Red>.
          </Objective>
          <Objective t={t} a={T.obj2} b={T.obj2Out}>
            Pass auf den <Gold>69 € Trackie</Gold> auf. Kein Fleck.
          </Objective>
          <Objective t={t} a={T.obj3} b={T.passed}>
            Jetzt als <Blue>Schwarz</Blue>: Hol dir die Revanche.
          </Objective>
          <Wheel t={t} />
          <MissionPassed t={t} />
        </>
      )}

      {/* Raumton (nur in Echtzeit-Teilen) */}
      {SEGS.filter((s) => s.kind === "n").map((s, i) => (
        <Sequence key={`a${i}`} from={f(s.out)} durationInFrames={Math.max(1, f(s.out + s.dur) - f(s.out))}>
          <Audio src={staticFile("gta/box_audio.wav")} trimBefore={Math.round(s.srcFrom * GFPS)} playbackRate={s.rate} volume={0.5} />
        </Sequence>
      ))}
      {/* Effekte */}
      <Sfx at={0} src="switch" vol={0.7} len={1.2} />
      <Sfx at={T.titleIn} src="title" vol={0.6} len={1.3} />
      {[T.obj1, T.obj2, T.obj3].map((a) => (
        <Sfx key={a} at={a} src="objective" vol={0.35} len={0.3} />
      ))}
      {HITS.map((h, i) => (
        <React.Fragment key={`h${i}`}>
          <Sfx at={h.at - 0.01} src={["punch_a", "punch_b", "punch_c"][i % 3]} vol={h.dmg > 10 ? 0.95 : 0.6} len={0.4} />
          {h.who === playerAt(h.at) && <Sfx at={h.at} src="hurt" vol={0.45} len={0.5} />}
        </React.Fragment>
      ))}
      {STAR_AT.map((s) => (
        <Sfx key={`s${s}`} at={s + 0.15} src="star" vol={0.3} len={0.5} />
      ))}
      <Sfx at={SLOW1.out - 0.25} src="slow_in" vol={0.75} len={1} />
      {[0.25, 0.85].map((d) => (
        <Sfx key={`hb${d}`} at={SLOW1.out + d} src="heartbeat" vol={0.8} len={0.7} />
      ))}
      <Sfx at={SLOW1.out + SLOW1.dur - 0.42} src="slow_out" vol={0.65} len={0.6} />
      <Sfx at={SLOW2.out - 0.2} src="slow_in" vol={0.6} len={1} />
      <Sfx at={T.wheelIn} src="wheel_tick" vol={0.4} len={0.1} />
      <Sfx at={T.hover} src="wheel_tick" vol={0.5} len={0.1} />
      <Sfx at={T.select - 0.3} src="switch" vol={0.85} len={1.2} />
      <Sfx at={T.passed} src="passed" vol={0.75} len={1.8} />
      <Sfx at={T.passed + 0.6} src="cash" vol={0.5} len={1} />
    </AbsoluteFill>
  );
};
