// Grafik-Kompositionen (Karten) mit schlankem public-Ordner rendern, ein Bundle für alles.
// node scripts/render_card.mjs <outdir> still|video <compId> [sek...]
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs/promises";
const [outDir, mode, id, ...secs] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public_card"), enableCaching: false });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
if (mode === "video") {
  const out = path.join(outDir, `${secs[0] ?? id}.mp4`);
  await renderMedia({ serveUrl, composition, codec: "h264", crf: 16, pixelFormat: "yuv420p", outputLocation: out, concurrency: Number(process.env.CONC ?? 4), browserExecutable });
  console.log("ok", out);
} else {
  for (const s of secs) {
    const output = path.join(outDir, `${id}_${s}s.png`);
    await renderStill({ serveUrl, composition, frame: Math.round(Number(s) * composition.fps), output, scale: Number(process.env.SCALE ?? 0.5), browserExecutable });
    console.log("ok", output);
  }
}
// eigenes Bundle wieder entfernen, damit der Speicher nicht vollläuft
await fs.rm(serveUrl, { recursive: true, force: true });
