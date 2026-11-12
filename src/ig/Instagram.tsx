import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

// Instagram-Post Black Friday, Streetwear-Variante (Wunsch des Kunden: moderner, heller, Preis in Rot).
// RED-Runway-Film (3840x2160, 25 fps, 37,52 s) unverändert und vollständig im 4:5 Rahmen.
// Komposition 2160x2700, Ausgabe mit scale 0.5 = 1080x1350.
export const IG = { fps: 25, width: 2160, height: 2700, videoSec: 37.52, outroSec: 5.2 };
export const IG_FRAMES = Math.round((IG.videoSec + IG.outroSec) * IG.fps);

const S = {
  bg: "#EDECE8", // hell, passend zum grauen Studio im Film
  ink: "#111111",
  grey: "#8C8A85",
  red: "#E3120B", // Sale-Rot, nur für Preis und Rabatt
  white: "#FFFFFF",
};
const ANTON = "'Anton', sans-serif";
const INTER = "'Inter', sans-serif";

let fontsLoaded = false;
const loadStreetFonts = () => {
  if (fontsLoaded || typeof document === "undefined") return;
  fontsLoaded = true;
  const h = delayRender("Streetwear-Schriften");
  const faces: [string, string, string][] = [
    ["Anton", "anton-latin-400-normal.woff2", "400"],
    ["Inter", "inter-latin-600-normal.woff2", "600"],
    ["Inter", "inter-latin-700-normal.woff2", "700"],
    ["Inter", "inter-latin-800-normal.woff2", "800"],
  ];
  Promise.all(
    faces.map(([fam, file, w]) =>
      new FontFace(fam, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, { weight: w }).load().then((ff) => document.fonts.add(ff)),
    ),
  ).then(() => continueRender(h), () => continueRender(h));
};
loadStreetFonts();

const f = (s: number) => Math.round(s * IG.fps);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const IN = Easing.in(Easing.cubic);

const VID = { top: 742, h: 1215 }; // 2160 breit, 16:9
// Look-Wechsel im Film (frame-genau aus der Quelle)
const LOOKS = [0, 7.0, 15.76, 24.08, 31.0];
const END_CARD = 34.24;
const LOOK_X = [46, 47, 50, 48, 50];
// Bestseller: Grau (Look 1) und Schwarz (Look 5) stehen im Vordergrund
const HERO = [true, false, false, false, true];
const SLOT_W = HERO.map((h) => (h ? 420 : 290));
const SLOT_X = (() => {
  const gap = 34;
  const total = SLOT_W.reduce((a, b) => a + b, 0) + gap * 4;
  let x = (2160 - total) / 2;
  return SLOT_W.map((w) => {
    const c = x + w / 2;
    x += w + gap;
    return c;
  });
})();

// Blendenschnitt: Bild schließt sich kurz vor jedem Look-Wechsel zu einem Spalt und öffnet danach wieder
const shutter = (frame: number) => {
  let open = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: OUT });
  for (const t of [...LOOKS.slice(1), END_CARD]) {
    const c = f(t);
    const closing = interpolate(frame, [c - 4, c], [1, 0], { ...clamp, easing: IN });
    const opening = interpolate(frame, [c, c + 7], [0, 1], { ...clamp, easing: OUT });
    const v = frame < c ? closing : opening;
    if (frame >= c - 4 && frame <= c + 7) open = Math.min(open, 0.04 + 0.96 * v);
  }
  return open;
};

const Txt: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({
  children,
  size = 34,
  color = S.ink,
  weight = 700,
  style,
}) => (
  <div style={{ fontFamily: INTER, fontWeight: weight, fontSize: size, letterSpacing: "0.04em", textTransform: "uppercase", color, ...style }}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; size?: number; rot?: number }> = ({ children, size = 34, rot = 0 }) => (
  <div
    style={{
      display: "inline-block",
      backgroundColor: S.red,
      color: S.white,
      fontFamily: INTER,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: "0.03em",
      padding: `${size * 0.32}px ${size * 0.6}px`,
      transform: `rotate(${rot}deg)`,
    }}
  >
    {children}
  </div>
);

