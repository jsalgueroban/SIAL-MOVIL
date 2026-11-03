(() => {
  'use strict';
  const ui = window.SialMobileUI;
  const $ = (id) => document.getElementById(id);
  const containers = [
    ['MSCU1234567', 'Refrigerado · 40 pies'], ['MSKU7654321', 'Refrigerado · 40 pies'],
    ['TCLU2345678', 'Refrigerado · 40 pies'], ['CMAU3456789', 'Seco · 40 pies'],
    ['HLBU4567890', 'Refrigerado · 40 pies'], ['OOLU5678901', 'Seco · 20 pies'],
    ['SEGU6789012', 'Refrigerado · 40 pies'], ['TRHU7890123', 'Refrigerado · 40 pies']
  ].map(([code, type]) => ({ code, type }));
  // Catálogo fijo de demostración. En producto las semanas proceden del servicio.
  const weeks = [
    { value: '2026-45', label: 'Semana 45 · 2026', helper: '2 – 8 nov · Vigente' },
    { value: '2026-46', label: 'Semana 46 · 2026', helper: '9 – 15 nov · Futura' },
    { value: '2026-47', label: 'Semana 47 · 2026', helper: '16 – 22 nov · Futura' }
  ];
  let week = weeks[0];
  let selected = new Set();
  const schedules = [{ code: 'MSCU1234567', week: weeks[0].value, note: '', id: 'PC-001' }];
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const booked = (code) => schedules.some((row) => row.week === week.value && row.code === code);
  function mode(isList) {
    $('create-panel').hidden = isList;
    $('list-panel').hidden = !isList;
    $('create-mode').setAttribute('aria-pressed', String(!isList));
    $('list-mode').setAttribute('aria-pressed', String(isList));
    if (isList) renderResults();
  }
  function renderSelection() {
    $('selected-containers').replaceChildren();
    selected.forEach((code) => {
      const item = containers.find((container) => container.code === code);
      const row = el('div', 'schedule-selection-row');
      const copy = el('div');
      copy.append(el('strong', '', code), el('small', '', item.type));
      const remove = el('button', 'sial-btn sial-btn-ghost', 'Quitar');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Quitar ${code}`);
      remove.addEventListener('click', () => { selected.delete(code); renderSelection(); $('choose-containers').focus(); });
      row.append(copy, remove);
      $('selected-containers').append(row);
    });
    $('confirmation-copy').textContent = selected.size
      ? `Revisa ${selected.size} contenedor${selected.size === 1 ? '' : 'es'} para la ${week.label.toLowerCase()} antes de programar.`
      : 'Revisa la semana y los contenedores antes de programar.';
    if (selected.size) {
      $('selection-error').hidden = true;
      $('choose-containers').removeAttribute('aria-invalid');
    }
  }
  function setWeek(next) {
    week = next;
    selected.clear();
    $('week-value').textContent = week.label;
    $('week-help').textContent = week.helper;
    $('selection-error').hidden = true;
    $('choose-containers').removeAttribute('aria-invalid');
    renderSelection();
  }
  $('week-trigger').addEventListener('click', () => ui.openMobilePicker({
    title: 'Semana operativa', message: 'Elige la semana para consultar disponibilidad.',
    selectedValue: week.value, items: weeks, search: false,
    onSelect: (item) => {
      if (item.value === week.value) return;
      setWeek(weeks.find((entry) => entry.value === item.value));
      ui.showToast({ type: 'info', title: 'Semana actualizada', message: 'Selecciona los contenedores para esta semana.' });
    }
  }));
  $('choose-containers').addEventListener('click', () => {
    const draft = new Set(selected);
    const body = el('div');
    const label = el('label', 'sial-field');
    const search = el('input', 'sial-input-wrap sial-input');
    search.type = 'search'; search.placeholder = 'Número o tipo de contenedor';
    label.append(el('span', 'sial-label', 'Buscar contenedores'), search);
    const count = el('p', 'schedule-help');
    count.setAttribute('aria-live', 'polite');
    const list = el('div', 'schedule-picker-list');
    body.append(label, count, list);
    const render = () => {
      list.replaceChildren();
      const term = search.value.trim().toLocaleLowerCase('es');
      const available = containers.filter((item) => !booked(item.code) && `${item.code} ${item.type}`.toLocaleLowerCase('es').includes(term));
      count.textContent = `${draft.size} seleccionados · ${available.length} disponibles`;
      if (!available.length) list.append(el('p', 'sial-empty-state', 'No hay contenedores disponibles con esta búsqueda.'));
      available.forEach((item) => {
        const button = el('button', 'sial-selectable-row');
        button.type = 'button'; button.setAttribute('aria-pressed', String(draft.has(item.code)));
        const copy = el('span'); copy.append(el('strong', '', item.code), el('small', '', item.type));
        const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        check.setAttribute('class', 'sial-icon'); check.setAttribute('viewBox', '0 0 24 24'); check.setAttribute('aria-hidden', 'true');
        check.innerHTML = '<path d="m5 12 4 4L19 6"/>';
        button.append(copy, check);
        button.addEventListener('click', () => {
          if (draft.has(item.code)) draft.delete(item.code); else draft.add(item.code);
          button.setAttribute('aria-pressed', String(draft.has(item.code)));
          count.textContent = `${draft.size} seleccionados · ${available.length} disponibles`;
        });
        list.append(button);
      });
    };
    search.addEventListener('input', render); render();
    ui.openDialog({ id: 'schedule-container-picker', variant: 'sheet', title: 'Seleccionar contenedores', message: `${week.label} · ${week.helper}`, content: body,
      actions: [{ label: 'Cancelar', variant: 'secondary' }, { label: 'Aplicar selección', onClick: () => { selected = draft; renderSelection(); } }]
    });
  });
  function renderResults() {
    const query = $('schedule-search').value.trim().toUpperCase();
    const filter = $('filter-week').value;
    const rows = schedules.filter((row) => row.code.includes(query) && (filter === 'all' || row.week === filter));
    $('results-count').textContent = `${rows.length} ${rows.length === 1 ? 'programación' : 'programaciones'}`;
    $('schedule-results').replaceChildren();
    if (!rows.length) $('schedule-results').append(el('div', 'sial-empty-state', 'No hay programaciones con estos filtros.'));
    rows.forEach((row) => {
      const item = containers.find((entry) => entry.code === row.code);
      const entryWeek = weeks.find((entry) => entry.value === row.week);
      const card = el('article', 'sial-card sial-card-pad schedule-record');
      const heading = el('div', 'schedule-record-head');
      const copy = el('div'); copy.append(el('strong', '', row.code), el('small', '', item.type));
      heading.append(copy, el('span', 'sial-pill info', 'Disponible'));
      card.append(heading, el('p', '', `${entryWeek.label} · ${entryWeek.helper}`));
      const detail = el('button', 'sial-btn sial-btn-secondary sial-btn-full', 'Ver detalle');
      detail.type = 'button'; detail.setAttribute('aria-label', `Ver detalle de ${row.code}`);
      detail.addEventListener('click', () => {
        const content = el('div', 'schedule-record');
        [['Programación', row.id], ['Contenedor', row.code], ['Tipo', item.type], ['Semana', entryWeek.label], ['Etapa', 'Disponible']].forEach(([key, value]) => {
          const line = el('div', 'sial-list-row'); line.append(el('span', '', key), el('strong', '', value)); content.append(line);
        });
        content.append(el('strong', '', 'Observación'), el('p', '', row.note || 'Sin observación'));
        ui.openDialog({ id: 'schedule-detail', variant: 'sheet', title: 'Detalle de programación', message: entryWeek.helper, content, actions: [{ label: 'Cerrar', variant: 'secondary' }] });
      });
      card.append(detail); $('schedule-results').append(card);
    });
  }
  $('schedule-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selected.size || [...selected].some(booked)) {
      $('selection-error').textContent = 'Selecciona al menos un contenedor disponible para esta semana.';
      $('selection-error').hidden = false; $('choose-containers').setAttribute('aria-invalid', 'true'); $('choose-containers').focus();
      return;
    }
    const count = selected.size;
    selected.forEach((code) => schedules.unshift({ code, week: week.value, note: $('schedule-notes').value.trim(), id: `PC-${String(schedules.length + 1).padStart(3, '0')}` }));
    selected.clear(); $('schedule-notes').value = ''; renderSelection();
    $('schedule-search').value = ''; $('filter-week').value = week.value;
    mode(true); $('list-mode').focus();
    ui.showToast({ type: 'success', title: 'Programación de ejemplo creada', message: `${count} contenedor${count === 1 ? '' : 'es'} en ${week.label.toLowerCase()}.` });
  });
  weeks.forEach((entry) => { const option = el('option', '', entry.label); option.value = entry.value; $('filter-week').append(option); });
  $('create-mode').addEventListener('click', () => mode(false));
  $('list-mode').addEventListener('click', () => mode(true));
  $('schedule-search').addEventListener('input', renderResults);
  $('filter-week').addEventListener('change', renderResults);
  setWeek(week);
})();
