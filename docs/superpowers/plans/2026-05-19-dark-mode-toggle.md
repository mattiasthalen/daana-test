# Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-mode (Light / System / Dark) theme picker to the Northwind dashboard, persisted in localStorage, with FOUC-free pre-paint and Chart.js canvases that recolor on theme change.

**Architecture:** Theme is driven by a `data-theme` attribute on `<html>`. CSS custom properties hold all color tokens; explicit modes override via `html[data-theme="…"]`, system mode falls through to a `@media (prefers-color-scheme: light)` rule. A tiny inline script in `<head>` sets the attribute before paint. Chart.js reads colors from the CSS vars and is torn down + re-rendered on theme change.

**Tech Stack:** Jekyll, vanilla JS, plain CSS (custom properties), Chart.js 4 (via CDN). No test framework — verification is manual via `bundle exec jekyll serve`.

**Reference:** Design spec at `docs/superpowers/specs/2026-05-19-dark-mode-toggle-design.md`.

---

## Task 1: Tokenize the leaky color values in CSS

Three hardcoded color values in `style.css` aren't tokenized (`details pre` background, two `tr:hover` tints). Adding them to the token list now means the light theme override in Task 2 doesn't need to touch individual rules. No visible behavior change — pure refactor.

**Files:**
- Modify: `docs/assets/css/style.css`

- [ ] **Step 1: Add the three new tokens to `:root`**

