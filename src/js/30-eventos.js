/* ---------- Eventos ---------- */
document.addEventListener("toggle", ev => { const g = ev.target; if (g?.dataset?.rg === undefined) return; const op = LS.get("wk.rgOpen", {}) || {}; if (op[g.dataset.rg] !== g.open) { op[g.dataset.rg] = g.open; LS.set("wk.rgOpen", op); } }, true);
document.addEventListener("click", async ev => {
  const t = ev.target.closest("button"); if (!t) return;
  const d = t.dataset;
  readPlan(); readActForm(); readAiForm(); readAip();
  if (d.tab) { state.pweek = null; state.plmenu = false; readEditor(); state.print = null; state.dsheet = null; state.actForm = null; state.planMode = null; state.planDraft = null; state.routOpen = null; state.setTab = null; state.tab = d.tab; render(); window.scrollTo(0, 0); return; }
  if (d.start) { if (state.active && !confirm(T("Ya tienes una sesión en curso. ¿Descartarla y empezar otra?"))) return; cancelRun(); state.tab = "train"; startSession(d.start); return; }
  const a = state.active;
  if (d.aipst !== undefined && state.aip) { state.aip.step = +d.aipst; render(); return; }
  if (d.aipc && state.aip) { const f = state.aip.f, k = d.aipc, v = isNaN(+d.v) || d.v === "" ? d.v : +d.v;
    if (Array.isArray(f[k])) { const i = f[k].indexOf(v); if (i >= 0) f[k].splice(i, 1); else if (k !== "goals" || f[k].length < 2) f[k].push(v); } else f[k] = v; render(); return; }
  if (d.mv) {
    const [k, dir] = d.mv.split(":"), o = statsOrder(), i = o.indexOf(k), j = i + +dir;
    if (j >= 0 && j < o.length) { [o[i], o[j]] = [o[j], o[i]]; LS.set("wk.statsOrder", o); render(); }
    return;
  }
  if (d.copy) { const ok = await copyText(d.copy); toast(ok ? T("Copiado") : T("No se pudo copiar")); return; }
  /* Catálogo */
  if (d.xinfo) {
    if (!catOn()) { if (!confirm(T("Para ver la ficha hay que activar el catálogo de ejercicios en este perfil. ¿Activarlo?"))) return; LS.set("wk.catalog", true); }
    if (!CAT && !(await loadCatalog())) { toast(T("No se pudo cargar el catálogo. Se volverá a intentar al abrir la app.")); render(); return; }
    if (!CATBY[d.xinfo]) return;
    if (state.editing) readEditor(); state.exInfo = d.xinfo; state.exInfoAdd = false; state.exInfoFrom = state.editing || state.gp ? "ed" : ""; render(); [...document.querySelectorAll(".mbox.dsh")].pop()?.scrollTo(0, 0); return; }
  if (state.gp) {   // plan guiado
    const g = state.gp, top = () => document.querySelector(".mbox.gp")?.scrollTo(0, 0);
    if (d.gpgoal) { g.goal = d.gpgoal; render(); return; }
    if (d.gpdays) { g.days = +d.gpdays; render(); return; }
    if (d.gpmin) { g.min = +d.gpmin; render(); return; }
    if (d.gpmat) { g.mat = g.mat.includes(d.gpmat) ? g.mat.filter(x => x !== d.gpmat) : [...g.mat, d.gpmat]; render(); return; }
    if (d.gppain) { g.pain = g.pain.includes(d.gppain) ? g.pain.filter(x => x !== d.gppain) : [...g.pain, d.gppain]; render(); return; }
    if (d.gplvm) { g.lvMode = d.gplvm; render(); return; }
    if (d.gpself) { g.self = +d.gpself; render(); return; }
    if (d.gptab) { g.tab = +d.gptab; render(); top(); return; }
    if (d.gpmv) { const [sk, i, dir] = d.gpmv.split(":"), it = g.plan.routines[g.tab].sec[sk][+i], nb = gpNeighbors(g, it.id); if (nb[dir]) { it.id = nb[dir]; it.soft = false; } render(); return; }
  }
  if (d.xaddr) { const r = state.routines.find(x => x.id === d.xaddr), x = CATBY[state.exInfo]; if (!r || !x) return; r.exercises.push(newFromCat(x)); await store.saveRoutines(state.routines); state.exInfoAdd = false; toast(T("Añadido a «{x}»", { x: r.name })); render(); return; }
  if (d.catpat !== undefined) { state.catPat = d.catpat || null; render(); return; }
  if (d.rview) { state.routView = d.rview; render(); window.scrollTo(0, 0); return; }
  if (d.xpadd && state.xpick) {
    const x = CATBY[d.xpadd], p = state.xpick; if (!x) return; state.xpick = null;
    if (p.mode === "ed") { edAdd(newFromCat(x)); toast(T("Añadido")); }
    else if (p.mode === "sess" && a) { a.exercises.push(buildExercise(xName(x), 3, "", x.type, !!x.sides, null, x.id)); state.exView = a.pre ? null : a.exercises.length - 1; state.sheet = false; saveActive(); }
    else if (p.mode === "link" && state.link) linkApply(p.k, x.id);
    else if (p.mode === "swap" && a) { swapTo(p.ei, xName(x), x.id, x); toast(T("Cambiado solo en esta sesión")); }
    render(); return;
  }
  if (d.ownmat !== undefined && state.editing) { readEditor(); const e = state.editing.exercises[+d.ownmat]; state.ownMat = { i: +d.ownmat, equip: [...(e.equip || [])], other: e.other || "" }; render(); return; }
  if (d.fx) { LS.set("wk.fx", d.fx); render(); return; }
  if (d.pact) { const l = PLS.list(), p = l.find(x => x.id === d.pact); if (!p) return; const a = PL.get(), rest = l.filter(x => x.id !== d.pact);
    if (a) rest.unshift({ ...a, id: a.id || uid() }); PLS.save(rest); PL.save(p); state.plansOpen = true; toast(T("Plan activo: {x}", { x: planName(p) })); render(); return; }
  if (d.pdel) { const p = PLS.list().find(x => x.id === d.pdel); if (!p || !confirm(T("¿Eliminar el plan «{x}»? Tus rutinas y sesiones no se tocan.", { x: planName(p) }))) return; PLS.save(PLS.list().filter(x => x.id !== d.pdel)); state.plansOpen = true; render(); return; }
  if (d.snote) { state.sessNoteEd = d.snote; render(); document.querySelector(`[data-ssnote="${d.snote}"]`)?.focus(); return; }
  if (d.pem || d.spem) { const [id, n] = (d.pem || d.spem).split(":"); setPem(id, +n); render(); return; }
  if (d.rir !== undefined && state.rirAsk && a) { const q = state.rirAsk, x = a.exercises[q.ei]?.sets[q.si]; if (x && +d.rir >= 0) x.rir = +d.rir; state.rirAsk = null; saveActive(); render(); return; }
  if (d.enote !== undefined && a) { state.noteOpen = state.noteOpen === +d.enote ? null : +d.enote; render(); if (state.noteOpen !== null) document.querySelector(`[data-enotet="${d.enote}"]`)?.focus(); return; }
  if (d.swap !== undefined && a) { state.noteOpen = null; if (catReady()) { state.xpick = { mode: "swap", ei: +d.swap, q: "" }; } else state.swap = { ei: +d.swap }; render(); setTimeout(() => (catReady() ? $("#xpQ") : $("#swName"))?.focus(), 0); return; }
  if (d.swapundo !== undefined && a) { swapUndo(+d.swapundo); render(); return; }
  if (d.aiw !== undefined && state.ai) { state.ai.weeks = +d.aiw; render(); return; }
  if (d.cxw !== undefined && state.csvx) { state.csvx.weeks = +d.cxw; render(); return; }
  if (d.pgch !== undefined) { const p = state.progProps?.[+d.pgch]; if (p) { state.progChange = { k: +d.pgch, tgt: p.tgt }; render(); } return; }
  if (d.pglater !== undefined && state.progProps) { state.progProps.splice(+d.pglater, 1); render(); return; }
  if (d.pgmute !== undefined && state.progProps) { const p = state.progProps[+d.pgmute]; LS.set("wk.progMute", [...new Set([...(LS.get("wk.progMute", []) || []), p.rid + ":" + p.xid])]); state.progProps.splice(+d.pgmute, 1); toast(T("No se volverá a proponer para este ejercicio en esta rutina")); render(); return; }
  if (d.pgn && state.progChange) { state.progChange.tgt = Math.max(1, Math.min(600, state.progChange.tgt + +d.pgn)); render(); return; }
  if (state.link && (d.lnok || d.lnundo || d.lnpick || d.lnown)) {
    const it = state.link.items[+(d.lnok || d.lnundo || d.lnpick || d.lnown)]; if (!it) return;
    if (d.lnok && it.to) linkApply(it.k, it.to);
    else if (d.lnundo) linkUndo(it.k);
    else if (d.lnown) LS.set("wk.linkOwn", [...new Set([...(LS.get("wk.linkOwn", []) || []), it.k])]);
    else if (d.lnpick) { state.xpick = { mode: "link", k: it.k, name: it.name, q: "" }; render(); setTimeout(() => $("#xpQ")?.focus(), 0); return; }
    render(); return;
  }
  if (d.stab) { state.setTab = d.stab; render(); window.scrollTo(0, 0); return; }
  if (d.pswitch) { switchProfile(d.pswitch); return; }
  if (d.pfsex && state.pform) { readProfForm(); state.pform.sex = d.pfsex; if (d.pfsex === "m") state.pform.cyc = false; render(); return; }
  if (d.pfcol && state.pform) { readProfForm(); state.pform.color = d.pfcol; render(); return; }
  if (d.pffrom && state.pform) { readProfForm(); state.pform.from = d.pffrom; render(); return; }
  if (d.pfsrc && state.pform) { readProfForm(); state.pform.src = d.pfsrc; state.pform.sel = null; render(); return; }
  if ((d.act === "pf-all" || d.act === "pf-none") && state.pform) { readProfForm(); const f = state.pform; f.sel = d.act === "pf-all" ? null : []; render(); return; }
  if (d.pfr && state.pform) { readProfForm(); const f = state.pform, all = (f.src === PROF ? state.routines : rawGet(PK("wk.routines", f.src), []) || []).map(r => r.id), sel = new Set(f.sel || all); sel.has(d.pfr) ? sel.delete(d.pfr) : sel.add(d.pfr); f.sel = [...sel]; render(); return; }
  if (d.pecol && state.pedit) { state.pedit.color = d.pecol; const n = $("#peName")?.value; render(); if (n !== undefined && $("#peName")) $("#peName").value = n; return; }
  if (d.pkto && state.pcopy) { state.pcopy.to = d.pkto; render(); return; }
  if (d.pkr && state.pcopy) { const sel = new Set(state.pcopy.sel); sel.has(d.pkr) ? sel.delete(d.pkr) : sel.add(d.pkr); state.pcopy.sel = [...sel]; render(); return; }
  if (d.shsess) { state.savedSess = null; state.shareSess = d.shsess; render(); return; }
  if (d.shimg !== undefined) { LS.set("wk.shareOpt", { ...SHOPT(), img: d.shimg === "1" }); render(); return; }
  if (d.rshare) { state.rshare = { sel: [d.rshare], plan: false }; render(); return; }
  if (d.rsg !== undefined && state.rshare) { const ids = state.routines.filter(r => normVar(r.variant) === d.rsg).map(r => r.id), sel = new Set(state.rshare.sel), on = ids.every(i => sel.has(i)); ids.forEach(i => on ? sel.delete(i) : sel.add(i)); state.rshare.sel = [...sel]; render(); return; }
  if (d.rsr && state.rshare) { const sel = new Set(state.rshare.sel); sel.has(d.rsr) ? sel.delete(d.rsr) : sel.add(d.rsr); state.rshare.sel = [...sel]; render(); return; }
  if (d.inm && state.incoming) { const [i, m] = d.inm.split(":"); state.incoming.mode[+i] = m; render(); return; }
  if (d.inr !== undefined && state.incoming) { const sel = new Set(state.incoming.sel), i = +d.inr; sel.has(i) ? sel.delete(i) : sel.add(i); state.incoming.sel = [...sel].sort((x, y) => x - y); render(); return; }
  if (d.rday && state.editing) {
    readEditor(); const ed = state.editing, set = new Set(ed.days || []);
    if (d.rday === "all") WEEK_ORDER.forEach(x => set.add(x)); else if (d.rday === "none") set.clear(); else { const x = +d.rday; set.has(x) ? set.delete(x) : set.add(x); }
    ed.days = [...set]; render(); return;
  }
  if (d.prd && state.planDraft) { const [id, x] = d.prd.split(":"), m = planRmap(state.planDraft)[id]; if (m) { const k = +x; m.days = m.days.includes(k) ? m.days.filter(z => z !== k) : [...m.days, k]; } render(); return; }
  if (d.prx && state.planDraft) { const m = planRmap(state.planDraft)[d.prx]; if (m) { m.on = false; m.variant = ""; m.days = []; } render(); return; }
  if (d.pweek !== undefined) { state.plmenu = false; state.pweek = +d.pweek; render(); return; }
  if (d.pzdel !== undefined) { const p = PL.get(); if (!p) return; const l = planPauses(p); l.splice(+d.pzdel, 1); p.pauses = l; PL.save(p); state.pauseOpen = true; render(); return; }
  if (d.prm && state.planDraft) { state.planDraft.phases.splice(+d.prm, 1); render(); return; }
  if (d.pmv && state.planDraft) { const [i, dir] = d.pmv.split(":").map(Number), ph = state.planDraft.phases, j = i + dir; if (j >= 0 && j < ph.length) [ph[i], ph[j]] = [ph[j], ph[i]]; render(); return; }
  if (d.eopen !== undefined) { readEditor(); state.edOpen = state.edOpen === +d.eopen ? null : +d.eopen; render(); return; }
  if (d.ropen) { state.routOpen = d.ropen; render(); window.scrollTo(0, 0); return; }
  if (d.back) { if (d.back === "rout") state.routOpen = null; if (d.back === "set") state.setTab = null; render(); window.scrollTo(0, 0); return; }
  if (d.dup) {
    const r = state.routines.find(x => x.id === d.dup); if (!r) return;
    state.editing = normRoutine({ ...JSON.parse(JSON.stringify(r)), id: uid(), isNew: true, name: `${r.name} ${T("(copia)")}` }); state.edSel = null; state.edSec = null; render(); window.scrollTo(0, 0); return;
  }
  if (d.dsel) { state.day = d.dsel; state.dsheet = null; render(); return; }
  if (d.cycOpen) { state.tab = "diary"; state.day = d.cycOpen; state.dsheet = "cyc"; state.cycMonth = d.cycOpen.slice(0, 7); state.actForm = null; render(); return; }
  if (d.cycDay) { state.day = d.cycDay; render(); return; }
  if (d.cycM) { const m = state.cycMonth || (state.day || dayKey(Date.now())).slice(0, 7), [y, mo] = m.split("-").map(Number), nd = new Date(y, mo - 1 + +d.cycM, 1); state.cycMonth = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`; render(); return; }
  if (d.cycFlow) { const k = state.day || dayKey(Date.now()), ce = DY.get(k).cyc || {}; DY.set(k, { cyc: { ...ce, flow: ce.flow === d.cycFlow ? null : d.cycFlow } }); render(); return; }
  if (d.cycSym) { const k = state.day || dayKey(Date.now()), ce = DY.get(k).cyc || {}, l = new Set(ce.sym || []); l.has(d.cycSym) ? l.delete(d.cycSym) : l.add(d.cycSym); DY.set(k, { cyc: { ...ce, sym: [...l] } }); render(); return; }
  if (d.cycSdel !== undefined) { const l = CYC.syms(); l.splice(+d.cycSdel, 1); CYC.saveSyms(l); render(); return; }
  if (d.dsh) { state.dsheet = d.dsh; render(); return; }
  if (d.dgo) { const m = { sleep: ["hab", "sueno"], sup: ["hab", "suplementos"], ses: ["ent", "constancia"], steps: ["hab", "pasos"], act: ["hab", "actividad"], note: ["hab", "notas"], cyc: ["cue", "ciclo"], peso: ["cue", "peso"] }[d.dgo] || ["res"]; state.statsCat = m[0]; LS.set("wk.statsCat", m[0]); state.dsheet = null; state.tab = "stats"; render(); const el = m[1] && [...document.querySelectorAll("[data-sb]")].find(x => x.dataset.sb === m[1]); window.scrollTo(0, el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 8) : 0); return; }
  if (d.scat) { state.statsCat = d.scat; LS.set("wk.statsCat", d.scat); render(); window.scrollTo(0, 0); return; }
  if (d.sper) { LS.set("wk.statsPer", +d.sper); render(); return; }
  if (d.dmove) { const k = state.day || dayKey(Date.now()); state.day = d.dmove === "today" ? dayKey(Date.now()) : dayKey(addDays(keyTime(k), +d.dmove)); if (state.day > dayKey(Date.now())) state.day = dayKey(Date.now()); render(); return; }
  if (d.slq) { const k = state.day || dayKey(Date.now()), sl = DY.get(k).sleep || {}; DY.set(k, { sleep: { ...sl, q: sl.q === +d.slq ? 0 : +d.slq } }); render(); return; }
  if (d.stake) { const k = state.day || dayKey(Date.now()), e = DY.get(k), sp = { ...(e.supp || {}) }, cur = sp[d.stake] || {};
    const x = DY.supps().find(z => z.id === d.stake); sp[d.stake] = { ...cur, taken: !cur.taken, amount: cur.amount ?? x?.dose ?? "" }; DY.set(k, { supp: sp }); render(); return; }
  if (d.dtag) { const k = state.day || dayKey(Date.now()), tg = new Set(DY.get(k).tags || []); tg.has(d.dtag) ? tg.delete(d.dtag) : tg.add(d.dtag); DY.set(k, { tags: [...tg] }); render(); return; }
  if (d.sdel) { if (!confirm(T("¿Eliminar este suplemento? Su historial también se dejará de mostrar."))) return; DY.saveSupps(DY.supps().filter(x => x.id !== d.sdel)); render(); return; }
  if (d.sarch) { DY.saveSupps(DY.supps().map(x => x.id === d.sarch ? { ...x, archived: !x.archived } : x)); render(); return; }
  if (d.shide) { const h = new Set(LS.get("wk.statsHidden", [])); h.has(d.shide) ? h.delete(d.shide) : h.add(d.shide); LS.set("wk.statsHidden", [...h]); render(); return; }
  if (d.day) { state.pweek = null; state.day = d.day; state.dsheet = null; state.dnote = null; state.tab = "diary"; render(); window.scrollTo(0, 0); return; }
  if (d.wdel) { if (!confirm(T("¿Borrar este registro de peso?"))) return; W.save(W.list().filter(x => x.id !== d.wdel)); render(); return; }
  if (d.statex) { state.statEx = state.statEx === d.statex ? null : d.statex; render(); return; }
  if (d.langSet) { LS.set("wk.lang", d.langSet); setLang(d.langSet); render(); return; }
  if (d.themeSet) { applyTheme(d.themeSet); LS.set("wk.theme", d.themeSet); render(); return; }
  if (d.atype !== undefined && state.actForm) { state.actForm.type = d.atype; render(); return; }
  if (d.awhen !== undefined && state.actForm) { state.actForm.date = d.awhen; render(); return; }
  if (d.aunit !== undefined) { LS.set("wk.distUnit", d.aunit); render(); return; }
  if (d.atf !== undefined) { state.actType = d.atf; render(); return; }
  if (d.amet !== undefined) { state.actMet = d.amet; render(); return; }
  if (d.adel !== undefined) { if (!confirm(T("¿Eliminar esta actividad?"))) return; ACT.save(ACT.list().filter(x => x.id !== d.adel)); toast(T("Actividad eliminada")); render(); return; }
  if (d.goex !== undefined && a) { state.skipAsk = null; state.exView = +d.goex; state.sheet = false; render(); window.scrollTo(0, 0); return; }
  if ((d.play || d.done || d.addset) && a) resumeIfPaused();
  if (d.play && a) {
    const [ei, si] = d.play.split(":").map(Number);
    if (run) { toast(T("Termina o para la serie en curso")); return; }
    startTimed(ei, si); return;
  }
  if (d.type && a) {
    const e = a.exercises[+d.type]; cancelRun();
    e.type = isTime(e) ? "reps" : "time"; saveActive(); render(); return;
  }
  if (d.done && a) {
    const [ei, si] = d.done.split(":").map(Number); const s = a.exercises[ei].sets[si];
    s.done = !s.done; if (!s.done) delete s.rir; state.rirAsk = s.done && EFF().rir ? { ei, si } : null; saveActive();
    if (s.done && !run) { const q = afterSet(ei, si); if (q.length) { unlockAudio(); startRun(q); return; } advanceIfDone(ei, si); }
    render(); return;
  }
  if (d.addset && a) {
    const e = a.exercises[+d.addset]; const last = e.sets[e.sets.length - 1];
    e.sets.push({ w: last?.w ?? "", r: last?.r ?? "", r2: last ? R2(last) : "", done: false }); saveActive(); render(); return;
  }
  if (d.rmset && a) { cancelRun(); const [ei, si] = d.rmset.split(":").map(Number); a.exercises[ei].sets.splice(si, 1); saveActive(); render(); return; }
  if (d.rmex && a) { if (!confirm(T("¿Quitar \"{x}\" de la sesión?", { x: a.exercises[+d.rmex].name }))) return; cancelRun(); a.exercises.splice(+d.rmex, 1); saveActive(); render(); return; }
  if (d.edit) { const r = state.routines.find(x => x.id === d.edit); state.editing = normRoutine(JSON.parse(JSON.stringify(r))); state.edSel = null; state.edSec = null; state.edOpen = null; render(); window.scrollTo(0, 0); return; }
  if (d.pmode && state.print) { state.print.mode = d.pmode; render(); return; }
  if (d.rprint) { state.print = { rid: d.rprint, mode: "ej", two: false, cal: false }; render(); window.scrollTo(0, 0); return; }
  if (d.emv && state.editing) { readEditor(); const [i, dir] = d.emv.split(":").map(Number); edMove(i, dir); render(); return; }
  if (d.edadd && state.editing) { readEditor(); const x = CATBY[d.edadd]; if (!x) return; const i = edAdd(newFromCat(x)); toast(T("Añadido")); render(); document.querySelector(`[data-dex="${i}"]`)?.scrollIntoView({ block: "nearest" }); return; }
  if (d.seccur && state.editing) { readEditor(); state.edSec = d.seccur; render(); return; }
  if (d.secmv && state.editing) { readEditor(); const ed = state.editing, [id, dir] = d.secmv.split(":"), i = ed.secs.findIndex(x => x.id === id), j = i + +dir; if (j >= 0 && j < ed.secs.length) { [ed.secs[i], ed.secs[j]] = [ed.secs[j], ed.secs[i]]; normRoutine(ed); } state.edSel = null; render(); return; }
  if (d.secdel && state.editing) { readEditor(); const ed = state.editing, i = ed.secs.findIndex(x => x.id === d.secdel), x = ed.secs[i], nb = ed.secs[i - 1] || ed.secs[i + 1], m = ed.exercises.filter(e => e.sec === d.secdel);
    if (m.length && !confirm(nb ? T("¿Quitar la sección «{x}»? Sus ejercicios pasan a «{y}».", { x: x.name, y: nb.name }) : T("¿Quitar la sección «{x}»? Los ejercicios se quedan en la rutina.", { x: x.name }))) return;
    m.forEach(e => e.sec = nb?.id); ed.secs.splice(i, 1); state.edSel = null; normRoutine(ed); render(); return; }
  if (d.gsplit && state.editing) { readEditor(); const ed = state.editing; ed.exercises.forEach(e => { if (e.grp === d.gsplit) delete e.grp; }); delete ed.groups[d.gsplit]; state.edSel = null; normRoutine(ed); render(); return; }
  if (d.rmre) { readEditor(); state.editing.exercises.splice(+d.rmre, 1); state.edSel = null; normRoutine(state.editing); render(); return; }
  if (d.delsess) {
    if (!confirm(T("¿Eliminar esta sesión? No se puede deshacer."))) return;
    state.sessions = state.sessions.filter(s => s.id !== d.delsess); await store.deleteSession(d.delsess); toast(T("Sesión eliminada")); render(); return;
  }
  switch (d.act) {
    case "prog-unmute": LS.set("wk.progMute", []); toast(T("Hecho")); render(); break;
    case "ai-open": { const f = aiProf(); state.ai = { step: 1, weeks: 8, inc: Object.fromEntries(AI_INC.map(([k]) => [k, true])), f: { ...(f || {}) }, save: true, txt: "" }; render(); break; }
    case "ai-close": state.ai = null; render(); break;
    case "aip-open": aipOpen(); break;
    case "aip-close": { const a = state.aip; if (!a) break;   // cerrar: con «Recordar mis respuestas», se guardan; si no, se avisa
      if (a.keep) { aipSave(); if (a.step) toast(T("Respuestas guardadas para la próxima vez")); } else if (a.step && !confirm(T("¿Salir sin guardar tus respuestas?"))) break;
      state.aip = null; render(); break; }
    case "aip-next": state.aip.step = Math.min(3, state.aip.step + 1); render(); document.querySelector(".mbox.aip")?.scrollTo(0, 0); break;
    case "aip-back": state.aip.step = Math.max(0, state.aip.step - 1); render(); document.querySelector(".mbox.aip")?.scrollTo(0, 0); break;
    case "aip-copy": { aipSave(); const ok = await copyText(aipBuild(state.aip)); toast(ok ? T("Indicaciones copiadas") : T("No se pudo copiar")); break; }
    case "aip-file": { aipSave(); const pm = curProf(), pn = multiProf() ? `-${fileSlug(profName(pm))}` : ""; await deliver(`usus-${fileSlug(T("plan con IA"))}${pn}-${stamp()}.txt`, aipBuild(state.aip), "text/plain"); break; }
    case "aip-clip": case "ai-clip": {   // leer la respuesta del portapapeles; si no se puede, cuadro para pegar a mano
      const st = d.act === "aip-clip" ? state.aip : state.ai; if (!st) break;
      let t = ""; try { t = await navigator.clipboard.readText(); } catch {}
      if (!t) { st.manual = true; render(); $(d.act === "aip-clip" ? "#aipPaste" : "#aiPaste")?.focus(); toast(T("No se ha podido leer lo copiado: pégalo aquí")); break; }
      const inc = aiParse(t); if (!inc) { toast(T("Lo copiado no tiene rutinas de Usus. Copia la respuesta de la IA (o su bloque de código) y vuelve a probar.")); break; }
      if (d.act === "aip-clip") { aipSave(); state.aip = null; } else state.ai = null;
      state.incoming = { ...inc, ai: true }; render(); break; }
    case "aip-paste": { const inc = aiParse($("#aipPaste")?.value || ""); if (!inc) { toast(T("No se han encontrado rutinas de Usus en la respuesta")); return; } aipSave(); state.aip = null; state.incoming = { ...inc, ai: true }; render(); break; }
    case "ai-back": state.ai.step = 1; render(); break;
    case "ai-gen": { const a = state.ai; if (a.save && aiHasData(a.f)) LS.set("wk.aiProf", a.f); a.txt = aiBuild(a); a.step = 2; render(); document.querySelector(".mbox.dsh")?.scrollTo(0, 0); break; }
    case "ai-copy": { const ok = await copyText(state.ai.txt); toast(ok ? T("Copiado") : T("No se pudo copiar")); break; }
    case "ai-file": { const pm = curProf(), pn = multiProf() ? `-${fileSlug(profName(pm))}` : ""; await deliver(`usus-${fileSlug(T("analisis"))}${pn}-${stamp()}.txt`, state.ai.txt, "text/plain"); break; }
    case "ai-paste": { const inc = aiParse($("#aiPaste")?.value || ""); if (!inc) { toast(T("No se han encontrado rutinas de Usus en la respuesta")); return; } state.ai = null; state.incoming = { ...inc, ai: true }; render(); break; }
    case "ap-save": { const f = readAiFields("ap_"); LS.set("wk.aiProf", aiHasData(f) ? f : null); toast(T("Guardado")); render(); break; }
    case "ap-del": if (!confirm(T("¿Borrar los datos para el análisis? El resto de datos no se toca."))) return; LS.set("wk.aiProf", null); toast(T("Datos borrados")); render(); break;
    case "cx-open": state.csvx = { weeks: 0 }; render(); break;
    case "cx-close": state.csvx = null; render(); break;
    case "cx-go": { const pm = curProf(), pn = multiProf() ? `-${fileSlug(profName(pm))}` : ""; const files = csvBuild(state.csvx.weeks);
      if (Object.keys(files).length < 2) { toast(T("No hay datos para exportar")); return; }
      const ok = await deliver(`usus-${fileSlug(T("datos"))}${pn}-${stamp()}.zip`, makeZip(files), "application/zip"); if (ok) { state.csvx = null; render(); } break; }
    case "sw-cancel": state.swap = null; render(); break;
    case "sw-ok": { const n = ($("#swName")?.value || "").trim(); if (!n) { $("#swName")?.focus(); return; } const cx = catReady() ? catMatch(n, true) : null; swapTo(state.swap.ei, cx ? xName(cx) : n, cx?.id || null, cx); state.swap = null; toast(T("Cambiado solo en esta sesión")); render(); break; }
    case "sw-routine": { const s = state.sessions.find(x => x.id === state.savedSess); if (s) { swapToRoutine(s); state.swapDone = s.id; toast(T("Rutina actualizada")); } render(); break; }
    case "pg-cancel": state.progChange = null; render(); break;
    case "pg-ok": { const c = state.progChange, p = state.progProps?.[c.k]; if (p && progApply(p, c.tgt)) { state.progProps.splice(c.k, 1); toast(T("Rutina actualizada")); } state.progChange = null; render(); break; }
    case "dnote-close": state.dnote = null; render(); break;
    case "snote-done": state.sessOpen = state.sessNoteEd; state.sessNoteEd = null; render(); break;
    case "apk-tip-no": LS.set("wk.apkTip", true); render(); break;
    case "pu-ok": { const L = LS.get("wk.planUpLog", null); if (L) { L.seen = true; LS.set("wk.planUpLog", L); } render(); break; }
    case "pu-undo": planUpUndo(); toast(T("Cambios deshechos")); render(); break;
    case "xi-close": state.exInfo = null; state.exInfoAdd = false; render(); break;
    case "gp-open": await gpOpen(); break;
    case "gp-back": { const g = state.gp; if (!g) break; if (g.step) g.step--; else state.gp = null; render(); document.querySelector(".mbox.gp")?.scrollTo(0, 0); break; }
    case "gp-close": if (state.gp?.step && !confirm(T("¿Salir del plan guiado? Se perderán tus respuestas."))) break; state.gp = null; render(); break;
    case "gp-next": { const g = state.gp; if (!g) break; if (GP_STEPS[g.step] === "level") { g.plan = gpBuild(g); g.tab = 0; if (!g.plan) break; } g.step = Math.min(GP_STEPS.length - 1, g.step + 1); render(); document.querySelector(".mbox.gp")?.scrollTo(0, 0); break; }
    case "gp-create": await gpCreate(); break;
    case "xi-add": state.exInfoAdd = true; render(); break;
    case "xpick-ed": readEditor(); state.xpick = { mode: "ed", q: "" }; render(); break;
    case "xpick-sess": state.xpick = { mode: "sess", q: ($("#newEx")?.value || "").trim() }; render(); break;
    case "xp-close": state.xpick = null; render(); break;
    case "xp-own": {
      const p = state.xpick, q = (p?.q || "").trim(); state.xpick = null;
      if (p?.mode === "ed") { const i = edAdd({ name: q, sets: 3, reps: 10, type: "reps" }); render(); const inp = document.querySelector(`[data-en="${i}"]`); if (inp && !q) inp.focus(); }
      else if (p?.mode === "swap" && a) { if (q) { swapTo(p.ei, q, null); toast(T("Cambiado solo en esta sesión")); render(); } else { state.swap = { ei: p.ei }; render(); $("#swName")?.focus(); } }
      else if (p?.mode === "sess" && a) { if (q) { a.exercises.push(buildExercise(q)); state.exView = a.pre ? null : a.exercises.length - 1; state.sheet = false; saveActive(); } render(); if (!q) $("#newEx")?.focus(); }
      break;
    }
    case "om-cancel": state.ownMat = null; render(); break;
    case "om-ok": { const o = state.ownMat, e = state.editing?.exercises[o.i]; if (e) { e.equip = o.equip.filter(k => MAT[k]); e.other = ($("#omOther")?.value || "").trim().slice(0, 40); } state.ownMat = null; render(); break; }
    case "cat-yes": {
      LS.set("wk.catalog", true); state.catAsk = false; render();
      const c = await loadCatalog();
      if (!c) { toast(T("No se pudo cargar el catálogo. Se volverá a intentar al abrir la app.")); render(); break; }
      if (linkCandidates().some(it => catMatch(it.name))) { linkOpen(); toast(T("Catálogo activado")); } else toast(T("Catálogo activado"));
      render(); window.scrollTo(0, 0); break;
    }
    case "cat-no": LS.set("wk.catalog", false); state.catAsk = false; render(); break;
    case "link-open": linkOpen(); render(); window.scrollTo(0, 0); break;
    case "ln-all": state.link.items.forEach(it => { if (it.to && !state.link.done[it.k] && !(LS.get("wk.linkOwn", []) || []).includes(it.k)) linkApply(it.k, it.to); }); toast(T("Propuestas aceptadas")); render(); break;
    case "ln-close": state.link = null; state.setTab = "entreno"; render(); window.scrollTo(0, 0); break;
    case "act-open": actFormInit(state.tab === "diary" ? state.day : null); render(); window.scrollTo(0, 0); break;
    case "act-set": state.actSet = !state.actSet; render(); break;
    case "act-cancel": state.actForm = null; render(); break;
    case "act-newtype": state.actForm.newT = true; render(); document.getElementById("afnt")?.focus(); break;
    case "act-addtype": { const v = (document.getElementById("afnt")?.value || "").trim().slice(0, 24); if (!v) return; const t = ACT.types(); if (!t.includes(v)) { t.push(v); ACT.saveTypes(t); } state.actForm.type = v; state.actForm.newT = false; render(); break; }
    case "act-save": {
      const f = state.actForm, v = actVals(f); if (!v.km && !v.min) { toast(T("Pon la distancia o el tiempo")); return; }
      ACT.save([...ACT.list(), { id: uid(), k: f.date, type: f.type, km: Math.round(v.km * 100) / 100, min: Math.round(v.min), note: f.note.trim().slice(0, 140) }]);
      state.day = f.date; state.actForm = null; state.tab = "diary"; toast(T("Actividad guardada")); render(); window.scrollTo(0, 0); break;
    }
    case "discard": if (confirm(T("¿Descartar la sesión en curso? Se perderán los datos."))) { cancelRun(); state.active = null; saveActive(); render(); } break;
    case "finish": await finishSession(); break;
    case "run-pause": pauseRun(); break;
    case "sess-pause": toggleSessionPause(); break;
    case "run-skip": if (run) { if (run.paused) { run.end = Date.now() + run.rem; run.paused = false; } run.lead = null; phaseDone(false); } break;
    case "run-adj": adjRun(+d.d); break;
    case "sess-begin": a.pre = false; a.start = Date.now(); a.pausedMs = 0; a.pausedAt = null; state.exView = null; saveActive(); unlockAudio(); render(); window.scrollTo(0, 0); break;
    case "dsheet-close": state.dsheet = null; state.cycSymEdit = false; render(); break;
    case "cyc-start": if (cycStartOn(dayKey(Date.now()))) toast(T("Regla registrada")); render(); break;
    case "cyc-end": if (cycEndOn(dayKey(Date.now()))) toast(T("Fin de la regla registrado")); render(); break;
    case "cyc-start-day": { const k = state.day || dayKey(Date.now()); if (cycStartOn(k)) toast(T("Regla registrada · {d}", { d: kFmt(k) })); render(); break; }
    case "cyc-end-day": { const k = state.day || dayKey(Date.now()); if (cycEndOn(k)) toast(T("Fin de la regla · {d}", { d: kFmt(k) })); render(); break; }
    case "cyc-del-start": { const k = state.day || dayKey(Date.now()); if (!confirm(T("¿Quitar la regla que empieza este día?"))) return; CYC.save(CYC.list().filter(x => x.s !== k)); render(); break; }
    case "cyc-first": { const v = $("#cycFirst")?.value; if (!v) return; cycStartOn(v > dayKey(Date.now()) ? dayKey(Date.now()) : v); toast(T("Regla registrada")); render(); break; }
    case "cyc-warn-ok": { const r = cycCalc(); LS.set("wk.cycWarnSeen", r.next || ""); render(); break; }
    case "cyc-sym-edit": state.cycSymEdit = !state.cycSymEdit; render(); break;
    case "cyc-sym-add": { const v = ($("#cycNewSym")?.value || "").trim().slice(0, 28); if (!v) return; const l = CYC.syms(); if (!l.some(x => x.toLowerCase() === v.toLowerCase() || T(x).toLowerCase() === v.toLowerCase())) { l.push(v); CYC.saveSyms(l); } render(); break; }
    case "cyc-ack-ok": CYC.set({ on: true, ack: true }); state.cycAsk = false; toast(T("Seguimiento del ciclo activado")); render(); break;
    case "cyc-ack-no": state.cycAsk = false; render(); break;
    case "cyc-wipe": if (!confirm(T("Se borrarán las reglas, síntomas y ajustes del ciclo. El resto de datos no se toca. ¿Continuar?"))) return;
      { CYC.save([]); LS.set("wk.cyc", null); LS.set("wk.cycSyms", null); LS.set("wk.cycWarnSeen", ""); const dd = DY.all(); Object.values(dd).forEach(v => delete v.cyc); LS.set("wk.diary", dd); toast(T("Datos del ciclo borrados")); render(); } break;
    case "sheet-open": state.sheet = true; render(); break;
    case "sheet-close": state.sheet = false; render(); break;
    case "ex-prev": state.skipAsk = null; state.exView = Math.max(0, curEx(a) - 1); render(); window.scrollTo(0, 0); break;
    case "ex-next": state.skipAsk = null; state.exView = Math.min(a.exercises.length - 1, curEx(a) + 1); render(); window.scrollTo(0, 0); break;
    case "ex-skip": state.skipAsk = curEx(a); render(); document.querySelector(".skipask")?.scrollIntoView({ block: "center", behavior: "smooth" }); break;
    case "skip-no": state.skipAsk = null; render(); break;
    case "set-next": { const ei = curEx(a), si = a.exercises[ei].sets.findIndex(x => !x.done); if (si >= 0) document.querySelector(`[data-done="${ei}:${si}"],[data-play="${ei}:${si}"]`)?.click(); break; }
    case "run-stop": stopRun(); break;
    case "news-all": state.newsOpen = "all"; render(); break;
    case "news-close": LS.set("wk.seenVersion", APP_VERSION); state.newsOpen = null; render(); break;
    case "news-open": state.newsOpen = "all"; render(); break;
    case "install": if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch {} installEvt = null; render(); } break;
    case "suppedit": state.suppEdit = !state.suppEdit; render(); break;
    case "suppadd": { const l = DY.supps(); l.push({ id: uid(), name: "", dose: "", unit: "", when: "", created: Date.now() }); DY.saveSupps(l); state.suppEdit = true; render();
      document.querySelector(`[data-sn="${l[l.length - 1].id}"]`)?.focus(); break; }
    case "welcome-ok": wizDone(); render(); break;
    case "wiz-next": state.wiz = (state.wiz || 0) + 1; render(); $(".modal .mbox")?.scrollTo(0, 0); break;
    case "wiz-back": state.wiz = Math.max(0, (state.wiz || 0) - 1); render(); break;
    case "wiz-cat-yes": LS.set("wk.catalog", true); state.wiz = 2; render(); loadCatalog().then(c => { if (!c) toast(T("No se pudo cargar el catálogo. Se volverá a intentar al abrir la app.")); render(); }); break;
    case "wiz-cat-no": LS.set("wk.catalog", false); state.wiz = 2; render(); break;
    case "wiz-end": wizDone(); state.tab = "train"; render(); window.scrollTo(0, 0); break;
    case "wiz-new": wizDone(); state.tab = "routines"; state.edSel = null; state.edSec = null; state.edQ = ""; state.editing = { id: uid(), isNew: true, name: "", variant: "", days: [], exercises: [{ name: "", sets: 3, reps: 10, type: "reps" }] }; render(); window.scrollTo(0, 0); break;
    case "wiz-imp": $("#wizFile")?.click(); break;
    case "prof-pick": state.ppick = true; render(); break;
    case "prof-pick-close": state.ppick = false; render(); break;
    case "prof-add": startAddProfile(); break;
    case "pf-cancel": state.pform = null; render(); break;
    case "pf-close": { const f = state.pform; if (f && (f.step === "confirm" || ($("#pfName")?.value || f.name || "").trim()) && !confirm(T("¿Salir sin crear el perfil?"))) break; state.pform = null; render(); break; }
    case "pf-next": profFormNext(); break;
    case "pf-back": state.pform.step = "form"; render(); break;
    case "pf-ok": profFormOk(); break;
    case "prof-edit": state.pedit = {}; render(); break;
    case "pe-cancel": state.pedit = null; render(); break;
    case "pe-ok": profEditOk(); break;
    case "prof-copy": { const o = PROFS().find(p => p.id !== PROF); state.pcopy = { to: o?.id, sel: state.routines.map(r => r.id) }; render(); break; }
    case "pk-cancel": state.pcopy = null; render(); break;
    case "pk-ok": profCopyOk(); break;
    case "prof-del": profDelete(); break;
    case "about-repo": openExt(REPO); break;
    case "about-bug": state.issue = "bug"; render(); break;
    case "about-idea": state.issue = "idea"; render(); break;
    case "issue-close": state.issue = null; render(); break;
    case "issue-go": { const u = issueURL(state.issue); state.issue = null; render(); openExt(u); break; }
    case "share-app": await shareOut({ title: "Usus", text: shareAppText(), url: appURL() }); break;
    case "saved-close": state.savedSess = null; state.progProps = null; render(); break;
    case "shsess-close": state.shareSess = null; render(); break;
    case "shsess-copy": await sessShareGo("copy"); break;
    case "shsess-save": await sessShareGo("save"); break;
    case "shsess-go": await sessShareGo("share"); break;
    case "rs-open": state.rshare = { sel: state.routines.map(r => r.id), plan: !!PL.get() }; render(); break;
    case "rs-close": state.rshare = null; render(); break;
    case "rs-file": await shareRoutGo("file"); break;
    case "rs-link": await shareRoutGo("link"); break;
    case "in-no": state.incoming = null; render(); break;
    case "in-close": if (!confirm(state.incoming?.ai ? T("¿Descartar la propuesta de la IA? No se añadirá nada.") : T("¿Salir sin añadir nada?"))) break; state.incoming = null; render(); break;
    case "in-yes": await incomingAdd(); break;
    case "notice-open": state.notice = true; render(); break;
    case "notice-close": state.notice = false; render(); break;
    case "welcome-show": LS.set("wk.welcomed", false); state.wiz = 0; render(); break;
    case "statsedit": state.statsEdit = !state.statsEdit; render(); break;
    case "testfx": { const m = fxMode(); if (m === "off") { toast(T("Avisos desactivados")); break; } unlockAudio(); beepEnd(); flash(); const v = buzz([400, 150, 400, 150, 400]);
      toast(m === "sound" ? T("¿Has oído 3 pitidos?") : !v ? T("Este navegador no permite vibrar") : m === "vib" ? T("¿Has notado la vibración?") : T("¿Has oído 3 pitidos y notado la vibración?")); } break;
    case "addex": {
      const inp = $("#newEx"); const n = inp.value.trim(); if (!n) { inp.focus(); return; }
      const cx = catReady() ? catMatch(n, true) : null;
      a.exercises.push(cx ? buildExercise(xName(cx), 3, "", cx.type, !!cx.sides, null, cx.id) : buildExercise(n)); state.exView = a.pre ? null : a.exercises.length - 1; state.sheet = false; saveActive(); render(); break;
    }
    case "newroutine": state.edOpen = null; state.edSel = null; state.edSec = null; state.edQ = ""; state.editing = { id: uid(), isNew: true, name: "", variant: "", days: [], exercises: [{ name: "", sets: 3, reps: 10, type: "reps" }] }; render(); break;
    case "addre": { readEditor(); const i = edAdd({ name: "", sets: 3, reps: 10, type: "reps" }); state.edOpen = i; render();
      document.querySelector(`[data-en="${i}"]`)?.focus(); break; }
    case "plan-open": state.plmenu = false; readEditor(); state.editing = null; state.tab = "routines"; state.routView = "plan"; state.routOpen = null; state.planMode = null; render(); window.scrollTo(0, 0); break;
    case "plan-new": state.tab = "routines"; state.routView = "plan"; state.planNew = true; state.planDraft = newPlanDraft(); state.planMode = "edit"; render(); window.scrollTo(0, 0); break;
    case "plan-dup": { const a = PL.get(); if (!a) break; const l = PLS.list(); l.unshift({ ...JSON.parse(JSON.stringify(a)), id: uid(), name: T("Copia de {x}", { x: planName(a) }) }); PLS.save(l); state.plansOpen = true; toast(T("Plan duplicado. Actívalo para editarlo.")); render(); break; }
    case "plan-create": state.planNew = false; state.tab = "routines"; state.routView = "plan"; state.planDraft = newPlanDraft(); state.planMode = "edit"; render(); window.scrollTo(0, 0); break;
    case "plan-edit": state.plmenu = false; state.planNew = false; state.tab = "routines"; state.routView = "plan"; state.planDraft = JSON.parse(JSON.stringify(PL.get() || newPlanDraft())); state.planDraft.phases.forEach(x => x.id = x.id || uid()); state.planMode = "edit"; render(); window.scrollTo(0, 0); break;
    case "pl-postpone": { const pn = planNow(); if (pn?.status !== "on") break; const wk = dayKey(pn.w.t), sh = SHIFT.get(), i = (new Date().getDay() + 6) % 7;
      SHIFT.set(sh && sh.week === wk ? { ...sh, by: sh.by + 1 } : { week: wk, from: i, by: 1 }); toast(T("Aplazado a mañana")); render(); break; }
    case "pl-menu": state.plmenu = true; render(); break;
    case "plm-close": state.plmenu = false; render(); break;
    case "pl-pausego": state.plmenu = false; state.tab = "routines"; state.routView = "plan"; state.pauseOpen = true; render(); setTimeout(() => $("details[data-pauses]")?.scrollIntoView({ block: "center" }), 0); break;
    case "pw-close": state.pweek = null; render(); break;
    case "pl-unshift": SHIFT.set(null); render(); break;
    case "pl-deload": state.plmenu = false; { const p = PL.get(), pn = planNow(); if (!p || pn?.status !== "on") break;
      if (!confirm(T("¿Hacer descarga esta semana? Hasta el domingo solo se sugieren las rutinas de todas las semanas, y el plan no avanza."))) return;
      p.pauses = [...planPauses(p), { from: dayKey(weekStart(Date.now())), weeks: 1, kind: "deload" }]; PL.save(p); SHIFT.set(null); toast(T("Semana de descarga")); render(); break; }
    case "pl-pause": { const p = PL.get(); if (!p) break; const n = +($("#pzW")?.value || 1), f = +($("#pzF")?.value || 0), from = dayKey(addDays(weekStart(Date.now()), 7 * f));
      if (planPauses(p).some(x => x.from === from)) { toast(T("Ya hay una pausa esa semana")); return; }
      p.pauses = [...planPauses(p), { from, weeks: n, kind: "pause" }]; PL.save(p); if (!f) SHIFT.set(null); state.pauseOpen = true; toast(T("Plan en pausa")); render(); break; }
    case "plan-addph": { const used = new Set(state.planDraft.phases.map(x => x.variant)), nx = "ABCDEFGH".split("").find(c => !used.has(c)) || ""; state.planDraft.phases.push({ id: uid(), variant: nx, weeks: 2 }); render(); break; }
    case "plan-cancel": state.planDraft = null; state.planMode = null; state.planNew = false; render(); setTimeout(() => $("#planSec")?.scrollIntoView({ block: "start" }), 0); break;
    case "plan-save": {
      const dr = state.planDraft; dr.phases = dr.phases.filter(x => normVar(x.variant));
      if (!dr.start) { toast(T("Pon la fecha de inicio")); return; }
      if (!dr.phases.length) { toast(T("Añade al menos una fase con variante")); return; }
      if (dr.review && dr.review <= dr.start) { toast(T("La revisión debe ser posterior al inicio")); return; }
      if (state.planNew) { const old = PL.get(); if (old) PLS.save([{ ...old, id: old.id || uid() }, ...PLS.list()]); dr.id = uid(); }
      dr.id = dr.id || uid(); planRmapSave(dr); PL.save(dr); state.planDraft = null; state.planMode = null; state.planNew = false; toast(T("Plan guardado")); render(); setTimeout(() => $("#planSec")?.scrollIntoView({ block: "start" }), 0); break;
    }
    case "plan-del": if (!confirm(T("¿Eliminar el plan? Tus rutinas y sesiones no se tocan."))) return; LS.set("wk.plan", null); state.planDraft = null; state.planMode = null; render(); break;
    case "print-close": state.print = null; render(); break;
    case "print-go": printNow(); break;
    case "cancelroutine": state.editing = null; state.edSel = null; render(); break;
    case "sec-preset": { readEditor(); const ed = state.editing; ed.secs = SEC_PRESET.map(n => ({ id: uid(), name: T(n) })); ed.exercises.forEach(e => e.sec = ed.secs[1].id); state.edSec = ed.secs[1].id; normRoutine(ed); render(); break; }
    case "sec-add": { readEditor(); const ed = state.editing, x = { id: uid(), name: T("Sección {n}", { n: (ed.secs || []).length + 1 }) }; ed.secs = [...(ed.secs || []), x]; state.edSec = x.id; render(); setTimeout(() => { const i = document.querySelector(`[data-secn="${x.id}"]`); i?.focus(); i?.select(); }, 0); break; }
    case "sel-clear": readEditor(); state.edSel = null; render(); break;
    case "ed-group": { readEditor(); const ed = state.editing, idx = [...(state.edSel || [])].sort((x, y) => x - y), items = idx.map(i => ed.exercises[i]).filter(Boolean); if (items.length < 2) break;
      const gid = uid(); ed.groups = { ...(ed.groups || {}), [gid]: { kind: items.length > 2 ? "cir" : "sup", rounds: Math.max(...items.map(e => +e.sets || 3)), rest: 90, restAfter: null } };
      const at = idx[0]; ed.exercises = ed.exercises.filter((e, i) => !idx.includes(i)); items.forEach(e => { e.grp = gid; e.rest = null; if (items[0].sec) e.sec = items[0].sec; });
      ed.exercises.splice(Math.min(at, ed.exercises.length), 0, ...items); state.edSel = null; normRoutine(ed); render(); break; }
    case "saveroutine": {
      readEditor(); const ed = state.editing;
      if (!ed.name.trim()) { toast(T("Ponle un nombre a la rutina")); $("#rName").focus(); return; }
      const clean = { id: ed.id, name: ed.name.trim(), block: ed.block || guessBlock(ed.name), variant: normVar(ed.variant ?? guessVariant(ed.name)), days: Array.isArray(ed.days) ? [...new Set(ed.days)].sort() : guessDays(ed.name), ...(ed.secs?.length ? { secs: ed.secs.map(x => ({ id: x.id, name: x.name })) } : {}), ...(ed.groups ? { groups: JSON.parse(JSON.stringify(ed.groups)) } : {}), exercises: ed.exercises.filter(e => e.name.trim()).map(e => ({ name: e.name.trim(), ...(e.sec ? { sec: e.sec } : {}), ...(e.grp ? { grp: e.grp } : {}), ...(e.xid ? { xid: e.xid } : {}), ...(e.xid && techOf(e) ? { tech: techOf(e) } : {}), ...(e.equip?.length ? { equip: e.equip.filter(k => MAT[k]) } : {}), ...(e.other ? { other: String(e.other).trim().slice(0, 40) } : {}), sets: Math.max(1, +e.sets || 3), reps: Math.max(1, +e.reps || 10), type: e.type === "time" ? "time" : "reps", sides: !!e.sides, ...(+e.rest > 0 ? { rest: Math.round(+e.rest) } : {}), ...(e.restAfter !== null && e.restAfter !== undefined && e.restAfter !== "" ? { restAfter: Math.max(0, Math.round(+e.restAfter)) } : {}) })) };
      normRoutine(clean);
      const i = state.routines.findIndex(r => r.id === ed.id);
      if (i >= 0) state.routines[i] = clean; else state.routines.push(clean);
      state.editing = null; state.edSel = null; await store.saveRoutines(state.routines); toast(T("Rutina guardada")); render(); break;
    }
    case "exp-all": {
      const pm = curProf(), pn = multiProf() ? `-${fileSlug(profName(pm))}` : "";
      const ok = await deliver(`usus-${T("copia")}${pn}-${stamp()}.json`, JSON.stringify({ app: "usus", version: DATA_VERSION, exported: new Date().toISOString(), ...(pm.sex ? { profile: { name: pm.name, sex: pm.sex, color: pm.color } } : {}), routines: state.routines, sessions: state.sessions, weights: W.list(), weightGoal: W.goal(), diary: DY.all(), cycle: { periods: CYC.list(), symptoms: CYC.syms(), settings: CYC.cfg() }, supplements: DY.supps(), activities: ACT.list(), activityTypes: ACT.types(), goals: LS.get("wk.goals", null), plan: PL.get(), plans: PLS.list(), ...(aiHasData(aiProf()) ? { aiProfile: aiProf() } : {}), ...(LS.get("wk.aiPlan", null) ? { aiPlan: LS.get("wk.aiPlan", null) } : {}) }, null, 2), "application/json");
      if (ok) { LS.set("wk.lastBackup", Date.now()); render(); } break;
    }
    case "w-add": {
      const isBan = false, inp = $("#wKg"), kg = parseKg(inp?.value);
      if (kg === null) { toast(T("Escribe un peso válido, por ejemplo {v}", { v: fmtNum(74.6) })); inp?.focus(); return; }
      let t = Date.now();
      if (!isBan) { const v = $("#wDate")?.value; if (v) { const [y, m, dd] = v.split("-").map(Number); t = new Date(y, m - 1, dd).getTime(); } }
      addWeight(t, kg); toast(T("Peso guardado: {v}", { v: fmtW(kg) })); render(); break;
    }
    case "w-open": state.tab = "diary"; state.day = dayKey(Date.now()); state.dsheet = "peso"; render(); setTimeout(() => $("#wKg")?.focus(), 0); break;
    case "go-perfil": state.dsheet = null; state.tab = "data"; state.setTab = "perfil"; render(); window.scrollTo(0, 0); break;
    case "w-skip": LS.set("wk.weightSkip", weekStart(Date.now())); render(); break;
    case "w-goal": { const v = $("#wGoal")?.value.trim(); if (!v) { LS.set("wk.weightGoal", null); toast(T("Objetivo quitado")); render(); break; }
      const g = parseKg(v); if (g === null) { toast(T("Escribe un objetivo válido, por ejemplo {v}", { v: 70 })); return; } LS.set("wk.weightGoal", g); toast(T("Objetivo: {v}", { v: fmtW(g) })); render(); break; }
    case "bk-later": LS.set("wk.backupSnooze", Date.now() + SNOOZE_DAYS * 864e5); render(); toast(T("Te lo recuerdo en {n} días", { n: SNOOZE_DAYS })); break;
    case "exp-routines":
      await deliver(`usus-${T("rutinas")}-${stamp()}.json`, JSON.stringify({ app: "usus", version: DATA_VERSION, routines: state.routines }, null, 2), "application/json"); break;
    case "exp-csv":
      if (!state.sessions.length) { toast(T("No hay sesiones para exportar")); return; }
      await deliver(`usus-${T("sesiones")}-${stamp()}.csv`, sessionsCSV(), "text/csv"); break;
    case "imp": $("#impFile").click(); break;
    case "wipe":
      if (!confirm(multiProf() ? T("Se borrarán todos los datos de «{x}» en este dispositivo. Los demás perfiles no se tocan. ¿Has hecho una copia?", { x: profName(curProf()) }) : T("Se borrarán todas las rutinas, sesiones y pesos de este dispositivo. ¿Has hecho una copia?"))) return;
      if (!confirm(T("Última confirmación: ¿borrar todo?"))) return;
      state.routines = []; state.sessions = []; state.active = null; saveActive(); store.saveAll(); LS.set("wk.weights", []); LS.set("wk.diary", {}); DY.saveSupps([]); ACT.save([]); LS.set("wk.plan", null); CYC.save([]); LS.set("wk.cycSyms", null); LS.set("wk.aiProf", null); toast(T("Datos borrados")); render(); break;
    case "delroutine":
      if (!confirm(T("¿Eliminar esta rutina? Las sesiones registradas se conservan."))) return;
      state.routines = state.routines.filter(r => r.id !== state.editing.id); state.editing = null;
      await store.saveRoutines(state.routines); toast(T("Rutina eliminada")); render(); break;
  }
});
document.addEventListener("input", ev => {
  if (ev.target.id === "dNote") { DY.set(state.day || dayKey(Date.now()), { note: ev.target.value }); return; }
  const el = ev.target, a = state.active; if (!a) return;
  if (el.dataset.w || el.dataset.r || el.dataset.r2) {
    const [ei, si] = (el.dataset.w || el.dataset.r || el.dataset.r2).split(":").map(Number);
    a.exercises[ei].sets[si][el.dataset.w ? "w" : el.dataset.r2 ? "r2" : "r"] = el.value === "" ? "" : +el.value;
    saveActive(); updateLive();
  }
});
document.addEventListener("input", ev => {
  if (ev.target.dataset?.enotet !== undefined && state.active) { const e = state.active.exercises[+ev.target.dataset.enotet]; if (e) { e.note = ev.target.value.slice(0, 140); saveActive(); } return; }
  if (ev.target.id === "catQ") { state.catQ = ev.target.value; const l = $("#catList"); if (l) l.innerHTML = catListHTML(); }
  if (ev.target.id === "xpQ" && state.xpick) { state.xpick.q = ev.target.value; const l = $("#xpList"); if (l) l.innerHTML = xpListHTML(); const b = $("#xpOwn"); if (b) b.innerHTML = xpOwnLabel(); }
});
document.addEventListener("input", ev => {
  const sn = ev.target.dataset?.ssnote, xn = ev.target.dataset?.sxnote;
  if (sn || xn) {
    const [id, i] = (sn || xn).split(":"), x = state.sessions.find(z => z.id === id); if (!x) return;
    const v = ev.target.value.trim(), o = sn ? x : x.exercises[+i]; if (!o) return;
    if (v) o.note = v; else delete o.note;
    store.saveSession(x);
  }
});
document.addEventListener("input", ev => { if (state.actForm && /^af[khm]$/.test(ev.target.id)) { readActForm(); const p = document.getElementById("apv"); if (p) p.innerHTML = actPreview(state.actForm); } });
document.addEventListener("change", ev => {
  const d = ev.target.dataset || {};
  if (d.esel !== undefined && state.editing) { readEditor(); const S = state.edSel || (state.edSel = new Set()), i = +d.esel; ev.target.checked ? S.add(i) : S.delete(i); render(); return; }
  if (d.popt && state.print) { state.print[d.popt] = ev.target.checked; render(); }
});
document.addEventListener("input", ev => { if (ev.target.id === "edQ" && state.editing) { state.edQ = ev.target.value; const l = $("#edList"); if (l) l.innerHTML = edCatHTML(); } });
/* Arrastrar (ratón): solo desde el asa ⋮⋮ o desde el catálogo lateral */
let edDrag = null;
document.addEventListener("dragstart", ev => {
  const c = ev.target.closest?.("[data-dex],[data-edadd]"); if (!c || !state.editing) return;
  readEditor(); edDrag = c.dataset.edadd ? { x: c.dataset.edadd } : { i: +c.dataset.dex };
  try { ev.dataTransfer.effectAllowed = "copyMove"; ev.dataTransfer.setData("text/plain", "usus"); } catch {}
});
document.addEventListener("dragover", ev => { const z = ev.target.closest?.("[data-dsec]"); if (!z || !edDrag) return; ev.preventDefault(); document.querySelectorAll(".dropz.over").forEach(x => x !== z && x.classList.remove("over")); z.classList.add("over"); });
document.addEventListener("drop", ev => {
  const z = ev.target.closest?.("[data-dsec]"); if (!z || !edDrag || !state.editing) return; ev.preventDefault();
  const ed = state.editing, over = ev.target.closest("[data-dex]"), sec = z.dataset.dsec, tgt = over ? ed.exercises[+over.dataset.dex] : null;
  let item; if (edDrag.x) { const x = CATBY[edDrag.x]; if (!x) return; item = newFromCat(x); } else item = ed.exercises[edDrag.i];
  edDrag = null; if (!item || tgt === item) { render(); return; }
  { const k = ed.exercises.indexOf(item); if (k >= 0) ed.exercises.splice(k, 1); }
  if (sec) item.sec = sec;
  if (tgt) { if (tgt.grp) { item.grp = tgt.grp; item.rest = null; } else delete item.grp; ed.exercises.splice(ed.exercises.indexOf(tgt), 0, item); }
  else { delete item.grp; const last = sec ? ed.exercises.map(e => e.sec).lastIndexOf(sec) : -1; ed.exercises.splice(last >= 0 ? last + 1 : ed.exercises.length, 0, item); }
  state.edSel = null; normRoutine(ed); render();
});
document.addEventListener("dragend", () => { edDrag = null; document.querySelectorAll(".dropz.over").forEach(x => x.classList.remove("over")); });
document.addEventListener("change", async ev => {
  if (state.planMode === "edit" && ev.target.dataset?.padd !== undefined) { const id = ev.target.value, m = id && planRmap(state.planDraft)[id]; if (m) { readPlan(); m.on = true; m.variant = ev.target.dataset.padd; } render(); return; }
  if (state.planMode === "edit" && ev.target.closest?.("#app") && (/^p(On|Order|OrderAt|Start|Review|DlW|DlE|Up|UpRule)$/.test(ev.target.id) || ev.target.dataset.pv !== undefined || ev.target.dataset.pw !== undefined)) { readPlan(); render(); return; }
  const tg = ev.target, dk = state.day || dayKey(Date.now());
  if (tg.id === "progOn" || tg.id === "progUp" || tg.id === "progDown") { const P = PROG(); if (tg.id === "progOn") P.on = tg.checked; if (tg.id === "progUp") P.up = +tg.value; if (tg.id === "progDown") P.down = tg.value; LS.set("wk.prog", P); render(); return; }
  if (tg.id === "effPem" || tg.id === "effRir") { LS.set("wk.effort", { ...EFF(), [tg.id === "effPem" ? "pem" : "rir"]: tg.checked }); render(); return; }
  if (tg.id === "catOnly") { state.catOnly = tg.checked; const l = $("#catList"); if (l) l.innerHTML = catListHTML(); return; }
  if (tg.dataset.omat && state.ownMat) { const k = tg.dataset.omat, l = state.ownMat.equip.filter(z => z !== k); if (tg.checked) l.push(k); state.ownMat.equip = l; return; }
  if (tg.id === "ap_birth" || tg.id === "ap_height") { const f = { ...(aiProf() || {}) }; if (tg.id === "ap_birth") f.birth = tg.value; else f.height = Math.round(+tg.value) || ""; LS.set("wk.aiProf", aiHasData(f) ? f : null); render(); return; }
  if (tg.id === "weighOn") { LS.set("wk.weighOn", tg.checked); render(); return; }
  if (tg.id === "wGoal") { const v = tg.value.trim(); if (!v) { LS.set("wk.weightGoal", null); render(); return; } const g = parseKg(v); if (g === null) { toast(T("Escribe un objetivo válido, por ejemplo {v}", { v: 70 })); return; } LS.set("wk.weightGoal", g); toast(T("Objetivo: {v}", { v: fmtW(g) })); render(); return; }
  if (tg.id === "langSel") { LS.set("wk.lang", tg.value); setLang(tg.value); render(); return; }
  if (tg.dataset.myeq) { const k = tg.dataset.myeq, l = (myEquip() || []).filter(z => z !== k); if (tg.checked) l.push(k); LS.set("wk.equip", l.length ? MAT_ORDER(l) : null); render(); return; }
  if (tg.id === "catChk") { LS.set("wk.catalog", tg.checked); state.routView = null; if (tg.checked) { toast(T("Catálogo activado")); render(); const c = await loadCatalog(); if (!c) toast(T("No se pudo cargar el catálogo. Se volverá a intentar al abrir la app.")); } else toast(T("Catálogo desactivado")); render(); return; }
  if (tg.id === "isTech") { state.issueTech = tg.checked; render(); return; }
  if (tg.id === "pfCyc" && state.pform) { readProfForm(); return; }
  if (/^sho(Ex|Dur|Pr)$/.test(tg.id)) { LS.set("wk.shareOpt", { ...SHOPT(), [{ shoEx: "ex", shoDur: "dur", shoPr: "pr" }[tg.id]]: tg.checked }); render(); return; }
  if (tg.id === "rsPlan" && state.rshare) { state.rshare.plan = tg.checked; render(); return; }
  if (tg.id === "inPlan" && state.incoming) { state.incoming.withPlan = tg.checked; render(); return; }
  if (tg.id === "dSteps") { const v = Math.max(0, Math.min(200000, Math.round(+tg.value || 0))); DY.set(dk, { steps: v || null }); toast(v ? T("Pasos: {n}", { n: v.toLocaleString(LOC()) }) : T("Pasos borrados")); }
  if (tg.id === "gDist") { const v = parseFloat(String(tg.value).replace(",", ".")); LS.set("wk.actGoalKm", v > 0 ? Math.round(fromU(v) * 100) / 100 : 0); render(); }
  if (tg.id === "gSteps") { const v = Math.max(0, Math.min(200000, Math.round(+tg.value || 0))); LS.set("wk.actGoalSteps", v); render(); }
  if (tg.id === "dPick" && tg.value) { state.day = tg.value > dayKey(Date.now()) ? dayKey(Date.now()) : tg.value; render(); }
  if (tg.id === "slBed" || tg.id === "slWake") { const sl = DY.get(dk).sleep || {}; DY.set(dk, { sleep: { ...sl, [tg.id === "slBed" ? "bed" : "wake"]: tg.value } }); render(); }
  if (tg.dataset.samt || tg.dataset.snote) { const id = tg.dataset.samt || tg.dataset.snote, sp = { ...(DY.get(dk).supp || {}) }; sp[id] = { ...(sp[id] || {}), [tg.dataset.samt ? "amount" : "note"]: tg.value }; DY.set(dk, { supp: sp }); }
  if (tg.dataset.sn || tg.dataset.sd || tg.dataset.su || tg.dataset.sw) {
    const id = tg.dataset.sn || tg.dataset.sd || tg.dataset.su || tg.dataset.sw, f = tg.dataset.sn ? "name" : tg.dataset.sd ? "dose" : tg.dataset.su ? "unit" : "when";
    DY.saveSupps(DY.supps().map(x => x.id === id ? { ...x, [f]: tg.value.trim() } : x));
  }
  if (tg.id === "gDaily" || tg.id === "gStr") { const g = LS.get("wk.goals", { daily: 0, strength: 0 }); g[tg.id === "gDaily" ? "daily" : "strength"] = Math.max(0, Math.min(7, Math.round(+tg.value || 0))); LS.set("wk.goals", g); toast(T("Objetivo guardado")); }
  if (ev.target.id === "restXDef") { const v = Math.max(0, Math.round(+ev.target.value || 0)); LS.set("wk.restExDefault", v); toast(T("Descanso entre ejercicios: {n} s", { n: v })); }
  if (ev.target.id === "autoStartChk") { LS.set("wk.autoStart", ev.target.checked); toast(ev.target.checked ? T("Inicio automático: sí") : T("Inicio automático: no")); }
  if (ev.target.id === "switchDef") { const v = Math.max(0, Math.min(30, Math.round(+ev.target.value || 0))); LS.set("wk.switch", v); toast(T("Cambio de lado: {n} s", { n: v })); }
  if (ev.target.id === "prepDef") { const v = Math.max(0, Math.min(30, Math.round(+ev.target.value || 0))); LS.set("wk.prep", v); toast(T("Preparación: {n} s", { n: v })); }
  if (ev.target.id === "warnDef") { const v = Math.max(0, Math.min(10, Math.round(+ev.target.value || 0))); LS.set("wk.warn", v); toast(T("Aviso final: {n} s", { n: v })); }
  if (ev.target.id === "restDef") { const v = Math.max(0, Math.round(+ev.target.value || 0)); LS.set("wk.restDefault", v); toast(v ? T("Descanso por defecto: {n} s", { n: v }) : T("Sin descanso por defecto")); }
  if (tg.id === "cycOn") { if (tg.checked && !CYC.cfg().ack) { tg.checked = false; state.cycAsk = true; render(); return; } CYC.set({ on: tg.checked }); if (!tg.checked) { state.dsheet = state.dsheet === "cyc" ? null : state.dsheet; } toast(tg.checked ? T("Seguimiento del ciclo activado") : T("Seguimiento del ciclo desactivado")); render(); return; }
  if (tg.id === "cycFert") { CYC.set({ fert: tg.checked }); render(); return; }
  if (tg.id === "cycPhase") { CYC.set({ phase: tg.checked }); render(); return; }
  if (tg.id === "cycWarn") { CYC.set({ warn: tg.checked }); render(); return; }
  if (tg.id === "cycWarnD") { CYC.set({ warnDays: Math.max(1, Math.min(7, Math.round(+tg.value || 2))) }); LS.set("wk.cycWarnSeen", ""); toast(T("Aviso {n} días antes", { n: CYC.cfg().warnDays })); return; }
  if (tg.id === "cycPause") { CYC.set({ pause: tg.checked ? { reason: "", since: dayKey(Date.now()) } : null }); render(); return; }
  if (tg.id === "cycReason") { CYC.set({ pause: { ...(CYC.cfg().pause || {}), reason: tg.value } }); render(); return; }
  if (tg.dataset.cycSname !== undefined) { const l = CYC.syms(), i = +tg.dataset.cycSname, v = tg.value.trim().slice(0, 28); if (!v || !l[i]) return; const old = l[i]; if (T(old) === v) return; l[i] = v; CYC.saveSyms(l);
    const dd = DY.all(); Object.values(dd).forEach(x => { if (x.cyc?.sym) x.cyc.sym = x.cyc.sym.map(z => z === old ? v : z); }); LS.set("wk.diary", dd); return; }
  if (ev.target.id === "wDay") { LS.set("wk.weighDay", +ev.target.value); toast(T("Día de pesaje: {d}", { d: DIAS[+ev.target.value] })); }
  if (ev.target.id === "statEx") { state.statEx = ev.target.value; render(); }
  if (ev.target.id === "wizFile" && ev.target.files[0]) { const t = await ev.target.files[0].text(); wizDone(); state.tab = "routines"; render(); await importJSON(t); return; }
  if (ev.target.id === "impFile" && ev.target.files[0]) { await importJSON(await ev.target.files[0].text()); ev.target.value = ""; }
});
document.addEventListener("click", ev => { const n = ev.target.closest("[data-dnote]"); if (n) { state.dnote = n.dataset.dnote.split(","); render(); return; } const c = ev.target.closest("span[data-day]"); if (c) { state.day = c.dataset.day; state.tab = "diary"; render(); window.scrollTo(0, 0); } });
document.addEventListener("keydown", ev => {
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches?.("span[data-day],span[data-dnote]")) { ev.preventDefault(); ev.target.click(); } if (ev.key === "Enter" && ev.target.id === "newEx") document.querySelector('[data-act="addex"]')?.click(); });

/* Plan guiado: test de nivel (sin redibujar mientras se escribe) */
document.addEventListener("input", ev => {
  const k = ev.target.dataset?.gptest, g = state.gp; if (!k || !g) return;
  g.test[k] = ev.target.value; const b = document.querySelector('[data-act="gp-next"]'); if (b) b.disabled = !gpLevels(g);
  const lv = ev.target.parentElement.querySelector(".gplv"); if (lv) lv.innerHTML = g.test[k] !== "" && +g.test[k] >= 0 ? LV(GP_TEST[k](g.test[k])) : "";
});
