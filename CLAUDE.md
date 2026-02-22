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
│   ├── dashboard/        # Project list, create/delete projects
│   ├── script/           # Script input, AI scene breakdown
│   ├── shots/            # Shot grid/list overview
│   ├── visuals/          # Image generation (keyframes)
│   ├── video/            # Image-to-video generation
│   ├── voice/            # Text-to-speech generation
│   ├── camera-explorer/  # 3D scene navigation + frame generation
│   ├── assembly/         # Timeline, lipsync, export
│   ├── settings/         # API keys, preferences
│   ├── layout/           # Header, Sidebar, ProjectLayout
│   └── common/           # Reusable UI components
├── lib/
│   ├── providers/        # API clients (wavespeed.js, modal.js, mock.js)
│   ├── models/           # Model registry + per-model schemas
│   ├── store/            # Zustand stores (4: project, generation, UI, cameraExplorer)
│   ├── camera/           # Lens presets and camera constants
│   ├── db/               # IndexedDB wrapper
│   └── utils/            # Helper functions
└── styles/
    └── global.css        # Tailwind + custom theme
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/store/projectStore.js` | Project/scene/shot CRUD, current selection |
| `lib/store/generationStore.js` | Async AI task management, polling |
| `lib/store/uiStore.js` | Sidebar, modals, view modes, notifications |
| `lib/providers/index.js` | Unified `aiService` API routing |
| `lib/providers/wavespeed.js` | Wavespeed.ai API client |
| `lib/providers/modal.js` | Modal endpoint client (3D reconstruction) |
| `lib/store/cameraExplorerStore.js` | Camera 3D state (reconstruction, snapshots) |
| `lib/camera/lensPresets.js` | Cinematic lens FOV configurations |
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
6. Camera 3D Page  → 3D scene exploration, custom camera angles
7. Assembly Page   → Timeline, add lipsync, export to NLE
```

## Camera 3D Explorer (New Feature)

Uses Apple ml-sharp for 3D Gaussian Splat reconstruction. Workflow:
1. Select a keyframe from Visuals page
2. Click "Reconstruct 3D" → calls Modal endpoint
3. Navigate 3D scene with mouse/keyboard
4. Switch lens presets: 24mm, 35mm, 50mm, 85mm, 135mm (keys 1-5)
5. Capture snapshots from custom camera positions
6. Generate consistent frames using AI

**Keyboard Shortcuts:**
- 1-5: Switch lens
- Space: Capture snapshot
- G: Toggle grid
- H: Toggle HUD
- R: Reset camera

**Modal Endpoint:** https://chartin80--apple-sharp-sharpmodel-generate.modal.run

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

- MVP is functional with all 8 pages working (including new Camera 3D)
- Wavespeed API integration complete
- Modal provider added for 3D reconstruction (Apple ml-sharp)
- Camera 3D Explorer uses GaussianSplats3D + Three.js for rendering
- Mock provider available for testing without API keys
- Script parsing uses regex (Claude API integration planned)
- Export functionality is placeholder (needs implementation)
- Modal endpoint may return 500 errors (check Modal dashboard for logs)
