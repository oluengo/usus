/* ---------- Formato de datos ----------
   DATA_VERSION sube cuando cambia la forma de los datos guardados o de las copias. Una copia antigua pasa por DATA_MIGRATIONS
   (de la versión n a la n+1) antes de importarse, y los datos guardados en el dispositivo, al arrancar (wk.dataVersion, por perfil).
   Historia: 1 = Usus 1.x–2.x (las copias decían siempre «version: 1»); 2 = Usus 3.0 (rutinas normalizadas: secciones y superseries coherentes). */
const DATA_VERSION = 2;
const DATA_MIGRATIONS = {
  1: j => ({ ...j, routines: (j.routines || []).filter(validRoutine).map(r => normRoutine(JSON.parse(JSON.stringify(r)))), sessions: (j.sessions || []).filter(validSession).map(s => ({ ...s, end: s.end || s.start })) })
};
function migrateData(j) {
  if (Array.isArray(j)) j = { app: "usus", routines: j };
  let v = Math.max(1, Math.round(+j.version || 1));
  while (v < DATA_VERSION) { j = DATA_MIGRATIONS[v](j); v++; }
  return { ...j, version: Math.max(v, +j.version || 0) };
}
/* Datos del dispositivo: se ponen al día una vez por perfil */
function migrateStored() {
  const v = +LS.get("wk.dataVersion", 1) || 1; if (v >= DATA_VERSION) return;
  const j = migrateData({ version: v, routines: state.routines, sessions: state.sessions });
  state.routines = j.routines; state.sessions = j.sessions; store.saveAll(); LS.set("wk.dataVersion", DATA_VERSION);
}
/* Ajustes del perfil y su historial de progresión, que también viajan en la copia (3.7.2).
   No viajan: la cuenta de Nostr, la sesión en curso ni los avisos ya vistos. */
const SET_KEYS = ["wk.catalog", "wk.equip", "wk.effort", "wk.fx", "wk.prog", "wk.restDefault", "wk.restExDefault", "wk.prep", "wk.switch", "wk.warn", "wk.autoStart", "wk.distUnit", "wk.tmrNotif",
  "wk.theme", "wk.lang", "wk.weighOn", "wk.weighDay", "wk.actGoalSteps", "wk.actGoalKm", "wk.statsCat", "wk.statsHidden", "wk.statsPer", "wk.statsOrder", "wk.shareOpt"];
