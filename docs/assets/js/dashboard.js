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
