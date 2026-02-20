# 📱 2910 Project: Mobile Optimization Specification

## 1. Project Overview
**Goal**: Optimize the "2910" board game companion web app for mobile devices. Users access the app via QR code during gameplay to manage time and receive audio guides (TTS).
**Current Stack**: React 19, Vite, Tailwind CSS, TypeScript.

---

## 2. Risk Assessment & Mitigation
| Risk | Severity | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Sleep Mode** | 🔴 Critical | Screen turns off during the 60s countdown, pausing the game. | Implement **Screen Wake Lock API**. |
| **Audio Blocking** | 🔴 Critical | Mobile browsers block TTS if not triggered by direct interaction. | Unlock AudioContext on the first user interaction (touch). |
| **Viewport Issues** | 🟠 High | Browser toolbars (Safari/Chrome) hide UI elements. | Use **dvh (Dynamic Viewport Height)** instead of `vh`. |
| **Layout Breakage** | 🟠 High | Fixed pixel widths (`320px`) break on small screens (e.g., iPhone SE). | Refactor to **Relative Units (`vmin`, `%`)**. |
| **Lack of Feedback** | 🟡 Medium | No tactile response creates uncertainty during urgent gameplay. | Add **Haptic Feedback (Vibration API)**. |

---

## 3. Implementation Requirements

### 3.1. Mobile-First Layout & Styling
**Objective**: Ensure the UI fits perfectly on any screen size without scrolling or cutting off content.

- [ ] **Viewport Height Fix**:
  - Replace `h-[100dvh]` or `h-screen` with `min-h-[100dvh]` to handle mobile browser address bars correctly.
  - Ensure the main container (`div`) uses `dvh` for full height.
- [ ] **Responsive Sizing (Refactor Hardcoded Pixels)**:
  - Target: `src/App.tsx`
  - Change `w-[320px] h-[320px]` (Crosshair) to relative units (e.g., `w-[80vmin] h-[80vmin]`).
  - Change `w-56 h-56` (Main Timer Button) to relative units (e.g., `w-[60vmin] h-[60vmin]`).
  - Ensure the SVG circle `radius` scales or uses a `viewBox` approach to remain responsive.
- [ ] **Safe Area Support**:
  - Add `padding-bottom: env(safe-area-inset-bottom)` to the container to prevent content from being hidden by the home indicator on iOS.

### 3.2. Device Capability Integration
**Objective**: Utilize device hardware for a better board game experience.

- [ ] **Screen Wake Lock (No-Sleep)**:
  - Use `navigator.wakeLock.request('screen')` when the timer starts (`RUNNING_60` or `RUNNING_5`).
  - Release the lock when the timer stops or the component unmounts.
  - Handle visibility change events (re-acquire lock if user switches tabs and comes back).
- [ ] **Haptic Feedback (Vibration)**:
  - Use `navigator.vibrate(ms)` for tactile feedback.
  - **Pattern**:
    - Button Click: `vibrate(10)` (Short tick).
    - Phase Change / Timer End: `vibrate([200, 100, 200])` (Strong alert).

### 3.3. Audio & TTS Stability
**Objective**: Ensure voice guidance plays reliably on mobile.

- [ ] **Audio Context Unlocking**:
  - Create a "Start" or "Enter" overlay if necessary, or hook into the first interaction (e.g., clicking a phase button) to resume `window.speechSynthesis` context.
- [ ] **TTS Timing Fix**:
  - Remove hardcoded timeouts (e.g., `4500ms`) in `startInterruptSequence`.
  - Rely strictly on `utterance.onend` events to trigger the next phase.

### 3.4. Code Quality & Maintenance
**Objective**: Clean up technical debt for stability.

- [ ] **Type Safety**:
  - Fix `(window as any).__ttsUtterance`.
  - Create a `types/global.d.ts` or extend the Window interface to include `__ttsUtterance` properly.
- [ ] **Config-Driven Styling**:
  - Remove hardcoded hex codes (e.g., `#ff8c00`) in SVG elements.
  - Use `currentColor` or import colors from a constant file that maps to `tailwind.config.js`.

---

## 4. Acceptance Criteria
1.  **Device Test**: App must keep the screen awake for >60 seconds on a mobile device without touch.
2.  **Visual Test**: The timer circle and crosshair must not overflow on a generic device (375px width) or a large device.
3.  **Functional Test**: TTS must play immediately upon button press on iOS Safari.
