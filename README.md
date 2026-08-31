<div align="center">
  <img src="frontend/public/icon.svg" width="56" height="56" alt="SIFT Logo" />
  <h1>SIFT</h1>
  <p><strong>Search &amp; Information Filtering Tool</strong></p>
  <p><em>Search privately. Find clearly.</em></p>
</div>

---

## What is SIFT?

**SIFT** is a private, self-hosted search interface built on top of [SearXNG](https://github.com/searxng/searxng).

It provides an information-dense user experience focused on typography, clarity, and speed. SIFT manages the interface, category specializations, result inspection, and provider controls, while SearXNG performs the underlying metasearch aggregation across external search engines.

---

## How It Works

```text
Browser
   ↓
SIFT Frontend (:3000)
   ↓
SearXNG Engine (:8080)
   ↓
Search Providers (Google, Brave, Bing, DuckDuckGo, Wikipedia, GitHub)
```

Your queries are sent directly to your self-hosted SIFT instance, which requests results from SearXNG. SearXNG queries your selected engines concurrently, and SIFT normalizes and renders the responses without user tracking or telemetry.

---

## Features

- **Multi-Engine Aggregation**: Query Google, Brave, Bing, DuckDuckGo, Wikipedia, and GitHub simultaneously.
- **Specialized Categories**: Dedicated views for Web, Images, Videos, News, Code, Academic research, and Maps.
- **Natural Aspect Ratio Image Grid**: Multi-column masonry layout that preserves the natural dimensions of portraits, landscapes, squares, and ultrawides without cropping.
- **Image Lightbox & Direct Downloads**: Full-screen preview modal with one-click downloads and direct image fallback.
- **Floating Autocomplete**: Fast OpenSearch predictions in an overlay that never shifts page layout.
- **Search Provider Curation**: Enable or disable specific search engines per category directly from Settings.
- **Result Inspector**: Side-drawer displaying returning engine sources, aggregator scores, and exact URLs.
- **Configurable Map Destinations**: Open places and coordinates in OpenStreetMap, Google Maps, Apple Maps, or Photon.
- **Privacy-Aware Location**: Geolocation is `Never` by default, prompted only on explicit local queries, and held strictly in session memory.
- **Local History**: Search history is stored exclusively in your browser's `localStorage` with quick clearing.
- **Themes & Information Density**: Dark, Light, and System themes with Comfortable and Compact density modes.
- **Keyboard Shortcuts**: Focus search with `⌘K`, `Ctrl+K`, or `/`, navigate suggestions with `Arrow` keys, and dismiss overlays with `Escape`.

---

## Run It

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

### Quickstart

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd sift
   ```

2. **Configure environment & start containers**:
   ```bash
   cd searxng
   cp .env.example .env
   docker compose up -d
   ```

3. **Open SIFT**:
   Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

To stop the services:
```bash
docker compose down
```

---

## LAN Deployment

You can host SIFT on a home server, Raspberry Pi, or local machine and access it from any device on your local network without installing client apps:

1. Start SIFT on the host server:
   ```bash
   docker compose up -d
   ```

2. Access SIFT from other devices on the same Wi-Fi/network:
   ```text
   http://SERVER_IP:3000
   ```

*(Ensure port `3000` is allowed through the host firewall).*

---

## Configuration

Settings are managed in the `searxng/` directory:

- `searxng/.env`: Port bindings and secret keys (copy from `.env.example`).
- `searxng/core-config/settings.yml`: SearXNG aggregation options, enabled engines, rate limits, and outgoing formats.
- `searxng/docker-compose.yml`: Container definitions and volume storage.

---

## Privacy

- **Self-Hosted**: Queries run through your own instance rather than a centralized cloud service.
- **No User Profiles**: SIFT does not set tracking cookies, store user profiles, or collect analytics.
- **Client-Side History**: Search history stays on your device in `localStorage`.
- **Opt-in Geolocation**: Location permissions are never silently requested or persisted.
- **External Destinations**: Clicking external result links navigates directly to third-party websites, subject to their respective privacy policies.

---

## Built With

- **[SearXNG](https://github.com/searxng/searxng)** — Metasearch aggregation engine
- **[Next.js](https://nextjs.org/)** — React application framework
- **[Valkey](https://github.com/valkey-io/valkey)** — In-memory caching and rate-limiting service

---

## License

SIFT application and frontend code are released under the [MIT License](LICENSE).  
Underlying SearXNG components remain licensed under their respective upstream open-source licenses.
