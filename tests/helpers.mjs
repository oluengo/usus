// Ayudas comunes de las pruebas
import { readFileSync } from "node:fs";
export const VERSION = /const APP_VERSION = "([\d.]+)"/.exec(readFileSync("index.html", "utf8"))[1];

/* Abre la app con datos de partida en localStorage (solo la primera carga de la pestaña).
   opts: { data: {clave: valor}, lang, catalog, clock: Date, errors: [] } */
export async function openApp(page, opts = {}) {
  const errors = opts.errors || [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("dialog", d => d.accept());
  const data = { "wk.welcomed": true, "wk.seenVersion": VERSION, "wk.catalog": opts.catalog ?? false, ...(opts.lang ? { "wk.lang": opts.lang } : {}), ...(opts.data || {}) };
  await page.addInitScript(d => { if (!sessionStorage.__seed) { sessionStorage.__seed = 1; for (const k in d) localStorage.setItem(k, JSON.stringify(d[k])); } }, data);
  if (opts.clock) await page.clock.install({ time: opts.clock });
  await page.goto(opts.path || "./");
  if (opts.clock) await page.clock.runFor(800); else await page.waitForTimeout(400);
  return errors;
}
export const nav = (page, tab) => page.locator(`nav [data-tab="${tab}"]`).click();
export const ls = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);

/* Datos de ejemplo (inventados) */
export const ROUTINES = [
  { id: "r1", name: "B · Empuje", block: "empuje", variant: "", days: [0, 1, 2, 3, 4, 5, 6],
    secs: [{ id: "s1", name: "Calentamiento" }, { id: "s2", name: "Principal" }, { id: "s3", name: "Core" }],
    groups: { g1: { kind: "sup", rounds: 2, rest: 6, restAfter: 4 } },
    exercises: [
      { name: "Círculos de brazos", sec: "s1", sets: 1, reps: 3, type: "time", restAfter: 0 },
      { name: "Fondos", sec: "s2", sets: 2, reps: 8, type: "reps", rest: 3, restAfter: 3 },
      { name: "Flexión en pica", sec: "s2", grp: "g1", sets: 2, reps: 8, type: "reps" },
      { name: "Flexión diamante", sec: "s2", grp: "g1", sets: 2, reps: 10, type: "reps" },
      { name: "Plancha", sec: "s3", sets: 2, reps: 4, type: "time", rest: 3 }] },
  { id: "r2", name: "Circuito core", block: "core", variant: "", days: [0, 1, 2, 3, 4, 5, 6],
    groups: { g2: { kind: "cir", rounds: 2, rest: 5 } },
    exercises: [{ name: "Plancha", grp: "g2", sets: 2, reps: 3, type: "time", rest: 2 }, { name: "Hollow hold", grp: "g2", sets: 2, reps: 3, type: "time" }] },
  { id: "r3", name: "Core lateral", block: "core", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [
    { name: "Plancha lateral", sets: 2, reps: 4, type: "time", sides: true, rest: 3, restAfter: 4 },
    { name: "Plancha", sets: 2, reps: 5, type: "time", rest: 3, restAfter: 4 },
    { name: "Flexiones", sets: 2, reps: 8, type: "reps", rest: 3 }] }
];
export const TIMERS = { "wk.prep": 2, "wk.warn": 1, "wk.switch": 2, "wk.fx": "off", "wk.effort": { pem: false, rir: false } };
/* Qué se ve: título y fase de la cuenta atrás, o el ejercicio en pantalla */
export const phase = page => page.evaluate(() => { const f = document.querySelector(".focus"); return f ? f.querySelector(".fx").textContent + " / " + f.querySelector(".fph").textContent : "vista: " + (document.querySelector(".ex .ex-head strong")?.textContent || "—"); });
export const done = page => page.evaluate(() => JSON.parse(localStorage.getItem("wk.active")).exercises.map(e => e.sets.map(s => (s.done ? 1 : 0)).join("")).join(" "));
