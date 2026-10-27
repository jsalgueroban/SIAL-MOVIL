import { controlCases, stages, caseReading, caseIssues, materialKey, totalsFor } from "./hu1920-control-data.js?v=34";

const root = document.querySelector("#hu1920-root");
const fmt = new Intl.NumberFormat("es-CO");
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const amount = (value) => value === null || value === undefined ? "Sin dato" : fmt.format(value);
const svg = (paths) => `<svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const icons = {
  back: svg('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>'),
  next: svg('<path d="m9 18 6-6-6-6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  chart: svg('<path d="M4 19h16M6 15v-4m6 4V5m6 10V8"/>'),
  truck: svg('<path d="M3 7h11v10H3z"/><path d="M14 11h4l3 3v3h-7z"/>'),
  file: svg('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4"/><path d="M9 13h6M9 17h6"/>')
};

function query() { return new URLSearchParams(location.search); }
function urlChange(changes, replace = false) {
  const url = new URL(location.href);
  Object.entries(changes).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
  history[replace ? "replaceState" : "pushState"]({}, "", url);
  render();
  if (!replace) scrollTo({ top: 0, behavior: "instant" });
}
function needsReview(item) { return caseIssues(item).length > 0; }
function sourceNote() { return `<p class="hm-source">Datos ilustrativos del 28 jun 2026. Las cantidades y los documentos son ejemplos; no existe consulta en vivo ni validación documental en esta propuesta.</p>`; }
function gapText(key, previous, current, unit) {
  if (previous === null || current === null) return "Dato pendiente de verificar";
  const gap = previous - current;
  if (key === "programmed") return gap < 0 ? `${amount(-gap)} ${unit} sobreprogramados` : gap > 0 ? `${amount(gap)} ${unit} por programar` : "Programación completa";
  if (key === "dispatched") return gap < 0 ? `${amount(-gap)} ${unit} por revisar` : gap > 0 ? `${amount(gap)} ${unit} sin salida` : "Salida completa";
  return gap < 0 ? `${amount(-gap)} ${unit} por revisar` : gap > 0 ? `${amount(gap)} ${unit} por conciliar con POD` : "POD coincide con despacho";
}
function status(q) {
  const state = q.get("scenario");
  if (state === "loading") return `<div class="hm-loading" role="status">Consultando pedidos y entregas…</div>`;
  if (state === "error") return `<div class="sial-status error" role="alert"><span class="sial-feedback-copy"><strong>No se pudo consultar el corte</strong><p>Materiales, Transporte o POD no entregaron datos.</p></span></div><button class="sial-btn sial-btn-secondary sial-btn-full" data-hm-retry>Reintentar</button>`;
  return state === "offline" ? `<div class="hm-offline" role="status">Sin conexión · consulta ilustrativa del 28 jun 2026.</div>` : "";
}
function mobileHeading(icon, title, help, id) {
  return `<header class="sial-mobile-section-heading"><span class="sial-mobile-section-icon" aria-hidden="true">${icon}</span><div><h2 class="sial-section-title" id="${id}">${title}</h2><p>${help}</p></div></header>`;
}
function mobileOperation(item) {
  const rows = [["Pedido · línea", `${item.pedido} · ${item.line}`], ["Finca", item.farm], ["Aviso de Corte", item.notice ? `${item.notice} · ${item.noticeVersion}` : "No aplica"], ["Material", `${item.materialCode} · ${item.unit}`], ["Orden de transporte", item.order]];
  const issues = caseIssues(item);
  return `<section class="sial-card sial-card-pad hm-native-section" aria-labelledby="hm-operation-title">${mobileHeading(icons.file, "Detalle de la línea", `${esc(item.pedido)} · línea ${esc(item.line)}`, "hm-operation-title")}${materialRows(item).length > 1 ? `<button type="button" class="hm-line-change" data-hm-choose>Cambiar línea de este material ${icons.next}</button>` : ""}<div class="hm-line-values" aria-label="Cantidades de esta línea">${stages.map((stage) => `<div><span>${esc(stage.short)}</span><strong>${amount(item[stage.key])}</strong><small>${esc(item.unit)}</small></div>`).join("")}</div><div class="hm-line-issues"><strong>${issues.length ? `${issues.length} ${issues.length === 1 ? "diferencia" : "diferencias"} de esta línea` : "Línea conciliada"}</strong>${issues.length ? `<ul>${issues.map((issue) => `<li>${esc(issue.detail)}</li>`).join("")}</ul>` : ""}</div><dl class="hm-native-rows">${rows.map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl></section>`;
}
function materialRows(item) { return controlCases.filter((row) => materialKey(row) === materialKey(item)); }
function aggregateGaps(rows, total) {
  const unit = rows[0].unit;
  const gaps = [];
  for (let index = 1; index < stages.length; index++) {
    const previous = total[stages[index - 1].key];
    const current = total[stages[index].key];
    if (!Number.isFinite(current)) {
      const missing = rows.filter((row) => !Number.isFinite(row[stages[index].key])).length;
      gaps.push(`${stages[index].short}: sin dato en ${missing} ${missing === 1 ? "línea" : "líneas"}`);
    } else if (Number.isFinite(previous) && current !== previous) {
      gaps.push(gapText(stages[index].key, previous, current, unit));
    }
  }
  return gaps;
}
function farmProgress(value, approved) {
  return Number.isFinite(value) && Number.isFinite(approved) && approved > 0 ? Math.min(100, Math.max(0, value / approved * 100)) : 0;
}
function mobileFarmComparison(rows) {
  const farms = [...new Set(rows.map((row) => row.farm))];
  const unit = rows[0].unit;
  return `<section class="sial-card sial-card-pad hm-native-section hm-farm-chart" aria-labelledby="hm-farms-title">${mobileHeading(icons.chart, "Avance por finca", `${esc(rows[0].material)} · ${esc(unit)}`, "hm-farms-title")}<p class="hm-chart-explainer">Cada barra compara el despacho o POD con el consolidado aprobado de esa finca.</p><div class="hm-farm-list">${farms.map((farm) => {
    const totals = totalsFor(rows.filter((row) => row.farm === farm));
    const metrics = [["Despachado", totals.dispatched, "dispatch"], ["Con POD", totals.delivered, "pod"]];
    return `<div class="hm-farm-row"><div class="hm-farm-title"><strong>${esc(farm)}</strong><small>${amount(totals.approved)} ${esc(unit)} aprobados</small></div>${metrics.map(([label, value, tone]) => `<div class="hm-farm-measure"><div><span>${label}</span><b>${Number.isFinite(value) ? `${amount(value)} / ${amount(totals.approved)} ${esc(unit)}` : "Sin dato"}</b></div><span class="hm-farm-track" role="img" aria-label="${esc(label)}: ${amount(value)} de ${amount(totals.approved)} ${esc(unit)}"><span class="hm-farm-${tone}" style="width:${farmProgress(value, totals.approved)}%"></span></span></div>`).join("")}</div>`;
  }).join("")}</div></section>`;
}
function mobileProgress(rows) {
  const item = rows[0];
  const total = totalsFor(rows);
  const max = Math.max(1, ...stages.map(({ key }) => total[key] ?? 0));
  const chartLabels = ["Aprobado", "Prog.", "Despacho", "Con POD"];
  const requestedStage = Number(query().get("stage") || 4);
  const selectedIndex = Number.isInteger(requestedStage) ? Math.min(3, Math.max(0, requestedStage - 1)) : 3;
  const selectedStage = stages[selectedIndex];
  const selectedValue = total[selectedStage.key];
  const previous = selectedIndex ? total[stages[selectedIndex - 1].key] : null;
  const selectedGap = selectedIndex ? gapText(selectedStage.key, previous, selectedValue, item.unit) : "Base autorizada";
  const gaps = aggregateGaps(rows, total);
  return `<section class="sial-card sial-card-pad hm-native-section hm-stage-chart" aria-labelledby="hm-progress-title">${mobileHeading(icons.chart, "Consolidado vs despachado", `${esc(item.material)} · ${esc(item.unit)} · ${rows.length} ${rows.length === 1 ? "línea" : "líneas"}`, "hm-progress-title")}<p class="hm-chart-explainer">Total de este material en el ejemplo. Las cuatro barras usan la misma unidad y escala; toca una etapa para ver la fuente.</p><div class="hm-stage-chart-plot" role="group" aria-label="Comparar las cuatro cantidades agregadas del material">${stages.map((stage, index) => {
    const value = total[stage.key];
    const percent = Number.isFinite(value) ? value === 0 ? 0 : Math.max(3, value / max * 100) : 0;
    return `<button type="button" class="hm-stage-column" data-hm-stage="${index + 1}" aria-pressed="${selectedIndex === index}" aria-label="${esc(stage.label)}: ${amount(value)}${Number.isFinite(value) ? ` ${esc(item.unit)}` : ""}"><strong>${Number.isFinite(value) ? amount(value) : "—"}</strong><span class="hm-stage-column-track" aria-hidden="true"><span style="--hm-bar-height:${percent}%" class="hm-stage-bar-${index + 1} ${Number.isFinite(value) ? "" : "is-missing"}"></span></span><small>${chartLabels[index]}</small></button>`;
  }).join("")}</div><div class="hm-stage-insight" role="status"><span>${String(selectedIndex + 1).padStart(2, "0")} · ${esc(selectedStage.source)}</span><strong>${esc(selectedStage.label)} · ${amount(selectedValue)}${Number.isFinite(selectedValue) ? ` ${esc(item.unit)}` : ""}</strong><p>${esc(selectedGap)}</p></div><div class="hm-stage-gaps" aria-label="Brechas del material"><strong>${gaps.length ? "Diferencias que requieren atención" : "Sin diferencias entre etapas"}</strong>${gaps.length ? `<ul>${gaps.map((gap) => `<li>${esc(gap)}</li>`).join("")}</ul>` : `<p>Las cuatro cantidades del material coinciden.</p>`}</div></section>`;
}
function mobileRatios(rows) {
  const item = rows[0];
  const total = totalsFor(rows);
  const metrics = [
    { label: "DESPACHADO", value: Number.isFinite(total.dispatched) && total.approved > 0 ? Math.round(total.dispatched / total.approved * 100) : null, description: Number.isFinite(total.dispatched) ? `${amount(total.dispatched)} de ${amount(total.approved)} ${item.unit} aprobados` : "Despacho pendiente de confirmar" },
    { label: "CON POD", value: Number.isFinite(total.delivered) && Number.isFinite(total.dispatched) && total.dispatched > 0 && total.delivered <= total.dispatched && rows.every((row) => row.delivered === 0 || row.pod) ? Math.round(total.delivered / total.dispatched * 100) : null, description: Number.isFinite(total.delivered) ? `${amount(total.delivered)} de ${amount(total.dispatched)} ${item.unit} despachados` : "Cantidad con POD pendiente" }
  ];
  return `<section class="hm-ratio-grid" aria-label="Indicadores del material">${metrics.map((metric) => `<div class="sial-card sial-card-pad hm-ratio"><span>${metric.label}</span><strong>${metric.value === null ? "Sin dato" : `${metric.value}%`}</strong><div class="hm-ratio-track" role="meter" aria-label="${metric.label.toLowerCase()}: ${metric.description}" aria-valuemin="0" aria-valuemax="100" ${metric.value === null ? `aria-valuetext="Sin dato verificable"` : `aria-valuenow="${Math.min(100, metric.value)}" aria-valuetext="${metric.value} por ciento"`}><span style="width:${metric.value === null ? 0 : Math.min(100, metric.value)}%"></span></div><small>${metric.description}</small></div>`).join("")}</section>`;
}
function mobileLinks(item) {
  return `<section class="sial-card sial-card-pad hm-native-section" aria-labelledby="hm-links-title">${mobileHeading(icons.file, "Soportes y traslados", "Consulta el origen de cada cantidad", "hm-links-title")}<div class="hm-detail-actions"><button type="button" data-hm-sheet="trips">${icons.truck}<span><strong>Viajes y vehículos</strong><small>${item.trips.length} ${item.trips.length === 1 ? "viaje programado" : "viajes programados"}</small></span>${icons.next}</button><button type="button" data-hm-sheet="documents">${icons.file}<span><strong>Documentos del proceso</strong><small>Origen, orden, entrega y POD</small></span>${icons.next}</button></div></section>`;
}
function mobileDetail(item) {
  const rows = materialRows(item);
  const farms = new Set(rows.map((row) => row.farm)).size;
  return `<section class="sial-card sial-card-pad hm-native-ticket" aria-label="Material en seguimiento"><span class="hm-native-overline">MATERIAL EN SEGUIMIENTO</span><div class="hm-native-ticket-head"><strong>${esc(item.material)}</strong><span class="sial-pill info">${rows.length} ${rows.length === 1 ? "línea" : "líneas"}</span></div><p>${esc(item.materialCode)} · ${esc(item.unit)} · ${farms} ${farms === 1 ? "finca" : "fincas"}</p><button type="button" class="sial-btn sial-btn-secondary sial-btn-full sial-container-change-action" data-hm-choose-material>${icons.back}<span>Cambiar material</span></button></section>${mobileProgress(rows)}${mobileRatios(rows)}${mobileFarmComparison(rows)}${mobileOperation(item)}${mobileLinks(item)}${sourceNote()}`;
}
function render() {
  const q = query();
  if (["loading", "error"].includes(q.get("scenario"))) { root.innerHTML = status(q); return; }
  const cases = q.get("scenario") === "empty" ? [] : controlCases;
  const item = cases.find((candidate) => candidate.id === q.get("case")) || cases[0];
  root.innerHTML = `${status(q)}${item ? mobileDetail(item) : `<div class="hm-empty"><strong>Sin líneas para consultar</strong><p>Cuando existan líneas de material en el corte, aparecerán aquí.</p></div>${sourceNote()}`}`;
}
function openMaterialPicker() {
  const content = document.createElement("div");
  content.className = "hm-native-picker";
  const materials = controlCases.filter((row, index) => controlCases.findIndex((candidate) => materialKey(candidate) === materialKey(row)) === index);
  const current = controlCases.find((row) => row.id === query().get("case")) || controlCases[0];
  content.innerHTML = `<p>Elige un material para comparar cantidades de la misma unidad en todas sus líneas y fincas.</p><div class="hm-native-pick-list">${materials.map((row, index) => {
    const count = materialRows(row).length;
    return `<button type="button" class="hm-native-pick ${materialKey(row) === materialKey(current) ? "is-selected" : ""}" data-hm-material="${index}"><span><strong>${esc(row.material)}</strong><small>${esc(row.materialCode)} · ${esc(row.unit)}</small><small>${count} ${count === 1 ? "línea" : "líneas"}</small></span>${icons.next}</button>`;
  }).join("")}</div>`;
  content.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-hm-material]");
    if (!choice) return;
    const row = materials[Number(choice.dataset.hmMaterial)];
    if (!row) return;
    window.SialMobileUI?.closeDialog?.("hu1920-material-picker", { reason: "selection" });
    urlChange({ case: row.id, stage: null });
  });
  window.SialMobileUI?.openDialog?.({ id: "hu1920-material-picker", title: "Selecciona un material", variant: "sheet", content, actions: [] });
}
function openCasePicker(scopeKey = null) {
  const content = document.createElement("div");
  content.className = "hm-native-picker";
  const choices = scopeKey ? controlCases.filter((row) => materialKey(row) === scopeKey) : controlCases;
  const selected = query().get("case") || controlCases[0].id;
  let activeFilter = "all";
  const row = (item) => `<button type="button" class="hm-native-pick ${item.id === selected ? "is-selected" : ""}" data-hm-pick="${esc(item.id)}"><span><strong>${esc(item.pedido)} · línea ${esc(item.line)}</strong><small>${esc(item.material)} · ${esc(item.unit)}</small><small>${esc(item.farm)}</small></span><em>${esc(caseReading(item).label)}</em></button>`;
  const reviewCount = choices.filter(needsReview).length;
  content.innerHTML = `<p>Elige una línea de ${scopeKey ? "este material" : "material"} para revisar su detalle y documentos.</p><label class="hm-native-search">${icons.search}<span class="sr-only">Buscar pedido, finca o material</span><input type="search" placeholder="Pedido, finca o material" autocomplete="off" data-dialog-initial-focus></label><div class="hm-native-chips" role="group" aria-label="Filtrar líneas por estado"><button type="button" class="sial-tab" data-hm-filter="all" aria-pressed="true" aria-label="Todas las líneas: ${choices.length}">Todas <b>${choices.length}</b></button><button type="button" class="sial-tab" data-hm-filter="review" aria-pressed="false" aria-label="Líneas por revisar: ${reviewCount}">Revisar <b>${reviewCount}</b></button><button type="button" class="sial-tab" data-hm-filter="done" aria-pressed="false" aria-label="Líneas conciliadas: ${choices.length - reviewCount}">Conciliadas</button></div><div class="hm-native-pick-list">${choices.map(row).join("")}</div><span class="hm-native-count">${choices.length} líneas · datos ilustrativos</span>`;
  const updateRows = () => {
    const search = content.querySelector("input[type=search]").value.trim().toLocaleLowerCase("es");
    const rows = choices.filter((item) => {
      const matchesFilter = activeFilter === "all" || (activeFilter === "review") === needsReview(item);
      return matchesFilter && [item.id, item.pedido, item.material, item.farm, item.order, item.notice].some((value) => String(value || "").toLocaleLowerCase("es").includes(search));
    });
    content.querySelector(".hm-native-pick-list").innerHTML = rows.length ? rows.map(row).join("") : `<p class="hm-native-none">Sin líneas para esta selección.</p>`;
    content.querySelector(".hm-native-count").textContent = `${rows.length} ${rows.length === 1 ? "línea" : "líneas"} · datos ilustrativos`;
  };
  content.addEventListener("input", (event) => {
    if (!event.target.matches("input[type=search]")) return;
    updateRows();
  });
  content.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-hm-filter]");
    if (filter) {
      activeFilter = filter.dataset.hmFilter;
      content.querySelectorAll("[data-hm-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button === filter)));
      updateRows();
      return;
    }
    const choice = event.target.closest("[data-hm-pick]");
    if (!choice) return;
    window.SialMobileUI?.closeDialog?.("hu1920-case-picker", { reason: "selection" });
    urlChange({ case: choice.dataset.hmPick, selectCase: null, stage: null });
  });
  updateRows();
  window.SialMobileUI?.openDialog?.({ id: "hu1920-case-picker", title: "Selecciona una línea", variant: "sheet", content, actions: [] });
}
function openDetailSheet(kind, item) {
  const content = document.createElement("div");
  content.className = "hm-info-sheet";
  if (kind === "trips") {
    const total = item.trips.reduce((sum, trip) => sum + trip.quantity, 0);
    content.innerHTML = `<p>Programación de ${amount(item.programmed)} ${esc(item.unit)} distribuida en ${item.trips.length} ${item.trips.length === 1 ? "viaje" : "viajes"}.</p>${item.trips.map((trip) => `<div><span><strong>${esc(trip.id)}</strong><small>Vehículo ${esc(trip.vehicle)}</small></span><b>${amount(trip.quantity)} ${esc(item.unit)}</b></div>`).join("")}<p>${total === item.programmed ? "Los viajes suman la programación." : `Diferencia de ${amount(Math.abs(total - item.programmed))} ${esc(item.unit)} frente a la programación.`}</p>`;
  } else {
    const docs = [["Documento de origen", item.document], ["Orden de transporte", item.order], ["Entrega", item.delivery || "Sin registro"], ["POD", item.pod || "Sin soporte validado"]];
    content.innerHTML = `<p>Rastro documental de ${esc(item.pedido)}, línea ${esc(item.line)}. Los identificadores son ilustrativos y no verifican el soporte real.</p>${docs.map(([label, value]) => `<div><span><small>${esc(label)}</small><strong>${esc(value)}</strong></span></div>`).join("")}`;
  }
  window.SialMobileUI?.openDialog?.({ id: `hu1920-${kind}`, title: kind === "trips" ? "Viajes y vehículos" : "Documentos del proceso", variant: "sheet", content, actions: [] });
}
root.addEventListener("click", (event) => {
  const target = event.target;
  const item = controlCases.find((candidate) => candidate.id === query().get("case")) || controlCases[0];
  if (target.closest("[data-hm-choose-material]")) { openMaterialPicker(); return; }
  if (target.closest("[data-hm-choose]")) { openCasePicker(materialKey(item)); return; }
  if (target.closest("[data-hm-retry]")) { urlChange({ scenario: null }); return; }
  const stage = target.closest("[data-hm-stage]");
  if (stage) { urlChange({ stage: stage.dataset.hmStage }, true); root.querySelector(`[data-hm-stage="${stage.dataset.hmStage}"]`)?.focus({ preventScroll: true }); return; }
  const sheet = target.closest("[data-hm-sheet]");
  if (sheet && item) openDetailSheet(sheet.dataset.hmSheet, item);
});
window.addEventListener("popstate", render);
render();
if (query().get("selectCase") === "1" && query().get("scenario") !== "empty") requestAnimationFrame(() => openCasePicker());
