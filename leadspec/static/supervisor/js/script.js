document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("violationsTable");
  const tbody = table.querySelector("tbody");
  const addBtn = document.querySelector(".buttons .btn-success");
  const todayStr = new Date().toISOString().slice(0, 10);

  let violationsData = [];

  // ---------------- helpers ----------------
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrfToken = getCookie("csrftoken");

  const escapeHtml = (s) =>
    (s === 0 || s) ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";

  const findIdx = (id) => violationsData.findIndex(v => String(v.id) === String(id));

  // ---------------- API ----------------
  function loadViolations() {
    fetch("/supervisor/api/violations/")
      .then(r => r.json())
      .then(({ items }) => {
        violationsData = items;
        render();
      });
  }

  function saveViolation(v) {
    fetch(`/supervisor/api/violations/${v.id}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify(v)
    }).then(r => r.json())
      .then(data => {
        if (data.success) loadViolations();
      });
  }

  function deleteViolation(id) {
    fetch(`/supervisor/api/violations/${id}/delete/`, {
      method: "POST",
      headers: { "X-CSRFToken": csrfToken }
    }).then(r => r.json())
      .then(data => {
        if (data.success) loadViolations();
      });
  }

  function addViolation(newObj) {
    fetch("/supervisor/api/violations/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify(newObj)
    }).then(r => r.json())
      .then(data => {
        if (data.success) loadViolations();
      });
  }

  // ---------------- render ----------------
  function render() {
    tbody.innerHTML = "";
    violationsData.forEach(v => {
      const tr = document.createElement("tr");
      tr.dataset.id = v.id;
      tr.innerHTML = `
        <td>${escapeHtml(v.date || "")}</td>
        <td>${escapeHtml(v.airport || "")}</td>
        <td>${escapeHtml(v.flight || "")}</td>
        <td>${escapeHtml(v.direction || "")}</td>
        <td>${escapeHtml(v.type || "")}</td>
        <td>${escapeHtml(v.time_start || "")} - ${escapeHtml(v.time_end || "")}</td>
        <td>${escapeHtml(v.sector || "")}</td>
        <td>${escapeHtml(v.violation_start || "")} - ${escapeHtml(v.violation_end || "")}</td>
        <td>${escapeHtml(v.service || "")}</td>
        <td>${escapeHtml(v.violation || "")}</td>
        <td><textarea readonly>${escapeHtml(v.description || "")}</textarea></td>
        <td>${escapeHtml(v.supervisor || "")}</td>
        <td>${escapeHtml(v.tehnick || "")}</td>
        <td class="action-btns">
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ---------------- edit/save ----------------
  function startEditing(row) {
    const id = row.dataset.id;
    const idx = findIdx(id);
    if (idx === -1) return;
    const v = violationsData[idx];
    const c = row.querySelectorAll("td");

    c[0].innerHTML = `<input type="date" value="${v.date || todayStr}">`;
    c[1].innerHTML = `<input type="text" value="${v.airport || ""}">`;
    c[2].innerHTML = `<input type="text" value="${v.flight || ""}">`;
    c[3].innerHTML = `<input type="text" value="${v.direction || ""}">`;
    c[4].innerHTML = `<input type="text" value="${v.type || ""}">`;
    c[5].innerHTML = `
      <input type="time" value="${v.time_start || ""}">
      <input type="time" value="${v.time_end || ""}">`;
    c[6].innerHTML = `<input type="text" value="${v.sector || ""}">`;
    c[7].innerHTML = `
      <input type="time" value="${v.violation_start || ""}">
      <input type="time" value="${v.violation_end || ""}">`;
    c[8].innerHTML = `<input type="text" value="${v.service || ""}">`;
    c[9].innerHTML = `<input type="text" value="${v.violation || ""}">`;
    c[10].innerHTML = `<textarea>${v.description || ""}</textarea>`;
    c[11].innerHTML = `<input type="text" value="${v.supervisor || ""}">`;
    c[12].innerHTML = `<input type="text" value="${v.tehnick || ""}">`;
    c[13].innerHTML = `<button class="save">💾</button><button class="cancel">❌</button>`;
  }

  function handleSave(row) {
    const id = row.dataset.id;
    const idx = findIdx(id);
    if (idx === -1) return;
    const c = row.querySelectorAll("td");

    const updated = {
      id: id,
      date: c[0].querySelector("input").value,
      airport: c[1].querySelector("input").value,
      flight: c[2].querySelector("input").value,
      direction: c[3].querySelector("input").value,
      type: c[4].querySelector("input").value,
      time_start: c[5].querySelectorAll("input")[0].value,
      time_end: c[5].querySelectorAll("input")[1].value,
      sector: c[6].querySelector("input").value,
      violation_start: c[7].querySelectorAll("input")[0].value,
      violation_end: c[7].querySelectorAll("input")[1].value,
      service: c[8].querySelector("input").value,
      violation: c[9].querySelector("input").value,
      description: c[10].querySelector("textarea").value,
      supervisor: c[11].querySelector("input").value,
      tehnick: c[12].querySelector("input").value,
    };
    saveViolation(updated);
  }

  function handleCancel() {
    loadViolations();
  }

  // ---------------- events ----------------
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const row = btn.closest("tr"); if (!row) return;

    if (btn.classList.contains("edit")) startEditing(row);
    if (btn.classList.contains("save")) handleSave(row);
    if (btn.classList.contains("cancel")) handleCancel();
    if (btn.classList.contains("delete")) deleteViolation(row.dataset.id);
  });

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const newObj = {
        date: todayStr,
        airport: "",
        flight: "",
        direction: "",
        type: "",
        time_start: "",
        time_end: "",
        sector: "",
        violation_start: "",
        violation_end: "",
        service: "",
        violation: "",
        description: "",
        supervisor: "",
        tehnick: "",
        status: "new"
      };
      addViolation(newObj);
    });
  }

  loadViolations();
});