In `docs/assets/css/style.css`, replace the `:root` block (lines 6-15) with:

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
  --chart-grid: rgba(255, 255, 255, 0.06);
  --details-bg: #0a0e14;
  --row-hover: rgba(255, 255, 255, 0.03);
}
```

- [ ] **Step 2: Replace the `details pre` background literal**

Find this rule (around lines 265-273):

```css
details pre {
  background: #0a0e14;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
```

Change the `background` line to:

```css
  background: var(--details-bg);
```

- [ ] **Step 3: Replace the two `tr:hover` literals**

Find `.summary-table tr:hover` (around lines 168-170):

```css
.summary-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
```

Change to:

```css
.summary-table tr:hover {
  background: var(--row-hover);
}
```

Find `.framework-table tr:hover` (around lines 240-242) and apply the same change:

```css
.framework-table tr:hover {
  background: var(--row-hover);
}
```

- [ ] **Step 4: Manual verification**

Start Jekyll (`cd docs && bundle exec jekyll serve` — or whatever command the repo uses; if Jekyll is unavailable, skip the visual check and verify only that the file parses with a CSS linter or browser DevTools). Load the page. Expand a `<details>` block on the overview tab. Hover a table row. The dashboard should look identical to before this task — same dark theme, same hover tint, same code-block background.

- [ ] **Step 5: Commit**

```bash
git add docs/assets/css/style.css
git commit -m "refactor(css): tokenize leaky color values

Pull three hardcoded values (details background, two row-hover tints)
into CSS custom properties so light-theme overrides can swap them in
one place."
```

---

## Task 2: Add the light palette and system-mode media query

Adds the explicit-light override and the system-mode fallback. After this task, the page will be light when you manually set `data-theme="light"` on `<html>` via DevTools, or when the OS prefers light and no attribute is set. The toggle UI doesn't exist yet — that's Task 4.

**Files:**
- Modify: `docs/assets/css/style.css`

- [ ] **Step 1: Append the explicit-light block**

Add this block immediately after the `:root` block in `docs/assets/css/style.css`:

```css
html[data-theme="light"] {
  --bg: #ffffff;
  --card: #f6f8fa;
  --border: #d0d7de;
  --accent: #0969da;
  --positive: #1a7f37;
  --warning: #bc4c00;
  --text: #1f2328;
  --muted: #656d76;
  --chart-grid: rgba(0, 0, 0, 0.08);
  --details-bg: #f6f8fa;
  --row-hover: rgba(0, 0, 0, 0.04);
}
```

- [ ] **Step 2: Append the system-mode media query**

Immediately after the `html[data-theme="light"]` block, add:

```css
@media (prefers-color-scheme: light) {
  html:not([data-theme]) {
    --bg: #ffffff;
    --card: #f6f8fa;
    --border: #d0d7de;
    --accent: #0969da;
    --positive: #1a7f37;
    --warning: #bc4c00;
    --text: #1f2328;
    --muted: #656d76;
    --chart-grid: rgba(0, 0, 0, 0.08);
    --details-bg: #f6f8fa;
    --row-hover: rgba(0, 0, 0, 0.04);
  }
}
```

The values are duplicated verbatim — plain CSS has no `@extend`. Any future change to one block must be mirrored in the other.

- [ ] **Step 3: Manual verification**

Reload the dashboard. In DevTools, find the `<html>` element and add the attribute `data-theme="light"`. The page (header, cards, tables, footer) should switch to the light palette: white background, dark text, blue accent. Charts will still be dark-themed — that's Task 6. Remove the attribute, then in DevTools' Rendering panel set "Emulate CSS prefers-color-scheme" to `light`. The page should go light again. Set it back to `dark`. The page should be dark.

- [ ] **Step 4: Commit**

```bash
git add docs/assets/css/style.css
git commit -m "feat(css): add light palette and prefers-color-scheme fallback

Light theme activates via html[data-theme=\"light\"] (explicit) or via
prefers-color-scheme: light when no data-theme attribute is set
(system mode). Chart colors still need wiring; that's a later task."
```

---

## Task 3: Add the pre-paint theme bootstrap script

Inline `<script>` in `<head>` that synchronously sets `data-theme` from localStorage *before* the stylesheet loads. Without this, a user who picked light theme would briefly see the dark default on every page load (FOUC).

**Files:**
- Modify: `docs/_layouts/default.html`

- [ ] **Step 1: Insert the bootstrap script**

In `docs/_layouts/default.html`, locate the `<head>` block. The current head ends with `<link rel="stylesheet" …>` at line 10. Insert the script *before* the `<link rel="stylesheet">` line. The head should look like:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ site.title }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
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
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
</head>
```

The script must come *before* the stylesheet link so the attribute is set before the browser applies the CSS.

- [ ] **Step 2: Manual verification**

Reload the dashboard. Open DevTools console and run:

```js
localStorage.setItem('theme', 'light')
```

Reload. The page should render light immediately — no flash of dark. Run:

```js
localStorage.setItem('theme', 'dark')
```

Reload. Dark. Now:

```js
localStorage.removeItem('theme')
```

Reload. Page follows OS preference (whatever DevTools "Emulate CSS prefers-color-scheme" is set to, or your actual OS preference).

- [ ] **Step 3: Commit**

```bash
git add docs/_layouts/default.html
git commit -m "feat(layout): add pre-paint theme bootstrap script

Inline script reads localStorage.theme and sets data-theme on <html>
synchronously, before the stylesheet loads, so explicit-mode users
don't see a flash of the default dark theme on reload."
```

---

## Task 4: Add the segmented toggle markup and CSS

Adds the three-button pill to the header (top-right) and styles it. The buttons are inert until Task 6 wires up the JS — but the control will be visible and the active-state CSS will be testable by manually adding the active class in DevTools.

**Files:**
- Modify: `docs/_layouts/default.html`
- Modify: `docs/assets/css/style.css`

- [ ] **Step 1: Add the toggle markup to the header**

In `docs/_layouts/default.html`, replace the `<header>` block (lines 13-16) with:

```html
<header class="header">
  <h1 class="header__title">Northwind</h1>
  <p class="header__subtitle">Employee Performance Dashboard (1997)</p>
  <div class="theme-toggle" role="radiogroup" aria-label="Theme">
    <button class="theme-toggle__btn" data-theme-choice="light"
            role="radio" aria-checked="false"
            aria-label="Light theme" title="Light">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
      </svg>
    </button>
    <button class="theme-toggle__btn" data-theme-choice="system"
            role="radio" aria-checked="false"
            aria-label="Follow system theme" title="System">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
        <path d="M8 21h8M12 17v4"></path>
      </svg>
    </button>
    <button class="theme-toggle__btn" data-theme-choice="dark"
            role="radio" aria-checked="false"
            aria-label="Dark theme" title="Dark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  </div>
</header>
```

- [ ] **Step 2: Add the toggle styles**

In `docs/assets/css/style.css`, find the `.header` rule (around lines 38-42):

```css
.header {
  text-align: center;
  padding: 2rem;
  border-bottom: 1px solid var(--accent);
}
```

Replace it with:

```css
.header {
  text-align: center;
  padding: 2rem;
  border-bottom: 1px solid var(--accent);
  position: relative;
}
```

Then append, immediately after the `.header__subtitle` rule (around line 55):

```css
/* Theme Toggle */
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

.theme-toggle__btn:hover {
  color: var(--text);
}

.theme-toggle__btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-toggle__btn--active {
  background: var(--accent);
  color: var(--bg);
}

.theme-toggle__btn svg {
  width: 1rem;
  height: 1rem;
  display: block;
}
```

- [ ] **Step 3: Add the mobile breakpoint rule**

In `docs/assets/css/style.css`, find the `@media (max-width: 768px)` block at the bottom (around lines 291-307). Add a new rule inside it, after the `.tabs` rule:

```css
  .theme-toggle {
    position: static;
    margin: 0.75rem auto 0;
  }
```

- [ ] **Step 4: Manual verification**

Reload the dashboard. The three-button pill should appear at top-right of the header on desktop. Hover each button — colour should brighten. Tab through the buttons with the keyboard — focus outline should be visible. In DevTools, manually add the class `theme-toggle__btn--active` to one of the buttons; that button should fill with the accent color. Resize the viewport below 768px — the pill should drop to a centered position below the subtitle.

- [ ] **Step 5: Commit**

```bash
git add docs/_layouts/default.html docs/assets/css/style.css
git commit -m "feat(ui): add segmented theme toggle in header

Three-button pill (sun/monitor/moon icons, inline SVGs) absolutely
positioned top-right of the header. Wraps below the title on mobile.
Buttons are inert until the JS wires them up in a later task."
```

---

## Task 5: Add `cssVar` helper and chart registry; route chart colors through CSS variables

Two changes to `dashboard.js`: introduce a `cssVar()` helper that reads computed values from `<html>`, and a `chartRegistry` array that Chart instances are pushed onto. Replace every hex literal in the chart configs with a `cssVar(...)` call. After this task, charts work the same as before in dark mode, and they'll automatically pick up the light palette when `data-theme="light"` is set — except they won't re-render on toggle yet (Task 6).

**Files:**
- Modify: `docs/assets/js/dashboard.js`

- [ ] **Step 1: Add helpers near the top of the file**

In `docs/assets/js/dashboard.js`, immediately *after* the closing `});` of the `DOMContentLoaded` handler (after line 33, before `formatMonoCells`), insert:

```js
const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const chartRegistry = [];
```

- [ ] **Step 2: Update `renderBarChart` to read CSS vars and register the chart**

In `docs/assets/js/dashboard.js`, replace the entire `renderBarChart` function (lines 61-109) with:

```js
function renderBarChart(canvasId, labels, values, { prefix = '', suffix = '', sortAsc = false } = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  let paired = labels.map((l, i) => ({ label: l, value: values[i] }));
  paired.sort((a, b) => sortAsc ? a.value - b.value : b.value - a.value);

  const sortedLabels = paired.map(p => p.label);
  const sortedValues = paired.map(p => p.value);
  const accent = cssVar('--accent');
  const positive = cssVar('--positive');
  const colors = sortedLabels.map(name =>
    name === 'Margaret Peacock' ? positive : accent
  );

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedLabels,
      datasets: [{
        data: sortedValues,
        backgroundColor: colors,
        borderRadius: 4,
        barThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => prefix + ctx.parsed.x.toLocaleString() + suffix
          }
        }
      },
      scales: {
        x: {
          grid: { color: cssVar('--chart-grid') },
          ticks: { color: cssVar('--muted'), font: { family: "'JetBrains Mono', monospace" } }
        },
        y: {
          grid: { display: false },
          ticks: { color: cssVar('--text'), font: { family: "'JetBrains Mono', monospace", size: 12 } }
        }
      }
    }
  });

  chartRegistry.push(chart);
}
```

- [ ] **Step 3: Update `initCorrelationChart` to read CSS vars and register the chart**

In `docs/assets/js/dashboard.js`, replace the entire `initCorrelationChart` function (lines 111-167) with:

```js
function initCorrelationChart() {
  const corrs = window.dashboardData?.correlations;
  if (!corrs) return;

  const sorted = [...corrs].sort((a, b) => b.r - a.r);
  const labels = sorted.map(c => c.metric);
  const values = sorted.map(c => c.r);
  const accent = cssVar('--accent');
  const warning = cssVar('--warning');
  const colors = values.map(v => v >= 0 ? accent : warning);

  const ctx = document.getElementById('chart-correlations');
  if (!ctx) return;

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        barThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const corr = sorted[ctx.dataIndex];
              return `r = ${corr.r > 0 ? '+' : ''}${corr.r} (${corr.strength})`;
            }
          }
        }
      },
      scales: {
        x: {
          min: -1,
          max: 1,
          grid: { color: cssVar('--chart-grid') },
          ticks: {
            color: cssVar('--muted'),
            font: { family: "'JetBrains Mono', monospace" },
            callback: (v) => (v > 0 ? '+' : '') + v.toFixed(1)
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: cssVar('--text'), font: { family: "'JetBrains Mono', monospace", size: 12 } }
        }
      }
    }
  });

  chartRegistry.push(chart);
}
```

- [ ] **Step 4: Manual verification**

Reload the dashboard in dark mode. All charts should look identical to before — same accent cyan, same Margaret-Peacock highlight green, same orange for negative correlation, same axis colors. In DevTools, set `<html data-theme="light">` and reload (a reload is needed because charts aren't re-rendered on attribute change yet). All charts should now use the light palette: blue accent (#0969da), darker green for Peacock, brownish-orange for negative r, dark text axis labels. Reload again with the attribute removed — back to dark.

- [ ] **Step 5: Commit**

```bash
git add docs/assets/js/dashboard.js
git commit -m "refactor(charts): read colors from CSS variables; register instances

Replace hex literals in Chart.js configs with cssVar() lookups so
charts pick up the active theme on next render. Track instances in
chartRegistry so a future theme-change handler can destroy and
re-create them."
```

---

## Task 6: Implement `initThemeToggle` and `rerenderCharts`; wire to DOMContentLoaded

The final wiring. Adds the click handler, the localStorage persistence, the active-state UI sync, the matchMedia listener for OS changes while in system mode, and the chart teardown/re-render on every theme change.

**Files:**
- Modify: `docs/assets/js/dashboard.js`

- [ ] **Step 1: Add `rerenderCharts` and `initThemeToggle`**

In `docs/assets/js/dashboard.js`, append these two functions at the bottom of the file:

```js
function rerenderCharts() {
  while (chartRegistry.length) {
    chartRegistry.pop().destroy();
  }
  initThroughputCharts();
  initInputCharts();
  initCorrelationChart();
}

function initThemeToggle() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('.theme-toggle__btn');
  if (buttons.length === 0) return;

  function readChoice() {
    try {
      const v = localStorage.getItem('theme');
      return (v === 'light' || v === 'dark') ? v : 'system';
    } catch (e) {
      return 'system';
    }
  }

  function apply(choice, { rerender = true } = {}) {
    try {
      if (choice === 'system') {
        root.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      } else {
        root.setAttribute('data-theme', choice);
        localStorage.setItem('theme', choice);
      }
    } catch (e) {
      if (choice === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', choice);
    }
    buttons.forEach(b => {
      const active = b.dataset.themeChoice === choice;
      b.classList.toggle('theme-toggle__btn--active', active);
      b.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    if (rerender) rerenderCharts();
  }

  buttons.forEach(b => {
    b.addEventListener('click', () => apply(b.dataset.themeChoice));
  });

  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (readChoice() === 'system') rerenderCharts();
  });

  // Sync button state on first load without tearing down charts that
  // haven't been created yet.
  apply(readChoice(), { rerender: false });
}
```

The `{ rerender: false }` option on the first `apply()` call matters because `initThemeToggle()` runs before the chart init calls — there's nothing to re-render yet, and we don't want to call the chart inits twice.

- [ ] **Step 2: Wire `initThemeToggle` into `DOMContentLoaded`**

In `docs/assets/js/dashboard.js`, find the `DOMContentLoaded` handler (lines 1-33). Locate the block where the chart inits are called:

```js
  initThroughputCharts();
  initInputCharts();
  initCorrelationChart();
  formatMonoCells();
```

Replace it with:

```js
  initThemeToggle();
  initThroughputCharts();
  initInputCharts();
  initCorrelationChart();
  formatMonoCells();
```

`initThemeToggle()` must run *before* the chart inits so its button-state sync runs without triggering a needless re-render, but the chart inits still happen unconditionally afterward.

- [ ] **Step 3: Manual verification**

Reload the dashboard. The "System" button should be highlighted (active state) since no preference is stored yet. Click **Light** — the page should recolor immediately, charts included. The Light button should now be the highlighted one. Reload — page comes back light, no flash. Click **Dark** — recolors. Reload — still dark, no flash. Click **System** — `data-theme` attribute is removed; page follows OS preference (use DevTools' Rendering panel to toggle `prefers-color-scheme` between light and dark and confirm charts re-render).

Open DevTools Console and check there are no errors. Tab through the three buttons with the keyboard, press Space — the activation should work via keyboard too. Verify ARIA: each button's `aria-checked` should be `"true"` only on the active button.

Disable localStorage (in DevTools → Application → Storage → set localStorage quota to 0, or test in a private window with storage blocked) and verify the toggle still works for the session — clicking buttons changes theme, but reload reverts.

- [ ] **Step 4: Commit**

```bash
git add docs/assets/js/dashboard.js
git commit -m "feat(theme): wire up toggle behavior and chart re-render

Click handlers persist the choice to localStorage and apply it to
<html>. System mode listens for OS prefers-color-scheme changes and
re-renders charts. Charts are destroyed and re-created on every
theme change so they pick up the new CSS-variable values."
```

---

## Task 7: End-to-end verification pass

A single manual run-through against the spec's test list to confirm the whole feature works.

**Files:** _(no changes; verification only)_

- [ ] **Step 1: Default-load verification**

Clear localStorage (`localStorage.removeItem('theme')`). Set DevTools "Emulate CSS prefers-color-scheme" to `dark`. Hard-reload. Page is dark, no flash. Set emulation to `light`. Hard-reload. Page is light, no flash. The active button in the toggle is **System** in both cases.

- [ ] **Step 2: Explicit-mode persistence**

Click **Light**, reload — page stays light, Light button active, no flash. Click **Dark**, reload — page stays dark, Dark button active, no flash. Click **System**, reload — page follows OS, System button active.

- [ ] **Step 3: System mode reacts to OS change**

With System selected, toggle the DevTools `prefers-color-scheme` emulation between light and dark. The page and the charts should recolor without a reload.

- [ ] **Step 4: Mobile layout**

Resize the viewport below 768px. The toggle should drop below the subtitle, centered. All three buttons should remain tappable. Charts re-render correctly when toggling at mobile size.

- [ ] **Step 5: Keyboard + ARIA**

Tab to the toggle. Visible focus outline on each button. Space / Enter activates. `aria-checked` is `"true"` only on the active button. The `role="radiogroup"` container is announced correctly by VoiceOver / NVDA (best-effort check — at minimum confirm no console errors and the DOM attributes are correct).

- [ ] **Step 6: localStorage failure path**

Open the site in a browser session where localStorage is blocked (private browsing with strict settings, or stub `localStorage.setItem` to throw via DevTools). Confirm that:

- Page loads without errors.
- Clicking toggle buttons still changes the theme for the session.
- Reloading reverts to default (since the choice didn't persist).

- [ ] **Step 7: No console errors**

In Chrome and Firefox, open DevTools console and exercise the full toggle in both desktop and mobile widths. There should be no warnings or errors related to the theme code.

- [ ] **Step 8: Final commit (if any tweaks needed)**

If steps 1-7 surfaced any issues, fix them and commit. Otherwise, no commit needed — the feature is complete.

```bash
# Only if fixes were needed:
git add <files>
git commit -m "fix(theme): <description of the fix>"
```

---

## Summary

- **Task 1** — refactor leaky CSS values into tokens (no behavior change)
- **Task 2** — add light palette + system-mode media query (light works via DevTools)
- **Task 3** — add pre-paint bootstrap (FOUC fixed)
- **Task 4** — add toggle markup + styling (control visible, inert)
- **Task 5** — route chart colors through CSS variables, register chart instances
- **Task 6** — wire up `initThemeToggle` + `rerenderCharts` (feature complete)
- **Task 7** — end-to-end verification pass
