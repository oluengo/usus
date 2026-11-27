/* ---------- Menú semanal (3.11.0), en Diario ----------
   Lunes a domingo × desayuno, comida, merienda y cena. Lo crea tu IA (Usus prepara la pregunta con tus preferencias,
   intolerancias, objetivos y días de entreno; la respuesta es un JSON que se pega) o se rellena a mano; todo se puede
   cambiar. Cada plato: receta breve, y si se comió (✓), no (✗) o se cambió (⇄) con qué y por qué. Lo comido pasa a
   Comidas del día. «Analizar la semana» prepara otra pregunta con ese seguimiento; su línea «PARA EL PRÓXIMO MENÚ»
   se guarda (wk.menuNext) y entra en el siguiente menú. Lista de la compra con casillas.
   3.12.0: 1, 2 o 4 semanas (wk.menuCfg.weeks); days tiene 7 × semanas y cada lista de la compra lleva w (0 despensa, 1… semana).
   wk.menu = { start, people, days: [{ date, train, meals: { b|l|s|d: { name, time, ing[], steps[], st, sw, why } } }],
               shop: [{ g, items: [{ t, done }] }], tips[], an } · wk.menuCfg = { people, time, budget }. Por perfil. */
const MENU_MEALS = FOOD_MEALS.filter(([k]) => k !== "x");
const MENU_WHY = [["tiempo", N_("Sin tiempo")], ["apetecia", N_("No me apetecía")], ["faltaba", N_("Faltaba un ingrediente")], ["fuera", N_("Comí fuera")], ["hambre", N_("Sin hambre")], ["otro", N_("Otro motivo")]];
const MENU_TIME = ["15", "20", "30", "45"], MENU_WEEKS = [1, 2, 4], MENU_BUD = [["ajustado", N_("Ajustado")], ["normal", N_("Normal")], ["libre", N_("Sin límite")]];
const MENU = {
  get: () => { const m = LS.get("wk.menu", null); return m && Array.isArray(m.days) ? m : null; },
  set: m => LS.set("wk.menu", m),
  cfg: () => { const c = { people: 1, time: "20", budget: "normal", weeks: 1, ...(LS.get("wk.menuCfg", null) || {}) }; if (!MENU_WEEKS.includes(+c.weeks)) c.weeks = 1; c.weeks = +c.weeks; return c; },
  setCfg: p => LS.set("wk.menuCfg", { ...MENU.cfg(), ...p })
};
const menuWeek = () => dayKey(addDays(weekStart(Date.now()), 7 * (state.menuWk || 0)));
/* 1, 2 o 4 semanas (3.12.0): days tiene 7 × semanas; la compra va por listas (w: 0 despensa, 1… cada semana) */
const menuW = m => Math.max(1, Math.round((m?.days.length || 7) / 7));
const menuTitle = m => menuW(m) > 1 ? T("Menú de {n} semanas", { n: menuW(m) }) : T("Menú de la semana");
/* USU-004: el menú se abre en el día que miras en el Diario (si está en el menú; si no, hoy o el primero) */
const menuDiaryDay = () => { const i = menuDayOf(state.day || dayKey(Date.now())); return i >= 0 ? i : Math.max(0, menuDayOf(dayKey(Date.now()))); };
const menuDayOf = k => { const m = MENU.get(); return m ? m.days.findIndex(d => d.date === k) : -1; };
const wdName = k => new Date(keyTime(k)).toLocaleDateString(LOC(), { weekday: "long" });
const lines = a => (a || []).join("\n"), unlines = t => String(t || "").split("\n").map(s => s.trim()).filter(Boolean).slice(0, 30);
/* Qué toca entrenar cada día de esa semana (plan si está en marcha; si no, los días de cada rutina) */
function menuTrain(start, n = 7) {
  const pn = planNow();
  return Array.from({ length: n }, (_, i) => {
    const k = dayKey(addDays(keyTime(start), i)), wd = new Date(keyTime(k)).getDay();
    const rs = pn?.status === "on" ? plannedFor(pn.w, wd) : state.routines.filter(r => (r.days || []).includes(wd));
    return { k, rs };
  });
}
function menuPrompt() {
  const c = MENU.cfg(), W = c.weeks, D = W === 4 ? 2 : W, start = menuWeek(), end = dayKey(addDays(keyTime(start), 7 * W - 1)), P = foodParts();
  const tr = menuTrain(start, 7 * D).filter(x => x.rs.length), dn = k => W > 1 ? `${wdName(k)} ${k}` : wdName(k);
  const next = (LS.get("wk.menuNext", "") || "").trim(), bud = foodLab(MENU_BUD, c.budget), fw = fastWin(), th = trainHour();
  const fdays = fw ? Array.from({ length: 7 * D }, (_, i) => dayKey(addDays(keyTime(start), i))).filter(fastOn) : [];
  const rules = [T("Comida casera, saludable y variada: verdura en comida y cena, legumbre 2–3 veces por semana, pescado o alternativa vegetal 2–3 veces, fruta a diario, poco ultraprocesado y poco azúcar."),
    T("Los días de entreno, más energía antes y proteína después. Los días sin entreno, algo más ligero."),
    T("Aprovecha ingredientes entre días (cocina una vez, come dos) para gastar menos y tirar menos."),
    W > 1 ? T("Recetas muy breves: ingredientes con cantidades para {n} persona(s) y de 2 a 3 pasos cortos. Tiempo realista.", { n: c.people }) : T("Recetas breves: ingredientes con cantidades para {n} persona(s) y de 2 a 4 pasos cortos. Tiempo realista.", { n: c.people }),
    T("Nada de calorías, macros ni pesos corporales. Sin dietas ni saltarse comidas."),
    T("Respeta SIEMPRE las intolerancias y lo que no me gusta."),
    W > 1 ? T("Lista de la compra POR SEMANAS, cada grupo con «week»: 0 para la despensa (lo que aguanta todo el periodo: legumbre seca, arroz, pasta, aceite, especias, conservas, congelados) y 1, 2… para lo fresco que se compra esa semana (fruta, verdura, carne, pescado, huevos, lácteos, pan). Agrupada por sección y sin repetir ingredientes dentro de cada lista (suma cantidades).")
      : T("Lista de la compra con TODO lo necesario para la semana, agrupada por sección y sin repetir ingredientes (suma cantidades)."),
    T("Nombres de platos cortos (máx. 40 caracteres), en el idioma de esta pregunta."),
    ...(W === 2 ? [T("Que las dos semanas sean distintas; un plato que guste puede repetirse, como mucho dos veces.")] : []),
    ...(W === 4 ? [T("Para que la respuesta no sea demasiado larga, escribe solo 2 semanas distintas (14 días) y pon «repeat»: true: Usus repite la semana 1 en la 3 y la 2 en la 4. La despensa («week»: 0), para las 4 semanas; lo fresco, solo para las semanas 1 y 2 (se repite igual).")] : []),
    ...(fw ? [T("Ayuno: los días con ayuno, TODAS las comidas dentro de la ventana; fuera de ella solo agua, café o infusiones sin azúcar. No acortes la ventana ni propongas días sin comer."),
      T("Con ventana de 8 horas o menos, reparte en 2 comidas y 1 tentempié: la primera rompe el ayuno (proteína, verdura y algo de hidratos; nada muy pesado ni solo dulce) y la última cierra la ventana. Deja sin nombre («name» vacío) el hueco que no se use, normalmente el desayuno."),
      T("Reparte la proteína entre las comidas de la ventana, que no se concentre en una sola."),
      T("Si el entreno cae fuera de la ventana, pon una comida con proteína lo antes posible al abrirla; si cae dentro, una comida o tentempié 1–2 h antes o después."),
      T("Los días sin ayuno, menú normal con las cuatro comidas.")] : [])];
  return [W > 1 ? T("Eres un asistente de cocina saludable y sencilla. Crea un menú de {n} semanas para mí, siguiendo estas reglas y devolviendo SOLO el JSON del final.", { n: W }) : T("Eres un asistente de cocina saludable y sencilla. Crea un menú semanal para mí, siguiendo estas reglas y devolviendo SOLO el JSON del final."), "",
    T("MIS DATOS"),
    `- ${W > 1 ? T("Periodo: del {a} al {b} ({n} semanas, de lunes a domingo).", { a: start, b: end, n: W }) : T("Semana: del {a} al {b} (lunes a domingo).", { a: start, b: end })}`,
    `- ${T("Días que entreno: {x}", { x: tr.length ? tr.map(x => `${dn(x.k)} ${x.rs.map(r => `«${r.name}»`).join(", ")}`).join("; ") : T("ninguno previsto") })}`,
    `- ${T("Tipo de alimentación: {x}", { x: foodLower(P.diet || foodLab(FOOD_DIET, "todo")) })}`,
    `- ${T("Intolerancias y alergias (no las incluyas NUNCA, tampoco como traza o ingrediente secundario): {x}", { x: P.al ? P.al.toLowerCase() : T("ninguna") })}`,
    `- ${T("No me gusta: {x}", { x: P.no || T("nada en especial") })}`,
    `- ${T("Objetivos: {x}", { x: P.goals ? P.goals.toLowerCase() : T("comer sano y variado") })}`,
    `- ${T("Comensales: {n}", { n: c.people })}`,
    `- ${T("Tiempo para cocinar entre semana: {n} min (el fin de semana, algo más).", { n: c.time })}`,
    `- ${T("Presupuesto: {x}", { x: foodLower(bud) })}`,
    `- ${T("Comidas por día: desayuno, comida, merienda y cena.")}`,
    ...(fw ? [`- ${T("Ayuno intermitente: {t}. Ventana para comer: de {a} a {b}. Días con ayuno: {d}.", { t: fw.type, a: fw.from, b: fw.to, d: fdays.length === 7 * D ? T("todos") : fdays.map(dn).join(", ") || T("ninguno") })}`] : []),
    ...(th ? [`- ${T("Hora habitual de entreno: {h}.", { h: th })}`] : []),
    ...(next ? [`- ${T("Cambios pedidos tras la semana anterior: {x}", { x: next })}`] : []), "",
    T("REGLAS"), ...rules.map((r, i) => `${i + 1}. ${r}`), "",
    T("FORMATO: responde SOLO con este JSON (sin texto antes ni después):"),
    `{"app":"usus","kind":"menu","version":1,"start":"${start}",${W > 1 ? `"weeks":${W},` : ""}${W === 4 ? `"repeat":true,` : ""}"people":${c.people},${fw ? `"fasting":{"type":"${fw.type}","from":"${fw.from}","to":"${fw.to}"},` : ""}`,
    ` "days":[{"date":"${start}","train":${tr.some(x => x.k === start)},${fw ? `"fast":${fastOn(start)},"window":${fastOn(start) ? `{"from":"${fw.from}","to":"${fw.to}"}` : "null"},` : ""}"meals":{`,
    `   "b":{"name":"…","at":"08:00","time":10,"ingredients":["…"],"steps":["…"]},`,
    `   "l":{"name":"…","at":"14:00","time":25,"ingredients":["…"],"steps":["…"]},`,
    `   "s":{"name":"…","at":"17:30","time":5,"ingredients":["…"],"steps":["…"]},`,
    `   "d":{"name":"…","at":"21:00","time":20,"ingredients":["…"],"steps":["…"]}}}],`,
    W > 1 ? ` "shopping":[{"week":0,"group":"${T("Despensa")}","items":["…"]},{"week":1,"group":"${T("Fruta y verdura")}","items":["…"]}],` : ` "shopping":[{"group":"${T("Fruta y verdura")}","items":["…"]}],`,
    ` "tips":["…"]}`,
    `- ${W > 1 ? T("«days»: exactamente {n}, de lunes a domingo, con «date» correlativa desde «start». «train»: true solo los días que entreno. «time»: minutos de preparación. «at»: hora aproximada de cada comida. Máximo 3 «tips».", { n: 7 * D }) : T("«days»: exactamente 7, de lunes a domingo, con «date» correlativa desde «start». «train»: true solo los días que entreno. «time»: minutos de preparación. «at»: hora aproximada de cada comida. Máximo 3 «tips».")}`,
    ...(fw ? [`- ${T("«fast»: true solo los días con ayuno; «window»: null los demás. Los días con ayuno, «at» siempre dentro de «window».")}`] : [])].join("\n");
}
/* Lee el JSON de la IA (con o sin ```), lo comprueba y lo deja limpio. Con «weeks» 2 o 4; si trae menos días
   (4 semanas con «repeat»), repite las semanas que trae, también su compra fresca. */
