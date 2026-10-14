(function () {
  const storageThemeKey = "sial-mobile-theme";
  const contextStorageKey = "sial-mobile-context";
  const companyStorageKey = "sial-mobile-company";
  const navigationMotionKey = "sial-mobile-navigation-direction";
  const navigationHistoryIndexKey = "sial-mobile-navigation-history-index";
  const navigationHistoryStateKey = "sialNavigationIndex";
  const motionApplications = Object.freeze({
    screen: Object.freeze({ enter: "base", exit: "fast", purpose: "Continuidad adelante, atras y restauracion" }),
    press: Object.freeze({ enter: "fast", exit: "fast", purpose: "Confirmacion tactil" }),
    selection: Object.freeze({ enter: "base", exit: "fast", purpose: "Cambio de estado seleccionado" }),
    stateFeedback: Object.freeze({ enter: "base", exit: "fast", purpose: "Confirmacion contextual de estado" }),
    drawer: Object.freeze({ enter: "base", exit: "fast", purpose: "Navegacion lateral" }),
    modal: Object.freeze({ enter: "base", exit: "fast", purpose: "Decision bloqueante" }),
    sheet: Object.freeze({ enter: "base", exit: "fast", purpose: "Decision contextual movil" }),
    toast: Object.freeze({ enter: "base", exit: "fast", purpose: "Confirmacion temporal" }),
    loading: Object.freeze({ enter: "loading", exit: "fast", purpose: "Progreso real" }),
    brandIntro: Object.freeze({ enter: "exception", exit: "slow", purpose: "Acceso inicial solamente" })
  });

  const root = document.documentElement;

  const motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const dialogExitDelay = 180;
  let activeLogoIntroPromise = null;
  let navigationInFlight = false;
  let logoIntroQueued = false;
  let hasPendingUnsavedChanges = false;
  const pendingUnsavedReasons = new Set();
  let pendingNavigationTarget = "";
  const modalLayerStack = [];
  const isolatedBodyChildren = new Map();
  let modalLayerBodyOverflow = "";
  let alertStatusObserver = null;
  let pendingValidationForm = null;
  let validationRedirectTimer = 0;
  let edgeGesture = null;
  let suppressNextEdgeClick = false;
  const drawerEdgeStartWidth = 40;
  const drawerGestureOpenThreshold = 64;
  const drawerGestureVerticalCancel = 42;

  function prefersReducedMotion() {
    return Boolean(motionQuery && motionQuery.matches);
  }

  function normalizeNavigationDirection(direction) {
    if (direction === "back") return "back";
    if (direction === "forward") return "forward";
    return "none";
  }

  function numericNavigationIndex(value) {
    const index = Number(value);
    return Number.isFinite(index) && index >= 0 ? index : null;
  }

  function storedNavigationHistoryIndex() {
    try {
      return numericNavigationIndex(window.sessionStorage.getItem(navigationHistoryIndexKey));
    } catch (_) {
      return null;
    }
  }

  function syncNavigationHistoryIndex() {
    const storedIndex = storedNavigationHistoryIndex();
    const state = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    let currentIndex = numericNavigationIndex(state[navigationHistoryStateKey]);
    if (currentIndex === null) {
      currentIndex = storedIndex === null ? 0 : storedIndex + 1;
      try {
        window.history.replaceState({ ...state, [navigationHistoryStateKey]: currentIndex }, document.title, window.location.href);
      } catch (_) {}
    }

    let direction = "none";
    if (storedIndex !== null && currentIndex < storedIndex) direction = "back";
    if (storedIndex !== null && currentIndex > storedIndex) direction = "forward";
    try {
      window.sessionStorage.setItem(navigationHistoryIndexKey, String(currentIndex));
    } catch (_) {}
    return direction;
  }

  function rememberNavigationDirection(direction) {
    const normalized = normalizeNavigationDirection(direction || "forward");
    root.dataset.sialNavDirection = normalized;
    try {
      window.sessionStorage.setItem(navigationMotionKey, normalized);
    } catch (_) {}
    return normalized;
  }

  function consumeNavigationDirection(fallbackDirection = "none") {
    let direction = normalizeNavigationDirection(fallbackDirection);
    try {
      const storedDirection = window.sessionStorage.getItem(navigationMotionKey);
      if (storedDirection === "forward" || storedDirection === "back") {
        direction = storedDirection;
      }
      window.sessionStorage.removeItem(navigationMotionKey);
    } catch (_) {}
    root.dataset.sialNavDirection = direction;
    return direction;
  }

  function clearNavigationReveal() {
    document.querySelectorAll(".sial-navigation-reveal").forEach((element) => {
      element.classList.remove("sial-navigation-reveal");
      element.style.removeProperty("--sial-motion-order");
    });
  }

  function prepareNavigationReveal() {
    const container = document.querySelector(".sial-page-body, .login-panel, .library-shell");
    if (!container) return;
    clearNavigationReveal();
    Array.from(container.children)
      .filter((element) => element.matches("section, form, article, .sial-card, .sial-surface, [data-motion-surface]"))
      .slice(0, 4)
      .forEach((element, index) => {
        element.classList.add("sial-navigation-reveal");
        element.style.setProperty("--sial-motion-order", String(index));
      });
  }

  function clearScreenMotionState() {
    navigationInFlight = false;
    if (!document.body) return;
    document.body.classList.remove("sial-screen-entering", "sial-screen-exiting");
    document.body.removeAttribute("aria-busy");
    delete document.body.dataset.sialNavigationState;
    clearNavigationReveal();
    document.querySelectorAll(".sial-navigation-source").forEach((element) => {
      element.classList.remove("sial-navigation-source");
    });
  }

  function startScreenEntryMotion(direction = "none") {
    const normalized = normalizeNavigationDirection(direction);
    root.dataset.sialNavDirection = normalized;
    if (!document.body || normalized === "none" || prefersReducedMotion()) return;
    prepareNavigationReveal();
    document.body.classList.remove("sial-screen-exiting");
    document.body.classList.add("sial-screen-entering");
    document.body.dataset.sialNavigationState = "entering";
    window.setTimeout(() => {
      if (!document.body) return;
      document.body.classList.remove("sial-screen-entering");
      clearNavigationReveal();
      delete document.body.dataset.sialNavigationState;
    }, 260);
  }

  function navigationDirectionForAnchor(anchor) {
    if (!anchor) return "forward";
    const explicit = anchor.getAttribute("data-nav-direction");
    if (explicit) return normalizeNavigationDirection(explicit);
    const label = (anchor.getAttribute("aria-label") || anchor.textContent || "").trim();
    return /^(volver|regresar|atrás|atras)$/i.test(label) ? "back" : "forward";
  }

  const initialNavigationDirection = consumeNavigationDirection(syncNavigationHistoryIndex());
  startScreenEntryMotion(initialNavigationDirection);

  function replayMotionState(element, stateClass, duration = 520) {
    const node = resolveElement(element);
    if (!node || !stateClass || prefersReducedMotion()) return;
    node.classList.remove(stateClass);
    window.requestAnimationFrame(() => {
      node.classList.add(stateClass);
    });
    window.setTimeout(() => {
      node.classList.remove(stateClass);
    }, duration);
  }

  function shouldTrackUnsavedChanges() {
    return Boolean(document.querySelector("[data-flow-form]"));
  }

  function markUnsavedChanges(reason = "") {
    if (!shouldTrackUnsavedChanges()) return;
    hasPendingUnsavedChanges = true;
    root.dataset.unsavedChanges = "true";
    if (reason) pendingUnsavedReasons.add(reason);
    if (pendingUnsavedReasons.size && document.body) {
      document.body.dataset.unsavedReason = Array.from(pendingUnsavedReasons).join(",");
    }
  }

  function clearUnsavedChanges() {
    hasPendingUnsavedChanges = false;
    pendingUnsavedReasons.clear();
    pendingNavigationTarget = "";
    delete root.dataset.unsavedChanges;
    if (document.body) delete document.body.dataset.unsavedReason;
  }

  function hasUnsavedChanges() {
    return Boolean(hasPendingUnsavedChanges && shouldTrackUnsavedChanges());
  }

  function unsavedChangesMessage() {
    const groups = [];
    const reasons = pendingUnsavedReasons;
    if (reasons.has("field") || reasons.has("control-point") || reasons.has("signature")) groups.push("los datos ingresados");
    if (reasons.has("photo") || reasons.has("evidence")) groups.push("las fotografías y evidencias");
    if (reasons.has("novelty")) groups.push("las novedades");
    if (reasons.has("box") || reasons.has("scan") || reasons.has("hu591") || reasons.has("hu332")) groups.push("los códigos escaneados");
    if (!groups.length) return "Se perderán los cambios realizados en esta vista.";
    if (groups.length === 1) return "Se perderán " + groups[0] + " que aún no se han guardado.";
    return "Se perderán " + groups.slice(0, -1).join(", ") + " y " + groups[groups.length - 1] + " que aún no se han guardado.";
  }

  function showUnsavedNavigationDialog(href, options = {}) {
    if (!href) return;
    pendingNavigationTarget = href;
    closeDrawer({ immediate: true });
    openDecisionSheet({
      id: "unsaved-navigation",
      type: "warning",
      title: "Cambios sin guardar",
      message: unsavedChangesMessage(),
      dismissible: false,
      initialFocus: "[data-dialog-primary]",
      actions: [
        {
          label: "Permanecer",
          variant: "primary",
          onClick: function() {
            pendingNavigationTarget = "";
          }
        },
        {
          label: "Salir sin guardar",
          variant: "destructive",
          onClick: function() {
            var target = pendingNavigationTarget;
            clearUnsavedChanges();
            navigateTo(target, { ...options, force: true });
          }
        }
      ]
    });
  }

  function navigateTo(href, options = {}) {
    if (!href || navigationInFlight) return false;
    if (!options.force && hasUnsavedChanges()) {
      showUnsavedNavigationDialog(href, options);
      return false;
    }

    const direction = rememberNavigationDirection(options.direction);
    const source = resolveElement(options.source);
    navigationInFlight = true;
    if (source) source.classList.add("sial-navigation-source");

    if (prefersReducedMotion() || !document.body) {
      window.location.href = href;
      return true;
    }

    document.body.classList.remove("drawer-open", "sial-screen-entering");
    root.dataset.sialNavDirection = direction;
    document.body.classList.add("sial-screen-exiting");
    document.body.dataset.sialNavigationState = "exiting";
    document.body.setAttribute("aria-busy", "true");
    window.setTimeout(() => {
      window.location.href = href;
    }, Number.isFinite(options.delay) ? options.delay : 150);
    return true;
  }

  function playLogoIntro(config = {}) {
    if (!document.body) return Promise.resolve();
    if (activeLogoIntroPromise) return activeLogoIntroPromise;

    const reduceMotion = prefersReducedMotion();
    const duration = reduceMotion ? config.reducedDuration || 980 : config.duration || 2200;
    const exitDelay = reduceMotion ? 80 : 220;
    const logoSrc = config.logoSrc || "assets/brand/isotipo-sial.svg";
    const title = config.title || "SIAL";
    const caption = config.caption || "Sistema de Informacion Agrologistico";
    const overlay = document.createElement("div");
    const lockup = document.createElement("div");
    const emblem = document.createElement("span");
    const image = document.createElement("img");
    const wordmark = document.createElement("span");
    const name = document.createElement("strong");
    const captionNode = document.createElement("span");
    const trace = document.createElement("span");

    overlay.className = "sial-logo-intro";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-label", config.ariaLabel || "Iniciando SIAL Movil");
    if (reduceMotion) overlay.dataset.motion = "reduced";

    lockup.className = "sial-logo-intro-lockup";
    emblem.className = "sial-logo-intro-emblem";
    image.src = logoSrc;
    image.alt = "";
    image.decoding = "async";
    image.loading = "eager";
    image.fetchPriority = "high";
    image.setAttribute("aria-hidden", "true");

    wordmark.className = "sial-logo-intro-wordmark";
    name.textContent = title;
    captionNode.textContent = caption;
    trace.className = "sial-logo-intro-trace";
    trace.setAttribute("aria-hidden", "true");

    emblem.append(image);
    wordmark.append(name, captionNode);
    lockup.append(emblem, wordmark, trace);
    overlay.append(lockup);
    document.body.append(overlay);
    document.body.classList.add("sial-logo-intro-active");

    window.requestAnimationFrame(() => {
      overlay.classList.add("is-running");
    });

    activeLogoIntroPromise = new Promise((resolve) => {
      window.setTimeout(() => {
        overlay.classList.add("is-resolving");
        window.setTimeout(() => {
          overlay.remove();
          document.body.classList.remove("sial-logo-intro-active");
          activeLogoIntroPromise = null;
          resolve();
        }, exitDelay);
      }, Math.max(0, duration));
    });

    return activeLogoIntroPromise;
  }

  function resolveBrandAssetUrl(fileName) {
    const normalizedPath = window.location.pathname.replace(/\\/g, "/");
    const isNestedLogin = /\/login\/[^/]*$/i.test(normalizedPath);
    const basePath = isNestedLogin ? "../assets/brand/" : "assets/brand/";
    return new URL(basePath + fileName, window.location.href).href;
  }

  function revealLoginAfterIntro() {
    if (root.dataset.sialIntro === "pending") {
      root.dataset.sialIntro = "revealed";
    }
    document.body?.classList.add("sial-login-intro-revealed");
  }

  function startLogoIntroIfNeeded() {
    if (!document.querySelector(".login-screen")) {
      revealLoginAfterIntro();
      return;
    }
    if (document.body.hasAttribute("data-no-logo-intro")) {
      revealLoginAfterIntro();
      return;
    }
    if (logoIntroQueued) return;
    logoIntroQueued = true;
    const config = {
      logoSrc: resolveBrandAssetUrl("isotipo-sial.svg"),
      title: "SIAL",
      caption: "Sistema de Informacion Agrologistico",
      duration: 2200,
      reducedDuration: 980
    };
    const fallbackDelay = (prefersReducedMotion() ? config.reducedDuration : config.duration) + 900;
    const fallback = window.setTimeout(revealLoginAfterIntro, fallbackDelay);
    playLogoIntro(config).finally(() => {
      window.clearTimeout(fallback);
      revealLoginAfterIntro();
    });
  }

  function shouldAnimateAnchor(anchor, event) {
    if (!anchor || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download") || anchor.hasAttribute("data-no-transition")) return false;
    const rawHref = anchor.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) return false;
    const nextUrl = new URL(anchor.href, window.location.href);
    const currentUrl = new URL(window.location.href);
    if (nextUrl.href === currentUrl.href) return false;
    if (nextUrl.origin !== currentUrl.origin && currentUrl.protocol !== "file:") return false;
    return true;
  }

  
﻿
  /* ============================================
     SIAL Camera Overlay (getUserMedia)
     ============================================ */
  var cameraStream = null;
  var cameraFacingMode = "environment";
  var capturedPhotos = [];

  function escapeCameraText(value) {
    return String(value || "").replace(/[&<>"']/g, function(char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function normalizeCaptureSteps(config, fallbackTitle) {
    var rawSteps = Array.isArray(config.steps) ? config.steps : (Array.isArray(config.sequence) ? config.sequence : []);
    return rawSteps.map(function(step, index) {
      var source = step && typeof step === "object" ? step : { title: step };
      var title = String(source.title || source.label || fallbackTitle || "Captura fotografica").replace(/\s+/g, " ").trim();
      var pointKey = String(source.pointKey || source.value || source.key || source.controlPoint || "").trim();
      var eventName = String(source.eventName || config.eventName || "").trim();
      return {
        title: title || fallbackTitle || "Captura fotografica",
        label: String(source.label || title || fallbackTitle || "Captura fotografica").replace(/\s+/g, " ").trim(),
        pointKey: pointKey || String(config.pointKey || "").trim(),
        eventName: eventName,
        index: index
      };
    }).filter(function(step) {
      return Boolean(step.title || step.pointKey);
    });
  }

  function renderCameraPreviewRow() {
    var row = document.querySelector(".sial-camera-preview-row");
    if (!row) return;
    row.hidden = capturedPhotos.length === 0;
    row.innerHTML = capturedPhotos.map(function(photo, index) {
      var label = photo.title || photo.label || "Foto " + (index + 1);
      return [
        '<div class="sial-camera-preview-thumb">',
        '<img src="' + photo.dataUrl + '" alt="' + escapeCameraText(label) + '" loading="lazy">',
        '<span>' + escapeCameraText(label) + '</span>',
        '</div>'
      ].join("");
    }).join("");
    row.scrollLeft = row.scrollWidth;
  }

  function updateCameraProgress(countEl, doneBtn, allowMultiple, isSequence, maxPhotos) {
    if (countEl) {
      if (isSequence) {
        countEl.textContent = capturedPhotos.length + " de " + maxPhotos + " foto(s)";
      } else {
        countEl.textContent = capturedPhotos.length ? capturedPhotos.length + " foto(s)" : "Sin fotos";
      }
    }
    if (doneBtn) {
      doneBtn.style.visibility = allowMultiple && !isSequence && capturedPhotos.length ? "visible" : "hidden";
      doneBtn.disabled = !(allowMultiple && !isSequence && capturedPhotos.length);
      doneBtn.textContent = capturedPhotos.length === 1 ? "Usar foto" : "Usar " + capturedPhotos.length + " fotos";
      doneBtn.setAttribute("aria-label", doneBtn.textContent);
    }
  }

  function createCameraShutter() {
    var shutter = document.createElement("div");
    shutter.className = "sial-camera-shutter";
    document.body.appendChild(shutter);
    window.setTimeout(function() { shutter.remove(); }, 260);
  }

  function createPhotoPayload(dataUrl, config, source, step) {
    var title = step ? (step.title || step.label) : (config.title || config.label);
    return {
      dataUrl: dataUrl,
      timestamp: Date.now(),
      title: title || "Captura fotografica",
      label: step ? (step.label || step.title || title) : (config.label || title || "Captura fotografica"),
      eventName: step ? (step.eventName || config.eventName || "") : (config.eventName || ""),
      pointKey: step ? (step.pointKey || config.pointKey || "") : (config.pointKey || ""),
      source: source || "camera",
      sequenceIndex: step ? step.index : null
    };
  }

  function createGeneratedPhoto(config) {
    var canvas = getCameraCanvas();
    canvas.width = 960;
    canvas.height = 720;
    var ctx = canvas.getContext("2d");
    var gradient = ctx.createLinearGradient(0, 0, 960, 720);
    gradient.addColorStop(0, "#003b72");
    gradient.addColorStop(1, "#0b7f86");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 720);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(60, 60, 840, 600);
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 8;
    ctx.strokeRect(92, 92, 776, 536);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 46px sans-serif";
    ctx.fillText(config.title || "Captura fotografica", 480, 312);
    ctx.font = "500 24px sans-serif";
    ctx.fillText("Evidencia de prueba", 480, 366);
    ctx.font = "400 20px sans-serif";
    ctx.fillText(new Date().toLocaleString("es-CO"), 480, 420);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  function captureCameraFrame(video, canvas) {
    createCameraShutter();
    var captureBtn = document.querySelector(".sial-camera-capture-btn");
    if (captureBtn) { captureBtn.classList.add("is-capturing"); window.setTimeout(function() { captureBtn.classList.remove("is-capturing"); }, 260); }
    if (!video || !video.videoWidth || !video.videoHeight) return "";
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  function stopCameraStream() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function(track) { track.stop(); });
      cameraStream = null;
    }
  }

  function closeCameraOverlay() {
    stopCameraStream();
    capturedPhotos = [];
    var overlay = document.querySelector(".sial-camera-overlay");
    if (overlay) {
      unmountModalLayer(overlay);
      overlay.remove();
    }
  }

  function getCameraCanvas() {
    return document.createElement("canvas");
  }

  function buildPhotoCaptureOverlay(config) {
    config = config || {};
    var title = String(config.title || config.label || "Captura fotografica").trim() || "Captura fotografica";
    var steps = normalizeCaptureSteps(config, title);
    var isSequence = steps.length > 0;
    var allowMultiple = isSequence ? true : config.allowMultiple !== false;
    var maxPhotos = Math.max(1, Number(config.maxPhotos || (isSequence ? steps.length : (allowMultiple ? 99 : 1))));
    if (isSequence) maxPhotos = Math.min(maxPhotos, steps.length);
    var currentStepIndex = 0;
    var onPhoto = config.onPhoto || function() {};
    var onComplete = config.onComplete || function() {};
    var onCancel = config.onCancel || function() {};
    var isSettled = false;

    capturedPhotos = [];
    stopCameraStream();

    var overlay = document.createElement("div");
    overlay.className = "sial-camera-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "sial-camera-active-title");
    overlay.tabIndex = -1;
    overlay.innerHTML = [
      '<div class="sial-camera-topline">',
      '<button class="sial-camera-icon-btn" type="button" data-camera-cancel aria-label="Cancelar captura"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
      '<div class="sial-camera-title-stack">',
      '<h2 class="sial-camera-title" id="sial-camera-active-title" data-camera-title>' + escapeCameraText(title) + '</h2>',
      '<span class="sial-camera-step" data-camera-step hidden></span>',
      '</div>',
      '<div class="sial-camera-btn-group">',
      '<button class="sial-camera-icon-btn" type="button" data-camera-flash aria-label="Encender linterna"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/></svg></button>',
      '<button class="sial-camera-icon-btn" type="button" data-camera-flip aria-label="Cambiar camara"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M21 3 14 10"/><path d="M8 21H3v-5"/><path d="m3 21 7-7"/></svg></button>',
      '</div>',
      '</div>',
      '<div class="sial-camera-viewfinder">',
      '<video autoplay playsinline muted></video>',
      '<div class="sial-camera-grid" aria-hidden="true"></div>',
      '<div class="sial-camera-corner-tl"></div><div class="sial-camera-corner-tr"></div>',
      '<div class="sial-camera-corner-bl"></div><div class="sial-camera-corner-br"></div>',
      '<div class="sial-camera-permission-denied" hidden>',
      '<strong>Permiso de camara requerido</strong>',
      '<p>Permite la camara para tomar la evidencia en vivo. En esta propuesta puedes generar una evidencia de prueba si el navegador bloquea el permiso.</p>',
      '<div class="sial-camera-fallback-actions">',
      '<button class="sial-btn sial-btn-primary" type="button" data-camera-fallback>Generar evidencia de prueba</button>',
      '</div>',
      '</div>',
      '</div>',
      '<div class="sial-camera-footer">',
      '<div class="sial-camera-preview-row" data-camera-preview-row hidden></div>',
      '<div class="sial-camera-capture-area">',
      '<span class="sial-camera-control-spacer" aria-hidden="true"></span>',
      '<button class="sial-camera-capture-btn" type="button" aria-label="Capturar foto"></button>',
      '<button class="sial-camera-secondary-action" type="button" data-camera-done>Usar foto</button>',
      '</div>',
      '<div class="sial-camera-empty-state" data-camera-count>Sin fotos</div>',
      '</div>'
    ].join("");

    document.body.appendChild(overlay);

    var video = overlay.querySelector("video");
    var canvas = getCameraCanvas();
    var permissionDenied = overlay.querySelector(".sial-camera-permission-denied");
    var countEl = overlay.querySelector("[data-camera-count]");
    var doneBtn = overlay.querySelector("[data-camera-done]");

    function currentCaptureStep() {
      return isSequence ? steps[Math.min(currentStepIndex, maxPhotos - 1)] : null;
    }

    function currentCaptureTitle() {
      var step = currentCaptureStep();
      return step ? (step.title || step.label || title) : title;
    }

    function updateCameraTitle() {
      var titleEl = overlay.querySelector("[data-camera-title]");
      var stepEl = overlay.querySelector("[data-camera-step]");
      if (titleEl) titleEl.textContent = currentCaptureTitle();
      if (!stepEl) return;
      stepEl.hidden = !isSequence;
      if (isSequence) stepEl.textContent = Math.min(currentStepIndex + 1, maxPhotos) + " de " + maxPhotos;
    }

    function hasRoom() {
      if (capturedPhotos.length < maxPhotos) return true;
      if (window.SialMobileUI && window.SialMobileUI.showToast) {
        window.SialMobileUI.showToast({ type: "warning", title: "Maximo alcanzado", message: "Se alcanzo el maximo de " + maxPhotos + " fotos." });
      }
      return false;
    }

    function finishWithPhotos() {
      if (isSettled) return;
      isSettled = true;
      var result = capturedPhotos.slice();
      closeCameraOverlay();
      onComplete(result);
    }

    function cancelCapture() {
      if (isSettled) return;
      isSettled = true;
      var result = capturedPhotos.slice();
      closeCameraOverlay();
      onCancel(result);
    }

    function requestCancel() {
      if (isSettled) return;
      if (!capturedPhotos.length) {
        cancelCapture();
        return;
      }
      openDecisionSheet({
        id: "camera-discard-confirm",
        type: "warning",
        title: "¿Descartar fotos capturadas?",
        message: capturedPhotos.length === 1
          ? "La foto capturada no se guardará."
          : "Las " + capturedPhotos.length + " fotos capturadas no se guardarán.",
        returnFocus: overlay.querySelector("[data-camera-cancel]"),
        actions: [
          { label: "Continuar captura", variant: "primary" },
          { label: "Descartar fotos", variant: "destructive", close: false, onClick: function() { closeDialog("camera-discard-confirm", { immediate: true, restoreFocus: false }); cancelCapture(); } }
        ]
      });
    }

    function addCapturedPhoto(dataUrl, source) {
      if (!dataUrl || !hasRoom()) return;
      var step = currentCaptureStep();
      var payload = createPhotoPayload(dataUrl, config, source, step);
      capturedPhotos.push(payload);
      renderCameraPreviewRow();
      updateCameraProgress(countEl, doneBtn, allowMultiple, isSequence, maxPhotos);
      if (navigator.vibrate) navigator.vibrate(10);
      if (isSequence) {
        onPhoto(payload, step, currentStepIndex, capturedPhotos.slice());
        if (capturedPhotos.length >= maxPhotos || currentStepIndex >= maxPhotos - 1) {
          window.setTimeout(finishWithPhotos, 180);
          return;
        }
        currentStepIndex += 1;
        updateCameraTitle();
        updateCameraProgress(countEl, doneBtn, allowMultiple, isSequence, maxPhotos);
        return;
      }
      if (!allowMultiple) finishWithPhotos();
    }

    function startCamera() {
      stopCameraStream();
      permissionDenied.hidden = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        permissionDenied.hidden = false;
        return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      }).then(function(stream) {
        cameraStream = stream;
        video.srcObject = stream;
        video.play();
      }).catch(function() {
        permissionDenied.hidden = false;
      });
    }

    startCamera();
    updateCameraTitle();
    updateCameraProgress(countEl, doneBtn, allowMultiple, isSequence, maxPhotos);

    mountModalLayer(overlay, {
      panel: overlay,
      dismissible: true,
      initialFocus: "[data-camera-cancel]",
      onEscape: requestCancel
    });

    overlay.querySelector("[data-camera-flip]").addEventListener("click", function() {
      cameraFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
      startCamera();
    });

    overlay.querySelector("[data-camera-flash]").addEventListener("click", function() {
      try {
        var track = cameraStream ? cameraStream.getVideoTracks()[0] : null;
        if (track && track.getCapabilities && track.getCapabilities().torch) {
          var torch = !(track.getConstraints().torch || false);
          track.applyConstraints({ advanced: [{ torch: torch }] });
        }
      } catch(e) {}
    });

    overlay.querySelector("[data-camera-cancel]").addEventListener("click", requestCancel);

    overlay.querySelector(".sial-camera-capture-btn").addEventListener("click", function() {
      if (!hasRoom()) return;
      if (!cameraStream) {
        permissionDenied.hidden = false;
        return;
      }
      var dataUrl = captureCameraFrame(video, canvas);
      addCapturedPhoto(dataUrl, "camera");
    });

    overlay.querySelector("[data-camera-fallback]").addEventListener("click", function() {
      addCapturedPhoto(createGeneratedPhoto({ title: currentCaptureTitle() }), "generated");
    });

    if (doneBtn) {
      doneBtn.addEventListener("click", function() {
        if (!capturedPhotos.length) return;
        finishWithPhotos();
      });
      doneBtn.style.visibility = "hidden";
      doneBtn.disabled = true;
    }
  }

  function buildCameraOverlay(config) {
    buildPhotoCaptureOverlay(config);
  }

  /* ============================================
     SIAL Barcode Scanner (getUserMedia)
     Patron normalizado desde HU332
     ============================================ */
  var activeBarcodeScanner = null;

  function normalizeSscc(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 20 && digits.slice(0, 2) === "00") return digits.slice(2);
    return digits;
  }

  function setBarcodeScannerStatus(message) {
    if (activeBarcodeScanner && activeBarcodeScanner.status) {
      activeBarcodeScanner.status.textContent = message;
    }
  }

  function closeBarcodeScanner() {
    var scanner = activeBarcodeScanner;
    if (!scanner) return;
    activeBarcodeScanner = null;
    if (scanner.raf) cancelAnimationFrame(scanner.raf);
    if (scanner.retryTimer) window.clearTimeout(scanner.retryTimer);
    if (scanner.stream) {
      scanner.stream.getTracks().forEach(function(track) { track.stop(); });
    }
    if (scanner.overlay) {
      unmountModalLayer(scanner.overlay);
      if (scanner.overlay.parentNode) scanner.overlay.parentNode.removeChild(scanner.overlay);
    }
  }

  function cancelBarcodeScanner() {
    var scanner = activeBarcodeScanner;
    if (!scanner || scanner.settled) return;
    scanner.settled = true;
    var onCancel = scanner.config.onCancel || function() {};
    closeBarcodeScanner();
    onCancel();
  }

  function normalizeBarcodeValidation(result, value) {
    if (result === true || typeof result === "undefined") {
      return { ok: Boolean(value), value: value, message: value ? "" : "No se detecto un codigo valido." };
    }
    if (result === false) {
      return { ok: false, value: value, message: "El codigo detectado no es valido." };
    }
    if (typeof result === "string") {
      return { ok: false, value: value, message: result };
    }
    return {
      ok: Boolean(result && result.ok),
      value: result && typeof result.value !== "undefined" ? result.value : value,
      message: result && result.message ? result.message : "El codigo detectado no es valido."
    };
  }

  function processBarcodeCandidate(rawValue, source) {
    var scanner = activeBarcodeScanner;
    if (!scanner || scanner.settled || scanner.processing) return false;
    scanner.processing = true;
    var config = scanner.config;
    var normalize = typeof config.normalize === "function" ? config.normalize : function(value) { return String(value || "").trim(); };
    var value = normalize(rawValue);
    var validation = normalizeBarcodeValidation(
      typeof config.validate === "function" ? config.validate(value, rawValue) : true,
      value
    );

    if (!validation.ok) {
      setBarcodeScannerStatus(validation.message);
      scanner.retryTimer = window.setTimeout(function() {
        if (!activeBarcodeScanner || activeBarcodeScanner !== scanner) return;
        scanner.processing = false;
        startBarcodeScannerDetection(scanner.video);
      }, Number(config.retryDelay || 700));
      return false;
    }

    scanner.settled = true;
    var onDetected = config.onDetected || function() {};
    var payload = {
      rawValue: rawValue,
      value: validation.value,
      source: source || "camera"
    };
    if (navigator.vibrate) navigator.vibrate(24);
    closeBarcodeScanner();
    onDetected(validation.value, payload);
    return true;
  }

  function startBarcodeScannerDetection(video) {
    var scanner = activeBarcodeScanner;
    if (!scanner || scanner.settled || scanner.processing) return;
    if (!("BarcodeDetector" in window)) {
      setBarcodeScannerStatus(scanner.config.unsupportedMessage || "Camara activa. Este navegador no expone lectura nativa; usa la entrada manual para continuar.");
      return;
    }

    var detector;
    try {
      detector = new BarcodeDetector({
        formats: scanner.config.formats || ["code_128", "ean_13", "qr_code", "data_matrix"]
      });
    } catch (_) {
      setBarcodeScannerStatus(scanner.config.unsupportedMessage || "Camara activa. Detector no disponible; usa la entrada manual.");
      return;
    }

    var loop = function() {
      var current = activeBarcodeScanner;
      if (!current || current !== scanner || current.settled || current.processing) return;
      detector.detect(video).then(function(codes) {
        if (!activeBarcodeScanner || activeBarcodeScanner !== scanner || scanner.settled) return;
        var hit = (codes || []).map(function(code) { return code.rawValue || ""; }).find(Boolean);
        if (hit) {
          processBarcodeCandidate(hit, "camera");
          return;
        }
        scanner.raf = requestAnimationFrame(loop);
      }).catch(function() {
        if (activeBarcodeScanner === scanner && !scanner.settled) {
          scanner.raf = requestAnimationFrame(loop);
        }
      });
    };

    setBarcodeScannerStatus(scanner.config.activeMessage || "Camara activa. Ubica el codigo dentro del marco.");
    scanner.raf = requestAnimationFrame(loop);
  }

  function startBarcodeScannerCamera() {
    var scanner = activeBarcodeScanner;
    if (!scanner) return;
    var video = scanner.video;
    var fallback = scanner.fallback;
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      fallback.hidden = false;
      setBarcodeScannerStatus(scanner.config.cameraUnavailableMessage || "Camara no disponible en este entorno. Usa la entrada manual para validar el codigo.");
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    }).then(function(stream) {
      if (!activeBarcodeScanner || activeBarcodeScanner !== scanner) {
        stream.getTracks().forEach(function(track) { track.stop(); });
        return;
      }
      scanner.stream = stream;
      fallback.hidden = true;
      video.srcObject = stream;
      video.play().then(function() {
        startBarcodeScannerDetection(video);
      }).catch(function() {
        fallback.hidden = false;
        setBarcodeScannerStatus(scanner.config.cameraUnavailableMessage || "No fue posible iniciar la camara. Usa la entrada manual para continuar.");
      });
    }).catch(function() {
      fallback.hidden = false;
      setBarcodeScannerStatus(scanner.config.permissionDeniedMessage || "Permiso de camara denegado o no disponible. Usa la entrada manual para continuar.");
    });
  }

  function openBarcodeScanner(config) {
    config = config || {};
    closeBarcodeScanner();

    var title = String(config.title || "Escanear codigo").trim() || "Escanear codigo";
    var eyebrow = String(config.eyebrow || "Escaner").trim() || "Escaner";
    var initialManualValue = String(config.initialManualValue || "");
    var manualLabel = String(config.manualLabel || "Validar codigo");
    var overlay = document.createElement("div");
    overlay.className = "sial-barcode-scanner-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "sial-barcode-scanner-title");
    overlay.setAttribute("aria-describedby", "sial-barcode-scanner-status");
    overlay.tabIndex = -1;
    overlay.innerHTML = [
      '<video class="sial-barcode-scanner-video" data-barcode-scanner-video playsinline muted></video>',
      '<div class="sial-barcode-scanner-fallback" data-barcode-scanner-fallback hidden><strong>Camara no disponible</strong></div>',
      '<div class="sial-barcode-scanner-top">',
      '<button class="sial-barcode-scanner-icon" type="button" data-barcode-scanner-close aria-label="Cerrar escaner"><svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
      '<h2 class="sial-barcode-scanner-title" id="sial-barcode-scanner-title">' + escapeCameraText(title) + '</h2>',
      '<span></span>',
      '</div>',
      '<div class="sial-barcode-scanner-frame" aria-hidden="true"></div>',
      '<div class="sial-barcode-scanner-bottom">',
      '<strong>' + escapeCameraText(eyebrow) + '</strong>',
      '<span id="sial-barcode-scanner-status" data-barcode-scanner-status role="status" aria-live="polite">' + escapeCameraText(config.initialMessage || "Solicitando camara. Ubica el codigo dentro del marco.") + '</span>',
      '<label class="sial-barcode-scanner-manual"><span>Entrada manual</span><input class="sial-input" type="text" inputmode="numeric" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + escapeCameraText(initialManualValue) + '" data-barcode-scanner-manual-input aria-label="Codigo ingresado manualmente"></label>',
      '<div class="sial-barcode-scanner-actions">',
      '<button class="sial-btn sial-btn-secondary" type="button" data-barcode-scanner-close>Cancelar</button>',
      '<button class="sial-btn sial-btn-primary" type="button" data-barcode-scanner-manual>' + escapeCameraText(manualLabel) + '</button>',
      '</div>',
      '</div>'
    ].join("");

    document.body.appendChild(overlay);

    activeBarcodeScanner = {
      config: config,
      overlay: overlay,
      video: overlay.querySelector("[data-barcode-scanner-video]"),
      fallback: overlay.querySelector("[data-barcode-scanner-fallback]"),
      status: overlay.querySelector("[data-barcode-scanner-status]"),
      stream: null,
      raf: 0,
      retryTimer: 0,
      processing: false,
      settled: false
    };

    mountModalLayer(overlay, {
      panel: overlay,
      dismissible: true,
      initialFocus: "[data-barcode-scanner-close]",
      onEscape: cancelBarcodeScanner
    });

    overlay.querySelectorAll("[data-barcode-scanner-close]").forEach(function(button) {
      button.addEventListener("click", cancelBarcodeScanner);
    });
    var manualInput = overlay.querySelector("[data-barcode-scanner-manual-input]");
    function submitManualValue() {
      processBarcodeCandidate(manualInput.value, "manual");
    }
    overlay.querySelector("[data-barcode-scanner-manual]").addEventListener("click", submitManualValue);
    manualInput.addEventListener("keydown", function(event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      submitManualValue();
    });

    startBarcodeScannerCamera();
    return {
      close: cancelBarcodeScanner,
      setStatus: setBarcodeScannerStatus
    };
  }

