// Nostr: conectar con bunker, copia cifrada (guardar y recuperar) y publicar entreno y rutinas.
// El firmante y los relays se simulan (window.UsusNostr): las pruebas no salen a Internet.
import { test, expect } from "@playwright/test";
import { openApp, nav, ls, ROUTINES } from "./helpers.mjs";
const PK = "a".repeat(64), BUNKER = "bunker://" + "b".repeat(64) + "?relay=wss%3A%2F%2Frelay.test";
const CFG = { bp: { pubkey: "b".repeat(64), relays: ["wss://relay.test"] }, sk: "1".repeat(64), pubkey: PK, npub: "npub1prueba000000000000", name: "Alex", relays: ["wss://relay.test"], blossom: [] };
async function mockNostr(page, events = []) {
  await page.addInitScript(([pk, evs]) => {
    window.__ev = evs; window.__calls = [];
    const dOf = e => (e.tags.find(t => t[0] === "d") || [])[1];
    window.UsusNostr = {
      on: false,
      async connect(v) { window.__calls.push("connect"); this.on = true; return { pubkey: pk, sk: "1".repeat(64), bp: { pubkey: "b".repeat(64), relays: ["wss://relay.test"] } }; },
      resume() { this.on = true; }, active() { return this.on; }, async disconnect() { this.on = false; },
      async sign(ev) { window.__calls.push("sign:" + ev.kind); return { ...ev, pubkey: pk, id: (Math.random().toString(16).slice(2) + "0".repeat(64)).slice(0, 64), sig: "x" }; },
      async encrypt(_, t) { window.__calls.push("encrypt"); return "enc:" + t; },
      async decrypt(_, t) { window.__calls.push("decrypt"); return t.slice(4); },
      async publish(_, ev) { const d = dOf(ev); window.__ev = window.__ev.filter(e => !(d && e.kind === ev.kind && dOf(e) === d)); window.__ev.push(ev); return ev; },
      async get(_, f) { const l = window.__ev.filter(e => (!f.kinds || f.kinds.includes(e.kind)) && (!f["#d"] || f["#d"].includes(dOf(e)))); return l[l.length - 1] || null; },
      async query() { return []; },
      npub: h => "npub1prueba" + h.slice(0, 10), nevent: id => "nevent1" + id.slice(0, 12)
    };
  }, [PK, events]);
}
async function openShare(page) {   // Diario → Entreno → la sesión → Compartir
  await nav(page, "diary"); await page.getByRole("button", { name: /^Entreno/ }).first().click();
  const sum = page.locator("details.sess summary").first(); if (await sum.count()) await sum.click();
  await page.locator('[data-shsess="s1"]').first().click(); await expect(page.locator("#shT")).toBeVisible();
}
test("conectar con el bunker y guardar la copia cifrada; recuperarla en otro perfil vacío", async ({ page, context }) => {
  await mockNostr(page);
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES } });
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.locator('[data-act="ns-go-set"]').click();                         // la cuenta va en Perfil
  await page.fill("#nsBunker", "hola"); await page.locator('[data-act="ns-connect"]').click();
  await expect(page.locator("#toast")).toContainText("bunker://");               // dirección no válida
  await page.fill("#nsBunker", BUNKER); await page.locator('[data-act="ns-connect"]').click();
  await expect(page.locator(".nsprof")).toContainText("npub1prueba");
  expect((await ls(page, "wk.nostr")).pubkey).toBe(PK);
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.locator('[data-act="ns-bk-save"]').click();
  await expect(page.locator("#toast")).toContainText("Copia guardada en Nostr");
  const evs = await page.evaluate(() => window.__ev);
  const man = evs.find(e => e.tags[0][1] === "usus/backup"), parts = evs.filter(e => /^usus\/backup\/\d+$/.test(e.tags[0][1]));
  expect(man.kind).toBe(30078); expect(parts.length).toBeGreaterThan(0);
  expect(evs.every(e => e.content.startsWith("enc:"))).toBe(true);                // todo pasa por el cifrado del firmante
  expect(JSON.parse(man.content.slice(4)).parts).toBe(parts.length);
  expect(evs.some(e => e.content.includes("B · Empuje"))).toBe(false);           // nada en claro
  expect(errors).toEqual([]);
  // Otro móvil: sin rutinas, misma cuenta → recupera la copia
  const p2 = await context.newPage(); await mockNostr(p2, evs);
  const e2 = await openApp(p2, { data: { "wk.nostr": CFG } });
  await nav(p2, "data"); await p2.locator('[data-stab="datos"]').click();
  await p2.locator('[data-act="ns-bk-load"]').click();
  await expect.poll(async () => ((await ls(p2, "wk.routines")) || []).map(r => r.name)).toContain("B · Empuje");
  expect(e2).toEqual([]);
});
test("publicar el entreno con imagen (Blossom) y las rutinas con su enlace", async ({ page }) => {
  await mockNostr(page);
  await page.route("https://blossom.primal.net/upload", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "https://blossom.primal.net/abc.png" }) }));
  const S = { id: "s1", start: Date.now() - 36e5, end: Date.now() - 33e5, routine: "B · Empuje", block: "empuje", exercises: [{ name: "Fondos", type: "reps", sets: [{ w: 0, r: 8, done: true }] }] };
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES, "wk.sessions": [S], "wk.nostr": CFG } });
  await openShare(page);
  await page.locator('[data-act="shsess-nostr"]').click();
  await expect(page.locator("#nsText")).toHaveValue(/B · Empuje/);
  await page.fill("#nsText", "Hoy, fondos. #calistenia"); await page.locator("#nsImg").check();
  await page.locator('[data-act="ns-post-go"]').click();
  await expect(page.locator("#npT")).toBeVisible(); await expect(page.locator(".modal:has(#npT)")).toContainText("Publicado en Nostr");
  let note = (await page.evaluate(() => window.__ev)).find(e => e.kind === 1);
  expect(note.content).toContain("Hoy, fondos."); expect(note.content).toContain("https://blossom.primal.net/abc.png");
  expect(note.tags.some(t => t[0] === "imeta")).toBe(true);
  expect(await page.evaluate(() => window.__calls)).toContain("sign:24242");        // permiso de subida firmado
  for (let i = 0; i < 4 && await page.locator(".modal").count(); i++) await page.locator(".modal .mhead .mic").last().click();   // cerrar ventanas
  await nav(page, "routines"); await page.locator('[data-act="rs-open"]').first().click();
  await page.locator('[data-act="rs-nostr"]').click();
  await expect(page.locator("#nsText")).toHaveValue(/#r=/);
  await page.locator('[data-act="ns-post-go"]').click(); await expect(page.locator(".modal:has(#npT)")).toContainText("Publicado en Nostr");
  note = (await page.evaluate(() => window.__ev)).filter(e => e.kind === 1).pop();
  expect(note.content).toContain("#r=");
  expect(errors).toEqual([]);
});
test("sin cuenta: publicar lleva a conectarla en Ajustes", async ({ page }) => {
  const S = { id: "s1", start: Date.now() - 36e5, end: Date.now() - 33e5, routine: "B · Empuje", block: "empuje", exercises: [{ name: "Fondos", type: "reps", sets: [{ w: 0, r: 8, done: true }] }] };
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES, "wk.sessions": [S] } });
  await openShare(page);
  await page.locator('[data-act="shsess-nostr"]').click(); await page.locator('[data-act="ns-go-set"]').click();
  await expect(page.locator("#nsBunker")).toBeVisible();
  expect(await page.evaluate(() => !!document.querySelector('script[src="nostr.js"]'))).toBe(false);   // sin usar Nostr no se carga nada
  expect(errors).toEqual([]);
});
test("sincronizar: copia sola al terminar la sesión y aviso al abrir si hay una más nueva", async ({ page, context }) => {
  await mockNostr(page);
  const R = [{ id: "rn", name: "Corta", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [{ name: "Flexión", sets: 1, reps: 5, type: "reps" }] }];
  const errors = await openApp(page, { data: { "wk.routines": R, "wk.nostr": CFG, "wk.effort": { pem: false, rir: false } } });
  await page.locator('[data-start="rn"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click();
  await page.locator('[data-done="0:0"]').click(); await page.locator('[data-act="finish"]').click();
  await expect(page.locator("#toast")).toContainText("Copia guardada en Nostr");                  // sin preguntar
  const evs = await page.evaluate(() => window.__ev);
  expect(evs.some(e => e.tags[0]?.[1] === "usus/backup")).toBe(true);
  expect(errors).toEqual([]);
  // Otro dispositivo: la copia de Nostr es más nueva que lo último guardado aquí → aviso en Hoy
  const p2 = await context.newPage(); await mockNostr(p2, evs);
  const e2 = await openApp(p2, { data: { "wk.routines": R, "wk.nostr": { ...CFG, lastBk: 0, seen: 0 } } });
  await expect(p2.locator(".prow", { hasText: "Copia más nueva en Nostr" })).toBeVisible();
  await p2.locator('[data-act="ns-newer-x"]').click();
  await expect(p2.locator(".prow", { hasText: "Copia más nueva en Nostr" })).toHaveCount(0);
  expect((await ls(p2, "wk.nostr")).seen).toBeGreaterThan(0);                                         // no vuelve a avisar de esa
  expect(e2).toEqual([]);
});
test("perfil de Nostr: foto, nombre, nip05, datos y clave pública copiable", async ({ page }) => {
  const k0 = { kind: 0, tags: [], created_at: 1, content: JSON.stringify({ display_name: "Alex Nostr", name: "alex", nip05: "alex@usus.test", about: "Calistenia y café.", lud16: "alex@ln.test" }) };
  const k3 = { kind: 3, tags: [["p", "x"], ["p", "y"], ["p", "z"]], created_at: 1, content: "" };
  await mockNostr(page, [k0, k3]);
  const errors = await openApp(page, { data: { "wk.nostr": CFG } });
  await nav(page, "data"); await page.locator('[data-stab="perfil"]').click();
  await expect(page.locator(".nsprof .nsname")).toHaveText("Alex Nostr");
  await expect(page.locator(".nsprof")).toContainText("✓ alex@usus.test");
  await expect(page.locator(".nsstats")).toContainText("3");
  await expect(page.locator(".nsprof")).toContainText("⚡ alex@ln.test");
  expect(errors).toEqual([]);
});
