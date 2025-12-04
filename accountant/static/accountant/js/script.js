document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#violationsTable tbody");
  const fDateFrom = document.getElementById("dateFrom");
  const fDateTo = document.getElementById("dateTo");
  const fAirport = document.getElementById("airportFilter");
  const fService = document.getElementById("serviceFilter");
  const fOffender = document.getElementById("offenderFilter");
  const applyBtn = document.getElementById("applyFiltersBtn");
  const resetBtn = document.getElementById("resetFiltersBtn");
  const exportBtn = document.getElementById("exportExcelBtn");


  let currentItems = [];


  function fetchData() {
    const params = new URLSearchParams();
    if (fDateFrom?.value) params.append("date_from", fDateFrom.value);
    if (fDateTo?.value) params.append("date_to", fDateTo.value);
    if (fAirport?.value) params.append("airport", fAirport.value);
    if (fService?.value) params.append("service", fService.value);
    if (fOffender?.value) params.append("offender", fOffender.value.trim());


    const qs = params.toString();
    const url = qs ? `/accountant/api/list/?${qs}` : "/accountant/api/list/";

    fetch(url, { credentials: "same-origin" })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(payload => {
        updateChoices(payload.choices || {});
        currentItems = payload.items || [];
        renderRows();
      })
      .catch(() => {
        currentItems = [];
        renderRows("Не удалось загрузить данные");
      });
  }


  function updateChoices(choices) {
    populateSelect(fAirport, choices.airports || []);
    populateSelect(fService, choices.services || []);
  }

  function populateSelect(select, options) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Все";
    select.appendChild(defaultOption);

    options.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    if (options.includes(current)) {
      select.value = current;
    }
  }

  function renderRows(emptyMessage) {
    if (!tbody) return;
    tbody.innerHTML = "";


    if (emptyMessage) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = emptyMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    if (!currentItems.length) {
      renderRows("Нет данных по заданным фильтрам");
      return;
    }

    currentItems.forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.date || ""}</td>
        <td>${v.airport || ""}</td>
        <td>${v.service || ""}</td>
        <td>${v.offender || ""}</td>
        <td>${v.measures || ""}</td>`;
      tbody.appendChild(tr);
    });
  }


  if (applyBtn) {
    applyBtn.addEventListener("click", event => {
      event.preventDefault();
      fetchData();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", event => {
      event.preventDefault();
      if (fDateFrom) fDateFrom.value = "";
      if (fDateTo) fDateTo.value = "";
      if (fAirport) fAirport.value = "";
      if (fService) fService.value = "";
      if (fOffender) fOffender.value = "";
      fetchData();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", event => {
      event.preventDefault();
      if (!window.XLSX) {
        alert("Библиотека XLSX не загружена");
        return;
      }

      if (!currentItems.length) {
        alert("Нет данных для экспорта");
        return;
      }

      const rows = [["Дата", "Аэропорт", "Служба", "Кто нарушил", "Принятые меры"]];
      currentItems.forEach(v => {
        rows.push([
          v.date || "",
          v.airport || "",
          v.service || "",
          v.offender || "",
          v.measures || "",
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Отчёт");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `report_${stamp}.xlsx`);
    });
  }


  fetchData();
});