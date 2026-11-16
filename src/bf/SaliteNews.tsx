import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../story/LineupPan";

// SALITE News: das geschnittene Pink-Trackie-Video als Nachrichtenbeitrag.
// Seriöser Sprecher mit Street-Slang, dezente TV-Grafiken im SALITE-Sale-Look (Anton, Inter, Rot nur für Preise und Eilmeldung).
// Aufbau: A-Roll 0 bis 28,42 s (Original-Schnitt), dann Passwort (Countdown-Seite, Wallet), Folgen und DM, Abgang.
// Alle Zeiten in Sekunden in T. Nach dem Sprecher-Take werden die Zeiten auf die Wörter gelegt.
export const FPS = 60;
const f = (s: number) => Math.round(s * FPS);

export const T = {
  aroll: 28.42,
  hookIn: 0.35, // Eilmeldung
  headlineOut: 4.7,
  tickerOut: 8.3,
  zoom: 6.25, // Zoomsprung auf "ausschließlich"
  zoomOut: 8.3,
  priceIn: 9.1, // Preis-Karte
  priceOut: 14.05,
  expertIn: 10.4, // Experten warnen
  expertOut: 13.9,
  witnessIn: 14.07, // Augenzeuge (Reaktion 14,07 bis 14,78)
  witnessOut: 15.5,
  details: [15.6, 16.6, 17.6], // 550 GSM, VON HAND BESTICKT, 100 % BAUMWOLLE (Details 14,78 bis 19,18)
  detailsOut: 19.18,
  restockDark: 19.3, // Spiegel-Selfie ab 19,18
  restockHead: 19.7,
  prints: [23.6, 24.2, 24.8], // Navy, Schwarz, Grau
  pass: 28.42, // Passwort-Teil
  wallet: 30.9,
  bar: 33.0, // 80 %
  follow: 35.2,
  dmType: 35.45,
  followTap: 37.4,
  outro: 38.8,
  logo: 40.7,
  end: 42.2,
};
export const NEWS_FRAMES = f(T.end);

const RED = "#D7261E";
const INK = "#111111";
const OUT = Easing.out(Easing.exp);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useIn = (start: number, len = 0.5) => {
  const fr = useCurrentFrame();
  return interpolate(fr, [f(start), f(start + len)], [0, 1], { ...clamp, easing: OUT });
};
const useOut = (end: number, len = 0.35) => {
  const fr = useCurrentFrame();
  return interpolate(fr, [f(end - len), f(end)], [1, 0], clamp);
};

// ---------- TV-Grafiken ----------
const NewsBug: React.FC = () => {
  const fr = useCurrentFrame();
  const o = useIn(0.2) * useOut(T.pass + 0.01, 0.01);
  const dot = 0.45 + 0.55 * Math.abs(Math.sin((fr / FPS) * Math.PI));
  return (
    <div style={{ position: "absolute", left: 48, top: 236, display: "flex", alignItems: "center", gap: 12, opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: RED, padding: "6px 12px 5px", borderRadius: 4 }}>
        <div style={{ width: 11, height: 11, borderRadius: 6, background: "#FFFFFF", opacity: dot }} />
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 20, letterSpacing: "0.12em", color: "#FFFFFF" }}>LIVE</div>
      </div>
      <div style={{ fontFamily: "'Anton'", fontSize: 30, letterSpacing: "0.05em", color: "#FFFFFF", textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}>SALITE NEWS</div>
    </div>
  );
};

