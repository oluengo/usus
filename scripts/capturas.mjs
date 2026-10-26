// Capturas para la ficha de la tienda (fastlane): Hoy, entrenando, cuenta atrás y progreso, con datos inventados, en castellano, català e inglés.
// Uso: node scripts/capturas.mjs [es ca en]   (PW_CHROMIUM=/ruta/a/chrome si Playwright no trae su navegador)
// Salida: fastlane/metadata/android/<idioma>/images/phoneScreenshots/NN-nombre.jpg (540×1170)
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, readFileSync } from "node:fs";
const VERSION = /const APP_VERSION = "([\d.]+)"/.exec(readFileSync("index.html", "utf8"))[1];

const PORT = 4399, BASE = `http://localhost:${PORT}/`;
const LOCS = { es: "es-ES", ca: "ca", en: "en-US" };
const langs = process.argv.slice(2).filter(l => LOCS[l]); if (!langs.length) langs.push("es", "ca", "en");
const NOW = new Date("2026-10-23T08:40:00");
const DAY = 864e5, day0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const key = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/* Datos de ejemplo (inventados): dos variantes A/B de torso y pierna, una diaria de core y 10 semanas de historial */
const NAMES = {
  es: { up: "Torso", lo: "Pierna", core: "Diaria · Core", plan: "Bloque otoño", note: "Buen día: fondos más limpios." },
  ca: { up: "Tors", lo: "Cama", core: "Diària · Core", plan: "Bloc tardor", note: "Bon dia: fons més nets." },
  en: { up: "Upper", lo: "Lower", core: "Daily · Core", plan: "Autumn block", note: "Good day: cleaner dips." }
};
const X = (xid, sets, reps, type = "reps", extra = {}) => ({ name: xid, xid, sets, reps, type, rest: 90, ...extra });
function data(lang) {
  const n = NAMES[lang];
  const R = [
    { id: "ra1", name: `A · ${n.up}`, block: "empuje", variant: "A", days: [1], exercises: [X("flexion", 3, 12), X("remo-invertido", 3, 10), X("pike-pushup", 3, 8), X("hollow-hold", 3, 30, "time", { rest: 45 })] },
    { id: "ra2", name: `A · ${n.lo}`, block: "pierna", variant: "A", days: [3], exercises: [X("sentadilla", 3, 15), X("zancada", 3, 10, "reps", { sides: true }), X("puente-gluteo", 3, 15), X("plancha-lateral", 2, 30, "time", { sides: true, rest: 45 })] },
    { id: "rb1", name: `B · ${n.up}`, block: "empuje", variant: "B", days: [1], exercises: [X("fondos-paralelas", 3, 8, "reps", { restAfter: 120 }), X("dominada-negativa", 3, 5), X("flexion", 3, 15), X("plancha", 3, 45, "time", { rest: 45 })] },
    { id: "rb2", name: `B · ${n.lo}`, block: "pierna", variant: "B", days: [3], exercises: [X("sentadilla-bulgara", 3, 8, "reps", { sides: true }), X("puente-una-pierna", 3, 10, "reps", { sides: true }), X("colgarse-barra", 3, 30, "time")] },
    { id: "rc", name: n.core, block: "core", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [X("plancha", 1, 60, "time"), X("hollow-hold", 1, 30, "time")] }
  ];
  const start = day0(NOW) - 9 * 7 * DAY - ((new Date(NOW).getDay() + 6) % 7) * DAY;   // lunes, hace 9 semanas
  const S = [], W = [], D = {}; let id = 1;
  for (let w = 0; w < 10; w++) {
    const v = Math.floor(w / 2) % 2 ? "B" : "A", up = R.find(r => r.name === `${v} · ${n.up}`), lo = R.find(r => r.name === `${v} · ${n.lo}`);
    const core = R.find(r => r.id === "rc");
    for (const [r, off] of [[up, 0], [core, 1], [lo, 2], [core, 3], [core, 5]]) {
      const t = start + (w * 7 + off) * DAY + 18 * 3600e3; if (t > day0(NOW)) continue;
      const g = Math.floor(w / 2);   // progresión suave
      S.push({ id: "s" + id++, start: t, end: t + 48 * 60e3, rid: r.id, routine: r.name, block: r.block, exercises: r.exercises.map(e => ({ name: e.name, xid: e.xid, type: e.type, sides: !!e.sides,
        sets: Array.from({ length: e.sets }, (_, j) => ({ w: 0, r: e.type === "time" ? e.reps + g * 5 - j * 5 : Math.max(3, e.reps - 2 + g - j), done: true })) })) });
    }
    W.push({ id: "w" + w, t: start + w * 7 * DAY + 7 * 3600e3, kg: +(76.4 - w * 0.25 + (w % 3) * 0.1).toFixed(1) });
  }
  for (let k = 0; k < 21; k++) { const t = day0(NOW) - k * DAY; D[key(t)] = { sleep: { bed: k % 3 ? "23:10" : "23:40", wake: "07:00", q: 3 + (k % 3 === 0 ? 1 : 0) }, steps: 6500 + ((k * 1373) % 5200) }; }
  D[key(day0(NOW) - DAY)].note = n.note;
  const plan = { enabled: true, order: true, name: n.plan, start: key(start), review: key(start + 16 * 7 * DAY), phases: [{ id: "p1", variant: "A", weeks: 2 }, { id: "p2", variant: "B", weeks: 2 }], deload: { weeks: 1, every: 8 }, up: true };
  return { "wk.routines": R, "wk.sessions": S, "wk.weights": W, "wk.diary": D, "wk.plan": plan, "wk.lang": lang, "wk.catalog": true, "wk.equip": ["barra", "paralelas"],
    "wk.profiles": [{ id: "main", name: "Alex", sex: "m", color: "#2446C7" }], "wk.effort": { pem: true, rir: false }, "wk.fx": "off", "wk.lastBackup": NOW.getTime() - 2 * DAY };
}

