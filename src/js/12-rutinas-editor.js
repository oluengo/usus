/* ---------- Vista: Rutinas ---------- */
function viewRoutines() {
  const ed = state.editing;
  if (state.print) return printView();
  if (ed) {
    const secs = ed.secs || [], n = ed.exercises.length, sel = state.edSel || new Set(), selL = [...sel].map(i => ed.exercises[i]).filter(Boolean);
    const canGrp = selL.length >= 2 && (!secs.length || selL.every(e => e.sec === selL[0].sec));
    return `<div class="edgrid${catReady() ? " hascat" : ""}"><div class="edmain">
      <div class="edtop"><h1>${ed.isNew ? T("Nueva rutina") : T("Editar rutina")}</h1><span class="spacer"></span><span class="muted edsum">${n ? T(n === 1 ? "1 ejercicio · ≈ {m} min" : "{n} ejercicios · ≈ {m} min", { n, m: routineMins(ed) }) : ""}</span>
        <button class="btn ghost" data-act="cancelroutine">${T("Cancelar")}</button><button class="btn primary" data-act="saveroutine">${T("Guardar rutina")}</button></div>
      <div class="panel edhead" style="margin-top:16px">
        <div class="ehf ehn"><label class="muted" for="rName" style="font-size:.85rem">${T("Nombre")}</label>
        <input type="text" id="rName" value="${esc(ed.name)}" placeholder="${T("Ej. Torso A")}"></div>
        <div class="ehf"><label class="muted" for="rBlock" style="font-size:.85rem;display:block;margin-top:12px">${T("Tipo")}</label>
        <select id="rBlock">${CATS.map(([k, n]) => `<option value="${k}" ${(ed.block || guessBlock(ed.name)) === k ? "selected" : ""}>${T(n)}</option>`).join("")}</select></div>
        <div class="ehf"><label class="muted" for="rVariant" style="font-size:.85rem;display:block;margin-top:12px">${T("Variante del plan")}</label>
        <input type="text" id="rVariant" value="${esc(ed.variant ?? guessVariant(ed.name))}" maxlength="6" list="rVarList" placeholder="${T("Sin variante")}" style="text-transform:uppercase">
        <datalist id="rVarList">${planVariants(PL.get()).map(v => `<option value="${esc(v)}">`).join("")}</datalist>
        <p class="muted ehint" style="font-size:.78rem;margin:4px 0 0">${T("Ej. A, B, C. Vacío = se sugiere en cualquier semana, también en descarga (como la Diaria).")}</p></div>
        <div class="ehf ehd"><span class="muted" style="font-size:.85rem;display:block;margin-top:12px">${T("Días en que se sugiere")}</span>
        <div class="chips" style="margin-top:6px" role="group" aria-label="${T("Días en que se sugiere")}">${WEEK_ORDER.map(x => `<button data-rday="${x}" class="${(ed.days || []).includes(x) ? "on" : ""}" aria-pressed="${(ed.days || []).includes(x)}" aria-label="${DIAS[x]}">${dayShort(x)}</button>`).join("")}
          <button data-rday="all" class="ghostc">${T("Todos")}</button><button data-rday="none" class="ghostc">${T("Ninguno")}</button></div></div>
        </div>
      <div class="panel" style="margin-top:12px">
        <div class="row" style="align-items:baseline"><h2 style="margin:0;flex:1;font-size:1rem">${T("Ejercicios")}</h2><span class="muted edsum2" style="font-size:.85rem">${n ? T(n === 1 ? "1 ejercicio · ≈ {m} min" : "{n} ejercicios · ≈ {m} min", { n, m: routineMins(ed) }) : ""}</span></div>
        ${edList(ed)}
        <datalist id="exNames2">${allExerciseNames().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
        <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn small" data-act="${catReady() ? "xpick-ed" : "addre"}">${T("Añadir ejercicio")}</button>
          ${secs.length ? `<button class="btn small" data-act="sec-add">+ ${T("Sección")}</button>` : `<button class="btn small" data-act="sec-preset">${T("Dividir en secciones")}</button>`}</div>
        <p class="pchint">🖥 ${T("En un ordenador o una tablet en horizontal, el editor se abre en modo amplio: cada ejercicio en una fila y el catálogo al lado para tocar o arrastrar.")}</p>
        <p class="muted" style="font-size:.78rem;margin:10px 0 0">${T("Marca dos o más ejercicios para hacer una superserie o un circuito: se hacen uno tras otro y se repite la vuelta. Para reordenar, usa ↑ ↓ o arrastra desde ⋮⋮.")}</p>
      </div>
      ${sel.size ? `<div class="selbar" role="region" aria-label="${T("Marcados")}"><span>${T("{n} marcados", { n: sel.size })}${sel.size >= 2 && !canGrp ? ` · <small>${T("deben estar en la misma sección")}</small>` : ""}</span><span class="spacer"></span>
        <button class="btn small" data-act="sel-clear">${T("Desmarcar")}</button><button class="btn small primary" data-act="ed-group" ${canGrp ? "" : "disabled"}>${T("Agrupar")}</button></div>` : ""}
      <div class="row edbot" style="margin-top:16px">
        ${!ed.isNew ? `<button class="btn danger" data-act="delroutine">${T("Eliminar")}</button>` : ""}
        <span class="spacer"></span>
        <button class="btn ghost" data-act="cancelroutine">${T("Cancelar")}</button>
        <button class="btn primary" data-act="saveroutine">${T("Guardar rutina")}</button>
      </div></div>
      ${catReady() ? `<aside class="edcat panel" aria-label="${T("Catálogo")}"><h2 style="margin:0 0 8px;font-size:1rem">${T("Catálogo")}</h2>
        <input type="search" id="edQ" class="xsearch" placeholder="${T("Buscar en el catálogo")}" value="${esc(state.edQ || "")}" aria-label="${T("Buscar ejercicio")}">
        <p class="muted" style="font-size:.78rem;margin:6px 0 0">${secs.length ? T("Toca para añadir a «{x}», o arrastra a cualquier sección.", { x: esc(secs.find(x => x.id === edCurSec(ed))?.name || "") }) : T("Toca para añadir, o arrastra a la lista.")}</p>
        <div id="edList">${edCatHTML()}</div></aside>` : ""}</div>`;
  }
  const rv = state.routView === "cat" && catReady() ? "cat" : state.routView === "plan" ? "plan" : "mine";
  if (rv === "plan" && state.planMode === "edit" && state.planDraft) return viewPlanEdit();
  const tabs = [["mine", T("Rutinas")], ["plan", T("Plan")], ...(catReady() ? [["cat", T("Ejercicios")]] : [])];
  const head = rv === "mine" ? `${state.routines.length ? `<button class="btn icon shbtn" data-act="rs-open" aria-label="${T("Compartir rutinas")}" title="${T("Compartir rutinas")}">${SHARE_ICO}</button>` : ""}<button class="btn primary" data-act="newroutine">+ ${T("Nueva rutina")}</button>` : "";
  const cur = routCur(), open = !!state.routOpen && !!cur;
  return `
    <div class="rtop"><div class="phead"><h1>${T("Entreno")}</h1>${head}</div>
    ${utabs(tabs, rv, "rview", T("Entreno"))}</div>
    ${rv === "cat" ? viewCatalog() : rv === "plan" ? planSection() : state.routines.length ? `<div class="rsplit${open ? " hasdet" : ""}"><div class="rlist">${routGroups().map(([g, rs]) => `${g ? `<div class="glabel">${g}</div>` : ""}<div class="lgroup">${rs.map(r => routRow(r, r.id === cur?.id)).join("")}</div>`).join("")}</div>${routDetail(cur)}</div>`
      : `<div class="empty" style="margin-top:16px">${T("Crea una rutina con sus ejercicios, series y repeticiones objetivo.")}</div>`}`;
}
/* Pestañas subrayadas (un solo estilo en toda la app) */
const utabs = (list, cur, attr, label) => `<div class="utabs" role="tablist" aria-label="${esc(label)}">${list.map(([k, n]) => `<button role="tab" data-${attr}="${k}" aria-selected="${cur === k}">${esc(n)}</button>`).join("")}</div>`;
const daysTxt = r => (r.days || []).length ? (r.days.length === 7 ? T("todos los días") : WEEK_ORDER.filter(x => r.days.includes(x)).map(dayShort).join(" ")) : "";
/* Rutinas por variante: primero las que no tienen (Diaria, extras), luego A, B, C… La de esta semana del plan, marcada */
function routGroups() {
  const vs = [...new Set(state.routines.map(r => normVar(r.variant)).filter(Boolean))].sort(), none = state.routines.filter(r => !normVar(r.variant));
  if (!vs.length) return [["", state.routines]];
  const pn = planNow(), wv = pn?.status === "on" && !pn.w.deload ? pn.w.variant : null;
  return [...(none.length ? [[T("Sin variante"), none]] : []), ...vs.map(v => [T("Variante {v}", { v: esc(v) }) + (v === wv ? ` · ${T("esta semana")}` : ""), state.routines.filter(r => normVar(r.variant) === v)])];
}
function routRow(r, cur) {
  const v = normVar(r.variant), d = daysTxt(r);
  return `<button class="lrow rrow${cur ? " cur" : ""}" data-ropen="${r.id}" aria-current="${cur && !!state.routOpen}">${v ? vChip(v) : `<span class="vchip vd">·</span>`}
    <span class="t"><b>${esc(r.name)}</b><small>${T(CAT_NAME[r.block] || "Otro")}${d ? ` · ${d}` : ""} · ${TN(r.exercises.length, "{n} ejercicio", "{n} ejercicios")}</small></span><span class="chev" aria-hidden="true">›</span></button>`;
}
/* La rutina: pantalla propia en el móvil (con Atrás) y panel a la derecha de la lista en pantalla ancha */
const routCur = () => state.routines.find(r => r.id === state.routOpen) || state.routines[0] || null;
function routDetail(r) {
  if (!r) return "";
  const L = r.exercises, keys = exKeys(L), C = 5, d = daysTxt(r), v = normVar(r.variant), many = !!(r.groups || r.secs);
  let rows = "", items = "";
  L.forEach((e, i) => {
    const g = e.grp && r.groups?.[e.grp], side = e.sides && !SIDE_RX.test(e.name) ? ` <span class="muted" style="font-size:.8rem">· ${T("por lado")}</span>` : "";
    if (r.secs?.length && (i === 0 || L[i - 1].sec !== e.sec)) { const sn = esc(r.secs.find(x => x.id === e.sec)?.name || ""); rows += `<tr class="rdsec"><td colspan="${C}">${sn}</td></tr>`; items += `<div class="rsec">${sn}</div>`; }
    if (g && (i === 0 || L[i - 1].grp !== e.grp)) { const gl = `${grpLabel(g)} · ${T("{n} vueltas", { n: g.rounds })}${+g.rest ? ` · ${T("{n} s entre vueltas", { n: g.rest })}` : ""}`; rows += `<tr class="rdgrp"><td colspan="${C}">${gl}</td></tr>`; items += `<div class="rgrp">${gl}</div>`; }
    rows += `<tr class="${g ? "ing" : ""}"><td class="k">${keys[i]}</td><td>${esc(exLabel(e))}${side}</td>
      <td class="n">${g ? "" : e.sets + " × "}${e.reps}${isTime(e) ? " s" : ""}</td><td class="n">${g ? (+e.rest > 0 ? e.rest + " s" : "—") : restFor(e) + " s"}</td><td class="n">${g ? "" : restXFor(e) + " s"}</td></tr>`;
    items += `<div class="rex${g ? " ing" : ""}"><span>${many ? `<b class="ekey">${keys[i]}</b> ` : ""}${esc(exLabel(e))}${side}</span><span class="muted">${g ? "" : e.sets + " × "}${e.reps}${isTime(e) ? " s" : ""}</span></div>`;
  });
  return `<section class="rdet" aria-label="${esc(r.name)}">
    <button class="back" data-back="rout">‹ ${T("Rutinas")}</button>
    <div class="rdh">${v ? vChip(v) : ""}<h2>${esc(r.name)}</h2></div>
    <p class="sub">${T(CAT_NAME[r.block] || "Otro")}${d ? ` · ${d}` : ""} · ${TN(L.length, "{n} ejercicio", "{n} ejercicios")} · ≈ ${routineMins(normRoutine(JSON.parse(JSON.stringify(r))))} min</p>
    <div class="rdact"><button class="btn primary" data-start="${r.id}">${PLAY}${T("Empezar")}</button><button class="btn" data-edit="${r.id}">${T("Editar")}</button><span class="spacer"></span>
      <button class="btn icon" data-rprint="${r.id}" aria-label="${T("Imprimir")} ${esc(r.name)}" title="${T("Imprimir")}">${PRINT_ICO}</button><button class="btn icon" data-rshare="${r.id}" aria-label="${T("Compartir")} ${esc(r.name)}" title="${T("Compartir")}">${SHARE_ICO}</button><button class="btn icon" data-dup="${r.id}" aria-label="${T("Duplicar")} ${esc(r.name)}" title="${T("Duplicar")}">${MORE_ICO}</button></div>
    ${L.length ? `<table class="rdtab onlyw"><thead><tr><th></th><th>${T("Ejercicio")}</th><th class="n">${T("Objetivo")}</th><th class="n">${T("Descanso (s)")}</th><th class="n">${T("Al terminar (s)")}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="rbody onlyn">${items}</div>` : `<p class="muted">${T("Sin ejercicios")}</p>`}
  </section>`;
}
const edCurSec = ed => { const secs = ed.secs || []; return secs.some(x => x.id === state.edSec) ? state.edSec : secs[Math.min(1, secs.length - 1)]?.id || ""; };
function edCatHTML() {
  const q = norm(state.edQ || "");
  if (q) { const l = CAT.exercises.filter(x => xMatches(x, q)).sort((a, b) => a.level - b.level); return l.length ? `<div class="xlist" style="margin-top:10px">${l.slice(0, 40).map(x => xRow(x, `data-edadd="${x.id}" draggable="true"`)).join("")}</div>` : `<p class="muted" style="margin:12px 2px">${T("Sin resultados.")}</p>`; }
  return PATS.map(([pt, n]) => { const g = CAT.exercises.filter(x => x.pattern === pt).sort((a, b) => a.family.localeCompare(b.family) || a.level - b.level);
    return `<div class="xgrp">${T(n)}</div><div class="xlist">${g.map(x => xRow(x, `data-edadd="${x.id}" draggable="true"`)).join("")}</div>`; }).join("");
}
function edExRow(ed, e, i, key) {
  const g = e.grp && ed.groups?.[e.grp], on = !!state.edSel?.has(i), nm = exName(e) || T("Ejercicio {n}", { n: i + 1 }), open = state.edOpen === i || !exName(e);
  const sum = `${g ? "" : `${esc(e.sets)} × `}${esc(e.reps)}${isTime(e) ? " s" : ""}${e.sides ? ` · ${T("por lado")}` : ""}${techOf(e) ? ` · ${esc(techOf(e))}` : ""}`;
  return `<div class="ex-edit${g ? " ing" : ""}${on ? " sel" : ""}${open ? "" : " cmp"}" data-dex="${i}">
    <div class="exh2"><span class="hdl" draggable="true" aria-hidden="true" title="${T("Arrastrar")}">⋮⋮</span><label class="ek"><input type="checkbox" data-esel="${i}" ${on ? "checked" : ""} aria-label="${T("Marcar {x}", { x: esc(nm) })}"><b>${key}</b></label><span class="spacer"></span>
      <button class="ico" data-emv="${i}:-1" aria-label="${T("Subir {x}", { x: esc(nm) })}">↑</button><button class="ico" data-emv="${i}:1" aria-label="${T("Bajar {x}", { x: esc(nm) })}">↓</button><button class="x" data-rmre="${i}" aria-label="${T("Quitar ejercicio")}">×</button></div>
    ${edNameCell(e, i)}
    <button class="exsum" data-eopen="${i}" aria-expanded="${open}" aria-label="${T("Detalles de {x}", { x: esc(nm) })}"><span>${sum}</span><span aria-hidden="true">${open ? "▴" : "▾"}</span></button>
    <label class="fld"><span>${g ? T("Vueltas") : T("Series")}</span><input type="number" min="1" value="${esc(g ? g.rounds : e.sets)}" data-es="${i}" inputmode="numeric" ${g ? "disabled" : ""}></label>
    <label class="fld"><span>${T("Objetivo")}</span><input type="number" min="1" value="${esc(e.reps)}" data-er="${i}" inputmode="numeric"></label>
    <label class="fld"><span>${T("Tipo")}</span><select data-et="${i}"><option value="reps" ${isTime(e) ? "" : "selected"}>${T("reps")}</option><option value="time" ${isTime(e) ? "selected" : ""}>${T("seg")}</option></select></label>
    ${g ? `<label class="fld"><span>${T("Descanso tras él (s)")}</span><input type="number" min="0" step="5" inputmode="numeric" value="${+e.rest > 0 ? e.rest : ""}" placeholder="0" data-erest="${i}"></label>`
      : `<label class="fld"><span>${T("Descanso entre series (s)")}</span><input type="number" min="0" step="5" inputmode="numeric" value="${+e.rest > 0 ? e.rest : ""}" placeholder="${defRest()}" data-erest="${i}"></label>
    <label class="fld"><span>${T("Descanso al terminar (s)")}</span><input type="number" min="0" step="5" inputmode="numeric" value="${e.restAfter !== null && e.restAfter !== undefined && e.restAfter !== "" ? e.restAfter : ""}" placeholder="${defRestX()}" data-erestx="${i}"></label>`}
    <label class="chk"><input type="checkbox" data-eside="${i}" ${e.sides ? "checked" : ""}> <span style="white-space:nowrap">${T("Por lado")}</span></label>
  </div>`;
}
function edGroup(ed, gid, inner) {
  const g = ed.groups[gid];
  return `<div class="egrp"><div class="egh"><select data-gkind="${gid}" aria-label="${T("Tipo de grupo")}">${Object.entries(GKIND).map(([k, n]) => `<option value="${k}" ${g.kind === k ? "selected" : ""}>${T(n)}</option>`).join("")}</select>
    <label class="fld"><span>${T("Vueltas")}</span><input type="number" min="1" max="20" inputmode="numeric" data-grounds="${gid}" value="${g.rounds}"></label>
    <label class="fld"><span>${T("Descanso entre vueltas (s)")}</span><input type="number" min="0" step="5" inputmode="numeric" data-grest="${gid}" value="${+g.rest || 0}"></label>
    <label class="fld"><span>${T("Descanso al terminar (s)")}</span><input type="number" min="0" step="5" inputmode="numeric" data-gafter="${gid}" value="${g.restAfter ?? ""}" placeholder="${defRestX()}"></label>
    <button class="btn small" data-gsplit="${gid}">${T("Separar")}</button></div>${inner}</div>`;
}
function edList(ed) {
  const L = ed.exercises, keys = exKeys(L), secs = ed.secs || [], cur = edCurSec(ed);
  const body = idxs => { let h = "", k = 0;
    while (k < idxs.length) { const i = idxs[k], e = L[i];
      if (e.grp && ed.groups?.[e.grp]) { const run = []; while (k < idxs.length && L[idxs[k]].grp === e.grp) run.push(idxs[k++]); h += edGroup(ed, e.grp, run.map(j => edExRow(ed, L[j], j, keys[j])).join("")); }
      else { h += edExRow(ed, e, i, keys[i]); k++; } }
    return h; };
  const cols = `<div class="edcols" aria-hidden="true"><span></span><span>${T("Ejercicio")}</span><span>${T("Series")}</span><span>${T("Objetivo")}</span><span>${T("Tipo")}</span><span>${T("Descanso (s)")}</span><span>${T("Al terminar (s)")}</span><span></span></div>`;
  if (!secs.length) return cols + `<div class="dropz" data-dsec="">${body(L.map((_, i) => i)) || `<p class="muted dz">${T("Sin ejercicios")}</p>`}</div>`;
  return secs.map((x, si) => { const idxs = L.map((e, i) => e.sec === x.id ? i : -1).filter(i => i >= 0), on = x.id === cur;
    return `<section class="esec"><div class="sech"><input type="text" data-secn="${x.id}" value="${esc(x.name)}" maxlength="40" aria-label="${T("Nombre de la sección")}">
      <button class="btn small${on ? " primary" : ""}" data-seccur="${x.id}" aria-pressed="${on}">${on ? T("Añadiendo aquí") : T("Añadir aquí")}</button>
      <button class="ico" data-secmv="${x.id}:-1" ${si ? "" : "disabled"} aria-label="${T("Subir sección")}">↑</button><button class="ico" data-secmv="${x.id}:1" ${si < secs.length - 1 ? "" : "disabled"} aria-label="${T("Bajar sección")}">↓</button><button class="x" data-secdel="${x.id}" aria-label="${T("Quitar sección")}">×</button></div>
      ${idxs.length ? cols : ""}<div class="dropz" data-dsec="${x.id}">${body(idxs) || `<p class="muted dz">${T("Vacía: añade o arrastra aquí ejercicios.")}</p>`}</div></section>`; }).join("");
}
/* Mover un ejercicio con ↑ ↓: dentro de su sección (salta grupos enteros), al cambiar de sección pasa a la vecina, y en el borde de un grupo sale de él */
function edMove(i, dir) {
  const ed = state.editing, L = ed.exercises, e = L[i], j = i + dir, nb = L[j]; if (!e || !nb) return;
  state.edOpen = null;
  if ((ed.secs || []).length && nb.sec !== e.sec) { e.sec = nb.sec; delete e.grp; }
  else if (e.grp && nb.grp === e.grp) { L[i] = nb; L[j] = e; }
  else if (e.grp) delete e.grp;
  else if (nb.grp) { const m = L.map((x, k) => x.grp === nb.grp ? k : -1).filter(k => k >= 0); L.splice(i, 1); const at = dir < 0 ? m[0] : m[m.length - 1]; L.splice(dir < 0 ? at : at, 0, e); }
  else { L[i] = nb; L[j] = e; }
  state.edSel = null; normRoutine(ed);
}
function edAdd(item) {
  const ed = state.editing, sec = edCurSec(ed); if (sec) item.sec = sec;
  const last = sec ? ed.exercises.map(x => x.sec).lastIndexOf(sec) : -1;
  ed.exercises.splice(last >= 0 ? last + 1 : ed.exercises.length, 0, item); state.edSel = null; normRoutine(ed);
  return ed.exercises.indexOf(item);
}
function readEditor() {
  const ed = state.editing; if (!ed) return;
  (ed.secs || []).forEach(x => { const i = document.querySelector(`[data-secn="${x.id}"]`); if (i) x.name = i.value.trim().slice(0, 40) || x.name; });
  Object.entries(ed.groups || {}).forEach(([id, g]) => {
    const k = document.querySelector(`[data-gkind="${id}"]`), r = document.querySelector(`[data-grounds="${id}"]`), rs = document.querySelector(`[data-grest="${id}"]`), ra = document.querySelector(`[data-gafter="${id}"]`);
    if (k) g.kind = GKIND[k.value] ? k.value : "sup"; if (r) g.rounds = Math.max(1, Math.min(20, Math.round(+r.value || 1))); if (rs) g.rest = Math.max(0, Math.round(+rs.value || 0));
    if (ra) g.restAfter = ra.value === "" ? null : Math.max(0, Math.round(+ra.value || 0));
  });
  const n = $("#rName"); if (n) ed.name = n.value;
  const bl = $("#rBlock"); if (bl) ed.block = bl.value;
  const rv = $("#rVariant"); if (rv) ed.variant = normVar(rv.value);
  ed.exercises.forEach((e, i) => {
    const a = document.querySelector(`[data-en="${i}"]`), b = document.querySelector(`[data-es="${i}"]`), c = document.querySelector(`[data-er="${i}"]`), t = document.querySelector(`[data-et="${i}"]`);
    if (a) e.name = a.value; if (b) e.sets = b.value; if (c) e.reps = c.value; if (t) e.type = t.value;
    const sd = document.querySelector(`[data-eside="${i}"]`); if (sd) e.sides = sd.checked;
    const tq = document.querySelector(`[data-etech="${i}"]`); if (tq) e.tech = tq.value.trim().slice(0, 60);
    const rs = document.querySelector(`[data-erest="${i}"]`); if (rs) e.rest = rs.value === "" ? null : Math.max(0, +rs.value || 0);
    const rx = document.querySelector(`[data-erestx="${i}"]`); if (rx) e.restAfter = rx.value === "" ? null : Math.max(0, Math.round(+rx.value || 0));
  });
}