const Breaking: React.FC = () => {
  const fr = useCurrentFrame();
  const inA = useIn(T.hookIn, 0.45);
  const head = useOut(T.headlineOut);
  const tick = useOut(T.tickerOut);
  const crawl = "+++ HAMBURG: PAKET IM UMLAUF +++ PINK TRACKIE NUR ZUM BLACK FRIDAY · 69 € +++ LETZTER RESTOCK: BASIC TRACKSUITS 550 GSM +++ 80 % DER PASSWÖRTER VERGEBEN +++ ";
  const x = -((fr - f(T.hookIn)) * 2.6) % 1700;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1236 }}>
      {/* Schlagzeile */}
      <div style={{ opacity: head, transform: `translateX(${(1 - inA) * -60}px)`, display: "flex", marginLeft: 40 }}>
        <div style={{ background: "#FFFFFF", padding: "12px 22px 8px", fontFamily: "'Anton'", fontSize: 46, color: INK, letterSpacing: "0.01em", boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}>
          LIEFERUNG VERSETZT HAMBURG IN AUFRUHR
        </div>
      </div>
      {/* Laufband */}
      <div style={{ marginTop: 10, height: 52, display: "flex", opacity: Math.min(inA, tick), overflow: "hidden" }}>
        <div style={{ background: RED, color: "#FFFFFF", fontFamily: "'Anton'", fontSize: 30, padding: "8px 18px 0", letterSpacing: "0.04em", zIndex: 1, marginLeft: 40 }}>EILMELDUNG</div>
        <div style={{ flex: 1, background: "rgba(12,12,12,0.78)", overflow: "hidden", position: "relative", marginRight: 140 }}>
          <div style={{ position: "absolute", left: x, top: 12, whiteSpace: "nowrap", fontFamily: "'Inter'", fontWeight: 700, fontSize: 24, color: "#FFFFFF", letterSpacing: "0.02em" }}>
            {crawl}
            {crawl}
            {crawl}
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceCard: React.FC = () => {
  const p = useIn(T.priceIn, 0.5);
  const o = useOut(T.priceOut);
  const red = useIn(T.priceIn + 0.25, 0.4);
  return (
    <div style={{ position: "absolute", left: 48, top: 640, opacity: o * p, transform: `translateX(${(1 - p) * -80}px)` }}>
      <div style={{ background: "#FFFFFF", padding: "18px 24px 20px", boxShadow: "0 10px 30px rgba(0,0,0,0.22)" }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 17, letterSpacing: "0.24em", color: RED }}>NUR ZUM BLACK FRIDAY</div>
        <div style={{ fontFamily: "'Anton'", fontSize: 66, color: INK, lineHeight: 1.05, marginTop: 6 }}>PINK TRACKIE</div>
        <div style={{ display: "inline-block", marginTop: 10, background: RED, color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 800, fontSize: 48, padding: "2px 16px", transform: `scale(${0.6 + 0.4 * red})`, transformOrigin: "left center", opacity: red }}>
          69 €
        </div>
      </div>
    </div>
  );
};

