import { AbsoluteFill, Audio, continueRender, delayRender, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { PHONE, PhoneOutro } from "./PhoneOutro";
import track from "./track_grey.json";

// Runway-Film Vollbild 16:9, ohne Titel und ohne Tanktop-Look, Musik ungeschnitten.
// Version 1 (clean): kein Text im Film, am Ende Handy-Outro mit dezenten Angebots-Infos.
// Version 2 (freeze): zusätzlich am Anfang ein Standbild des grauen Tracksuits mit feinen Pfeilen und Preisen.
export const RC = { fps: 25, width: 1920, height: 1080, frames: 938 };
// Zeitfenster des Standbilds in Sekunden (für den dunklen, leiseren Musik-Fokus im Mix)
export const FOCUS_SEC = [9 / 25, (9 + 55) / 25];
const SRC = "ig/source.mov";
const FREEZE_LEN = 55; // 2,2 s Standbild (Quell-Frame 5: ganzer Fit mit Schuhen und Stack)
const SLOW_IN = 9; // Zeitlupe in das Standbild (Quelle 0 bis 5, interpoliert)
const SLOW_OUT = 14; // Zeitlupe aus dem Standbild (Quelle 5 bis 12, interpoliert)

type Seg = { src: number; len: number; freeze?: boolean; file?: string };
const segments = (freeze: boolean): Seg[] => [
  ...(freeze
    ? [
        { src: 0, len: SLOW_IN, file: "ig/slow_in.mp4" },
        { src: 5, len: FREEZE_LEN, freeze: true },
        { src: 0, len: SLOW_OUT, file: "ig/slow_out.mp4" },
        { src: 13, len: 51 - 13 },
      ]
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

// Standbild-Moment: Hintergrund wird dunkler und weich, Model bleibt scharf (freigestellt),
// langsames Hineinfahren, ein Lichtstreifen fährt einmal über den Tracksuit, Pfeile blenden weich ein und aus.
type FreezeCfg = { img: string; cut: string; origin: string; hoodie: [number, number]; jogger: [number, number] };
const FREEZE_RUNWAY: FreezeCfg = { img: "ig/cut/freeze/frame.jpg", cut: "ig/cut/freeze/cut_0000.png", origin: "1050px 1050px", hoodie: [1075, 450], jogger: [1005, 770] };
const FREEZE_DRONE: FreezeCfg = { img: "ig/drone_freeze.png", cut: "ig/cut/drone/cut_0000.png", origin: "1230px 700px", hoodie: [1250, 280], jogger: [1165, 640] };
const FreezeMoment: React.FC<{ len: number; cfg?: FreezeCfg }> = ({ len, cfg = FREEZE_RUNWAY }) => {
  const f = useCurrentFrame();
  const fx = interpolate(f, [0, 10, len - 10, len], [0, 1, 1, 0], clamp);
  const info = interpolate(f, [8, 20, len - 12, len - 2], [0, 1, 1, 0], clamp);
  const zoom = interpolate(f, [0, len], [1, 1.07]);
  const scan = interpolate(f, [6, 30], [-10, 110], clamp);
  const cut = staticFile(cfg.cut);
  const [hx, hy] = cfg.hoodie;
  const [jx, jy] = cfg.jogger;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: cfg.origin }}>
        <Img src={staticFile(cfg.img)} style={full} />
        {/* Hintergrund: dunkler und weich */}
        <Img
          src={staticFile(cfg.img)}
          style={{ ...full, position: "absolute", inset: 0, filter: "blur(6px) brightness(0.62) saturate(0.85)", opacity: fx }}
        />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 75% at 55% 60%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)", opacity: fx }} />
        {/* Model scharf obenauf */}
        <Img src={cut} style={{ ...full, position: "absolute", inset: 0 }} />
        {/* Lichtstreifen nur auf dem Model */}
        <AbsoluteFill
          style={{
            WebkitMaskImage: `url(${cut})`,
            maskImage: `url(${cut})`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            background: `linear-gradient(180deg, rgba(255,255,255,0) ${scan - 8}%, rgba(255,255,255,0.35) ${scan}%, rgba(255,255,255,0) ${scan + 8}%)`,
          }}
        />
        {/* Pfeile und Preise */}
        <AbsoluteFill style={{ opacity: info }}>
          <Callout from={[hx, hy]} elbow={[hx + 225, hy - 100]} to={[hx + 345, hy - 100]} />
          <div style={{ position: "absolute", left: hx + 361, top: hy - 100, transform: "translateY(-50%)" }}>
            <div style={label(18)}>Hoodie</div>
            <div style={{ ...label(34, 700), letterSpacing: "0.06em", marginTop: 4 }}>39 €</div>
          </div>
          <Callout from={[jx, jy]} elbow={[jx - 235, jy - 70]} to={[jx - 355, jy - 70]} />
          <div style={{ position: "absolute", right: 1920 - (jx - 371), top: jy - 70, transform: "translateY(-50%)", textAlign: "right" }}>
            <div style={label(18)}>Jogger</div>
            <div style={{ ...label(34, 700), letterSpacing: "0.06em", marginTop: 4 }}>30 €</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 250, top: 150, opacity: info }}>
        <div style={label(20)}>Black Friday Deal</div>
        <div style={{ ...label(46, 700), letterSpacing: "0.06em", marginTop: 10 }}>69 € Trackie</div>
      </div>
    </AbsoluteFill>
  );
};

