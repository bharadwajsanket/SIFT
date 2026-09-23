<div align="center">
  <img src="frontend/public/icon.svg" width="68" height="68" alt="SIFT Logo" />
  <h1>SIFT</h1>
  <p><strong>Search &amp; Information Filtering Tool</strong></p>
  <p><em>A private, self-hosted search instrument with a spatial canvas UI and offline local AI.</em></p>
</div>

---

## Why I built this

I use search hundreds of times a day.

Over time, default search engines started feeling increasingly cluttered: sponsored links at the top, SEO spam everywhere, forced accounts, tracking, and interfaces designed more like ad feeds than instruments.

I didn't want another cloud subscription, another account to manage, or a website trying to profile me. I just wanted a fast, private, self-hosted search setup that felt like my own workspace—where the UI looks great, the results are clean, and if I want an AI summary, it runs locally on my own machine without sending queries to a third-party API.

So I built SIFT.

---

## What SIFT actually is

SIFT is a personal search workstation. It pulls together two main pieces:

1. **[SearXNG](https://github.com/searxng/searxng)** under the hood to aggregate search results across Google, Brave, Bing, DuckDuckGo, Wikipedia, GitHub, and more without tracking.
2. **[llama.cpp](https://github.com/ggerganov/llama.cpp)** running an offline GGUF model (`Qwen3-4B`) to answer technical and factual questions immediately.

The whole thing runs locally via Docker, keeps all your settings in your browser, and doesn't phone home.

---

## What it can do

- **Spatial Home Canvas**: Instead of an empty white page with a box in the middle, the home screen uses the peripheral space for subtle, useful widgets—a clock with custom timezones, weather via Open-Meteo, customizable pinned shortcuts with auto-fetched favicons, and local search history.
- **Glass & Matte Visual Modes**: Switch between rich translucent glassmorphism (with backdrop blur and subtle reflections) and a clean, high-contrast matte mode across Dark, Light, and System themes.
- **Local AI Overview**: Runs completely offline through `llama.cpp`. No OpenAI, no Gemini, no Groq, no API keys. If you don't want AI in your search, turn the toggle off in settings and it makes zero requests.
- **Dedicated Category Stages**: A centered, balanced responsive layout across Web, Images, Videos, News, Academic, Code, and Maps.
- **Local-First & Private**: No analytics, no telemetry, no tracking cookies. Everything you configure stays in your browser's `localStorage` and `IndexedDB`.

---

## Search Categories

SIFT doesn't throw every search result into the same generic list. Each category gets a layout built for that type of content:

| Category | How it's handled |
| :--- | :--- |
| **Web** | Multi-engine consensus indicators, domain badges, direct result inspector, and clean metadata. |
| **Images** | Responsive masonry grid, resolution tags, full-screen lightbox with keyboard (`←`/`→`) and swipe navigation, and proxied downloads. |
| **Videos** | Duration pills, channel/creator attribution, platform badges, and rich media cards. |
| **News** | Publication timestamps, news outlet attribution, thumbnail previews, and multi-source consensus. |
| **Academic** | Author lists (`et al.`), journal/publisher tags, direct PDF badges, DOI links, and citation counts. |
| **Code** | Repository names, star counts, software license badges, homepage links, and topic tags. |
| **Maps** | Coordinate badges, structured address summaries, and one-click navigation to OpenStreetMap, Apple Maps, Google Maps, or Photon. |

---

## How it works

Under the hood, it's pretty straightforward:

```text
                               ┌────────────────────────┐
                               │    Client Browser      │
                               └───────────┬────────────┘
                                           │ (HTTP / HTTPS)
                                           ▼
                               ┌────────────────────────┐
                               │  Nginx / Reverse Proxy │ (Optional SSL Termination)
                               └───────────┬────────────┘
                                           │
                                           ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                  SIFT Host                                  │
 │                                                                             │
 │  ┌───────────────────────────────────────────────────────────────────────┐  │
 │  │                         SIFT Web Frontend (:3000)                     │  │
 │  │                      (Next.js 15 / React 19 / TypeScript)             │  │
 │  └───────────────────┬───────────────────────────────────┬───────────────┘  │
 │                      │                                   │                  │
 │       (Local AI)     │                                   │ (Web Search)     │
 │                      ▼                                   ▼                  │
 │  ┌───────────────────────────────┐           ┌───────────────────────────┐  │
 │  │   llama-server (:8080)        │           │    SearXNG Core (:8080)   │  │
 │  │  (ghcr.io/ggml-org/llama.cpp) │           │     (Pinned Container)    │  │
 │  └───────────────┬───────────────┘           └─────────────┬─────────────┘  │
 │                  │                                         │                │
 │                  ▼                                         ▼                │
 │         ┌─────────────────┐                      ┌───────────────────┐      │
 │         │ Qwen3-4B GGUF   │                      │  Valkey (:6379)   │      │
 │         │ (models/*.gguf) │                      │(Cache/Rate-Limit) │      │
 │         └─────────────────┘                      └─────────┬─────────┘      │
 └────────────────────────────────────────────────────────────┼────────────────┘
                                                              │ (Outbound)
                                                              ▼
                                            ┌───────────────────────────────────┐
                                            │ Upstream Search Engines           │
                                            │ (Google, Brave, Bing, DuckDuckGo, │
                                            │  Wikipedia, GitHub, OpenAlex...)  │
                                            └───────────────────────────────────┘
```

- **`sift-web`**: The Next.js frontend serving the interface and handling internal `/api/search` and `/api/ai` routes.
- **`searxng-core`**: The SearXNG engine querying upstream providers.
- **`searxng-valkey`**: Caching layer for SearXNG so repeated queries don't hit upstreams unnecessarily.
- **`llama-server`**: Embedded llama.cpp server providing CPU inference for local GGUF models. It is only accessible within the internal Docker network.

---

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/bharadwajsanket/SIFT.git
cd SIFT
```

### 2. Add the local AI model (Optional)
If you want the offline AI Overview, grab the recommended Qwen3-4B GGUF model:
- **Download**: [Qwen3-4B-Instruct-2507-Q4_K_M.gguf](https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/blob/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf)

Drop it in `models/`:
```bash
models/
├── .gitkeep
└── Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```
*(If you skip this step, SIFT works normally as a pure search engine—just without the AI Overview card).*

### 3. Setup environment variables
```bash
cd searxng
cp .env.example .env
```

### 4. Fire up the stack
```bash
docker compose up -d --build
```

### 5. Open SIFT
Head to **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Development

If you want to work on the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

To run lint checks and production builds:
```bash
npm run lint
npm run build
```

---

## Customization

This is probably the part I spent way too much time tweaking.

Hit **`⌘ ,`** (or click the settings gear in the top right) to customize:

- **Visual Style**: Switch between `Glass` (translucent blur, reflections) and `Matte` (clean solid cards).
- **Theme**: Dark, Light, or follow your System preferences.
- **Wallpapers**: 5 built-in atmospheric SVGs, upload your own image (stored directly in your browser via IndexedDB), or paste an image URL.
- **Atmosphere Sliders**: Dial in exact background opacity and backdrop blur levels.
- **Home Canvas**:
  - **Clock**: 12h/24h format and custom timezone (UTC, EST, PST, GMT, IST, JST, etc.).
  - **Weather**: Custom city location powered by [Open-Meteo](https://open-meteo.com) (open-source, non-commercial, zero-tracking) with `°C` / `°F` toggle.
  - **Pinned Shortcuts**: Add your favorite links; SIFT resolves favicons automatically.
  - **Recent Searches**: Ephemeral local history with quick clear options.
- **Search Behavior**: Tab opening behavior, safe search level, and default map provider (OpenStreetMap, Apple Maps, Google Maps, Photon).
- **AI Overview Switch**: Instant client-side kill switch. When off, zero requests are sent to the model.

---

## Privacy & Security

A few straightforward details on how SIFT handles privacy:

- **Zero Telemetry**: No Google Analytics, no PostHog, no tracking pixels, no telemetry endpoints.
- **Network Isolation**: The AI and search engine backend containers only talk to the SIFT frontend over an internal Docker bridge. They are not exposed to the outside network.
- **SSRF Protection**: The image proxy rejects private/local IP ranges (`127.0.0.1`, `10.*`, `192.168.*`, `172.16-31.*`, `.local`, `.internal`) so it cannot be used to scan internal networks.
- **HTML Sanitization**: All snippets and titles coming back from search providers are stripped of raw markup and rendered safely through React text nodes.
- **Local Storage Only**: Preferences, pinned shortcuts, and search history stay entirely in your browser.

---

## License

SIFT application code is released under the [MIT License](LICENSE).  
Underlying SearXNG components remain licensed under the [GNU AGPLv3](https://github.com/searxng/searxng/blob/master/LICENSE).
