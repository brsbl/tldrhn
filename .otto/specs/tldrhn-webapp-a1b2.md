---
spec_id: tldrhn-webapp-a1b2
title: TLDR Hacker News
type: web-app
status: approved
created: 2026-01-22
---

# TLDR Hacker News

A web app for visually scanning the top 30 Hacker News stories with article screenshots, AI-generated summaries, and top comments.

## Overview

TLDR Hacker News solves information overload by providing a visual-first approach to consuming Hacker News. Instead of reading through 30 text headlines, users can visually scan article screenshots and AI-generated summaries to quickly identify stories worth their time.

## Goals

1. Reduce time to scan HN from 10+ minutes to under 2 minutes
2. Provide visual context (screenshots) that text-only competitors lack
3. Surface article content summaries, not just HN discussion summaries
4. Display top community insight (best comment) alongside each story

## Technical Architecture

### Stack
- **Frontend**: React + TypeScript with Vite
- **Styling**: Tailwind CSS
- **Backend**: Node.js API routes (or serverless functions)
- **LLM**: OpenAI API (gpt-4o-mini for cost-effective summaries)
- **Screenshot Service**: Playwright for capturing article screenshots
- **Data Source**: Official HN API (https://hacker-news.firebaseio.com/v0/)

### Data Flow
```
1. Fetch top 30 story IDs from HN API
2. For each story:
   a. Fetch story details (title, url, score, by, descendants)
   b. Fetch article content via web scraping (Cheerio/JSDOM)
   c. Generate screenshot of article page (Playwright)
   d. Generate 2-3 sentence summary via LLM
   e. Fetch top comment (sorted by score)
3. Cache results (15-30 min TTL)
4. Serve to frontend
```

### API Endpoints
- `GET /api/stories` - Returns processed stories with summaries/screenshots
- `GET /api/story/:id` - Returns single story with full details
- `POST /api/refresh` - Force refresh of all stories (admin)

## Data Model

### Story
```typescript
interface Story {
  id: number;                    // HN story ID
  title: string;                 // Story headline
  url: string;                   // Link to article
  hnUrl: string;                 // Link to HN discussion
  score: number;                 // HN points
  by: string;                    // Submitter username
  time: number;                  // Unix timestamp
  descendants: number;           // Comment count

  // Enriched data
  summary: string;               // AI-generated 2-3 sentence summary
  screenshotUrl: string;         // URL to cached screenshot image
  topComment: Comment | null;    // Highest-scored comment

  // Metadata
  fetchedAt: number;             // When we processed this story
  articleText: string | null;    // Extracted article text (for debugging)
}

interface Comment {
  id: number;
  by: string;
  text: string;                  // HTML content
  score: number;                 // Estimated from position/replies
}
```

## Features

### Tier 1: Core (Must Have)

1. **HN API Integration**
   - Fetch top 30 stories from official HN API
   - Fetch story metadata (title, url, score, comments)
   - Handle Ask HN, Show HN, and job posts gracefully

2. **Web Scraping for Article Content**
   - Extract article text using Cheerio/JSDOM
   - Handle common article layouts (paragraphs, headers)
   - Respect robots.txt and rate limiting
   - Graceful fallback for paywalled/blocked sites

3. **Screenshot Capture**
   - Use Playwright to capture article screenshots
   - Viewport: 1200x800 for desktop preview
   - Handle timeout/errors gracefully
   - Placeholder image for failed captures

4. **LLM Summary Generation**
   - Send article text to OpenAI API
   - Generate 2-3 sentence summary
   - Handle API errors with fallback (first paragraph)
   - Prompt engineering for neutral, informative tone

5. **Top Comment Fetching**
   - Fetch comment tree from HN API
   - Select highest-quality comment (heuristics: replies, length)
   - Strip HTML but preserve basic formatting

6. **Story Card Display**
   - Screenshot thumbnail (clickable to article)
   - Headline with link to article
   - Summary text (2-3 sentences)
   - Top comment (collapsible)
   - Metadata: points, comments count, time ago

7. **Responsive Grid Layout**
   - 3 columns on desktop, 2 on tablet, 1 on mobile
   - Consistent card sizing with aspect-ratio thumbnails
   - Smooth scrolling with lazy loading

### Tier 2: Expected (Should Have)

8. **Loading States**
   - Skeleton loaders while stories load
   - Progressive loading (show cards as they're ready)
   - Loading spinner for individual operations

9. **Error Handling UI**
   - Error boundary for crashed components
   - Retry button for failed fetches
   - Toast notifications for errors

10. **Caching Layer**
    - In-memory or Redis cache for processed stories
    - 30-minute TTL to reduce API calls
    - Manual refresh capability

11. **Link to HN Discussion**
    - "N comments" link to HN page
    - Opens in new tab
    - Visual indicator for active discussions (100+ comments)

12. **Time Formatting**
    - "2 hours ago" relative timestamps
    - Tooltip with absolute date/time

13. **Accessibility**
    - Semantic HTML (article, heading, time)
    - Alt text for screenshots
    - Keyboard navigation support
    - Focus indicators

### Tier 3: Delightful (Nice to Have)

14. **Dark Mode**
    - System preference detection
    - Manual toggle with persistence
    - Smooth theme transition

15. **Refresh Button**
    - Manual refresh with visual feedback
    - Auto-refresh indicator (last updated X min ago)
    - Rate limiting (max 1 refresh per 5 min)

16. **Story Filtering**
    - Hide read stories (local storage)
    - Filter by type (Show HN, Ask HN, regular)
    - Minimum score filter

17. **Keyboard Shortcuts**
    - J/K to navigate stories
    - O to open article
    - C to open comments
    - R to refresh

18. **Share Functionality**
    - Share button on each card
    - Copy link to clipboard
    - Native share API on mobile

19. **Bookmark/Save for Later**
    - Save stories to local storage
    - Separate "Saved" view
    - Export bookmarks as JSON

20. **Reading Time Estimate**
    - Estimate based on article word count
    - Display "5 min read" on cards

## User Flows

### Flow 1: Initial Page Load
1. User visits TLDR HN homepage
2. See skeleton loading state (30 cards)
3. Cards progressively populate with content
4. Full grid visible within 5-10 seconds

### Flow 2: Read a Story
1. User scans visual grid of screenshots
2. Clicks interesting screenshot or headline
3. Article opens in new tab
4. User can read summary for context before diving in

### Flow 3: Check Community Discussion
1. User reads summary, wants community take
2. Expands "Top Comment" section
3. Reads highlighted comment
4. Clicks "N comments" to go to full HN discussion

### Flow 4: Refresh Content
1. User returns after 1 hour
2. Clicks refresh button
3. Loading indicator appears
4. New stories populate with visual diff (new badges)

## Error Handling Strategy

| Error Type | Response |
|------------|----------|
| HN API down | Show cached content + "Data may be stale" banner |
| Article scrape fails | Show placeholder + "Summary unavailable" |
| Screenshot fails | Show generic placeholder image |
| LLM API error | Use first paragraph as summary |
| Single story fails | Skip and show 29 stories |

## Performance Targets

- Initial load: < 3 seconds to first meaningful paint
- Full load: < 10 seconds for all 30 stories
- Lighthouse score: > 90 (performance)
- Core Web Vitals: Pass

## Security Considerations

- Sanitize HTML in comments (XSS prevention)
- Rate limit API endpoints
- Validate all external URLs before fetching
- Store API keys in environment variables

## Future Considerations

- User accounts for personalized feeds
- Email digest subscription
- Browser extension for inline summaries
- AI-powered story recommendations
- Historical archive with search
