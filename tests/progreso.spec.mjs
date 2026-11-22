// Progreso (3.11.0): sin pestaña Cuerpo; la IA, lo primero de Resumen; el peso completo desde Resumen → Evolución; el ciclo en Hábitos
import { test, expect } from "@playwright/test";
import { openApp, nav } from "./helpers.mjs";
const D = 864e5;
test("Resumen: IA arriba y evolución del peso; sin pestaña Cuerpo", async ({ page }) => {
  const now = Date.now(), W = [0, 7, 14, 21, 28, 35].map((d, i) => ({ id: "w" + i, t: now - (35 - d) * D, kg: 78 - i * 0.4 }));
  const S = [{ id: "s1", start: now - 2 * D, end: now - 2 * D + 36e5, routine: "A", exercises: [{ name: "Flexión", type: "reps", sets: [{ r: 10, done: true }] }] }];
  const errors = await openApp(page, { data: { "wk.sessions": S, "wk.weights": W, "wk.statsCat": "cue" } });
  await nav(page, "stats");
  await expect(page.locator('[data-scat="cue"]')).toHaveCount(0);
  for (const t of ["res", "ent", "hab"]) await expect(page.locator(`[data-scat="${t}"]`).first()).toBeAttached();
  const first = page.locator("#app main, #app").locator(".aimini, .rgrid").first();
  await expect(first).toHaveClass(/aimini/);                                              // la IA, antes que las tarjetas
  await page.locator('[data-act="peso-open"]').click();
  await expect(page.locator(".modal:has(#pzT) svg[aria-label]").first()).toBeVisible();                       // gráfico completo del peso
  await page.locator('.modal:has(#pzT) [data-act="peso-close"]').first().click();
  await expect(page.locator("#pzT")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("el ciclo está en Hábitos", async ({ page }) => {
  const k = d => { const x = new Date(Date.now() - d * D); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const errors = await openApp(page, { data: { "wk.profiles": [{ id: "main", name: "Alex", sex: "f", color: "#2446C7" }], "wk.cyc": { on: true, ack: true },
    "wk.cycP": [{ id: "c1", s: k(60), e: k(56) }, { id: "c2", s: k(32), e: k(28) }, { id: "c3", s: k(3), e: null }],
    "wk.sessions": [{ id: "s1", start: Date.now() - D, end: Date.now() - D + 36e5, routine: "A", exercises: [] }] } });
  await nav(page, "stats"); await page.locator('[data-scat="hab"]:visible').click();
  await expect(page.locator('[data-sb="ciclo"]')).toBeVisible();
  expect(errors).toEqual([]);
});
