import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// Instagram-Story vom Shooting (grauer 550 GSM Trackie, Fellmütze): Besucher am Ende der Customer Journey abholen.
// V2: nur ein dezenter Balken oben (80 % der Passwörter weg, Angabe des Kunden), sonst nichts. Ton unverändert.
export const IGS = { fps: 30, width: 1080, height: 1920 };
const f = (s: number) => Math.round(s * IGS.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const ease = (t: number, a: number, len = 0.35, e = OUT) => interpolate(t, [a, a + len], [0, 1], { ...clamp, easing: e });
export const IGS_TOTAL = 6.66;
export const IGS_FRAMES = f(IGS_TOTAL);

// V2 (Kunde: dezent, exklusiv, kein Preis): nur oben ein schlichter Balken, 80 % der Passwörter weg, die ganze Zeit
const YELLOW = "#F2C94C";
const Slot: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(t, 0.2, 0.6);
  const fill = 0.8 * interpolate(t, [0.4, 1.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p }}>
      <div style={{ width: 520, background: "rgba(12,12,12,0.55)", borderRadius: 18, padding: "12px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter'", fontWeight: 600, fontSize: 17, letterSpacing: "0.22em", color: "rgba(255,255,255,0.92)", marginBottom: 9 }}>
          <span>PASSWÖRTER</span>
          <span style={{ color: YELLOW }}>{Math.round(fill * 100)} % WEG</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.22)" }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 3, background: YELLOW }} />
        </div>
      </div>
    </div>
  );
};

export const IgStoryShoot: React.FC = () => {
  loadFonts();
  const fr = useCurrentFrame();
  const t = fr / IGS.fps;
  // langsam zum Model hineinfahren (max. 1,15, kaum Hochskalierung)
  const k = interpolate(t, [0, IGS_TOTAL], [1.0, 1.15], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const fx = 580;
  const fy = 840;
  const fit = (v: number, size: number) => Math.min(0, Math.max(size - size * k, v));
  const x = fit(fx * (1 - k), 1080);
  const y = fit(fy * (1 - k), 1920);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${k})`, filter: "contrast(1.04) saturate(1.03)" }}>
        <OffthreadVideo src={staticFile("igs/clip.mp4")} muted style={{ width: 1080, height: 1920 }} />
      </div>
      <Slot t={t} />
    </AbsoluteFill>
  );
};
