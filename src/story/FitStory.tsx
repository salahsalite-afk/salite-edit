import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// Fit-Story: ein Look aus allen Perspektiven in einem Bild (Instagram Story 1080x1920).
// Vorne groß die beste Frontansicht, dahinter im Halbkreis Seite und Rücken, nach hinten kleiner und heller.
// Unten dezent die Model-Angaben. Animiert: die Figuren treten von hinten nach vorne auf, letzter Frame = Standbild.
export const FIT_STORY = { fps: 30, width: 1080, height: 1920, frames: 150 };

export type Figure = {
  src: string; // Pfad in public/, freigestellt (scripts/cutout.py)
  x: number; // Mitte der Füße
  feet: number; // y der Fußsohlen
  h: number; // Höhe der Figur in px
  depth: number; // 0 vorne, 1 ganz hinten (Dunst und Reihenfolge)
  flip?: boolean;
};

export type FitStoryProps = { figures: Figure[]; info: string; label?: string };

export const FIT_STORY_DEFAULT: FitStoryProps = {
  figures: [
    { src: "story/fit_2.png", x: 175, feet: 1300, h: 900, depth: 1 },
    { src: "story/fit_6.png", x: 905, feet: 1300, h: 900, depth: 1 },
    { src: "story/fit_4.png", x: 255, feet: 1430, h: 1090, depth: 0.55 },
    { src: "story/fit_5.png", x: 830, feet: 1430, h: 1090, depth: 0.55 },
    { src: "story/fit_3.png", x: 540, feet: 1610, h: 1330, depth: 0 },
  ],
  info: "MODEL 1,86 M · 71 KG · TRÄGT L",
};

let loaded = false;
const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const f = new FontFace("Jost", `url(${staticFile("fonts/jost-latin-500-normal.woff2")}) format('woff2')`, { weight: "500" });
  f.load().then((x) => document.fonts.add(x));
};

const BG = "#ECECEB";

export const FitStory: React.FC<FitStoryProps> = ({ figures, info, label }) => {
  loadFonts();
  const f = useCurrentFrame();
  // von hinten nach vorne auftreten
  const order = [...figures].sort((a, b) => b.depth - a.depth);
  const ease = (s: number, len = 16) => interpolate(f, [s, s + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #F3F3F2 0%, ${BG} 58%, #E2E2E0 74%, #E6E6E4 100%)` }}>
      {/* weicher Horizont wie im Studio */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1180, height: 300, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.035) 50%, rgba(0,0,0,0) 100%)" }} />
      {order.map((fig, i) => {
        const p = ease(6 + i * 9);
        const haze = fig.depth * 0.28;
        const shadowW = fig.h * 0.36;
        return (
          <React.Fragment key={fig.src}>
            {/* Bodenschatten */}
            <div
              style={{
                position: "absolute",
                left: fig.x - shadowW / 2,
                top: fig.feet - fig.h * 0.018,
                width: shadowW,
                height: fig.h * 0.04,
                borderRadius: "50%",
                background: "radial-gradient(ellipse at center, rgba(40,40,40,0.38) 0%, rgba(40,40,40,0.12) 55%, rgba(40,40,40,0) 75%)",
                opacity: p * (1 - fig.depth * 0.35),
              }}
            />
            <div style={{ position: "absolute", left: fig.x, top: fig.feet - fig.h + (1 - p) * 30, height: fig.h, transform: `translateX(-50%)${fig.flip ? " scaleX(-1)" : ""}`, opacity: p }}>
              <Img src={staticFile(fig.src)} style={{ height: fig.h, display: "block" }} />
              {/* Luftperspektive: hintere Figuren heller */}
              {haze > 0 && (
                <Img
                  src={staticFile(fig.src)}
                  style={{ position: "absolute", inset: 0, height: fig.h, filter: `brightness(0) invert(1)`, opacity: haze * 0.55, mixBlendMode: "screen" }}
                />
              )}
            </div>
          </React.Fragment>
        );
      })}
      {label && (
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: "'Jost'", fontWeight: 500, fontSize: 24, letterSpacing: "0.3em", color: "#6B5D4F", opacity: ease(60) }}>
          {label}
        </div>
      )}
      {/* dezente Model-Angaben */}
      <div style={{ position: "absolute", top: 1688, left: 0, right: 0, textAlign: "center", opacity: ease(66, 20) }}>
        <div style={{ display: "inline-block", width: 40, height: 1, background: "#9A9A96", marginBottom: 18 }} />
        <div style={{ fontFamily: "'Jost'", fontWeight: 500, fontSize: 24, letterSpacing: "0.3em", color: "#6E6E6A" }}>{info}</div>
      </div>
    </AbsoluteFill>
  );
};
