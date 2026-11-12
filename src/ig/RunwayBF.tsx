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
const TEXT_END = T_B + (112 - B_START); // Schnitt auf die Beine bei 4,48 s (Ausgabe-Frame 72)
const CUT_B_LEN = 112 - B_START; // 21 freigestellte Frames in Teil B
// Zweiter Text in der Beine-Einstellung (Quelle 112 bis 174), ebenfalls hinter dem Model
const T2_START = TEXT_END; // 72
const T2_SWITCH = T2_START + 30; // harter Wechsel auf UP TO 80%
const T2_END = T2_START + 63; // Schnitt auf Look 2
// Schluss: Passwort-Hinweis auf der stehenden Endkarte
const END_CARD = T_C + Math.round((34.24 - 31.0) * 25);
const PW_IN = END_CARD + 40;
export const PASSWORT_URL = ""; // vom Kunden: Adresse der Passwort-Seite
// Preis im Text (Kunde: 60 €; Passwort-Seite zeigt 69 €)
const PREIS = "60 €";
const SHOT_IN = PW_IN + 8;
const SHOT_LEN = 115;

let loaded = false;
const loadAnton = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("Anton und Inter");
  const faces = [
    new FontFace("Anton", `url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2')`),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format('woff2')`, { weight: "600" }),
    new FontFace("Inter", `url(${staticFile("fonts/inter-latin-700-normal.woff2")}) format('woff2')`, { weight: "700" }),
  ];
  Promise.all(faces.map((ff) => ff.load().then((x) => document.fonts.add(x)))).then(() => continueRender(h), () => continueRender(h));
};
loadAnton();

const pad = (n: number) => String(n).padStart(4, "0");
const full: React.CSSProperties = { width: "100%", height: "100%" };

export const RunwayBF: React.FC = () => {
  const frame = useCurrentFrame();
  const textScale = interpolate(frame, [0, 30], [1.04, 1], { extrapolateRight: "clamp" });
  const showText = frame < TEXT_END;
  const showT2 = frame >= T2_START && frame < T2_END;
  const cut =
    frame < A_END
      ? `ig/cut/a/cut_${pad(frame)}.png`
      : frame >= T_B && frame < T_B + CUT_B_LEN
        ? `ig/cut/b/cut_${pad(frame - T_B)}.png`
        : showT2
          ? `ig/cut/c/cut_${pad(frame - T2_START)}.png`
          : null;
  const pwIn = interpolate(frame, [PW_IN, PW_IN + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shot = interpolate(frame, [SHOT_IN, SHOT_IN + 20, SHOT_IN + SHOT_LEN - 15, SHOT_IN + SHOT_LEN], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
              TRACKIE <span style={{ color: "#E3120B" }}>{PREIS}</span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {showT2 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginTop: -60, fontFamily: "'Anton', sans-serif", lineHeight: 0.98, color: "#111111" }}>
            {frame < T2_SWITCH && (
              <>
                <div style={{ fontSize: 260 }}>BIGGEST SALE</div>
                <div style={{ fontSize: 260 }}>IN GERMANY</div>
              </>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* freigestelltes Model über dem Text */}
      {(showText || showT2) && cut && <Img src={staticFile(cut)} style={{ position: "absolute", inset: 0, ...full }} />}

      {/* UP TO 80% vor dem Model, damit die Zahl voll lesbar ist */}
      {showT2 && frame >= T2_SWITCH && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginTop: -60, fontFamily: "'Anton', sans-serif", lineHeight: 0.95, color: "#111111" }}>
            <div style={{ fontSize: 230 }}>UP TO</div>
            <div style={{ fontSize: 380, color: "#E3120B" }}>80%</div>
          </div>
        </AbsoluteFill>
      )}

      {/* Schluss: dezent auf der Endkarte */}
      {frame >= PW_IN && (
        <div style={{ position: "absolute", left: 150, top: "50%", transform: "translateY(-50%)", opacity: pwIn, color: "#FFFFFF", fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>
          <div style={{ fontWeight: 700, fontSize: 34, letterSpacing: "0.22em" }}>Nur mit Passwort</div>
          {PASSWORT_URL && <div style={{ fontWeight: 600, fontSize: 26, letterSpacing: "0.12em", marginTop: 14, textTransform: "none", opacity: 0.9 }}>{PASSWORT_URL}</div>}
        </div>
      )}

      {/* Passwort-Seite kurz als Handy-Screenshot */}
      {shot > 0 && (
        <div
          style={{
            position: "absolute",
            right: 160,
            top: 540 - 380,
            width: 404,
            height: 760,
            borderRadius: 46,
            overflow: "hidden",
            border: "7px solid #111111",
            boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
            opacity: shot,
            transform: `translateY(${(1 - shot) * 40}px)`,
          }}
        >
          <Img src={staticFile("ig/passwortseite.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%", display: "block" }} />
        </div>
      )}

      {/* Sounds zu den Einblendungen */}
      <Sequence from={0} durationInFrames={40} layout="none"><Audio src={staticFile("sfx/hit_low.wav")} volume={0.55} /></Sequence>
      <Sequence from={T2_START} durationInFrames={10} layout="none"><Audio src={staticFile("sfx/click.wav")} volume={0.6} /></Sequence>
      <Sequence from={T2_SWITCH} durationInFrames={40} layout="none"><Audio src={staticFile("sfx/hit_low.wav")} volume={0.6} /></Sequence>
      <Sequence from={PW_IN} durationInFrames={10} layout="none"><Audio src={staticFile("sfx/click.wav")} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
