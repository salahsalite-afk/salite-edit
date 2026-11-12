import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Camera } from "./components/Camera";
import { Captions } from "./components/Captions";
import { Print } from "./components/Print";
import { Abgang, Akte, BlackFriday, Counter, Dim, Float, Liste } from "./components/Scenes";
import { f, loadFonts } from "./theme";

loadFonts();

export const VIDEO_FRAMES = Math.floor(78.227007 * 60); // 4693
export const OUTRO_FRAMES = 252; // 4,2 s Abgang: Schnee-Clip als Abzug in der Stille, dann Logo
// Preise wie vom Kunden vorgegeben: 130 € auf 69 €, im Shop bis zu 80 % Rabatt
const PREIS = { alt: "130 €", neu: "69 €", shop: "BIS ZU 80 % RABATT IM SHOP" };
// Handles bestätigt
const HANDLES = [
  { label: "TIKTOK", handle: "@saliteclothing1" },
  { label: "INSTAGRAM", handle: "@saliteclothing" },
];

// Sequenz zwischen zwei Zeitpunkten in Sekunden
const At: React.FC<{ a: number; b: number; children: React.ReactNode; name?: string }> = ({ a, b, children, name }) => (
  <Sequence from={f(a)} durationInFrames={f(b) - f(a)} name={name} layout="none">
    {children}
  </Sequence>
);

