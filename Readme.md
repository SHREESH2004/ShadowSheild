# ShadowShield

[![npm version](https://img.shields.io/npm/v/shadowshield)](https://www.npmjs.com/package/shadowshield)
[![npm downloads](https://img.shields.io/npm/dm/shadowshield)](https://www.npmjs.com/package/shadowshield)
[![license](https://img.shields.io/npm/l/shadowshield)](https://github.com/SHREESH2004/shadowshield/blob/main/LICENSE)

**Behavioral API security middleware for Express.js**

ShadowShield detects and blocks bots, scrapers, and session hijackers in real time using behavioral analysis — no ML, no rules engine, just pure signal from how requests behave.

---

## How It Works

Every request is scored across two engines:

### IP Engine
Tracks 5 behavioral features per IP address:
- **rpm** — request rate per minute
- **error_rate** — ratio of 4xx/5xx responses
- **entropy** — endpoint diversity (bots hit same endpoints repeatedly)
- **cv_gap** — timing regularity (bots have unnaturally consistent intervals)
- **volume** — total data transferred in MB

### Session Engine
Tracks 3 behavioral features per session:
- **rpm** — session request rate
- **entropy** — endpoint diversity within session
- **cv_gap** — timing regularity within session

### Risk Formula
```

IP Risk = 0.30×rpm + 0.10×error + 0.25×entropy + 0.25×cvGap + 0.10×volume
Session Risk = 0.35×rpm + 0.35×cvGap + 0.30×entropy
Final Risk = 0.5×ip_risk + 0.5×session_risk

Block if: finalRisk >= threshold OR sessionRisk >= 0.6
```

### Impossible Travel Detection
ShadowShield stores the IP bound to each session. If a request arrives with the same session ID but a different IP, both IPs are blocked immediately — catching session hijacking and IP-rotating bots instantly.

---

## Requirements

- Node.js 18+
- Express 4+
- Redis (see setup below)

---

## Redis Setup

### Option 1 — Docker (Recommended)
```bash
docker pull redis
docker run --name redis -p 6379:6379 -d redis
```

Verify Redis is running:
```bash
docker exec -it redis redis-cli ping
# PONG
```

### Option 2 — Direct Install

**macOS**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Windows**

Download from: https://github.com/microsoftarchive/redis/releases

Or use WSL2 and follow the Ubuntu steps above.

---

## PostgreSQL Setup (Optional)

ShadowShield does not require PostgreSQL to run. Postgres is only needed if you want to persist blocked IPs permanently for audit/analysis.

### Option 1 — Docker
```bash
docker pull postgres
docker run --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=shadowshield \
  -p 5432:5432 \
  -d postgres
```

Verify:
```bash
docker exec -it postgres psql -U postgres -c "\l"
```

### Option 2 — Direct Install

Download from: https://www.postgresql.org/download/

---

## Installation
```bash
npm install shadowshield
```

---

## Quick Start
```typescript
import express        from "express"
import session        from "express-session"
import { shadowShield } from "shadowshield"

const app = express()

// express-session must come before shadowShield
app.use(session({
    secret:            "your-secret-key",
    resave:            false,
    saveUninitialized: true,
    cookie: {
        secure:   false,
        httpOnly: true,
        maxAge:   1000 * 60 * 60
    }
}))

// add ShadowShield
app.use(shadowShield({
    redisUrl:  "redis://127.0.0.1:6379",
    threshold: 0.5,
    blockTTL:  3600
}))

app.get("/", (req, res) => {
    res.json({ message: "Hello World" })
})

app.listen(3000)
```

---

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `redisUrl` | string | — | Full Redis URL e.g. `redis://127.0.0.1:6379` |
| `redisHost` | string | `127.0.0.1` | Redis host (used if no redisUrl) |
| `redisPort` | number | `6379` | Redis port (used if no redisUrl) |
| `redisPassword` | string | — | Redis password if auth enabled |
| `threshold` | number | `0.5` | Risk score to trigger block (0.0 - 1.0) |
| `blockTTL` | number | `3600` | Block duration in seconds |

---

## With Redis Auth
```typescript
app.use(shadowShield({
    redisHost:     "your-redis-host",
    redisPort:     6379,
    redisPassword: "your-redis-password",
    threshold:     0.5,
    blockTTL:      3600
}))
```

## With Redis URL
```typescript
app.use(shadowShield({
    redisUrl:  "redis://:password@your-redis-host:6379",
    threshold: 0.5,
    blockTTL:  3600
}))
```

---

## Response When Blocked
```json
{
  "error": "Too many requests",
  "blocked": true
}
```
```json
{
  "error": "Suspicious activity detected",
  "blocked": true
}
```

Both return HTTP `429 Too Many Requests`.

---

## Server Logs

ShadowShield logs every request score to your console:
```
IP: 192.168.1.1 | ip_risk: 0.12 | session_risk: 0.10 | final: 0.11
IP: 192.168.1.1 | ip_risk: 0.51 | session_risk: 0.66 | final: 0.58
BLOCKED: 192.168.1.2 | ip: 0.51 | session: 0.66 | final: 0.58
IMPOSSIBLE TRAVEL: abc123 | 192.168.1.1 → 192.168.1.2
```

---

## What Gets Detected

| Attack Type | Detection Method |
|---|---|
| High frequency bots | rpm feature in IP engine |
| Scrapers | endpoint entropy — low diversity |
| Timing bots | cv_gap — unnaturally regular intervals |
| IP rotating bots | session engine tracks cross-IP behavior |
| Session hijacking | impossible travel detection |
| DDoS | rpm + volume combination |

---

## What Does NOT Get Blocked

- Normal users with random browsing patterns
- Legitimate high traffic APIs (tune threshold higher)
- Health check endpoints (add middleware only to specific routes)

---

## Route-Specific Protection
```typescript
// protect only specific routes
app.use("/api", shadowShield({ threshold: 0.5 }))
app.use("/download", shadowShield({ threshold: 0.3 }))

// public routes unprotected
app.get("/health", (req, res) => res.json({ ok: true }))
```

---

## Docker Compose (Full Stack)
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

## Performance

ShadowShield is designed for zero latency impact:

- Risk scoring happens **after** `next()` is called via `res.on('finish')`
- All Redis operations are parallel using `Promise.all`
- No database calls in the hot path
- Blocking check is a single Redis GET per request

---

## License

MIT © [SHREESH2004](https://github.com/SHREESH2004)