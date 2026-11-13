import React from "react";
import { TracksuitSVG } from "./TracksuitMockup";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

// Sicherheitskarte im Stil der Flugzeug-Karten, Satire: SALITE Tracksuit in der Fahrschule.
// 1080x1920, 30 fps. Die Felder erscheinen nacheinander mit kleinen Animationen; das letzte Bild ist die Standbild-Version.
export const CARD = { fps: 30, width: 1080, height: 1920, frames: 300 };

const C = {
  paper: "#F4EEDF",
  panel: "#FBF8F0",
  ink: "#1E1A17",
  line: "#CFC4AE",
  red: "#E3120B",
  suit: "#D7D7D5",
  suitDark: "#B9B9B6",
  skin: "#E7B48F",
  hair: "#3A2C22",
  sole: "#F1E3C2",
  shoe: "#9FB3D9",
  sky: "#8FB8D8",
  car: "#E8A27C",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.cubic);

let loaded = false;
const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("Fonts");
  const faces = [
    new FontFace("Anton", `url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2')`),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format('woff2')`, { weight: "600" }),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-800-normal.woff2")}) format('woff2')`, { weight: "800" }),
  ];
  Promise.all(faces.map((f) => f.load().then((x) => document.fonts.add(x)))).then(() => continueRender(h), () => continueRender(h));
};
loadFonts();

// Piktogramm-Figur im SALITE Tracksuit (Vorderansicht). Koordinaten in einer 200x400 Box.
const Figure: React.FC<{ seated?: boolean; pocketGlow?: number }> = ({ seated = false, pocketGlow = 0 }) => {
  const stroke = { stroke: C.ink, strokeWidth: 3.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const legTop = 232;
  const legLen = seated ? 70 : 132;
  return (
    <g>
      {/* Beine (weit, mit Stack über dem Schuh) */}
      <path d={`M58 ${legTop} L100 ${legTop} L98 ${legTop + legLen} Q78 ${legTop + legLen + 10} 54 ${legTop + legLen} Z`} fill={C.suit} {...stroke} />
      <path d={`M100 ${legTop} L142 ${legTop} L146 ${legTop + legLen} Q122 ${legTop + legLen + 10} 102 ${legTop + legLen} Z`} fill={C.suit} {...stroke} />
      {!seated && (
        <>
          <path d={`M56 ${legTop + legLen - 22} q20 8 42 0`} fill="none" {...stroke} strokeWidth={2} />
          <path d={`M103 ${legTop + legLen - 22} q20 8 42 0`} fill="none" {...stroke} strokeWidth={2} />
        </>
      )}
      {/* Schuhe */}
      <path d={`M48 ${legTop + legLen + 2} q26 -10 50 0 l2 14 q-28 6 -54 0 Z`} fill={C.shoe} {...stroke} />
      <path d={`M102 ${legTop + legLen + 2} q26 -10 50 0 l2 14 q-28 6 -54 0 Z`} fill={C.shoe} {...stroke} />
      <path d={`M46 ${legTop + legLen + 12} q28 6 56 0`} fill="none" stroke={C.sole} strokeWidth={5} />
      <path d={`M100 ${legTop + legLen + 12} q28 6 56 0`} fill="none" stroke={C.sole} strokeWidth={5} />
      {/* Arme */}
      <path d="M50 104 Q26 112 24 160 L26 214 Q38 222 50 214 L54 150 Z" fill={C.suit} {...stroke} />
      <path d="M150 104 Q174 112 176 160 L174 214 Q162 222 150 214 L146 150 Z" fill={C.suit} {...stroke} />
      <circle cx={38} cy={226} r={11} fill={C.skin} {...stroke} />
      <circle cx={162} cy={226} r={11} fill={C.skin} {...stroke} />
      {/* Hoodie, oversized und kastig */}
      <path d="M50 100 Q100 84 150 100 L154 222 Q100 232 46 222 Z" fill={C.suit} {...stroke} />
      <rect x={46} y={216} width={108} height={18} rx={6} fill={C.suitDark} {...stroke} />
      {/* Kapuze */}
      <path d="M62 98 Q100 70 138 98 Q120 112 100 112 Q80 112 62 98 Z" fill={C.suitDark} {...stroke} />
      {/* Riesige Kängurutasche bis zum Bauch */}
      {pocketGlow > 0 && <ellipse cx={100} cy={188} rx={62 + pocketGlow * 10} ry={34 + pocketGlow * 8} fill={C.red} opacity={0.18 * pocketGlow} />}
      <path d="M56 158 L144 158 L150 214 L50 214 Z" fill={C.suit} {...stroke} />
      <path d="M56 158 Q50 186 52 212" fill="none" {...stroke} strokeWidth={2.4} />
      <path d="M144 158 Q150 186 148 212" fill="none" {...stroke} strokeWidth={2.4} />
      {/* S-Logo mit Steinen */}
      <text x={120} y={140} fontFamily="Georgia, serif" fontStyle="italic" fontSize={24} fill="#FFFFFF" stroke={C.ink} strokeWidth={0.6}>
        S
      </text>
      {[
        [114, 120, "#C0392B"],
        [134, 124, "#2E5BBA"],
        [112, 140, "#F0F0F0"],
        [136, 142, "#C0392B"],
        [124, 148, "#2E5BBA"],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={2.2} fill={c as string} />
      ))}
      {/* Kopf */}
      <circle cx={100} cy={60} r={30} fill={C.skin} {...stroke} />
      <path d="M70 56 Q72 26 100 26 Q128 26 130 56 Q118 42 100 42 Q82 42 70 56 Z" fill={C.hair} />
      <rect x={80} y={56} width={17} height={11} rx={3} fill="none" {...stroke} strokeWidth={3} />
      <rect x={103} y={56} width={17} height={11} rx={3} fill="none" {...stroke} strokeWidth={3} />
      <path d="M97 61 L103 61" {...stroke} strokeWidth={2.4} />
      <path d="M90 78 Q100 84 110 78" fill="none" {...stroke} strokeWidth={2.4} />
    </g>
  );
};

