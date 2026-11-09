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

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-detail-title]');
    if (!trigger || !window.SialMobileUI) return;
    var details = document.createElement('dl');
    details.className = 'farm-consult-definition-list';
    [['Tipo', 'detailKind'], ['Fecha o período', 'detailDate'], ['Destino', 'detailDestination'], ['Estado', 'detailStatus']].forEach(function (field) {
      if (!trigger.dataset[field[1]]) return;
      var row = document.createElement('div');
      var label = document.createElement('dt');
      var value = document.createElement('dd');
      label.textContent = field[0];
      value.textContent = trigger.dataset[field[1]];
      row.append(label, value);
      details.append(row);
    });
    window.SialMobileUI.openDialog({
      id: 'farm-consult-detail',
      title: trigger.dataset.detailTitle,
      variant: 'sheet',
      content: details,
      returnFocus: trigger,
      actions: [{ label: 'Cerrar', variant: 'primary' }]
    });
  });

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
