/* ---------- Pantalla de foco: series por tiempo encadenadas y descansos ----------
   run = { q: [fases], i, end, paused, rem }. Fase: {k: prep|work|switch|rest|restx, d (s), ei, si, side} */
const exOf = ei => state.active?.exercises?.[ei];
function nextUndone(ei, si) { const e = exOf(ei); for (let j = si + 1; j < (e?.sets.length || 0); j++) if (!e.sets[j].done) return j; return -1; }
function nextExercise(ei) { const ex = state.active?.exercises || []; for (let j = ei + 1; j < ex.length; j++) if (ex[j].sets.some(s => !s.done)) return j; return -1; }
/* Motor de tiempos (2.4). Cinco tramos y una regla para cada uno:
   - prep    Preparación: antes de una serie por tiempo que arrancas tú (▶) o al reanudar. Al acabar → «inicio».
   - work    Serie por tiempo. Al acabar → «fin» y se marca hecha.
   - switch  Cambio de lado, entre lado 1 y lado 2. Al acabar → «inicio».
   - rest    Descanso entre series.
   - restx   Descanso entre ejercicios.
   Al acabar un descanso: si sigue una serie por tiempo con inicio automático, «inicio» y empieza (el final del
   descanso hace de preparación); si no, «fin» y espera. En todas las cuentas atrás, «tic» en los últimos segundos (Aviso final).
   Las series por repeticiones nunca arrancan solas. */
/* Fases de una serie por tiempo (con su cambio de lado) */
const workPhases = (ei, j) => {
  const e = exOf(ei), st = e.sets[j], d = Math.round(+st.r || 0);
  if (!e.sides) return [{ k: "work", d, ei, si: j, side: null }];
  const sw = switchSecs();
  return [{ k: "work", d, ei, si: j, side: "a" }, ...(sw ? [{ k: "switch", d: sw, ei, si: j }] : []), { k: "work", d, ei, si: j, side: "b" }];
};
/* Superseries y circuitos: ejercicios de la sesión con el mismo grupo */
const grpOf = e => (e?.grp && state.active?.groups?.[e.grp]) || null;
const grpIdx = gid => (state.active?.exercises || []).map((x, i) => x.grp === gid ? i : -1).filter(i => i >= 0);
/* Siguiente serie tras la serie j de ei: { ei, si, d (descanso), k: "rest" | "restx", g (vuelta) } o null.
   En un grupo: el siguiente ejercicio de la vuelta (con su «descanso tras él»), y al cerrar la vuelta, el descanso entre vueltas. */