function menuParse(text) {
  const s = String(text || ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  let j; try { j = JSON.parse(s.slice(a, b + 1)); } catch { return null; }
  if (!j || !Array.isArray(j.days) || !j.days.length) return null;
  const str = (x, n) => String(x ?? "").trim().slice(0, n), arr = (x, n) => (Array.isArray(x) ? x : []).map(y => str(y, 160)).filter(Boolean).slice(0, n);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(j.start) ? dayKey(weekStart(keyTime(j.start))) : menuWeek();
  const n = j.days.length, W = MENU_WEEKS.includes(+j.weeks) ? +j.weeks : n > 14 ? 4 : n > 7 ? 2 : 1, L = Math.min(n, 7 * W), Pd = Math.ceil(L / 7) * 7, D = Pd / 7;
  const days = Array.from({ length: 7 * W }, (_, i) => {
    const d = (i < L ? j.days[i] : j.days[i % Pd]) || {}, m = d.meals || {};
    const hm = v => /^\d{1,2}:\d{2}$/.test(String(v || "")) ? String(v).padStart(5, "0") : null, win = d.window && hm(d.window.from) && hm(d.window.to) ? { from: hm(d.window.from), to: hm(d.window.to) } : null;
    return { date: dayKey(addDays(keyTime(start), i)), train: !!d.train, fast: !!d.fast && !!win, win: d.fast ? win : null,
      meals: Object.fromEntries(MENU_MEALS.map(([x]) => { const p = m[x] || {}; return [x, { name: str(p.name, 60), at: hm(p.at), time: Math.max(0, Math.min(240, Math.round(+p.time || 0))) || null, ing: arr(p.ingredients || p.ing, 30), steps: arr(p.steps, 8) }]; })) };
  });
  if (!days.some(d => MENU_MEALS.some(([x]) => d.meals[x].name))) return null;
  let shop = (Array.isArray(j.shopping) ? j.shopping : []).map(g => { const w = Number.isInteger(+g?.week) && +g.week >= 0 && +g.week <= W ? +g.week : 1;
    return { g: str(g?.group, 40) || T("Otros"), ...(W > 1 ? { w } : {}), items: arr(g?.items, 60).map(t => ({ t, done: false })) }; }).filter(g => g.items.length).slice(0, 60);
  if (W > 1 && D < W) shop = [...shop, ...shop.filter(g => g.w >= 1 && g.w <= D).flatMap(g => Array.from({ length: Math.ceil(W / D) - 1 }, (_, r) => ({ ...g, w: g.w + D * (r + 1), items: g.items.map(x => ({ ...x })) }))).filter(g => g.w <= W)];
  return { start, people: Math.max(1, Math.min(12, +j.people || MENU.cfg().people)), days, shop, tips: arr(j.tips, 3), created: Date.now() };
}
function menuSave(text) {
  const m = menuParse(text);
  if (!m) { toast(T("No parece un menú de Usus: copia la respuesta entera de la IA."), 5000); return false; }
  MENU.set(m); state.menuDay = menuDiaryDay(); state.menuTab = "week"; state.menuManual = false; state.menuShopW = null;
  toast(T("Menú guardado")); render(); return true;
}
function menuHand() {
  const start = menuWeek();
  const fw = fastWin();
  MENU.set({ start, people: MENU.cfg().people, days: Array.from({ length: 7 * MENU.cfg().weeks }, (_, i) => ({ date: dayKey(addDays(keyTime(start), i)), train: false,
    ...(fw && fastOn(dayKey(addDays(keyTime(start), i))) ? { fast: true, win: { from: fw.from, to: fw.to } } : {}),
    meals: Object.fromEntries(MENU_MEALS.map(([x]) => [x, { name: "", time: null, ing: [], steps: [] }])) })), shop: [], tips: [], created: Date.now() });
  state.menuDay = menuDiaryDay(); state.menuTab = "week"; render();
}
/* Lo comido pasa a Comidas del día: ✓ el plato del menú (si no había nada), ⇄ lo que se comió en su lugar */
function menuToDiary(i, x, prevSw) {
  const m = MENU.get(), d = m?.days[i], p = d?.meals[x]; if (!p) return;
  const e = DY.get(d.date), meals = { ...(e.meals || {}) }, cur = (meals[x] || "").trim();
  if (p.st === "ok" && !cur && p.name) meals[x] = p.name;
  else if (p.st === "sw" && (p.sw || "").trim() && (!cur || cur === p.name || cur === (prevSw || "").trim())) meals[x] = p.sw.trim();
  else if (p.st === "no" && cur === p.name) delete meals[x];
  else return;
  DY.set(d.date, { meals });
}
function menuEdit(i, x, f) { const m = MENU.get(); if (!m?.days[i]) return null; const p = m.days[i].meals[x]; f(p); MENU.set(m); return p; }
function menuFill(k) {   // Comidas → «Apuntar lo del menú»
  const i = menuDayOf(k); if (i < 0) return;
  const m = MENU.get(), d = m.days[i], e = DY.get(k), meals = { ...(e.meals || {}) }; let n = 0;
  MENU_MEALS.forEach(([x]) => { const p = d.meals[x]; if (p.name && p.st !== "no" && !(meals[x] || "").trim()) { meals[x] = p.st === "sw" && p.sw ? p.sw : p.name; if (!p.st) p.st = "ok"; n++; } });
  if (!n) { toast(T("Ya está todo apuntado")); return; }
  DY.set(k, { meals }); MENU.set(m); toast(TN(n, "{n} comida apuntada", "{n} comidas apuntadas")); render();
}
/* Seguimiento para la IA */
function menuAnalysisPrompt(w = menuWkSel()) {
  const m0 = MENU.get(); if (!m0) return "";
  const W = menuW(m0), m = { ...m0, start: m0.days[w * 7]?.date || m0.start, days: m0.days.slice(w * 7, w * 7 + 7) };
  const P = foodParts(), st = { ok: "✓", no: "✗", sw: "⇄" }, why = k => k ? foodLab(MENU_WHY, k).toLowerCase() : "";
  let ok = 0, no = 0, sw = 0, tot = 0;
  const L = []; m.days.forEach(d => MENU_MEALS.forEach(([x, n]) => { const p = d.meals[x]; if (!p.name) return; tot++;
    if (p.st === "ok") ok++; else if (p.st === "no") no++; else if (p.st === "sw") sw++;
    L.push(`- ${wdName(d.date)} · ${T(n)}: ${p.name} → ${p.st ? st[p.st] : T("sin marcar")}${p.st === "sw" && p.sw ? ` ${p.sw}` : ""}${p.why && p.st !== "ok" ? ` · ${why(p.why)}` : ""}`); }));
  const trained = [...new Set(state.sessions.filter(s => s.start >= keyTime(m.start) && s.start < addDays(keyTime(m.start), 7)).map(s => wdName(dayKey(s.start))))];
  return [T("Eres un asistente de cocina saludable. Analiza cómo he seguido el menú de esta semana y dime qué cambiar para la siguiente. Responde breve y concreto."), "",
    ...(W > 1 ? [T("Semana {n} de {t} del menú, {r}.", { n: w + 1, t: W, r: menuSpan(m.start, 7) }), ""] : []),
    T("MIS DATOS"), `- ${[P.diet && T("Tipo de alimentación: {x}", { x: foodLower(P.diet) }), T("Intolerancias: {x}", { x: P.al ? P.al.toLowerCase() : T("ninguna") }), P.no && T("No me gusta: {x}", { x: P.no }), P.goals && T("Objetivos: {x}", { x: P.goals.toLowerCase() })].filter(Boolean).join(" · ")}`,
    `- ${T("Días que entrené: {x}", { x: trained.join(", ") || T("ninguno") })}`, "",
    T("CÓMO FUE (plato planificado → lo que pasó · motivo)"), ...L, "",
    T("Resumen: {a} de {t} platos como estaban, {b} cambiados, {c} sin comer.", { a: ok, t: tot, b: sw, c: no }), "",
    ...(m.days.some(d => d.fast) ? [T("AYUNO"), ...m.days.filter(d => d.fast).map(d => `- ${wdName(d.date)} (${d.win.from}–${d.win.to}): ${d.fst === "ok" ? "✓ " + T("cumplido") : d.fst === "no" ? `✗ ${T("roto")}${d.fat ? " " + T("a las {h}", { h: d.fat }) : ""}${d.fwhy ? ` · ${foodLab(FAST_WHY, d.fwhy).toLowerCase()}` : ""}` : T("sin marcar")}`), ""] : []),
    T("POR FAVOR"), `1. ${T("Qué ha ido bien (2–3 puntos).")}`, `2. ${T("Patrones en lo que no se siguió y su causa probable según mis motivos.")}`,
    `3. ${T("3–5 cambios concretos para el próximo menú (tiempos, platos, cantidades, días).")}`,
    ...(m.days.some(d => d.fast) ? [`- ${T("Valora si la ventana de ayuno encaja con mis horarios y entrenos según lo que pasó, y propón ajustes (moverla, ampliarla, distinta los días de entreno). Si lo rompí a menudo por hambre o por encontrarme mal, propón una ventana más amplia.")}`] : []), `4. ${T("Sin calorías, pesos ni dietas; respeta mis intolerancias.")}`,
    `5. ${T("Al final, una línea que empiece por «PARA EL PRÓXIMO MENÚ:» con los cambios resumidos en una frase.")}`].join("\n");
}
function menuSaveAnalysis(t) {
  t = String(t || "").trim().slice(0, 6000); if (!t) { toast(T("Pega antes la respuesta")); return; }
  const mk = T("PARA EL PRÓXIMO MENÚ:"), line = t.split("\n").find(l => l.toUpperCase().includes(mk.replace(":", "").toUpperCase()));
  const next = line ? line.slice(line.toUpperCase().indexOf(mk.replace(":", "").toUpperCase()) + mk.length - 1).replace(/^[:\s*]+/, "").replace(/\*+$/, "").trim() : "";
  const m = MENU.get(); if (m) { m.an = t; MENU.set(m); }
  if (next) LS.set("wk.menuNext", next.slice(0, 500));
  state.menuAnManual = false;
  toast(next ? T("Análisis guardado: se tendrá en cuenta en el próximo menú") : T("Análisis guardado")); render();
}
/* Semana del menú que se ve (0…) y lista de la compra que se ve (0 despensa, 1… cada semana) */
function menuWkSel(m = MENU.get()) { const W = menuW(m), di = state.menuDay ?? Math.max(0, menuDayOf(dayKey(Date.now()))); return Math.max(0, Math.min(W - 1, Math.floor(di / 7))); }
function menuShopSel(m = MENU.get()) { if (menuW(m) === 1) return null; const v = state.menuShopW; return Number.isInteger(v) && v >= 0 && v <= menuW(m) ? v : menuWkSel(m) + 1; }
const menuShopOf = (m, sw = menuShopSel(m)) => m.shop.map((g, gi) => ({ ...g, gi })).filter(g => sw === null || (g.w ?? 1) === sw);
const menuShopName = (m, sw) => sw === null ? "" : sw === 0 ? T("Despensa") : T("Semana {n}", { n: sw });
const menuShopText = (m, sw = menuShopSel(m)) => (sw === null ? "" : `${menuShopName(m, sw)}\n\n`) + menuShopOf(m, sw).map(g => `${g.g}\n${g.items.map(x => `${x.done ? "☑" : "☐"} ${x.t}`).join("\n")}`).join("\n\n");

/* La fila del Diario */
function menuRow(k) {
  const m = MENU.get(), i = menuDayOf(k), d = i >= 0 ? m.days[i] : null;
  const sub = d ? MENU_MEALS.filter(([x]) => d.meals[x].name).map(([x]) => `${d.meals[x].st === "ok" ? "✓ " : d.meals[x].st === "no" ? "✗ " : d.meals[x].st === "sw" ? "⇄ " : ""}${esc(d.meals[x].name)}`).join(" · ").slice(0, 90) || T("Sin platos este día")
    : m ? T("Este día no está en el menú") : T("Planifica la semana con tu IA o a mano");
  return `<div class="lgroup dlist mrowg"><button class="srow drow" data-dsh="menu"><span class="dic"><svg viewBox="0 0 24 24" aria-hidden="true">${DICO.menu}</svg></span><span class="t">${m ? menuTitle(m) : T("Menú de la semana")}<small>${sub}</small></span><span class="chev" aria-hidden="true">›</span></button></div>`;
}
/* La ventana del menú */
function menuSheet(k) {
  const m = MENU.get(), c = MENU.cfg();
  if (!m) {
    const chip = (attr, v, cur, l) => `<button data-${attr}="${v}" class="${cur ? "on" : ""}" aria-pressed="${cur}">${l}</button>`;
    return `<p class="muted" style="font-size:.88rem;margin:0 0 10px">${T("Planifica la semana: desayuno, comida, merienda y cena. Lo crea tu IA con tus preferencias, intolerancias y entrenos, o lo rellenas a mano; luego puedes cambiarlo todo.")}</p>
    <div class="panel">
      <div class="mcfg"><span>${T("Semana")}</span><div class="chips fchips">${chip("mwk", 0, !(state.menuWk || 0), T("Esta semana"))}${chip("mwk", 1, state.menuWk === 1, T("La próxima"))}</div>
      <span>${T("Duración")}</span><div class="chips fchips">${MENU_WEEKS.map(n => chip("mweeks", n, c.weeks === n, TN(n, "{n} semana", "{n} semanas"))).join("")}</div>
      <span>${T("Comensales")}</span><div class="fwater"><button class="btn small" data-act="menu-ppl-" ${c.people > 1 ? "" : "disabled"} aria-label="${T("Uno menos")}">−</button><b>${c.people}</b><button class="btn small" data-act="menu-ppl+" aria-label="${T("Uno más")}">+</button></div>
      <span>${T("Tiempo entre semana")}</span><div class="chips fchips">${MENU_TIME.map(t => chip("mtime", t, c.time === t, `${t} min`)).join("")}</div>
      <span>${T("Presupuesto")}</span><div class="chips fchips">${MENU_BUD.map(([b, l]) => chip("mbud", b, c.budget === b, T(l))).join("")}</div></div>
      ${Object.keys(foodParts()).length ? `<p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Con tus preferencias: {x}.", { x: esc(foodSummary()) })}</p>` : `<p class="muted" style="font-size:.8rem;margin:10px 0 0"><button class="verb" data-act="go-perfil">${T("Añade intolerancias y preferencias en tu perfil")}</button></p>`}
      ${(LS.get("wk.menuNext", "") || "").trim() ? `<p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Y lo que pediste tras la semana anterior: {x}", { x: esc(LS.get("wk.menuNext", "")) })}</p>` : ""}
      <div class="row" style="margin-top:12px"><button class="btn primary" style="flex:1" data-act="menu-copy">${T("Copiar")}</button><button class="btn shbtn" style="flex:1" data-act="menu-share">${SHARE_ICO}${T("Compartir")}</button></div>
      <details class="aimanual"><summary>${T("Ver la pregunta")}</summary><pre class="fprompt">${esc(menuPrompt())}</pre></details>
      <h3 class="wh">${T("Cuando la IA responda")}</h3>
      <button class="btn" style="width:100%" data-act="menu-clip">${T("Pegar el menú")}</button>
      <p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("También puedes compartirlo con Usus desde la app de la IA: menú Compartir → Usus.")}</p>
      <details class="aimanual"${state.menuManual ? " open" : ""}><summary>${T("O pégalo a mano")}</summary>
        <textarea id="menuPaste" rows="4" placeholder="${T("Pega aquí la respuesta de la IA")}"></textarea>
        <button class="btn" style="width:100%;margin-top:8px" data-act="menu-paste">${T("Guardar menú")}</button></details>
    </div>
    <div class="bgrid2" style="margin-top:10px"><button class="btn" data-act="menu-hand">${T("Rellenarlo a mano")}</button><button class="btn" data-act="menu-imp">${T("Importar archivo")}</button></div>
    <input type="file" id="menuFile" accept="application/json,.json,text/plain,.txt" hidden>`;
  }
  const W = menuW(m), tab = state.menuTab === "shop" ? "shop" : "week", di = Math.max(0, Math.min(m.days.length - 1, state.menuDay ?? Math.max(0, menuDayOf(k)))), d = m.days[di], wk = Math.floor(di / 7);
  const tabs = utabs([["week", W > 1 ? T("Días") : T("Semana")], ["shop", T("Compra")]], tab, "mtab", menuTitle(m));
  const wsel = (attr, list, cur, lab) => `<div class="chips fchips mwsel" role="group" aria-label="${lab}">${list.map(([v, l]) => `<button data-${attr}="${v}" class="${v === cur ? "on" : ""}" aria-pressed="${v === cur}">${l}</button>`).join("")}</div>`;
  if (tab === "shop") {
    const sw = menuShopSel(m), G = menuShopOf(m, sw), n = G.reduce((a, g) => a + g.items.length, 0), dn = G.reduce((a, g) => a + g.items.filter(x => x.done).length, 0);
    return `${tabs}${W > 1 ? wsel("mshw", [[0, T("Despensa")], ...Array.from({ length: W }, (_, i) => [i + 1, T("Semana {n}", { n: i + 1 })])], sw, T("Lista de la compra")) + `<p class="muted" style="font-size:.78rem;margin:6px 0 0">${sw === 0 ? T("Lo que aguanta todo el menú: se compra una vez.") : T("Lo fresco de la semana {n}, {r}.", { n: sw, r: menuSpan(m.days[(sw - 1) * 7].date, 7) })}</p>` : ""}
      <p class="muted" style="font-size:.85rem;margin:8px 0">${n ? T("{a} de {b} en el carro", { a: dn, b: n }) : T("La lista está vacía.")}</p>
      ${G.map(({ gi, ...g }) => `<div class="panel mshop"><h3 class="wh" style="margin:0 0 4px">${esc(g.g)}</h3>${g.items.map((x, ii) => `<div class="mitem"><label><input type="checkbox" data-mshop="${gi}:${ii}" ${x.done ? "checked" : ""}><span class="${x.done ? "mdone" : ""}">${esc(x.t)}</span></label><button class="mx" data-mshopx="${gi}:${ii}" aria-label="${T("Quitar")} ${esc(x.t)}">×</button></div>`).join("")}</div>`).join("")}
      <div class="row" style="margin-top:10px;flex-wrap:nowrap"><input id="mshopNew" type="text" placeholder="${T("Añadir a la lista")}" maxlength="120" style="flex:1;min-width:0"><button class="btn" data-act="menu-shop-add">${T("Añadir")}</button></div>
      ${n ? `<div class="panel" style="margin-top:10px"><p class="flab" style="margin:0 0 6px">${T("Compartir o exportar la lista")}</p><div class="bgrid3"><button class="btn small shbtn" data-act="menu-shop-share">${SHARE_ICO}${T("Texto")}</button><button class="btn small" data-act="menu-shop-md">Markdown</button><button class="btn small" data-act="menu-shop-pdf">PDF</button></div>
        ${dn ? `<button class="btn small" style="width:100%;margin-top:8px" data-act="menu-shop-clear">${T("Quitar lo marcado")}</button>` : ""}</div>` : ""}`;
  }
  const strip = `${W > 1 ? wsel("mw", Array.from({ length: W }, (_, i) => [i, T("Semana {n}", { n: i + 1 })]), wk, T("Semana del menú")) : ""}<div class="mdays" role="tablist" aria-label="${T("Día del menú")}">${m.days.map((x, i) => { if (Math.floor(i / 7) !== wk) return ""; const dt = new Date(keyTime(x.date)), done = MENU_MEALS.every(([y]) => !x.meals[y].name || x.meals[y].st);
    return `<button role="tab" data-mday="${i}" class="${i === di ? "on" : ""}${x.date === dayKey(Date.now()) ? " today" : ""}" aria-selected="${i === di}"><span>${dt.toLocaleDateString(LOC(), { weekday: "narrow" })}</span><b>${dt.getDate()}</b><i class="${x.train ? "tr" : ""}${done ? " ok" : ""}"></i></button>`; }).join("")}</div>`;
  const meal = ([x, n]) => { const p = d.meals[x], id = `${di}:${x}`;
    const why = `<div class="chips fchips mwhy">${MENU_WHY.map(([w, l]) => `<button data-mwhy="${id}:${w}" class="${p.why === w ? "on" : ""}" aria-pressed="${p.why === w}">${T(l)}</button>`).join("")}</div>`;
    return `<div class="panel mmeal${p.st ? " st-" + p.st : ""}">
      <div class="row" style="justify-content:space-between"><span class="mlab">${T(n)}${p.at ? ` · ${p.at}` : ""}</span>${p.time ? `<span class="muted" style="font-size:.8rem">${p.time} min</span>` : ""}</div>
      <input type="text" class="mname" data-mname="${id}" value="${esc(p.name)}" placeholder="${T("Plato")}" maxlength="60" aria-label="${T(n)}">
      <div class="mst" role="group" aria-label="${T("¿Cómo fue?")}">${[["ok", "✓ " + T("Comido")], ["no", "✗ " + T("No")], ["sw", "⇄ " + T("Cambiado")]].map(([s, l]) => `<button data-mst="${id}:${s}" class="${p.st === s ? "on" : ""}" aria-pressed="${p.st === s}">${l}</button>`).join("")}</div>
      ${p.st === "sw" ? `<input type="text" data-msw="${id}" value="${esc(p.sw || "")}" placeholder="${T("¿Qué comiste en su lugar?")}" maxlength="80" style="margin-top:8px">` : ""}
      ${p.st === "sw" || p.st === "no" ? why : ""}
      <details class="aimanual"><summary>${T("Receta")}${p.ing.length ? ` · ${TN(p.ing.length, "{n} ingrediente", "{n} ingredientes")}` : ""}</summary>
        <label class="flab" for="mi_${di}${x}">${T("Ingredientes (uno por línea)")}</label><textarea id="mi_${di}${x}" data-ming="${id}" rows="${Math.min(8, Math.max(2, p.ing.length))}">${esc(lines(p.ing))}</textarea>
        <label class="flab" for="ms_${di}${x}">${T("Pasos (uno por línea)")}</label><textarea id="ms_${di}${x}" data-mstep="${id}" rows="${Math.min(6, Math.max(2, p.steps.length))}">${esc(lines(p.steps))}</textarea></details>
    </div>`; };
  const wd = m.days.slice(wk * 7, wk * 7 + 7), marked = wd.reduce((a, x) => a + MENU_MEALS.filter(([y]) => x.meals[y].name && x.meals[y].st).length, 0), total = wd.reduce((a, x) => a + MENU_MEALS.filter(([y]) => x.meals[y].name).length, 0);
  return `${tabs}${strip}
    <p class="mdh">${(() => { const s = new Date(keyTime(d.date)).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" }); return s.charAt(0).toUpperCase() + s.slice(1); })()}${d.train ? ` · <span class="mtr">${T("Entreno")}</span>` : ""}${d.fast ? ` · <span class="mtr">${T("Ayuno")}</span>` : ""}</p>
    ${d.fast ? `<div class="panel mfast${d.fst ? " st-" + d.fst : ""}"><div class="row" style="justify-content:space-between"><span class="mlab">${T("Ayuno")}</span><span class="muted" style="font-size:.8rem">${T("comes de {a} a {b}", { a: d.win.from, b: d.win.to })}</span></div>
      <div class="mst" role="group" aria-label="${T("Ayuno")}">${[["ok", "✓ " + T("Cumplido")], ["no", "✗ " + T("Roto")]].map(([s, l]) => `<button data-fst="${di}:${s}" class="${d.fst === s ? "on" : ""}" aria-pressed="${d.fst === s}">${l}</button>`).join("")}</div>
      ${d.fst === "no" ? `<div class="row" style="margin-top:8px;gap:10px"><label class="flab" for="fbat${di}" style="margin:0">${T("¿A qué hora?")}</label><input type="time" id="fbat${di}" data-fbat="${di}" value="${d.fat || ""}" style="width:auto"></div>
        <div class="chips fchips mwhy">${FAST_WHY.map(([w, l]) => `<button data-fbr="${di}:${w}" class="${d.fwhy === w ? "on" : ""}" aria-pressed="${d.fwhy === w}">${T(l)}</button>`).join("")}</div>` : ""}</div>` : ""}
    ${MENU_MEALS.filter(([x]) => !d.fast || d.meals[x].name).map(meal).join("")}
    ${m.tips.length ? `<details class="aimanual"><summary>${T("Consejos de la semana")}</summary><ul class="muted" style="font-size:.85rem;margin:6px 0 0;padding-left:20px">${m.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul></details>` : ""}
    <h3 class="wh">${W > 1 ? T("Analizar la semana {n}", { n: wk + 1 }) : T("Analizar la semana")}</h3>
    <div class="panel">
      <p class="muted" style="font-size:.85rem;margin:0">${T("{a} de {b} platos marcados. Tu IA verá qué se comió, qué no y por qué, y te dirá qué cambiar; eso entra en el próximo menú.", { a: marked, b: total })}</p>
      <div class="row" style="margin-top:10px"><button class="btn" style="flex:1" data-act="menu-an-copy">${T("Copiar")}</button><button class="btn shbtn" style="flex:1" data-act="menu-an-share">${SHARE_ICO}${T("Compartir")}</button></div>
      <button class="btn" style="width:100%;margin-top:8px" data-act="menu-an-clip">${T("Pegar el análisis")}</button>
      <details class="aimanual"${state.menuAnManual ? " open" : ""}><summary>${T("O pégalo a mano")}</summary><textarea id="menuAnPaste" rows="3" placeholder="${T("Pega aquí la respuesta de la IA")}"></textarea>
        <button class="btn" style="width:100%;margin-top:8px" data-act="menu-an-paste">${T("Guardar análisis")}</button></details>
      ${m.an ? `<details class="aimanual"><summary>${T("Último análisis")}</summary><pre class="fprompt">${esc(m.an)}</pre></details>` : ""}
    </div>
    <h3 class="wh">${T("Compartir y exportar")}</h3>
    <div class="panel"><p class="flab" style="margin:0 0 6px">${T("Para pasarlo a otro Usus")}</p><div class="bgrid3"><button class="btn small shbtn" data-act="menu-sh-link">${SHARE_ICO}${T("Enlace")}</button><button class="btn small" data-act="menu-sh-file">JSON</button><button class="btn small nsbtn" data-act="menu-sh-nostr">${NS_ICO}Nostr</button></div>
      <p class="flab" style="margin:12px 0 6px">${T("Para leer o imprimir")}</p><div class="bgrid2"><button class="btn small" data-act="menu-sh-md">Markdown</button><button class="btn small" data-act="menu-sh-pdf">PDF</button></div>
      <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Se comparte sin lo que has marcado (✓ ✗ ⇄). La copia de seguridad, también en Nostr, lo guarda todo.")}</p></div>
    <button class="btn ghost danger" style="width:100%;margin-top:10px" data-act="menu-new">${T("Nuevo menú…")}</button>`;
}
/* Lista de la compra en Markdown y en PDF (3.11.0). El PDF se escribe a mano (A4, Helvetica, casillas dibujadas),
   sin librerías: texto en WinAnsi (castellano, catalán e inglés caben). */
/* Subtítulo de una lista: la semana (o todo el menú si es la despensa o si es de una semana) */
const menuShopSub = (m, sw) => sw === null ? menuRange(m) : sw === 0 ? `${T("Despensa")} · ${menuRange(m)}` : `${T("Semana {n}", { n: sw })} · ${menuSpan(m.days[(sw - 1) * 7].date, 7)}`;
function menuShopMd(m, sw = menuShopSel(m)) {
  return `# ${T("Lista de la compra")}\n\n${menuShopSub(m, sw)}\n\n${menuShopOf(m, sw).map(g => `## ${g.g}\n\n${g.items.map(x => `- [${x.done ? "x" : " "}] ${x.t}`).join("\n")}`).join("\n\n")}\n`;
}
function pdfText(lines) {   // lines: [{ t, bold, size, box, done, gap }]
  const W = 595, H = 842, M = 56, CP = { "€": 128, "‚": 130, "„": 132, "…": 133, "‘": 145, "’": 146, "“": 147, "”": 148, "•": 149, "–": 150, "—": 151, "·": 183 };
  const enc = s => [...s].map(ch => { const c = ch.charCodeAt(0); return c < 256 ? ch : CP[ch] ? String.fromCharCode(CP[ch]) : "?"; }).join("").replace(/[\\()]/g, "\\$&");
  const wrap = (t, size, w) => { const max = Math.floor(w / (size * 0.5)), out = []; let cur = "";
    String(t).split(/\s+/).forEach(word => { if ((cur + " " + word).trim().length > max && cur) { out.push(cur); cur = word; } else cur = (cur + " " + word).trim(); }); if (cur) out.push(cur); return out.length ? out : [""]; };
  const pages = []; let ops = [], y = H - M;
  const newPage = () => { pages.push(ops); ops = []; y = H - M; };
  lines.forEach(l => {
    const size = l.size || 11, lead = size * 1.45, x = M + (l.box ? 20 : 0), parts = wrap(l.t, size, W - M - x);
    y -= l.gap || 0;
    if (y - lead * parts.length < M) newPage();
    parts.forEach((p, i) => {
      y -= lead;
      if (l.box && i === 0) { ops.push(`0.4 w ${M} ${y - 1} 11 11 re S`); if (l.done) ops.push(`1 w ${M + 2} ${y + 4} m ${M + 4.5} ${y + 1.5} l ${M + 9} ${y + 8} l S`); }
      ops.push(`BT /${l.bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${enc(p)}) Tj ET`);
    });
  });
  pages.push(ops);
  const objs = [], add = s => { objs.push(s); return objs.length; };
  const cat = add(""), pg = add(""), f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"), f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids = pages.map(o => { const st = o.join("\n"), c = add(`<< /Length ${st.length} >>\nstream\n${st}\nendstream`); return add(`<< /Type /Page /Parent ${pg} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`); });
  objs[cat - 1] = `<< /Type /Catalog /Pages ${pg} 0 R >>`; objs[pg - 1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  let out = "%PDF-1.4\n", off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Uint8Array.from(out, ch => ch.charCodeAt(0) & 255);
}
function menuShopPdf(m, sw = menuShopSel(m)) {
  return pdfText([{ t: T("Lista de la compra"), bold: true, size: 18 }, { t: menuShopSub(m, sw), size: 11, gap: 2 },
    ...menuShopOf(m, sw).flatMap(g => [{ t: g.g, bold: true, size: 13, gap: 14 }, ...g.items.map(x => ({ t: x.t, box: true, done: x.done, gap: 2 }))]),
    { t: "Usus", size: 8, gap: 24 }]);
}
function menuShopExport(kind) {
  const m = MENU.get(); if (!m?.shop.length) return;
  const sw = menuShopSel(m), name = `usus-${T("compra")}-${sw === null ? m.start : sw === 0 ? T("despensa") : m.days[(sw - 1) * 7].date}.${kind}`;
  const file = kind === "pdf" ? new File([menuShopPdf(m)], name, { type: "application/pdf" }) : new File([menuShopMd(m)], name, { type: "text/markdown" });
  shareOut({ title: T("Lista de la compra"), file });
}
/* Compartir e importar el menú, como las rutinas (3.11.1): enlace (#m=, comprimido, no pasa por ningún servidor),
   archivo .json, Nostr, Markdown y PDF de la semana. Se importa desde el enlace, el archivo (aquí o en Ajustes →
   Importar), «Compartir con Usus» o pegando. Viaja sin el seguimiento (✓ ✗ ⇄): es de quien lo come. Un menú de una
   semana ya pasada se trae a esta semana. */
function menuExportObj(m) {
  return { app: "usus", kind: "menu", version: 1, start: m.start, ...(menuW(m) > 1 ? { weeks: menuW(m) } : {}), people: m.people,
    days: m.days.map(d => ({ date: d.date, train: d.train, fast: !!d.fast, window: d.fast ? d.win : null, meals: Object.fromEntries(MENU_MEALS.map(([x]) => { const p = d.meals[x]; return [x, { name: p.name, at: p.at || null, time: p.time, ingredients: p.ing, steps: p.steps }]; })) })),
    shopping: m.shop.map(g => ({ ...(g.w !== undefined ? { week: g.w } : {}), group: g.g, items: g.items.map(i => i.t) })), tips: m.tips };
}
const menuSpan = (start, n) => { const f = d => new Date(d).toLocaleDateString(LOC(), { day: "numeric", month: "long" }); return T("del {a} al {b}", { a: f(keyTime(start)), b: f(addDays(keyTime(start), n - 1)) }); };
const menuRange = m => { const f = d => new Date(d).toLocaleDateString(LOC(), { day: "numeric", month: "long" }), W = menuW(m);
  return W > 1 ? T("{n} semanas, {r}", { n: W, r: menuSpan(m.start, 7 * W) }) : T("Semana del {a} al {b}", { a: f(keyTime(m.start)), b: f(addDays(keyTime(m.start), 6)) }); };
/* Markdown y PDF de todo el menú; con varias semanas, un apartado por semana y una lista por semana más la despensa */
const menuDayTitle = d => { const s = wdName(d.date); return `${s.charAt(0).toUpperCase() + s.slice(1)} ${new Date(keyTime(d.date)).getDate()}${d.train ? ` · ${T("Entreno")}` : ""}${d.fast ? ` · ${T("Ayuno")}` : ""}`; };
const menuShopLists = m => menuW(m) === 1 ? [null] : Array.from({ length: menuW(m) + 1 }, (_, i) => i).filter(sw => menuShopOf(m, sw).length);
function menuMd(m) {
  const W = menuW(m), h = W > 1 ? "#" : "";
  const day = d => `${h}## ${menuDayTitle(d)}\n\n${MENU_MEALS.filter(([x]) => d.meals[x].name).map(([x, n]) => { const p = d.meals[x];
    return `${h}### ${T(n)}: ${p.name}${p.time ? ` (${p.time} min)` : ""}${p.ing.length ? `\n\n${p.ing.map(i => `- ${i}`).join("\n")}` : ""}${p.steps.length ? `\n\n${p.steps.map((st, i) => `${i + 1}. ${st}`).join("\n")}` : ""}`; }).join("\n\n")}`;
  const weeks = Array.from({ length: W }, (_, w) => `${W > 1 ? `## ${T("Semana {n}", { n: w + 1 })} · ${menuSpan(m.days[w * 7].date, 7)}\n\n` : ""}${m.days.slice(w * 7, w * 7 + 7).map(day).join("\n\n")}`).join("\n\n");
  const shop = m.shop.length ? `\n\n## ${T("Lista de la compra")}\n\n${menuShopLists(m).map(sw => `${sw === null ? "" : `### ${menuShopName(m, sw)}\n\n`}${menuShopOf(m, sw).map(g => `${sw === null ? "###" : "####"} ${g.g}\n\n${g.items.map(x => `- [${x.done ? "x" : " "}] ${x.t}`).join("\n")}`).join("\n\n")}`).join("\n\n")}` : "";
  return `# ${menuTitle(m)}\n\n${menuRange(m)}\n\n${weeks}${shop}\n`;
}
function menuPdf(m) {
  const W = menuW(m), L = [{ t: menuTitle(m), bold: true, size: 18 }, { t: menuRange(m), size: 11, gap: 2 }];
  m.days.forEach((d, i) => { if (W > 1 && i % 7 === 0) L.push({ t: `${T("Semana {n}", { n: i / 7 + 1 })} · ${menuSpan(d.date, 7)}`, bold: true, size: 15, gap: 20 });
    L.push({ t: menuDayTitle(d), bold: true, size: 13, gap: 14 });
    MENU_MEALS.forEach(([x, n]) => { const p = d.meals[x]; if (!p.name) return; L.push({ t: `${T(n)}: ${p.name}${p.time ? ` · ${p.time} min` : ""}`, bold: true, size: 10.5, gap: 4 });
      if (p.ing.length) L.push({ t: p.ing.join(" · "), size: 9.5 }); p.steps.forEach((st, i) => L.push({ t: `${i + 1}. ${st}`, size: 9.5 })); }); });
  if (m.shop.length) { L.push({ t: T("Lista de la compra"), bold: true, size: 15, gap: 20 });
    menuShopLists(m).forEach(sw => { if (sw !== null) L.push({ t: menuShopName(m, sw), bold: true, size: 13, gap: 12 });
      menuShopOf(m, sw).forEach(g => { L.push({ t: g.g, bold: true, size: 12, gap: 10 }); g.items.forEach(x => L.push({ t: x.t, box: true, done: x.done, gap: 2 })); }); }); }
  L.push({ t: "Usus", size: 8, gap: 24 });
  return pdfText(L);
}
async function menuShare(how) {
  const m = MENU.get(); if (!m) return;
  const base = `usus-${T("menu")}-${m.start}`;
  if (how === "file") return shareOut({ title: base + ".json", file: new File([JSON.stringify(menuExportObj(m), null, 2)], base + ".json", { type: "application/json" }) });
  if (how === "md") return shareOut({ title: menuTitle(m), file: new File([menuMd(m)], base + ".md", { type: "text/markdown" }) });
  if (how === "pdf") return shareOut({ title: menuTitle(m), file: new File([menuPdf(m)], base + ".pdf", { type: "application/pdf" }) });
  const url = `${appURL()}#m=${await packShare(menuExportObj(m))}`;
  if (how === "nostr") { if (nsRO()) return toast(T("Con solo la npub no se puede publicar: entra con un firmante."), 5000);
    if (!NS.cfg()) { state.dsheet = null; state.tab = "data"; state.setTab = "nostr"; render(); return; }
    state.nsPost = { k: "menu", text: `${T("Mi menú de la semana para Usus. Abre el enlace para añadirlo.")}\n\n${url}` }; render(); return; }
  return shareOut({ title: "Usus", text: T("Te paso un menú de la semana para Usus. Abre el enlace para añadirlo."), url });
}
/* Importar: confirma si ya hay uno; uno de una semana pasada se trae a esta */
function menuImport(text) {
  const m = menuParse(text); if (!m) { toast(T("No parece un menú de Usus: copia la respuesta entera de la IA."), 5000); return false; }
  const now = dayKey(weekStart(Date.now()));
  if (m.start < now) { m.start = now; m.days.forEach((d, i) => { d.date = dayKey(addDays(keyTime(now), i)); }); }
  if (MENU.get() && !confirm(T("Ya tienes un menú. ¿Sustituirlo por este? (lo comido sigue en el Diario)"))) return false;
  MENU.set(m); state.menuDay = menuDiaryDay(); state.menuTab = "week"; state.menuShopW = null;
  state.tab = "diary"; state.dsheet = "menu"; toast(T("Menú guardado")); render(); return true;
}
const isMenuText = t => /"kind"\s*:\s*"menu"/.test(String(t || ""));
async function readMenuHash() {
  if (!location.hash.startsWith("#m=")) return;
  const h = location.hash.slice(3);
  try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  let j = null; try { j = await unpackShare(h); } catch {}
  if (!j || j.kind !== "menu") { toast(T("El enlace no es válido o está incompleto")); return; }
  menuImport(JSON.stringify(j));
}
window.addEventListener("hashchange", () => { readMenuHash(); });
