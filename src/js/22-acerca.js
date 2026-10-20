/* ---------- Acerca de: código y avisos en GitHub (enlaces que abre la persona; la app no se conecta sola) ---------- */
const REPO = "https://github.com/oluengo/usus";
const AICO = {
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
  bug: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="8" width="10" height="12" rx="5"/><path d="M9 8a3 3 0 0 1 6 0M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 19l3-2M20 19l-3-2"/></svg>',
  idea: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  hist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>'
};
function techInfo() {
  const ua = navigator.userAgent;
  const os = (/Android [\d.]+/.exec(ua) || [])[0] || ((/(?:iPhone|iPad).*? OS ([\d_]+)/.exec(ua) || [])[1] ? "iOS " + /(?:iPhone|iPad).*? OS ([\d_]+)/.exec(ua)[1].replace(/_/g, ".") : "")
    || ((/Windows NT [\d.]+|Mac OS X [\d_]+|CrOS|Linux/.exec(ua) || [""])[0]).replace(/_/g, ".");
  const m = /(Edg|SamsungBrowser|Firefox|FxiOS|CriOS|Chrome|Version)\/(\d+)/.exec(ua) || [];
  const br = m[1] ? ({ Edg: "Edge", CriOS: "Chrome", FxiOS: "Firefox", Version: "Safari" }[m[1]] || m[1]) + " " + m[2] : "?";
  return `Usus ${APP_VERSION}${BETA ? " beta" : ""} · ${isNative() ? "APK" : isStandalone() ? "PWA" : "web"}\n${os || "?"} · ${br}\n${LANG} · ${curTheme()}`;
}
function aboutLinks() {
  const it = (act, ico, t, d, end) => `<button class="aitem" data-act="${act}"><span class="aico">${AICO[ico]}</span><span style="flex:1;min-width:0"><b>${t}</b><small>${d}</small></span><span class="muted">${end}</span></button>`;
  return `<div class="alist">${it("about-repo", "code", T("Código fuente"), "github.com/oluengo/usus", "↗")}${it("about-bug", "bug", T("Informar de un problema"), T("Algo no funciona como debería"), "↗")}${it("about-idea", "idea", T("Proponer una mejora"), T("Ideas y peticiones"), "↗")}${it("news-open", "hist", T("Historial de cambios"), T("Qué trae cada versión"), "›")}</div>`;
}
function issueModal() {
  const k = state.issue; if (!k) return "";
  const bug = k === "bug";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="isT"><div class="mbox">
    <h2 id="isT" style="margin:0 0 4px">${bug ? T("Informar de un problema") : T("Proponer una mejora")}</h2>
    <p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("Se abrirá GitHub con el formulario preparado.")}</p>
    <ul class="ainfo"><li>${T("Necesitas una cuenta de GitHub (gratis).")}</li><li>${T("No se envía nada hasta que tú lo revises y lo publiques en GitHub.")}</li><li>${T("Nunca incluye tus rutinas, sesiones ni registros.")}</li></ul>
    ${bug ? `<label class="shopt"><span>${T("Incluir datos técnicos")}</span><input type="checkbox" role="switch" id="isTech" ${state.issueTech !== false ? "checked" : ""}></label>${state.issueTech !== false ? `<pre class="shtxt" style="margin-top:8px">${esc(techInfo())}</pre>` : ""}` : ""}
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="issue-close">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="issue-go">${T("Abrir GitHub")} ↗</button></div>
  </div></div>`;
}
function issueURL(kind) {
  const bug = kind === "bug";
  const body = bug ? `**${T("Qué ha pasado")}**\n\n\n**${T("Pasos para reproducirlo")}**\n1. \n\n**${T("Qué esperabas")}**\n\n${state.issueTech !== false ? "\n---\n" + techInfo() : ""}`
    : `**${T("Qué te gustaría")}**\n\n\n**${T("Para qué lo usarías")}**\n\n\n---\nUsus ${APP_VERSION}`;
  return `${REPO}/issues/new?labels=${bug ? "bug" : "enhancement"}&body=${encodeURIComponent(body)}`;
}
const openExt = url => { const w = window.open(url, "_blank", "noopener"); if (!w) location.href = url; };
const stamp = () => new Date().toISOString().slice(0, 10);
async function deliver(filename, text, mime) {
  const file = new File([text], filename, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return true; }
    catch (e) { if (e.name === "AbortError") return false; }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
const csvCell = v => { const s = String(v ?? ""); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const fmtCsv = v => LANG === "en" ? String(+v || 0) : String(+v || 0).replace(".", ",");
function sessionsCSV() {
  const rows = [T("fecha,hora,rutina,duracion_min,ejercicio,tipo,serie,kg,reps,reps_der,segundos,volumen_kg,1rm_est").split(",")];
  [...state.sessions].sort((a, b) => a.start - b.start).forEach(s => {
    const d = new Date(s.start), dur = Math.round((s.end - s.start) / 60000);
    s.exercises.forEach(e => e.sets.forEach((x, i) => { const tm = isTime(e), sd = sideReps(e), n = (+x.r || 0) + (sd ? (+R2(x) || 0) : 0); rows.push([
      d.toLocaleDateString("sv-SE"), d.toTimeString().slice(0, 5), s.routine || T("Libre"), dur, e.name, tm ? T("tiempo") : T("reps"), i + 1,
      fmtCsv(x.w), tm ? "" : x.r, sd ? R2(x) : "", tm ? x.r : "",
      tm ? "" : fmtCsv((+x.w || 0) * n), tm ? "" : fmtCsv(Math.round(e1rm(x.w, x.r) * 10) / 10)
    ]); }));
  });
  const sep = LANG === "en" ? "," : ";";
  return "\ufeff" + rows.map(r => r.map(c => { const v = csvCell(c); return sep === "," && /,/.test(v) && !/^"/.test(v) ? `"${v}"` : v; }).join(sep)).join("\n");
}
function validRoutine(r) { return r && typeof r.name === "string" && Array.isArray(r.exercises); }
function validSession(s) { return s && typeof s.start === "number" && Array.isArray(s.exercises); }
