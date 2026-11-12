// Standbilder rendern: node scripts/stills.mjs <outdir> <scale> sec1 sec2 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [outDir, scale, ...secs] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Main", browserExecutable });
for (const s of secs) {
  const frame = Math.round(Number(s) * 60);
  const output = path.join(outDir, `still_${s}s.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: Number(scale), browserExecutable, imageFormat: "png" });
  console.log("ok", output);
}
