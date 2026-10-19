// Imprimible: por ejercicio (1 o 2 por hoja, con o sin calentamiento) y hoja de semanas
import { test, expect } from "@playwright/test";
import { openApp, nav, ROUTINES } from "./helpers.mjs";
test("número de hojas", async ({ page }) => {
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES } });
  await nav(page, "routines"); await page.locator('[data-ropen="r1"]').click(); await page.locator('[data-rprint="r1"]:visible').click();
  await expect(page.locator(".page")).toHaveCount(4);
  await page.locator('[data-popt="two"]').check(); await expect(page.locator(".page")).toHaveCount(2);
  await page.locator('[data-popt="cal"]').check(); await expect(page.locator(".page")).toHaveCount(3);
  await page.locator('[data-pmode="sem"]').click(); await expect(page.locator(".page")).toHaveCount(1);
  await page.locator('[data-act="print-close"]').click(); await expect(page.locator(".rrow")).toHaveCount(3);
  expect(errors).toEqual([]);
});
