/* ---------- Esfuerzo, cambiar ejercicio y notas (2.2) ----------
   PEM (percepción del esfuerzo, 1–10) por sesión: s.pem. Carga = PEM × minutos (método de Foster).
   Lo que faltó por serie (3.5.2), opcional: set.miss = repeticiones (o segundos) que faltaron para completarla; se restan de lo hecho
   (set.r, y set.r2 si va por lados), así la progresión y el resumen cuentan lo hecho de verdad. Sin contestar = 0 (completa).
   Antes de la 3.5.2: set.rir = repeticiones en reserva (0–4); se conserva en el historial.
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
  const e = a.exercises[q.ei], x = e?.sets[q.si]; if (!x || !x.done || x.miss !== undefined) return "";
  const tm = isTime(e), max = Math.min(+x.r || 0, sideReps(e) ? +R2(x) || 0 : Infinity), opts = (tm ? [0, 5, 10, 15, 20, 30] : [0, 1, 2, 3, 4, 5]).filter(n => n < max || n === 0);
  return `<div class="rirbar"><span>${tm ? T("¿Cuántos segundos te faltaron?") : T("¿Cuántas te faltaron?")} <small>${esc(exName(e))} · ${T("serie {n}", { n: q.si + 1 })}</small></span>
    <div class="rirb">${opts.map(n => `<button data-rir="${n}" aria-label="${n === 0 ? T("Ninguna: serie completa") : tm ? n + " s" : n}">${n}</button>`).join("")}<button class="x" data-rir="-1" aria-label="${T("No contestar")}">×</button></div></div>`;
}
/* Lo que faltó se resta de lo hecho (y se devuelve si se desmarca la serie) */
function setMiss(e, x, n) {
  if (x.miss) { x.r = (+x.r || 0) + x.miss; if (x.r2 !== undefined) x.r2 = (+x.r2 || 0) + x.miss; }
  x.miss = Math.max(0, Math.min(n, +x.r || 0)); if (!x.miss) return;
  x.r = Math.max(0, (+x.r || 0) - x.miss); if (sideReps(e)) x.r2 = Math.max(0, (+R2(x) || 0) - x.miss);
}
/* Pregunta sin contestar al acabar el descanso (o al pasar a otra serie o terminar): cuenta como 0, no quedaba nada.
   Con «×» (sin RIR) la pregunta ya se ha cerrado y la serie se queda sin valor. */