﻿function preferredTheme() {
    const saved = localStorage.getItem(storageThemeKey);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem(storageThemeKey, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      button.dataset.themeState = theme;
    });
  }

  function loginUrl() {
    const coreScript = Array.from(document.scripts).find(function(script) {
      const source = (script.src || "").split("?")[0];
      return source.endsWith("/shared/sial-mobile-core.js");
    });
    return coreScript ? new URL("../index.html", coreScript.src).href : resolveRelativeUrl("../index.html");
  }

  function completeSignOut() {
    closeDialog("session-signout", { immediate: true, restoreFocus: false });
    closeDrawer({ immediate: true });
    clearSelectedCompany();
    clearSelectedContext();
    sessionStorage.removeItem(navigationMotionKey);
    navigateTo(loginUrl(), { force: true, direction: "back" });
  }

  function requestSignOut(returnFocus) {
    closeDrawer({ immediate: true });
    return openDialog({
      id: "session-signout",
      type: "info",
      role: "alertdialog",
      title: "Cerrar sesi\u00f3n",
      message: "Saldr\u00e1s de SIAL M\u00f3vil. Las operaciones pendientes guardadas en este dispositivo se conservar\u00e1n.",
      returnFocus: returnFocus,
      initialFocus: "[data-dialog-primary]",
      actions: [
        { label: "Permanecer", variant: "secondary" },
        { label: "Cerrar sesi\u00f3n", variant: "primary", close: false, onClick: completeSignOut }
      ]
    });
  }

  function ensureHeaderSessionAction() {
    if (document.querySelector(".login-screen")) return;
    document.querySelectorAll("[data-theme-toggle]").forEach(function(themeToggle) {
      const header = themeToggle.closest(".sial-page-header, .library-topbar");
      if (!header || header.querySelector("[data-session-logout]")) return;

      let actions = themeToggle.parentElement && themeToggle.parentElement.classList.contains("sial-page-header-actions")
        ? themeToggle.parentElement
        : null;
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "sial-page-header-actions";
        header.insertBefore(actions, themeToggle);
        actions.appendChild(themeToggle);
      }

      const logout = document.createElement("button");
      logout.type = "button";
      logout.className = "sial-btn sial-btn-icon sial-session-logout";
      logout.dataset.sessionLogout = "";
      logout.setAttribute("aria-label", "Cerrar sesi\u00f3n");
      logout.title = "Cerrar sesi\u00f3n";
      logout.innerHTML = '<svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>';
      actions.appendChild(logout);
    });
  }

  function readStoredPayload(storageKey, fallback = {}) {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(fallback));
    } catch (_) {
      return fallback;
    }
  }

  function resolveRelativeUrl(relativeUrl) {
    try {
      return new URL(relativeUrl, window.location.href).href;
    } catch (_) {
      return relativeUrl;
    }
  }

  function selectedCompany() {
    return readStoredPayload(companyStorageKey, {});
  }

  function setSelectedCompany(company) {
    if (!company || typeof company !== "object") {
      localStorage.removeItem(companyStorageKey);
      return;
    }

    const normalized = {
      id: String(company.id || "").trim() || String(company.value || "").trim(),
      name: String(company.name || company.title || "Empresa").trim(),
      subtitle: String(company.subtitle || "").trim(),
      logo: String(company.logo || company.tag || "").trim()
    };

    if (!normalized.id) {
      localStorage.removeItem(companyStorageKey);
      return;
    }

    localStorage.setItem(companyStorageKey, JSON.stringify(normalized));
  }

  function clearSelectedCompany() {
    localStorage.removeItem(companyStorageKey);
  }

  function setSelectedContext(context) {
    if (!context || typeof context !== "object") {
      localStorage.removeItem(contextStorageKey);
      return;
    }

    localStorage.setItem(contextStorageKey, JSON.stringify(context));
  }

  function clearSelectedContext() {
    localStorage.removeItem(contextStorageKey);
  }

  function ensureToastRegion() {
    let region = document.querySelector("[data-toast-region]");
    if (region) return region;
    region = document.createElement("div");
    region.className = "sial-toast-region";
    region.setAttribute("data-toast-region", "");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "false");
    document.body.appendChild(region);
    return region;
  }

  function normalizeType(type) {
    return ["info", "success", "warning", "error"].includes(type) ? type : "info";
  }

  function feedbackTypeMeta(type) {
    const normalized = normalizeType(type);
    return {
      type: normalized,
      label: {
        info: "Informaci\u00f3n",
        success: "Operaci\u00f3n exitosa",
        warning: "Atenci\u00f3n requerida",
        error: "Ocurri\u00f3 un error"
      }[normalized]
    };
  }

  function feedbackIconMarkup(type) {
    return {
      info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path>',
      success: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.6 2.6L16.5 9"></path>',
      warning: '<path d="M12 3 2.8 20h18.4L12 3Z"></path><path d="M12 9v4"></path><path d="M12 16h.01"></path>',
      error: '<circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6"></path><path d="m15 9-6 6"></path>'
    }[normalizeType(type)];
  }

  function createFeedbackIdentity(type) {
    const identity = document.createElement("span");
    const symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    identity.className = "sial-feedback-identity";
    identity.setAttribute("aria-hidden", "true");
    symbol.setAttribute("class", "sial-feedback-symbol");
    symbol.setAttribute("viewBox", "0 0 24 24");
    symbol.setAttribute("focusable", "false");
    symbol.innerHTML = feedbackIconMarkup(type);
    identity.appendChild(symbol);
    return identity;
  }

  function appendFeedbackText(parent, title, message) {
    const copy = document.createElement("div");
    copy.className = "sial-feedback-copy";
    const strong = document.createElement("strong");
    strong.textContent = title || "Notificacion";
    copy.appendChild(strong);
    if (message) {
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      copy.appendChild(paragraph);
    }
    parent.appendChild(copy);
  }

  function resolveElement(target) {
    if (!target) return null;
    if (typeof target === "string") return document.querySelector(target);
    return target instanceof Element ? target : null;
  }

  function modalFocusableElements(panel) {
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(function(node) {
      return !node.hidden && node.getAttribute("aria-hidden") !== "true";
    });
  }

  function restoreIsolatedBodyChildren() {
    isolatedBodyChildren.forEach(function(previous, child) {
      child.inert = previous.inert;
      if (previous.ariaHidden === null) child.removeAttribute("aria-hidden");
      else child.setAttribute("aria-hidden", previous.ariaHidden);
    });
    isolatedBodyChildren.clear();
  }

  function refreshModalLayerState() {
    restoreIsolatedBodyChildren();
    const top = modalLayerStack[modalLayerStack.length - 1];
    if (!top) {
      document.body.classList.remove("dialog-open");
      document.body.style.overflow = modalLayerBodyOverflow;
      return;
    }
    Array.from(document.body.children).forEach(function(child) {
      if (child === top.element || top.relatedElements.includes(child)) return;
      isolatedBodyChildren.set(child, {
        inert: Boolean(child.inert),
        ariaHidden: child.getAttribute("aria-hidden")
      });
      child.inert = true;
      child.setAttribute("aria-hidden", "true");
    });
    document.body.classList.add("dialog-open");
    document.body.style.overflow = "hidden";
  }

  function mountModalLayer(element, options = {}) {
    if (!(element instanceof Element)) return null;
    const existingIndex = modalLayerStack.findIndex(function(layer) { return layer.element === element; });
    if (existingIndex !== -1) modalLayerStack.splice(existingIndex, 1);
    if (!modalLayerStack.length) modalLayerBodyOverflow = document.body.style.overflow || "";
    const panel = options.panel instanceof Element
      ? options.panel
      : (typeof options.panel === "string" ? element.querySelector(options.panel) : element);
    const opener = resolveElement(options.returnFocus) || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const layer = {
      element: element,
      panel: panel || element,
      dismissible: options.dismissible !== false,
      onEscape: typeof options.onEscape === "function" ? options.onEscape : null,
      opener: opener,
      relatedElements: (Array.isArray(options.relatedElements) ? options.relatedElements : [])
        .map(resolveElement)
        .filter(Boolean)
    };
    modalLayerStack.push(layer);
    refreshModalLayerState();
    const initialFocus = (typeof options.initialFocus === "string"
      ? layer.panel.querySelector(options.initialFocus)
      : resolveElement(options.initialFocus))
      || modalFocusableElements(layer.panel)[0]
      || layer.panel;
    window.setTimeout(function() {
      if (modalLayerStack.includes(layer) && initialFocus instanceof HTMLElement) initialFocus.focus({ preventScroll: true });
    }, 0);
    return layer;
  }

  function unmountModalLayer(element, options = {}) {
    const index = modalLayerStack.findIndex(function(layer) { return layer.element === element; });
    if (index === -1) return null;
    const layer = modalLayerStack[index];
    modalLayerStack.splice(index, 1);
    refreshModalLayerState();
    if (options.restoreFocus !== false) {
      const top = modalLayerStack[modalLayerStack.length - 1];
      const target = layer.opener && layer.opener.isConnected ? layer.opener : (top ? top.panel : null);
      if (target instanceof HTMLElement) window.setTimeout(function() { target.focus({ preventScroll: true }); }, 0);
    }
    return layer;
  }

  function handleModalLayerKeydown(event) {
    const layer = modalLayerStack[modalLayerStack.length - 1];
    if (!layer) return false;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!layer.dismissible) {
        replayMotionState(layer.panel, "is-blocked-attempt", 420);
        return true;
      }
      if (layer.onEscape) layer.onEscape();
      return true;
    }
    if (event.key !== "Tab") return false;
    const focusable = modalFocusableElements(layer.panel);
    if (!focusable.length) {
      event.preventDefault();
      layer.panel.focus({ preventScroll: true });
      return true;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return true;
  }

  function showToast(options = {}) {
    const region = ensureToastRegion();
    const type = normalizeType(options.type);
    const toast = document.createElement("div");
    toast.className = `sial-toast ${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.setAttribute("aria-label", [feedbackTypeMeta(type).label, options.title, options.message].filter(Boolean).join(". "));
    const identity = createFeedbackIdentity(type, options);
    identity.classList.add("is-compact");
    toast.appendChild(identity);
    appendFeedbackText(toast, options.title, options.message);
    region.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      window.setTimeout(() => toast.remove(), 180);
    }, options.duration || 2800);
    return toast;
  }

  function validationFieldLabel(field) {
    if (!(field instanceof Element)) return "este campo";
    const explicit = field.getAttribute("aria-label");
    if (explicit) return explicit.trim();
    const label = field.labels && field.labels[0]
      ? field.labels[0]
      : field.closest(".sial-field")?.querySelector(".sial-label, label");
    const text = label ? label.textContent.replace(/\s*\*\s*$/, "").trim() : "";
    return text || field.getAttribute("placeholder") || field.name || "este campo";
  }

  function validationMessageForField(field) {
    const label = validationFieldLabel(field);
    if (!field || !field.validity) return "Revisa la informacion indicada y vuelve a intentar.";
    if (field.validity.valueMissing) return "Completa " + label + " para continuar.";
    if (field.validity.typeMismatch) return "Ingresa un valor valido en " + label + ".";
    if (field.validity.patternMismatch) return "Revisa el formato solicitado para " + label + ".";
    if (field.validity.tooShort) return label + " requiere mas caracteres.";
    if (field.validity.tooLong) return label + " supera la longitud permitida.";
    if (field.validity.rangeUnderflow || field.validity.rangeOverflow) return "Revisa el valor permitido para " + label + ".";
    return "Revisa " + label + " antes de continuar.";
  }

  function ensureFormValidationStatus(form) {
    if (!(form instanceof HTMLFormElement)) return null;
    let status = form.querySelector("[data-flow-error], [data-login-status], [data-recovery-status], [data-global-validation-status]");
    if (status) return status;
    status = document.createElement("div");
    status.className = "sial-status error";
    status.dataset.globalValidationStatus = "";
    status.hidden = true;
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.before(status);
    else form.appendChild(status);
    return status;
  }

  function revealValidationContext(target) {
    if (!(target instanceof Element)) return;
    target.closest("details:not([open])")?.setAttribute("open", "");
    const panel = target.closest('[role="tabpanel"][hidden], [data-tab-panel][hidden]');
    if (!panel) return;
    panel.hidden = false;
    panel.removeAttribute("aria-hidden");
    if (!panel.id) return;
    const tab = Array.from(document.querySelectorAll('[aria-controls]')).find(function(candidate) {
      return candidate.getAttribute("aria-controls") === panel.id;
    });
    if (tab instanceof HTMLElement) tab.click();
  }

  function revealValidationError(target, options = {}) {
    const status = resolveElement(target);
    const form = resolveElement(options.form)
      || (status ? status.closest("form") : null)
      || (resolveElement(options.field)?.closest("form") || null);
    const field = resolveElement(options.field)
      || (form ? form.querySelector('[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid') : null);
    const destination = field || status;
    if (!destination) return null;

    if (field) {
      setFieldInvalid(field, true);
      if (status) {
        if (!status.id) status.id = "sial-validation-" + Date.now().toString(36);
        const describedBy = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
        describedBy.add(status.id);
        field.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
      }
    }

    revealValidationContext(destination);
    destination.classList.add("sial-error-target");
    if (!field && destination instanceof HTMLElement && !destination.matches('a, button, input, select, textarea, [tabindex]')) {
      destination.tabIndex = -1;
    }
    window.requestAnimationFrame(function() {
      destination.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      if (destination instanceof HTMLElement) destination.focus({ preventScroll: true });
      window.setTimeout(function() { destination.classList.remove("sial-error-target"); }, 700);
    });
    return destination;
  }
  function setInlineStatus(target, options = {}) {
    const node = resolveElement(target);
    if (!node) return null;
    const type = normalizeType(options.type);
    const branded = options.branded !== false;
    node.className = `sial-status${branded ? " sial-alert-card" : ""} ${type}`;
    node.setAttribute("role", type === "error" ? "alert" : "status");
    node.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    node.setAttribute("aria-label", [feedbackTypeMeta(type).label, options.title, options.message].filter(Boolean).join(". "));
    node.dataset.sialAlertHydrated = "true";
    node.hidden = false;
    node.replaceChildren();
    if (branded) node.appendChild(createFeedbackIdentity(type, options));
    appendFeedbackText(node, options.title, options.message || "");
    replayMotionState(node, "is-status-updated", 360);
    if (type === "error" && options.reveal !== false) {
      revealValidationError(node, { field: options.field || options.focusTarget, form: options.form });
    }
    return node;
  }

  function clearInlineStatus(target) {
    const node = resolveElement(target);
    if (!node) return;
    node.hidden = true;
    node.replaceChildren();
  }

  function hydrateAlertStatus(node) {
    if (!(node instanceof Element) || !node.classList.contains("sial-status") || node.dataset.sialAlertHydrated === "true") return false;
    const type = ["info", "success", "warning", "error"].find(function(candidate) { return node.classList.contains(candidate); }) || "info";

    const directChildren = Array.from(node.children);
    directChildren.forEach(function(child) {
      if (child.matches("svg.sial-icon")) child.remove();
    });
    let copy = Array.from(node.children).find(function(child) { return child.classList.contains("sial-feedback-copy"); });
    if (!copy) {
      copy = document.createElement(node.tagName === "P" ? "span" : "div");
      copy.className = "sial-feedback-copy";
      Array.from(node.childNodes).forEach(function(child) { copy.appendChild(child); });
      node.appendChild(copy);
    }
    const semanticLabel = document.createElement("span");
    semanticLabel.className = "sial-visually-hidden";
    semanticLabel.textContent = feedbackTypeMeta(type).label + ". ";
    copy.prepend(semanticLabel);
    node.dataset.sialAlertHydrated = "true";
    node.classList.add("sial-alert-card");
    node.setAttribute("role", type === "error" ? "alert" : "status");
    node.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    node.removeAttribute("aria-label");
    node.prepend(createFeedbackIdentity(type));
    return true;
  }

  function hydrateAlertStatuses(scope = document) {
    const nodes = [];
    if (scope instanceof Element && scope.classList.contains("sial-status")) nodes.push(scope);
    if (scope && typeof scope.querySelectorAll === "function") nodes.push(...scope.querySelectorAll(".sial-status"));
    return nodes.reduce(function(count, node) { return count + (hydrateAlertStatus(node) ? 1 : 0); }, 0);
  }

  function observeAlertStatuses() {
    if (alertStatusObserver || !document.body || typeof MutationObserver !== "function") return;
    alertStatusObserver = new MutationObserver(function(records) {
      records.forEach(function(record) {
        record.addedNodes.forEach(function(node) {
          if (node instanceof Element) hydrateAlertStatuses(node);
        });
      });
    });
    alertStatusObserver.observe(document.body, { childList: true, subtree: true });
  }

  function setFieldInvalid(field, invalid) {
    if (!field) return;
    field.setAttribute("aria-invalid", String(Boolean(invalid)));
    const frame = field.closest(".sial-input-wrap");
    if (frame) frame.classList.toggle("is-invalid", Boolean(invalid));
  }

  function validateLoginForm(form) {
    const status = form.querySelector("[data-login-status]");
    const rules = [
      {
        field: form.querySelector("input[name='usuario']"),
        title: "Usuario requerido",
        message: "Ingresa tu usuario para continuar."
      },
      {
        field: form.querySelector("input[name='contrasena']"),
        title: "Contrasena requerida",
        message: "Ingresa tu contrasena para continuar."
      }
    ];
    rules.forEach(({ field }) => setFieldInvalid(field, false));
    const invalid = rules.find(({ field }) => field && !field.value.trim());
    if (!invalid) {
      clearInlineStatus(status);
      return true;
    }
    setFieldInvalid(invalid.field, true);
    replayMotionState(invalid.field.closest(".sial-input-wrap") || invalid.field, "is-blocked-attempt", 420);
    setInlineStatus(status, {
      type: "error",
      title: invalid.title,
      message: invalid.message
    });
    invalid.field.focus();
    return false;
  }

  function ensureBannerRegion() {
    let region = document.querySelector("[data-banner-region]");
    if (region) return region;
    region = document.createElement("div");
    region.className = "sial-banner-region";
    region.setAttribute("data-banner-region", "");
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
    return region;
  }

  function showBanner(options = {}) {
    const region = ensureBannerRegion();
    const type = normalizeType(options.type);
    const id = options.id || "global";
    const current = region.querySelector(`[data-banner-id="${id}"]`);
    if (current) current.remove();

    const banner = document.createElement("div");
    banner.className = `sial-banner ${type}`;
    banner.dataset.bannerId = id;
    banner.setAttribute("role", type === "error" ? "alert" : "status");
    banner.setAttribute("aria-label", [feedbackTypeMeta(type).label, options.title, options.message].filter(Boolean).join(". "));

    const identity = createFeedbackIdentity(type, options);
    identity.classList.add("is-compact");
    banner.appendChild(identity);
    appendFeedbackText(banner, options.title, options.message);

    if (options.action && options.action.label) {
      const action = document.createElement("button");
      action.className = "sial-banner-action";
      action.type = "button";
      action.textContent = options.action.label;
      action.addEventListener("click", function() {
        if (typeof options.action.onClick === "function") options.action.onClick();
        if (options.action.dismiss !== false) hideBanner(id);
      });
      banner.classList.add("has-action");
      banner.appendChild(action);
    }

    if (options.dismissible !== false) {
      const close = document.createElement("button");
      banner.classList.add("has-close");
      close.className = "sial-banner-close";
      close.type = "button";
      close.dataset.bannerDismiss = id;
      close.setAttribute("aria-label", "Cerrar alerta");
      close.textContent = "x";
      banner.appendChild(close);
    }

    region.appendChild(banner);
    return banner;
  }

  function hideBanner(id = "global") {
    document.querySelectorAll(`[data-banner-id="${id}"]`).forEach((banner) => banner.remove());
  }

  function syncDialogOpenState() {
    refreshModalLayerState();
  }

  function closeDialog(id, options = {}) {
    const selector = id ? `[data-dialog-id="${id}"]` : ".sial-modal-backdrop:last-of-type";
    const dialog = document.querySelector(selector);
    if (!dialog) {
      syncDialogOpenState();
      return;
    }

    const finish = function() {
      dialog.dataset.state = "closed";
      unmountModalLayer(dialog, { restoreFocus: options.restoreFocus !== false });
      dialog.remove();
      if (typeof dialog._sialOnClose === "function") dialog._sialOnClose(options.reason || "close");
      syncDialogOpenState();
    };
    const shouldAnimate = !options.immediate && !prefersReducedMotion();

    if (!shouldAnimate) {
      finish();
      return;
    }
    if (dialog.classList.contains("is-closing")) return;
    dialog.dataset.state = "closing";
    dialog.classList.add("is-closing");
    dialog.setAttribute("aria-hidden", "true");
    window.setTimeout(finish, options.delay || dialogExitDelay);
  }

  function openDialog(options = {}) {
    const id = options.id || `dialog-${Date.now()}`;
    closeDialog(id, { immediate: true, restoreFocus: false });
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "-");
    const dismissible = options.dismissible !== false;
    const type = normalizeType(options.type);
    const branded = options.branded === true;

    const backdrop = document.createElement("div");
    backdrop.className = "sial-modal-backdrop";
    backdrop.dataset.dialogId = id;
    backdrop.dataset.dialogDismissible = String(dismissible);
    backdrop.dataset.state = "opening";

    const panel = document.createElement("section");
    panel.className = options.variant === "sheet" ? "sial-bottom-sheet" : "sial-modal";
    if (branded) panel.classList.add("sial-decision-alert", type);
    panel.setAttribute("role", options.role || "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.tabIndex = -1;

    const header = document.createElement("header");
    header.className = "sial-dialog-header";
    const title = document.createElement("h2");
    title.id = safeId + "-title";
    title.textContent = options.title || "Confirmar acción";
    panel.setAttribute("aria-labelledby", title.id);
    if (branded) {
      const heading = document.createElement("div");
      const headingCopy = document.createElement("div");
      const eyebrow = document.createElement("span");
      heading.className = "sial-dialog-heading";
      headingCopy.className = "sial-dialog-heading-copy";
      eyebrow.className = "sial-dialog-eyebrow";
      eyebrow.textContent = options.eyebrow || "SIAL \u00b7 " + feedbackTypeMeta(type).label;
      headingCopy.append(eyebrow, title);
      heading.append(createFeedbackIdentity(type, options), headingCopy);
      header.appendChild(heading);
    } else {
      header.appendChild(title);
    }
    if (dismissible) {
      const close = document.createElement("button");
      close.className = "sial-btn sial-btn-icon";
      close.type = "button";
      close.dataset.dialogClose = id;
      close.setAttribute("aria-label", "Cerrar diálogo");
      close.textContent = "×";
      header.appendChild(close);
    }
    panel.appendChild(header);

    if (options.message) {
      const message = document.createElement("p");
      message.id = safeId + "-description";
      message.className = "sial-dialog-copy";
      message.textContent = options.message;
      panel.setAttribute("aria-describedby", message.id);
      panel.appendChild(message);
    }

    if (options.content) {
      const contentNode = typeof options.content === "function" ? options.content({ id, closeDialog }) : options.content;
      if (contentNode instanceof Node) {
        const body = document.createElement("div");
        body.className = "sial-dialog-body";
        body.appendChild(contentNode);
        panel.appendChild(body);
      }
    }

    const actions = Array.isArray(options.actions)
      ? options.actions
      : [{ label: "Entendido", variant: "primary" }];
    if (actions.length) {
      const footer = document.createElement("footer");
      footer.className = "sial-dialog-actions";
      actions.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        const variantClass = action.variant === "destructive"
          ? "sial-btn-danger"
          : (action.variant === "secondary" ? "sial-btn-secondary" : "sial-btn-primary");
        button.className = `sial-btn ${variantClass}`;
        button.textContent = action.label;
        if (action.variant !== "secondary" && action.variant !== "destructive") button.dataset.dialogPrimary = "";
        if (action.initialFocus) button.dataset.dialogInitialFocus = "";
        button.addEventListener("click", () => {
          if (typeof action.onClick === "function") action.onClick();
          if (action.close !== false) closeDialog(id, { reason: "action" });
        });
        footer.appendChild(button);
      });
      panel.appendChild(footer);
    }
    backdrop.appendChild(panel);
    backdrop._sialOnClose = options.onClose;
    backdrop.addEventListener("click", function(event) {
      if (event.target === backdrop && dismissible) closeDialog(id, { reason: "backdrop" });
    });
    document.body.appendChild(backdrop);
    mountModalLayer(backdrop, {
      panel: panel,
      dismissible: dismissible,
      initialFocus: options.initialFocus || "[data-dialog-initial-focus]",
      returnFocus: options.returnFocus,
      onEscape: function() { closeDialog(id, { reason: "escape" }); }
    });
    if (prefersReducedMotion()) {
      backdrop.dataset.state = "open";
    } else {
      window.setTimeout(function() {
        if (backdrop.isConnected && backdrop.dataset.state === "opening") backdrop.dataset.state = "open";
      }, 240);
    }
    return backdrop;
  }

  function openDecisionSheet(options = {}) {
    const type = normalizeType(options.type);
    return openDialog({
      ...options,
      variant: "sheet",
      type,
      branded: options.branded !== false,
      role: options.role || (type === "warning" || type === "error" ? "alertdialog" : "dialog")
    });
  }

  function normalizePickerItem(item) {
    if (typeof item === "string") return { label: item, value: item };
    return {
      label: item.label || item.value || "Opcion",
      value: item.value || item.label || "",
      helper: item.helper || ""
    };
  }

  function openMobilePicker(options = {}) {
    const id = options.id || `picker-${Date.now()}`;
    const target = resolveElement(options.target);
    const items = (options.items || []).map(normalizePickerItem);
    const selectedValue = options.selectedValue || target?.value || "";
    const content = document.createElement("div");
    content.className = "sial-picker";

    let searchField = null;
    if (options.search !== false && items.length > 6) {
      const searchWrap = document.createElement("label");
      searchWrap.className = "sial-field";
      const searchLabel = document.createElement("span");
      searchLabel.className = "sial-label";
      searchLabel.textContent = options.searchLabel || "Buscar opcion";
      searchField = document.createElement("input");
      searchField.className = "sial-picker-search";
      searchField.type = "search";
      searchField.inputMode = "search";
      searchField.enterKeyHint = "search";
      searchField.autocomplete = "off";
      searchField.autocapitalize = "none";
      searchField.spellcheck = false;
      searchField.placeholder = options.searchPlaceholder || "Escribe para filtrar";
      searchWrap.append(searchLabel, searchField);
      content.appendChild(searchWrap);
    }

    const list = document.createElement("div");
    list.className = "sial-picker-list";
    list.setAttribute("role", "listbox");

    const renderItems = (filter = "") => {
      list.replaceChildren();
      const normalizedFilter = filter.trim().toLowerCase();
      const visibleItems = items.filter((item) => {
        const haystack = `${item.label} ${item.helper}`.toLowerCase();
        return !normalizedFilter || haystack.includes(normalizedFilter);
      });

      if (!visibleItems.length) {
        const empty = document.createElement("div");
        empty.className = "sial-picker-empty";
        empty.textContent = options.emptyText || "No hay opciones disponibles";
        list.appendChild(empty);
        return;
      }

      visibleItems.forEach((item) => {
        const button = document.createElement("button");
        button.className = "sial-picker-option";
        button.type = "button";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(item.value === selectedValue));
        button.dataset.pickerValue = item.value;
        const label = document.createElement("strong");
        label.textContent = item.label;
        button.appendChild(label);
        if (item.helper) {
          const helper = document.createElement("span");
          helper.textContent = item.helper;
          button.appendChild(helper);
        }
        button.addEventListener("click", () => {
          if (target) {
            target.value = item.value;
            target.dispatchEvent(new Event("change", { bubbles: true }));
          }
          if (typeof options.onSelect === "function") options.onSelect(item);
          closeDialog(id);
        });
        list.appendChild(button);
      });
    };

    if (searchField) {
      searchField.addEventListener("input", () => renderItems(searchField.value));
    }

    renderItems();
    content.appendChild(list);

    return openDialog({
      id,
      variant: "sheet",
      title: options.title || "Seleccionar opcion",
      message: options.message || "",
      content,
      actions: []
    });
  }

  function normalizeTimeValue(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
    if (!match) return "";
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";
    return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  }

  function currentTimeValue(date = new Date()) {
    return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
  }

  function setTimePickerValue(target, value) {
    if (!target) return;
    target.value = normalizeTimeValue(value);
    target.removeAttribute("aria-invalid");
    target.setCustomValidity("");
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function openTimePicker(options = {}) {
    const target = resolveElement(options.target);
    const id = options.id || ("time-picker-" + (target?.id || Date.now()));
    const initialValue = normalizeTimeValue(options.value || target?.value) || currentTimeValue();
    const initialParts = initialValue.split(":");
    let selectedHour = initialParts[0];
    let selectedMinute = initialParts[1];
    const content = document.createElement("div");
    content.className = "sial-time-picker";

    const display = document.createElement("div");
    display.className = "sial-time-picker-display";
    display.setAttribute("aria-live", "polite");
    display.innerHTML = [
      "<span>Hora seleccionada</span>",
      '<strong><b data-sial-time-hour></b><i aria-hidden="true">:</i><b data-sial-time-minute></b></strong>',
      "<small>Formato de 24 horas</small>"
    ].join("");

    const nowButton = document.createElement("button");
    nowButton.className = "sial-time-now";
    nowButton.type = "button";
    nowButton.innerHTML = [
      '<svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
      "<span><strong>Ahora</strong><small>Usar la hora del dispositivo</small></span>"
    ].join("");

    const columns = document.createElement("div");
    columns.className = "sial-time-picker-columns";
    let hourSelect = null;
    let minuteSelect = null;

    function buildTimeSelect(label, values, selected, onSelect) {
      const field = document.createElement("label");
      field.className = "sial-time-picker-field";
      const heading = document.createElement("span");
      heading.className = "sial-time-picker-label";
      heading.textContent = label;
      const select = document.createElement("select");
      select.className = "sial-time-select";
      select.setAttribute("aria-label", label);
      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = value === selected;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        onSelect(select.value);
        syncTimePicker();
        replayMotionState(display, "is-time-updated", 260);
      });
      field.append(heading, select);
      return { field, select };
    }

    function syncTimePicker() {
      display.querySelector("[data-sial-time-hour]").textContent = selectedHour;
      display.querySelector("[data-sial-time-minute]").textContent = selectedMinute;
      if (hourSelect) hourSelect.value = selectedHour;
      if (minuteSelect) minuteSelect.value = selectedMinute;
    }

    const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
    const hourField = buildTimeSelect("Hora", hours, selectedHour, (value) => {
      selectedHour = value;
    });
    const minuteField = buildTimeSelect("Minutos", minutes, selectedMinute, (value) => {
      selectedMinute = value;
    });
    hourSelect = hourField.select;
    minuteSelect = minuteField.select;
    columns.append(hourField.field, minuteField.field);

    nowButton.addEventListener("click", () => {
      const nowParts = currentTimeValue().split(":");
      selectedHour = nowParts[0];
      selectedMinute = nowParts[1];
      syncTimePicker();
      replayMotionState(display, "is-time-updated", 260);
    });

    content.append(display, nowButton, columns);
    syncTimePicker();

    const dialog = openDialog({
      id,
      variant: "sheet",
      title: options.title || "Seleccionar hora",
      message: options.message || "Indica la hora exacta de la operación.",
      content,
      returnFocus: options.returnFocus || target,
      actions: [
        { label: "Cancelar", variant: "secondary" },
        {
          label: options.confirmLabel || "Usar esta hora",
          onClick: () => {
            const value = selectedHour + ":" + selectedMinute;
            setTimePickerValue(target, value);
            if (typeof options.onSelect === "function") options.onSelect(value, target);
          }
        }
      ],
      onClose: options.onClose
    });

    return dialog;
  }
  function mountTimePickers(scope = document) {
    const inputs = [];
    if (scope instanceof Element && scope.matches('input[type="time"]:not([data-sial-native-time])')) inputs.push(scope);
    if (scope && typeof scope.querySelectorAll === "function") {
      inputs.push(...scope.querySelectorAll('input[type="time"]:not([data-sial-native-time])'));
    }
    inputs.forEach((input) => {
      if (input.dataset.sialTimePickerMounted === "true") return;
      input.dataset.sialTimePickerMounted = "true";
      input.classList.add("sial-time-input-control");
      const frame = document.createElement("div");
      frame.className = "sial-time-input";
      input.parentNode.insertBefore(frame, input);
      frame.appendChild(input);
      const trigger = document.createElement("button");
      trigger.className = "sial-time-input-trigger";
      trigger.type = "button";
      trigger.setAttribute("aria-label", "Seleccionar " + (input.labels?.[0]?.textContent?.trim().toLowerCase() || "hora"));
      trigger.innerHTML = '<svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>';
      frame.appendChild(trigger);
      const open = () => openTimePicker({
        id: "time-picker-" + (input.id || input.name || Date.now()),
        target: input,
        title: input.dataset.timePickerTitle || input.labels?.[0]?.textContent?.trim() || "Seleccionar hora"
      });
      trigger.addEventListener("click", open);
      input.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      });
      input.addEventListener("keydown", (event) => {
        if (!["Enter", " ", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        open();
      });
    });
  }

  function selectedContext() {
    return readStoredPayload(contextStorageKey, {});
  }

  function hydrateCompanyContext() {
    const company = selectedCompany();
    if (!company.name) return;

    document.querySelectorAll("[data-company-name]:not([data-company-option])").forEach((node) => {
      node.textContent = company.name;
    });
    document.querySelectorAll("[data-company-subtitle]:not([data-company-option])").forEach((node) => {
      node.textContent = company.subtitle || "Empresa";
    });
    document.querySelectorAll("[data-company-logo]:not([data-company-option])").forEach((node) => {
      node.textContent = company.logo || "--";
    });
  }

  function hydrateContext() {
    const context = selectedContext();
    if (!context.name) return;
    document.querySelectorAll("[data-context-name]").forEach((node) => {
      node.textContent = context.name;
    });
    document.querySelectorAll("[data-context-subtitle]").forEach((node) => {
      node.textContent = context.subtitle || "Contexto operativo";
    });
    document.querySelectorAll("[data-context-logo]").forEach((node) => {
      node.textContent = context.logo || "SI";
    });
  }

  function hydrateSelectionCards() {
    const renderCompanyCard = (card) => {
      const infoNode = card.querySelector(".sial-finca-info") || (() => {
        const created = document.createElement("span");
        created.className = "sial-finca-info";
        card.appendChild(created);
        return created;
      })();
      const titleNode = infoNode.querySelector("strong") || (() => {
        const created = document.createElement("strong");
        const reference = infoNode.querySelector("span.sial-finca-meta");
        if (reference) {
          infoNode.insertBefore(created, reference);
        } else {
          infoNode.appendChild(created);
        }
        return created;
      })();
      const existingSubtitleNode = infoNode.querySelector(".sial-finca-meta") ? infoNode.querySelector(".sial-finca-meta").previousElementSibling : null;
      const subtitleNode = existingSubtitleNode && existingSubtitleNode.tagName === "SPAN" && !existingSubtitleNode.classList.contains("sial-finca-meta")
        ? existingSubtitleNode
        : (() => {
            const created = document.createElement("span");
            if (infoNode.querySelector(".sial-finca-meta")) {
              infoNode.insertBefore(created, infoNode.querySelector(".sial-finca-meta"));
            } else {
              infoNode.appendChild(created);
            }
            return created;
          })();
      const logoNode = card.querySelector(".sial-logo-box") || (() => {
        const created = document.createElement("span");
        created.className = "sial-logo-box";
        card.insertBefore(created, infoNode);
        return created;
      })();
      const rawName = card.dataset.companyName || card.dataset.companyItemName;
      const rawSubtitle = card.dataset.companySubtitle || card.dataset.companyItemSubtitle;
      const rawLogo = card.dataset.companyLogo || card.dataset.companyItemLogo;

      if (titleNode) {
        titleNode.textContent = rawName || titleNode.textContent || "Empresa";
      }
      if (subtitleNode) {
        subtitleNode.textContent = rawSubtitle || subtitleNode.textContent || "";
      }
      if (logoNode) {
        logoNode.textContent = rawLogo || logoNode.textContent || "--";
      }
    };

    const renderFincaCard = (card) => {
      const infoNode = card.querySelector(".sial-finca-info") || (() => {
        const created = document.createElement("span");
        created.className = "sial-finca-info";
        card.appendChild(created);
        return created;
      })();
      const titleNode = infoNode.querySelector("strong") || (() => {
        const created = document.createElement("strong");
        const reference = infoNode.querySelector("span.sial-finca-meta");
        if (reference) {
          infoNode.insertBefore(created, reference);
        } else {
          infoNode.appendChild(created);
        }
        return created;
      })();
      const existingSubtitleNode = infoNode.querySelector(".sial-finca-meta") ? infoNode.querySelector(".sial-finca-meta").previousElementSibling : null;
      const subtitleNode = existingSubtitleNode && existingSubtitleNode.tagName === "SPAN" && !existingSubtitleNode.classList.contains("sial-finca-meta")
        ? existingSubtitleNode
        : (() => {
            const created = document.createElement("span");
            if (infoNode.querySelector(".sial-finca-meta")) {
              infoNode.insertBefore(created, infoNode.querySelector(".sial-finca-meta"));
            } else {
              infoNode.appendChild(created);
            }
            return created;
          })();
      const logoNode = card.querySelector(".sial-logo-box") || (() => {
        const created = document.createElement("span");
        created.className = "sial-logo-box";
        card.insertBefore(created, infoNode);
        return created;
      })();

      if (titleNode) {
        titleNode.textContent = card.dataset.fincaName || titleNode.textContent || "Contexto operativo";
      }
      if (subtitleNode) {
        subtitleNode.textContent = card.dataset.fincaSubtitle || subtitleNode.textContent || "";
      }
      if (logoNode) {
        logoNode.textContent = card.dataset.fincaLogo || logoNode.textContent || "--";
      }
    };

    document.querySelectorAll("[data-company-option]").forEach(renderCompanyCard);
    document.querySelectorAll("[data-finca-option]").forEach(renderFincaCard);
  }

  function resetSelectionSearchInputs() {
    document.querySelectorAll("[data-company-search],[data-finca-search]").forEach((input) => {
      if (!input) return;
      input.value = "";
    });
  }

  function refreshSelectionViews() {
    resetSelectionSearchInputs();
    hydrateSelectionCards();
    syncCompanySelectionFromContext();
    updateFincaSelectionScope();
    updateCompanySelectionScope();
  }

  function updateFincaSelectionScope() {
    const fincaCards = Array.from(document.querySelectorAll("[data-finca-option]"));
    if (!fincaCards.length) return;

    const company = selectedCompany();
    const currentCompanyId = company.id || "";
    const searchTerm = (document.querySelector("[data-finca-search]")?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    fincaCards.forEach((finca) => {
      const companyId = finca.dataset.companyId || "";
      const fincaName = (finca.dataset.fincaName || "").toLowerCase();
      const fincaSubtitle = (finca.dataset.fincaSubtitle || "").toLowerCase();
      const matchesCompany = !currentCompanyId || !companyId || companyId === currentCompanyId;
      const matchesSearch = !searchTerm || fincaName.includes(searchTerm) || fincaSubtitle.includes(searchTerm);
      const isVisible = matchesCompany && matchesSearch;
      finca.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    const noCompanySelected = !currentCompanyId;
    const selectedCompanyName = company.name || "Sin empresa";

    document.querySelectorAll("[data-company-name-display]").forEach((node) => {
      node.textContent = noCompanySelected ? "Sin empresa" : selectedCompanyName;
    });
    document.querySelectorAll("[data-company-summary]").forEach((node) => {
      node.textContent = noCompanySelected
        ? "Primero selecciona una empresa para continuar."
        : `Fincas disponibles para ${selectedCompanyName}.`;
    });

    const emptyNode = document.querySelector("[data-finca-empty-state]");
    if (!emptyNode) return;

    if (visibleCount > 0 || noCompanySelected) {
      emptyNode.hidden = true;
      return;
    }

    const message = emptyNode.querySelector("[data-finca-empty-message]");
    if (message) {
      message.textContent = "No se encontraron fincas para esta empresa.";
    }
    emptyNode.hidden = false;
  }

  function updateCompanySelectionScope() {
    const companyCards = Array.from(document.querySelectorAll("[data-company-option]"));
    if (!companyCards.length) return;

    const searchTerm = (document.querySelector("[data-company-search]")?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    companyCards.forEach((company) => {
      const companyName = (company.dataset.companyName || company.dataset.companyItemName || "").toLowerCase();
      const companySubtitle = (company.dataset.companySubtitle || company.dataset.companyItemSubtitle || "").toLowerCase();
      const visible = !searchTerm || companyName.includes(searchTerm) || companySubtitle.includes(searchTerm);
      company.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const emptyNode = document.querySelector("[data-company-empty-state]");
    if (!emptyNode) return;
    emptyNode.hidden = visibleCount > 0;
  }

  function syncCompanySelectionFromContext() {
    const company = selectedCompany();
    const selectedId = company.id || "";
    if (!selectedId) return;
    document.querySelectorAll("[data-company-option]").forEach((option) => {
      option.setAttribute("aria-pressed", String(option.dataset.companyId === selectedId));
    });
  }

  function requireCompanyBeforeFinca() {
    const isFincaSelection = /[\\/]app[\\/]seleccion-finca\\.html$/i.test(window.location.pathname);
    if (!isFincaSelection) return false;

    const company = selectedCompany();
    if (!company.id) {
      showToast({
        type: "warning",
        title: "Empresa requerida",
        message: "Selecciona primero una empresa para filtrar las fincas."
      });
      window.setTimeout(() => {
        navigateTo(resolveRelativeUrl("seleccion-empresa.html"));
      }, 320);
      return true;
    }

    return false;
  }

  function drawerIcon(path) {
    return '<svg class="sial-icon" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  }

  const drawerMenuGroups = [
    {
      label: "ZE Puerto / Control de contenedores",
      aria: "Navegacion ZE Puerto",
      items: [
        { href: "../puerto-ze/index.html", label: "Dashboard ZE Puerto", icon: drawerIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>') },
        { href: "../puerto-ze/recepcion-ze.html", label: "HU758 · Recepción en ZE", icon: drawerIcon('<path d="M3 17h18"/><path d="M6 17V7h12v10"/><path d="M8 11h8"/>') },
        { href: "../puerto-ze/inspeccion-externa.html?selectContainer=1", label: "HU557 - Inspeccion externa ZE", icon: drawerIcon('<path d="M3 7h18"/><path d="M5 7v10h14V7"/><path d="M8 11h8"/><path d="M8 14h5"/>') },
        { href: "../puerto-ze/inspeccion-interna.html?selectContainer=1", label: "HU558 - Inspeccion interna ZE", icon: drawerIcon('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8"/><path d="M8 13h8"/>') },
        { href: "../pallets/rearmar-pallet.html", label: "HU344 - Rearmar pallets en ZE", icon: drawerIcon('<path d="M4 6h7v5H4z"/><path d="M4 13h7v5H4z"/><path d="M15 9h5v6h-5z"/><path d="m11 8 4 4-4 4"/>') },
        { href: "../puerto-ze/despacho-finca.html", label: "HU303 · Salida ZE", icon: drawerIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>') },
        { href: "../puerto-ze/hu1431-despacho-contenedor-finca.html", label: "HU1431 - Despacho contenedor a finca", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="M8 11h8"/><path d="m13 6 6 6-6 6"/>') }
      ]
    },
    {
      label: "Retorno ZE / Puerto",
      aria: "Navegacion ciclo retorno",
      items: [
        { href: "../puerto-ze/recepcion-ze-retorno.html", label: "Recepcion ZE retorno", icon: drawerIcon('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>') },
        { href: "../puerto-ze/hu342-descarga-pallets.html", label: "HU342 - Descargar pallets", icon: drawerIcon('<path d="M4 6h16v9H4z"/><path d="m8 19 4-4 4 4"/><path d="M12 15v6"/>') },
        { href: "../pallets/rearmar-pallet.html", label: "HU344 - Rearmar pallets en ZE", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="m8 12 3 3 5-6"/><path d="M8 4h8"/>') },
        { href: "../puerto-ze/hu347-cargue-consolidado.html", label: "HU347 - Cargue consolidado", icon: drawerIcon('<path d="M4 8h16v10H4z"/><path d="M8 8V5h8v3"/><path d="M8 13h8"/>') },
        { href: "../puerto-ze/despacho-puerto.html", label: "Despacho puerto", icon: drawerIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/><path d="M4 18h16"/>') },
        { href: "../puerto-ze/recepcion-puerto.html", label: "Recepcion puerto", icon: drawerIcon('<path d="M4 8h16"/><path d="M6 8v9h12V8"/><path d="M8 17h8"/>') },
        { href: "../puerto-ze/entrega-puerto.html", label: "Entrega en puerto", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="M7 20h10"/><path d="M9 17v3"/><path d="M15 17v3"/>') }
      ]
    },
    {
      label: "Finca",
      aria: "Navegacion finca",
      items: [
        { href: "../finca/recepcion-finca.html", label: "HU759 · Ingreso en Finca", icon: drawerIcon('<path d="M4 17 10 7l4 6 2-3 4 7Z"/><path d="M3 20h18"/>') },
        { href: "../finca/consulta-contenedores.html", label: "Trazabilidad contenedores", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="M8 11h8"/><path d="M8 14h5"/>') },
        { href: "../finca/consulta-pallets.html", label: "Pallets por finca", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2"/><path d="M8 17v2"/><path d="M16 17v2"/>') },
        { href: "../finca/consulta-vehiculos.html", label: "Trazabilidad vehículos", icon: drawerIcon('<path d="M3 11h12v7H3z"/><path d="M15 13h3l3 3v2h-6z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>') },
        { href: "../finca/inspeccion-externa.html?selectContainer=1", label: "Inspeccion externa", icon: drawerIcon('<path d="M3 7h18"/><path d="M5 7v10h14V7"/><path d="M8 11h8"/>') },
        { href: "../finca/inspeccion-interna.html?selectContainer=1", label: "Inspeccion interna", icon: drawerIcon('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8"/><path d="M8 13h8"/>') },
        { href: "../finca/sesion-responsabilidad.html", label: "Sesion responsabilidad", icon: drawerIcon('<path d="M6 20V4h12v16"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/>') },
        { href: "../finca/cierre-contenedor.html", label: "Cierre de contenedor", icon: drawerIcon('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>') },
        { href: "../finca/despacho-ze.html", label: "Salida de Finca", icon: drawerIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>') }
      ]
    },
    {
      label: "Pallets",
      aria: "Navegacion pallets",
      items: [
        { href: "../pallets/armar-pallet.html", label: "HU591 - Armar pallet", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2"/><path d="M8 17v2"/><path d="M16 17v2"/>') },
        { href: "../pallets/rearmar-pallet.html", label: "HU344 - Rearmar pallets en ZE", icon: drawerIcon('<path d="M4 6h7v5H4z"/><path d="M4 13h7v5H4z"/><path d="M15 9h5v6h-5z"/><path d="m11 8 4 4-4 4"/>') },
        { href: "../pallets/consulta-pallets.html", label: "Consulta Pallet’s", icon: drawerIcon('<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/><path d="M7 10h6"/>') },
        { href: "../pallets/reetiquetar-pallet.html", label: "Re-etiquetar pallet", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="m8 12 3 3 5-6"/><path d="M7 20h10"/>') },
        { href: "../pallets/cargar-pallets.html", label: "HU332 - Cargue contenedor", icon: drawerIcon('<path d="M12 5v14"/><path d="M5 12h14"/>') },
        { href: "../pallets/cargue-camion-finca.html", label: "HU332 - Cargue de camión", icon: drawerIcon('<rect x="3" y="7" width="13" height="9" rx="1"/><path d="M16 10h3l2 3v3h-5"/><circle cx="7" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>') }
      ]
    },
    {
      label: "Documentos",
      aria: "Navegacion documental",
      items: [
        { href: "../poma/consulta-generacion.html", label: "HU337 - Consulta y generación POMA", icon: drawerIcon('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h4"/><path d="M9 13h7"/><path d="M9 17h7"/>') }
      ]
    },
    {
      label: "Materiales y suministros",
      aria: "Navegacion materiales y suministros",
      items: [
        { href: "../materiales/index.html", label: "Materiales", icon: drawerIcon('<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/>') },
        { href: "../materiales/pedido-sugerido.html", label: "Pedido sugerido", icon: drawerIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>') },
        { href: "../materiales/pedido-adicional.html", label: "Pedido adicional", icon: drawerIcon('<path d="M12 5v14"/><path d="M5 12h14"/><path d="M4 4h16v16H4z"/>') },
        { href: "../materiales/inventario-finca.html", label: "Inventario finca", icon: drawerIcon('<path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2"/>') },
        { href: "../materiales/ordenes-asignadas.html", label: "Ordenes asignadas", icon: drawerIcon('<path d="M3 7h11v10H3z"/><path d="M14 11h4l3 3v3h-7z"/>') },
        { href: "../materiales/registrar-entrega.html", label: "Registrar entrega", icon: drawerIcon('<path d="M20 6 9 17l-5-5"/><path d="M4 20h16"/>') },
        { href: "../materiales/pallets.html", label: "Pallets materiales", icon: drawerIcon('<path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/>') }
      ]
    },
    {
      label: "Trazabilidad",
      aria: "Navegacion trazabilidad",
      items: [
        { href: "../trazabilidad/sincronizacion.html", label: "Sincronización móvil", icon: drawerIcon('<path d="M20 7h-7V3"/><path d="m20 7-4-4"/><path d="M4 17h7v4"/><path d="m4 17 4 4"/>') },
        { href: "../trazabilidad/evidencias.html", label: "Evidencias operativas", icon: drawerIcon('<path d="M4 8a2 2 0 0 1 2-2h3l1.5-2h3L15 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="12.5" r="3.2"/>') },
        { href: "../trazabilidad/consultar-contenedor.html", label: "Consultar contenedor", icon: drawerIcon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') },
        { href: "../trazabilidad/consultar-operacion.html", label: "Consultar operacion", icon: drawerIcon('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>') }
      ]
    },
    {
      label: "Sistema de diseño",
      aria: "Navegacion sistema de diseño",
      items: [
        { href: "../libreria/index.html", label: "Librería", icon: drawerIcon('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/>') }
      ]
    }
  ];

  function shouldMountGlobalDrawer() {
    const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
    const isLibrary = Boolean(document.querySelector(".library-shell"));
    if (!document.querySelector(".sial-page") && !isLibrary) return false;
    if (document.querySelector(".login-screen")) return false;
    if (path.includes("/login/")) return false;
    if (path.endsWith("/index.html") && !isLibrary && !path.includes("/app/") && !path.includes("/puerto-ze/") && !path.includes("/materiales/")) return false;
    if (path.includes("/app/seleccion-empresa.html") || path.includes("/app/seleccion-finca.html")) return false;
    if (document.body.hasAttribute("data-sial-no-drawer")) return false;
    return true;
  }

  function linkMatchesCurrentPage(href) {
    try {
      const target = new URL(href, window.location.href);
      const current = new URL(window.location.href);
      return target.pathname.replace(/\/+$/, "") === current.pathname.replace(/\/+$/, "");
    } catch (_) {
      return false;
    }
  }

  function renderDrawerMenuGroup(group) {
    return [
      '<nav class="sial-menu-group" aria-label="' + group.aria + '">',
      '<p class="sial-menu-label">' + group.label + '</p>',
      group.items.map((item) => {
        const href = resolveRelativeUrl(item.href);
        const active = linkMatchesCurrentPage(href) ? " active" : "";
        return '<a class="sial-menu-link' + active + '" href="' + href + '">' + item.icon + item.label + '</a>';
      }).join(""),
      "</nav>"
    ].join("");
  }

  function renderDrawerMenuGroups() {
    return drawerMenuGroups.map(renderDrawerMenuGroup).join("");
  }

  function normalizeDrawerSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function updateDrawerSearch(drawer, rawQuery) {
    const content = drawer?.querySelector(".sial-drawer-content");
    if (!content) return;

    const term = normalizeDrawerSearch(rawQuery);
    let visibleLinks = 0;
    content.querySelectorAll(".sial-menu-group").forEach((group) => {
      const groupLabel = normalizeDrawerSearch(group.querySelector(".sial-menu-label")?.textContent);
      let visibleInGroup = 0;
      group.querySelectorAll(".sial-menu-link").forEach((link) => {
        const matches = !term || groupLabel.includes(term) || normalizeDrawerSearch(link.textContent).includes(term);
        link.hidden = !matches;
        if (matches) visibleInGroup += 1;
      });
      group.hidden = visibleInGroup === 0;
      visibleLinks += visibleInGroup;
    });

    const clearButton = drawer.querySelector("[data-drawer-search-clear]");
    const status = drawer.querySelector("[data-drawer-search-status]");
    const emptyState = drawer.querySelector("[data-drawer-search-empty]");
    if (clearButton) clearButton.hidden = !term;
    if (status) {
      status.hidden = !term;
      status.textContent = term ? visibleLinks + (visibleLinks === 1 ? " resultado" : " resultados") : "";
    }
    if (emptyState) emptyState.hidden = !term || visibleLinks > 0;
  }

  function mountDrawerSearch(drawer) {
    const content = drawer?.querySelector(".sial-drawer-content");
    if (!content || drawer.querySelector("[data-drawer-search]")) return;

    const search = document.createElement("section");
    search.className = "sial-drawer-search";
    search.setAttribute("role", "search");
    search.setAttribute("aria-label", "Buscar vistas del menu");
    search.innerHTML = [
      '<label class="sial-drawer-search-box">',
      drawerIcon('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
      '<input type="search" inputmode="search" autocomplete="off" placeholder="Buscar vista o proceso" aria-label="Buscar vista o proceso" data-drawer-search>',
      '<button type="button" data-drawer-search-clear aria-label="Limpiar busqueda" hidden>',
      drawerIcon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
      '</button>',
      '</label>',
      '<p class="sial-drawer-search-status" data-drawer-search-status aria-live="polite" hidden></p>'
    ].join("");

    const emptyState = document.createElement("div");
    emptyState.className = "sial-drawer-search-empty";
    emptyState.dataset.drawerSearchEmpty = "";
    emptyState.hidden = true;
    emptyState.innerHTML = [
      drawerIcon('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
      '<strong>Sin coincidencias</strong>',
      '<span>Prueba con el nombre de una vista, proceso o HU.</span>'
    ].join("");

    drawer.insertBefore(search, content);
    content.prepend(emptyState);

    const input = search.querySelector("[data-drawer-search]");
    const clearButton = search.querySelector("[data-drawer-search-clear]");
    input?.addEventListener("input", () => {
      content.scrollTop = 0;
      updateDrawerSearch(drawer, input.value);
    });
    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !input.value) return;
      event.stopPropagation();
      input.value = "";
      updateDrawerSearch(drawer, "");
    });
    clearButton?.addEventListener("click", () => {
      input.value = "";
      updateDrawerSearch(drawer, "");
      input.focus();
    });
  }

  function prepareDrawerState(drawer, backdrop) {
    if (!(drawer instanceof HTMLElement)) return;
    const state = drawer.dataset.state || "closed";
    drawer.dataset.state = state;
    if (state === "closed") {
      drawer.inert = true;
      drawer.setAttribute("aria-hidden", "true");
      if (backdrop) backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function ensureGlobalDrawer() {
    if (!shouldMountGlobalDrawer()) return;
    const existingDrawer = document.querySelector(".sial-drawer");
    if (existingDrawer) {
      const content = existingDrawer.querySelector(".sial-drawer-content");
      const farmGroup = drawerMenuGroups.find((group) => group.aria === "Navegacion finca");
      const existingFarm = content?.querySelector('[aria-label="Navegacion finca"]');
      if (existingFarm && farmGroup) {
        existingFarm.insertAdjacentHTML("afterend", renderDrawerMenuGroup(farmGroup));
        existingFarm.remove();
      }
      const palletsGroup = drawerMenuGroups.find((group) => group.aria === "Navegacion pallets");
      const existingPallets = content?.querySelector('[aria-label="Navegacion pallets"]');
      if (existingPallets && palletsGroup) {
        existingPallets.insertAdjacentHTML("afterend", renderDrawerMenuGroup(palletsGroup));
        existingPallets.remove();
      }
      const traceabilityGroup = drawerMenuGroups.find((group) => group.aria === "Navegacion trazabilidad");
      const existingTraceability = content?.querySelector('[aria-label="Navegacion trazabilidad"]');
      if (existingTraceability && traceabilityGroup) {
        existingTraceability.insertAdjacentHTML("afterend", renderDrawerMenuGroup(traceabilityGroup));
        existingTraceability.remove();
      }
      const hasMaterials = content?.querySelector('[aria-label="Navegacion materiales y suministros"]');
      const materialsGroup = drawerMenuGroups.find((group) => group.aria === "Navegacion materiales y suministros");
      if (content && !hasMaterials && materialsGroup) content.insertAdjacentHTML("beforeend", renderDrawerMenuGroup(materialsGroup));
      const hasDesignSystem = content?.querySelector('[aria-label="Navegacion sistema de diseño"]');
      const designSystemGroup = drawerMenuGroups.find((group) => group.aria === "Navegacion sistema de diseño");
      if (content && !hasDesignSystem && designSystemGroup) content.insertAdjacentHTML("beforeend", renderDrawerMenuGroup(designSystemGroup));
      mountDrawerSearch(existingDrawer);
      return;
    }
    const brandSrc = resolveRelativeUrl("../assets/brand/isotipo-sial.svg");
    const backdrop = document.createElement("div");
    backdrop.className = "sial-drawer-backdrop";
    backdrop.dataset.drawerClose = "";
    const drawer = document.createElement("aside");
    drawer.className = "sial-drawer";
    drawer.setAttribute("aria-label", "Menu principal");
    drawer.innerHTML = [
      '<header class="sial-drawer-head">',
      '<div class="sial-drawer-user">',
      '<span class="sial-app-isotype" aria-hidden="true"><img src="' + brandSrc + '" alt=""></span>',
      '<div class="sial-context-text"><strong data-context-name>Finca Santa Isabel</strong><span>operador.sial</span></div>',
      '</div>',
      '<button class="sial-btn sial-btn-icon" type="button" data-drawer-close aria-label="Cerrar menu">',
      drawerIcon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
      '</button>',
      '</header>',
      '<div class="sial-drawer-content">',
      renderDrawerMenuGroups(),
      '</div>',
      '<a class="sial-btn sial-btn-secondary sial-btn-full" href="' + resolveRelativeUrl("../app/seleccion-empresa.html") + '">Cambiar finca</a>'
    ].join("");
    document.body.append(backdrop, drawer);
    mountDrawerSearch(drawer);
    prepareDrawerState(drawer, backdrop);
    hydrateContext();
  }

  function openDrawer() {
    if (!document.querySelector(".sial-drawer")) ensureGlobalDrawer();
    const drawer = document.querySelector(".sial-drawer");
    const backdrop = document.querySelector(".sial-drawer-backdrop");
    if (!drawer || !backdrop || drawer.dataset.state === "open" || drawer.dataset.state === "opening") return drawer;

    if (drawer._sialStateTimer) window.clearTimeout(drawer._sialStateTimer);
    drawer.inert = false;
    drawer.removeAttribute("aria-hidden");
    backdrop.removeAttribute("aria-hidden");
    drawer.dataset.state = "opening";
    document.body.classList.remove("drawer-closing");
    document.body.classList.add("drawer-opening");
    mountModalLayer(drawer, {
      panel: drawer,
      relatedElements: [backdrop],
      initialFocus: "[data-drawer-close]",
      onEscape: function() { closeDrawer(); }
    });

    window.requestAnimationFrame(function() {
      if (drawer.dataset.state !== "opening") return;
      document.body.classList.add("drawer-open");
      if (prefersReducedMotion()) {
        drawer.dataset.state = "open";
        document.body.classList.remove("drawer-opening");
        return;
      }
      drawer._sialStateTimer = window.setTimeout(function() {
        if (drawer.dataset.state === "opening") drawer.dataset.state = "open";
        document.body.classList.remove("drawer-opening");
        drawer._sialStateTimer = 0;
      }, 240);
    });
    return drawer;
  }

  function closeDrawer(options = {}) {
    const drawer = document.querySelector(".sial-drawer");
    const backdrop = document.querySelector(".sial-drawer-backdrop");
    document.body.classList.remove("sial-edge-swipe-active");
    if (!drawer || drawer.dataset.state === "closed" || drawer.dataset.state === "closing") return;

    if (drawer._sialStateTimer) window.clearTimeout(drawer._sialStateTimer);
    drawer.dataset.state = "closing";
    document.body.classList.remove("drawer-open", "drawer-opening");
    document.body.classList.add("drawer-closing");

    const finish = function() {
      drawer.dataset.state = "closed";
      drawer.inert = true;
      drawer.setAttribute("aria-hidden", "true");
      if (backdrop) backdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("drawer-closing");
      drawer._sialStateTimer = 0;
      unmountModalLayer(drawer, { restoreFocus: options.restoreFocus !== false });
    };

    if (options.immediate || prefersReducedMotion()) {
      finish();
      return;
    }
    drawer._sialStateTimer = window.setTimeout(finish, dialogExitDelay);
  }

  function activeBlockingOverlay() {
    return Boolean(document.querySelector(".sial-modal-backdrop, .sial-camera-overlay, .sial-photo-viewer, .sial-logo-intro"));
  }

  function suppressCommittedGestureClick() {
    suppressNextEdgeClick = true;
    window.setTimeout(() => {
      suppressNextEdgeClick = false;
    }, 420);
  }

  function gestureShouldIgnoreTarget(target, options = {}) {
    if (!target) return false;
    if (document.body.classList.contains("drawer-open")) {
      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }
    if (options.fromEdge) {
      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }
    if (target.closest("input, textarea, select, button, a, [contenteditable='true']")) return true;
    if (document.activeElement && document.activeElement.matches("input, textarea, select, [contenteditable='true']")) return true;
    return false;
  }

  function startDrawerGesture(event) {
    if (!shouldMountGlobalDrawer()) return;
    if (event.pointerType && !["touch", "pen", "mouse"].includes(event.pointerType)) return;
    if (activeBlockingOverlay()) return;
    const drawerOpen = document.body.classList.contains("drawer-open");
    const startsAtEdge = event.clientX <= drawerEdgeStartWidth;
    if (!drawerOpen && !startsAtEdge) return;
    if (gestureShouldIgnoreTarget(event.target, { fromEdge: startsAtEdge })) return;
    edgeGesture = {
      mode: drawerOpen ? "close" : "open",
      startX: event.clientX,
      startY: event.clientY,
      active: true,
      committed: false
    };
  }

  function moveDrawerGesture(event) {
    if (!edgeGesture || !edgeGesture.active) return;
    const dx = event.clientX - edgeGesture.startX;
    const dy = event.clientY - edgeGesture.startY;
    if (Math.abs(dy) > drawerGestureVerticalCancel && Math.abs(dy) > Math.abs(dx)) {
      document.body.classList.remove("sial-edge-swipe-active");
      edgeGesture = null;
      return;
    }
    if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
      document.body.classList.add("sial-edge-swipe-active");
    }
    if (edgeGesture.mode === "open" && dx >= drawerGestureOpenThreshold) {
      edgeGesture.committed = true;
      openDrawer();
      suppressCommittedGestureClick();
      document.body.classList.remove("sial-edge-swipe-active");
      edgeGesture = null;
    }
    if (edgeGesture && edgeGesture.mode === "close" && dx <= -drawerGestureOpenThreshold) {
      edgeGesture.committed = true;
      closeDrawer();
      suppressCommittedGestureClick();
      edgeGesture = null;
    }
  }

  function endDrawerGesture() {
    document.body.classList.remove("sial-edge-swipe-active");
    edgeGesture = null;
  }

  let sharedComponentUid = 0;

  function nextComponentId(prefix) {
    sharedComponentUid += 1;
    return `${prefix}-${sharedComponentUid}`;
  }

  function mountTabs(scope = document) {
    const rootNode = resolveElement(scope) || scope;
    if (!rootNode?.querySelectorAll) return [];
    const tablists = Array.from(rootNode.querySelectorAll(".sial-tabs, [role='tablist']"));

    tablists.forEach((tablist) => {
      if (tablist.dataset.sialTabsMounted === "true") return;
      const tabs = Array.from(tablist.querySelectorAll(".sial-tab, [role='tab']"));
      if (!tabs.length) return;
      tablist.dataset.sialTabsMounted = "true";
      if (!tablist.hasAttribute("role")) tablist.setAttribute("role", "tablist");

      function activateTab(tab, options = {}) {
        const targetId = tab.getAttribute("aria-controls") || tab.dataset.tabTarget || "";
        tabs.forEach((candidate) => {
          const active = candidate === tab;
          candidate.classList.toggle("active", active);
          candidate.setAttribute("aria-selected", String(active));
          candidate.setAttribute("tabindex", active ? "0" : "-1");
          const panelId = candidate.getAttribute("aria-controls") || candidate.dataset.tabTarget || "";
          if (!panelId) return;
          const panel = document.getElementById(panelId);
          if (!panel) return;
          panel.hidden = !active;
          panel.setAttribute("role", "tabpanel");
          if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
        });
        tablist.dispatchEvent(new CustomEvent("sial:tabchange", {
          bubbles: true,
          detail: { tab, value: tab.dataset.value || targetId || tab.textContent.trim() }
        }));
        if (options.focus) tab.focus({ preventScroll: true });
      }

      tabs.forEach((tab) => {
        tab.setAttribute("role", "tab");
        if (!tab.id) tab.id = nextComponentId("sial-tab");
        const targetId = tab.getAttribute("aria-controls") || tab.dataset.tabTarget;
        const panel = targetId ? document.getElementById(targetId) : null;
        if (panel && !panel.getAttribute("aria-labelledby")) panel.setAttribute("aria-labelledby", tab.id);
        tab.addEventListener("click", () => activateTab(tab));
      });

      tablist.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(document.activeElement);
        if (currentIndex < 0) return;
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === currentIndex && !["Home", "End"].includes(event.key)) return;
        event.preventDefault();
        activateTab(tabs[nextIndex], { focus: true });
      });

      activateTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true" || tab.classList.contains("active")) || tabs[0]);
    });
    return tablists;
  }

  function mountSegmentedControls(scope = document) {
    const rootNode = resolveElement(scope) || scope;
    if (!rootNode?.querySelectorAll) return [];
    const groups = Array.from(rootNode.querySelectorAll(".sial-segmented"));
    groups.forEach((group) => {
      if (group.dataset.sialSegmentedMounted === "true") return;
      const options = Array.from(group.querySelectorAll(".sial-segment-option"));
      if (!options.length) return;
      group.dataset.sialSegmentedMounted = "true";
      group.setAttribute("role", group.getAttribute("role") || "group");

      function selectOption(option, shouldFocus = false) {
        options.forEach((candidate) => {
          const selected = candidate === option;
          candidate.classList.toggle("active", selected);
          candidate.setAttribute("aria-pressed", String(selected));
          candidate.setAttribute("tabindex", selected ? "0" : "-1");
        });
        group.dispatchEvent(new CustomEvent("sial:segmentchange", {
          bubbles: true,
          detail: { option, value: option.dataset.value || option.textContent.trim() }
        }));
        if (shouldFocus) option.focus({ preventScroll: true });
      }

      options.forEach((option) => option.addEventListener("click", () => selectOption(option)));
      group.addEventListener("keydown", (event) => {
        const currentIndex = options.indexOf(document.activeElement);
        if (currentIndex < 0 || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % options.length;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + options.length) % options.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = options.length - 1;
        selectOption(options[nextIndex], true);
      });
      selectOption(options.find((option) => option.getAttribute("aria-pressed") === "true" || option.classList.contains("active")) || options[0]);
    });
    return groups;
  }

  function mountOtpGroups(scope = document) {
    const rootNode = resolveElement(scope) || scope;
    if (!rootNode?.querySelectorAll) return [];
    const groups = Array.from(rootNode.querySelectorAll(".sial-otp-group"));
    groups.forEach((group) => {
      if (group.dataset.sialOtpMounted === "true") return;
      const inputs = Array.from(group.querySelectorAll(".sial-otp-input, [data-recovery-otp]"));
      if (!inputs.length) return;
      group.dataset.sialOtpMounted = "true";

      function publishOtp() {
        const value = inputs.map((input) => input.value.replace(/\D/g, "").slice(0, 1)).join("");
        const complete = value.length === inputs.length;
        group.dataset.complete = String(complete);
        group.dispatchEvent(new CustomEvent("sial:otpchange", { bubbles: true, detail: { value, complete } }));
      }

      function distributeDigits(rawValue) {
        const digits = String(rawValue || "").replace(/\D/g, "").slice(0, inputs.length).split("");
        inputs.forEach((input, index) => {
          input.value = digits[index] || "";
          input.classList.toggle("has-value", Boolean(input.value));
        });
        inputs[Math.min(digits.length, inputs.length - 1)]?.focus({ preventScroll: true });
        publishOtp();
      }

      inputs.forEach((input, index) => {
        input.maxLength = 1;
        input.inputMode = "numeric";
        input.autocapitalize = "none";
        input.autocorrect = "off";
        input.spellcheck = false;
        if (!input.getAttribute("aria-label")) input.setAttribute("aria-label", `Digito ${index + 1} del codigo`);
        input.classList.toggle("has-value", Boolean(input.value));
        input.addEventListener("input", () => {
          const digits = input.value.replace(/\D/g, "");
          if (digits.length > 1) {
            distributeDigits(digits);
            return;
          }
          input.value = digits;
          input.classList.toggle("has-value", Boolean(input.value));
          if (input.value) inputs[index + 1]?.focus({ preventScroll: true });
          publishOtp();
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Backspace" && !input.value && inputs[index - 1]) inputs[index - 1].focus({ preventScroll: true });
          if (event.key === "ArrowLeft" && inputs[index - 1]) inputs[index - 1].focus({ preventScroll: true });
          if (event.key === "ArrowRight" && inputs[index + 1]) inputs[index + 1].focus({ preventScroll: true });
        });
        input.addEventListener("paste", (event) => {
          event.preventDefault();
          distributeDigits(event.clipboardData?.getData("text") || "");
        });
      });
      publishOtp();
    });
    return groups;
  }

  function mountSignaturePad(target, options = {}) {
    const container = resolveElement(target);
    if (!container) return null;
    if (container.sialSignatureController) return container.sialSignatureController;
    container.classList.add("sial-signature-pad", "is-interactive");
    container.replaceChildren();

    const canvas = document.createElement("canvas");
    canvas.className = "sial-signature-canvas";
    canvas.setAttribute("aria-label", options.label || "Area para firma digital");
    canvas.setAttribute("role", "img");
    canvas.tabIndex = 0;
    const actions = document.createElement("div");
    actions.className = "sial-signature-actions";
    const clearButton = document.createElement("button");
    clearButton.className = "sial-btn sial-btn-secondary";
    clearButton.type = "button";
    clearButton.textContent = options.clearLabel || "Limpiar firma";
    const confirmButton = document.createElement("button");
    confirmButton.className = "sial-btn sial-btn-primary";
    confirmButton.type = "button";
    confirmButton.textContent = options.confirmLabel || "Confirmar firma";
    confirmButton.disabled = true;
    actions.append(clearButton, confirmButton);
    container.append(canvas, actions);

    const context = canvas.getContext("2d");
    let drawing = false;
    let hasInk = false;

    function resizeCanvas() {
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width || container.clientWidth || 320));
      const height = Math.max(150, Math.round(rect.height || 180));
      if (canvas.width === Math.round(width * ratio) && canvas.height === Math.round(height * ratio)) return;
      const snapshot = hasInk ? canvas.toDataURL("image/png") : "";
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineWidth = 2.25;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--sial-primary-500").trim() || "#005CA8";
      if (snapshot) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, width, height);
        image.src = snapshot;
      }
    }

    function pointFor(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function begin(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      drawing = true;
      canvas.setPointerCapture?.(event.pointerId);
      const point = pointFor(event);
      context.beginPath();
      context.moveTo(point.x, point.y);
    }

    function draw(event) {
      if (!drawing) return;
      event.preventDefault();
      const point = pointFor(event);
      context.lineTo(point.x, point.y);
      context.stroke();
      hasInk = true;
      confirmButton.disabled = false;
      container.dataset.signatureState = "draft";
      if (options.trackUnsavedChanges) markUnsavedChanges("signature");
      options.onChange?.({ empty: false });
    }

    function end(event) {
      if (!drawing) return;
      drawing = false;
      canvas.releasePointerCapture?.(event.pointerId);
    }

    function clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      hasInk = false;
      confirmButton.disabled = true;
      container.dataset.signatureState = "empty";
      options.onChange?.({ empty: true });
    }

    function value() {
      return hasInk ? canvas.toDataURL("image/png") : "";
    }

    canvas.addEventListener("pointerdown", begin);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    clearButton.addEventListener("click", clear);
    confirmButton.addEventListener("click", () => {
      if (!hasInk) return;
      container.dataset.signatureState = "confirmed";
      if (options.trackUnsavedChanges) clearUnsavedChanges();
      options.onConfirm?.(value());
    });
    resizeCanvas();
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resizeCanvas) : null;
    resizeObserver?.observe(container);
    container.dataset.signatureState = "empty";
    container.sialSignatureController = { clear, value, canvas, destroy: () => resizeObserver?.disconnect() };
    return container.sialSignatureController;
  }

  function setEvidenceProgress(target, options = {}) {
    const progress = resolveElement(target);
    if (!progress) return null;
    const count = Math.max(0, Number(options.count || 0));
    const minimum = Math.max(0, Number(options.min || 0));
    const maximum = Math.max(minimum || 1, Number(options.max || minimum || 1));
    const percent = Math.min(100, Math.round((count / maximum) * 100));
    const fill = progress.querySelector(".sial-evidence-progress-fill");
    const label = progress.querySelector("[data-evidence-progress-label]");
    if (fill) {
      fill.style.width = `${percent}%`;
      fill.classList.toggle("danger", count < minimum);
      fill.classList.toggle("warning", count >= minimum && count < maximum);
    }
    if (label) label.textContent = options.label || `${count} de ${minimum}-${maximum} evidencias`;
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(maximum));
    progress.setAttribute("aria-valuenow", String(Math.min(count, maximum)));
    progress.dataset.complete = String(count >= minimum && count <= maximum);
    return { count, minimum, maximum, percent, complete: count >= minimum && count <= maximum };
  }

  function setSyncState(target, options = {}) {
    const item = resolveElement(target);
    if (!item) return null;
    const state = ["pending", "syncing", "success", "error"].includes(options.state) ? options.state : "pending";
    item.classList.remove("pending", "syncing", "success", "error");
    item.classList.add(state);
    item.dataset.syncState = state;
    item.setAttribute("aria-busy", String(state === "syncing"));
    const title = item.querySelector("[data-sync-title]");
    const message = item.querySelector("[data-sync-message]");
    const status = item.querySelector("[data-sync-status]");
    if (title && options.title) title.textContent = options.title;
    if (message && options.message) message.textContent = options.message;
    if (status) status.textContent = options.label || ({ pending: "Pendiente", syncing: "En proceso", success: "OK", error: "Reintentar" })[state];
    item.dispatchEvent(new CustomEvent("sial:syncstatechange", { bubbles: true, detail: { state, options } }));
    return state;
  }

  function mountSelectControls(scope = document) {
    scope.querySelectorAll("[data-sial-select]").forEach(function(control) {
      if (control.dataset.sialSelectInitialized === "true") return;
      const nativeSelect = control.querySelector(".sial-select-native");
      const trigger = control.querySelector(".sial-select-trigger");
      const valueNode = control.querySelector("[data-sial-select-value]");
      const menu = control.querySelector(".sial-select-menu");
      if (!nativeSelect || !trigger || !valueNode || !menu) return;

      control.dataset.sialSelectInitialized = "true";
      const selectedIndex = function() { return Math.max(0, nativeSelect.selectedIndex); };
      const render = function() {
        menu.replaceChildren();
        Array.from(nativeSelect.options).forEach(function(option, index) {
          const item = document.createElement("button");
          item.className = "sial-select-option";
          item.type = "button";
          item.role = "option";
          item.dataset.value = option.value;
          item.disabled = option.disabled;
          item.setAttribute("aria-selected", String(index === selectedIndex()));
          item.textContent = option.textContent;
          menu.appendChild(item);
        });
        valueNode.textContent = nativeSelect.options[selectedIndex()]?.textContent || "Seleccionar";
      };
      const setOpen = function(open) {
        control.classList.toggle("is-open", open);
        menu.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
        if (open) menu.querySelector('[aria-selected="true"]')?.focus();
      };
      const choose = function(item) {
        if (item.disabled) return;
        nativeSelect.value = item.dataset.value || "";
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        render();
        setOpen(false);
        trigger.focus();
      };

      if (!trigger.getAttribute("aria-label")) trigger.setAttribute("aria-label", "Seleccionar opción");
      trigger.addEventListener("click", function() { setOpen(menu.hidden); });
      trigger.addEventListener("keydown", function(event) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setOpen(true);
        }
      });
      menu.addEventListener("click", function(event) {
        const item = event.target.closest("[data-value]");
        if (item) choose(item);
      });
      menu.addEventListener("keydown", function(event) {
        const options = Array.from(menu.querySelectorAll("[data-value]:not(:disabled)"));
        const current = options.indexOf(document.activeElement);
        if (event.key === "Escape") { setOpen(false); trigger.focus(); return; }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const next = event.key === "ArrowDown" ? current + 1 : current - 1;
          options[(next + options.length) % options.length]?.focus();
        }
        if ((event.key === "Enter" || event.key === " ") && document.activeElement?.dataset?.value !== undefined) {
          event.preventDefault();
          choose(document.activeElement);
        }
      });
      nativeSelect.addEventListener("change", render);
      document.addEventListener("click", function(event) { if (!control.contains(event.target)) setOpen(false); });
      render();
    });
  }

  function formatTimeForTrigger(value) {
    const normalized = normalizeTimeValue(value);
    if (!normalized) return "Seleccionar hora";
    const parts = normalized.split(":");
    const hour = Number(parts[0]);
    const minute = parts[1];
    const meridiem = hour >= 12 ? "p. m." : "a. m.";
    return String(hour % 12 || 12).padStart(2, "0") + ":" + minute + " " + meridiem;
  }

  function mountInlineTimePickers(scope = document) {
    const controls = [];
    if (scope instanceof Element && scope.matches("[data-sial-time-picker]")) controls.push(scope);
    if (scope && typeof scope.querySelectorAll === "function") controls.push(...scope.querySelectorAll("[data-sial-time-picker]"));
    controls.forEach((control) => {
      if (control.dataset.sialTimePickerInitialized === "true") return;
      const input = control.querySelector(".sial-time-input-native");
      const trigger = control.querySelector(".sial-time-trigger");
      const valueNode = control.querySelector("[data-sial-time-value]");
      const popover = control.querySelector(".sial-time-popover");
      if (!input || !trigger || !valueNode || !popover) return;
      control.dataset.sialTimePickerInitialized = "true";
      let selected = normalizeTimeValue(input.value) || currentTimeValue();
      const title = control.dataset.timePickerLabel || input.labels?.[0]?.textContent?.trim() || "Seleccionar hora";

      const syncTrigger = () => {
        valueNode.textContent = formatTimeForTrigger(input.value);
      };
      const setOpen = (open) => {
        popover.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
        control.classList.toggle("is-open", open);
        if (open) render();
      };
      const updateSelected = () => {
        const hour12 = Number(popover.querySelector("[data-time-only='hour']").value) % 12;
        const minute = popover.querySelector("[data-time-only='minute']").value;
        const meridiem = popover.querySelector("[data-time-only='meridiem']").value;
        selected = String(hour12 + (meridiem === "PM" ? 12 : 0)).padStart(2, "0") + ":" + minute;
      };
      const render = () => {
        const parts = selected.split(":");
        const hour24 = Number(parts[0]);
        const minute = Number(parts[1]);
        const hour12 = hour24 % 12 || 12;
        const minuteValues = Array.from({ length: 12 }, (_, index) => index * 5);
        if (!minuteValues.includes(minute)) minuteValues.push(minute);
        minuteValues.sort((left, right) => left - right);
        const hours = Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => '<option value="' + hour + '"' + (hour === hour12 ? " selected" : "") + ">" + String(hour).padStart(2, "0") + "</option>").join("");
        const minutes = minuteValues.map((item) => '<option value="' + String(item).padStart(2, "0") + '"' + (item === minute ? " selected" : "") + ">" + String(item).padStart(2, "0") + "</option>").join("");
        const meridiem = hour24 >= 12 ? "PM" : "AM";
        popover.innerHTML = [
          '<div class="sial-time-popover-head"><span>Hora seleccionada</span><strong>' + formatTimeForTrigger(selected) + "</strong></div>",
          '<div class="sial-time-popover-grid">',
          '<label><span>Hora</span><select data-time-only="hour" aria-label="Hora">' + hours + "</select></label>",
          '<label><span>Minutos</span><select data-time-only="minute" aria-label="Minutos">' + minutes + "</select></label>",
          '<label><span>Meridiano</span><select data-time-only="meridiem" aria-label="Meridiano"><option value="AM"' + (meridiem === "AM" ? " selected" : "") + '>a. m.</option><option value="PM"' + (meridiem === "PM" ? " selected" : "") + '>p. m.</option></select></label>',
          "</div>",
          '<div class="sial-time-popover-actions"><button class="sial-picker-action" type="button" data-time-only-action="clear">Borrar</button><span></span><button class="sial-picker-action" type="button" data-time-only-action="now">Ahora</button><button class="sial-picker-action is-primary" type="button" data-time-only-action="apply">Aplicar</button></div>'
        ].join("");
        popover.querySelectorAll("[data-time-only]").forEach((select) => select.addEventListener("change", () => {
          updateSelected();
          render();
        }));
        popover.querySelector("[data-time-only-action='clear']").addEventListener("click", () => {
          setTimePickerValue(input, "");
          setOpen(false);
          trigger.focus();
        });
        popover.querySelector("[data-time-only-action='now']").addEventListener("click", () => {
          selected = currentTimeValue();
          render();
        });
        popover.querySelector("[data-time-only-action='apply']").addEventListener("click", () => {
          setTimePickerValue(input, selected);
          setOpen(false);
          trigger.focus();
        });
      };

      popover.addEventListener("click", (event) => event.stopPropagation());
      trigger.setAttribute("aria-label", title);
      trigger.addEventListener("click", () => setOpen(popover.hidden));
      trigger.addEventListener("keydown", (event) => {
        if (!["Enter", " ", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        setOpen(true);
      });
      input.addEventListener("input", () => {
        selected = normalizeTimeValue(input.value) || currentTimeValue();
        syncTrigger();
      });
      input.addEventListener("change", syncTrigger);
      document.addEventListener("click", (event) => { if (!control.contains(event.target)) setOpen(false); });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !popover.hidden) {
          setOpen(false);
          trigger.focus();
        }
      });
      syncTrigger();
    });
  }

  setTheme(preferredTheme());
  hydrateContext();
  hydrateCompanyContext();
  refreshSelectionViews();
  ensureGlobalDrawer();
  ensureHeaderSessionAction();
  mountInlineTimePickers();
  mountTimePickers();
  mountTabs();
  mountSegmentedControls();
  mountOtpGroups();
  mountSelectControls();
  prepareDrawerState(document.querySelector(".sial-drawer"), document.querySelector(".sial-drawer-backdrop"));

  window.SialMobileUI = Object.assign(window.SialMobileUI || {}, {
    openPhotoCapture: function(config) { buildPhotoCaptureOverlay(config); },
    openCamera: function(config) { buildCameraOverlay(config); },
    openBarcodeScanner: function(config) { return openBarcodeScanner(config); },
    closeBarcodeScanner: function() { cancelBarcodeScanner(); },
    normalizeSscc,
    setTheme,
    motionApplications,
    openTimePicker,
    mountInlineTimePickers,
    mountTimePickers,
    setTimePickerValue,
    mountTabs,
    mountSegmentedControls,
    mountSelectControls,
    mountOtpGroups,
    mountSignaturePad,
    setEvidenceProgress,
    setSyncState,
    requestSignOut,
    ensureHeaderSessionAction,
    showToast,
    setInlineStatus,
    revealValidationError,
    clearInlineStatus,
    hydrateAlertStatuses,
    showBanner,
    hideBanner,
    playLogoIntro,
    openDialog,
    openDecisionSheet,
    openMobilePicker,
    closeDialog,
    mountModalLayer,
    unmountModalLayer,
    replayMotionState,
    navigateTo,
    markUnsavedChanges,
    clearUnsavedChanges,
    hasUnsavedChanges,
    openDrawer,
    closeDrawer,
    ensureGlobalDrawer,
    selectedContext,
    setSelectedContext,
    selectedCompany,
    setSelectedCompany,
    clearSelectedCompany,
    clearSelectedContext
  });

  hydrateAlertStatuses(document);
  observeAlertStatuses();
  startLogoIntroIfNeeded();

  document.addEventListener("click", (event) => {
    if (!suppressNextEdgeClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressNextEdgeClick = false;
  }, true);

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");
    if (!shouldAnimateAnchor(anchor, event)) return;
    event.preventDefault();
    navigateTo(anchor.href, { direction: navigationDirectionForAnchor(anchor), source: anchor });
  });

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-theme-toggle]");
    if (!toggle) return;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
  });
  document.addEventListener("click", (event) => {
    const logout = event.target.closest("[data-session-logout]");
    if (!logout) return;
    requestSignOut(logout);
  });


  document.addEventListener("click", (event) => {
    const passwordButton = event.target.closest("[data-password-toggle]");
    if (!passwordButton) return;
    const field = document.querySelector(passwordButton.dataset.passwordToggle);
    if (!field) return;
    const show = field.type === "password";
    field.type = show ? "text" : "password";
    passwordButton.setAttribute("aria-label", show ? "Ocultar contrasena" : "Mostrar contrasena");
    passwordButton.dataset.visible = String(show);
  });

  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-drawer-open]");
    if (open) {
      openDrawer();
      return;
    }
    const close = event.target.closest("[data-drawer-close]");
    if (close) {
      closeDrawer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (handleModalLayerKeydown(event)) return;
    if (event.key === "Escape") closeDrawer();
  });

  document.addEventListener("click", (event) => {
    const bannerDismiss = event.target.closest("[data-banner-dismiss]");
    if (bannerDismiss) {
      hideBanner(bannerDismiss.dataset.bannerDismiss);
      return;
    }
    const dialogClose = event.target.closest("[data-dialog-close]");
    if (dialogClose) {
      closeDialog(dialogClose.dataset.dialogClose);
    }
  });

  document.addEventListener("invalid", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    setFieldInvalid(field, true);
    const form = field.form || field.closest("form");
    if (!form) {
      revealValidationError(field, { field });
      return;
    }
    pendingValidationForm = form;
    window.clearTimeout(validationRedirectTimer);
    validationRedirectTimer = window.setTimeout(function() {
      const activeForm = pendingValidationForm;
      pendingValidationForm = null;
      if (!activeForm) return;
      const firstInvalid = activeForm.querySelector("input:invalid, select:invalid, textarea:invalid") || field;
      const status = ensureFormValidationStatus(activeForm);
      setInlineStatus(status, {
        type: "error",
        title: "Revisa " + validationFieldLabel(firstInvalid),
        message: validationMessageForField(firstInvalid),
        field: firstInvalid,
        form: activeForm
      });
    }, 0);
  }, true);

  document.addEventListener("input", (event) => {
    const correctedField = event.target.closest('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]');
    if (correctedField && correctedField.validity.valid) {
      setFieldInvalid(correctedField, false);
      const validationForm = correctedField.form || correctedField.closest("form");
      const remainingInvalid = validationForm && validationForm.querySelector('[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid');
      if (!remainingInvalid && validationForm) clearInlineStatus(ensureFormValidationStatus(validationForm));
    }

    const flowField = event.target.closest("[data-flow-form] input, [data-flow-form] select, [data-flow-form] textarea");
    if (flowField && !flowField.matches("[type='hidden'], [data-unsaved-ignore]")) {
      markUnsavedChanges("field");
    }

    const fincaSearch = event.target.closest("[data-finca-search]");
    if (fincaSearch) {
      updateFincaSelectionScope();
      return;
    }

    const companySearch = event.target.closest("[data-company-search]");
    if (companySearch) {
      updateCompanySelectionScope();
      return;
    }

    const field = event.target.closest("[data-login-form] input");
    if (!field) return;
    setFieldInvalid(field, false);
    const form = field.closest("[data-login-form]");
    const hasPendingRequired = Array.from(form.querySelectorAll("input[required]")).some((input) => !input.value.trim());
    if (!hasPendingRequired) clearInlineStatus(form.querySelector("[data-login-status]"));
  });

  document.addEventListener("change", (event) => {
    const flowField = event.target.closest("[data-flow-form] input, [data-flow-form] select, [data-flow-form] textarea");
    if (flowField && !flowField.matches("[type='hidden'], [data-unsaved-ignore]")) {
      markUnsavedChanges("field");
    }
  });

  document.addEventListener("pointerdown", startDrawerGesture, { passive: true });
  document.addEventListener("pointermove", moveDrawerGesture, { passive: false });
  document.addEventListener("pointerup", endDrawerGesture, { passive: true });
  document.addEventListener("pointercancel", endDrawerGesture, { passive: true });

  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      clearScreenMotionState();
      const historyDirection = consumeNavigationDirection(syncNavigationHistoryIndex());
      startScreenEntryMotion(historyDirection);
    } else {
      navigationInFlight = false;
    }
    refreshSelectionViews();
  });

  document.addEventListener("click", (event) => {
    const company = event.target.closest("[data-company-option]");
    if (company) {
      if (company.disabled || company.getAttribute("aria-disabled") === "true") {
        replayMotionState(company, "is-blocked-attempt", 420);
        showToast({
          type: "error",
          title: "Empresa no disponible",
          message: "Selecciona una empresa activa para continuar."
        });
        return;
      }

      document.querySelectorAll("[data-company-option]").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === company));
        option.classList.remove("is-continuing");
      });
      company.classList.add("is-continuing");

      setSelectedCompany({
        id: company.dataset.companyId,
        name: company.dataset.companyName || company.dataset.companyItemName || company.dataset.companyTitle || "Empresa",
        subtitle: company.dataset.companySubtitle || company.dataset.companyItemSubtitle || "Operacion movil",
        logo: company.dataset.companyLogo || company.dataset.companyItemLogo || ""
      });
      clearSelectedContext();

      showToast({
        type: "success",
        icon: "ok",
        title: "Empresa seleccionada",
        message: company.dataset.companyName || company.dataset.companyItemName || "Empresa activa.",
        duration: 1100
      });

      const next = company.dataset.next || resolveRelativeUrl("seleccion-finca.html");
      window.setTimeout(() => {
        company.classList.remove("is-continuing");
        if (next) navigateTo(next);
      }, 700);
      return;
    }

    const finca = event.target.closest("[data-finca-option]");
    if (!finca) return;
    if (requireCompanyBeforeFinca()) return;
    if (finca.disabled || finca.getAttribute("aria-disabled") === "true") {
      replayMotionState(finca, "is-blocked-attempt", 420);
      showToast({
        type: "error",
        title: "Finca no disponible",
        message: "Selecciona una finca activa para continuar."
      });
      return;
    }

    const selectedCompanyData = selectedCompany();
    const companyId = String(selectedCompanyData.id || "");
    const nextCompanyId = String(finca.dataset.companyId || "");
    if (companyId && nextCompanyId && companyId !== nextCompanyId) {
      showToast({
        type: "error",
        title: "Finca fuera de contexto",
        message: "La finca pertenece a otra empresa. Selecciona la empresa correcta."
      });
      window.setTimeout(() => {
        navigateTo(resolveRelativeUrl("seleccion-empresa.html"));
      }, 260);
      return;
    }

    document.querySelectorAll("[data-finca-option]").forEach((option) => {
      option.setAttribute("aria-pressed", String(option === finca));
      option.classList.remove("is-continuing");
    });
    finca.classList.add("is-continuing");

    const next = finca.dataset.next;
    setSelectedContext({
      id: finca.dataset.fincaId || finca.dataset.fincaValue || "",
      name: finca.dataset.fincaName || finca.dataset.contextName || "Contexto operativo",
      subtitle: finca.dataset.fincaSubtitle || "Operacion movil",
      logo: finca.dataset.fincaLogo || "SI",
      companyId: selectedCompanyData.id || "",
      companyName: selectedCompanyData.name || ""
    });
    showToast({
      type: "success",
      icon: "ok",
      title: "Finca seleccionada",
      message: finca.dataset.fincaName || "Contexto operativo activo.",
      duration: 1200
    });
    if (next) {
      window.setTimeout(() => {
        navigateTo(next);
      }, 700);
    } else {
      window.setTimeout(() => finca.classList.remove("is-continuing"), 900);
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-login-form]");
    if (!form) return;
    event.preventDefault();

    if (!validateLoginForm(form)) return;

    const submit = form.querySelector("[type='submit']");
    form.classList.add("is-submitting");
    if (submit) {
      submit.disabled = true;
      submit.classList.add("is-loading");
      submit.dataset.originalText = submit.textContent;
      submit.textContent = "Validando acceso...";
    }
    showToast({
      type: "info",
      title: "Validando credenciales",
      message: "Preparando seleccion de finca.",
      duration: 1400
    });

    window.setTimeout(() => {
      if (submit) {
        submit.disabled = false;
        submit.classList.remove("is-loading");
        submit.textContent = submit.dataset.originalText || "Ingresar";
      }
      form.classList.remove("is-submitting");
      showToast({
        type: "success",
        icon: "ok",
        title: "Acceso validado",
        message: "El siguiente paso ser\u00e1 selecci\u00f3n de empresa."
      });
      if (form.dataset.next) {
        window.setTimeout(() => {
          navigateTo(form.dataset.next);
        }, 780);
      }
    }, 900);
  });
})();
