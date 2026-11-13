import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import "./SafetyCard"; // lädt Anton und Inter

// Sicherheitskarte für den Beamer (Fahrschule trifft Flugzeug), 16:9.
// Wird im Video an die Wand projiziert, der Fahrlehrer erklärt Feld für Feld.
// Zeitpunkte pro Feld über die Prop "starts" (Frames), damit sie zur Stimme passen.
export const BEAMER = { fps: 30, width: 1920, height: 1080, frames: 720 };
export const BEAMER_STARTS = [60, 150, 240, 330, 420, 510];

const C = {
  paper: "#F4EEDF",
  panel: "#FBF8F0",
  ink: "#1E1A17",
  sub: "#4A423B",
  muted: "#7A6F64",
  line: "#CFC4AE",
  red: "#E3120B",
  sky: "#5E9BCB",
  snow: "#FFFFFF",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const SET = staticFile("card/set_full.png"); // 523x1222
const HOOD = staticFile("card/set_hoodie.png"); // 521x536

const Panel: React.FC<{
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  text: string;
  t: number; // Frames seit Erscheinen
  active: boolean;
  children: React.ReactNode;
}> = ({ n, x, y, w, h, title, text, t, active, children }) => {
  const p = interpolate(t, [0, 16], [0, 1], { ...clamp, easing: OUT });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: C.panel,
        border: `3px solid ${active ? C.red : C.ink}`,
        boxShadow: active ? `0 0 0 3px ${C.red}` : "none",
        borderRadius: 16,
        overflow: "hidden",
        opacity: p,
        transform: `translateY(${(1 - p) * 26}px)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, bottom: 118, overflow: "hidden" }}>{children}</div>
      <div
        style={{
          position: "absolute",
          left: 14,
          top: 12,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: active ? C.red : C.ink,
          color: C.paper,
          fontFamily: "'Anton'",
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 14 }}>
        <div style={{ fontFamily: "'Anton'", fontSize: 38, color: C.ink, lineHeight: 1 }}>{title}</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 19, color: C.sub, marginTop: 7, lineHeight: 1.25 }}>{text}</div>
      </div>
    </div>
  );
};

// Hoodie im Feld, mittig unten im Bildbereich
const Hood: React.FC<{ h: number; cx: number; top: number; children?: React.ReactNode }> = ({ h, cx, top, children }) => {
  const w = (h * 521) / 536;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top, width: w, height: h }}>
      <Img src={HOOD} style={{ width: w, height: h }} />
      {children}
    </div>
  );
};

const Cross: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-40 -40 80 80" style={{ position: "absolute", inset: 0 }}>
    <circle r={34} fill="none" stroke={C.red} strokeWidth={6} />
    <path d="M-24 24 L24 -24" stroke={C.red} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

export const SafetyBeamer: React.FC<{ starts?: number[] }> = ({ starts = BEAMER_STARTS }) => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: OUT });
  const hero = interpolate(f, [12, 30], [0, 1], { ...clamp, easing: OUT });
  const footStart = starts[5] + 90;
  const foot = interpolate(f, [footStart, footStart + 16], [0, 1], { ...clamp, easing: OUT });
  const T = starts.map((s) => f - s);
  const activeIdx = f < footStart ? starts.reduce((acc, s, i) => (f >= s ? i : acc), -1) : -1;

  // Raster rechts
  const PW = 416;
  const PH = 392;
  const GX = [588, 1024, 1460];
  const GY = [206, 618];
  const stageH = PH - 118;

  // 1 Airbag: bläht sich aus der Tasche auf
  const bag = interpolate(T[0], [20, 34], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  // 2 Regen prallt ab
  const rain = (i: number) => ((T[1] + i * 11) % 44) / 44;
  // 3 Kälte: Schnee und Thermometer
  const thermo = interpolate(T[2], [14, 50], [1, 0.12], { ...clamp, easing: OUT });
  // 4 Abpraller
  const shot = (i: number) => ((Math.max(0, T[3] - 16) + i * 18) % 54) / 54;
  // 5 Stempel
  const stamp = interpolate(T[4], [18, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // 6 Bordkarte
  const pass = interpolate(T[5], [10, 30], [0, 1], { ...clamp, easing: OUT });

  // Hero mit Hinweislinien
  const HX = 40;
  const HY = 206;
  const HW = 524;
  const HH = 804;
  const sh = 700;
  const sw = (sh * 523) / 1222;
  const sx = HX + 34;
  const sy = HY + 52;
  const callouts: { label: string; nx: number; ny: number; ty: number; at: number }[] = [
    { label: "PUFF-PRINT S MIT 7 STEINEN", nx: 0.66, ny: 0.15, ty: 120, at: 34 },
    { label: "AIRBAG-TASCHE", nx: 0.56, ny: 0.3, ty: 250, at: 42 },
    { label: "550 GSM HEAVYWEIGHT", nx: 0.75, ny: 0.48, ty: 380, at: 50 },
    { label: "LOGO AM BEIN", nx: 0.71, ny: 0.585, ty: 510, at: 58 },
    { label: "STACK ÜBER DEM SCHUH", nx: 0.7, ny: 0.955, ty: 690, at: 66 },
  ];
  const tx = sx + sw + 40;

  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {/* Kopf */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 30, opacity: head }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'Anton'", fontSize: 84, lineHeight: 0.95, color: C.ink }}>SICHERHEITSHINWEISE</div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 22, letterSpacing: "0.22em", color: C.red, marginTop: 10 }}>
              SAFETY INSTRUCTIONS · VOR FAHRTANTRITT LESEN
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                background: C.ink,
                color: C.paper,
                fontFamily: "'Anton'",
                fontSize: 40,
                letterSpacing: "0.06em",
                padding: "8px 22px 6px",
                borderRadius: 8,
              }}
            >
              FIRST CLASS ONLY
            </div>
            <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 20, letterSpacing: "0.16em", color: C.ink, marginTop: 10 }}>
              SALITE AIR · FAHRSCHUL-EDITION
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: C.ink, marginTop: 16 }} />
      </div>

      {/* Hero: das Set mit Hinweislinien */}
      <div
        style={{
          position: "absolute",
          left: HX,
          top: HY,
          width: HW,
          height: HH,
          background: C.panel,
          border: `3px solid ${C.ink}`,
          borderRadius: 16,
          opacity: hero,
        }}
      >
        <div style={{ position: "absolute", left: 18, top: 14, fontFamily: "'Inter'", fontWeight: 800, fontSize: 18, letterSpacing: "0.16em", color: C.muted }}>
          IHRE AUSRÜSTUNG
        </div>
        <div style={{ position: "absolute", left: 18, bottom: 14, right: 18, fontFamily: "'Anton'", fontSize: 30, color: C.ink, lineHeight: 1 }}>
          SALITE TRACKSUIT · GRAU
        </div>
      </div>
      <Img src={SET} style={{ position: "absolute", left: sx, top: sy, width: sw, height: sh, opacity: hero }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {callouts.map((c, i) => {
          const p = interpolate(f, [c.at, c.at + 14], [0, 1], { ...clamp, easing: OUT });
          const x0 = sx + c.nx * sw;
          const y0 = sy + c.ny * sh;
          const y1 = HY + c.ty;
          const len = Math.hypot(tx - 10 - x0, y1 - y0) + 12;
          return (
            <g key={i} opacity={p > 0 ? 1 : 0}>
              <circle cx={x0} cy={y0} r={7} fill={C.red} stroke={C.panel} strokeWidth={3} opacity={p} />
              <polyline
                points={`${x0},${y0} ${tx - 10},${y1} ${tx - 2},${y1}`}
                fill="none"
                stroke={C.ink}
                strokeWidth={2.4}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - p)}
              />
            </g>
          );
        })}
      </svg>
      {callouts.map((c, i) => {
        const p = interpolate(f, [c.at + 8, c.at + 20], [0, 1], { ...clamp, easing: OUT });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: tx,
              top: HY + c.ty - 13,
              width: HX + HW - tx - 14,
              fontFamily: "'Inter'",
              fontWeight: 800,
              fontSize: 17,
              lineHeight: 1.15,
              letterSpacing: "0.04em",
              color: C.ink,
              opacity: p,
            }}
          >
            {c.label}
          </div>
        );
      })}

      {/* 1 Airbag */}
      <Panel n={1} x={GX[0]} y={GY[0]} w={PW} h={PH} t={T[0]} active={activeIdx === 0} title="AIRBAG-TASCHE" text="Die extra große Kängurutasche ist dicht. Bei Vollbremsung: Hände rein, ruhig atmen.">
        <Hood h={250} cx={PW / 2} top={18}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "73%",
              width: 168,
              height: 96,
              marginLeft: -84,
              marginTop: -48,
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 40% 35%, #FFFFFF 0%, #F4F4F2 55%, #DADAD6 100%)",
              border: `3px solid ${C.ink}`,
              transform: `scale(${0.1 + bag * 0.9})`,
              opacity: bag,
            }}
          />
        </Hood>
      </Panel>

      {/* 2 Wasserdicht */}
      <Panel n={2} x={GX[1]} y={GY[0]} w={PW} h={PH} t={T[1]} active={activeIdx === 1} title="WASSERDICHT" text="Regen perlt einfach ab. Fahrschüler bleiben trocken, auch im offenen Cabrio.">
        <Hood h={250} cx={PW / 2} top={18} />
        <svg width={PW} height={stageH} style={{ position: "absolute", inset: 0 }}>
          {[70, 110, 150, 205, 260, 300, 345].map((x, i) => {
            const t = rain(i);
            const hit = x > 110 && x < 310 ? 70 + Math.abs(x - 208) * 0.5 : 230;
            const fall = t < 0.6;
            const y = fall ? -20 + (t / 0.6) * (hit + 20) : hit - Math.sin(((t - 0.6) / 0.4) * Math.PI) * 26;
            const dx = fall ? 0 : ((t - 0.6) / 0.4) * (x < 208 ? -34 : 34);
            return fall ? (
              <path key={i} d={`M${x} ${y} l0 18`} stroke={C.sky} strokeWidth={5} strokeLinecap="round" opacity={T[1] > 8 ? 0.9 : 0} />
            ) : (
              <circle key={i} cx={x + dx} cy={y} r={4} fill={C.sky} opacity={T[1] > 8 ? 1 - (t - 0.6) / 0.4 : 0} />
            );
          })}
        </svg>
      </Panel>

      {/* 3 Kältedicht */}
      <Panel n={3} x={GX[2]} y={GY[0]} w={PW} h={PH} t={T[2]} active={activeIdx === 2} title="KEINE WINTERJACKE NÖTIG" text="550 GSM Heavyweight. Kältedicht von der ersten bis zur letzten Fahrstunde.">
        <Hood h={232} cx={PW / 2 - 40} top={28} />
        <svg width={PW} height={stageH} style={{ position: "absolute", inset: 0 }}>
          {[40, 95, 180, 250, 330, 60, 290].map((x, i) => {
            const t = ((Math.max(0, T[2]) + i * 13) % 80) / 80;
            const y = -10 + t * (stageH + 20);
            return (
              <text key={i} x={x + Math.sin(t * 6 + i) * 8} y={y} fontSize={22} fill={C.sky} opacity={T[2] > 6 ? 0.85 : 0} fontFamily="Inter">
                ✱
              </text>
            );
          })}
          {/* Thermometer */}
          <g transform="translate(352 40)">
            <rect x={-12} y={0} width={24} height={170} rx={12} fill="#FFFFFF" stroke={C.ink} strokeWidth={3} />
            <rect x={-6} y={10 + 150 * (1 - thermo)} width={12} height={150 * thermo} rx={6} fill={C.sky} />
            <circle cx={0} cy={192} r={22} fill={C.sky} stroke={C.ink} strokeWidth={3} />
          </g>
        </svg>
        {/* Winterjacke, durchgestrichen */}
        <div style={{ position: "absolute", left: 18, top: 180, width: 84, height: 84, opacity: interpolate(T[2], [40, 54], [0, 1], clamp) }}>
          <svg width={84} height={84} viewBox="-40 -40 80 80" style={{ position: "absolute", inset: 0 }}>
            <path d="M-20 -22 L20 -22 L28 26 L-28 26 Z" fill="#6F5B4B" stroke={C.ink} strokeWidth={3} />
            <path d="M0 -22 L0 26" stroke={C.ink} strokeWidth={3} />
            <path d="M-20 -22 Q0 -34 20 -22" fill="none" stroke={C.ink} strokeWidth={3} />
          </svg>
          <Cross size={84} />
        </div>
      </Panel>

      {/* 4 Bulletproof */}
      <Panel n={4} x={GX[0]} y={GY[1]} w={PW} h={PH} t={T[3]} active={activeIdx === 3} title="BULLETPROOF*" text="Nichts kommt durch. Auch keine Kritik vom Fahrlehrer.">
        <Hood h={250} cx={PW / 2} top={18} />
        <svg width={PW} height={stageH} style={{ position: "absolute", inset: 0 }}>
          {[
            { y: 110, from: -1 },
            { y: 170, from: 1 },
            { y: 140, from: -1 },
          ].map((s, i) => {
            const t = shot(i);
            const edge = PW / 2 + s.from * 98;
            const start = s.from < 0 ? -30 : PW + 30;
            const inbound = t < 0.5;
            const x = inbound ? start + (edge - start) * (t / 0.5) : edge + s.from * ((t - 0.5) / 0.5) * 120;
            const y = inbound ? s.y : s.y - ((t - 0.5) / 0.5) * 70;
            const flash = t > 0.48 && t < 0.62;
            return (
              <g key={i} opacity={T[3] > 14 ? 1 : 0}>
                <rect x={x - 17} y={y - 7} width={34} height={14} rx={7} fill="#9A8F84" stroke={C.ink} strokeWidth={2} transform={`rotate(${inbound ? 0 : s.from * -30} ${x} ${y})`} />
                {flash && (
                  <g transform={`translate(${edge} ${s.y})`}>
                    <path d="M0 -20 L5 -6 L20 -9 L9 2 L17 14 L3 8 L0 22 L-3 8 L-17 14 L-9 2 L-20 -9 L-5 -6 Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </Panel>

      {/* 5 Letzte Ausgabe */}
      <Panel n={5} x={GX[1]} y={GY[1]} w={PW} h={PH} t={T[4]} active={activeIdx === 4} title="LAST CALL" text="Letzte Chance. Diese Edition gibt es nur dieses eine Mal.">
        <Hood h={250} cx={PW / 2} top={18} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 132,
            transform: `translate(-50%, -50%) rotate(-12deg) scale(${2.2 - stamp * 1.2})`,
            opacity: stamp,
            border: `5px solid ${C.red}`,
            borderRadius: 10,
            padding: "8px 18px 4px",
            color: C.red,
            fontFamily: "'Anton'",
            fontSize: 44,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            background: "rgba(251,248,240,0.82)",
          }}
        >
          LETZTE AUSGABE
        </div>
      </Panel>

      {/* 6 Nur First Class: Bordkarte */}
      <Panel n={6} x={GX[2]} y={GY[1]} w={PW} h={PH} t={T[5]} active={activeIdx === 5} title="NUR FIRST CLASS" text="Einstieg nur mit Passwort. Kommentiere: Ich brauch ein Passwort.">
        <div
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            top: 70,
            height: 178,
            background: "#FFFFFF",
            border: `3px solid ${C.ink}`,
            borderRadius: 12,
            transform: `translateY(${(1 - pass) * 120}px)`,
            opacity: pass,
            overflow: "hidden",
          }}
        >
          <div style={{ background: C.ink, color: C.paper, fontFamily: "'Inter'", fontWeight: 800, fontSize: 15, letterSpacing: "0.18em", padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
            <span>SALITE AIR</span>
            <span>BOARDING PASS</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 14px 0", rowGap: 10 }}>
            {[
              ["KLASSE", "FIRST"],
              ["SITZ", "1A"],
              ["DATUM", "27.11."],
              ["ZIEL", "DROP"],
              ["GATE", "PASSWORT"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 12, letterSpacing: "0.16em", color: C.muted }}>{k}</div>
                <div style={{ fontFamily: "'Anton'", fontSize: 28, color: k === "KLASSE" ? C.red : C.ink, lineHeight: 1.05 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", right: 14, bottom: 12, display: "flex", gap: 3 }}>
            {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2].map((w, i) => (
              <div key={i} style={{ width: w * 2, height: 34, background: C.ink }} />
            ))}
          </div>
        </div>
      </Panel>

      {/* Fuß */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 22, display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: foot }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: 22, letterSpacing: "0.04em", color: C.ink }}>BITTE WÄHREND DER GESAMTEN FAHRSTUNDE ANGELEGT LASSEN.</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 15, color: C.muted }}>*Satire. Ersetzt weder Gurt noch Airbag noch Schutzweste.</div>
      </div>
    </AbsoluteFill>
  );
};
