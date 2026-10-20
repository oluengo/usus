/* ---------- Vista: Entrenar ---------- */
/* ---------- Peso semanal ---------- */
const W = {
  list: () => LS.get("wk.weights", []),
  save: l => LS.set("wk.weights", l.sort((a, b) => a.t - b.t)),
  goal: () => LS.get("wk.weightGoal", null),
  day: () => LS.get("wk.weighDay", 5)   // 5 = viernes
};
const fmtW = v => `${(Math.round(v * 10) / 10).toLocaleString(LOC(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
const parseKg = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n >= 20 && n <= 300 ? Math.round(n * 10) / 10 : null; };
function addWeight(t, kg) {
  const d = dayStart(t), l = W.list().filter(x => dayStart(x.t) !== d);
  l.push({ id: uid(), t: d + 12 * 3600e3, kg }); W.save(l);
}
/* Fila de «Pendiente» en Hoy: punto de color, título, detalle y acciones */
const prow = (col, t, d, acts) => `<div class="prow"><span class="dot" style="background:${col}"></span><div class="t"><b>${t}</b><small>${d}</small></div><div class="pa">${acts}</div></div>`;
/* Aviso: desde el día de pesaje hasta el domingo, si no hay registro esa semana */
function weightBanner() {
  const now = Date.now(), wd = W.day(), today = new Date(now).getDay();
  const wk = weekStart(now), dueIdx = (wd + 6) % 7, todayIdx = (today + 6) % 7;
  if (LS.get("wk.weighOn", true) === false) return "";
  if (!state.sessions.length && !W.list().length && LS.get("wk.weighOn", null) === null) return "";   // usuario nuevo: sin avisos hasta que empiece o lo active
  if (todayIdx < dueIdx || LS.get("wk.weightSkip", 0) === wk) return "";
  if (W.list().some(x => x.t >= addDays(wk, dueIdx))) return "";
  const last = W.list().slice(-1)[0];
  return prow("var(--accent)", T("Peso semanal"), `${today === wd ? T("Hoy toca pesarte") : T("Pendiente desde el {d}", { d: DIAS[wd] })}${last ? ` · ${T("último")}: ${fmtW(last.kg)}` : ""}`,
    `<button class="btn small" data-act="w-open">${T("Anotar")}</button><button class="btn ghost small" data-act="w-skip">${T("Esta semana no")}</button>`);
}

/* Recordatorio de copia de seguridad: cada 30 días, aplazable 3 días */
const BACKUP_DAYS = 30, SNOOZE_DAYS = 3;
function backupBanner() {
  if (!state.sessions.length) return "";
  const now = Date.now(), last = LS.get("wk.lastBackup", 0), snooze = LS.get("wk.backupSnooze", 0);
  if (now - last < BACKUP_DAYS * 864e5 || now < snooze) return "";
  const days = last ? Math.floor((now - last) / 864e5) : 0;
  return prow("var(--warn)", T("Copia de seguridad"), `${last ? T("Han pasado {n} días desde tu última copia.", { n: days }) : T("Aún no has hecho ninguna copia.")} ${T("Tus datos solo están en este móvil.")}`,
    `<button class="btn small" data-act="exp-all">${T("Exportar ahora")}</button><button class="btn ghost small" data-act="bk-later">${T("Más tarde")}</button>`);
}
function pendingCard() {
  const rows = backupBanner() + weightBanner() + cycBanner() + apkTip();
  return rows ? `<h2>${T("Pendiente")}</h2><div class="plist2" role="status">${rows}</div>` : "";
}
function viewTrain() {
  const a = state.active;
  if (!a) {
    const last = sortedSessions()[0], now = new Date(), dt = now.toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" });
    return `
      <div class="phead"><h1>${T("Hoy")}</h1>${multiProf() ? profChip() : `<span class="sub">${dt}</span>`}</div>
      ${multiProf() ? `<p class="sub" style="margin:-10px 0 14px">${dt}</p>` : ""}
      ${planUpNotice()}${todayCard()}
      <div class="quick"><button class="btn" data-tab="routines">${QICO.list}${T("Otra rutina")}</button><button class="btn" data-start="free">${QICO.free}${T("Sesión libre")}</button><button class="btn" data-act="act-open">${QICO.act}${T("Actividad")}</button></div>
      ${cycCard()}
      ${pendingCard()}
      <p class="sync" style="margin-top:22px">${last ? T("Última sesión: {d}", { d: new Date(last.start).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" }) }) + " · " : ""}${T("Datos guardados solo en este dispositivo. Haz copias desde Ajustes.")}</p>`;
  }
  if (a.pre) return viewPre(a);
  const n = a.exercises.length, cur = curEx(a), tot = a.exercises.reduce((t, e) => t + e.sets.length, 0), dn = doneSets(a);
  return `<div class="sess">
    <div class="shead">
      <div class="shtop"><b class="sname">${esc(a.routine || T("Sesión libre"))}</b><button class="btn ghost small danger" data-act="discard">${T("Descartar")}</button></div>
      <div class="shrow"><div class="clock${a.pausedAt ? " paused" : ""}" id="clock">0:00</div>
        <button class="btn small${a.pausedAt ? " primary" : ""} spause" data-act="sess-pause" aria-pressed="${!!a.pausedAt}" aria-label="${a.pausedAt ? T("Reanudar") : T("Pausar sesión")}" title="${a.pausedAt ? T("Reanudar") : T("Pausar sesión")}">${a.pausedAt ? "▶" : "❚❚"}</button>
        <span class="spacer"></span><div class="stats-inline"><span><b id="liveSets">${dn}</b>/${tot} ${T("series")}</span><span><b id="liveVol">${fmtWork(sessionWork(a))}</b></span></div></div>
      <div class="sprog" aria-hidden="true"><i style="width:${tot ? Math.round(dn / tot * 100) : 0}%"></i></div>
    </div>
    ${a.pausedAt ? `<div class="panel spaused"><b>${T("Sesión en pausa")}</b><span class="muted" style="font-size:.85rem">${T("El tiempo en pausa no cuenta en la duración del entreno.")}</span></div>` : ""}
    ${n ? `<div class="exnav"><span class="muted">${T("Ejercicio {n} de {m}", { n: cur + 1, m: n })}</span></div>
      ${rirAsk()}${grpBar(a, cur)}<div class="list" style="margin-top:8px">${exCard(a.exercises[cur], cur)}</div>
      ${exFooter(a, cur, n)}`
      : sessionPanel(a, false)}
    ${state.sheet && n ? `<div class="modal" role="dialog" aria-modal="true"><div class="mbox">${sessionPanel(a, true)}</div></div>` : ""}
  </div>`;
}
/* Pie del ejercicio: acción principal según el momento y navegación.
   Con series pendientes, la flecha derecha es «Saltar» y pide confirmación; con todo hecho, «Siguiente» o «Terminar y guardar». */
function exFooter(a, cur, n) {
  const e = a.exercises[cur], left = e.sets.filter(s => !s.done).length, last = cur >= n - 1, si = e.sets.findIndex(s => !s.done);
  const ask = state.skipAsk === cur, pendAll = a.exercises.reduce((t, x) => t + x.sets.filter(s => !s.done).length, 0);
  const rx = !last ? restXFor(e) : 0;
  const done = !left && e.sets.length ? `<div class="exdone" role="status"><span class="ok">✓ ${T("{x} hecho", { x: esc(exName(e)) })}</span><small>${T("{n} de {n} series", { n: e.sets.length })}${rx ? " · " + T("descanso {n} s antes del siguiente", { n: rx }) : ""}</small></div>` : "";
  const skip = left && !ask ? `<button class="btn ghost small sskip" data-act="ex-skip">${last ? T("Terminar") + "…" : T("Saltar ejercicio") + " ›"}</button>` : "";
  const confirm = ask && left ? `<div class="skipask" role="alertdialog"><div><b>${(left === 1 ? T("Queda 1 serie de {x}.", { x: esc(e.name) }) : T("Quedan {n} series de {x}.", { n: left, x: esc(e.name) }))}</b> ${last
      ? T("¿Terminar y guardar igualmente? Se guardan solo las series hechas ({n} pendientes en total).", { n: pendAll })
      : T("¿Pasar igualmente a {x}? Las series pendientes quedan sin hacer.", { x: esc(a.exercises[cur + 1].name) })}</div>
      <div class="row2"><button class="btn" data-act="skip-no">${T("Seguir aquí")}</button>${last
        ? `<button class="btn primary" data-act="finish">${T("Terminar y guardar")}</button>` : `<button class="btn primary" data-act="ex-next">${T("Saltar ejercicio")}</button>`}</div></div>` : "";
  /* Acción principal: la siguiente serie pendiente; con todo hecho, el siguiente ejercicio o terminar */
  const main = si >= 0
    ? `<button class="btn primary smain" data-act="set-next">${isTime(e) ? PLAY + T("Serie {n}", { n: si + 1 }) : "✓ " + T("Serie {n} hecha", { n: si + 1 })}</button>`
    : last ? `<button class="btn primary smain" data-act="finish">${T("Terminar y guardar")}</button>`
    : `<button class="btn primary smain" data-act="ex-next"><span>${T("Siguiente ejercicio: {x}", { x: esc(exName(a.exercises[cur + 1])) })}</span> →</button>`;
  return `${done}${skip}${confirm}<div class="sbar"><button class="btn sic" data-act="ex-prev" ${cur === 0 ? "disabled" : ""} aria-label="${T("Anterior")}" title="${T("Anterior")}">‹</button>${main}<button class="btn sic" data-act="sheet-open" aria-label="${T("Sesión")}" title="${T("Sesión")}">☰</button></div>`;
}
/* Superserie o circuito en curso: vuelta y orden, con salto a cada ejercicio */
function grpBar(a, ei) {
  const e = a.exercises[ei], g = grpOf(e); if (!g) return "";
  const mem = grpIdx(e.grp), keys = exKeys(a.exercises), rounds = Math.max(...mem.map(i => a.exercises[i].sets.length));
  const r = Math.min(...mem.map(i => { const k = a.exercises[i].sets.findIndex(x => !x.done); return k < 0 ? a.exercises[i].sets.length : k; }));
  return `<div class="gbar"><div><b>${grpLabel(g)}</b> · ${r >= rounds ? T("completada") : T("vuelta {n} de {m}", { n: r + 1, m: rounds })}</div>
    <div class="gseq">${mem.map(i => `<button class="${i === ei ? "on" : ""}" data-goex="${i}">${keys[i]} · ${esc(exName(a.exercises[i]))}</button>`).join('<span aria-hidden="true">→</span>')}</div>
    <small>${T("Uno tras otro; descanso entre vueltas: {n} s", { n: +g.rest || 0 })}</small></div>`;
}
/* Ejercicio que se muestra: el elegido, o el primero con series pendientes */
function curEx(a) {
  const n = a.exercises.length, i = state.exView;
  if (Number.isInteger(i) && i >= 0 && i < n) return i;
  const p = a.exercises.findIndex(e => e.sets.some(s => !s.done));
  return p >= 0 ? p : Math.max(0, n - 1);
}
function exCard(e, ei) {
  const prev = lastSetsFor(e), tm = isTime(e), lx = lastExFor(e), lsw = !e.from && lastSwapFor(e, state.active?.rid), nOpen = state.noteOpen === ei;
  return `<div class="ex">
    <div class="ex-head"><strong>${esc(exLabel(e))}</strong><button class="xinfo" style="font-family:inherit" data-swap="${ei}" aria-label="${T("Cambiar ejercicio")}" title="${T("Cambiar ejercicio")}">⇄</button><button class="xinfo${e.note || nOpen ? " on" : ""}" style="font-family:inherit" data-enote="${ei}" aria-label="${T("Nota")}" title="${T("Nota")}">✎</button>${e.xid && CATBY[e.xid] ? `<button class="xinfo" data-xinfo="${e.xid}" aria-label="${T("Ver ficha")}">i</button>` : ""}
      <span class="hint">${prev ? T("Anterior") + ": " + prev.map(p => fmtSet(p, tm, sideReps(e)) + (rirTxt(p, e) ? ` (${rirTxt(p, e)})` : "")).join(", ") : e.from ? T("Primera vez con este ejercicio") : ""}${lx?.e.note ? `<span class="hint2">✎ ${esc(lx.e.note)}</span>` : ""}${lsw ? `<span class="hint2">${T("La última vez lo cambiaste por {x}", { x: esc(exName(lsw)) })}${lsw.note ? `: ✎ ${esc(lsw.note)}` : ""}</span>` : ""}</span>
      ${e.from ? `<span class="swapnote">${T("en lugar de {x}", { x: esc(exName(e.from)) })} · <button data-swapundo="${ei}">${T("Deshacer")}</button></span>` : ""}
      ${nOpen ? `<textarea class="exnote" data-enotet="${ei}" maxlength="140" rows="2" placeholder="${T("Ej. molestia en el codo, banda verde, agarre más abierto…")}">${esc(e.note || "")}</textarea>` : e.note ? `<span class="hint2" style="flex-basis:100%">✎ ${esc(e.note)}</span>` : ""}
      <span class="spacer"></span><button class="type-t" data-type="${ei}" aria-label="${T("Cambiar entre repeticiones y segundos")}">${tm ? (e.sides ? T("seg · 2 lados") : T("seg")) : (e.sides ? T("reps · izq/der") : T("reps"))}</button>
      <button class="x" aria-label="${T("Quitar ejercicio")}" data-rmex="${ei}">×</button></div>
    <div class="sets${sideReps(e) ? " two" : ""}">
      <span class="h">#</span><span class="h">${T("lastre kg")}</span>${sideReps(e) ? `<span class="h">${T("izq.")}</span><span class="h">${T("der.")}</span>` : `<span class="h">${tm ? T("seg") : T("reps")}</span>`}<span></span><span></span>
      ${e.sets.map((s, si) => `
        <span class="n">${si + 1}</span>
        <span class="${s.done ? "set-done" : ""}"><input type="number" inputmode="decimal" step="0.5" min="0" value="${s.w ?? ""}" data-w="${ei}:${si}" aria-label="${T("Peso serie {n}", { n: si + 1 })}"></span>
        <span class="${s.done ? "set-done" : ""}"><input type="number" inputmode="numeric" min="0" value="${s.r ?? ""}" data-r="${ei}:${si}" aria-label="${tm ? T("Segundos serie {n}", { n: si + 1 }) : sideReps(e) ? T("Repeticiones lado izquierdo serie {n}", { n: si + 1 }) : T("Repeticiones serie {n}", { n: si + 1 })}"></span>${sideReps(e)
          ? `<span class="${s.done ? "set-done" : ""}"><input type="number" inputmode="numeric" min="0" value="${R2(s) ?? ""}" data-r2="${ei}:${si}" aria-label="${T("Repeticiones lado derecho serie {n}", { n: si + 1 })}"></span>` : ""}
        ${tm && !s.done
          ? `<button class="check play" data-play="${ei}:${si}" aria-label="${T("Empezar cuenta atrás serie {n}", { n: si + 1 })}">${PLAY}</button>`
          : `<button class="check ${s.done ? "on" : ""}" data-done="${ei}:${si}" aria-label="${T("Completar serie {n}", { n: si + 1 })}" aria-pressed="${!!s.done}">${CHECK}</button>`}
        <button class="x" data-rmset="${ei}:${si}" aria-label="${T("Quitar serie")}">×</button>`).join("")}
    </div>
    <button class="btn small" style="margin-top:10px" data-addset="${ei}">${T("Añadir serie")}</button>
  </div>`;
}
/* Lista de ejercicios, añadir ejercicio y terminar (hoja «Sesión») */
function sessionPanel(a, sheet) {
  const cur = curEx(a);
  return `${sheet ? mHead("seT", T("Sesión"), "sheet-close") : ""}
    <div class="list" style="margin-top:12px">${a.exercises.map((e, ei, all) => { const d = e.sets.filter(x => x.done).length, ks = a.groups ? exKeys(all) : null;
      return `<button class="btn exrow${ei === cur ? " now" : ""}${grpOf(e) ? " ing" : ""}" data-goex="${ei}"><span style="flex:1;text-align:left;min-width:0">${ks ? `<b class="ekey">${ks[ei]}</b> ` : ""}${esc(exLabel(e))}</span><span class="muted">${d}/${e.sets.length}${d && d === e.sets.length ? " ✓" : ""}</span></button>`; }).join("")}</div>
    <div class="row" style="margin-top:14px">
      <input type="text" id="newEx" placeholder="${T("Nombre del ejercicio")}" list="exNames" style="flex:1">
      <button class="btn" data-act="addex">${T("Añadir ejercicio")}</button>
    </div>${catReady() ? `<button class="btn" style="width:100%;margin-top:8px" data-act="xpick-sess">${T("Añadir del catálogo")}</button>` : ""}
    <datalist id="exNames">${allExerciseNames().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
    <button class="btn primary" style="width:100%;margin-top:20px;padding:14px" data-act="finish">${T("Terminar y guardar")}</button>`;
}
/* Antes de iniciar: se revisa la sesión; el reloj y las series quedan bloqueados */
function viewPre(a) {
  return `<div class="row"><span class="muted">${T("Sesión sin iniciar")}</span><span class="spacer"></span>
      <button class="btn ghost small danger" data-act="discard">${T("Descartar")}</button></div>
    <h1 style="margin-top:8px">${esc(a.routine || T("Sesión libre"))}</h1>
    <div class="prebar"><button class="btn primary" data-act="sess-begin">${PLAY}${T("Iniciar")}</button><small class="muted">${T("El reloj y las series se activan al iniciar.")}</small></div>
    <div class="list">${a.exercises.map((e, i, all) => { const tm = isTime(e), r0 = e.sets[0]?.r, g = grpOf(e), ks = a.groups ? exKeys(all) : null;
      return `<div class="ex${g ? " ing" : ""}"><strong>${ks ? `<b class="ekey">${ks[i]}</b> ` : ""}${xLink(e, esc(exLabel(e)))}</strong><div class="muted" style="margin-top:2px">${g ? `${grpLabel(g)} · ${T("{n} vueltas", { n: e.sets.length })} × ${r0 ? (tm ? r0 + " s" : r0 + " reps") : "—"}` : `${e.sets.length} × ${r0 ? (tm ? r0 + " s" : r0 + " reps") : "—"} · ${T("descanso {n} s", { n: restFor(e) })}`}</div></div>`; }).join("")}</div>
    <div class="row" style="margin-top:14px">
      <input type="text" id="newEx" placeholder="${T("Nombre del ejercicio")}" list="exNames" style="flex:1">
      <button class="btn" data-act="addex">${T("Añadir ejercicio")}</button>
    </div>${catReady() ? `<button class="btn" style="width:100%;margin-top:8px" data-act="xpick-sess">${T("Añadir del catálogo")}</button>` : ""}
    <datalist id="exNames">${allExerciseNames().map(n => `<option value="${esc(n)}">`).join("")}</datalist>`;
}
function allExerciseNames() {
  const set = new Set();
  state.routines.forEach(r => r.exercises.forEach(e => set.add(e.name)));
  state.sessions.forEach(s => s.exercises.forEach(e => set.add(e.name)));
  return [...set].sort((a, b) => a.localeCompare(b, LOC()));
}
function buildExercise(name, nSets = 3, reps = "", type, sides, rest, xid) {
  const prev = lastSetsFor(xid ? { xid } : name);
  return { name, ...(xid ? { xid } : {}), type: type || typeFor(name), sides: sides ?? SIDE_RX.test(name), rest: +rest > 0 ? +rest : null, sets: Array.from({length: nSets}, (_, i) => ({ w: prev?.[i]?.w ?? prev?.[prev.length-1]?.w ?? "", r: reps || (prev?.[i]?.r ?? ""), r2: reps || (prev?.[i] ? R2(prev[i]) : ""), done: false })) };
}
function startSession(rid) {
  const r = state.routines.find(x => x.id === rid);
  const rn = r ? normRoutine(JSON.parse(JSON.stringify(r))) : null;
  state.active = { id: uid(), start: Date.now(), pre: true, rid: r ? r.id : null, routine: r ? r.name : "", block: r ? (r.block || guessBlock(r.name)) : "otro", ...(rn?.groups ? { groups: rn.groups } : {}),
    exercises: rn ? rn.exercises.map(e => Object.assign(buildExercise(exName(e), +e.sets || 3, e.reps, e.type || "reps", !!e.sides, e.rest, e.xid), { restAfter: e.restAfter ?? null, ...(e.grp ? { grp: e.grp } : {}), ...(e.xid && techOf(e) ? { tech: techOf(e) } : {}) })) : [] };
  state.exView = null; state.sheet = false;
  saveActive(); render(); window.scrollTo(0, 0);
}

let clockT;
/* Duración efectiva de la sesión: sin el tiempo en pausa */
const activeMs = (a, now = Date.now()) => Math.max(0, now - a.start - (a.pausedMs || 0) - (a.pausedAt ? now - a.pausedAt : 0));
function toggleSessionPause(force) {
  const a = state.active; if (!a) return;
  const now = Date.now(), pause = force !== undefined ? force : !a.pausedAt;
  if (pause && !a.pausedAt) a.pausedAt = now;
  else if (!pause && a.pausedAt) { a.pausedMs = (a.pausedMs || 0) + (now - a.pausedAt); a.pausedAt = null; }
  saveActive(); render();
}
/* Cualquier acción de entreno reanuda la sesión si estaba en pausa */
function resumeIfPaused() { if (state.active?.pausedAt) { toggleSessionPause(false); toast(T("Sesión reanudada")); } }
const switchSecs = () => Math.max(0, +LS.get("wk.switch", 5));   // cambio de lado en ejercicios por lado
const prepSecs = () => Math.max(0, +LS.get("wk.prep", 5));     // preparación antes de una serie por tiempo que arrancas tú
const warnSecs = () => Math.max(0, +LS.get("wk.warn", 3));     // tics en los últimos segundos de cualquier cuenta atrás
const autoStart = () => LS.get("wk.autoStart", true) !== false;   // series por tiempo: inicio automático tras el descanso
const defRestX = () => LS.get("wk.restExDefault", 120);       // descanso entre ejercicios por defecto
const restXFor = e => (e && e.restAfter !== null && e.restAfter !== undefined && e.restAfter !== "" ? Math.max(0, +e.restAfter) : defRestX());
/* Descanso: el del ejercicio si lo tiene; si no, el valor por defecto (Datos) */
const defRest = () => LS.get("wk.restDefault", 90);
const restFor = e => (+e?.rest > 0 ? +e.rest : defRest());
/* Audio, vibración y pantalla encendida para la cuenta atrás */
let run = null, audioCtx = null, wakeLock = null, runT = null;
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
    const b = audioCtx.createBuffer(1, 1, 22050), src = audioCtx.createBufferSource(); src.buffer = b; src.connect(audioCtx.destination); src.start(0);
  } catch {}
}
// Tono puro (seno) con ataque corto y caída natural: suave, sin aspereza.
function beep(freq = 660, ms = 400, delay = 0, vol = 0.35) {
  if (fxMode() === "vib" || fxMode() === "off") return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
    const t0 = audioCtx.currentTime + delay, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.start(t0); o.stop(t0 + ms / 1000 + 0.05);
  } catch {}
}
/* Vibración: siempre a través del ajuste de avisos; con vibración apagada, corta cualquier patrón en curso */
const vib = p => {
  if (fxMode() === "sound" || fxMode() === "off") { try { navigator.vibrate?.(0); } catch {} return false; }
  try { return navigator.vibrate ? navigator.vibrate(p) : false; } catch { return false; }
};
const buzz = vib;
/* Tres avisos: tic (últimos segundos), inicio (empieza una serie) y fin (acaba una serie o un descanso sin nada detrás) */
function sfx(k) {
  if (k === "tick") { beep(660, 160, 0, 0.25); vib(40); }
  else if (k === "go") { beep(660, 160); beep(880, 600, 0.15); vib(300); }
  else { beep(880, 300); beep(660, 300, 0.25); beep(523, 700, 0.5); vib([300, 120, 300]); }
}
const beepEnd = () => sfx("end");
function flash() { const f = document.createElement("div"); f.className = "flash"; document.body.appendChild(f); setTimeout(() => f.remove(), 800); }
async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener?.("release", () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { wakeLock = null; }
}
