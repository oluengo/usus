// Varios planes: duplicar, crear, activar y borrar
import { test, expect } from "@playwright/test";
import { openApp, ls, nav } from "./helpers.mjs";
const R = [{ id: "ra", name: "A · Fuerza", block: "empuje", variant: "A", days: [1, 3], exercises: [{ name: "Flexión", sets: 3, reps: 10, type: "reps" }] },
  { id: "rb", name: "B · Fuerza", block: "empuje", variant: "B", days: [1, 3], exercises: [{ name: "Fondos", sets: 3, reps: 8, type: "reps" }] }];
const PLAN = { enabled: true, name: "Bloque 1", start: "2026-10-05", review: "", phases: [{ id: "x1", variant: "A", weeks: 2 }, { id: "x2", variant: "B", weeks: 2 }], deload: { weeks: 1, every: 8 }, up: true };
test("duplicar, nuevo, activar y borrar", async ({ page }) => {
  const errors = await openApp(page, { clock: new Date("2026-10-16T09:00:00"), data: { "wk.routines": R, "wk.plan": PLAN } });
  await nav(page, "routines"); await page.locator('[data-rview="plan"]').click();
  await page.locator("details[data-plans] summary").click();
  await page.locator('[data-act="plan-dup"]').click();
  expect((await ls(page, "wk.plans")).map(p => p.name)).toEqual(["Copia de Bloque 1"]);
  await page.locator('[data-act="plan-new"]').click(); await page.fill("#pName", "Bloque 2"); await page.locator('[data-act="plan-save"]').click();
  expect((await ls(page, "wk.plan")).name).toBe("Bloque 2");
  expect((await ls(page, "wk.plans")).map(p => p.name)).toEqual(["Bloque 1", "Copia de Bloque 1"]);
  if (!(await page.locator("details[data-plans][open]").count())) await page.locator("details[data-plans] summary").click();
  const last = (await ls(page, "wk.plans")).at(-1).id; await page.locator(`[data-pact="${last}"]`).click();
  expect((await ls(page, "wk.plan")).name).toBe("Copia de Bloque 1");
  const first = (await ls(page, "wk.plans"))[0].id; await page.locator(`[data-pdel="${first}"]`).click();
  expect((await ls(page, "wk.plans")).map(p => p.name)).toEqual(["Bloque 1"]);
  expect(errors).toEqual([]);
});
test("plan recibido: conserva su regla de subida y el activo pasa a Mis planes", async ({ page }) => {
  const errors = await openApp(page, { clock: new Date("2026-10-16T09:00:00"), data: { "wk.routines": R, "wk.plan": PLAN } });
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  const shared = { app: "usus", shared: 1, routines: [{ name: "C · Fuerza", variant: "C", days: [2], exercises: [{ name: "Remo", sets: 3, reps: 10, type: "reps" }] }],
    plan: { phases: [{ variant: "A", weeks: 2 }, { variant: "C", weeks: 2 }], deload: { weeks: 1, every: 6 }, up: true, upRule: "reps1" } };
  await page.setInputFiles("#impFile", { name: "plan.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(shared)) });
  await expect(page.locator('[data-act="in-yes"]')).toBeVisible();
  await page.locator('[data-act="in-yes"]').click();
  expect((await ls(page, "wk.plan")).upRule).toBe("reps1");
  expect((await ls(page, "wk.plans")).map(p => p.name)).toEqual(["Bloque 1"]);
  expect(errors).toEqual([]);
});
test("rutinas y días desde el plan", async ({ page }) => {
  const errors = await openApp(page, { clock: new Date("2026-10-16T09:00:00"), data: { "wk.routines": [...R, { id: "rd", name: "Diaria", block: "core", variant: "", days: [], exercises: [{ name: "Plancha", sets: 1, reps: 30, type: "time" }] }] } });
  await nav(page, "routines"); await page.locator('[data-rview="plan"]').click(); await page.locator('[data-act="plan-create"]').click();
  await page.locator('select[data-padd=""]').selectOption("rd");
  for (const d of [1, 2, 3, 4, 5]) await page.locator(`[data-prd="rd:${d}"]`).click();
  await page.locator('[data-prd="ra:3"]').click(); await page.locator('[data-prd="ra:5"]').click();   // A: lunes y viernes (quita miércoles, añade viernes)
  await page.locator('[data-prx="rb"]').click();                                                     // B fuera del plan
  await page.locator('[data-act="plan-save"]').click();
  const rs = Object.fromEntries((await ls(page, "wk.routines")).map(r => [r.id, r]));
  expect([rs.rd.variant, rs.rd.days]).toEqual(["", [1, 2, 3, 4, 5]]);
  expect([rs.ra.variant, rs.ra.days]).toEqual(["A", [1, 5]]);
  expect([rs.rb.variant, rs.rb.days]).toEqual(["", []]);
  expect((await ls(page, "wk.plan")).rmap).toBeUndefined();
  expect(errors).toEqual([]);
});
test("aplazar una sesión, descarga esta semana y pausa", async ({ page }) => {
  const D = { id: "rd", name: "Diaria", block: "core", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [{ name: "Plancha", sets: 1, reps: 30, type: "time" }] };
  const errors = await openApp(page, { clock: new Date("2026-10-19T09:00:00"), data: { "wk.routines": [...R, D], "wk.plan": PLAN } });   // lunes, semana 3 = B
  const today = () => page.locator(".today > .sugr, .today > p").allInnerTexts().then(l => l.join(" | "));   // lo de hoy (sin «Pendientes esta semana»)
  expect(await today()).toContain("B · Fuerza");
  await page.locator('[data-act="pl-postpone"]').click();
  expect(await today()).not.toContain("B · Fuerza"); expect(await today()).toContain("Diaria");
  await page.clock.fastForward("24:00:00"); await page.locator('nav [data-tab="routines"]').click(); await page.locator('nav [data-tab="train"]').click();
  expect(await today()).toContain("B · Fuerza");                                   // martes: lo del lunes
  await page.locator('[data-act="pl-deload"]').click();                            // descarga esta semana (confirm aceptado)
  expect(await today()).toContain("descarga"); expect(await today()).not.toContain("B · Fuerza");
  const ws = await page.evaluate(() => JSON.parse(localStorage.getItem("wk.plan")).pauses);
  expect(ws).toEqual([{ from: "2026-10-19", weeks: 1, kind: "deload" }]);
  await page.locator('nav [data-tab="routines"]').click(); await page.locator('[data-rview="plan"]').click();
  await page.locator("details[data-pauses] summary").click(); await page.selectOption("#pzW", "2"); await page.selectOption("#pzF", "1"); await page.locator('[data-act="pl-pause"]').click();
  const labels = await page.locator(".pwk b").allInnerTexts();
  expect(labels.slice(0, 7)).toEqual(["S1 · A", "S2 · A", "S3 · Desc.", "S4 · Pausa", "S5 · Pausa", "S6 · B", "S7 · B"]);   // B se corre 3 semanas
  expect(errors).toEqual([]);
});
test("en orden: empezar un domingo y recuperar", async ({ page }) => {
  const R4 = ["Lunes", "Martes", "Miércoles", "Jueves"].map((n, i) => ({ id: "r" + i, name: "A · " + n, block: "empuje", variant: "A", days: [i + 1], exercises: [{ name: "Flexión", sets: 3, reps: 10, type: "reps" }] }));
  const P = { enabled: true, order: true, name: "Orden", start: "2026-10-18", review: "", phases: [{ id: "x1", variant: "A", weeks: 1 }, { id: "x2", variant: "B", weeks: 1 }], deload: { weeks: 0, every: 0 }, up: false };
  const ses = n => ({ id: "s" + n, start: Date.parse(`2026-10-${18 + n}T08:00:00`), end: Date.parse(`2026-10-${18 + n}T08:30:00`), routine: "A · " + ["Lunes", "Martes", "Miércoles", "Jueves"][n], exercises: [] });
  const errors = await openApp(page, { clock: new Date("2026-10-18T09:00:00"), data: { "wk.routines": R4, "wk.plan": P } });   // domingo
  const next = () => page.locator(".today .sugr.pri .sn").innerText();
  expect(await next()).toContain("A · Lunes");
  expect(errors).toEqual([]);
  // hechas Lunes (dom) y Martes (lun); el martes no entrena; el miércoles toca «Miércoles»
  const p2 = await page.context().newPage(); const e2 = await openApp(p2, { clock: new Date("2026-10-21T09:00:00"), data: { "wk.routines": R4, "wk.plan": P, "wk.sessions": [ses(0), ses(1)] } });
  expect(await p2.locator(".today .sugr.pri .sn").innerText()).toContain("A · Miércoles");
  await expect(p2.locator(".today")).toContainText("(2/4)");
  expect(e2).toEqual([]);
});
