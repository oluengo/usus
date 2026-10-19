// Accesibilidad (axe-core, WCAG 2.2 A/AA) en cada sección y en los temas claro, oscuro y protector
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openApp, nav, ROUTINES } from "./helpers.mjs";
const PLAN = { enabled: true, name: "Bloque", start: "2026-09-28", review: "", phases: [{ id: "a", variant: "A", weeks: 2 }, { id: "b", variant: "B", weeks: 2 }], deload: { weeks: 1, every: 6 }, up: true };
const SCREENS = [["train"], ["routines", '[data-rview="plan"]', '[data-act="plan-edit"]'], ["routines"], ["routines", '[data-ropen="r1"]'], ["routines", '[data-ropen="r1"]', '[data-edit="r1"]:visible'],
  ["routines", '[data-rview="cat"]'], ["diary"], ["stats"], ["data"], ["data", '[data-stab="perfil"]'], ["data", '[data-stab="entreno"]'], ["data", '[data-stab="apariencia"]'], ["data", '[data-stab="datos"]'], ["data", '[data-stab="acerca"]'], ["routines", '[data-rview="plan"]'], ["diary", '[data-dsh="peso"]'],
  ["routines", '[data-rview="mine"]', '[data-ropen="r3"]', '[data-start="r3"]:visible', '[data-act="sess-begin"]'], ["train", '[data-play="0:0"]']];
const SESS = [{ id: "s1", start: Date.parse("2026-10-13T07:00:00"), end: Date.parse("2026-10-13T07:30:00"), rid: "r3", routine: "Core lateral", pem: 7, exercises: [{ name: "Flexiones", type: "reps", sets: [{ r: 8, w: 0, done: true }] }] }];
for (const theme of ["light", "dark", "protector"]) {
  test(`sin fallos graves de accesibilidad · tema ${theme}`, async ({ page }) => {
    await openApp(page, { catalog: true, data: { "wk.routines": ROUTINES, "wk.sessions": SESS, "wk.theme": theme, "wk.plan": PLAN } });
    const minor = [];
    const found = [];
    for (const [tab, ...extra] of SCREENS) {
      if (await page.locator('[data-act="cancelroutine"]:visible, [data-act="plan-cancel"]:visible, [data-act="dsheet-close"]:visible').count()) await page.locator('[data-act="cancelroutine"]:visible, [data-act="plan-cancel"]:visible, [data-act="dsheet-close"]:visible').first().click();
      await nav(page, tab); for (const x of extra) { if (await page.locator(x).count()) await page.locator(x).first().click(); } await page.waitForTimeout(150);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude(".betatag").analyze();
      for (const v of r.violations) if (!["serious", "critical"].includes(v.impact)) minor.push(`${tab} · ${v.id} [${v.impact}] (${v.nodes.length})`);
      for (const v of r.violations) if (["serious", "critical"].includes(v.impact)) found.push(`${tab}${extra.length ? " " + extra.at(-1) : ""} · ${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`);
    }
    if (minor.length) console.log(`[${theme}] avisos menores:\n` + [...new Set(minor)].join("\n"));
    expect(found, found.join("\n")).toEqual([]);
  });
}
test("sin fallos graves de accesibilidad · asistente de primer uso", async ({ page }) => {
  await page.goto("./"); const m = page.locator(".modal"), found = [];
  const check = async n => { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude(".betatag").analyze();
    for (const v of r.violations) if (["serious", "critical"].includes(v.impact)) found.push(`paso ${n} · ${v.id}: ${v.nodes.slice(0, 3).map(x => x.target.join(" ")).join(" | ")}`); };
  await check(1); await m.locator('[data-act="wiz-next"]').click(); await check(2);
  await m.locator('[data-act="wiz-cat-yes"]').click(); await check(3); await m.locator('[data-act="wiz-next"]').click(); await check(4);
  expect(found, found.join("\n")).toEqual([]);
});
