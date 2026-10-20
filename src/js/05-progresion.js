/* ---------- Asistente de progresión (2.0) ----------
   A) Propuestas por rendimiento (con el catálogo: usa sus cadenas de pasos). Al terminar una sesión, para cada ejercicio vinculado de la rutina:
      ▲ subir de paso si todas las series llegan al objetivo en N sesiones seguidas; ▼ volver al paso anterior si la media queda
      por debajo del X % del objetivo en M sesiones seguidas. Siempre es una propuesta: Cambiar en la rutina / Más tarde / No proponer.
   B) Plan por fases: en la semana ↑ (vuelve una variante) se aplica sola la regla del plan (p.upRule) a las rutinas de esa variante,
      con un aviso en Hoy que permite deshacer. Esas rutinas no reciben propuestas de subir; las de retroceder, sí.
   Se guarda: wk.prog (ajustes), wk.progMute (rutina:ejercicio sin propuestas), wk.progLog (cambios de paso), wk.planUpDone, wk.planUpLog. */
const PROG = () => ({ on: true, up: 2, down: "60-2", ...(LS.get("wk.prog", {}) || {}) });
const DOWN_OPTS = [["60-2", "Por debajo del 60 % · 2 sesiones"], ["50-3", "Por debajo del 50 % · 3 sesiones"], ["never", "Nunca"]];
const UP_RULES = [["mark", "Solo recordatorio (↑)"], ["reps1", "+1 repetición por serie (+5 s)"], ["reps2", "+2 repeticiones por serie (+10 s)"], ["set", "+1 serie"], ["step", "Siguiente paso si llegaste al objetivo"]];
const upRuleOf = p => UP_RULES.some(u => u[0] === p?.upRule) ? p.upRule : "mark";
/* Rutina con subida automática del plan (variante del plan activo y regla distinta de «solo recordatorio») */
const planAutoUp = r => { const p = PL.get(); return !!(p && p.enabled !== false && p.up && upRuleOf(p) !== "mark" && normVar(r.variant) && planVariants(p).includes(normVar(r.variant))); };
/* Paso anterior y siguiente de un ejercicio en su cadena principal (una variante usa la de su ejercicio base) */
function chainStep(xid) {
  const base = CAT?.variants?.[xid], o = CHAIN[xid]?.[0] || (base && CHAIN[base]?.[0]);
  return o ? { prev: o.c[o.i - 1] || null, next: o.c[o.i + 1] || null, chain: o.c, cur: o.c[o.i] } : { prev: null, next: null, chain: null, cur: null };
}
/* Una sesión de un ejercicio frente al objetivo de la rutina: ok = todas las series (las de la rutina, como mínimo) llegan; ratio = media/objetivo. Por lado: el peor lado. */
function vsTarget(se, re) {
  const tgt = +re.reps || 0; if (!tgt) return null;
  const vals = se.sets.filter(x => x.done !== false).map(x => sideReps(se) ? Math.min(+x.r || 0, +R2(x) || 0) : +x.r || 0);
  if (!vals.length) return null;
  return { ok: vals.length >= (+re.sets || 1) && vals.every(v => v >= tgt), ratio: vals.reduce((a, b) => a + b, 0) / vals.length / tgt, vals };
}
const routineSessions = r => sortedSessions().filter(s => s.rid ? s.rid === r.id : s.routine === r.name);
function exHistory(r, re) { const k = exKey(re); return routineSessions(r).map(s => ({ s, e: s.exercises.find(e => exKey(e) === k) })).filter(x => x.e); }
const startTarget = (x, from, dir) => {
  const tm = x.type === "time", same = (from.type === "time") === tm, t = +from.reps || 0;
  let v = !same ? (tm ? 20 : 8) : dir === "up" ? Math.round(t * 0.55) : Math.round(t * 1.4);
  if (tm) v = Math.max(10, Math.round(v / 5) * 5); else v = Math.max(3, v);
  return Math.min(tm ? 600 : 50, v);
};
function progProposals(s) {
  const P = PROG(); if (!P.on || !catReady() || !s?.rid) return [];
  const r = state.routines.find(x => x.id === s.rid); if (!r) return [];
  const mute = new Set(LS.get("wk.progMute", []) || []), auto = planAutoUp(r), out = [];
  const [pct, nDown] = P.down === "never" ? [0, 0] : P.down.split("-").map(Number);
  r.exercises.forEach((re, i) => {
    if (!re.xid || !CATBY[re.xid] || mute.has(r.id + ":" + re.xid) || !s.exercises.some(e => exKey(e) === exKey(re))) return;
    const h = exHistory(r, re), sc = h.map(x => vsTarget(x.e, re)), st = chainStep(re.xid);
    const last = n => sc.length >= n && sc.slice(0, n).every(Boolean);
    if (!auto && st.next && last(P.up) && sc.slice(0, P.up).every(x => x.ok))
      out.push({ dir: "up", rid: r.id, i, xid: re.xid, to: st.next, hist: sc.slice(0, P.up).map(x => x.vals), tgt: startTarget(CATBY[st.next], re, "up") });
    else if (st.prev && ((nDown && last(nDown) && sc.slice(0, nDown).every(x => x.ratio < pct / 100)) || (P.down !== "never" && h.length >= 2 && sc.length >= 2 && h.slice(0, 2).every(x => +x.s.pem >= 9) && sc.slice(0, 2).every(x => x && !x.ok))))
      out.push({ dir: "down", rid: r.id, i, xid: re.xid, to: st.prev, hist: sc.slice(0, nDown).map(x => x.vals), tgt: startTarget(CATBY[st.prev], re, "down") });
  });
  return out;
}
const setChips = (vals, re) => `<span class="pchips">${vals.map(v => `<i class="${v >= +re.reps ? "ok" : ""}">${v}</i>`).join("")}</span>`;
function progCards() {
  const L = state.progProps || []; if (!L.length) return "";
  return `<div class="pgsec"><p class="pgh">${T("Progresión")}</p>${L.map((p, k) => {
    const r = state.routines.find(x => x.id === p.rid), re = r?.exercises[p.i]; if (!re || re.xid !== p.xid) return "";
    const fx = CATBY[p.xid], tx = CATBY[p.to], up = p.dir === "up", u = isTime(re) ? " s" : "";
    return `<div class="pgc ${up ? "up" : "down"}">
      <b class="pgt"><i>${up ? "▲" : "▼"}</i>${up ? T("Listo para subir") : T("¿Consolidar antes?")}</b>
      <p>${up ? T("{x}: objetivo cumplido {n} sesiones seguidas.", { x: `<b>${esc(xName(fx))}</b>`, n: p.hist.length }) : T("{x}: por debajo del {p} % del objetivo {n} sesiones seguidas.", { x: `<b>${esc(xName(fx))}</b>`, p: PROG().down.split("-")[0], n: p.hist.length })}</p>
      <div class="pgh2">${p.hist.map((v, j) => `${setChips(v, re)}<small>${j === 0 ? T("hoy") : T("antes")}</small>`).join("")}<small>${T("objetivo {n}", { n: re.reps + u })}</small></div>
      ${up ? "" : `<p class="muted" style="font-size:.82rem">${T("Es normal al empezar un paso nuevo. Volver unas semanas al anterior suele hacer avanzar antes.")}</p>`}
      <div class="pgft">${esc(xName(fx))} ${LV(fx.level)} → <b>${esc(xName(tx))}</b> ${LV(tx.level)}</div>
      <div class="row"><button class="btn small primary" data-pgch="${k}">${T("Cambiar en la rutina")}</button><button class="btn small" data-pglater="${k}">${up ? T("Más tarde") : T("Seguir intentándolo")}</button><button class="btn small ghost" data-pgmute="${k}">${T("No proponer")}</button></div>
    </div>`; }).join("")}</div>`;
}
function progChangeModal() {
  const c = state.progChange, p = c && state.progProps?.[c.k]; if (!p) return "";
  const r = state.routines.find(x => x.id === p.rid), re = r?.exercises[p.i]; if (!re) return "";
  const fx = CATBY[p.xid], tx = CATBY[p.to], up = p.dir === "up", tu = tx.type === "time" ? " s" : "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pcT"><div class="mbox">
    ${mHead("pcT", up ? T("Subir de paso") : T("Volver al paso anterior"), "pg-cancel")}
    <p class="muted" style="margin:0;font-size:.85rem">${T("En «{x}». Las demás rutinas no cambian.", { x: esc(r.name) })}</p>
    <div class="pcg"><div class="pcc"><small>${T("Ahora")}</small><b>${esc(xName(fx))}</b>${LV(fx.level)}<span class="muted">${re.sets} × ${re.reps}${isTime(re) ? " s" : ""}${re.sides ? " " + T("por lado") : ""}</span></div>
      <span class="pca">→</span>
      <div class="pcc new"><small>${T("Nuevo")}</small><b>${esc(xName(tx))}</b>${LV(tx.level)}<span class="pcn">${re.sets}&nbsp;× <button data-pgn="${tx.type === "time" ? -5 : -1}" aria-label="${T("Menos")}">−</button><b>${c.tgt}${tu}</b><button data-pgn="${tx.type === "time" ? 5 : 1}" aria-label="${T("Más")}">+</button></span></div></div>
    <p class="muted" style="font-size:.82rem;margin:10px 0 0">${up ? T("Objetivo de inicio más bajo: el paso nuevo es más difícil. Tu historial de {x} se conserva.", { x: esc(xName(fx)) }) : T("Objetivo de inicio asequible para consolidar. Tu historial de {x} se conserva.", { x: esc(xName(fx)) })}</p>
    <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn ghost" data-act="pg-cancel">${T("Cancelar")}</button><button class="btn primary" data-act="pg-ok">${T("Cambiar")}</button></div>
  </div></div>`;
}
function progApply(p, tgt) {
  const r = state.routines.find(x => x.id === p.rid), re = r?.exercises[p.i], tx = CATBY[p.to]; if (!re || !tx) return false;
  r.exercises[p.i] = { ...re, xid: tx.id, name: xName(tx), type: tx.type === "time" ? "time" : "reps", sides: !!tx.sides, reps: tgt };
  const log = LS.get("wk.progLog", []) || []; log.push({ t: Date.now(), rid: r.id, from: p.xid, to: tx.id, dir: p.dir }); LS.set("wk.progLog", log.slice(-300));
  store.saveRoutines(state.routines); return true;
}

/* Plan: regla de la semana ↑ */
function applyUpRule(rule, r, e) {
  const tm = isTime(e), a = { ...e };
  if (rule === "reps1" || rule === "reps2") { const n = (rule === "reps1" ? 1 : 2) * (tm ? 5 : 1); a.reps = Math.min(tm ? 3600 : 100, (+e.reps || 0) + n); }
  else if (rule === "set") { if ((+e.sets || 0) >= 10) return null; a.sets = (+e.sets || 0) + 1; }
  else if (rule === "step") {
    if (!e.xid || !CATBY[e.xid]) return null; const st = chainStep(e.xid), h = exHistory(r, e)[0], v = h && vsTarget(h.e, e);
    if (!st.next || !v?.ok) return null; const tx = CATBY[st.next];
    Object.assign(a, { xid: tx.id, name: xName(tx), type: tx.type === "time" ? "time" : "reps", sides: !!tx.sides, reps: startTarget(tx, e, "up") });
  } else return null;
  return a;
}
const exShort = e => `${exName(e)} ${e.sets}×${e.reps}${isTime(e) ? " s" : ""}`;
function planUpCheck() {
  const p = PL.get(), pn = planNow(p); if (!pn || pn.status !== "on" || !pn.w.up) return;
  const rule = upRuleOf(p); if (rule === "mark" || (rule === "step" && !CAT)) return;
  const done = LS.get("wk.planUpDone", []) || [], key = dayKey(pn.w.t); if (done.includes(key)) return;
  const changes = [];
  state.routines.filter(r => normVar(r.variant) === pn.w.variant).forEach(r => r.exercises.forEach((e, i) => {
    const after = applyUpRule(rule, r, e); if (!after) return;
    changes.push({ rid: r.id, i, before: { ...e }, after, txt: `${exShort(e)} → ${exShort(after)}` }); r.exercises[i] = after;
  }));
  LS.set("wk.planUpDone", [...done, key].slice(-100));
  LS.set("wk.planUpLog", { week: key, variant: pn.w.variant, rule, changes, seen: !changes.length, undone: false });
  if (changes.length) store.saveRoutines(state.routines);
}
function apkTip() {
  if (isNative() || !/android/i.test(navigator.userAgent) || LS.get("wk.apkTip", false)) return "";
  return prow("var(--muted)", T("Hay app para Android"), T("La misma Usus, instalada como app. Sus datos van aparte: exporta una copia aquí e impórtala allí."),
    `<a class="btn small" href="${REL_URL}" target="_blank" rel="noopener">${T("Descargar")}</a><button class="btn ghost small" data-act="apk-tip-no">${T("No, gracias")}</button>`);
}
function planUpNotice() {
  const L = LS.get("wk.planUpLog", null), pn = planNow(); if (!L || L.seen || !pn || pn.status !== "on" || dayKey(pn.w.t) !== L.week) return "";
  return `<div class="panel pgnote"><b>↑ ${T("Semana de subida · variante {v}", { v: esc(L.variant) })}</b>
    <p class="muted" style="margin:4px 0 8px;font-size:.88rem">${L.undone ? T("Cambios deshechos. Tus rutinas están como antes.") : T("Se ha aplicado la regla de tu plan: {x}.", { x: T(UP_RULES.find(u => u[0] === L.rule)?.[1] || "") })}</p>
    ${L.undone ? "" : `<ul class="pgl">${L.changes.map(c => `<li>${esc(c.txt)}</li>`).join("")}</ul>`}
    <div class="row" style="margin-top:8px"><button class="btn small primary" data-act="pu-ok">${T("Entendido")}</button>${L.undone ? "" : `<button class="btn small" data-act="pu-undo">${T("Deshacer")}</button>`}</div></div>`;
}
function planUpUndo() {
  const L = LS.get("wk.planUpLog", null); if (!L || L.undone) return;
  L.changes.forEach(c => { const r = state.routines.find(x => x.id === c.rid), e = r?.exercises[c.i]; if (e && e.name === c.after.name && String(e.reps) === String(c.after.reps) && String(e.sets) === String(c.after.sets)) r.exercises[c.i] = c.before; });
  L.undone = true; LS.set("wk.planUpLog", L); store.saveRoutines(state.routines);
}

/* Stats → Ejercicios: dónde estás en la cadena */
function chainBlock(xid) {
  const st = chainStep(xid); if (!st.chain) return "";
  const inR = st.chain.find(id => state.routines.some(r => r.exercises.some(e => e.xid === id || CAT?.variants?.[e.xid] === id)));
  const log = LS.get("wk.progLog", []) || [], ci = st.chain.indexOf(inR || st.cur);
  const used = new Set(state.sessions.flatMap(s => s.exercises.map(e => e.xid)).filter(Boolean));
  return `<div class="pchain"><p class="pgh">${T("Tu progresión")}</p>${st.chain.map((id, j) => {
    const x = CATBY[id], up = log.filter(l => l.from === id && l.dir === "up").pop();
    const cls = j < ci ? "done" : j === ci ? "cur" : "", note = j < ci ? (up ? T("superado el {d}", { d: new Date(up.t).toLocaleDateString(LOC(), { day: "numeric", month: "short" }) }) : used.has(id) ? T("hecho") : "") : j === ci ? T("actual") : j === ci + 1 ? T("siguiente") : j === st.chain.length - 1 ? T("meta") : "";
    return `<div class="pst ${cls}"><button data-xinfo="${id}">${esc(xName(x))}</button>${LV(x.level)}${note ? `<small>${note}</small>` : ""}</div>`; }).join("")}</div>`;
}
/* Textos de las exportaciones (análisis con IA y CSV), por idioma. Van aparte de I18N porque son el contenido de un archivo, no la interfaz. */
const XT = {
es: {
  title: "Análisis de entrenamiento y hábitos · Usus",
  intro: fem => `Eres un entrenador de fuerza y calistenia con buena base en fisiología del ejercicio, recuperación y hábitos${fem ? " y conocimiento del ciclo menstrual y su relación con el rendimiento" : ""}. Abajo tienes los registros de una persona exportados desde Usus, una app de entrenamiento que guarda los datos solo en su móvil. Analízalos y prepárale un informe útil.`,
  rulesH: "Reglas",
  rules: fem => [
    `No eres médico y esto no es un diagnóstico. No diagnostiques ni nombres enfermedades a partir de los datos. Si ves algo que merezca consulta (dolor que se repite, pérdida de peso rápida o no buscada, sueño muy alterado${fem ? ", ciclos muy irregulares, reglas muy abundantes o ausencia de regla" : ""}…), dilo con claridad y recomienda acudir a un profesional sanitario.`,
    "Interpreta todo a la luz del perfil y los antecedentes: los mismos números significan cosas distintas en alguien con años de entrenamiento que en alguien que empieza o que tiene una lesión. Ajusta exigencia y recomendaciones a eso.",
    "Separa lo que dicen los datos de lo que supones. Si algo es una hipótesis, dilo.",
    "No registrar no siempre significa no hacer: si hay huecos, tenlo en cuenta y no saques conclusiones fuertes de ellos.",
    "Sé concreto: cita fechas, ejercicios y cifras. Nada de consejos genéricos que valdrían para cualquiera.",
    "Escribe en castellano, en un tono claro y cercano."],
  formH: "Forma: gráficos primero, texto breve",
  form: fem => [
    "Muestra la evolución con **gráficos** siempre que puedas generarlos (con código, una herramienta de gráficos o un documento interactivo). Como mínimo:",
    "  - progresión de 3–5 ejercicios principales (mejor serie por sesión, frente al objetivo de la rutina);",
    "  - volumen semanal (series o repeticiones por semana) y días entrenados frente a los planificados;",
    "  - peso en el tiempo, si hay datos;",
    "  - sueño: horas por noche y su media semanal;",
    ...(fem ? ["  - ciclo: días de regla y síntomas sobre el calendario, junto a los entrenos;"] : []),
    "Si no puedes hacer gráficos, usa tablas compactas o barras de texto (▁▂▃▄▅▆▇█) en su lugar.",
    "No repitas en texto lo que ya muestra un gráfico o una tabla: comenta solo lo que significa.",
    "Sé breve: frases cortas, sin introducciones ni resúmenes repetidos. Cada apartado, lo justo; si no hay nada relevante, dilo en una línea."],
  repH: "Informe",
  rep: fem => [
    "**Resumen**: 3–5 puntos con lo más importante.",
    "**Constancia y progresión**: frecuencia real frente a la planificada, ejercicios que progresan, se estancan o retroceden, y si el volumen es razonable para su nivel.",
    "**Recuperación**: sueño (horas, regularidad, calidad) y su relación con los entrenos y las molestias anotadas.",
    "**Peso**: tendencia y si encaja con sus objetivos.",
    "**Suplementos**: constancia de las tomas. Solo comenta su utilidad si hay buena evidencia; no recomiendes suplementos nuevos.",
    "**Actividad diaria**: pasos y otras actividades.",
    ...(fem ? ["**Ciclo**: duración y regularidad, síntomas registrados y si el rendimiento, el sueño o las molestias cambian según la fase. Sin conclusiones fuertes con pocos ciclos."] : []),
    "**Señales a vigilar**: lo que conviene observar o consultar con un profesional, y por qué.",
    "**Ajustes para las próximas semanas**: 3–6 cambios concretos y realistas (ejercicios, series, repeticiones, descansos, días, hábitos), coherentes con sus antecedentes.",
    "**Preguntas**: lo que te falta saber para afinar el análisis."],
  pdfH: "Entrega: PDF para imprimir en A4",
  pdf: ["Entrega el informe como **PDF A4 vertical**, listo para imprimir. Si no puedes crear archivos, prepara un documento (HTML o similar) con estas mismas reglas para que la persona lo imprima o guarde como PDF.",
    "Márgenes de unos 2 cm, letra de 10–11 pt, interlineado cómodo. Números de página en el pie.",
    "Primera página: título «Informe de entrenamiento y hábitos», período analizado, fecha y el **Resumen**.",
    "Cada apartado empieza con su título; un título nunca queda solo al final de una página.",
    "Gráficos y tablas no se parten entre páginas; si no caben, pasan enteros a la siguiente. Ajusta su tamaño al ancho de la página, con ejes, unidades y etiquetas legibles al imprimir.",
    "Colores que se distingan también en blanco y negro (o con tramas o etiquetas). Fondo blanco.",
    "Pie de la última página: «Análisis hecho por IA con datos de Usus. No sustituye el consejo de un profesional sanitario o deportivo.»",
    "El bloque de rutinas ajustadas (abajo) no va en el PDF: va aparte, en tu respuesta, para copiarlo."],
  rtH: "Rutinas ajustadas (opcional)",
  rtIntro: "Si propones cambios en las rutinas, añade en tu respuesta (no en el PDF) un bloque de código `json` que Usus pueda importar, con este formato exacto:",
  rt: ["Incluye solo las rutinas que cambias, completas (todos sus ejercicios, no solo los que cambian).",
    "Copia sin cambios el `oid` de la rutina original: así la persona puede actualizarla en vez de duplicarla. Para una rutina nueva, quita `oid`.",
    "`type`: \"reps\" o \"time\" (`reps` son segundos si es \"time\"). `sides`: true si se cuenta por lado. `rest`: segundos de descanso entre series (opcional). `days`: 0 domingo … 6 sábado.",
    "`xid`: copia el del ejercicio original si existe; en ejercicios nuevos, quítalo.",
    "Explica antes del bloque qué cambias y por qué. Si no propones cambios en las rutinas, no añadas el bloque."],
  insteadOf: "en lugar de", data: "Datos", exported: "Exportado", period: "Período", weeks: n => `${n} semanas`,
  profile: "Perfil", woman: "Mujer", man: "Hombre", years: n => `${n} años`, noBasic: "Sin datos básicos",
  exp: "Experiencia", sports: "Otros deportes o actividad", inj: "Lesiones o cirugías previas", pain: "Dolores o molestias actuales",
  cond: "Condiciones de salud relevantes", meds: "Medicación relevante", goals: "Objetivos", other: "Otros", noneF: "ninguna indicada", noneM: "ninguno indicado",
  levels: { new: "principiante (menos de 6 meses)", basic: "básico (6 meses–2 años)", mid: "intermedio (2–5 años)", adv: "avanzado (más de 5 años o competición)" },
  routines: "Rutinas actuales", variant: "variante", days: "días", all: "todos", perSide: "por lado", rest: "desc", dayL: ["D", "L", "M", "X", "J", "V", "S"],
  plan: "Plan", start: "Inicio", review: "revisión", phases: "fases", wk: "sem", repeat: "(se repiten)", deload: "descarga", no: "no", every: "cada",
  goalW: (a, b) => `Objetivo semanal: ${a} días de fuerza, ${b} días de rutina diaria`,
  sessions: n => `Sesiones (${n})`, sessFmt: "Formato: fecha hora · rutina · minutos · PEM (esfuerzo 1–10) | ejercicio (en lugar de…, si se cambió en la sesión): series (reps, o s si es por tiempo; izq/der si es por lado; @kg = lastre; (n) = RIR, repeticiones en reserva) ✎ nota", free: "libre",
  weight: "Peso (kg)", goal: "objetivo", noRec: "Sin registros en el período", supps: "Suplementos", diary: "Diario", fmt: "Formato: fecha",
  colSleep: "sueño (acostarse–levantarse, calidad 1–5)", colSteps: "pasos", colSupp: "suplementos tomados", colNotes: "etiquetas y nota", colCyc: "ciclo (sangrado, síntomas)", none: "ninguno",
  tags: { skip: "no entrené", pain: "molestia", tired: "cansado", great: "gran sesión" }, flow: { l: "leve", m: "moderada", h: "abundante" },
  acts: "Actividades", periods: n => `Reglas (últimas ${n}, también anteriores al período para ver la regularidad)`, paused: "Seguimiento en pausa desde",
  csv: { tech: "tecnica", pem: "pem", load: "carga", rir: "rir", from: "en_lugar_de", date: "fecha", time: "hora", routine: "rutina", block: "bloque", dur: "duracion_min", ex: "ejercicio", xid: "id_catalogo", type: "tipo", side: "por_lado", set: "serie", val: "reps_o_seg", r2: "reps_der", kg: "lastre_kg",
    id: "id", variant: "variante", days: "dias", order: "orden", sets: "series", target: "objetivo", rest: "descanso_s",
    bed: "acostarse", wake: "levantarse", sleepH: "horas_sueno", q: "calidad_sueno", steps: "pasos", tags: "etiquetas", note: "nota",
    supp: "suplemento", taken: "tomado", amount: "cantidad", unit: "unidad", when: "momento", wkg: "kg", atype: "tipo", km: "km", min: "minutos",
    s: "inicio", e: "fin", plen: "dias_regla", clen: "dias_hasta_la_siguiente", flow: "sangrado", sym: "sintomas", yes: "sí", no: "no", tTime: "tiempo", tReps: "reps",
    files: { sesiones: "sesiones", rutinas: "rutinas", diario: "diario", suplementos: "suplementos", peso: "peso", actividades: "actividades", ciclo_reglas: "ciclo_reglas", ciclo_dias: "ciclo_dias" },
    readme: "LEEME", head: "Usus · datos exportados en CSV", all: "todo el historial", last: n => `últimas ${n} semanas`,
    fmtEs: "separador ; y coma decimal (Excel en castellano o català)", fmtIntl: "separador , y punto decimal", enc: "UTF-8 · fechas AAAA-MM-DD", priv: "Tus datos, solo tuyos: este archivo no se ha enviado a ningún sitio.",
    desc: { sesiones: "Una fila por serie hecha. pem: esfuerzo percibido de la sesión (1–10); carga = pem × minutos. reps_o_seg son segundos si tipo = tiempo. reps_der solo en ejercicios por lado (reps_o_seg = izquierdo). rir: repeticiones en reserva (4 = 4 o más). en_lugar_de: ejercicio de la rutina sustituido en esa sesión. nota: en la primera serie de cada ejercicio. id_catalogo: identificador fijo del catálogo de Usus, si el ejercicio está vinculado (sirve para agrupar aunque cambie el nombre).",
      rutinas: "Rutinas actuales, una fila por ejercicio. objetivo: repeticiones o segundos. dias: L M X J V S D.", diario: "Una fila por día con algún dato. horas_sueno, de acostarse a levantarse. calidad_sueno de 1 a 5.",
      suplementos: "Una fila por suplemento y día registrado.", peso: "Registros de peso.", actividades: "Caminar, correr, bici… con distancia y tiempo.",
      ciclo_reglas: "Cada regla: inicio, fin, duración y días hasta la siguiente (= duración del ciclo).", ciclo_dias: "Días con sangrado o síntomas registrados." } }
},
ca: {
  title: "Anàlisi d'entrenament i hàbits · Usus",
  intro: fem => `Ets un entrenador de força i calistènia amb bona base en fisiologia de l'exercici, recuperació i hàbits${fem ? " i coneixement del cicle menstrual i la seva relació amb el rendiment" : ""}. A sota tens els registres d'una persona exportats des d'Usus, una app d'entrenament que desa les dades només al seu mòbil. Analitza'ls i prepara-li un informe útil.`,
  rulesH: "Regles",
  rules: fem => [
    `No ets metge i això no és un diagnòstic. No diagnostiquis ni anomenis malalties a partir de les dades. Si veus alguna cosa que mereixi consulta (dolor que es repeteix, pèrdua de pes ràpida o no buscada, son molt alterat${fem ? ", cicles molt irregulars, regles molt abundants o absència de regla" : ""}…), digues-ho amb claredat i recomana anar a un professional sanitari.`,
    "Interpreta-ho tot a la llum del perfil i els antecedents: els mateixos números signifiquen coses diferents en algú amb anys d'entrenament que en algú que comença o que té una lesió. Ajusta l'exigència i les recomanacions a això.",
    "Separa el que diuen les dades del que suposes. Si alguna cosa és una hipòtesi, digues-ho.",
    "No registrar no sempre vol dir no fer: si hi ha buits, tingues-ho en compte i no en treguis conclusions fortes.",
    "Sigues concret: cita dates, exercicis i xifres. Res de consells genèrics que servirien per a qualsevol.",
    "Escriu en català, amb un to clar i proper."],
  formH: "Forma: gràfics primer, text breu",
  form: fem => [
    "Mostra l'evolució amb **gràfics** sempre que els puguis generar (amb codi, una eina de gràfics o un document interactiu). Com a mínim:",
    "  - progressió de 3–5 exercicis principals (millor sèrie per sessió, davant l'objectiu de la rutina);",
    "  - volum setmanal (sèries o repeticions per setmana) i dies entrenats davant els planificats;",
    "  - pes en el temps, si hi ha dades;",
    "  - son: hores per nit i la mitjana setmanal;",
    ...(fem ? ["  - cicle: dies de regla i símptomes sobre el calendari, al costat dels entrenaments;"] : []),
    "Si no pots fer gràfics, fes servir taules compactes o barres de text (▁▂▃▄▅▆▇█).",
    "No repeteixis en text el que ja mostra un gràfic o una taula: comenta només què vol dir.",
    "Sigues breu: frases curtes, sense introduccions ni resums repetits. Cada apartat, el just; si no hi ha res rellevant, digues-ho en una línia."],
  repH: "Informe",
  rep: fem => [
    "**Resum**: 3–5 punts amb el més important.",
    "**Constància i progressió**: freqüència real davant la planificada, exercicis que progressen, s'estanquen o retrocedeixen, i si el volum és raonable per al seu nivell.",
    "**Recuperació**: son (hores, regularitat, qualitat) i la relació amb els entrenaments i les molèsties anotades.",
    "**Pes**: tendència i si encaixa amb els seus objectius.",
    "**Suplements**: constància de les preses. Comenta'n la utilitat només si hi ha bona evidència; no recomanis suplements nous.",
    "**Activitat diària**: passos i altres activitats.",
    ...(fem ? ["**Cicle**: durada i regularitat, símptomes registrats i si el rendiment, el son o les molèsties canvien segons la fase. Sense conclusions fortes amb pocs cicles."] : []),
    "**Senyals a vigilar**: el que convé observar o consultar amb un professional, i per què.",
    "**Ajustos per a les properes setmanes**: 3–6 canvis concrets i realistes (exercicis, sèries, repeticions, descansos, dies, hàbits), coherents amb els antecedents.",
    "**Preguntes**: el que et falta saber per afinar l'anàlisi."],
  pdfH: "Lliurament: PDF per imprimir en A4",
  pdf: ["Lliura l'informe com a **PDF A4 vertical**, a punt per imprimir. Si no pots crear arxius, prepara un document (HTML o similar) amb aquestes mateixes regles perquè la persona l'imprimeixi o el desi com a PDF.",
    "Marges d'uns 2 cm, lletra de 10–11 pt, interlineat còmode. Números de pàgina al peu.",
    "Primera pàgina: títol «Informe d'entrenament i hàbits», període analitzat, data i el **Resum**.",
    "Cada apartat comença amb el seu títol; un títol mai queda sol al final d'una pàgina.",
    "Gràfics i taules no es parteixen entre pàgines; si no hi caben, passen sencers a la següent. Ajusta'n la mida a l'amplada de la pàgina, amb eixos, unitats i etiquetes llegibles en imprimir.",
    "Colors que es distingeixin també en blanc i negre (o amb trames o etiquetes). Fons blanc.",
    "Peu de l'última pàgina: «Anàlisi feta per IA amb dades d'Usus. No substitueix el consell d'un professional sanitari o esportiu.»",
    "El bloc de rutines ajustades (a sota) no va al PDF: va a part, a la teva resposta, per copiar-lo."],
  rtH: "Rutines ajustades (opcional)",
  rtIntro: "Si proposes canvis a les rutines, afegeix a la teva resposta (no al PDF) un bloc de codi `json` que Usus pugui importar, amb aquest format exacte:",
  rt: ["Inclou només les rutines que canvies, completes (tots els exercicis, no només els que canvien).",
    "Copia sense canvis l'`oid` de la rutina original: així la persona la pot actualitzar en lloc de duplicar-la. Per a una rutina nova, treu `oid`.",
    "`type`: \"reps\" o \"time\" (`reps` són segons si és \"time\"). `sides`: true si es compta per costat. `rest`: segons de descans entre sèries (opcional). `days`: 0 diumenge … 6 dissabte.",
    "`xid`: copia el de l'exercici original si existeix; als exercicis nous, treu-lo.",
    "Explica abans del bloc què canvies i per què. Si no proposes canvis a les rutines, no afegeixis el bloc."],
  insteadOf: "en lloc de", data: "Dades", exported: "Exportat", period: "Període", weeks: n => `${n} setmanes`,
  profile: "Perfil", woman: "Dona", man: "Home", years: n => `${n} anys`, noBasic: "Sense dades bàsiques",
  exp: "Experiència", sports: "Altres esports o activitat", inj: "Lesions o cirurgies prèvies", pain: "Dolors o molèsties actuals",
  cond: "Condicions de salut rellevants", meds: "Medicació rellevant", goals: "Objectius", other: "Altres", noneF: "cap d'indicada", noneM: "cap d'indicat",
  levels: { new: "principiant (menys de 6 mesos)", basic: "bàsic (6 mesos–2 anys)", mid: "intermedi (2–5 anys)", adv: "avançat (més de 5 anys o competició)" },
  routines: "Rutines actuals", variant: "variant", days: "dies", all: "tots", perSide: "per costat", rest: "desc", dayL: ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"],
  plan: "Pla", start: "Inici", review: "revisió", phases: "fases", wk: "setm", repeat: "(es repeteixen)", deload: "descàrrega", no: "no", every: "cada",
  goalW: (a, b) => `Objectiu setmanal: ${a} dies de força, ${b} dies de rutina diària`,
  sessions: n => `Sessions (${n})`, sessFmt: "Format: data hora · rutina · minuts · PEM (esforç 1–10) | exercici (en lloc de…, si es va canviar a la sessió): sèries (reps, o s si és per temps; esq/dre si és per costat; @kg = llast; (n) = RIR, repeticions en reserva) ✎ nota", free: "lliure",
  weight: "Pes (kg)", goal: "objectiu", noRec: "Sense registres en el període", supps: "Suplements", diary: "Diari", fmt: "Format: data",
  colSleep: "son (anar a dormir–llevar-se, qualitat 1–5)", colSteps: "passos", colSupp: "suplements presos", colNotes: "etiquetes i nota", colCyc: "cicle (sagnat, símptomes)", none: "cap",
  tags: { skip: "no vaig entrenar", pain: "molèstia", tired: "cansat", great: "gran sessió" }, flow: { l: "lleu", m: "moderat", h: "abundant" },
  acts: "Activitats", periods: n => `Regles (últimes ${n}, també anteriors al període per veure'n la regularitat)`, paused: "Seguiment en pausa des de",
  csv: { tech: "tecnica", pem: "pem", load: "carrega", rir: "rir", from: "en_lloc_de", date: "data", time: "hora", routine: "rutina", block: "bloc", dur: "durada_min", ex: "exercici", xid: "id_cataleg", type: "tipus", side: "per_costat", set: "serie", val: "reps_o_seg", r2: "reps_dre", kg: "llast_kg",
    id: "id", variant: "variant", days: "dies", order: "ordre", sets: "series", target: "objectiu", rest: "descans_s",
    bed: "anar_a_dormir", wake: "llevar_se", sleepH: "hores_son", q: "qualitat_son", steps: "passos", tags: "etiquetes", note: "nota",
    supp: "suplement", taken: "pres", amount: "quantitat", unit: "unitat", when: "moment", wkg: "kg", atype: "tipus", km: "km", min: "minuts",
    s: "inici", e: "fi", plen: "dies_regla", clen: "dies_fins_a_la_seguent", flow: "sagnat", sym: "simptomes", yes: "sí", no: "no", tTime: "temps", tReps: "reps",
    files: { sesiones: "sessions", rutinas: "rutines", diario: "diari", suplementos: "suplements", peso: "pes", actividades: "activitats", ciclo_reglas: "cicle_regles", ciclo_dias: "cicle_dies" },
    readme: "LLEGEIX-ME", head: "Usus · dades exportades en CSV", all: "tot l'historial", last: n => `últimes ${n} setmanes`,
    fmtEs: "separador ; i coma decimal (Excel en català o castellà)", fmtIntl: "separador , i punt decimal", enc: "UTF-8 · dates AAAA-MM-DD", priv: "Les teves dades, només teves: aquest arxiu no s'ha enviat enlloc.",
    desc: { sesiones: "Una fila per sèrie feta. pem: esforç percebut de la sessió (1–10); carrega = pem × minuts. reps_o_seg són segons si tipus = temps. reps_dre només en exercicis per costat (reps_o_seg = esquerre). rir: repeticions en reserva (4 = 4 o més). en_lloc_de: exercici de la rutina substituït en aquella sessió. nota: a la primera sèrie de cada exercici. id_cataleg: identificador fix del catàleg d'Usus, si l'exercici està vinculat.",
      rutinas: "Rutines actuals, una fila per exercici. objectiu: repeticions o segons. dies: Dl Dt Dc Dj Dv Ds Dg.", diario: "Una fila per dia amb alguna dada. hores_son, d'anar a dormir a llevar-se. qualitat_son de 1 a 5.",
      suplementos: "Una fila per suplement i dia registrat.", peso: "Registres de pes.", actividades: "Caminar, córrer, bici… amb distància i temps.",
      ciclo_reglas: "Cada regla: inici, fi, durada i dies fins a la següent (= durada del cicle).", ciclo_dias: "Dies amb sagnat o símptomes registrats." } }
},
en: {
  title: "Training and habits analysis · Usus",
  intro: fem => `You are a strength and calisthenics coach with a solid grounding in exercise physiology, recovery and habits${fem ? ", and knowledge of the menstrual cycle and how it relates to performance" : ""}. Below are one person's records exported from Usus, a training app that keeps data only on their phone. Analyse them and write a useful report.`,
  rulesH: "Rules",
  rules: fem => [
    `You are not a doctor and this is not a diagnosis. Don't diagnose or name conditions from the data. If something deserves a check-up (recurring pain, fast or unintended weight loss, badly disrupted sleep${fem ? ", very irregular cycles, very heavy periods or missed periods" : ""}…), say so clearly and recommend seeing a health professional.`,
    "Read everything in light of the profile and history: the same numbers mean different things for someone with years of training than for a beginner or someone with an injury. Adjust demands and recommendations accordingly.",
    "Separate what the data shows from what you assume. If something is a hypothesis, say so.",
    "Not logging doesn't always mean not doing: if there are gaps, keep that in mind and don't draw strong conclusions from them.",
    "Be specific: quote dates, exercises and numbers. No generic advice that would fit anyone.",
    "Write in English, in a clear and friendly tone."],
  formH: "Format: charts first, short text",
  form: fem => [
    "Show trends with **charts** whenever you can generate them (with code, a charting tool or an interactive document). At least:",
    "  - progression of 3–5 main exercises (best set per session, against the routine's target);",
    "  - weekly volume (sets or reps per week) and days trained against days planned;",
    "  - weight over time, if there is data;",
    "  - sleep: hours per night and the weekly average;",
    ...(fem ? ["  - cycle: period days and symptoms on the calendar, alongside the workouts;"] : []),
    "If you can't make charts, use compact tables or text bars (▁▂▃▄▅▆▇█) instead.",
    "Don't repeat in text what a chart or table already shows: only comment on what it means.",
    "Be brief: short sentences, no introductions or repeated summaries. Each section, only what's needed; if there's nothing relevant, say so in one line."],
  repH: "Report",
  rep: fem => [
    "**Summary**: 3–5 key points.",
    "**Consistency and progression**: actual frequency against planned, exercises that progress, stall or regress, and whether the volume suits their level.",
    "**Recovery**: sleep (hours, regularity, quality) and how it relates to workouts and logged discomfort.",
    "**Weight**: trend and whether it fits their goals.",
    "**Supplements**: how consistently they're taken. Only comment on usefulness where the evidence is good; don't recommend new supplements.",
    "**Daily activity**: steps and other activities.",
    ...(fem ? ["**Cycle**: length and regularity, logged symptoms, and whether performance, sleep or discomfort change with the phase. No strong conclusions from few cycles."] : []),
    "**Things to watch**: what's worth keeping an eye on or checking with a professional, and why.",
    "**Adjustments for the coming weeks**: 3–6 specific, realistic changes (exercises, sets, reps, rests, days, habits), consistent with their history.",
    "**Questions**: what you still need to know to refine the analysis."],
  pdfH: "Delivery: printable A4 PDF",
  pdf: ["Deliver the report as an **A4 portrait PDF**, ready to print. If you can't create files, prepare a document (HTML or similar) following the same rules so the person can print it or save it as PDF.",
    "Margins of about 2 cm, 10–11 pt text, comfortable line spacing. Page numbers in the footer.",
    "First page: the title “Training and habits report”, the period analysed, the date and the **Summary**.",
    "Each section starts with its heading; a heading is never left alone at the bottom of a page.",
    "Charts and tables are never split across pages; if they don't fit, they move whole to the next page. Size them to the page width, with axes, units and labels readable in print.",
    "Colours that also work in black and white (or use patterns or labels). White background.",
    "Footer on the last page: “Analysis by AI using Usus data. It doesn't replace advice from a health or sports professional.”",
    "The adjusted routines block (below) doesn't go in the PDF: put it separately in your reply so it can be copied."],
  rtH: "Adjusted routines (optional)",
  rtIntro: "If you suggest routine changes, add to your reply (not to the PDF) a `json` code block that Usus can import, in exactly this format:",
  rt: ["Include only the routines you change, complete (all their exercises, not just the changed ones).",
    "Copy the original routine's `oid` unchanged: that way the person can update it instead of duplicating it. For a new routine, leave out `oid`.",
    "`type`: \"reps\" or \"time\" (`reps` are seconds when \"time\"). `sides`: true if counted per side. `rest`: rest between sets in seconds (optional). `days`: 0 Sunday … 6 Saturday.",
    "`xid`: copy the original exercise's if there is one; leave it out for new exercises.",
    "Explain before the block what you change and why. If you don't suggest routine changes, don't add the block."],
  insteadOf: "instead of", data: "Data", exported: "Exported", period: "Period", weeks: n => `${n} weeks`,
  profile: "Profile", woman: "Woman", man: "Man", years: n => `${n} years old`, noBasic: "No basic data",
  exp: "Experience", sports: "Other sports or activity", inj: "Past injuries or surgery", pain: "Current pain or discomfort",
  cond: "Relevant health conditions", meds: "Relevant medication", goals: "Goals", other: "Other", noneF: "none given", noneM: "none given",
  levels: { new: "beginner (under 6 months)", basic: "basic (6 months–2 years)", mid: "intermediate (2–5 years)", adv: "advanced (over 5 years or competing)" },
  routines: "Current routines", variant: "variant", days: "days", all: "every day", perSide: "per side", rest: "rest", dayL: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  plan: "Plan", start: "Start", review: "review", phases: "phases", wk: "wk", repeat: "(repeating)", deload: "deload", no: "no", every: "every",
  goalW: (a, b) => `Weekly goal: ${a} strength days, ${b} daily-routine days`,
  sessions: n => `Sessions (${n})`, sessFmt: "Format: date time · routine · minutes · RPE (effort 1–10) | exercise (instead of…, if swapped in the session): sets (reps, or s if timed; left/right if per side; @kg = added weight; (n) = RIR, reps in reserve) ✎ note", free: "free",
  weight: "Weight (kg)", goal: "goal", noRec: "No entries in the period", supps: "Supplements", diary: "Diary", fmt: "Format: date",
  colSleep: "sleep (bed–wake, quality 1–5)", colSteps: "steps", colSupp: "supplements taken", colNotes: "tags and note", colCyc: "cycle (bleeding, symptoms)", none: "none",
  tags: { skip: "didn't train", pain: "discomfort", tired: "tired", great: "great session" }, flow: { l: "light", m: "medium", h: "heavy" },
  acts: "Activities", periods: n => `Periods (last ${n}, including before the period to show regularity)`, paused: "Tracking paused since",
  csv: { tech: "technique", pem: "rpe", load: "load", rir: "rir", from: "instead_of", date: "date", time: "time", routine: "routine", block: "block", dur: "duration_min", ex: "exercise", xid: "catalogue_id", type: "type", side: "per_side", set: "set", val: "reps_or_sec", r2: "reps_right", kg: "weight_kg",
    id: "id", variant: "variant", days: "days", order: "order", sets: "sets", target: "target", rest: "rest_s",
    bed: "bedtime", wake: "wake_time", sleepH: "sleep_hours", q: "sleep_quality", steps: "steps", tags: "tags", note: "note",
    supp: "supplement", taken: "taken", amount: "amount", unit: "unit", when: "when", wkg: "kg", atype: "type", km: "km", min: "minutes",
    s: "start", e: "end", plen: "period_days", clen: "days_to_next", flow: "bleeding", sym: "symptoms", yes: "yes", no: "no", tTime: "time", tReps: "reps",
    files: { sesiones: "sessions", rutinas: "routines", diario: "diary", suplementos: "supplements", peso: "weight", actividades: "activities", ciclo_reglas: "cycle_periods", ciclo_dias: "cycle_days" },
    readme: "README", head: "Usus · data exported as CSV", all: "full history", last: n => `last ${n} weeks`,
    fmtEs: "; separator and decimal comma", fmtIntl: ", separator and decimal point", enc: "UTF-8 · dates YYYY-MM-DD", priv: "Your data, only yours: this file hasn't been sent anywhere.",
    desc: { sesiones: "One row per completed set. rpe: session rating of perceived exertion (1–10); load = rpe × minutes. reps_or_sec are seconds when type = time. reps_right only for per-side exercises (reps_or_sec = left). rir: reps in reserve (4 = 4 or more). instead_of: routine exercise swapped out in that session. note: on each exercise's first set. catalogue_id: fixed Usus catalogue id, if the exercise is linked.",
      rutinas: "Current routines, one row per exercise. target: reps or seconds. days: Mo Tu We Th Fr Sa Su.", diario: "One row per day with any data. sleep_hours, from bedtime to wake time. sleep_quality from 1 to 5.",
      suplementos: "One row per supplement and logged day.", peso: "Weight entries.", actividades: "Walking, running, cycling… with distance and time.",
      ciclo_reglas: "Each period: start, end, length and days to the next one (= cycle length).", ciclo_dias: "Days with logged bleeding or symptoms." } }
}
};
const XL = () => XT[LANG] || XT.es;
