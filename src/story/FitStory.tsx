import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import FIGS from "../../public/story/figs.json";

// Fit-Story: ein Look aus allen Perspektiven in einer Instagram Story (1080x1920).
// Figuren aus scripts/fit_figures.py: freigestellt MIT echtem Bodenschatten aus dem Foto, sie stehen auf dem Boden.
// Freie Anordnung mit Tiefe: groß vorne, links und rechts, klein im Hintergrund.
// Unten eine dezente Box mit den Model-Angaben.
// Video: die Figuren wechseln mit jedem Swipe einen Platz weiter, dazu ein leiser Swipe-Sound.
export const FIT_STORY = { fps: 30, width: 1080, height: 1920 };
export const SWIPE_EVERY = 33; // Frames zwischen zwei Swipes
export const SWIPE_LEN = 14; // Dauer eines Platzwechsels
export const HOLD = 30; // Standbild am Anfang

type Meta = { w: number; h: number; top: number; bottom: number; cx: number };
const META = FIGS as Record<string, Meta>;

// Plätze im Bild: x = Mitte der Füße, feet = Fußsohle, h = Körperhöhe, depth 0 vorne bis 1 hinten
export type Slot = { x: number; feet: number; h: number; depth: number };
export const SLOTS: Slot[] = [
  { x: 545, feet: 1640, h: 1250, depth: 0 }, // vorne Mitte
  { x: 860, feet: 1470, h: 1010, depth: 0.5 }, // rechts
  { x: 930, feet: 1250, h: 640, depth: 1 }, // hinten rechts, klein
  { x: 380, feet: 1265, h: 760, depth: 0.9 }, // hinten links, klein
  { x: 205, feet: 1510, h: 1060, depth: 0.45 }, // links
];

export type FitStoryProps = { figures: string[]; info: string; animate: boolean };
export const FIT_STORY_DEFAULT: FitStoryProps = {
  // Reihenfolge = Startplatz (Slot 0 bis 4)
  figures: ["fig_3", "fig_5", "fig_6", "fig_2", "fig_4"],
  info: "Model: 186 cm | 71 kg | Size L",
  animate: false,
};
export const fitStoryFrames = (n: number) => HOLD + n * SWIPE_EVERY + HOLD;

let loaded = false;
const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const f = new FontFace("Inter", `url(${staticFile("fonts/inter-latin-700-normal.woff2")}) format('woff2')`, { weight: "700" });
  f.load().then((x) => document.fonts.add(x));
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const FitStory: React.FC<FitStoryProps> = ({ figures, info, animate }) => {
  loadFonts();
  const f = useCurrentFrame();
  const n = figures.length;
  // wie viele Swipes sind passiert, und wie weit ist der aktuelle
  const since = f - HOLD;
  const done = animate && since >= 0 ? Math.min(n, Math.floor(since / SWIPE_EVERY)) : 0;
  const local = animate && since >= 0 && done < n ? since - done * SWIPE_EVERY : SWIPE_LEN;
  const t = interpolate(local, [0, SWIPE_LEN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const moving = animate && since >= 0 && done < n;

  const placed = figures.map((name, k) => {
    const from = SLOTS[(k + done) % n];
    const to = SLOTS[(k + done + 1) % n];
    const s = moving ? { x: lerp(from.x, to.x, t), feet: lerp(from.feet, to.feet, t), h: lerp(from.h, to.h, t), depth: lerp(from.depth, to.depth, t) } : from;
    return { name, ...s };
  });
  placed.sort((a, b) => a.feet - b.feet); // hinten zuerst zeichnen

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #F2F2F1 0%, #EDEDEC 60%, #E8E8E6 100%)" }}>
      {placed.map((p) => {
        const m = META[p.name];
        const dispH = p.h / (m.bottom - m.top);
        const dispW = (dispH * m.w) / m.h;
        return (
          <div key={p.name} style={{ position: "absolute", left: p.x - m.cx * dispW, top: p.feet - m.bottom * dispH, width: dispW, height: dispH }}>
            <Img src={staticFile(`story/${p.name}.png`)} style={{ width: dispW, height: dispH, display: "block" }} />
            {/* leichte Luftperspektive für hintere Figuren */}
            {p.depth > 0.05 && (
              <Img
                src={staticFile(`story/${p.name}.png`)}
                style={{ position: "absolute", inset: 0, width: dispW, height: dispH, filter: "brightness(0) invert(1)", opacity: p.depth * 0.14 }}
              />
            )}
          </div>
        );
      })}

      {/* dezente Box mit den Angaben */}
      <div style={{ position: "absolute", top: 1712, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(0,0,0,0.05)", padding: "16px 30px", fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, color: "#1A1A1A", letterSpacing: "-0.005em" }}>{info}</div>
      </div>

      {animate &&
        Array.from({ length: n }, (_, i) => (
          <Sequence key={i} from={HOLD + i * SWIPE_EVERY} durationInFrames={20}>
            <Audio src={staticFile("sfx/whoosh_soft.wav")} volume={0.35} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
