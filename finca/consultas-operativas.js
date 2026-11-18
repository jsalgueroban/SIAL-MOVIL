(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  function stored(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  const context = stored('sial-mobile-context');
  const company = stored('sial-mobile-company');
  // Fincas y operaciones ficticias del perfil de demostración.
  const farms = new Map([
    ['finca-santa-isabel', 'Finca Santa Isabel'],
    ['finca-la-esperanza', 'Finca La Esperanza']
  ]);
  // El enlace de muestra abre los datos ficticios sin cambiar la sesión del prototipo.
  const preview = new URLSearchParams(location.search).get('demo') === 'santa-isabel';
  const farmId = preview ? 'finca-santa-isabel' : context?.id;
  const allowed = preview || context?.companyId === 'agrofrut' && company?.id === 'agrofrut' && farms.has(farmId);
  document.querySelector('[data-farm-name]').textContent = allowed ? farms.get(farmId) : 'Sin finca autorizada';
  if (!allowed) return;
  byId('blocked').hidden = true;
  document.querySelectorAll('[data-authorized]').forEach(section => { section.hidden = false; });

  const today = new Date();
  function dateAt(offset) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return [day.getFullYear(), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-');
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function emptyMessage(message) {
    byId('empty').textContent = message;
    byId('empty').hidden = !message;
  }
  const sampleFarm = farmId === 'finca-santa-isabel';
  function filterValue(id) {
    return byId(id).querySelector('[aria-pressed="true"]').dataset.value;
  }
  window.SialMobileUI.mountSegmentedControls(document);
  if (byId('period')) {
    const departures = sampleFarm ? [
      { id: 1042, age: 0, time: '08:40', pallets: 18, status: 'Registrado' },
      { id: 1038, age: 2, time: '15:15', pallets: 12, status: 'Con novedad', reason: 'Dos pallets quedaron pendientes de cargue.', incident: 'En revisión',
        support: 'Acta de salida 1038 · Se despacharon 12 pallets. Dos pallets quedaron en finca para revisión.' },
      { id: 1011, age: 14, time: '11:20', pallets: 16, status: 'Registrado' }
    ] : [];
    function render() {
      const days = filterValue('period');
      const rows = departures.filter(row => (days === 'all' || row.age < Number(days)) && (filterValue('status') === 'all' || row.status === filterValue('status')));
      byId('count').textContent = rows.length === 1 ? '1 despacho registrado' : rows.length + ' despachos registrados';
      const list = byId('dispatches');
      list.replaceChildren();
      for (const row of rows) {
        const card = element('article', '', 'farm-consult-dispatch');
        const heading = element('span', '', 'farm-row-heading');
        heading.append(element('strong', 'Salida hacia ZE'), element('span', row.status, 'sial-pill' + (row.reason ? '' : ' success')));
        card.append(heading, element('p', new Date(dateAt(-row.age) + 'T12:00:00').toLocaleDateString('es-CO', {day:'numeric', month:'short', year:'numeric'}) + ' · ' + row.time + ' · ' + row.pallets + ' pallets'));
        const footer = element('div', '', 'farm-consult-row-footer');
        const detail = element('button', 'Ver detalle', 'farm-consult-detail-button');
        detail.type = 'button';
        detail.setAttribute('aria-label', 'Ver detalle de la operación ' + row.id);
        detail.setAttribute('aria-haspopup', 'dialog');
        footer.append(element('small', 'Operación ' + row.id), detail);
        card.append(footer);
        detail.addEventListener('click', () => {
          const content = element('div', '', 'farm-detail');
          content.append(element('p', 'Salida hacia ZE · ' + row.pallets + ' pallets'), element('p', row.status));
          if (row.reason) content.append(element('h3', 'Novedad · ' + row.incident), element('p', row.reason));
          if (row.support) {
            content.append(element('h3', 'Acta de salida'), element('p', row.support));
          }
          window.SialMobileUI.openDialog({ id: 'farm-consult-detail', title: 'Operación ' + row.id, variant: 'sheet', content, returnFocus: detail, actions: [{ label: 'Cerrar', variant: 'primary' }] });
        });
        list.append(card);
      }
      emptyMessage(rows.length ? '' : 'No hay despachos para los filtros seleccionados.');
    }
    byId('period').addEventListener('sial:segmentchange', render);
    byId('status').addEventListener('sial:segmentchange', render);
    render();
  } else {
    const date = byId('pickup-date');
    let applied = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const format = (day, options) => day.toLocaleDateString('es-CO', options);
    const longDate = day => format(day, { day:'numeric', month:'long', year:'numeric' });
    function showDate() {
      date.value = [applied.getFullYear(), String(applied.getMonth()+1).padStart(2,'0'), String(applied.getDate()).padStart(2,'0')].join('-');
      byId('pickup-value').textContent = longDate(applied);
    }
    showDate();
    date.addEventListener('click', () => {
      let draft = applied;
      let month = new Date(draft.getFullYear(), draft.getMonth(), 1);
      const calendar = element('div', '', 'farm-calendar');
      function draw() {
        const header = element('div', '', 'farm-month');
        function navigate(delta, label) {
          const button = element('button', delta < 0 ? '‹' : '›', 'sial-btn sial-btn-icon');
          button.setAttribute('aria-label', label);
          button.onclick = () => {
            month = new Date(month.getFullYear(), month.getMonth()+delta, 1);
            draw();
            calendar.querySelector('[aria-label="' + label + '"]').focus();
          };
          return button;
        }
        header.append(navigate(-1,'Mes anterior'), element('strong', format(month,{month:'long', year:'numeric'})), navigate(1,'Mes siguiente'));
        const grid = element('div', '', 'farm-days');
        for (const label of ['L','M','M','J','V','S','D']) grid.append(element('span', label));
        for (let i=0; i<(month.getDay()+6)%7; i++) grid.append(element('span',''));
        const length = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
        for (let n=1; n<=length; n++) {
          const day = new Date(month.getFullYear(), month.getMonth(), n);
          const button = element('button', n, 'sial-segment-option');
          button.setAttribute('aria-label', longDate(day));
          button.setAttribute('aria-pressed', String(day.getTime() === draft.getTime()));
          if (day.toDateString() === today.toDateString()) button.setAttribute('aria-current','date');
          button.onclick = () => {
            draft = day;
            grid.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          };
          grid.append(button);
        }
        calendar.replaceChildren(header, grid);
      }
      draw();
      window.SialMobileUI.openDialog({ id:'pickup-calendar', title:'Fecha de recogida', variant:'sheet', content:calendar, returnFocus:date,
        actions:[{label:'Aplicar', onClick() { applied = draft; showDate(); render(); }}] });
    });
    const schedule = sampleFarm ? [
      { date: dateAt(0), status: 'Pendiente de cargue', vehicles: 3, containers: 2 },
      { date: dateAt(0), status: 'Con cargue registrado', vehicles: 1, containers: 0 },
      { date: dateAt(1), status: 'Pendiente de cargue', vehicles: 2, containers: 1 }
    ] : [];
    function render() {
      const rows = schedule.filter(row => row.date === date.value && (filterValue('status') === 'all' || filterValue('status') === row.status));
      for (const key of ['vehicles', 'containers']) {
        byId(key).textContent = rows.reduce((total, row) => total + row[key], 0);
      }
      emptyMessage(!date.value ? 'Selecciona una fecha de recogida.' : rows.length ? '' : 'No hay recogidas para la fecha y el estado seleccionados.');
    }
    byId('status').addEventListener('sial:segmentchange', render);
    render();
  }
})();
