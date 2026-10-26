// Crear plan con IA externa: 4 pasos, indicaciones copiadas y respuesta revisada antes de importar
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
const RESP = { app: "usus", routines: [
  { name: "A · Lunes · Empuje", block: "empuje", variant: "A", days: [1], exercises: [{ name: "Flexión", sets: 3, reps: 8, type: "reps", rest: 90 }] },
  { name: "B · Lunes · Empuje", block: "empuje", variant: "B", days: [1], exercises: [{ name: "Fondos", sets: 3, reps: 6, type: "reps" }] }],
  plan: { phases: [{ variant: "A", weeks: 2 }, { variant: "B", weeks: 2 }], deload: { weeks: 1, every: 6 }, up: true, upRule: "reps1" } };
test("pasos, indicaciones y respuesta de la IA", async ({ page }) => {
  await page.addInitScript(() => { window.__clip = []; Object.defineProperty(navigator, "clipboard", { value: { writeText: async t => { window.__clip.push(t); }, readText: async () => window.__paste || "" }, configurable: true }); });
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
  // «Pegar respuesta de la IA»: lee lo copiado (aquí, solo el bloque de código, con formato)
  await page.evaluate(t => { window.__paste = t; }, JSON.stringify(RESP, null, 2));
  await m.locator('[data-act="aip-clip"]').click();
  await expect(page.locator("#inT")).toContainText("Propuesta de la IA");
  await page.locator('[data-act="in-yes"]').click();
  expect((await ls(page, "wk.routines")).map(r => r.name)).toContain("A · Lunes · Empuje");
  const p = await ls(page, "wk.plan"); expect(p.name).toBe("Plan con IA"); expect(p.upRule).toBe("reps1");
  expect(errors).toEqual([]);
});
test("plan de la IA con letras ya usadas: se cambian por letras libres", async ({ page }) => {
  const MINE = [{ id: "m1", name: "A · Mi empuje", block: "empuje", variant: "A", days: [1], exercises: [{ name: "Flexión", sets: 3, reps: 10, type: "reps" }] }];
  const errors = await openApp(page, { data: { "wk.routines": MINE } });
  await nav(page, "routines"); await page.locator('[data-rview="plan"]').click();
  await page.locator('[data-act="aip-open"]').first().click();
  const m = page.locator(".mbox.aip");
  for (let i = 0; i < 3; i++) await m.locator('[data-act="aip-next"]').click();
  await m.locator(".aimanual summary").click(); await m.locator("#aipPaste").fill("Aquí tienes tu plan:\n```json\n" + JSON.stringify(RESP) + "\n```\nSuerte.");
  await m.locator('[data-act="aip-paste"]').click(); await page.locator('[data-act="in-yes"]').click();
  const R = await ls(page, "wk.routines"), P = await ls(page, "wk.plan");
  expect(R.find(r => r.id === "m1").variant).toBe("A");
  const nv = P.phases.map(x => x.variant); expect(nv).not.toContain("A");
  expect(R.filter(r => r.id !== "m1").map(r => r.variant).sort()).toEqual([...nv].sort());
  expect(R.some(r => r.name.startsWith(nv[0] + " · Lunes"))).toBe(true);
  expect(errors).toEqual([]);
});
test("respuesta de la IA guardada como archivo: Importar la lleva a la revisión", async ({ page }) => {
  const errors = await openApp(page, {});
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.locator("#impFile").setInputFiles({ name: "plan.txt", mimeType: "text/plain", buffer: Buffer.from("Tu plan:\n```json\n" + JSON.stringify(RESP) + "\n```") });
  await expect(page.locator("#inT")).toContainText("Propuesta de la IA");
  await page.locator('[data-act="in-yes"]').click();
  expect((await ls(page, "wk.plan")).name).toBe("Plan con IA");
  expect(errors).toEqual([]);
});
test("compartir con Usus: la respuesta de la IA llega a la revisión (PWA y puente del APK)", async ({ page }) => {
  const prose = "Aquí tienes tu plan:\n\n```json\n" + JSON.stringify(RESP, null, 2) + "\n```\n¡Suerte!";
  const errors = await openApp(page, { path: "./?share&text=" + encodeURIComponent(prose) });
  await expect(page.locator("#inT")).toContainText("Propuesta de la IA");
  expect(await page.evaluate(() => location.search)).toBe("");               // la URL queda limpia
  await page.locator('.mhead [data-act="in-close"]').click();
  await page.evaluate(() => window.ususReceive("hola, nada que importar")); // texto sin rutinas: aviso
  await expect(page.locator("#toast")).toContainText("No se han encontrado rutinas");
  await page.evaluate(t => window.ususReceive(t), JSON.stringify(RESP));     // archivo .json de la IA
  await expect(page.locator("#inT")).toContainText("Propuesta de la IA");
  expect(errors).toEqual([]);
});
