# Aurora — AI Media House

One home for everything you watch and hear: **on-demand video** (YouTube-style),
**music** (Spotify/Apple Music-style), and **live TV & radio from across the globe** —
tied together by a persistent media player and an **AI concierge** that curates across
every medium.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**,
**HLS.js**, and the **Anthropic SDK**.

---

## ✨ Features

| Section | What it does | Data source |
| --- | --- | --- |
| 🎬 **Video** | Browse & watch on-demand video with a YouTube-style grid, category filters, and a floating/theater HLS player | Free, openly-licensed clips + adaptive HLS demo streams |
| 🎵 **Music** | Playlists, an album/track list, and a Spotify-style "now playing" bar with queue, seek & volume | Openly-licensed audio |
| 📺 **Live TV** | Thousands of **real** free-to-air channels worldwide — news, sports, movies, kids — browsable by category and country | [iptv-org](https://github.com/iptv-org/iptv) public directory |
| 📻 **Live Radio** | **35,000+ real** live stations worldwide, searchable and browsable by genre | [Radio Browser](https://www.radio-browser.info) API |
| 🤖 **Aurora AI** | A natural-language concierge that recommends across video, music, TV and radio | Anthropic API (`claude-opus-4-8`) with an offline keyword fallback |

The global media engine lives once at the app root, so **playback continues as you navigate**
between pages. Audio plays through a Spotify-style bottom bar; video uses a YouTube-style
corner mini-player that expands to a full theater view.

---

## 🚀 Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Build & run production:

```bash
npm run build
npm start
```

### Enabling the AI concierge

The concierge works out-of-the-box with a built-in keyword fallback. For full conversational
curation, set an Anthropic API key:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
# optional — defaults to claude-opus-4-8
AURORA_AI_MODEL=claude-opus-4-8
```

---

## ☁️ Deploy

The only server-side piece is `/api/ai` (Node runtime); live TV/radio are fetched
client-side, so the host needs no special networking. Set **`ANTHROPIC_API_KEY`** in the
platform's environment variables (see `.env.example`).

**Vercel (recommended — zero config):** import the repo at [vercel.com](https://vercel.com),
add the env var, deploy. Next.js is auto-detected.

**Docker / any Node host** (Railway, Render, Fly.io, Google Cloud Run): the repo ships a
`Dockerfile` built on Next.js [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output):

```bash
docker build -t aurora .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... aurora
```

> A persistent Node host (rather than serverless functions) is the better home if you later
> add a **server-side HLS proxy** to widen live-stream coverage — long-lived streaming
> connections don't fit serverless time/bandwidth limits well.

Note: a pure static export isn't possible as-is because of the `/api/ai` route.

---

## 🧱 Architecture

```
src/
  app/
    page.tsx                 Home / discover
    video|music|tv|radio/    Section pages
    search/                  Universal search
    api/ai/route.ts          AI concierge (Anthropic + offline fallback)
  components/
    player/                  PlayerHost (engine) · NowPlayingBar · FloatingVideo
    shell/                   Sidebar · TopBar · MobileNav · AppShell
    media/                   MediaCard · Shelf · MediaGrid
    ai/Concierge.tsx         Slide-over AI chat
    live/                    Async browse + home live shelves
    ui/                      Artwork · Chips · PageHeader · States
  lib/
    store.ts                 Global player state (zustand)
    radio.ts · tv.ts         Live directory clients (client-side, CORS-friendly)
    catalog.ts               Video & music catalog
    types.ts · utils.ts · ui.ts
```

A single `MediaItem` type represents anything playable (video, song, TV channel, radio
station), so one player handles them all.

---

## ⚖️ A note on real vs. licensed content

- **Live TV & Radio are real** and stream public, free-to-air sources. A built-in **server-side
  stream proxy** (`/api/stream`) widens coverage by adding CORS headers, upgrading HTTP origins
  to HTTPS, and rewriting HLS playlists — HTTP streams start proxied, and HTTPS streams fall back
  to the proxy on a CORS failure. Streams that are genuinely offline or geo-blocked still surface
  a clear error with a "try next" action. The proxy is SSRF-hardened (http(s) only;
  private/loopback/metadata IPs blocked across redirects; media-only responses); a production
  deployment should add rate limiting and ideally a CDN-host allowlist.
- **Premium broadcasts** (e.g. the World Cup in 4K) require commercial licensing. Aurora ships
  the full 4K-capable player and sports-channel UI, fed by the free sports channels that are
  publicly available — drop in a licensed source and it plays through the same player.

---

## 📦 Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · HLS.js · Zustand · lucide-react · @anthropic-ai/sdk