function stepAfter(ei, j) {
  const e = exOf(ei), g = grpOf(e);
  if (g) {
    const mem = grpIdx(e.grp), pos = mem.indexOf(ei), rounds = Math.max(...mem.map(i => exOf(i).sets.length));
    for (let m = pos + 1; m < mem.length; m++) { const st = exOf(mem[m]).sets[j]; if (st && !st.done) return { ei: mem[m], si: j, d: Math.max(0, +e.rest || 0), k: "rest", g: 1 }; }
    for (let r = j + 1; r < rounds; r++) for (const i of mem) { const st = exOf(i).sets[r]; if (st && !st.done) return { ei: i, si: r, d: Math.max(0, +g.rest || 0), k: "rest", g: 2 }; }
    const last = mem[mem.length - 1], ne = nextExercise(last); if (ne < 0) return null;
    return { ei: ne, si: exOf(ne).sets.findIndex(x => !x.done), d: g.restAfter !== null && g.restAfter !== undefined ? Math.max(0, +g.restAfter) : restXFor(exOf(last)), k: "restx" };
  }
  const nx = nextUndone(ei, j); if (nx >= 0) return { ei, si: nx, d: restFor(e), k: "rest" };
  const ne = nextExercise(ei); if (ne < 0) return null;
  return { ei: ne, si: exOf(ne).sets.findIndex(x => !x.done), d: restXFor(e), k: "restx" };
}
/* Qué viene después de la serie j del ejercicio ei: descanso y, con inicio automático, la siguiente serie por tiempo encadenada */
function chainAfter(ei, j) {
  const st = stepAfter(ei, j); if (!st) return [];
  const rest = st.d > 0 ? [st.k === "restx" ? { k: "restx", d: st.d, ei: st.ei } : { k: "rest", d: st.d, ei: st.ei, nx: st.si, ...(st.g ? { g: st.g } : {}) }] : [];
  if (!(autoStart() && timedReady(st.ei, st.si))) return rest;
  return [...(rest.length ? rest : prepSecs() ? [{ k: "prep", d: prepSecs(), ei: st.ei, si: st.si }] : []), ...timedChain(st.ei, st.si)];
}
const timedReady = (ei, j) => { const e = exOf(ei); return !!e && j >= 0 && isTime(e) && Math.round(+e.sets[j].r || 0) > 0; };
/* Serie por tiempo y todo lo que se encadena detrás */
function timedChain(ei, j) {
  const e = exOf(ei), secs = Math.round(+e.sets[j].r || 0);
  e.sets.forEach((x, k) => { if (k >= j && !x.done && !(+x.r > 0)) x.r = secs; });   // aplica el tiempo de la serie a las vacías
  return [...workPhases(ei, j), ...chainAfter(ei, j)];
}
/* Tras marcar una serie por repeticiones: su descanso (y lo que se encadene detrás) */
const afterSet = (ei, si) => chainAfter(ei, si);
/* Si el ejercicio queda completo y no hay descanso, pasa al siguiente; en un grupo, al siguiente de la vuelta */
function advanceIfDone(ei, si) {
  const e = exOf(ei); if (!e) return;
  if (grpOf(e) && si !== undefined) { const st = stepAfter(ei, si); if (st && curEx(state.active) === ei) { state.exView = st.ei; window.scrollTo(0, 0); } return; }
  if (!e.sets.every(s => s.done)) return;
  const ne = nextExercise(ei); if (ne >= 0 && curEx(state.active) === ei) { state.exView = ne; window.scrollTo(0, 0); }
}
/* ▶ en una serie por tiempo: preparación y la serie (con lo que se encadene) */
function startTimed(ei, si) {
  const e = exOf(ei), secs = Math.round(+e.sets[si].r || 0);
  if (secs < 1) { toast(T("Pon los segundos de la serie")); document.querySelector(`[data-r="${ei}:${si}"]`)?.focus(); return; }
  saveActive(); unlockAudio(); vib(40);
  startRun([...(prepSecs() ? [{ k: "prep", d: prepSecs(), ei, si }] : []), ...timedChain(ei, si)]);
}
function startRun(q) {
  if (!q.length) { render(); return; }
  clearInterval(runT);
  run = { q, i: -1, paused: false }; keepAwake(true);
  enterPhase(0); runT = setInterval(runTick, 200);
}
function enterPhase(i) {
  run.i = i; const f = run.q[i]; run.end = Date.now() + f.d * 1000; run.tick = null;
  if (f.k === "work") { state.exView = f.ei; sfx("go"); flash(); }
  if (f.k === "restx" || f.k === "rest" || f.k === "prep") { state.exView = f.ei; }
  render();
}
function markSet(f, secsDone) {
  const e = exOf(f.ei), st = e?.sets[f.si]; if (!st) return;
  if (secsDone !== undefined) st.r = secsDone;
  st.done = true; saveActive();
  if (EFF().rir) state.rirAsk = { ei: f.ei, si: f.si };
}
/* Fin de un tramo. natural: llegó a 0 (no se saltó) */
function phaseDone(natural) {
  const f = run.q[run.i], nx = run.q[run.i + 1];
  if (f.k === "work") {
    if (f.side !== "a") markSet(f, natural ? f.d : Math.max(1, Math.round(f.d - Math.max(0, run.end - Date.now()) / 1000)));
    if (natural) sfx("end");
  } else if (natural && (f.k === "rest" || f.k === "restx" || f.k === "prep" || f.k === "switch") && (!nx || nx.k !== "work")) sfx("end");
  if (!nx) { if (f.k === "work" && f.side !== "a" && grpOf(exOf(f.ei))) { const st = stepAfter(f.ei, f.si); if (st) state.exView = st.ei; } endRun(); return; }
  enterPhase(run.i + 1);
}
function runTick() {
  if (!run) return clearInterval(runT);
  if (run.lead) {                                                     // reanudar tras una pausa: preparación y sigue
    const l = Math.ceil((run.lead - Date.now()) / 1000);
    if (l <= 0) { run.end = Date.now() + run.rem; run.paused = false; run.lead = null; run.tick = null; sfx("go"); render(); return; }
    const n = $("#fNum"); if (n) n.textContent = fmtLeft(l);
    if (l <= warnSecs() && run.leadTick !== l) { run.leadTick = l; sfx("tick"); }
    return;
  }
  if (run.paused) return;
  const f = run.q[run.i], left = Math.ceil((run.end - Date.now()) / 1000);
  if (left <= 0) { phaseDone(true); return; }
  const n = $("#fNum"); if (n) n.textContent = fmtLeft(left);
  if (left <= warnSecs() && run.tick !== left) { run.tick = left; sfx("tick"); }
  const r = $("#fRing"); if (r) r.style.strokeDashoffset = String(RING * Math.max(0, (run.end - Date.now()) / (f.d * 1000)));
}
const RING = 2 * Math.PI * 88;
const fmtLeft = n => n >= 60 ? `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}` : String(n);
/* Reanudar una serie en pausa: primero la cuenta atrás de inicio (Datos → Tiempos) y luego sigue donde estaba */
function pauseRun() {
  if (!run) return;
  const f = run.q[run.i];
  if (run.lead) { run.lead = null; }                                  // cancelar la reanudación: sigue en pausa
  else if (run.paused) {
    if ((f.k === "work" || f.k === "switch") && prepSecs() > 0) { run.lead = Date.now() + prepSecs() * 1000; run.leadTick = null; }
    else { run.end = Date.now() + run.rem; run.paused = false; run.tick = null; }
  }
  else { run.rem = Math.max(0, run.end - Date.now()); run.paused = true; }
  render();
}
/* −5 s / +5 s en directo durante un descanso (no cambia la configuración) */
function adjRun(dl) {
  if (!run) return;
  const f = run.q[run.i]; if (f.k !== "rest" && f.k !== "restx") return;
  const now = Date.now();
  if (run.paused) { run.rem = Math.max(1000, run.rem + dl * 1000); f.d = Math.max(f.d + dl, Math.ceil(run.rem / 1000)); }
  else { run.end = Math.max(now + 1000, run.end + dl * 1000); f.d = Math.max(f.d + dl, Math.ceil((run.end - now) / 1000)); }
  run.tick = null; render();
}
/* Parar: guarda lo hecho en la serie en curso (al menos 1 s) y cierra sin descanso */
function stopRun() {
  if (!run) return;
  const f = run.q[run.i], now = run.paused ? run.end - run.rem : Date.now();
  if (f.k === "work") { const el = Math.round(f.d - Math.max(0, run.end - now) / 1000); if (el >= 1) markSet(f, el); }
  if (f.k === "switch") markSet(f);
  sfx("end"); endRun();
}
function endRun() { clearInterval(runT); run = null; render(); updateLive(); }
function cancelRun() { if (run) { clearInterval(runT); run = null; } syncAwake(); }
/* Pantalla encendida mientras hay una sesión en marcha (o una cuenta atrás) */
const syncAwake = () => keepAwake(!!run || !!(state.active && !state.active.pre));
document.addEventListener("toggle", ev => { if (ev.target.matches?.("details[data-plans]")) state.plansOpen = ev.target.open; }, true);
document.addEventListener("toggle", ev => { if (run && ev.target.matches?.("details.fnx")) run.nxo = ev.target.open ? run.i : null; }, true);  // ficha del siguiente: abierta solo en este descanso
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { wakeLock = null; syncAwake(); } });
/* Descanso antes de otro ejercicio: su ficha resumida (para qué sirve y cómo se hace) y enlace a la completa */
function nextCard(e) {
  const x = e?.xid && catReady() && CATBY[e.xid]; if (!x) return "";
  const inf = x.info?.[LANG] || x.info?.es || {}, how = inf.how || [];
  return `<details class="fnx"${run?.nxo === run?.i ? " open" : ""}><summary class="fnxh"><b>${esc(xName(x))}</b>${LV(x.level)}<span class="fnxc">${T("Cómo se hace")}</span></summary>
    ${inf.why ? `<p>${esc(inf.why)}</p>` : ""}${how.length ? `<ol>${how.map(h => `<li>${esc(h)}</li>`).join("")}</ol>` : ""}
    ${e.note ? `<p class="fnxn">✎ ${esc(e.note)}</p>` : ""}<button class="xl" data-xinfo="${esc(x.id)}">${T("Ver la ficha completa")}</button></details>`;
}
function focusView() {
  if (!run || !state.active) return "";
  const f = run.q[run.i], e = exOf(f.ei) || {}, nx = run.q[run.i + 1], left = run.lead ? Math.max(0, Math.ceil((run.lead - Date.now()) / 1000)) : run.paused ? Math.ceil(run.rem / 1000) : Math.max(0, Math.ceil((run.end - Date.now()) / 1000));
  const holding = run.paused && !run.lead;
  const nSets = e.sets?.length || 0;
  const title = f.k === "restx" ? T("Descanso entre ejercicios") : esc(e.name || "");
  const label = f.k === "prep" ? T("Prepárate") : f.k === "switch" ? T("Cambia de lado") : f.k === "rest" ? (f.g === 2 ? T("Descanso entre vueltas") : f.g ? T("Cambio de ejercicio") : T("Descanso entre series")) : f.k === "restx" ? ""
    : (f.side ? T("Serie {n} de {m} · lado {s}", { n: f.si + 1, m: nSets, s: f.side === "a" ? 1 : 2 }) : T("Serie {n} de {m}", { n: f.si + 1, m: nSets }));
  const tgt = (ex, j) => { const st = ex.sets[j]; return isTime(ex) ? `${st.r} s` : sideReps(ex) ? `${st.r}/${R2(st)} reps` : `${st.r} reps`; };
  let next = "";
  if (f.k === "rest" && f.g) next = T("Siguiente: {x}", { x: `${esc(exName(e))} · ${tgt(e, f.nx)}` }) + (isTime(e) && autoStart() ? ` (${T("empieza sola")})` : "");
  else if (f.k === "rest") next = isTime(e) && autoStart() ? T("Siguiente: serie {n} (empieza sola)", { n: f.nx + 1 }) : T("Siguiente: serie {n} · {x}", { n: f.nx + 1, x: tgt(e, f.nx) });
  else if (f.k === "restx") next = T("Siguiente: {x}", { x: `${esc(e.name)} · ${e.sets.filter(z => !z.done).length}× ${tgt(e, e.sets.findIndex(z => !z.done))}` });
  else if (nx) next = nx.k === "rest" ? T("Luego: descanso {n} s", { n: nx.d }) : nx.k === "restx" ? T("Luego: cambio de ejercicio ({n} s)", { n: nx.d })
    : nx.k === "switch" ? T("Luego: cambio de lado") : nx.ei !== f.ei && exOf(nx.ei) ? T("Luego: {x}", { x: esc(exName(exOf(nx.ei))) }) : nx.k === "work" ? T("Luego: serie {n}", { n: nx.si + 1 }) : T("Luego: serie {n}", { n: (nx.si ?? 0) + 1 });
  else next = T("Último tramo");
  const col = f.k === "rest" || f.k === "restx" ? "var(--ok)" : "var(--accent)";
  const off = RING * (run.paused ? run.rem / (f.d * 1000) : Math.max(0, (run.end - Date.now()) / (f.d * 1000)));
  return `<div class="focus" role="dialog" aria-modal="true" aria-label="${T("Cuenta atrás")}"><div class="fbox">
    <div class="fx">${title}</div><div class="fph">${label}</div>
    <div class="fring${holding ? " paused" : ""}"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="trk" cx="100" cy="100" r="88"/><circle id="fRing" cx="100" cy="100" r="88" style="stroke:${col};stroke-dasharray:${RING};stroke-dashoffset:${off}"/></svg>
      <div class="fnum"><span id="fNum">${fmtLeft(left)}</span>${run.lead ? `<small>${T("Reanudando…")}</small>` : run.paused ? `<small>${T("En pausa")}</small>` : ""}</div></div>
    ${f.k !== "restx" && nSets ? `<div class="fdots">${e.sets.map((z, j) => `<i class="${z.done ? "d" : (f.k === "work" || f.k === "switch") && f.si === j ? "c" : ""}"></i>`).join("")}</div>` : ""}
    <p class="muted" style="margin:4px 0 0">${next}</p>
    ${f.k === "restx" || (f.k === "rest" && f.g === 1) ? nextCard(e) : ""}
    ${f.k === "rest" || f.k === "restx" ? rirAsk() : ""}
    ${f.k === "rest" || f.k === "restx" ? `<div class="fadj"><button class="btn" data-act="run-adj" data-d="-5">−5 s</button><button class="btn" data-act="run-adj" data-d="5">+5 s</button></div>` : ""}
    <div class="fbtns"><button class="btn primary" data-act="run-pause" aria-pressed="${holding}">${holding ? "▶ " + T("Reanudar") : "❚❚ " + T("Pausa")}</button>
      <button class="btn" data-act="run-skip">${T("Saltar")}</button><button class="btn" data-act="run-stop">${T("Parar")}</button></div>
  </div></div>`;
}
function tick() {
  clearInterval(clockT);
  const upd = () => {
    if (!state.active) return clearInterval(clockT);
    const s = Math.floor(activeMs(state.active) / 1000);
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = String(s % 60).padStart(2, "0");
    const c = $("#clock"); if (c) c.textContent = h ? `${h}:${String(m).padStart(2,"0")}:${ss}` : `${m}:${ss}`;
  };
  upd(); clockT = setInterval(upd, 250);
}
function updateLive() {
  const a = state.active; if (!a) return;
  const ls = $("#liveSets"), lv = $("#liveVol");
  if (ls) ls.textContent = doneSets(a);
  if (lv) lv.textContent = fmtWork(sessionWork(a));
}

