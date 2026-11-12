import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { C, EASE_IN } from "../theme";

// Kamera-Bewegung auf dem Originalbild (CLAUDE.md Abschnitt 4):
// Zoomsprünge 108 bis 115 Prozent auf betonten Wörtern, oder langsames Hineinfahren über einen Satz.
// Ursprung (ox, oy) in Prozent: wohin gezoomt wird (Gesicht des Sprechers).
type Shot = { a: number; b: number; z0: number; z1: number; ox: number; oy: number; blur?: boolean };

export const SHOTS: Shot[] = [
  // "Und der ist Single?" ... "Single?"
  { a: 10.24, b: 10.86, z0: 1.1, z1: 1.1, ox: 45, oy: 33 },
  { a: 11.38, b: 12.38, z0: 1.12, z1: 1.12, ox: 45, oy: 33 },
  // Tracksuit dreimal: Sprung wird jedes Mal größer
  { a: 14.04, b: 14.72, z0: 1.08, z1: 1.08, ox: 12, oy: 60 },
  { a: 14.72, b: 16.2, z0: 1.12, z1: 1.12, ox: 12, oy: 60 },
  { a: 16.2, b: 16.8, z0: 1.15, z1: 1.15, ox: 12, oy: 60 },
  // "Ach, wenn du nur wüsstest" + Pause: langsam in den Tagtraum hinein
  { a: 18.32, b: 21.18, z0: 1.0, z1: 1.12, ox: 30, oy: 50 },
  // schnelles Herauszoomen mit Bewegungsunschärfe zurück in die Realität
  { a: 21.18, b: 21.3, z0: 1.12, z1: 1.0, ox: 30, oy: 50, blur: true },
  // "Hörst du mir zu?"
  { a: 27.96, b: 29.22, z0: 1.1, z1: 1.1, ox: 55, oy: 40 },
  // Pause nach "besessen": der Therapeut denkt nach, langsames Hineinfahren
  { a: 34.9, b: 37.3, z0: 1.0, z1: 1.08, ox: 40, oy: 35 },
  // "Dachtest du wirklich, ich bin ein Therapeut?" ... "kein Therapeut."
  { a: 49.12, b: 51.52, z0: 1.0, z1: 1.06, ox: 60, oy: 32 },
  { a: 51.52, b: 52.66, z0: 1.14, z1: 1.14, ox: 60, oy: 32 },
  // "Du bist nur hier, damit ich dir das wegnehme." Bedrohlich, langsam hinein
  { a: 52.66, b: 56.64, z0: 1.0, z1: 1.12, ox: 58, oy: 32 },
  // "Alles." / "Aber nicht mein Tracksuit."
  { a: 56.64, b: 58.1, z0: 1.1, z1: 1.1, ox: 42, oy: 32 },
  { a: 58.1, b: 59.14, z0: 1.15, z1: 1.15, ox: 42, oy: 32 },
  // "Du willst hier lebend rauskommen?" ... "Dann sag mir"
  { a: 62.4, b: 63.82, z0: 1.1, z1: 1.1, ox: 60, oy: 30 },
  { a: 63.82, b: 65.82, z0: 1.1, z1: 1.14, ox: 60, oy: 30 },
];

// Vignette in Espresso: Tagtraum und Bedrohung (Ebene über dem Bild, Footage bleibt unverändert)
const MOODS: { a: number; b: number; amount: number }[] = [
  { a: 18.32, b: 21.18, amount: 0.75 },
  { a: 34.9, b: 37.3, amount: 0.45 },
  { a: 52.66, b: 56.64, amount: 0.7 },
];

export const Camera: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const s = SHOTS.find((x) => t >= x.a && t < x.b);
  let z = 1;
  let blur = 0;
  let ox = 50;
  let oy = 50;
  if (s) {
    const p = interpolate(t, [s.a, s.b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const e = s.blur ? EASE_IN(p) : p;
    z = s.z0 + (s.z1 - s.z0) * e;
    ox = s.ox;
    oy = s.oy;
    if (s.blur) blur = 14 * (1 - p);
  }
  const mood = MOODS.find((m) => t >= m.a - 0.2 && t < m.b);
  const moodO = mood
    ? interpolate(t, [mood.a - 0.2, mood.a + 0.6, mood.b - 0.08, mood.b], [0, mood.amount, mood.amount, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${z})`,
          transformOrigin: `${ox}% ${oy}%`,
          filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        }}
      >
        <OffthreadVideo src={staticFile("video.mp4")} toneMapped={false} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: moodO,
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(30,23,18,0) 45%, ${C.espresso} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
