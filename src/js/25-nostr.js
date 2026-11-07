/* ---------- Nostr (3.6.0): cuenta con bunker, copia cifrada y publicar ----------
   - Se entra con Amber (APK), una extensión del navegador (NIP-07) o un bunker (NIP-46). Usus no ve ni guarda la nsec.
   - Con solo la npub, solo lectura: se ve el perfil, pero no hay copias ni publicar (no se puede firmar ni descifrar).
   - Copia de seguridad: la del archivo, por apartados, comprimida (gzip) y cifrada con NIP-44 para uno mismo,
     en eventos de datos de app (kind 30078): ver nsBackupSave. Nadie más la puede leer.
   - Publicar: nota pública (kind 1) que se revisa antes; el entreno puede llevar su imagen (subida a Blossom).
   - La librería (nostr.js) se carga solo al usar Nostr: sin usarlo, Usus no se conecta a nada.
   wk.nostr (por perfil) = { bp: {pubkey, relays}, sk, pubkey, npub, name, relays, blossom, lastBk } */
const NS_DEF = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
const NS_BLOSSOM = ["https://blossom.primal.net"];
const NS_PART = 40000;   // caracteres por parte (NIP-44 cifra hasta 64 KB)
const NS = { cfg: () => LS.get("wk.nostr", null), save: c => LS.set("wk.nostr", c) };
let nsLibP = null;
function nsLib() {
  if (window.UsusNostr) return Promise.resolve(window.UsusNostr);
  return nsLibP ||= new Promise((ok, ko) => {
    const s = document.createElement("script"); s.src = "nostr.js";
    s.onload = () => window.UsusNostr ? ok(window.UsusNostr) : ko(new Error("nostr.js"));
    s.onerror = () => { nsLibP = null; ko(new Error(T("sin conexión"))); };
    document.head.appendChild(s);
  });
}
const nsRelays = () => { const c = NS.cfg(); return c?.relays?.length ? c.relays : NS_DEF; };
const nsAuth = url => { try { window.open(url, "_blank", "noopener"); } catch {} toast(T("Tu bunker pide autorizar a Usus: acéptalo y vuelve."), 5000); };
const nsTime = (p, ms) => Promise.race([p, new Promise((_, ko) => setTimeout(() => ko(new Error(T("el bunker no responde"))), ms))]);
const nsErr = e => String(e?.message || e || "").slice(0, 80);
async function nsSigner() {
  const L = await nsLib(), c = NS.cfg(); if (!c) throw new Error(T("sin cuenta de Nostr"));
  if (c.method === "npub") throw new Error(T("solo lectura: entra con un firmante para esto"));
  if (!L.active()) { if (c.method === "amber") L.amberResume(c.pubkey, c.pkg); else if (c.method === "nip07") L.extResume(c.pubkey); else L.resume(c.bp, c.sk, nsAuth); }
  return L;
}
const nsBusy = msg => { state.nsBusy = msg || null; render(); };
const nsShort = c => c?.npub ? c.npub.slice(0, 12) + "…" + c.npub.slice(-6) : "";
/* Base64 de un gzip, y al revés */
async function gzB64(text) {
  const z = new Uint8Array(await new Response(new Blob([new TextEncoder().encode(text)]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
  let s = ""; for (let i = 0; i < z.length; i += 0x8000) s += String.fromCharCode(...z.subarray(i, i + 0x8000)); return btoa(s);
}
async function gunB64(b64) {
  const z = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return new TextDecoder().decode(new Uint8Array(await new Response(new Blob([z]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()));
}

/* Conectar y desconectar */
/* Tras entrar (con Amber o con bunker): relays de escritura (NIP-65), servidores Blossom y perfil */
async function nsAfterLogin(L, pk, extra, base) {
  const look = [...new Set([...NS_DEF, ...(extra || [])])];
  let relays = NS_DEF, blossom = [];
  try { const ev = await L.get(look, { kinds: [10002], authors: [pk] }); const w = (ev?.tags || []).filter(t => t[0] === "r" && /^wss:\/\//.test(t[1] || "") && t[2] !== "read").map(t => t[1]); if (w.length) relays = w.slice(0, 6); } catch {}
  try { const ev = await L.get(look, { kinds: [10063], authors: [pk] }); blossom = (ev?.tags || []).filter(t => t[0] === "server" && /^https:\/\//.test(t[1] || "")).map(t => t[1]).slice(0, 3); } catch {}
  NS.save({ ...base, pubkey: pk, npub: L.npub(pk), name: "", relays, blossom });
  await nsRefreshProfile(true);
  toast(T("Cuenta de Nostr conectada"));
}
async function nsConnect() {
  const v = ($("#nsBunker")?.value || "").trim();
  if (!/^bunker:\/\/[0-9a-f]{64}/i.test(v)) { toast(T("Pega la dirección bunker://… de tu firmante (Amber, nsec.app…).")); $("#nsBunker")?.focus(); return; }
  nsBusy(T("Conectando… acepta la petición en tu bunker."));
  try {
    const L = await nsLib(), r = await nsTime(L.connect(v, null, nsAuth), 120000);
    await nsAfterLogin(L, r.pubkey, r.bp.relays, { method: "bunker", bp: { pubkey: r.bp.pubkey, relays: r.bp.relays || [] }, sk: r.sk });
  } catch (e) { toast(T("No se pudo conectar: {x}. Revisa la dirección y que tu firmante esté abierto.", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
/* Amber (NIP-55), solo en el APK: como en Wavestr */
async function nsConnectAmber() {
  nsBusy(T("Abriendo Amber…"));
  try {
    const L = await nsLib();
    if (!(await L.amberAvailable())) { toast(T("Instala Amber (firmante de Nostr) o usa un bunker."), 5000); nsBusy(null); return; }
    const r = await L.amberLogin();
    nsBusy(T("Conectando…"));
    await nsAfterLogin(L, r.pubkey, [], { method: "amber", pkg: r.pkg });
  } catch (e) { toast(T("No se pudo entrar con Amber: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
/* Extensión del navegador (NIP-07: Alby, nos2x…), en la web */
async function nsConnectExt() {
  nsBusy(T("Conectando…"));
  try {
    const L = await nsLib();
    if (!L.extAvailable()) { toast(T("No hay ninguna extensión de Nostr en este navegador."), 5000); nsBusy(null); return; }
    const r = await L.extLogin();
    await nsAfterLogin(L, r.pubkey, [], { method: "nip07" });
  } catch (e) { toast(T("No se pudo entrar con la extensión: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
/* Solo la npub: solo lectura (perfil), sin copias ni publicar */
async function nsConnectNpub() {
  const v = ($("#nsNpub")?.value || "").trim();
  try {
    const L = await nsLib(), pk = L.pubHex(v);
    if (!pk) { toast(T("Pega tu npub1…")); $("#nsNpub")?.focus(); return; }
    nsBusy(T("Conectando…"));
    await nsAfterLogin(L, pk, [], { method: "npub" });
  } catch (e) { toast(T("No se pudo conectar: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
const nsRO = () => NS.cfg()?.method === "npub";
const nsMethod = c => ({ amber: "Amber", nip07: T("Extensión"), npub: T("Solo lectura") })[c?.method] || "Bunker";
async function nsDisconnect() {
  if (!confirm(T("¿Desconectar la cuenta de Nostr de este perfil? Tus copias en Nostr no se borran."))) return;
  try { if (window.UsusNostr) await window.UsusNostr.disconnect(); } catch {}
  NS.save(null); toast(T("Cuenta de Nostr desconectada")); render();
}

/* Copia de seguridad cifrada para uno mismo, por apartados (3.7.2). Cada perfil tiene su sitio: d = usus/p/<perfil>/<apartado>
   (índice cifrado: partes, longitud, fecha) y usus/p/<perfil>/<apartado>/N (partes). Así una copia de otro perfil, o
   de un apartado, no pisa a las demás. La copia anterior (d = usus/backup, una sola pieza) se puede seguir recuperando. */
const NS_SECS = [["rut", N_("Rutinas y planes")], ["ent", N_("Entrenos y progreso")], ["dia", N_("Diario, peso y ciclo")], ["aj", N_("Ajustes")]];
const nsSecName = k => T((NS_SECS.find(s => s[0] === k) || [k, k])[1]);
const nsD = (pid, s) => `usus/p/${pid}/${s}`;
const nsDRe = /^usus\/p\/([^/]+)\/(rut|ent|dia|aj)$/;
async function nsHash(text) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))].slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join(""); }
/* Guardar: los apartados elegidos; en la copia automática, solo los que han cambiado desde la última */
async function nsBackupSave(auto, secs) {
  secs = secs?.length ? secs : NS_SECS.map(s => s[0]);
  try {
    const c0 = NS.cfg(), pid = curProf().id, h = { ...(c0.h || {}) }, todo = [];
    for (const s of secs) { const o = backupObj([s]), sig = await nsHash(JSON.stringify({ ...o, exported: 0 })); if (!auto || h[s] !== sig) todo.push([s, o, sig]); }
    if (!todo.length) return;
    nsBusy(T("Preparando la copia…"));
    const L = await nsSigner(), c = NS.cfg(), rel = nsRelays(), now = Math.floor(Date.now() / 1000), plan = [];
    for (const [s, o, sig] of todo) { const z = await gzB64(JSON.stringify(o)), parts = []; for (let i = 0; i < z.length; i += NS_PART) parts.push(z.slice(i, i + NS_PART)); plan.push({ s, z, parts, sig }); }
    const n = plan.reduce((a, x) => a + x.parts.length + 1, 0); let k = 0;
    const put = async (d, text) => { k++; nsBusy(T("Guardando {k} de {n}… acepta en tu bunker si lo pide.", { k, n }));
      const ev = await nsTime(L.sign({ kind: 30078, created_at: now, tags: [["d", d]], content: await nsTime(L.encrypt(c.pubkey, text), 90000) }), 90000);
      await nsTime(L.publish(rel, ev), 30000); };
    for (const x of plan) {
      for (let i = 0; i < x.parts.length; i++) await put(`${nsD(pid, x.s)}/${i}`, x.parts[i]);
      await put(nsD(pid, x.s), JSON.stringify({ v: 2, s: x.s, parts: x.parts.length, len: x.z.length, t: Date.now(), app: APP_VERSION, profile: profName(curProf()) }));
      h[x.s] = x.sig;
    }
    NS.save({ ...NS.cfg(), h, lastBk: Date.now(), seen: now }); LS.set("wk.lastBackup", Date.now()); state.nsNewer = null; state.nsBk = null;
    toast(T("Copia guardada en Nostr"));
  } catch (e) { toast(T("No se pudo guardar la copia en Nostr: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
/* Recuperar: busca las copias de esta cuenta (por perfil) y se eligen los apartados */
async function nsBackupLoad() {
  state.nsBk = { mode: "load", list: null }; nsBusy(T("Buscando tu copia en Nostr…"));
  try {
    const L = await nsSigner(), c = NS.cfg(), evs = await L.query(nsRelays(), { kinds: [30078], authors: [c.pubkey] }), g = new Map();
    for (const ev of evs || []) {
      const d = (ev.tags.find(t => t[0] === "d") || [])[1] || "", m = nsDRe.exec(d);
      if (m) { const x = g.get(m[1]) || { pid: m[1], secs: {} }; if (!x.secs[m[2]] || x.secs[m[2]].created_at < ev.created_at) x.secs[m[2]] = ev; g.set(m[1], x); }
      else if (d === "usus/backup") g.set("_v1", { pid: "_v1", old: ev });
    }
    const list = [...g.values()].map(x => ({ ...x, t: x.old ? x.old.created_at : Math.max(...Object.values(x.secs).map(e => e.created_at)) }));
    const me = curProf().id; list.sort((a, b) => (b.pid === me) - (a.pid === me) || (a.pid === "_v1") - (b.pid === "_v1") || b.t - a.t);
    if (!list.length) { state.nsBk = null; toast(T("No hay ninguna copia de Usus en Nostr con esta cuenta")); nsBusy(null); return; }
    // Con copias de varios perfiles, el nombre de cada uno (va cifrado en su índice)
    if (list.filter(x => !x.old).length > 1) { nsBusy(T("Descifrando… acepta en tu bunker si lo pide."));
      for (const x of list) if (!x.old) { try { x.name = JSON.parse(await nsTime(L.decrypt(c.pubkey, Object.values(x.secs)[0].content), 90000)).profile || ""; } catch {} } }
    state.nsBk = { mode: "load", list, pick: list[0].pid };
  } catch (e) { state.nsBk = null; toast(T("No se pudo recuperar la copia: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
async function nsBackupRestore(pid, secs) {
  const b = state.nsBk, x = b?.list?.find(y => y.pid === pid); if (!x) return;
  try {
    const L = await nsSigner(), c = NS.cfg(), rel = nsRelays(), q = d => L.get(rel, { kinds: [30078], authors: [c.pubkey], "#d": [d] });
    const pieces = x.old ? [["usus/backup", x.old]] : secs.filter(s => x.secs[s]).map(s => [nsD(pid, s), x.secs[s]]);
    if (!pieces.length) { toast(T("Elige al menos un apartado")); return; }
    let all = {}, seen = 0;
    for (const [d, mev] of pieces) {
      nsBusy(T("Descifrando… acepta en tu bunker si lo pide."));
      const man = JSON.parse(await nsTime(L.decrypt(c.pubkey, mev.content), 90000)); let z = "";
      for (let i = 0; i < man.parts; i++) { nsBusy(T("Recuperando {k} de {n}…", { k: i + 1, n: man.parts }));
        const ev = await q(`${d}/${i}`); if (!ev) throw new Error(T("falta una parte")); z += await nsTime(L.decrypt(c.pubkey, ev.content), 90000); }
      if (z.length !== man.len) throw new Error(T("copia incompleta"));
      all = { ...all, ...JSON.parse(await gunB64(z)) }; seen = Math.max(seen, mev.created_at);
    }
    nsBusy(null); state.nsBk = null; render();
    await importJSON(JSON.stringify(all));
    NS.save({ ...NS.cfg(), seen }); state.nsNewer = null; render();
  } catch (e) { toast(T("No se pudo recuperar la copia: {x}", { x: nsErr(e) }), 5000); nsBusy(null); }
}
/* Ventana para elegir qué guardar o qué recuperar */
function nsBkModal() {
  const b = state.nsBk; if (!b) return "";
  const busy = state.nsBusy, when = t => new Date(t * 1000).toLocaleString(LOC(), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const chk = (k, on, sub, dis) => `<label class="shopt"><span>${esc(nsSecName(k))}${sub ? `<small class="muted" style="display:block;font-size:.78rem">${sub}</small>` : ""}</span><input type="checkbox" data-nsbks="${k}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}></label>`;
  let body;
  if (b.mode === "save") body = `<p class="muted" style="font-size:.85rem;margin:0 0 6px">${T("Cifrada para que solo tú puedas leerla. Cada apartado se guarda por separado y no pisa a los demás.")}</p>
    ${NS_SECS.map(([k]) => chk(k, true)).join("")}
    ${busy ? `<p class="nsbusy" role="status">${esc(busy)}</p>` : ""}
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="ns-bk-close">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="ns-bk-go" ${busy ? "disabled" : ""}>${T("Guardar")}</button></div>`;
  else if (!b.list) body = `<p class="nsbusy" role="status">${esc(busy || "")}</p>`;
  else {
    const x = b.list.find(y => y.pid === b.pick) || b.list[0], me = curProf().id;
    const lab = y => y.old ? T("Copia anterior (una sola pieza)") : y.pid === me ? T("Este perfil") : (y.name || T("Otro perfil"));
    body = `${b.list.length > 1 ? `<div class="nsbkp">${b.list.map(y => `<label class="shopt"><span>${esc(lab(y))}<small class="muted" style="display:block;font-size:.78rem">${when(y.t)}</small></span><input type="radio" name="nsbkp" data-nsbkp="${esc(y.pid)}" ${y.pid === x.pid ? "checked" : ""}></label>`).join("")}</div><h3 class="nsbkh">${T("Qué recuperar")}</h3>` : ""}
      ${x.old ? `<p class="muted" style="font-size:.85rem;margin:0">${T("Copia completa del {d}, de antes de los apartados.", { d: when(x.t) })}</p>` : NS_SECS.map(([k]) => chk(k, !!x.secs[k], x.secs[k] ? when(x.secs[k].created_at) : T("No hay copia"), !x.secs[k])).join("")}
      <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Se combina con lo que hay en este perfil, como al importar un archivo. Los ajustes sustituyen a los actuales.")}</p>
      ${busy ? `<p class="nsbusy" role="status">${esc(busy)}</p>` : ""}
      <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="ns-bk-close">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="ns-bk-go" ${busy ? "disabled" : ""}>${T("Recuperar")}</button></div>`;
  }
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="nbT"><div class="mbox dsh">${mHead("nbT", b.mode === "save" ? T("Guardar copia en Nostr") : T("Recuperar de Nostr"), "ns-bk-close")}${body}</div></div>`;
}
function nsBkGo() {
  const b = state.nsBk; if (!b || state.nsBusy) return;
  const secs = [...document.querySelectorAll("[data-nsbks]:checked")].map(i => i.dataset.nsbks);
  if (b.mode === "save") { if (!secs.length) return toast(T("Elige al menos un apartado")); nsBackupSave(false, secs); }
  else nsBackupRestore(b.pick, secs);
}

/* Sincronizar (3.7.0): copia sola al terminar cada sesión (3.7.2: solo los apartados que han cambiado); al abrir, aviso
   si en Nostr hay una copia de este perfil más nueva que la última que se guardó o recuperó aquí (se mira la fecha de
   los índices, sin descifrar ni pedir nada al firmante). */
const nsAutoOn = () => NS.cfg()?.auto !== false;
function nsAutoBackup() { if (NS.cfg() && !nsRO() && nsAutoOn() && !state.nsBusy) nsBackupSave(true); }
async function nsCheckNewer() {
  const c = NS.cfg(); if (!c || nsRO()) return;
  try {
    const L = await nsLib(), pid = curProf().id, evs = await L.query(nsRelays(), { kinds: [30078], authors: [c.pubkey], "#d": NS_SECS.map(s => nsD(pid, s[0])) });
    const at = Math.max(0, ...(evs || []).map(e => e.created_at));
    if (at && at > (c.seen || 0) + 60 && at * 1000 > (c.lastBk || 0) + 60e3) { state.nsNewer = { t: at * 1000, at }; render(); }
  } catch {}
}
function nsNewerBanner() {
  const n = state.nsNewer; if (!n || !NS.cfg()) return "";
  const when = new Date(n.t).toLocaleString(LOC(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return prow("#8e30eb", T("Copia más nueva en Nostr"), T("Del {d}, guardada desde otro dispositivo o la web.", { d: when }),
    `<button class="btn small" data-act="ns-bk-load">${T("Recuperar")}</button><button class="btn ghost small" data-act="ns-newer-x">${T("Ahora no")}</button>`);
}

/* Publicar: nota pública que se revisa antes; el entreno, con su imagen si se quiere */
async function nsPostSess() {
  if (nsRO()) return toast(T("Con solo la npub no se puede publicar: entra con un firmante."), 5000);
  const s = state.sessions.find(x => x.id === state.shareSess); if (!s) return;
  state.nsPost = { k: "sess", sid: s.id, text: sessText(s), img: !!SHOPT().img }; render();
}
async function nsPostRout() {
  if (nsRO()) return toast(T("Con solo la npub no se puede publicar: entra con un firmante."), 5000);
  const sh = state.rshare; if (!sh?.sel.length) return;
  const pay = sharePayload(sh.sel, sh.plan), n = pay.routines.length;
  const head = n === 1 ? T("Mi rutina «{x}» para Usus. Abre el enlace para añadirla.", { x: pay.routines[0].name }) : T("{n} rutinas para Usus. Abre el enlace para añadirlas.", { n });
  state.nsPost = { k: "rout", text: `${head}${sh.plan ? "\n" + T("Incluye el plan de progresión.") : ""}\n\n${appURL()}#r=${await packShare(pay)}` }; render();
}
async function nsBlossom(L, blob) {
  const c = NS.cfg(), buf = await blob.arrayBuffer(), hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))].map(b => b.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  const auth = await nsTime(L.sign({ kind: 24242, created_at: now, tags: [["t", "upload"], ["x", hash], ["expiration", String(now + 600)]], content: "Usus" }), 90000);
  for (const srv of [...(c.blossom || []), ...NS_BLOSSOM]) {
    try { const r = await fetch(srv.replace(/\/$/, "") + "/upload", { method: "PUT", headers: { Authorization: "Nostr " + btoa(JSON.stringify(auth)), "Content-Type": blob.type }, body: blob });
      if (r.ok) { const j = await r.json(); if (j?.url) return { url: j.url, hash, type: blob.type }; } } catch {}
  }
  throw new Error(T("no se pudo subir la imagen"));
}
async function nsPublish() {
  const p = state.nsPost; if (!p) return;
  const text = ($("#nsText")?.value || "").trim(), img = p.k === "sess" && $("#nsImg")?.checked;
  if (!text) { toast(T("Escribe algo para publicar")); return; }
  p.text = text; p.img = img;
  nsBusy(T("Publicando… acepta en tu bunker si lo pide."));
  try {
    const L = await nsSigner(), rel = nsRelays(), tags = [["t", "usus"], ["client", "Usus"]];
    let content = text;
    if (img) { const s = state.sessions.find(x => x.id === p.sid); nsBusy(T("Subiendo la imagen…"));
      const cv = await sessCanvas(s), blob = await new Promise(ok => cv.toBlob(ok, "image/png")), up = await nsBlossom(L, blob);
      content += "\n\n" + up.url; tags.push(["imeta", `url ${up.url}`, `m ${up.type}`, `x ${up.hash}`]); nsBusy(T("Publicando… acepta en tu bunker si lo pide.")); }
    const ev = await nsTime(L.sign({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags, content }), 90000);
    await nsTime(L.publish(rel, ev), 30000);
    state.nsPost = { k: p.k, done: L.nevent(ev.id, rel.slice(0, 2), ev.pubkey) };
    toast(T("Publicado en Nostr"));
  } catch (e) { toast(T("No se pudo publicar: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
function nsPostModal() {
  const p = state.nsPost; if (!p) return "";
  const c = NS.cfg(), b = state.nsBusy;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="npT"><div class="mbox dsh">${mHead("npT", T("Publicar en Nostr"), "ns-post-close")}
    ${p.done ? `<div style="text-align:center"><div class="svok">${CHECK}</div><p style="margin:4px 0 0">${T("Publicado en Nostr")}</p></div>
      <div class="row" style="margin-top:14px"><a class="btn" style="flex:1;text-align:center" href="https://njump.me/${esc(p.done)}" target="_blank" rel="noopener">${T("Verla en njump.me")} ↗</a><button class="btn primary" style="flex:1" data-act="ns-post-close">${T("Hecho")}</button></div>`
    : c ? `<p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("Nota pública con tu cuenta {x}. Revisa el texto: lo verá cualquiera.", { x: `<b style="color:var(--ink)">${esc(c.name || nsShort(c))}</b>` })}</p>
      <textarea id="nsText" class="nstext" rows="9" aria-label="${T("Texto de la nota")}">${esc(p.text)}</textarea>
      ${p.k === "sess" ? `<label class="shopt"><span>${T("Con la imagen del entreno")}<small class="muted" style="display:block;font-size:.78rem">${T("Se sube a un servidor Blossom y queda pública.")}</small></span><input type="checkbox" role="switch" id="nsImg" ${p.img ? "checked" : ""}></label>` : ""}
      ${b ? `<p class="nsbusy" role="status">${esc(b)}</p>` : ""}
      <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="ns-post-close">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="ns-post-go" ${b ? "disabled" : ""}>${T("Publicar")}</button></div>`
    : `<p>${T("Para publicar, conecta antes tu cuenta en Ajustes → Cuenta de Nostr.")}</p>
      <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="ns-post-close">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="ns-go-set">${T("Conectar")}</button></div>`}
  </div></div>`;
}
/* La cuenta, en Ajustes → Perfil (cada perfil, la suya); la copia, en Ajustes → Datos y copias */
const nsBusyLine = () => state.nsBusy ? `<p class="nsbusy" role="status">${esc(state.nsBusy)}</p>` : "";
/* Perfil de Nostr (3.7.0), como en Wavestr: de solo lectura (Usus no lo modifica). Se refresca al abrir Perfil, como mucho una vez al día */
async function nsRefreshProfile(force) {
  const c = NS.cfg(); if (!c || state.nsProfBusy || (!force && (state.nsProfTried || Date.now() - (c.profT || 0) < 864e5))) return;
  state.nsProfBusy = true; state.nsProfTried = true;   // una vez por sesión de la app (sin bucles si no hay conexión)
  try {
    const L = await nsLib(), rel = nsRelays(), pk = c.pubkey;
    const [k0, k3] = await Promise.all([L.get(rel, { kinds: [0], authors: [pk] }).catch(() => null), L.get(rel, { kinds: [3], authors: [pk] }).catch(() => null)]);
    let m = {}; try { m = JSON.parse(k0?.content || "{}") || {}; } catch {}
    const str = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "", url = v => /^https:\/\//.test(str(v, 500)) ? str(v, 500) : "";
    const prof = { display: str(m.display_name, 60) || str(m.name, 60), name: str(m.name, 40), nip05: str(m.nip05, 80), about: str(m.about, 400), picture: url(m.picture), banner: url(m.banner), lud16: str(m.lud16, 120) };
    NS.save({ ...NS.cfg(), name: prof.display || c.name || "", prof, follows: k3 ? k3.tags.filter(t => t[0] === "p").length : c.follows ?? null, profT: Date.now() });
  } catch {}
  state.nsProfBusy = false; if (state.tab === "data") render();
}
/* Color fijo por clave pública (fondo del banner y del avatar sin foto) */
const nsHue = pk => parseInt(String(pk || "0").slice(0, 6), 16) % 360;
const nsGrad = pk => `linear-gradient(135deg,hsl(${nsHue(pk)} 70% 55%),hsl(${(nsHue(pk) + 60) % 360} 70% 45%))`;
const nsInit = s => (String(s || "?").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2) || "?").toUpperCase();
/* Avatar: la foto del perfil o las iniciales sobre un color propio de la clave */
function nsAvatar(c, px) {
  const p = c?.prof || {}, name = p.display || c?.name || "?";
  return `<span class="nspic" style="width:${px}px;height:${px}px;font-size:${Math.round(px * .38)}px;background:${nsGrad(c?.pubkey)}"><span aria-hidden="true">${esc(nsInit(name))}</span>${p.picture ? `<img src="${esc(p.picture)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">` : ""}</span>`;
}
/* Ajustes → Cuenta de Nostr, como en Wavestr: la cuenta en una fila; Usus no cambia el perfil */
function nostrAccount() {
  const c = NS.cfg();
  if (!c) return `<div class="panel"><b>${T("Sin cuenta")}</b><p class="muted" style="font-size:.88rem;margin:4px 0 12px">${T("Entra con tu cuenta de Nostr para guardar copias cifradas y publicar tus entrenos y rutinas. Usus no ve tu clave privada y solo se conecta cuando usas Nostr.")}</p>
    ${isNative() ? `<button class="btn primary nsbtn" style="width:100%" data-act="ns-amber" ${state.nsBusy ? "disabled" : ""}>${NS_ICO}${T("Entrar con Amber")}</button><p class="muted" style="font-size:.82rem;margin:14px 0 4px">${T("O con un bunker (nsec.app, nsecBunker…):")}</p>`
      : `<button class="btn primary nsbtn" style="width:100%" data-act="ns-ext" ${state.nsBusy ? "disabled" : ""}>${NS_ICO}${T("Entrar con extensión")}</button><p class="muted" style="font-size:.8rem;margin:4px 0 0">${T("Alby, nos2x… u otra extensión de Nostr del navegador.")}</p><p class="muted" style="font-size:.82rem;margin:14px 0 4px">${T("O con un bunker (nsec.app, nsecBunker…):")}</p>`}
    <label class="muted" for="nsBunker" style="font-size:.85rem">${T("Dirección del bunker")}</label>
    <div class="row" style="margin-top:4px;flex-wrap:nowrap"><input id="nsBunker" type="text" placeholder="bunker://…" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0"><button class="btn primary" data-act="ns-connect" ${state.nsBusy ? "disabled" : ""}>${T("Conectar")}</button></div>
    <details class="nsro"><summary>${T("Solo ver mi perfil (npub)")}</summary><p class="muted" style="font-size:.8rem;margin:4px 0 6px">${T("Solo lectura: sin copias ni publicar, porque sin firmante no se puede firmar ni descifrar.")}</p>
    <div class="row" style="flex-wrap:nowrap"><input id="nsNpub" type="text" placeholder="npub1…" aria-label="npub" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0"><button class="btn" data-act="ns-npub" ${state.nsBusy ? "disabled" : ""}>${T("Ver")}</button></div></details>
    ${nsBusyLine()}</div>`;
  setTimeout(() => nsRefreshProfile(), 0);
  const p = c.prof || {}, name = p.display || c.name || T("Tu cuenta");
  const sub = [p.name ? "@" + esc(p.name) : "", p.nip05 ? `<span class="nip">✓ ${esc(p.nip05.replace(/^_@/, ""))}</span>` : ""].filter(Boolean).join(" · ") || ({ amber: T("Firma con Amber"), nip07: T("Firma con la extensión"), npub: T("Solo lectura") })[c.method] || T("Firma con bunker");
  const copy = (lab, val, shown) => `<div class="nslab">${lab}</div><div class="nscopy"><code>${esc(shown || val)}</code><button class="btn ghost small" data-nscopy="${esc(val)}">${T("Copiar")}</button></div>`;
  return `<div class="panel nsprof">
    <div class="nsacc">${nsAvatar(c, 48)}<span class="t"><b>${esc(name)}</b><small>${sub}</small></span></div>
    ${p.about ? `<p class="nsabout">${esc(p.about)}</p>` : ""}
    ${copy(T("Clave pública"), c.npub || "")}
    ${p.lud16 ? copy("Lightning", p.lud16, "⚡ " + p.lud16) : ""}
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${({ amber: T("Firma con Amber. Usus no cambia tu perfil de Nostr: solo lo muestra."), nip07: T("Firma con la extensión del navegador. Usus no cambia tu perfil de Nostr: solo lo muestra."), npub: T("Solo lectura con tu npub: se ve tu perfil, pero no se pueden guardar copias ni publicar. Para eso, desconecta y entra con un firmante.") })[c.method] || T("Firma con tu bunker. Usus no cambia tu perfil de Nostr: solo lo muestra.")}</p>
    <button class="btn" style="margin-top:10px" data-act="ns-off">${T("Desconectar")}</button>
    ${nsBusyLine()}</div>`;
}
function nostrBackup(item) {
  const c = NS.cfg(), when = t => new Date(t).toLocaleDateString(LOC(), { day: "numeric", month: "short", year: "numeric" });
  if (c?.method === "npub") return `<h2>Nostr</h2><div class="panel">${item(T("Copia en Nostr"), T("Con solo la npub no se pueden guardar ni recuperar copias: entra con un firmante en Ajustes → Cuenta de Nostr."), "ns-go-set", T("Cuenta"))}</div>`;
  return `<h2>Nostr</h2><div class="panel">${c ? `
    ${item(T("Guardar copia en Nostr"), T("Rutinas, entrenos, diario y ajustes, por separado y cifrados para que solo tú puedas leerlos.") + (c.lastBk ? " " + T("Última: {d}.", { d: when(c.lastBk) }) : ""), "ns-bk-save", T("Guardar"), true)}
    ${item(T("Recuperar de Nostr"), T("Eliges qué apartados traer; se combinan con lo que hay en este perfil."), "ns-bk-load", T("Recuperar"))}
    <label class="srow" style="cursor:pointer"><span class="t">${T("Copia automática")}<small class="muted" style="display:block;font-size:.8rem">${T("Al terminar cada sesión. Al abrir Usus, avisa si hay una copia más nueva.")}</small></span><input type="checkbox" role="switch" id="nsAuto" ${nsAutoOn() ? "checked" : ""}></label>`
  : `${item(T("Copia en Nostr"), T("Conecta antes tu cuenta en Ajustes → Cuenta de Nostr."), "ns-go-set", T("Conectar"))}`}
    ${nsBusyLine()}</div>`;
}
const NS_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c2-6 6-9 12-10M16 10c1.5-2 2-4 1.5-6-2 0-4 1-5 3"/><circle cx="7" cy="17" r="1"/></svg>';