const srv = spawn(process.execPath, ["tests/serve.mjs", String(PORT)], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 600));
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
try {
  for (const lang of langs) {
    const dir = `fastlane/metadata/android/${LOCS[lang]}/images/phoneScreenshots`;
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true, locale: LOCS[lang] });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.error(lang, e.message)); page.on("dialog", d => d.accept());
    const seed = { "wk.welcomed": true, "wk.seenVersion": VERSION, ...data(lang) };
    await page.addInitScript(d => { if (!sessionStorage.__seed) { sessionStorage.__seed = 1; localStorage.clear(); for (const k in d) localStorage.setItem(k, JSON.stringify(d[k])); } }, seed);
    await page.clock.install({ time: NOW });
    await page.goto(BASE); await page.clock.runFor(1500);
    const shot = async name => { await page.clock.runFor(400); await page.screenshot({ path: `${dir}/${name}.jpg`, type: "jpeg", quality: 86 }); };
    const tab = async t => { await page.locator(`nav [data-tab="${t}"]`).click(); await page.evaluate(() => window.scrollTo(0, 0)); };
    await shot("01-hoy");
    await tab("stats"); await shot("04-progreso");
    // Entrenar: sesión A · Torso, con la primera serie hecha, y el descanso antes del siguiente ejercicio
    await tab("train"); await page.locator('[data-start="ra1"]').first().click(); await page.locator('[data-act="sess-begin"]').click(); await page.clock.runFor(800);
    await page.locator('[data-done="0:0"]').click(); await page.clock.runFor(30000);
    if (await page.locator(".focus").count()) await page.locator('.focus [data-act="run-skip"]').click();
    await page.clock.runFor(500); await shot("02-entrenando");
    for (const j of [1, 2]) { await page.locator(`[data-done="0:${j}"]`).click(); await page.clock.runFor(600); if (j < 2 && await page.locator(".focus").count()) await page.locator('.focus [data-act="run-skip"]').click(); }
    await page.clock.runFor(20000); await shot("03-cuenta-atras");
    await ctx.close(); console.log(`capturas ${lang} → ${dir}`);
  }
} finally { await browser.close(); srv.kill(); }
