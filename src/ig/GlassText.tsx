import React from "react";

// Glas-Schrift: Buchstaben zeigen das Bild dahinter leicht verschwommen und aufgehellt (Milchglas).
// Umsetzung: Ebene mit backdrop-filter, zugeschnitten auf die Buchstabenform (SVG clipPath),
// dazu eine feine helle Kontur. Rote Teile bekommen eine rote Glas-Tönung.

type Part = { t: string; red?: boolean };
type Line = { parts: Part[]; size: number; cy: number };

const W = 1920;
const H = 1080;

const TextLines: React.FC<{ lines: Line[]; show: "white" | "red" | "all" }> = ({ lines, show }) => (
  <>
    {lines.map((l, i) => (
      <text key={i} x={W / 2} y={l.cy} textAnchor="middle" dominantBaseline="central" fontFamily="Anton" fontSize={l.size}>
        {l.parts.map((p, j) => (
          <tspan key={j} visibility={show === "all" || (show === "red") === !!p.red ? "visible" : "hidden"}>
            {p.t}
          </tspan>
        ))}
      </text>
    ))}
  </>
);

export const GlassText: React.FC<{ id: string; lines: Line[]; opacity?: number; scale?: number }> = ({ id, lines, opacity = 1, scale = 1 }) => {
  const hasRed = lines.some((l) => l.parts.some((p) => p.red));
  const layer: React.CSSProperties = { position: "absolute", inset: 0 };
  return (
    <div style={{ ...layer, opacity, transform: `scale(${scale})` }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <clipPath id={`${id}-w`}>
            <TextLines lines={lines} show="white" />
          </clipPath>
          <clipPath id={`${id}-r`}>
            <TextLines lines={lines} show="red" />
          </clipPath>
        </defs>
      </svg>
      {/* weißes Milchglas */}
      <div
        style={{
          ...layer,
          clipPath: `url(#${id}-w)`,
          backdropFilter: "blur(16px) brightness(1.28) saturate(1.05)",
          WebkitBackdropFilter: "blur(16px) brightness(1.28) saturate(1.05)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.18) 100%)",
        }}
      />
      {/* rotes Glas für den Preis */}
      {hasRed && (
        <div
          style={{
            ...layer,
            clipPath: `url(#${id}-r)`,
            backdropFilter: "blur(16px) brightness(1.1)",
            WebkitBackdropFilter: "blur(16px) brightness(1.1)",
            background: "linear-gradient(180deg, rgba(227,18,11,0.62) 0%, rgba(227,18,11,0.48) 100%)",
          }}
        />
      )}
      {/* feine Kontur und weicher Schatten, damit die Schrift lesbar bleibt */}
      <svg width={W} height={H} style={layer}>
        <defs>
          <filter id={`${id}-s`} x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.16" />
          </filter>
        </defs>
        <g fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.6} filter={`url(#${id}-s)`}>
          <TextLines lines={lines} show="all" />
        </g>
      </svg>
    </div>
  );
};
