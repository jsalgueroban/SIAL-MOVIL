(function () {
  const stateKey = "sial-mobile-materiales";
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const dataset = {
    context: { company: "Banasan S.A.S.", finca: "Finca La Ceiba", week: "SEM-2026-32", notice: "AC-2026-032", reference: "AGSTDRA" },
    suggested: {
      id: "PED-SUG-2026-032-014", status: "SUGERIDO", recipe: "Receta versión 3 · vigente", inventory: "03/08/2026 · 06:40",
      calculation: { demand: 1600, reserved: 120, incoming: 80, safety: 64 },
      materials: [
        { code: "MAT-CAR-001", name: "Caja de cartón corrugado", unit: "und", suggested: 744, stock: 1280, reserved: 120, incoming: 80, status: "Disponible" },
        { code: "MAT-TAP-001", name: "Tapa de cartón", unit: "und", suggested: 804, stock: 900, reserved: 60, incoming: 0, status: "Bajo" },
        { code: "MAT-ETQ-001", name: "Etiqueta de trazabilidad", unit: "rollo", suggested: 25, stock: 12, reserved: 0, incoming: 0, status: "Revisión" },
        { code: "MAT-EST-001", name: "Estiba de exportación", unit: "und", suggested: 28, stock: 94, reserved: 12, incoming: 0, status: "Disponible" }
      ]
    },
    additionalMaterials: [
      { code: "MAT-CAR-001", name: "Caja de cartón corrugado", unit: "und", base: 744, stock: 1280 },
      { code: "MAT-TAP-001", name: "Tapa de cartón", unit: "und", base: 804, stock: 900 },
      { code: "MAT-ETQ-001", name: "Etiqueta de trazabilidad", unit: "rollo", base: 25, stock: 12 },
      { code: "MAT-EST-001", name: "Estiba de exportación", unit: "und", base: 28, stock: 94 }
    ],
    stock: [
      { code: "MAT-CAR-001", material: "Caja de cartón corrugado", finca: "Finca La Ceiba", unit: "und", available: 1280, reserved: 120, damaged: 0, updated: "03/08/2026 06:40", status: "Disponible", source: "Movimientos de inventario" },
      { code: "MAT-TAP-001", material: "Tapa de cartón", finca: "Finca La Ceiba", unit: "und", available: 900, reserved: 60, damaged: 12, updated: "03/08/2026 06:40", status: "Bajo", source: "Movimientos de inventario" },
      { code: "MAT-ETQ-001", material: "Etiqueta de trazabilidad", finca: "Finca La Ceiba", unit: "rollo", available: 12, reserved: 0, damaged: 0, updated: "03/08/2026 06:40", status: "Revisión", source: "Conteo pendiente" },
      { code: "MAT-CAR-001", material: "Caja de cartón corrugado", finca: "Finca Santa Isabel", unit: "und", available: 360, reserved: 40, damaged: 0, updated: "02/08/2026 17:50", status: "Bajo", source: "Movimientos de inventario" },
      { code: "MAT-EST-001", material: "Estiba de exportación", finca: "Finca Santa Isabel", unit: "und", available: 94, reserved: 12, damaged: 2, updated: "03/08/2026 06:58", status: "Disponible", source: "Movimientos de inventario" }
    ],
    orders: [
      { id: "OTI-546-001", document: "RPT-2026-0881", finca: "Finca La Ceiba", origin: "Bodega central", destination: "Finca La Ceiba", window: "03/08/2026 · 14:00–16:00", material: "Caja de cartón + estibas", quantity: "1.480 und", vehicle: "TUL458", driver: "Carlos Mendoza", status: "ASIGNADO", notified: "Transporte, conductor, seguridad y finca", items: [{ code: "MAT-CAR-001", name: "Caja de cartón corrugado", unit: "und", requested: 1480 }, { code: "MAT-EST-001", name: "Estiba de exportación", unit: "und", requested: 28 }] },
      { id: "OTI-546-002", document: "REM-2026-0184", finca: "Finca Santa Isabel", origin: "Bodega central", destination: "Finca Santa Isabel", window: "03/08/2026 · 16:00–18:00", material: "Caja de cartón corrugado", quantity: "520 und", vehicle: "CAM-102", driver: "Ana Ramírez", status: "EN TRÁNSITO", notified: "Transporte y conductor", items: [{ code: "MAT-CAR-001", name: "Caja de cartón corrugado", unit: "und", requested: 520 }] }
    ],
    pallets: [
      { reference: "BAN-REF-001", finca: "Finca La Ceiba", type: "Completo", pallets: "18", boxes: "0", destination: "SIALU1234567" },
      { reference: "BAN-REF-011", finca: "Finca Santa Isabel", type: "Incompleto", pallets: "1", boxes: "14", destination: "Consolidación posterior" }
    ]
  };

  function defaultState() {
    return { activeOrderId: "OTI-546-001", reviewedSuggested: false, inventoryFarm: dataset.context.finca, inventorySearch: "", additionalRequests: [], delivery: { receiver: "", date: "2026-08-03T15:40", observation: "", lines: {} }, pod: { photo: false, signature: false, photoMeta: "", signatureData: "" }, closed: false };
  }

  function loadState() {
    const base = defaultState();
    try {
      const stored = JSON.parse(localStorage.getItem(stateKey) || "null") || {};
      const legacyRequests = stored.additional && !stored.additionalRequests ? [stored.additional] : [];
      return { ...base, ...stored, reviewedSuggested: stored.reviewedSuggested ?? stored.consulted ?? false, additionalRequests: stored.additionalRequests || legacyRequests, delivery: { ...base.delivery, ...(stored.delivery || {}) }, pod: { ...base.pod, ...(stored.pod || {}), photo: stored.pod?.photo ?? stored.podPhoto ?? false, signature: stored.pod?.signature ?? stored.podSignature ?? false }, closed: stored.closed || false };
    } catch (_) { return base; }
  }

  function saveState(state) { localStorage.setItem(stateKey, JSON.stringify(state)); }
  function ui() { return window.SialMobileUI || {}; }
  function toast(type, title, message) { ui().showToast?.({ type, title, message }); }
  function icon(path) { return `<svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`; }

  function status(text) {
    const value = String(text || "").toLowerCase();
    let type = "info";
    if (value.includes("bloque") || value.includes("rechaz")) type = "error";
    else if (value.includes("bajo") || value.includes("revisión") || value.includes("pendiente") || value.includes("asignado")) type = "warning";
    const done = value.includes("entregad") || value.includes("cerrad") || value.includes("disponible") || value.includes("revisado") || value.includes("recibido");
    return `<span class="sial-chip-action ${done ? "success" : type}">${esc(text)}</span>`;
  }

  function actionCard(href, title, text, path, meta = "") { return `<a class="sial-action-card sial-material-action-card" href="${esc(href)}"><span><strong>${esc(title)}</strong><span>${esc(text)}</span>${meta ? `<small>${esc(meta)}</small>` : ""}</span><span class="sial-action-icon">${icon(path)}</span></a>`; }
  function mini(label, value, tone = "") { return `<div class="sial-material-mini ${tone ? `is-${tone}` : ""}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
  function contextBar(title, description = "") { return `<section class="sial-material-context"><div><span class="sial-material-eyebrow">${esc(dataset.context.company)}</span><strong>${esc(title)}</strong>${description ? `<p>${esc(description)}</p>` : ""}</div><div class="sial-material-context-meta"><span>${esc(dataset.context.finca)}</span><span>${esc(dataset.context.week)}</span></div></section>`; }
  function activeOrder(state = loadState()) { return dataset.orders.find((item) => item.id === state.activeOrderId) || dataset.orders[0]; }

  function orderCard(order, selected) {
    return `<article class="sial-card sial-card-pad sial-material-order-card ${selected ? "is-selected" : ""}"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(order.document)}</span><strong>${esc(order.id)}</strong><span>${esc(order.origin)} → ${esc(order.destination)}</span></div>${status(order.status)}</div><div class="sial-material-matrix">${mini("Ventana", order.window)}${mini("Vehículo", order.vehicle)}${mini("Conductor", order.driver)}${mini("Carga", order.quantity)}</div><div class="sial-material-notification">${icon('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>')}<span><strong>Notificaciones</strong>${esc(order.notified)}</span></div><button class="sial-btn ${selected ? "sial-btn-secondary" : "sial-btn-primary"} sial-btn-full" type="button" data-material-action="select-order" data-order-id="${esc(order.id)}">${selected ? "Orden activa" : "Abrir orden"}</button></article>`;
  }

  function dashboard() {
    const state = loadState();
    const order = activeOrder(state);
    const lowStock = dataset.stock.filter((item) => item.status !== "Disponible").length;
    const pendingAdditional = state.additionalRequests.filter((item) => item.status !== "APROBADO").length;
    return `${contextBar("Materiales y suministros", "Operación de pedidos, stock, transporte y recepción en finca.")}<section class="sial-command-hero sial-material-hero"><div><span class="sial-material-eyebrow">Continuar operación</span><h1>${esc(order.id)}</h1><p>${esc(order.destination)} · ${esc(order.window)}</p></div><a class="sial-btn sial-btn-primary sial-btn-full" href="detalle-orden.html">Abrir orden activa</a></section><section class="sial-stat-row sial-material-stat-row"><div class="sial-stat"><strong>${dataset.orders.length}</strong><span>Órdenes activas</span><small>Asignadas o en tránsito</small></div><div class="sial-stat"><strong>${lowStock}</strong><span>Alertas de stock</span><small>Requieren revisión</small></div><div class="sial-stat"><strong>${pendingAdditional}</strong><span>Adicionales</span><small>En seguimiento</small></div></section><section class="sial-card sial-card-pad sial-material-priority"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Prioridad operativa</span><h2 class="sial-section-title">Lo que requiere atención</h2></div><span class="sial-chip-action warning">${lowStock + 1} pendientes</span></div><a class="sial-material-priority-row" href="pedido-sugerido.html"><span class="sial-material-priority-icon is-warning">${icon('<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>')}</span><span><strong>Revisar pedido sugerido</strong><small>${esc(dataset.suggested.id)} · ${dataset.suggested.materials.length} materiales</small></span>${status(state.reviewedSuggested ? "Revisado" : "Pendiente")}</a><a class="sial-material-priority-row" href="inventario-finca.html"><span class="sial-material-priority-icon is-info">${icon('<path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2"/>')}</span><span><strong>Consultar stock con trazabilidad</strong><small>${lowStock} materiales con alerta o conteo pendiente</small></span><span class="sial-chip-action info">Ver stock</span></a></section><section class="sial-quick-grid sial-material-quick-grid">${actionCard("pedido-sugerido.html", "Pedido sugerido", "Consulta el cálculo de abastecimiento.", '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', "HU659 · solo lectura")}${actionCard("inventario-finca.html", "Inventario de finca", "Existencia, reservas, daños y movimiento.", '<path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2"/>', "HU662 · consulta")}${actionCard("pedido-adicional.html", "Necesidad adicional", "Registra una solicitud sin alterar el pedido base.", '<path d="M12 5v14"/><path d="M5 12h14"/>', "HU666 · campo")}${actionCard("ordenes-asignadas.html", "Órdenes asignadas", "Revisa carga, ruta y notificaciones.", '<path d="M3 7h11v10H3z"/><path d="M14 11h4l3 3v3h-7z"/>', "HU546 · HU670")}</section>`;
  }

  function suggested() {
    const state = loadState();
    const pedido = dataset.suggested;
    const calc = pedido.calculation;
    return `${contextBar("Pedido sugerido", "Consulta explicable de abastecimiento. La generación y el ajuste se realizan en Web.")}<section class="sial-card sial-card-pad sial-material-feature-card"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(pedido.id)}</span><strong>${esc(dataset.context.finca)} · ${esc(dataset.context.week)}</strong><span>Aviso ${esc(dataset.context.notice)} · Referencia ${esc(dataset.context.reference)}</span></div>${status(state.reviewedSuggested ? "REVISADO" : pedido.status)}</div><div class="sial-material-rule-note">${icon('<path d="M12 3v18"/><path d="M7 8h10"/><path d="M7 16h10"/>')}<span><strong>Consulta de solo lectura</strong> No cambies cantidades aquí: el ajuste pertenece a HU660 en Web.</span></div></section><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Fuentes verificadas</span><h2 class="sial-section-title">De dónde sale el cálculo</h2></div><span class="sial-chip-action success">Confiables</span></div><div class="sial-material-source-grid">${mini("Aviso publicado", dataset.context.notice, "success")}${mini("Receta", pedido.recipe, "success")}${mini("Inventario", pedido.inventory, "success")}${mini("Finca autorizada", dataset.context.finca, "success")}</div></section><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Fórmula resumida</span><h2 class="sial-section-title">Necesidad del período</h2></div><span class="sial-chip-action info">Explicable</span></div><div class="sial-material-matrix sial-material-calc-grid">${mini("Necesidad calculada", `${calc.demand} und`, "info")}${mini("Reservado", `${calc.reserved} und`, "warning")}${mini("Por recibir", `${calc.incoming} und`, "info")}${mini("Margen seguridad", `${calc.safety} und`, "warning")}</div><p class="sial-material-helper">El margen de seguridad se muestra como dato calculado; no es editable desde móvil.</p></section><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Detalle de la sugerencia</span><h2 class="sial-section-title">Materiales por referencia</h2></div><span class="sial-chip-action info">${pedido.materials.length} líneas</span></div><div class="sial-material-lines">${pedido.materials.map((item) => `<article class="sial-material-line"><div class="sial-material-line-head"><span><strong>${esc(item.name)}</strong><small>${esc(item.code)} · ${esc(item.unit)}</small></span>${status(item.status)}</div><div class="sial-material-line-values"><span><small>Sugerido</small><strong>${item.suggested} ${esc(item.unit)}</strong></span><span><small>Stock</small><strong>${item.stock} ${esc(item.unit)}</strong></span><span><small>Reservado</small><strong>${item.reserved} ${esc(item.unit)}</strong></span><span><small>Por recibir</small><strong>${item.incoming} ${esc(item.unit)}</strong></span></div></article>`).join("")}</div></section><section class="sial-status info" role="status"><span class="sial-feedback-copy"><strong>${state.reviewedSuggested ? "Revisión registrada" : "Antes de solicitar un adicional"}</strong><p>${state.reviewedSuggested ? "La revisión queda asociada al pedido y permite registrar necesidades adicionales." : "Revisa el origen, la fórmula y cada línea. Esto no aprueba ni modifica el pedido."}</p></span></section><div class="sial-bottom-actions"><button class="sial-btn sial-btn-primary sial-btn-full" type="button" data-material-action="confirm-suggestion" ${state.reviewedSuggested ? "disabled" : ""}>${state.reviewedSuggested ? "Pedido revisado" : "Marcar como revisado"}</button><button class="sial-btn sial-btn-secondary sial-btn-full" type="button" data-material-action="open-additional" ${state.reviewedSuggested ? "" : "disabled"}>Registrar necesidad adicional</button></div>`;
  }

  function additionalStock(code) { return dataset.additionalMaterials.find((item) => item.code === code) || dataset.additionalMaterials[0]; }

  function materialSelect() {
    const options = dataset.additionalMaterials.map((item) => `<option value="${esc(item.code)}">${esc(item.name)} · ${esc(item.unit)}</option>`).join("");
    return `<div class="sial-select-control" data-sial-select><select class="sial-select-native" id="mobileAdditionalMaterial" name="material" tabindex="-1" aria-hidden="true" inert>${options}</select><button class="sial-select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="mobile-additional-material-options" aria-label="Material"><span data-sial-select-value></span><svg class="sial-select-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><div class="sial-select-menu" id="mobile-additional-material-options" role="listbox" tabindex="-1" hidden></div></div>`;
  }

  function reasonSelect() {
    return `<div class="sial-select-control" data-sial-select><select class="sial-select-native" id="mobileAdditionalReason" name="motivo" tabindex="-1" aria-hidden="true" inert><option value="">Seleccionar motivo</option><option value="incremento-corte">Incremento extraordinario del corte</option><option value="inventario">Diferencia de inventario</option><option value="entrega-incompleta">Entrega incompleta del proveedor</option><option value="dano">Material dañado o no utilizable</option><option value="otro">Otra necesidad operativa</option></select><button class="sial-select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="mobile-additional-reason-options" aria-label="Motivo de la solicitud"><span data-sial-select-value>Seleccionar motivo</span><svg class="sial-select-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><div class="sial-select-menu" id="mobile-additional-reason-options" role="listbox" tabindex="-1" hidden></div></div>`;
  }

  function additionalRequestCard(item) {
    const pendingSync = item.sync === "pending";
    return `<article class="sial-material-request-card"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(item.id)}</span><strong>${esc(item.materialName)}</strong><span>${item.quantity} ${esc(item.unit)} · ${esc(item.reasonLabel)}</span></div>${status(pendingSync ? "PENDIENTE DE SINCRONIZACIÓN" : "PENDIENTE DE VALIDACIÓN")}</div><div class="sial-material-request-meta"><span><small>Pedido base</small><strong>${esc(item.baseOrder || dataset.suggested.id)}</strong></span><span><small>Referencia</small><strong>${esc(item.reference || dataset.context.reference)}</strong></span><span><small>Stock visible</small><strong>${item.stock} ${esc(item.unit)}${item.stockWarning ? " · revisar" : ""}</strong></span><span><small>Idempotencia</small><strong>Clave única</strong></span></div><div class="sial-additional-timeline"><div class="is-done"><i>${icon('<path d="m20 6-11 11-5-5"/>')}</i><span><strong>Solicitud registrada</strong><small>${pendingSync ? "Guardada en el dispositivo." : "Registro único para este pedido."}</small></span></div><div class="is-current"><i></i><span><strong>${pendingSync ? "Pendiente de sincronización" : "Pendiente de validación"}</strong><small>${item.stockWarning ? "La disponibilidad requiere validación de abastecimiento." : "Materiales validará cantidad, motivo y stock."}</small></span></div><div><i></i><span><strong>Clasificación y despacho</strong><small>Continuará en Web cuando corresponda.</small></span></div></div>${item.detail ? `<p class="sial-material-helper"><strong>Detalle:</strong> ${esc(item.detail)}</p>` : ""}</article>`;
  }

  function additionalOrder() {
    const state = loadState();
    const pedido = dataset.suggested;
    if (new URLSearchParams(location.search).get("access") === "denied") return `${contextBar("Necesidad adicional", "Acceso restringido")}<section class="sial-status error" role="alert"><span class="sial-feedback-copy"><strong>Solicitud no disponible</strong><p>No existe información visible dentro de tu compañía y finca autorizada.</p></span></section><a class="sial-btn sial-btn-secondary sial-btn-full" href="index.html">Volver a Materiales</a>`;
    if (!state.reviewedSuggested) return `${contextBar("Necesidad adicional", "Primero debes revisar el pedido base.")}<section class="sial-status warning" role="alert"><span class="sial-feedback-copy"><strong>Revisa el pedido sugerido</strong><p>La necesidad adicional siempre debe conservar el vínculo con el aviso, la finca y el pedido base.</p></span></section><a class="sial-btn sial-btn-primary sial-btn-full" href="pedido-sugerido.html">Revisar pedido sugerido</a>`;
    const material = dataset.additionalMaterials[0];
    return `${contextBar("Necesidad adicional", "Captura una necesidad extraordinaria sin reemplazar el pedido base.")}<section class="sial-card sial-card-pad sial-material-origin-card"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Contexto obligatorio</span><h2 class="sial-section-title">Origen de la necesidad</h2></div><span class="sial-chip-action success">Vinculado</span></div><div class="sial-additional-origin"><div><span>Aviso</span><strong>${esc(pedido.notice)}</strong></div><div><span>Pedido base</span><strong>${esc(pedido.id)}</strong></div><div><span>Finca</span><strong>${esc(dataset.context.finca)}</strong></div><div class="active"><span>Referencia</span><strong>${esc(dataset.context.reference)}</strong></div></div><p class="sial-material-helper">La solicitud conserva este contexto, no modifica el pedido sugerido y puede repetirse si surge una necesidad diferente.</p></section>${state.additionalRequests.length ? `<section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Seguimiento</span><h2 class="sial-section-title">Solicitudes registradas</h2></div><span class="sial-chip-action info">${state.additionalRequests.length}</span></div><div class="sial-material-request-list">${state.additionalRequests.map(additionalRequestCard).join("")}</div></section>` : ""}<form id="mobile-additional-form" class="sial-card sial-card-pad sial-form sial-additional-form" data-flow-form data-additional-mobile-form><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Nueva solicitud</span><h2 class="sial-section-title">Material y cantidad</h2></div><span class="sial-chip-action info">Validación posterior</span></div><div class="sial-material-rule-note">${icon('<path d="M12 3v18"/><path d="M7 8h10"/><path d="M7 16h10"/>')}<span><strong>El móvil registra la necesidad</strong> La aprobación, el documento logístico y el despacho continúan en Web.</span></div><div class="sial-field"><label class="sial-label" for="mobileAdditionalMaterial">Material</label>${materialSelect()}</div><div class="sial-additional-stock" data-additional-mobile-stock><div><span>Cantidad sugerida</span><strong>${material.base} ${esc(material.unit)}</strong></div><div><span>Stock visible</span><strong>${material.stock} ${esc(material.unit)}</strong></div></div><div class="sial-field"><label class="sial-label" for="mobileAdditionalQuantity">Cantidad adicional</label><input class="sial-input-wrap sial-input" id="mobileAdditionalQuantity" name="cantidad" type="number" min="0.01" step="any" inputmode="decimal" placeholder="Ingresa la cantidad" required><p class="sial-field-help">Si supera el stock visible, se registra con alerta para validación; el móvil no aplica tolerancias.</p></div><div class="sial-field"><label class="sial-label" for="mobileAdditionalReason">Motivo</label>${reasonSelect()}</div><div class="sial-field"><label class="sial-label" for="mobileAdditionalDetail">Observación <span>(opcional)</span></label><textarea class="sial-textarea" id="mobileAdditionalDetail" name="observacion" rows="3" placeholder="Información útil para quien validará la solicitud"></textarea></div></form><div data-additional-mobile-status></div><section class="sial-confirmation-card" aria-label="Confirmar solicitud adicional"><p class="sial-confirmation-copy">Confirma material, cantidad y motivo. La solicitud quedará pendiente de validación de abastecimiento.</p><button class="sial-btn sial-btn-primary sial-btn-full" type="submit" form="mobile-additional-form">Enviar a validación</button></section><a class="sial-btn sial-btn-secondary sial-btn-full" href="pedido-sugerido.html">Volver al pedido base</a>`;
  }

  function updateAdditionalStock(code) { const target = qs("[data-additional-mobile-stock]"); if (!target) return; const material = additionalStock(code); target.innerHTML = `<div><span>Cantidad sugerida</span><strong>${material.base} ${esc(material.unit)}</strong></div><div><span>Stock visible</span><strong>${material.stock} ${esc(material.unit)}</strong></div>`; }

  function inventory() {
    const state = loadState();
    const farms = [...new Set(dataset.stock.map((item) => item.finca))];
    const query = state.inventorySearch.toLowerCase();
    const rows = dataset.stock.filter((item) => (!state.inventoryFarm || item.finca === state.inventoryFarm) && (!query || `${item.material} ${item.code}`.toLowerCase().includes(query)));
    const alerts = rows.filter((item) => item.status !== "Disponible").length;
    return `${contextBar("Inventario de finca", "Consulta el saldo derivado y sus señales antes de pedir o recibir.")}<section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">HU662 · consulta</span><h2 class="sial-section-title">Existencia trazable</h2></div><span class="sial-chip-action ${alerts ? "warning" : "success"}">${alerts ? `${alerts} alertas` : "Sin alertas"}</span></div><div class="sial-material-filter-grid"><div class="sial-field"><label class="sial-label" for="stockFarm">Finca autorizada</label><select class="sial-select" id="stockFarm" data-stock-farm>${farms.map((farm) => `<option value="${esc(farm)}" ${farm === state.inventoryFarm ? "selected" : ""}>${esc(farm)}</option>`).join("")}</select></div><div class="sial-field"><label class="sial-label" for="stockSearch">Buscar material</label><input class="sial-input-wrap sial-input" id="stockSearch" data-stock-search value="${esc(state.inventorySearch)}" placeholder="Código o nombre"></div><button class="sial-btn sial-btn-secondary sial-btn-full" type="button" data-material-action="apply-stock-filter">Aplicar filtros</button></div></section><section class="sial-material-stock-list">${rows.length ? rows.map((item) => `<article class="sial-card sial-card-pad sial-material-stock-card"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(item.code)}</span><strong>${esc(item.material)}</strong><span>${esc(item.finca)} · ${esc(item.source)}</span></div>${status(item.status)}</div><div class="sial-material-matrix">${mini("Disponible", `${item.available} ${item.unit}`, item.status === "Disponible" ? "success" : "warning")}${mini("Reservado", `${item.reserved} ${item.unit}`)}${mini("Dañado", `${item.damaged} ${item.unit}`, item.damaged ? "warning" : "success")}${mini("Último movimiento", item.updated)}</div></article>`).join("") : `<section class="sial-status info"><span class="sial-feedback-copy"><strong>Sin coincidencias</strong><p>Prueba con otro material o cambia la finca autorizada.</p></span></section>`}</section>`;
  }

  function orders() { const state = loadState(); return `${contextBar("Órdenes asignadas", "Carga y notificaciones para el transportista o conductor.")}<section class="sial-material-summary">${dataset.orders.map((order) => orderCard(order, order.id === state.activeOrderId)).join("")}</section>`; }

  function orderTimeline(order) { const transit = order.status.toLowerCase().includes("tránsito"); return `<div class="sial-material-route"><div class="sial-material-route-step is-done"><i>1</i><div><strong>Orden creada y asignada</strong><span>${esc(order.document)} · carga vinculada</span></div></div><div class="sial-material-route-step is-done"><i>2</i><div><strong>Conductor notificado</strong><span>${esc(order.driver)} · ${esc(order.vehicle)}</span></div></div><div class="sial-material-route-step ${transit ? "is-current" : ""}"><i>3</i><div><strong>En tránsito</strong><span>${transit ? "Hito activo; la finca puede prepararse para recibir." : "Pendiente de salida desde la bodega."}</span></div></div><div class="sial-material-route-step"><i>4</i><div><strong>Recepción en finca</strong><span>Registrar cantidades recibidas, diferencias y evidencia.</span></div></div></div>`; }

  function detail() {
    const order = activeOrder();
    return `${contextBar("Detalle de orden", "Consulta la trazabilidad antes de registrar la recepción.")}<section class="sial-card sial-card-pad sial-material-feature-card"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(order.document)}</span><strong>${esc(order.id)}</strong><span>${esc(order.origin)} → ${esc(order.destination)}</span></div>${status(order.status)}</div><div class="sial-material-matrix">${mini("Ventana", order.window)}${mini("Vehículo", order.vehicle)}${mini("Conductor", order.driver)}${mini("Carga", order.quantity)}</div><div class="sial-material-notification">${icon('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>')}<span><strong>Notificado a</strong>${esc(order.notified)}</span></div></section><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Trazabilidad</span><h2 class="sial-section-title">Ruta de la orden</h2></div><span class="sial-chip-action info">4 hitos</span></div>${orderTimeline(order)}</section><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Carga</span><h2 class="sial-section-title">Materiales esperados</h2></div></div><div class="sial-material-lines">${order.items.map((item) => `<div class="sial-material-line"><div class="sial-material-line-head"><span><strong>${esc(item.name)}</strong><small>${esc(item.code)} · ${esc(item.unit)}</small></span><strong>${item.requested} ${esc(item.unit)}</strong></div></div>`).join("")}</div></section><div class="sial-bottom-actions"><a class="sial-btn sial-btn-primary sial-btn-full" href="registrar-entrega.html">Registrar recepción en finca</a><a class="sial-btn sial-btn-secondary sial-btn-full" href="ordenes-asignadas.html">Volver a órdenes</a></div>`;
  }

  function delivery() {
    const state = loadState();
    const order = activeOrder(state);
    const lineState = state.delivery.lines || {};
    return `${contextBar("Registrar recepción", "HU547 · HU681 · registra lo recibido, las diferencias y el soporte.")}<section class="sial-card sial-card-pad sial-material-feature-card"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(order.document)}</span><strong>${esc(order.id)}</strong><span>${esc(order.origin)} → ${esc(order.destination)}</span></div>${status(state.closed ? "ENTREGADA" : "PENDIENTE")}</div><div class="sial-material-rule-note">${icon('<path d="M12 3v18"/><path d="M7 8h10"/><path d="M7 16h10"/>')}<span><strong>Validación de recepción</strong> Registra cada línea. Si existe diferencia, explica la novedad y conserva la evidencia.</span></div></section><form class="sial-card sial-card-pad sial-form sial-delivery-form" data-flow-form><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Datos de recepción</span><h2 class="sial-section-title">Quién y cuándo recibe</h2></div></div><div class="sial-field"><label class="sial-label" for="deliveryReceiver">Responsable que recibe</label><input class="sial-input-wrap sial-input" id="deliveryReceiver" value="${esc(state.delivery.receiver)}" placeholder="Nombre completo" required></div><div class="sial-field"><label class="sial-label" for="deliveryDate">Fecha y hora</label><input class="sial-input-wrap sial-input" id="deliveryDate" type="datetime-local" value="${esc(state.delivery.date)}" required></div><div class="sial-field"><label class="sial-label" for="deliveryObservation">Observaciones o novedad</label><textarea class="sial-textarea" id="deliveryObservation" rows="3" placeholder="Obligatoria si hay faltantes, rechazo o devolución">${esc(state.delivery.observation)}</textarea></div></form><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Conciliación</span><h2 class="sial-section-title">Lo solicitado frente a lo recibido</h2></div><span class="sial-chip-action info">Por línea</span></div><div class="sial-delivery-lines">${order.items.map((item) => { const line = lineState[item.code] || {}; return `<article class="sial-delivery-line" data-delivery-line="${esc(item.code)}"><div class="sial-material-line-head"><span><strong>${esc(item.name)}</strong><small>Solicitado: ${item.requested} ${esc(item.unit)}</small></span><span class="sial-chip-action info">${esc(item.unit)}</span></div><div class="sial-delivery-inputs"><div class="sial-field"><label class="sial-label" for="received-${esc(item.code)}">Recibido</label><input class="sial-input-wrap sial-input" id="received-${esc(item.code)}" data-delivery-received type="number" min="0" max="${item.requested}" step="any" inputmode="decimal" value="${esc(line.received ?? "")}" placeholder="0"></div><div class="sial-field"><label class="sial-label" for="returned-${esc(item.code)}">Devuelto</label><input class="sial-input-wrap sial-input" id="returned-${esc(item.code)}" data-delivery-returned type="number" min="0" step="any" inputmode="decimal" value="${esc(line.returned ?? 0)}" placeholder="0"></div><div class="sial-material-receipt-result"><span>Faltante / rechazo</span><strong data-delivery-pending>—</strong></div></div></article>`; }).join("")}</div></section><section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">HU682 · soporte</span><h2 class="sial-section-title">Evidencia de entrega</h2></div><span class="sial-chip-action ${state.pod.photo && state.pod.signature ? "success" : "warning"}">${state.pod.photo && state.pod.signature ? "Completa" : "Obligatoria"}</span></div><div class="sial-material-pod-grid"><button class="sial-material-pod-box ${state.pod.photo ? "done" : ""}" type="button" data-material-action="capture-pod">${icon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>')}<strong>${state.pod.photo ? "Foto POD capturada" : "Capturar foto POD"}</strong><span>${state.pod.photo ? esc(state.pod.photoMeta || "Evidencia vinculada") : "Registro fotográfico de la entrega"}</span></button><button class="sial-material-pod-box ${state.pod.signature ? "done" : ""}" type="button" data-material-action="sign-pod">${icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>')}<strong>${state.pod.signature ? "Firma digital capturada" : "Capturar firma de recibido"}</strong><span>${state.pod.signature ? "Firma confirmada" : "La firma se solicita al receptor"}</span></button></div><div class="sial-signature-capture" data-pod-signature-pad hidden><span class="sial-material-eyebrow">Firma del receptor</span><p>Traza la firma dentro del recuadro y confirma cuando esté completa.</p><div data-pod-signature-target></div></div><div data-material-pod-status></div></section><div class="sial-bottom-actions"><button class="sial-btn sial-btn-secondary sial-btn-full" type="button" data-material-action="save-delivery-draft">Guardar avance</button><button class="sial-btn sial-btn-primary sial-btn-full" type="button" data-material-action="close-delivery">Cerrar recepción</button></div>`;
  }

  function pod() {
    const state = loadState();
    const order = activeOrder(state);
    return `${contextBar("POD de entrega", "Consulta el soporte asociado a la recepción.")}<section class="sial-card sial-card-pad sial-material-feature-card"><div class="sial-material-order-head"><div><span class="sial-material-eyebrow">${esc(order.document)}</span><strong>${esc(order.id)}</strong><span>${esc(order.destination)} · ${esc(order.driver)}</span></div>${status(state.closed ? "CERRADA" : "PENDIENTE")}</div><div class="sial-material-matrix">${mini("Foto POD", state.pod.photo ? "Capturada" : "Pendiente", state.pod.photo ? "success" : "warning")}${mini("Firma", state.pod.signature ? "Capturada" : "Pendiente", state.pod.signature ? "success" : "warning")}${mini("Receptor", state.delivery.receiver || "Pendiente")}${mini("Fecha", state.delivery.date || "Pendiente")}</div></section><section class="sial-status ${state.closed ? "success" : "warning"}" role="status"><span class="sial-feedback-copy"><strong>${state.closed ? "Recepción cerrada con soporte" : "Recepción aún pendiente"}</strong><p>${state.closed ? "El POD queda disponible para consulta y trazabilidad posterior." : "Completa la recepción, la foto y la firma antes de cerrar."}</p></span></section><div class="sial-bottom-actions">${state.closed ? `<a class="sial-btn sial-btn-secondary sial-btn-full" href="ordenes-asignadas.html">Volver a órdenes</a>` : `<a class="sial-btn sial-btn-primary sial-btn-full" href="registrar-entrega.html">Completar recepción</a>`}</div>`;
  }

  function pallets() { return `${contextBar("Pallets de materiales", "Consulta compacta; el armado y la consolidación continúan en su flujo propio.")}<section class="sial-card sial-card-pad"><div class="sial-material-section-head"><div><span class="sial-material-eyebrow">Consulta relacionada</span><h2 class="sial-section-title">Pallets disponibles</h2></div><span class="sial-chip-action info">${dataset.pallets.length}</span></div><div class="sial-list">${dataset.pallets.map((item) => `<div class="sial-list-row"><strong>${esc(item.reference)}</strong><span>${esc(item.finca)} · ${esc(item.destination)}</span>${status(`${item.type} · ${item.pallets} pallet(s)`)}</div>`).join("")}</div></section><a class="sial-btn sial-btn-secondary sial-btn-full" href="../pallets/armar-pallet.html">Abrir flujo de pallets</a>`; }

  const renderers = { index: dashboard, "pedido-sugerido": suggested, "pedido-adicional": additionalOrder, "inventario-finca": inventory, "ordenes-asignadas": orders, "detalle-orden": detail, "registrar-entrega": delivery, pod, pallets };

  function render() {
    const root = qs("[data-material-mobile-view]");
    if (!root) return;
    const view = root.dataset.materialMobileView || "index";
    root.innerHTML = (renderers[view] || dashboard)();
    const state = loadState();
    if (view === "pedido-adicional" && state.additionalRequests.some((item) => item.sync === "pending")) ui().showBanner?.({ id: "additional-sync", type: "warning", title: "Sin conexión", message: "Hay solicitudes guardadas en el dispositivo y pendientes de sincronización.", dismissible: false });
    else ui().hideBanner?.("additional-sync");
    ui().mountSelectControls?.(root);
    qsa("[data-delivery-line]").forEach(updateDeliveryLineFeedback);
  }

  function collectDelivery() {
    const state = loadState();
    const lines = {};
    qsa("[data-delivery-line]").forEach((row) => { lines[row.dataset.deliveryLine] = { received: qs("[data-delivery-received]", row)?.value || "", returned: qs("[data-delivery-returned]", row)?.value || "0" }; });
    return { ...state.delivery, receiver: qs("#deliveryReceiver")?.value.trim() || "", date: qs("#deliveryDate")?.value || "", observation: qs("#deliveryObservation")?.value.trim() || "", lines };
  }

  function updateDeliveryLineFeedback(row) {
    const item = activeOrder().items.find((entry) => entry.code === row.dataset.deliveryLine);
    const received = Number(qs("[data-delivery-received]", row)?.value || 0);
    const returned = Number(qs("[data-delivery-returned]", row)?.value || 0);
    const target = qs("[data-delivery-pending]", row);
    if (target && item) target.textContent = `${Math.max(0, item.requested - received)} ${item.unit}`;
    row.classList.toggle("has-difference", Boolean(item && (received !== item.requested || returned > 0)));
  }

  function validateDelivery(delivery, order) {
    if (!delivery.receiver) return "Indica quién recibe los materiales en la finca.";
    if (!delivery.date) return "Indica la fecha y hora de recepción.";
    let hasDifference = false;
    for (const item of order.items) {
      const line = delivery.lines[item.code] || {};
      const received = Number(line.received || 0);
      const returned = Number(line.returned || 0);
      if (!Number.isFinite(received) || received < 0 || received > item.requested) return `Revisa la cantidad recibida de ${item.name}.`;
      if (!Number.isFinite(returned) || returned < 0 || returned > received) return `La devolución de ${item.name} no puede superar lo recibido.`;
      if (received !== item.requested || returned > 0) hasDifference = true;
    }
    if (hasDifference && !delivery.observation) return "Agrega una observación para explicar el faltante, rechazo o devolución.";
    return "";
  }

  function mountSignatureCapture() {
    const shell = qs("[data-pod-signature-pad]");
    const target = qs("[data-pod-signature-target]");
    if (!shell || !target) return;
    shell.hidden = false;
    if (!target.sialSignatureController && ui().mountSignaturePad) ui().mountSignaturePad(target, { label: "Firma digital del receptor", confirmLabel: "Confirmar firma", clearLabel: "Limpiar firma", onConfirm: (data) => { const state = loadState(); state.pod.signature = true; state.pod.signatureData = data; saveState(state); toast("success", "Firma registrada", "La firma del receptor quedó vinculada a la entrega."); render(); } });
    shell.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveDeliveryDraft(showToast = true) { const state = loadState(); state.delivery = collectDelivery(); saveState(state); if (showToast) toast("success", "Avance guardado", "Puedes continuar la recepción sin perder las cantidades registradas."); }

  function submitAdditionalOrder() {
    const state = loadState();
    const statusTarget = qs("[data-additional-mobile-status]");
    const material = additionalStock(qs("#mobileAdditionalMaterial")?.value || "");
    const quantity = Number(qs("#mobileAdditionalQuantity")?.value || 0);
    const reason = qs("#mobileAdditionalReason")?.value || "";
    const detail = qs("#mobileAdditionalDetail")?.value.trim() || "";
    if (!Number.isFinite(quantity) || quantity <= 0 || !reason) {
      ui().setInlineStatus?.(statusTarget, { type: "error", title: "Completa la solicitud", message: quantity <= 0 ? "Ingresa una cantidad mayor que cero." : "Selecciona el motivo del pedido adicional." });
      const target = quantity <= 0 ? qs("#mobileAdditionalQuantity") : qs("#mobileAdditionalReason");
      target?.focus({ preventScroll: true });
      statusTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const reasonLabel = qs("#mobileAdditionalReason")?.selectedOptions[0]?.textContent || reason;
    const idempotencyKey = `${dataset.suggested.id}|${dataset.context.reference}|${material.code}|${quantity}|${reason}`;
    if (state.additionalRequests.some((item) => item.idempotencyKey === idempotencyKey)) {
      toast("info", "Solicitud ya registrada", "La misma clave idempotente no creó un duplicado.");
      return;
    }
    const offline = new URLSearchParams(location.search).get("offline") === "1" || navigator.onLine === false;
    const requestNumber = String(state.additionalRequests.length + 1).padStart(3, "0");
    state.additionalRequests.push({ id: `PAD-2026-32-${requestNumber}`, idempotencyKey, material: material.code, materialName: material.name, quantity, unit: material.unit, stock: material.stock, stockWarning: quantity > material.stock, reason, reasonLabel, detail, notice: dataset.context.notice, baseOrder: dataset.suggested.id, finca: dataset.context.finca, reference: dataset.context.reference, origin: "mobile", sync: offline ? "pending" : "synced", status: offline ? "PENDIENTE DE SINCRONIZACIÓN" : "PENDIENTE DE VALIDACIÓN", createdAt: new Date().toISOString() });
    saveState(state);
    ui().clearUnsavedChanges?.();
    if (offline) ui().showBanner?.({ id: "additional-sync", type: "warning", title: "Sin conexión", message: "La solicitud quedó guardada en el dispositivo y se enviará al recuperar conexión.", dismissible: false });
    else toast("success", "Solicitud registrada", "Quedó pendiente de validación de abastecimiento.");
    render();
  }

  document.addEventListener("change", (event) => { const material = event.target.closest("#mobileAdditionalMaterial"); if (material) updateAdditionalStock(material.value); const line = event.target.closest("[data-delivery-line]"); if (line) updateDeliveryLineFeedback(line); });
  document.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-additional-mobile-form]")) return;
    event.preventDefault();
    submitAdditionalOrder();
  });
  document.addEventListener("input", (event) => {
    const line = event.target.closest("[data-delivery-line]");
    if (line) updateDeliveryLineFeedback(line);
    if (event.target.matches("#deliveryReceiver, #deliveryDate, #deliveryObservation, [data-delivery-received], [data-delivery-returned]")) {
      const next = loadState();
      next.delivery = collectDelivery();
      saveState(next);
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-material-action]");
    if (!button) return;
    const state = loadState();
    const action = button.dataset.materialAction;
    if (action === "select-order") { state.activeOrderId = button.dataset.orderId; saveState(state); toast("success", "Orden activa", "La orden quedó cargada para consultar su trazabilidad y recepción."); navigate("detalle-orden.html"); return; }
    if (action === "confirm-suggestion") { state.reviewedSuggested = true; saveState(state); toast("success", "Pedido revisado", "La revisión quedó registrada sin modificar el cálculo."); render(); return; }
    if (action === "open-additional") { if (state.reviewedSuggested) navigate("pedido-adicional.html"); return; }
    if (action === "apply-stock-filter") { state.inventoryFarm = qs("[data-stock-farm]")?.value || dataset.context.finca; state.inventorySearch = qs("[data-stock-search]")?.value.trim() || ""; saveState(state); render(); return; }
    if (action === "capture-pod") { const complete = () => { const next = loadState(); next.pod.photo = true; next.pod.photoMeta = "Foto registrada en esta entrega"; saveState(next); toast("success", "Foto registrada", "La evidencia POD quedó vinculada a la orden."); render(); }; if (ui().openPhotoCapture) ui().openPhotoCapture({ title: "Foto POD de entrega", allowMultiple: false, maxPhotos: 1, onComplete: complete }); else complete(); return; }
    if (action === "sign-pod") { if (state.pod.signature) toast("info", "Firma ya registrada", "La firma confirmada se conserva asociada a esta entrega."); else mountSignatureCapture(); return; }
    if (action === "save-delivery-draft") { saveDeliveryDraft(); return; }
    if (action === "close-delivery") {
      const deliveryState = collectDelivery();
      const error = validateDelivery(deliveryState, activeOrder(state));
      if (error) { const target = qs("[data-material-pod-status]"); ui().setInlineStatus?.(target, { type: "error", title: "Revisa la recepción", message: error }); target?.setAttribute("tabindex", "-1"); target?.focus({ preventScroll: true }); target?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      state.delivery = deliveryState;
      if (!state.pod.photo || !state.pod.signature) { const missing = [!state.pod.photo ? "la foto POD" : "", !state.pod.signature ? "la firma del receptor" : ""].filter(Boolean); const target = qs("[data-material-pod-status]"); ui().setInlineStatus?.(target, { type: "error", title: "Evidencia pendiente", message: `Completa ${missing.join(" y ")} antes de cerrar la recepción.` }); target?.setAttribute("tabindex", "-1"); target?.focus({ preventScroll: true }); target?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      state.closed = true; saveState(state); toast("success", "Recepción cerrada", "La entrega queda disponible con cantidades, diferencias y POD."); navigate("pod.html");
    }
  });

  function navigate(path) { ui().clearUnsavedChanges?.(); if (ui().navigateTo) ui().navigateTo(path); else window.location.href = path; }
  render();
})();
