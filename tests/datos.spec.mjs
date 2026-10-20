// Copia de seguridad: exportar e importar conserva rutinas, sesiones y plan
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const SESS = [{ id: "s1", start: Date.parse("2026-10-13T07:00:00"), end: Date.parse("2026-10-13T07:30:00"), rid: "r3", routine: "Core lateral", exercises: [{ name: "Flexiones", type: "reps", sets: [{ r: 8, w: 0, done: true }] }] }];
test("exportar y volver a importar en otra instalación", async ({ browser }) => {
  const a = await browser.newPage();
  await a.addInitScript(() => { window.__s = []; navigator.canShare = () => true; navigator.share = async d => { window.__s.push({ name: d.files?.[0]?.name, text: d.files ? await d.files[0].text() : null }); }; });
  await openApp(a, { data: { "wk.routines": ROUTINES, "wk.sessions": SESS } });
  await nav(a, "data"); await a.locator('[data-stab="datos"]').click(); await a.locator('[data-act="exp-all"]').click();
  await expect.poll(() => a.evaluate(() => window.__s.length)).toBe(1);
  const f = await a.evaluate(() => window.__s[0]); await a.close();
  const j = JSON.parse(f.text); expect(j.app).toBe("usus"); expect(j.routines.length).toBe(3);
  const p = join(mkdtempSync(join(tmpdir(), "usus-")), f.name); writeFileSync(p, f.text);
  const b = await browser.newPage(); await openApp(b, { data: {} });
  await nav(b, "data"); await b.locator('[data-stab="datos"]').click(); await b.setInputFiles("#impFile", p); await b.waitForTimeout(500);
  expect((await ls(b, "wk.routines")).length).toBe(3); expect((await ls(b, "wk.sessions")).length).toBe(1);
});
test("copia antigua (versión 1) se pone al día al importar", async ({ page }) => {
  const old = { app: "usus", version: 1, routines: [{ id: "o1", name: "Vieja", exercises: [
    { name: "A", sets: 3, reps: 8, type: "reps", grp: "g9" }, { name: "B", sets: 3, reps: 8, type: "reps", grp: "gX" }, { name: "C", sets: 5, reps: 8, type: "reps", grp: "gX" }],
    groups: { gX: { kind: "sup", rounds: 2, rest: 60 } } }], sessions: [{ id: "s9", start: Date.parse("2026-01-02T08:00:00"), exercises: [] }] };
  const p = join(mkdtempSync(join(tmpdir(), "usus-")), "vieja.json"); writeFileSync(p, JSON.stringify(old));
  await openApp(page, { data: {} });
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click(); await page.setInputFiles("#impFile", p); await page.waitForTimeout(500);
  const r = (await ls(page, "wk.routines"))[0];
  expect(r.exercises.map(e => [e.name, e.grp || null, e.sets])).toEqual([["A", null, 3], ["B", "gX", 2], ["C", "gX", 2]]);   // grupo inexistente fuera; vueltas = series
  expect((await ls(page, "wk.sessions"))[0].end).toBe(old.sessions[0].start);
});
test("datos guardados de la 2.x se ponen al día al abrir", async ({ page }) => {
  await openApp(page, { data: { "wk.routines": [{ id: "x", name: "X", exercises: [{ name: "A", sets: 3, reps: 5, type: "reps", grp: "nada" }] }] } });
  expect(await ls(page, "wk.dataVersion")).toBe(2);
  expect((await ls(page, "wk.routines"))[0].exercises[0].grp).toBeUndefined();
});
