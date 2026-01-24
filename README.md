# TLDR HN

A visual Hacker News reader that displays website screenshots and AI-generated summaries alongside top community comments.

## Features

- **Website Screenshots**: Captures live screenshots of linked articles using Playwright
- **AI Summaries**: Generates concise TLDR summaries using OpenAI
- **Top Comments**: Displays the highest-scored community comment for each story
- **Multiple Feeds**: Browse Top, New, and Show HN stories
- **Dark Mode**: System-aware dark mode toggle
- **Keyboard Navigation**: Navigate stories with j/k keys, open with Enter

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express.js, Playwright, Cheerio |
| **AI** | OpenAI GPT for summarization |
| **Deployment** | Vercel |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  FeedTabs   │  │ StoryGrid   │  │     StoryCard           │  │
│  │  (top/new/  │  │ (j/k nav)   │  │  - Screenshot           │  │
│  │   show)     │  │             │  │  - Summary              │  │
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
│  │  (Cheerio)    │  │ (Playwright)  │  │   (OpenAI)    │        │
│  │  limit: 5     │  │  limit: 3     │  │   limit: 5    │        │
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
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run server

   # Terminal 2: Frontend
   npm run dev
   ```

4. **Open browser**
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
│       ├── hn-api.ts      # Hacker News API client
│       ├── scraper.ts     # Article content extraction
│       ├── screenshot.ts  # Playwright screenshot capture
│       ├── summarizer.ts  # OpenAI summary generation
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
├── .env.example
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
| `OPENAI_API_KEY` | Yes | OpenAI API key for summaries |
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
```

## Deployment

This project is configured for Vercel deployment. The `vercel.json` configures the Express server as a serverless function.

```bash
vercel deploy
```

## License

MIT
