document.addEventListener("DOMContentLoaded", () => {
  const weekStartInput = document.getElementById("weekStart");
  const weekEndInput = document.getElementById("weekEnd");
  const applyBtn = document.getElementById("applyFiltersBtn");
  const resetBtn = document.getElementById("resetFiltersBtn");
  const sendBtn = document.getElementById("sendWeekBtn");
  const agreeBtn = document.getElementById("agreeWeekBtn");
  const tableBody = document.querySelector("#weeklyReportTable tbody");
  const approvedCountEl = document.getElementById("approvedCount");
  const agreedCountEl = document.getElementById("agreedCount");
  const totalCountEl = document.getElementById("totalCount");

  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");

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

  function startOfWeek(date) {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function endOfWeek(date) {
    const monday = startOfWeek(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }

  function formatDateInput(date) {
    return date.toISOString().slice(0, 10);
  }

  function normalizeArray(val) {
    if (Array.isArray(val)) {
      return val.filter(Boolean);
    }
    if (val == null) {
      return [];
    }
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val.replace(/'/g, '"'));
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      } catch (err) {
        // ignore
      }
      return val
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function updateSummary(items) {
    if (!items) {
      if (approvedCountEl) approvedCountEl.textContent = "0";
      if (agreedCountEl) agreedCountEl.textContent = "0";
      if (totalCountEl) totalCountEl.textContent = "0";
      return;
    }
    const approved = items.filter((v) => v.status === "approved").length;
    const agreed = items.filter((v) => v.status === "agreed").length;
    if (approvedCountEl) approvedCountEl.textContent = approved;
    if (agreedCountEl) agreedCountEl.textContent = agreed;
    if (totalCountEl) totalCountEl.textContent = items.length;
  }

  function renderTable(items) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!items || !items.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 14;
      emptyCell.textContent = "Нет данных за выбранный период";
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
      updateSummary([]);
      return;
    }

    items.forEach((item) => {
      const services = normalizeArray(item.services).join(", ");
      const violations = normalizeArray(item.violation).join(", ");
      const row = document.createElement("tr");
      row.dataset.status = item.status || "";
      if (item.status) {
        row.classList.add(item.status);
      }
      row.innerHTML = `
        <td>${item.date || ""}</td>
        <td>${item.airport || ""}</td>
        <td>${item.flight || ""}</td>
        <td>${item.direction || ""}</td>
        <td>${item.type || ""}</td>
        <td>${item.time_start || ""}</td>
        <td>${item.time_end || ""}</td>
        <td>${item.sector || ""}</td>
        <td>${item.violation_start || ""}</td>
        <td>${item.violation_end || ""}</td>
        <td>${services}</td>
        <td>${violations}</td>
        <td><textarea readonly class="desc-text">${item.description || ""}</textarea></td>
        <td>${item.status || ""}</td>
      `;
      tableBody.appendChild(row);
      const textarea = row.querySelector(".desc-text");
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.max(40, textarea.scrollHeight) + "px";
      }
    });

    updateSummary(items);
  }

  function getFilters() {
    const start = weekStartInput?.value;
    const end = weekEndInput?.value;
    return { start, end };
  }

  function validateRange(start, end) {
    if (!start || !end) {
      alert("Выберите даты недели.");
      return false;
    }
    if (start > end) {
      alert("Дата начала не может быть позже даты окончания.");
      return false;
    }
    return true;
  }

  function loadViolations() {
    const { start, end } = getFilters();
    if (!validateRange(start, end)) {
      renderTable([]);
      return;
    }
    const params = new URLSearchParams({ start, end });
    fetch(`/inspector/api/weekly_violations/?${params.toString()}`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error("Не удалось загрузить данные");
        }
        return resp.json();
      })
      .then((data) => {
        renderTable(data.items || []);
      })
      .catch((err) => {
        console.error(err);
        alert("Ошибка загрузки данных недели.");
        renderTable([]);
      });
  }

  function resetFilters() {
    const today = new Date();
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    if (weekStartInput) weekStartInput.value = formatDateInput(start);
    if (weekEndInput) weekEndInput.value = formatDateInput(end);
  }

  function agreeWeek() {
    const { start, end } = getFilters();
    if (!validateRange(start, end)) {
      return;
    }
    if (!agreeBtn) {
      return;
    }
    agreeBtn.disabled = true;
    fetch("/inspector/weekly-report/agree/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ start, end }),
    })
      .then((resp) => {
        if (!resp.ok) {
          return resp.json().then((data) => {
            const message = data?.error || "Не удалось обновить статусы.";
            throw new Error(message);
          });
        }
        return resp.json();
      })
      .then((data) => {
        const updated = data?.updated ?? 0;
        alert(`✅ Обновлено ${updated} нарушений`);
        window.location.reload();
      })
      .catch((err) => {
        console.error(err);
        alert(err.message || "Произошла ошибка при обновлении статусов.");
      })
      .finally(() => {
        agreeBtn.disabled = false;
      });
  }

  function sendWeek() {
    const { start, end } = getFilters();
    if (!validateRange(start, end)) {
      return;
    }
    if (!sendBtn) {
      return;
    }
    sendBtn.disabled = true;
    fetch("/inspector/send_week/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ start, end }),
    })
      .then((resp) => {
        if (!resp.ok) {
          return resp.json().then((data) => {
            const message = data?.error || "Не удалось отправить нарушения.";
            throw new Error(message);
          });
        }
        return resp.json();
      })
      .then((data) => {
        const updated = data?.updated ?? 0;
        alert(`📤 Отправлено ${updated} нарушений`);
        window.location.reload();
      })
      .catch((err) => {
        console.error(err);
        alert(err.message || "Произошла ошибка при отправке нарушений.");
      })
      .finally(() => {
        sendBtn.disabled = false;
      });
  }

  if (menuToggle && sidebar && sidebarBackdrop) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("open");
      sidebarBackdrop.classList.toggle("show");
    });
    sidebarBackdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("show");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("show");
      }
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadViolations();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetFilters();
      loadViolations();
    });
  }

  if (agreeBtn) {
    agreeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      agreeWeek();
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendWeek();
    });
  }

  resetFilters();
  loadViolations();
});