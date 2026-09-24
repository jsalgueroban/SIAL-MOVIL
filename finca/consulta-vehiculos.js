(function () {
  "use strict";

  var contextKey = "sial-mobile-context";
  var workflowKey = "sial-mobile-workflow";
  var operationKey = "sial-mobile-vehicle-operations";
  var containerScheduleKey = "sial-mobile-container-schedules";
  var contextFarmCodes = {
    "finca-santa-isabel": "0527",
    "finca-la-esperanza": "0412",
    "unidad-operativa-puerto": "0435"
  };
  var vehicles = [];
  var retryRequested = false;
  var pendingDetailId = "";
  var evidenceDetail = null;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function activeFarm() {
    var context = readJson(contextKey, {});
    var workflow = readJson(workflowKey, {});
    return {
      code: contextFarmCodes[context.id] || workflow.farmCode || "0527",
      name: context.name || workflow.farmName || "Finca Santa Isabel"
    };
  }

  function isoWeek(date) {
    var current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    var week = Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
    return current.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
  }

  function weekAtOffset(offset) {
    var date = new Date();
    date.setDate(date.getDate() + offset * 7);
    return isoWeek(date);
  }

  function populateWeeks() {
    var options = [
      { value: weekAtOffset(0), label: "Semana actual · " + weekAtOffset(0) },
      { value: weekAtOffset(1), label: "Próxima semana · " + weekAtOffset(1) },
      { value: weekAtOffset(-1), label: "Semana anterior · " + weekAtOffset(-1) },
      { value: "all", label: "Todas las semanas" }
    ];
    $("[data-vehicle-week]").innerHTML = options.map(function (option) {
      return '<option value="' + option.value + '">' + option.label + "</option>";
    }).join("");
  }

  function addDays(date, amount) {
    return new Date(date.getTime() + amount * 86400000);
  }

  function atTime(date, hour, minute) {
    var value = new Date(date);
    value.setHours(hour, minute, 0, 0);
    return value.toISOString();
  }

  function sampleVehicles() {
    var farm = activeFarm();
    var now = new Date();
    return [
      {
        id: "OP-VEH-2026-418",
        schedule: "PRG-2026-031",
        plate: "TRK-421",
        containerScheduleId: "PCO-2026-031",
        container: "SIALU1234567",
        containerType: "40RF",
        type: "TRACTOMULA",
        driver: "Carlos Méndez",
        carrier: "TRANSLOGÍSTICA SAS",
        week: weekAtOffset(0),
        originCode: farm.code,
        origin: farm.name,
        destinationCode: "0435",
        destination: "Zona Externa Santa Marta",
        direction: "SALIDA",
        status: "EN_TRANSITO",
        stage: "EN RUTA A ZE",
        step: 3,
        scheduledAt: atTime(now, 7, 30),
        updatedAt: atTime(now, 9, 18),
        observation: "Despacho confirmado desde la finca. Pendiente de recepción en Zona Externa.",
        audit: "Salida registrada por porteria.finca · Operación OP-VEH-2026-418"
      },
      {
        id: "OP-VEH-2026-421",
        schedule: "PRG-2026-032",
        plate: "CAM-101",
        containerScheduleId: "PCO-2026-032",
        container: "MSCU1234567",
        containerType: "40RF",
        type: "CAMIÓN",
        driver: "Ana Lucía Paz",
        carrier: "OPERADOR CARIBE SAS",
        week: weekAtOffset(0),
        originCode: "0435",
        origin: "Zona Externa Santa Marta",
        destinationCode: farm.code,
        destination: farm.name,
        direction: "ENTRADA",
        status: "EN_TRANSITO",
        stage: "EN RUTA A FINCA",
        step: 3,
        scheduledAt: atTime(now, 6, 15),
        updatedAt: atTime(now, 8, 46),
        observation: "Vehículo despachado desde Zona Externa con llegada pendiente en finca.",
        audit: "Despacho registrado por operador.ze · Operación OP-VEH-2026-421"
      },
      {
        id: "OP-VEH-2026-423",
        schedule: "PRG-2026-033",
        plate: "RIG-118",
        containerScheduleId: "PCO-2026-033",
        container: "TCLU7654321",
        containerType: "20RF",
        type: "CAMIÓN RÍGIDO",
        driver: "Julián Pérez",
        carrier: "TRANSPORTES ANDINOS",
        week: weekAtOffset(0),
        originCode: "0435",
        origin: "Zona Externa Santa Marta",
        destinationCode: farm.code,
        destination: farm.name,
        direction: "ENTRADA",
        status: "EN_DESTINO",
        stage: "RECIBIDO EN FINCA",
        step: 4,
        scheduledAt: atTime(addDays(now, -1), 13, 20),
        updatedAt: atTime(addDays(now, -1), 15, 8),
        observation: "Recepción confirmada. Vehículo disponible para la siguiente etapa operativa.",
        audit: "Recepción registrada por porteria.finca · Operación OP-VEH-2026-423"
      },
      {
        id: "OP-VEH-2026-430",
        schedule: "PRG-2026-037",
        plate: "CMN-204",
        containerScheduleId: "PCO-2026-034",
        container: "BANU4567890",
        containerType: "40HC",
        type: "CAMIÓN",
        driver: "Pedro Rojas",
        carrier: "OPERADOR CARIBE SAS",
        week: weekAtOffset(1),
        originCode: farm.code,
        origin: farm.name,
        destinationCode: "PCTG",
        destination: "Puerto Cartagena",
        direction: "SALIDA",
        status: "PROGRAMADO",
        stage: "PROGRAMADO",
        step: 0,
        scheduledAt: atTime(addDays(now, 7), 9, 0),
        updatedAt: now.toISOString(),
        observation: "Programación futura pendiente de inicio.",
        audit: "Programado por supervisor.transporte · Operación OP-VEH-2026-430"
      },
      {
        id: "OP-VEH-2026-397",
        schedule: "PRG-2026-028",
        plate: "CAM-102",
        containerScheduleId: "PCO-2026-028",
        container: "TLLU3344556",
        containerType: "40RF",
        type: "CAMIÓN RÍGIDO",
        driver: "Pedro Rojas",
        carrier: "CARGA PESADA LTDA.",
        week: weekAtOffset(-1),
        originCode: farm.code,
        origin: farm.name,
        destinationCode: "0435",
        destination: "Zona Externa Santa Marta",
        direction: "SALIDA",
        status: "FINALIZADO",
        stage: "FINALIZADO",
        step: 5,
        scheduledAt: atTime(addDays(now, -8), 8, 0),
        updatedAt: atTime(addDays(now, -8), 17, 0),
        observation: "Recorrido finalizado sin novedades.",
        audit: "Operación finalizada por supervisor.ze · Operación OP-VEH-2026-397"
      }
    ];
  }

  function vehicleTraceEvents(item, index) {
    var current = Math.max(0, Math.min(Number(item.step) || 0, 5));
    var departureAt = new Date(item.scheduledAt || item.updatedAt);
    departureAt.setMinutes(departureAt.getMinutes() + 24);
    var assignedAt = new Date(item.scheduledAt || item.updatedAt);
    assignedAt.setMinutes(assignedAt.getMinutes() + 10);
    var departureEvidence = {
      id: "EVD-" + String(4100 + index * 10 + 1),
      title: "Vehículo habilitado para salida",
      checkpoint: "Control de acceso · " + item.origin,
      status: "Conforme",
      type: "success",
      author: "Operador de portería",
      date: departureAt.toISOString(),
      sync: "Sincronizada",
      note: "Placa, conductor y condición externa validados antes del despacho.",
      image: "../assets/login/Imagen 1.jpg"
    };
    var transitEvidence = {
          id: "EVD-" + String(4100 + index * 10 + 2),
          title: index === 1 ? "Condición del contenedor" : "Control en ruta",
          checkpoint: "Seguimiento de recorrido",
          status: index === 1 ? "Por validar" : "Conforme",
          type: index === 1 ? "warning" : "success",
          author: item.driver,
          date: item.updatedAt,
          sync: index === 1 ? "Pendiente de sincronización" : "Sincronizada",
          note: index === 1 ? "La evidencia fue capturada sin conexión y requiere validación operativa." : "Registro fotográfico asociado al último punto de control.",
          image: "../assets/login/Imagen 4.jpg"
    };
    var receptionEvidence = {
          id: "EVD-" + String(4100 + index * 10 + 3),
          title: "Llegada al punto de destino",
          checkpoint: "Control de acceso · " + item.destination,
          status: "Conforme",
          type: "success",
          author: "Operador de recepción",
          date: item.updatedAt,
          sync: "Sincronizada",
          note: "Llegada confirmada con validación visual del vehículo y el contenedor.",
          image: "../assets/login/Imagen 1.jpg"
    };
    var stages = [
      { key: "programado", title: "Programado", at: item.scheduledAt, location: item.origin, user: "Planeación de transporte", summary: "Programación registrada para atender la operación " + item.id + ".", evidences: [] },
      { key: "conductor", title: "Conductor asignado", at: assignedAt.toISOString(), location: item.origin, user: "Coordinación de transporte", summary: item.driver + " fue asignado al vehículo " + item.plate + ".", evidences: [] },
      { key: "despacho", title: "Despachado", at: departureAt.toISOString(), location: item.origin, user: "Operador de portería", summary: "El vehículo superó el control de salida e inició el recorrido.", evidences: [departureEvidence] },
      { key: "transito", title: "En tránsito", at: item.updatedAt, location: item.direction === "ENTRADA" ? "Corredor Zona Externa – finca" : "Corredor finca – Zona Externa", user: item.driver, summary: index === 1 ? "Se registró una novedad visual pendiente de validación." : "Seguimiento operativo sin novedades reportadas.", evidences: [transitEvidence] },
      { key: "recibido", title: "Recibido en destino", at: item.updatedAt, location: item.destination, user: "Operador de recepción", summary: "El vehículo fue recibido y quedó disponible para la siguiente actividad.", evidences: [receptionEvidence] },
      { key: "finalizado", title: "Finalizado", at: item.updatedAt, location: item.destination, user: "Supervisor de transporte", summary: "La operación fue cerrada sin actividades pendientes.", evidences: [] }
    ];
    return stages.map(function (stage, stageIndex) {
      var state = stageIndex < current ? "complete" : stageIndex === current ? "current" : "pending";
      return Object.assign({}, stage, {
        id: item.id + "-" + stage.key,
        state: state,
        status: state === "complete" ? "Completado" : state === "current" ? "Estado actual" : "Pendiente",
        severity: state === "complete" ? "success" : state === "current" ? "info" : "neutral",
        at: state === "pending" ? "" : stage.at,
        user: state === "pending" ? "" : stage.user,
        evidences: state === "pending" ? [] : stage.evidences
      });
    });
  }

  function readVehicles() {
    var stored = readJson(operationKey, []);
    var linkedContainers = readJson(containerScheduleKey, []);
    var source = Array.isArray(stored) && stored.length ? stored : sampleVehicles();
    return source.map(function (item, index) {
      var linked = Array.isArray(linkedContainers) ? linkedContainers.find(function (container) {
        return container.vehicleOperationId === item.id || container.vehiclePlate === item.plate || container.container === item.container;
      }) : null;
      var normalized = Object.assign({}, item, {
        containerScheduleId: item.containerScheduleId || (linked && linked.id) || "",
        container: item.container || (linked && linked.container) || "",
        containerType: item.containerType || (linked && linked.type) || ""
      });
      normalized.events = vehicleTraceEvents(normalized, index);
      return normalized;
    });
  }

  function statusMeta(status) {
    if (status === "FINALIZADO") return { label: "Finalizado", className: "info" };
    if (status === "EN_DESTINO") return { label: "En destino", className: "success" };
    if (status === "EN_TRANSITO") return { label: "En tránsito", className: "warning" };
    return { label: "Programado", className: "neutral" };
  }

  function formatDate(value) {
    var date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatDay(value) {
    var date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date).replace(/\.$/, "");
  }

  function formatHour(value) {
    var date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "--:--";
    return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  }

  function dateTimeTemplate(value, label) {
    var date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return '<span class="sial-query-time is-empty">Sin fecha y hora</span>';
    return [
      '<time class="sial-query-time" datetime="' + escapeHtml(date.toISOString()) + '" aria-label="' + escapeHtml(label + ": " + formatDate(value)) + '">',
      '<span>' + escapeHtml(formatDay(value)) + '</span>',
      '<strong>' + escapeHtml(formatHour(value)) + '</strong>',
      '</time>'
    ].join("");
  }

  function traceEvidenceTemplate(item) {
    var events = Array.isArray(item.events) ? item.events : [];
    var total = events.reduce(function (sum, event) { return sum + (event.evidences || []).length; }, 0);
    var rows = events.map(function (event) {
      var evidences = Array.isArray(event.evidences) ? event.evidences : [];
      var photos = evidences.length ? '<div class="vehicle-evidence-strip" aria-label="Evidencias de ' + escapeHtml(event.title) + '">' + evidences.map(function (evidence, photoIndex) {
        var visual = evidence.image
          ? '<img src="' + escapeHtml(evidence.image) + '" alt="' + escapeHtml(evidence.title) + '" loading="lazy">'
          : '<span class="vehicle-evidence-missing" aria-hidden="true"><svg class="sial-icon" viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/><path d="m7 15 3-3 3 3 2-2 3 3"/></svg></span>';
        return '<button class="vehicle-evidence-card" type="button" data-open-vehicle-evidence="' + escapeHtml(evidence.id) + '" data-vehicle-id="' + escapeHtml(item.id) + '" data-event-id="' + escapeHtml(event.id) + '"><span class="vehicle-evidence-image">' + visual + '<em class="' + escapeHtml(evidence.type) + '">' + escapeHtml(evidence.status) + '</em><b>' + String(photoIndex + 1).padStart(2, "0") + '/' + String(evidences.length).padStart(2, "0") + '</b></span><span class="vehicle-evidence-copy"><strong>' + escapeHtml(evidence.title) + '</strong><small>' + escapeHtml(formatHour(evidence.date)) + ' · ' + escapeHtml(evidence.id) + '</small></span></button>';
      }).join("") + '</div>' : '';
      var meta = event.state === "pending" ? '' : '<div class="vehicle-trace-meta"><span>' + escapeHtml(formatDate(event.at)) + '</span><span>' + escapeHtml(event.user) + '</span>' + (evidences.length ? '<b>' + evidences.length + (evidences.length === 1 ? " foto" : " fotos") + '</b>' : '') + '</div>';
      var summary = event.state === "pending" ? '' : '<p>' + escapeHtml(event.summary || "Sin detalle adicional.") + '</p>';
      return '<article class="vehicle-trace-event is-' + escapeHtml(event.state || "pending") + '"><span class="vehicle-trace-marker ' + escapeHtml(event.state || "pending") + '" aria-hidden="true"></span><div class="vehicle-trace-event-body"><header><div><strong>' + escapeHtml(event.title) + '</strong><span>' + escapeHtml(event.location || "Ubicación por confirmar") + '</span></div><span class="sial-pill ' + escapeHtml(event.severity || "neutral") + '">' + escapeHtml(event.status || "Pendiente") + '</span></header>' + meta + summary + photos + '</div></article>';
    }).join("");
    return '<div class="vehicle-trace-summary"><span><strong>' + (Math.min(Number(item.step) || 0, events.length - 1) + 1) + ' de ' + events.length + '</strong> etapa actual</span><span><strong>' + total + '</strong> evidencias fotográficas</span></div><div class="vehicle-trace-list">' + rows + '</div>';
  }

  function linkedContainerHref(item) {
    if (!item.container) return "";
    var params = new URLSearchParams({ container: item.container });
    if (item.containerScheduleId) params.set("detail", item.containerScheduleId);
    return "consulta-contenedores.html?" + params.toString();
  }

  function isLinkedToFarm(item, farm) {
    return item.originCode === farm.code || item.destinationCode === farm.code;
  }

  function matchesFilters(item) {
    var query = $("[data-vehicle-search]").value.trim().toLowerCase();
    var week = $("[data-vehicle-week]").value;
    var status = $("[data-vehicle-status]").value;
    var farm = activeFarm();
    var searchable = [item.plate, item.container, item.containerType, item.driver, item.carrier, item.type, item.origin, item.destination, item.schedule, item.id, item.stage].join(" ").toLowerCase();

    return isLinkedToFarm(item, farm) &&
      (!query || searchable.indexOf(query) >= 0) &&
      (week === "all" || item.week === week) &&
      (status === "all" || item.status === status);
  }

  function routeTemplate(item, detail) {
    return [
      '<div class="' + (detail ? "vehicle-detail-route" : "vehicle-route") + '">',
      '<span class="vehicle-route-point"><span>Origen</span><strong>' + escapeHtml(item.origin) + '</strong></span>',
      '<span class="vehicle-route-arrow" aria-hidden="true"><svg class="sial-icon" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg></span>',
      '<span class="vehicle-route-point"><span>Destino</span><strong>' + escapeHtml(item.destination) + '</strong></span>',
      '</div>'
    ].join("");
  }

  function vehicleIcon(type) {
    var normalized = String(type || "").toUpperCase();

    if (normalized.indexOf("TRACTOMULA") >= 0) {
      return '<svg class="sial-icon" viewBox="0 0 24 24"><path d="M2 7h12v8H2z"/><path d="M14 11h2"/><path d="M16 9h3l3 4v2h-6z"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg>';
    }

    if (normalized.indexOf("RÍGIDO") >= 0 || normalized.indexOf("RIGIDO") >= 0) {
      return '<svg class="sial-icon" viewBox="0 0 24 24"><path d="M3 8h14l4 5v4H3z"/><path d="M17 8v5h4"/><path d="M6 12h7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
    }

    return '<svg class="sial-icon" viewBox="0 0 24 24"><path d="M3 9h11v8H3z"/><path d="M14 11h4l3 3v3h-7z"/><path d="M17 11v3h4"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
  }
  function cardTemplate(item) {
    var status = statusMeta(item.status);
    return [
      '<button class="sial-query-item" type="button" data-vehicle-id="' + escapeHtml(item.id) + '" aria-label="Ver vehículo ' + escapeHtml(item.plate) + '">',
      '<span class="sial-query-item-icon" aria-hidden="true">' + vehicleIcon(item.type) + '</span>',
      '<span class="sial-query-item-body">',
      '<span class="sial-query-item-title"><strong>' + escapeHtml(item.plate) + '</strong><span class="sial-pill ' + status.className + '">' + status.label + '</span></span>',
      '<span class="sial-query-item-meta"><span><strong>' + escapeHtml(item.type) + '</strong></span><span>' + escapeHtml(item.driver) + '</span></span>',
      routeTemplate(item, false),
      '<span class="sial-query-relation"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4z"/><path d="M8 11h8"/></svg><span><small>Contenedor asociado</small><strong>' + escapeHtml(item.container || "Sin asociación") + '</strong></span></span>',
      '<span class="sial-query-item-stage"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>' + escapeHtml(item.stage) + '</span>',
      '<span class="sial-query-item-foot"><span>' + escapeHtml(item.direction === "ENTRADA" ? "Entrada a finca" : "Salida de finca") + '</span><span>Fecha <strong>' + escapeHtml(formatDay(item.updatedAt)) + '</strong></span><span>Hora <strong>' + escapeHtml(formatHour(item.updatedAt)) + '</strong></span></span>',
      '</span>',
      '<svg class="sial-icon sial-query-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
      '</button>'
    ].join("");
  }

  function setViewState(state) {
    $("[data-vehicle-loading]").hidden = state !== "loading";
    $("[data-vehicle-list]").hidden = state !== "results";
    $("[data-vehicle-empty]").hidden = state !== "empty";
    $("[data-vehicle-error]").hidden = state !== "error";
  }

  function render() {
    var filtered = vehicles.filter(matchesFilters).sort(function (a, b) {
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    var queryActive = Boolean(
      $("[data-vehicle-search]").value.trim() ||
      $("[data-vehicle-week]").value !== weekAtOffset(0) ||
      $("[data-vehicle-status]").value !== "all"
    );
    var list = $("[data-vehicle-list]");

    $("[data-vehicle-summary]").textContent = filtered.length + (filtered.length === 1 ? " vehículo" : " vehículos") + " · " + $("[data-vehicle-week]").selectedOptions[0].textContent;
    $("[data-vehicle-clear]").hidden = !queryActive;
    list.innerHTML = filtered.map(cardTemplate).join("");

    if (filtered.length) {
      setViewState("results");
      return;
    }

    var hasSearch = Boolean($("[data-vehicle-search]").value.trim());
    $("[data-vehicle-empty-title]").textContent = hasSearch ? "Sin coincidencias" : "No hay vehículos asociados";
    $("[data-vehicle-empty-copy]").textContent = hasSearch
      ? "No encontramos vehículos que coincidan con la placa, conductor o destino ingresados."
      : "No existen programaciones para la finca, semana y estado seleccionados.";
    setViewState("empty");
  }

  function detailContent(item) {
    var containerHref = linkedContainerHref(item);
    var status = statusMeta(item.status);
    var content = document.createElement("div");
    content.className = "sial-query-detail";
    content.innerHTML = [
      '<section class="sial-query-detail-identity">',
      '<div class="sial-query-detail-identity-head"><div><span>VEHÍCULO</span><strong>' + escapeHtml(item.plate) + '</strong></div><span class="sial-pill ' + status.className + '">' + status.label + '</span></div>',
      '<div class="sial-query-detail-grid">',
      '<div class="sial-query-detail-field"><span>TIPO</span><strong>' + escapeHtml(item.type) + '</strong></div>',
      '<div class="sial-query-detail-field"><span>SEMANA</span><strong>' + escapeHtml(item.week) + '</strong></div>',
      '<div class="sial-query-detail-field"><span>CONDUCTOR</span><strong>' + escapeHtml(item.driver || "--") + '</strong></div>',
      '<div class="sial-query-detail-field"><span>SENTIDO</span><strong>' + escapeHtml(item.direction === "ENTRADA" ? "Entrada a finca" : "Salida de finca") + '</strong></div>',
      '<div class="sial-query-detail-field"><span>PROGRAMACIÓN</span><strong>' + escapeHtml(item.schedule || "--") + '</strong></div>',
      '<div class="sial-query-detail-field"><span>OPERACIÓN</span><strong>' + escapeHtml(item.id || "--") + '</strong></div>',
      '</div></section>',
      item.container ? '<section class="sial-query-detail-section"><h3>Relación vehículo + contenedor</h3><a class="sial-query-related-link" href="' + escapeHtml(containerHref) + '"><span class="sial-query-related-icon" aria-hidden="true"><svg class="sial-icon" viewBox="0 0 24 24"><path d="M4 7h16v10H4z"/><path d="M8 11h8"/></svg></span><span class="sial-query-related-copy"><small>CONTENEDOR ASOCIADO</small><strong>' + escapeHtml(item.container) + '</strong><span>' + escapeHtml([item.containerType, item.containerScheduleId].filter(Boolean).join(" · ")) + '</span></span><svg class="sial-icon sial-query-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></a></section>' : '<section class="sial-query-detail-section"><div class="sial-status warning"><div class="sial-feedback-copy"><strong>Sin contenedor asociado</strong><p>Esta operación de vehículo aún no tiene un contenedor relacionado.</p></div></div></section>',
      '<section class="sial-query-detail-section"><h3>Ruta programada</h3>' + routeTemplate(item, true) + '</section>',
      '<section class="sial-query-detail-section vehicle-evidence-section"><div class="vehicle-section-heading"><div><h3>Recorrido y evidencias</h3><p>Un solo timeline con los estados operativos y sus registros fotográficos.</p></div><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4z"/><circle cx="12" cy="12" r="3"/><path d="m8 7 1-2h6l1 2"/></svg></div>' + traceEvidenceTemplate(item) + '</section>',
      '<section class="sial-query-detail-section"><h3>Información operativa</h3>',
      '<div class="sial-list-row"><strong>Transportadora</strong><span>' + escapeHtml(item.carrier || "--") + '</span></div>',
      '<div class="sial-list-row"><strong>Fecha programada</strong>' + dateTimeTemplate(item.scheduledAt, "Fecha programada") + '</div>',
      '<div class="sial-list-row"><strong>Último registro</strong>' + dateTimeTemplate(item.updatedAt, "Último registro") + '</div>',
      '<p class="sial-query-detail-note">La etapa corresponde al último evento operativo registrado; no representa ubicación GPS en tiempo real.</p>',
      '</section>',
      '<section class="sial-query-detail-section"><h3>Auditoría</h3><p class="sial-query-detail-note">' + escapeHtml(item.audit || "Auditoría no disponible.") + '</p></section>',
      item.observation ? '<section class="sial-query-detail-section"><h3>Observaciones</h3><p class="sial-query-detail-note">' + escapeHtml(item.observation) + '</p></section>' : ""
    ].join("");
    return content;
  }

  function openDetail(id) {
    var item = vehicles.find(function (candidate) { return candidate.id === id; });
    if (!item || !window.SialMobileUI) return;
    window.SialMobileUI.openDialog({
      id: "vehicle-farm-query-detail",
      title: "Detalle del vehículo",
      variant: "sheet",
      content: detailContent(item),
      actions: [{ label: "Cerrar", variant: "primary" }]
    });
  }

  function ensureEvidenceDetail() {
    if (evidenceDetail) return evidenceDetail;
    evidenceDetail = document.createElement("div");
    evidenceDetail.className = "sial-modal-backdrop vehicle-evidence-detail-backdrop";
    evidenceDetail.hidden = true;
    evidenceDetail.setAttribute("data-vehicle-evidence-detail", "");
    evidenceDetail.innerHTML = [
      '<section class="sial-bottom-sheet vehicle-evidence-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="vehicle-evidence-title">',
      '<span class="vehicle-evidence-handle" aria-hidden="true"></span>',
      '<header class="vehicle-evidence-detail-head"><div><span data-vehicle-evidence-counter>Evidencia</span><h2 id="vehicle-evidence-title" data-vehicle-evidence-title>Detalle de la evidencia</h2></div><button class="sial-btn sial-btn-icon" type="button" data-vehicle-evidence-close aria-label="Cerrar detalle"><svg class="sial-icon" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>',
      '<div class="vehicle-evidence-detail-photo" data-vehicle-evidence-photo></div>',
      '<div class="vehicle-evidence-detail-status"><span class="sial-pill info" data-vehicle-evidence-status>Registrada</span><span data-vehicle-evidence-sync>Sincronizada</span></div>',
      '<dl class="vehicle-evidence-detail-meta"><div><dt>Evento</dt><dd data-vehicle-evidence-event></dd></div><div><dt>Fecha y hora</dt><dd data-vehicle-evidence-date></dd></div><div><dt>Punto de control</dt><dd data-vehicle-evidence-checkpoint></dd></div><div><dt>Registrada por</dt><dd data-vehicle-evidence-author></dd></div></dl>',
      '<div class="vehicle-evidence-detail-note"><span>Observación</span><p data-vehicle-evidence-note></p></div>',
      '<button class="sial-btn sial-btn-primary" type="button" data-vehicle-evidence-close>Cerrar evidencia</button>',
      '</section>'
    ].join("");
    document.body.appendChild(evidenceDetail);
    return evidenceDetail;
  }

  function findVehicleEvidence(vehicleId, eventId, evidenceId) {
    var vehicle = vehicles.find(function (item) { return item.id === vehicleId; });
    if (!vehicle) return null;
    var traceEvent = (vehicle.events || []).find(function (item) { return item.id === eventId; });
    if (!traceEvent) return null;
    var evidence = (traceEvent.evidences || []).find(function (item) { return item.id === evidenceId; });
    return evidence ? { event: traceEvent, evidence: evidence } : null;
  }

  function closeEvidenceDetail() {
    var detail = ensureEvidenceDetail();
    if (detail.hidden) return;
    if (window.SialMobileUI && window.SialMobileUI.unmountModalLayer) window.SialMobileUI.unmountModalLayer(detail);
    detail.hidden = true;
  }

  function openEvidenceDetail(button) {
    var found = findVehicleEvidence(button.dataset.vehicleId, button.dataset.eventId, button.dataset.openVehicleEvidence);
    if (!found) return;
    var detail = ensureEvidenceDetail();
    var item = found.evidence;
    var photo = $("[data-vehicle-evidence-photo]", detail);
    photo.innerHTML = item.image
      ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '">'
      : '<div class="vehicle-evidence-detail-missing"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m7 15 3-3 3 3 2-2 3 3"/></svg><strong>Imagen no disponible</strong><span>La información del registro se conserva.</span></div>';
    var values = {
      "[data-vehicle-evidence-counter]": item.id,
      "[data-vehicle-evidence-title]": item.title,
      "[data-vehicle-evidence-event]": found.event.title,
      "[data-vehicle-evidence-date]": formatDate(item.date),
      "[data-vehicle-evidence-checkpoint]": item.checkpoint,
      "[data-vehicle-evidence-author]": item.author,
      "[data-vehicle-evidence-note]": item.note,
      "[data-vehicle-evidence-sync]": item.sync
    };
    Object.keys(values).forEach(function (selector) {
      var node = $(selector, detail);
      if (node) node.textContent = values[selector] || "No informado";
    });
    var status = $("[data-vehicle-evidence-status]", detail);
    status.className = "sial-pill " + (item.type || "info");
    status.textContent = item.status;
    detail.hidden = false;
    if (window.SialMobileUI && window.SialMobileUI.mountModalLayer) {
      window.SialMobileUI.mountModalLayer(detail, {
        panel: $(".vehicle-evidence-detail-sheet", detail),
        initialFocus: "[data-vehicle-evidence-close]",
        trigger: button,
        onEscape: closeEvidenceDetail
      });
    }
  }

  function applyUrlContext() {
    var params = new URLSearchParams(window.location.search);
    var vehicle = (params.get("vehicle") || "").trim().toUpperCase();
    pendingDetailId = params.get("detail") || "";
    if (!vehicle) return;
    $("[data-vehicle-search]").value = vehicle;
    $("[data-vehicle-week]").value = "all";
    $("[data-vehicle-status]").value = "all";
  }

  function clearFilters() {
    $("[data-vehicle-search]").value = "";
    $("[data-vehicle-week]").value = weekAtOffset(0);
    $("[data-vehicle-status]").value = "all";
    render();
    pendingDetailId = "";
    window.history.replaceState(window.history.state, document.title, window.location.pathname);
  }

  function load() {
    setViewState("loading");
    window.setTimeout(function () {
      var forcedState = new URLSearchParams(window.location.search).get("state");
      if (forcedState === "error" && !retryRequested) {
        setViewState("error");
        $("[data-vehicle-summary]").textContent = "Consulta no disponible";
        return;
      }
      vehicles = forcedState === "empty" && !retryRequested ? [] : readVehicles();
      render();
      if (pendingDetailId) {
        var detailId = pendingDetailId;
        pendingDetailId = "";
        window.setTimeout(function () { openDetail(detailId); }, 40);
      }
    }, 320);
  }

  function bindEvents() {
    $("[data-vehicle-search]").addEventListener("input", render);
    $("[data-vehicle-week]").addEventListener("change", render);
    $("[data-vehicle-status]").addEventListener("change", render);
    $("[data-vehicle-clear]").addEventListener("click", clearFilters);
    $("[data-vehicle-retry]").addEventListener("click", function () {
      retryRequested = true;
      load();
    });
    $("[data-vehicle-list]").addEventListener("click", function (event) {
      var item = event.target.closest("[data-vehicle-id]");
      if (item) openDetail(item.getAttribute("data-vehicle-id"));
    });
    document.addEventListener("click", function (event) {
      var evidence = event.target.closest("[data-open-vehicle-evidence]");
      if (evidence) {
        event.preventDefault();
        event.stopPropagation();
        openEvidenceDetail(evidence);
        return;
      }
      if (event.target.closest("[data-vehicle-evidence-close]")) closeEvidenceDetail();
    });
  }

  function init() {
    var farm = activeFarm();
    $("[data-vehicle-context-farm]").textContent = farm.code + " · " + farm.name;
    populateWeeks();
    applyUrlContext();
    bindEvents();
    load();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
