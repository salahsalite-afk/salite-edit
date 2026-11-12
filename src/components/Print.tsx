import { Img, interpolate, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE_IN, EASE_OUT, ENTER, EXIT, K } from "../theme";

// ABZUG / OBJEKT: Foto oder Clip als Abzug mit Papierrand, leicht gedreht, warmer weicher Schatten.
// Wird nur verkleinert dargestellt, nie größer als die Quelle.
type Props = {
  src: string;
  video?: boolean;
  startFrom?: number; // Frames im Clip (in Kompositions-fps)
  cx: number;
  cy: number;
  width: number;
  aspect: number; // Breite / Höhe des sichtbaren Ausschnitts
  rotate: number;
  objectPosition?: string;
  from?: { dx: number; dy: number; rot: number };
  border?: number;
  // Ausschnitt in Quellpixeln: wird höchstens 1:1 gezeigt, nie vergrößert
  crop?: { x: number; y: number; w: number; natW: number; natH: number };
};

export const Print: React.FC<Props> = ({
  src,
  video,
  startFrom = 0,
  cx,
  cy,
  width,
  aspect,
  rotate,
  objectPosition = "50% 50%",
  from = { dx: 260 * K, dy: 90 * K, rot: 6 },
  border = 14 * K,
  crop,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, ENTER], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const outP = interpolate(frame, [durationInFrames - EXIT, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const dx = from.dx * (1 - inP) - from.dx * 0.4 * outP;
  const dy = from.dy * (1 - inP) - 40 * K * outP;
  const rot = rotate + from.rot * (1 - inP) - 2 * outP;
  const opacity = Math.min(inP * 1.4, 1) * (1 - outP);
  const height = width / aspect;
  const media: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition, display: "block" };

  return (
    <div
      style={{
        position: "absolute",
        left: cx - width / 2 - border,
        top: cy - height / 2 - border,
        width: width + border * 2,
        height: height + border * 2,
        padding: border,
        boxSizing: "border-box",
        backgroundColor: C.papier,
        boxShadow: `0 ${18 * K}px ${50 * K}px rgba(30,23,18,0.45), 0 ${4 * K}px ${10 * K}px rgba(30,23,18,0.25)`,
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
        opacity,
      }}
    >
      {video ? (
        <OffthreadVideo src={src} startFrom={startFrom} muted toneMapped={false} style={media} />
      ) : crop ? (
        <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
          <Img
            src={src}
            style={{
              position: "absolute",
              width: crop.natW * Math.min(1, width / crop.w),
              height: crop.natH * Math.min(1, width / crop.w),
              left: -crop.x * Math.min(1, width / crop.w),
              top: -crop.y * Math.min(1, width / crop.w),
              maxWidth: "none",
            }}
          />
        </div>
      ) : (
        <Img src={src} style={media} />
      )}
    </div>
  );
};
