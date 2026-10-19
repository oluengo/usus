/* ---------- Catálogo de ejercicios (2.0) ----------
   Opcional por perfil: wk.catalog = true / false (null = aún no ha elegido). Archivo aparte: ejercicios.json.
   Cada ejercicio de rutinas y sesiones guarda su nombre y, si está vinculado al catálogo, xid (id fijo, nunca cambia).
   Historial, récords y estadísticas se agrupan por xid cuando existe; si no, por nombre.
   Ejercicios propios: material opcional (equip: claves de MAT; other: texto libre, sin icono). */
const MAT = {
  barra: ["Barra", '<path d="M3 5h18M7 5v4M17 5v4M9 13a3 3 0 1 0 6 0"/><path d="M12 10v-1"/>'],
  paralelas: ["Paralelas", '<path d="M5 6v14M19 6v14M3 6h4M17 6h4"/>'],
  anillas: ["Anillas", '<path d="M8 3v7M16 3v7"/><circle cx="8" cy="15" r="4"/><circle cx="16" cy="15" r="4"/>'],
  caja: ["Caja / banco", '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M4 13h16"/>'],
  pared: ["Pared", '<path d="M4 4h16v16H4zM4 9h16M4 14h16M10 4v5M14 9v5M10 14v6"/>'],
  banda: ["Banda elástica", '<path d="M6 4c-3 6-3 10 0 16M18 4c3 6 3 10 0 16M6 4c4 3 8 3 12 0M6 20c4-3 8-3 12 0"/>'],
  lastre: ["Lastre", '<path d="M8 8h8l2 12H6z"/><path d="M10 8a2 2 0 1 1 4 0"/>'],
  rueda: ["Rueda abdominal", '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M2 12h4M18 12h4"/>']
};
const MAT_ORDER = l => Object.keys(MAT).filter(k => l.includes(k));
const PATS = [["empuje-h", "Empuje horizontal"], ["empuje-v", "Empuje vertical"], ["traccion-v", "Tracción vertical"], ["traccion-h", "Tracción horizontal"],
  ["rodilla", "Pierna · rodilla"], ["cadera", "Pierna · cadera"], ["core", "Core"], ["habilidad", "Isométricos y habilidades"], ["movilidad", "Movilidad y calentamiento"]];
