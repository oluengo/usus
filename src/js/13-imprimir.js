/* ---------- Imprimible (2.5): por ejercicio (1 o 2 por hoja) u hoja de semanas (rutina entera × 6 sesiones) ---------- */
function printView() {
  const p = state.print, r = state.routines.find(x => x.id === p.rid); if (!r) { state.print = null; return viewRoutines(); }
  const rn = normRoutine(JSON.parse(JSON.stringify(r))), L = rn.exercises, keys = exKeys(L), secName = id => (rn.secs || []).find(x => x.id === id)?.name || "";
  const tgt = e => `${isTime(e) ? e.reps + " s" : e.reps}${e.sides ? " " + T("por lado") : ""}`;
  const foot = (i, n) => `<div class="ft"><span>Usus · ${esc(r.name)}</span><span>${n > 1 ? `${i + 1} / ${n}` : ""}</span></div>`;
  let pages = [];
  if (p.mode === "ej") {
    const list = L.map((e, i) => ({ e, k: keys[i] })).filter(x => p.cal || !isWarmSec(secName(x.e.sec)));
    const per = p.two ? 2 : 1, rows = p.two ? 13 : 28;
    for (let i = 0; i < list.length; i += per) pages.push(list.slice(i, i + per).map(({ e, k }) => {
      const g = e.grp && rn.groups?.[e.grp], S = Math.max(+e.sets || 1, 4);
      const sub = [esc(r.name), `${T("objetivo")} ${g ? "" : (+e.sets || 1) + " × "}${tgt(e)}`, g ? `${grpLabel(g)} · ${T("{n} vueltas", { n: g.rounds })}` : +e.rest > 0 ? T("descanso {n} s", { n: e.rest }) : "", techOf(e) ? esc(techOf(e)) : ""].filter(Boolean).join(" · ");
      return `<div class="ej"><h3>${k} · ${esc(exName(e))}</h3><div class="sub">${sub}</div><table>
        <tr><th style="width:64px">${T("Fecha")}</th>${Array.from({ length: S }, (_, j) => `<th class="s">S${j + 1}</th>`).join("")}<th class="s">${T("Lastre")}</th><th class="nt">${T("Notas")}</th></tr>
        ${Array.from({ length: rows }, () => `<tr><td></td>${'<td class="s"></td>'.repeat(S)}<td class="s"></td><td class="nt"></td></tr>`).join("")}</table></div>`; }).join(""));
    if (!pages.length) pages.push(`<p style="color:#666">${T("Sin ejercicios")}</p>`);
  } else {
    const C = 6, cols = '<td class="c"></td>'.repeat(C);
    let h = `<div class="hd"><h2>${esc(r.name)}</h2><span>${T("Una columna por sesión: apunta lo hecho (p. ej. 8·8·7·6)")}</span></div>
      <table><tr><th></th><th style="width:36%">${T("Ejercicio")}</th><th>${T("Objetivo")}</th>${'<th class="c">__/__</th>'.repeat(C)}</tr>`;
    L.forEach((e, i) => {
      if (rn.secs?.length && (i === 0 || L[i - 1].sec !== e.sec)) h += `<tr><td colspan="${C + 3}" class="blk">${esc(secName(e.sec))}</td></tr>`;
      const g = e.grp && rn.groups?.[e.grp];
      if (g && (i === 0 || L[i - 1].grp !== e.grp)) h += `<tr class="grp"><td></td><td colspan="${C + 2}">${grpLabel(g)} · ${T("{n} vueltas", { n: g.rounds })}${+g.rest ? ` · ${T("{n} s entre vueltas", { n: g.rest })}` : ""}</td></tr>`;
      h += `<tr><td class="k">${keys[i]}</td><td class="n">${esc(exName(e))}${techOf(e) ? ` <small>· ${esc(techOf(e))}</small>` : ""}</td><td class="t">${g ? "" : (+e.sets || 1) + " × "}${tgt(e)}</td>${cols}</tr>`;
    });
    h += `<tr><td></td><td class="n">${T("Esfuerzo (PEM 1–10)")}</td><td></td>${cols}</tr></table>
      <p class="lg">${T("A, B… = orden. A1, A2 = superserie o circuito: se hacen seguidos y se repite la vuelta.")}</p>`;
    pages = [h];
  }
  return `<div class="prt-ui"><div class="row"><button class="btn small" data-act="print-close">‹ ${T("Volver")}</button><h1 style="flex:1;margin:0 0 0 6px">${T("Imprimir")}</h1></div>
    <p class="muted" style="margin:6px 0 0">${esc(r.name)}</p>
    <div class="rseg" role="group" aria-label="${T("Formato")}"><button data-pmode="ej" aria-pressed="${p.mode === "ej"}">${T("Por ejercicio")}</button><button data-pmode="sem" aria-pressed="${p.mode === "sem"}">${T("Hoja de semanas")}</button></div>
    <p class="muted" style="font-size:.85rem;margin:0 0 8px">${p.mode === "ej" ? T("Una hoja por ejercicio con muchas fechas para ver su progresión.") : T("La rutina entera en una hoja, con 6 sesiones.")}</p>
    ${p.mode === "ej" ? `<div class="prt-opts"><label><input type="checkbox" data-popt="two" ${p.two ? "checked" : ""}> ${T("2 ejercicios por hoja")}</label>${rn.secs?.some(x => isWarmSec(x.name)) ? `<label><input type="checkbox" data-popt="cal" ${p.cal ? "checked" : ""}> ${T("Incluir calentamiento y vuelta a la calma")}</label>` : ""}</div>` : ""}
    <button class="btn primary" style="width:100%;padding:12px" data-act="print-go">${T("Imprimir / guardar PDF")} · ${pages.length === 1 ? T("1 hoja") : T("{n} hojas", { n: pages.length })}</button>
    <p class="muted" style="font-size:.78rem;margin:6px 0 14px">${T("En el diálogo de impresión elige «Guardar como PDF» para tener el archivo.")}</p></div>
    <div class="prt-pages">${pages.map((pg, i) => `<div class="page">${pg}${foot(i, pages.length)}</div>`).join("")}</div>`;
}
/* Imprimir: en el navegador, el diálogo del sistema; en el APK, el puente nativo (si está) */
function printNow() {
  const r = state.routines.find(x => x.id === state.print?.rid), name = `Usus - ${(r?.name || "").replace(/[\\/:*?"<>|]/g, "-")}`;
  if (window.ususPrint) { window.ususPrint(name); return; }
  const old = document.title; document.title = name; addEventListener("afterprint", () => { document.title = old; }, { once: true });
  try { window.print(); } catch { document.title = old; toast(T("No se puede imprimir desde aquí")); }
}
const fitPrint = () => { const c = $(".prt-pages"); if (c) c.style.setProperty("--z", String(Math.min(1, c.clientWidth / 794))); };
window.addEventListener("resize", () => { if (state.print) fitPrint(); });

