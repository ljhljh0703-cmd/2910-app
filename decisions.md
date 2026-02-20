# 2910 App Development Decisions Log

## R1: Core Feature Implementation & Initial UI (Completed)
- **Goal**: Implement 60s Timer (Auto-interrupt & 5s sequence) and 6-button Narrator.
- **Tech Stack**: React/TS, Vite, Tailwind CSS.
- **Audio**: Mocked with Web Speech API (TTS).
- **Design**: Dystopian theme (Orange/Charcoal) applied using city skyline background image (`public/bg.png`).

## R2: UI Refinement & Error Debugging (Completed)
- **Goal**: Center Timer UI, improve progress ring visual, and achieve a stable build.
- **Decision**: Timer UI layout centered, crosshair focus implemented.
- **Error Encountered**: Repeated TS/Babel errors due to complex string interpolation within `className` props in `App.tsx`.
- **Solution**: Simplified JSX structure and string interpolation logic. The code is now restructured to ensure a single root return element and strict adherence to template literal closure.
- **Build Status**: **Successfully Built** after final restructuring.

## R3: Mobile Optimization & Stability (In Progress)
- **Goal**: Optimize for mobile devices (Wake Lock, Haptics, Safe Area, Responsive Layout).
- **Decision (Layout)**: Switch from fixed pixels (`px`) to relative viewport units (`vmin`) to support diverse screen sizes (e.g., iPhone SE vs Pro Max).
- **Decision (Audio)**: Retain TTS `onend` safety timeout but refine it. Implement AudioContext unlocking on first interaction.
- **Decision (Device)**: Implement Screen Wake Lock API to prevent sleep during gameplay.
- **Decision (Type Safety)**: Create `global.d.ts` to properly type `window.__ttsUtterance` instead of using `any`.

## Next Steps
1.  **Type Safety**: Create `src/types/global.d.ts`.
2.  **Responsive UI**: Refactor `App.tsx` layout to use `vmin` and `safe-area` utilities.
3.  **Device Features**: Add Wake Lock and Vibration logic.
