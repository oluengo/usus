// APK: notificación fija con la sesión y la cuenta atrás (UsusTimer, simulado). Botones Pausa y Saltar desde la notificación.
import { test, expect } from "@playwright/test";
import { openApp, nav } from "./helpers.mjs";
const MOCK = () => { window.__tm = []; window.Capacitor = { isNativePlatform: () => true, Plugins: { UsusTimer: {
  show: async o => { window.__tm.push(["show", o]); }, hide: async () => { window.__tm.push(["hide"]); }, ask: async () => { window.__tm.push(["ask"]); return { granted: true }; },
  addListener: (e, f) => { window.__tl = f; } } } }; };
const R = [{ id: "rt", name: "Temp", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [{ name: "Flexión", sets: 2, reps: 5, type: "reps", rest: 30 }] }];
const last = page => page.evaluate(() => window.__tm.filter(x => x[0] !== "ask").at(-1));
test("APK: notificación con la sesión y la cuenta atrás; Pausa y Saltar desde la notificación", async ({ page }) => {
  await page.addInitScript(MOCK);
  const errors = await openApp(page, { data: { "wk.routines": R } });
  expect(await page.evaluate(() => window.__tm.length)).toBe(0);                         // sin sesión, nada
  await page.locator('[data-start="rt"]:visible').first().click();
  expect(await page.evaluate(() => window.__tm.length)).toBe(0);                         // antes de empezar, tampoco
  await page.locator('[data-act="sess-begin"]').click();
  await expect.poll(() => last(page)).toMatchObject(["show", { title: "Temp", text: "Sesión en curso" }]);
  expect((await last(page))[1].start).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__tm.filter(x => x[0] === "ask").length)).toBe(1);   // pide el permiso una vez
  await page.locator('[data-done="0:0"]').click();                                       // descanso de 30 s
  await expect.poll(async () => (await last(page))[1].title).toBe("Descanso");
  let o = (await last(page))[1];
  expect(o).toMatchObject({ text: "Siguiente: Flexión", actions: true, paused: false, endTitle: "¡A por la siguiente serie!", lSkip: "Saltar" });
  expect(o.end).toBeGreaterThan(Date.now() + 20000);
  await page.evaluate(() => window.__tl({ a: "pause", at: Date.now() }));                // Pausa desde la notificación
  await expect.poll(async () => (await last(page))[1].paused).toBe(true);
  await page.evaluate(() => window.__tl({ a: "skip", at: Date.now() }));                 // Saltar
  await expect.poll(async () => (await last(page))[1].title).toBe("Temp");
  // Se puede quitar en Ajustes → Avisos
  await nav(page, "data"); await page.locator('[data-stab="avisos"]').click();
  await page.locator("#tmrNotif").uncheck();
  await expect.poll(() => last(page)).toEqual(["hide"]);
  await page.locator("#tmrNotif").check();
  await expect.poll(async () => (await last(page))[0]).toBe("show");
  // Terminar: fuera la notificación
  await nav(page, "train"); await page.locator('[data-done="0:1"]').click();
  if (await page.locator('.focus [data-act="run-skip"]').count()) await page.locator('.focus [data-act="run-skip"]').click();
  await page.locator('[data-act="finish"]:visible').first().click();
  await expect.poll(() => last(page)).toEqual(["hide"]);
  expect(errors).toEqual([]);
});
test("web: sin notificación ni permisos", async ({ page }) => {
  const errors = await openApp(page, { data: { "wk.routines": R } });
  await nav(page, "data"); await page.locator('[data-stab="avisos"]').click();
  await expect(page.locator("#tmrNotif")).toHaveCount(0);
  expect(errors).toEqual([]);
});
