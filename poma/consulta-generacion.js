(() => {
  const demoRadication = "2026047824";
  const rows = [
    { id: "salida-finca", route: "Finca El Retiro → ZE Santa Marta", dispatch: "14/10/2026 · 07:30", vehicle: "TRK-421", driver: "Carlos Méndez", company: "Translogística SAS", boxes: 1200, available: true, pallets: [
      { sscc: "177012345678900001", reference: "AGSTDRA · V3", boxes: 640 },
      { sscc: "177012345678900002", reference: "20LD7RA-20 · V2", boxes: 560 }
    ] },
    { id: "salida-ze", route: "ZE Santa Marta → Puerto", dispatch: "14/10/2026 · 16:20", vehicle: "TRK-421", driver: "Carlos Méndez", company: "Translogística SAS", boxes: 1200, available: true, pallets: [
      { sscc: "177012345678900001", reference: "AGSTDRA · V3", boxes: 640 },
      { sscc: "177012345678900002", reference: "20LD7RA-20 · V2", boxes: 560 }
    ] }
  ];
  const $ = (selector) => document.querySelector(selector);
  let selected = null;
  let detailTrigger = null;
  const input = $("#poma-radication");
  const error = $("#poma-search-error");
  function clearError() { error.hidden = true; error.textContent = ""; input.setAttribute("aria-invalid", "false"); }
  function fail(message) { error.textContent = message; error.hidden = false; input.setAttribute("aria-invalid", "true"); input.focus(); }
  function renderRow() {
    const row = rows.find((item) => item.id === selected);
    $("#poma-detail").hidden = !row;
    $("#poma-generation").hidden = !row;
    document.body.style.overflow = row ? "hidden" : "";
    $(".sial-page-header").inert = Boolean(row);
    $(".poma-body").inert = Boolean(row);
    if (!row) return;
    $("#poma-route").textContent = row.route;
    $("#poma-status").textContent = row.available ? "Salida confirmada" : "Salida pendiente";
    $("#poma-status").className = `sial-pill ${row.available ? "success" : "warning"}`;
    $("#poma-dispatch").textContent = row.dispatch;
    $("#poma-vehicle").textContent = row.vehicle;
    $("#poma-driver").textContent = row.driver;
    $("#poma-company").textContent = row.company;
    $("#poma-pallet-count").textContent = String(row.pallets.length);
    $("#poma-box-count").textContent = row.boxes.toLocaleString("es-CO");
    const list = $("#poma-pallet-list");
    list.replaceChildren();
    row.pallets.forEach((pallet, index) => {
      const card = document.createElement("li");
      card.className = "poma-pallet";
      const ordinal = document.createElement("span");
      ordinal.className = "poma-pallet-index";
      ordinal.textContent = String(index + 1).padStart(2, "0");
      const main = document.createElement("div");
      main.className = "poma-pallet-main";
      const label = document.createElement("span");
      label.className = "poma-pallet-label";
      label.textContent = "SSCC";
      const title = document.createElement("strong");
      title.className = "poma-pallet-code";
      title.textContent = pallet.sscc;
      const detail = document.createElement("div");
      detail.className = "poma-pallet-meta";
      const reference = document.createElement("span");
      reference.textContent = pallet.reference;
      const boxes = document.createElement("strong");
      boxes.textContent = `${pallet.boxes.toLocaleString("es-CO")} cajas`;
      detail.append(reference, boxes);
      main.append(label, title, detail);
      card.append(ordinal, main);
      list.append(card);
    });
    $("#poma-generate").disabled = !row.available;
    $("#poma-generation-hint").textContent = row.available
      ? "Esta propuesta genera una copia de ejemplo; el documento oficial requiere la app y sus datos operativos."
      : "La salida de este tramo no está registrada. Aún no puede generarse su POMA.";
  }
  $("#poma-search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();
    const value = input.value.trim();
    if (!/^\d+$/.test(value)) return fail("Ingresa una radicación numérica.");
    if (value !== demoRadication) {
      $("#poma-stages").hidden = true;
      $("#poma-detail").hidden = true;
      $("#poma-generation").hidden = true;
      return fail("No hay datos de ejemplo para esta radicación. Prueba con 2026047824.");
    }
    const list = $("#poma-stage-list");
    list.replaceChildren();
    rows.forEach((row) => {
      const button = document.createElement("button");
      button.className = "poma-stage";
      button.type = "button";
      button.dataset.id = row.id;
      button.setAttribute("aria-haspopup", "dialog");
      const title = document.createElement("strong");
      title.textContent = row.route;
      const detail = document.createElement("span");
      detail.textContent = `${row.dispatch} · ${row.pallets.length} pallets · ${row.available ? "POMA disponible" : "Salida pendiente"}`;
      button.append(title, detail);
      list.append(button);
    });
    selected = null;
    $("#poma-stages").hidden = false;
    renderRow();
  });
  $("#poma-stage-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    detailTrigger = button;
    selected = button.dataset.id;
    renderRow();
    $("#poma-detail-close").focus();
  });
  function closeDetail() { selected = null; renderRow(); detailTrigger?.focus(); }
  $("#poma-detail-close").addEventListener("click", closeDetail);
  $("#poma-detail").addEventListener("click", (event) => { if (event.target === $("#poma-detail")) closeDetail(); });
  document.addEventListener("keydown", (event) => {
    if ($("#poma-detail").hidden) return;
    if (event.key === "Escape") { closeDetail(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...$("#poma-detail").querySelectorAll("button:not([disabled])")].filter((element) => element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  $("#poma-generate").addEventListener("click", () => {
    const row = rows.find((item) => item.id === selected);
    if (!row?.available) return;
    const popup = window.open("", "_blank");
    if (!popup) {
      $("#poma-generation-hint").textContent = "El navegador bloqueó la ventana. Permite ventanas emergentes para guardar el PDF de ejemplo.";
      return;
    }
    const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>POMA de ejemplo · ${demoRadication}</title><style>body{font:14px Arial,sans-serif;margin:40px;color:#14243a}h1{border-bottom:2px solid #005ca8;padding-bottom:12px}header{display:flex;justify-content:space-between;align-items:start}small{color:#52647c}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{text-align:left;border-bottom:1px solid #d9e1e9;padding:10px}footer{margin-top:36px;border-top:1px solid #d9e1e9;padding-top:12px;color:#7b4150}</style></head><body><header><div><small>SIAL · PROPUESTA NO OFICIAL</small><h1>Documento POMA</h1></div><strong>Radicación ${demoRadication}</strong></header><p><strong>Ruta:</strong> ${escape(row.route)}</p><p><strong>Salida:</strong> ${escape(row.dispatch)} · <strong>Vehículo:</strong> ${escape(row.vehicle)}</p><p><strong>Conductor:</strong> ${escape(row.driver)} · <strong>Transportadora:</strong> ${escape(row.company)}</p><h2>Remisión de carga</h2><p>${row.pallets.length} pallets · ${row.boxes.toLocaleString("es-CO")} cajas</p><table><thead><tr><th>Posición</th><th>SSCC</th><th>Referencia</th><th>Cajas</th></tr></thead><tbody>${row.pallets.map((pallet, index) => `<tr><td>${index + 1}</td><td>${escape(pallet.sscc)}</td><td>${escape(pallet.reference)}</td><td>${pallet.boxes}</td></tr>`).join("")}</tbody></table><footer>Copia de ejemplo para validar composición y flujo. No representa un documento operativo ni sustituye la generación de la app.</footer></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  });
})();
