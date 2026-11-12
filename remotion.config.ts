import { Config } from "@remotion/cli/config";

// Qualitätsregeln: H.264, CRF 16, yuv420p, AAC 320k / 48 kHz
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setAudioCodec("aac");
Config.setAudioBitrate("320k");
Config.setVideoImageFormat("png"); // verlustfreie Frames, keine JPEG-Artefakte
Config.setChromiumOpenGlRenderer("angle");
// Farbraum: wird nach der ffprobe-Analyse an die Quelle angepasst (bt709 / bt2020)
Config.setColorSpace("bt709");
Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell");
// Speicher begrenzen (4K-Clips + Encoder sprengen sonst das Limit der Umgebung)
Config.setConcurrency(2);
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
