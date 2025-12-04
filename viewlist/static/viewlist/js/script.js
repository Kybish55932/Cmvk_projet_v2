document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("violationsTable");
  const tbody = table.querySelector("tbody");

  const fDateFrom = document.getElementById("dateFrom");
  const fDateTo   = document.getElementById("dateTo");

  const airportMS = initMultiSelect(document.getElementById("airport"));
  const serviceMS = initMultiSelect(document.getElementById("service"));
  const vtypeMS   = initMultiSelect(document.getElementById("violation"));
  const offenderInput = document.getElementById("offenderFilter");

  const applyBtn = document.getElementById("applyFiltersBtn");
  const resetBtn = document.getElementById("resetFiltersBtn");
  const exportBtn = document.getElementById("exportExcelBtn");

  const todayStr = new Date().toISOString().slice(0, 10);
  if (fDateFrom) fDateFrom.value = todayStr;
  if (fDateTo)   fDateTo.value   = todayStr;

  let violationsData = [];
  let filtersActive = true;

  /* ---------- utils ---------- */
  const escapeHtml = (s) =>
    s === 0 || s
      ? String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
      : "";

  // dd.mm.yyyy | dd . mm . yyyy | yyyy-mm-dd | "9 октября 2025"
  function parseDateToISO(dateStr) {
    if (!dateStr) return "";

    // уже ISO?
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return dateStr.trim();

    // dd.mm.yyyy (включая пробелы)
    const dm = dateStr.replace(/\s/g, "");
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dm)) {
      const [d, m, y] = dm.split(".");
      return `${y}-${m}-${d}`;
    }

    // "9 октября 2025"
    try {
      const months = {
        января:"01", февраля:"02", марта:"03", апреля:"04", мая:"05", июня:"06",
        июля:"07", августа:"08", сентября:"09", октября:"10", ноября:"11", декабря:"12"
      };
      const parts = dateStr.trim().split(/\s+/);
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, "0");
        const month = months[(parts[1] || "").toLowerCase()];
        const year = parts[2];
        if (month && /^\d{4}$/.test(year)) return `${year}-${month}-${day}`;
      }
    } catch (_) {}

    return ""; // не смогли распарсить — не фильтруем
  }

  /* ---------- simple multiselect (кнопка + выпадающий список чекбоксов) ---------- */
  function initMultiSelect(selectEl) {
    if (!selectEl) return null;

    const options = [...selectEl.querySelectorAll("option")].map(o => ({
      value: o.value,
      label: o.textContent.trim()
    }));

    // оболочка
    const wrap = document.createElement("div");
    wrap.className = "ms small";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "ms-trigger";
    trigger.textContent = "Все";
    const drop = document.createElement("div");
    drop.className = "ms-dropdown";

    // опции
    options.forEach(opt => {
      drop.insertAdjacentHTML(
        "beforeend",
        `<label class="ms-opt">
           <input type="checkbox" data-val="${escapeHtml(opt.value)}">
           <span>${escapeHtml(opt.label)}</span>
         </label>`
      );
    });

    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "btn";
    apply.textContent = "Выбрать";
    drop.appendChild(apply);

    // вставляем
    selectEl.style.display = "none";
    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(trigger);
    wrap.appendChild(drop);

    let selected = new Set();

    function updateTrigger() {
      if (selected.size === 0) trigger.textContent = "Все";
      else if (selected.size <= 2) trigger.textContent = [...selected].join(", ");
      else trigger.textContent = `Выбрано: ${selected.size}`;
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".ms-dropdown.open").forEach(d => d.classList.remove("open"));
      drop.classList.toggle("open");
    });
    drop.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => drop.classList.remove("open"));

    apply.addEventListener("click", () => {
      selected.clear();
      drop.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (cb.checked) selected.add(cb.getAttribute("data-val"));
      });
      updateTrigger();
      drop.classList.remove("open");
      // авто-рендер при выборе
      render(getFilteredData());
    });

    return {
      getValues() { return [...selected]; },
      reset() {
        selected.clear();
        drop.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
        updateTrigger();
      }
    };
  }

  /* ---------- фильтрация ---------- */
  function getFilteredData() {
    const dFrom = fDateFrom?.value || "";
    const dTo   = fDateTo?.value   || "";
    const airports = airportMS?.getValues() ?? [];
    const services = serviceMS?.getValues() ?? [];
    const vtypes   = vtypeMS?.getValues()   ?? [];
    const offenderVal = offenderInput?.value.toLowerCase().trim() || "";

    return violationsData.filter(v => {
      // по датам — сравниваем ISO
      if (dFrom && v.dateISO && v.dateISO < dFrom) return false;
      if (dTo   && v.dateISO && v.dateISO > dTo)   return false;

      if (airports.length && !airports.includes(v.airport)) return false;
      if (services.length && !services.includes(v.service)) return false;
      if (vtypes.length   && !vtypes.includes(v.violation)) return false;

      if (offenderVal && !String(v.offender || "").toLowerCase().includes(offenderVal)) return false;

      return true;
    });
  }

  /* ---------- рендер ---------- */
  function render(data = (filtersActive ? getFilteredData() : violationsData)) {
    tbody.innerHTML = "";
    data.forEach(v => {
      const tr = document.createElement("tr");
      tr.dataset.id = v.id;
      tr.innerHTML = `
        <td>${escapeHtml(v.dateDisplay || v.dateISO || "")}</td>
        <td>${escapeHtml(v.airport || "")}</td>
        <td>${escapeHtml(v.flight || "")}</td>
        <td>${escapeHtml(v.direction || "")}</td>
        <td>${escapeHtml(v.type || "")}</td>
        <td>${escapeHtml(v.time_start || "")} - ${escapeHtml(v.time_end || "")}</td>
        <td>${escapeHtml(v.sector || "")}</td>
        <td>${escapeHtml(v.violation_start || "")} - ${escapeHtml(v.violation_end || "")}</td>
        <td>${escapeHtml(v.service || "")}</td>
        <td>${escapeHtml(v.violation || "")}</td>
        <td><textarea readonly class="desc-text">${escapeHtml(v.description || "")}</textarea></td>
        <td>${escapeHtml(v.offender || "")}</td>
        <td>${escapeHtml(v.measures || "")}</td>
        <td>${escapeHtml(v.comment || "")}</td>
      `;
      tbody.appendChild(tr);

      // авто-высота описания
      const ta = tr.querySelector(".desc-text");
      ta.style.height = "auto";
      ta.style.height = Math.max(40, ta.scrollHeight) + "px";
    });
  }

  /* ---------- Экспорт ---------- */
  (function attachExcelExport() {
    if (!exportBtn) return;

    function ensureXLSX() {
      return new Promise((resolve) => {
        if (window.XLSX) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
    }

    exportBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const rows = getFilteredData();
      if (!rows.length) return alert("Нет данных для экспорта!");

      const headers = [
        "Дата","Аэропорт","Рейс","Направление","Прилет/Вылет","Время рейса",
        "Сектор","Время нарушения","Служба","Вид нарушения","Описание",
        "Кто нарушил","Принятые меры","Комментарии"
      ];
      const data = [headers, ...rows.map(v => ([
        v.dateDisplay || v.dateISO || "", v.airport, v.flight, v.direction, v.type,
        `${v.time_start||""} - ${v.time_end||""}`,
        v.sector,
        `${v.violation_start||""} - ${v.violation_end||""}`,
        v.service, v.violation, v.description, v.offender, v.measures, v.comment
      ]))];

      const ok = await ensureXLSX();
      if (ok && window.XLSX) {
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
        XLSX.writeFile(wb, "Отчёт.xlsx");
      }
    });
  })();

  /* ---------- загрузка данных из DOM и мгновенная фильтрация по дате ---------- */
  (function bootstrapFromDOM() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    violationsData = rows.map((r, i) => {
      const c = r.querySelectorAll("td");
      const dateCell = (c[0]?.textContent || "").trim();
      const iso = parseDateToISO(dateCell);

      return {
        id: r.dataset.id || i,
        dateISO: iso,
        dateDisplay: dateCell,
        airport: (c[1]?.textContent || "").trim(),
        flight: (c[2]?.textContent || "").trim(),
        direction: (c[3]?.textContent || "").trim(),
        type: (c[4]?.textContent || "").trim(),
        time_start: (c[5]?.textContent || "").split(" - ")[0].trim(),
        time_end: (c[5]?.textContent || "").split(" - ")[1]?.trim() || "",
        sector: (c[6]?.textContent || "").trim(),
        violation_start: (c[7]?.textContent || "").split(" - ")[0].trim(),
        violation_end: (c[7]?.textContent || "").split(" - ")[1]?.trim() || "",
        service: (c[8]?.textContent || "").trim(),
        violation: (c[9]?.textContent || "").trim(),
        description: (c[10]?.textContent || "").trim(),
        offender: (c[11]?.textContent || "").trim(),
        measures: (c[12]?.textContent || "").trim(),
        comment: (c[13]?.textContent || "").trim(),
      };
    });

    // сразу фильтруем по сегодняшнему диапазону
    filtersActive = true;
    render(getFilteredData());
  })();

  /* ---------- кнопки фильтра ---------- */
  if (applyBtn) applyBtn.addEventListener("click", () => {
    filtersActive = true;
    render(getFilteredData());
  });

  if (resetBtn) resetBtn.addEventListener("click", () => {
    if (fDateFrom) fDateFrom.value = todayStr;
    if (fDateTo)   fDateTo.value   = todayStr;
    airportMS?.reset();
    serviceMS?.reset();
    vtypeMS?.reset();
    if (offenderInput) offenderInput.value = "";
    filtersActive = true;
    render(getFilteredData());
  });
});