export const Instagram: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / IG.fps;
  const open = shutter(frame);
  const videoEnd = f(IG.videoSec);
  const videoFade = interpolate(frame, [videoEnd - 8, videoEnd], [1, 0], clamp);
  const lookIdx = LOOKS.filter((x) => t >= x).length - 1;
  const inEnd = t >= END_CARD;
  const stripOut = interpolate(frame, [f(END_CARD), f(END_CARD) + 10], [0, 1], { ...clamp, easing: IN });
  const promo = interpolate(frame, [f(END_CARD) + 6, f(END_CARD) + 18], [0, 1], { ...clamp, easing: OUT });
  const promoOut = interpolate(frame, [videoEnd - 6, videoEnd], [1, 0], clamp);
  const finalIn = interpolate(frame, [videoEnd, videoEnd + 14], [0, 1], { ...clamp, easing: OUT });
  const topIn = interpolate(frame, [4, 20], [0, 1], { ...clamp, easing: OUT });
  const inset = ((1 - open) * VID.h) / 2;
  const priceSlam = interpolate(frame, [videoEnd + 16, videoEnd + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ backgroundColor: S.bg }}>
      {/* Film, unverändert, nur verkleinert in den Rahmen gesetzt */}
      <div style={{ position: "absolute", left: 0, top: VID.top, width: IG.width, height: VID.h, clipPath: `inset(${inset}px 0 ${inset}px 0)`, opacity: videoFade }}>
        {frame < videoEnd && <OffthreadVideo src={staticFile("ig/source.mov")} toneMapped={false} style={{ width: "100%", height: "100%" }} />}
      </div>

      {/* Kopf */}
      <div style={{ position: "absolute", top: 90, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", opacity: topIn, transform: `translateY(${(1 - topIn) * -30}px)` }}>
        <Img src={staticFile("brand/salite-s-dark.svg")} style={{ width: 110, height: 110 }} />
        <div style={{ fontFamily: ANTON, fontSize: 250, lineHeight: 1.05, color: S.ink, marginTop: 20, letterSpacing: "0.01em" }}>BLACK FRIDAY</div>
        <div style={{ display: "flex", gap: 30, alignItems: "center", marginTop: 6 }}>
          <Txt size={38}>27.11.</Txt>
          <Badge size={38}>BIS ZU -80%</Badge>
          <Txt size={38}>NUR MIT PASSWORT</Txt>
        </div>
      </div>

      {/* Kontaktbogen: mit jedem Look landet ein Abzug, Bestseller größer */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - stripOut, transform: `translateY(${stripOut * 60}px)` }}>
        {LOOKS.map((start, i) => {
          const s = f(start) + (i === 0 ? 12 : 5);
          const p = interpolate(frame, [s, s + 12], [0, 1], { ...clamp, easing: OUT });
          if (p <= 0) return null;
          const current = i === lookIdx && !inEnd;
          const w = SLOT_W[i];
          const h = w * 1.25;
          const top = (HERO[i] ? 2010 : 2090) + (HERO[i] ? 0 : 0);
          return (
            <div key={i} style={{ position: "absolute", left: SLOT_X[i] - w / 2, top, width: w, zIndex: HERO[i] ? 2 : 1 }}>
              <div
                style={{
                  width: w,
                  height: h,
                  padding: 8,
                  boxSizing: "border-box",
                  backgroundColor: S.white,
                  boxShadow: current ? "0 22px 40px rgba(0,0,0,0.28)" : "0 10px 24px rgba(0,0,0,0.18)",
                  transform: `translateY(${(1 - p) * -120 + (current ? -20 : 0)}px) rotate(${[-2, 1.5, -1.5, 2, -1][i] + (1 - p) * 6}deg) scale(${1.2 - 0.2 * p})`,
                  opacity: Math.min(1, p * 1.5) * (current || HERO[i] ? 1 : 0.55),
                }}
              >
                <Img src={staticFile(`ig/stills/look${i + 1}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${LOOK_X[i]}% 50%`, display: "block" }} />
              </div>
              {HERO[i] && (
                <div style={{ position: "absolute", left: -14, top: -24, opacity: p }}>
                  <Badge size={28} rot={-4}>BESTSELLER</Badge>
                </div>
              )}
            </div>
          );
        })}
        <div style={{ position: "absolute", top: 2600, left: 150, right: 150, display: "flex", justifyContent: "space-between" }}>
          <Txt size={30} color={S.grey}>LOOK 0{lookIdx + 1}</Txt>
          <Txt size={30} color={HERO[lookIdx] ? S.ink : S.grey}>{HERO[lookIdx] ? "BESTSELLER" : "TRACKSUIT 550 GSM"}</Txt>
        </div>
      </div>

      {/* Endkarte im Film: Rabatt unten */}
      {inEnd && frame < videoEnd && (
        <div style={{ position: "absolute", top: 2030, width: "100%", textAlign: "center", opacity: promo * promoOut }}>
          <div style={{ fontFamily: ANTON, fontSize: 380, lineHeight: 1, color: S.red, transform: `scale(${1.15 - 0.15 * promo})` }}>BIS ZU -80%</div>
        </div>
      )}

      {/* Schlusskarte: Bestseller Grau und Schwarz, Preis in Rot */}
      {frame >= videoEnd && (
        <AbsoluteFill style={{ opacity: finalIn }}>
          {[
            { src: "ig/stills/hero_grey.jpg", cx: 780, rot: -3, d: 0 },
            { src: "ig/stills/hero_black.jpg", cx: 1380, rot: 3, d: 4 },
          ].map((hh) => {
            const p = interpolate(frame, [videoEnd + 2 + hh.d, videoEnd + 16 + hh.d], [0, 1], { ...clamp, easing: OUT });
            return (
              <div
                key={hh.src}
                style={{
                  position: "absolute",
                  left: hh.cx - 300,
                  top: 720,
                  width: 600,
                  height: 750,
                  padding: 12,
                  boxSizing: "border-box",
                  backgroundColor: S.white,
                  boxShadow: "0 26px 50px rgba(0,0,0,0.25)",
                  transform: `translateY(${(1 - p) * -100}px) rotate(${hh.rot + (1 - p) * 5}deg) scale(${1.12 - 0.12 * p})`,
                  opacity: Math.min(1, p * 1.4),
                }}
              >
                <Img src={staticFile(hh.src)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 470, top: 690, opacity: finalIn }}>
            <Badge size={36} rot={-4}>BESTSELLER</Badge>
          </div>
          <div style={{ position: "absolute", top: 1530, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Txt size={40}>DER GANZE TRACKSUIT</Txt>
            <div style={{ display: "flex", alignItems: "center", gap: 50, marginTop: 10 }}>
              <div style={{ position: "relative", fontFamily: ANTON, fontSize: 170, color: S.grey }}>
                130€
                <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 12, backgroundColor: S.ink, transform: `scaleX(${interpolate(frame, [videoEnd + 8, videoEnd + 16], [0, 1], clamp)}) rotate(-8deg)`, transformOrigin: "left" }} />
              </div>
              <div style={{ fontFamily: ANTON, fontSize: 420, lineHeight: 1, color: S.red, opacity: priceSlam, transform: `scale(${1.25 - 0.25 * priceSlam})` }}>69€</div>
            </div>
            <Txt size={36} weight={600} style={{ marginTop: 24 }}>HOODIE + TRACK PANTS</Txt>
            <div style={{ marginTop: 50 }}>
              <Badge size={46}>BIS ZU -80% IM SHOP</Badge>
            </div>
            <Txt size={34} style={{ marginTop: 50 }}>27.11.&nbsp;&nbsp;NUR MIT PASSWORT</Txt>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
