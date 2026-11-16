// Grafik-Kompositionen (Karten) mit schlankem public-Ordner rendern, ein Bundle für alles.
// node scripts/render_card.mjs <outdir> still|video <compId> [sek...]
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs/promises";
const [outDir, mode, id, ...secs] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve(process.env.PUBLIC ?? "public_card"), enableCaching: false });
try {
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const composition = await selectComposition({ serveUrl, id, browserExecutable, inputProps });
if (mode === "audio") {
  // nur Ton (WAV), für die Mischung mit ffmpeg
  const out = path.join(outDir, `${secs[0] ?? id}.wav`);
  await renderMedia({ serveUrl, composition, inputProps, codec: "wav", outputLocation: out, concurrency: 1, browserExecutable });
  console.log("ok", out);
} else if (mode === "video") {
  const out = path.join(outDir, `${secs[0] ?? id}.mp4`);
  await renderMedia({ serveUrl, composition, inputProps, codec: "h264", crf: 16, pixelFormat: "yuv420p", colorSpace: "bt709", outputLocation: out, concurrency: Number(process.env.CONC ?? 4), browserExecutable, muted: process.env.MUTED === "1", offthreadVideoCacheSizeInBytes: Number(process.env.CACHE_MB ?? 1024) * 1024 * 1024, onProgress: ({ renderedFrames }) => { if (renderedFrames % 300 === 0) console.log("frame", renderedFrames); } });
  console.log("ok", out);
} else {
  for (const s of secs) {
    const output = path.join(outDir, `${id}_${s}s.png`);
    await renderStill({ serveUrl, composition, frame: Math.round(Number(s) * composition.fps), output, scale: Number(process.env.SCALE ?? 0.5), browserExecutable });
    console.log("ok", output);
  }
}
} finally {
  // eigenes Bundle immer entfernen, auch bei Fehlern, damit der Speicher nicht vollläuft
  await fs.rm(serveUrl, { recursive: true, force: true });
}
