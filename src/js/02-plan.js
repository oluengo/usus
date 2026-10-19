/* ---------- Plan de progresión (rotación de variantes + descarga) ---------- */
const VCOL = ["#D99A52", "#93AF62", "#7FA7C9", "#C98FB8", "#D4C25E", "#8FC4B7", "#E08A70", "#B5A48C"];
const DAY_RX = [[1, /lunes|dilluns|monday|\bmon\b/i], [2, /martes|dimarts|tuesday|\btue\b/i], [3, /mi[eé]rcoles|dimecres|wednesday|\bwed\b/i],
  [4, /jueves|dijous|thursday|\bthu\b/i], [5, /viernes|divendres|friday|\bfri\b/i], [6, /s[aá]bado|dissabte|saturday|\bsat\b/i], [0, /domingo|diumenge|sunday|\bsun\b/i]];
const guessDays = name => DAY_RX.filter(([, rx]) => rx.test(name || "")).map(([d]) => d);
const guessVariant = name => { const m = /^\s*([A-Z0-9]{1,3})\s*[·:\-–|]/.exec(name || ""); return m ? m[1] : ""; };
const normVar = v => String(v || "").trim().toUpperCase().slice(0, 6);
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];           // lunes primero
const dayShort = d => T("L,M,X,J,V,S,D").split(",")[WEEK_ORDER.indexOf(d)];
const PL = { get: () => LS.get("wk.plan", null), save: p => LS.set("wk.plan", p) };
/* Varios planes: uno activo (wk.plan, el que usa Hoy) y los guardados (wk.plans) para activar, duplicar o borrar */
const PLS = { list: () => (LS.get("wk.plans", []) || []).filter(p => p && Array.isArray(p.phases)), save: l => LS.set("wk.plans", l) };
const planName = p => (p?.name || "").trim() || T("Plan");
const planSpan = p => { const ws = planWeeks(p); if (!ws.length) return ""; const a = ws[0].t, z = addDays(ws[ws.length - 1].t, 6), y = new Date(a).getFullYear() !== new Date(z).getFullYear();
  const f = t => new Date(t).toLocaleDateString(LOC(), { day: "numeric", month: "short", ...(y ? { year: "numeric" } : {}) }); return `${f(a)} → ${f(z)} · ${planVariants(p).join(" ")}`; };
function plansBlock() {
  const a = PL.get(), l = PLS.list();
  if (!a && !l.length) return "";
  return `<details class="panel" style="margin-top:12px"${state.plansOpen ? " open" : ""} data-plans><summary style="cursor:pointer;font-weight:600">${T("Mis planes")} · ${(a ? 1 : 0) + l.length}</summary>
    ${a ? `<div class="plr"><div style="flex:1;min-width:0"><b>${esc(planName(a))}</b> <span class="tagb">${T("Activo")}</span><div class="muted" style="font-size:.8rem">${planSpan(a)}</div></div></div>` : ""}
    ${l.map(p => `<div class="plr"><div style="flex:1;min-width:0"><b>${esc(planName(p))}</b><div class="muted" style="font-size:.8rem">${planSpan(p)}</div></div>
      <button class="btn small" data-pact="${p.id}">${T("Activar")}</button><button class="x" data-pdel="${p.id}" aria-label="${T("Eliminar")} ${esc(planName(p))}">×</button></div>`).join("")}
    <div class="row" style="margin-top:10px;flex-wrap:wrap">${a ? `<button class="btn small" data-act="plan-dup">${T("Duplicar el activo")}</button>` : ""}<button class="btn small" data-act="plan-new">${T("Nuevo plan")}</button></div>
    <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Solo el plan activo cuenta en Hoy. Al cambiar de plan, tus rutinas, sesiones e historial no se tocan.")}</p></details>`;
}
function planVariants(p) { return [...new Set((p?.phases || []).map(x => normVar(x.variant)).filter(Boolean))]; }
function varColor(v, p = PL.get()) {
  const all = [...new Set([...planVariants(p), ...state.routines.map(r => normVar(r.variant)).filter(Boolean)].sort())];
  return VCOL[Math.max(0, all.indexOf(normVar(v))) % VCOL.length];
}
const vChip = v => v ? `<span class="vchip" style="background:${varColor(v)}">${esc(v)}</span>` : "";
/* Semanas del plan: fases en orden (cada una N semanas), y tras cada X semanas de entreno, Y de descarga.
   "↑" marca la primera semana de una variante que ya había aparecido antes. */
