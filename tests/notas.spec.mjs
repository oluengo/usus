// Terminar una sesión y añadir notas después, que salen en Stats
import { test, expect } from "@playwright/test";
import { openApp, nav, ls } from "./helpers.mjs";
const R = [{ id: "r1", name: "Tracción", block: "espalda", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [
  { name: "Dominadas", sets: 2, reps: 6, type: "reps", rest: 0, restAfter: 60 }, { name: "Remo", sets: 1, reps: 10, type: "reps" }] }];
test("notas de sesión y de ejercicio en una sesión terminada", async ({ page }) => {
  const errors = await openApp(page, { clock: new Date("2026-10-16T09:00:00"), data: { "wk.routines": R, "wk.effort": { pem: false, rir: false }, "wk.restDefault": 0 } });
  await page.locator('[data-start="r1"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click(); await page.clock.runFor(300);
  for (const i of [0, 1]) { await page.locator(`[data-done="0:${i}"]`).click(); await page.clock.runFor(300); }
  if (await page.locator(".focus").count()) { await page.locator('[data-act="run-stop"]').click(); await page.clock.runFor(300); }
  if (!(await page.locator(".exdone").count())) await page.locator('[data-act="ex-prev"]').click();
  await expect(page.locator(".exdone")).toContainText("Dominadas hecho");
  await page.locator('.sbar [data-act="ex-next"]').click(); await page.clock.runFor(300);
  await page.locator('[data-done="1:0"]').click(); await page.clock.runFor(300);
  await page.locator('[data-act="finish"]:visible').first().click(); await page.clock.runFor(400);
  expect((await ls(page, "wk.sessions")).length).toBe(1);
  if (await page.locator('[data-act="saved-close"]').count()) await page.locator('[data-act="saved-close"]').click();
  await nav(page, "diary"); await page.clock.runFor(300); await page.locator('[data-dsh="ses"]').click(); await page.clock.runFor(300);
  await page.locator("details.sess summary").first().click(); await page.locator("[data-snote]").click();
  await page.fill("[data-ssnote]", "Hoy con agujetas"); await page.locator('[data-sxnote$=":0"]').fill("Agarre neutro");
  await page.locator('[data-act="snote-done"]').click();
  const s = (await ls(page, "wk.sessions"))[0];
  expect(s.note).toBe("Hoy con agujetas"); expect(s.exercises[0].note).toBe("Agarre neutro");
  await page.locator('[data-act="dsheet-close"]').click(); await nav(page, "stats"); await page.locator('[data-scat="hab"]').click(); await page.clock.runFor(300);
  await expect(page.locator('[data-sb="notas"]')).toContainText("Hoy con agujetas");
  expect(errors).toEqual([]);
});
