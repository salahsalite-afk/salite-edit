import { Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

// Outro: Smartphone in der Bildmitte. Passwort-Seite, Tipp auf "Get your password",
// dann DM-Chat mit SALITE (echtes Profilbild: Chrom-S auf Weiß, public/ig/profilbild.jpg): "Passwort" wird getippt und gesendet.
// Frames relativ zum Start dieser Sequenz (25 fps).
export const PHONE = {
  in: 0,
  tap: 38, // Tipp auf den Button
  toDm: 48, // Wechsel zum Chat
  typeStart: 62,
  perChar: 4,
  word: "Passwort",
  out: 190,
  len: 210,
};
const SEND = PHONE.typeStart + PHONE.word.length * PHONE.perChar + 8;

const SCREEN_W = 400;
const SCREEN_H = 751; // Seitenverhältnis des Screenshots
const BEZEL = 14;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.exp);
const UI = "'Inter', sans-serif";
const IG_BLUE = "#3797F0";

const DmScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const typed = Math.max(0, Math.min(PHONE.word.length, Math.floor((frame - PHONE.typeStart) / PHONE.perChar) + 1));
  const text = frame >= PHONE.typeStart && frame < SEND ? PHONE.word.slice(0, typed) : "";
  const sent = frame >= SEND;
  const bubble = interpolate(frame, [SEND, SEND + 8], [0, 1], { ...clamp, easing: OUT });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", fontFamily: UI, color: "#111" }}>
      {/* Kopfzeile */}
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", borderBottom: "1px solid #EFEFEF" }}>
        <div style={{ fontSize: 30, lineHeight: 1, marginTop: -4 }}>‹</div>
        <Img src={staticFile("ig/profilbild.jpg")} style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover", border: "1px solid #EFEFEF" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>saliteclothing</div>
          <div style={{ fontWeight: 600, fontSize: 12, color: "#8E8E8E" }}>SALITE</div>
        </div>
      </div>
      {/* Profil-Mitte */}
      <div style={{ position: "absolute", top: 170, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img src={staticFile("ig/profilbild.jpg")} style={{ width: 92, height: 92, borderRadius: 46, objectFit: "cover", border: "1px solid #EFEFEF" }} />
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 12 }}>SALITE</div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#8E8E8E", marginTop: 4 }}>saliteclothing</div>
      </div>
      {/* gesendete Nachricht */}
      {sent && (
        <div style={{ position: "absolute", right: 16, bottom: 120, opacity: bubble, transform: `translateY(${(1 - bubble) * 16}px)` }}>
          <div style={{ background: IG_BLUE, color: "#FFF", fontWeight: 600, fontSize: 17, padding: "10px 16px", borderRadius: 22 }}>{PHONE.word}</div>
        </div>
      )}
      {/* Eingabezeile */}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 40, height: 50, borderRadius: 25, background: "#F0F0F0", display: "flex", alignItems: "center", padding: "0 18px", fontSize: 16, fontWeight: 600 }}>
        <span style={{ color: text ? "#111" : "#8E8E8E", flex: 1 }}>
          {text || "Nachricht …"}
          {text && Math.floor(frame / 6) % 2 === 0 && <span style={{ color: IG_BLUE }}>|</span>}
        </span>
        {text && <span style={{ color: IG_BLUE, fontWeight: 700 }}>Senden</span>}
      </div>
    </div>
  );
};

export const PhoneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [PHONE.in, PHONE.in + 18], [0, 1], { ...clamp, easing: OUT });
  const outP = interpolate(frame, [PHONE.out, PHONE.out + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const toDm = interpolate(frame, [PHONE.toDm, PHONE.toDm + 10], [0, 1], { ...clamp, easing: OUT });
  const tapP = interpolate(frame, [PHONE.tap, PHONE.tap + 10], [0, 1], clamp);
  const tapVisible = frame >= PHONE.tap - 6 && frame < PHONE.tap + 10;

  const w = SCREEN_W + BEZEL * 2;
  const h = SCREEN_H + BEZEL * 2;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 960 - w / 2,
          top: 540 - h / 2,
          width: w,
          height: h,
          borderRadius: 64,
          background: "#0B0B0C",
          boxShadow: "0 40px 90px rgba(0,0,0,0.5), inset 0 0 0 2px #2A2A2D",
          padding: BEZEL,
          boxSizing: "border-box",
          opacity: Math.min(1, inP * 1.3) * (1 - outP),
          transform: `translateY(${(1 - inP) * 120 + outP * 60}px) scale(${0.94 + 0.06 * inP})`,
        }}
      >
        <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 50, overflow: "hidden", background: "#FFF" }}>
          {/* Bildschirm 1: Passwort-Seite */}
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${-toDm * 30}%)` }}>
            <Img src={staticFile("ig/passwortseite.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} />
            {tapVisible && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50.5%",
                  width: 70,
                  height: 70,
                  marginLeft: -35,
                  marginTop: -35,
                  borderRadius: 35,
                  background: "rgba(255,255,255,0.55)",
                  border: "2px solid rgba(0,0,0,0.25)",
                  transform: `scale(${frame < PHONE.tap ? 1 : 1 + tapP * 0.6})`,
                  opacity: frame < PHONE.tap ? 1 : 1 - tapP,
                }}
              />
            )}
          </div>
          {/* Bildschirm 2: DM */}
          {frame >= PHONE.toDm && (
            <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - toDm) * 100}%)` }}>
              <DmScreen frame={frame} />
            </div>
          )}
          {/* Dynamic Island */}
          <div style={{ position: "absolute", top: 12, left: SCREEN_W / 2 - 58, width: 116, height: 34, borderRadius: 17, background: "#000" }} />
        </div>
      </div>

      {/* Ton: Tipp, Tastatur, Senden */}
      <Sequence from={PHONE.tap} durationInFrames={8} layout="none">
        <Audio src={staticFile("sfx/click.wav")} volume={0.45} />
      </Sequence>
      {PHONE.word.split("").map((_, i) => (
        <Sequence key={i} from={PHONE.typeStart + i * PHONE.perChar} durationInFrames={4} layout="none">
          <Audio src={staticFile(`sfx/keyboard_tap${(i % 3) + 1}.wav`)} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={SEND} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/notify.wav")} volume={0.3} />
      </Sequence>
    </>
  );
};