let CAT = null, CATBY = {}, CHAIN = {}, VARS = {}, catLoad = null;
const catOn = () => LS.get("wk.catalog", null) === true;
const catReady = () => catOn() && !!CAT;
function loadCatalog() {
  if (CAT) return Promise.resolve(CAT);
  return catLoad = catLoad || fetch("ejercicios.json").then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !Array.isArray(d.exercises)) return null;
    CAT = d; CATBY = {}; d.exercises.forEach(x => { CATBY[x.id] = x; });
    CHAIN = {}; (d.chains || []).forEach(c => c.forEach((id, i) => (CHAIN[id] = CHAIN[id] || []).push({ c, i })));
    VARS = {}; Object.entries(d.variants || {}).forEach(([v, b]) => (VARS[b] = VARS[b] || []).push(v));
    return CAT;
  }).catch(() => null).finally(() => { catLoad = null; });
}
const xName = x => x ? (LANG !== "es" && x.name[LANG]) || x.name.es : "";
const exName = e => (e?.xid && CATBY[e.xid] ? xName(CATBY[e.xid]) : e?.name) || "";
/* Técnica (2.2.1): variante del mismo ejercicio (tempo, pausa, rango, agarre…). Misma ficha y cadena; historial y progresión aparte. */
const techOf = e => String(e?.tech || "").trim();
const exKey = e => e?.xid ? "x:" + e.xid + (techOf(e) ? "|" + norm(techOf(e)) : "") : String(e?.name || "").trim().toLowerCase();
const exLabel = e => exName(e) + (e?.xid && techOf(e) ? " · " + techOf(e) : "");
/* Al vincular un nombre propio, lo que va entre paréntesis (salvo «por lado») pasa a ser la técnica */
const techFromName = n => { const m = /\(([^)]*)\)/.exec(n || ""); return m ? m[1].split(",").map(x => x.trim()).filter(x => x && !SIDE_RX.test(x)).join(", ").slice(0, 60) : ""; };
const myEquip = () => { const l = LS.get("wk.equip", null); return Array.isArray(l) ? l : null; };
const haveMat = k => { const l = myEquip(); return !l || l.includes(k); };
const LV = n => `<span class="bars l${n}" role="img" aria-label="${T("Nivel {n} de 5", { n })}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const matIco = k => MAT[k] ? `<span class="mat${haveMat(k) ? "" : " no"}" title="${T(MAT[k][0])}"><svg viewBox="0 0 24 24" aria-hidden="true">${MAT[k][1]}</svg></span>` : "";
const matsOf = (eq, other) => (eq?.length || other) ? `<span class="mats">${(eq || []).map(matIco).join("")}${other ? `<span class="otag">${esc(other)}</span>` : ""}</span>` : "";
const xMeta = x => `<span class="xmeta">${LV(x.level)}<span>${x.type === "time" ? T("tiempo") : T("reps")}</span>${x.sides ? `<span class="otag">${T("por lado")}</span>` : ""}${x.impact ? `<span class="otag">${T("impacto")}</span>` : ""}</span>`;
const canDo = x => (x.equip || []).every(haveMat);
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const xMatches = (x, q) => !q || [x.name.es, x.name.en, x.name.ca, ...(x.alias || [])].some(n => n && norm(n).includes(q));
const xRow = (x, attr) => `<button class="xrow" ${attr}><span class="t"><b>${esc(xName(x))}</b>${xMeta(x)}</span>${matsOf(x.equip)}</button>`;
/* Propuesta del catálogo para un nombre propio. strict: solo si coincide un nombre o alias (sin tildes ni mayúsculas) */
const STOP = new Set(["en", "de", "con", "a", "la", "el", "al", "del", "las", "los", "the", "on", "with", "of"]);
function catMatch(name, strict) {
  if (!CAT) return null;
  const clean = s => norm(String(s).replace(/\(.*?\)/g, " ").replace(SIDE_RX, " "));
  const n = clean(name), toks = s => clean(s).split(" ").filter(w => w && !STOP.has(w)).map(w => w.length > 4 ? w.replace(/(es|s)$/, "") : w);
  const k = toks(name).join(" ");
  if (!n) return null;
  let best = null, bs = 0;
  for (const x of CAT.exercises) for (const c of [x.name.es, x.name.en, x.name.ca, ...(x.alias || [])].filter(Boolean)) {
    if (clean(c) === n) return x;
    if (strict) continue;
    const kc = toks(c); if (kc.join(" ") === k) { if (bs < 1) { best = x; bs = 1; } continue; }
    const a = new Set(k.split(" ")), b = new Set(kc), inter = [...a].filter(w => b.has(w)).length, sc = inter / new Set([...a, ...b]).size;
    if (sc > bs && sc >= 0.6) { best = x; bs = sc; }
  }
  return best;
}
const newFromCat = x => ({ name: xName(x), xid: x.id, sets: 3, reps: x.type === "time" ? 30 : 10, type: x.type === "time" ? "time" : "reps", sides: !!x.sides });

/* Rutinas → Ejercicios: listado del catálogo */
function catListHTML() {
  const q = norm(state.catQ || ""), only = !!state.catOnly && myEquip(), pat = state.catPat || null;
  const l = CAT.exercises.filter(x => (!pat || x.pattern === pat) && (!only || canDo(x)) && xMatches(x, q));
  return PATS.map(([p, n]) => {
    const g = l.filter(x => x.pattern === p).sort((a, b) => a.family.localeCompare(b.family) || a.level - b.level);
    return g.length ? `<div class="xgrp">${T(n)} · ${g.length}</div><div class="xlist">${g.map(x => xRow(x, `data-xinfo="${x.id}"`)).join("")}</div>` : "";
  }).join("") || `<div class="empty" style="margin-top:14px">${T("Sin resultados.")}</div>`;
}
function viewCatalog() {
  return `<input type="search" id="catQ" class="xsearch" placeholder="${T("Buscar (también en inglés o por alias)")}" value="${esc(state.catQ || "")}" aria-label="${T("Buscar ejercicio")}">
    <div class="chips xchips" role="group" aria-label="${T("Tipo de movimiento")}"><button data-catpat="" class="${state.catPat ? "" : "on"}">${T("Todos")}</button>${PATS.map(([p, n]) => `<button data-catpat="${p}" class="${state.catPat === p ? "on" : ""}">${T(n)}</button>`).join("")}</div>
    ${myEquip() ? `<label class="xtog"><span>${T("Solo con mi material")}</span><input type="checkbox" role="switch" id="catOnly" ${state.catOnly ? "checked" : ""}></label>` : ""}
    <div id="catList">${catListHTML()}</div>
    <p class="muted" style="font-size:.78rem;margin:14px 2px 0">${T("Barras = nivel dentro de su progresión (1 fácil, 5 difícil). Iconos = material; en naranja, lo que no tienes marcado en Ajustes → Entreno.")}</p>`;
}

/* Ficha de un ejercicio (hoja). state.exInfo = id; state.exInfoAdd = mostrar rutinas para añadirlo */
function exInfoModal() {
  const x = state.exInfo && CATBY[state.exInfo]; if (!x) return "";
  const inf = x.info?.[LANG] || x.info?.es || {}, onlyEs = !x.info?.[LANG] && LANG !== "es";
  const pat = PATS.find(p => p[0] === x.pattern), eq = x.equip || [];
  const base = CAT.variants?.[x.id], main = CHAIN[x.id]?.[0] || (base && CHAIN[base]?.[0]), cur = CHAIN[x.id] ? x.id : base;
  const sib = base ? [base, ...(VARS[base] || []).filter(v => v !== x.id)] : (VARS[x.id] || []);
  const more = (CHAIN[x.id] || []).slice(1).map(o => o.c[o.i + 1]).filter(Boolean);
  const link = id => `<button data-xinfo="${id}">${esc(xName(CATBY[id]))}</button>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="xiT"><div class="mbox dsh">
    <div class="sb-head"><h2 id="xiT" style="margin:0;flex:1">${esc(xName(x))}</h2><button class="btn small" data-act="xi-close">${T("Cerrar")}</button></div>
    <p class="muted" style="margin:2px 0 0;font-size:.85rem">${esc(LANG === "en" ? x.name.es : x.name.en)}</p>
    <div class="xmeta" style="margin-top:8px;font-size:.8rem"><span class="otag">${T(pat?.[1] || "")}</span>${LV(x.level)}<span>${x.type === "time" ? T("por tiempo") : T("repeticiones")}</span>${x.sides ? `<span class="otag">${T("por lado")}</span>` : ""}${x.impact ? `<span class="otag">${T("impacto")}</span>` : ""}</div>
    <div class="xcard"><h4>${T("Material")}</h4>${eq.length ? `<div class="matrow">${eq.map(k => `<span>${matIco(k)}${T(MAT[k][0])}${haveMat(k) ? "" : ` <small style="color:var(--warn)">(${T("no lo tienes")})</small>`}</span>`).join("")}</div>` : `<p>${T("Ninguno: solo suelo")}</p>`}
      ${inf.muscles?.length ? `<p class="muted" style="font-size:.85rem;margin-top:8px">${T("Músculos")}: ${esc(inf.muscles.join(", "))}</p>` : ""}</div>
    ${onlyEs ? `<p class="muted" style="font-size:.8rem;margin:10px 2px 0">${T("Por ahora, la explicación solo está en castellano.")}</p>` : ""}
    ${inf.why ? `<div class="xcard"><h4>${T("Para qué sirve")}</h4><p>${esc(inf.why)}</p></div>` : ""}
    ${inf.how?.length ? `<div class="xcard"><h4>${T("Cómo se hace")}</h4><ol>${inf.how.map(h => `<li>${esc(h)}</li>`).join("")}</ol></div>` : ""}
    ${inf.errors?.length ? `<div class="xcard"><h4>${T("Errores típicos")}</h4><ul>${inf.errors.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div>` : ""}
    ${inf.alt?.length ? `<div class="xcard"><h4>${T("Alternativas")}</h4><ul>${inf.alt.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div>` : ""}
    ${main || sib.length ? `<div class="xcard"><h4>${T("Progresión")}</h4>
      ${main ? `<div class="xchain">${main.c.map(id => `<button class="${id === cur ? "cur" : ""}" data-xinfo="${id}"><i></i><span>${esc(xName(CATBY[id]))}</span>${LV(CATBY[id].level)}</button>`).join("")}</div>` : ""}
      ${base ? `<p class="muted" style="font-size:.85rem;margin-top:6px">${T("Variante de {x}: se puede alternar con él.", { x: esc(xName(CATBY[base])) })}</p>` : ""}
      ${sib.length ? `<p class="muted" style="font-size:.85rem;margin-top:8px">${base ? T("Otras opciones del mismo nivel") : T("Variantes del mismo nivel")}</p><div class="xlinks">${sib.map(link).join("")}</div>` : ""}
      ${more.length ? `<p class="muted" style="font-size:.85rem;margin-top:8px">${T("También lleva a")}</p><div class="xlinks">${more.map(link).join("")}</div>` : ""}</div>` : ""}
    ${state.exInfoFrom === "ed" ? "" : state.exInfoAdd
      ? `<div class="xcard"><h4>${T("Añadir a una rutina")}</h4>${state.routines.length ? `<div class="xlinks">${state.routines.map(r => `<button data-xaddr="${r.id}">${esc(r.name)}</button>`).join("")}</div>` : `<p class="muted">${T("Aún no tienes rutinas.")}</p>`}</div>`
      : `<button class="btn primary" style="width:100%;margin-top:12px" data-act="xi-add">${T("Añadir a una rutina")}</button>`}
  </div></div>`;
}

/* Selector: añadir del catálogo (editor de rutina, sesión) o elegir otro al vincular. state.xpick = {mode: "ed"|"sess"|"link", q, k} */
function xpListHTML() {
  const p = state.xpick, q = norm(p.q || "");
  if (q) { const l = CAT.exercises.filter(x => xMatches(x, q)).sort((a, b) => a.level - b.level); return l.length ? `<div class="xlist" style="margin-top:10px">${l.slice(0, 40).map(x => xRow(x, `data-xpadd="${x.id}"`)).join("")}</div>` : `<p class="muted" style="margin:12px 2px">${T("Sin resultados.")}</p>`; }
  const sx = p.mode === "swap" && CATBY[state.active?.exercises[p.ei]?.from?.xid || state.active?.exercises[p.ei]?.xid];
  return (sx ? [PATS.find(z => z[0] === sx.pattern), ...PATS.filter(z => z[0] !== sx.pattern)] : PATS).map(([pt, n]) => { const g = CAT.exercises.filter(x => x.pattern === pt).sort((a, b) => a.family.localeCompare(b.family) || a.level - b.level);
    return `<div class="xgrp">${T(n)}</div><div class="xlist">${g.map(x => xRow(x, `data-xpadd="${x.id}"`)).join("")}</div>`; }).join("");
}
function xpickModal() {
  const p = state.xpick; if (!p || !CAT) return "";
  const own = p.mode !== "link";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="xpT"><div class="mbox dsh">
    <div class="sb-head"><h2 id="xpT" style="margin:0;flex:1">${p.mode === "link" ? T("Elegir del catálogo") : p.mode === "swap" ? T("Cambiar ejercicio") : T("Añadir ejercicio")}</h2><button class="btn small" data-act="xp-close">${T("Cerrar")}</button></div>
    ${p.mode === "link" ? `<p class="muted" style="margin:4px 0 0;font-size:.85rem">${T("Para «{x}»", { x: esc(p.name || "") })}</p>` : ""}
    ${p.mode === "swap" && state.active?.exercises[p.ei] ? `<p class="muted" style="margin:4px 0 0;font-size:.85rem">${T("Solo en esta sesión. En lugar de {x}.", { x: `<b style="color:var(--ink)">${esc(exName(state.active.exercises[p.ei].from || state.active.exercises[p.ei]))}</b>` })}</p>` : ""}
    <input type="search" id="xpQ" class="xsearch" placeholder="${T("Buscar en el catálogo")}" value="${esc(p.q || "")}" aria-label="${T("Buscar ejercicio")}">
    ${own ? `<button class="btn" style="width:100%;margin-top:10px" data-act="xp-own" id="xpOwn">${xpOwnLabel()}</button>` : ""}
    <div id="xpList">${xpListHTML()}</div>
  </div></div>`;
}
const xpOwnLabel = () => { const q = (state.xpick?.q || "").trim(); return "+ " + (q ? T("Crear «{x}» como ejercicio propio", { x: esc(q) }) : T("Crear ejercicio propio")); };

