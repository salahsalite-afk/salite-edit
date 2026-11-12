import { AbsoluteFill, Audio, continueRender, delayRender, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

// RED-Runway-Film, Vollbild 16:9, ohne Rahmen. Look 4 (weißes Tanktop) ist komplett herausgeschnitten.
// Die Musik läuft ungeschnitten über die volle Länge; das Endbild mit dem S steht dafür länger.
export const RW = { fps: 25, width: 3840, height: 2160, frames: 938 }; // 37,52 s wie die Musik
const CUT_IN = 602; // 24,08 s: Ende Look 3
const RESUME = 775; // 31,00 s: Start Look 5 in der Quelle
const PART2 = 163; // 31,00 bis 37,52 s in der Quelle (Look 5 und Endkarte)
const END_CARD = CUT_IN + Math.round((34.24 - 31.0) * 25); // Endkarte in der neuen Zeitleiste

export type RunwayVariant = "plain" | "insta" | "tiktok";

let loaded = false;
const loadInter = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("Inter");
  Promise.all(
    ["600", "700"].map((w) =>
      new FontFace("Inter", `url(${staticFile(`fonts/inter-latin-${w}-normal.woff2`)}) format('woff2')`, { weight: w }).load().then((ff) => document.fonts.add(ff)),
    ),
  ).then(() => continueRender(h), () => continueRender(h));
};
loadInter();

const RED = "#E3120B";
const INK = "#161616";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Line: React.FC<{ children: React.ReactNode; size: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({
  children,
  size,
  color = INK,
  weight = 600,
  style,
}) => (
  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: weight, fontSize: size, letterSpacing: "0.22em", paddingLeft: "0.22em", textTransform: "uppercase", color, ...style }}>
    {children}
  </div>
);

export const Runway: React.FC<{ variant: RunwayVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  // erst nach dem Filmtitel "SALITE RUNWAY" (bis ca. 4,5 s)
  const textIn = interpolate(frame, [125, 150], [0, 1], clamp);
  // auf der dunklen Endkarte weiß statt schwarz
  const onEnd = interpolate(frame, [END_CARD, END_CARD + 10], [0, 1], clamp);
  const color = onEnd > 0.5 ? "#FFFFFF" : INK;
  const ctaIn = interpolate(frame, [END_CARD + 20, END_CARD + 45], [0, 1], clamp);
  const lastFrame = PART2 - 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Musik: Originalton der Quelle, ungeschnitten */}
      <Audio src={staticFile("ig/source.mov")} />

      {/* Look 1 bis 3 */}
      <Sequence durationInFrames={CUT_IN}>
        <OffthreadVideo src={staticFile("ig/source.mov")} muted toneMapped={false} style={{ width: "100%", height: "100%" }} />
      </Sequence>
      {/* Look 5 und Endkarte */}
      <Sequence from={CUT_IN} durationInFrames={PART2}>
        <OffthreadVideo src={staticFile("ig/source.mov")} startFrom={RESUME} muted toneMapped={false} style={{ width: "100%", height: "100%" }} />
      </Sequence>
      {/* Endkarte steht, bis die Musik endet */}
      <Sequence from={CUT_IN + PART2}>
        <Freeze frame={lastFrame}>
          <OffthreadVideo src={staticFile("ig/source.mov")} startFrom={RESUME} muted toneMapped={false} style={{ width: "100%", height: "100%" }} />
        </Freeze>
      </Sequence>

      {variant === "insta" && (
        <div style={{ position: "absolute", left: 300, top: "50%", transform: "translateY(-50%)", opacity: textIn }}>
          <Line size={64} color={color}>Black Friday</Line>
          <Line size={64} color={color} style={{ marginTop: 14 }}>27.11.</Line>
          <div style={{ opacity: ctaIn, marginTop: 60 }}>
            <Line size={46} weight={700} color={color}>Schreib uns per DM:</Line>
            <Line size={46} weight={700} color={color} style={{ marginTop: 12 }}>Ich brauch ein Passwort</Line>
          </div>
        </div>
      )}

      {variant === "tiktok" && (
        <div style={{ position: "absolute", left: 300, top: "50%", transform: "translateY(-50%)", opacity: textIn }}>
          <Line size={96} weight={700} color={color}>Black Friday</Line>
          <Line size={96} weight={700} color={color} style={{ marginTop: 20 }}>
            Tracksuit <span style={{ color: RED }}>60 €</span>
          </Line>
        </div>
      )}
    </AbsoluteFill>
  );
};
