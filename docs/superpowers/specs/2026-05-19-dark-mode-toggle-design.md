# Dark Mode Toggle — Design

## Context

The Northwind employee dashboard (`docs/`, a Jekyll site served via GitHub
Pages) is currently dark-mode only. The CSS already uses custom properties
for color tokens (`--bg`, `--card`, `--accent`, `--text`, `--muted`,
`--border`, `--positive`, `--warning`), but several values are hardcoded
either in CSS (e.g. `details pre { background: #0a0e14 }`,
`rgba(255,255,255,…)` hover/grid tints) or in `dashboard.js` (Chart.js
configs use hex literals). The site has no build-time test suite —
verification is manual via Jekyll serve.

## Goal

Let the user pick between three theme modes — **Light**, **Dark**, and
**System** — via a segmented control in the page header. Persist the
choice in `localStorage`. Respect the OS `prefers-color-scheme` when no
explicit choice is set. No flash of wrong theme on load.

## Non-goals

- New color tokens beyond what's needed for parity with the current dark
  theme.
- Animated theme transitions (color changes are instant).
- Theme picker on a per-component basis.
- Refactor of chart rendering beyond what's needed to make charts
  re-color.

## Architecture

Theme is selected by a `data-theme` attribute on `<html>`:

- `data-theme="light"` → explicit light
- `data-theme="dark"` → explicit dark
- *attribute absent* → "system" mode, where a
  `@media (prefers-color-scheme: light)` rule overrides the default
  dark tokens

A small inline script in `<head>` reads `localStorage.theme` and sets the
attribute synchronously *before* the stylesheet loads, eliminating
flash-of-wrong-theme.

The segmented toggle UI lives in the page header, top-right. Clicking a
button writes `localStorage.theme`, updates the `data-theme` attribute,
re-styles the active button, and triggers a chart re-render so Chart.js
canvases pick up the new colors.

## Components

### 1. CSS theme tokens (`docs/assets/css/style.css`)

Keep the current dark values in `:root` (default). Add an explicit light
override and a system-mode media query.

```css
:root {
  --bg: #0d1117;
  --card: #161b22;
  --border: #1e2937;
  --accent: #00d4ff;
  --positive: #00ff88;
  --warning: #f0883e;
  --text: #e6edf3;
  --muted: #8b949e;
  --chart-grid: rgba(255,255,255,0.06);
  --details-bg: #0a0e14;
  --row-hover: rgba(255,255,255,0.03);
}

html[data-theme="light"] {
  --bg: #ffffff;
  --card: #f6f8fa;
  --border: #d0d7de;
  --accent: #0969da;
  --positive: #1a7f37;
  --warning: #bc4c00;
  --text: #1f2328;
  --muted: #656d76;
  --chart-grid: rgba(0,0,0,0.08);
  --details-bg: #f6f8fa;
  --row-hover: rgba(0,0,0,0.04);
}

@media (prefers-color-scheme: light) {
  html:not([data-theme]) {
    /* duplicate the full token list from html[data-theme="light"];
       plain CSS has no @extend, so the values are repeated verbatim */
  }
}
```

Implementation note: the light overrides are duplicated in two
selectors — `html[data-theme="light"]` and the
`@media (prefers-color-scheme: light) html:not([data-theme])` block —
because plain CSS has no shared-block mechanism. Both blocks must stay
in sync; future changes to one need to be mirrored to the other.

Inline hex values in existing rules that don't already use a token are
migrated:

- `details pre { background: #0a0e14 }` → `var(--details-bg)`
- `.summary-table tr:hover { background: rgba(255,255,255,0.03) }` →
  `var(--row-hover)`
- `.framework-table tr:hover { background: rgba(255,255,255,0.03) }` →
  `var(--row-hover)`

### 2. Pre-paint bootstrap (`docs/_layouts/default.html`)

Inline `<script>` placed in `<head>` *before* the stylesheet `<link>`:

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.setAttribute('data-theme', stored);
      }
    } catch (e) { /* localStorage unavailable; fall through to system */ }
  })();
</script>
```

### 3. Toggle markup (`docs/_layouts/default.html`)

Inside `<header class="header">`, after the title block:

```html
<div class="theme-toggle" role="radiogroup" aria-label="Theme">
  <button class="theme-toggle__btn" data-theme-choice="light"
          aria-label="Light theme" title="Light">
    <!-- inline sun SVG, fill="currentColor" -->
  </button>
  <button class="theme-toggle__btn" data-theme-choice="system"
          aria-label="Follow system theme" title="System">
    <!-- inline monitor SVG, fill="currentColor" -->
  </button>
  <button class="theme-toggle__btn" data-theme-choice="dark"
          aria-label="Dark theme" title="Dark">
    <!-- inline moon SVG, fill="currentColor" -->
  </button>
</div>
```

### 4. Toggle styling (`docs/assets/css/style.css`)

```css
.header { position: relative; }

