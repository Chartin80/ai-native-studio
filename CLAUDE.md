# AI Native Studio

## What This Is

AI Native Studio is an enterprise-grade cinematic AI pipeline for professional film/TV production. It takes scripted scenes through a complete workflow: script → shot planning → storyboards/keyframes → image-to-video → voice/performance → lipsync → rough assembly.

**Core Philosophy:**
- AI-native (designed around AI from the ground up, not bolted on)
- Below-the-line focused (AI as technician, humans remain authors and decision-makers)
- Modular (new AI models plug in via config, no vendor lock-in)
- Enterprise security ready

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS (dark cinematic theme)
- **State:** Zustand (4 stores: project, generation, UI, cameraExplorer)
- **Persistence:** Supabase (PostgreSQL) with IndexedDB fallback
- **Routing:** React Router DOM
- **API Proxy:** Vercel Serverless Functions (to avoid CORS)
- **AI Providers:** Wavespeed.ai (Nano Banana Pro Edit, Seedance 1.5 Pro)

---

## CRITICAL DEPLOYMENT INFO

### Vercel Deployment (IMPORTANT!)

**Pushing to GitHub does NOT automatically deploy to Vercel for this project.**

After making code changes, you must ALWAYS run:
```bash
npx vercel --prod
```

This is a manual deployment workflow. The git push to GitHub is for version control only.

### Access Control

The app has access code protection to prevent unauthorized API usage:
- Access code: `studio2025`
- Implemented in `src/components/auth/AccessGate.jsx`
- Stored in localStorage after successful entry

### API Keys

Wavespeed API key is hardcoded in:
- `src/lib/providers/wavespeed.js` (client-side, for reference)
- `api/wavespeed.js` (Vercel serverless function - actual API calls go through here)

The serverless proxy at `/api/wavespeed` handles all Wavespeed API calls to avoid CORS issues.

---

## Project Structure

```
src/
├── components/
│   ├── auth/            # AccessGate for access code protection
│   ├── dashboard/       # Project list, create/delete projects
│   ├── script/          # Script input, AI scene breakdown
│   ├── shots/           # Video clips canvas (drag-and-drop like Frames)
│   ├── frames/          # Image generation with Nano Banana Pro Edit
│   ├── visuals/         # Keyframe generation for shots
│   ├── video/           # Image-to-video generation
│   ├── voice/           # Text-to-speech generation
│   ├── camera-explorer/ # 3D scene navigation + frame generation
│   ├── assembly/        # Timeline, lipsync, export
│   ├── settings/        # API keys, preferences
│   ├── layout/          # Header, Sidebar, ProjectLayout
│   └── common/          # Reusable UI components
├── lib/
│   ├── providers/       # API clients (wavespeed.js, modal.js, mock.js)
│   ├── models/          # Model registry + per-model schemas
│   ├── store/           # Zustand stores
│   ├── supabase/        # Supabase client + data service abstraction
│   ├── camera/          # Lens presets and camera constants
│   ├── db/              # IndexedDB wrapper (fallback)
│   └── utils/           # Helper functions
├── api/
│   └── wavespeed.js     # Vercel serverless proxy for Wavespeed API
└── styles/
    └── global.css       # Tailwind + custom theme
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/store/projectStore.js` | Project/scene/shot/frames/clips CRUD |
| `lib/store/generationStore.js` | Async AI task management, polling |
| `lib/store/uiStore.js` | Sidebar, modals, view modes, notifications |
| `lib/providers/wavespeed.js` | Wavespeed.ai API client (Nano Banana, Seedance) |
| `lib/supabase/dataService.js` | Data abstraction (Supabase or IndexedDB fallback) |
| `api/wavespeed.js` | Vercel serverless proxy for CORS |
| `components/frames/FramesPage.jsx` | Figma-like canvas for generated images |
| `components/frames/VideoGenerationModal.jsx` | Modal for video generation settings |
| `components/shots/ShotsPage.jsx` | Figma-like canvas for video clips |

---

## Current Features

### Frames Page (Image Generation)
- **Nano Banana Pro Edit** for AI image editing
- Figma-like draggable canvas for generated frames
- Frames persist to Supabase database
- Each frame card has:
  - Drag handle for repositioning
  - Magnify view (full-screen)
  - Dropdown menu: Create Video, Step Into Frame, Create New Angles, Download, Delete
  - Editable name and notes
- Positions auto-save on drag end

