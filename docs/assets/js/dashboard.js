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

  initThroughputCharts();
  initInputCharts();
  initCorrelationChart();
  formatMonoCells();
});

/* Format dollar amounts and bare numbers in .mono table cells */
function formatMonoCells() {
  document.querySelectorAll('.summary-table .mono').forEach(cell => {
    const text = cell.textContent.trim();
    const dollarMatch = text.match(/^\$(\d+)$/);
    if (dollarMatch) {
      cell.textContent = '$' + Number(dollarMatch[1]).toLocaleString();
      return;
    }
    const numberMatch = text.match(/^(\d+)$/);
    if (numberMatch) {
      cell.textContent = Number(numberMatch[1]).toLocaleString();
    }
  });

  /* Fix Employee-of-the-Year revenue (crude Liquid math can drop leading zeros) */
  document.querySelectorAll('.stat-box .stat-value, .stat-box .stat-box__value').forEach(el => {
    const text = el.textContent.trim();
    const m = text.match(/^\$(\d[\d,]*\d?)$/);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      el.textContent = '$' + Number(raw).toLocaleString();
    }
  });
}

function renderBarChart(canvasId, labels, values, { prefix = '', suffix = '', sortAsc = false } = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  let paired = labels.map((l, i) => ({ label: l, value: values[i] }));
  paired.sort((a, b) => sortAsc ? a.value - b.value : b.value - a.value);

  const sortedLabels = paired.map(p => p.label);
  const sortedValues = paired.map(p => p.value);
  const colors = sortedLabels.map(name =>
    name === 'Margaret Peacock' ? '#00ff88' : '#00d4ff'
  );

  new Chart(ctx, {
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
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#8b949e', font: { family: "'JetBrains Mono', monospace" } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e6edf3', font: { family: "'JetBrains Mono', monospace", size: 12 } }
        }
      }
    }
  });
}

function initCorrelationChart() {
  const corrs = window.dashboardData?.correlations;
  if (!corrs) return;

  const sorted = [...corrs].sort((a, b) => b.r - a.r);
  const labels = sorted.map(c => c.metric);
  const values = sorted.map(c => c.r);
  const colors = values.map(v => v >= 0 ? '#00d4ff' : '#f0883e');

  const ctx = document.getElementById('chart-correlations');
  if (!ctx) return;

  new Chart(ctx, {
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
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: {
            color: '#8b949e',
            font: { family: "'JetBrains Mono', monospace" },
            callback: (v) => (v > 0 ? '+' : '') + v.toFixed(1)
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e6edf3', font: { family: "'JetBrains Mono', monospace", size: 12 } }
        }
      }
    }
  });
}

function initInputCharts() {
  const emps = window.dashboardData?.employees;
  if (!emps) return;

  const names = emps.map(e => e.name);

  renderBarChart('chart-product-breadth', names, emps.map(e => e.product_breadth));
  renderBarChart('chart-retention', names, emps.map(e => e.retention_pct), { suffix: '%' });
  renderBarChart('chart-frequency', names, emps.map(e => e.order_frequency));
  renderBarChart('chart-territories', names, emps.map(e => e.territories));
}

function initThroughputCharts() {
  const emps = window.dashboardData?.employees;
  if (!emps) return;

  const names = emps.map(e => e.name);

  renderBarChart('chart-revenue', names, emps.map(e => e.revenue), { prefix: '$' });
  renderBarChart('chart-orders', names, emps.map(e => e.orders));
  renderBarChart('chart-avg-order', names, emps.map(e => e.avg_order), { prefix: '$' });
  renderBarChart('chart-customers', names, emps.map(e => e.customers));
  renderBarChart('chart-discount', names, emps.map(e => e.discount_pct), { suffix: '%', sortAsc: true });
}