const Panel: React.FC<{ n: number; x: number; y: number; w: number; h: number; title: string; text: string; appear: number; children: React.ReactNode }> = ({
  n,
  x,
  y,
  w,
  h,
  title,
  text,
  appear,
  children,
}) => {
  const p = interpolate(appear, [0, 1], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: C.panel,
        border: `3px solid ${C.ink}`,
        borderRadius: 18,
        overflow: "hidden",
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 18, top: 16, width: 50, height: 50, borderRadius: 25, background: C.ink, color: C.paper, fontFamily: "'Anton'", fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {n}
      </div>
      <svg viewBox="0 0 480 400" width={w} height={h - 120} style={{ position: "absolute", left: 0, top: 10 }}>
        {children}
      </svg>
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 18 }}>
        <div style={{ fontFamily: "'Anton'", fontSize: 40, color: C.ink, letterSpacing: "0.01em", lineHeight: 1 }}>{title}</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 21, color: "#4A423B", marginTop: 8, lineHeight: 1.25 }}>{text}</div>
      </div>
    </div>
  );
};

const Cross: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={34} fill="none" stroke={C.red} strokeWidth={7} />
    <path d="M-24 24 L24 -24" stroke={C.red} strokeWidth={7} strokeLinecap="round" />
  </g>
);

