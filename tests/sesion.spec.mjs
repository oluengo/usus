// Sesiones: superseries, circuitos por tiempo y cuenta atrás
import { test, expect } from "@playwright/test";
import { openApp, ROUTINES, TIMERS, phase, done } from "./helpers.mjs";
const T0 = new Date("2026-10-17T09:00:00");
async function start(page, rid, auto = true) {
  const errors = await openApp(page, { clock: T0, data: { "wk.routines": ROUTINES, ...TIMERS, "wk.autoStart": auto } });
  await page.locator(`[data-start="${rid}"]:visible`).first().click();
  await page.locator('[data-act="sess-begin"]').click(); await page.clock.runFor(300);
  return errors;
}
test("superserie por repeticiones: A1 → A2 → descanso entre vueltas → A1", async ({ page }) => {
  const errors = await start(page, "r1");
  await page.locator('[data-act="sheet-open"]').click(); await page.locator('.modal [data-goex="2"]').click();
  await expect(page.locator(".gbar")).toContainText("vuelta 1 de 2");
  const tap = async (ei, si) => { await page.locator(`[data-done="${ei}:${si}"]`).click(); await page.clock.runFor(300); return phase(page); };
  expect(await tap(2, 0)).toBe("vista: Flexión diamante");
  expect(await tap(3, 0)).toBe("Flexión en pica / Descanso entre vueltas");
  await page.clock.runFor(7000); expect(await phase(page)).toBe("vista: Flexión en pica");
  expect(await tap(2, 1)).toBe("vista: Flexión diamante");
  expect(await tap(3, 1)).toContain("Descanso entre ejercicios");
  await page.clock.runFor(5000); expect(await phase(page)).toBe("Plancha / Serie 1 de 2");
  expect(await done(page)).toBe("0 00 11 11 00");
  expect(errors).toEqual([]);
});
test("circuito por tiempo con inicio automático: se encadena entero", async ({ page }) => {
  const errors = await start(page, "r2");
  await page.locator('[data-play="0:0"]').click();
  const seen = [];
  for (let s = 0; s < 30; s++) { const p = await phase(page); if (seen.at(-1) !== p) seen.push(p); await page.clock.runFor(1000); }
  expect(seen).toEqual(["Plancha / Prepárate", "Plancha / Serie 1 de 2", "Hollow hold / Cambio de ejercicio", "Hollow hold / Serie 1 de 2",
    "Plancha / Descanso entre vueltas", "Plancha / Serie 2 de 2", "Hollow hold / Cambio de ejercicio", "Hollow hold / Serie 2 de 2", "vista: Hollow hold"]);
  expect(await done(page)).toBe("11 11");
  expect(errors).toEqual([]);
});
test("por lado: lado 1 → cambio de lado → lado 2 y descanso", async ({ page }) => {
  const errors = await start(page, "r3", false);
  await page.locator('[data-play="0:0"]').click();
  const seen = [];
  for (let s = 0; s < 18; s++) { const p = await phase(page); if (seen.at(-1) !== p) seen.push(p); await page.clock.runFor(1000); }
  expect(seen.slice(0, 5)).toEqual(["Plancha lateral / Prepárate", "Plancha lateral / Serie 1 de 2 · lado 1", "Plancha lateral / Cambia de lado", "Plancha lateral / Serie 1 de 2 · lado 2", "Plancha lateral / Descanso entre series"]);
  expect(errors).toEqual([]);
});
test("con avisos «Solo sonido» no vibra nunca", async ({ page }) => {
  await page.addInitScript(() => { window.__vib = []; Object.defineProperty(navigator, "vibrate", { value: p => { window.__vib.push(p); return true; }, configurable: true }); });
  await openApp(page, { clock: T0, data: { "wk.routines": ROUTINES, ...TIMERS, "wk.fx": "sound", "wk.autoStart": true } });
  await page.locator('[data-start="r3"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click();
  await page.locator('[data-play="0:0"]').click(); await page.clock.runFor(15000);
  expect(await page.evaluate(() => window.__vib.filter(p => p !== 0).length)).toBe(0);
});
test("descanso entre ejercicios: ficha resumida del siguiente y enlace a la completa", async ({ page }) => {
  const R = [{ id: "rx", name: "Ficha", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [
    { name: "Flexión", xid: "flexion", sets: 1, reps: 8, type: "reps", rest: 0, restAfter: 30 }, { name: "Dominada", xid: "dominada", sets: 1, reps: 5, type: "reps" }] }];
  const errors = await openApp(page, { catalog: true, clock: new Date("2026-10-16T09:00:00"), data: { "wk.routines": R, "wk.effort": { pem: false, rir: false } } });
  await page.locator('[data-start="rx"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click(); await page.clock.runFor(300);
  await page.locator('[data-done="0:0"]').click(); await page.clock.runFor(300);
  await expect(page.locator(".focus .fnx")).toContainText("Dominada");
  await expect(page.locator(".focus .fnx ol li").first()).toBeHidden();   // plegada por defecto
  await page.locator(".focus .fnx summary").click(); await page.clock.runFor(1500);
  await expect(page.locator(".focus .fnx ol li").first()).toBeVisible();  // sigue abierta tras repintar
  await page.locator(".focus .fnx .xl").click(); await expect(page.locator("#xiT")).toHaveText("Dominada");
  await page.locator('.mhead [data-act="xi-close"]').click(); await expect(page.locator(".focus")).toBeVisible();
  expect(errors).toEqual([]);
});
