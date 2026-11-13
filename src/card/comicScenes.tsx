import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import "./SafetyCard"; // lädt Anton und Inter

// Comic-Szenen im Stil der Flugzeug-Sicherheitskarten. Jede Szene lebt in einer 480x320 Box
// und wird über "scale" vergrößert (Karte 0,9, Slideshow 2,0). t = Frames seit Szenenstart.
export const CC = {
  paper: "#F4EEDF",
  panel: "#FBF8F0",
  ink: "#1E1A17",
  sub: "#4A423B",
  muted: "#7A6F64",
  red: "#E3120B",
  sky: "#5E9BCB",
  ice: "#CFE3F2",
};
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const OUT = Easing.out(Easing.exp);
const HOOD = staticFile("card/set_hoodie.png"); // 521x536

export type SceneKind = "airbag" | "rain" | "cold" | "bullet" | "lastcall" | "first";
export const BW = 480;
export const BH = 320;

// Hoodie: Höhe 260, mittig; Tasche bei 73 % der Höhe
const HH = 260;
const HWd = (HH * 521) / 536;
const Hoodie: React.FC<{ cx?: number; top?: number; shake?: number }> = ({ cx = 240, top = 30, shake = 0 }) => (
  <Img src={HOOD} style={{ position: "absolute", left: cx - HWd / 2 + shake, top, width: HWd, height: HH }} />
);

// Comic-Zacke
const Burst: React.FC<{ x: number; y: number; r: number; text?: string; fill?: string; color?: string; size?: number; rot?: number; o?: number }> = ({
  x,
  y,
  r,
  text,
  fill = "#FFFFFF",
  color = CC.red,
  size = 22,
  rot = 0,
  o = 1,
}) => {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.62 : r;
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  }).join(" ");
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
      <polygon points={pts} fill={fill} stroke={CC.ink} strokeWidth={3} strokeLinejoin="round" />
      {text && (
        <text textAnchor="middle" y={size * 0.36} fontFamily="Anton" fontSize={size} fill={color}>
          {text}
        </text>
      )}
    </g>
  );
};

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {children}
  </svg>
);

