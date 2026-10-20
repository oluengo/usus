// Editor de rutinas: secciones, superseries, mover y guardar; catálogo y arrastre en PC
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
test("secciones, agrupar en superserie, mover y guardar", async ({ page }) => {
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES } });
  await nav(page, "routines"); await page.locator('[data-ropen="r1"]').click(); await page.locator('[data-edit="r1"]:visible').click();
  await page.locator('[data-esel="1"]').check(); await page.locator('[data-esel="4"]').check();
  await expect(page.locator('[data-act="ed-group"]')).toBeDisabled();   // secciones distintas
  await page.locator('[data-esel="4"]').uncheck();
  await page.locator('[data-emv="0:1"]').click();                       // calentamiento ↓ → pasa a Principal
  await page.locator('[data-esel="0"]').check(); await page.locator('[data-esel="1"]').check(); await page.locator('[data-act="ed-group"]').click();
  await page.locator('.edbot [data-act="saveroutine"]').click();
  const r = (await ls(page, "wk.routines"))[0];
  expect(r.exercises.map(e => [e.name, e.sec, !!e.grp])).toEqual([["Círculos de brazos", "s2", true], ["Fondos", "s2", true], ["Flexión en pica", "s2", true], ["Flexión diamante", "s2", true], ["Plancha", "s3", false]]);
  expect(Object.keys(r.groups).length).toBe(2);
  expect(errors).toEqual([]);
});
test.describe("pantalla ancha", () => {
  test.use({ viewport: { width: 1366, height: 2000 }, isMobile: false, hasTouch: false });
  test("catálogo al lado, arrastrar y tocar para añadir", async ({ page }) => {
    const errors = await openApp(page, { catalog: true, data: { "wk.routines": ROUTINES } });
    await nav(page, "routines"); await page.locator('[data-ropen="r1"]').click(); await page.locator('[data-edit="r1"]:visible').click();
    await expect(page.locator(".edcat")).toBeVisible();
    await page.locator('[data-dex="4"] .hdl').dragTo(page.locator('[data-dex="1"]'));
    const names = () => page.locator(".ex-edit").evaluateAll(l => l.map(x => x.querySelector("[data-en]")?.value || x.querySelector(".xname b")?.textContent));
    expect((await names())[1]).toBe("Plancha");
    await page.fill("#edQ", "dominada"); await page.locator("#edList [data-edadd]").first().click();
    expect((await names()).length).toBe(6);
    expect(errors).toEqual([]);
  });
});
