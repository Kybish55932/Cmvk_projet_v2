document.addEventListener("DOMContentLoaded", () => {
  /* ===== Справочники ===== */
  const AIRPORTS_LIST = ["Баткен","Джалал-Абад","Иссык-Куль","Казарман","Каракол","Кербен","Манас","Нарын","Ош","Раззаков","Талас"];
  const SERVICES_LIST = ["АС","АХО","ИБПиКК","МСЧ","ОАК","ОДОиК","ОМОиГЗ","ОНК","ОООиМ","ООТиТБ","ОР","ОРГЯ","ОРИА","ОСО","ОСР","ОХО","САБ","САСПОП","СИТиС","СМТО","СООД","СОПАП","СПОиАТ","ССРиСТО","СЭСТОП","УПК","УПО","УТНиРП","УЧР","ФЭО","ЦБ","ЦМВК"];
  const VIOLATIONS_LIST = ["АБ","БП","Форма одежды"];
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
  const confirmedEl = document.getElementById("confirmed");
  const rejectedEl  = document.getElementById("rejected");
  const totalEl     = document.getElementById("total");
  const addBtn      = document.getElementById("addViolationBtn");
  const fDateFrom   = document.getElementById("dateFrom");
  const fDateTo     = document.getElementById("dateTo");
  const applyBtn    = document.getElementById("applyFiltersBtn");
  const resetBtn    = document.getElementById("resetFiltersBtn");

  const todayStr = new Date().toISOString().slice(0,10);
  if (fDateFrom) fDateFrom.value = todayStr;
  if (fDateTo)   fDateTo.value   = todayStr;

  // ПЕРЕД инициализацией мультиселекта — заполним фильтр «Кем выявлено» полным списком + «Другие»
  const inspectorSel = document.getElementById("inspector");
  if (inspectorSel) {
    inspectorSel.innerHTML = INSPECTORS_LIST.map(n=>`<option value="${n}">${n}</option>`).join("")
                          + `<option value="Другие">Другие</option>`;
  }

  const filterSelects = {
    airport:   document.getElementById("airport"),
    service:   document.getElementById("service"),
    inspector: inspectorSel,
    violation: document.getElementById("violationFilter"),
    shift:     document.getElementById("shiftFilter"),
  };

    // Автоматически заполняем списки фильтров из констант
function fillSelect(el, list) {
  if (!el) return;
  el.innerHTML = list.map(v => `<option value="${v}">${v}</option>`).join("");
}

fillSelect(filterSelects.airport, AIRPORTS_LIST);
fillSelect(filterSelects.service, SERVICES_LIST);

  /* ===== State ===== */
  let violationsData = [];
  let filtersActive = true;

  const todayDate = () => new Date().toISOString().slice(0, 10);
  const escapeHtml = (s) => (s===0||s)
    ? String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    : "";

  function getCookie(name){
    let cookieValue=null;
    if(document.cookie && document.cookie!==""){
      const cookies=document.cookie.split(";");
      for(let cookie of cookies){cookie=cookie.trim();
        if(cookie.startsWith(name+"=")){cookieValue=decodeURIComponent(cookie.substring(name.length+1));break;}
      }}
    return cookieValue;
  }
  const findIdx = (id) => violationsData.findIndex(v => String(v.id) === String(id));

  /* ===== нормализация массивов (устраняет скобки/кавычки) ===== */
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
  const cleanString = (val)=>toArrayVal(val).join(", ");

  /* ===== кастомные мультиселекты (фильтры) ===== */
  function initMultiSelect(selectEl){
    if(!selectEl) return null;
    const options=[...selectEl.querySelectorAll("option")].filter(o=>o.value!=="").map(o=>({value:o.value,label:o.textContent}));
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
    selectEl.style.display="none"; selectEl.parentNode.insertBefore(wrap,selectEl); wrap.appendChild(trigger); wrap.appendChild(drop);
    let selected=new Set();
    function upd(){ if(selected.size===0) trigger.textContent="Все"; else if(selected.size<=2) trigger.textContent=[...selected].join(", "); else trigger.textContent=`Выбрано: ${selected.size}`; }
    trigger.addEventListener("click",(e)=>{e.stopPropagation(); document.querySelectorAll(".ms-dropdown.open").forEach(d=>d.classList.remove("open")); drop.classList.toggle("open");});
    drop.addEventListener("click",(e)=>e.stopPropagation());
    apply.addEventListener("click",()=>{selected.clear(); drop.querySelectorAll("input[type=checkbox]").forEach(cb=>{if(cb.checked) selected.add(cb.getAttribute("data-val"));}); upd(); drop.classList.remove("open");});
    document.addEventListener("click",()=>drop.classList.remove("open"));
    return { getValues(){return [...selected];}, reset(){selected.clear(); drop.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked=false); trigger.textContent="Все";} };
  }
  const msControllers={};
  Object.entries(filterSelects).forEach(([k,el])=>{const c=initMultiSelect(el); if(c) msControllers[k]=c;});

  /* ===== РЕНДЕР ===== */
 function render(data = (filtersActive ? getFilteredData() : violationsData)) {
  tbody.innerHTML = "";
  data.forEach(v => {
    const tr = document.createElement("tr");
    tr.dataset.id = v.id;
    tr.dataset.status = v.status || "";
    if (v.status) tr.classList.add(v.status);

    tr.innerHTML = `
  <td>${escapeHtml(v.date || "")}</td>
  <td>${escapeHtml(v.airport || "")}</td>
  <td>${escapeHtml(v.flight || "")}</td>
  <td>${escapeHtml(v.direction || "")}</td>
  <td>${escapeHtml(v.type || "")}</td>
  <td>${escapeHtml(v.time_start || "")}</td>
  <td>${escapeHtml(v.time_end || "")}</td>
  <td>${escapeHtml(v.sector || "")}</td>
  <td>${escapeHtml(v.violation_start || "")}</td>
  <td>${escapeHtml(v.violation_end || "")}</td>
  <td>${escapeHtml(cleanString(v.service))}</td>
  <td>${escapeHtml(cleanString(v.violation))}</td>
  <td><textarea readonly class="desc-text">${escapeHtml(v.description || "")}</textarea></td>
  <td>${escapeHtml(v.supervisor || "")}</td>
  <td>${escapeHtml(v.inspector || "")}</td>
  <td>${escapeHtml(v.shift || "")}</td>

  <td class="action-btns">
    <button class="approve" ${v.status === "agreed" ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>✔️</button>
    <button class="reject" ${v.status === "agreed" ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>✖️</button>
  </td>
  <td class="action-btns">
    <button class="edit" ${v.status === "agreed" ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>✏️</button>
    <button class="delete" ${v.status === "agreed" ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>🗑️</button>
  </td>
`;

    tbody.appendChild(tr);
    const ta = tr.querySelector(".desc-text");
    ta.style.height = "auto";
    ta.style.height = Math.max(40, ta.scrollHeight) + "px";
  });
  updateCounters(data);
}


  function updateCounters(ds){confirmedEl.textContent=ds.filter(v=>v.status==="approved").length;rejectedEl.textContent=ds.filter(v=>v.status==="rejected").length;totalEl.textContent=ds.length;}

  /* ===== ФИЛЬТРЫ ===== */
  function getFilteredData(){
    const airports=msControllers.airport?.getValues()??[];
    const services=msControllers.service?.getValues()??[];
    const inspectors=msControllers.inspector?.getValues()??[];
    const violations=msControllers.violation?.getValues()??[];
    const shifts=msControllers.shift?.getValues()??[];
    const dFrom=fDateFrom?.value||"", dTo=fDateTo?.value||"";

    return violationsData.filter(v=>{
      if(dFrom && v.date<dFrom) return false;
      if(dTo   && v.date>dTo)   return false;

      if(airports.length && !airports.includes(v.airport)) return false;

      const vServices=toArrayVal(v.service);
      const vViolations=toArrayVal(v.violation);
      if(services.length   && !vServices.some(s=>services.includes(s))) return false;
      if(violations.length && !vViolations.some(x=>violations.includes(x))) return false;

      if(shifts.length && !shifts.includes(String(v.shift||""))) return false;

      if(inspectors.length){
        const isInList=INSPECTORS_LIST.includes(v.inspector);
        const group=isInList? v.inspector : "Другие";
        if(!inspectors.includes(group)) return false;
      }
      return true;
    });
  }
  if(applyBtn) applyBtn.addEventListener("click",()=>{filtersActive=true;render(getFilteredData());});
  if(resetBtn) resetBtn.addEventListener("click",()=>{
    Object.values(msControllers).forEach(c=>c.reset());
    if(fDateFrom) fDateFrom.value=todayStr;
    if(fDateTo)   fDateTo.value=todayStr;
    filtersActive=true; render(getFilteredData());
  });

  /* ===== CRUD ===== */
  function loadViolations(){
    fetch("/inspector/list/").then(r=>r.json()).then(data=>{
      violationsData = (data || []).map(v => {
  const svc = Array.isArray(v.services) ? v.services : toArrayVal(v.service);
  return {
    ...v,
    service: svc,                             // ← теперь UI видит службы
    violation: toArrayVal(v.violation)
  };
});
      render(getFilteredData()); // сразу по датам
    }).catch(err=>console.error("Ошибка загрузки:",err));
  }
  function addViolation(){
    const n={id:"tmp-"+Date.now(),date:todayDate(),airport:"",flight:"",direction:"",type:"",
      time_start:"",time_end:"",sector:"",violation_start:"",violation_end:"",
      service:[],violation:[],description:"",supervisor:"",inspector:"",shift:"",status:"",isNew:true};
    violationsData.unshift(n); render(); const row=tbody.querySelector(`tr[data-id="${n.id}"]`); if(row) startEditing(row);
  }
  function editViolation(v){
    fetch(`/inspector/edit_violation/${v.id}/`,{method:"POST",headers:{"Content-Type":"application/json","X-CSRFToken":getCookie("csrftoken")},body:JSON.stringify(v)}).then(()=>loadViolations());
  }
  function deleteViolation(id){
    fetch(`/inspector/delete_violation/${id}/`,{method:"POST",headers:{"X-CSRFToken":getCookie("csrftoken")}}).then(()=>loadViolations());
  }
  function updateStatus(id,status){
    fetch(`/inspector/edit_violation/${id}/`,{method:"POST",headers:{"Content-Type":"application/json","X-CSRFToken":getCookie("csrftoken")},body:JSON.stringify({status})})
      .then(r=>r.json()).then(d=>{if(d.success) loadViolations(); else alert("Ошибка при обновлении статуса");});
  }

  /* ===== редактирование строки ===== */
  function selectHTML(options,current="",multiple=false,size=1){
    const curr=Array.isArray(current)?current:(current?[current]:[]);
    let h=`<select ${multiple?"multiple":""} ${multiple?`size="${size}"`:""}>`; if(!multiple) h+=`<option value=""></option>`;
    options.forEach(o=>{const sel=curr.includes(o)?" selected":""; h+=`<option value="${escapeHtml(o)}"${sel}>${escapeHtml(o)}</option>`;});
    h+=`</select>`; return h;
  }
  function enableSimpleMulti(sel){
    if(!sel || !sel.multiple) return;
    sel.addEventListener("mousedown",(e)=>{const opt=e.target; if(opt && opt.tagName==="OPTION"){e.preventDefault(); opt.selected=!opt.selected; sel.focus(); sel.dispatchEvent(new Event("change",{bubbles:true}));}});
  }
  function startEditing(row){
    const id=row.dataset.id, idx=findIdx(id); if(idx===-1) return;
    const v=violationsData[idx]; const c=row.querySelectorAll("td");

    c[0].innerHTML  = `<input type="date" value="${escapeHtml(v.date||todayDate())}">`;
    c[1].innerHTML  = selectHTML(AIRPORTS_LIST, v.airport||"");
    c[2].innerHTML  = `<input type="text" value="${escapeHtml(v.flight||"")}">`;
    c[3].innerHTML  = `<input type="text" value="${escapeHtml(v.direction || "")}">`;
    c[4].innerHTML  = selectHTML(["Прилет","Вылет"], v.type||"");
    c[5].innerHTML  = `<input type="time" value="${escapeHtml(v.time_start||"")}">`;
    c[6].innerHTML  = `<input type="time" value="${escapeHtml(v.time_end||"")}">`;
    /* СЕКТОР — ТЕКСТБОКС */
    c[7].innerHTML  = `<input type="text" value="${escapeHtml(v.sector||"")}">`;
    c[8].innerHTML  = `<input type="time" value="${escapeHtml(v.violation_start||"")}">`;
    c[9].innerHTML  = `<input type="time" value="${escapeHtml(v.violation_end||"")}">`;
    c[10].innerHTML = selectHTML(SERVICES_LIST, toArrayVal(v.service), true, 6);
    c[11].innerHTML = selectHTML(VIOLATIONS_LIST, toArrayVal(v.violation), true, 4);
    c[12].innerHTML = `<textarea class="desc-edit">${escapeHtml(v.description||"")}</textarea>`;
    c[13].innerHTML = `<span>${escapeHtml(v.supervisor||"")}</span>`;
    /* Кем выявлено — свободный ввод + datalist */
    const dlId=`inspectorsList-${id}`;
    c[14].innerHTML = `
      <input type="text" list="${dlId}" value="${escapeHtml(v.inspector||"")}" />
      <datalist id="${dlId}">${INSPECTORS_LIST.map(n=>`<option value="${escapeHtml(n)}">`).join("")}</datalist>`;
    c[15].innerHTML = selectHTML(["1","2","3","4"], v.shift||"");
    c[16].innerHTML = `<button class="save">💾</button><button class="cancel">❌</button>`;

    enableSimpleMulti(c[10].querySelector("select"));
    enableSimpleMulti(c[11].querySelector("select"));
  }
  function handleSave(row){
    const id=row.dataset.id, idx=findIdx(id); if(idx===-1) return;
    const v=violationsData[idx]; const c=row.querySelectorAll("td");

    v.date            = c[0].querySelector("input")?.value || v.date;
    v.airport         = c[1].querySelector("select")?.value || v.airport;
    v.flight          = c[2].querySelector("input")?.value || v.flight;
    v.direction       = c[3].querySelector("select")?.value || v.direction;
    v.type            = c[4].querySelector("select")?.value || v.type;
    v.time_start      = c[5].querySelector("input")?.value || v.time_start;
    v.time_end        = c[6].querySelector("input")?.value || v.time_end;
    v.sector          = c[7].querySelector("input")?.value || v.sector;        /* textbox */
    v.violation_start = c[8].querySelector("input")?.value || v.violation_start;
    v.violation_end   = c[9].querySelector("input")?.value || v.violation_end;
    v.service         = Array.from(c[10].querySelector("select")?.selectedOptions||[]).map(o=>o.value);
    v.violation       = Array.from(c[11].querySelector("select")?.selectedOptions||[]).map(o=>o.value);
    v.description     = c[12].querySelector("textarea")?.value || v.description;
    v.inspector       = c[14].querySelector("input")?.value || v.inspector;
    v.shift           = c[15].querySelector("select")?.value || v.shift;

    v.isNew=false;
    if(String(v.id).startsWith("tmp-")){
      fetch("/inspector/add_violation/",{method:"POST",headers:{"Content-Type":"application/json","X-CSRFToken":getCookie("csrftoken")},body:JSON.stringify(v)})
        .then(r=>r.json()).then(()=>loadViolations());
    } else { editViolation(v); }
  }

  /* ===== table button handlers ===== */
  tbody.addEventListener("click", e=>{
    const btn=e.target.closest("button"); if(!btn) return;
    const row=btn.closest("tr"); if(!row) return;
    if(btn.classList.contains("approve")) return updateStatus(row.dataset.id,"approved");
    if(btn.classList.contains("reject"))  return updateStatus(row.dataset.id,"rejected");
    if(btn.classList.contains("delete"))  return deleteViolation(row.dataset.id);
    if(btn.classList.contains("edit"))    return startEditing(row);
    if(btn.classList.contains("save"))    return handleSave(row);
    if(btn.classList.contains("cancel"))  return render();
  });
  if(addBtn) addBtn.addEventListener("click", addViolation);

  /* ===== SIDEBAR logic (фикс открытия) ===== */
  const menuToggle=document.getElementById("menuToggle");
  const sidebar=document.getElementById("sidebar");
  const backdrop=document.getElementById("sidebarBackdrop");
  function closeSidebar(){sidebar.classList.remove("open"); backdrop.classList.remove("show");}
  if(menuToggle && sidebar && backdrop){
    menuToggle.addEventListener("click",(e)=>{e.stopPropagation(); sidebar.classList.toggle("open"); backdrop.classList.toggle("show");});
    backdrop.addEventListener("click",closeSidebar);
    document.addEventListener("keydown",(e)=>{if(e.key==="Escape") closeSidebar();});
  }

  /* ===== start ===== */
  loadViolations();
});
