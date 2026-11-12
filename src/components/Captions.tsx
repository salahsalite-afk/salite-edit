import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import transcript from "../../transcript.json";
import { C, EASE_IN, f, FONT, K, SAFE, W } from "../theme";

type Word = { word: string; start: number; end: number };
type Group = { words: Word[]; start: number; end: number; hook: boolean };

const HOOK_END = 2.6;
// Kernwörter: werden in Bodoni kursiv gesetzt, höchstens eins pro Einblendung
const KEY = new Set([
  "umdrehen", "puffprint", "stack", "gesessen", "krass", "single", "tracksuit", "winterjacke",
  "interessant", "problem", "besessen", "informationen", "positiv", "hochwertig", "böse",
  "therapeut", "wegnehme", "alles", "lösung", "lebend", "lösungsvorschlag", "passwort", "verzieh",
]);
const ACCENT = new Set<string>(); // Bordeaux auf dunklem Footage nicht lesbar, daher hier keine Akzentfarbe
// Wortbild Tracksuit: das Wort wächst mit jeder Wiederholung (13 bis 17 s)
const GROW: Record<string, number> = { "14.04": 1.0, "14.72": 1.16, "16.2": 1.32 };
// Hier keine Untertitel (Titel-Einblendung und Abgang)
export const CAPTION_OFF: [number, number][] = [[66.2, 68.4]];

const clean = (w: string) => w.toLowerCase().replace(/[.,!?]/g, "");

const groups: Group[] = (() => {
  const out: Group[] = [];
  let cur: Word[] = [];
  const words = (transcript as { words: Word[] }).words;
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const hook = w.start < HOOK_END;
    const max = hook ? 3 : 4;
    const brk =
      cur.length >= max ||
      (prev && w.start - prev.end > 0.35) ||
      (prev && /[.?!]$/.test(prev.word)) ||
      (prev && prev.start < HOOK_END !== hook);
    if (brk && cur.length) {
      out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end, hook: cur[0].start < HOOK_END });
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end, hook: false });
  out.forEach((g, i) => {
    const next = out[i + 1];
    g.end = next ? Math.min(next.start, g.end + 0.6) : g.end + 0.5;
  });
  return out;
})();

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  if (CAPTION_OFF.some(([a, b]) => t >= a && t < b)) return null;
  const g = groups.find((x) => t >= x.start - 0.05 && t < x.end);
  if (!g) return null;
  const keyIdx = g.words.findIndex((w) => KEY.has(clean(w.word)));
  const size = (g.hook ? 92 : 62) * K;
  const centerX = (SAFE.left + (W - SAFE.right)) / 2;
  const maxW = W - SAFE.left - SAFE.right - 60 * K;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: centerX - maxW / 2,
          width: maxW,
          ...(g.hook ? { top: 1180 * K, transform: "translateY(-50%)" } : { bottom: SAFE.bottom + 40 * K }),
          textAlign: "center",
          lineHeight: 1.08,
          color: C.papier,
          fontFamily: FONT.cormorant,
          fontWeight: 500,
          fontSize: size,
          textShadow: `0 0 ${40 * K}px rgba(30,23,18,0.7), 0 0 ${16 * K}px rgba(30,23,18,0.85), 0 ${2 * K}px ${6 * K}px rgba(30,23,18,0.9)`,
        }}
      >
        {g.words.map((w, i) => {
          const s = f(w.start);
          const p = interpolate(frame, [s - 4, s + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_IN,
          });
          const isKey = i === keyIdx;
          const grow = isKey ? GROW[String(w.start)] ?? 1 : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.24em",
                opacity: p,
                transform: `translateY(${(1 - p) * 14 * K}px)`,
                ...(isKey
                  ? {
                      fontFamily: FONT.bodoni,
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: size * 1.06 * grow,
                      color: ACCENT.has(clean(w.word)) ? C.bordeaux : C.papier,
                      textShadow: ACCENT.has(clean(w.word))
                        ? `0 ${2 * K}px ${12 * K}px rgba(242,236,225,0.55)`
                        : undefined,
                    }
                  : {}),
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

