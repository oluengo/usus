/* ---------- Plan guiado (3.2) ----------
   Unas preguntas (objetivo, días, minutos, material, molestias, nivel) y Usus propone rutinas con ejercicios del catálogo
   y un plan «en orden». Usa de cada ficha: rol, rango recomendado (dose) y articulaciones que más carga (joints).
   Reparto: 2–3 días full body · 4 torso/pierna · 5–6 empuje/tirón/pierna. Variantes A y B (B con ejercicios parecidos). */
const GP_JOINTS = [["muneca", N_("Muñeca")], ["hombro", N_("Hombro")], ["codo", N_("Codo")], ["rodilla", N_("Rodilla")], ["lumbar", N_("Zona lumbar")]];
const GP_STEPS = ["intro", "goal", "days", "mat", "pain", "level", "review"];
const GP_SLOT = {
  push_h: { pats: ["empuje-h"], fams: ["flexion", "flexion-1m", "planche"], area: "empuje", n: N_("empuje horizontal") },
  push_v: { pats: ["empuje-v"], fams: ["pica", "fondos", "fondos-anillas"], area: "empuje", n: N_("empuje vertical") },
  pull_v: { pats: ["traccion-v"], fams: ["dominada", "muscle-up", "dominada-1m"], area: "traccion", alt: "pull_h", n: N_("tracción") },
  pull_h: { pats: ["traccion-h"], fams: ["remo", "remo-1m"], area: "traccion", alt: "pull_band", n: N_("tracción") },
  pull_band: { pats: ["traccion-h"], fams: ["banda-traccion", "escapular"], area: "traccion", any: true, n: N_("tracción") },
  knee: { pats: ["rodilla"], fams: ["sentadilla", "pistol", "sentadilla-lateral"], area: "pierna", n: N_("pierna") },
  knee2: { pats: ["rodilla"], fams: ["una-pierna", "zancada", "pistol"], area: "pierna", n: N_("pierna") },
  hip: { pats: ["cadera"], fams: ["puente", "bisagra"], area: "pierna", n: N_("cadera") },
  hip2: { pats: ["cadera"], fams: ["curl-isquios", "nordic", "bisagra"], area: "pierna", acc: true, n: N_("cadera") },
  core_a: { pats: ["core"], fams: ["anti-extension", "plancha", "rueda", "dragon-flag"], area: "core", acc: true, n: N_("core") },
  core_b: { pats: ["core"], fams: ["plancha-lateral", "anti-rotacion", "elevacion-piernas", "rotacion"], area: "core", acc: true, n: N_("core") },
  skill: { pats: ["habilidad"], fams: ["pino", "equilibrio-brazos", "l-sit", "front-lever", "planche"], area: "skill", n: N_("habilidad") }
};
const GP_ACC = { torso: ["flexion-escapular", "face-pull-banda", "ytw-tumbado", "curl-biceps-anillas", "extension-triceps-anillas", "dominada-escapular"], pierna: ["gemelos", "almeja", "tibial-pared", "gemelos-una-pierna", "paso-lateral-banda"], full: ["ytw-tumbado", "gemelos", "flexion-escapular", "almeja"] };
const GP_WARM = { torso: ["movilidad-munecas", "circulos-brazos", "flexion-escapular-pared", "rotaciones-tronco"], pierna: ["circulos-cadera", "balanceo-piernas", "sentadilla-alcance", "rodillas-pecho-caminando"], full: ["movilidad-munecas", "gusano", "circulos-cadera", "circulos-brazos"] };
const GP_COOL = { torso: ["pectoral-pared", "estiramiento-dorsal-barra", "estiramiento-triceps", "enhebrar-aguja", "postura-nino"], pierna: ["estiramiento-isquios", "estiramiento-cuadriceps", "estiramiento-gluteo", "flexor-cadera", "estiramiento-gemelo"], full: ["estiramiento-isquios", "pectoral-pared", "estiramiento-gluteo", "postura-nino"] };
/* Rutinas por reparto: [nombre, tipo, bloque, huecos]; con N días se usan las N primeras (una rutina por sesión de la semana) */
const GP_TPL = {
  full: [[N_("Full body 1"), "full", "full", ["push_h", "pull_v", "knee", "hip", "core_a", "push_v"]], [N_("Full body 2"), "full", "full", ["push_v", "pull_h", "knee2", "hip2", "core_b", "pull_v"]], [N_("Full body 3"), "full", "full", ["push_h", "pull_h", "knee", "hip2", "core_b", "push_v"]]],
  ul: [[N_("Torso 1"), "torso", "full", ["push_h", "pull_v", "push_v", "pull_h", "core_a", "push_h"]], [N_("Pierna 1"), "pierna", "pierna", ["knee", "hip", "knee2", "hip2", "core_b", "knee"]], [N_("Torso 2"), "torso", "full", ["push_v", "pull_h", "push_h", "pull_v", "core_b", "pull_v"]], [N_("Pierna 2"), "pierna", "pierna", ["knee2", "hip2", "knee", "hip", "core_a", "knee2"]]],
  ppl: [[N_("Empuje 1"), "torso", "empuje", ["push_h", "push_v", "push_h", "push_v", "core_a", "push_h"]], [N_("Tirón 1"), "torso", "traccion", ["pull_v", "pull_h", "pull_v", "pull_h", "core_b", "pull_v"]], [N_("Pierna 1"), "pierna", "pierna", ["knee", "hip", "knee2", "hip2", "core_a", "knee"]],
    [N_("Empuje 2"), "torso", "empuje", ["push_v", "push_h", "push_v", "push_h", "core_b", "push_v"]], [N_("Tirón 2"), "torso", "traccion", ["pull_h", "pull_v", "pull_h", "pull_v", "core_a", "pull_h"]], [N_("Pierna 2"), "pierna", "pierna", ["knee2", "hip2", "knee", "hip", "core_b", "knee2"]]]
};
const GP_DAYS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };
const GP_SECS = [["w", N_("Calentamiento")], ["m", N_("Principal")], ["a", N_("Accesorios")], ["c", N_("Cardio final")], ["v", N_("Vuelta a la calma")]];
const gpSplit = d => d <= 3 ? "full" : d === 4 ? "ul" : "ppl";
const gpBand = (v, cuts) => { let l = 1; cuts.forEach((c, i) => { if (+v >= c) l = i + 2; }); return l; };
const GP_TEST = { push: v => gpBand(v, [1, 8, 21, 36]), pull: v => gpBand(v, [5, 13, 20]) + 1, squat: v => Math.min(4, gpBand(v, [15, 30, 45])), plank: v => Math.min(4, gpBand(v, [20, 45, 90])) };
function gpNew() { return { step: 0, goal: null, days: 3, min: 45, mat: (myEquip() || []).filter(k => MAT[k]), pain: [], lvMode: "test", test: { push: "", pull: "", squat: "", plank: "" }, self: null, plan: null, tab: 0 }; }
function gpLevels(g) {
  if (g.lvMode === "self") return { 1: { empuje: 2, traccion: 1, pierna: 1, core: 1 }, 2: { empuje: 3, traccion: 2, pierna: 2, core: 2 }, 3: { empuje: 4, traccion: 4, pierna: 4, core: 3 } }[g.self] || null;
  const t = g.test; if (Object.values(t).some(v => v === "" || !(+v >= 0))) return null;
  return { empuje: GP_TEST.push(t.push), traccion: GP_TEST.pull(t.pull), pierna: GP_TEST.squat(t.squat), core: GP_TEST.plank(t.plank) };
}
const gpOkMat = (g, x) => (x.equip || []).every(m => MAT_ALWAYS.has(m) || g.mat.includes(m));
const gpOk = (g, x, soft) => gpOkMat(g, x) && (soft || !(x.joints || []).some(j => g.pain.includes(j)));
function gpCands(g, key, L, soft) {
  const s = GP_SLOT[key];
  return CAT.exercises.filter(x => s.pats.includes(x.pattern) && (s.any || (s.fams.includes(x.family) && (x.role === "main" || (s.acc && x.role === "accessory")))) && gpOk(g, x, soft))
    .map(x => ({ x, sc: (x.level > L ? 100 + (x.level - L) * 10 : (L - x.level) * 10) + (s.fams.indexOf(x.family) < 0 ? 5 : s.fams.indexOf(x.family)) + (CHAIN[x.id] ? 0 : 3) + (x.impact ? 4 : 0) + (x.role === "main" ? 0 : 6) }))
    .sort((a, b) => a.sc - b.sc).map(o => o.x);
}
function gpPick(g, key, L, used) {
  for (const soft of [false, true]) {   // si ninguno libra la molestia: el más fácil que la carga, marcado
    let k = key;
    for (let n = 0; n < 3 && k; n++) {
      const lim = soft ? Math.min(L, 2) : L, c = gpCands(g, k, lim, soft).filter(x => !used.has(x.id)), best = c.find(x => x.level <= lim);
      if (best) return { x: best, slot: k, alt: k !== key, soft };
      k = GP_SLOT[k].alt;
    }
    if (key === "skill") return null;
  }
  return null;
}
const gpFirst = (g, ids, used, n) => ids.map(i => CATBY[i]).filter(x => x && gpOk(g, x) && !used.has(x.id)).slice(0, n);
const gpDose = (x, low) => { const [a, b] = x.dose || [10, 10]; return low ? a : Math.round((a + b) / 2); };
function gpBuild(g) {
  const L = gpLevels(g); if (!L || !CAT) return null;
  const sp = gpSplit(g.days), T0 = GP_TPL[sp].slice(0, g.days), m = g.min;
  const nMain = { 20: 3, 30: 4, 45: 5, 60: 6 }[m], nAcc = { 20: 0, 30: 1, 45: 1, 60: 2 }[m], nWarm = { 20: 2, 30: 2, 45: 3, 60: 3 }[m], nCool = { 20: 1, 30: 2, 45: 2, 60: 3 }[m], nCardio = g.goal === "forma" ? (m <= 30 ? 1 : 2) : 0;
  const sets = m >= 45 ? 4 : 3, beginner = Math.max(L.empuje, L.traccion, L.pierna) <= 2, usedBy = {}, warns = new Set();
  const routines = T0.map(([name, kind, block, slots], ri) => {
    const used = new Set(usedBy[kind] || []), main = [];
    let list = slots.slice(0, nMain); if (g.goal === "habil") list = ["skill", ...list.slice(0, nMain - 1)];
    for (const k of list) {
      const area = GP_SLOT[k].area, lv = area === "skill" ? Math.max(2, Math.min(L.empuje, L.core + 1)) : L[area], p = gpPick(g, k, lv, used);
      if (!p) { warns.add(T("Sin opción para «{x}» con tu material y molestias: se omite.", { x: T(GP_SLOT[k].n) })); continue; }
      if (p.alt) { const bar = g.mat.includes("barra") || g.mat.includes("anillas");
        warns.add(!bar && p.slot === "pull_band" ? T("Sin barra ni anillas, la espalda se trabaja con banda o ejercicios escapulares. Una barra de puerta o unas anillas cambian mucho el plan.") : !bar ? T("Sin barra para dominadas: se usa remo en su lugar.") : T("Con tu molestia, algunos ejercicios se cambian por otros de la misma zona.")); }
      if (p.soft) warns.add(T("Con tu molestia no hay alternativa para todo: los ejercicios marcados con ⚠ la cargan y van en su versión fácil. Hazlos con cuidado o cámbialos."));
      used.add(p.x.id); (usedBy[kind] = usedBy[kind] || []).push(p.x.id);
      main.push({ id: p.x.id, sets: k === "skill" ? 3 : sets, slot: p.slot, lv, soft: p.soft });
    }
    const one = l => l.map(x => ({ id: x.id, sets: 1 }));
    const cardio = nCardio ? CAT.exercises.filter(x => x.pattern === "cardio" && gpOk(g, x) && x.level <= Math.min(3, L.pierna + 1)).sort((a, b) => b.level - a.level)
      .filter((x, i, a) => a.findIndex(z => z.family === x.family) === i).slice(ri % 2, ri % 2 + nCardio).map(x => ({ id: x.id, sets: 3 })) : [];
    const r = { name, kind, block, sec: { w: one(gpFirst(g, GP_WARM[kind], used, nWarm)), m: main, a: gpFirst(g, GP_ACC[kind], used, nAcc).map(x => ({ id: x.id, sets: 2 })), c: cardio, v: one(gpFirst(g, GP_COOL[kind], used, nCool)) } };
    // Ajuste al tiempo elegido: se recorta lo menos importante hasta que quepa
    const P0 = { beginner }, S2 = r.sec, cut = [() => S2.c.length > 1 && S2.c.pop(), () => { const it = S2.m.find(x => x.sets > 3); if (it) { it.sets = 3; return true; } }, () => S2.a.length && S2.a.pop(),
      () => S2.w.length > 2 && S2.w.pop(), () => S2.v.length > 1 && S2.v.pop(), () => S2.m.length > 2 && S2.m.pop(), () => S2.c.length && S2.c.pop()];
    while (gpMins(P0, r) > m * 1.1) { if (!cut.some(f => f())) break; }
    return r;
  });
  return { routines, warns: [...warns], beginner };
}
const gpLow = (P, sk) => sk === "m" || P.beginner;
const gpReps = (P, sk, x) => gpDose(x, gpLow(P, sk));
const GP_REST = { w: [10, 10], m: [90, 90], a: [45, 60], c: [30, 30], v: [10, 10] };   // descanso entre series y al acabar el ejercicio
const gpMins = (P, r) => routineMins(gpRoutine(P, r, "A", 1, new Set()));
function gpNeighbors(g, id) {
  const out = { prev: null, next: null };
  for (const { c, i } of CHAIN[id] || []) {
    if (!out.prev) for (let k = i - 1; k >= 0; k--) if (CATBY[c[k]] && gpOk(g, CATBY[c[k]])) { out.prev = c[k]; break; }
    if (!out.next) for (let k = i + 1; k < c.length; k++) if (CATBY[c[k]] && gpOk(g, CATBY[c[k]])) { out.next = c[k]; break; }
  }
  return out;
}
/* Variante B: cada ejercicio principal por otro parecido del mismo hueco y nivel, si lo hay */
function gpVariantB(g, P, r) {
  const used = new Set(r.sec.m.map(it => it.id));
  const m = r.sec.m.map(it => { const alt = gpCands(g, it.slot, CATBY[it.id].level, it.soft).find(x => !used.has(x.id) && x.level === CATBY[it.id].level); if (alt) { used.add(alt.id); return { ...it, id: alt.id }; } return it; });
  return { ...r, sec: { ...r.sec, m } };
}
function gpRoutine(P, r, v, day, names) {
  const secs = GP_SECS.filter(([sk]) => r.sec[sk].length).map(([sk, n]) => ({ id: "g" + sk, name: T(n) }));
  const exercises = GP_SECS.flatMap(([sk]) => r.sec[sk].map(it => { const x = CATBY[it.id]; return { name: xName(x), xid: x.id, sets: it.sets, reps: gpReps(P, sk, x), type: x.type === "time" ? "time" : "reps", ...(x.sides ? { sides: true } : {}), rest: GP_REST[sk][0], restAfter: GP_REST[sk][1], sec: "g" + sk }; }));
  let name = `${v} · ${T(r.name)}`, k = 2; while (names.has(name.toLowerCase())) name = `${v} · ${T(r.name)} (${k++})`; names.add(name.toLowerCase());
  return normRoutine({ id: uid(), name, block: r.block, variant: v, days: [day], secs, exercises });
}
async function gpCreate() {
  const g = state.gp, P = g.plan; if (!P) return;
  const usedV = new Set(state.routines.map(r => normVar(r.variant)).filter(Boolean)), free = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter(c => !usedV.has(c)), [va, vb] = free;
  const names = new Set(state.routines.map(r => r.name.trim().toLowerCase())), days = GP_DAYS[g.days];
  const add = [...P.routines.map((r, i) => gpRoutine(P, r, va, days[i], names)), ...P.routines.map((r, i) => gpRoutine(P, gpVariantB(g, P, r), vb, days[i], names))];
  state.routines.push(...add); await store.saveRoutines(state.routines);
  const old = PL.get(); if (old) PLS.save([{ ...old, id: old.id || uid() }, ...PLS.list()]);   // el activo anterior pasa a Mis planes
  PL.save({ id: uid(), name: T("Plan guiado"), enabled: true, order: true, start: dayKey(Date.now()), review: "", phases: [{ id: uid(), variant: va, weeks: 2 }, { id: uid(), variant: vb, weeks: 2 }], deload: { weeks: 1, every: 8 }, up: true });
  if (!myEquip() && g.mat.length) LS.set("wk.equip", g.mat);
  state.gp = null; state.tab = "routines"; state.routView = "plan"; state.routOpen = null; toast(T("Plan guiado creado: {n} rutinas", { n: add.length })); render(); window.scrollTo(0, 0);
}
async function gpOpen() {
  if (!catOn()) { if (!confirm(T("El plan guiado usa el catálogo de ejercicios. ¿Activarlo en este perfil?"))) return; LS.set("wk.catalog", true); }
  if (!CAT && !(await loadCatalog())) { toast(T("No se pudo cargar el catálogo. Se volverá a intentar al abrir la app.")); return; }
  state.gp = gpNew(); render();
}
function gpModal() {
  const g = state.gp; if (!g || !CAT) return "";
  const st = GP_STEPS[g.step], on = (a, b) => `aria-pressed="${a === b}"${a === b ? ' class="on"' : ""}`;
  const opt = (attr, val, cur, ic, t, d) => `<button class="gpopt" data-${attr}="${val}" aria-pressed="${cur === val}"><span class="ic" aria-hidden="true">${ic}</span><span><b>${t}</b><small>${d}</small></span></button>`;
  let h = "", f = "", nextOk = true;
  if (st === "intro") {
    h = `<h2>${T("Plan guiado")}</h2><p class="sub">${T("Unas preguntas y Usus te propone rutinas y un plan con ejercicios del catálogo, a tu nivel y con tu material. Lo revisas y cambias lo que quieras antes de guardarlo.")}</p>
      <div class="lgroup">${[T("Objetivo, días y tiempo"), T("Tu material y molestias"), T("Tu nivel: test rápido o elegido"), T("Revisas y creas el plan")].map((t, i) => `<div class="srow"><span class="gpnum">${i + 1}</span><span class="t">${t}</span></div>`).join("")}</div>
      <p class="note">${T("Es una propuesta general: no sustituye a un entrenador ni a un profesional sanitario.")}</p>`;
  }
  if (st === "goal") {
    h = `<h2>${T("¿Qué buscas?")}</h2><p class="sub">${T("Cambia el peso de cada parte de la sesión.")}</p>
      ${opt("gpgoal", "fuerza", g.goal, "💪", T("Ganar fuerza"), T("Ejercicios principales con progresión. Lo básico de la calistenia."))}
      ${opt("gpgoal", "forma", g.goal, "🏃", T("Ponerme en forma"), T("Fuerza y un bloque corto de cardio al final."))}
      ${opt("gpgoal", "habil", g.goal, "🤸", T("Aprender habilidades"), T("Fuerza y un ejercicio de habilidad al principio (pino, L-sit, equilibrios…)."))}`;
    nextOk = !!g.goal;
  }
  if (st === "days") {
    const sp = { full: T("Full body: todo el cuerpo en cada sesión."), ul: T("Torso y pierna, alternando."), ppl: T("Empuje, tirón y pierna.") }[gpSplit(g.days)];
    h = `<h2>${T("¿Cuánto puedes entrenar?")}</h2><p class="sub">${T("Puedes entrenar cualquier día: el plan va en orden.")}</p>
      <p class="addh">${T("Sesiones por semana")}</p><div class="chips">${[2, 3, 4, 5, 6].map(d => `<button data-gpdays="${d}" ${on(g.days, d)}>${d}</button>`).join("")}</div><p class="note">${sp}</p>
      <p class="addh">${T("Minutos por sesión")}</p><div class="chips">${[20, 30, 45, 60].map(d => `<button data-gpmin="${d}" ${on(g.min, d)}>${d} min</button>`).join("")}</div>`;
  }
  if (st === "mat") {
    h = `<h2>${T("¿Qué material tienes?")}</h2><p class="sub">${T("Solo se proponen ejercicios que puedas hacer. Pared siempre hay.")}</p>
      <div class="chips">${MAT_SEL().map(([k, [n]]) => `<button data-gpmat="${k}" ${on(g.mat.includes(k), true)}>${T(n)}</button>`).join("")}</div>
      ${!g.mat.includes("barra") && !g.mat.includes("anillas") ? `<div class="gpwarn">${T("Sin barra ni anillas, la espalda solo se puede trabajar con banda o ejercicios en el suelo. Una barra de puerta o unas anillas cambian mucho el plan.")}</div>` : ""}`;
  }
  if (st === "pain") {
    h = `<h2>${T("¿Alguna molestia?")}</h2><p class="sub">${T("Se evitan los ejercicios que más cargan esa zona.")}</p>
      <div class="chips">${GP_JOINTS.map(([k, n]) => `<button data-gppain="${k}" ${on(g.pain.includes(k), true)}>${T(n)}</button>`).join("")}</div>
      <p class="note">${T("Si es una lesión o un dolor que no se va, consulta antes con un profesional.")}</p>`;
  }
  if (st === "level") {
    const row = (k, n, d) => `<label class="srow"><span class="t">${n}<small>${d}</small></span><span class="gplv">${g.test[k] !== "" && +g.test[k] >= 0 ? LV(GP_TEST[k](g.test[k])) : ""}</span><input type="number" inputmode="numeric" min="0" data-gptest="${k}" value="${esc(g.test[k])}" placeholder="—" aria-label="${n}"></label>`;
    h = `<h2>${T("Tu nivel")}</h2><p class="sub">${T("Coloca cada ejercicio en su escalera. Luego lo puedes subir o bajar.")}</p>
      <div class="gpseg" role="tablist"><button role="tab" data-gplvm="test" aria-selected="${g.lvMode === "test"}">${T("Test rápido")}</button><button role="tab" data-gplvm="self" aria-selected="${g.lvMode === "self"}">${T("Elegirlo yo")}</button></div>
      ${g.lvMode === "test" ? `<div class="lgroup">${row("push", T("Flexiones"), T("Máximo seguidas, bien hechas"))}${row("pull", T("Dominadas"), T("Máximo seguidas (0 si no puedes)"))}${row("squat", T("Sentadillas"), T("Máximo seguidas"))}${row("plank", T("Plancha"), T("Segundos aguantando"))}</div><p class="note">${T("Si no puedes hacer alguno (no tienes barra, por ejemplo), pon 0.")}</p>`
        : opt("gpself", 1, g.self, LV(1), T("Empiezo de cero"), T("No hago ejercicio o hace mucho que lo dejé.")) + opt("gpself", 2, g.self, LV(3), T("Tengo algo de base"), T("Hago flexiones y sentadillas; dominadas todavía no o muy pocas.")) + opt("gpself", 3, g.self, LV(4), T("Entreno con regularidad"), T("Hago dominadas y fondos sin problema."))}`;
    nextOk = !!gpLevels(g);
  }
  if (st === "review") {
    const P = g.plan, r = P.routines[g.tab] || P.routines[0];
    h = `<h2>${T("Tu propuesta")}</h2><p class="sub">${T("Una rutina por sesión de la semana, en orden. Se crea también una variante B con ejercicios parecidos para alternar cada 2 semanas.")}</p>
      ${P.warns.map(w => `<div class="gpwarn">${esc(w)}</div>`).join("")}
      <div class="chips" style="margin:12px 0">${P.routines.map((x, i) => `<button data-gptab="${i}" ${on(g.tab, i)}>${esc(T(x.name))}</button>`).join("")}</div>
      <p class="note" style="margin-top:0">≈ ${gpMins(P, r)} min · ${TN(GP_SECS.reduce((a, [sk]) => a + r.sec[sk].length, 0), "{n} ejercicio", "{n} ejercicios")}</p>
      ${GP_SECS.filter(([sk]) => r.sec[sk].length).map(([sk, n]) => `<p class="addh">${T(n)}</p><div class="lgroup">${r.sec[sk].map((it, i) => { const x = CATBY[it.id], nb = sk === "m" ? gpNeighbors(g, it.id) : null, d = gpReps(P, sk, x);
        return `<div class="srow gpex"><span class="t"><button class="xl" data-xinfo="${x.id}">${it.soft ? "⚠ " : ""}${esc(xName(x))}</button><small>${LV(x.level)} ${it.sets} × ${d}${x.type === "time" ? " s" : ""}${x.sides ? " · " + T("por lado") : ""}</small></span>${nb ? `<button class="mv" data-gpmv="${sk}:${i}:prev" aria-label="${T("Más fácil")}" ${nb.prev ? "" : "disabled"}>‹</button><button class="mv" data-gpmv="${sk}:${i}:next" aria-label="${T("Más difícil")}" ${nb.next ? "" : "disabled"}>›</button>` : ""}</div>`; }).join("")}</div>`).join("")}
      <p class="note">${T("‹ › cambia al ejercicio anterior o siguiente de su escalera. Toca un nombre para ver su ficha. Después podrás editar las rutinas en Biblioteca.")}</p>`;
    f = `<button class="btn primary gpnext" data-act="gp-create">${T("Crear plan y rutinas")}</button>`;
  }
  if (!f) f = `<button class="btn primary gpnext" data-act="gp-next" ${nextOk ? "" : "disabled"}>${st === "intro" ? T("Empezar") : st === "level" ? T("Ver propuesta") : T("Siguiente")}</button>`;
  const dots = g.step ? `<div class="gpdots" aria-hidden="true">${GP_STEPS.slice(1).map((_, i) => `<i class="${i < g.step ? "on" : ""}"></i>`).join("")}</div>` : "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="${T("Plan guiado")}"><div class="mbox dsh full gp">
    <div class="gptop"><button class="back" style="display:inline-flex" data-act="gp-back">‹ ${g.step ? T("Atrás") : T("Cerrar")}</button>${dots}</div>
    ${h}<div class="gpfoot">${f}</div></div></div>`;
}
/* Nombre de un ejercicio que abre su ficha (si está vinculado al catálogo) */
const xLink = (e, label) => e?.xid ? `<button class="xl" data-xinfo="${esc(e.xid)}">${label}</button>` : label;