### Shots Page (Video Clips)
- Displays video clips generated from frames
- Same Figma-like draggable canvas as Frames
- Video cards include:
  - Play/pause on hover
  - Duration badge
  - Download and Delete options
  - Editable name and notes
- Clips persist to Supabase database

### Video Generation Flow
1. User generates an image in Frames tab using Nano Banana Pro Edit
2. User clicks 3-dot menu → "Create Video" on any frame
3. VideoGenerationModal opens with options:
   - Motion prompt (optional)
   - Duration slider: 4-12 seconds (default: 5)
   - Generate Audio checkbox (+$0.13)
   - Fixed Camera checkbox
4. Uses **Seedance 1.5 Pro** via Wavespeed API
5. Progress bar shows generation status (polling every 3s)
6. On completion, video clip is created with metadata from source frame
7. User is automatically navigated to Shots tab

### Data Persistence
- **Primary:** Supabase PostgreSQL database
- **Fallback:** IndexedDB (when Supabase not configured)
- Data service abstraction in `lib/supabase/dataService.js`
- Auto-save on frame/clip position changes

---

## Wavespeed API Endpoints Used

### Nano Banana Pro Edit (Image)
```
POST /api/v3/google/nano-banana-pro/edit
Body: { prompt, images[], aspect_ratio, resolution, output_format, enable_sync_mode }
```

### Seedance 1.5 Pro (Video)
```
POST /api/v3/bytedance/seedance-v1.5-pro/image-to-video-spicy
Body: { image, prompt, aspect_ratio, duration, resolution, generate_audio, camera_fixed, seed }
```

### Polling for Results
```
GET /api/v3/predictions/{requestId}/result
```

All requests go through `/api/wavespeed` serverless proxy to avoid CORS.

---

## Data Structures

### Project
```javascript
{
  id, name, createdAt, updatedAt,
  script: '',
  characters: [],
  locations: [],
  scenes: [],
  frames: [],      // Generated images from Frames page
  clips: [],       // Generated videos from Shots page
  assembly: { timeline: [] }
}
```

### Frame
```javascript
{
  id, name, notes,
  imageUrl,
  position: { x, y },
  prompt,
  sourceImages: [],
  aspectRatio,
  createdAt
}
```

### Clip
```javascript
{
  id, name, notes,
  videoUrl,
  position: { x, y },
  sourceFrameId,
  prompt,
  duration,
  aspectRatio,
  createdAt
}
```

---

## Supabase Setup

### Database Tables (see supabase/schema.sql)
- `projects` - Main project data (JSONB for flexible schema)
- `assets` - Stored files (images, videos)
- `generations` - AI generation history

### Environment Variables
```
VITE_SUPABASE_URL=https://xoufllwzdhwxcqccktwi.supabase.co
VITE_SUPABASE_ANON_KEY=<key>
```

---

## Running the Project

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

For production deployment:
```bash
npx vercel --prod
```

---

## Pending Features / TODOs

- [ ] "Step Into Frame" - 3D Gaussian Splat reconstruction (Camera Explorer)
- [ ] "Create New Angles" - Generate variations of a frame
- [ ] Audio generation on Shots page
- [ ] Lipsync integration
- [ ] Assembly timeline with video editing
- [ ] Script parsing with Claude API
- [ ] Export to NLE formats

---

## Session Notes (Last Updated: Feb 25, 2025)

### What Was Just Completed
1. Video generation from frames using Seedance 1.5 Pro
2. VideoGenerationModal with all settings (prompt, duration, audio, fixed camera)
3. ShotsPage rewritten with draggable canvas for video clips
4. Auto-navigation from Frames → Shots after video generation
5. Metadata (name, notes) flows from source frame to video clip

### Known Issues
- Modal endpoint for 3D reconstruction may return 500 errors
- Large chunk size warning in build (can be ignored for now)

### Architecture Decisions Made
- Vercel serverless proxy for all Wavespeed API calls (CORS workaround)
- Local position state during drag for smooth UI, save to DB on mouseup
- Supabase with IndexedDB fallback pattern for offline capability
- Hardcoded API key (for rapid development, should use env vars in production)

---

## Quick Reference Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Vercel (REQUIRED after code changes!)
npx vercel --prod

# Check Vercel deployments
npx vercel ls

# Git commit pattern
git add <files>
git commit -m "message"
git push origin main
npx vercel --prod   # <-- DON'T FORGET THIS!
```
