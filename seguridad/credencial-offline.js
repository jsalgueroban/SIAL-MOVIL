(function () {
  const storageKey = "sial-offline-credential-proposal";
  const form = document.querySelector("[data-offline-form]");
  const activeView = document.querySelector("[data-active-credential]");
  const deviceContext = document.querySelector("[data-device-context]");
  const configConfirmation = document.querySelector("[data-config-confirmation]");
  const expirationField = document.querySelector("[data-expiration-field]");
  const expirationInput = document.querySelector("#offline-expiration");
  const expirationControl = expirationInput.closest("[data-sial-datetime-picker]");
  const expirationTrigger = expirationControl.querySelector(".sial-datetime-trigger");
  const expirationError = document.querySelector("[data-expiration-error]");
  const permanentWarning = document.querySelector("[data-permanent-warning]");
  const activeExpiration = document.querySelector("[data-active-expiration]");
  const removeCredential = document.querySelector("[data-remove-credential]");
  const expirationValue = document.querySelector("[data-expiration-value]");
  const expirationNote = document.querySelector("[data-expiration-note]");
  const modeButtons = Array.from(document.querySelectorAll("[data-expiration-mode]"));

  function toLocalInputValue(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function defaultExpiration() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
    return date;
  }

  function selectedMode() {
    return expirationValue.value;
  }

  function clearError() {
    expirationError.hidden = true;
    expirationError.textContent = "";
    expirationControl.classList.remove("has-error");
    expirationTrigger.removeAttribute("aria-invalid");
  }

  function showError(message) {
    expirationError.textContent = message;
    expirationError.hidden = false;
    expirationControl.classList.add("has-error");
    expirationTrigger.setAttribute("aria-invalid", "true");
    expirationTrigger.focus();
  }

  function syncMode() {
    const scheduled = selectedMode() === "scheduled";
    modeButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.expirationMode === expirationValue.value));
    });
    expirationField.hidden = !scheduled;
    expirationInput.required = scheduled;
    permanentWarning.hidden = scheduled;
    expirationNote.textContent = scheduled
      ? "Recomendado para reducir el tiempo de exposición."
      : "Permanecerá activa hasta que la elimines.";
    clearError();
  }

  function formatExpiration(value) {
    if (!value) return "Sin vencimiento";
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function renderActive(credential) {
    form.hidden = true;
    deviceContext.hidden = true;
    configConfirmation.hidden = true;
    activeView.hidden = false;
    activeExpiration.textContent = formatExpiration(credential.expiration);
  }

  function renderForm() {
    activeView.hidden = true;
    deviceContext.hidden = false;
    configConfirmation.hidden = false;
    form.hidden = false;
    syncMode();
  }

  function createCredential() {
    const mode = selectedMode();
    const credential = {
      mode: mode,
      expiration: mode === "scheduled" ? expirationInput.value : "",
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(credential));
    renderActive(credential);
    if (window.SialMobileUI) {
      window.SialMobileUI.showToast({
        type: "success",
        title: "Credencial generada",
        message: "El acceso offline quedó disponible en este dispositivo."
      });
    }
  }

  function confirmPermanent() {
    if (!window.SialMobileUI) {
      createCredential();
      return;
    }
    window.SialMobileUI.openDialog({
      id: "confirm-permanent-credential",
      role: "alertdialog",
      type: "warning",
      branded: true,
      dismissible: false,
      eyebrow: "SIAL · SEGURIDAD",
      title: "Generar sin vencimiento",
      message: "La credencial permanecerá activa en este dispositivo hasta que la elimines.",
      actions: [
        { label: "Volver", variant: "secondary" },
        { label: "Generar credencial", variant: "primary", onClick: createCredential, initialFocus: true }
      ]
    });
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      expirationValue.value = button.dataset.expirationMode;
      syncMode();
    });
  });

  expirationInput.addEventListener("input", clearError);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearError();
    if (selectedMode() === "scheduled") {
      if (!expirationInput.value) {
        showError("Selecciona la fecha y hora de vencimiento.");
        return;
      }
      if (new Date(expirationInput.value).getTime() <= Date.now()) {
        showError("Selecciona una fecha y hora futuras.");
        return;
      }
      createCredential();
      return;
    }
    confirmPermanent();
  });

  removeCredential.addEventListener("click", function () {
    const remove = function () {
      localStorage.removeItem(storageKey);
      renderForm();
      if (window.SialMobileUI) {
        window.SialMobileUI.showToast({
          type: "info",
          title: "Credencial eliminada",
          message: "Este dispositivo ya no tiene acceso offline."
        });
      }
    };
    if (!window.SialMobileUI) {
      remove();
      return;
    }
    window.SialMobileUI.openDialog({
      id: "remove-offline-credential",
      role: "alertdialog",
      type: "warning",
      branded: true,
      title: "Eliminar credencial",
      message: "Necesitarás conexión para generar otra credencial offline.",
      actions: [
        { label: "Cancelar", variant: "secondary" },
        { label: "Eliminar", variant: "destructive", onClick: remove, initialFocus: true }
      ]
    });
  });

  expirationInput.min = toLocalInputValue(new Date(Date.now() + 60000));
  expirationInput.value = toLocalInputValue(defaultExpiration());

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored && stored.createdAt) {
      renderActive(stored);
    } else {
      renderForm();
    }
  } catch (error) {
    localStorage.removeItem(storageKey);
    renderForm();
  }
})();
