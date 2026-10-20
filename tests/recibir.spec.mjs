// Recibir rutinas: aviso si ya la tienes igual o muy parecida (75 % o más)
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
const file = o => ({ name: "rutinas.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ app: "usus", shared: 1, ...o })) });
test("igual: sale sin marcar; parecida: aviso y se añade como nueva", async ({ page }) => {
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES } });
  const r3 = ROUTINES[2], parecida = { ...r3, name: "Core lateral 2", exercises: [...r3.exercises.slice(0, 2), { name: "Hollow hold", sets: 2, reps: 20, type: "time" }, ...r3.exercises.slice(2)] };
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.setInputFiles("#impFile", file({ routines: [r3, parecida] }));
  const rows = page.locator(".rsrow");
  await expect(rows.nth(0)).toContainText("Ya la tienes igual");
  await expect(rows.nth(0).locator(".rsr")).toHaveAttribute("aria-pressed", "false");
  await expect(rows.nth(1)).toContainText("75 %");
  await expect(rows.nth(1).locator(".rsr")).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-act="in-yes"]').click();
  expect((await ls(page, "wk.routines")).map(r => r.name)).toEqual(["B · Empuje", "Circuito core", "Core lateral", "Core lateral 2"]);
  expect(errors).toEqual([]);
});
test("archivo de «Solo rutinas» importado dos veces: avisa y no duplica", async ({ page }) => {
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES } });
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  const f = { name: "rutinas.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ app: "usus", routines: ROUTINES.slice(0, 2) })) };
  await page.setInputFiles("#impFile", f);
  await expect(page.locator(".mbox:has(#inT)")).toContainText("Ya tienes todas estas rutinas");
  await expect(page.locator('[data-act="in-yes"]')).toBeDisabled();
  await page.locator('[data-act="in-no"]:visible').first().click();
  expect((await ls(page, "wk.routines")).length).toBe(3);
  expect(errors).toEqual([]);
});
