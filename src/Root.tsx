import { Composition } from "remotion";
import { Main, OUTRO_FRAMES } from "./Main";
import { IG, IG_FRAMES, Instagram } from "./ig/Instagram";
import { Runway, RW } from "./ig/Runway";
import { RBF, RunwayBF } from "./ig/RunwayBF";

// Werte exakt aus ffprobe von public/video.mp4:
// HEVC 2160x3840 (9:16), 60 fps, 78,227 s, bt709 SDR
export const SOURCE = {
  width: 2160,
  height: 3840,
  fps: 60,
  durationInFrames: Math.floor(78.227007 * 60), // 4693
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      fps={SOURCE.fps}
      width={SOURCE.width}
      height={SOURCE.height}
      durationInFrames={SOURCE.durationInFrames + OUTRO_FRAMES}
    />
    {/* Instagram-Post Black Friday: RED-Runway-Film im 4:5 Rahmen */}
    <Composition id="Instagram" component={Instagram} fps={IG.fps} width={IG.width} height={IG.height} durationInFrames={IG_FRAMES} />
    {/* Runway-Film Vollbild 16:9 ohne Tanktop-Look, Musik ungeschnitten */}
    <Composition id="RunwayPlain" component={Runway} defaultProps={{ variant: "plain" as const }} fps={RW.fps} width={RW.width} height={RW.height} durationInFrames={RW.frames} />
    <Composition id="RunwayInsta" component={Runway} defaultProps={{ variant: "insta" as const }} fps={RW.fps} width={RW.width} height={RW.height} durationInFrames={RW.frames} />
    <Composition id="RunwayTikTok" component={Runway} defaultProps={{ variant: "tiktok" as const }} fps={RW.fps} width={RW.width} height={RW.height} durationInFrames={RW.frames} />
    {/* Runway-Film mit BLACK FRIDAY hinter dem Model am Anfang, ohne Titel */}
    <Composition id="RunwayBF" component={RunwayBF} defaultProps={{ glass: false, outro: false }} fps={RBF.fps} width={RBF.width} height={RBF.height} durationInFrames={RBF.frames} />
    {/* gleiche Version mit Glas-Schrift */}
    <Composition id="RunwayBFGlass" component={RunwayBF} defaultProps={{ glass: true, outro: true }} fps={RBF.fps} width={RBF.width} height={RBF.height} durationInFrames={RBF.frames} />
  </>
);
