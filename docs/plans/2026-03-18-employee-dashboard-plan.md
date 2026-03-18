# Employee Performance Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dark analytics Jekyll dashboard from the Northwind employee performance data, served via GitHub Pages.

**Architecture:** Jekyll static site in `docs/` with structured YAML data files, Liquid templates for 4 tabbed views, Chart.js horizontal bar charts loaded via CDN, and vanilla JS tab switching with URL hash support.

**Tech Stack:** Jekyll (GitHub Pages native), Chart.js 4.x (CDN), vanilla JS, CSS custom properties

---

### Task 1: Jekyll Foundation

**Files:**
- Create: `docs/_config.yml`
- Create: `docs/index.html`
- Create: `docs/_layouts/default.html`

**Step 1: Create `docs/_config.yml`**

```yaml
title: "Northwind — Employee Performance Dashboard"
description: "1997 Employee Performance Analytics"
baseurl: "/daana-test"
url: "https://mattiasthalen.github.io"
markdown: kramdown
exclude:
  - plans/
  - mockups/
```

**Step 2: Create `docs/_layouts/default.html`**

Minimal dark shell with Chart.js CDN, JetBrains Mono font CDN, nav bar with 4 tab buttons, `{{ content }}` area, and `dashboard.js` script tag. No styling yet — just the HTML structure.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ site.title }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
</head>
<body>
  <header class="header">
    <h1 class="header__title">Northwind</h1>
    <p class="header__subtitle">Employee Performance Dashboard (1997)</p>
  </header>

  <nav class="tabs">
    <button class="tabs__btn tabs__btn--active" data-tab="overview">Overview</button>
    <button class="tabs__btn" data-tab="throughput">Throughput</button>
    <button class="tabs__btn" data-tab="input">Input</button>
    <button class="tabs__btn" data-tab="correlations">Correlations</button>
  </nav>

  <main class="content">
    {{ content }}
  </main>

  <footer class="footer">
    <p>Data source: Northwind Traders via Daana DW</p>
  </footer>

  <script src="{{ '/assets/js/dashboard.js' | relative_url }}"></script>
</body>
</html>
```

**Step 3: Create `docs/index.html`**

```html
---
layout: default
---
<section id="tab-overview" class="tab-panel tab-panel--active">
  <p>Overview content coming soon.</p>
</section>
<section id="tab-throughput" class="tab-panel">
  <p>Throughput content coming soon.</p>
</section>
<section id="tab-input" class="tab-panel">
  <p>Input content coming soon.</p>
</section>
<section id="tab-correlations" class="tab-panel">
  <p>Correlations content coming soon.</p>
</section>
```

**Step 4: Commit**

```bash
git add docs/_config.yml docs/_layouts/default.html docs/index.html
git commit -m "feat(dashboard): add Jekyll foundation with layout and config"
```

---

### Task 2: Data Layer

**Files:**
- Create: `docs/_data/employees.yml`
- Create: `docs/_data/correlations.yml`

**Step 1: Create `docs/_data/employees.yml`**

All 9 employees with every metric from the markdown report. Sorted by revenue descending.

```yaml
- name: Margaret Peacock
  revenue: 128810
  orders: 81
  avg_order: 1590
  customers: 57
  discount_pct: 6.7
  product_breadth: 67
  retention_pct: 31.6
  order_frequency: 1.4
  territories: 3
  employee_of_year: true

- name: Janet Leverling
  revenue: 108026
  orders: 71
  avg_order: 1522
  customers: 46
  discount_pct: 4.1
  product_breadth: 67
  retention_pct: 21.7
  order_frequency: 1.5
  territories: 4

- name: Nancy Davolio
  revenue: 93148
  orders: 55
  avg_order: 1694
  customers: 40
  discount_pct: 4.6
  product_breadth: 63
  retention_pct: 30.0
  order_frequency: 1.4
  territories: 2

- name: Andrew Fuller
  revenue: 70444
  orders: 41
  avg_order: 1718
  customers: 35
  discount_pct: 3.9
  product_breadth: 55
  retention_pct: 20.0
  order_frequency: 1.2
  territories: 7

- name: Robert King
  revenue: 60471
  orders: 36
  avg_order: 1680
  customers: 30
  discount_pct: 7.5
  product_breadth: 54
  retention_pct: 13.3
  order_frequency: 1.2
  territories: 10

- name: Laura Callahan
  revenue: 56033
  orders: 54
  avg_order: 1038
  customers: 36
  discount_pct: 7.5
  product_breadth: 57
  retention_pct: 22.2
  order_frequency: 1.5
  territories: 4

