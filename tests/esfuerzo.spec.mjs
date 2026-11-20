// Progreso → Entreno → Esfuerzo: PEM de cada sesión y, por ejercicio, % de series completas y su tendencia
import { test, expect } from "@playwright/test";
import { openApp, nav } from "./helpers.mjs";
test("tarjeta Esfuerzo: PEM media y lo que faltó por ejercicio", async ({ page }) => {
  const now = Date.now(), D = 864e5, S = [];
  // 6 sesiones antiguas (hace 7–9 semanas) y 6 recientes: dominadas fallan menos, PEM baja
  for (let i = 0; i < 12; i++) {
    const old = i < 6, t = now - (old ? 60 - i : 30 - i) * D;
    S.push({ id: "s" + i, start: t, end: t + 40 * 6e4, routine: "A", pem: old ? 8 : 6,
      exercises: [{ name: "Dominadas", type: "reps", sets: [{ r: 5, done: true, ...(old ? { miss: 2 } : {}) }, { r: 6, done: true }] },
                  { name: "Sentadilla", type: "reps", sets: [{ r: 15, done: true }] }] });
  }
  const errors = await openApp(page, { data: { "wk.sessions": S } });
  await nav(page, "stats"); await page.locator('[data-scat="ent"]:visible').first().click();
  const card = page.locator(".panel", { hasText: "Lo que faltó, por ejercicio" });
  await expect(card).toContainText("PEM media · 6 semanas");
  await expect(card.locator(".kpr")).toContainText("6");          // media reciente
  await expect(card.locator(".kpr")).toContainText("−2");         // frente a las 6 anteriores
  await expect(card.locator("svg circle")).toHaveCount(12);
  const dom = card.locator(".efrow", { hasText: "Dominadas" });
  await expect(dom).toContainText("75 %");                         // 18 de 24 completas
  await expect(dom.locator(".eftr")).toContainText("↑ 50 %");      // de 50 % a 100 %
  await expect(dom).toContainText("faltaron 2 de media");
  await expect(card.locator(".efrow", { hasText: "Sentadilla" })).toContainText("todas completas");
  expect(errors).toEqual([]);
});
