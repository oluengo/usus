// Plan guiado: preguntas, propuesta con el catálogo, crear rutinas A/B y un plan en orden; fichas desde las rutinas
import { test, expect } from "@playwright/test";
import { openApp, nav, ls } from "./helpers.mjs";
test("plan guiado: test de nivel, molestia, ajustar y crear", async ({ page }) => {
  const errors = await openApp(page, { catalog: true, data: { "wk.equip": ["barra", "caja"] } });
  await nav(page, "routines"); await page.locator('[data-rview="plan"]').click();
  await page.locator('[data-act="gp-open"]').first().click();
  const nx = () => page.locator('[data-act="gp-next"]').click();
  await nx(); await expect(page.locator('[data-act="gp-next"]')).toBeDisabled();
  await page.locator('[data-gpgoal="fuerza"]').click(); await nx();
  await page.locator('[data-gpdays="4"]').click(); await nx(); await nx();
  await page.locator('[data-gppain="hombro"]').click(); await nx();
  for (const [k, v] of [["push", "12"], ["pull", "3"], ["squat", "30"], ["plank", "50"]]) await page.fill(`[data-gptest="${k}"]`, v);
  await nx();
  await expect(page.locator('[data-gptab]')).toHaveCount(4);
  await expect(page.locator(".gpex").first()).toBeVisible();
  // ficha desde la propuesta, y volver
  await page.locator(".gpex .xl").first().click(); await expect(page.locator("#xiT")).toBeVisible();
  await page.locator('[data-act="xi-close"]').first().click();
  await page.locator('[data-gptab="1"]').click(); await page.locator('[data-gpmv$=":next"]:not([disabled])').first().click();
  await page.locator('[data-act="gp-create"]').click();
  const R = await ls(page, "wk.routines"), P = await ls(page, "wk.plan");
  expect(R).toHaveLength(8);
  expect(R.filter(r => r.variant === "A")).toHaveLength(4);
  expect(R.every(r => r.exercises.every(e => e.xid && e.sec))).toBe(true);
  expect(P.order).toBe(true); expect(P.phases.map(x => x.variant)).toEqual(["A", "B"]);
  expect(errors).toEqual([]);
});
test("ficha desde una rutina; con el catálogo desactivado, pide activarlo", async ({ page }) => {
  const R = [{ id: "r1", name: "Empuje", block: "empuje", variant: "", days: [1], exercises: [{ name: "Flexión", xid: "flexion", sets: 3, reps: 10, type: "reps" }] }];
  const errors = await openApp(page, { catalog: false, data: { "wk.routines": R } });
  await nav(page, "routines"); await page.locator('[data-ropen="r1"], [data-rdet="r1"]').first().click();
  await page.locator('.rex .xl').first().click();   // el diálogo de confirmación se acepta solo (helpers)
  await expect(page.locator("#xiT")).toHaveText("Flexión");
  expect(await ls(page, "wk.catalog")).toBe(true);
  expect(errors).toEqual([]);
});