/* Material de un ejercicio propio (editor). state.ownMat = {i, equip, other} */
function ownMatModal() {
  const o = state.ownMat; if (!o) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="omT"><div class="mbox">
    <h2 id="omT" style="margin:0 0 4px">${T("Material")}</h2>
    <p class="muted" style="margin:0;font-size:.85rem">${esc(state.editing?.exercises[o.i]?.name || "")}</p>
    <div class="matsel">${Object.entries(MAT).map(([k, [n]]) => `<label><input type="checkbox" data-omat="${k}" ${o.equip.includes(k) ? "checked" : ""}>${matIco(k)}${T(n)}</label>`).join("")}</div>
    <label class="muted" for="omOther" style="font-size:.85rem;display:block;margin-top:12px">${T("Otro material (sin icono)")}</label>
    <input type="text" id="omOther" maxlength="40" value="${esc(o.other || "")}" placeholder="${T("Ej. mochila, toalla, escalón")}">
    <p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Nada marcado = solo suelo.")}</p>
    <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn ghost" data-act="om-cancel">${T("Cancelar")}</button><button class="btn primary" data-act="om-ok">${T("Guardar")}</button></div>
  </div></div>`;
}

/* Primera vez (por perfil): ¿cargar el catálogo? */
function catAskModal() {
  if (!state.catAsk || !LS.get("wk.welcomed", false) || state.newsOpen || state.incoming || run || state.pform) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="caT"><div class="mbox">
    <h2 id="caT" style="margin:0 0 6px">${T("Catálogo de ejercicios")}</h2>
    <p class="muted" style="margin:0">${T("Usus incluye un catálogo opcional de {n} ejercicios de calistenia, cada uno con su ficha: para qué sirve, cómo se hace, errores típicos, material y progresión.", { n: CAT?.exercises.length || 162 })}</p>
    <div class="copt">
      <button data-act="cat-yes"><b>${T("Sí, dame toda la info")}</b><small>${T("Para elegir ejercicios al crear rutinas y saber cómo avanzar.")}</small></button>
      <button data-act="cat-no"><b>${T("No, solo mis ejercicios")}</b><small>${T("Si ya sabes lo que haces. Todo funciona igual, con menos información.")}</small></button>
    </div>
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Cada perfil decide. Se puede cambiar en Ajustes → App.")}</p>
  </div></div>`;
}

