/* ---------- Secciones y grupos (2.5) ----------
   Rutina: secs [{id, name}] (opcional, en orden) y groups {id: {kind: "sup"|"cir", rounds, rest, restAfter}}.
   Ejercicio: sec (id de sección) y grp (id de grupo). Los de un grupo van seguidos, en la misma sección,
   y hacen tantas series como vueltas: A1 → A2 → descanso entre vueltas → A1… */
const GKIND = { sup: "Superserie", cir: "Circuito" };
const SEC_PRESET = ["Calentamiento", "Principal", "Core", "Vuelta a la calma"];
const grpLabel = g => T(GKIND[g?.kind] || "Superserie");
function normRoutine(r) {
  const secs = (r.secs || []).filter(x => x && x.id), g = r.groups || {};
  if (secs.length) {
    const ord = Object.fromEntries(secs.map((x, i) => [x.id, i]));
    r.exercises.forEach(e => { if (!(e.sec in ord)) e.sec = secs[0].id; });
    r.exercises = r.exercises.map((e, i) => [e, i]).sort((a, b) => ord[a[0].sec] - ord[b[0].sec] || a[1] - b[1]).map(x => x[0]);
  } else r.exercises.forEach(e => delete e.sec);
  const out = [], placed = new Set();
  r.exercises.forEach(e => {
    if (e.grp && g[e.grp]) { if (placed.has(e.grp)) return; placed.add(e.grp); r.exercises.filter(x => x.grp === e.grp).forEach(x => { if (secs.length) x.sec = e.sec; out.push(x); }); }
    else { delete e.grp; out.push(e); }
  });
  r.exercises = out;
  Object.keys(g).forEach(id => { const m = out.filter(x => x.grp === id); if (m.length < 2) { m.forEach(x => delete x.grp); delete g[id]; } else { g[id].rounds = Math.max(1, Math.min(20, Math.round(+g[id].rounds || 3))); m.forEach(x => x.sets = g[id].rounds); } });
  if (Object.keys(g).length) r.groups = g; else delete r.groups;
  if (secs.length) r.secs = secs; else delete r.secs;
  return r;
}
/* Letras de orden: A, B… y A1, A2 dentro de una superserie o circuito */
function exKeys(list) {
  const k = []; let L = 0, last = null, n = 0;
  const ch = i => (i >= 26 ? String.fromCharCode(64 + Math.floor(i / 26)) : "") + String.fromCharCode(65 + i % 26);
  list.forEach(e => { if (e.grp && e.grp === last) k.push(ch(L - 1) + (++n)); else if (e.grp) { L++; last = e.grp; n = 1; k.push(ch(L - 1) + 1); } else { L++; last = null; k.push(ch(L - 1)); } });
  return k;
}
/* Duración aproximada (min): reps a ~3 s, más descansos */
function routineMins(r) {
  let t = 0; const seen = new Set(), L = r.exercises;
  L.forEach((e, i) => {
    const work = (+e.reps || 0) * (isTime(e) ? 1 : 3) * (e.sides ? 2 : 1), g = e.grp && r.groups?.[e.grp];
    if (g) { t += g.rounds * (work + (+e.rest || 0)); if (!seen.has(e.grp)) { seen.add(e.grp); t += Math.max(0, g.rounds - 1) * (+g.rest || 0) + (g.restAfter ?? defRestX()); } }
    else { const n = Math.max(1, +e.sets || 1); t += n * work + (n - 1) * restFor(e) + (i < L.length - 1 ? restXFor(e) : 0); }
  });
  return Math.max(1, Math.round(t / 60));
}
const isWarmSec = n => /calent|escalf|warm|calma|cool/i.test(n || "");
/* Editor de rutina: nombre del ejercicio (del catálogo: fijo, con ficha; propio: editable, con material) */
function edNameCell(e, i) {
  const x = e.xid && CATBY[e.xid];
  if (x) return `<div class="xname"><span><b>${esc(xName(x))}</b><span class="xmeta">${LV(x.level)}${matsOf(x.equip)}</span></span><button class="xinfo" data-xinfo="${x.id}" aria-label="${T("Ver ficha")}">i</button></div>
    <label class="fld" style="grid-column:1/-1"><span>${T("Técnica (opcional)")}</span><input type="text" data-etech="${i}" maxlength="60" value="${esc(techOf(e))}" placeholder="${T("Ej. bajada 3 s, pausa abajo, agarre ancho")}"></label>`;
  return `<input type="text" value="${esc(e.name)}" data-en="${i}" list="exNames2" placeholder="${T("Ejercicio")}" aria-label="${T("Ejercicio {n}", { n: i + 1 })}">`
    + (catOn() && !e.xid ? `<div class="exmat">${matsOf(e.equip, e.other)}<button class="btn small" data-ownmat="${i}">${e.equip?.length || e.other ? T("Material") : "+ " + T("Material")}</button><span class="otag">${T("propio")}</span></div>` : "");
}
