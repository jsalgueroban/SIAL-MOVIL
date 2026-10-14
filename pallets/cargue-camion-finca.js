(() => {
  const trucks = {
    "TRK-421": { driver: "Carlos Méndez", company: "Translogística SAS", farm: "Finca El Retiro", operation: "OP-2026-014", capacity: 6 },
    "CMN-204": { driver: "Ana Lucía Paz", company: "Operador Caribe SAS", farm: "Finca El Retiro", operation: "OP-2026-013", capacity: 8 }
  };
  const state = { truck: "", selected: 1, loaded: new Map(), confirmed: false };
  const $ = (selector) => document.querySelector(selector);
  const grid = $("#truck-grid");
  const sscc = $("#truck-sscc");
  const photo = $("#truck-photo");
  const error = $("#truck-error");
  const dialogFocus = new Map();

  function clearError() { error.hidden = true; error.textContent = ""; sscc.setAttribute("aria-invalid", "false"); photo.setAttribute("aria-invalid", "false"); }
  function fail(message, focus = sscc) { error.textContent = message; error.hidden = false; (focus === sscc ? sscc : photo).setAttribute("aria-invalid", "true"); focus.focus(); }
  function showDialog(id, focus) {
    dialogFocus.set(id, document.activeElement);
    $(id).hidden = false;
    $(".sial-page-header").inert = true;
    $(".truck-body").inert = true;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => $(focus)?.focus());
  }
  function hideDialog(id) {
    $(id).hidden = true;
    $(".sial-page-header").inert = false;
    $(".truck-body").inert = false;
    document.body.style.overflow = "";
    dialogFocus.get(id)?.focus?.();
  }
  function renderTruckOptions() {
    const query = $("#truck-search").value.trim().toLowerCase();
    const options = $("#truck-options");
    options.replaceChildren();
    Object.entries(trucks).filter(([plate]) => plate.toLowerCase().includes(query)).forEach(([plate, truck]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "truck-option";
      button.dataset.truck = plate;
      button.setAttribute("aria-label", `Seleccionar camión ${plate}`);
      const title = document.createElement("strong");
      const detail = document.createElement("span");
      title.textContent = `${plate} · ${truck.capacity} posiciones`;
      detail.textContent = `${truck.driver} · ${truck.company}`;
      button.append(title, detail);
      options.append(button);
    });
    if (!options.children.length) {
      const empty = document.createElement("p");
      empty.className = "truck-options-empty";
      empty.textContent = "No se encontraron camiones con esa placa.";
      options.append(empty);
    }
  }

  function render() {
    const truck = trucks[state.truck];
    $("#truck-empty").hidden = Boolean(truck);
    $("#truck-select").hidden = !truck;
    $("#truck-operation").hidden = !truck;
    $("#truck-state").textContent = truck ? (state.confirmed ? "Cargue revisado" : "En preparación") : "Sin seleccionar";
    $("#truck-loading").hidden = !truck;
    $("#truck-summary").hidden = !truck;
    if (!truck) return;
    $("#truck-plate").textContent = state.truck;
    $("#truck-operation-caption").textContent = truck.operation;
    $("#truck-driver").textContent = truck.driver;
    $("#truck-company").textContent = truck.company;
    $("#truck-farm").textContent = truck.farm;
    grid.replaceChildren();
    for (let position = 1; position <= truck.capacity; position += 1) {
      const item = state.loaded.get(position);
      const button = document.createElement("button");
      button.className = "truck-position";
      button.type = "button";
      button.dataset.position = String(position);
      button.dataset.loaded = String(Boolean(item));
      button.setAttribute("aria-label", `Posición ${position}: ${item ? `pallet ${item.sscc}` : "libre"}`);
      const title = document.createElement("strong");
      title.textContent = `Posición ${position}`;
      const detail = document.createElement("span");
      detail.textContent = item ? `${item.sscc} · evidencia adjunta` : "Libre";
      button.append(title, detail);
      grid.append(button);
    }
    const item = state.loaded.get(state.selected);
    $("#truck-position-number").textContent = String(state.selected);
    $("#truck-position-hint").textContent = item ? "Pallet cargado" : "Libre";
    $("#truck-pallet-form").hidden = Boolean(item) || state.confirmed;
    $("#truck-loaded-detail").hidden = !item;
    $("#truck-loaded-sscc").textContent = item?.sscc ?? "";
    $("#truck-loaded-photo").textContent = item?.photoName ?? "";
    $("#truck-remove").hidden = state.confirmed;
    sscc.value = "";
    photo.value = "";
    $("#truck-photo-name").textContent = "Sin archivo";
    $("#truck-count").textContent = `${state.loaded.size} / ${truck.capacity}`;
    $("#truck-total").textContent = String(state.loaded.size);
    $("#truck-free").textContent = String(truck.capacity - state.loaded.size);
    $("#truck-confirm").disabled = state.confirmed || state.loaded.size === 0;
    $("#truck-summary-state").textContent = state.confirmed ? "Revisado" : "En preparación";
    $("#truck-summary-state").className = `sial-pill ${state.confirmed ? "success" : "warning"}`;
  }

  function selectTruck(plate) {
    if (plate === state.truck) { hideDialog("#truck-picker"); return; }
    state.truck = plate;
    state.selected = 1;
    state.loaded.clear();
    state.confirmed = false;
    $("#truck-result").hidden = true;
    clearError();
    render();
    hideDialog("#truck-picker");
    $("#truck-change").focus();
  }
  $("#truck-open-picker").addEventListener("click", () => showDialog("#truck-picker", "#truck-search"));
  $("#truck-change").addEventListener("click", () => {
    if (!state.loaded.size) { showDialog("#truck-picker", "#truck-search"); return; }
    window.SialMobileUI?.openDialog({
      id: "change-truck-loading",
      role: "alertdialog",
      type: "warning",
      title: "Cambiar camión",
      message: "Los pallets asignados en este cargue de ejemplo se perderán al seleccionar otro camión.",
      actions: [
        { label: "Conservar cargue", variant: "secondary" },
        { label: "Cambiar camión", variant: "primary", onClick: () => showDialog("#truck-picker", "#truck-search") }
      ]
    });
  });
  $("#truck-close-picker").addEventListener("click", () => hideDialog("#truck-picker"));
  $("#truck-close-position").addEventListener("click", () => { hideDialog("#truck-position-dialog"); grid.querySelector(`[data-position="${state.selected}"]`)?.focus(); });
  $("#truck-search").addEventListener("input", renderTruckOptions);
  $("#truck-options").addEventListener("click", (event) => {
    const button = event.target.closest("[data-truck]");
    if (button) selectTruck(button.dataset.truck);
  });
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-position]");
    if (!button) return;
    state.selected = Number(button.dataset.position);
    clearError();
    render();
    showDialog("#truck-position-dialog", state.loaded.has(state.selected) ? "#truck-remove" : "#truck-scan");
  });
  $("#truck-scan").addEventListener("click", () => {
    if (!window.SialMobileUI?.openBarcodeScanner) return fail("El escáner no está disponible. Digita el SSCC manualmente.");
    clearError();
    window.SialMobileUI.openBarcodeScanner({
      title: "Escanear SSCC",
      eyebrow: `Posición ${state.selected} del camión`,
      normalize: (value) => String(value || "").replace(/\s/g, ""),
      validate: (value) => {
        if (!/^\d{18}$/.test(value)) return { ok: false, message: "El SSCC debe tener 18 dígitos." };
        if ([...state.loaded.values()].some((item) => item.sscc === value)) return { ok: false, message: "Este pallet ya ocupa otra posición." };
        return true;
      },
      onDetected: (value) => { sscc.value = value; photo.focus(); }
    });
  });
  $("#truck-photo-trigger").addEventListener("click", () => photo.click());
  photo.addEventListener("change", () => { $("#truck-photo-name").textContent = photo.files?.[0]?.name ?? "Sin archivo"; clearError(); });
  $("#truck-pallet-form").addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();
    const code = sscc.value.replace(/\s/g, "");
    if (!/^\d{18}$/.test(code)) return fail("Escanea o digita un SSCC de 18 dígitos.");
    if ([...state.loaded.values()].some((item) => item.sscc === code)) return fail("Este pallet ya está asignado a otra posición.");
    if (!photo.files?.length) return fail("Adjunta una fotografía de esta posición.", $("#truck-photo-trigger"));
    state.loaded.set(state.selected, { sscc: code, photoName: photo.files[0].name });
    photo.value = "";
    const next = [...grid.querySelectorAll("[data-position]")].map((node) => Number(node.dataset.position)).find((position) => !state.loaded.has(position));
    if (next) state.selected = next;
    render();
    hideDialog("#truck-position-dialog");
  });
  $("#truck-remove").addEventListener("click", () => {
    if (state.confirmed) return;
    state.loaded.delete(state.selected);
    clearError();
    render();
    hideDialog("#truck-position-dialog");
  });
  $("#truck-confirm").addEventListener("click", () => {
    if (!state.loaded.size || state.confirmed) return;
    state.confirmed = true;
    $("#truck-result").textContent = "Cargue revisado en esta propuesta. La confirmación y sincronización reales corresponden a la app móvil.";
    $("#truck-result").hidden = false;
    render();
  });
  ["#truck-picker", "#truck-position-dialog"].forEach((id) => $(id).addEventListener("click", (event) => { if (event.target === $(id)) hideDialog(id); }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      const open = ["#truck-position-dialog", "#truck-picker"].find((id) => !$(id).hidden);
      if (!open) return;
      const focusable = [...$(open).querySelectorAll("button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden])")].filter((element) => element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.key !== "Escape") return;
    if (!$("#truck-position-dialog").hidden) hideDialog("#truck-position-dialog");
    else if (!$("#truck-picker").hidden) hideDialog("#truck-picker");
  });
  renderTruckOptions();
  render();
})();
