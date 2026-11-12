import { AbsoluteFill, useCurrentFrame } from "remotion";

// Feines Filmkorn, Deckkraft 6 bis 8 Prozent, jedes Frame neu
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2); // Korn wechselt mit 30 Hz wie bei Film
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none", mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
