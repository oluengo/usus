// Crear plan con IA externa: 4 pasos, indicaciones copiadas y respuesta revisada antes de importar
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
const RESP = { app: "usus", routines: [
  { name: "A · Lunes · Empuje", block: "empuje", variant: "A", days: [1], exercises: [{ name: "Flexión", sets: 3, reps: 8, type: "reps", rest: 90 }] },
  { name: "B · Lunes · Empuje", block: "empuje", variant: "B", days: [1], exercises: [{ name: "Fondos", sets: 3, reps: 6, type: "reps" }] }],
  plan: { phases: [{ variant: "A", weeks: 2 }, { variant: "B", weeks: 2 }], deload: { weeks: 1, every: 6 }, up: true, upRule: "reps1" } };
test("pasos, indicaciones y respuesta de la IA", async ({ page }) => {
  await page.addInitScript(() => { window.__clip = []; Object.defineProperty(navigator, "clipboard", { value: { writeText: async t => { window.__clip.push(t); } }, configurable: true }); });
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES.slice(2), "wk.weights": [{ id: "w1", t: Date.now() - 864e5, kg: 72.5 }] } });
  await nav(page, "routines"); await page.locator('[data-rview="plan"]').click();
  await page.locator('[data-act="aip-open"]').first().click();
  const m = page.locator(".mbox.aip");
  await expect(m.locator("#aip_weight")).toHaveValue("72.5");          // peso del registro
  await m.locator("#aip_height").fill("178");
  await m.locator('[data-act="aip-next"]').click();
  await m.locator('[data-aipc="goals"][data-v="fuerza"]').click(); await m.locator("#aip_want").fill("10 dominadas");
  await m.locator('[data-act="aip-next"]').click(); await m.locator('[data-act="aip-next"]').click();
  await m.locator('[data-act="aip-copy"]').click();
  await expect.poll(() => page.evaluate(() => window.__clip.length)).toBe(1);
  const txt = await page.evaluate(() => window.__clip[0]);
  expect(txt).toContain("178 cm"); expect(txt).toContain("10 dominadas"); expect(txt).toContain('"app": "usus"'); expect(txt).toContain("ejercicios.json");
  expect((await ls(page, "wk.aiPlan")).want).toBe("10 dominadas");   // «Recordar mis respuestas»
  await m.locator("#aipPaste").fill("Aquí tienes tu plan:\n```json\n" + JSON.stringify(RESP) + "\n```\nSuerte.");
  await m.locator('[data-act="aip-paste"]').click();
  await expect(page.locator("#inT")).toContainText("Propuesta de la IA");
  await page.locator('[data-act="in-yes"]').click();
  expect((await ls(page, "wk.routines")).map(r => r.name)).toContain("A · Lunes · Empuje");
  const p = await ls(page, "wk.plan"); expect(p.name).toBe("Plan con IA"); expect(p.upRule).toBe("reps1");
  expect(errors).toEqual([]);
});