export const SafetyCard: React.FC = () => {
  const f = useCurrentFrame();
  const at = (start: number) => interpolate(f, [start, start + 14], [0, 1], { ...clamp, easing: OUT });
  const W = 492;
  const H = 448;
  const X1 = 36;
  const X2 = 552;
  const Y = [316, 790, 1264];

  // Feld-spezifische Animationen
  const airbag = interpolate(f, [70, 92], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const drops = (f % 30) / 30;
  const carX = interpolate(f, [150, 172, 180, 196], [-260, -40, -40, -120], { ...clamp, easing: OUT });
  const boom = interpolate(f, [170, 176, 190], [0, 1, 0], clamp);
  const belt = interpolate(f, [125, 145], [0, 1], { ...clamp, easing: OUT });
  const check = interpolate(f, [205, 225], [0, 1], { ...clamp, easing: OUT });
  const head = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: OUT });

  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {/* Kopf der Karte */}
      <div style={{ position: "absolute", left: 36, right: 36, top: 54, opacity: head }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'Anton'", fontSize: 92, lineHeight: 0.95, color: C.ink }}>SICHERHEITS&shy;HINWEISE</div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 26, letterSpacing: "0.2em", color: C.red, marginTop: 12 }}>SAFETY INSTRUCTIONS</div>
          </div>
        </div>
        <div style={{ height: 3, background: C.ink, marginTop: 22 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter'", fontWeight: 800, fontSize: 24, letterSpacing: "0.12em", color: C.ink, marginTop: 14 }}>
          <span>SALITE TRACKSUIT</span>
          <span>MODELL 550 GSM</span>
          <span>FAHRSCHUL-EDITION</span>
        </div>
      </div>

      <Panel n={1} x={X1} y={Y[0]} w={W} h={H} title="ANLEGEN" text="Hoodie und Jogger vor Fahrtantritt anziehen. Das Set gehört zusammen." appear={at(20)}>
        <g transform="translate(130 4)">
          <TracksuitSVG width={232} />
        </g>
        <path d="M80 70 L80 210" stroke={C.red} strokeWidth={8} strokeLinecap="round" />
        <path d="M58 186 L80 214 L102 186" fill="none" stroke={C.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </Panel>

      <Panel n={2} x={X2} y={Y[0]} w={W} h={H} title="AIRBAG-TASCHE" text="Die extra große Kängurutasche reicht bis zum Bauch. Im Notfall: Hände rein, ruhig bleiben." appear={at(50)}>
        <g transform="translate(130 4)">
          <TracksuitSVG width={232} pocketHighlight={airbag} />
        </g>
        <g transform={`translate(246 ${118 + airbag * 6}) scale(${0.15 + airbag * 0.85})`} opacity={airbag}>
          <ellipse rx={66} ry={38} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
          <path d="M-42 -6 q14 -12 28 0 q14 -12 28 0 q14 -12 28 0" fill="none" stroke={C.line} strokeWidth={3} />
        </g>
      </Panel>

      <Panel n={3} x={X1} y={Y[1]} w={W} h={H} title="KEINE JACKE NÖTIG" text="550 GSM Heavyweight. Hält warm von der ersten bis zur letzten Fahrstunde." appear={at(80)}>
        <g transform="translate(130 4)">
          <TracksuitSVG width={232} />
        </g>
        {[60, 120, 330, 400, 90, 370].map((x, i) => {
          const t = (drops + i * 0.17) % 1;
          return <path key={i} d={`M${x} ${20 + t * 260} l0 18`} stroke={C.sky} strokeWidth={6} strokeLinecap="round" opacity={1 - t * 0.4} />;
        })}
        <g transform="translate(400 300)">
          <path d="M-30 -30 L30 -30 L36 34 L-36 34 Z" fill="#6F5B4B" stroke={C.ink} strokeWidth={3} />
          <path d="M0 -30 L0 34" stroke={C.ink} strokeWidth={3} />
          <Cross x={0} y={2} s={1.25} />
        </g>
      </Panel>

      <Panel n={4} x={X2} y={Y[1]} w={W} h={H} title="GURT ANLEGEN" text="Der Tracksuit ist bequem, aber kein Ersatz für den Sicherheitsgurt. Erst anschnallen, dann losfahren." appear={at(110)}>
        <rect x={120} y={60} width={240} height={250} rx={40} fill="#5B4A3E" stroke={C.ink} strokeWidth={4} />
        <rect x={190} y={22} width={100} height={52} rx={18} fill="#5B4A3E" stroke={C.ink} strokeWidth={4} />
        <g transform="translate(125 52)">
          <TracksuitSVG width={230} showPants={false} />
        </g>
        <path d={`M170 70 L${170 + belt * 150} ${70 + belt * 120}`} stroke="#2B2B2B" strokeWidth={14} strokeLinecap="round" />
        {belt > 0.95 && <rect x={312} y={176} width={26} height={30} rx={5} fill="#BFBFBF" stroke={C.ink} strokeWidth={3} />}
      </Panel>

      <Panel n={5} x={X1} y={Y[2]} w={W} h={H} title="AUFPRALL" text="Bei Kontakt mit dem Fahrschulauto prallt das Auto ab. Der Fit bleibt sitzen." appear={at(140)}>
        <g transform="translate(220 4)">
          <TracksuitSVG width={232} />
        </g>
        <g transform={`translate(${carX + 120} 250)`}>
          <path d="M0 40 L20 0 L120 0 L150 40 L170 44 L170 80 L-6 80 L-6 44 Z" fill={C.car} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <rect x={30} y={8} width={34} height={30} rx={4} fill="#DDEBF5" stroke={C.ink} strokeWidth={3} />
          <rect x={72} y={8} width={40} height={30} rx={4} fill="#DDEBF5" stroke={C.ink} strokeWidth={3} />
          <rect x={44} y={-22} width={56} height={22} rx={4} fill="#FFFFFF" stroke={C.ink} strokeWidth={3} />
          <text x={72} y={-6} textAnchor="middle" fontFamily="Anton" fontSize={16} fill={C.ink}>FAHRSCHULE</text>
          <circle cx={30} cy={82} r={18} fill="#2B2B2B" />
          <circle cx={134} cy={82} r={18} fill="#2B2B2B" />
        </g>
        {boom > 0 && (
          <g transform="translate(232 280)" opacity={boom}>
            <path d="M0 -50 L12 -16 L48 -24 L22 4 L44 34 L8 22 L0 56 L-8 22 L-44 34 L-22 4 L-48 -24 L-12 -16 Z" fill="#FFD23F" stroke={C.ink} strokeWidth={3} />
          </g>
        )}
      </Panel>

      <Panel n={6} x={X2} y={Y[2]} w={W} h={H} title="PRÜFUNG BESTANDEN" text="Mit Stil durch die Prüfung. Passwort für den Drop gibt es per DM." appear={at(185)}>
        <g transform="translate(130 4)">
          <TracksuitSVG width={232} />
        </g>
        <g transform="translate(395 110)">
          <circle r={56} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
          <path d={`M-26 2 L-6 22 L30 -22`} fill="none" stroke="#1E9E5A" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={110} strokeDashoffset={110 * (1 - check)} />
        </g>
      </Panel>

      {/* Fußzeile */}
      <div style={{ position: "absolute", left: 36, right: 36, bottom: 54, opacity: at(220) }}>
        <div style={{ height: 3, background: C.ink, marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 24, color: C.ink }}>BITTE WÄHREND DER GESAMTEN FAHRSTUNDE ANGELEGT LASSEN.</div>
        </div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 18, color: "#7A6F64", marginTop: 8 }}>Satire. Der Tracksuit ersetzt weder Gurt noch Airbag. Bitte nicht nachmachen.</div>
      </div>
    </AbsoluteFill>
  );
};
