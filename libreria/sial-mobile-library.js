(function () {
  function uiReady() {
    return window.SialMobileUI;
  }

  function installToastDemo() {
    const card = document.querySelector('[data-library-section="feedback"] [data-library-toast]')?.closest("article");
    if (!card) return;
    card.classList.add("library-toast-demo");
    card.innerHTML = [
      '<h3>Toast · feedback temporal</h3>',
      '<p class="library-muted">Cuatro tonos de la librería móvil. Aparecen sin bloquear la tarea y se retiran automáticamente; un error que exige corrección también debe quedar junto al campo.</p>',
      '<div class="library-toast-actions" aria-label="Variantes de toast">',
      '<button class="sial-btn sial-btn-secondary" type="button" data-library-toast-tone="info">Información</button>',
      '<button class="sial-btn sial-btn-secondary" type="button" data-library-toast-tone="success">Éxito</button>',
      '<button class="sial-btn sial-btn-secondary" type="button" data-library-toast-tone="warning">Advertencia</button>',
      '<button class="sial-btn sial-btn-secondary" type="button" data-library-toast-tone="error">Error</button>',
      '</div>',
      '<div class="library-toast-actions" aria-label="Interacciones de toast">',
      '<button class="sial-btn sial-btn-ghost" type="button" data-library-toast-top>Mostrar arriba</button>',
      '<button class="sial-btn sial-btn-ghost" type="button" data-library-toast-action>Con acción</button>',
      '<button class="sial-btn sial-btn-ghost" type="button" data-library-toast-stack>Apilar</button>',
      '<button class="sial-btn sial-btn-ghost" type="button" data-library-toast-hide>Ocultar</button>',
      '</div>',
      '<code>Toast / ToastProvider / useToast → SialMobileUI.showToast({ tone, title, message, action, duration, placement, offset })</code>'
    ].join("");
  }

  function activateBarcodeScannerPanels() {
    document.querySelectorAll(".sial-scan-panel").forEach((panel) => {
      panel.setAttribute("role", "button");
      panel.setAttribute("tabindex", "0");
      panel.setAttribute("aria-label", "Probar escaner compartido");
      panel.dataset.libraryBarcodeScanner = "";
      if (!panel.querySelector("code")) {
        panel.insertAdjacentHTML("beforeend", "<code>SialMobileUI.openBarcodeScanner({ onDetected })</code>");
      }
    });
  }

  function installAlertSystemDemo() {
    const grid = document.querySelector('[data-library-section="feedback"] .library-preview-grid');
    if (!grid || grid.querySelector("[data-library-alert-system]")) return;
    const article = document.createElement("article");
    article.className = "sial-card sial-card-pad library-demo-card library-alert-system";
    article.dataset.libraryAlertSystem = "";
    article.innerHTML = [
      '<div class="library-alert-system-head">',
      '<div><span class="sial-pill">Patron principal</span><h3>Alertas SIAL</h3></div>',
      '<p class="library-muted">La tarjeta contextual informa dentro del flujo. La hoja inferior se reserva para decisiones que requieren una accion.</p>',
      '</div>',
      '<div class="library-alert-variant-grid" data-library-alert-variants></div>',
      '<div class="library-alert-actions">',
      '<button class="sial-btn sial-btn-secondary" type="button" data-library-decision-alert data-alert-type="warning">Ver decision de advertencia</button>',
      '<button class="sial-btn sial-btn-primary" type="button" data-library-decision-alert data-alert-type="error">Ver decision de error</button>',
      '</div>',
      '<code>SialMobileUI.setInlineStatus(...) + SialMobileUI.openDecisionSheet(...)</code>'
    ].join("");
    grid.prepend(article);

    const variants = [
      { type: "info", title: "Informaci\u00f3n de la operaci\u00f3n", message: "Dato relevante para continuar, sin bloquear la tarea." },
      { type: "success", title: "Registro completado", message: "La operaci\u00f3n qued\u00f3 guardada correctamente." },
      { type: "warning", title: "Revisi\u00f3n necesaria", message: "Verifica la informaci\u00f3n antes de continuar." },
      { type: "error", title: "No fue posible guardar", message: "Corrige los datos indicados e intenta nuevamente." }
    ];
    const variantGrid = article.querySelector("[data-library-alert-variants]");
    variants.forEach((variant) => {
      const node = document.createElement("div");
      variantGrid.appendChild(node);
      window.SialMobileUI.setInlineStatus(node, variant);
    });
  }

  function installMotionMap() {
    const shell = document.querySelector(".library-shell");
    const catalog = window.SialMobileUI && window.SialMobileUI.motionApplications;
    if (!shell || !catalog || shell.querySelector("[data-library-section=movimiento]")) return;

    const section = document.createElement("section");
    section.id = "movimiento";
    section.className = "library-section";
    section.dataset.librarySection = "movimiento";
    section.innerHTML = [
      '<div class="library-section-head">',
      '<h2>Movimiento y aplicacion</h2>',
      '<p>Mapa compartido de transiciones por estado. Cada patron respeta la preferencia de movimiento reducido.</p>',
      '</div>',
      '<div class="library-component-meta" data-library-motion-map></div>'
    ].join("");

    const labels = {
      screen: "Cambio entre vistas",
      press: "Press tactil",
      selection: "Seleccion",
      stateFeedback: "Feedback de estado",
      drawer: "Menu lateral",
      modal: "Modal centrado",
      sheet: "Bottom sheet",
      toast: "Toast y feedback",
      loading: "Carga y sincronizacion",
      brandIntro: "Intro de marca"
    };
    const map = section.querySelector("[data-library-motion-map]");
    Object.entries(catalog).forEach(([key, item]) => {
      const row = document.createElement("div");
      row.className = "library-component-row";
      const label = document.createElement("strong");
      const purpose = document.createElement("span");
      const timing = document.createElement("code");
      label.textContent = labels[key] || key;
      purpose.textContent = item.purpose;
      timing.textContent = item.enter + " -> " + item.exit;
      row.append(label, purpose, timing);
      map.appendChild(row);
    });
    shell.appendChild(section);

    const jump = document.querySelector(".library-jump");
    if (jump && !jump.querySelector('a[href="#movimiento"]')) {
      const link = document.createElement("a");
      link.href = "#movimiento";
      link.textContent = "Movimiento";
      jump.appendChild(link);
    }
  }

  function installTimePickerDemo() {
    const grid = document.querySelector('[data-library-section="formularios"] .library-preview-grid');
    if (!grid || grid.querySelector("[data-library-time-picker]")) return;
    const article = document.createElement("article");
    article.className = "sial-card sial-card-pad library-demo-card";
    article.dataset.libraryTimePicker = "";
    article.innerHTML = [
      "<h3>Selector de hora</h3>",
      '<p class="library-muted">Captura táctil en formato de 24 horas, con acceso rápido a la hora actual y confirmación explícita.</p>',
      '<div class="sial-field"><label class="sial-label" for="library-time-picker">Hora de inicio</label>',
      '<input class="sial-input-wrap sial-input" id="library-time-picker" name="horaDemo" type="time" value="08:20"></div>',
      "<code>SialMobileUI.openTimePicker({ target, title })</code>"
    ].join("");
    grid.appendChild(article);
    window.SialMobileUI.mountTimePickers(article);
  }

  function appendJumpLink(section, label) {
    const jump = document.querySelector(".library-jump");
    if (!jump || jump.querySelector(`a[href="#${section.id}"]`)) return;
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = label;
    jump.appendChild(link);
  }

  function installOperationalPatterns() {
    const shell = document.querySelector(".library-shell");
    if (!shell || shell.querySelector('[data-library-section="patrones-operativos"]')) return;
    const section = document.createElement("section");
    section.id = "patrones-operativos";
    section.className = "library-section";
    section.dataset.librarySection = "patrones-operativos";
    section.innerHTML = [
      '<div class="library-section-head">',
      '<h2>Patrones operativos integrados</h2>',
      '<p>Composiciones reutilizables para jornada, consultas, prioridades, evidencias y firma.</p>',
      '</div>',
      '<div class="library-preview-grid">',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<div class="library-operational-heading"><div><span class="sial-pill info">Operacion activa</span><h3>EXP-2026-0418</h3></div><span class="sial-pill warning">Pendiente</span></div>',
      '<div class="sial-list-row"><strong>Contenedor</strong><span>SIALU1234567</span></div>',
      '<div class="sial-list-row"><strong>Vehiculo</strong><span>TUL458</span></div>',
      '<a class="sial-priority-item" href="#patrones-operativos"><span class="sial-priority-dot"></span><span class="sial-priority-copy"><strong>Continuar inspeccion</strong><span>Siguiente accion permitida por trazabilidad.</span></span></a>',
      '<code>.sial-card + .sial-list-row + .sial-priority-item</code>',
      '</article>',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<h3>Resultado de consulta</h3>',
      '<div class="sial-field"><label class="sial-label" for="library-query">Busqueda operativa</label><input id="library-query" class="sial-input" type="search" value="SIALU1234567"></div>',
      '<div class="library-query-result"><div><strong>SIALU1234567</strong><span>Finca Santa Isabel · Semana 34</span></div><span class="sial-pill success">Vigente</span></div>',
      '<code>Campo de busqueda + resultado + estado semantico</code>',
      '</article>',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<div class="sial-operation-ticket"><div><span class="sial-pill info">Operación activa</span><h3>HU342 · Descargar</h3></div><span class="sial-pill warning">Paso 1 de 3</span></div>',
      '<nav class="sial-flow-stepper" aria-label="Ejemplo de flujo secuencial"><span class="is-active"><b>1</b><small>Descargar</small></span><i aria-hidden="true"></i><span><b>2</b><small>Rearmar</small></span><i aria-hidden="true"></i><span><b>3</b><small>Consolidar</small></span></nav>',
      '<button class="sial-selectable-row" type="button" aria-pressed="true"><span class="sial-pill">✓</span><span><strong>SSCC 177012345678900019</strong><small>Pallet apto · 48 cajas</small></span><span class="sial-pill success">Listo</span></button>',
      '<code>.sial-operation-ticket + .sial-flow-stepper + .sial-selectable-row</code>',
      '</article>',
      '<article class="sial-card sial-card-pad library-demo-card library-integrated-capture" data-library-integrated-capture>',
      '<div class="library-operational-heading"><div><span class="sial-pill">Captura critica</span><h3>Evidencias y firma</h3></div><span class="sial-pill error" data-library-evidence-state>Incompleto</span></div>',
      '<div class="sial-evidence-progress" data-library-evidence-progress><div class="sial-evidence-progress-bar"><div class="sial-evidence-progress-fill"></div></div><span data-evidence-progress-label></span></div>',
      '<div class="library-counter-actions"><button class="sial-btn sial-btn-secondary" type="button" data-library-evidence-remove>Quitar</button><button class="sial-btn sial-btn-primary" type="button" data-library-evidence-add>Agregar evidencia</button></div>',
      '<div data-library-signature></div>',
      '<code>SialMobileUI.setEvidenceProgress + SialMobileUI.mountSignaturePad</code>',
      '</article>',
      '</div>'
    ].join("");
    shell.appendChild(section);
    appendJumpLink(section, "Operativos");

    const progress = section.querySelector("[data-library-evidence-progress]");
    progress.dataset.count = "2";
    window.SialMobileUI.setEvidenceProgress(progress, { count: 2, min: 3, max: 5 });
    window.SialMobileUI.mountSignaturePad(section.querySelector("[data-library-signature]"), {
      label: "Firma de conformidad del responsable",
      trackUnsavedChanges: false,
      onConfirm() {
        window.SialMobileUI.showToast({ type: "success", title: "Firma confirmada", message: "La firma queda lista para asociarse al registro." });
      }
    });
  }

  function installHu758ComponentCatalog() {
    const shell = document.querySelector(".library-shell");
    if (!shell || shell.querySelector('[data-library-section="hu758-componentes"]')) return;
    const section = document.createElement("section");
    section.id = "hu758-componentes";
    section.className = "library-section library-hu758-section";
    section.dataset.librarySection = "hu758-componentes";
    section.innerHTML = [
      '<div class="library-section-head">',
      '<h2>Componentes promovidos · HU758</h2>',
      '<p>Catálogo visual de los componentes calibrados en Recepción en ZE antes de reutilizarlos en nuevas vistas.</p>',
      '</div>',
      '<div class="library-preview-grid">',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<div class="library-hu758-section-heading">',
      '<span class="library-hu758-section-icon" aria-hidden="true"><svg class="sial-icon" viewBox="0 0 24 24"><path d="M3 6h11v10H3z"></path><path d="M14 10h4l3 3v3h-7z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg></span>',
      '<div><h3>Datos del vehículo y operación</h3><p class="library-muted">Encabezado de sección con icono identificador.</p></div>',
      '</div>',
      '<code>.sial-section-heading + .sial-section-icon</code>',
      '</article>',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<div class="library-hu758-ticket"><div><span>Operación</span><strong>EXP-2026-0418</strong></div><div><span>Contenedor</span><strong>SIALU1234567</strong></div></div>',
      '<p class="library-muted">Resumen operativo plano con los datos respaldados por la vista, sin contexto redundante.</p>',
      '<code>.sial-operation-ticket</code>',
      '</article>',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<div class="library-hu758-fields">',
      '<div><label class="sial-label" for="library-hu758-zone">Zona externa</label><div class="library-hu758-select"><button id="library-hu758-zone" type="button" aria-expanded="false" data-hu758-demo-select>ZE Puerto Norte <span>⌄</span></button><div class="library-hu758-menu" data-hu758-demo-menu hidden><button type="button" data-hu758-demo-option="ZE Puerto Norte">ZE Puerto Norte</button><button type="button" data-hu758-demo-option="ZE Terminal Sur">ZE Terminal Sur</button><button type="button" data-hu758-demo-option="ZE Bananera">ZE Bananera</button></div></div></div>',
      '<div><label class="sial-label">Fecha y hora</label><div class="library-hu758-date"><button type="button" data-hu758-week-prev aria-label="Semana anterior">‹</button><strong data-hu758-week-label>4 – 10 de mayo de 2026</strong><button type="button" data-hu758-week-next aria-label="Semana siguiente">›</button></div><div class="library-hu758-week-days"><span>lu 4</span><span class="is-selected">ma 5</span><span>mi 6</span><span>ju 7</span><span>vi 8</span><span>sá 9</span><span>do 10</span></div></div>',
      '</div>',
      '<code>.sial-select-control + .sial-datetime-control · semana navegable</code>',
      '</article>',
      '<article class="sial-card sial-card-pad library-demo-card">',
      '<div class="library-hu758-confirmation"><p>Confirma que los datos y la evidencia son correctos antes de registrar.</p><button class="sial-btn sial-btn-primary sial-btn-full" type="button">Registrar recepción</button></div>',
      '<p class="library-muted">Bloque hermano al final del formulario; no es una card anidada.</p>',
      '<code>form → .sial-confirmation-card → button[form=&quot;...&quot;]</code>',
      '</article>',
      '</div>',
      '<div class="library-spec"><strong>Regla de promoción</strong><p>Reutilizar estos patrones cuando exista la misma jerarquía de captura operativa. Mantener el contenido y los estados en la vista consumidora; no copiar estilos locales.</p></div>'
    ].join("");
    shell.appendChild(section);
    appendJumpLink(section, "HU758");
    if (window.location.hash === "#hu758-componentes") window.setTimeout(() => section.scrollIntoView({ block: "start" }), 0);

    const menu = section.querySelector("[data-hu758-demo-menu]");
    const trigger = section.querySelector("[data-hu758-demo-select]");
    trigger?.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    });
    section.querySelectorAll("[data-hu758-demo-option]").forEach((option) => option.addEventListener("click", () => {
      trigger.childNodes[0].textContent = option.dataset.hu758DemoOption + " ";
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }));

    const labels = ["4 – 10 de mayo de 2026", "11 – 17 de mayo de 2026", "18 – 24 de mayo de 2026"];
    let week = 0;
    const weekLabel = section.querySelector("[data-hu758-week-label]");
    const renderWeek = () => { weekLabel.textContent = labels[week]; };
    section.querySelector("[data-hu758-week-prev]")?.addEventListener("click", () => { week = Math.max(0, week - 1); renderWeek(); });
    section.querySelector("[data-hu758-week-next]")?.addEventListener("click", () => { week = Math.min(labels.length - 1, week + 1); renderWeek(); });
  }

  function installApiReference() {
    const shell = document.querySelector(".library-shell");
    if (!shell || shell.querySelector('[data-library-section="api-integrada"]') || !uiReady()) return;
    const section = document.createElement("section");
    section.id = "api-integrada";
    section.className = "library-section";
    section.dataset.librarySection = "api-integrada";
    const descriptions = {
      openPhotoCapture: "Captura guiada de una o varias evidencias",
      openCamera: "Compatibilidad con captura fotografica simple",
      openBarcodeScanner: "Escaner con validacion y alternativa manual",
      closeBarcodeScanner: "Cierre controlado del escaner",
      normalizeSscc: "Normalizacion compartida de codigos SSCC",
      setTheme: "Tema claro u oscuro persistente",
      mountTabs: "Tabs accesibles con teclado y paneles asociados",
      mountSegmentedControls: "Seleccion exclusiva dentro del mismo contexto",
      mountOtpGroups: "OTP numerico con pegado y avance de foco",
      mountSignaturePad: "Firma tactil con limpiar y confirmar",
      setEvidenceProgress: "Progreso y rango valido de evidencias",
      setSyncState: "Estado visual y accesible de sincronizacion",
      openTimePicker: "Selector tactil de hora en formato 24 horas",
      mountTimePickers: "Activacion progresiva de campos de hora",
      openMobilePicker: "Selector contextual con busqueda opcional",
      showToast: "Confirmacion temporal no bloqueante",
      setInlineStatus: "Feedback contextual junto al dato corregible",
      revealValidationError: "Revela, desplaza y enfoca un error",
      showBanner: "Estado global persistente con accion opcional",
      openDialog: "Modal o bottom sheet accesible",
      openDecisionSheet: "Decision contextual con jerarquia semantica",
      mountModalLayer: "Gestion de foco y apilamiento de capas",
      navigateTo: "Navegacion animada con proteccion de cambios",
      markUnsavedChanges: "Registro de cambios pendientes",
      ensureGlobalDrawer: "Menu lateral global y buscable",
      selectedContext: "Lectura del contexto operativo activo",
      selectedCompany: "Lectura de la empresa activa",
      requestSignOut: "Confirmacion y cierre de sesion"
    };
    const aliases = {
      clearInlineStatus: "Limpieza del feedback contextual",
      hideBanner: "Retiro de un banner por identificador",
      closeDialog: "Cierre programatico de una capa",
      unmountModalLayer: "Desmontaje y retorno de foco",
      replayMotionState: "Reproduccion accesible de un estado animado",
      clearUnsavedChanges: "Limpieza de cambios pendientes",
      hasUnsavedChanges: "Consulta de cambios pendientes",
      openDrawer: "Apertura programatica del drawer",
      closeDrawer: "Cierre programatico del drawer",
      setSelectedContext: "Persistencia del contexto operativo",
      setSelectedCompany: "Persistencia de la empresa activa",
      clearSelectedCompany: "Limpieza de empresa activa",
      clearSelectedContext: "Limpieza de contexto activo",
      ensureHeaderSessionAction: "Accion de sesion consistente en headers",
      hydrateAlertStatuses: "Semantica y accesibilidad de alertas existentes",
      playLogoIntro: "Intro de marca respetando movimiento reducido",
      setTimePickerValue: "Actualizacion consistente de un campo de hora",
      motionApplications: "Mapa de duraciones por interaccion"
    };
    const api = Object.keys(window.SialMobileUI).sort();
    section.innerHTML = '<div class="library-section-head"><h2>API integrada</h2><p>Inventario vivo de la superficie publica compartida. Si una capacidad aparece aqui, las vistas deben consumirla antes de crear una variante local.</p></div><div class="library-component-meta" data-library-api-map></div>';
    const map = section.querySelector("[data-library-api-map]");
    api.forEach((name) => {
      const row = document.createElement("div");
      row.className = "library-component-row";
      const method = document.createElement("strong");
      const purpose = document.createElement("span");
      const reference = document.createElement("code");
      method.textContent = name;
      purpose.textContent = descriptions[name] || aliases[name] || "Capacidad compartida del nucleo movil";
      reference.textContent = `SialMobileUI.${name}`;
      row.append(method, purpose, reference);
      map.appendChild(row);
    });
    shell.appendChild(section);
    appendJumpLink(section, "API");
  }

  function installRecoveryFlowDemo() {
    const section = document.querySelector('[data-library-section="autenticacion"]');
    const grid = section?.querySelector(".library-preview-grid");
    if (!grid || grid.querySelector("[data-library-recovery-functional]")) return;
    const article = document.createElement("article");
    article.className = "sial-card sial-card-pad library-demo-card";
    article.dataset.libraryRecoveryFunctional = "";
    article.innerHTML = '<span class="sial-pill">Flujo integrado</span><h3>Recuperacion completa</h3><p class="library-muted">Demuestra usuario, OTP y nueva contrasena dentro de una sola capa accesible.</p><button class="sial-btn sial-btn-primary" type="button" data-library-open-recovery>Probar recuperacion</button><code>Usuario -> OTP -> nueva contrasena</code>';
    grid.appendChild(article);
  }

  function createRecoveryDemoContent() {
    const shell = document.createElement("div");
    shell.className = "sial-recovery-flow library-recovery-demo";
    let step = "user";
    let user = "operador.sial";

    function statusNode() {
      const status = document.createElement("div");
      status.className = "sial-status error";
      status.hidden = true;
      return status;
    }

    function render() {
      const steps = ["user", "code", "password"];
      const current = steps.indexOf(step);
      shell.innerHTML = '<ol class="sial-recovery-steps">' + steps.map((name, index) => `<li class="sial-recovery-step ${index < current ? "is-done" : ""} ${index === current ? "is-current" : ""}" ${index === current ? 'aria-current="step"' : ""}><span>${index + 1}</span><strong>${({ user: "Usuario", code: "Codigo", password: "Contrasena" })[name]}</strong></li>`).join("") + '</ol><div data-library-recovery-body></div>';
      const body = shell.querySelector("[data-library-recovery-body]");
      if (step === "user") {
        body.innerHTML = '<form class="sial-form"><label class="sial-field"><span class="sial-label">Usuario</span><input class="sial-input" name="libraryRecoveryUser" autocomplete="username" value="' + user + '" required></label><div class="sial-status error" data-recovery-demo-status hidden></div><button class="sial-btn sial-btn-primary sial-btn-full" type="submit">Enviar codigo</button></form>';
        body.querySelector("form").addEventListener("submit", (event) => {
          event.preventDefault();
          const input = body.querySelector("input");
          const value = input.value.trim();
          if (!value) {
            window.SialMobileUI.setInlineStatus(body.querySelector("[data-recovery-demo-status]"), { type: "error", title: "Dato requerido", message: "Ingresa el usuario para continuar.", field: input });
            return;
          }
          user = value;
          step = "code";
          render();
        });
      }
      if (step === "code") {
        body.innerHTML = '<form class="sial-form"><p class="library-muted">Codigo enviado para ' + user + '.</p><div class="sial-otp-group" aria-label="Codigo de seguridad"><input class="sial-otp-input" inputmode="numeric" autocomplete="one-time-code"><input class="sial-otp-input" inputmode="numeric"><input class="sial-otp-input" inputmode="numeric"><input class="sial-otp-input" inputmode="numeric"><input class="sial-otp-input" inputmode="numeric"><input class="sial-otp-input" inputmode="numeric"></div><div class="sial-status error" data-recovery-demo-status hidden></div><button class="sial-btn sial-btn-primary sial-btn-full" type="submit">Verificar codigo</button></form>';
        const form = body.querySelector("form");
        const group = form.querySelector(".sial-otp-group");
        window.SialMobileUI.mountOtpGroups(form);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const value = Array.from(group.querySelectorAll("input")).map((input) => input.value).join("");
          if (value.length !== 6) {
            window.SialMobileUI.setInlineStatus(form.querySelector("[data-recovery-demo-status]"), { type: "error", title: "Codigo incompleto", message: "Ingresa los 6 digitos para continuar.", field: group.querySelector("input:placeholder-shown") || group.querySelector("input") });
            return;
          }
          step = "password";
          render();
        });
      }
      if (step === "password") {
        body.innerHTML = '<form class="sial-form"><label class="sial-field"><span class="sial-label">Nueva contrasena</span><input class="sial-input" name="libraryPassword" type="password" autocomplete="new-password" minlength="8" required></label><label class="sial-field"><span class="sial-label">Confirmar contrasena</span><input class="sial-input" name="libraryPasswordConfirm" type="password" autocomplete="new-password" minlength="8" required></label><div class="sial-status error" data-recovery-demo-status hidden></div><button class="sial-btn sial-btn-primary sial-btn-full" type="submit">Guardar contrasena</button></form>';
        const form = body.querySelector("form");
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const password = form.elements.libraryPassword;
          const confirmation = form.elements.libraryPasswordConfirm;
          if (password.value.length < 8 || password.value !== confirmation.value) {
            window.SialMobileUI.setInlineStatus(form.querySelector("[data-recovery-demo-status]"), { type: "error", title: "Verifica la contrasena", message: "Usa minimo 8 caracteres y confirma el mismo valor.", field: password.value.length < 8 ? password : confirmation });
            return;
          }
          window.SialMobileUI.showToast({ type: "success", title: "Acceso restablecido", message: "El flujo completo finalizo correctamente." });
          window.SialMobileUI.closeDialog("library-recovery-flow");
        });
      }
    }
    render();
    return shell;
  }

  function installSyncInteraction() {
    const stack = document.querySelector('[data-library-section="offline-sync"] .sial-sync-stack');
    const item = stack?.querySelector(".sial-sync-item.error");
    if (!item || item.dataset.librarySyncMounted === "true") return;
    item.dataset.librarySyncMounted = "true";
    item.querySelector("strong")?.setAttribute("data-sync-title", "");
    item.querySelector("span:not(.sial-pill)")?.setAttribute("data-sync-message", "");
    const button = item.querySelector("button");
    if (button) {
      button.dataset.librarySyncRetry = "";
      button.setAttribute("data-sync-status", "");
    }
  }

  function initializeLibraryDemos() {
    activateBarcodeScannerPanels();
    if (uiReady()) installToastDemo();
    if (uiReady()) installAlertSystemDemo();
    if (uiReady()) installMotionMap();
    if (uiReady()) installTimePickerDemo();
    if (uiReady()) installOperationalPatterns();
    installHu758ComponentCatalog();
    if (uiReady()) installApiReference();
    if (uiReady()) installRecoveryFlowDemo();
    if (uiReady()) installSyncInteraction();
    if (uiReady()) window.SialMobileUI.mountTabs(document);
    if (uiReady()) window.SialMobileUI.mountSegmentedControls(document);
    if (uiReady()) window.SialMobileUI.mountOtpGroups(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLibraryDemos);
  } else {
    initializeLibraryDemos();
  }

  document.addEventListener("keydown", (event) => {
    const panel = event.target.closest("[data-library-barcode-scanner]");
    if (!panel || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    panel.click();
  });

  document.addEventListener("click", (event) => {
    const evidenceButton = event.target.closest("[data-library-evidence-add], [data-library-evidence-remove]");
    if (evidenceButton && uiReady()) {
      const progress = document.querySelector("[data-library-evidence-progress]");
      const current = Number(progress?.dataset.count || 0);
      const delta = evidenceButton.hasAttribute("data-library-evidence-add") ? 1 : -1;
      const count = Math.max(0, Math.min(5, current + delta));
      progress.dataset.count = String(count);
      const result = window.SialMobileUI.setEvidenceProgress(progress, { count, min: 3, max: 5 });
      const state = document.querySelector("[data-library-evidence-state]");
      if (state) {
        state.textContent = result.complete ? "Completo" : "Incompleto";
        state.classList.toggle("error", !result.complete);
        state.classList.toggle("success", result.complete);
      }
    }

    if (event.target.closest("[data-library-open-recovery]") && uiReady()) {
      window.SialMobileUI.openDialog({
        id: "library-recovery-flow",
        variant: "sheet",
        title: "Recuperar acceso",
        content: createRecoveryDemoContent(),
        actions: []
      });
    }

    const syncRetry = event.target.closest("[data-library-sync-retry]");
    if (syncRetry && uiReady()) {
      const item = syncRetry.closest(".sial-sync-item");
      window.SialMobileUI.setSyncState(item, { state: "syncing", title: "Sincronizando", message: "Enviando registro pendiente", label: "En proceso" });
      syncRetry.disabled = true;
      window.setTimeout(() => {
        window.SialMobileUI.setSyncState(item, { state: "success", title: "Sincronizado", message: "Confirmado por el servicio", label: "OK" });
        syncRetry.disabled = false;
      }, 900);
    }

    const toastTone = event.target.closest("[data-library-toast-tone]");
    if (toastTone && uiReady()) {
      const tone = toastTone.dataset.libraryToastTone;
      const labels = { info: "Información disponible", success: "Registro guardado", warning: "Revisión necesaria", error: "No se pudo completar" };
      const messages = { info: "Puedes continuar con la consulta.", success: "Los cambios quedaron registrados.", warning: "Verifica los datos antes de continuar.", error: "Consulta el error junto al campo e inténtalo de nuevo." };
      window.SialMobileUI.showToast({ tone, title: labels[tone], message: messages[tone] });
    }
    if (event.target.closest("[data-library-toast-top]") && uiReady()) {
      window.SialMobileUI.showToast({ tone: "info", title: "Aviso superior", message: "El host también admite posición superior.", placement: "top", offset: 20 });
    }
    if (event.target.closest("[data-library-toast-action]") && uiReady()) {
      window.SialMobileUI.showToast({ tone: "warning", title: "Cambio pendiente", message: "Puedes deshacer esta acción.", duration: 5500, action: { label: "Deshacer", dismiss: true, onClick: function() { window.SialMobileUI.showToast({ tone: "info", title: "Cambio deshecho" }); } } });
    }
    if (event.target.closest("[data-library-toast-stack]") && uiReady()) {
      window.SialMobileUI.showToast({ tone: "success", title: "Primera confirmación" });
      window.SialMobileUI.showToast({ tone: "info", title: "Segunda notificación", message: "Ambas permanecen visibles temporalmente." });
    }
    if (event.target.closest("[data-library-toast-hide]") && uiReady()) window.SialMobileUI.hideToast();

    if (event.target.closest("[data-library-banner]") && uiReady()) {
      window.SialMobileUI.showBanner({
        id: "library-offline",
        type: "warning",
        title: "Banner persistente",
        message: "Estado global visible hasta que cambie la condicion.",
        action: {
          label: "Reintentar",
          dismiss: false,
          onClick: function() {
            window.SialMobileUI.showToast({ type: "info", title: "Reintento iniciado", message: "La accion permanece visible mientras se procesa." });
          }
        }
      });
    }

    if (event.target.closest("[data-library-inline-trigger]") && uiReady()) {
      const target = document.querySelector("[data-library-inline]");
      window.SialMobileUI.setInlineStatus(target, {
        type: "warning",
        title: "Alerta inline",
        message: "Validacion asociada al bloque donde se origina."
      });
    }

    if (event.target.closest("[data-library-logo-intro]") && uiReady()) {
      window.SialMobileUI.playLogoIntro({
        logoSrc: "../assets/brand/isotipo-sial.svg",
        title: "SIAL",
        caption: "Sistema de Informacion Agrologistico",
        duration: 2200,
        reducedDuration: 980
      });
      return;
    }

    const photoCapture = event.target.closest("[data-library-photo-capture]");
    if (photoCapture && uiReady()) {
      const capture = window.SialMobileUI.openPhotoCapture || window.SialMobileUI.openCamera;
      if (!capture) return;
      const steps = [
        { title: "Documentos del vehiculo", pointKey: "documentos-vehiculo" },
        { title: "Frontal del vehiculo", pointKey: "frontal-vehiculo" },
        { title: "Placa del remolque", pointKey: "placa-remolque" }
      ];
      capture({
        title: steps[0].title,
        eventName: "libraryPhotoCapture",
        allowMultiple: true,
        maxPhotos: steps.length,
        steps,
        onPhoto(photo) {
          photoCapture.dataset.lastPoint = photo.pointKey || "";
        },
        onComplete(photos) {
          if (!photos || !photos.length) return;
          const photo = photos[photos.length - 1];
          photoCapture.classList.add("is-captured");
          const previousPreview = photoCapture.querySelector(":scope > img");
          if (previousPreview) previousPreview.remove();
          const preview = document.createElement("img");
          preview.src = photo.dataUrl;
          preview.alt = "Preview de captura fotografica";
          preview.loading = "lazy";
          photoCapture.insertBefore(preview, photoCapture.firstChild);
          const badge = photoCapture.querySelector(".library-capture-heading .sial-pill");
          const description = photoCapture.querySelector(".library-capture-description");
          if (badge) badge.textContent = photos.length + " foto(s)";
          if (description) description.textContent = "Secuencia capturada. Toca para reemplazarla.";
          window.SialMobileUI.showToast({
            type: "success",
            title: "Patron de fotos",
            message: "La captura usa la secuencia global reutilizable."
          });
        },
        onCancel() {
          window.SialMobileUI.showToast({
            type: "info",
            title: "Captura cancelada",
            message: "No se agrego evidencia."
          });
        }
      });
      return;
    }

    const barcodeScanner = event.target.closest("[data-library-barcode-scanner]");
    if (barcodeScanner && uiReady() && typeof window.SialMobileUI.openBarcodeScanner === "function") {
      window.SialMobileUI.openBarcodeScanner({
        title: "Escaner compartido",
        eyebrow: "Patron reutilizable",
        initialManualValue: "177012345678900019",
        manualLabel: "Validar SSCC de ejemplo",
        normalize: window.SialMobileUI.normalizeSscc,
        validate(value) {
          return value.length === 18
            ? { ok: true, value }
            : { ok: false, message: "El ejemplo requiere un SSCC de 18 digitos." };
        },
        onDetected(value) {
          const copy = barcodeScanner.querySelector(".sial-feedback-copy span");
          if (copy) copy.textContent = "Ultima lectura: " + value;
          window.SialMobileUI.showToast({
            type: "success",
            title: "Codigo detectado",
            message: value
          });
        }
      });
      return;
    }

    const picker = event.target.closest("[data-library-picker]");
    if (picker && uiReady()) {
      window.SialMobileUI.openMobilePicker({
        id: "library-picker",
        title: "Selector movil",
        message: "En movil la seleccion se resuelve como accion tactil. El teclado solo aparece si se habilita busqueda.",
        target: "[data-library-picker-value]",
        selectedValue: document.querySelector("[data-library-picker-value]")?.value || "",
        items: [
          { label: "Seleccion activa", value: "Seleccion activa", helper: "Opcion actual" },
          { label: "Opcion operativa", value: "Opcion operativa", helper: "Alternativa disponible" },
          { label: "Opcion restringida", value: "Opcion restringida", helper: "Requiere permisos" }
        ],
        onSelect(item) {
          picker.textContent = item.label;
        }
      });
    }

    if (event.target.closest("[data-library-modal]") && uiReady()) {
      window.SialMobileUI.openDialog({
        id: "library-modal",
        title: "Modal centrado",
        message: "Patron para decisiones criticas que deben bloquear la pantalla.",
        actions: [
          { label: "Cancelar", variant: "secondary" },
          { label: "Confirmar", variant: "primary" }
        ]
      });
    }

    if (event.target.closest("[data-library-sheet]") && uiReady()) {
      window.SialMobileUI.openDialog({
        id: "library-sheet",
        variant: "sheet",
        title: "Bottom sheet",
        message: "Patron contextual para opciones moviles sin cambiar de vista.",
        actions: [
          { label: "Cerrar", variant: "secondary" },
          { label: "Aplicar", variant: "primary" }
        ]
      });
    }

    const decisionTrigger = event.target.closest("[data-library-decision-alert]");
    if (decisionTrigger && uiReady() && typeof window.SialMobileUI.openDecisionSheet === "function") {
      const type = decisionTrigger.dataset.alertType || "warning";
      const isError = type === "error";
      window.SialMobileUI.openDecisionSheet({
        id: "library-decision-alert",
        type,
        title: isError ? "No se pudo completar la operaci\u00f3n" : "\u00bfDeseas continuar?",
        message: isError
          ? "Los datos no se guardaron. Revisa la informaci\u00f3n o intenta nuevamente."
          : "Se detect\u00f3 una diferencia en los datos. Puedes volver a revisarlos o continuar bajo tu responsabilidad.",
        actions: [
          { label: "Revisar datos", variant: "secondary" },
          { label: isError ? "Intentar nuevamente" : "Continuar", variant: "primary", initialFocus: true }
        ]
      });
    }

    if (event.target.closest("[data-library-reset]") && uiReady()) {
      window.SialMobileUI.hideBanner("library-offline");
      window.SialMobileUI.clearInlineStatus("[data-library-inline]");
      window.SialMobileUI.showToast({
        type: "info",
        title: "Estados demo limpiados",
        message: "La libreria mantiene los patrones independientes de las vistas."
      });
    }
  });
})();