/* Vincular: los nombres que ya usas → ejercicio del catálogo. wk.linkOwn = claves que se quedan como propias.
   Vincular solo añade xid (el nombre guardado no cambia), así se puede deshacer. */
const allExs = () => [...state.routines.flatMap(r => r.exercises), ...state.sessions.flatMap(s => s.exercises), ...(state.active?.exercises || [])];
function linkCandidates() {
  const m = new Map();
  allExs().forEach(e => { if (e.xid) return; const k = exKey(e); if (!k) return; const it = m.get(k) || { k, name: e.name.trim(), n: 0 }; it.n++; m.set(k, it); });
  return [...m.values()].sort((a, b) => b.n - a.n);
}
function linkOpen() {
  const items = linkCandidates().map(it => ({ ...it, to: catMatch(it.name)?.id || null }));
  state.link = { items, done: {} }; state.tab = "data"; state.xpick = null; state.exInfo = null;
}
function linkApply(k, xid) {
  allExs().forEach(e => { if (!e.xid && exKey(e) === k) { e.xid = xid; const t = techFromName(e.name); if (t && !e.tech) e.tech = t; } });
  state.link.done[k] = xid; linkSave();
}
function linkUndo(k) {
  const xid = state.link.done[k];
  if (xid) { allExs().forEach(e => { if (e.xid === xid && String(e.name || "").trim().toLowerCase() === k) { delete e.xid; delete e.tech; } }); delete state.link.done[k]; linkSave(); }
  LS.set("wk.linkOwn", (LS.get("wk.linkOwn", []) || []).filter(x => x !== k));
}
function linkSave() { store.saveAll(); if (state.active) saveActive(); }
function viewLink() {
  const L = state.link, own = new Set(LS.get("wk.linkOwn", []) || []), n = L.items.length;
  const rev = L.items.filter(it => L.done[it.k] || own.has(it.k)).length;
  const sug = L.items.filter(it => it.to && !L.done[it.k] && !own.has(it.k)).length;
  return `<h1>${T("Vincular ejercicios")}</h1>
    <p class="muted" style="margin:4px 0 0">${T("Vincula los ejercicios que ya usas con el catálogo para ver su ficha y unir su historial. Tu nombre se conserva y nada cambia sin tu confirmación.")}</p>
    ${n ? `<div class="lprog"><i style="width:${Math.round(rev / n * 100)}%"></i></div>
    <div class="row" style="justify-content:space-between"><span class="muted" style="font-size:.85rem">${T("{a} de {b} revisados", { a: rev, b: n })}</span>${sug ? `<button class="btn small" data-act="ln-all">${T("Aceptar las {n} propuestas", { n: sug })}</button>` : ""}</div>
    ${L.items.map((it, i) => { const done = L.done[it.k], isOwn = own.has(it.k), x = CATBY[done || it.to];
      return `<div class="lk${done ? " ok" : ""}${isOwn ? " own" : ""}"><div class="muted" style="font-size:.85rem">${T("Tu nombre")}: <b style="color:var(--ink)">${esc(it.name)}</b> · ${it.n === 1 ? T("1 uso") : T("{n} usos", { n: it.n })}</div>
        ${isOwn ? `<div class="to">${T("Se queda como ejercicio propio")} <span class="pill">${T("propio")}</span></div><button class="btn small" data-lnundo="${i}">${T("Deshacer")}</button>`
        : done ? `<div class="to">→ ${esc(xName(x))} ${matsOf(x.equip)} <span class="pill ok">${T("vinculado")}</span></div><button class="btn small" data-lnundo="${i}">${T("Deshacer")}</button>`
        : `<div class="to">${x ? `→ ${esc(xName(x))} ${LV(x.level)} ${matsOf(x.equip)} <small>${T("propuesta")}</small>` : `<small>${T("Sin propuesta en el catálogo")}</small>`}</div>
          <div class="row">${x ? `<button class="btn small primary" data-lnok="${i}">${T("Vincular")}</button>` : ""}<button class="btn small" data-lnpick="${i}">${T("Elegir otro")}</button><button class="btn small" data-lnown="${i}">${T("Dejar como propio")}</button></div>`}</div>`; }).join("")}`
    : `<div class="empty" style="margin-top:14px">${T("No hay ejercicios por vincular.")}</div>`}
    <button class="btn primary" style="width:100%;margin-top:16px;padding:12px" data-act="ln-close">${!n || rev === n ? T("Terminar") : T("Seguir más tarde")}</button>`;
}

/* Avisos durante el entreno: sonido y vibración, solo uno, o nada (wk.fx) */
const FX = [["both", "Sonido y vibración"], ["sound", "Solo sonido"], ["vib", "Solo vibración"], ["off", "Desactivados"]];
const fxMode = () => { const v = LS.get("wk.fx", "both"); return FX.some(f => f[0] === v) ? v : "both"; };
