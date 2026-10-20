const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtKg = n => (Math.round(n * 10) / 10).toLocaleString(LOC());
const fmtVol = n => n >= 10000 ? (n / 1000).toLocaleString(LOC(), {maximumFractionDigits: 1}) + " t" : Math.round(n).toLocaleString(LOC()) + " kg";
/* ---------- Idiomas ----------
   Para añadir un idioma: 1) añade su código a LANGS; 2) crea i18n/<código>.po (en Weblate o copiando ca.po) y tradúcelo;
   3) node scripts/i18n.mjs build. Lo que falte se muestra en castellano. */
const LANGS = { es: { name: "Castellano", locale: "es-ES" }, ca: { name: "Català", locale: "ca-ES" }, en: { name: "English", locale: "en-GB" } };
let LANG = "es", MESES = [], DIAS = [];
const LOC = () => LANGS[LANG]?.locale || LANG;
/* Textos: el castellano es el original (msgid); las traducciones vienen de i18n/*.po (Weblate) y se generan en I18N.
   T(texto, {n}) traduce; TN(n, singular, plural, {…}) elige la forma según el número; N_(texto) solo marca un texto
   para traducirlo más tarde con T(variable). */
const fill = (r, p) => (p ? r.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? "") : r);
function T(key, p) { return fill((LANG !== "es" && I18N[LANG] && I18N[LANG][key]) || key, p); }
function TN(n, one, other, p = {}) {
  const tr = LANG !== "es" && I18N[LANG]?.[one + "\u0004" + other], form = new Intl.PluralRules(LOC()).select(n) === "one" ? 0 : 1;
  return fill(tr ? tr[Math.min(form, tr.length - 1)] : form ? other : one, { n, ...p });
}
const N_ = s => s;
function detectLang() {
  const saved = LS.get("wk.lang", null); if (saved && LANGS[saved]) return saved;
  for (const l of navigator.languages || [navigator.language || ""]) { const c = String(l).toLowerCase().split("-")[0]; if (LANGS[c]) return c; }
  return "es";
}
function setLang(l) {
  LANG = LANGS[l] ? l : "es";
  document.documentElement.lang = LANG;
  document.querySelector("nav.tabs")?.setAttribute("aria-label", T("Secciones"));
  MESES = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(LOC(), { month: "short" }).format(new Date(2026, i, 1)).replace(".", ""));
  DIAS = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(LOC(), { weekday: "long" }).format(new Date(2026, 0, 4 + i)));  // 4 ene 2026 = domingo
}
const fmtNum = (v, d = 1) => (+v).toLocaleString(LOC(), { minimumFractionDigits: d, maximumFractionDigits: d });
const e1rm = (w, r) => r > 0 ? w * (1 + r / 30) : 0;
const isTime = e => e?.type === "time";
const fmtSec = n => { n = Math.round(+n || 0); return n >= 60 ? `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")} min` : `${n} s`; };
const R2 = x => x.r2 ?? x.r;   // reps del lado derecho (si falta, igual que el izquierdo)
const sideReps = e => !!e?.sides && !isTime(e);
const fmtSet = (x, time, sides) => time ? (+x.w ? `${fmtKg(x.w)} kg · ${fmtSec(x.r)}` : fmtSec(x.r))
  : (+x.w ? `${fmtKg(x.w)}×` : "") + (sides ? `${x.r}/${R2(x)}` : `${x.r}`);

/* ---------- Almacenamiento: db del artefacto o localStorage ---------- */
/* Versión de pruebas: la web en …/beta/ (datos aparte, ver <head>) o el APK «Usus Beta» (otra app, datos aparte) */
const BETA = !!(window.USUS_WEB_BETA || window.USUS_BETA);
const REL_URL = BETA ? "https://github.com/oluengo/usus/releases/tag/usus-beta" : "https://github.com/oluengo/usus/releases/latest";
/* Claves de localStorage de esta versión (en la beta web, sin el prefijo; en la principal, sin las de la beta) */
const lsKeys = () => { try { const k = Object.keys(localStorage); return window.USUS_WEB_BETA ? k.filter(x => x.startsWith("beta:")).map(x => x.slice(5)) : k.filter(x => !x.startsWith("beta:")); } catch { return []; } };
if (BETA) { document.documentElement.classList.add("beta"); document.title = "Usus Beta"; const bt = document.getElementById("betaTag"); if (bt) bt.hidden = false; }
/* Perfiles: el primero ("main") usa las claves de siempre (wk.*); los demás, wk.<id>.*. No renombrar nunca las claves. */
const GLOBAL_KEYS = new Set(["wk.profiles", "wk.profile", "wk.welcomed", "wk.seenVersion", "wk.apkTip"]);
const rawGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const PROFS = () => { const l = rawGet("wk.profiles", null); return Array.isArray(l) && l.length ? l : [{ id: "main" }]; };
const PROF = (() => { const id = rawGet("wk.profile", "main"), l = PROFS(); return l.some(p => p.id === id) ? id : l[0].id; })();
const PK = (k, id = PROF) => id === "main" || GLOBAL_KEYS.has(k) ? k : k.replace(/^wk\./, `wk.${id}.`);
const LS = {
  get(k, d) { return rawGet(PK(k), d); },
  set(k, v) { try { localStorage.setItem(PK(k), JSON.stringify(v)); } catch { toast(T("No se pudo guardar: almacenamiento lleno")); } }
};
const store = {
  async init() { try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch {} },
  async load() { return { routines: LS.get("wk.routines", []), sessions: LS.get("wk.sessions", []) }; },
  async saveRoutines(items) { LS.set("wk.routines", items); },
  async saveSession() { LS.set("wk.sessions", state.sessions); },
  async deleteSession() { LS.set("wk.sessions", state.sessions); },
  saveAll() { LS.set("wk.routines", state.routines); LS.set("wk.sessions", state.sessions); }
};

