/* ---------- Perfiles ----------
   Cada perfil es independiente: datos y ajustes en sus propias claves. El primero ("main") usa las de siempre (wk.*);
   los demás, wk.<id>.* (ver PK). Solo se comparten la lista de perfiles y el aviso de bienvenida. */
const PCOLORS = ["#D99A52", "#93AF62", "#7FA7C9", "#C98FB8", "#E08A70", "#D4C25E"];
const saveProfs = l => { try { localStorage.setItem("wk.profiles", JSON.stringify(l)); } catch { toast(T("No se pudo guardar: almacenamiento lleno")); } };
const curProf = () => PROFS().find(p => p.id === PROF) || { id: PROF };
const multiProf = () => PROFS().length > 1;
const profName = p => p?.name || T("Yo");
const SEXN = { m: "Hombre", f: "Mujer" };
const PSYM = {
  m: c => `<circle cx="226" cy="286" r="92" fill="none" stroke="${c}" stroke-width="34"/><path d="M292 220L352 160" fill="none" stroke="${c}" stroke-width="34" stroke-linecap="round"/><path d="M394 118L392 204L308 120Z" fill="${c}" stroke="${c}" stroke-width="14" stroke-linejoin="round"/>`,
  f: c => `<circle cx="256" cy="204" r="92" fill="none" stroke="${c}" stroke-width="34"/><path d="M256 296V404M204 352H308" fill="none" stroke="${c}" stroke-width="34" stroke-linecap="round"/>`
};
function profAv(p, px, sexOver, colOver) {
  const s = sexOver || p?.sex, c = colOver || p?.color || "#A3917B";
  const inner = PSYM[s] ? PSYM[s](c) : `<text x="256" y="256" dy=".35em" text-anchor="middle" font-size="230" font-weight="700" fill="${c}" font-family="Instrument Sans,system-ui,sans-serif">${esc((p?.name || "?")[0].toUpperCase())}</text>`;
  return `<svg class="pav" width="${px}" height="${px}" viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="256" fill="#2a2119"/><circle cx="256" cy="256" r="228" fill="none" stroke="${c}" stroke-opacity=".22" stroke-width="14"/>${inner}</svg>`;
}
const profChip = () => multiProf() ? `<button class="pchip" data-act="prof-pick" aria-label="${T("Cambiar de perfil")}">${profAv(curProf(), 26)}<span>${esc(profName(curProf()))}</span></button>` : "";
/* Al cambiar de perfil se recarga la app: se recuerda dónde estabas (pantalla y pestaña de Ajustes) */
const keepPlace = () => { try { sessionStorage.setItem("usus.place", JSON.stringify({ tab: state.tab, setTab: state.setTab })); } catch {} };
function restorePlace() {
  try { const p = JSON.parse(sessionStorage.getItem("usus.place") || "null"); sessionStorage.removeItem("usus.place");
    if (p && ["train", "routines", "diary", "stats", "data"].includes(p.tab)) state.tab = p.tab;
    if (p && SET_GROUPS.some(t => t[0] === p.setTab)) state.setTab = p.setTab; } catch {}
}
const profSessions = id => (rawGet(PK("wk.sessions", id), []) || []).length;
function switchProfile(id) {
  if (id === PROF) { state.ppick = false; render(); return; }
  if (state.active) { toast(T("Termina o descarta antes la sesión en curso")); return; }
  try { localStorage.setItem("wk.profile", JSON.stringify(id)); } catch {}
  keepPlace(); location.reload();
}
function profPickModal() {
  if (!state.ppick) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ppT"><div class="mbox">
    <div class="sb-head"><h2 id="ppT" style="margin:0;flex:1">${T("Perfiles")}</h2><button class="btn small" data-act="prof-pick-close">${T("Cerrar")}</button></div>
    <p class="muted" style="font-size:.85rem;margin:4px 0 10px">${T("Cada perfil tiene sus propios datos y ajustes.")}</p>
    ${state.active ? `<div class="panel" style="border-color:var(--danger);margin-bottom:10px;font-size:.9rem">${T("Hay una sesión en curso. Termínala o descártala para cambiar de perfil.")}</div>` : ""}
    <div class="plist">${PROFS().map(p => `<button class="pitem${p.id === PROF ? " on" : ""}" data-pswitch="${p.id}">${profAv(p, 40)}<span style="flex:1;min-width:0"><b>${esc(profName(p))}</b><small>${T("{n} sesiones", { n: profSessions(p.id) })}</small></span>${p.id === PROF ? `<span class="ptick">${CHECK}</span>` : ""}</button>`).join("")}</div>
    <button class="btn" style="width:100%;margin-top:10px" data-act="prof-add">+ ${T("Añadir perfil")}</button>
  </div></div>`;
}
/* Crear perfil (y, la primera vez, completar el actual) */
function newProfForm(forMain) {
  const used = new Set(PROFS().map(p => p.color)), me = curProf();
  return forMain ? { forMain: true, step: "form", name: me.name || "", sex: me.sex || (CYC.cfg().on ? "f" : null), color: me.color || PCOLORS[0], cyc: CYC.cfg().on }
    : { step: "form", name: "", sex: null, color: PCOLORS.find(c => !used.has(c)) || PCOLORS[2], cyc: false, from: "empty", src: PROF, sel: null };
}
function startAddProfile() {
  state.ppick = false;
  state.pform = curProf().sex ? newProfForm(false) : newProfForm(true);
  render();
}
const CYC_INFO = () => `<ul class="pcycl">
  <li>${T("Sirve solo para anotar la regla y los síntomas, y ver una estimación de la próxima.")}</li>
  <li>${T("Se guarda únicamente en este móvil, dentro de este perfil.")}</li>
  <li>${T("No se envía a ningún sitio: no hay cuentas, servidores, publicidad ni análisis con IA.")}</li>
  <li>${T("Nunca sale al compartir rutinas o entrenos.")}</li></ul>
  <p class="muted" style="font-size:.78rem;margin:6px 0 0">${T("Es una estimación aproximada: no sirve como anticonceptivo ni como diagnóstico.")}</p>`;
function profFormModal() {
  const f = state.pform; if (!f) return "";
  if (f.step === "confirm") return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pcT"><div class="mbox">
    <div class="row" style="gap:12px;flex-wrap:nowrap">${profAv({ name: f.name, sex: f.sex, color: f.color }, 52)}<div><h2 id="pcT" style="margin:0">${esc(f.name.trim())}</h2><p class="muted" style="margin:0;font-size:.85rem">${T(SEXN[f.sex])}${f.sex === "f" ? " · " + (f.cyc ? T("registro de la regla activado") : T("registro de la regla desactivado")) : ""}</p></div></div>
    <div class="panel" style="margin-top:12px;font-size:.9rem">${T("El sexo no se podrá cambiar después. El nombre y el color, sí.")}</div>
    <div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="pf-back">${T("Revisar")}</button><button class="btn primary" style="flex:1" data-act="pf-ok">${f.forMain ? T("Guardar") : T("Crear perfil")}</button></div>
  </div></div>`;
  const src = PROFS().find(p => p.id === f.src) || curProf(), srcR = f.src === PROF ? state.routines : (rawGet(PK("wk.routines", f.src), []) || []);
  const sel = new Set(f.sel || srcR.map(r => r.id)), box = on => `<i class="cbx${on ? " on" : ""}">${on ? CHECK : ""}</i>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pfT"><div class="mbox dsh">
    <div class="sb-head"><h2 id="pfT" style="margin:0;flex:1">${f.forMain ? T("Tu perfil") : T("Nuevo perfil")}</h2><button class="btn small" data-act="pf-cancel">${T("Cancelar")}</button></div>
    ${f.forMain ? `<p class="muted" style="font-size:.85rem;margin:6px 0 0">${T("Antes de añadir otro perfil, completa el tuyo. Tus datos no cambian.")}</p>` : ""}
    <label class="muted" for="pfName" style="font-size:.85rem;display:block;margin-top:12px">${T("Nombre")}</label>
    <input type="text" id="pfName" maxlength="20" value="${esc(f.name)}" placeholder="${T("Ej. Cristina")}">
    <span class="muted" style="font-size:.85rem;display:block;margin-top:12px">${T("Sexo")}</span>
    <div class="psex">${["m", "f"].map(s => `<button data-pfsex="${s}" class="${f.sex === s ? "on" : ""}" aria-pressed="${f.sex === s}">${profAv(null, 48, s, f.sex === s ? f.color : "#6f6253")}<span>${T(SEXN[s])}</span></button>`).join("")}</div>
    <p class="muted" style="font-size:.78rem;margin:6px 0 0">${T("No se podrá cambiar una vez creado el perfil.")}</p>
    <span class="muted" style="font-size:.85rem;display:block;margin-top:12px">${T("Color")}</span>
    <div class="pcols">${PCOLORS.map(c => `<button data-pfcol="${c}" style="background:${c}" aria-pressed="${f.color === c}" aria-label="${T("Color")}"></button>`).join("")}</div>
    ${f.sex === "f" ? `<div class="pcyc"><label class="pcyh"><b>${T("Registro de la regla")}</b><input type="checkbox" role="switch" id="pfCyc" ${f.cyc ? "checked" : ""}></label>${CYC_INFO()}</div>` : ""}
    ${f.forMain ? "" : `<h3 class="wh">${T("Empezar con")}</h3>
      <button class="popt${f.from === "empty" ? " on" : ""}" data-pffrom="empty"><i></i><span><b>${T("Vacío")}</b><small>${T("Sin rutinas.")}</small></span></button>
      <button class="popt${f.from === "copy" ? " on" : ""}" data-pffrom="copy"><i></i><span><b>${T("Rutinas de otro perfil")}</b><small>${T("Solo las rutinas. Ningún registro.")}</small></span></button>
      ${f.from === "copy" ? `<div class="row" style="margin:4px 0 8px">${PROFS().map(p => `<button class="btn small pchip2${f.src === p.id ? " on" : ""}" data-pfsrc="${p.id}">${profAv(p, 20)} ${esc(profName(p))}</button>`).join("")}</div>
        ${srcR.length ? `<div class="rsl">${srcR.map(r => `<button class="rsr" style="padding-left:12px" data-pfr="${r.id}">${box(sel.has(r.id))}<span>${esc(r.name)}</span></button>`).join("")}</div>` : `<p class="muted" style="font-size:.85rem">${T("Ese perfil no tiene rutinas.")}</p>`}` : ""}`}
    <button class="btn primary" style="width:100%;margin-top:14px" data-act="pf-next">${f.forMain ? T("Continuar") : T("Crear perfil")}</button>
  </div></div>`;
}
function readProfForm() { const f = state.pform, n = document.getElementById("pfName"), c = document.getElementById("pfCyc"); if (!f) return; if (n) f.name = n.value; if (c) f.cyc = c.checked; }
function profFormNext() {
  const f = state.pform; readProfForm();
  const n = f.name.trim();
  if (!n) { toast(T("Ponle un nombre")); document.getElementById("pfName")?.focus(); return; }
  if (PROFS().some(p => p.id !== (f.forMain ? PROF : "") && (p.name || "").toLowerCase() === n.toLowerCase())) { toast(T("Ya hay un perfil con ese nombre")); return; }
  if (!f.sex) { toast(T("Elige hombre o mujer")); return; }
  f.step = "confirm"; render();
}
function profFormOk() {
  const f = state.pform, n = f.name.trim().slice(0, 20);
  if (f.forMain) {
    const l = PROFS().filter(p => p.id !== PROF); l.unshift({ ...curProf(), id: PROF, name: n, sex: f.sex, color: f.color }); saveProfs(l);
    if (f.sex === "f" && f.cyc && !CYC.cfg().on) CYC.set({ on: true, ack: true });
    state.pform = newProfForm(false); toast(T("Perfil guardado")); render(); return;
  }
  const id = "p" + uid(), srcR = f.src === PROF ? state.routines : (rawGet(PK("wk.routines", f.src), []) || []);
  const sel = new Set(f.sel || srcR.map(r => r.id)), routines = f.from === "copy" ? srcR.filter(r => sel.has(r.id)).map(r => ({ ...JSON.parse(JSON.stringify(r)), id: uid(), oid: r.oid || r.id })) : [];
  const put = (k, v) => { try { localStorage.setItem(PK(k, id), JSON.stringify(v)); } catch {} };
  put("wk.routines", routines); put("wk.sessions", []); put("wk.lang", LANG);
  if (f.sex === "f" && f.cyc) put("wk.cyc", { on: true, ack: true });
  saveProfs([...PROFS(), { id, name: n, sex: f.sex, color: f.color }]);
  state.pform = null; switchProfile(id);
}
/* Editar (nombre y color; el sexo no se cambia) */
function profEditModal() {
  if (!state.pedit) return "";
  const p = curProf(), col = state.pedit.color || p.color;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="peT"><div class="mbox">
    <h2 id="peT" style="margin:0 0 8px">${T("Editar perfil")}</h2>
    <label class="muted" for="peName" style="font-size:.85rem">${T("Nombre")}</label><input type="text" id="peName" maxlength="20" value="${esc(p.name || "")}">
    <span class="muted" style="font-size:.85rem;display:block;margin-top:12px">${T("Sexo")}</span>
    <div class="panel row" style="padding:8px 12px;gap:10px;flex-wrap:nowrap">${profAv({ ...p, color: col }, 28)}<span style="flex:1">${T(SEXN[p.sex] || "—")}</span><span class="muted" style="font-size:.78rem">${T("No se puede cambiar")}</span></div>
    <span class="muted" style="font-size:.85rem;display:block;margin-top:12px">${T("Color")}</span>
    <div class="pcols">${PCOLORS.map(c => `<button data-pecol="${c}" style="background:${c}" aria-pressed="${col === c}" aria-label="${T("Color")}"></button>`).join("")}</div>
    <div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="pe-cancel">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="pe-ok">${T("Guardar")}</button></div>
  </div></div>`;
}
function profEditOk() {
  const n = (document.getElementById("peName")?.value || "").trim().slice(0, 20), p = curProf();
  if (!n) { toast(T("Ponle un nombre")); return; }
  if (PROFS().some(x => x.id !== PROF && (x.name || "").toLowerCase() === n.toLowerCase())) { toast(T("Ya hay un perfil con ese nombre")); return; }
  saveProfs(PROFS().map(x => x.id === PROF ? { ...x, name: n, color: state.pedit.color || p.color } : x)); state.pedit = null; toast(T("Perfil guardado")); render();
}
/* Copiar rutinas a otro perfil */
function profCopyModal() {
  const c = state.pcopy; if (!c) return "";
  const others = PROFS().filter(p => p.id !== PROF), sel = new Set(c.sel), box = on => `<i class="cbx${on ? " on" : ""}">${on ? CHECK : ""}</i>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pkT"><div class="mbox dsh">
    <h2 id="pkT" style="margin:0 0 4px">${T("Copiar rutinas a otro perfil")}</h2>
    <p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("Se añaden a las suyas. No se borra nada ni se copia ningún registro.")}</p>
    <div class="row" style="margin-bottom:10px">${others.map(p => `<button class="btn small pchip2${c.to === p.id ? " on" : ""}" data-pkto="${p.id}">${profAv(p, 20)} ${esc(profName(p))}</button>`).join("")}</div>
    <div class="rsl">${state.routines.map(r => `<button class="rsr" style="padding-left:12px" data-pkr="${r.id}">${box(sel.has(r.id))}<span>${esc(r.name)}</span></button>`).join("")}</div>
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="pk-cancel">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="pk-ok" ${sel.size && c.to ? "" : "disabled"}>${T("Copiar")}</button></div>
  </div></div>`;
}
function profCopyOk() {
  const c = state.pcopy, k = PK("wk.routines", c.to), dest = rawGet(k, []) || [], names = new Set(dest.map(r => r.name.trim().toLowerCase()));
  const add = state.routines.filter(r => c.sel.includes(r.id)).map(r => { let n = r.name, i = 2; while (names.has(n.toLowerCase())) n = `${r.name} (${i++})`; names.add(n.toLowerCase()); return { ...JSON.parse(JSON.stringify(r)), id: uid(), name: n, oid: r.oid || r.id }; });
  try { localStorage.setItem(k, JSON.stringify([...dest, ...add])); } catch { toast(T("No se pudo guardar: almacenamiento lleno")); return; }
  const to = PROFS().find(p => p.id === c.to); state.pcopy = null;
  toast(T("{n} rutinas copiadas a {x}", { n: add.length, x: profName(to) })); render();
}
/* Borrar un perfil y todos sus datos */
function profDelete() {
  const p = curProf();
  if (!confirm(T("Se borrarán el perfil «{x}» y todos sus datos de este dispositivo. ¿Has exportado su copia?", { x: profName(p) }))) return;
  if (!confirm(T("Última confirmación: ¿borrar «{x}»?", { x: profName(p) }))) return;
  const own = k => k.startsWith("wk.") && !GLOBAL_KEYS.has(k) && (PROF === "main" ? !/^wk\.p[0-9a-z]+\./.test(k) : k.startsWith(`wk.${PROF}.`));
  try { lsKeys().filter(own).forEach(k => localStorage.removeItem(k)); } catch {}
  const rest = PROFS().filter(x => x.id !== PROF); saveProfs(rest);
  state.active = null; try { localStorage.setItem("wk.profile", JSON.stringify(rest[0].id)); } catch {}
  keepPlace(); location.reload();
}
function profSettings() {
  const p = curProf();
  if (!multiProf() && !p.sex) return `<div class="panel"><p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("Varias personas pueden usar Usus en este móvil, cada una con sus propios datos y ajustes.")}</p>
    <button class="btn small" data-act="prof-add">+ ${T("Añadir perfil")}</button></div>`;
  return `<div class="panel"><div class="row" style="gap:12px;flex-wrap:nowrap">${profAv(p, 44)}<div style="flex:1;min-width:0"><div style="font-weight:600">${esc(profName(p))}</div><div class="muted" style="font-size:.85rem">${T(SEXN[p.sex] || "—")} · ${TN(state.sessions.length, "{n} sesión", "{n} sesiones")}</div></div>
    <button class="btn small" data-act="prof-edit">${T("Editar")}</button><button class="btn small" data-act="prof-pick">${T("Perfiles")}</button></div></div>`;
}
function profDataTools() {
  if (!multiProf()) return "";
  const p = curProf();
  return `<h2>${T("Este perfil")}</h2>
    <div class="panel"><p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("Solo afecta a {x}.", { x: esc(profName(p)) })}</p>
      <button class="btn small" data-act="prof-copy">${T("Copiar rutinas a otro perfil")}</button>
      <button class="btn small danger" style="margin-top:8px;display:block" data-act="prof-del">${T("Borrar perfil «{x}»", { x: esc(profName(p)) })}</button></div>`;
}