// Verfolgen statt Stoppen: Model läuft weiter, Fokus-Effekt und Preise wandern mit.
// drone: Hintergrund ist der Drohnenflug. ramp: Zeitlupe während der Preise, dann kurz schnell, dann normal.
const TRACK_IN = 2;
const RAMP_LEN = 86; // ramp.mp4: Quelle 0-7 normal (8), 8-37 Zeitlupe (71), 38-50 doppelt schnell (7)
type TP = { hoodie: [number, number]; jogger: [number, number] };
const rampToSrc = (k: number) => (k < 8 ? k : k < 79 ? 8 + ((k - 8) * 30) / 71 : 38 + ((k - 79) * 13) / 7);
const anchorAt = (pos: number): TP => {
  const T = track as unknown as TP[];
  const i = Math.max(0, Math.min(T.length - 1, Math.floor(pos)));
  const j = Math.min(T.length - 1, i + 1);
  const t = Math.max(0, Math.min(1, pos - i));
  const mix = (a: [number, number], c: [number, number]): [number, number] => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
  return { hoodie: mix(T[i].hoodie, T[j].hoodie), jogger: mix(T[i].jogger, T[j].jogger) };
};

const TrackMoment: React.FC<{ drone: boolean; ramp: boolean }> = ({ drone, ramp }) => {
  const f = useCurrentFrame();
  const OUT_ = ramp ? RAMP_LEN : 51;
  const k = Math.min(OUT_ - 1, Math.max(0, f));
  const tp = anchorAt(ramp ? rampToSrc(k) : k);
  const fx = interpolate(f, [TRACK_IN, TRACK_IN + 7, OUT_ - 5, OUT_], [0, 1, 1, 0], clamp);
  const info = interpolate(f, [TRACK_IN + 5, TRACK_IN + 14, OUT_ - (ramp ? 9 : 6), OUT_ - (ramp ? 4 : 1)], [0, 1, 1, 0], clamp);
  const scan = interpolate(f, [TRACK_IN + 5, TRACK_IN + (ramp ? 45 : 30)], [-10, 110], clamp);
  const cut = staticFile(`ig/cut/${ramp ? "ramp" : "a"}/cut_${String(k).padStart(4, "0")}.png`);
  if (f < TRACK_IN || f >= OUT_) return null;
  const [hx, hy] = tp.hoodie;
  const [jx, jy] = tp.jogger;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fx }}>
        {drone ? (
          // Drohnenflug durchs Studio, dunkel und weich
          <Sequence from={TRACK_IN} layout="none">
            <OffthreadVideo src={staticFile("ig/drone_bg.mp4")} muted toneMapped={false} style={{ ...full, filter: "blur(3px) brightness(0.48) saturate(0.8)" }} />
          </Sequence>
        ) : (
          // eigenes Bild, dunkler und weich (Look der markierten V3)
          <OffthreadVideo src={staticFile(ramp ? "ig/ramp.mp4" : SRC)} startFrom={0} muted toneMapped={false} style={{ ...full, filter: "blur(6px) brightness(0.62) saturate(0.85)" }} />
        )}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: drone
            ? "radial-gradient(ellipse 50% 70% at 52% 58%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)"
            : "radial-gradient(ellipse 55% 75% at 52% 58%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
          opacity: fx,
        }}
      />
      <Img src={cut} style={{ ...full, position: "absolute", inset: 0, opacity: fx, filter: drone ? "brightness(1.08) contrast(1.03)" : undefined }} />
      <AbsoluteFill
        style={{
          WebkitMaskImage: `url(${cut})`,
          maskImage: `url(${cut})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          background: `linear-gradient(180deg, rgba(255,255,255,0) ${scan - 8}%, rgba(255,255,255,0.35) ${scan}%, rgba(255,255,255,0) ${scan + 8}%)`,
          opacity: fx,
        }}
      />
      <AbsoluteFill style={{ opacity: info }}>
        <Callout from={[hx, hy]} elbow={[hx + 200, hy - 100]} to={[hx + 320, hy - 100]} />
        <div style={{ position: "absolute", left: hx + 336, top: hy - 100, transform: "translateY(-50%)" }}>
          <div style={label(18)}>Hoodie</div>
          <div style={{ ...label(34, 700), letterSpacing: "0.06em", marginTop: 4 }}>39 €</div>
        </div>
        <Callout from={[jx, jy]} elbow={[jx - 230, jy - 70]} to={[jx - 350, jy - 70]} />
        <div style={{ position: "absolute", right: 1920 - (jx - 366), top: jy - 70, transform: "translateY(-50%)", textAlign: "right" }}>
          <div style={label(18)}>Jogger</div>
          <div style={{ ...label(34, 700), letterSpacing: "0.06em", marginTop: 4 }}>30 €</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 250, top: 150, opacity: info }}>
        <div style={label(20)}>Black Friday Deal</div>
        <div style={{ ...label(46, 700), letterSpacing: "0.06em", marginTop: 10 }}>69 € Trackie</div>
      </div>
    </AbsoluteFill>
  );
};

// V4: Drohnen-Einschub beim grauen Look. Runway-Anfang, Drohne fliegt heran (1,6x), Standbild von oben mit Preisen,
// Drohne zieht schnell weg (2,4x, Bewegungsunschärfe), zurück in den Runway-Film. Drohne farblich an den Film angepasst.
const DRONE_SEGS: Seg[] = [
  { src: 0, len: 30 },
  { src: 0, len: 37, file: "ig/d_in.mp4" },
  { src: 0, len: 55, freeze: true },
  { src: 0, len: 19, file: "ig/d_out.mp4" },
];

export const RunwayClean: React.FC<{ freeze?: boolean; track?: boolean; drone?: boolean; ramp?: boolean; droneCut?: boolean }> = ({ freeze = false, track: trackMode = false, drone = false, ramp = false, droneCut = false }) => {
  const frame = useCurrentFrame();
  const segs = droneCut
    ? [...DRONE_SEGS, ...segments(false).slice(1)]
    : ramp
      ? [{ src: 0, len: RAMP_LEN, file: "ig/ramp.mp4" } as Seg, ...segments(false).slice(1)]
      : segments(freeze);
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
            <FreezeMoment len={p.len} cfg={droneCut ? FREEZE_DRONE : FREEZE_RUNWAY} />
          ) : (
            <OffthreadVideo src={staticFile(p.file ?? SRC)} startFrom={p.file ? 0 : p.src} muted toneMapped={false} style={full} />
          )}
        </Sequence>
      ))}
      <Sequence from={videoEnd}>
        <Freeze frame={last.len - 1}>
          <OffthreadVideo src={staticFile(SRC)} startFrom={last.src} muted toneMapped={false} style={full} />
        </Freeze>
      </Sequence>

      {trackMode && <TrackMoment drone={drone} ramp={ramp} />}
      {trackMode && (
        <Sequence from={TRACK_IN} durationInFrames={8} layout="none">
          <Audio src={staticFile("sfx/click.wav")} volume={0.3} />
        </Sequence>
      )}
      {trackMode && (
        <Sequence from={TRACK_IN + 5} durationInFrames={ramp ? 40 : 24} layout="none">
          <Audio src={staticFile("sfx/scan_soft.wav")} volume={0.22} playbackRate={ramp ? 0.6 : 1} />
        </Sequence>
      )}
      {freezeSeg && (
        <Sequence from={freezeSeg.at} durationInFrames={8} layout="none">
          <Audio src={staticFile("sfx/click.wav")} volume={0.3} />
        </Sequence>
      )}
      {droneCut && freezeSeg && (
        <>
          <Sequence from={freezeSeg.at + 5} durationInFrames={24} layout="none">
            <Audio src={staticFile("sfx/scan_soft.wav")} volume={0.22} />
          </Sequence>
          <Sequence from={30} durationInFrames={18} layout="none">
            <Audio src={staticFile("sfx/whoosh_soft.wav")} volume={0.12} />
          </Sequence>
          <Sequence from={freezeSeg.at + freezeSeg.len} durationInFrames={18} layout="none">
            <Audio src={staticFile("sfx/whoosh_soft.wav")} volume={0.14} />
          </Sequence>
        </>
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
