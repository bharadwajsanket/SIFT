<div align="center">
  <img src="frontend/public/icon.svg" width="64" height="64" alt="SIFT Logo" />
  <h1>SIFT</h1>
  <p><strong>Search &amp; Information Filtering Tool</strong></p>
  <p><em>A private, self-hosted search instrument with standalone local AI overview.</em></p>
</div>

---

## What is SIFT?

**SIFT** is a personal, privacy-focused search workstation built on top of [SearXNG](https://github.com/searxng/searxng) and [llama.cpp](https://github.com/ggerganov/llama.cpp).

It combines information-dense presentation, atmospheric visual aesthetics, and local-first customization with multi-engine search aggregation and a standalone local AI answer layer. SIFT is **not a ChatGPT clone** or a conversational chatbot—it is a search tool designed to answer technical queries and simple questions immediately, while keeping full web search results instantly accessible.

---

## System Architecture

```text
                               ┌────────────────────────┐
                               │    Client Browser      │
                               └───────────┬────────────┘
                                           │ (search.edith.local)
                                           ▼
                               ┌────────────────────────┐
                               │  Nginx Proxy Manager   │ (Reverse Proxy / SSL)
                               └───────────┬────────────┘
                                           │
                                           ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                  SIFT Host                                  │
 │                                                                             │
 │  ┌───────────────────────────────────────────────────────────────────────┐  │
 │  │                         SIFT Web Frontend (:3000)                     │  │
 │  │                            (Next.js / React 19)                       │  │
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
                                            │ (Google, Brave, Bing, DDG,        │
                                            │  Wikipedia, GitHub, OpenAlex...)  │
                                            └───────────────────────────────────┘
```

### Docker Services
- **`sift-web`**: Next.js 16 frontend workstation serving the interface and `/api/ai` / `/api/search` endpoints.
- **`searxng-core`**: Pinned SearXNG metasearch engine bound locally to `127.0.0.1:8080`.
- **`searxng-valkey`**: In-memory caching and rate-limiting store.
- **`llama-server`**: Embedded [llama.cpp server](https://github.com/ggerganov/llama.cpp) (`ghcr.io/ggml-org/llama.cpp:server`) providing local CPU inference for GGUF models. Internal-only to the Docker network (`http://llama-server:8080`) and not exposed directly to the LAN.

### DNS Resolution
SearXNG is configured with upstream DNS servers (`192.168.1.1` and `1.1.1.1`) inside `searxng/docker-compose.yml`. This ensures that the container can resolve upstream search engine hostnames reliably across varied local network environments.

---

## Local AI Overview

SIFT provides a compact, standalone **Local AI Overview** above normal search results.

```text
Query ("linux command to zip a file")
  ├── Local Qwen model via llama.cpp ──▶ ✦ AI Overview (Direct streaming answer)
  └── SearXNG Aggregator            ──▶ Normal web results (Independent)
```

### Core Characteristics
- **Standalone & Independent**: Answers CLI, code, and factual queries directly from model weights. Does not require web scraping, embeddings, or vector databases.
- **Decoupled Execution**: Normal search results and the AI Overview execute in parallel. An AI generation never delays or blocks web search results.
- **100% Private & Local**: Zero external cloud APIs (no OpenAI, no Gemini, no Anthropic, no Groq), no Ollama dependency, and zero telemetry. Queries remain strictly inside your local environment.
- **Continuous Small Follow-Up**: Ask quick follow-up questions directly underneath the answer with lightweight, in-memory session turns.
- **Client-Side Preference**: The `AI Overview [ ON / OFF ]` toggle in Settings is stored per-device in `localStorage`. When **OFF**, zero requests are sent to `/api/ai` and normal search operates with zero overhead.
- **Graceful Offline Fallback**: If the local AI container is offline or the model is missing, normal search continues working completely uninterrupted.

---

## Recommended Model & Placement

### Model Details
- **Recommended Model**: `Qwen3-4B-Instruct-2507`
- **Format**: GGUF (`Q4_K_M` quantization)
- **Filename**: `Qwen3-4B-Instruct-2507-Q4_K_M.gguf`
- **Download**: [Official Hugging Face GGUF](https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/blob/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf)

> [!NOTE]
> GGUF model binaries are intentionally **NOT** tracked in the Git repository due to file size. `models/*.gguf` is ignored by `.gitignore`. You must download and place the model manually.

### Model Placement
Place the downloaded GGUF file in the `models/` directory:
```bash
SIFT/
├── frontend/
├── searxng/
├── models/
│   ├── .gitkeep
│   └── Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```

---

## Clean Installation & Deployment Guide

Follow these steps to deploy SIFT on a fresh machine:

### 1. Clone the Repository
```bash
git clone https://github.com/bharadwajsanket/SIFT.git
cd SIFT
```

### 2. Download the GGUF Model
Download the official model binary from Hugging Face:
- **Download Link**: [Qwen3-4B-Instruct-2507-Q4_K_M.gguf](https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/blob/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf)

Place the file into the `models/` directory:
```bash
# Verify model placement
ls -lh models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
```

### 3. Configure Environment Variables
```bash
cd searxng
cp .env.example .env
```

Review or adjust `searxng/.env` as needed:
```bash
# Generate a secret key for session encryption
sed -i '' "s/change_this_to_a_secure_random_key_in_production/$(openssl rand -hex 32)/" .env
```

### 4. Start the Docker Stack
```bash
docker compose up -d --build
```

### 5. Verify Running Containers
```bash
docker compose ps
```
All four containers (`sift-web`, `searxng-core`, `searxng-valkey`, `sift-llama-server`) should be in the `Up` state.

### 6. Verify Local AI Backend
```bash
curl -s http://localhost:3000/api/ai
```
Expected output:
```json
{"enabled":true,"available":true,"model":"Qwen3-4B-Instruct-2507","status":"local"}
```

### 7. Open SIFT
Open **[http://localhost:3000](http://localhost:3000)** (or your configured hostname `search.edith.local`) in your browser.

---

## Environment Variables Reference (`searxng/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SIFT_PORT` | `3000` | Port on which the SIFT Next.js web application is accessible on the host. |
| `SEARXNG_PORT` | `8080` | Internal host-bound port for the SearXNG aggregation engine (`127.0.0.1:8080`). |
| `SEARXNG_VERSION` | `2026.8.29-d226b78bc` | Pinned container tag for SearXNG metasearch. |
| `SEARXNG_SECRET` | *(random key)* | 32-byte hex secret key for SearXNG session encryption. |
| `SIFT_LLM_ENABLED` | `true` | Server-side capability flag for local AI Overview (`true` or `false`). |
| `SIFT_LLM_URL` | `http://llama-server:8080` | Docker-internal URL for the llama.cpp HTTP server. |
| `SIFT_LLM_MODEL` | `/models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf` | Absolute path to the mounted GGUF model inside the container. |
| `SIFT_LLM_THREADS` | `4` | Number of CPU inference threads allocated to llama.cpp (tuned for 4C/8T). |
| `SIFT_LLM_CTX_SIZE` | `2048` | Prompt context size in tokens (conservative setting for fast CPU response). |
| `SIFT_LLM_N_PREDICT` | `512` | Maximum generated tokens per answer. |

---

## AI API Reference

### Health & Status: `GET /api/ai`
Checks whether the local AI backend is enabled and reachable.

**Response**:
```json
{
  "enabled": true,
  "available": true,
  "model": "Qwen3-4B-Instruct-2507",
  "status": "local"
}
```

### Streaming Inference: `POST /api/ai`
Streams standalone direct answers from the local GGUF model. Supports optional conversational history for follow-up questions.

**Request Payload**:
```json
{
  "query": "linux command to zip a file",
  "history": []
}
```

**Stream Response (Plain Text Chunks)**:
````markdown
```bash
zip archive.zip filename.txt
```

For a directory:
```bash
zip -r archive.zip directory/
```
````

**Follow-Up Request with History**:
```json
{
  "query": "what about extracting it?",
  "history": [
    { "role": "user", "content": "linux command to zip a file" },
    { "role": "assistant", "content": "zip -r archive.zip folder/" }
  ]
}
```

**Follow-Up Stream Response**:
````markdown
unzip archive.zip -d extract_directory/
````

---

## User Settings & Client-Side Persistence

Open **Settings (⌘,)** in SIFT to customize your experience:

- **AI Overview `[ ON / OFF ]`**: Accessible toggle switch (`role="switch"`, `aria-checked`).
  - **ON**: SIFT streams local answers above search results and offers a follow-up input bar.
  - **OFF**: SIFT makes zero calls to `/api/ai`, renders no AI card or placeholder, and acts as a pure search engine.
- **AI Status**: Live badge indicating backend connectivity (`Local` vs. `Offline`).
- **Appearance & Wallpapers**: 5 curated atmospheric wallpapers, custom file upload to browser **IndexedDB**, custom image URLs, opacity/blur sliders, and accent palettes across Dark, Light, and System modes.

*All user preferences remain strictly on the client device and are never sent to a database or server.*

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

## Privacy & Security Model

- **No User Tracking**: Zero analytics, telemetry, tracking pixels, advertising, or session cookies.
- **Local Search History**: Ephemeral recent searches stored strictly in `localStorage` with one-click deletion.
- **Private Network Isolation**: `llama-server` and `searxng-core` ports are not exposed publicly to the LAN.
- **HTML Sanitization**: Result titles and snippets are stripped of raw markup and rendered safely through React text nodes.
- **SSRF Protection**: Image proxy strictly forbids loopback and RFC 1918 private IP ranges (`127.0.0.1`, `10.*`, `192.168.*`, `172.16-31.*`, `.local`, `.internal`).
- **Protocol Filtering**: Remote URLs are validated against `http:` and `https:`, blocking unsafe protocols (e.g. `javascript:`).

---

## Troubleshooting

### 1. Docker is Not Running
If running `docker compose` produces connection errors:
```bash
# Ensure Docker daemon / Docker Desktop is running, then retry:
docker compose up -d
```

### 2. Inspecting Container Logs
```bash
# Check status of all services
docker compose ps

# View llama-server logs (model loading, inference timing)
docker compose logs --tail=100 llama-server

# View SIFT web frontend logs
docker compose logs --tail=100 sift-web

# View SearXNG engine logs
docker compose logs --tail=100 core
```

### 3. AI Reports Unavailable (`Offline`)
If the Settings panel shows `Offline` or `/api/ai` returns `status: "offline"`:
1. Verify the model file exists at `models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf`.
2. Check if `llama-server` crashed due to memory limits with `docker compose logs llama-server`.
3. Restart the service: `docker compose restart llama-server`.

### 4. Testing AI Health & Inference Manually
```bash
# Test status probe
curl -s http://localhost:3000/api/ai

# Test streaming inference
curl -s -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"query":"linux command to zip a file"}'
```

### 5. Normal Search Verification
Verify that SearXNG metasearch is functioning independently:
```bash
curl -s "http://localhost:3000/api/search?q=test"
```

---

## License

SIFT application code is released under the [MIT License](LICENSE).  
Underlying SearXNG components remain licensed under the [GNU AGPLv3](https://github.com/searxng/searxng/blob/master/LICENSE).