const PROG_KEYS = ["wk.progLog", "wk.progMute", "wk.planUpLog", "wk.planUpDone", "wk.planShift", "wk.linkOwn"];
const pickLS = keys => Object.fromEntries(keys.map(k => [k, LS.get(k, null)]).filter(([, v]) => v !== null && v !== undefined));
/* Apartados de la copia: en Nostr se guardan y se recuperan por separado */
const BK_SECS = { rut: ["routines", "plan", "plans", "aiPlan"], ent: ["sessions", "progress"], dia: ["weights", "weightGoal", "diary", "supplements", "activities", "activityTypes", "cycle"], aj: ["profile", "settings", "goals", "aiProfile"] };
/* Copia completa del perfil (la misma para el archivo y para Nostr); con secs, solo esos apartados */
function backupObj(secs) {
  const pm = curProf();
  const all = { app: "usus", version: DATA_VERSION, exported: new Date().toISOString(), ...(pm.sex ? { profile: { name: pm.name, sex: pm.sex, color: pm.color } } : {}), routines: state.routines, sessions: state.sessions, weights: W.list(), weightGoal: W.goal(), diary: DY.all(), cycle: { periods: CYC.list(), symptoms: CYC.syms(), settings: CYC.cfg() }, supplements: DY.supps(), activities: ACT.list(), activityTypes: ACT.types(), goals: LS.get("wk.goals", null), plan: PL.get(), plans: PLS.list(), ...(aiHasData(aiProf()) ? { aiProfile: aiProf() } : {}), ...(LS.get("wk.aiPlan", null) ? { aiPlan: LS.get("wk.aiPlan", null) } : {}),
    settings: pickLS(SET_KEYS), progress: pickLS(PROG_KEYS) };
  if (!secs) return all;
  const keep = new Set(["app", "version", "exported", ...secs.flatMap(s => BK_SECS[s] || [])]);
  return Object.fromEntries(Object.entries(all).filter(([k]) => keep.has(k)));
}
/* Ajustes e historial de progresión de una copia: los ajustes sustituyen a los actuales; el historial se combina */
function importExtras(j) {
  if (j.settings && typeof j.settings === "object") {
    SET_KEYS.forEach(k => { if (j.settings[k] !== undefined && j.settings[k] !== null) LS.set(k, j.settings[k]); });
    const l = j.settings["wk.lang"]; if (l && LANGS[l]) setLang(l);
    if (j.settings["wk.theme"]) applyTheme(j.settings["wk.theme"]);
    if (LS.get("wk.catalog", false) && !CAT) loadCatalog().then(c => c && render());
  }
  const p = j.progress; if (!p || typeof p !== "object") return;
  if (Array.isArray(p["wk.progLog"])) { const m = new Map((LS.get("wk.progLog", []) || []).map(x => [x.t + ":" + x.rid + ":" + x.to, x])); p["wk.progLog"].filter(x => x && x.t).forEach(x => m.set(x.t + ":" + x.rid + ":" + x.to, x)); LS.set("wk.progLog", [...m.values()].sort((a, b) => a.t - b.t).slice(-300)); }
  ["wk.progMute", "wk.planUpDone", "wk.linkOwn"].forEach(k => { if (Array.isArray(p[k])) LS.set(k, [...new Set([...(LS.get(k, []) || []), ...p[k]])]); });
  ["wk.planUpLog", "wk.planShift"].forEach(k => { if (p[k] && LS.get(k, null) === null) LS.set(k, p[k]); });
}
async function importJSON(text) {
  let j; try { j = JSON.parse(text); } catch { const inc = aiParse(text); if (inc) { state.incoming = { ...inc, ai: true }; render(); return; } toast(T("El archivo no es un JSON válido")); return; }
  // Respuesta de la IA guardada como archivo (rutinas y plan sin fecha de inicio): a la revisión, como al pegarla
  if (j && j.app === "usus" && !j.shared && !j.exported && !Array.isArray(j.sessions) && Array.isArray(j.routines) && j.plan && !j.plan.start) { const inc = aiParse(text); if (inc) { state.incoming = { ...inc, ai: true }; render(); return; } }
  if (j && !j.shared && +j.version > DATA_VERSION && !confirm(T("Esta copia es de una versión más nueva de Usus. Actualiza la app para importarla completa. ¿Importar igualmente lo que se pueda?"))) return;
  if (j && !j.shared) j = migrateData(j);
  if (j && j.shared) { const inc = sanitizeShared(j); if (!inc) { toast(T("No se encontraron rutinas, sesiones ni pesos")); return; } state.incoming = inc; render(); return; }
  const rs = (Array.isArray(j) ? j : j.routines || []).filter(validRoutine);
  const ss = (j.sessions || []).filter(validSession);
  const ws = (j.weights || []).filter(x => x && typeof x.t === "number" && +x.kg > 0);
  const nd = j.diary && typeof j.diary === "object" ? Object.keys(j.diary).length : 0;
  const na = (Array.isArray(j.activities) ? j.activities.length : 0) + (Array.isArray(j.cycle?.periods) ? j.cycle.periods.length : 0);
  const hasPlan = !!(j.plan && typeof j.plan === "object" && j.plan.start && Array.isArray(j.plan.phases));
  const hasSet = !!(j.settings && typeof j.settings === "object" && Object.keys(j.settings).length), hasProg = !!(j.progress && typeof j.progress === "object" && Object.keys(j.progress).length);
  // Solo rutinas (sin registros): se revisan como unas rutinas recibidas, con aviso si ya las tienes
  if (rs.length && !ss.length && !ws.length && !nd && !na && !hasPlan && !hasSet && !hasProg) {
    const inc = sanitizeShared({ routines: rs.map(r => ({ ...r, oid: r.oid || r.id })) }); if (!inc) { toast(T("No se encontraron rutinas, sesiones ni pesos")); return; }
    state.incoming = inc; render(); return;
  }
  // Copia completa: las rutinas que ya tienes iguales (aunque vengan de otro móvil) no se duplican
  const dupI = new Set(); let simN = 0;
  rs.forEach((r, i) => { if (state.routines.some(x => x.id === r.id)) return; const m = routMatch(normRoutine(JSON.parse(JSON.stringify(r)))); if (m?.same) dupI.add(i); else if (m) simN++; });
  const dupMsg = (dupI.size ? " " + TN(dupI.size, "{n} rutina ya la tienes igual: no se duplica.", "{n} rutinas ya las tienes iguales: no se duplican.") : "") + (simN ? " " + TN(simN, "{n} rutina se parece mucho a una tuya: se añade igualmente.", "{n} rutinas se parecen mucho a otras tuyas: se añaden igualmente.") : "");
  if (!rs.length && !ss.length && !ws.length && !nd && !na && !hasPlan && !hasSet && !hasProg) { toast(T("No se encontraron rutinas, sesiones ni pesos")); return; }
  const more = (hasPlan ? " " + T("Incluye un plan, que sustituirá al actual.") : "") + (hasSet ? " " + T("Incluye los ajustes, que sustituirán a los actuales.") : "");
  if (!rs.length && !ss.length && !ws.length && !nd && !na) { if (!confirm(hasPlan && !hasSet && !hasProg ? T("Importar el plan de progresión. Sustituirá al plan actual, si lo hay. ¿Continuar?") : T("Importar los ajustes y el historial de progresión de la copia. ¿Continuar?") + more)) return; }
  else if (!confirm(T("Importar {r} rutinas, {s} sesiones, {w} pesos y {d} días de diario. Se combinarán con tus datos actuales. ¿Continuar?", { r: rs.length, s: ss.length, w: ws.length, d: nd }) + dupMsg + more)) return;
  if (ws.length) {
    const m = new Map(W.list().map(x => [dayStart(x.t), x])); ws.forEach(x => m.set(dayStart(x.t), { id: x.id || uid(), t: x.t, kg: +x.kg })); W.save([...m.values()]);
  }
  if (j.weightGoal && !W.goal()) LS.set("wk.weightGoal", +j.weightGoal);
  if (j.diary && typeof j.diary === "object") { const cur = DY.all(); Object.entries(j.diary).forEach(([k, v]) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === "object") cur[k] = { ...(cur[k] || {}), ...v, supp: { ...(cur[k]?.supp || {}), ...(v.supp || {}) } }; }); LS.set("wk.diary", cur); }
  if (j.plan && typeof j.plan === "object" && j.plan.start && Array.isArray(j.plan.phases)) PL.save(planToOrder(j.plan));
  if (Array.isArray(j.plans)) PLS.save(j.plans.filter(p => p && typeof p === "object" && p.start && Array.isArray(p.phases)).map(p => ({ ...p, id: p.id || uid() })));
  if (Array.isArray(j.supplements)) { const m = new Map(DY.supps().map(x => [x.id, x])); j.supplements.filter(x => x && x.id && x.name).forEach(x => m.set(x.id, x)); DY.saveSupps([...m.values()]); }
  if (Array.isArray(j.activities)) { const m = new Map(ACT.list().map(x => [x.id, x])); j.activities.filter(x => x && x.id && /^\d{4}-\d{2}-\d{2}$/.test(x.k) && x.type && (+x.km > 0 || +x.min > 0)).forEach(x => m.set(x.id, { id: String(x.id), k: x.k, type: String(x.type).slice(0, 24), km: +x.km || 0, min: +x.min || 0, note: String(x.note || "").slice(0, 140) })); ACT.save([...m.values()]); }
  if (Array.isArray(j.activityTypes)) ACT.saveTypes([...new Set([...ACT.types(), ...j.activityTypes.filter(x => typeof x === "string" && x.trim()).map(x => x.trim().slice(0, 24))])]);
  if (j.cycle && typeof j.cycle === "object") {
    if (Array.isArray(j.cycle.periods)) { const m = new Map(CYC.list().map(x => [x.s, x])); j.cycle.periods.filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.s)).forEach(x => m.set(x.s, { id: String(x.id || uid()), s: x.s, e: /^\d{4}-\d{2}-\d{2}$/.test(x.e || "") ? x.e : null })); CYC.save([...m.values()]); }
    if (Array.isArray(j.cycle.symptoms)) CYC.saveSyms([...new Set([...CYC.syms(), ...j.cycle.symptoms.filter(x => typeof x === "string" && x.trim()).map(x => x.trim().slice(0, 28))])]);
    if (j.cycle.settings && typeof j.cycle.settings === "object" && !LS.get("wk.cyc", null)) LS.set("wk.cyc", j.cycle.settings);
  }
  if (j.aiPlan && typeof j.aiPlan === "object" && !LS.get("wk.aiPlan", null)) { const d = aipDef(), p = j.aiPlan;
    LS.set("wk.aiPlan", Object.fromEntries(AIP_P.map(k => [k, Array.isArray(d[k]) ? (Array.isArray(p[k]) ? p[k].filter(x => typeof x === "string" || Number.isInteger(x)).slice(0, 12) : d[k]) : typeof d[k] === "number" ? (isFinite(+p[k]) ? +p[k] : d[k]) : typeof p[k] === "string" ? p[k].slice(0, 400) : d[k]]))); }
  if (j.aiProfile && typeof j.aiProfile === "object" && !aiHasData(aiProf())) LS.set("wk.aiProf", Object.fromEntries(["birth", "height", "level", "years", "injuries", "pains", "conditions", "meds", "goals", "other"].map(k => [k, typeof j.aiProfile[k] === "string" || typeof j.aiProfile[k] === "number" ? String(j.aiProfile[k]).slice(0, 400) : ""])));
  if (j.goals && typeof j.goals === "object") LS.set("wk.goals", { daily: +j.goals.daily || 0, strength: +j.goals.strength || 0 });
  const merge = (cur, inc) => { const m = new Map(cur.map(x => [x.id, x])); inc.forEach(x => m.set(x.id || uid(), { ...x, id: x.id || uid() })); return [...m.values()]; };
  state.routines = merge(state.routines, rs.filter((_, i) => !dupI.has(i)));
  state.sessions = merge(state.sessions, ss.map(s => ({ ...s, end: s.end || s.start })));
  importExtras(j);
  store.saveAll(); migrateTypes(); toast(T("Datos importados")); render();
}

