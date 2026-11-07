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
      async sign(ev) { window.__calls.push("sign:" + ev.kind); (window.__d ||= []).push(dOf(ev)); return { ...ev, pubkey: pk, id: (Math.random().toString(16).slice(2) + "0".repeat(64)).slice(0, 64), sig: "x" }; },
      async encrypt(_, t) { window.__calls.push("encrypt"); return "enc:" + t; },
      async decrypt(_, t) { window.__calls.push("decrypt"); return t.slice(4); },
      async publish(_, ev) { const d = dOf(ev); window.__ev = window.__ev.filter(e => !(d && e.kind === ev.kind && dOf(e) === d)); window.__ev.push(ev); return ev; },
      async get(_, f) { const l = window.__ev.filter(e => (!f.kinds || f.kinds.includes(e.kind)) && (!f["#d"] || f["#d"].includes(dOf(e)))); return l[l.length - 1] || null; },
      async query(_, f) { return window.__ev.filter(e => (!f.kinds || f.kinds.includes(e.kind)) && (!f["#d"] || f["#d"].includes(dOf(e)))); },
      npub: h => "npub1prueba" + h.slice(0, 10), nevent: id => "nevent1" + id.slice(0, 12)
    };
  }, [PK, events]);
}
async function openShare(page) {   // Diario → Entreno → la sesión → Compartir
  await nav(page, "diary"); await page.getByRole("button", { name: /^Entreno/ }).first().click();
  const sum = page.locator("details.sess summary").first(); if (await sum.count()) await sum.click();
  await page.locator('[data-shsess="s1"]').first().click(); await expect(page.locator("#shT")).toBeVisible();
}
test("conectar con el bunker y guardar la copia cifrada por apartados; recuperarla en otro móvil vacío", async ({ page, context }) => {
  await mockNostr(page);
  const LOG = [{ t: 1700000000000, rid: "r1", from: "flexion", to: "flexion-diamante", dir: "up" }];
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES, "wk.equip": ["barra", "anillas"], "wk.restDefault": 75, "wk.progLog": LOG,
    "wk.sessions": [{ id: "s1", start: Date.now() - 864e5, end: Date.now() - 864e5 + 3e6, rid: "r1", routine: "A", exercises: [] }] } });
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.locator('[data-act="ns-go-set"]').click();                         // la cuenta va en su propio apartado
  await page.fill("#nsBunker", "hola"); await page.locator('[data-act="ns-connect"]').click();
  await expect(page.locator("#toast")).toContainText("bunker://");               // dirección no válida
  await page.fill("#nsBunker", BUNKER); await page.locator('[data-act="ns-connect"]').click();
  await expect(page.locator(".nsprof")).toContainText("npub1prueba");
  expect((await ls(page, "wk.nostr")).pubkey).toBe(PK);
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.locator('[data-act="ns-bk-save"]').click();
  await expect(page.locator("#nbT")).toHaveText("Guardar copia en Nostr");
  await expect(page.locator("[data-nsbks]:checked")).toHaveCount(4);            // los cuatro apartados, por defecto
  await page.locator('[data-act="ns-bk-go"]').click();
  await expect(page.locator("#toast")).toContainText("Copia guardada en Nostr");
  const evs = await page.evaluate(() => window.__ev), ds = evs.map(e => e.tags[0][1]);
  for (const k of ["rut", "ent", "dia", "aj"]) {                                  // cada apartado, en su sitio y por perfil
    const man = evs.find(e => e.tags[0][1] === "usus/p/main/" + k); expect(man.kind).toBe(30078);
    expect(JSON.parse(man.content.slice(4)).parts).toBe(ds.filter(d => d.startsWith("usus/p/main/" + k + "/")).length);
  }
  expect(evs.every(e => e.content.startsWith("enc:"))).toBe(true);                // todo pasa por el cifrado del firmante
  expect(evs.some(e => e.content.includes("B · Empuje"))).toBe(false);           // nada en claro
  expect(errors).toEqual([]);
  // Otro móvil: sin rutinas, misma cuenta → recupera la copia
  const p2 = await context.newPage(); await mockNostr(p2, evs);
  const e2 = await openApp(p2, { data: { "wk.nostr": CFG } });
  await nav(p2, "data"); await p2.locator('[data-stab="datos"]').click();
 
  await p2.locator('[data-act="ns-bk-load"]').click();
  await expect(p2.locator("#nbT")).toHaveText("Recuperar de Nostr");
  await expect(p2.locator("[data-nsbks]:checked")).toHaveCount(4);
  await p2.locator('[data-act="ns-bk-go"]').click();
  await expect.poll(async () => ((await ls(p2, "wk.routines")) || []).map(r => r.name)).toContain("B · Empuje");
  expect((await ls(p2, "wk.sessions")).length).toBe(1);                                    // entrenos
  expect(await ls(p2, "wk.equip")).toEqual(["barra", "anillas"]);                         // ajustes
  expect(await ls(p2, "wk.restDefault")).toBe(75);
  expect((await ls(p2, "wk.progLog"))[0].to).toBe("flexion-diamante");                   // historial de progresión
  expect(e2).toEqual([]);
  // Solo un apartado: los ajustes, sin traer rutinas
  const p3 = await context.newPage(); await mockNostr(p3, evs);
  await openApp(p3, { data: { "wk.nostr": CFG, "wk.routines": [] } });
  await nav(p3, "data"); await p3.locator('[data-stab="datos"]').click();
  await p3.locator('[data-act="ns-bk-load"]').click();
  for (const k of ["rut", "ent", "dia"]) await p3.locator(`[data-nsbks="${k}"]`).uncheck();
  await p3.locator('[data-act="ns-bk-go"]').click();
  await expect.poll(async () => ls(p3, "wk.equip")).toEqual(["barra", "anillas"]);
  expect((await ls(p3, "wk.routines")) || []).toHaveLength(0);
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
  expect(evs.some(e => e.tags[0]?.[1] === "usus/p/main/ent")).toBe(true);
  // La siguiente copia automática solo guarda lo que ha cambiado (los ajustes, no)
  await page.evaluate(() => { window.__d = []; });
  if (await page.locator('[data-act="saved-close"]').count()) await page.locator('[data-act="saved-close"]').first().click();
  await nav(page, "train"); await page.locator('[data-start="rn"]:visible').first().click(); await page.locator('[data-act="sess-begin"]').click();
  await page.locator('[data-done="0:0"]').click(); await page.locator('[data-act="finish"]').click();
  await expect.poll(() => page.evaluate(() => window.__d.includes("usus/p/main/ent"))).toBe(true);
  expect(await page.evaluate(() => window.__d.some(d => /\/(aj|rut)(\/|$)/.test(d)))).toBe(false);
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
test("cuenta de Nostr: foto, nombre, nip05 y clave pública copiable, como en Wavestr", async ({ page }) => {
  const k0 = { kind: 0, tags: [], created_at: 1, content: JSON.stringify({ display_name: "Alex Nostr", name: "alex", nip05: "alex@usus.test", about: "Calistenia y café.", lud16: "alex@ln.test" }) };
  const k3 = { kind: 3, tags: [["p", "x"], ["p", "y"], ["p", "z"]], created_at: 1, content: "" };
  await mockNostr(page, [k0, k3]);
  const errors = await openApp(page, { data: { "wk.nostr": CFG } });
  await nav(page, "data");
  await expect(page.locator('[data-stab="nostr"]')).toContainText("Alex");               // en la lista de Ajustes, con su nombre
  await page.locator('[data-stab="nostr"]').click();
  await expect(page.locator(".nsprof .nsacc b")).toHaveText("Alex Nostr");
  await expect(page.locator(".nsprof")).toContainText("✓ alex@usus.test");
  await expect(page.locator(".nsprof")).toContainText("⚡ alex@ln.test");
  await expect(page.locator(".nsban")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("APK: entrar con Amber (NIP-55) y firmar; la firma se comprueba", async ({ page }) => {
  // Amber simulado en Node con una clave de prueba; nostr.js real (las consultas a relays fallan sin red y se ignoran)
  const { generateSecretKey, getPublicKey, finalizeEvent } = await import("nostr-tools/pure");
  const sk = generateSecretKey(), pk = getPublicKey(sk);
  let bad = false;
  await page.exposeFunction("amberSign", json => { const e = JSON.parse(json); const s = finalizeEvent({ kind: e.kind, created_at: e.created_at, tags: e.tags, content: e.content }, sk); return JSON.stringify(bad ? { ...s, content: "otra cosa" } : s); });
  await page.addInitScript(pk => {
    window.Capacitor = { isNativePlatform: () => true, Plugins: { UsusSigner: {
      async available() { return { ok: true }; },
      async getPublicKey() { return { result: pk, package: "com.greenart7c3.nostrsigner" }; },
      async request(o) { if (o.type === "sign_event") return { event: await window.amberSign(o.content) }; return { result: "x" }; }
    } } };
  }, pk);
  const errors = await openApp(page, {});
  await nav(page, "data"); await page.locator('[data-stab="nostr"]').click();
  await page.locator('[data-act="ns-amber"]').click();
  await expect(page.locator(".nsprof")).toContainText("Firma con Amber", { timeout: 20000 });
  const c = await ls(page, "wk.nostr"); expect([c.method, c.pubkey, c.pkg]).toEqual(["amber", pk, "com.greenart7c3.nostrsigner"]);
  const ev = await page.evaluate(() => window.UsusNostr.sign({ kind: 1, created_at: 1, tags: [], content: "hola" }));
  expect(ev.pubkey).toBe(pk); expect(ev.sig).toHaveLength(128);
  bad = true;   // una firma que no cuadra con lo pedido se rechaza
  expect(await page.evaluate(() => window.UsusNostr.sign({ kind: 1, created_at: 1, tags: [], content: "hola" }).then(() => "ok", e => e.message))).toBe("firma no válida");
  expect(errors).toEqual([]);
});
test("sin catálogo activado, el material de la rutina sale igual", async ({ page }) => {
  const R = [{ id: "rm", name: "Mat", block: "full", variant: "", days: [0, 1, 2, 3, 4, 5, 6], exercises: [{ name: "Dominada negativa", xid: "dominada-negativa", sets: 1, reps: 5, type: "reps" }] }];
  const errors = await openApp(page, { data: { "wk.routines": R, "wk.catalog": false } });
  await page.locator('[data-start="rm"]:visible').first().click();
  await expect(page.locator(".premat")).toContainText("Barra");
  expect(errors).toEqual([]);
});
test("web: entrar con la extensión del navegador (NIP-07); la firma se comprueba", async ({ page }) => {
  const { generateSecretKey, getPublicKey, finalizeEvent } = await import("nostr-tools/pure");
  const sk = generateSecretKey(), pk = getPublicKey(sk);
  let bad = false;
  await page.exposeFunction("extSign", json => { const e = JSON.parse(json); const s = finalizeEvent(e, sk); return JSON.stringify(bad ? { ...s, content: "otra cosa" } : s); });
  await page.addInitScript(pk => { window.nostr = { async getPublicKey() { return pk; }, async signEvent(e) { return JSON.parse(await window.extSign(JSON.stringify(e))); } }; }, pk);
  const errors = await openApp(page, {});
  await nav(page, "data"); await page.locator('[data-stab="nostr"]').click();
  await expect(page.locator('[data-act="ns-amber"]')).toHaveCount(0);           // en la web no hay Amber
  await page.locator('[data-act="ns-ext"]').click();
  await expect(page.locator(".nsprof")).toContainText("Firma con la extensión", { timeout: 20000 });
  const c = await ls(page, "wk.nostr"); expect([c.method, c.pubkey]).toEqual(["nip07", pk]);
  const ev = await page.evaluate(() => window.UsusNostr.sign({ kind: 1, created_at: 1, tags: [], content: "hola" }));
  expect(ev.pubkey).toBe(pk);
  bad = true;
  expect(await page.evaluate(() => window.UsusNostr.sign({ kind: 1, created_at: 1, tags: [], content: "hola" }).then(() => "ok", e => e.message))).toBe("firma no válida");
  expect(errors).toEqual([]);
});
test("solo npub: se ve la cuenta, pero sin copias ni publicar", async ({ page }) => {
  const { generateSecretKey, getPublicKey } = await import("nostr-tools/pure");
  const { npubEncode } = await import("nostr-tools/nip19");
  const pk = getPublicKey(generateSecretKey());
  const errors = await openApp(page, { data: { "wk.routines": ROUTINES } });
  await nav(page, "data"); await page.locator('[data-stab="nostr"]').click();
  await page.locator(".nsro summary").click();
  await page.fill("#nsNpub", "hola"); await page.locator('[data-act="ns-npub"]').click();
  await expect(page.locator("#toast")).toContainText("npub1");
  await page.fill("#nsNpub", npubEncode(pk)); await page.locator('[data-act="ns-npub"]').click();
  await expect(page.locator(".nsprof")).toContainText("Solo lectura", { timeout: 20000 });
  expect((await ls(page, "wk.nostr")).method).toBe("npub");
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await expect(page.getByText("Con solo la npub no se pueden guardar")).toBeVisible();
  await expect(page.locator('[data-act="ns-bk-save"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("Nostr: la copia anterior (una pieza) se sigue pudiendo recuperar", async ({ page }) => {
  const enc = t => "enc:" + t;
  // Copia v1 hecha con nostr real: gzip+base64 de un JSON de Usus
  const zlib = await import("node:zlib");
  const z = zlib.gzipSync(Buffer.from(JSON.stringify({ app: "usus", version: 2, exported: "2026-11-01T10:00:00Z", routines: [{ id: "rv", name: "Vieja", block: "full", variant: "", days: [1], exercises: [{ name: "Flexión", sets: 1, reps: 5, type: "reps" }] }], sessions: [{ id: "sv", start: 1700000000000, end: 1700000300000, rid: "rv", routine: "Vieja", exercises: [] }] }))).toString("base64");
  const evs = [{ kind: 30078, created_at: 1762000000, tags: [["d", "usus/backup/0"]], content: enc(z) },
    { kind: 30078, created_at: 1762000000, tags: [["d", "usus/backup"]], content: enc(JSON.stringify({ v: 1, parts: 1, len: z.length, t: 1762000000000, profile: "Alex" })) }];
  await mockNostr(page, evs);
  const errors = await openApp(page, { data: { "wk.nostr": CFG } });
  await nav(page, "data"); await page.locator('[data-stab="datos"]').click();
  await page.locator('[data-act="ns-bk-load"]').click();
  await expect(page.locator(".modal:has(#nbT)")).toContainText("de antes de los apartados");
  await page.locator('[data-act="ns-bk-go"]').click();
  await expect.poll(async () => ((await ls(page, "wk.routines")) || []).map(r => r.name)).toContain("Vieja");
  expect(errors).toEqual([]);
});
