/* ---------- Vista: Datos ---------- */
const MIT = `MIT License

Copyright (c) 2026 Usus contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const item = (t, d, act, label, primary) => `<div class="data-item"><div style="flex:1"><div class="t">${t}</div><div class="d">${d}</div></div><button class="btn small${primary ? " primary" : ""}" data-act="${act}">${label}</button></div>`;
function viewData() {
  const lastBk = LS.get("wk.lastBackup", 0), sel = SET_GROUPS.some(g => g[0] === state.setTab) ? state.setTab : null, cur = sel || "perfil";
  const P = {
    entreno: `
    <h2>${T("Tiempos")}</h2>
    <div class="lgroup">
      ${srowN("restDef", T("Descanso entre series (s)"), defRest(), 'min="0" step="5"')}
      ${srowN("restXDef", T("Descanso entre ejercicios (s)"), defRestX(), 'min="0" step="5"')}
      ${srowN("prepDef", T("Preparación (s)"), prepSecs(), 'min="0" max="30"', T("Antes de una serie por tiempo que empiezas tú"))}
      ${srowN("warnDef", T("Aviso final (s)"), warnSecs(), 'min="0" max="10"', T("Tics en los últimos segundos"))}
      ${srowN("switchDef", T("Cambio de lado (s)"), switchSecs(), 'min="0" max="30"')}
      ${srowS("autoStartChk", T("Inicio automático de series por tiempo"), autoStart(), T("Tras el descanso, la siguiente serie por tiempo empieza sola"))}
    </div>
    <p class="note">${T("Los descansos se usan en los ejercicios sin descanso propio. 0 = sin descanso.")}</p>
    <h2>${T("Esfuerzo")}</h2>
    <div class="lgroup">
      ${srowS("effPem", T("Preguntar el esfuerzo al terminar"), EFF().pem, T("PEM del 1 al 10, opcional en cada sesión"))}
      ${srowS("effRir", T("RIR por serie"), EFF().rir, T("Repeticiones en reserva al marcar cada serie"))}
    </div>
    <h2>${T("Objetivos semanales")}</h2>
    <div class="lgroup">
      ${srowN("gDaily", T("Días con Diaria"), LS.get("wk.goals", {}).daily || 0, 'min="0" max="7"')}
      ${srowN("gStr", T("Días con fuerza"), LS.get("wk.goals", {}).strength || 0, 'min="0" max="7"')}
    </div>
    <p class="note">${T("Se ven en Progreso → Resumen. 0 = no mostrar.")}</p>
    ${catOn() ? `<h2>${T("Progresión")}</h2>
    <div class="lgroup">
      ${srowS("progOn", T("Proponer cambios de paso"), PROG().on, T("Al terminar cada sesión, solo en ejercicios del catálogo"))}
      ${PROG().on ? `<div class="srow"><label class="t" for="progUp">${T("Subir tras (al objetivo)")}</label><select id="progUp">${[2, 3].map(n => `<option value="${n}" ${PROG().up === n ? "selected" : ""}>${T("{n} sesiones", { n })}</option>`).join("")}</select></div>
      <div class="srow"><label class="t" for="progDown">${T("Proponer retroceder")}</label><select id="progDown">${DOWN_OPTS.map(([k, n]) => `<option value="${k}" ${PROG().down === k ? "selected" : ""}>${T(n)}</option>`).join("")}</select></div>` : ""}
      ${(LS.get("wk.progMute", []) || []).length ? `<div class="srow"><span class="t">${T("Volver a proponer en todos ({n} silenciados)", { n: (LS.get("wk.progMute", []) || []).length })}</span><button class="btn small" data-act="prog-unmute">${T("Activar")}</button></div>` : ""}
    </div>
    <h2>${T("Mi material")}</h2>
    <div class="panel"><p class="muted" style="font-size:.85rem;margin:0">${T("Marca lo que tienes. En el catálogo, lo demás se ve en naranja y se puede ocultar. Sin nada marcado, no se filtra.")}</p>
      <div class="matsel">${MAT_SEL().map(([k, [n]]) => `<label><input type="checkbox" data-myeq="${k}" ${myEquip()?.includes(k) ? "checked" : ""}>${matIco(k)}${T(n)}</label>`).join("")}</div></div>` : ""}
    <h2>${T("Catálogo de ejercicios")}</h2>
    <div class="lgroup">
      ${srowS("catChk", T("Usar el catálogo"), catOn(), catOn() ? (CAT ? T("{n} ejercicios con ficha y progresión", { n: CAT.exercises.length }) : T("Cargando…")) : T("Desactivado: solo tus ejercicios"))}
      ${catReady() ? `<div class="srow"><span class="t">${T("Vincular ejercicios")}<small>${T("Une tus nombres con las fichas del catálogo")}</small></span><button class="btn small" data-act="link-open">${T("Abrir")}${(() => { const own = new Set(LS.get("wk.linkOwn", []) || []), c = linkCandidates().filter(x => !own.has(x.k)).length; return c ? ` · ${c}` : ""; })()}</button></div>` : ""}
    </div>
