// Diario → Menú de la semana: pregunta para la IA, pegar el JSON, seguimiento (✓ ✗ ⇄ y motivo), lista de la compra y análisis
import { test, expect } from "@playwright/test";
import { openApp, nav, ls } from "./helpers.mjs";
const pad = n => String(n).padStart(2, "0"), key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; };
function aiMenu() {
  const m = monday(), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(m); d.setDate(m.getDate() + i);
    return { date: key(d), train: i % 2 === 0, meals: { b: { name: "Avena con fruta " + i, time: 5, ingredients: ["40 g avena", "1 plátano"], steps: ["Mezcla", "Sirve"] },
      l: { name: "Lentejas " + i, time: 30, ingredients: ["80 g lentejas"], steps: ["Cuece"] }, s: { name: "Yogur", time: 2, ingredients: ["1 yogur"], steps: ["Abre"] },
      d: { name: "Tortilla " + i, time: 15, ingredients: ["2 huevos"], steps: ["Bate", "Cuaja"] } } }; });
  return "Aquí tienes tu menú:\n```json\n" + JSON.stringify({ app: "usus", kind: "menu", version: 1, start: key(m), people: 2, days,
    shopping: [{ group: "Fruta y verdura", items: ["7 plátanos", "1 kg tomates"] }, { group: "Despensa", items: ["500 g lentejas"] }], tips: ["Cuece lentejas para dos días."] }) + "\n```";
}
test("menú: crear con la IA, seguir la semana, compra y análisis", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = await openApp(page, { data: { "wk.food": { al: ["lactosa"], diet: "todo", goals: ["prot"], no: "setas" } } });
  await nav(page, "diary"); await page.locator('[data-dsh="menu"]').click();
  await page.locator('[data-act="menu-ppl+"]').click(); await page.locator('[data-mtime="30"]').click();
  await page.locator('[data-act="menu-copy"]').click();
  const q = await page.evaluate(() => navigator.clipboard.readText());
  for (const x of ["Comensales: 2", "30 min", "lactosa", "No me gusta: setas", "más proteína", "\"kind\":\"menu\"", "exactamente 7"]) expect(q).toContain(x);
  await page.evaluate(t => navigator.clipboard.writeText(t), aiMenu());
  await page.locator('[data-act="menu-clip"]').click();
  await expect(page.locator("#toast")).toContainText("Menú guardado");
  const today = (new Date().getDay() + 6) % 7;
  await expect(page.locator(`[data-mday="${today}"]`)).toHaveAttribute("aria-selected", "true");   // abre en hoy
  // ✓ comido → pasa a Comidas del día; ⇄ cambiado con motivo
  await page.locator(`[data-mst="${today}:l:ok"]`).click();
  await page.locator(`[data-mst="${today}:d:sw"]`).click(); await page.fill(`[data-msw="${today}:d"]`, "Pizza");
  await page.locator(`[data-mwhy="${today}:d:tiempo"]`).click();
  const k = key(new Date()), dy = (await ls(page, "wk.diary"))[k];
  expect(dy.meals).toEqual({ l: `Lentejas ${today}`, d: "Pizza" });
  // Cambiar un plato a mano y su receta
  await page.fill(`[data-mname="${today}:b"]`, "Tostadas con tomate");
  expect((await ls(page, "wk.menu")).days[today].meals.b.name).toBe("Tostadas con tomate");
  // Compra: marcar, añadir, quitar lo marcado
  await page.locator('[data-mtab="shop"]').click();
  await page.locator('[data-mshop="0:0"]').check(); await expect(page.locator(".mshop").first()).toContainText("7 plátanos");
  await page.fill("#mshopNew", "Pan integral"); await page.locator('[data-act="menu-shop-add"]').click();
  await page.locator('[data-act="menu-shop-clear"]').click();
  const shop = (await ls(page, "wk.menu")).shop;
  expect(shop.flatMap(g => g.items.map(x => x.t))).toEqual(["1 kg tomates", "500 g lentejas", "Pan integral"]);
  // Exportar: Markdown y PDF
  await page.locator('[data-mshop="0:0"]').check();
  let dl = page.waitForEvent("download"); await page.locator('[data-act="menu-shop-md"]').click();
  const md = await (await dl).createReadStream().then(s => new Promise(r => { let t = ""; s.on("data", c => t += c); s.on("end", () => r(t)); }));
  expect(md).toContain("# Lista de la compra"); expect(md).toContain("## Fruta y verdura\n\n- [x] 1 kg tomates"); expect(md).toContain("- [ ] Pan integral");
  dl = page.waitForEvent("download"); await page.locator('[data-act="menu-shop-pdf"]').click();
  const d2 = await dl; expect(d2.suggestedFilename()).toMatch(/\.pdf$/);
  const pdf = await d2.createReadStream().then(s => new Promise(r => { const b = []; s.on("data", c => b.push(c)); s.on("end", () => r(Buffer.concat(b).toString("latin1"))); }));
  expect(pdf.startsWith("%PDF-1.4")).toBe(true); expect(pdf).toContain("(Despensa) Tj"); expect(pdf).toContain("(Pan integral) Tj"); expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
  // Análisis: lleva el seguimiento; «PARA EL PRÓXIMO MENÚ» se guarda y entra en la siguiente pregunta
  await page.locator('[data-mtab="week"]').click();
  await page.locator('[data-act="menu-an-copy"]').click();
  const a = await page.evaluate(() => navigator.clipboard.readText());
  expect(a).toContain(`Lentejas ${today} → ✓`); expect(a).toContain(`Tortilla ${today} → ⇄ Pizza · sin tiempo`);
  await page.evaluate(() => navigator.clipboard.writeText("Bien.\n\n**PARA EL PRÓXIMO MENÚ:** cenas de menos de 15 minutos entre semana."));
  await page.locator('[data-act="menu-an-clip"]').click();
  await expect.poll(() => ls(page, "wk.menuNext")).toBe("cenas de menos de 15 minutos entre semana.");
  await page.locator('[data-act="menu-new"]').click();
  await page.locator('[data-act="menu-copy"]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Cambios pedidos tras la semana anterior: cenas de menos de 15 minutos");
  expect(errors).toEqual([]);
});
test("menú a mano y «Apuntar lo del menú» en Comidas", async ({ page }) => {
  const errors = await openApp(page, {});
  await nav(page, "diary"); await page.locator('[data-dsh="menu"]').click();
  await page.locator('[data-act="menu-hand"]').click();
  const today = (new Date().getDay() + 6) % 7;
  await page.fill(`[data-mname="${today}:b"]`, "Avena"); await page.fill(`[data-mname="${today}:l"]`, "Garbanzos");
  await page.locator('[data-act="dsheet-close"]').first().click();
  await expect(page.locator('[data-dsh="menu"]')).toContainText("Avena · Garbanzos");
  await page.locator('[data-dsh="food"]').click(); await page.locator('[data-act="menu-fill"]').click();
  await expect(page.locator("#fm_b")).toHaveValue("Avena"); await expect(page.locator("#fm_l")).toHaveValue("Garbanzos");
  expect(errors).toEqual([]);
});
