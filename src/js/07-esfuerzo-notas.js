/* ---------- Esfuerzo, cambiar ejercicio y notas (2.2) ----------
   PEM (percepción del esfuerzo, 1–10) por sesión: s.pem. Carga = PEM × minutos (método de Foster).
   RIR (repeticiones en reserva) por serie, opcional: set.rir (0–4; 4 = 4 o más).
   Cambiar un ejercicio solo en la sesión: e.from = {name, xid} (el de la rutina); las series cuentan para el que se hace.
   Nota por ejercicio: e.note. Ajustes: wk.effort = {pem, rir}. */
const EFF = () => ({ pem: true, rir: false, ...(LS.get("wk.effort", {}) || {}) });
const PEM_L = [["Muy fácil", "Podrías hablar sin esfuerzo; casi un calentamiento."], ["Fácil", "Cómodo de principio a fin."], ["Moderado", "Notas el trabajo, pero sobra margen."],
  ["Algo exigente", "Respiración marcada; aún bastante margen."], ["Exigente", "Cuesta, pero lo controlas bien."], ["Bastante duro", "Las últimas series ya pesan."],
  ["Muy duro", "Terminas cansado; poco margen al final."], ["Durísimo", "Muy cerca del límite en varias series."], ["Casi al límite", "No habrías podido hacer mucho más."], ["Máximo", "Todo lo que tenías."]];
const PEM_C = ["#3E9C6B", "#5FA455", "#7BA23A", "#A2A830", "#C9A227", "#D68E27", "#D9792B", "#D3612F", "#CC4F33", "#C8423A"];
const sMin = s => Math.max(1, Math.round((s.end - s.start) / 60000));
const sLoad = s => +s.pem > 0 ? +s.pem * sMin(s) : 0;
const pemChip = s => +s.pem > 0 ? `<span class="pemchip" style="background:${PEM_C[s.pem - 1]}" title="${T(PEM_L[s.pem - 1][0])}">${T("PEM")} ${s.pem}</span>` : "";
function pemPicker(s, attr) {
  const p = +s.pem || 0;
  return `<div class="pemrow${p ? "" : " none"}" role="group" aria-label="${T("Esfuerzo de la sesión (PEM)")}">${PEM_C.map((c, i) => `<button style="background:${c}" class="${p === i + 1 ? "on" : ""}" data-${attr}="${s.id}:${i + 1}" aria-pressed="${p === i + 1}" aria-label="${i + 1} · ${T(PEM_L[i][0])}">${i + 1}</button>`).join("")}</div>
    <div class="pemends"><span>${T("Muy fácil")}</span><span>${T("Máximo")}</span></div>
    <div class="pemsel">${p ? `<b style="color:${PEM_C[p - 1]}">${p} · ${T(PEM_L[p - 1][0])}</b><br><span class="muted">${T(PEM_L[p - 1][1])}</span><br><span class="muted" style="font-size:.8rem">${T("Carga: {m} min × {p} = {c}", { m: sMin(s), p, c: sLoad(s) })}</span>` : `<span class="muted">${T("Opcional. Ayuda a ver si una semana ha sido demasiado dura.")}</span>`}</div>`;
}
function pemBlock(s) {
  if (!EFF().pem) return "";
  return `<div class="pembox"><b>${T("¿Cuánto te ha costado?")}</b><div class="muted" style="font-size:.8rem">${T("Esfuerzo percibido de toda la sesión (PEM).")}</div>${pemPicker(s, "pem")}</div>`;
}
function setPem(id, n) {
  const s = state.sessions.find(x => x.id === id); if (!s) return;
  s.pem = +s.pem === n ? undefined : n; if (!s.pem) delete s.pem; store.saveSession(s);
}
/* RIR: tras marcar una serie (si está activado), en la tarjeta y en la pantalla de descanso */
function rirAsk() {
  const q = state.rirAsk, a = state.active; if (!q || !a) return "";
  const e = a.exercises[q.ei], x = e?.sets[q.si]; if (!x || !x.done || x.rir !== undefined) return "";
  const tm = isTime(e), opts = tm ? [0, 5, 10, 15] : [0, 1, 2, 3, 4], top = opts[opts.length - 1];
  return `<div class="rirbar"><span>${tm ? T("¿Cuánto más habrías aguantado?") : T("¿Cuántas te quedaban?")} <small>${esc(exName(e))} · ${T("serie {n}", { n: q.si + 1 })}</small></span>
    <div class="rirb">${opts.map(n => `<button data-rir="${n}" aria-label="${n === top ? (tm ? T("15 s o más") : T("4 o más")) : tm ? n + " s" : n}">${n === top ? top + "+" : n}${tm ? "<small>s</small>" : ""}</button>`).join("")}<button class="x" data-rir="-1" aria-label="${T("Sin RIR")}">×</button></div></div>`;
}
/* Pregunta sin contestar al acabar el descanso (o al pasar a otra serie o terminar): cuenta como 0, no quedaba nada.
   Con «×» (sin RIR) la pregunta ya se ha cerrado y la serie se queda sin valor. */
