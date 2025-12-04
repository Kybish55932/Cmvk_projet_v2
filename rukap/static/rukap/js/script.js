// static/rukap/js/script.js
document.addEventListener("DOMContentLoaded", () => {
  const tbody       = document.querySelector("#violationsTable tbody");
  const weekLabel   = document.getElementById("weekLabel");
  const prevBtn     = document.getElementById("prevWeekBtn");
  const nextBtn     = document.getElementById("nextWeekBtn");
  const currentBtn  = document.getElementById("currentWeekBtn");
  const approveAllBtn = document.getElementById("approveAllBtn");

  // По умолчанию — прошлая неделя
  let currentWeekOffset = -1;
  let currentItems = []; // кэш загруженной недели (массив объектов)

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const badge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "✅ <span style='color:green'>approved</span>";
    if (s === "sent")     return "⏳ <span style='color:#1e7fd9'>sent</span>";
    if (s === "rejected") return "❌ <span style='color:#d91e1e'>rejected</span>";
    if (s === "agreed")   return "✅ <span style='color:green'>agreed</span>";
    return (status || "");
  };

  function render(items, fromISO, toISO) {
    // Заголовок недели
    weekLabel.textContent = `${fmtDate(fromISO)} - ${fmtDate(toISO)}`;

    // Таблица
    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; opacity:.7;">Нет данных</td></tr>`;
      return;
    }

    const rowsHtml = items.map(v => {
      const svc = Array.isArray(v.services) ? v.services.join(", ") : (v.service || "");
      const timeRange = `${v.time_start || ""}${v.time_start || v.time_end ? " - " : ""}${v.time_end || ""}`;
      const violRange = `${v.violation_start || ""}${v.violation_start || v.violation_end ? " - " : ""}${v.violation_end || ""}`;
      return `
        <tr data-id="${v.id}">
          <td>${fmtDate(v.date)}</td>
          <td>${escapeHtml(v.airport || "")}</td>
          <td>${escapeHtml(v.flight || "")}</td>
          <td>${escapeHtml(v.direction || "")}</td>
          <td>${escapeHtml(v.type || "")}</td>
          <td>${escapeHtml(timeRange)}</td>
          <td>${escapeHtml(v.sector || "")}</td>
          <td>${escapeHtml(violRange)}</td>
          <td>${escapeHtml(svc)}</td>
          <td>${escapeHtml(v.violation || "")}</td>
          <td>${escapeHtml(v.description || "")}</td>
          <td>${badge(v.status)}</td>
        </tr>`;
    }).join("");

    tbody.innerHTML = rowsHtml;
  }

  function escapeHtml(s) {
    if (s === 0 || s) {
      return String(s)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;");
    }
    return "";
  }

  function loadWeek(offset) {
    currentWeekOffset = offset;
    fetch(`/rukap/api/?week_offset=${encodeURIComponent(offset)}`, {
      headers: {"Accept":"application/json"}
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({items, from, to}) => {
        currentItems = items || [];
        render(currentItems, from, to);
      })
      .catch(err => {
        console.error("Ошибка загрузки:", err);
        tbody.innerHTML = `<tr><td colspan="12" style="color:#d91e1e;">Ошибка загрузки данных</td></tr>`;
      });
  }

  // Массовое согласование текущей недели
  approveAllBtn?.addEventListener("click", () => {
    const rows = Array.from(tbody.querySelectorAll("tr[data-id]"));
    if (!rows.length) return;

    const ids = rows.map(tr => Number(tr.dataset.id)).filter(Boolean);
    if (!ids.length) return;

    fetch("/rukap/agreed/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Если снимешь @csrf_exempt во view — раскомментируй строку ниже:
        // "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ ids })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Удаляем согласованные строки из текущей таблицы (они больше не 'sent')
          rows.forEach(tr => tr.remove());
          alert(`${data.updated} нарушений согласовано ✅`);

          // Если всё удалили — подгрузи неделю заново (на случай гонок)
          if (!tbody.querySelector("tr[data-id]")) {
            loadWeek(currentWeekOffset);
          }
        } else {
          alert("Ошибка: " + (data.error || "Не удалось согласовать"));
        }
      })
      .catch(err => {
        console.error(err);
        alert("Сбой сети при согласовании");
      });
  });

  // Навигация по неделям
  prevBtn?.addEventListener("click", () => loadWeek(currentWeekOffset - 1));
  nextBtn?.addEventListener("click", () => loadWeek(currentWeekOffset + 1));
  currentBtn?.addEventListener("click", () => loadWeek(-1)); // “последняя неделя”

  // Старт: прошлая неделя
  loadWeek(-1);
});

