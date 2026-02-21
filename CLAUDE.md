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
- **State:** Zustand (3 stores: project, generation, UI)
- **Persistence:** IndexedDB (via idb package)
- **Routing:** React Router DOM
- **API:** Wavespeed.ai (image, video, voice, lipsync generation)

## Project Structure

```
src/
├── components/
│   ├── dashboard/      # Project list, create/delete projects
│   ├── script/         # Script input, AI scene breakdown
│   ├── shots/          # Shot grid/list overview
│   ├── visuals/        # Image generation (keyframes)
│   ├── video/          # Image-to-video generation
│   ├── voice/          # Text-to-speech generation
│   ├── assembly/       # Timeline, lipsync, export
│   ├── settings/       # API keys, preferences
│   ├── layout/         # Header, Sidebar, ProjectLayout
│   └── common/         # Reusable UI components
├── lib/
│   ├── providers/      # API clients (wavespeed.js, mock.js)
│   ├── models/         # Model registry + per-model schemas
│   ├── store/          # Zustand stores
│   ├── db/             # IndexedDB wrapper
│   └── utils/          # Helper functions
└── styles/
    └── global.css      # Tailwind + custom theme
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/store/projectStore.js` | Project/scene/shot CRUD, current selection |
| `lib/store/generationStore.js` | Async AI task management, polling |
| `lib/store/uiStore.js` | Sidebar, modals, view modes, notifications |
| `lib/providers/index.js` | Unified `aiService` API routing |
| `lib/providers/wavespeed.js` | Wavespeed.ai API client |
| `lib/models/registry.js` | Model definitions (4 categories) |
| `lib/models/schemas.js` | Per-model parameters, options |
| `lib/db/index.js` | IndexedDB operations |

## The Pipeline

```
1. Script Page     → Input script, AI breaks into scenes/shots
2. Shots Page      → Overview of all shots with status indicators
3. Visuals Page    → Generate keyframe images for each shot
4. Video Page      → Convert keyframes to video with motion
5. Voice Page      → Generate dialogue audio with emotion/pace
6. Assembly Page   → Timeline, add lipsync, export to NLE
```

## Supported Models

**Image Generation:** Seedream 4.5, Flux Dev, WAN 2.6, Kling Image
**Image-to-Video:** Kling Pro I2V, WAN 2.6 I2V, Sora 2 I2V, Vidu Q3 I2V
**Voice:** Gemini TTS (30+ voices, 24 languages)
**Lipsync:** Longcat Avatar, InfiniteTalk

## Running the Project

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

API keys are configured in Settings page and stored in localStorage.

## Data Structures

**Project** contains: scenes[], characters[], locations[], assembly timeline
**Scene** contains: shots[], location, timeOfDay, mood, dialogueLines
**Shot** contains: keyframes[], videoTakes[], audioTakes[], selected media

## Adding New Models

1. Add to `modelRegistry` in `lib/models/registry.js`
2. Add schema in `lib/models/schemas.js`
3. If new provider, create `lib/providers/newprovider.js`
4. Update routing in `lib/providers/index.js`

---

## Current Status / Notes

<!-- Update this section as work progresses -->

- MVP is functional with all 8 pages working
- Wavespeed API integration complete
- Mock provider available for testing without API keys
- Script parsing uses regex (Claude API integration planned)
- Export functionality is placeholder (needs implementation)
