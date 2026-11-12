import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE_IN, EASE_OUT, ENTER, EXIT, FONT, K, SAFE, W } from "../theme";
import { Grain } from "./Grain";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Abdunkeln des Hintergrunds hinter Abzügen (Ebene darüber, das Footage selbst bleibt unverändert)
export const Dim: React.FC<{ amount?: number }> = ({ amount = 0.55 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 24, durationInFrames - 18, durationInFrames], [0, amount, amount, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: C.espresso, opacity: o }} />;
};

// BEWEIS: 550 läuft hoch, darunter Label in Jost
export const Counter: React.FC<{ value: number; label: string; cy: number; countFrames?: number }> = ({
  value,
  label,
  cy,
  countFrames = 40,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, countFrames], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const inO = interpolate(frame, [0, 14], [0, 1], clamp);
  const outO = interpolate(frame, [durationInFrames - EXIT, durationInFrames], [1, 0], { ...clamp, easing: EASE_OUT });
  const centerX = (SAFE.left + (W - SAFE.right)) / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: centerX - 800 * K,
        width: 1600 * K,
        top: cy,
        textAlign: "center",
        opacity: inO * outO,
        color: C.papier,
        textShadow: `0 ${3 * K}px ${20 * K}px rgba(30,23,18,0.5)`,
      }}
    >
      <div style={{ fontFamily: FONT.bodoni, fontStyle: "italic", fontWeight: 400, fontSize: 190 * K, lineHeight: 1 }}>
        {Math.round(value * p)}
      </div>
      <div
        style={{
          fontFamily: FONT.jost,
          fontWeight: 500,
          fontSize: 26 * K,
          letterSpacing: "0.3em",
          marginTop: 18 * K,
          paddingLeft: "0.3em",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// TITEL: Espresso statt reinem Schwarz, Großbuchstaben, ein Begriff pro Einblendung, harter Wechsel
export const Titel: React.FC<{ items: { at: number; text: string; serif?: boolean }[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const current = [...items].reverse().find((i) => frame >= i.at);
  return (
    <AbsoluteFill style={{ backgroundColor: C.espresso, justifyContent: "center", alignItems: "center" }}>
      {current && (
        <div
          style={{
            color: C.papier,
            textAlign: "center",
            marginTop: -120 * K,
            ...(current.serif
              ? { fontFamily: FONT.bodoni, fontStyle: "italic", fontWeight: 400, fontSize: 210 * K }
              : {
                  fontFamily: FONT.jost,
                  fontWeight: 400,
                  fontSize: 64 * K,
                  letterSpacing: "0.3em",
                  paddingLeft: "0.3em",
                }),
          }}
        >
          {current.text}
        </div>
      )}
      <Grain />
    </AbsoluteFill>
  );
};

// LISTE: Menükarte, Punkte erscheinen nacheinander
export const Liste: React.FC<{ title: string; items: { at: number; no: string; text: string; sub?: string }[] }> = ({
  title,
  items,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, ENTER], [0, 1], { ...clamp, easing: EASE_IN });
  const outP = interpolate(frame, [durationInFrames - EXIT, durationInFrames], [0, 1], { ...clamp, easing: EASE_OUT });
  const cardW = 560 * K;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left + 30 * K,
        top: SAFE.top + 10 * K,
        width: cardW,
        padding: `${36 * K}px ${44 * K}px ${30 * K}px`,
        boxSizing: "border-box",
        backgroundColor: C.papier,
        border: `${1.5 * K}px solid ${C.linie}`,
        boxShadow: `0 ${18 * K}px ${50 * K}px rgba(30,23,18,0.45)`,
        transform: `translateY(${(1 - inP) * 60 * K - outP * 30 * K}px) rotate(${-2 + (1 - inP) * 3}deg)`,
        opacity: Math.min(inP * 1.4, 1) * (1 - outP),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: FONT.jost,
          fontWeight: 500,
          fontSize: 22 * K,
          letterSpacing: "0.3em",
          color: C.taupe,
          textAlign: "center",
          paddingLeft: "0.3em",
        }}
      >
        {title}
      </div>
      {items.map((it, i) => {
        const p = interpolate(frame, [it.at - 4, it.at + 26], [0, 1], { ...clamp, easing: EASE_IN });
        return (
          <div key={i}>
            <div style={{ height: 1.5 * K, backgroundColor: C.linie, margin: `${22 * K}px 0`, transformOrigin: "left", transform: `scaleX(${i === 0 ? 1 : p})` }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 30 * K, opacity: p, transform: `translateY(${(1 - p) * 16 * K}px)` }}>
              <span style={{ fontFamily: FONT.jost, fontWeight: 500, fontSize: 24 * K, letterSpacing: "0.3em", color: C.taupe }}>
                {it.no}
              </span>
              <div>
                <div style={{ fontFamily: FONT.cormorant, fontWeight: 500, fontSize: 58 * K, color: C.espresso, lineHeight: 1 }}>
                  {it.text}
                </div>
                {it.sub && (
                  <div style={{ fontFamily: FONT.jost, fontWeight: 400, fontSize: 18 * K, letterSpacing: "0.3em", color: C.taupe, marginTop: 10 * K }}>
                    {it.sub}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <Grain opacity={0.08} />
    </div>
  );
};

// ABGANG: Stille, dann Wortmarke und Handles auf Espresso
export const Abgang: React.FC<{ logoAt: number; lines: { label: string; handle: string }[] }> = ({ logoAt, lines }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [logoAt, logoAt + 36], [0, 1], { ...clamp, easing: EASE_IN });
  const p2 = interpolate(frame, [logoAt + 14, logoAt + 50], [0, 1], { ...clamp, easing: EASE_IN });
  return (
    <AbsoluteFill style={{ backgroundColor: C.espresso, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -160 * K }}>
        <Img src={staticFile("brand/salite-s-light.svg")} style={{ width: 230 * K, height: 230 * K, opacity: p }} />
        <div style={{ marginTop: 70 * K, opacity: p2, textAlign: "center" }}>
          {lines.map((l) => (
            <div key={l.label} style={{ marginBottom: 26 * K }}>
              <div style={{ fontFamily: FONT.jost, fontWeight: 400, fontSize: 18 * K, letterSpacing: "0.3em", color: C.linie, paddingLeft: "0.3em" }}>
                {l.label}
              </div>
              <div style={{ fontFamily: FONT.cormorant, fontWeight: 500, fontSize: 52 * K, color: C.papier, marginTop: 6 * K, fontVariantNumeric: "lining-nums" }}>
                {l.handle}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};


// PATIENTENAKTE: Karte des Therapeuten, Befund wird gestempelt (Bordeaux, einziges Akzent-Element)
export const Akte: React.FC<{ stampAt: number; befund: string; stamp: string }> = ({ stampAt, befund, stamp }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, ENTER], [0, 1], { ...clamp, easing: EASE_IN });
  const outP = interpolate(frame, [durationInFrames - EXIT, durationInFrames], [0, 1], { ...clamp, easing: EASE_OUT });
  const sP = interpolate(frame, [stampAt, stampAt + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cardW = 600 * K;
  return (
    <div
      style={{
        position: "absolute",
        left: W - SAFE.right - cardW - 10 * K,
        top: SAFE.top + 20 * K,
        width: cardW,
        padding: `${34 * K}px ${42 * K}px ${40 * K}px`,
        boxSizing: "border-box",
        backgroundColor: C.papier,
        border: `${1.5 * K}px solid ${C.linie}`,
        boxShadow: `0 ${18 * K}px ${50 * K}px rgba(30,23,18,0.45)`,
        transform: `translate(${(1 - inP) * 120 * K + outP * 40 * K}px, ${(1 - inP) * 40 * K}px) rotate(${2.5 + (1 - inP) * 4}deg)`,
        opacity: Math.min(inP * 1.4, 1) * (1 - outP),
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.jost, fontWeight: 500, fontSize: 20 * K, letterSpacing: "0.3em", color: C.taupe }}>
        <span>PATIENTENAKTE</span>
        <span>NR. 01</span>
      </div>
      <div style={{ height: 1.5 * K, backgroundColor: C.linie, margin: `${22 * K}px 0` }} />
      <div style={{ fontFamily: FONT.jost, fontWeight: 400, fontSize: 18 * K, letterSpacing: "0.3em", color: C.taupe }}>BEFUND</div>
      <div style={{ fontFamily: FONT.bodoni, fontStyle: "italic", fontWeight: 400, fontSize: 84 * K, color: C.espresso, lineHeight: 1.15, marginTop: 6 * K }}>
        {befund}
      </div>
      <div style={{ height: 1.5 * K, backgroundColor: C.linie, margin: `${18 * K}px 0 ${8 * K}px` }} />
      <div style={{ fontFamily: FONT.cormorant, fontStyle: "italic", fontWeight: 400, fontSize: 30 * K, color: C.braun }}>
        Therapie empfohlen
      </div>
      <div
        style={{
          position: "absolute",
          right: 30 * K,
          top: 150 * K,
          padding: `${10 * K}px ${22 * K}px`,
          border: `${4 * K}px solid ${C.bordeaux}`,
          borderRadius: 6 * K,
          color: C.bordeaux,
          fontFamily: FONT.jost,
          fontWeight: 500,
          fontSize: 34 * K,
          letterSpacing: "0.2em",
          opacity: sP * 0.9,
          transform: `rotate(-9deg) scale(${1.5 - 0.5 * sP})`,
          mixBlendMode: "multiply",
        }}
      >
        {stamp}
      </div>
      <Grain opacity={0.08} />
    </div>
  );
};

// Tagtraum: Erinnerungen schweben als kleine Abzüge herein
export const Float: React.FC<{ children: React.ReactNode; amp?: number }> = ({ children, amp = 14 }) => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", inset: 0, transform: `translateY(${Math.sin(frame / 40) * amp * K}px)` }}>{children}</div>;
};

// BLACK FRIDAY: erst Espresso mit dem Begriff, dann harter Wechsel auf Papier mit Preis-Beweis
export const BlackFriday: React.FC<{
  cutAt: number;
  priceAt: number;
  oldPrice: string;
  newPrice: string;
  sub: string;
  shop?: string;
  children?: React.ReactNode;
}> = ({ cutAt, priceAt, oldPrice, newPrice, sub, shop, children }) => {
  const frame = useCurrentFrame();
  const centerX = (SAFE.left + (W - SAFE.right)) / 2;
  if (frame < cutAt) {
    return (
      <AbsoluteFill style={{ backgroundColor: C.espresso, justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: C.papier, fontFamily: FONT.jost, fontWeight: 400, fontSize: 64 * K, letterSpacing: "0.3em", paddingLeft: "0.3em", marginTop: -120 * K }}>
          BLACK FRIDAY
        </div>
        <Grain />
      </AbsoluteFill>
    );
  }
  const strike = interpolate(frame, [cutAt + 3, cutAt + 15], [0, 1], { ...clamp, easing: EASE_IN });
  const pIn = interpolate(frame, [priceAt, priceAt + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: C.papier }}>
      {children}
      <div style={{ position: "absolute", left: centerX - 800 * K, width: 1600 * K, top: SAFE.top + 90 * K, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.jost, fontWeight: 500, fontSize: 30 * K, letterSpacing: "0.3em", paddingLeft: "0.3em", color: C.taupe }}>
          BLACK FRIDAY
        </div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 50 * K, fontFamily: FONT.cormorant, fontWeight: 500, fontSize: 92 * K, color: C.taupe, fontVariantNumeric: "lining-nums" }}>
          {oldPrice}
          <div
            style={{
              position: "absolute",
              left: -10 * K,
              right: -10 * K,
              top: "54%",
              height: 5 * K,
              backgroundColor: C.bordeaux,
              transformOrigin: "left",
              transform: `scaleX(${strike}) rotate(-4deg)`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FONT.bodoni,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 300 * K,
            lineHeight: 1,
            color: C.espresso,
            marginTop: 10 * K,
            opacity: frame >= priceAt ? 1 : 0,
            transform: `scale(${1.12 - 0.12 * pIn})`,
            fontVariantNumeric: "lining-nums",
          }}
        >
          {newPrice}
        </div>
        <div style={{ fontFamily: FONT.jost, fontWeight: 400, fontSize: 26 * K, letterSpacing: "0.3em", paddingLeft: "0.3em", color: C.braun, marginTop: 30 * K, opacity: pIn }}>
          {sub}
        </div>
        {shop && (
          <div
            style={{
              display: "inline-block",
              marginTop: 40 * K,
              padding: `${12 * K}px ${26 * K}px`,
              border: `${3 * K}px solid ${C.bordeaux}`,
              color: C.bordeaux,
              fontFamily: FONT.jost,
              fontWeight: 500,
              fontSize: 26 * K,
              letterSpacing: "0.3em",
              opacity: interpolate(frame, [priceAt + 12, priceAt + 28], [0, 1], clamp),
              fontVariantNumeric: "lining-nums",
            }}
          >
            {shop}
          </div>
        )}
      </div>
      <Grain />
    </AbsoluteFill>
  );
};
