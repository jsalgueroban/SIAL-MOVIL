(() => {
  const form = document.getElementById("pat-form");
  const input = document.getElementById("pat-value");
  const submit = document.getElementById("pat-submit");
  const error = document.getElementById("pat-error");
  const network = document.getElementById("pat-network");
  const visibility = document.getElementById("pat-visibility");

  function clearError() {
    error.hidden = true;
    error.textContent = "";
    input.setAttribute("aria-invalid", "false");
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }

  function updateConnection() {
    const online = navigator.onLine;
    network.dataset.online = String(online);
    network.textContent = online ? "Con conexión" : "Acceso local disponible";
    input.disabled = online;
    submit.disabled = online;
    if (online) clearError();
  }

  visibility.addEventListener("click", () => {
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    visibility.setAttribute("aria-pressed", String(visible));
    visibility.setAttribute("aria-label", visible ? "Ocultar credencial" : "Mostrar credencial");
    input.focus();
  });
  input.addEventListener("input", clearError);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (navigator.onLine) return;
    if (!input.value.trim()) {
      showError("Ingresa la credencial PAT de este dispositivo.");
      return;
    }
    showError("El prototipo no valida credenciales locales. Completa esta acción en la app móvil.");
  });
  addEventListener("online", updateConnection);
  addEventListener("offline", updateConnection);
  updateConnection();
})();
