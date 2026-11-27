// Diario → Menú de la semana: pregunta para la IA, pegar el JSON, seguimiento (✓ ✗ ⇄ y motivo), lista de la compra y análisis
import { createRequire } from "node:module"; const require = createRequire(import.meta.url);
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
test("menú: compartir por enlace y archivo, importar (archivo, Ajustes, Compartir con Usus) y publicar en Nostr", async ({ page, context, browser }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = await openApp(page, {});
  await nav(page, "diary"); await page.locator('[data-dsh="menu"]').click();
  await page.evaluate(t => navigator.clipboard.writeText(t), aiMenu()); await page.locator('[data-act="menu-clip"]').click();
  const today = (new Date().getDay() + 6) % 7;
  await page.locator(`[data-mst="${today}:l:ok"]`).click();                                   // el seguimiento no viaja
  // Archivo .json
  let dl = page.waitForEvent("download"); await page.locator('[data-act="menu-sh-file"]').click();
  const file = await (await dl).path(); const j = JSON.parse(require("node:fs").readFileSync(file, "utf8"));
  expect(j.kind).toBe("menu"); expect(j.days).toHaveLength(7); expect(JSON.stringify(j)).not.toContain('"st"');
  // Enlace (#m=): en otro móvil, abrirlo añade el menú
  await page.evaluate(() => { navigator.share = async d => { window.__sh = d; }; });
  await page.locator('[data-act="menu-sh-link"]').click();
  await expect.poll(() => page.evaluate(() => window.__sh?.url || "")).toContain("#m=");
  const link = await page.evaluate(() => window.__sh.url);
  const p2 = await context.newPage(); const e2 = await openApp(p2, {});
  await p2.goto(link.slice(link.indexOf("http"))); await p2.waitForTimeout(800);
  await expect.poll(async () => ((await ls(p2, "wk.menu")) || {}).days?.length).toBe(7);
  await expect(p2.locator("[data-mname$=\":l\"]")).toHaveValue(/Lentejas/);
  expect(e2).toEqual([]);
  // Archivo en Ajustes → Importar (otro perfil vacío) y Compartir con Usus (la respuesta de la IA tal cual)
  const p3 = await context.newPage(); await openApp(p3, {});
  await p3.evaluate(t => window.ususReceive(t), aiMenu());
  await expect.poll(async () => ((await ls(p3, "wk.menu")) || {}).days?.length).toBe(7);
  const p4 = await context.newPage(); await openApp(p4, {});
  await nav(p4, "data"); await p4.locator('[data-stab="datos"]').click();
  await p4.locator("#impFile").setInputFiles(file);
  await expect.poll(async () => ((await ls(p4, "wk.menu")) || {}).days?.length).toBe(7);
  // Markdown y PDF de la semana
  dl = page.waitForEvent("download"); await page.locator('[data-act="menu-sh-md"]').click();
  const md = require("node:fs").readFileSync(await (await dl).path(), "utf8"); expect(md).toContain("# Menú de la semana"); expect(md).toContain("### Comida: Lentejas"); expect(md).toContain("## Lista de la compra");
  dl = page.waitForEvent("download"); await page.locator('[data-act="menu-sh-pdf"]').click();
  expect(require("node:fs").readFileSync(await (await dl).path(), "latin1").startsWith("%PDF")).toBe(true);
  // Nostr sin cuenta: lleva a conectarla
  await page.locator('[data-act="menu-sh-nostr"]').click();
  await expect(page.locator('[data-act="ns-connect"]')).toBeVisible();
  expect(errors).toEqual([]);
});
test("ayuno intermitente: en el perfil, en el menú (ventana, seguimiento y análisis) y en Comidas", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = await openApp(page, {});
  await nav(page, "data"); await page.locator('[data-stab="perfil"]').click();
  await page.locator('[data-ffold="fast"] summary').click(); await page.locator('[data-fastt="16:8"]').click();
  await expect(page.locator('[data-ffold="fast"]')).toHaveAttribute("open", "");               // sigue abierto
  await page.fill("#fastFrom", "13:00"); await page.locator("#fastFrom").dispatchEvent("change");
  await expect(page.locator('[data-fsum="fast"]')).toContainText("16:8 · 13:00–21:00");
  expect((await ls(page, "wk.food")).fast).toEqual({ type: "16:8", from: "13:00", days: "all" });
  // La pregunta del menú lleva la ventana y sus reglas
  await nav(page, "diary"); await page.locator('[data-dsh="menu"]').click();
  await page.locator('[data-act="menu-copy"]').click();
  const q = await page.evaluate(() => navigator.clipboard.readText());
  for (const x of ["Ayuno intermitente: 16:8. Ventana para comer: de 13:00 a 21:00. Días con ayuno: todos.", "TODAS las comidas dentro de la ventana", "\"fasting\":{\"type\":\"16:8\"", "\"fast\":true"]) expect(q).toContain(x);
  // Menú de la IA con ayuno: sin desayuno, hora de cada comida
  const j = JSON.parse(aiMenu().replace(/^[^{]*/, "").replace(/```\s*$/, ""));
  j.days.forEach(d => { d.fast = true; d.window = { from: "13:00", to: "21:00" }; d.meals.b.name = ""; d.meals.l.at = "13:15"; });
  await page.evaluate(t => navigator.clipboard.writeText(t), JSON.stringify(j)); await page.locator('[data-act="menu-clip"]').click();
  const today = (new Date().getDay() + 6) % 7;
  await expect(page.locator(".mfast")).toContainText("13:00 a 21:00");
  await expect(page.locator(`[data-mname="${today}:b"]`)).toHaveCount(0);                     // el hueco vacío no sale
  await expect(page.locator(".mmeal").first()).toContainText("13:15");
  await page.locator(`[data-fst="${today}:ok"]`).click();
  await expect(page.locator(".mfast")).toHaveClass(/st-ok/);                        // USU-003: en verde, como los platos
  expect(await page.locator(`[data-fst="${today}:ok"]`).evaluate(e => getComputedStyle(e).borderColor)).not.toBe(await page.locator(`[data-fst="${today}:no"]`).evaluate(e => getComputedStyle(e).borderColor));
  await page.locator(`[data-fst="${today}:no"]`).click();
  await expect(page.locator(".mfast")).toHaveClass(/st-no/); await page.fill(`[data-fbat="${today}"]`, "11:30"); await page.locator(`[data-fbat="${today}"]`).dispatchEvent("change");
  await page.locator(`[data-fbr="${today}:hambre"]`).click();
  await page.locator('[data-act="menu-an-copy"]').click();
  const a = await page.evaluate(() => navigator.clipboard.readText());
  expect(a).toContain("AYUNO"); expect(a).toMatch(/\(13:00–21:00\): ✗ roto a las 11:30 · hambre/);
  // Comidas: la ventana como referencia y en «¿Qué como?»
  await page.locator('[data-act="dsheet-close"]').first().click(); await page.locator('[data-dsh="food"]').click();
  await expect(page.locator(".fwin")).toContainText("Ayuno 16:8 · comes de 13:00 a 21:00");
  await page.locator(".aiq > summary").click(); await page.locator('[data-act="food-copy"]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("como solo de 13:00 a 21:00");
  expect(errors).toEqual([]);
});
test("menú de 4 semanas: la IA escribe 2 que se repiten, compra por semanas con despensa, análisis por semana", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = await openApp(page);
  await nav(page, "diary"); await page.locator('[data-dsh="menu"]').click();
  await page.locator('[data-mweeks="4"]').click();
  await expect(page.locator('[data-mweeks="4"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-act="menu-copy"]').click();
  const q = await page.evaluate(() => navigator.clipboard.readText());
  for (const x of ["menú de 4 semanas", "(4 semanas, de lunes a domingo)", "\"weeks\":4", "\"repeat\":true", "exactamente 14", "\"week\":0", "POR SEMANAS"]) expect(q).toContain(x);
  const m = monday(), days = Array.from({ length: 14 }, (_, i) => { const d = new Date(m); d.setDate(m.getDate() + i);
    return { date: key(d), train: false, meals: { b: { name: "Desayuno " + i }, l: { name: "Comida " + i }, s: { name: "" }, d: { name: "Cena " + i } } }; });
  const json = JSON.stringify({ app: "usus", kind: "menu", version: 1, start: key(m), weeks: 4, repeat: true, people: 1, days,
    shopping: [{ week: 0, group: "Despensa", items: ["1 kg arroz"] }, { week: 1, group: "Fruta", items: ["Manzanas"] }, { week: 2, group: "Fruta", items: ["Peras"] }] });
  await page.evaluate(t => navigator.clipboard.writeText(t), json);
  await page.locator('[data-act="menu-clip"]').click();
  await expect(page.locator("#toast")).toContainText("Menú guardado");
  const st = await ls(page, "wk.menu");
  expect(st.days.length).toBe(28);
  expect(st.days[16].meals.l.name).toBe("Comida 2"); expect(st.days[27].meals.d.name).toBe("Cena 13");
  expect(st.shop.map(g => `${g.w}:${g.items[0].t}`)).toEqual(["0:1 kg arroz", "1:Manzanas", "2:Peras", "3:Manzanas", "4:Peras"]);
  // Selector de semana: la 3 enseña sus 7 días
  await page.locator('[data-mw="2"]').click();
  await expect(page.locator("[data-mday]")).toHaveCount(7);
  await expect(page.locator('[data-mday="14"]')).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[data-mname="14:l"]')).toHaveValue("Comida 0");
  await page.locator('[data-mst="14:l:ok"]').click();
  await expect(page.locator(".wh", { hasText: "Analizar la semana 3" })).toBeVisible();
  await page.locator('[data-act="menu-an-copy"]').click();
  const a = await page.evaluate(() => navigator.clipboard.readText());
  expect(a).toContain("Semana 3 de 4 del menú"); expect(a).toContain("Comida 0 → ✓"); expect(a).not.toContain("Comida 7");
  // Compra por semanas
  await page.locator('[data-mtab="shop"]').click();
  await page.locator('[data-mshw="0"]').click(); await expect(page.locator(".mshop")).toHaveCount(1); await expect(page.locator(".mshop")).toContainText("1 kg arroz");
  await page.locator('[data-mshw="4"]').click(); await expect(page.locator(".mshop")).toContainText("Peras");
  await page.fill("#mshopNew", "Pan"); await page.locator('[data-act="menu-shop-add"]').click();
  expect((await ls(page, "wk.menu")).shop.find(g => g.g === "Otros").w).toBe(4);
  let dl = page.waitForEvent("download"); await page.locator('[data-act="menu-shop-md"]').click();
  const md = await (await dl).createReadStream().then(s => new Promise(r => { let t = ""; s.on("data", c => t += c); s.on("end", () => r(t)); }));
  expect(md).toContain("Semana 4 ·"); expect(md).toContain("- [ ] Peras"); expect(md).not.toContain("arroz");
  // Menú entero en Markdown: un apartado por semana y todas las listas
  await page.locator('[data-mtab="week"]').click();
  dl = page.waitForEvent("download"); await page.locator('[data-act="menu-sh-md"]').click();
  const all = await (await dl).createReadStream().then(s => new Promise(r => { let t = ""; s.on("data", c => t += c); s.on("end", () => r(t)); }));
  for (const x of ["# Menú de 4 semanas", "## Semana 1 ·", "## Semana 4 ·", "### Despensa", "### Semana 2", "- [ ] 1 kg arroz"]) expect(all).toContain(x);
  // El JSON que se comparte lleva las 4 semanas y vuelve a entrar igual
  dl = page.waitForEvent("download"); await page.locator('[data-act="menu-sh-file"]').click();
  const j = JSON.parse(await (await dl).createReadStream().then(s => new Promise(r => { let t = ""; s.on("data", c => t += c); s.on("end", () => r(t)); })));
  expect(j.weeks).toBe(4); expect(j.days.length).toBe(28); expect(j.shopping.filter(g => g.week === 0).length).toBe(1);
  expect(errors).toEqual([]);
});