function rirAuto(since) {
  const q = state.rirAsk, a = state.active; if (since && q?.t > since) return;   // pregunta de una serie marcada durante este descanso: sigue abierta
  state.rirAsk = null; if (!q || !a) return;
  const x = a.exercises[q.ei]?.sets[q.si]; if (x && x.done && x.miss === undefined) { x.miss = 0; saveActive(); }
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

/* Stats → Entreno: esfuerzo (3.10.0). PEM de cada sesión (12 semanas) con su media de 4, y por ejercicio cuántas series
   salieron completas y cuánto faltó de media (set.miss; antes de la 3.5.2 no se apuntaba), comparando las 6 últimas
   semanas con las 6 anteriores para ver si cada vez falta menos. */
function sbEsfuerzo(S, now) {
  const from = now - 84 * 864e5, mid = now - 42 * 864e5, P = S.filter(s => s.start >= from && +s.pem > 0).sort((a, b) => a.start - b.start);
  let chart = "";
  if (P.length >= 2) {
    const WD = 640, H = 190, pl = 30, pr = 12, pt = 12, pb = 26, X = t => pl + (t - from) / (now - from) * (WD - pl - pr), Y = v => pt + (1 - (v - 1) / 9) * (H - pt - pb);
    const avg = P.map((s, i) => { const w = P.slice(Math.max(0, i - 3), i + 1); return w.reduce((a, x) => a + +x.pem, 0) / w.length; });
    let sv = `<svg viewBox="0 0 ${WD} ${H}" role="img" aria-label="${T("Esfuerzo de cada sesión")}">`;
    [1, 4, 7, 10].forEach(v => { sv += `<line x1="${pl}" x2="${WD - pr}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line)"/><text x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${v}</text>`; });
    sv += `<polyline fill="none" stroke-width="2.5" stroke-linejoin="round" style="stroke:var(--accent)" points="${P.map((s, i) => `${X(s.start)},${Y(avg[i])}`).join(" ")}"/>`;
    P.forEach(s => { sv += `<circle cx="${X(s.start)}" cy="${Y(+s.pem)}" r="4.5" fill="${PEM_C[s.pem - 1]}" style="stroke:var(--surface)" stroke-width="1.5"><title>${new Date(s.start).toLocaleDateString(LOC())} · ${esc(s.routine || T("Sesión libre"))} · ${T("PEM")} ${s.pem}</title></circle>`; });
    [from, mid, now].forEach((t, i) => { const d = new Date(t); sv += `<text x="${X(t)}" y="${H - 6}" text-anchor="${["start", "middle", "end"][i]}" font-size="11" style="fill:var(--muted)">${d.getDate()} ${MESES[d.getMonth()]}</text>`; });
    chart = `<div class="chart" style="margin-top:8px">${sv}</svg></div><div class="legend"><span><i style="background:${PEM_C[5]};border-radius:50%"></i>${T("Cada sesión (color según PEM)")}</span><span><i style="background:var(--accent)"></i>${T("Media de 4")}</span></div>`;
  }
  const pm = a => a.length ? a.reduce((x, s) => x + +s.pem, 0) / a.length : 0, p1 = pm(P.filter(s => s.start < mid)), p2 = pm(P.filter(s => s.start >= mid));
  const kp = P.length ? `<div class="kpr"><div><b>${fmtNum(p2 || p1)}</b><span>${T("PEM media · 6 semanas")}</span></div><div><b>${p1 && p2 ? `${p2 > p1 ? "+" : p2 < p1 ? "−" : ""}${fmtNum(Math.abs(p2 - p1))}` : "—"}</b><span>${T("frente a las 6 anteriores")}</span></div><div><b>${P.length}</b><span>${T("sesiones con PEM")}</span></div></div>` : "";
  // Por ejercicio: series hechas con lo que faltó apuntado (sin contestar = completa)
  const M = new Map();
  S.filter(s => s.start >= from).forEach(s => s.exercises.forEach(e => e.sets.forEach(x => {
    if (!x.done) return;
    const k = exKey(e), o = M.get(k) || { e, a: [0, 0, 0], b: [0, 0, 0] }, h = s.start >= mid ? o.b : o.a, m = +x.miss || 0;
    h[0]++; if (!m) h[1]++; h[2] += m; M.set(k, o);
  })));
  const rows = [...M.values()].filter(o => o.a[0] + o.b[0] >= 3 && (o.a[2] + o.b[2] > 0 || o.a[0] + o.b[0] >= 6)).sort((x, y) => (y.a[2] + y.b[2]) - (x.a[2] + x.b[2]) || (y.a[0] + y.b[0]) - (x.a[0] + x.b[0])).slice(0, 6);
  const pc = h => h[0] ? Math.round(h[1] / h[0] * 100) : null, un = e => isTime(e) ? " s" : "";
  const list = rows.length ? `<h3 class="wh" style="margin:16px 0 6px">${T("Lo que faltó, por ejercicio")}</h3>${rows.map(o => {
    const t = [o.a[0] + o.b[0], o.a[1] + o.b[1], o.a[2] + o.b[2]], c = pc(t), ca = pc(o.a), cb = pc(o.b), fails = t[0] - t[1];
    const tr = ca !== null && cb !== null && o.a[0] >= 2 && o.b[0] >= 2 ? (cb > ca ? `<span class="eftr" style="color:var(--ok)">↑ ${cb - ca} %</span>` : cb < ca ? `<span class="eftr" style="color:#C9A227">↓ ${ca - cb} %</span>` : `<span class="eftr muted">=</span>`) : "";
    return `<div class="efrow"><div class="row" style="justify-content:space-between;gap:8px"><span style="flex:1;min-width:0">${xLink(o.e, esc(exLabel(o.e)))}</span>${tr}<b style="white-space:nowrap">${c} %</b></div>
      <div class="efbar"><i style="width:${c}%"></i></div>
      <small class="muted">${TN(t[0], "{n} serie", "{n} series")} · ${fails ? T("faltaron {m}{u} de media cuando no salió", { m: (v => v % 1 ? fmtNum(v) : String(v))(Math.round(t[2] / fails * 10) / 10), u: un(o.e) }) : T("todas completas")}</small></div>`; }).join("")}
    <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("% de series completas en 12 semanas. La flecha compara las 6 últimas con las 6 anteriores.")}</p>` : "";
  if (!P.length && !rows.length) return `<div class="panel muted">${T("Aún no hay esfuerzo apuntado. Activa en Ajustes → Entreno preguntar el esfuerzo al terminar y «¿Cuántas te faltaron?».")}</div>`;
  return `<div class="panel">${kp}${chart}${list}</div>`;
}