const Airbag: React.FC<{ t: number }> = ({ t }) => {
  const bag = interpolate(t, [14, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  const burst = interpolate(t, [14, 18, 30], [0, 1, 0], clamp);
  const cy = 30 + HH * 0.73;
  return (
    <>
      <Svg>
        <Burst x={240} y={cy} r={110} o={burst} fill="#FFF3C4" />
      </Svg>
      <Hoodie />
      <Svg>
        {/* Speedlines */}
        {[-1, 1].map((s) =>
          [0, 1, 2].map((i) => (
            <path
              key={`${s}${i}`}
              d={`M${240 + s * (100 + i * 6)} ${cy - 30 + i * 30} l${s * 40 * bag} 0`}
              stroke={CC.ink}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={bag}
            />
          )),
        )}
        <g transform={`translate(240 ${cy - 4}) scale(${0.1 + bag * 0.9})`} opacity={bag}>
          <ellipse rx={92} ry={52} fill="#FFFFFF" stroke={CC.ink} strokeWidth={4} />
          <path d="M-60 -10 q16 -14 32 0 q16 -14 32 0 q16 -14 32 0 q16 -14 32 0" fill="none" stroke="#CFC4AE" strokeWidth={3} />
          <path d="M-44 18 q22 10 44 0 q22 10 44 0" fill="none" stroke="#CFC4AE" strokeWidth={3} />
        </g>
        <Burst x={400} y={70} r={44} text="PUFF!" size={22} o={bag} rot={10} />
      </Svg>
    </>
  );
};

const Rain: React.FC<{ t: number }> = ({ t }) => {
  const xs = [40, 80, 130, 160, 195, 230, 262, 300, 330, 370, 410, 445];
  const surface = (x: number) => {
    if (x > 180 && x < 300) return 64 + Math.abs(x - 240) * 0.55; // Kapuze
    if (x > 118 && x < 362) return 118; // Schultern
    return 330; // daneben
  };
  return (
    <>
      <Hoodie top={56} />
      <Svg>
        {/* Wolke */}
        <g transform="translate(240 26) scale(0.85)">
          <path d="M-120 20 q-34 0 -30 -26 q4 -22 34 -18 q8 -30 44 -24 q20 -26 56 -10 q34 -14 52 14 q36 -2 34 28 q-2 22 -30 22 Z" fill="#9BA9B5" stroke={CC.ink} strokeWidth={3.5} />
        </g>
        {xs.map((x, i) => {
          const per = 34;
          const ph = (Math.max(0, t) + i * 7) % per;
          const hitY = surface(x);
          const fallT = (hitY - 44) / 18; // Frames bis zum Auftreffen
          if (ph < fallT) {
            const y = 44 + ph * 18;
            return <path key={i} d={`M${x} ${y} l-3 16`} stroke={CC.sky} strokeWidth={4.5} strokeLinecap="round" />;
          }
          const k = (ph - fallT) / (per - fallT);
          if (hitY > 300) return null;
          const dir = x < 240 ? -1 : 1;
          return (
            <g key={i} opacity={1 - k}>
              <circle cx={x + dir * k * 44} cy={hitY - Math.sin(k * Math.PI) * 30} r={4} fill={CC.sky} />
              <circle cx={x - dir * k * 22} cy={hitY - Math.sin(k * Math.PI) * 18} r={3} fill={CC.sky} />
              {k < 0.3 && <path d={`M${x - 12} ${hitY - 4} q12 -12 24 0`} fill="none" stroke={CC.sky} strokeWidth={3} />}
            </g>
          );
        })}
      </Svg>
    </>
  );
};

const Cold: React.FC<{ t: number }> = ({ t }) => {
  const thermo = interpolate(t, [6, 40], [0.9, 0.08], { ...clamp, easing: OUT });
  const frost = interpolate(t, [0, 30], [0, 1], clamp);
  const jacket = interpolate(t, [34, 44], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const shiver = Math.sin(t * 2.4) * 1.2;
  return (
    <>
      {/* Frost in den Ecken */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          background: `radial-gradient(circle at 0% 0%, ${CC.ice} 0%, transparent 32%), radial-gradient(circle at 100% 100%, ${CC.ice} 0%, transparent 30%)`,
          opacity: frost,
        }}
      />
      <Hoodie cx={220} />
      <Svg>
        {/* Wind */}
        {[60, 140, 230].map((y, i) => {
          const k = ((t + i * 9) % 30) / 30;
          return <path key={i} d={`M${-40 + k * 520} ${y} q30 -10 60 0`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.9 * (1 - Math.abs(k - 0.5) * 2)} />;
        })}
        {/* Schneeflocken */}
        {Array.from({ length: 22 }, (_, i) => {
          const per = 60 + (i % 5) * 9;
          const k = ((Math.max(0, t) + i * 17) % per) / per;
          const x = ((i * 53) % 520) - 20 + k * 90 + Math.sin(k * 8 + i) * 10;
          const y = -20 + k * 360;
          const s = 0.6 + (i % 3) * 0.3;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${k * 180})`} opacity={0.95}>
              {[0, 60, 120].map((a) => (
                <path key={a} d="M0 -10 L0 10" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" transform={`rotate(${a})`} />
              ))}
              {[0, 60, 120].map((a) => (
                <path key={`b${a}`} d="M0 -10 L0 10" stroke={CC.sky} strokeWidth={2} strokeLinecap="round" transform={`rotate(${a})`} />
              ))}
            </g>
          );
        })}
        {/* Thermometer */}
        <g transform={`translate(${418 + shiver} 36)`}>
          <rect x={-14} y={0} width={28} height={190} rx={14} fill="#FFFFFF" stroke={CC.ink} strokeWidth={3.5} />
          {[30, 70, 110, 150].map((y) => (
            <path key={y} d={`M14 ${y} l10 0`} stroke={CC.ink} strokeWidth={3} />
          ))}
          <rect x={-7} y={12 + 168 * (1 - thermo)} width={14} height={168 * thermo + 10} rx={7} fill={CC.sky} />
          <circle cx={0} cy={212} r={26} fill={CC.sky} stroke={CC.ink} strokeWidth={3.5} />
        </g>
        {/* Winterjacke, durchgestrichen */}
        <g transform={`translate(70 236) scale(${jacket})`}>
          <path d="M-26 -30 L26 -30 L36 34 L-36 34 Z" fill="#6F5B4B" stroke={CC.ink} strokeWidth={3.5} />
          <path d="M0 -30 L0 34" stroke={CC.ink} strokeWidth={3} />
          <path d="M-26 -30 Q0 -44 26 -30" fill="none" stroke={CC.ink} strokeWidth={3} />
          <circle r={46} fill="none" stroke={CC.red} strokeWidth={7} />
          <path d="M-32 32 L32 -32" stroke={CC.red} strokeWidth={7} strokeLinecap="round" />
        </g>
      </Svg>
    </>
  );
};

const Bullet: React.FC<{ t: number }> = ({ t }) => {
  const shots = [
    { y: 120, from: -1, d: 0 },
    { y: 190, from: 1, d: 12 },
    { y: 150, from: -1, d: 24 },
    { y: 100, from: 1, d: 36 },
  ];
  const per = 48;
  let hit = 0;
  const parts = shots.map((s, i) => {
    const k = ((Math.max(0, t - 8) + s.d) % per) / per;
    const edge = 240 + s.from * 112;
    const start = s.from < 0 ? -40 : BW + 40;
    const inbound = k < 0.35;
    const kk = inbound ? k / 0.35 : (k - 0.35) / 0.65;
    const x = inbound ? start + (edge - start) * kk : edge + s.from * kk * 150;
    const y = inbound ? s.y : s.y - Math.sin(kk * Math.PI * 0.5) * 120 + kk * kk * 60;
    const flash = k > 0.33 && k < 0.5;
    if (flash) hit = 1;
    return (
      <g key={i} opacity={t > 8 ? 1 : 0}>
        {inbound &&
          [1, 2, 3].map((j) => <path key={j} d={`M${x - s.from * (24 + j * 14)} ${s.y - 6 + j * 3} l${-s.from * 12} 0`} stroke={CC.ink} strokeWidth={3} strokeLinecap="round" />)}
        <g transform={`translate(${x} ${y}) rotate(${(s.from < 0 ? 0 : 180) + (inbound ? 0 : s.from * (40 + kk * 70))})`}>
          <path d="M-22 -7 L6 -7 Q24 0 6 7 L-22 7 Z" fill="#B08D57" stroke={CC.ink} strokeWidth={3} />
        </g>
        {flash && <Burst x={edge} y={s.y} r={40} text="PING!" size={18} rot={s.from * 12} />}
      </g>
    );
  });
  return (
    <>
      <Hoodie shake={hit ? 2 : 0} />
      <Svg>{parts}</Svg>
    </>
  );
};

const LastCall: React.FC<{ t: number }> = ({ t }) => {
  const stamp = interpolate(t, [12, 19], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const shake = t > 19 && t < 27 ? Math.sin(t * 5) * 4 : 0;
  const dust = interpolate(t, [19, 32], [0, 1], clamp);
  return (
    <>
      <Hoodie shake={shake} />
      <Svg>
        {dust > 0 &&
          dust < 1 &&
          [0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return <circle key={i} cx={240 + Math.cos(a) * (130 + dust * 60)} cy={150 + Math.sin(a) * (60 + dust * 40)} r={8 * (1 - dust)} fill={CC.ink} opacity={0.5} />;
          })}
      </Svg>
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 150,
          transform: `translate(-50%, -50%) rotate(-12deg) scale(${3 - stamp * 2})`,
          opacity: stamp,
          border: `6px solid ${CC.red}`,
          borderRadius: 10,
          padding: "8px 20px 4px",
          color: CC.red,
          fontFamily: "'Anton'",
          fontSize: 52,
          whiteSpace: "nowrap",
          background: "rgba(251,248,240,0.86)",
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        LETZTE AUSGABE
      </div>
    </>
  );
};

const First: React.FC<{ t: number }> = ({ t }) => {
  const pass = interpolate(t, [6, 22], [0, 1], { ...clamp, easing: OUT });
  const tear = interpolate(t, [36, 48], [0, 1], { ...clamp, easing: OUT });
  return (
    <div
      style={{
        position: "absolute",
        left: 36,
        right: 36,
        top: 48,
        height: 220,
        transform: `translateY(${(1 - pass) * 160}px) rotate(${-3 + pass * 3}deg)`,
        opacity: pass,
      }}
    >
      <div style={{ position: "absolute", inset: 0, right: 110, background: "#FFFFFF", border: `3px solid ${CC.ink}`, borderRadius: "14px 0 0 14px", overflow: "hidden" }}>
        <div style={{ background: CC.ink, color: CC.paper, fontFamily: "'Inter'", fontWeight: 800, fontSize: 15, letterSpacing: "0.18em", padding: "9px 14px", display: "flex", justifyContent: "space-between" }}>
          <span>SALITE AIR</span>
          <span>BOARDING PASS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "12px 16px 0", rowGap: 8 }}>
          {[
            ["KLASSE", "FIRST"],
            ["SITZ", "1A"],
            ["DATUM", "27.11."],
            ["GATE", "PASSWORT"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 12, letterSpacing: "0.16em", color: CC.muted }}>{k}</div>
              <div style={{ fontFamily: "'Anton'", fontSize: 34, color: k === "KLASSE" ? CC.red : CC.ink, lineHeight: 1.05 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Abriss */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 110,
          background: "#FFFFFF",
          border: `3px solid ${CC.ink}`,
          borderLeft: `3px dashed ${CC.ink}`,
          borderRadius: "0 14px 14px 0",
          transform: `translate(${tear * 30}px, ${tear * 14}px) rotate(${tear * 10}deg)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <div style={{ fontFamily: "'Anton'", fontSize: 30, color: CC.ink }}>1A</div>
        {[3, 1, 2, 1, 3, 1, 2].map((w, i) => (
          <div key={i} style={{ width: 70, height: w * 2, background: CC.ink }} />
        ))}
      </div>
    </div>
  );
};

export const ComicScene: React.FC<{ kind: SceneKind; t: number; scale: number }> = ({ kind, t, scale }) => (
  <div style={{ position: "relative", width: BW * scale, height: BH * scale }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      {kind === "airbag" && <Airbag t={t} />}
      {kind === "rain" && <Rain t={t} />}
      {kind === "cold" && <Cold t={t} />}
      {kind === "bullet" && <Bullet t={t} />}
      {kind === "lastcall" && <LastCall t={t} />}
      {kind === "first" && <First t={t} />}
    </div>
  </div>
);

export const SCENES: { kind: SceneKind; title: string; line: string }[] = [
  { kind: "airbag", title: "AIRBAG-TASCHE", line: "Extra große Kängurutasche. Dicht bis zum Bauch." },
  { kind: "rain", title: "WASSERDICHT", line: "Regen perlt einfach ab." },
  { kind: "cold", title: "KEINE WINTERJACKE NÖTIG", line: "550 GSM Heavyweight. Kältedicht." },
  { kind: "bullet", title: "BULLETPROOF*", line: "Nichts kommt durch." },
  { kind: "lastcall", title: "LAST CALL", line: "Diese Edition gibt es nur einmal." },
  { kind: "first", title: "NUR MIT PASSWORT", line: "Kommentiere: Ich brauch ein Passwort." },
];
