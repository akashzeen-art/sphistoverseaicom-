# HistoVerse AI (Project 2 History)

React + Vite frontend for talking with historical figures via the **shared**
backend + MuseTalk lip-sync (same APIs as Trip XAI / Project 1 Tour).

## Local setup

1. Start the shared backend (`backend/` on port 3001) with MuseTalk / RunPod configured.
2. In this folder:

```bash
cp .env.example .env   # already uses project id `history`
npm install
npm run dev            # http://localhost:5174
```

Vite proxies `/api` → `http://localhost:3001`.

## Talk flow

- Home / Brain Trainers → `/talk/:id`
- `TalkPanel` uses `useAvatarGuideChat` → `/chat`, `/chat/wait-media`, `/chat/next-chunk`, avatar video poll/download
- Per-figure persona + TTS voice: `src/data/figureGuide.js`
- Profiles (images/names): `src/data/talkProfiles.js`

## Adding a new character later

1. Add profile in `talkProfiles.js` (+ catalog entry if needed).
2. Optional: voice/instructions in `figureGuide.js`.
3. Optional: set `idleVideo` / `avatarRegion` on the profile when you have MuseTalk assets.
4. Drop character idle/talk videos under `public/videos/` and `backend/assets/projects/history/` when ready.

Until then, all figures use the default history idle/talk videos (and Marilyn can use `/vid/Marilyn.mp4` as idle).
