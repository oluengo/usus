// Web beta (…/beta/): guarda sus datos aparte de la principal
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("la beta no ve ni toca los datos de la principal", async ({ context }) => {
  await context.route("**/beta/**", async route => { const u = new URL(route.request().url()); let p = u.pathname.replace(/^\/beta\//, "") || "index.html";
    try { await route.fulfill({ body: readFileSync(p), contentType: p.endsWith(".html") || p === "index.html" ? "text/html" : undefined }); } catch { await route.fulfill({ status: 404 }); } });
  const seed = (name) => `localStorage.setItem('wk.welcomed','true');localStorage.setItem('wk.catalog','false');localStorage.setItem('wk.routines',JSON.stringify([{id:'x',name:'${name}',exercises:[]}]))`;
  const main = await context.newPage(); await main.goto("./"); await main.evaluate(seed("PRINCIPAL"));
  const beta = await context.newPage(); await beta.goto("./beta/"); await beta.evaluate(seed("BETA"));
  await expect(beta.locator("#betaTag")).toBeVisible();
  const keys = await main.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain("beta:wk.routines"); expect(JSON.parse(await main.evaluate(() => localStorage.getItem("wk.routines")))[0].name).toBe("PRINCIPAL");
  expect(JSON.parse(await beta.evaluate(() => localStorage.getItem("wk.routines")))[0].name).toBe("BETA");
});
