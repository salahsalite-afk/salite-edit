import { AbsoluteFill, Audio, continueRender, delayRender, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

// Runway-Film Vollbild 16:9 ohne Titel "SALITE RUNWAY" und ohne Tanktop-Look.
// Am Anfang steht groß BLACK FRIDAY / TRACKSUIT 60 € hinter dem Model; das freigestellte Model
// liegt über dem Text und verdeckt ihn immer mehr, je näher es kommt. Musik ungeschnitten.
export const RBF = { fps: 25, width: 1920, height: 1080, frames: 938 };

const SRC = "ig/source.mov";
// Quell-Frames (25 fps)
const A_END = 51; // 0 bis 2,04 s: Model läuft auf die Kamera zu, vor dem Titel
const B_START = 91; // 3,64 s: erste Einstellung nach dem Titel
const B_END = 602; // 24,08 s: Ende Look 3
const C_START = 775; // 31,00 s: Look 5
const C_LEN = 163; // bis 37,52 s inklusive Endkarte
// Zeitleiste der Ausgabe
const T_B = A_END; // 51
const T_C = T_B + (B_END - B_START); // 562
const T_HOLD = T_C + C_LEN; // 725
const TEXT_END = T_B + (112 - B_START); // Schnitt auf die Beine bei 4,48 s
const CUT_B_LEN = 112 - B_START; // 21 freigestellte Frames in Teil B

let loaded = false;
const loadAnton = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("Anton");
  new FontFace("Anton", `url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2')`)
    .load()
    .then((ff) => document.fonts.add(ff))
    .then(() => continueRender(h), () => continueRender(h));
};
loadAnton();

const pad = (n: number) => String(n).padStart(4, "0");
const full: React.CSSProperties = { width: "100%", height: "100%" };

export const RunwayBF: React.FC = () => {
  const frame = useCurrentFrame();
  const textScale = interpolate(frame, [0, 30], [1.04, 1], { extrapolateRight: "clamp" });
  const showText = frame < TEXT_END;
  const cut =
    frame < A_END ? `ig/cut/a/cut_${pad(frame)}.png` : frame >= T_B && frame < T_B + CUT_B_LEN ? `ig/cut/b/cut_${pad(frame - T_B)}.png` : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile(SRC)} />

      <Sequence durationInFrames={A_END}>
        <OffthreadVideo src={staticFile(SRC)} muted toneMapped={false} style={full} />
      </Sequence>
      <Sequence from={T_B} durationInFrames={B_END - B_START}>
        <OffthreadVideo src={staticFile(SRC)} startFrom={B_START} muted toneMapped={false} style={full} />
      </Sequence>
      <Sequence from={T_C} durationInFrames={C_LEN}>
        <OffthreadVideo src={staticFile(SRC)} startFrom={C_START} muted toneMapped={false} style={full} />
      </Sequence>
      <Sequence from={T_HOLD}>
        <Freeze frame={C_LEN - 1}>
          <OffthreadVideo src={staticFile(SRC)} startFrom={C_START} muted toneMapped={false} style={full} />
        </Freeze>
      </Sequence>

      {showText && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", transform: `scale(${textScale})`, marginTop: -60, fontFamily: "'Anton', sans-serif", lineHeight: 0.98, color: "#111111" }}>
            <div style={{ fontSize: 290, letterSpacing: "0.01em" }}>BLACK FRIDAY</div>
            <div style={{ fontSize: 290, letterSpacing: "0.01em" }}>
              TRACKSUIT <span style={{ color: "#E3120B" }}>60 €</span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* freigestelltes Model über dem Text */}
      {showText && cut && <Img src={staticFile(cut)} style={{ position: "absolute", inset: 0, ...full }} />}
    </AbsoluteFill>
  );
};
