(() => {
  "use strict";
  // Catálogo provisional derivado de FR-PTR-010 Rev. 1 (vehículos particulares).
  // La equivalencia por tipo, criticidad, evidencia y vigencia requieren validación funcional.
  const groups = [
    { name: "Documentos", icon: '<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 13h7M9 17h7"/>', items: ["Vencimiento SOAT", "Vencimiento revisión tecnicomecánica", "Tarjeta de propiedad", "Vencimiento licencia del conductor"] },
    { name: "Luces", icon: '<path d="M9 7h6l3 5-3 5H9l-3-5zM12 2v3M12 19v3M2 12h3M19 12h3"/>', items: ["Tablero interno", "Techo interno", "Luces de posición delanteras", "Luces delanteras", "Luces altas delanteras", "Exploradoras", "Luces traseras", "Luces de freno", "Luces de reversa"] },
    { name: "Habitáculo", icon: '<path d="M4 7h16v12H4zM4 12h16M9 7v12M15 7v12"/>', items: ["Vidrio panorámico", "Vidrios laterales", "Cinturones de seguridad", "Limpiaparabrisas", "Cierre de puertas", "Aire acondicionado", "Seguros", "Accesorios en general"] },
    { name: "Motor", icon: '<path d="M5 8h14v10H5zM8 8V5h8v3M2 11h3M19 11h3M9 13h6"/>', items: ["Líquido de frenos", "Líquido de parabrisas", "Líquido de dirección", "Refrigerante del motor", "Nivel de aceite", "Correas: tensión y desgaste", "Estado general del motor"] },
    { name: "Kit de carretera", icon: '<path d="M5 7h14v13H5zM9 7V4h6v3M12 10v7M9 13h6"/>', items: ["Extintor vigente", "Botiquín", "Gato", "Llanta de repuesto"] },
    { name: "Generales", icon: '<path d="M4 12h16M6 7h12M6 17h12M8 4v16M16 4v16"/>', items: ["Estado de llantas", "Estado de defensas o golpes", "Alineación y balanceo", "Amortiguadores", "Freno de mano", "Frenos", "Clutch o embrague", "Estado de dirección", "Encendido", "Fugas visibles"] }
  ];
  const vehicles = {
    "TRK-421": { type: "Tractomula", driver: "Carlos Méndez", program: "POM-2026-014" },
    "CAM-102": { type: "Camión rígido", driver: "Sin programación cargada", program: "Sin programación cargada" },
    "FLT-001": { type: "Camión", driver: "Sin programación cargada", program: "Sin programación cargada" }
  };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const answers = {};
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const storageKey = "sial-hu533-preop-draft-v1";
  let currentStep = 0;
  const escape = (value) => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const key = (group, index) => `${group}-${index}`;

  $("#preop-progress-bar").max = total;
  const container = $("#preop-sections");
  container.innerHTML = groups.map((group, gi) => `<section class="sial-card sial-card-pad preop-section" data-preop-step="${gi}" aria-labelledby="preop-group-${gi}" hidden><div class="sial-mobile-section-heading"><span class="sial-mobile-section-icon" aria-hidden="true"><svg class="sial-icon" viewBox="0 0 24 24">${group.icon}</svg></span><div><h2 class="sial-section-title" id="preop-group-${gi}" tabindex="-1">${escape(group.name)}</h2><p><span data-group-count="${gi}">0</span> de ${group.items.length} puntos revisados</p></div></div><div class="preop-checklist">${group.items.map((item, ii) => `<div class="preop-point" data-point="${key(gi, ii)}"><strong>${escape(item)}</strong><div class="preop-choice" role="group" aria-label="${escape(item)}"><button type="button" data-answer="clear" aria-pressed="false">Sin novedad</button><button type="button" data-answer="finding" aria-pressed="false">Con novedad</button></div><label class="sial-field preop-item-note" hidden><span class="sial-label">Describe la novedad</span><textarea class="sial-input-wrap sial-input" rows="2" data-item-note placeholder="Qué encontraste"></textarea></label></div>`).join("")}</div><div class="sial-field preop-group-note"><label class="sial-label" for="preop-note-${gi}">Observaciones de ${escape(group.name.toLowerCase())}</label><textarea class="sial-input-wrap sial-input" id="preop-note-${gi}" rows="2" placeholder="Opcional"></textarea></div><p class="preop-feedback preop-step-feedback" role="alert" hidden></p><div class="preop-actions">${gi ? '<button class="sial-btn sial-btn-secondary" type="button" data-step-back>Anterior</button>' : ''}<button class="sial-btn sial-btn-primary" type="button" data-step-next>${gi === groups.length - 1 ? 'Ir a revisión final' : 'Siguiente'}</button></div><button class="preop-save-link" type="button" data-preop-save>Guardar borrador</button></section>`).join("");

  function renderStep(index, moveFocus = true) {
    currentStep = Math.max(0, Math.min(groups.length, index));
    $$('[data-preop-step]').forEach((section, sectionIndex) => { section.hidden = sectionIndex !== currentStep; });
    $('#preop-close').hidden = currentStep !== groups.length;
    $('#preop-progress-step').textContent = currentStep === groups.length
      ? `Paso ${groups.length + 1} de ${groups.length + 1} · Revisión final`
      : `Paso ${currentStep + 1} de ${groups.length + 1} · ${groups[currentStep].name}`;
    if (moveFocus) {
      const heading = currentStep === groups.length ? $('#preop-close-title') : $(`#preop-group-${currentStep}`);
      heading.focus({ preventScroll: true });
      $('#preop-progress').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function validateStep(index) {
    const section = $(`[data-preop-step="${index}"]`);
    const missing = $$('[data-point]', section).find(point => !answers[point.dataset.point]);
    const undescribed = $$('[data-point]', section).find(point => answers[point.dataset.point] === 'finding' && !$('[data-item-note]', point).value.trim());
    const feedback = $('.preop-step-feedback', section);
    feedback.hidden = !(missing || undescribed);
    if (!missing && !undescribed) return true;
    feedback.textContent = missing ? 'Revisa todos los puntos de esta sección para continuar.' : 'Describe cada novedad de esta sección para continuar.';
    const target = missing ? $('[data-answer]', missing) : $('[data-item-note]', undescribed);
    target.focus({ preventScroll: true });
    (missing || undescribed).scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  function update() {
    const reviewed = Object.values(answers).filter(Boolean).length;
    const findings = Object.values(answers).filter(value => value === "finding").length;
    $("#preop-progress-count").textContent = `${reviewed} de ${total} puntos`;
    $("#preop-progress-findings").textContent = findings ? `${findings} ${findings === 1 ? "novedad" : "novedades"}` : "Sin novedades registradas";
    $("#preop-progress-bar").value = reviewed;
    groups.forEach((group, gi) => {
      const count = group.items.filter((_, ii) => answers[key(gi, ii)]).length;
      $(`[data-group-count="${gi}"]`).textContent = count;
    });
  }
  function choose(point, value) {
    answers[point.dataset.point] = value;
    $$("[data-answer]", point).forEach(button => button.setAttribute("aria-pressed", String(button.dataset.answer === value)));
    $(".preop-item-note", point).hidden = value !== "finding";
    update();
    persistDraft(true);
  }
  container.addEventListener("click", event => {
    const button = event.target.closest("[data-answer]");
    if (button) choose(button.closest("[data-point]"), button.dataset.answer);
    if (event.target.closest('[data-preop-save]')) persistDraft(false);
    if (event.target.closest('[data-step-back]')) { renderStep(currentStep - 1); persistDraft(true); }
    if (event.target.closest('[data-step-next]') && validateStep(currentStep)) { renderStep(currentStep + 1); persistDraft(true); }
  });
  container.addEventListener('input', () => persistDraft(true));
  $("#preop-vehicle").addEventListener("change", event => {
    const vehicle = vehicles[event.target.value];
    $("#preop-context-facts").hidden = !vehicle;
    $("#preop-progress").hidden = !vehicle;
    $("#preop-form").hidden = !vehicle;
    $("#preop-review").hidden = true;
    if (vehicle) {
      $("#preop-type").textContent = vehicle.type;
      $("#preop-driver").textContent = vehicle.driver;
      $("#preop-program").textContent = vehicle.program;
      renderStep(0, false);
    }
  });
  function snapshot() {
    return { version: "FR-PTR-010-R1-provisional", vehicle: $("#preop-vehicle").value, step: currentStep, answers: { ...answers }, notes: Object.fromEntries($$("[data-point]").map(point => [point.dataset.point, $("[data-item-note]", point).value])), groupNotes: groups.map((_, index) => $(`#preop-note-${index}`).value), generalNote: $("#preop-general-note").value, savedAt: new Date().toISOString() };
  }
  function persistDraft(silent = false) {
    if (!$('#preop-vehicle').value) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot()));
      if (!silent) $("#preop-local-state").textContent = "Borrador guardado en este navegador. Pendiente de sincronización; no modifica la disponibilidad del vehículo.";
    } catch {
      $("#preop-local-state").textContent = "No fue posible guardar el borrador en este navegador.";
      silent = false;
    }
    if (!silent) $("#preop-local-state").hidden = false;
  }
  $("#preop-save").addEventListener("click", () => persistDraft(false));
  $('#preop-close-back').addEventListener('click', () => { renderStep(groups.length - 1); persistDraft(true); });
  $('#preop-general-note').addEventListener('input', () => persistDraft(true));
  $("#preop-form").addEventListener("submit", event => {
    event.preventDefault();
    for (let index = 0; index < groups.length; index++) {
      renderStep(index, false);
      if (!validateStep(index)) return;
    }
    renderStep(groups.length, false);
    const findingRows = $$("[data-point]").filter(point => answers[point.dataset.point] === "finding");
    $("#preop-review-content").innerHTML = `<dl class="preop-review-facts"><div><dt>Vehículo</dt><dd>${escape($("#preop-vehicle").value)}</dd></div><div><dt>Puntos revisados</dt><dd>${total}</dd></div><div><dt>Novedades</dt><dd>${findingRows.length}</dd></div></dl>${findingRows.length ? `<h3>Novedades registradas</h3><ul>${findingRows.map(point => `<li><strong>${escape($("strong", point).textContent)}</strong><span>${escape($("[data-item-note]", point).value)}</span></li>`).join("")}</ul>` : "<p>No se registraron novedades en los puntos revisados.</p>"}<p class="preop-review-warning">El resultado operativo y la criticidad requieren reglas aprobadas; este borrador no habilita el vehículo.</p>`;
    $("#preop-form").hidden = true;
    $("#preop-review").hidden = false;
    $("#preop-review").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#preop-edit").addEventListener("click", () => { $("#preop-review").hidden = true; $("#preop-form").hidden = false; renderStep(groups.length); });
  $("#preop-finish").addEventListener("click", () => persistDraft(false));
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (draft && vehicles[draft.vehicle]) {
      $("#preop-vehicle").value = draft.vehicle;
      $("#preop-vehicle").dispatchEvent(new Event("change"));
      $$("[data-point]").forEach(point => {
        const value = draft.answers?.[point.dataset.point];
        if (value === "clear" || value === "finding") choose(point, value);
        $("[data-item-note]", point).value = draft.notes?.[point.dataset.point] || "";
      });
      groups.forEach((_, index) => { $(`#preop-note-${index}`).value = draft.groupNotes?.[index] || ""; });
      $("#preop-general-note").value = draft.generalNote || "";
      renderStep(Number.isInteger(draft.step) ? draft.step : 0, false);
      $("#preop-local-state").textContent = "Borrador local recuperado. Aún no está sincronizado.";
      $("#preop-local-state").hidden = false;
    }
  } catch { /* Un borrador ilegible no bloquea el formulario. */ }
  update();
})();
