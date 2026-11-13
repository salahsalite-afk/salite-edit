import React from "react";
import { AbsoluteFill } from "remotion";
import { S_LOGO_D } from "./logoPath";

// Digitales Mockup des SALITE Tracksuits als Set: Hoodie oben, Jogger unten, flach gelegt, ohne Person.
// Merkmale: oversized und kastig, Kapuze, sehr große und weite Kängurutasche bis zum Bauch,
// Puff-Print-S mit sieben Steinen auf Brust und linkem Bein, weite Jogger mit Stack, 550 GSM Melange.
// Wiederverwendbar: <TracksuitSVG color="grey" /> in jeder Komposition, oder als PNG (Komposition "Mockup").

export type SuitColor = "grey" | "black" | "bordeaux" | "pink";
const PALETTE: Record<SuitColor, { base: string; dark: string; light: string; rib: string }> = {
  grey: { base: "#E2E2E0", dark: "#C3C3C0", light: "#EEEEEC", rib: "#D2D2CF" },
  black: { base: "#232326", dark: "#141416", light: "#36363A", rib: "#1C1C1F" },
  bordeaux: { base: "#7A1E2A", dark: "#5C1520", light: "#93303D", rib: "#6C1A25" },
  pink: { base: "#E8B6B0", dark: "#D19A93", light: "#F3CCC7", rib: "#DDA9A2" },
};

const STONES = ["#2E5BBA", "#E9E9E9", "#C62828", "#C62828", "#E9E9E9", "#2E5BBA", "#C62828"];