const LowerThird: React.FC<{ start: number; end: number; label: string; title: string }> = ({ start, end, label, title }) => {
  const p = useIn(start, 0.4);
  const o = useOut(end);
  return (
    <div style={{ position: "absolute", left: 40, top: 1250, opacity: o * p, transform: `translateX(${(1 - p) * -60}px)` }}>
      <div style={{ display: "inline-block", background: RED, color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 700, fontSize: 18, letterSpacing: "0.22em", padding: "6px 14px" }}>{label}</div>
      <div style={{ background: "#FFFFFF", padding: "10px 22px 6px", fontFamily: "'Anton'", fontSize: 52, color: INK, boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}>{title}</div>
    </div>
  );
};

// Wort für Wort: SCHWER. SAUBER. BESTICKT.
const DetailWords: React.FC = () => {
  const words = ["550 GSM.", "VON HAND BESTICKT.", "100 % BAUMWOLLE."];
  const o = useOut(T.detailsOut);
  return (
    <div style={{ position: "absolute", left: 60, top: 620, opacity: o }}>
      {words.map((w, i) => (
        <DetailWord key={w} w={w} at={T.details[i]} />
      ))}
    </div>
  );
};
const DetailWord: React.FC<{ w: string; at: number }> = ({ w, at }) => {
  const p = useIn(at, 0.35);
  return (
    <div style={{ fontFamily: "'Anton'", fontSize: 96, lineHeight: 1.04, color: "#FFFFFF", opacity: p, transform: `translateY(${(1 - p) * 24}px)`, textShadow: "0 4px 30px rgba(0,0,0,0.35)" }}>{w}</div>
  );
};

// ---------- Restock: Abzüge der drei Basics ----------
const Restock: React.FC = () => {
  const dark = useIn(T.restockDark, 0.6);
  const head = useIn(T.restockHead, 0.5);
  const o = useOut(T.pass, 0.05);
  const prints = [
    { src: "bf/navy.jpg", x: 120, y: 620, r: -6, at: T.prints[0], name: "NAVY" },
    { src: "bf/schwarz.jpg", x: 560, y: 660, r: 5, at: T.prints[1], name: "SCHWARZ" },
    { src: "bf/grau.jpg", x: 330, y: 760, r: -2, at: T.prints[2], name: "GRAU" },
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: `rgba(8,8,8,${0.55 * dark})`, backdropFilter: `saturate(${1 - 0.5 * dark})` }} />
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.3em", color: "rgba(255,255,255,0.8)" }}>BASIC TRACKSUIT · 550 GSM</div>
        <div style={{ fontFamily: "'Anton'", fontSize: 108, color: "#FFFFFF", lineHeight: 1.05, marginTop: 8 }}>LETZTER RESTOCK</div>
      </div>
      {prints.map((p) => (
        <PrintCard key={p.src} {...p} />
      ))}
      <RestockPrice />
    </AbsoluteFill>
  );
};
const PrintCard: React.FC<{ src: string; x: number; y: number; r: number; at: number; name: string }> = ({ src, x, y, r, at, name }) => {
  const p = useIn(at, 0.55);
  const W = 400;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: W,
        background: "#FFFFFF",
        padding: "14px 14px 46px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        opacity: p,
        transform: `translateY(${(1 - p) * -50}px) rotate(${r + (1 - p) * 6}deg) scale(${1.12 - 0.12 * p})`,
      }}
    >
      <Img src={staticFile(src)} style={{ width: W - 28, display: "block" }} />
      <div style={{ position: "absolute", left: 18, bottom: 12, fontFamily: "'Inter'", fontWeight: 700, fontSize: 18, letterSpacing: "0.24em", color: INK }}>{name}</div>
    </div>
  );
};
const RestockPrice: React.FC = () => {
  const p = useIn(T.prints[2] + 0.6, 0.45);
  return (
    <div style={{ position: "absolute", top: 1290, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `scale(${0.8 + 0.2 * p})` }}>
      <div style={{ background: RED, color: "#FFFFFF", fontFamily: "'Inter'", fontWeight: 800, fontSize: 52, padding: "4px 20px" }}>69 €</div>
    </div>
  );
};

