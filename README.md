<div align="center">
  <img src="frontend/public/icon.svg" width="64" height="64" alt="SIFT Logo" />
  <h1>SIFT</h1>
  <p><strong>Search &amp; Information Filtering Tool</strong></p>
  <p><em>A private, self-hosted search instrument and metasearch aggregator interface.</em></p>
</div>

---

## What is SIFT?

**SIFT** is a personal, privacy-focused search workstation built on top of [SearXNG](https://github.com/searxng/searxng).

It combines information-dense presentation, atmospheric visual aesthetics, and local-first customization with multi-engine search aggregation. SIFT manages the interface, category specialization, result inspection, and provider controls, while SearXNG performs concurrent query aggregation across upstream search engines without tracking or user profiling.

---

## Design Philosophy

- **Atmospheric & Focused**: Dark cinematic wallpapers, subtle translucent glasswork, and violet/lavender accents.
- **Natural Aspect Ratio Grids**: Multi-column masonry layout for images preserving original landscape, portrait, and ultrawide dimensions without aggressive square cropping.
- **Information-Dense**: Specialized views tailored for Web, Media, Code, Papers, News, and Maps with aggregator ranking metadata.
- **Local-First Personalization**: Full visual customization (wallpapers, glass intensity, density, accents) stored strictly in your browser (`localStorage` + `IndexedDB`).
- **Zero Telemetry & Private by Default**: No tracking scripts, analytics, session replay, cookies, or user accounts.

---

## System Architecture

```text
               ┌────────────────────────┐
               │    Client Browser      │
               └───────────┬────────────┘
                           │ (e.g. search.edith.local)
                           ▼
               ┌────────────────────────┐
               │  Nginx Proxy Manager   │ (Reverse Proxy / SSL)
               └───────────┬────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │                      SIFT Host                         │
 │                                                        │
 │   ┌───────────────────────┐   ┌────────────────────┐   │
 │   │ SIFT Frontend (:3000) │──▶│ SearXNG (:8080)    │   │
 │   │ (Next.js / React 19)  │   │ (Pinned Container) │   │
 │   └───────────────────────┘   └─────────┬──────────┘   │
 │                                         │              │
 │                               ┌─────────┴──────────┐   │
 │                               │ Valkey (:6379)     │   │
 │                               │ (Cache / Rate-Lim) │   │
 │                               └────────────────────┘   │
 └─────────────────────────────────────────┬──────────────┘
                                           │ (Outbound Queries)
                                           ▼
                 ┌───────────────────────────────────┐
                 │ Upstream Search Engines           │
                 │ (Google, Brave, Bing, DDG,        │
                 │  Wikipedia, GitHub, OpenAlex...)  │
                 └───────────────────────────────────┘
```

### LAN-Only Isolation & DNS
- **SearXNG Internal Port**: Bound strictly to `127.0.0.1:8080` (not publicly exposed).
- **Frontend Port**: Accessible on LAN at `:3000` or routed via reverse proxy (`search.edith.local`).
- **DNS Configuration**: SearXNG Docker container is configured with upstream DNS servers (`192.168.1.1` and `1.1.1.1`) to ensure reliable resolution of external engine endpoints across varied local network configurations.

---

## SearXNG Upstream Synchronization

SIFT uses an explicitly pinned SearXNG release for reproducible deployments:

```yaml
image: docker.io/searxng/searxng:2026.8.29-d226b78bc
```

Local configuration uses `use_default_settings: true` in `searxng/core-config/settings.yml`, extending SearXNG upstream defaults rather than replacing engine definitions.

---

## Search Categories

SIFT provides specialized presentation for 7 search categories:

| Category | Description & Specialized Features |
| :--- | :--- |
| **Web** | Multi-engine consensus indicators, domain badges, instant result inspector, and timestamp formatting. |
| **Images** | Natural masonry grid, resolution tags, full-screen lightbox with multi-image navigation (`←`/`→`), touch swipe, and safe image proxy downloads. |
| **Videos** | Duration pills, channel/uploader metadata, domain badges, and media preview cards. |
| **News** | Publication dates, news outlet attribution, thumbnail integration, and multi-source consensus. |
| **Academic** | Authors list (`et al.`), journal/publisher tags, direct PDF badges, DOI links, and citation counts. |
| **Code** | Package and repository names, star ratings, software license badges, homepage links, and topic tags. |
| **Maps** | Coordinate badges, structured address summaries, and configurable map navigation (OpenStreetMap, Google Maps, Apple Maps, Photon). |

---

## Local Customization Engine

Personalize your workspace without an account or central database:

- **Official Wallpapers**: Curated cinematic backgrounds (Mountain, Mist, Obsidian, Twilight, Celestial).
- **Custom Wallpaper Upload**: Upload custom high-resolution images stored directly in your browser's local **IndexedDB**.
- **Custom Wallpaper URL**: Point to any external image URL.
- **Atmosphere Adjustments**: Sliders for wallpaper opacity, blur, scale, position, overlay darkness, glass opacity, and glass blur.
- **Accents & Themes**: Automatic wallpaper-derived accent or manual palette swatches (Violet, Cyan, Emerald, Amber, Rose, Indigo) across Dark, Light, and System modes.
- **Density & Motion**: Compact, Comfortable, or Spacious density; Full, Reduced, or Off motion.
- **Safe Reset**: Resetting appearance defaults cleans theme and wallpaper preferences without deleting search history.

*Custom wallpapers and preferences remain on your device and are never transmitted to the SIFT server.*

---

## Mobile-First Design

SIFT is designed mobile-first and tested across viewports from **320px to 1920px**:

- **Touch Navigation**: Horizontally scrolling category bars and filter strips with active tab auto-centering.
- **Responsive Result Cards**: Adaptive typography, flexible multi-line truncation, and safe domain wrapping preventing horizontal overflow.
- **Bottom-Sheet Inspector**: Result metadata slides up as a bottom sheet with touch dismissal handles and safe-area insets (`env(safe-area-inset-bottom)`).
- **Mobile Lightbox**: Fullscreen touch-swipe navigation with accessible action buttons.

---

## Privacy & Security Model

### Privacy
- **No User Tracking**: Zero analytics, telemetry, tracking pixels, advertising, or session cookies.
- **Local Search History**: Ephemeral recent searches stored strictly in `localStorage` with one-click deletion.
- **Session Geolocation**: Ephemeral session memory only when explicitly enabled for local searches (never persisted).

### Application-Level Protections
- **HTML Sanitization**: Result titles and snippets are stripped of raw markup and rendered safely through React text nodes.
- **SSRF Protection**: Image proxy strictly forbids loopback and RFC 1918 private IP ranges (`127.0.0.1`, `10.*`, `192.168.*`, `172.16-31.*`, `.local`, `.internal`).
- **Protocol Filtering**: Remote URLs are validated against `http:` and `https:`, blocking unsafe protocols (e.g. `javascript:`).
- **Container Isolation**: SearXNG internal aggregation port is not exposed externally.

---

## Development Setup

### Prerequisites
- **Node.js**: v20+
- **Docker & Docker Compose**

### Running Locally (Development)

1. **Start the SearXNG and Valkey backend**:
   ```bash
   cd searxng
   cp .env.example .env
   docker compose up -d core valkey
   ```

2. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

4. **Run build & lint checks**:
   ```bash
   npm run lint
   npm run build
   ```

---

## Production Deployment

### Docker Compose Quickstart

1. **Clone repository and configure environment**:
   ```bash
   git clone https://github.com/bharadwajsanket/SIFT.git
   cd SIFT/searxng
   cp .env.example .env
   ```

2. **Start the full container stack**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify running containers**:
   ```bash
   docker compose ps
   ```

### Environment Variables (`searxng/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SIFT_PORT` | `3000` | Port for the SIFT Next.js web application. |
| `SEARXNG_PORT` | `8080` | Internal port for the SearXNG aggregation engine (bound to `127.0.0.1`). |
| `SEARXNG_VERSION` | `2026.8.29-d226b78bc` | Pinned SearXNG container image tag. |
| `SEARXNG_SECRET` | *(random key)* | 32-byte hex secret key for SearXNG session encryption (`openssl rand -hex 32`). |

---

## Troubleshooting

- **SIFT Web Unavailable (`502 Bad Gateway` / `Connection Refused`)**:  
  Ensure `docker compose ps` shows `sift-web`, `searxng-core`, and `searxng-valkey` in `Up` state. Check logs with `docker compose logs -f sift-web`.
- **SearXNG Aggregator Timeout (`504 Gateway Timeout`)**:  
  Verify the host machine has internet access and DNS servers (`192.168.1.1`, `1.1.1.1`) are reachable. Check engine status via `docker compose logs -f core`.
- **Search Returns No Results**:  
  Some upstream search engines may temporarily rate-limit queries. Open **Settings > Search Engines** in SIFT to enable or toggle alternative engines for the category.
- **Custom Wallpaper Not Displaying**:  
  If clearing browser site data, uploaded wallpapers stored in IndexedDB may be reset. Simply re-select or re-upload your wallpaper in the Customization panel.

---

## Rolling Maintenance

With Phase 1–5 completed, SIFT follows a continuous rolling maintenance model:
1. Daily personal use.
2. Identify real-world edge cases or upstream engine changes.
3. Apply targeted, evidence-based improvements.
4. Deploy updates via `docker compose up -d --build`.

---

## License

SIFT application code is released under the [MIT License](LICENSE).  
Underlying SearXNG components remain licensed under the [GNU AGPLv3](https://github.com/searxng/searxng/blob/master/LICENSE).