.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  gap: 0.125rem;
  padding: 0.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.theme-toggle__btn {
  background: transparent;
  border: none;
  color: var(--muted);
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.theme-toggle__btn:hover { color: var(--text); }

.theme-toggle__btn--active {
  background: var(--accent);
  color: var(--bg);
}

.theme-toggle__btn svg { width: 1rem; height: 1rem; display: block; }

@media (max-width: 768px) {
  .theme-toggle { position: static; margin: 0.5rem auto 0; }
  .header { text-align: center; }
}
```

### 5. Toggle behavior (`docs/assets/js/dashboard.js`)

New `initThemeToggle()` invoked from the `DOMContentLoaded` handler:

```js
function initThemeToggle() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('.theme-toggle__btn');

  function readChoice() {
    try {
      const v = localStorage.getItem('theme');
      return (v === 'light' || v === 'dark') ? v : 'system';
    } catch (e) { return 'system'; }
  }

  function apply(choice) {
    try {
      if (choice === 'system') {
        root.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      } else {
        root.setAttribute('data-theme', choice);
        localStorage.setItem('theme', choice);
      }
    } catch (e) {
      // fall back to in-memory: still set/remove the attribute
      if (choice === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', choice);
    }
    buttons.forEach(b => {
      const active = b.dataset.themeChoice === choice;
      b.classList.toggle('theme-toggle__btn--active', active);
      b.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    rerenderCharts();
  }

  buttons.forEach(b =>
    b.addEventListener('click', () => apply(b.dataset.themeChoice)));

  matchMedia('(prefers-color-scheme: light)')
    .addEventListener('change', () => {
      if (readChoice() === 'system') rerenderCharts();
    });

  apply(readChoice());
}
```

### 6. Chart color sourcing (`docs/assets/js/dashboard.js`)

Add a CSS-var helper and replace hex literals in Chart.js configs:

```js
const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
```

Replacements:

| Literal                       | Replacement                              |
| ----------------------------- | ---------------------------------------- |
| `'#00d4ff'`                   | `cssVar('--accent')`                     |
| `'#00ff88'` (Peacock bar)     | `cssVar('--positive')`                   |
| `'#f0883e'` (negative r)      | `cssVar('--warning')`                    |
| `'#8b949e'` (axis ticks)      | `cssVar('--muted')`                      |
| `'#e6edf3'` (label text)      | `cssVar('--text')`                       |
| `'rgba(255,255,255,0.06)'`    | `cssVar('--chart-grid')`                 |

Track chart instances so they can be torn down on theme change:

```js
const chartRegistry = [];

function rerenderCharts() {
  while (chartRegistry.length) chartRegistry.pop().destroy();
  initThroughputCharts();
  initInputCharts();
  initCorrelationChart();
}
```

`renderBarChart` and `initCorrelationChart` push the `new Chart(...)`
return value onto `chartRegistry` instead of discarding it.

## Data flow

```
load
 ├─ inline bootstrap reads localStorage → sets [data-theme] on <html>
 ├─ stylesheet applies tokens for the chosen theme
 ├─ DOMContentLoaded fires
 │    ├─ initThemeToggle() syncs button state & registers listeners
 │    └─ initThroughputCharts / initInputCharts / initCorrelationChart
 │       read CSS vars and render
 └─ user clicks a toggle button
      └─ apply(choice)
           ├─ updates localStorage + [data-theme]
           ├─ re-styles active button
           └─ rerenderCharts() destroys + re-creates all charts
```

## Error handling

- `localStorage` reads/writes are wrapped in `try/catch`. If unavailable,
  the toggle still works for the session (attribute is set in memory),
  it just won't persist across reloads.
- If a user navigates to the page with an invalid `localStorage.theme`
  value (anything other than `light`/`dark`), the bootstrap treats it as
  system mode (no attribute set), and `readChoice()` returns `'system'`.

## Testing

Manual verification via local Jekyll serve:

1. Default load (no stored preference) → dark theme on a dark-preferring
   OS, light theme on a light-preferring OS.
2. Click **Light** → page recolors to light palette; all chart
   text/grids/bars recolor. Reload → still light.
3. Click **Dark** → reverse of (2). Reload → still dark.
4. Click **System** → `data-theme` attribute removed,
   `localStorage.theme` cleared. Page follows OS preference. Toggle the
   OS preference (or use DevTools' emulation) → charts re-render.
5. On `localStorage` failure (private mode): toggle still functions for
   the session; preference is not retained across reload.
6. Reload in any explicit mode → no flash of the wrong theme.
7. Mobile breakpoint (`max-width: 768px`): toggle wraps below the title
   and remains usable.
8. Keyboard: `Tab` reaches the toggle; `Enter` / `Space` activate the
   focused button.

## Files touched

- `docs/_layouts/default.html` — add bootstrap script, toggle markup.
- `docs/assets/css/style.css` — add light tokens, system media query,
  toggle styles; tokenize three hex/rgba leakages.
- `docs/assets/js/dashboard.js` — add `initThemeToggle`, `cssVar`,
  `chartRegistry`, `rerenderCharts`; replace chart color literals.
