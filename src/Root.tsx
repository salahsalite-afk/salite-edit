import { Composition } from "remotion";
import { Main, OUTRO_FRAMES } from "./Main";
import { IG, IG_FRAMES, Instagram } from "./ig/Instagram";
import { Runway, RW } from "./ig/Runway";
import { RBF, RunwayBF } from "./ig/RunwayBF";
import { RC, RunwayClean } from "./ig/RunwayClean";
import { CARD, SafetyCard } from "./card/SafetyCard";
import { Mockup } from "./card/TracksuitMockup";
import { FIT_STORY, FIT_STORY_DEFAULT, FitStory, fitStoryFrames } from "./story/FitStory";
import { LINEUP, LINEUP_DEFAULT, LineupPan, lineupFrames } from "./story/LineupPan";
import { FIT_SINGLE, FIT_SINGLE_DEFAULT, FitSingle } from "./story/FitSingle";
import { BEAMER, SafetyBeamer } from "./card/SafetyBeamer";
import { BEAMER_CLEAN, SafetyBeamerClean } from "./card/SafetyBeamerClean";
import { COMIC_CARD, COMIC_SLIDES, SafetyComicCard, SafetyComicSlides } from "./card/SafetyComic";

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
    {/* Version 1 clean (Geschäftspartner) und Version 2 mit Standbild-Preisen */}
    <Composition id="RunwayClean" component={RunwayClean} defaultProps={{ freeze: false, track: false }} fps={RC.fps} width={RC.width} height={RC.height} durationInFrames={RC.frames} />
    <Composition id="RunwayFreeze" component={RunwayClean} defaultProps={{ freeze: true, track: false }} fps={RC.fps} width={RC.width} height={RC.height} durationInFrames={RC.frames} />
    <Composition id="RunwayTrack" component={RunwayClean} defaultProps={{ freeze: false, track: true, drone: true, ramp: false }} fps={RC.fps} width={RC.width} height={RC.height} durationInFrames={RC.frames} />
    {/* markierte V3 ohne Drohne: Scan-Sound und Zeitlupen-Rampe */}
    <Composition id="RunwayTrackRamp" component={RunwayClean} defaultProps={{ freeze: false, track: true, drone: false, ramp: true }} fps={RC.fps} width={RC.width} height={RC.height} durationInFrames={RC.frames} />
    {/* V4: Drohnen-Einschub beim grauen Look mit Standbild von oben */}
    <Composition id="RunwayDrone" component={RunwayClean} defaultProps={{ freeze: true, track: false, drone: false, ramp: false, droneCut: true }} fps={RC.fps} width={RC.width} height={RC.height} durationInFrames={RC.frames} />
    {/* Sicherheitskarte Fahrschule (Satire) */}
    <Composition id="SafetyCard" component={SafetyCard} fps={CARD.fps} width={CARD.width} height={CARD.height} durationInFrames={CARD.frames} />
    {/* Sicherheitskarte für den Beamer (16:9), Fahrlehrer erklärt Feld für Feld */}
    <Composition id="SafetyBeamer" component={SafetyBeamer} fps={BEAMER.fps} width={BEAMER.width} height={BEAMER.height} durationInFrames={BEAMER.frames} />
    {/* reduzierte Beamer-Karte: nur ein paar Sekunden im Bild */}
    <Composition id="SafetyBeamerClean" component={SafetyBeamerClean} fps={BEAMER_CLEAN.fps} width={BEAMER_CLEAN.width} height={BEAMER_CLEAN.height} durationInFrames={BEAMER_CLEAN.frames} />
    {/* Comic-Sicherheitskarte: dezente Karte und Slideshow */}
    <Composition id="SafetyComicCard" component={SafetyComicCard} fps={COMIC_CARD.fps} width={COMIC_CARD.width} height={COMIC_CARD.height} durationInFrames={COMIC_CARD.frames} />
    <Composition id="SafetyComicSlides" component={SafetyComicSlides} fps={COMIC_SLIDES.fps} width={COMIC_SLIDES.width} height={COMIC_SLIDES.height} durationInFrames={COMIC_SLIDES.frames} />
    {/* Fit-Story: ein Look aus allen Perspektiven in einer Instagram Story */}
    <Composition id="FitStory" component={FitStory} defaultProps={FIT_STORY_DEFAULT} fps={FIT_STORY.fps} width={FIT_STORY.width} height={FIT_STORY.height} durationInFrames={1} />
    <Composition id="FitStoryVideo" component={FitStory} defaultProps={{ ...FIT_STORY_DEFAULT, animate: true }} fps={FIT_STORY.fps} width={FIT_STORY.width} height={FIT_STORY.height} durationInFrames={fitStoryFrames(FIT_STORY_DEFAULT.figures.length)} />
    {/* Lookbook-Line-up: Kamera gleitet von Figur zu Figur, Black-Friday-Preise, Leoparden-Läufer */}
    <Composition id="LineupPan" component={LineupPan} defaultProps={LINEUP_DEFAULT} fps={LINEUP.fps} width={LINEUP.width} height={LINEUP.height} durationInFrames={lineupFrames(LINEUP_DEFAULT.figures.length)} />
    {/* Story mit einem Look auf kleinem Leoparden-Teppich */}
    <Composition id="FitSingle" component={FitSingle} defaultProps={FIT_SINGLE_DEFAULT} fps={FIT_SINGLE.fps} width={FIT_SINGLE.width} height={FIT_SINGLE.height} durationInFrames={FIT_SINGLE.frames} />
    <Composition id="FitSingleCurtain" component={FitSingle} defaultProps={{ ...FIT_SINGLE_DEFAULT, backdrop: "curtain" as const }} fps={FIT_SINGLE.fps} width={FIT_SINGLE.width} height={FIT_SINGLE.height} durationInFrames={FIT_SINGLE.frames} />
    <Composition id="FitSingleSilver" component={FitSingle} defaultProps={{ ...FIT_SINGLE_DEFAULT, backdrop: "silver" as const }} fps={FIT_SINGLE.fps} width={FIT_SINGLE.width} height={FIT_SINGLE.height} durationInFrames={FIT_SINGLE.frames} />
    {/* Digitales Tracksuit-Mockup (transparent), je Farbe */}
    {(["grey", "black", "bordeaux", "pink"] as const).map((c) => (
      <Composition key={c} id={`Mockup-${c}`} component={Mockup} defaultProps={{ color: c }} fps={30} width={1200} height={1800} durationInFrames={1} />
    ))}
  </>
);