// S mit Steinen im Kreis (wie auf den Fotos: blau oben, klar, rot, rot, klar, blau, rot)
const Logo: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const r = size * 0.78;
  const angles = [-95, -150, -20, 175, 35, 135, 80];
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`translate(${-size / 2} ${-size / 2}) scale(${size / 1000})`} filter="url(#puff)">
        <path d={S_LOGO_D} fill="#FFFFFF" />
      </g>
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return (
          <g key={i} transform={`translate(${Math.cos(rad) * r} ${Math.sin(rad) * r})`}>
            <circle r={size * 0.075} fill="#C9A24A" />
            <circle r={size * 0.055} fill={STONES[i]} />
            <circle r={size * 0.02} cx={-size * 0.015} cy={-size * 0.015} fill="#FFFFFF" opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

export const TracksuitSVG: React.FC<{ color?: SuitColor; width?: number; showPants?: boolean; showHoodie?: boolean; pocketHighlight?: number }> = ({
  color = "grey",
  width = 1200,
  showPants = true,
  showHoodie = true,
  pocketHighlight = 0,
}) => {
  const p = PALETTE[color];
  const line = color === "black" ? "#0A0A0B" : "rgba(40,36,32,0.55)";
  const seam = { fill: "none", stroke: line, strokeWidth: 3, strokeLinecap: "round" as const };
  const h = showPants && showHoodie ? 1800 : showHoodie ? 760 : 1040;
  const vbY = showHoodie ? 0 : 760;
  return (
    <svg viewBox={`0 ${vbY} 1200 ${h}`} width={width} height={(width * h) / 1200}>
      <defs>
        {/* Melange-Struktur wie schwerer Sweat */}
        <filter id="heather" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.42  0 0 0 0 0.42  0 0 0 0.55 0" result="g" />
          <feComposite in="g" in2="SourceGraphic" operator="in" result="gc" />
          <feBlend in="SourceGraphic" in2="gc" mode="multiply" />
        </filter>
        <filter id="lay" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#000" floodOpacity="0.22" />
        </filter>
        <filter id="puff" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.25" />
        </filter>
        <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <pattern id="rib" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={p.rib} />
          <rect width="3" height="10" fill={p.dark} opacity="0.5" />
        </pattern>
      </defs>

      {showHoodie && (
        <g filter="url(#lay)">
          <g filter="url(#heather)">
            {/* Kapuze */}
            <path d="M405 175 Q395 20 600 8 Q805 20 795 175 Z" fill={p.base} />
            <path d="M470 170 Q470 70 600 62 Q730 70 730 170 Q680 215 600 218 Q520 215 470 170 Z" fill={p.dark} />
            <path d="M500 168 Q505 100 600 95 Q695 100 700 168 Q660 198 600 200 Q540 198 500 168 Z" fill={p.rib} opacity={0.7} />
            {/* Ärmel, überschnittene Schultern */}
            <path d="M330 175 L215 205 Q150 300 110 560 L100 640 L210 664 L248 560 Q275 420 330 340 Z" fill={p.base} />
            <path d="M870 175 L985 205 Q1050 300 1090 560 L1100 640 L990 664 L952 560 Q925 420 870 340 Z" fill={p.base} />
            <path d="M100 636 L210 660 L200 712 L88 690 Z" fill="url(#rib)" />
            <path d="M1100 636 L990 660 L1000 712 L1112 690 Z" fill="url(#rib)" />
            {/* Körper, kastig */}
            <path d="M330 165 Q600 120 870 165 L880 660 Q600 680 320 660 Z" fill={p.base} />
            {/* Bund */}
            <path d="M320 652 Q600 672 880 652 L882 720 Q600 740 318 720 Z" fill="url(#rib)" />
            {/* sehr große, weite Kängurutasche */}
            <path d="M410 430 L790 430 L835 650 L365 650 Z" fill={p.base} />
          </g>
          <path d="M330 165 Q600 120 870 165 L880 660 Q600 680 320 660 Z" fill="url(#shade)" />
          {/* Nähte */}
          <path d="M330 175 Q328 260 330 340" {...seam} />
          <path d="M870 175 Q872 260 870 340" {...seam} />
          <path d="M405 175 Q395 20 600 8 Q805 20 795 175" {...seam} strokeWidth={2.4} />
          <path d="M470 170 Q470 70 600 62 Q730 70 730 170" {...seam} strokeWidth={2.4} />
          <path d="M410 430 L790 430" {...seam} strokeWidth={3.4} />
          <path d="M410 430 Q370 520 365 650" {...seam} strokeWidth={3.4} />
          <path d="M790 430 Q830 520 835 650" {...seam} strokeWidth={3.4} />
          <path d="M418 444 L782 444" {...seam} strokeWidth={1.6} strokeDasharray="6 7" />
          {/* Tiefe der Tasche: Schatten an den Öffnungen und unter der Kante */}
          <path d="M410 430 Q370 520 365 650 L395 650 Q398 530 430 436 Z" fill="#000" opacity={0.1} />
          <path d="M790 430 Q830 520 835 650 L805 650 Q802 530 770 436 Z" fill="#000" opacity={0.1} />
          <path d="M410 432 L790 432 L786 452 L414 452 Z" fill="#000" opacity={0.06} />
          {/* Falten */}
          <path d="M360 260 Q380 360 372 420" {...seam} strokeWidth={1.4} opacity={0.35} />
          <path d="M845 250 Q828 350 836 410" {...seam} strokeWidth={1.4} opacity={0.35} />
          <path d="M160 420 Q190 470 182 540" {...seam} strokeWidth={1.4} opacity={0.35} />
          <path d="M1040 420 Q1010 470 1018 540" {...seam} strokeWidth={1.4} opacity={0.35} />
          {pocketHighlight > 0 && (
            <path d="M410 430 L790 430 L835 650 L365 650 Z" fill="#E3120B" opacity={0.22 * pocketHighlight} />
          )}
          {/* Puff-Print S mit Steinen auf der linken Brust (vom Betrachter rechts) */}
          <Logo x={715} y={300} size={110} />
        </g>
      )}

      {showPants && (
        <g filter="url(#lay)">
          <g filter="url(#heather)">
            {/* breiter Bund */}
            <path d="M390 800 Q600 788 810 800 L815 880 Q600 868 385 880 Z" fill="url(#rib)" />
            {/* weite gerade Beine */}
            <path d="M385 875 Q600 862 815 875 L860 1700 L640 1716 L600 1110 L560 1716 L340 1700 Z" fill={p.base} />
          </g>
          <path d="M385 875 Q600 862 815 875 L860 1700 L640 1716 L600 1110 L560 1716 L340 1700 Z" fill="url(#shade)" />
          {/* Taschen schräg */}
          <path d="M405 890 Q440 960 452 1060" {...seam} />
          <path d="M795 890 Q760 960 748 1060" {...seam} />
          {/* Schritt und Mittelnaht */}
          <path d="M600 880 L600 1110" {...seam} />
          <path d="M470 1150 Q490 1350 470 1520" {...seam} strokeWidth={1.4} opacity={0.35} />
          <path d="M735 1300 Q752 1420 738 1520" {...seam} strokeWidth={1.4} opacity={0.35} />
          {/* Stack über dem Schuh */}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={`M352 ${1560 + i * 42} q55 22 110 0 q40 -16 92 4`} {...seam} strokeWidth={2.4} opacity={0.75} />
              <path d={`M646 ${1564 + i * 42} q55 22 110 0 q40 -16 92 4`} {...seam} strokeWidth={2.4} opacity={0.75} />
            </g>
          ))}
          {/* S mit Steinen auf dem linken Bein (vom Betrachter rechts) */}
          <Logo x={730} y={1180} size={100} />
        </g>
      )}
    </svg>
  );
};

// PNG-Export mit transparentem Hintergrund: Komposition "Mockup" (eine pro Farbe)
export const Mockup: React.FC<{ color?: SuitColor }> = ({ color = "grey" }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <TracksuitSVG color={color} width={1200} />
  </AbsoluteFill>
);
