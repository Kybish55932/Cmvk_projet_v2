
document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("violationsTable");
  const tbody = table.querySelector("tbody");

  const fDateFrom = document.getElementById("dateFrom");
  const fDateTo   = document.getElementById("dateTo");
  const todayStr  = new Date().toISOString().slice(0, 10);
  if (fDateFrom) fDateFrom.value = todayStr;
  if (fDateTo)   fDateTo.value   = todayStr;

  const applyBtn = document.getElementById("applyFiltersBtn");
  const resetBtn = document.getElementById("resetFiltersBtn");

  let violationsData = [];
  let filtersActive = false;

  const todayDate = () => new Date().toISOString().slice(0, 10);
  const escapeHtml = (s) =>
    (s === 0 || s)
      ? String(s).replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
      : "";

  function render(data = (filtersActive ? getFilteredData() : violationsData)) {
    tbody.innerHTML = "";
    data.forEach(v => {
      const tr = document.createElement("tr");
      tr.dataset.id = v.id;
      tr.innerHTML = `
        <td>${escapeHtml(v.date||"")}</td>
        <td>${escapeHtml(v.airport||"")}</td>
        <td>${escapeHtml(v.flight||"")}</td>
        <td>${escapeHtml(v.direction||"")}</td>
        <td>${escapeHtml(v.type||"")}</td>
        <td>${escapeHtml(v.time||"")}</td>
        <td>${escapeHtml(v.sector||"")}</td>
        <td>${escapeHtml(v.violation_time||"")}</td>
        <td>${escapeHtml(v.service||"")}</td>
        <td>${escapeHtml(v.violation||"")}</td>
        <td><textarea readonly class="desc-text">${escapeHtml(v.description||"")}</textarea></td>
        <td>${escapeHtml(v.offender||"")}</td>
        <td>${escapeHtml(v.measures||"")}</td>
        <td>${escapeHtml(v.comment||"")}</td>
        <td class="action-btns">
          <button class="edit">✏️</button>
          <button class="save" style="display:none;">💾</button>
          <button class="cancel" style="display:none;">❌</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function getFilteredData() {
    const dFrom = fDateFrom?.value || "";
    const dTo   = fDateTo?.value   || "";

    return violationsData.filter(v => {
      if (dFrom && v.date < dFrom) return false;
      if (dTo   && v.date > dTo)   return false;
      return true;
    });
  }

  function applyFilters() {
    filtersActive = true;
    render(getFilteredData());
  }

  function resetFilters() {
    if (fDateFrom) fDateFrom.value = todayStr;
    if (fDateTo)   fDateTo.value   = todayStr;
    filtersActive = true;
    render(getFilteredData());
  }

  if (applyBtn) applyBtn.addEventListener("click", applyFilters);
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);

  // ----------- CRUD (ограничено) -----------
  function startEditing(row) {
    const id = row.dataset.id;
    const idx = violationsData.findIndex(v => String(v.id) === String(id));
    if (idx === -1) return;
    const v = violationsData[idx];
    const c = row.querySelectorAll("td");

    // меняем только нужные поля
    c[11].innerHTML = `<input type="text" value="${escapeHtml(v.offender||"")}">`;
    c[12].innerHTML = `
      <select>
        <option value="">Выбрать...</option>
        <option value="Замечание"${v.measures==="Замечание"?" selected":""}>Замечание</option>
        <option value="Выговор"${v.measures==="Выговор"?" selected":""}>Выговор</option>
        <option value="Отстранение"${v.measures==="Отстранение"?" selected":""}>Отстранение</option>
      </select>
    `;
    c[13].innerHTML = `<input type="text" value="${escapeHtml(v.comment||"")}">`;

    const btns = c[14].querySelectorAll("button");
    btns.forEach(b => b.style.display = "inline-block");
    c[14].querySelector(".edit").style.display = "none";
  }

  function handleSave(row) {
    const id = row.dataset.id;
    const idx = violationsData.findIndex(v => String(v.id) === String(id));
    if (idx === -1) return;
    const v = violationsData[idx];
    const c = row.querySelectorAll("td");

    v.offender = c[11].querySelector("input")?.value || v.offender;
    v.measures = c[12].querySelector("select")?.value || v.measures;
    v.comment  = c[13].querySelector("input")?.value || v.comment;

    render();
  }

  function handleCancel() {
    render();
  }

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const row = btn.closest("tr"); if (!row) return;

    if (btn.classList.contains("edit"))   { startEditing(row); return; }
    if (btn.classList.contains("save"))   { handleSave(row);   return; }
    if (btn.classList.contains("cancel")) { handleCancel(row); return; }
  });

  // ----------- Стартовый рендер -----------
  (function bootstrapFromDOM(){
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (!rows.length) return;
    violationsData = rows.map((row, i) => {
      const c = row.querySelectorAll("td");
      return {
        id: (Date.now()+i).toString(),
        date: c[0]?.textContent.trim() ?? "",
        airport: c[1]?.textContent.trim() ?? "",
        flight: c[2]?.textContent.trim() ?? "",
        direction: c[3]?.textContent.trim() ?? "",
        type: c[4]?.textContent.trim() ?? "",
        time: c[5]?.textContent.trim() ?? "",
        sector: c[6]?.textContent.trim() ?? "",
        violation_time: c[7]?.textContent.trim() ?? "",
        service: c[8]?.textContent.trim() ?? "",
        violation: c[9]?.textContent.trim() ?? "",
        description: c[10]?.textContent.trim() ?? "",
        offender: c[11]?.textContent.trim() ?? "",
        measures: c[12]?.textContent.trim() ?? "",
        comment: c[13]?.textContent.trim() ?? "",
        isNew: false
      };
    });
    filtersActive = true;
    render(getFilteredData());
  })();
});
