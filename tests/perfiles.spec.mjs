// Nuevo perfil: copia las rutinas del perfil actual por defecto, sin pasos de más
import { test, expect } from "@playwright/test";
import { openApp, nav, ROUTINES } from "./helpers.mjs";
test("nuevo perfil con las rutinas del actual", async ({ page }) => {
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES, "wk.profiles": [{ id: "main", name: "Oscar", sex: "m", color: "#2446C7" }] } });
  await nav(page, "data"); await page.locator('[data-stab="perfil"]').click(); await page.locator('[data-act="prof-add"]').click();
  await page.fill("#pfName", "Ana"); await page.locator('[data-pfsex="f"]').click();
  await expect(page.locator('[data-pffrom="copy"]')).toHaveClass(/on/);
  await page.locator('[data-pfr="r2"]').click();   // sin «Circuito core»
  await page.locator('[data-act="pf-next"]').click(); await page.waitForTimeout(600);
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem("wk.profile")));
  const rs = await page.evaluate(id => JSON.parse(localStorage.getItem(`wk.${id}.routines`)), p);
  expect(rs.map(r => r.name)).toEqual(["B · Empuje", "Core lateral"]);
  expect(errors).toEqual([]);
});
test("nuevo perfil: elige el catálogo en el formulario, entra sin más preguntas y avisa", async ({ page }) => {
  const errors = await openApp(page, { catalog: true, data: { "wk.routines": ROUTINES, "wk.profiles": [{ id: "main", name: "Oscar", sex: "m", color: "#2446C7" }] } });
  await nav(page, "data"); await page.locator('[data-stab="perfil"]').click(); await page.locator('[data-act="prof-add"]').click();
  await expect(page.locator("#pfCat")).toBeChecked();   // como el perfil actual
  await page.fill("#pfName", "Ana"); await page.locator('[data-pfsex="f"]').click(); await page.locator("#pfCat").uncheck();
  await page.locator('[data-act="pf-next"]').click();
  await expect(page.locator("#toast")).toContainText("Perfil «Ana» creado");
  await expect(page.locator(".modal")).toHaveCount(0);
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem("wk.profile")));
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem(`wk.${id}.catalog`)), p)).toBe(false);
  expect(errors).toEqual([]);
});