function rirAuto(since) {
  const q = state.rirAsk, a = state.active; if (since && q?.t > since) return;   // pregunta de una serie marcada durante este descanso: sigue abierta
  state.rirAsk = null; if (!q || !a) return;
  const x = a.exercises[q.ei]?.sets[q.si]; if (x && x.done && x.rir === undefined) { x.rir = 0; saveActive(); }
}
const rirTxt = (x, e) => x.rir === undefined || x.rir === null ? "" : e && isTime(e) ? `+${x.rir >= 15 ? "15+" : x.rir} s` : x.rir >= 4 ? "4+" : String(x.rir);
/* Último registro de un ejercicio (objeto entero: series, nota…) y última sustitución en la misma rutina */
function lastExFor(e) {
  const k = exKey(e);
  for (const s of sortedSessions()) { const x = s.exercises.find(y => exKey(y) === k); if (x && x.sets.length) return { s, e: x }; }
  return null;
}
function lastSwapFor(e, rid) {
  if (!rid) return null; const k = exKey(e);
  for (const s of sortedSessions()) { if (s.rid !== rid) continue; const x = s.exercises.find(y => y.from && exKey({ name: y.from, xid: y.fromXid, tech: y.fromTech }) === k);
    if (x) return x; if (s.exercises.some(y => exKey(y) === k)) return null; }
  return null;
}
/* Cambiar ejercicio en la sesión */
function swapTo(ei, name, xid, x) {
  const a = state.active, e = a?.exercises[ei]; if (!e) return;
  if (!e.from) e.from = { name: e.name, ...(e.xid ? { xid: e.xid } : {}), ...(techOf(e) ? { tech: techOf(e) } : {}) };
  e.name = name; if (xid) e.xid = xid; else delete e.xid; delete e.tech;
  if (x) { e.type = x.type === "time" ? "time" : "reps"; e.sides = !!x.sides; }
  if (exKey(e) === exKey(e.from)) delete e.from;
  saveActive();
}
function swapUndo(ei) {
  const e = state.active?.exercises[ei]; if (!e?.from) return;
  e.name = e.from.name; if (e.from.xid) e.xid = e.from.xid; else delete e.xid; if (e.from.tech) e.tech = e.from.tech; delete e.from; saveActive();
}
function swapModal() {
  const w = state.swap; if (!w || !state.active) return "";
  const e = state.active.exercises[w.ei]; if (!e) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="swT"><div class="mbox">
    ${mHead("swT", T("Cambiar ejercicio"), "sw-cancel")}
    <p class="muted" style="margin:0;font-size:.85rem">${T("Solo en esta sesión. En lugar de {x}.", { x: `<b style="color:var(--ink)">${esc(exName(e.from || e))}</b>` })}</p>
    <input type="text" id="swName" list="swNames" style="width:100%;margin-top:12px" placeholder="${T("Nombre del ejercicio")}">
    <datalist id="swNames">${allExerciseNames().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
    <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn ghost" data-act="sw-cancel">${T("Cancelar")}</button><button class="btn primary" data-act="sw-ok">${T("Cambiar")}</button></div>
  </div></div>`;
}
/* Al terminar: cambios que pueden pasar a la rutina */
function swapAskBlock(s) {
  const r = s.rid && state.routines.find(x => x.id === s.rid), sw = s.exercises.filter(e => e.from); if (!r || !sw.length) return "";
  const done = state.swapDone === s.id;
  return `<div class="pembox" style="text-align:left"><b>${sw.length === 1 ? T("Cambiaste 1 ejercicio") : T("Cambiaste {n} ejercicios", { n: sw.length })}</b>
    <div class="muted" style="font-size:.85rem;margin:2px 0 8px">${sw.map(e => T("{x} en lugar de {y}.", { x: esc(exName(e)), y: esc(e.from) })).join(" ")}</div>
    ${done ? `<div style="color:var(--ok);font-weight:600">✓ ${T("Cambiado también en la rutina")}</div>` : `<div class="row"><button class="btn small primary" data-act="sw-routine">${T("Cambiar también en la rutina")}</button><span class="muted" style="font-size:.8rem">${T("Si no, solo hoy.")}</span></div>`}</div>`;
}
function swapToRoutine(s) {
  const r = state.routines.find(x => x.id === s.rid); if (!r) return;
  s.exercises.filter(e => e.from).forEach(e => {
    const k = exKey({ name: e.from, xid: e.fromXid, tech: e.fromTech }), re = r.exercises.find(y => exKey(y) === k); if (!re) return;
    re.name = e.name; if (e.xid) re.xid = e.xid; else delete re.xid; delete re.tech; re.type = e.type; re.sides = !!e.sides;
  });
  store.saveRoutines(state.routines);
}
/* Stats → Entreno: carga semanal */
function sbCarga(S, now) {
  const ws = Array.from({ length: 8 }, (_, i) => addDays(weekStart(now), -7 * (7 - i)));
  const load = ws.map(t => S.filter(s => s.start >= t && s.start < addDays(t, 7)).reduce((a, s) => a + sLoad(s), 0));
  if (!load.some(Boolean)) return `<div class="panel muted">${EFF().pem ? T("Aún no hay sesiones con esfuerzo (PEM). Se pregunta al terminar cada sesión.") : T("Activa «Preguntar el esfuerzo al terminar» en Ajustes → Entreno.")}</div>`;
  const mx = Math.max(...load), cur = load[7], lw = load[6], prev4 = load.slice(2, 6).filter(Boolean), avg = prev4.length >= 2 ? prev4.reduce((a, b) => a + b, 0) / prev4.length : 0;
  const hiW = avg && lw > avg * 1.3 ? 6 : avg && cur > avg * 1.3 ? 7 : -1;
  const recent = S.filter(s => +s.pem > 0 && s.start >= now - 28 * 864e5), pm = recent.length ? recent.reduce((a, s) => a + +s.pem, 0) / recent.length : 0;
  const nd = noteDays(), wn = ws.map(t => Array.from({ length: 7 }, (_, d) => dayKey(addDays(t, d))).filter(k => nd.has(k)));
  return `<div class="panel"><p class="muted" style="font-size:.8rem;margin:0">${T("PEM × minutos de cada sesión, sumado por semana.")}</p>
    <div class="ldch">${load.map((v, i) => `<div>${wn[i].length ? `<button class="ldn" data-dnote="${wn[i].join(",")}" aria-label="${T("Ver notas")}"></button>` : ""}<b>${v || ""}</b><i class="${i === hiW ? "hi" : ""}${i === 7 ? " cur" : ""}" style="height:${mx ? Math.max(v ? 4 : 0, v / mx * 100) : 0}%"></i><small>${new Date(ws[i]).toLocaleDateString(LOC(), { day: "numeric", month: "short" })}</small></div>`).join("")}</div>
    ${hiW >= 0 ? `<div class="aiwarn" style="margin:10px 0 0"><b>${T("Semana del {d}: +{p} %", { d: new Date(ws[hiW]).toLocaleDateString(LOC(), { day: "numeric", month: "long" }), p: Math.round((load[hiW] / avg - 1) * 100) })}</b>${T("sobre la media de las 4 anteriores. Si no fue a propósito, vigila el descanso.")}</div>` : ""}
    ${pm ? `<div class="row" style="justify-content:space-between;font-size:.85rem;margin-top:10px"><span class="muted">${T("PEM media · 4 semanas")}</span><b>${fmtNum(pm)}</b></div>` : ""}</div>`;
}

