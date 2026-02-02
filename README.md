# TLDR HN

A visual Hacker News reader that displays website screenshots and article excerpts alongside top community comments.

## Features

- **Website Screenshots**: Captures live screenshots of linked articles using Playwright
- **Article Excerpts**: Displays the first ~200 characters of article content
- **Top Comments**: Shows the highest-scored community comment for each story
- **Multiple Feeds**: Browse Top, New, and Show HN stories
- **Dark Mode**: System-aware dark mode toggle
- **Keyboard Navigation**: Navigate stories with j/k keys, open with Enter

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express.js, Playwright, Cheerio |
| **Hosting** | Railway, Render, or Fly.io (requires Playwright support) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  FeedTabs   │  │ StoryGrid   │  │     StoryCard           │  │
│  │  (top/new/  │  │ (j/k nav)   │  │  - Screenshot           │  │
│  │   show)     │  │             │  │  - Excerpt              │  │
│  └─────────────┘  └─────────────┘  │  - TopComment           │  │
│                                     └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    GET /api/stories/:feed
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Cache Layer (30min TTL)               │    │
│  │              Proactive refresh every 25 min              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Scraper     │  │  Screenshot   │  │  Summarizer   │        │
│  │  (Cheerio)    │  │ (Playwright)  │  │ (text excerpt)│        │
│  │  limit: 5     │  │  limit: 3     │  │               │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Hacker News API (firebase)
```

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd tldrhn
   npm install
   npx playwright install chromium
   ```

2. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run server

   # Terminal 2: Frontend
   npm run dev
   ```

3. **Open browser**
   Navigate to `http://localhost:5173`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stories/:feed` | GET | Get stories for feed (top, new, show) |
| `/api/stories` | GET | Alias for `/api/stories/top` |
| `/api/health` | GET | Health check |
| `/api/refresh` | POST | Clear cache (requires API key in production) |

## Project Structure

```
tldrhn/
├── server/
│   ├── index.ts           # Express server, routes, cache refresh
│   └── lib/
│       ├── cache.ts       # In-memory cache with TTL
│       ├── comments.ts    # HN comment fetching
│       ├── concurrency.ts # p-limit concurrency controls
│       ├── config.ts      # Environment config helpers
│       ├── hn-api.ts      # Hacker News API client
│       ├── scraper.ts     # Article content extraction
│       ├── screenshot.ts  # Playwright screenshot capture
│       ├── summarizer.ts  # Text excerpt generation
│       └── url-validator.ts # SSRF protection
├── src/
│   ├── App.tsx            # Main app component
│   ├── components/
│   │   ├── DarkModeToggle.tsx
│   │   ├── FeedTabs.tsx
│   │   ├── Header.tsx
│   │   ├── StoryCard.tsx
│   │   ├── StoryGrid.tsx
│   │   └── TopComment.tsx
│   ├── hooks/
│   │   ├── useDarkMode.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useStories.ts
│   └── types/
│       └── index.ts       # TypeScript interfaces
├── package.json
└── vite.config.ts
```

## Security

The application implements several security measures:

| Protection | Implementation |
|------------|----------------|
| **Security Headers** | Helmet middleware (CSP, X-Frame-Options, etc.) |
| **Rate Limiting** | 100 requests per 15 minutes per IP |
| **SSRF Protection** | URL validator blocks localhost/private IPs |
| **XSS Prevention** | DOMPurify sanitization for HTML content |
| **Input Validation** | Feed type whitelist validation |
| **HTTPS Enforcement** | Automatic redirect in production |
| **CORS** | Configurable allowed origins |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `REFRESH_API_KEY` | Prod | API key for /api/refresh endpoint |
| `ALLOWED_ORIGINS` | Prod | Comma-separated CORS origins |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` | Next story |
| `k` | Previous story |
| `Enter` | Open article in new tab |
| `c` | Open HN comments |
| `?` | Show help modal |

## Development

```bash
# Run frontend only
npm run dev

# Run backend only
npm run server

# Build for production
npm run build

# Lint code
npm run lint

# Run tests
npm test
```

## Deployment

**Note**: This project uses Playwright for screenshots, which requires a persistent server environment. Serverless platforms (Vercel, Netlify Functions) won't work.

### Recommended Platforms

- **Railway**: `railway init && railway up`
- **Render**: Connect repo, set build command to `npm install && npx playwright install chromium && npm run build`
- **Fly.io**: `fly launch && fly deploy`

### Required Setup

1. Set environment variables (see table above)
2. Ensure Playwright browsers are installed during build: `npx playwright install chromium`
3. Start command: `npm run server`

## License

MIT
