/* ---------- Análisis con IA externa y datos en CSV (2.1) ----------
   Usus no envía nada: genera un texto (prompt + datos) que la persona copia o comparte, o un .zip con tablas CSV.
   Datos para el análisis (opcionales, por perfil): wk.aiProf = {birth, height, level, years, injuries, pains, conditions, meds, goals, other}.
   Solo se guardan si se marca «Guardar para próximas exportaciones»; en el texto sale la edad, nunca la fecha de nacimiento. */
const AI_LEVELS = [["new", "Empiezo (menos de 6 meses)"], ["basic", "Básico (6 meses–2 años)"], ["mid", "Intermedio (2–5 años)"], ["adv", "Avanzado (más de 5 años o competición)"]];
const AI_INC = [["train", "Entrenos, rutinas y plan"], ["weight", "Peso"], ["sleep", "Sueño"], ["supp", "Suplementos"], ["act", "Pasos y actividades"], ["notes", "Notas y etiquetas del diario"], ["cycle", "Ciclo (reglas y síntomas)"]];
const AI_F = [["years", "Detalle de la experiencia y otros deportes", "Ej. 2 años de calistenia, antes fútbol", 0], ["injuries", "Lesiones o cirugías previas", "Ej. rotura de menisco izquierdo (2019)", 1],
  ["pains", "Dolores o molestias actuales", "Ej. lumbar al levantarme por la mañana", 1], ["conditions", "Condiciones de salud relevantes", "Ej. asma, hipertensión, embarazo…", 1],
  ["meds", "Medicación relevante", "Solo si influye en el entreno o la recuperación", 0], ["goals", "Objetivos", "Ej. 10 dominadas, perder 3 kg, dormir mejor", 1], ["other", "Otros", "Lo que quieras que la IA tenga en cuenta", 1]];