`,
    perfil: `
    ${profSettings()}
    ${curProf().sex === "m" ? "" : `<h2>${T("Ciclo")}</h2>
    ${cycSettings()}`}
    ${aiProfPanel()}
    ${profDataTools()}
`,
    apariencia: `
    <h2>${T("Idioma")}</h2>
    <div class="lgroup"><div class="srow"><label class="t" for="langSel">${T("Idioma de la app")}</label><select id="langSel">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" lang="${k}" ${LANG === k ? "selected" : ""}>${v.name}</option>`).join("")}</select></div></div>
    <h2>${T("Apariencia")}</h2>
    <div class="seg" role="group" aria-label="${T("Tema")}">${THEMES.map(([k, n, d]) => `<button data-theme-set="${k}" class="${curTheme() === k ? "on" : ""}" aria-pressed="${curTheme() === k}">${T(n)}<small>${T(d)}</small></button>`).join("")}</div>
`,
    avisos: `
    <p class="muted" style="margin:0 0 12px">${T("Avisos durante el entreno")}</p>
    <div class="panel"><div class="seg" role="group" aria-label="${T("Avisos durante el entreno")}">${FX.map(([k, n]) => `<button data-fx="${k}" class="${fxMode() === k ? "on" : ""}" aria-pressed="${fxMode() === k}">${T(n)}</button>`).join("")}</div>
      <p class="muted" style="font-size:.85rem;margin:10px 0 0">${fxMode() === "off" ? T("Sin pitidos ni vibración: solo la cuenta atrás y el destello en pantalla.") : fxMode() === "vib" ? T("Útil con auriculares o si entrenas con gente al lado. Si no vibra, revisa No molestar y la vibración del sistema.") : T("El pitido usa el volumen multimedia. Si no vibra, revisa No molestar y la vibración del sistema.")}</p>
      ${fxMode() === "off" ? "" : `<button class="btn small" style="margin-top:10px" data-act="testfx">${T("Probar")}</button>`}</div>
