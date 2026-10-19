// La app abre sin errores en los tres idiomas y todas las secciones se ven
import { test, expect } from "@playwright/test";
import { openApp, nav, ROUTINES } from "./helpers.mjs";
const LABELS = { es: ["Hoy", "Rutinas", "Diario", "Stats", "Ajustes"], ca: ["Avui", "Rutines", "Diari", "Stats", "Ajustos"], en: ["Today", "Routines", "Diary", "Stats", "Settings"] };
for (const lang of ["es", "ca", "en"]) {
  test(`abre en ${lang} y recorre las secciones`, async ({ page }) => {
    const errors = await openApp(page, { lang, data: { "wk.routines": ROUTINES } });
    await expect(page.locator("nav button")).toHaveText(LABELS[lang]);
    for (const t of ["routines", "diary", "stats", "data", "train"]) { await nav(page, t); await expect(page.locator("#app")).not.toBeEmpty(); expect(await page.locator("#app").innerText()).not.toContain("undefined"); }
    for (const s of ["entreno", "cuerpo", "app", "datos"]) { await nav(page, "data"); await page.locator(`[data-stab="${s}"]`).click(); }
    expect(errors).toEqual([]);
  });
}
test("primera vez: bienvenida", async ({ page }) => {
  page.on("pageerror", e => { throw e; });
  await page.goto("./");
  await expect(page.locator(".modal")).toBeVisible();
});
