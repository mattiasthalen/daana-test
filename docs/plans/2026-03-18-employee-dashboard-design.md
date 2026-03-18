# Employee Performance Dashboard — Design

## Summary

Turn the Northwind employee performance markdown report into a stylish interactive dashboard served via GitHub Pages using Jekyll + Chart.js.

## Decisions

- **Style:** Dark analytics theme (Grafana-inspired)
- **Data:** Static — baked into `_data/` YAML files at build time
- **Framework:** Jekyll (GitHub Pages native) + Chart.js (CDN)
- **SQL queries:** Included in collapsible `<details>` blocks per section
- **Navigation:** Tabbed — Overview, Throughput, Input, Correlations
- **Charting:** Chart.js horizontal bar charts, animated

## Site Structure

```
docs/
├── _config.yml
├── _data/
│   ├── employees.yml
│   └── correlations.yml
├── _includes/
│   ├── tab-overview.html
│   ├── tab-throughput.html
│   ├── tab-input.html
│   └── tab-correlations.html
├── _layouts/
│   └── default.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── dashboard.js
└── index.html
```

GitHub Pages serves from `docs/` on main branch.

## Data Layer

### `_data/employees.yml`

One entry per employee with all metrics:

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
```

### `_data/correlations.yml`

```yaml
- metric: Customers
  r: 0.97
  strength: very strong
```

SQL queries live inline in the includes (inside `<details>` blocks), since they're tied to their sections.

## Layout & Tabs

### `_layouts/default.html`

- `<head>`: Chart.js CDN, `style.css`
- Header bar: "Northwind — Employee Performance Dashboard (1997)"
- Tab nav: 4 pill-style buttons — Overview, Throughput, Input, Correlations
- `{{ content }}` renders all tab sections
- `dashboard.js` at bottom

### Tab switching (vanilla JS)

- All 4 includes render into hidden `<section>` divs
- Click toggles `display`, updates active tab style
- URL hash support (`#throughput`) for direct linking
- Default: Overview

### `index.html`

```liquid
---
layout: default
---
{% include tab-overview.html %}
{% include tab-throughput.html %}
{% include tab-input.html %}
{% include tab-correlations.html %}
```

## Visual Design

### Colors

| Token     | Value     | Usage                    |
|-----------|-----------|--------------------------|
| bg        | `#0d1117` | Page background          |
| card      | `#161b22` | Card backgrounds         |
| border    | `#1e2937` | Card/section borders     |
| accent    | `#00d4ff` | Primary accent (cyan)    |
| positive  | `#00ff88` | Highlights, top performer|
| warning   | `#f0883e` | Warnings, negative corr. |
| text      | `#e6edf3` | Primary text             |
| muted     | `#8b949e` | Secondary text           |

### Typography

- Headings: system sans-serif, bold
- Numbers: monospace (JetBrains Mono CDN, Consolas fallback)
- Body: system sans-serif

### Charts

- Horizontal bar charts for all per-employee metrics
- Cyan-to-green gradient bars
- Employee of the Year highlighted in `#00ff88`
- Correlation chart: positive = cyan, negative = orange
- Dark backgrounds, light gridlines at low opacity

### Cards

- Employee of the Year: green left border, key stats in a row
- Metric sections: card per chart + collapsible SQL
- `border-radius: 8px`, subtle shadow

### Tabs

- Pill buttons in nav bar
- Active: cyan bg, dark text
- Inactive: transparent, muted text, hover brightens

### Responsive

- Single column below 768px
- Charts stack vertically

## Tab Content

### Overview

- Employee of the Year highlight card (Margaret Peacock, 5 key stats)
- At a Glance summary table (9 employees: Revenue, Orders, Avg Order, Customers, Discount%)
- Key Insights (6 bullet points)
- Metrics Framework table (Output/Throughput/Input definitions)

### Throughput

5 horizontal bar charts in cards:
- Total Revenue
- Orders Handled
- Avg Order Size
- Customers Served
- Avg Discount % (lower is better, noted)

Each with collapsible SQL query.

### Input

4 horizontal bar charts in cards:
- Product Breadth
- Customer Retention %
- Order Frequency
- Territory Coverage

Each with collapsible SQL query.

### Correlations

- Horizontal bar chart of 8 Pearson r values (positive = cyan, negative = orange)
- Interpretation: "What drives revenue" / "What doesn't help"
- Collapsible SQL query