`,
    acerca: `
    <div class="panel">
      <div class="abouth"><b>Usus</b><button class="verb" data-act="news-open">${T("versión")} ${APP_VERSION}${BETA ? " beta" : ""}</button></div>
      <p class="muted" style="font-size:.85rem;margin:2px 0 0">${T("Hecha con IA · probada por humanos.")}</p>
      <details style="margin-top:10px"><summary class="muted" style="font-size:.85rem;cursor:pointer">${T("Licencia MIT y garantías")}</summary>
      <p class="muted" style="font-size:.85rem;margin:6px 0 0">${T("Software libre bajo licencia MIT: puedes usarlo, copiarlo, modificarlo y distribuirlo, también con fines comerciales, manteniendo el aviso de copyright y de licencia.")}</p>
      <p class="muted" style="font-size:.85rem;margin:8px 0 0">${T("Sin garantías. Los autores no responden de lesiones, pérdida de datos ni ningún otro daño derivado de su uso. No sustituye el consejo de un profesional sanitario o deportivo.")}</p><pre class="lic">${esc(MIT)}</pre>${LANG !== "en" ? `<p class="muted" style="font-size:.75rem;margin:6px 0 0">${T("El texto legal válido es el original en inglés.")}</p>` : ""}</details>
      <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn small" data-act="notice-open">${T("Ver el aviso")}</button><button class="btn small" data-act="welcome-show">${T("Repetir la configuración inicial")}</button></div>
    </div>
    ${aboutLinks()}
    ${isNative() ? updatesBlock() : `<h2>${T("Instalar en el móvil")}</h2>
    <div class="panel">${installBlock()}</div>`}
    <h2>${T("Compartir Usus")}</h2>
    <div class="panel">${shareAppBlock()}</div>
    <h2>${T("Apoyar el proyecto")}</h2>
    <div class="panel">${donateBlock()}</div>`,
    datos: `
    <h2>${T("Exportar")}</h2>
    ${multiProf() ? `<p class="muted" style="font-size:.85rem;margin:-4px 0 8px">${T("Solo los datos de {x}. Cada perfil tiene su propia copia.", { x: esc(profName(curProf())) })}</p>` : ""}
    <div class="panel">
      ${item(T("Copia completa"), T("Todo en JSON: rutinas, plan, sesiones, pesos, diario, suplementos y ciclo. Sirve para restaurar."), "exp-all", T("Exportar"), true)}
      ${item(T("Solo rutinas"), T("JSON para compartir o pasar a otro móvil."), "exp-routines", T("Exportar"))}
      ${item(T("Datos en CSV"), T("Todo en tablas (.zip) para analizarlo en una hoja de cálculo."), "cx-open", T("Exportar"))}
    </div>
    <h2>${T("Importar")}</h2>
    <div class="panel">${item(T("Importar JSON"), T("Copia completa o solo rutinas. Se combina con lo existente; los duplicados se actualizan."), "imp", T("Elegir archivo"))}</div>
    <input type="file" id="impFile" accept="application/json,.json" hidden>
    <h2>${T("Zona peligrosa")}</h2>
    <div class="dzone" role="note"><b>⚠ ${T("Borrar todos los datos")}</b>
      <p>${multiProf() ? T("Se borra todo lo de este perfil en este dispositivo: rutinas, sesiones, plan, peso, diario y ciclo. No se puede deshacer.") : T("Se borra todo lo de este dispositivo: rutinas, sesiones, plan, peso, diario y ciclo. No se puede deshacer.")} ${T("Exporta antes una copia.")}</p>
      <button class="btn dangerfill" data-act="wipe">${T("Borrar todos los datos")}</button></div>