// Ton: Effekte sitzen auf dem Frame der Bewegung, Zeitpunkte aus transcript.json
const SFX: { at: number; file: string; vol: number; until?: number }[] = [
  { at: 2.92, file: "whoosh_soft", vol: 0.32 }, // Puffprint fliegt ein
  { at: 5.8, file: "whoosh_soft", vol: 0.32 }, // Stack fliegt ein
  { at: 11.38, file: "tick", vol: 0.28 }, // "Single?"
  { at: 14.04, file: "tick", vol: 0.28 }, // Tracksuit 1
  { at: 16.2, file: "tick", vol: 0.3 }, // Tracksuit 3
  { at: 19.3, file: "whoosh_soft", vol: 0.2 }, // Tagtraum: Erinnerungen
  { at: 23.46, file: "tick", vol: 0.3 }, // 550 Zähler
  { at: 33.1, file: "whoosh_soft", vol: 0.24 }, // Patientenakte
  { at: 34.14, file: "hit_low", vol: 0.42 }, // Stempel BESESSEN
  { at: 35.4, file: "tick", vol: 0.2 }, // Denkpause: Uhr tickt
  { at: 36.4, file: "tick", vol: 0.2 },
  { at: 40.74, file: "whoosh_soft", vol: 0.32 }, // Fit-Clip
  { at: 44.84, file: "whoosh_soft", vol: 0.28 }, // Stoff-Foto
  { at: 51.62, file: "hit_low", vol: 0.5 }, // "kein Therapeut"
  { at: 52.66, file: "drone_low", vol: 0.2, until: 56.64 }, // Bedrohung, reißt bei "Alles." ab
  { at: 56.64, file: "hit_low", vol: 0.4 }, // "Alles."
  { at: 58.1, file: "hit_low", vol: 0.5 }, // "nicht mein Tracksuit"
  { at: 66.2, file: "drone_low", vol: 0.28, until: 68.4 }, // tiefer Ton unter BLACK FRIDAY, reißt ab
  { at: 66.9, file: "hit_low", vol: 0.55 }, // Preis 69 € schlägt ein
  { at: 73.42, file: "click", vol: 0.28 }, // 01 Folgen
  { at: 74.52, file: "click", vol: 0.28 }, // 02 Kommentieren
];

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#1E1712" }}>
    {/* Basis-Ebene: Originalvideo 1:1, volle Länge, Originalton. Keine Skalierung, kein Filter. */}
    <Sequence durationInFrames={VIDEO_FRAMES} name="Video + Kamera">
      <Camera />
    </Sequence>

    {/* OBJEKT: Puffprint */}
    <At a={2.85} b={4.95} name="OBJEKT Puffprint">
      <Print src={staticFile("assets/puffprint.jpg")} cx={700} cy={1080} width={820} aspect={0.8} rotate={-4} crop={{ x: 150, y: 760, w: 820, natW: 1125, natH: 2000 }} />
    </At>

    {/* OBJEKT: Stack auf den Schuhen */}
    <At a={5.75} b={7.85} name="OBJEKT Stack">
      <Print src={staticFile("assets/fit_stack.jpg")} cx={760} cy={1000} width={820} aspect={1} rotate={3} crop={{ x: 300, y: 1000, w: 820, natW: 1125, natH: 2000 }} from={{ dx: -520, dy: 180, rot: -6 }} />
    </At>

    {/* TAGTRAUM: "Ach, wenn du nur wüsstest" + Pause, Erinnerungen schweben herein */}
    <At a={19.3} b={21.18} name="Erinnerung 1">
      <Float><Print src={staticFile("assets/puffprint.jpg")} cx={640} cy={1000} width={560} aspect={0.8} rotate={-6} crop={{ x: 290, y: 940, w: 560, natW: 1125, natH: 2000 }} from={{ dx: -200, dy: -120, rot: -8 }} /></Float>
    </At>
    <At a={19.75} b={21.18} name="Erinnerung 2">
      <Float amp={18}><Print src={staticFile("assets/barber.jpg")} cx={1500} cy={900} width={520} aspect={3 / 4} rotate={5} objectPosition="50% 35%" from={{ dx: 200, dy: -140, rot: 8 }} /></Float>
    </At>
    <At a={20.2} b={21.18} name="Erinnerung 3">
      <Float amp={12}><Print src={staticFile("assets/black_puff.png")} cx={1100} cy={1350} width={540} aspect={0.8} rotate={-2} crop={{ x: 500, y: 640, w: 560, natW: 1333, natH: 2000 }} from={{ dx: 0, dy: 200, rot: 4 }} /></Float>
    </At>

    {/* BEWEIS: 550 GSM */}
    <At a={23.0} b={24.8} name="BEWEIS Hintergrund">
      <Dim amount={0.45} />
    </At>
    <At a={23.1} b={24.8} name="BEWEIS 550">
      <Counter value={550} label="GSM" cy={2040} />
    </At>

    {/* ABZUG: Fit-Clip, dann Stoff-Foto legt sich darüber */}
    <At a={40.66} b={46.4} name="ABZUG Fit">
      <Dim />
    </At>
    <At a={40.74} b={46.4} name="Fit-Clip">
      <Print src={staticFile("assets/stoff_clip.mov")} video startFrom={18} cx={900} cy={1250} width={760} aspect={9 / 16} rotate={-3} />
    </At>
    <At a={44.84} b={46.4} name="Stoff-Foto">
      <Print src={staticFile("assets/stoff.png")} cx={1220} cy={1520} width={760} aspect={3 / 4} rotate={5} from={{ dx: 420, dy: 260, rot: 8 }} />
    </At>

    {/* PATIENTENAKTE: "genauso besessen" wird gestempelt, der Therapeut sammelt Informationen */}
    <At a={33.1} b={39.4} name="Patientenakte">
      <Akte befund="Tracksuit" stamp="BESESSEN" stampAt={f(34.14 - 33.1)} />
    </At>

    {/* TITEL: Black Friday, 69 € */}
    <At a={66.2} b={68.4} name="BLACK FRIDAY">
      <BlackFriday cutAt={f(66.68 - 66.2)} priceAt={f(66.9 - 66.2)} oldPrice={PREIS.alt} newPrice={PREIS.neu} sub="DER TRACKSUIT" shop={PREIS.shop}>
        <Sequence from={f(66.68 - 66.2) + 4} layout="none">
          <Print src={staticFile("assets/zip_model.jpg")} cx={700} cy={2720} width={640} aspect={0.75} rotate={-5} from={{ dx: -300, dy: 260, rot: -8 }} />
        </Sequence>
        <Sequence from={f(66.9 - 66.2) + 6} layout="none">
          <Print src={staticFile("assets/bordeaux_hood.jpg")} cx={1400} cy={2760} width={600} aspect={0.75} rotate={6} objectPosition="50% 30%" from={{ dx: 300, dy: 260, rot: 8 }} />
        </Sequence>
      </BlackFriday>
    </At>

    {/* LISTE: so kommt man an das Passwort */}
    <At a={69.24} b={75.4} name="LISTE Passwort">
      <Liste
        title="DAS PASSWORT"
        items={[
          { at: f(73.42 - 69.24), no: "01", text: "Folgen", sub: "TIKTOK UND INSTAGRAM" },
          { at: f(74.52 - 69.24), no: "02", text: "Kommentieren" },
        ]}
      />
    </At>

    <Captions />

    {/* ABGANG: Stille, Schnee-Clip als Abzug, dann Wortmarke und Handles */}
    <Sequence from={VIDEO_FRAMES} durationInFrames={OUTRO_FRAMES} name="ABGANG">
      <Abgang logoAt={150} lines={HANDLES} />
    </Sequence>
    <Sequence from={VIDEO_FRAMES + 6} durationInFrames={136} name="ABZUG Schnee (Ende)">
      <Print src={staticFile("assets/schnee_clip.mov")} video cx={1080} cy={1700} width={900} aspect={9 / 16} rotate={-3} />
    </Sequence>

    {SFX.map((s, i) => (
      <Sequence key={i} from={f(s.at)} durationInFrames={s.until ? f(s.until) - f(s.at) : undefined} name={`SFX ${s.file}`} layout="none">
        <Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.vol} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
