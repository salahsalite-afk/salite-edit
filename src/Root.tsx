import { Composition } from "remotion";
import { Main, OUTRO_FRAMES } from "./Main";

// Werte exakt aus ffprobe von public/video.mp4:
// HEVC 2160x3840 (9:16), 60 fps, 78,227 s, bt709 SDR
export const SOURCE = {
  width: 2160,
  height: 3840,
  fps: 60,
  durationInFrames: Math.floor(78.227007 * 60), // 4693
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    fps={SOURCE.fps}
    width={SOURCE.width}
    height={SOURCE.height}
    durationInFrames={SOURCE.durationInFrames + OUTRO_FRAMES}
  />
);
