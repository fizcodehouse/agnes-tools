# Agnes Tools

**Type:** Project  
**Status:** 🟢 Active  
**Created:** 2026-07-15  
**Tech Stack:** Next.js (React) / Vercel  

---

## Description

Frontend web app for Agnes AI image and video generation APIs. Features two tabs for text-to-image and text-to-video generation with configurable parameters.

---

## File Structure

```
/workspace/projects/agnes-tools/
├── README.md
├── .gitignore
├── package.json
├── next.config.js
├── scripts/
│   └── (deployment scripts)
├── output/
├── references/
│   └── agnes-api-docs.md (copied from API docs)
├── public/
└── app/
    ├── layout.tsx
    ├── page.tsx
    └── api/
        ├── image/
        │   └── route.ts
        └── video/
            └── route.ts
```

---

## Setup

### Prerequisites

- Node.js installed
- Agnes AI API key (user inputs their own in the UI)

### Installation

```bash
cd /workspace/projects/agnes-tools
npm install
```

---

## Usage

```bash
npm run dev
```

Open http://localhost:3000 to access the tool.

---

## API Integration

**Image Generation:**
- Model: `agnes-image-2.1-flash`
- Endpoint: `POST https://apihub.agnes-ai.com/v1/images/generations`

**Video Generation:**
- Model: `agnes-video-v2.0`
- Endpoint: `POST https://apihub.agnes-api.com/v1/videos`
- Polling: `GET https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>`

---

## Changelog

| Date       | Change                |
|------------|-----------------------|
| 2026-07-15 | Initial scaffold     |

---

## Related

- GitHub: fizcodehouse/agnes-tools
- Vercel: agnes-tools.vercel.app