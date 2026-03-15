# ShadowShield 🛡️

[![npm version](https://img.shields.io/npm/v/shadowshield)](https://www.npmjs.com/package/shadowshield)
[![npm downloads](https://img.shields.io/npm/dm/shadowshield)](https://www.npmjs.com/package/shadowshield)
[![license](https://img.shields.io/npm/l/shadowshield)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Redis](https://img.shields.io/badge/Redis-ioredis-red)](https://github.com/luin/ioredis)
[![install size](https://packagephobia.com/badge?p=shadowshield)](https://packagephobia.com/result?p=shadowshield)

> `express` · `security` · `middleware` · `redis` · `bot-detection` · `rate-limiting` · `typescript`

**Behavioral API security middleware for Express.js**

Your rate limiter counts requests. Bots count too — and they stay just under your limit.

ShadowShield watches *how* requests behave. Not how many.
```bash
npm install shadowshield
```

---

## The Problem

Most Express APIs rely on this:
```
if (requests > 100 per minute) → block
```

Bots have already solved this. They rotate IPs, randomize user agents,
and stay just under your threshold. Your limiter says "all good."
Your DB does not agree.

ShadowShield asks five questions instead of one.

---

## How It Works

### Two Scoring Engines

#### 🔍 IP Engine — 5 behavioral features
| Feature | What it detects |
|---|---|
| `rpm` | Request frequency — how fast |
| `error_rate` | Ratio of 4xx/5xx responses |
| `entropy` | Endpoint diversity — bots repeat same paths |
| `cv_gap` | Timing regularity — bots are unnaturally consistent |
| `volume` | Data transferred in MB |

#### 🔐 Session Engine — 3 behavioral features
| Feature | What it detects |
|---|---|
| `rpm` | Session request rate |
| `entropy` | Endpoint diversity within session |
| `cv_gap` | Timing regularity within session |

### Risk Formula
```
IP Risk      =  0.30×rpm + 0.10×error + 0.25×entropy + 0.25×cvGap + 0.10×volume
Session Risk =  0.35×rpm + 0.35×cvGap + 0.30×entropy
Final Risk   =  0.5×ip_risk + 0.5×session_risk

Block if: finalRisk >= threshold  OR  sessionRisk >= 0.6
```
```
Normal user  →  score ~0.10  ✅ passes
Bot          →  score ~0.58  ✂️  blocked
```

### 🌍 Impossible Travel Detection

ShadowShield binds each session to an IP in Redis.
Same session, different IP — both blocked instantly.
```
Session abc123 → IP 192.168.1.1  ✓ allowed
Session abc123 → IP 192.168.1.2  ✗ BLOCKED — impossible travel
```

Catches session hijacking and IP-rotating bots that reuse cookies.

### ⚡ Zero Latency Design

All scoring runs **after** `next()` via `res.on('finish')`.
The user never waits for risk calculation.
```
Request arrives
    ↓
Check block list   (1 Redis GET ~1ms)
    ↓
next()             ← user gets response here
    ↓
res.on('finish')   ← scoring runs here, async, post-response
    ↓
Write features → Calculate risk → Block if threshold exceeded
```

### 🔒 Fails Open — Never Crashes Your App

If Redis goes down, ShadowShield fails open.
Requests pass through normally. Your app stays up.

---

## Installation
```bash
npm install shadowshield
```

**Requirements**
- Node.js 18+
- Express 4+
- Redis (see setup below)

---

## Quick Start
```typescript
import express          from "express"
import session          from "express-session"
import { shadowShield } from "shadowshield"

const app = express()

// express-session must come BEFORE shadowShield
app.use(session({
    secret:            "your-secret-key",
    resave:            false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 }
}))

app.use(shadowShield({
    redisUrl:  "redis://127.0.0.1:6379",
    threshold: 0.5,
    blockTTL:  3600
}))

app.get("/", (req, res) => {
    res.json({ message: "protected route" })
})

app.listen(3000)
```

That's it. Your API is now protected.

---

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `redisUrl` | string | — | Full Redis URL `redis://host:port` |
| `redisHost` | string | `127.0.0.1` | Redis host (if no redisUrl) |
| `redisPort` | number | `6379` | Redis port (if no redisUrl) |
| `redisPassword` | string | — | Redis password |
| `threshold` | number | `0.5` | Block threshold (0.0 - 1.0) |
| `blockTTL` | number | `3600` | Block duration in seconds |
| `dryRun` | boolean | `false` | Log scores but never block |

---

## Redis Setup

### Docker (Recommended)
```bash
docker run --name redis -p 6379:6379 -d redis:alpine
```

Verify:
```bash
docker exec -it redis redis-cli ping
# PONG
```

### macOS
```bash
brew install redis && brew services start redis
```

### Ubuntu
```bash
sudo apt install redis-server && sudo systemctl start redis
```

### Windows
Download from: https://github.com/microsoftarchive/redis/releases
Or use WSL2 with the Ubuntu steps above.

---

## Response When Blocked

All blocked requests return `HTTP 429`:
```json
{ "error": "Too many requests", "blocked": true }
```
```json
{ "error": "Suspicious activity detected", "blocked": true }
```

---

## Server Logs
```
IP: 192.168.1.1 | ip_risk: 0.12 | session_risk: 0.10 | final: 0.11  ✅
IP: 192.168.1.1 | ip_risk: 0.38 | session_risk: 0.48 | final: 0.43  ⚠️
BLOCKED: 192.168.1.2 | ip: 0.51 | session: 0.66 | final: 0.58       ✂️
IMPOSSIBLE TRAVEL: abc123 | 192.168.1.1 → 192.168.1.2               🚫
```

---

## Attack Detection

| Attack Type | Engine | Signal |
|---|---|---|
| High frequency bot | IP | High `rpm` |
| Web scraper | IP + Session | Low `entropy` |
| Timing bot | IP + Session | Low `cv_gap` |
| IP rotating bot | Session | Cross-IP session tracking |
| Session hijacking | Session | Impossible travel detection |
| DDoS | IP | `rpm` + `volume` spike |

---

## Route-Specific Protection
```typescript
// strict on auth — lower threshold
app.use("/api/auth",     shadowShield({ threshold: 0.3 }))
app.use("/api/download", shadowShield({ threshold: 0.4 }))

// standard on public routes
app.use("/api",          shadowShield({ threshold: 0.5 }))

// health check — unprotected
app.get("/health", (req, res) => res.json({ ok: true }))
```

---

## Cluster Support

Works out of the box with Node.js cluster mode.
All state lives in Redis — shared across every worker automatically.

---

## Docker Compose
```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| State | Redis via ioredis |
| Persistence | PostgreSQL (optional) |
| Package | npm |

---

## Roadmap

- [ ] Whitelist support
- [ ] `onBlock` callback hook
- [ ] Metrics endpoint (Prometheus compatible)
- [ ] Dashboard UI
- [ ] Injectable logger support

---

## Contributing

PRs are welcome. For major changes please open an issue first.
```bash
git clone https://github.com/SHREESH2004/Shadowsheild
cd shadowshield
npm install
npm run dev
```

---

## License

MIT © [SHREESH2004](https://github.com/SHREESH2004)

---

## Links

- **npm** → https://www.npmjs.com/package/shadowshield
- **GitHub** → https://github.com/SHREESH2004/Shadowsheild
- **Issues** → https://github.com/SHREESH2004/Shadowsheild/issues
- **Article** → https://dev.to/shreesh_sanyal_eb6b605a70/i-built-an-expressjs-middleware-that-detects-bots-using-behavioral-scoring-and-published-it-to-4c3g