`
  };
  const G = SET_GROUPS.find(g => g[0] === cur);
  return `<div class="ssplit${sel ? " hasdet" : ""}"><div class="slist"><div class="phead"><h1>${T("Ajustes")}</h1></div>
    <div class="lgroup">${SET_GROUPS.map(([k, n, ic]) => `<button class="lrow${k === cur ? " cur" : ""}" data-stab="${k}" aria-current="${k === sel}"><span class="lico">${SICO[ic]}</span><span class="t"><b>${T(n)}</b><small>${setSub(k, lastBk)}</small></span><span class="chev" aria-hidden="true">›</span></button>`).join("")}</div>
    <p class="sub" style="margin:12px 4px 0">${TN(state.routines.length, "{n} rutina", "{n} rutinas")} · ${TN(state.sessions.length, "{n} sesión", "{n} sesiones")}</p></div>
    <section class="sdet" aria-labelledby="sdT"><button class="back" data-back="set">‹ ${T("Ajustes")}</button><h2 class="sdh" id="sdT">${T(G[1])}</h2>${P[cur]}</section></div>`;
}
/* Filas de ajustes: número o interruptor a la derecha */
const srowN = (id, l, v, attrs, sub) => `<div class="srow"><label class="t" for="${id}">${l}${sub ? `<small>${sub}</small>` : ""}</label><input id="${id}" type="number" inputmode="numeric" ${attrs} value="${esc(v)}"></div>`;
const srowS = (id, l, on, sub) => `<label class="srow"><span class="t">${l}${sub ? `<small>${sub}</small>` : ""}</span><input type="checkbox" role="switch" id="${id}" ${on ? "checked" : ""}></label>`;
/* Ajustes: grupos, cada uno con su pantalla */
const SET_GROUPS = [["perfil", N_("Perfil"), "user"], ["entreno", N_("Entreno"), "train"], ["avisos", N_("Avisos"), "bell"], ["apariencia", N_("Apariencia e idioma"), "paint"], ["datos", N_("Datos y copias"), "db"], ["acerca", N_("Acerca de"), "info"]];
const SICO = {
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  train: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
  paint: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18"/></svg>',
  db: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>'
};
function setSub(k, lastBk) {
  if (k === "perfil") return multiProf() ? esc(profName(curProf())) : T("Perfiles y datos personales");
  if (k === "entreno") return T("Tiempos, esfuerzo, objetivos y catálogo");
  if (k === "avisos") return T((FX.find(x => x[0] === fxMode()) || FX[0])[1]);
  if (k === "apariencia") return `${T((THEMES.find(x => x[0] === curTheme()) || THEMES[3])[1])} · ${LANGS[LANG]?.name || LANG}`;
  if (k === "datos") return lastBk ? T("última copia {d}", { d: new Date(lastBk).toLocaleDateString(LOC()) }) : T("sin copias todavía");
  return `${T("versión")} ${APP_VERSION}${BETA ? " beta" : ""}`;
}
/* Donaciones: se copian al tocar */
const DONATE = [
  ["btc", "Bitcoin", "bc1pnvdct6hfnh67p7dcg2e5mdveyz8jlxuzv4yflkxqccc72qkuc8ls8raspa"],
  ["ln", "Lightning / zaps", "oluengo@rizful.com"]
];
const DICON = {
  btc: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#F7931A"/><path fill="#fff" d="M22.6 14.1c.3-2.1-1.3-3.2-3.5-4l.7-2.8-1.7-.4-.7 2.7-1.4-.3.7-2.7-1.7-.4-.7 2.8-1.1-.3-2.4-.6-.5 1.8s1.3.3 1.2.3c.7.2.8.6.8 1l-.8 3.2.2.1-.2-.1-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.6 1.2.3-.7 2.8 1.7.4.7-2.8 1.4.4-.7 2.8 1.7.4.7-2.8c2.9.6 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.2-2.5zm-3.8 5.4c-.5 2.1-4.1 1-5.2.7l.9-3.7c1.2.3 4.9.9 4.3 3zm.5-5.4c-.5 1.9-3.5.9-4.4.7l.8-3.3c1 .2 4.1.7 3.6 2.6z"/></svg>',
  ln: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#7B3FE4"/><path fill="#FFD43B" d="M18.2 5 9.5 18h5.6l-1.5 9 8.9-13.2h-5.7z"/></svg>'
};
const shortAddr = a => a.length > 24 ? `${a.slice(0, 12)}…${a.slice(-8)}` : a;
function donateBlock() {
  return `<p class="muted" style="font-size:.85rem;margin:0 0 6px">${T("Si te resulta útil, puedes apoyar el proyecto. Toca para copiar:")}</p>
    ${DONATE.map(([k, n, a]) => `<button class="donb" data-copy="${esc(a)}" aria-label="${T("Copiar dirección {x}", { x: n })}"><i class="dico">${DICON[k]}</i><span><b>${T(n)}</b><span class="mono">${esc(shortAddr(a))}</span></span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>`).join("")}`;
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {}
  try { const ta = Object.assign(document.createElement("textarea"), { value: t }); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch { return false; }
}
/* Instalación como app (PWA) */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (!LS.get("wk.welcomed", false) || state.tab === "data") render(); });
window.addEventListener("appinstalled", () => { installEvt = null; toast(T("App instalada")); render(); });
const isNative = () => !!window.Capacitor?.isNativePlatform?.();
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const SIGN_FP = "28:B6:FF:4A:8F:61:F6:88:D4:B4:9D:C7:E8:B7:2D:95:D5:D9:44:45:D2:A2:30:07:1A:FA:72:B1:B2:D0:3E:C8";
function updatesBlock() {
  return `<h2>${T("Actualizaciones")}</h2>
    <div class="panel"><div class="row" style="justify-content:space-between;align-items:baseline"><b style="font-size:1.05rem">Usus ${APP_VERSION}${BETA ? " beta" : ""}</b><span class="badge-ok">${T("App Android")}</span></div>
      <p class="muted" style="font-size:.85rem;margin:6px 0 0">${T("Esta app no se conecta a Internet, así que no busca versiones nuevas por su cuenta. Se publican en GitHub; al instalar una nueva encima, tus datos se mantienen.")}</p>
      <div class="row" style="margin-top:12px;flex-wrap:wrap"><a class="btn small primary" href="${REL_URL}" target="_blank" rel="noopener">${T("Ver versiones")} ↗</a><button class="btn small" data-act="news-open">${T("Novedades de la {v}", { v: APP_VERSION })}</button></div></div>
    <div class="panel" style="margin-top:10px"><b>${T("Avisos automáticos con Obtainium")}</b>
      <p class="muted" style="font-size:.85rem;margin:4px 0 0">${T("App gratuita que vigila GitHub y te avisa o instala cada versión nueva. Es opcional.")}</p>
      <ol class="muted" style="font-size:.85rem;margin:8px 0 0;padding-left:20px"><li>${T("Instala Obtainium.")}</li><li>${T("«Añadir app» y pega el enlace:")} <code>github.com/oluengo/usus</code></li></ol>
      <div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn small" data-copy="https://github.com/oluengo/usus">${T("Copiar enlace")}</button><a class="btn small" href="https://github.com/ImranR98/Obtainium" target="_blank" rel="noopener">Obtainium ↗</a></div>
      <details style="margin-top:10px"><summary class="muted" style="font-size:.85rem;cursor:pointer">${T("Comprobar que el APK es original")}</summary><p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Huella SHA-256 del certificado de firma:")}<br><code style="word-break:break-all">${SIGN_FP}</code></p></details></div>`;
}
function installBlock() {
  if (isStandalone()) return `<p class="muted" style="font-size:.85rem;margin:0">${T("Ya la estás usando como app instalada.")}</p>`;
  return `<p class="muted" style="font-size:.85rem;margin:0">${T("Usus es una app web (PWA): se instala desde el navegador, sin tienda, y funciona sin conexión.")}</p>
    ${installEvt ? `<button class="btn primary small" style="margin-top:10px" data-act="install">${T("Instalar ahora")}</button>` : ""}
    <ul class="muted" style="padding-left:18px;margin:8px 0 0;line-height:1.5;font-size:.85rem">
      ${isIOS() ? `<li>${T("iPhone / iPad (Safari): botón Compartir → «Añadir a pantalla de inicio».")}</li><li>${T("Android (Chrome): menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».")}</li>`
        : `<li>${T("Android (Chrome): menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».")}</li><li>${T("iPhone / iPad (Safari): botón Compartir → «Añadir a pantalla de inicio».")}</li>`}
      <li>${T("Android, como app (APK):")} <a href="${REL_URL}" target="_blank" rel="noopener">GitHub → Releases</a>. ${T("Sus datos van aparte de los de la PWA.")}</li>
    </ul>`;
}