/* ---------- Estado ---------- */
const state = {
  tab: "train", routines: [], sessions: [], setTab: null,
  active: LS.get("wk.active", null),   // sesión en curso (se guarda localmente como borrador)
  editing: null,                        // rutina en edición
  statEx: null
};
const saveActive = () => LS.set("wk.active", state.active);

let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }

/* ---------- Utilidades de datos ---------- */
const sessionVolume = s => s.exercises.filter(e => !isTime(e)).reduce((a, e) => a + e.sets.filter(x => x.done).reduce((b, x) => b + (+x.w || 0) * (+x.r || 0), 0), 0);
/* Trabajo de una sesión: reps (ejercicios de reps), segundos (de tiempo) y kg de lastre×reps */
const sessionWork = s => s.exercises.reduce((a, e) => { e.sets.filter(x => x.done).forEach(x => { if (isTime(e)) a.secs += +x.r || 0; else { const n = (+x.r || 0) + (sideReps(e) ? (+R2(x) || 0) : 0); a.reps += n; a.kg += (+x.w || 0) * n; } }); return a; }, { reps: 0, secs: 0, kg: 0 });
const fmtDur = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} h` : `${m} min`; };
const fmtWork = w => [`${w.reps} reps`, w.secs ? fmtSec(w.secs) + " " + T("isométricos") : "", w.kg ? fmtVol(w.kg) : ""].filter(Boolean).join(" · ");
const doneSets = s => s.exercises.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
const sortedSessions = () => [...state.sessions].sort((a, b) => b.start - a.start);
function lastSetsFor(ref) {
  const key = typeof ref === "string" ? ref.trim().toLowerCase() : exKey(ref);
  for (const s of sortedSessions()) {
    const e = s.exercises.find(x => exKey(x) === key);
    if (e) { const d = e.sets.filter(x => x.done); if (d.length) return d; }
  }
  return null;
}
const APP_VERSION = "3.1.0";
const THEMES = [["protector", "Protector", "Oscuro cálido, sin azul"], ["dark", "Oscuro", "Neutro"], ["light", "Claro", "Para el día"], ["auto", "Automático", "Sigue al sistema"]];
const curTheme = () => document.documentElement.dataset.theme || "auto";
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  const m = document.getElementById("themeColor"); if (m && bg) m.setAttribute("content", bg);
}
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (curTheme() === "auto") applyTheme("auto"); }); } catch {}
function timeNames() {
  const set = new Set();
  [...state.routines, ...state.sessions].forEach(x => x.exercises.forEach(e => { if (e.type === "time") set.add(e.name.trim().toLowerCase()); }));
  return set;
}
function typeFor(name) { return timeNames().has(name.trim().toLowerCase()) ? "time" : "reps"; }
/* Corrige rutinas y sesión en curso creadas sin tipo (versiones antiguas) */
function migrateTypes() {
  const tn = timeNames(); let chR = false, chA = false;
  state.routines.forEach(r => r.exercises.forEach(e => { if (!e.type) { e.type = tn.has(e.name.trim().toLowerCase()) ? "time" : "reps"; chR = true; } }));
  const sideName = e => SIDE_RX.test(e.name);
  state.routines.forEach(r => r.exercises.forEach(e => { if (e.sides === undefined) { e.sides = sideName(e); chR = true; } }));
  state.active?.exercises?.forEach(e => { if (e.sides === undefined) { e.sides = sideName(e); chA = true; } });
  state.active?.exercises?.forEach(e => { if (!e.type) { e.type = tn.has(e.name.trim().toLowerCase()) ? "time" : "reps"; chA = true; } });
  state.routines.forEach(r => { if (!r.block) { r.block = guessBlock(r.name); chR = true; } });
  state.routines.forEach(r => {
    if (r.variant === undefined) { r.variant = guessVariant(r.name); chR = true; }
    if (!Array.isArray(r.days)) { const g = guessDays(r.name); r.days = g.length ? g : r.block === "diaria" ? [0, 1, 2, 3, 4, 5, 6] : []; chR = true; }
  });
  if (chR) LS.set("wk.routines", state.routines);
  // Objetivos semanales: quien ya tenía una rutina Diaria conserva los de antes (7 y 4)
  if (LS.get("wk.goals", null) === null && state.routines.length) LS.set("wk.goals", state.routines.some(r => r.block === "diaria") ? { daily: 7, strength: 4 } : { daily: 0, strength: 0 });
  if (chA) saveActive();
}
const SIDE_RX = /por lado|per costat|per side|each side/i;