const aiProf = () => LS.get("wk.aiProf", null);
const ageOf = b => { if (!/^\d{4}-\d{2}-\d{2}$/.test(b || "")) return null; const d = new Date(b), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a > 0 && a < 120 ? a : null; };
const hmOf = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const cycAvail = () => curProf().sex !== "m" && CYC.list().length > 0;
function aiFields(f, pre) {
  const v = k => esc(f[k] || "");
  return `<div class="aitwo"><div><label class="muted" for="${pre}birth">${T("Fecha de nacimiento")}</label><input type="date" id="${pre}birth" value="${v("birth")}"></div>
      <div><label class="muted" for="${pre}height">${T("Altura (cm)")}</label><input type="number" id="${pre}height" min="80" max="250" inputmode="numeric" value="${v("height")}"></div></div>
    <label class="muted" for="${pre}level">${T("Experiencia entrenando")}</label><select id="${pre}level"><option value="">—</option>${AI_LEVELS.map(([k, n]) => `<option value="${k}" ${f.level === k ? "selected" : ""}>${T(n)}</option>`).join("")}</select>
    ${AI_F.map(([k, n, ph, big]) => `<label class="muted" for="${pre}${k}">${T(n)}</label>${big ? `<textarea id="${pre}${k}" rows="2" maxlength="400" placeholder="${T(ph)}">${v(k)}</textarea>` : `<input type="text" id="${pre}${k}" maxlength="200" placeholder="${T(ph)}" value="${v(k)}">`}`).join("")}`;
}
function readAiFields(pre) {
  const g = id => document.getElementById(pre + id); if (!g("birth")) return null;
  const f = { birth: g("birth").value, height: Math.round(+g("height").value) || "", level: g("level").value };
  AI_F.forEach(([k]) => { f[k] = (g(k)?.value || "").trim(); });
  return f;
}
const aiHasData = f => !!f && Object.values(f).some(x => x !== "" && x !== null && x !== undefined);
function readAiForm() { const a = state.ai; if (!a || a.step !== 1) return; const f = readAiFields("ai_"); if (f) a.f = f; const s = $("#aiSave"); if (s) a.save = s.checked; AI_INC.forEach(([k]) => { const c = $(`#aiInc_${k}`); if (c) a.inc[k] = c.checked; }); }
function aiModal() {
  const a = state.ai; if (!a) return "";
  const fem = curProf().sex !== "m";
  if (a.step === 2) {
    const kb = (new Blob([a.txt]).size / 1024).toLocaleString(LOC(), { maximumFractionDigits: 1 });
    return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="aiT"><div class="mbox dsh full"><button class="back" data-act="ai-close">‹ ${T("Atrás")}</button>
      <div class="sb-head"><h2 id="aiT" style="margin:0;flex:1">${T("Analizar con IA externa")}</h2><button class="btn small" data-act="ai-close">${T("Cerrar")}</button></div>
      <p class="aistep">${T("1 Datos")} → <b>${T("2 Exportar")}</b></p>
      <p class="muted" style="font-size:.85rem;margin:8px 0 6px">${T("{n} líneas · {k} KB · {w}", { n: a.txt.split("\n").length, k: kb, w: a.weeks ? T("{n} semanas", { n: a.weeks }) : T("Todo") })}</p>
      <pre class="aipre">${esc(a.txt.slice(0, 1800))}…</pre>
      <div class="row" style="margin-top:10px"><button class="btn primary" style="flex:1" data-act="ai-copy">${T("Copiar")}</button><button class="btn" style="flex:1" data-act="ai-file">${T("Exportar .txt")}</button></div>
      <p class="muted" style="font-size:.85rem;margin:10px 0 0">${T("Pégalo en una conversación nueva de la IA que uses, o sube el archivo .txt. Si es muy largo para tu IA, prueba con menos semanas.")}</p>
      <h3 class="wh">${T("Cuando la IA responda")}</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 6px">${T("Si te propone rutinas ajustadas, copia su respuesta completa y pégala aquí. Usus solo lee el bloque de rutinas y te deja elegir cuáles actualizar.")}</p>
      <textarea id="aiPaste" rows="3" placeholder="${T("Pega aquí la respuesta de la IA")}"></textarea>
      <button class="btn" style="width:100%;margin-top:8px" data-act="ai-paste">${T("Revisar rutinas propuestas")}</button>
      <button class="btn ghost" style="width:100%;margin-top:4px" data-act="ai-back">‹ ${T("Volver a los datos")}</button>
    </div></div>`;
  }
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="aiT"><div class="mbox dsh full"><button class="back" data-act="ai-close">‹ ${T("Atrás")}</button>
    <div class="sb-head"><h2 id="aiT" style="margin:0;flex:1">${T("Analizar con IA externa")}</h2><button class="btn small" data-act="ai-close">${T("Cerrar")}</button></div>
    <p class="aistep"><b>${T("1 Datos")}</b> → ${T("2 Exportar")}</p>
    <h3 class="wh">${T("Período")}</h3>
    <div class="chips">${[4, 8, 12, 26, 0].map(w => `<button data-aiw="${w}" class="${a.weeks === w ? "on" : ""}" aria-pressed="${a.weeks === w}">${w ? T("{n} semanas", { n: w }) : T("Todo")}</button>`).join("")}</div>
    <h3 class="wh">${T("Incluir")}</h3>
    ${AI_INC.filter(([k]) => k !== "cycle" || cycAvail()).map(([k, n]) => `<label class="chk aichk"><input type="checkbox" id="aiInc_${k}" ${a.inc[k] ? "checked" : ""}> ${T(n)}</label>`).join("")}
    <h3 class="wh">${T("Sobre ti (para interpretar los datos)")}</h3>
    <p class="muted" style="font-size:.85rem;margin:0">${T("Todo opcional, pero ayuda: no es lo mismo 5 flexiones de alguien que empieza que de alguien con dolor lumbar.")} ${T("Sexo: {x} (del perfil).", { x: fem ? T("mujer") : T("hombre") })}</p>
    <div class="aiform">${aiFields(a.f, "ai_")}</div>
    <label class="chk aichk" style="margin-top:10px"><input type="checkbox" id="aiSave" ${a.save ? "checked" : ""}> <span>${T("Guardar para próximas exportaciones")}<small class="muted" style="display:block;font-size:.78rem">${T("En este móvil, en tu perfil. Si no, se usan solo ahora.")}</small></span></label>
    <div class="aiwarn"><b>${T("Vas a compartir datos de salud con un servicio externo")}</b>${T("Lo que pase después depende de la IA que elijas: revisa su política de privacidad. El análisis lo hace una IA, no un profesional sanitario.")}</div>
    <button class="btn primary" style="width:100%;padding:12px" data-act="ai-gen">${T("Generar texto")}</button>
  </div></div>`;
}
function aiCard() {
  return `<div class="panel aicard"><div class="aih">✦ ${T("Analizar con IA externa")} <span class="aibadge">${T("Externa")}</span></div>
    <p class="muted" style="font-size:.88rem;margin:6px 0 0">${T("Usus prepara un texto con tus datos y las instrucciones para que una IA (ChatGPT, Claude, Gemini…) los analice. Usus no envía nada: lo copias o compartes tú.")}</p>
    <button class="btn" style="margin-top:10px" data-act="ai-open">${T("Preparar análisis")}</button></div>`;
}
function aiProfPanel() {
  const f = aiProf(); if (!aiHasData(f)) return "";
  return `<h2>${T("Datos para el análisis con IA")}</h2><div class="panel aiform">${aiFields(f, "ap_")}
    <p class="muted" style="font-size:.8rem;margin:8px 0 0">${T("Solo se usan al preparar un análisis con IA externa (Progreso → Resumen). Van en la copia de seguridad del perfil.")}</p>
    <div class="row" style="margin-top:10px"><button class="btn small primary" data-act="ap-save">${T("Guardar")}</button><button class="btn small danger" data-act="ap-del">${T("Borrar estos datos")}</button></div></div>`;
}
/* El texto */
function aiBuild(o) {
  const X = XL(), now = Date.now(), from = o.weeks ? now - o.weeks * 7 * 864e5 : 0, inP = t => t >= from && t <= now, inK = k => k >= dayKey(from) && k <= dayKey(now);
  const P = o.f || {}, sex = curProf().sex, inc = o.inc, cyc = !!inc.cycle && cycAvail(), fem = cyc, L = [];
  const list = a => a.map(x => `- ${x}`).join("\n");
  L.push(`# ${X.title}`, "", X.intro(fem), "", `## ${X.rulesH}`, list(X.rules(fem)), "", `## ${X.formH}`, X.form(fem).map(x => x.startsWith("  ") ? x : `- ${x}`).join("\n"), "",
    `## ${X.repH}`, X.rep(fem).map((x, i) => `${i + 1}. ${x}`).join("\n"), "", `## ${X.pdfH}`, list(X.pdf), "", `## ${X.rtH}`, X.rtIntro, "```json",
    '{"app":"usus","shared":1,"routines":[{"oid":"…","name":"…","block":"…","variant":"…","days":[1,3],"exercises":[{"name":"…","xid":"…","sets":3,"reps":10,"type":"reps","sides":false,"rest":90}]}]}', "```", list(X.rt), "", "---", "");
  L.push(`# ${X.data}`, `${X.exported}: ${dayKey(now)} · ${X.period}: ${o.weeks ? `${dayKey(from)} → ${dayKey(now)} (${X.weeks(o.weeks)})` : `→ ${dayKey(now)}`}`, "", `## ${X.profile}`);
  const age = ageOf(P.birth);
  L.push([sex === "f" ? X.woman : sex === "m" ? X.man : null, age ? X.years(age) : null, P.height ? `${P.height} cm` : null].filter(Boolean).join(" · ") || X.noBasic);
  if (P.level || P.years) L.push(`${X.exp}: ${[X.levels[P.level], P.years].filter(Boolean).join(" · ")}`);
  L.push(`${X.inj}: ${P.injuries || X.noneF}`, `${X.pain}: ${P.pains || X.noneM}`, `${X.cond}: ${P.conditions || X.noneF}`, `${X.meds}: ${P.meds || X.noneF}`);
  if (P.goals) L.push(`${X.goals}: ${P.goals}`); if (P.other) L.push(`${X.other}: ${P.other}`);
  L.push("");
  if (inc.train) {
    L.push(`## ${X.routines}`);
    state.routines.forEach(r => {
      L.push(`- ${r.name}${normVar(r.variant) ? ` [${X.variant} ${normVar(r.variant)}]` : ""}${(r.days || []).length ? ` · ${X.days} ${r.days.length === 7 ? X.all : WEEK_ORDER.filter(d => r.days.includes(d)).map(d => X.dayL[d]).join(" ")}` : ""} · oid ${r.oid || r.id}`);
      L.push(`  ${r.exercises.map(e => `${exLabel(e)}${e.xid ? ` (${e.xid})` : ""} ${e.sets}×${e.reps}${isTime(e) ? " s" : ""}${e.sides ? ` ${X.perSide}` : ""}${+e.rest > 0 ? ` ${X.rest} ${e.rest}s` : ""}`).join(" | ")}`);
    });
    const p = PL.get();
    if (p?.phases?.length && p.enabled !== false) L.push("", `## ${X.plan}`, `${X.start} ${p.start}${p.review ? ` · ${X.review} ${p.review}` : ""} · ${X.phases} ${p.phases.map(x => `${x.variant}×${x.weeks}${X.wk}`).join(" → ")} ${X.repeat} · ${X.deload} ${p.deload?.weeks && p.deload?.every ? `${p.deload.weeks} ${X.wk} ${X.every} ${p.deload.every}` : X.no}`);
    const g = LS.get("wk.goals", null); if (g && (g.daily || g.strength)) L.push(X.goalW(g.strength || 0, g.daily || 0));
    const S = state.sessions.filter(s => inP(s.start)).sort((a, b) => a.start - b.start);
    L.push("", `## ${X.sessions(S.length)}`, X.sessFmt);
    S.forEach(s => L.push(`${dayKey(s.start)} ${hmOf(s.start)} · ${s.routine || X.free} · ${Math.round((s.end - s.start) / 60000)}${+s.pem ? ` · ${LANG === "en" ? "RPE" : "PEM"} ${s.pem}` : ""} | ${s.exercises.map(e => `${exLabel(e)}${e.from ? ` (${X.insteadOf} ${e.from})` : ""}: ${e.sets.map(x => (sideReps(e) ? `${x.r}/${R2(x)}` : `${x.r}`) + (+x.w ? `@${x.w}` : "") + (rirTxt(x, e) ? `(${rirTxt(x, e)})` : "")).join(",")}${isTime(e) ? " s" : ""}${e.note ? ` ✎ "${String(e.note).replace(/\s+/g, " ")}"` : ""}`).join(" | ")}`));
    L.push("");
  }
  if (inc.weight) { const Wl = W.list().filter(x => inP(x.t)); L.push(`## ${X.weight}${W.goal() ? ` · ${X.goal} ${W.goal()}` : ""}`, Wl.length ? Wl.map(x => `${dayKey(x.t)} ${x.kg}`).join(" · ") : X.noRec, ""); }
  const D = DY.all(), sup = DY.supps(), days = Object.keys(D).filter(inK).sort();
  const cols = [inc.sleep && X.colSleep, inc.act && X.colSteps, inc.supp && sup.length && X.colSupp, inc.notes && X.colNotes, cyc && X.colCyc].filter(Boolean);
  if (cols.length) {
    if (inc.supp && sup.length) L.push(`## ${X.supps}`, sup.filter(s => !s.archived).map(s => `${s.name} ${s.dose || ""}${s.unit || ""}${s.when ? ` (${s.when})` : ""}`.trim()).join(" · "), "");
    L.push(`## ${X.diary}`, `${X.fmt} | ${cols.join(" | ")}`);
    days.forEach(k => {
      const e = D[k], f = [];
      if (inc.sleep) f.push(e.sleep?.bed && e.sleep?.wake ? `${e.sleep.bed}–${e.sleep.wake}${e.sleep.q ? ` (${e.sleep.q})` : ""}` : "-");
      if (inc.act) f.push(e.steps ? String(e.steps) : "-");
      if (inc.supp && sup.length) { const tk = sup.filter(s => e.supp?.[s.id]?.taken).map(s => s.name); f.push(tk.length ? tk.join(", ") : X.none); }
      if (inc.notes) f.push([...(e.tags || []).map(t => X.tags[t] || t), e.note ? `"${String(e.note).replace(/\s+/g, " ").trim()}"` : ""].filter(Boolean).join("; ") || "-");
      if (cyc) f.push(e.cyc ? [X.flow[e.cyc.flow], ...(e.cyc.sym || []).map(T)].filter(Boolean).join(", ") || "-" : "-");
      if (f.some(x => x !== "-" && x !== X.none)) L.push(`${k} | ${f.join(" | ")}`);
    });
    L.push("");
  }
  if (inc.act) { const A = ACT.list().filter(a => inK(a.k)).sort((a, b) => a.k < b.k ? -1 : 1); if (A.length) L.push(`## ${X.acts}`, A.map(a => `${a.k} ${a.type}${a.km ? ` ${a.km} km` : ""}${a.min ? ` ${a.min} min` : ""}`).join(" · "), ""); }
  if (cyc) {
    const C = CYC.list().slice(-8); L.push(`## ${X.periods(C.length)}`, C.map(c => `${c.s} → ${c.e || "?"}`).join(" · "));
    const pz = CYC.cfg().pause; if (pz) L.push(`${X.paused} ${pz.since}${pz.reason ? ` (${pz.reason})` : ""}`);
    L.push("");
  }
  return L.join("\n");
}
/* Respuesta de la IA → rutinas compartidas (misma pantalla que un enlace recibido) */
function aiParse(text) {
  const cands = [...String(text).matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map(m => m[1]);
  const i = text.indexOf('{"app"'); if (i >= 0) cands.push(text.slice(i, text.lastIndexOf("}") + 1));
  for (const c of cands) { try { const j = JSON.parse(c.trim()); if (j && j.app === "usus" && Array.isArray(j.routines)) { const inc = sanitizeShared({ ...j, shared: 1 }); if (inc?.routines.length) return inc; } } catch {} }
  return null;
}

/* Datos en CSV: un .zip con una tabla por tipo de dato */
function csvTable(head, rows, es) {
  const sep = es ? ";" : ",";
  const cell = v => { if (v === null || v === undefined) return ""; if (typeof v === "number") { const s = String(Math.round(v * 100) / 100); return es ? s.replace(".", ",") : s; }
    const s = String(v); return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + [head, ...rows].map(r => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}
const sleepHours = (b, w) => { if (!b || !w) return null; const [bh, bm] = b.split(":").map(Number), [wh, wm] = w.split(":").map(Number); let m = wh * 60 + wm - (bh * 60 + bm); if (m <= 0) m += 1440; return m / 60; };
function csvBuild(weeks) {
  const X = XL(), C = X.csv, es = LANG !== "en", now = Date.now(), from = weeks ? now - weeks * 7 * 864e5 : 0, inP = t => t >= from && t <= now, inK = k => k >= dayKey(from) && k <= dayKey(now);
  const yn = b => b ? C.yes : C.no, F = {}, put = (k, head, rows) => { if (rows.length) F[`${C.files[k]}.csv`] = [k, csvTable(head, rows, es)]; };
  const S = state.sessions.filter(s => inP(s.start)).sort((a, b) => a.start - b.start), rows = [];
  S.forEach(s => s.exercises.forEach(e => e.sets.forEach((x, i) => rows.push([dayKey(s.start), hmOf(s.start), s.routine || "", s.block || "", Math.round((s.end - s.start) / 60000), +s.pem || null, sLoad(s) || null, exName(e), e.xid || "", e.xid ? techOf(e) : "", e.from || "", isTime(e) ? C.tTime : C.tReps, yn(e.sides), i + 1, +x.r || 0, sideReps(e) ? +R2(x) || 0 : null, +x.w || 0, x.rir !== undefined && x.rir !== null ? +x.rir : null, i === 0 ? e.note || "" : ""]))));
  put("sesiones", [C.date, C.time, C.routine, C.block, C.dur, C.pem, C.load, C.ex, C.xid, C.tech, C.from, C.type, C.side, C.set, C.val, C.r2, C.kg, C.rir, C.note], rows);
  put("rutinas", [C.routine, C.id, C.block, C.variant, C.days, C.order, C.ex, C.xid, C.tech, C.sets, C.target, C.type, C.side, C.rest],
    state.routines.flatMap(r => r.exercises.map((e, i) => [r.name, r.oid || r.id, r.block || "", normVar(r.variant), WEEK_ORDER.filter(d => (r.days || []).includes(d)).map(d => X.dayL[d]).join(" "), i + 1, exName(e), e.xid || "", e.xid ? techOf(e) : "", +e.sets, +e.reps, isTime(e) ? C.tTime : C.tReps, yn(e.sides), +e.rest || null])));
  const D = DY.all(), days = Object.keys(D).filter(inK).sort();
  put("diario", [C.date, C.bed, C.wake, C.sleepH, C.q, C.steps, C.tags, C.note], days.map(k => { const e = D[k], sl = e.sleep || {}; return [k, sl.bed || "", sl.wake || "", sleepHours(sl.bed, sl.wake), sl.q || null, e.steps || null, (e.tags || []).map(t => X.tags[t] || t).join(", "), e.note || ""]; }).filter(r => r.slice(1).some(v => v !== "" && v !== null)));
  const sup = DY.supps();
  put("suplementos", [C.date, C.supp, C.taken, C.amount, C.unit, C.when, C.note], days.flatMap(k => sup.filter(s => D[k].supp?.[s.id]).map(s => { const x = D[k].supp[s.id]; return [k, s.name, yn(x.taken), x.amount ?? s.dose ?? "", s.unit || "", s.when || "", x.note || ""]; })));
  put("peso", [C.date, C.wkg], W.list().filter(x => inP(x.t)).map(x => [dayKey(x.t), +x.kg]));
  put("actividades", [C.date, C.atype, C.km, C.min, C.note], ACT.list().filter(a => inK(a.k)).sort((a, b) => a.k < b.k ? -1 : 1).map(a => [a.k, a.type, +a.km || null, +a.min || null, a.note || ""]));
  if (cycAvail()) {
    const P = CYC.list(), dd = (a, b) => Math.round((keyTime(b) - keyTime(a)) / 864e5);
    put("ciclo_reglas", [C.s, C.e, C.plen, C.clen], P.map((c, i) => [c.s, c.e || "", c.e ? dd(c.s, c.e) + 1 : null, P[i + 1] ? dd(c.s, P[i + 1].s) : null]));
    put("ciclo_dias", [C.date, C.flow, C.sym], days.filter(k => D[k].cyc && (D[k].cyc.flow || (D[k].cyc.sym || []).length)).map(k => [k, X.flow[D[k].cyc.flow] || "", (D[k].cyc.sym || []).map(T).join(", ")]));
  }
  const out = {}; Object.entries(F).forEach(([n, [, t]]) => { out[n] = t; });
  out[`${C.readme}.txt`] = [C.head, `${X.exported}: ${dayKey(now)} · ${weeks ? C.last(weeks) : C.all}`, `${es ? C.fmtEs : C.fmtIntl} · ${C.enc}`, "",
    ...Object.entries(F).map(([n, [k]]) => `${n.padEnd(20)}${C.desc[k]}`), "", C.priv, ""].join("\n");
  return out;
}
/* ZIP sin compresión («store»): suficiente para texto, sin librerías */
const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function makeZip(files) {
  const enc = new TextEncoder(), now = new Date(), parts = [], cen = []; let off = 0;
  const tm = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF, dt = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  const dv = (n, f) => { const v = new DataView(new ArrayBuffer(n)); f.forEach(([p, x, s]) => s === 4 ? v.setUint32(p, x, true) : v.setUint16(p, x, true)); return new Uint8Array(v.buffer); };
  for (const [name, text] of Object.entries(files)) {
    const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
    parts.push(dv(30, [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, tm, 2], [12, dt, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, nb.length, 2], [28, 0, 2]]), nb, data);
    cen.push(dv(46, [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, tm, 2], [14, dt, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, nb.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]), nb);
    off += 30 + nb.length + data.length;
  }
  const n = Object.keys(files).length, cs = cen.reduce((a, b) => a + b.length, 0);
  const all = [...parts, ...cen, dv(22, [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, n, 2], [10, n, 2], [12, cs, 4], [16, off, 4], [20, 0, 2]])];
  const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; }); return out;
}
function csvModal() {
  const c = state.csvx; if (!c) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cxT"><div class="mbox">
    <h2 id="cxT" style="margin:0 0 4px">${T("Datos en CSV")}</h2>
    <p class="muted" style="margin:0;font-size:.88rem">${T("Un archivo .zip con una tabla por tipo de dato (sesiones, rutinas, diario, suplementos, peso, actividades y ciclo) y un archivo que explica cada columna. Para analizarlos a tu manera en una hoja de cálculo.")}</p>
    <h3 class="wh">${T("Período")}</h3>
    <div class="chips">${[0, 4, 8, 12, 26].map(w => `<button data-cxw="${w}" class="${c.weeks === w ? "on" : ""}" aria-pressed="${c.weeks === w}">${w ? T("{n} semanas", { n: w }) : T("Todo")}</button>`).join("")}</div>
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${LANG === "en" ? T("Formato: separador «,» y punto decimal.") : T("Formato: separador «;» y coma decimal, para abrirlo directamente en Excel en castellano o català.")}</p>
    <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn ghost" data-act="cx-close">${T("Cancelar")}</button><button class="btn primary" data-act="cx-go">${T("Exportar .zip")}</button></div>
  </div></div>`;
}
