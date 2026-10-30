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
test("lo que faltó: sin contestar = 0 (completa); un número se resta de lo hecho; con × no se pregunta más", async ({ page }) => {
  const R = [{ id: "rr", name: "RIR", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [
    { name: "Flexión", sets: 3, reps: 8, type: "reps", rest: 20 }, { name: "Plancha", sets: 2, reps: 30, type: "time", rest: 20 }] }];
  const errors = await openApp(page, { clock: T0, data: { "wk.routines": R, ...TIMERS, "wk.effort": { pem: false, rir: true }, "wk.autoStart": false } });
  await page.locator('[data-start="rr"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click(); await page.clock.runFor(300);
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("wk.active")).exercises.map(e => e.sets.map(s => `${s.r}/${s.miss ?? "-"}`).join(" ")).join(" | "));
  await page.locator('[data-done="0:0"]').click(); await page.clock.runFor(300);
  await expect(page.locator(".focus .rirbar")).toContainText("¿Cuántas te faltaron?");
  await page.clock.runFor(21000);                                   // descanso acabado sin contestar: completa
  expect(await st()).toBe("8/0 8/- 8/- | 30/- 30/-");
  await page.locator('[data-done="0:1"]').click(); await page.clock.runFor(300);
  await page.locator('.focus [data-rir="-1"]').click(); await page.clock.runFor(21000);   // «×»: sin valor
  expect(await st()).toBe("8/0 8/- 8/- | 30/- 30/-");
  await page.locator('[data-done="0:2"]').click(); await page.clock.runFor(300);
  await page.locator('.focus [data-rir="2"]').click(); await page.clock.runFor(300);      // me faltaron 2: hechas 6
  expect(await st()).toBe("8/0 8/- 6/2 | 30/- 30/-");
  if (await page.locator(".focus").count()) { await page.locator('.focus [data-act="run-skip"]').click(); await page.clock.runFor(300); }
  await page.getByRole("button", { name: "Anterior" }).click(); await page.clock.runFor(300);
  await page.locator('[data-done="0:2"]').click(); await page.clock.runFor(300);           // desmarcar devuelve lo restado
  expect(await st()).toBe("8/0 8/- 8/- | 30/- 30/-");
  await page.locator('[data-done="0:2"]').click(); await page.clock.runFor(300);           // se vuelve a marcar: pasa a la plancha
  await page.locator('.focus [data-rir="-1"]').click(); await page.locator('.focus [data-act="run-skip"]').click(); await page.clock.runFor(300);
  // Plancha por tiempo: «¿cuántos segundos te faltaron?» → 10: hechos 20
  await page.locator('[data-play="1:0"]').click(); await page.clock.runFor(33000);   // preparación 2 s + 30 s
  await expect(page.locator(".focus .rirbar")).toContainText("segundos te faltaron");
  await page.locator('.focus [data-rir="10"]').click(); await page.clock.runFor(300);
  expect((await st()).split(" | ")[1]).toBe("20/10 30/-");
  expect(errors).toEqual([]);
});
test("progresión: con lo que faltó no propone subir; si se completa, propone y enseña la ficha", async ({ page }) => {
  const R = [{ id: "rp", name: "Prog", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [{ name: "Flexión", xid: "flexion", sets: 2, reps: 8, type: "reps", rest: 0 }] }];
  const prev = { id: "sp", start: T0.getTime() - 2 * 864e5, end: T0.getTime() - 2 * 864e5 + 6e5, rid: "rp", routine: "Prog", block: "full", exercises: [{ name: "Flexión", xid: "flexion", type: "reps", sets: [{ w: 0, r: 8, done: true }, { w: 0, r: 8, done: true }] }] };
  for (const miss of [2, 0]) {
    const p = await page.context().newPage();
    const errors = await openApp(p, { catalog: true, clock: T0, data: { "wk.routines": R, "wk.sessions": [prev], ...TIMERS, "wk.effort": { pem: false, rir: true } } });
    await p.locator('[data-start="rp"]:visible').first().click(); await p.locator('[data-act="sess-begin"]').click(); await p.clock.runFor(300);
    const skip = async () => { if (await p.locator(".focus").count()) { await p.locator('.focus [data-act="run-skip"]').click(); await p.clock.runFor(300); } };
    await p.locator('[data-done="0:0"]').click(); await p.clock.runFor(300); await skip();
    await p.locator('[data-done="0:1"]').click(); await p.clock.runFor(300);
    await p.locator(`[data-rir="${miss}"]:visible`).first().click(); await p.clock.runFor(300); await skip();
    await p.locator('[data-act="finish"]').click(); await p.clock.runFor(800);
    if (miss) await expect(p.locator(".pgc.up")).toHaveCount(0);
    else {
      await expect(p.locator(".pgc.up")).toBeVisible();
      await p.locator('.pgc.up .pgft [data-xinfo]').last().click(); await expect(p.locator("#xiT")).toBeVisible();
      await p.locator('.mhead [data-act="xi-close"]').click(); await expect(p.locator(".pgc.up")).toBeVisible();
    }
    expect(errors).toEqual([]); await p.close();
  }
});
test("cambiar ejercicio: cada sugerencia del catálogo tiene su ficha", async ({ page }) => {
  const R = [{ id: "rs", name: "Swap", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [{ name: "Flexión", xid: "flexion", sets: 1, reps: 8, type: "reps" }] }];
  const errors = await openApp(page, { catalog: true, clock: T0, data: { "wk.routines": R, ...TIMERS } });
  await page.locator('[data-start="rs"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click(); await page.clock.runFor(300);
  await page.locator('[data-swap="0"]').click(); await page.clock.runFor(300);
  await page.locator("#xpList .xri").first().click(); await expect(page.locator("#xiT")).toBeVisible();
  await expect(page.locator('[data-act="xi-add"]')).toHaveCount(0);          // desde el selector, sin «Añadir a una rutina»
  await page.locator('.mhead [data-act="xi-close"]').click(); await expect(page.locator("#xpT")).toBeVisible();
  expect(errors).toEqual([]);
});