function planWeeks(p) {
  const ph = (p?.phases || []).filter(x => normVar(x.variant) && +x.weeks > 0);
  if (!p?.start || !ph.length) return [];
  const st = weekStart(keyTime(p.start)), end = p.review ? keyTime(p.review) : addDays(st, 7 * 52);
  const every = Math.max(0, +p.deload?.every || 0), dl = Math.max(0, +p.deload?.weeks || 0);
  const out = [], seen = new Set(); let pi = 0, pw = 0, trained = 0, dLeft = 0;
  for (let t = st; t < end && out.length < 104; t = addDays(t, 7)) {
    if (dLeft > 0) { out.push({ t, n: out.length + 1, deload: true }); dLeft--; continue; }
    const v = normVar(ph[pi].variant), up = !!p.up && pw === 0 && seen.has(v);
    if (pw === 0) seen.add(v);
    out.push({ t, n: out.length + 1, variant: v, up });
    if (++pw >= +ph[pi].weeks) { pi = (pi + 1) % ph.length; pw = 0; }
    if (every && dl && ++trained % every === 0) dLeft = dl;
  }
  return out;
}
function planNow(p = PL.get(), now = Date.now()) {
  if (!p || p.enabled === false) return null;
  const ws = planWeeks(p); if (!ws.length) return null;
  if (now < ws[0].t) return { status: "pre", ws };
  const i = ws.findIndex(w => now >= w.t && now < addDays(w.t, 7));
  return i < 0 ? { status: "done", ws } : { status: "on", ws, i, w: ws[i] };
}
const weekLabel = w => w.deload ? T("Descarga") : T("Variante {v}", { v: w.variant });
/* Rutinas que el plan sugiere un día: las de ese día con la variante de la semana o sin variante (en descarga, solo sin variante) */
function suggestedFor(w, day) {
  return state.routines.filter(r => (r.days || []).includes(day) && (w.deload ? !normVar(r.variant) : (!normVar(r.variant) || normVar(r.variant) === w.variant)))
    .sort((a, b) => (normVar(a.variant) ? 1 : 0) - (normVar(b.variant) ? 1 : 0));
}
function plannedDays(w) {
  if (w.deload) return 0;
  return new Set(state.routines.filter(r => normVar(r.variant) === w.variant).flatMap(r => r.days || [])).size;
}
function doneDays(w) {
  const end = addDays(w.t, 7);
  return new Set(state.sessions.filter(s => s.start >= w.t && s.start < end && isStrength(s)).map(s => dayKey(s.start))).size;
}
/* Rutinas de la variante de la semana que aún no se han hecho (el domingo, lo que falte pasa a saltado) */
function pendingWeek(w) {
  if (!w || w.deload) return null;
  const end = addDays(w.t, 7), rs = state.routines.filter(r => normVar(r.variant) === w.variant && (r.days || []).length);
  if (!rs.length) return null;
  const done = new Set(state.sessions.filter(x => x.start >= w.t && x.start < end).map(x => x.routine));
  return { total: rs.length, pend: rs.filter(r => !done.has(r.name)) };
}
function pendingBlock(w) {
  const pw = pendingWeek(w); if (!pw) return "";
  if (!pw.pend.length) return `<div class="pend"><span style="color:var(--ok)">✓</span> ${T("Semana de fuerza completa")} (${pw.total}/${pw.total})</div>`;
  const sun = new Date().getDay() === 0;
  return `<div class="pend"><b>${T("Pendientes esta semana")}</b> <span class="muted">(${pw.total - pw.pend.length}/${pw.total})</span>
    ${sun ? `<p class="muted" style="font-size:.8rem;margin:2px 0 0">${T("Hoy es el último día: lo que falte contará como saltado.")}</p>` : ""}
    ${pw.pend.map(r => `<div class="sugr">${vChip(normVar(r.variant))}<span class="sn">${esc(r.name)}</span><button class="btn small" data-start="${r.id}">${T("Empezar")}</button></div>`).join("")}</div>`;
}
/* Tarjeta "Toca hoy": con plan, según la semana; sin plan, rutinas con hoy en sus días */
function todayCard() {
  const today = new Date().getDay(), todayK = dayKey(Date.now()), pn = planNow();
  let first = true;
  const row = r => { const done = state.sessions.some(s => dayKey(s.start) === todayK && s.routine === r.name), pri = !done && first; if (pri) first = false;
    return `<div class="sugr${pri ? " pri" : ""}">${vChip(normVar(r.variant))}<span class="sn">${esc(r.name)}${done ? ` <span style="color:var(--ok)">✓</span>` : ""}<small>${T("{e} ejercicios · ≈ {m} min", { e: r.exercises.length, m: routineMins(normRoutine(JSON.parse(JSON.stringify(r)))) })}</small></span><button class="btn ${pri ? "primary" : ""} small" data-start="${r.id}">${done ? T("Repetir") : T("Empezar")}</button></div>`; };
  const list = rs => rs.length ? rs.map(row).join("") : `<p class="muted" style="margin:6px 0 0">${T("Hoy no hay ninguna rutina prevista.")}</p>`;
  if (pn?.status === "on") {
    const w = pn.w, next = pn.ws.slice(pn.i + 1).find(x => weekLabel(x) !== weekLabel(w));
    const L = list(suggestedFor(w, today));
    return `<div class="panel plan-b today" style="border-color:${w.deload ? "var(--line)" : varColor(w.variant)}">
      <div class="row" style="gap:8px">${w.deload ? `<span class="vchip vd">${T("Desc.")}</span>` : vChip(w.variant)}<b style="flex:1">${T("Semana {n} de {m}", { n: w.n, m: pn.ws.length })} · ${weekLabel(w)}</b><button class="btn ghost small" data-act="plan-open">${T("Ver plan")}</button></div>
      ${w.up ? `<p class="muted" style="margin:6px 0 0">↑ ${upRuleOf(PL.get()) === "mark" ? T("Variante repetida: sube 1-2 reps o 1 serie si hay margen.") : T("Variante repetida: subida automática según tu plan.")}</p>` : ""}
      ${w.deload ? `<p class="muted" style="margin:6px 0 0">${T("Semana de descarga: solo rutinas sin variante (p. ej. Diaria).")}</p>` : ""}
      <div class="muted" style="font-size:.85rem;margin-top:10px">${T("Toca hoy:")}</div>${L}${pendingBlock(w)}
      ${next ? `<p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Siguiente: {x} desde el {d}", { x: weekLabel(next), d: new Date(next.t).toLocaleDateString(LOC(), { day: "numeric", month: "short" }) })}</p>` : ""}
    </div>`;
  }
  const rs = state.routines.filter(r => (r.days || []).includes(today));
  const msg = pn?.status === "pre" ? T("El plan empieza el {d}.", { d: new Date(pn.ws[0].t).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" }) })
    : pn?.status === "done" ? T("Plan terminado") + ". " + T("Toca revisar el progreso y decidir el siguiente plan.") : "";
  return `<div class="panel plan-b today"><b>${T("Toca hoy")}</b>${msg ? `<p class="muted" style="margin:4px 0 0">${msg}</p>` : ""}${list(rs)}
    ${rs.length ? "" : `<p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Marca los días de cada rutina al editarla.")}</p>`}</div>`;
}
/* Bloque del plan en Hoy: calendario, rutinas por variante y Editar */
function planSection() {
  const p = PL.get();
  if (!p) return `<div class="panel"><b>${T("Sin plan de progresión")}</b>
    <p class="muted" style="margin:4px 0 0">${T("Un plan rota variantes de tus rutinas por semanas (por ejemplo A, B, C cada 2 semanas) con semanas de descarga, y Hoy te dice qué rutina toca cada día.")}</p>
    <p class="muted" style="font-size:.85rem;margin:6px 0 0">${T("Para que funcione, pon a cada rutina su variante y sus días al editarla.")}</p>
    <button class="btn primary" style="margin-top:12px" data-act="plan-create">${T("Crear plan")}</button></div>${plansBlock()}`;
  const ws = planWeeks(p), pn = planNow(p), now = Date.now(), vs = planVariants(p);
  const fmt = t => new Date(t).toLocaleDateString(LOC(), { day: "numeric", month: "short" });
  return `<div class="row" id="planSec"><h2 style="margin:0;flex:1">${p.name ? esc(p.name) : T("Plan")}</h2><button class="btn small" data-act="plan-edit">${T("Editar plan")}</button></div>
    ${p.enabled === false ? `<p class="muted">${T("Plan desactivado: Hoy no lo tiene en cuenta.")}</p>` : ""}
    ${ws.length ? `<p class="sub">${fmt(ws[0].t)} → ${fmt(addDays(ws[ws.length - 1].t, 6))}${p.review ? ` · ${T("revisión desde el {d}", { d: fmt(keyTime(p.review)) })}` : ""}</p>
    <div class="legend" style="margin-top:6px">${vs.map(v => `<span>${vChip(v)}</span>`).join("")}<span><span class="vchip vd">${T("Descarga")}</span></span><span>${T("↑ = subir reps · barra = días de fuerza hechos")}</span></div>
    <div class="pgrid">${ws.map((w, i) => { const pd = plannedDays(w), dd = doneDays(w), cur = pn?.status === "on" && pn.i === i, past = addDays(w.t, 7) <= now;
      return `<button class="pwk${past ? " past" : ""}${cur ? " now" : ""}${w.deload ? " dl" : ""}" style="${w.deload ? "" : `background:${varColor(w.variant, p)}`}" data-day="${dayKey(Math.min(w.t, now))}" aria-label="${T("Semana {n} de {m}", { n: w.n, m: ws.length })} · ${weekLabel(w)}">
        <b>S${w.n} · ${w.deload ? T("Desc.") : esc(w.variant)}</b><span>${fmt(w.t)}</span>${w.up ? `<i class="up">↑</i>` : ""}
        ${pd ? `<span class="pbar2"><i style="width:${Math.min(100, dd / pd * 100)}%"></i></span>` : ""}</button>`; }).join("")}</div>
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Toca una semana para ver sus días en el Diario.")}</p>`
    : `<div class="empty" style="margin-top:14px">${T("El plan no tiene fases válidas. Edítalo para añadirlas.")}</div>`}
    <details class="panel" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">${T("Rutinas por variante")}</summary>
    ${[...vs, ""].map(v => { const rs = state.routines.filter(r => normVar(r.variant) === v);
      return rs.length ? `<div class="pvr"><span style="width:48px">${v ? vChip(v) : `<span class="muted" style="font-size:.78rem">${T("Sin")}</span>`}</span><span style="flex:1;min-width:0">${rs.map(r => `${esc(r.name)} <span class="muted" style="font-size:.78rem">${(r.days || []).length === 7 ? T("todos los días") : WEEK_ORDER.filter(d => (r.days || []).includes(d)).map(dayShort).join(" ")}</span>`).join("<br>")}</span></div>` : ""; }).join("")}
    ${state.routines.some(r => !(r.days || []).length) ? `<p class="muted" style="font-size:.8rem;margin:8px 0 0">${T("Las rutinas sin días no se sugieren. Ponles días al editarlas.")}</p>` : ""}</details>${plansBlock()}`;
}
function newPlanDraft() {
  const vs = [...new Set(state.routines.map(r => normVar(r.variant)).filter(Boolean))].sort();
  return { enabled: true, start: dayKey(weekStart(Date.now())), review: "", phases: (vs.length ? vs : ["A", "B"]).map(v => ({ id: uid(), variant: v, weeks: 2 })), deload: { weeks: 1, every: 8 }, up: true };
}
function viewPlanEdit() {
  const d = state.planDraft, ws = planWeeks(d);
  return `<h1>${state.planNew ? T("Nuevo plan") : T("Editar plan")}</h1>
    <div class="panel" style="margin-top:14px">
      <label class="muted" for="pName" style="font-size:.85rem">${T("Nombre")}</label><input type="text" id="pName" maxlength="40" value="${esc(d.name || "")}" placeholder="${T("Ej. Bloque fuerza otoño")}" style="margin:4px 0 12px">
      <label class="xtog swrow"><span>${T("Plan activo (se muestra en Hoy)")}</span><input type="checkbox" role="switch" id="pOn" ${d.enabled !== false ? "checked" : ""}></label>
      <div class="wrow2" style="margin-top:12px"><label class="muted" for="pStart">${T("Inicio")}</label><input type="date" id="pStart" value="${esc(d.start || "")}">
        <label class="muted" for="pReview">${T("Revisión (opcional)")}</label><input type="date" id="pReview" value="${esc(d.review || "")}"></div>
      <p class="muted" style="font-size:.78rem;margin:6px 0 0">${T("El plan empieza el lunes de la semana de inicio. Sin revisión, dura un año.")}</p>
      <h2 style="margin:18px 0 4px;font-size:1rem">${T("Fases (se repiten en orden)")}</h2>
      ${d.phases.map((x, i) => `<div class="phr">
        <span class="muted" style="font-size:.8rem">${i + 1}</span>
        <label class="fld"><span>${T("Variante")}</span><input type="text" value="${esc(x.variant)}" data-pv="${i}" maxlength="6" placeholder="A" style="text-transform:uppercase"></label>
        <label class="fld"><span>${T("Semanas")}</span><input type="number" min="1" max="12" value="${esc(x.weeks)}" data-pw="${i}" inputmode="numeric"></label>
        <span class="phbtn"><button class="mv" data-pmv="${i}:-1" aria-label="${T("Subir")}" ${i === 0 ? "disabled" : ""}>↑</button><button class="mv" data-pmv="${i}:1" aria-label="${T("Bajar")}" ${i === d.phases.length - 1 ? "disabled" : ""}>↓</button><button class="x" data-prm="${i}" aria-label="${T("Quitar fase")}">×</button></span>
      </div>`).join("")}
      <button class="btn small" style="margin-top:10px" data-act="plan-addph">${T("Añadir fase")}</button>
      <h2 style="margin:18px 0 4px;font-size:1rem">${T("Descarga")}</h2>
      <div class="wrow2"><label class="muted" for="pDlW">${T("Semanas de descarga")}</label><input type="number" id="pDlW" min="0" max="4" value="${+d.deload?.weeks || 0}" inputmode="numeric">
        <label class="muted" for="pDlE">${T("Cada (semanas de entreno)")}</label><input type="number" id="pDlE" min="0" max="26" value="${+d.deload?.every || 0}" inputmode="numeric"></div>
      <p class="muted" style="font-size:.78rem;margin:6px 0 0">${T("0 = sin descarga. En descarga solo se sugieren rutinas sin variante.")}</p>
      <label class="xtog swrow" style="margin-top:14px"><span>${T("Marcar ↑ cuando se repite una variante (recordatorio para progresar)")}</span><input type="checkbox" role="switch" id="pUp" ${d.up ? "checked" : ""}></label>
      ${d.up ? `<label class="muted" for="pUpRule" style="font-size:.85rem;display:block;margin-top:10px">${T("En la semana ↑")}</label>
      <select id="pUpRule">${UP_RULES.map(([k, n]) => `<option value="${k}" ${upRuleOf(d) === k ? "selected" : ""}>${T(n)}</option>`).join("")}</select>
      <p class="muted" style="font-size:.78rem;margin:6px 0 0">${upRuleOf(d) === "mark" ? T("Solo se marca la semana; tú decides qué subir.") : upRuleOf(d) === "step" ? T("Se aplica sola al empezar la semana a las rutinas de esa variante, con aviso en Hoy y opción de deshacer. Pasa al siguiente paso del catálogo solo si la última vez llegaste al objetivo.") : T("Se aplica sola al empezar la semana a las rutinas de esa variante, con aviso en Hoy y opción de deshacer.")}</p>` : ""}
      <p class="muted" style="font-size:.85rem;margin:14px 0 0">${ws.length ? T("Vista previa: {n} semanas, {d} de descarga.", { n: ws.length, d: ws.filter(w => w.deload).length }) : T("Añade al menos una fase con variante y semanas.")}</p>
      ${ws.length ? `<div class="pprev">${ws.map(w => `<i style="background:${w.deload ? "var(--line)" : varColor(w.variant, d)}" title="S${w.n} · ${weekLabel(w)}">${w.deload ? "·" : esc(w.variant)}</i>`).join("")}</div>` : ""}
    </div>
    <div class="row" style="margin-top:16px">
      ${PL.get() && !state.planNew ? `<button class="btn danger" data-act="plan-del">${T("Eliminar plan")}</button>` : ""}
      <span class="spacer"></span>
      <button class="btn ghost" data-act="plan-cancel">${T("Cancelar")}</button>
      <button class="btn primary" data-act="plan-save">${T("Guardar plan")}</button>
    </div>`;
}
function readPlan() {
  const d = state.planDraft; if (state.planMode !== "edit" || !d) return;
  const v = id => document.getElementById(id);
  if (v("pName")) d.name = v("pName").value.trim();
  if (v("pOn")) d.enabled = v("pOn").checked;
  if (v("pStart")) d.start = v("pStart").value; if (v("pReview")) d.review = v("pReview").value;
  if (v("pUp")) d.up = v("pUp").checked; if (v("pUpRule")) d.upRule = v("pUpRule").value;
  d.deload = { weeks: Math.max(0, Math.round(+v("pDlW")?.value || 0)), every: Math.max(0, Math.round(+v("pDlE")?.value || 0)) };
  d.phases.forEach((x, i) => { const a = document.querySelector(`[data-pv="${i}"]`), b = document.querySelector(`[data-pw="${i}"]`); if (a) x.variant = normVar(a.value); if (b) x.weeks = Math.max(1, Math.min(12, Math.round(+b.value || 1))); });
}
function weekStart(ts) { const d = new Date(ts); d.setHours(0,0,0,0); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return d.getTime(); }

