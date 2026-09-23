(function () {
  "use strict";

  var monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var weekDays = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

  function pad(value) { return String(value).padStart(2, "0"); }
  function isoDate(date) { return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()); }
  function inputValue(date) { return isoDate(date) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes()); }
  function parseInput(value, fallback) {
    var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
    if (!match) return fallback === null ? null : (fallback ? new Date(fallback.getTime()) : new Date());
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  }
  function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function startOfWeek(date) {
    var result = startOfDay(date);
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    return result;
  }
  function weekLabel(start) {
    var end = new Date(start);
    end.setDate(end.getDate() + 6);
    if (start.getMonth() === end.getMonth()) return start.getDate() + " – " + end.getDate() + " de " + monthNames[end.getMonth()] + " de " + end.getFullYear();
    return start.getDate() + " de " + monthNames[start.getMonth()] + " – " + end.getDate() + " de " + monthNames[end.getMonth()] + " de " + end.getFullYear();
  }
  function formatTime(date) {
    var hour = date.getHours();
    var meridiem = hour >= 12 ? "p. m." : "a. m.";
    return pad(hour % 12 || 12) + ":" + pad(date.getMinutes()) + " " + meridiem;
  }
  function formatDateTime(date) { return pad(date.getDate()) + "/" + pad(date.getMonth() + 1) + "/" + date.getFullYear() + " · " + formatTime(date); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function mount(root) {
    if (!root || root.dataset.sialDatetimeMounted === "true") return;
    var input = root.querySelector(".sial-datetime-input-native");
    var trigger = root.querySelector(".sial-datetime-trigger");
    var valueNode = root.querySelector("[data-sial-datetime-value]");
    var popover = root.querySelector(".sial-datetime-popover");
    if (!input || !trigger || !valueNode || !popover) return;
    root.dataset.sialDatetimeMounted = "true";

    var minimum = parseInput(input.min, null);
    var maximum = parseInput(input.max, null);
    var selected = parseInput(input.value, minimum || new Date());
    var weekStart = startOfWeek(selected);
    var dateLabel = root.dataset.datetimeLabel || "Fecha y hora";
    var timeLabel = root.dataset.datetimeTimeLabel || "Hora";

    function refreshConstraints() {
      minimum = input.min ? parseInput(input.min, null) : null;
      maximum = input.max ? parseInput(input.max, null) : null;
    }
    function syncTrigger() { valueNode.textContent = input.value ? formatDateTime(selected) : "Selecciona fecha y hora"; }
    function disabledDay(date) {
      var day = startOfDay(date).getTime();
      return (minimum && day < startOfDay(minimum).getTime()) || (maximum && day > startOfDay(maximum).getTime());
    }
    function setOpen(open) {
      popover.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      root.classList.toggle("is-open", open);
      if (open) { refreshConstraints(); render(); }
    }
    function render() {
      var today = startOfDay(new Date());
      var days = [];
      for (var index = 0; index < 7; index += 1) {
        var dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + index);
        var isSelected = isoDate(dayDate) === isoDate(selected);
        var isToday = isoDate(dayDate) === isoDate(today);
        days.push('<button class="sial-picker-day' + (isSelected ? ' is-selected' : '') + (isToday ? ' is-today' : '') + '" type="button" data-date="' + isoDate(dayDate) + '" aria-pressed="' + isSelected + '"' + (disabledDay(dayDate) ? ' disabled' : '') + '>' + dayDate.getDate() + '</button>');
      }
      var hour12 = selected.getHours() % 12 || 12;
      var minute = selected.getMinutes();
      var minutes = [];
      for (var minuteValue = 0; minuteValue < 60; minuteValue += 5) minutes.push(minuteValue);
      if (!minutes.includes(minute)) minutes.push(minute);
      minutes.sort(function (a, b) { return a - b; });
      var hours = Array.from({ length: 12 }, function (_, index) { return index + 1; }).map(function (hour) { return '<option value="' + hour + '"' + (hour === hour12 ? ' selected' : '') + '>' + pad(hour) + '</option>'; }).join("");
      var minuteOptions = minutes.map(function (value) { return '<option value="' + value + '"' + (value === minute ? ' selected' : '') + '>' + pad(value) + '</option>'; }).join("");
      var meridiem = selected.getHours() >= 12 ? "PM" : "AM";
      popover.innerHTML = '<div class="sial-picker-header"><button class="sial-picker-nav" type="button" data-week="prev" aria-label="Semana anterior">‹</button><strong>' + weekLabel(weekStart) + '</strong><button class="sial-picker-nav" type="button" data-week="next" aria-label="Semana siguiente">›</button></div>' +
        '<div class="sial-picker-calendar">' + weekDays.map(function (day) { return '<span class="sial-picker-weekday">' + day + '</span>'; }).join("") + days.join("") + '</div>' +
        '<div class="sial-picker-time"><div class="sial-picker-time-head"><span>' + escapeHtml(timeLabel) + '</span><span>' + escapeHtml(formatTime(selected)) + '</span></div><div class="sial-picker-time-grid"><select data-time="hour" aria-label="Hora">' + hours + '</select><select data-time="minute" aria-label="Minutos">' + minuteOptions + '</select><select data-time="meridiem" aria-label="Meridiano"><option value="AM"' + (meridiem === "AM" ? ' selected' : '') + '>a. m.</option><option value="PM"' + (meridiem === "PM" ? ' selected' : '') + '>p. m.</option></select></div></div>' +
        '<div class="sial-picker-actions"><button class="sial-picker-action" type="button" data-picker-action="clear">Borrar</button><span></span><button class="sial-picker-action is-primary" type="button" data-picker-action="apply">Aplicar</button></div>';

      popover.querySelectorAll("[data-date]").forEach(function (button) {
        button.addEventListener("click", function () {
          var parts = button.dataset.date.split("-");
          selected = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), selected.getHours(), selected.getMinutes());
          render();
        });
      });
      popover.querySelector("[data-week='prev']").addEventListener("click", function () { weekStart.setDate(weekStart.getDate() - 7); render(); });
      popover.querySelector("[data-week='next']").addEventListener("click", function () { weekStart.setDate(weekStart.getDate() + 7); render(); });
      popover.querySelectorAll("[data-time]").forEach(function (select) {
        select.addEventListener("change", function () {
          var hour = Number(popover.querySelector("[data-time='hour']").value) % 12;
          if (popover.querySelector("[data-time='meridiem']").value === "PM") hour += 12;
          selected.setHours(hour, Number(popover.querySelector("[data-time='minute']").value), 0, 0);
          render();
        });
      });
      popover.querySelector("[data-picker-action='clear']").addEventListener("click", function () {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        syncTrigger();
        setOpen(false);
      });
      popover.querySelector("[data-picker-action='apply']").addEventListener("click", function () {
        input.value = inputValue(selected);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        syncTrigger();
        setOpen(false);
        trigger.focus();
      });
    }

    popover.addEventListener("click", function (event) { event.stopPropagation(); });
    trigger.setAttribute("aria-label", dateLabel);
    trigger.addEventListener("click", function () { setOpen(popover.hidden); });
    input.addEventListener("change", function () { selected = parseInput(input.value, minimum || new Date()); weekStart = startOfWeek(selected); syncTrigger(); });
    document.addEventListener("click", function (event) { if (!root.contains(event.target)) setOpen(false); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !popover.hidden) { setOpen(false); trigger.focus(); } });
    syncTrigger();
  }

  function mountAll(scope) { (scope || document).querySelectorAll("[data-sial-datetime-picker]").forEach(mount); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mountAll(document); }, { once: true });
  else mountAll(document);

  window.SialDateTimeControl = { mount: mount, mountAll: mountAll };
})();
