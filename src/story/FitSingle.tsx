import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import FIGS from "../../public/story/figs.json";
import { loadFonts, PriceTag, Tag } from "./LineupPan";

// Instagram Story mit EINEM Look: Model auf kleinem bordeauxrotem Leoparden-Teppich (Cartier-Vibe, feine Goldkante),
// langsame Kamerafahrt hinein, Preisschilder erscheinen, oben dezent BLACK FRIDAY, unten Model-Box.
export const FIT_SINGLE = { fps: 30, width: 1080, height: 1920, frames: 180 };
type Meta = { w: number; h: number; top: number; bottom: number; cx: number };
const META = FIGS as Record<string, Meta>;

export type FitSingleProps = { figure: string; tags: Tag[]; info: string; backdrop?: "studio" | "curtain" | "silver" };
export const FIT_SINGLE_DEFAULT: FitSingleProps = {
  figure: "fig_3",
  tags: [
    { label: "HOODIE", old: "80 €", now: "39 €", at: 0.3, side: -1 },
    { label: "JOGGER", old: "70 €", now: "30 €", at: 0.66, side: 1 },
  ],
  info: "Model: 186 cm | 71 kg | Size L",
};

const BODY = 1140;
const FEET = 1530;
const X = 540;

export const FitSingle: React.FC<FitSingleProps> = ({ figure, tags, info, backdrop = "studio" }) => {
  const dark = backdrop === "curtain";
  loadFonts();
  const f = useCurrentFrame();
  const m = META[figure];
  const dispH = BODY / (m.bottom - m.top);
  const dispW = (dispH * m.w) / m.h;
  // langsames Hineinfahren über die ganze Länge, Mittelpunkt auf Brusthöhe
  const s = interpolate(f, [0, FIT_SINGLE.frames], [1, 1.07], { easing: Easing.inOut(Easing.sin) });
  const PY = 1000;
  const tagAt = [24, 38];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #F6F6F5 0%, #F1F1F0 62%, #EAEAE8 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: `540px ${PY}px` }}>
        {backdrop !== "studio" && <Img src={staticFile(`story/bg_${backdrop}.jpg`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />}
        <Img src={staticFile("story/rug_oval.png")} style={{ position: "absolute", left: X - 430, top: FEET - 150, width: 860 }} />
        <Img src={staticFile(`story/${figure}.png`)} style={{ position: "absolute", left: X - m.cx * dispW, top: FEET - m.bottom * dispH, width: dispW, height: dispH }} />
        {tags.map((t, j) => {
          const p = interpolate(f, [tagAt[j] ?? 50, (tagAt[j] ?? 50) + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
          return <PriceTag key={j} tag={t} ax={X + t.side * 95} ay={FEET - BODY + t.at * BODY} p={p} dark={dark} />;
        })}
      </div>
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: "'Anton'", fontSize: 60, letterSpacing: "0.06em", color: dark ? "#F2ECE1" : "#161616", lineHeight: 1 }}>BLACK FRIDAY</div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 18, letterSpacing: "0.34em", color: dark ? "rgba(242,236,225,0.75)" : "#8A8A86", marginTop: 14 }}>ONLY WITH PASSWORD</div>
      </div>
      <div style={{ position: "absolute", top: 1726, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(0,0,0,0.05)", padding: "15px 28px", fontFamily: "'Inter'", fontWeight: 700, fontSize: 28, color: "#1A1A1A" }}>{info}</div>
      </div>
      {tagAt.slice(0, tags.length).map((t, j) => (
        <Sequence key={j} from={t} durationInFrames={10}>
          <Audio src={staticFile("sfx/tick.wav")} volume={0.18} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
