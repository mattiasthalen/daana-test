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
});

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