async function finishSession() {
  const a = state.active;
  cancelRun();
  const exercises = a.exercises.map(e => ({ name: e.name, ...(e.xid ? { xid: e.xid } : {}), ...(e.xid && techOf(e) ? { tech: techOf(e) } : {}), ...(e.from ? { from: e.from.name, ...(e.from.xid ? { fromXid: e.from.xid } : {}), ...(e.from.tech ? { fromTech: e.from.tech } : {}) } : {}), ...(e.note ? { note: String(e.note).trim().slice(0, 140) } : {}), type: isTime(e) ? "time" : "reps", sides: !!e.sides, sets: e.sets.filter(s => s.done).map(s => ({ w: +s.w || 0, r: +s.r || 0, ...(sideReps(e) ? { r2: +R2(s) || 0 } : {}), ...(s.rir !== undefined && s.rir !== null ? { rir: s.rir } : {}), done: true })) })).filter(e => e.sets.length);
  if (!exercises.length) { toast(T("Marca al menos una serie como completada")); return; }
  const s = { id: a.id, start: a.start, end: a.start + activeMs(a), ...(a.rid ? { rid: a.rid } : {}), routine: a.routine, block: a.block || guessBlock(a.routine), exercises };
  state.sessions.push(s);
  state.active = null; saveActive();
  await store.saveSession(s);
  state.savedSess = s.id; state.swapDone = null; state.rirAsk = null; state.progProps = progProposals(s);
  state.day = dayKey(Date.now()); state.tab = "diary"; render();
}

