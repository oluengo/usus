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
