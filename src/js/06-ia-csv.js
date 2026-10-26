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
function aiFields(f, pre, noBasic) {
  const v = k => esc(f[k] || "");
  return `${noBasic ? "" : `<div class="aitwo"><div><label class="muted" for="${pre}birth">${T("Fecha de nacimiento")}</label><input type="date" id="${pre}birth" value="${v("birth")}"></div>
      <div><label class="muted" for="${pre}height">${T("Altura (cm)")}</label><input type="number" id="${pre}height" min="80" max="250" inputmode="numeric" value="${v("height")}"></div></div>`}
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
    return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="aiT"><div class="mbox dsh full">${mHead("aiT", `✦ ${T("Analizar con IA externa")} <span class="aibadge">${T("Externa")}</span>`, "ai-close")}
      ${mSteps([T("Datos"), T("Exportar")], 1)}
      <p class="muted" style="font-size:.85rem;margin:8px 0 6px">${T("{n} líneas · {k} KB · {w}", { n: a.txt.split("\n").length, k: kb, w: a.weeks ? T("{n} semanas", { n: a.weeks }) : T("Todo") })}</p>
      <pre class="aipre">${esc(a.txt.slice(0, 1800))}…</pre>
      <div class="row" style="margin-top:10px"><button class="btn primary" style="flex:1" data-act="ai-copy">${T("Copiar")}</button><button class="btn" style="flex:1" data-act="ai-file">${T("Exportar .txt")}</button></div>
      <p class="muted" style="font-size:.85rem;margin:10px 0 0">${T("Pégalo en una conversación nueva de la IA que uses, o sube el archivo .txt. Si es muy largo para tu IA, prueba con menos semanas.")}</p>
      <h3 class="wh">${T("Cuando la IA responda")}</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 6px">${T("Si te propone rutinas ajustadas, copia su respuesta (entera o solo el bloque de código) y toca el botón. Usus solo lee el bloque de rutinas y te deja elegir cuáles actualizar.")}</p>
      <button class="btn" style="width:100%" data-act="ai-clip">${T("Pegar respuesta de la IA")}</button>
      ${canReceiveShare() ? `<p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("También puedes compartirla con Usus desde la app de la IA: menú Compartir → Usus.")}</p>` : ""}
      <details class="aimanual"${state.ai?.manual ? " open" : ""}><summary>${T("O pégala a mano")}</summary>
        <textarea id="aiPaste" rows="3" placeholder="${T("Pega aquí la respuesta de la IA")}"></textarea>
        <button class="btn" style="width:100%;margin-top:8px" data-act="ai-paste">${T("Revisar rutinas propuestas")}</button></details>
      <div class="mfoot"><button class="btn" data-act="ai-back">‹ ${T("Atrás")}</button></div>
    </div></div>`;
  }
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="aiT"><div class="mbox dsh full">${mHead("aiT", `✦ ${T("Analizar con IA externa")} <span class="aibadge">${T("Externa")}</span>`, "ai-close")}
    ${mSteps([T("Datos"), T("Exportar")], 0)}
    <h3 class="wh">${T("Período")}</h3>
    <div class="chips">${[4, 8, 12, 26, 0].map(w => `<button data-aiw="${w}" class="${a.weeks === w ? "on" : ""}" aria-pressed="${a.weeks === w}">${w ? T("{n} semanas", { n: w }) : T("Todo")}</button>`).join("")}</div>
    <h3 class="wh">${T("Incluir")}</h3>
    ${AI_INC.filter(([k]) => k !== "cycle" || cycAvail()).map(([k, n]) => `<label class="chk aichk"><input type="checkbox" id="aiInc_${k}" ${a.inc[k] ? "checked" : ""}> ${T(n)}</label>`).join("")}
    <h3 class="wh">${T("Sobre ti (para interpretar los datos)")}</h3>
    <p class="muted" style="font-size:.85rem;margin:0">${T("Todo opcional, pero ayuda: no es lo mismo 5 flexiones de alguien que empieza que de alguien con dolor lumbar.")} ${T("Sexo: {x} (del perfil).", { x: fem ? T("mujer") : T("hombre") })}</p>
    <div class="aiform">${aiFields(a.f, "ai_")}</div>
    <label class="chk aichk" style="margin-top:10px"><input type="checkbox" id="aiSave" ${a.save ? "checked" : ""}> <span>${T("Guardar para próximas exportaciones")}<small class="muted" style="display:block;font-size:.78rem">${T("En este móvil, en tu perfil. Si no, se usan solo ahora.")}</small></span></label>
    <div class="aiwarn"><b>${T("Vas a compartir datos de salud con un servicio externo")}</b>${T("Lo que pase después depende de la IA que elijas: revisa su política de privacidad. El análisis lo hace una IA, no un profesional sanitario.")}</div>
    <div class="mfoot"><button class="btn primary" data-act="ai-gen">${T("Generar texto")} ›</button></div>
  </div></div>`;
}
function aiCard() {
  return `<div class="panel aicard"><div class="aih">✦ ${T("Analizar con IA externa")} <span class="aibadge">${T("Externa")}</span></div>
    <p class="muted" style="font-size:.88rem;margin:6px 0 0">${T("Usus prepara un texto con tus datos y las instrucciones para que una IA (ChatGPT, Claude, Gemini…) los analice. Usus no envía nada: lo copias o compartes tú.")}</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="ai-open">${T("Preparar análisis")}</button><button class="btn aibtn" data-act="aip-open">✦ ${T("Crear plan con IA")}</button></div></div>`;
}
/* Perfil: datos personales (también para la IA) y peso */
function persPanel() {
  const f = aiProf() || {}, last = W.list().slice(-1)[0], age = ageOf(f.birth), h = +f.height, bmi = last && h ? last.kg / ((h / 100) ** 2) : 0, on = LS.get("wk.weighOn", true) !== false;
  return `<h2>${T("Datos personales")}</h2><div class="lgroup">
    <div class="srow"><label class="t" for="ap_birth">${T("Fecha de nacimiento")}${age ? `<small>${TN(age, "{n} año", "{n} años")}</small>` : ""}</label><input type="date" id="ap_birth" value="${esc(f.birth || "")}" style="width:auto;max-width:55%"></div>
    <div class="srow"><label class="t" for="ap_height">${T("Altura (cm)")}</label><input type="number" id="ap_height" min="80" max="250" inputmode="numeric" value="${esc(f.height || "")}"></div>
    <div class="srow"><span class="t">${T("Peso")}<small>${last ? `${fmtW(last.kg)} · ${new Date(last.t).toLocaleDateString(LOC(), { day: "numeric", month: "short" })}${bmi ? ` · ${T("IMC {x}", { x: fmtNum(bmi) })}` : ""}` : T("Sin registros")}</small></span><button class="btn small" data-act="w-open">${T("Anotar")}</button></div>
    <div class="srow"><label class="t" for="wGoal">${T("Peso objetivo (kg)")}</label><input id="wGoal" type="text" inputmode="decimal" placeholder="—" value="${W.goal() ? fmtNum(W.goal()) : ""}" style="width:84px;text-align:center"></div>
    ${srowS("weighOn", T("Recordarme pesarme"), on, T("Aviso en Hoy hasta que lo anotes esa semana"))}
    ${on ? `<div class="srow"><label class="t" for="wDay">${T("Día de pesaje")}</label><select id="wDay">${[1, 2, 3, 4, 5, 6, 0].map(i => `<option value="${i}" ${W.day() === i ? "selected" : ""}>${DIAS[i]}</option>`).join("")}</select></div>` : ""}
  </div><p class="note">${T("Solo en este dispositivo. La fecha de nacimiento y la altura se usan en el análisis y en el plan con IA.")}</p>`;
}
function aiProfPanel() {
  const f = aiProf() || {};
  return `<details class="panel" style="margin-top:16px"${aiHasData({ ...f, birth: "", height: "" }) ? "" : ""}><summary style="cursor:pointer;font-weight:600">${T("Salud y experiencia (para la IA)")}</summary><div class="aiform" style="margin-top:8px">${aiFields(f, "ap_", true)}
    <p class="muted" style="font-size:.8rem;margin:8px 0 0">${T("Solo se usan al preparar un análisis con IA externa (Progreso → Resumen). Van en la copia de seguridad del perfil.")}</p>
    <div class="row" style="margin-top:10px"><button class="btn small primary" data-act="ap-save">${T("Guardar")}</button><button class="btn small danger" data-act="ap-del">${T("Borrar estos datos")}</button></div></div></details>`;
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
  const i = text.indexOf("{"); if (i >= 0) cands.push(text.slice(i, text.lastIndexOf("}") + 1));   // también el JSON solo (p. ej. copiado con el botón del bloque de código)
  for (const c of cands) { try { const j = JSON.parse(c.trim()); if (j && j.app === "usus" && Array.isArray(j.routines)) { const inc = sanitizeShared({ ...j, shared: 1 }); if (inc?.routines.length) return inc; } } catch {} }
  return null;
}

/* ---------- Crear plan con IA externa (3.1) ----------
   Recoge datos en 4 pasos (salud: los mismos que wk.aiProf; plan: wk.aiPlan si se marca «Recordar mis respuestas»),
   prepara unas indicaciones que no se muestran (se copian o se exportan) con el formato JSON de Usus y el enlace al catálogo.
   La respuesta de la IA se pega y pasa por la misma revisión que las rutinas recibidas (rutinas y plan). */
const CAT_URL = "https://raw.githubusercontent.com/oluengo/usus/main/ejercicios.json";
const AIP_GOALS = [["fuerza", N_("Fuerza")], ["musculo", N_("Ganar músculo")], ["habilidad", N_("Habilidades (dominadas, pino, muscle-up…)")], ["grasa", N_("Perder grasa")], ["salud", N_("Salud y movilidad")], ["resist", N_("Resistencia")]];
const AIP_PLACES = [["casa", N_("Casa")], ["parque", N_("Parque / al aire libre")], ["gym", N_("Gimnasio")], ["varios", N_("Varios sitios")]];
const AIP_ACT = [["", "—"], ["sed", N_("Sedentaria (oficina, coche)")], ["mod", N_("Moderada (de pie, caminar)")], ["act", N_("Activa (trabajo físico)")]];
const AIP_EN = [["bajo", N_("Cansado o con mucho estrés")], ["normal", N_("Normal")], ["alto", N_("Con energía")]];
const AIP_H = ["birth", "height", "level", "years", "injuries", "pains", "conditions", "meds"];   // del perfil para la IA (wk.aiProf); el sexo, del perfil salvo que se cambie aquí
const AIP_P = ["goals", "want", "avoid", "weeks", "style", "days", "mins", "when", "place", "mat", "activity", "other", "energy", "diet", "extra", "sex"];
const aipDef = () => ({ goals: [], want: "", avoid: "", weeks: 8, style: "var", days: [1, 3, 5], mins: 45, when: "", place: "casa", mat: myEquip() || [], activity: "", other: "", energy: "normal", diet: "", extra: "", sex: "" });
const lastKg = () => { const l = W.list(); if (!l.length) return ""; const x = l.reduce((a, b) => (b.t > a.t ? b : a)); return +x.kg ? String(x.kg) : ""; };
function sleepAvg() {
  const D = DY.all(), from = dayKey(Date.now() - 30 * 864e5), h = Object.keys(D).filter(k => k >= from).map(k => sleepHours(D[k].sleep?.bed, D[k].sleep?.wake)).filter(x => x && x < 16);
  if (h.length < 3) return ""; const m = h.reduce((a, b) => a + b, 0) / h.length; return `${Math.floor(m)} h ${String(Math.round((m % 1) * 60)).padStart(2, "0")} min`;
}
function aipOpen() {
  const sv = LS.get("wk.aiPlan", null) || {}, hp = aiProf() || {};
  state.aip = { step: 0, keep: true, inc: { hist: state.sessions.length > 0, mine: state.routines.length > 0 },
    f: { ...aipDef(), ...Object.fromEntries(AIP_P.filter(k => sv[k] !== undefined).map(k => [k, sv[k]])), ...Object.fromEntries(AIP_H.map(k => [k, hp[k] || ""])), sex: sv.sex || curProf().sex || "", weight: lastKg(), sleep: sleepAvg() } };
  render();
}
function readAip() {
  const a = state.aip; if (!a) return; const g = id => document.getElementById("aip_" + id);
  ["birth", "height", "weight", "years", "injuries", "pains", "conditions", "meds", "want", "avoid", "mins", "when", "other", "sleep", "diet", "extra"].forEach(k => { const el = g(k); if (el) a.f[k] = el.value.trim(); });
  ["sex", "level", "place", "activity", "energy"].forEach(k => { const el = g(k); if (el) a.f[k] = el.value; });
  const k = $("#aipKeep"); if (k) a.keep = k.checked; ["hist", "mine"].forEach(x => { const c = $(`#aipInc_${x}`); if (c) a.inc[x] = c.checked; });
}
function aipModal() {
  const a = state.aip; if (!a) return "";
  const f = a.f, st = a.step, v = k => esc(f[k] ?? ""), fem = curProf().sex !== "m";
  const inp = (k, lab, ph = "", t = "text", tag = "") => `<label class="muted" for="aip_${k}">${T(lab)}${tag ? ` <span class="aitag">${T(tag)}</span>` : ""}</label><input type="${t}" id="aip_${k}" value="${v(k)}" ${ph ? `placeholder="${T(ph)}"` : ""} ${t === "number" ? 'inputmode="numeric"' : ""} maxlength="200">`;
  const ta = (k, lab, ph = "") => `<label class="muted" for="aip_${k}">${T(lab)}</label><textarea id="aip_${k}" rows="2" maxlength="400" ${ph ? `placeholder="${T(ph)}"` : ""}>${v(k)}</textarea>`;
  const sel = (k, lab, opts) => `<label class="muted" for="aip_${k}">${T(lab)}</label><select id="aip_${k}">${opts.map(([o, n]) => `<option value="${o}" ${String(f[k]) === String(o) ? "selected" : ""}>${T(n)}</option>`).join("")}</select>`;
  const ch = (k, opts, multi) => `<div class="chips">${opts.map(([o, n]) => { const on = multi ? (f[k] || []).includes(o) : f[k] === o; return `<button data-aipc="${k}" data-v="${o}" class="${on ? "on" : ""}" aria-pressed="${on}">${n}</button>`; }).join("")}</div>`;
  const STEPS = [N_("Sobre ti"), N_("Qué buscas"), N_("Tu semana"), N_("Para la IA")];
  let body = "";
  if (st === 0) body = `<div class="aiwarn"><b>${T("Antes de empezar")}</b>${T("Una IA no es un entrenador ni un profesional sanitario. Si tienes lesiones, dolor, una condición de salud, estás embarazada o hace tiempo que no entrenas, consulta antes con un profesional. Todo es opcional.")}</div>
    <div class="aitwo"><div>${inp("birth", N_("Fecha de nacimiento"), "", "date")}</div><div>${inp("height", N_("Altura (cm)"), "", "number")}</div></div>
    <div class="aitwo"><div>${inp("weight", N_("Peso (kg)"), "", "text", lastKg() && f.weight === lastKg() ? N_("del registro") : "")}</div><div>${sel("sex", N_("Sexo"), [["", "—"], ["m", N_("Hombre")], ["f", N_("Mujer")]])}</div></div>
    ${sel("level", N_("Experiencia entrenando"), [["", "—"], ...AI_LEVELS])}
    ${inp("years", N_("Detalle de la experiencia y otros deportes"), N_("Ej. 2 años de calistenia, antes fútbol"))}
    ${ta("injuries", N_("Lesiones o cirugías previas"), N_("Ej. rotura de menisco izquierdo (2019)"))}${ta("pains", N_("Dolores o molestias actuales"), N_("Ej. lumbar al levantarme por la mañana"))}
    ${ta("conditions", N_("Condiciones de salud relevantes"), N_("Ej. asma, hipertensión, embarazo…"))}${inp("meds", N_("Medicación relevante"), N_("Solo si influye en el entreno o la recuperación"))}`;
  else if (st === 1) body = `<h3 class="wh">${T("Objetivo principal (hasta 2)")}</h3>${ch("goals", AIP_GOALS.map(([k, n]) => [k, T(n)]), true)}
    ${ta("want", N_("¿Qué quieres conseguir? Cuanto más concreto, mejor"), N_("Ej. 10 dominadas, primer pino contra la pared, bajar 4 kg"))}
    ${ta("avoid", N_("Ejercicios que no puedes o no quieres hacer"), N_("Ej. saltos, carrera, nada de rodillas en el suelo"))}
    <h3 class="wh">${T("Duración del plan")}</h3>${ch("weeks", [4, 8, 12].map(w => [w, T("{n} semanas", { n: w })]), false)}
    <h3 class="wh">${T("Tipo de plan")}</h3>${ch("style", [["var", T("Variantes que rotan (A, B, C) con descarga")], ["fix", T("Una rutina por día, siempre igual")]], false)}
    <p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Con variantes, Usus usa su plan de progresión: Hoy te dice qué toca cada semana.")}</p>`;
  else if (st === 2) body = `<h3 class="wh">${T("Días que puedes entrenar")}</h3>${ch("days", WEEK_ORDER.map(d => [d, dayShort(d)]), true)}
    <div class="aitwo"><div>${inp("mins", N_("Minutos por sesión"), "", "number")}</div><div>${inp("when", N_("Momento del día"), N_("Ej. mañana, al salir del trabajo"))}</div></div>
    ${sel("place", N_("Dónde entrenas"), AIP_PLACES)}
    <h3 class="wh">${T("Material")}${myEquip() ? ` <span class="aitag">${T("de Mi material")}</span>` : ""}</h3>${ch("mat", MAT_SEL().map(([k, [n]]) => [k, T(n)]), true)}
    <h3 class="wh">${T("Día a día")}</h3>${sel("activity", N_("Actividad fuera del entreno"), AIP_ACT)}
    ${inp("other", N_("Otros deportes o actividades"), N_("Ej. pádel los sábados"))}
    <div class="aitwo"><div>${inp("sleep", N_("Sueño"), N_("Ej. 7 h"), "text", f.sleep && f.sleep === sleepAvg() ? N_("del diario") : "")}</div><div>${sel("energy", N_("Energía y estrés"), AIP_EN)}</div></div>
    ${ta("diet", N_("Alimentación"), N_("Ej. vegetariana, en déficit, 2 comidas al día"))}${ta("extra", N_("Algo más"), N_("Lo que quieras que la IA tenga en cuenta"))}`;
  else body = `<h3 class="wh">${T("Incluir en las indicaciones")}</h3>
    <label class="chk aichk"><input type="checkbox" id="aipInc_hist" ${a.inc.hist ? "checked" : ""} ${state.sessions.length ? "" : "disabled"}> <span>${T("Mis marcas recientes")}<small class="muted" style="display:block;font-size:.78rem">${T("Mejores series de las últimas 8 semanas, para partir de tu nivel real.")}</small></span></label>
    <label class="chk aichk"><input type="checkbox" id="aipInc_mine" ${a.inc.mine ? "checked" : ""} ${state.routines.length ? "" : "disabled"}> <span>${T("Mis rutinas actuales")}<small class="muted" style="display:block;font-size:.78rem">${T("Para que las mejore o las respete (p. ej. una rutina diaria).")}</small></span></label>
    <label class="chk aichk"><input type="checkbox" id="aipKeep" ${a.keep ? "checked" : ""}> <span>${T("Recordar mis respuestas")}<small class="muted" style="display:block;font-size:.78rem">${T("La próxima vez el formulario sale ya rellenado. Se guardan solo en este dispositivo, en tu perfil, y van en la copia completa.")}</small></span></label>
    <p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("El catálogo de ejercicios no se copia: las indicaciones llevan el enlace para que la IA lo consulte.")}</p>
    <div class="aiwarn"><b>${T("Vas a compartir datos de salud con un servicio externo")}</b>${T("Usus no envía nada: lo copias o compartes tú. Lo que pase después depende de la IA que elijas; revisa su política de privacidad. El plan lo hace una IA, no un entrenador ni un profesional sanitario: revísalo y escucha a tu cuerpo.")}</div>
    <div class="row"><button class="btn primary" style="flex:1" data-act="aip-copy">${T("Copiar indicaciones")}</button><button class="btn" style="flex:1" data-act="aip-file">${T("Exportar a .txt")}</button></div>
    <p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Pégalas en una conversación nueva de tu IA (ChatGPT, Claude, Gemini…) o sube el archivo.")}</p>
    <h3 class="wh">${T("Cuando la IA responda")}</h3>
    <p class="muted" style="font-size:.85rem;margin:0 0 6px">${T("Copia su respuesta (entera o solo el bloque de código) y toca el botón. Usus solo lee el bloque de datos y te enseña las rutinas y el plan antes de importar nada.")}</p>
    <button class="btn primary" style="width:100%" data-act="aip-clip">${T("Pegar respuesta de la IA")}</button>
      ${canReceiveShare() ? `<p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("También puedes compartirla con Usus desde la app de la IA: menú Compartir → Usus.")}</p>` : ""}
    <details class="aimanual"${a.manual ? " open" : ""}><summary>${T("O pégala a mano")}</summary>
      <textarea id="aipPaste" rows="3" placeholder="${T("Pega aquí la respuesta de la IA")}"></textarea>
      <button class="btn" style="width:100%;margin-top:8px" data-act="aip-paste">${T("Revisar rutinas y plan")}</button></details>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="aipT"><div class="mbox dsh aip full">${mHead("aipT", `✦ ${T("Crear plan con IA")} <span class="aibadge">${T("Externa")}</span>`, "aip-close")}
    ${mSteps(STEPS.map(n => T(n)), st)}
    <div class="aiform">${body}</div>
    <div class="mfoot">${st ? `<button class="btn" data-act="aip-back">‹ ${T("Atrás")}</button>` : ""}${st < 3 ? `<button class="btn primary" data-act="aip-next">${T("Siguiente")} ›</button>` : ""}</div>
  </div></div>`;
}
/* Mejores series por ejercicio en las últimas 8 semanas */
function aipMarks() {
  const from = Date.now() - 56 * 864e5, M = new Map(), pem = [];
  state.sessions.filter(s => s.start >= from).forEach(s => {
    if (+s.pem) pem.push(+s.pem);
    s.exercises.forEach(e => { const k = exKey(e), m = M.get(k) || { e, v: 0, w: 0, n: 0 }; m.n++;
      e.sets.forEach(x => { const v = sideReps(e) ? Math.min(+x.r || 0, +R2(x) || 0) : +x.r || 0, w = +x.w || 0; if (v > m.v || (v === m.v && w > m.w)) { m.v = v; m.w = w; } });
      M.set(k, m); });
  });
  return { list: [...M.values()].filter(m => m.v > 0).sort((a, b) => b.n - a.n).slice(0, 25), pem: pem.length ? Math.round(pem.reduce((a, b) => a + b, 0) / pem.length * 10) / 10 : 0 };
}
const PX = {
  es: { title: "Usus · Crear un plan de entrenamiento", intro: "Actúa como un entrenador de calistenia y fuerza con peso corporal, prudente y basado en la evidencia. Con mis datos, diseña rutinas y un plan para la app Usus.",
    rulesH: "Instrucciones", rules: ["Lee todos mis datos. Si falta algo importante para hacer un plan seguro, pregúntamelo antes. Si ves señales de alarma (dolor agudo o que empeora, mareos, condiciones de riesgo, embarazo…), dímelo y recomiéndame consultar a un profesional antes de seguir.", "Respeta: días disponibles, minutos por sesión, material, ejercicios a evitar, lesiones y molestias. Ante la duda, más fácil: es mejor subir que lesionarse.", "Parte de mi nivel real (marcas recientes), no de lo que me gustaría hacer.", "Usa ejercicios del catálogo de Usus (enlace al final) con su id en \"xid\". Si necesitas uno que no está, ponle nombre y omite \"xid\".", "Si te paso rutinas actuales que quiero mantener, no las cambies: no las repitas en el JSON.", "El plan de Usus va en orden: cada semana se hace una vez cada rutina de la variante que toca, el día que se pueda; \"days\" solo fija el orden. Pon una rutina por sesión de la semana (p. ej. 3 sesiones = 3 rutinas distintas por variante).", "Responde en español y en este orden: a) resumen del plan y por qué está montado así (breve); b) cómo progresar semana a semana y cuándo bajar la carga; c) avisos y señales para parar; d) UN ÚNICO bloque ```json con las rutinas y el plan en el formato de abajo."],
    fmtH: "Formato del bloque JSON (obligatorio)", fmtNote: "Los comentarios // solo explican cada campo: no los pongas en tu respuesta. Usa nombres de rutina cortos, empezando por la variante (p. ej. «A · Lunes · Empuje»).",
    c: { name: "corto y claro", block: "diaria | empuje | traccion | pierna | full | core | cardio | otro", variant: "letra de la variante del plan, o \"\" si se repite siempre", days: "1=lunes … 6=sábado, 0=domingo", secs: "opcional: secciones", groups: "opcional: sup = superserie, cir = circuito; rounds = vueltas; rest = descanso entre vueltas (s)", type: "reps | time (con time, reps = segundos)", sides: "true si se hace por lado", rest: "descanso entre series y al terminar (s)", tech: "opcional: tempo, pausa, agarre…", sg: "opcional: sección y grupo", plan: "omítelo si son rutinas fijas", deload: "semana de descarga cada N semanas", up: "al volver una variante: mark (solo aviso) | reps1 | reps2 | set (+1 serie) | step (siguiente ejercicio)" },
    meH: "Mis datos", sex: { m: "hombre", f: "mujer" }, sexL: "Sexo", ageL: "Edad", hL: "Altura", wL: "Peso", expL: "Experiencia", inj: "Lesiones o cirugías", pain: "Dolores o molestias actuales", cond: "Condiciones de salud", meds: "Medicación",
    wantH: "Lo que busco", goalL: "Objetivo", wantL: "En concreto", avoidL: "Evitar", durL: "Duración", wk: n => `${n} semanas`, styleL: "Tipo", style: { var: "variantes que rotan (A, B, C…) con semana de descarga", fix: "una rutina por día, siempre igual" },
    weekH: "Mi semana", daysL: "Días", minL: "min por sesión", placeL: "Lugar", matL: "Material", noMat: "ninguno (solo peso corporal)", actL: "Actividad diaria", sleepL: "Sueño (media)", enL: "Energía/estrés", dietL: "Alimentación", extraL: "Además",
    marksH: "Marcas recientes (últimas 8 semanas)", ses: n => (n === 1 ? "1 sesión" : `${n} sesiones`), pemL: "Esfuerzo medio de las sesiones (PEM 1–10)", mineH: "Mis rutinas actuales", catH: "Catálogo de ejercicios de Usus",
    cat: ["Lista completa (id, nombre en es/ca/en, patrón, nivel 1–5, tipo, material, progresiones; y en cada ficha: role = principal, accesorio, movilidad, calentamiento o cardio; dose = rango recomendado por serie, en reps o segundos; joints = articulaciones que más carga). Usa dose para las series y evita los ejercicios cuyos joints coincidan con mis molestias:", "Si no puedes abrir el enlace, usa nombres de ejercicio claros y habituales y omite \"xid\": Usus permite vincularlos al catálogo después."] },
  ca: { title: "Usus · Crear un pla d'entrenament", intro: "Actua com un entrenador de calistènia i força amb el pes corporal, prudent i basat en l'evidència. Amb les meves dades, dissenya rutines i un pla per a l'app Usus.",
    rulesH: "Instruccions", rules: ["Llegeix totes les meves dades. Si falta alguna cosa important per fer un pla segur, pregunta-m'ho abans. Si veus senyals d'alarma (dolor agut o que empitjora, marejos, condicions de risc, embaràs…), digues-m'ho i recomana'm consultar un professional abans de continuar.", "Respecta: dies disponibles, minuts per sessió, material, exercicis a evitar, lesions i molèsties. En cas de dubte, més fàcil: és millor pujar que lesionar-se.", "Parteix del meu nivell real (marques recents), no del que m'agradaria fer.", "Fes servir exercicis del catàleg d'Usus (enllaç al final) amb el seu id a \"xid\". Si en necessites un que no hi és, posa-li nom i omet \"xid\".", "Si et passo rutines actuals que vull mantenir, no les canviïs: no les repeteixis al JSON.", "El pla d'Usus va en ordre: cada setmana es fa una vegada cada rutina de la variant que toca, el dia que es pugui; \"days\" només fixa l'ordre. Posa una rutina per sessió de la setmana (p. ex. 3 sessions = 3 rutines diferents per variant).", "Respon en català i en aquest ordre: a) resum del pla i per què està muntat així (breu); b) com progressar setmana a setmana i quan baixar la càrrega; c) avisos i senyals per parar; d) UN ÚNIC bloc ```json amb les rutines i el pla en el format de sota."],
    fmtH: "Format del bloc JSON (obligatori)", fmtNote: "Els comentaris // només expliquen cada camp: no els posis a la resposta. Fes servir noms de rutina curts, començant per la variant (p. ex. «A · Dilluns · Empenta»).",
    c: { name: "curt i clar", block: "diaria | empuje | traccion | pierna | full | core | cardio | otro", variant: "lletra de la variant del pla, o \"\" si es repeteix sempre", days: "1=dilluns … 6=dissabte, 0=diumenge", secs: "opcional: seccions", groups: "opcional: sup = supersèrie, cir = circuit; rounds = voltes; rest = descans entre voltes (s)", type: "reps | time (amb time, reps = segons)", sides: "true si es fa per costat", rest: "descans entre sèries i en acabar (s)", tech: "opcional: tempo, pausa, presa…", sg: "opcional: secció i grup", plan: "omet-lo si són rutines fixes", deload: "setmana de descàrrega cada N setmanes", up: "en tornar una variant: mark (només avís) | reps1 | reps2 | set (+1 sèrie) | step (exercici següent)" },
    meH: "Les meves dades", sex: { m: "home", f: "dona" }, sexL: "Sexe", ageL: "Edat", hL: "Alçada", wL: "Pes", expL: "Experiència", inj: "Lesions o cirurgies", pain: "Dolors o molèsties actuals", cond: "Condicions de salut", meds: "Medicació",
    wantH: "El que busco", goalL: "Objectiu", wantL: "En concret", avoidL: "Evitar", durL: "Durada", wk: n => `${n} setmanes`, styleL: "Tipus", style: { var: "variants que roten (A, B, C…) amb setmana de descàrrega", fix: "una rutina per dia, sempre igual" },
    weekH: "La meva setmana", daysL: "Dies", minL: "min per sessió", placeL: "Lloc", matL: "Material", noMat: "cap (només pes corporal)", actL: "Activitat diària", sleepL: "Son (mitjana)", enL: "Energia/estrès", dietL: "Alimentació", extraL: "A més",
    marksH: "Marques recents (últimes 8 setmanes)", ses: n => (n === 1 ? "1 sessió" : `${n} sessions`), pemL: "Esforç mitjà de les sessions (PEM 1–10)", mineH: "Les meves rutines actuals", catH: "Catàleg d'exercicis d'Usus",
    cat: ["Llista completa (id, nom en es/ca/en, patró, nivell 1–5, tipus, material, progressions; i a cada fitxa: role = principal, accessori, mobilitat, escalfament o cardio; dose = rang recomanat per sèrie, en reps o segons; joints = articulacions que més carrega). Fes servir dose per a les sèries i evita els exercicis amb joints que coincideixin amb les meves molèsties:", "Si no pots obrir l'enllaç, fes servir noms d'exercici clars i habituals i omet \"xid\": Usus permet vincular-los al catàleg després."] },
  en: { title: "Usus · Create a training plan", intro: "Act as a cautious, evidence-based calisthenics and bodyweight strength coach. Using my data, design routines and a plan for the Usus app.",
    rulesH: "Instructions", rules: ["Read all my data. If something important for a safe plan is missing, ask me first. If you see red flags (sharp or worsening pain, dizziness, risk conditions, pregnancy…), tell me and recommend I see a professional before going on.", "Respect: available days, minutes per session, equipment, exercises to avoid, injuries and aches. When in doubt, go easier: better to progress than to get hurt.", "Start from my real level (recent bests), not from what I'd like to do.", "Use exercises from the Usus catalogue (link at the end) with their id in \"xid\". If you need one that isn't there, name it and leave out \"xid\".", "If I send current routines I want to keep, don't change them: don't repeat them in the JSON.", "Usus plans go in order: each week every routine of the current variant is done once, on whatever day suits; \"days\" only sets the order. Use one routine per session of the week (e.g. 3 sessions = 3 different routines per variant).", "Answer in English, in this order: a) plan summary and why it's built this way (short); b) how to progress week by week and when to back off; c) warnings and signs to stop; d) ONE SINGLE ```json block with the routines and plan in the format below."],
    fmtH: "JSON block format (required)", fmtNote: "The // comments only explain each field: don't include them in your answer. Use short routine names starting with the variant (e.g. “A · Monday · Push”).",
    c: { name: "short and clear", block: "diaria | empuje | traccion | pierna | full | core | cardio | otro", variant: "plan variant letter, or \"\" if it always repeats", days: "1=Monday … 6=Saturday, 0=Sunday", secs: "optional: sections", groups: "optional: sup = superset, cir = circuit; rounds; rest = rest between rounds (s)", type: "reps | time (with time, reps = seconds)", sides: "true if done per side", rest: "rest between sets and after the exercise (s)", tech: "optional: tempo, pause, grip…", sg: "optional: section and group", plan: "leave out for fixed routines", deload: "deload week every N weeks", up: "when a variant comes back: mark (reminder only) | reps1 | reps2 | set (+1 set) | step (next exercise)" },
    meH: "About me", sex: { m: "male", f: "female" }, sexL: "Sex", ageL: "Age", hL: "Height", wL: "Weight", expL: "Experience", inj: "Injuries or surgery", pain: "Current pain or aches", cond: "Health conditions", meds: "Medication",
    wantH: "What I'm after", goalL: "Goal", wantL: "Specifically", avoidL: "Avoid", durL: "Length", wk: n => `${n} weeks`, styleL: "Type", style: { var: "rotating variants (A, B, C…) with a deload week", fix: "one routine per day, always the same" },
    weekH: "My week", daysL: "Days", minL: "min per session", placeL: "Place", matL: "Equipment", noMat: "none (bodyweight only)", actL: "Daily activity", sleepL: "Sleep (average)", enL: "Energy/stress", dietL: "Diet", extraL: "Also",
    marksH: "Recent bests (last 8 weeks)", ses: n => (n === 1 ? "1 session" : `${n} sessions`), pemL: "Average session effort (RPE 1–10)", mineH: "My current routines", catH: "Usus exercise catalogue",
    cat: ["Full list (id, name in es/ca/en, pattern, level 1–5, type, equipment, progressions; and on each card: role = main, accessory, mobility, warmup or cardio; dose = recommended range per set, in reps or seconds; joints = joints it loads most). Use dose for the sets and avoid exercises whose joints match my aches:", "If you can't open the link, use clear, common exercise names and leave out \"xid\": Usus lets me link them to the catalogue later."] }
};
function aipBuild(a) {
  const X = PX[LANG] || PX.es, f = a.f, L = [], sex = f.sex || curProf().sex, age = ageOf(f.birth), lv = Object.fromEntries(AI_LEVELS);
  const c = X.c, cm = (code, k) => `${code}${" ".repeat(Math.max(1, 46 - code.length))}// ${c[k]}`;
  L.push(`# ${X.title}`, "", X.intro, "", `## ${X.rulesH}`, ...X.rules.map((r, i) => `${i + 1}. ${r}`), "", `## ${X.fmtH}`, "```",
    "{", '  "app": "usus",', '  "routines": [{', cm('    "name": "A · …",', "name"), cm('    "block": "empuje",', "block"), cm('    "variant": "A",', "variant"), cm('    "days": [1],', "days"),
    cm('    "secs": [{"id": "s1", "name": "…"}],', "secs"), cm('    "groups": {"g1": {"kind": "sup", "rounds": 3, "rest": 90, "restAfter": 120}},', "groups"),
    '    "exercises": [{', '      "name": "Flexión diamante", "xid": "flexion-diamante",', cm('      "sets": 3, "reps": 8, "type": "reps",', "type"), cm('      "sides": false,', "sides"),
    cm('      "rest": 90, "restAfter": 120,', "rest"), cm('      "tech": "…",', "tech"), cm('      "sec": "s1", "grp": "g1"', "sg"), "    }]", "  }],",
    cm('  "plan": {', "plan"), '    "phases": [{"variant": "A", "weeks": 2}, {"variant": "B", "weeks": 2}],', cm('    "deload": {"weeks": 1, "every": 6},', "deload"), cm('    "up": true, "upRule": "reps1"', "up"), "  }", "}", "```", X.fmtNote, "");
  L.push(`## ${X.meH}`, [sex === "m" || sex === "f" ? `${X.sexL}: ${X.sex[sex]}` : "", age ? `${X.ageL}: ${age}` : "", f.height ? `${X.hL}: ${f.height} cm` : "", f.weight ? `${X.wL}: ${f.weight} kg` : ""].filter(Boolean).join(" · ") || "—");
  if (f.level || f.years) L.push(`${X.expL}: ${[f.level ? T(lv[f.level]) : "", f.years].filter(Boolean).join(" · ")}`);
  [["injuries", "inj"], ["pains", "pain"], ["conditions", "cond"], ["meds", "meds"]].forEach(([k, n]) => { if (f[k]) L.push(`${X[n]}: ${f[k]}`); });
  const gl = (f.goals || []).map(g => T(AIP_GOALS.find(x => x[0] === g)?.[1] || g)).join(", ");
  const o = (c, t) => (c ? t : null);
  L.push("", `## ${X.wantH}`, o(gl, `${X.goalL}: ${gl}`), o(f.want, `${X.wantL}: ${f.want}`), o(f.avoid, `${X.avoidL}: ${f.avoid}`), `${X.durL}: ${X.wk(f.weeks)} · ${X.styleL}: ${X.style[f.style] || X.style.var}`);
  L.push("", `## ${X.weekH}`, `${X.daysL}: ${WEEK_ORDER.filter(d => (f.days || []).includes(d)).map(dayShort).join(" ") || "—"}${f.mins ? ` · ${f.mins} ${X.minL}` : ""}${f.when ? ` · ${f.when}` : ""} · ${X.placeL}: ${T(AIP_PLACES.find(x => x[0] === f.place)?.[1] || f.place)}`,
    `${X.matL}: ${(f.mat || []).filter(k => MAT[k]).map(k => T(MAT[k][0])).join(", ") || X.noMat}`,
    o(f.activity || f.other, `${X.actL}: ${[f.activity ? T(AIP_ACT.find(x => x[0] === f.activity)?.[1]) : "", f.other].filter(Boolean).join(" · ")}`),
    `${f.sleep ? `${X.sleepL}: ${f.sleep} · ` : ""}${X.enL}: ${T(AIP_EN.find(x => x[0] === f.energy)?.[1] || "Normal")}`, o(f.diet, `${X.dietL}: ${f.diet}`), o(f.extra, `${X.extraL}: ${f.extra}`));
  if (a.inc.hist && state.sessions.length) { const m = aipMarks();
    if (m.list.length) { L.push("", `## ${X.marksH}`, ...m.list.map(x => `- ${exLabel(x.e)}${x.e.xid ? ` (${x.e.xid})` : ""}: ${x.v}${isTime(x.e) ? " s" : " reps"}${sideReps(x.e) || (isTime(x.e) && x.e.sides) ? " ×2" : ""}${x.w ? ` @ ${x.w} kg` : ""} · ${X.ses(x.n)}`)); if (m.pem) L.push(`- ${X.pemL}: ${m.pem}`); } }
  if (a.inc.mine && state.routines.length) { L.push("", `## ${X.mineH}`);
    state.routines.forEach(r => L.push(`- ${r.name}${normVar(r.variant) ? ` [${normVar(r.variant)}]` : ""}${(r.days || []).length ? ` · ${r.days.length === 7 ? "L–D" : WEEK_ORDER.filter(d => r.days.includes(d)).map(dayShort).join(" ")}` : ""}: ${r.exercises.map(e => `${exLabel(e)}${e.xid ? ` (${e.xid})` : ""} ${e.sets}×${e.reps}${isTime(e) ? " s" : ""}`).join(" · ")}`)); }
  L.push("", `## ${X.catH}`, X.cat[0], CAT_URL, X.cat[1]);
  return L.filter(x => x !== false && x !== undefined && x !== null).join("\n");
}
function aipSave() {
  const a = state.aip; if (!a?.keep) return;
  LS.set("wk.aiPlan", Object.fromEntries(AIP_P.map(k => [k, a.f[k]])));
  const h = Object.fromEntries(AIP_H.map(k => [k, a.f[k] || ""])); if (aiHasData(h)) LS.set("wk.aiProf", { ...(aiProf() || {}), ...h });
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
    ${mHead("cxT", T("Datos en CSV"), "cx-close")}
    <p class="muted" style="margin:0;font-size:.88rem">${T("Un archivo .zip con una tabla por tipo de dato (sesiones, rutinas, diario, suplementos, peso, actividades y ciclo) y un archivo que explica cada columna. Para analizarlos a tu manera en una hoja de cálculo.")}</p>
    <h3 class="wh">${T("Período")}</h3>
    <div class="chips">${[0, 4, 8, 12, 26].map(w => `<button data-cxw="${w}" class="${c.weeks === w ? "on" : ""}" aria-pressed="${c.weeks === w}">${w ? T("{n} semanas", { n: w }) : T("Todo")}</button>`).join("")}</div>
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${LANG === "en" ? T("Formato: separador «,» y punto decimal.") : T("Formato: separador «;» y coma decimal, para abrirlo directamente en Excel en castellano o català.")}</p>
    <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn ghost" data-act="cx-close">${T("Cancelar")}</button><button class="btn primary" data-act="cx-go">${T("Exportar .zip")}</button></div>
  </div></div>`;
}
