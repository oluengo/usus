// Comidas: preferencias en el perfil (selectores plegables), lo comido en el diario y la pregunta para tu IA
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
const todayK = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
test("preferencias de comida en el perfil, comidas del día y pregunta para la IA", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const k = todayK(), R = ROUTINES.map(r => ({ ...r, days: [0, 1, 2, 3, 4, 5, 6] }));
  const errors = await openApp(page, { data: { "wk.routines": R, "wk.diary": { [k]: { note: "Bien", meals: { b: "Tostada con tomate" } } } } });
  // Perfil: plegables con selectores; se guardan sin cerrar el apartado
  await nav(page, "data"); await page.locator('[data-stab="perfil"]').click();
  await expect(page.locator('[data-fsum="al"]')).toHaveText("Ninguna");
  await page.locator('[data-ffold="al"] summary').click();
  await page.locator('[data-food="al:lactosa"]').click(); await page.locator('[data-food="al:gluten"]').click();
  await expect(page.locator('[data-ffold="al"]')).toHaveAttribute("open", "");
  await expect(page.locator('[data-fsum="al"]')).toHaveText("Lactosa, Gluten");
  await page.locator('[data-ffold="diet"] summary').click(); await page.locator('[data-food="diet:vegana"]').click();
  await expect(page.locator('[data-food="diet:todo"]')).toHaveAttribute("aria-pressed", "false");
  await page.locator('[data-ffold="goals"] summary').click(); await page.locator('[data-food="goals:prot"]').click();
  await page.fill("#foodNo", "setas");
  expect(await ls(page, "wk.food")).toEqual({ al: ["lactosa", "gluten"], diet: "vegana", goals: ["prot"], no: "setas" });
  // Diario: comidas y pregunta
  await nav(page, "diary"); await page.locator('[data-dsh="food"]').click();
  await page.fill("#fm_d", "Pizza");
  expect((await ls(page, "wk.diary"))[k].meals).toEqual({ b: "Tostada con tomate", d: "Pizza" });
  await page.locator('[data-fq="antes"]').click(); await page.fill("#fqAntes", "pizza para cenar");
  await page.locator('[data-act="food-copy"]').click();
  const p = await page.evaluate(() => navigator.clipboard.readText());
  for (const x of ["«pizza para cenar»", "- Desayuno: Tostada con tomate", "- Cena: Pizza", "Hoy me toca entrenar", "vegana", "lactosa, gluten (no las incluyas nunca)", "No me gusta: setas", "más proteína", "Sin dietas, calorías ni pesos"]) expect(p).toContain(x);
  // Respuesta de la IA → notas del día
  await page.evaluate(() => navigator.clipboard.writeText("1. Ensalada de garbanzos"));
  await page.locator('[data-act="food-clip"]').click();
  await expect(page.locator("#toast")).toContainText("Guardado en las notas del día");
  expect((await ls(page, "wk.diary"))[k].note).toBe("Bien\n\nIdeas para comer:\n1. Ensalada de garbanzos");
  expect(errors).toEqual([]);
});
