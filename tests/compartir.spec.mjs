// Compartir rutinas por enlace: secciones y grupos llegan intactos
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
test("enlace de rutina con secciones y superserie", async ({ browser }) => {
  const a = await browser.newPage();
  await a.addInitScript(() => { window.__s = []; navigator.canShare = () => true; navigator.share = async d => { window.__s.push(d); }; });
  await openApp(a, { data: { "wk.routines": ROUTINES.slice(0, 1) } });
  await nav(a, "routines"); await a.locator('[data-ropen="r1"]').click(); await a.locator('[data-rshare="r1"]:visible').click(); await a.locator('[data-act="rs-link"]').click();
  await expect.poll(() => a.evaluate(() => window.__s.length)).toBeGreaterThan(0);
  const url = await a.evaluate(() => window.__s.at(-1).url); await a.close();
  const b = await browser.newPage();
  await openApp(b, { path: url.replace(/^https?:\/\/[^/]+\/[^#]*/, "./"), data: { "wk.routines": [] } });
  await b.locator('[data-act="in-yes"]').click();
  const r = (await ls(b, "wk.routines"))[0];
  expect(r.secs.map(x => x.name)).toEqual(["Calentamiento", "Principal", "Core"]);
  expect(r.groups.g1).toMatchObject({ kind: "sup", rounds: 2 });
  expect(r.exercises.filter(e => e.grp === "g1").length).toBe(2);
});
