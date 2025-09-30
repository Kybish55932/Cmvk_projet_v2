document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("violationsTable");
  const tbody = table.querySelector("tbody");
  const confirmedEl = document.getElementById("confirmed");
  const rejectedEl  = document.getElementById("rejected");
  const totalEl     = document.getElementById("total");
  const addBtn      = document.querySelector(".buttons .btn-success");

  let violationsData = [];

  // ---------------- helpers ----------------
  const AIRPORTS   = ["Манас", "Ош", "Баткен", "Разаков"];
  const SERVICES   = ["САБ", "САСПОП", "СПОиАТ"];
  const INSPECTORS = ["Осмонов Нурсултан", "Касымова Рима"];

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length+1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const escapeHtml = (s) =>
    (s === 0 || s) ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";

  const todayDate = () => new Date().toISOString().slice(0, 10);

  const selectHTML = (options, current="") => {
    let h = `<select>`;
    h += `<option value=""></option>`;
    options.forEach(o => {
      h += `<option value="${escapeHtml(o)}"${o===current?" selected":""}>${escapeHtml(o)}</option>`;
    });
    h += `</select>`;
    return h;
  };

  // ---------------- counters ----------------
  function updateCounters(dataset) {
    confirmedEl.textContent = dataset.filter(v => v.status === "approved").length;
    rejectedEl.textContent  = dataset.filter(v => v.status === "rejected").length;
    totalEl.textContent     = dataset.length;
  }

  // ---------------- render ----------------
  function render(data = violationsData) {
    tbody.innerHTML = "";
    data.forEach(v => {
      const tr = document.createElement("tr");
      tr.dataset.id = v.id;
      tr.dataset.status = v.status || ""; // сохраняем статус в DOM
      if (v.status) tr.classList.add(v.status);

      tr.innerHTML = `
        <td>${escapeHtml(v.date||"")}</td>
        <td>${escapeHtml(v.airport||"")}</td>
        <td>${escapeHtml(v.flight||"")}</td>
        <td>${escapeHtml(v.direction||"")}</td>
        <td>${escapeHtml(v.type||"")}</td>
        <td>${escapeHtml(v.time_start||"")}</td>
        <td>${escapeHtml(v.time_end||"")}</td>
        <td>${escapeHtml(v.sector||"")}</td>
        <td>${escapeHtml(v.violation_start||"")}</td>
        <td>${escapeHtml(v.violation_end||"")}</td>
        <td>${escapeHtml(v.service||"")}</td>
        <td>${escapeHtml(v.violation||"")}</td>
        <td>${escapeHtml(v.description||"")}</td>
        <td>${escapeHtml(v.supervisor||"")}</td>
        <td>${escapeHtml(v.inspector||"")}</td>
        <td>${escapeHtml(v.shift||"")}</td>
        <td class="action-btns">
          <button class="approve">✔</button>
          <button class="reject">✖</button>
        </td>
        <td class="action-btns">
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    updateCounters(data);
  }

  // ---------------- editing ----------------
  function startEditing(row) {
    const id = row.dataset.id;
    const idx = violationsData.findIndex(v => v.id == id);
    if (idx === -1) return;
    const v = violationsData[idx];
    const c = row.querySelectorAll("td");

    c[0].innerHTML  = `<input type="date" value="${escapeHtml(v.date||todayDate())}">`;
    c[1].innerHTML  = selectHTML(AIRPORTS, v.airport||"");
    c[2].innerHTML  = `<input type="text" value="${escapeHtml(v.flight||"")}">`;
    c[3].innerHTML  = `<input type="text" value="${escapeHtml(v.direction||"")}">`;
    c[4].innerHTML  = selectHTML(["Прилет","Вылет"], v.type||"");
    c[5].innerHTML  = `<input type="time" value="${escapeHtml(v.time_start||"")}">`;
    c[6].innerHTML  = `<input type="time" value="${escapeHtml(v.time_end||"")}">`;
    c[7].innerHTML  = `<input type="text" value="${escapeHtml(v.sector||"")}">`;
    c[8].innerHTML  = `<input type="time" value="${escapeHtml(v.violation_start||"")}">`;
    c[9].innerHTML  = `<input type="time" value="${escapeHtml(v.violation_end||"")}">`;
    c[10].innerHTML = selectHTML(SERVICES, v.service||"");
    c[11].innerHTML = `<input type="text" value="${escapeHtml(v.violation||"")}">`;
    c[12].innerHTML = `<textarea class="desc-edit">${escapeHtml(v.description||"")}</textarea>`;
    c[13].innerHTML = `<input type="text" value="${escapeHtml(v.supervisor||"")}">`;
    c[14].innerHTML = selectHTML(INSPECTORS, v.inspector||"");
    c[15].innerHTML = selectHTML(["1","2","3","4"], v.shift||"");
    c[16].innerHTML = `<button class="save">💾</button><button class="cancel">❌</button>`;
  }

  function handleSave(row) {
    const id = row.dataset.id;
    const idx = violationsData.findIndex(v => v.id == id);
    if (idx === -1) return;
    const v = violationsData[idx];
    const c = row.querySelectorAll("td");

    v.date            = c[0].querySelector("input")?.value || v.date;
    v.airport         = c[1].querySelector("select")?.value || v.airport;
    v.flight          = c[2].querySelector("input")?.value || v.flight;
    v.direction       = c[3].querySelector("input")?.value || v.direction;
    v.type            = c[4].querySelector("select")?.value || v.type;
    v.time_start      = c[5].querySelector("input")?.value || v.time_start;
    v.time_end        = c[6].querySelector("input")?.value || v.time_end;
    v.sector          = c[7].querySelector("input")?.value || v.sector;
    v.violation_start = c[8].querySelector("input")?.value || v.violation_start;
    v.violation_end   = c[9].querySelector("input")?.value || v.violation_end;
    v.service         = c[10].querySelector("select")?.value || v.service;
    v.violation       = c[11].querySelector("input")?.value || v.violation;
    v.description     = c[12].querySelector("textarea")?.value || v.description;
    v.supervisor      = c[13].querySelector("input")?.value || v.supervisor;
    v.inspector       = c[14].querySelector("select")?.value || v.inspector;
    v.shift           = c[15].querySelector("select")?.value || v.shift;
    v.status          = v.status || "new"; // защитимся от сброса статуса

    v.isNew = false;
    editViolation(v);
  }

  function handleCancel(row) {
    const id = row.dataset.id;
    const idx = violationsData.findIndex(v => v.id == id);
    if (idx === -1) return;
    if (violationsData[idx].isNew) {
      violationsData.splice(idx, 1);
    }
    render();
  }

  // ---------------- AJAX CRUD ----------------
  function addViolation() {
    const newObj = {
      date: todayDate(), airport: "", flight: "", direction: "", type: "",
      time_start: "", time_end: "",
      sector: "", violation_start: "", violation_end: "",
      service: "", violation: "",
      description: "", supervisor: "", inspector: "", shift: "", status: "new"
    };

    fetch("/inspector/add_violation/", {
      method: "POST",
      headers: {"Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken")},
      body: JSON.stringify(newObj)
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        // сразу подтягиваем актуальный список из БД
        loadViolations();
      }
    });
  }

  function editViolation(v) {
    fetch(`/inspector/edit_violation/${v.id}/`, {
      method: "POST",
      headers: {"Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken")},
      body: JSON.stringify(v)
    }).then(() => loadViolations()); // <= перезагрузка, а не локальный render()
  }

  function deleteViolation(id) {
    fetch(`/inspector/delete_violation/${id}/`, {
      method: "POST",
      headers: {"X-CSRFToken": getCookie("csrftoken")}
    }).then(() => loadViolations());
  }

  function updateStatus(id, status) {
    fetch(`/inspector/edit_violation/${id}/`, {
      method: "POST",
      headers: {"Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken")},
      body: JSON.stringify({status})
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadViolations(); // <= ключевой момент
      } else {
        alert("Ошибка при обновлении статуса");
      }
    });
  }

  // ---------------- table events ----------------
  tbody.addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    const row = btn.closest("tr"); if (!row) return;
    if (btn.classList.contains("approve")) { updateStatus(row.dataset.id, "approved"); return; }
    if (btn.classList.contains("reject"))  { updateStatus(row.dataset.id, "rejected"); return; }
    if (btn.classList.contains("delete"))  { deleteViolation(row.dataset.id); return; }
    if (btn.classList.contains("edit"))    { startEditing(row); return; }
    if (btn.classList.contains("save"))    { handleSave(row); return; }
    if (btn.classList.contains("cancel"))  { handleCancel(row); return; }
  });

  addBtn.addEventListener("click", addViolation);

  // ---------------- загрузка из API ----------------
  function loadViolations() {
    fetch("/inspector/list/") // <= правильный JSON URL
      .then(r => {
        if (!r.ok) throw new Error(r.status + " " + r.statusText);
        return r.json();
      })
      .then(data => {
        violationsData = data;
        render();
      })
      .catch(err => console.error("Ошибка загрузки нарушений:", err));
  }

  // стартуем из DOM (если сервер уже отрисовал строки),
  // либо можно сразу дёрнуть loadViolations() — выбери одно:
  (function bootstrapFromDOM(){
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (rows.length === 0) { loadViolations(); return; }

    violationsData = rows.map(row => ({
      id: row.dataset.id,
      date: row.children[0]?.textContent.trim()||"",
      airport: row.children[1]?.textContent.trim()||"",
      flight: row.children[2]?.textContent.trim()||"",
      direction: row.children[3]?.textContent.trim()||"",
      type: row.children[4]?.textContent.trim()||"",
      time_start: row.children[5]?.textContent.trim()||"",
      time_end:   row.children[6]?.textContent.trim()||"",
      sector: row.children[7]?.textContent.trim()||"",
      violation_start: row.children[8]?.textContent.trim()||"",
      violation_end:   row.children[9]?.textContent.trim()||"",
      service: row.children[10]?.textContent.trim()||"",
      violation: row.children[11]?.textContent.trim()||"",
      description: row.children[12]?.textContent.trim()||"",
      supervisor: row.children[13]?.textContent.trim()||"",
      inspector:  row.children[14]?.textContent.trim()||"",
      shift:      row.children[15]?.textContent.trim()||"",
      status:     row.dataset.status || "",
      isNew: false
    }));
    render();
  })();
});
