document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("violationsTable");
  const tbody = table.querySelector("tbody");
  const fDateFrom = document.getElementById("dateFrom");
  const fDateTo = document.getElementById("dateTo");
  const offenderInput = document.getElementById("offenderFilter");
  const applyBtn = document.getElementById("applyFiltersBtn");
  const resetBtn = document.getElementById("resetFiltersBtn");

  // текущая дата по умолчанию
  const todayStr = new Date().toISOString().slice(0, 10);
  if (fDateFrom) fDateFrom.value = todayStr;
  if (fDateTo) fDateTo.value = todayStr;

  let violationsData = [];
  let filtersActive = false;

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

  const escapeHtml = (s) =>
    s === 0 || s
      ? String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
      : "";

  // список доступных мер
  const MEASURES_LIST = [
    "Проф. беседа",
    "15%",
    "30%",
    "50%",
    "80%",
    "100%",
    "Замечание",
    "Выговор",
    "Строгий выговор",
    "Увольнение"
  ];

  // ---------------- фильтрация ----------------
  function getFilteredData() {
    const dFrom = fDateFrom?.value || "";
    const dTo = fDateTo?.value || "";
    const offenderVal = offenderInput?.value.toLowerCase().trim() || "";

    return violationsData.filter((v) => {
      if (dFrom && v.date < dFrom) return false;
      if (dTo && v.date > dTo) return false;
      if (offenderVal && !String(v.offender || "").toLowerCase().includes(offenderVal))
        return false;
      return true;
    });
  }

  if (applyBtn)
    applyBtn.addEventListener("click", () => {
      filtersActive = true;
      render(getFilteredData());
    });

  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      if (fDateFrom) fDateFrom.value = todayStr;
      if (fDateTo) fDateTo.value = todayStr;
      if (offenderInput) offenderInput.value = "";
      filtersActive = false;
      render(violationsData);
    });

  // ---------------- render ----------------
  function render(data = (filtersActive ? getFilteredData() : violationsData)) {
    tbody.innerHTML = "";
    data.forEach((v) => {
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
        <td><textarea readonly class="desc-text">${escapeHtml(v.description || "")}</textarea></td>
        <td>${escapeHtml(v.offender || "")}</td>
        <td>${escapeHtml(v.measures || "")}</td>
        <td>${escapeHtml(v.comment || "")}</td>
        <td class="action-btns">
          <button class="edit">✏️</button>
          <button class="save" style="display:none;">💾</button>
          <button class="cancel" style="display:none;">❌</button>
          <button class="send" style="background:#007bff;color:white;">📤</button>
        </td>`;
      tbody.appendChild(tr);

      // авто-высота для описания
      const ta = tr.querySelector(".desc-text");
      if (ta) {
        ta.style.height = "auto";
        ta.style.height = Math.max(40, ta.scrollHeight) + "px";
      }
    });
  }

  // ---------------- обработчик кликов ----------------
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const row = btn.closest("tr");
    if (!row) return;
    const c = row.querySelectorAll("td");

    // === редактирование ===
    if (btn.classList.contains("edit")) {
      c[11].innerHTML = `<input type="text" value="${escapeHtml(c[11].textContent.trim())}">`;
      c[12].innerHTML = `
        <select>
          <option value="">Выбрать...</option>
          ${MEASURES_LIST.map(m => `<option value="${m}">${m}</option>`).join("")}
        </select>`;
      c[13].innerHTML = `<input type="text" value="${escapeHtml(c[13].textContent.trim())}">`;
      row.querySelector(".edit").style.display = "none";
      row.querySelector(".save").style.display = "inline-block";
      row.querySelector(".cancel").style.display = "inline-block";
    }

    // === сохранить ===
    if (btn.classList.contains("save")) {
      const id = row.dataset.id;
      const offender = c[11].querySelector("input").value;
      const measures = c[12].querySelector("select").value;
      const comment = c[13].querySelector("input").value;

      fetch(`/slujba/update/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ offender, measures, comment }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const v = violationsData.find((x) => String(x.id) === String(id));
            if (v) {
              v.offender = offender;
              v.measures = measures;
              v.comment = comment;
            }
            c[11].textContent = offender;
            c[12].textContent = measures;
            c[13].textContent = comment;
            row.querySelector(".edit").style.display = "inline-block";
            row.querySelector(".save").style.display = "none";
            row.querySelector(".cancel").style.display = "none";
          } else alert("Ошибка: " + (data.error || "Не удалось сохранить"));
        })
        .catch(() => alert("Ошибка сети при сохранении"));
    }

    // === отмена ===
    if (btn.classList.contains("cancel")) render(filtersActive ? getFilteredData() : violationsData);

    // === ОТПРАВИТЬ ===
    if (btn.classList.contains("send")) {
      const id = row.dataset.id;
      if (!confirm("Отправить это нарушение как закрытое?")) return;

      // собираем последние данные из строки
      const offender =
        c[11].querySelector("input")?.value ||
        c[11].textContent.trim() ||
        "";
      const measures =
        c[12].querySelector("select")?.value ||
        c[12].textContent.trim() ||
        "";
      const comment =
        c[13].querySelector("input")?.value ||
        c[13].textContent.trim() ||
        "";

      const payload = { offender, measures, comment, action: "close" };

      fetch(`/slujba/update/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            alert("✅ Нарушение успешно отправлено!");
            row.style.opacity = "0.5";
            row.querySelectorAll("button").forEach((b) => (b.disabled = true));
          } else alert("Ошибка при отправке: " + (data.error || "Не удалось отправить"));
        })
        .catch(() => alert("Ошибка сети при отправке"));
    }
  });

  // ---------------- первичная загрузка ----------------
  (function bootstrapFromDOM() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    violationsData = rows.map((r) => {
      const c = r.querySelectorAll("td");
      return {
        id: r.dataset.id,
        date: c[0]?.textContent.trim() || "",
        airport: c[1]?.textContent.trim() || "",
        flight: c[2]?.textContent.trim() || "",
        direction: c[3]?.textContent.trim() || "",
        type: c[4]?.textContent.trim() || "",
        time_start: c[5]?.textContent.trim().split(" - ")[0] || "",
        time_end: c[5]?.textContent.trim().split(" - ")[1] || "",
        sector: c[6]?.textContent.trim() || "",
        violation_start: c[7]?.textContent.trim().split(" - ")[0] || "",
        violation_end: c[7]?.textContent.trim().split(" - ")[1] || "",
        service: c[8]?.textContent.trim() || "",
        violation: c[9]?.textContent.trim() || "",
        description: c[10]?.textContent.trim() || "",
        offender: c[11]?.textContent.trim() || "",
        measures: c[12]?.textContent.trim() || "",
        comment: c[13]?.textContent.trim() || "",
      };
    });
    render(violationsData);
  })();
});
