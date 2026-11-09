(function () {
  'use strict';
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { return {}; } }
  var context = read('sial-mobile-context');
  var workflow = read('sial-mobile-workflow');
  var farmName = context.name || workflow.farmName || 'Finca Santa Isabel';
  document.querySelectorAll('[data-farm-name]').forEach(function (node) { node.textContent = farmName; });

  var period = document.querySelector('[data-dispatch-period]');
  if (period) {
    function renderDispatches() {
      var count = 0;
      document.querySelectorAll('[data-dispatch-row]').forEach(function (row) {
        row.hidden = period.value !== 'all' && row.dataset.dispatchRow !== period.value;
        if (!row.hidden) count++;
      });
      document.querySelector('[data-dispatch-total]').textContent = count + (count === 1 ? ' despacho registrado' : ' despachos registrados');
      document.querySelector('[data-dispatch-empty]').hidden = count !== 0;
    }
    period.addEventListener('change', renderDispatches);
    renderDispatches();
  }

  var week = document.querySelector('[data-pickup-week]');
  if (week) {
    function renderPickups() {
      var showSample = week.value === 'sample';
      document.querySelector('[data-pickup-counts]').hidden = !showSample;
      document.querySelector('[data-pickup-empty]').hidden = showSample;
    }
    week.addEventListener('change', renderPickups);
    renderPickups();
  }
})();