- name: Michael Suyama
  revenue: 43126
  orders: 33
  avg_order: 1307
  customers: 24
  discount_pct: 6.9
  product_breadth: 51
  retention_pct: 29.2
  order_frequency: 1.4
  territories: 5

- name: Steven Buchanan
  revenue: 30716
  orders: 18
  avg_order: 1706
  customers: 13
  discount_pct: 6.3
  product_breadth: 37
  retention_pct: 7.7
  order_frequency: 1.4
  territories: 7

- name: Anne Dodsworth
  revenue: 26310
  orders: 19
  avg_order: 1385
  customers: 16
  discount_pct: 9.0
  product_breadth: 30
  retention_pct: 6.3
  order_frequency: 1.2
  territories: 7
```

**Step 2: Create `docs/_data/correlations.yml`**

```yaml
- metric: Customers
  r: 0.97
  strength: very strong

- metric: Orders
  r: 0.95
  strength: very strong

- metric: Product Breadth
  r: 0.90
  strength: very strong

- metric: Customer Retention
  r: 0.70
  strength: strong

- metric: Order Frequency
  r: 0.36
  strength: weak

- metric: Avg Order Size
  r: 0.27
  strength: weak

- metric: Avg Discount
  r: -0.54
  strength: moderate (negative)

- metric: Territory Coverage
  r: -0.59
  strength: moderate (negative)
```

**Step 3: Commit**

```bash
git add docs/_data/employees.yml docs/_data/correlations.yml
git commit -m "feat(dashboard): add employee and correlation data files"
```

---

### Task 3: Dark Analytics CSS

**Files:**
- Create: `docs/assets/css/style.css`

**Step 1: Create the full stylesheet**

Must include:
- CSS custom properties for the color palette (`--bg: #0d1117`, `--card: #161b22`, `--border: #1e2937`, `--accent: #00d4ff`, `--positive: #00ff88`, `--warning: #f0883e`, `--text: #e6edf3`, `--muted: #8b949e`)
- Reset/base styles (box-sizing, body bg/color/font)
- `.header` — centered, padding, border-bottom with accent
- `.tabs` — flex row, centered, gap between pill buttons
- `.tabs__btn` — pill style, transparent bg, muted text; `--active` variant with cyan bg + dark text
- `.tab-panel` — hidden by default; `--active` shown
- `.card` — bg card color, border, border-radius 8px, padding, margin-bottom
- `.card--highlight` — green left border (employee of the year)
- `.stat-row` — flex row for stat boxes in the highlight card
- `.stat-box` — centered label + value
- `.summary-table` — full width, dark theme, monospace numbers, striped rows
- `.chart-card` — card containing a `<canvas>` with max-height
- `.insight-list` — styled list for key insights
- `.framework-table` — for the metrics framework
- `details` / `summary` — styled for dark theme, muted summary text, code block inside
- `.footer` — muted, centered, small
- Responsive: below 768px stack tabs vertically, single column, stat-row wraps
- Typography: system sans-serif body, JetBrains Mono for `.mono` class

**Step 2: Commit**

```bash
git add docs/assets/css/style.css
git commit -m "feat(dashboard): add dark analytics theme stylesheet"
```

---

### Task 4: Tab Switching JS

**Files:**
- Create: `docs/assets/js/dashboard.js`

**Step 1: Create `docs/assets/js/dashboard.js`**

