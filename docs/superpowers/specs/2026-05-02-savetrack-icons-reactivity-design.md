# SaveTrack Icons + Reactivity Design

**Date:** 2026-05-02
**Approach:** A (Local SVG icons + explicit render/bind split)

## Goals
- Replace all icon fonts with local SVGs.
- Fix “static” UI updates across dashboard, history, and tabs.
- Ensure tab switching always reflects current data.
- Eliminate duplicate event handlers.

## Scope
1. Local SVG icon system with `renderIcons()`.
2. Split each module into **bind** (one-time events) and **render** (UI updates).
3. Update `updateUI()` to only render (no repeated binding).
4. Refresh the active view on tab switch.

## Design

### 1) Local SVG Icons
- Create `src/icons/` and add SVGs for every icon currently used.
- Add `src/lib/icons.js` with:
  - `iconMap`: `{ name: svgMarkup }`
  - `renderIcons(root)`: replaces any element with `data-icon="name"` with inline SVG.
- Update markup to remove icon text content; keep only `data-icon`.
- Call `renderIcons(document)` after initial render and after `updateUI()`.

### 2) Bind/Render Split
- For each module (`dashboard`, `log`, `goals`, `history`, `settings`):
  - `bindX()` attaches event listeners once.
  - `renderX(data)` updates DOM based on current state.
- `initApp()` calls all `bindX()` once.
- `updateUI()` calls all `renderX()` only.

### 3) Tab Switching and View Refresh
- On tab switch, call `renderX(appData)` for the selected view.
- Preserve chart instances by re-rendering with fresh data instead of reinitializing handlers.

### 4) Acceptance Tests
- Logging updates dashboard + history without reload.
- Tab switching always shows up-to-date data.
- Icons render offline with no font/CDN dependencies.
- No duplicate submits or click handlers.

## Files Affected (Planned)
- Create: `src/icons/*.svg`
- Create: `src/lib/icons.js`
- Modify: `index.html` (replace icon usage)
- Modify: `src/main.js` (bind/render lifecycle + renderIcons)
- Modify: `src/components/*.js` (split bind/render)

## Testing
- Manual smoke tests for tab switching and live updates.
- Optional unit test for `renderIcons()` output.
