import { AbsoluteFill, Audio, continueRender, delayRender, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { PHONE, PhoneOutro } from "./PhoneOutro";

// Runway-Film Vollbild 16:9, ohne Titel und ohne Tanktop-Look, Musik ungeschnitten.
// Version 1 (clean): kein Text im Film, am Ende Handy-Outro mit dezenten Angebots-Infos.
// Version 2 (freeze): zusätzlich am Anfang ein Standbild des grauen Tracksuits mit feinen Pfeilen und Preisen.
export const RC = { fps: 25, width: 1920, height: 1080, frames: 938 };
const SRC = "ig/source.mov";
const FREEZE_AT = 22; // Quell-Frame: grauer Tracksuit frontal, bester Fit
const FREEZE_LEN = 45; // 1,8 s

type Seg = { src: number; len: number; freeze?: boolean };
const segments = (freeze: boolean): Seg[] => [
  ...(freeze
    ? [{ src: 0, len: FREEZE_AT + 1 }, { src: FREEZE_AT, len: FREEZE_LEN, freeze: true }, { src: FREEZE_AT + 1, len: 51 - FREEZE_AT - 1 }]
    : [{ src: 0, len: 51 }]),
  { src: 91, len: 602 - 91 }, // nach dem Titel bis Ende Look 3
  { src: 775, len: 163 }, // Look 5 und Endkarte
];

let loaded = false;
const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("Fonts");
  const faces = [
    new FontFace("Anton", `url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2')`),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format('woff2')`, { weight: "600" }),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-700-normal.woff2")}) format('woff2')`, { weight: "700" }),
  ];
  Promise.all(faces.map((f) => f.load().then((x) => document.fonts.add(x)))).then(() => continueRender(h), () => continueRender(h));
};
loadFonts();

const full: React.CSSProperties = { width: "100%", height: "100%" };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SHADOW = "0 1px 10px rgba(0,0,0,0.35)";
const label = (size: number, weight = 600): React.CSSProperties => ({
  fontFamily: "'Inter', sans-serif",
  fontWeight: weight,
  fontSize: size,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#FFFFFF",
  textShadow: SHADOW,
});

// Feiner Hinweis-Pfeil wie in einem Lookbook: Punkt auf dem Kleidungsstück, Linie zum Text
const Callout: React.FC<{ from: [number, number]; elbow: [number, number]; to: [number, number] }> = ({ from, elbow, to }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <g style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.35))" }}>
      <polyline points={`${from.join(",")} ${elbow.join(",")} ${to.join(",")}`} fill="none" stroke="#FFFFFF" strokeWidth={2} />
      <circle cx={from[0]} cy={from[1]} r={6} fill="#FFFFFF" />
    </g>
  </svg>
);

export const RunwayClean: React.FC<{ freeze?: boolean }> = ({ freeze = false }) => {
  const frame = useCurrentFrame();
  const segs = segments(freeze);
  let t = 0;
  const placed = segs.map((s) => {
    const p = { ...s, at: t };
    t += s.len;
    return p;
  });
  const videoEnd = t; // danach steht das letzte Bild der Endkarte
  const last = placed[placed.length - 1];
  const endCard = last.at + 81; // Endkarte beginnt 3,24 s nach Start von Look 5
  const phoneStart = endCard + 17;
  const freezeSeg = placed.find((p) => p.freeze);
  const info = (d: number) => interpolate(frame, [phoneStart + d, phoneStart + d + 20], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile(SRC)} />

      {placed.map((p, i) => (
        <Sequence key={i} from={p.at} durationInFrames={p.len}>
          {p.freeze ? (
            <Freeze frame={0}>
              <OffthreadVideo src={staticFile(SRC)} startFrom={p.src} muted toneMapped={false} style={full} />
            </Freeze>
          ) : (
            <OffthreadVideo src={staticFile(SRC)} startFrom={p.src} muted toneMapped={false} style={full} />
          )}
        </Sequence>
      ))}
      <Sequence from={videoEnd}>
        <Freeze frame={last.len - 1}>
          <OffthreadVideo src={staticFile(SRC)} startFrom={last.src} muted toneMapped={false} style={full} />
        </Freeze>
      </Sequence>

      {/* Version 2: Standbild mit Pfeilen und Preisen, integriert ins Bild */}
      {freezeSeg && frame >= freezeSeg.at && frame < freezeSeg.at + freezeSeg.len && (
        <AbsoluteFill style={{ opacity: interpolate(frame, [freezeSeg.at, freezeSeg.at + 3, freezeSeg.at + freezeSeg.len - 3, freezeSeg.at + freezeSeg.len], [0, 1, 1, 0], clamp) }}>
          <div style={{ position: "absolute", left: 250, top: 150 }}>
            <div style={label(20)}>Black Friday Deal</div>
            <div style={{ ...label(46, 700), letterSpacing: "0.06em", marginTop: 10 }}>69 € Trackie</div>
          </div>
          {/* Hoodie */}
          <Callout from={[1040, 520]} elbow={[1240, 400]} to={[1360, 400]} />
          <div style={{ position: "absolute", left: 1376, top: 400, transform: "translateY(-50%)" }}>
            <div style={label(18)}>Hoodie</div>
            <div style={{ ...label(34, 700), letterSpacing: "0.06em", marginTop: 4 }}>39 €</div>
          </div>
          {/* Jogger */}
          <Callout from={[905, 880]} elbow={[660, 820]} to={[560, 820]} />
          <div style={{ position: "absolute", right: 1920 - 544, top: 820, transform: "translateY(-50%)", textAlign: "right" }}>
            <div style={label(18)}>Jogger</div>
            <div style={{ ...label(34, 700), letterSpacing: "0.06em", marginTop: 4 }}>30 €</div>
          </div>
        </AbsoluteFill>
      )}
      {freezeSeg && (
        <Sequence from={freezeSeg.at} durationInFrames={8} layout="none">
          <Audio src={staticFile("sfx/click.wav")} volume={0.35} />
        </Sequence>
      )}

      {/* Ende: Handy-Outro und dezente Angebots-Infos */}
      <Sequence from={phoneStart} durationInFrames={PHONE.len} layout="none">
        <PhoneOutro />
      </Sequence>
      {frame >= phoneStart && (
        <>
          <div style={{ position: "absolute", right: 1920 - 700, top: 540, transform: "translateY(-50%)", textAlign: "right", opacity: info(10) }}>
            <div style={label(18)}>Access</div>
            <div style={{ ...label(30, 700), marginTop: 8 }}>Nur mit Passwort</div>
          </div>
          <div style={{ position: "absolute", left: 1220, top: 540, transform: "translateY(-50%)", opacity: info(18) }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 76, lineHeight: 1, color: "#FFFFFF", textShadow: SHADOW }}>69 € TRACKIE</div>
            <div style={{ ...label(22, 700), marginTop: 12 }}>Up to 80% Rabatt</div>
          </div>
          <div style={{ position: "absolute", bottom: 46, width: "100%", textAlign: "center", opacity: info(28) * 0.8 }}>
            <div style={label(14)}>Biggest Sale in Germany</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
