import { continueRender, delayRender, Easing, staticFile } from "remotion";

// SALITE Farben (CLAUDE.md, Abschnitt 3)
export const C = {
  papier: "#F2ECE1",
  papier2: "#E9E0D0",
  linie: "#D8CBB4",
  espresso: "#1E1712",
  braun: "#4A3D31",
  taupe: "#6B5D4F",
  bordeaux: "#5A1A1F",
};

export const FPS = 60;
export const W = 2160;
export const H = 3840;
// Faktor gegenüber 1080x1920, alle Maße der CLAUDE.md werden damit umgerechnet
export const K = W / 1080;

// Sichere Zone (CLAUDE.md: oben 220, unten 420, rechts 140 bei 1080 breit)
export const SAFE = { top: 220 * K, bottom: 420 * K, right: 140 * K, left: 80 * K };

export const f = (sec: number) => Math.round(sec * FPS);

// ease out expo für Einblendungen, 14 bis 18 Frames bei 30 fps -> 28 bis 36 bei 60 fps
export const EASE_IN = Easing.out(Easing.exp);
export const EASE_OUT = Easing.in(Easing.cubic);
export const ENTER = 32;
export const EXIT = 20;

export const FONT = {
  bodoni: "'Bodoni Moda', serif",
  cormorant: "'Cormorant Garamond', serif",
  jost: "'Jost', sans-serif",
};

// Schriften lokal laden (Google Fonts Dateien über @fontsource, kein Netz beim Rendern nötig)
const faces: [string, string, string, string][] = [
  ["Bodoni Moda", "bodoni-moda-latin-400-italic.woff2", "400", "italic"],
  ["Bodoni Moda", "bodoni-moda-latin-500-italic.woff2", "500", "italic"],
  ["Cormorant Garamond", "cormorant-garamond-latin-400-normal.woff2", "400", "normal"],
  ["Cormorant Garamond", "cormorant-garamond-latin-500-normal.woff2", "500", "normal"],
  ["Cormorant Garamond", "cormorant-garamond-latin-400-italic.woff2", "400", "italic"],
  ["Cormorant Garamond", "cormorant-garamond-latin-500-italic.woff2", "500", "italic"],
  ["Jost", "jost-latin-400-normal.woff2", "400", "normal"],
  ["Jost", "jost-latin-500-normal.woff2", "500", "normal"],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Schriften laden");
  Promise.all(
    faces.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {
        weight,
        style,
      });
      return face.load().then((ff) => document.fonts.add(ff));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
