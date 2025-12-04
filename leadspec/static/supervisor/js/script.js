document.addEventListener("DOMContentLoaded", () => {
  /* ===== Справочники ===== */
  const AIRPORTS_LIST = ["Баткен","Джалал-Абад","Иссык-Куль","Казарман","Каракол","Кербен","Манас","Нарын","Ош","Раззаков","Талас"];
  const SERVICES_LIST = ["АС","АХО","ИБПиКК","МСЧ","ОАК","ОДОиК","ОМОиГЗ","ОНК","ОООиМ","ООТиТБ","ОР","ОРГЯ","ОРИА","ОСО","ОСР","ОХО","САБ","САСПОП","СИТиС","СМТО","СООД","СОПАП","СПОиАТ","ССРиСТО","СЭСТОП","УПК","УПО","УТНиРП","УЧР","ФЭО","ЦБ","ЦМВК"];
  const VIOLATIONS_LIST = [
  "Авиац. безоп.",
  "Внутри объект. режим",
  "Безоп. полётов",
  "Опозд./Отсут.",
  "Влекущ. задерж. обслуж.",
  "Негат. вл. на имидж а/порта",
  "Манипул. с вещами пассаж.",
  "Труд. дисц.",
  "Произв. правил, технол.",
  "Обнаруж. бесхоз. вещей",
  "Доступ. служ. граждан",
  "Наруш. обществ. порядка",
  "Наруш. ПДД на автодор.",
  "Пожар. безоп.",
  "Сан-эпидем. режима",
  "Эконом. безоп. (субъект)",
  "Призн. корруп. деят-ти",
  "Наруш. режима беспош. торговли",
  "Инфор. подлеж. докладу"
];

  const INSPECTORS_LIST = [
    "Абдыев Нурлан","Абдыкеримова Аида","Абдрасулов Адилет","Абылкасымов Азиз",
    "Азимжанов Айдин","Асылуков Жаныбек","Бактиярова Асель","Бадыкеева Айгуль",
    "Бугубаев Тимур","Бутешев Меред","Данышбек уулу Бактияр","Дюшебекова Сардана",
    "Иманкулов Мелис","Камчыбеков Кубанычбек","Касымова Рима","Кебекбаев Артур",
    "Кидебаев Руслан","Конуpбаев Эрлан","Кулова Алия","Макил уулу Сабыр",
    "Маматов Урмат","Мамбеткалиев Канат","Насырова Акинай","Нурбекова Нуриза",
    "Осмонов Нурсултан","Оморов Данияр","Озубеков Элзар","Раманова Айнура",
    "Сейталиев Айбек","Сырдыбаев Азат","Турсунбек уулу Адисбек","Утебаев Алмаз"
  ];

  /* ===== DOM ===== */
  const table = document.getElementById("violationsTable");
  const tbody = table.querySelector("tbody");
  const addBtn = document.getElementById("addViolationBtn");
  const exportBtn = document.getElementById("exportExcelBtn"); // кнопка Экспорт в Excel
  const fDateFrom = document.getElementById("dateFrom");
  const fDateTo   = document.getElementById("dateTo");
  const applyBtn  = document.getElementById("applyFiltersBtn");
  const resetBtn  = document.getElementById("resetFiltersBtn");

  const selAirport   = document.getElementById("airport");
  const selService   = document.getElementById("service");
  const selTehnick   = document.getElementById("tehnick");
  const selViolation = document.getElementById("violationFilter");

  const currentUser = document.body.dataset.username || "";
  const todayStr = new Date().toISOString().slice(0, 10);
  if (fDateFrom) fDateFrom.value = todayStr;
  if (fDateTo)   fDateTo.value   = todayStr;

  /* ===== Helpers ===== */
  const escapeHtml = s => (s===0||s)
    ? String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
               .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    : "";

  function getCookie(name){
    let cookieValue=null;
    if(document.cookie && document.cookie!==""){
      const cookies=document.cookie.split(";");
      for(let cookie of cookies){
        cookie=cookie.trim();
        if(cookie.startsWith(name+"=")){
          cookieValue=decodeURIComponent(cookie.substring(name.length+1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrftoken = getCookie("csrftoken");

  function toArrayVal(val){
    if(Array.isArray(val)) return val.filter(Boolean);
    if(val==null) return [];
    const s=String(val).trim(); if(!s) return [];
    try{
      const parsed=JSON.parse(s.replace(/'/g,'"'));
      if(Array.isArray(parsed)) return parsed.filter(Boolean);
    }catch(_){}
    return s.replace(/^\[|\]$/g,"").split(",").map(t=>t.replace(/^['"\s]+|['"\s]+$/g,"")).filter(Boolean);
  }

  function fillSelect(el, list) {
    if (!el) return;
    el.innerHTML = list.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  }
  fillSelect(selAirport, AIRPORTS_LIST);
  fillSelect(selService, SERVICES_LIST);
  fillSelect(selViolation, VIOLATIONS_LIST);
  if (selTehnick) {
    selTehnick.innerHTML = INSPECTORS_LIST.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("")
                         + `<option value="Другие">Другие</option>`;
  }

  /* ===== Кастомные мультиселекты (фильтры) ===== */
  function initMultiSelect(selectEl){
    if(!selectEl) return null;
    const options=[...selectEl.querySelectorAll("option")]
      .filter(o=>o.value!=="").map(o=>({value:o.value,label:o.textContent}));
    const wrap=document.createElement("div"); wrap.className="ms";
    const trigger=document.createElement("button"); trigger.type="button"; trigger.className="ms-trigger"; trigger.textContent="Все";
    const drop=document.createElement("div"); drop.className="ms-dropdown";
    options.forEach(opt=>{
      drop.insertAdjacentHTML("beforeend",`
        <label class="ms-opt">
          <input type="checkbox" data-val="${escapeHtml(opt.value)}"><span>${escapeHtml(opt.label)}</span>
        </label>`);
    });
    const footer=document.createElement("div"); footer.style.marginTop="8px";
    const apply=document.createElement("button"); apply.type="button"; apply.textContent="Выбрать"; apply.className="btn btn-success";
    footer.appendChild(apply); drop.appendChild(footer);

    selectEl.style.display="none";
    selectEl.parentNode.insertBefore(wrap,selectEl);
    wrap.appendChild(trigger); wrap.appendChild(drop);

    let selected=new Set();
    function upd(){
      if(selected.size===0) trigger.textContent="Все";
      else if(selected.size<=2) trigger.textContent=[...selected].join(", ");
      else trigger.textContent=`Выбрано: ${selected.size}`;
    }
    trigger.addEventListener("click",(e)=>{e.stopPropagation(); document.querySelectorAll(".ms-dropdown.open").forEach(d=>d.classList.remove("open")); drop.classList.toggle("open");});
    drop.addEventListener("click",(e)=>e.stopPropagation());
    apply.addEventListener("click",()=>{selected.clear(); drop.querySelectorAll("input[type=checkbox]").forEach(cb=>{if(cb.checked) selected.add(cb.getAttribute("data-val"));}); upd(); drop.classList.remove("open");});
    document.addEventListener("click",()=>drop.classList.remove("open"));

    return { getValues(){return [...selected];}, reset(){selected.clear(); drop.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked=false); trigger.textContent="Все";} };
  }

  const msControllers = {
    airport:   initMultiSelect(selAirport),
    service:   initMultiSelect(selService),
    tehnick:   initMultiSelect(selTehnick),
    violation: initMultiSelect(selViolation),
  };

  /* ===== State ===== */
  let violationsData = [];
  let filtersActive = true;

  /* ===== API ===== */
  function loadViolations() {
    fetch("/supervisor/api/violations/")
      .then(r => r.json())
      .then(({ items }) => {
        violationsData = (items || []).map(v => {
  const svc = Array.isArray(v.services) ? v.services : toArrayVal(v.service);
  return {
    ...v,
    service: svc,                            // ← теперь UI видит актуальные службы
    violation: toArrayVal(v.violation)
        };
      });
        render(getFilteredData());
      });
  }

  function saveViolation(v) {
    return fetch(`/supervisor/api/violations/${v.id}/`, {
      method: "POST",
      headers: {"Content-Type":"application/json","X-CSRFToken":csrftoken},
      body: JSON.stringify(v)
    }).then(r=>r.json());
  }

  function createViolation(v) {
    return fetch("/supervisor/api/violations/create/", {
      method: "POST",
      headers: {"Content-Type":"application/json","X-CSRFToken": csrftoken},
      body: JSON.stringify(v)
    }).then(r=>r.json());
  }

  /* ===== Фильтрация ===== */
  function getFilteredData(){
    const airports = msControllers.airport?.getValues() ?? [];
    const services = msControllers.service?.getValues() ?? [];
    const tehnicks = msControllers.tehnick?.getValues() ?? [];
    const vtypes   = msControllers.violation?.getValues() ?? [];
    const dFrom=fDateFrom?.value||"", dTo=fDateTo?.value||"";

    return violationsData.filter(v=>{
      const date = v.date || "";
      if (dFrom && date < dFrom) return false;
      if (dTo   && date > dTo) return false;
      if (airports.length && !airports.includes(v.airport)) return false;

      const vServices = toArrayVal(v.service);
      const vViolations = toArrayVal(v.violation);
      if (services.length && !vServices.some(s=>services.includes(s))) return false;
      if (vtypes.length && !vViolations.some(x=>vtypes.includes(x))) return false;

      if (tehnicks.length){
        const isInList = INSPECTORS_LIST.includes(v.tehnick);
        const group = isInList ? v.tehnick : "Другие";
        if (!tehnicks.includes(group)) return false;
      }
      return true;
    });
  }

  if (applyBtn) applyBtn.addEventListener("click", ()=>{filtersActive=true;render(getFilteredData());});
  if (resetBtn) resetBtn.addEventListener("click", ()=>{
    Object.values(msControllers).forEach(c=>c?.reset());
    if (fDateFrom) fDateFrom.value=todayStr;
    if (fDateTo)   fDateTo.value=todayStr;
    filtersActive=true;
    render(getFilteredData());
  });

  /* ===== Рендер таблицы ===== */
  function render(data = (filtersActive ? getFilteredData() : violationsData)) {
    tbody.innerHTML = "";
    data.forEach(v=>{
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
        <td>${escapeHtml(toArrayVal(v.service).join(", "))}</td>
        <td>${escapeHtml(toArrayVal(v.violation).join(", "))}</td>
        <td><textarea readonly class="desc-text">${escapeHtml(v.description || "")}</textarea></td>
        <td>${escapeHtml(v.supervisor || "")}</td>
        <td>${escapeHtml(v.tehnick || "")}</td>
        <td>${escapeHtml(v.shift || "")}</td>
        <td class="action-btns"><button class="edit">✏️</button></td>`;
      tbody.appendChild(tr);
      const ta=tr.querySelector(".desc-text");
      if(ta){ta.style.height="auto";ta.style.height=Math.max(40,ta.scrollHeight)+"px";}
    });
  }

  function selectHTML(options,current=[],multiple=false,size=4){
    const curr=Array.isArray(current)?current:(current?[current]:[]);
    let h=`<select ${multiple?"multiple":""} ${multiple?`size="${size}"`:""}>`;
    if(!multiple) h+=`<option value=""></option>`;
    options.forEach(o=>{
      const sel=curr.includes(o)?" selected":"";
      h+=`<option value="${escapeHtml(o)}"${sel}>${escapeHtml(o)}</option>`;
    });
    h+=`</select>`;
    return h;
  }

  function enableSimpleMulti(sel){
    if(!sel||!sel.multiple)return;
    sel.addEventListener("mousedown",(e)=>{
      const opt=e.target;
      if(opt && opt.tagName==="OPTION"){
        e.preventDefault();
        opt.selected=!opt.selected;
        sel.focus();
        sel.dispatchEvent(new Event("change",{bubbles:true}));
      }
    });
  }

  /* ===== Редактирование ===== */
  function startEditing(row){
    const id=row.dataset.id;
    const v=violationsData.find(x=>String(x.id)===String(id));
    if(!v)return;
    const c=row.querySelectorAll("td");

    c[0].innerHTML=`<input type="date" value="${escapeHtml(v.date||todayStr)}">`;
    c[1].innerHTML=selectHTML(AIRPORTS_LIST,v.airport||"");
    c[2].innerHTML=`<input type="text" value="${escapeHtml(v.flight||"")}">`;
    c[3].innerHTML=`<input type="text" value="${escapeHtml(v.direction||"")}">`;
    c[4].innerHTML=selectHTML(["Прилет","Вылет"],v.type||"");
    c[5].innerHTML=`<input type="time" value="${escapeHtml(v.time_start||"")}"><input type="time" value="${escapeHtml(v.time_end||"")}">`;
    c[6].innerHTML=`<input type="text" value="${escapeHtml(v.sector||"")}">`;
    c[7].innerHTML=`<input type="time" value="${escapeHtml(v.violation_start||"")}"><input type="time" value="${escapeHtml(v.violation_end||"")}">`;
    c[8].innerHTML=selectHTML(SERVICES_LIST,toArrayVal(v.service),true,6);
    c[9].innerHTML=selectHTML(VIOLATIONS_LIST,toArrayVal(v.violation),true,4);
    c[10].innerHTML=`<textarea class="desc-edit">${escapeHtml(v.description||"")}</textarea>`;
    c[11].innerHTML=`${escapeHtml(v.supervisor||currentUser)}`;
    c[12].innerHTML=selectHTML(INSPECTORS_LIST,v.tehnick||"");
    c[13].innerHTML=selectHTML(["1","2","3","4"],v.shift||"");
    c[14].innerHTML=`<button class="save">💾</button><button class="cancel">❌</button>`;

    enableSimpleMulti(c[8].querySelector("select"));
    enableSimpleMulti(c[9].querySelector("select"));
  }

  function handleSave(row){
    const id=row.dataset.id;
    const c=row.querySelectorAll("td");
    const payload={
      id:id,
      date:c[0].querySelector("input").value,
      airport:c[1].querySelector("select").value,
      flight:c[2].querySelector("input").value,
      direction:c[3].querySelector("input").value,
      type:c[4].querySelector("select").value,
      time_start:c[5].querySelectorAll("input")[0].value,
      time_end:c[5].querySelectorAll("input")[1].value,
      sector:c[6].querySelector("input").value,
      violation_start:c[7].querySelectorAll("input")[0].value,
      violation_end:c[7].querySelectorAll("input")[1].value,
      service:Array.from(c[8].querySelectorAll("option:checked")).map(o=>o.value),
      violation:Array.from(c[9].querySelectorAll("option:checked")).map(o=>o.value),
      description:c[10].querySelector("textarea").value,
      supervisor:currentUser,
      tehnick:c[12].querySelector("select").value,
      shift:c[13].querySelector("select").value
    };
    const isTemp = String(id).startsWith("tmp-");
    const p = isTemp ? createViolation(payload) : saveViolation(payload);
    p.then(d=>{
      if (d && (d.success || d.id)) loadViolations();
      else { alert("Не удалось сохранить запись"); console.error("Save error:", d); }
    }).catch(e=>{ alert("Ошибка сохранения"); console.error(e); });
  }

  tbody.addEventListener("click", e=>{
    const btn=e.target.closest("button"); if(!btn)return;
    const row=btn.closest("tr"); if(!row)return;
    if(btn.classList.contains("edit")) return startEditing(row);
    if(btn.classList.contains("save")) return handleSave(row);
    if(btn.classList.contains("cancel")) return render(); // мягкая отмена
  });

  if(addBtn) addBtn.addEventListener("click", ()=>{
    const tmp={
      id:`tmp-${Date.now()}`,
      date:todayStr, airport:"", flight:"", direction:"", type:"",
      time_start:"", time_end:"", sector:"",
      violation_start:"", violation_end:"",
      service:[], violation:[], description:"",
      supervisor:currentUser, tehnick:"", shift:""
    };
    // локально добавляем, сразу редактируем (без мгновенного POST)
    violationsData.unshift(tmp);
    render(violationsData);
    const row = tbody.querySelector(`tr[data-id="${tmp.id}"]`);
    if (row) startEditing(row);
  });

  /* ===== Боковое меню ===== */
  const menuToggle=document.getElementById("menuToggle");
  const sidebar=document.getElementById("sidebar");
  const backdrop=document.getElementById("sidebarBackdrop");
  function closeSidebar(){sidebar.classList.remove("open"); backdrop.classList.remove("show");}
  if(menuToggle && sidebar && backdrop){
    menuToggle.addEventListener("click",(e)=>{e.stopPropagation(); sidebar.classList.toggle("open"); backdrop.classList.toggle("show");});
    backdrop.addEventListener("click",closeSidebar);
    document.addEventListener("keydown",(e)=>{if(e.key==="Escape") closeSidebar();});
  }

  /* ===== Экспорт в Excel (xlsx-js-style с оформлением + имя по датам) ===== */
  (function safeExcelExport(){
    if (!exportBtn) return;

    exportBtn.addEventListener("click", function () {
      try {
        if (!window.XLSX) { alert("Библиотека XLSX не подключена (xlsx-js-style)"); return; }
        const rows = getFilteredData(); if (!rows || !rows.length) { alert("Нет данных для экспорта!"); return; }

        const headers = [
          "Дата","Аэропорт","Рейс","Направление","Прилет/Вылет",
          "Время рейса","Сектор","Время нарушения",
          "Служба","Вид нарушения","Описание","Старший смены","Кем выявлено","Смена"
        ];

        const toArrayValSafe = (v)=>{
          if (Array.isArray(v)) return v.filter(Boolean);
          if (v == null) return [];
          const s = String(v).trim(); if (!s) return [];
          try { const p = JSON.parse(s.replace(/'/g,'"')); if (Array.isArray(p)) return p.filter(Boolean); } catch(_){}
          return s.replace(/^\[|\]$/g,"").split(",").map(t=>t.replace(/^['"\s]+|['"\s]+$/g,"")).filter(Boolean);
        };

        const toRow = v => ([
          v.date || "",
          v.airport || "",
          v.flight || "",
          v.direction || "",
          v.type || "",
          `${v.time_start || ""} - ${v.time_end || ""}`,
          v.sector || "",
          `${v.violation_start || ""} - ${v.violation_end || ""}`,
          toArrayValSafe(v.service).join(", "),
          toArrayValSafe(v.violation).join(", "),
          v.description || "",
          v.supervisor || "",
          v.tehnick || "",
          v.shift || ""
        ]);

        const aoa = [headers, ...rows.map(toRow)];
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // корректный диапазон
        const totalRows = aoa.length;
        const totalCols = headers.length;
        ws["!ref"] = XLSX.utils.encode_range({ r:0, c:0 }, { r: totalRows - 1, c: totalCols - 1 });

        // автоширина колонок
        const cols = [];
        for (let c = 0; c < totalCols; c++) {
          let max = headers[c].length;
          for (let r = 1; r < totalRows; r++) {
            const val = aoa[r][c] == null ? "" : String(aoa[r][c]);
            max = Math.max(max, val.length);
          }
          cols.push({ wch: Math.min(80, Math.max(15, max + 2)) });
        }
        ws["!cols"] = cols;

        // авто-высота строк (приближённая) по суммарной длине
        ws["!rows"] = Array.from({length: totalRows}, (_, i) => {
          if (i === 0) return { hpt: 22 }; // заголовок
          const rowTextLen = aoa[i].reduce((a, v) => a + (v ? String(v).length : 0), 0);
          const lines = Math.ceil(rowTextLen / 120);
          return { hpt: Math.min(120, 18 + lines * 10) };
        });

        // стили (границы, перенос текста, заголовки жирным)
        const thin = { style: "thin", color: { rgb: "000000" } };
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const addr = XLSX.utils.encode_cell({ r:R, c:C });
            if (!ws[addr]) ws[addr] = { t:"s", v:"" };
            ws[addr].s = {
              border: { top: thin, left: thin, right: thin, bottom: thin },
              alignment: {
                vertical: "center",
                horizontal: (C === 10 ? "left" : "center"), // «Описание» выравниваем влево
                wrapText: true
              },
              font: { bold: (R === 0) }
            };
          }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Отчёт");

        // Имя файла по выбранным датам
        let dFrom = fDateFrom?.value || todayStr;
        let dTo   = fDateTo?.value   || todayStr;
        const fileName = (dFrom === dTo)
          ? `Отчет_${dFrom}.xlsx`
          : `Отчет_${dFrom}_${dTo}.xlsx`;

        XLSX.writeFile(wb, fileName);
      } catch (err) {
        console.error("[Excel export] error:", err);
        alert("Во время экспорта произошла ошибка. Подробности в консоли.");
      }
    });
  })();

  /* ===== start ===== */
  loadViolations();
});
