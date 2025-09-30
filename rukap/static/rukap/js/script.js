document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#violationsTable tbody");
  const weekLabel = document.getElementById("weekLabel");
  const prevBtn = document.getElementById("prevWeekBtn");
  const nextBtn = document.getElementById("nextWeekBtn");
  const currentBtn = document.getElementById("currentWeekBtn");
  const approveBtn = document.getElementById("approveBtn"); // если кнопка присутствует

  // Смещение недель относительно ТЕКУЩЕЙ недели (0 — текущая, -1 — прошлая)
  let currentWeekOffset = -1; // по умолчанию — прошлая неделя

  // --- Утилиты для дат ---

  // Парсинг даты из ячейки: поддерживает "YYYY-MM-DD" и "DD.MM.YYYY"
  function parseCellDate(text) {
    if (!text) return null;
    const s = text.trim();

    // Формат YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
      const dt = new Date(y, mo, d); // локальная дата (00:00)
      return isNaN(dt.getTime()) ? null : dt;
    }

    // Формат DD.MM.YYYY
    m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3]);
      const dt = new Date(y, mo, d);
      return isNaN(dt.getTime()) ? null : dt;
    }

    // Последняя попытка — стандартный парсер (может быть ненадежным в некоторых браузерах)
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Возвращает понедельник/воскресенье недели со смещением offset (0 — текущая)
  function getWeekRange(offset = 0) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // В JS: getDay(): вс = 0, пн = 1, ... сб = 6
    // Нам нужен понедельник. Сделаем св = 7
    const day = now.getDay() === 0 ? 7 : now.getDay();

    // Понедельник текущей недели
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1 + offset * 7);
    monday.setHours(0, 0, 0, 0);

    // Воскресенье текущей недели
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { from: monday, to: sunday };
  }

  // Формат в лейбле недели: DD.MM.YYYY
  function formatDDMMYYYY(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  // Обновление недели и фильтра
  function updateWeek(offset) {
    currentWeekOffset = offset;
    const { from, to } = getWeekRange(offset);
    weekLabel.textContent = `${formatDDMMYYYY(from)} - ${formatDDMMYYYY(to)}`;
    filterByWeek(from, to);
  }
  // массовое согласование
  approveAllBtn.addEventListener("click", () => {
    Array.from(tbody.querySelectorAll("tr")).forEach(row => {
      if (row.style.display !== "none") {
        const statusCell = row.querySelector("td:last-child");
        if (statusCell) {
          statusCell.textContent = "Согласовано";
          statusCell.style.color = "green";
        }
      }
    });
  });
  // Фильтрация строк по диапазону
  function filterByWeek(from, to) {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.forEach(row => {
      // Дата всегда в первой колонке (индекс 0)
      const cell = row.children[0];
      if (!cell) { row.style.display = ""; return; }

      const dateText = cell.textContent || cell.innerText || "";
      const rowDate = parseCellDate(dateText);

      // Если дату распарсить не удалось — показываем строку (чтобы не потерять данные)
      if (!rowDate) { row.style.display = ""; return; }

      if (rowDate >= from && rowDate <= to) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  // --- Кнопки переключения недель ---
  prevBtn?.addEventListener("click", () => updateWeek(currentWeekOffset - 1));
  nextBtn?.addEventListener("click", () => updateWeek(currentWeekOffset + 1));
  // «Последняя неделя» — всегда offset = -1
  currentBtn?.addEventListener("click", () => updateWeek(-1));

  // --- Кнопка «Согласовать» ---
  approveBtn?.addEventListener("click", () => {
    // здесь можно вызвать ваш backend для подтверждения выбранной недели
    alert("Данные за выбранную неделю отмечены как согласованные ✅");
  });

  // ИНИЦИАЛИЗАЦИЯ: сразу показываем ПРОШЛУЮ неделю
  // Важно: вызываем после того, как DOM-таблица уже на странице
  updateWeek(-1);
});

approveAllBtn?.addEventListener("click", () => {
  const ids = [];
  tbody.querySelectorAll("tr").forEach(row => {
    if (row.style.display !== "none") {
      ids.push(row.dataset.id); // берем id из атрибута строки
    }
  });

  fetch("/rukap/agreed/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ ids })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      tbody.querySelectorAll("tr").forEach(row => {
        if (row.style.display !== "none") {
          const statusCell = row.querySelector("td:last-child");
          statusCell.textContent = "agreed";
          statusCell.style.color = "green";
        }
      });
      alert(`${data.updated} нарушений согласовано ✅`);
    } else {
      alert("Ошибка: " + data.error);
    }
  });
});