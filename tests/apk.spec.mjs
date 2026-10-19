// Versión Android (APK): puente nativo de www/ (compartir, imprimir, botón Atrás) con Capacitor simulado.
// Requiere haber generado www/ (npm run www).
import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { openApp, nav, ROUTINES } from "./helpers.mjs";
const MOCK = () => { window.Capacitor = { isNativePlatform: () => true, registerPlugin: n => ({ print: async o => { window.__pr = [n, o]; } }), Plugins: {
  Filesystem: { writeFile: async o => { (window.__w = window.__w || []).push(o); return { uri: "file:///cache/" + o.path }; } },
  Share: { share: async o => { window.__s = o; if (window.__cancel) throw new Error("Share canceled"); } },
  App: { addListener: (e, f) => { window.__back = f; }, minimizeApp: () => { window.__min = 1; } } } }; };
test.skip(!existsSync("www/index.html"), "falta www/: ejecuta npm run www");
test("compartir copia, imprimir y botón Atrás", async ({ page }) => {
  await page.addInitScript(MOCK);
  const errors = await openApp(page, { path: "./www/", data: { "wk.routines": ROUTINES } });
  expect(await page.evaluate(() => navigator.standalone)).toBe(true);
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click(); await page.locator('[data-act="exp-all"]').click();
  await expect.poll(() => page.evaluate(() => window.__w?.length || 0)).toBe(1);
  const w = await page.evaluate(() => window.__w[0]); expect(w.directory).toBe("CACHE");
  expect(JSON.parse(Buffer.from(w.data, "base64").toString()).app).toBe("usus");
  await nav(page, "routines"); await page.locator('[data-ropen="r1"]').click(); await page.locator('[data-rprint="r1"]:visible').click(); await page.locator('[data-act="print-go"]').click();
  await expect.poll(() => page.evaluate(() => window.__pr?.[0])).toBe("UsusPrint");
  await page.locator('[data-act="print-close"]').click();
  await page.locator('[data-rshare="r1"]:visible').click(); await expect(page.locator(".modal")).toHaveCount(1);
  await page.evaluate(() => window.__back()); await expect(page.locator(".modal")).toHaveCount(0);
  await page.evaluate(() => window.__back()); await expect(page.locator(".rrow").first()).toBeVisible();   // de la rutina a la lista
  await page.evaluate(() => window.__back()); await expect(page.locator('#tabs [aria-current="page"]')).toHaveAttribute("data-tab", "train");
  await page.evaluate(() => window.__back()); expect(await page.evaluate(() => window.__min)).toBe(1);
  expect(errors).toEqual([]);
});