// ---------- Passwort-Teil ----------
const Phone: React.FC<{ children: React.ReactNode; w: number; top: number }> = ({ children, w, top }) => {
  const h = w * 2.174;
  return (
    <div style={{ position: "absolute", left: 540 - w / 2, top, width: w, height: h, borderRadius: w * 0.14, background: "#0B0B0B", padding: 12, boxShadow: "0 30px 70px rgba(0,0,0,0.28)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: w * 0.12, overflow: "hidden", background: "#FFFFFF" }}>
        {children}
        <div style={{ position: "absolute", top: 14, left: "50%", width: w * 0.3, height: 30, marginLeft: -w * 0.15, borderRadius: 16, background: "#000000" }} />
      </div>
    </div>
  );
};

const Password: React.FC = () => {
  const fr = useCurrentFrame();
  const local = fr - f(T.pass);
  const phoneIn = interpolate(local, [0, f(0.6)], [0, 1], { ...clamp, easing: OUT });
  const showWallet = fr >= f(T.wallet);
  const swap = interpolate(fr, [f(T.wallet), f(T.wallet + 0.35)], [0, 1], { ...clamp, easing: OUT });
  const bar = interpolate(fr, [f(T.bar), f(T.bar + 1.1)], [0, 0.8], { ...clamp, easing: Easing.out(Easing.cubic) });
  const barIn = interpolate(fr, [f(T.pass + 0.3), f(T.pass + 0.8)], [0, 1], { ...clamp, easing: OUT });
  const PW = 500;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #F3F5F8 0%, #E3EAF2 100%)" }}>
      {/* Zähler oben */}
      <div style={{ position: "absolute", top: 236, left: 120, right: 140, opacity: barIn }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 21, letterSpacing: "0.26em", color: "#444" }}>PASSWÖRTER VERGEBEN</div>
          <div style={{ fontFamily: "'Anton'", fontSize: 64, lineHeight: 1, color: RED, opacity: bar > 0 ? 1 : 0 }}>{Math.round(bar * 100)} %</div>
        </div>
        <div style={{ marginTop: 12, height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 4 }}>
          <div style={{ width: `${bar * 100}%`, height: "100%", background: INK, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 120}px)` }}>
        <Phone w={PW} top={392}>
          <Img src={staticFile("bf/countdown.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 1 - swap }} />
          {showWallet && (
            <div style={{ position: "absolute", inset: 0, opacity: swap, transform: `translateX(${(1 - swap) * 60}px)` }}>
              <Sequence from={f(T.wallet)} layout="none">
                <OffthreadVideo src={staticFile("bf/wallet.mp4")} trimBefore={f(2.6)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Sequence>
            </div>
          )}
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Folgen und DM (Instagram-Optik) ----------
const IG_BLUE = "#0095F6";
const Follow: React.FC = () => {
  const fr = useCurrentFrame();
  const inP = interpolate(fr, [f(T.follow), f(T.follow + 0.5)], [0, 1], { ...clamp, easing: OUT });
  const word = "Passwort";
  const typed = Math.max(0, Math.min(word.length, Math.floor((fr - f(T.dmType)) / f(0.11))));
  const sentAt = T.dmType + word.length * 0.11 + 0.25;
  const sent = interpolate(fr, [f(sentAt), f(sentAt + 0.3)], [0, 1], { ...clamp, easing: OUT });
  const followed = fr >= f(T.followTap);
  const tap = interpolate(fr, [f(T.followTap - 0.08), f(T.followTap), f(T.followTap + 0.12)], [1, 0.94, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#FFFFFF", opacity: inP }}>
      {/* Profilkopf */}
      <div style={{ position: "absolute", top: 260, left: 60, right: 160, display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ width: 200, height: 200, borderRadius: 100, overflow: "hidden", border: "1px solid #DBDBDB", flexShrink: 0 }}>
          <Img src={staticFile("bf/profilbild.jpg")} style={{ width: "124%", marginLeft: "-12%", marginTop: "-12%" }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 44, color: "#000" }}>saliteclothing</div>
          <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 26, color: "#737373", marginTop: 6 }}>SALITE</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 60, right: 160, display: "flex", gap: 14, transform: `scale(${tap})`, transformOrigin: "left center" }}>
        <div
          style={{
            flex: 1,
            height: 76,
            borderRadius: 16,
            background: followed ? "#EFEFEF" : IG_BLUE,
            color: followed ? "#000" : "#FFF",
            fontFamily: "'Inter'",
            fontWeight: 700,
            fontSize: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {followed ? "Gefolgt" : "Folgen"}
        </div>
        <div style={{ flex: 1, height: 76, borderRadius: 16, background: "#EFEFEF", color: "#000", fontFamily: "'Inter'", fontWeight: 700, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Nachricht
        </div>
      </div>
      {/* DM */}
      <div style={{ position: "absolute", top: 700, left: 60, right: 160, height: 1, background: "#EFEFEF" }} />
      <div style={{ position: "absolute", top: 760, right: 160, display: "flex", justifyContent: "flex-end", opacity: sent, transform: `translateY(${(1 - sent) * 20}px)` }}>
        <div style={{ background: "#3797F0", color: "#FFF", fontFamily: "'Inter'", fontWeight: 600, fontSize: 38, padding: "18px 30px", borderRadius: 40 }}>Passwort</div>
      </div>
      <div style={{ position: "absolute", top: 900, left: 60, right: 160, height: 92, borderRadius: 46, border: "2px solid #DBDBDB", display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 34, color: sent > 0 ? "#8E8E8E" : "#000" }}>
          {sent > 0 ? "Nachricht senden …" : word.slice(0, typed)}
          {sent === 0 && <span style={{ opacity: Math.floor(fr / 30) % 2 ? 1 : 0, color: IG_BLUE }}>|</span>}
        </div>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 32, color: typed > 0 && sent === 0 ? IG_BLUE : "#B3DBFF" }}>Senden</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Abgang ----------
const Outro: React.FC = () => {
  const a = useIn(T.outro + 0.1, 0.5);
  const logo = useIn(T.logo, 0.6);
  const textOut = useOut(T.logo - 0.15, 0.3);
  return (
    <AbsoluteFill style={{ background: "#0E0D0C" }}>
      <div style={{ position: "absolute", top: 780, left: 0, right: 0, textAlign: "center", opacity: a * textOut }}>
        <div style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 22, letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)" }}>DAS WAR</div>
        <div style={{ fontFamily: "'Anton'", fontSize: 120, color: "#FFFFFF", lineHeight: 1.05, marginTop: 6 }}>SALITE NEWS</div>
      </div>
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: logo }}>
        <Img src={staticFile("brand/salite-s-light.svg")} style={{ height: 260 }} />
        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: 26, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)", marginTop: 36 }}>@saliteclothing</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Ton ----------
const Sfx: React.FC<{ at: number; src: string; vol: number; len?: number }> = ({ at, src, vol, len = 1.5 }) => (
  <Sequence from={f(at)} durationInFrames={f(len)}>
    <Audio src={staticFile(`sfx/${src}`)} volume={vol} />
  </Sequence>
);

export type NewsProps = { voice?: string; voiceVol?: number };

export const SaliteNews: React.FC<NewsProps> = ({ voice, voiceVol = 1 }) => {
  loadFonts();
  const fr = useCurrentFrame();
  // Zoomsprung auf dem betonten Wort
  const zoom = fr >= f(T.zoom) && fr < f(T.zoomOut) ? 1.1 : 1;
  // Augenzeuge: langsames Hineinfahren
  const push = interpolate(fr, [f(T.witnessIn), f(14.78)], [1, 1.05], clamp);
  const scale = zoom * (fr >= f(T.witnessIn) && fr < f(14.78) ? push : 1);
  // Musik: leise, unter Vollbild-Grafik 3 dB lauter
  const bedVol = (fr2: number) => (fr2 >= f(T.pass) && fr2 < f(T.outro) ? 0.17 : 0.12) * interpolate(fr2, [f(T.outro), f(T.outro + 1.2)], [1, 0], clamp);
  const typeStart = T.dmType;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* A-Roll */}
      <Sequence durationInFrames={f(T.aroll)}>
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <OffthreadVideo src={staticFile("bf/pink.mp4")} volume={voice ? 0.35 : 0.6} />
        </AbsoluteFill>
        <Breaking />
        <PriceCard />
        <LowerThird start={T.expertIn} end={T.expertOut} label="EXPERTEN WARNEN" title="GEFAHR FÜR DIE KONKURRENZ" />
        <LowerThird start={T.witnessIn} end={T.witnessOut} label="AUGENZEUGE" title="SPRACHLOS" />
        <DetailWords />
        <Restock />
      </Sequence>
      {/* diese Teile rechnen mit absoluten Zeiten, daher ohne Sequence eingeblendet */}
      {fr >= f(T.pass) && fr < f(T.follow) && <Password />}
      {fr >= f(T.follow) && fr < f(T.outro) && <Follow />}
      {fr >= f(T.outro) && <Outro />}
      <NewsBug />

      {/* Ton */}
      <Audio src={staticFile("bfa/news_bed.wav")} volume={(fr2) => bedVol(fr2)} />
      {voice && <Audio src={staticFile(voice)} volume={voiceVol} />}
      <Sfx at={0.12} src="news_gong.wav" vol={0.22} len={1.6} />
      <Sfx at={T.zoom} src="hit_low.wav" vol={0.12} />
      <Sfx at={T.priceIn + 0.25} src="tick.wav" vol={0.2} len={0.4} />
      <Sfx at={T.witnessIn} src="click.wav" vol={0.18} len={0.4} />
      {T.prints.map((p) => (
        <Sfx key={p} at={p} src="whoosh_soft.wav" vol={0.13} len={0.8} />
      ))}
      <Sfx at={T.pass} src="hit_low.wav" vol={0.1} />
      <Sfx at={T.bar + 1.1} src="tick.wav" vol={0.2} len={0.4} />
      {Array.from({ length: 8 }, (_, i) => (
        <Sfx key={`k${i}`} at={typeStart + i * 0.11} src={`keyboard_tap${(i % 3) + 1}.wav`} vol={0.16} len={0.2} />
      ))}
      <Sfx at={T.dmType + 8 * 0.11 + 0.25} src="click.wav" vol={0.16} len={0.4} />
      <Sfx at={T.followTap} src="notify.wav" vol={0.16} len={1} />
      <Sfx at={T.logo} src="hit_low.wav" vol={0.08} />
    </AbsoluteFill>
  );
};