Vanilla JS that:
1. On DOMContentLoaded, reads `location.hash` (e.g., `#throughput`) and activates that tab, defaulting to `overview`
2. Adds click listeners to all `.tabs__btn` elements
3. On click: hides all `.tab-panel`, removes `--active` from all buttons, shows target panel, adds `--active` to clicked button, updates `location.hash`
4. Listens for `hashchange` event to support back/forward navigation

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.tabs__btn');
  const panels = document.querySelectorAll('.tab-panel');

  function activate(tabId) {
    panels.forEach(p => p.classList.remove('tab-panel--active'));
    buttons.forEach(b => b.classList.remove('tabs__btn--active'));

    const panel = document.getElementById('tab-' + tabId);
    const button = document.querySelector(`[data-tab="${tabId}"]`);
    if (panel) panel.classList.add('tab-panel--active');
    if (button) button.classList.add('tabs__btn--active');
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      history.replaceState(null, '', '#' + tabId);
      activate(tabId);
    });
  });

  window.addEventListener('hashchange', () => {
    activate(location.hash.slice(1) || 'overview');
  });

  activate(location.hash.slice(1) || 'overview');
});
```

**Step 2: Commit**

```bash
git add docs/assets/js/dashboard.js
git commit -m "feat(dashboard): add tab switching with URL hash support"
```

---

### Task 5: Overview Tab

**Files:**
- Create: `docs/_includes/tab-overview.html`
- Modify: `docs/index.html` — replace placeholder overview section with include

**Step 1: Create `docs/_includes/tab-overview.html`**

Contains 4 sections using Liquid to loop over `site.data.employees`:

1. **Employee of the Year card** — find the employee where `employee_of_year` is true. Render a `.card.card--highlight` with name, then a `.stat-row` of 5 `.stat-box` elements (Revenue, Orders, Customers, Product Breadth, Retention). Below: the two-line description from the markdown.

2. **At a Glance summary table** — `.summary-table` with columns: Employee, Revenue, Orders, Avg Order, Customers, Disc%. Loop over all employees. Format revenue as `$XXX,XXX` using Liquid filters where possible (or leave as raw numbers for JS formatting). Use `.mono` class on number cells.

3. **Key Insights** — `.insight-list` with the 6 hardcoded bullet points (these are interpretive text, not data-driven, so hardcode them).

4. **Metrics Framework** — `.framework-table` with columns: Layer, Metric, Description. Hardcode the 8 rows from the markdown.

**Step 2: Update `docs/index.html`**

Replace the overview placeholder:

```html
---
layout: default
---
{% include tab-overview.html %}
<section id="tab-throughput" class="tab-panel">
  <p>Throughput content coming soon.</p>
</section>
<section id="tab-input" class="tab-panel">
  <p>Input content coming soon.</p>
</section>
<section id="tab-correlations" class="tab-panel">
  <p>Correlations content coming soon.</p>
</section>
```

**Step 3: Commit**

```bash
git add docs/_includes/tab-overview.html docs/index.html
git commit -m "feat(dashboard): add overview tab with highlights and summary table"
```

---

### Task 6: Throughput Tab — Charts

**Files:**
- Create: `docs/_includes/tab-throughput.html`
- Modify: `docs/assets/js/dashboard.js` — add chart initialization
- Modify: `docs/index.html` — replace throughput placeholder with include

**Step 1: Create `docs/_includes/tab-throughput.html`**

5 `.chart-card` sections, each containing:
- Card title (e.g., "Total Revenue")
- Subtitle where relevant (e.g., "Lower is better" for discount)
- A `<canvas>` element with a unique ID (e.g., `chart-revenue`, `chart-orders`, `chart-avg-order`, `chart-customers`, `chart-discount`)
- A `<details><summary>Show query</summary>` block with the SQL from the markdown in a `<pre><code>` block

Use Liquid to emit the employee data as a JSON array in a `<script>` tag that `dashboard.js` can consume:

```html
<script>
  window.dashboardData = window.dashboardData || {};
  window.dashboardData.employees = {{ site.data.employees | jsonify }};
</script>
```

**Step 2: Add chart rendering to `docs/assets/js/dashboard.js`**

Add a function `renderBarChart(canvasId, labels, data, options)` that creates a Chart.js horizontal bar chart with:
- Dark background (transparent canvas, dark gridlines)
- Cyan-to-green gradient bars (use Chart.js gradient plugin or per-bar colors)
- Employee of the Year bar highlighted in `#00ff88`
- Monospace tick font
- No legend (single dataset)
- Animation on tab switch (destroy and recreate when tab becomes visible, or use `chart.update()`)

Call `renderBarChart` for each of the 5 throughput charts using `window.dashboardData.employees`.

For discount chart, sort ascending (lowest first) and note in the axis label.

**Step 3: Update `docs/index.html`** — replace throughput placeholder with `{% include tab-throughput.html %}`

**Step 4: Commit**

```bash
git add docs/_includes/tab-throughput.html docs/assets/js/dashboard.js docs/index.html
git commit -m "feat(dashboard): add throughput tab with 5 Chart.js bar charts"
```

---

### Task 7: Input Tab — Charts

**Files:**
- Create: `docs/_includes/tab-input.html`
- Modify: `docs/assets/js/dashboard.js` — add 4 more chart renders
- Modify: `docs/index.html` — replace input placeholder with include

**Step 1: Create `docs/_includes/tab-input.html`**

