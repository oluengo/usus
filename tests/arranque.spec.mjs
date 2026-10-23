// La app abre sin errores en los tres idiomas y todas las secciones se ven
import { test, expect } from "@playwright/test";
import { openApp, nav, ROUTINES } from "./helpers.mjs";
const LABELS = { es: ["Hoy", "Biblioteca", "Diario", "Progreso", "Ajustes"], ca: ["Avui", "Biblioteca", "Diari", "Progrés", "Ajustos"], en: ["Today", "Library", "Diary", "Progress", "Settings"] };
for (const lang of ["es", "ca", "en"]) {
  test(`abre en ${lang} y recorre las secciones`, async ({ page }) => {
    const errors = await openApp(page, { lang, data: { "wk.routines": ROUTINES } });
    await expect(page.locator("nav button")).toHaveText(LABELS[lang]);
    for (const t of ["routines", "diary", "stats", "data", "train"]) { await nav(page, t); await expect(page.locator("#app")).not.toBeEmpty(); expect(await page.locator("#app").innerText()).not.toContain("undefined"); }
    for (const s of ["perfil", "entreno", "avisos", "apariencia", "datos", "acerca"]) { await nav(page, "data"); await page.locator(`[data-stab="${s}"]`).click(); }
    expect(errors).toEqual([]);
  });
}
test("primera vez: asistente con catálogo y material, y crear la primera rutina", async ({ page }) => {
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.goto("./");
  const m = page.locator(".modal");
  await expect(m).toContainText("Paso 1 de 3");
  await m.locator("#langSel").selectOption("en"); await expect(m).toContainText("Step 1 of 3");
  await m.locator("#langSel").selectOption("es");
  await m.locator('[data-act="wiz-next"]').click();
  await m.locator('[data-act="wiz-cat-yes"]').click();
  await expect(m).toContainText("Paso 3 de 4"); await expect(m).toContainText("Mi material");
  await m.locator('[data-myeq]').first().check();
  await m.locator('[data-act="wiz-next"]').click();
  await expect(m).toContainText("Paso 4 de 4");
  await m.locator('[data-act="wiz-new"]').click();
  await expect(page.locator(".modal")).toHaveCount(0);
  await expect(page.locator("[data-en]").first()).toBeVisible();
  const st = await page.evaluate(() => ["wk.welcomed", "wk.catalog", "wk.equip"].map(k => JSON.parse(localStorage.getItem(k))));
  expect(st[0]).toBe(true); expect(st[1]).toBe(true); expect(st[2].length).toBe(1);
  expect(errors).toEqual([]);
});
test("primera vez: sin catálogo, atrás e importar una copia", async ({ page }) => {
  page.on("dialog", d => d.accept());
  await page.goto("./");
  const m = page.locator(".modal");
  await m.locator('[data-act="wiz-next"]').click();
  await m.locator('[data-act="wiz-cat-no"]').click();
  await expect(m).toContainText("Paso 3 de 3");
  await m.locator('[data-act="wiz-back"]').click();
  await expect(m.locator('[data-act="wiz-cat-no"]')).toHaveAttribute("aria-pressed", "true");
  await m.locator('[data-act="wiz-cat-no"]').click();
  const json = JSON.stringify({ version: 2, routines: ROUTINES.slice(0, 1), sessions: [] });
  await m.locator("#wizFile").setInputFiles({ name: "copia.json", mimeType: "application/json", buffer: Buffer.from(json) });
  await expect(page.locator(".modal:has(.wzdots)")).toHaveCount(0);
  await page.locator('[data-act="in-yes"]').click();   // solo rutinas: se revisan antes de añadir
  await expect.poll(() => page.evaluate(() => (JSON.parse(localStorage.getItem("wk.routines")) || []).length)).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wk.catalog")))).toBe(false);
});
test("primera vez: saltar la intro acepta el aviso y deja el catálogo activado", async ({ page }) => {
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.goto("./");
  await page.locator('.modal [data-act="wiz-skip"]').click();
  await expect(page.locator(".modal")).toHaveCount(0);
  await expect(page.locator('nav button[aria-current="page"], nav button.on').first()).toBeVisible();
  const st = await page.evaluate(() => ["wk.welcomed", "wk.catalog"].map(k => JSON.parse(localStorage.getItem(k))));
  expect(st).toEqual([true, true]);
  await page.reload(); await expect(page.locator(".modal")).toHaveCount(0);   // no vuelve a preguntar
  expect(errors).toEqual([]);
});