Same pattern as throughput: 4 `.chart-card` sections with canvases:
- `chart-product-breadth` — "Product Breadth" (distinct products sold)
- `chart-retention` — "Customer Retention %" (% of customers also served prior year)
- `chart-frequency` — "Order Frequency" (orders per customer)
- `chart-territories` — "Territory Coverage" (territories assigned)

Each with subtitle description and collapsible SQL query from the markdown.

**Step 2: Add chart renders to `dashboard.js`**

Use the same `renderBarChart` function. For retention and frequency, sort by the relevant metric descending (different order than revenue). For territories, sort descending.

**Step 3: Update `docs/index.html`** — replace input placeholder with `{% include tab-input.html %}`

**Step 4: Commit**

```bash
git add docs/_includes/tab-input.html docs/assets/js/dashboard.js docs/index.html
git commit -m "feat(dashboard): add input tab with 4 Chart.js bar charts"
```

---

### Task 8: Correlations Tab

**Files:**
- Create: `docs/_includes/tab-correlations.html`
- Modify: `docs/assets/js/dashboard.js` — add correlation chart
- Modify: `docs/index.html` — replace correlations placeholder with include

**Step 1: Create `docs/_includes/tab-correlations.html`**

Contains:
1. A `.chart-card` with a `<canvas id="chart-correlations">` for the horizontal bar chart of Pearson r values
2. Emit correlation data via Liquid: `window.dashboardData.correlations = {{ site.data.correlations | jsonify }};`
3. Interpretation section below the chart:
   - "**What drives revenue:** selling many products to many customers, and keeping them coming back."
   - "**What doesn't help:** more territories (spread too thin) and higher discounts (erodes without adding volume)."
4. Collapsible SQL query (the large correlation query from the markdown)

**Step 2: Add correlation chart to `dashboard.js`**

Render a horizontal bar chart where:
- Labels = metric names
- Data = r values (can be negative)
- Bar color: cyan (`#00d4ff`) for positive, orange (`#f0883e`) for negative
- X-axis range: -1.0 to +1.0
- Show r value as data label on each bar

**Step 3: Update `docs/index.html`** — replace correlations placeholder with `{% include tab-correlations.html %}`

**Step 4: Commit**

```bash
git add docs/_includes/tab-correlations.html docs/assets/js/dashboard.js docs/index.html
git commit -m "feat(dashboard): add correlations tab with Pearson r chart"
```

---

### Task 9: Polish & Responsive

**Files:**
- Modify: `docs/assets/css/style.css` — responsive tweaks, details/summary styling
- Modify: `docs/assets/js/dashboard.js` — chart resize handling, number formatting

**Step 1: Add number formatting helper to `dashboard.js`**

Add a `formatCurrency(n)` function that returns `$XX,XXX` and use it in chart tooltips and the overview table. Add `formatPct(n)` for percentage values.

**Step 2: Add chart resize handling**

Charts should resize when the window resizes. Chart.js handles this if `responsive: true` and `maintainAspectRatio: false` are set. Verify these are set on all charts.

**Step 3: Style `details`/`summary` elements**

In `style.css`, add dark-themed styles for collapsible SQL queries:
- `summary` — muted text, cursor pointer, small font
- `details[open] summary` — accent colored
- `pre` inside details — dark code block with overflow-x scroll, monospace, slightly lighter bg than card

**Step 4: Test responsive layout**

Verify at 768px breakpoint: tabs stack, cards go full-width, stat-row wraps, charts are readable.

**Step 5: Commit**

```bash
git add docs/assets/css/style.css docs/assets/js/dashboard.js
git commit -m "feat(dashboard): polish responsive layout and number formatting"
```

---

### Task 10: GitHub Pages Setup & Cleanup

**Files:**
- Remove: `docs/mockups/` directory (brainstorming artifacts)
- Verify: `docs/_config.yml` baseurl matches repo name

**Step 1: Remove mockup files**

```bash
rm -rf docs/mockups/
```

**Step 2: Verify `_config.yml`**

Ensure `baseurl: "/daana-test"` is correct for `https://mattiasthalen.github.io/daana-test/`.

**Step 3: Commit**

```bash
git rm -r docs/mockups/
git add docs/
git commit -m "chore(dashboard): remove mockups and finalize for GitHub Pages"
```

**Step 4: Push and enable GitHub Pages**

```bash
git push
```

Then in GitHub repo Settings > Pages, set source to "Deploy from a branch", branch `feat/employee-dashboard`, folder `/docs`. Verify the site loads at `https://mattiasthalen.github.io/daana-test/`.

---
