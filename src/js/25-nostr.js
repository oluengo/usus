/* ---------- Nostr (3.6.0): cuenta con bunker, copia cifrada y publicar ----------
   - Se entra con un bunker (NIP-46: Amber, nsec.app…). Usus no ve ni guarda la nsec; solo la clave de esta conexión.
   - Copia de seguridad: la misma copia completa del archivo, comprimida (gzip) y cifrada con NIP-44 para uno mismo,
     en eventos de datos de app (kind 30078): d=usus/backup (índice) y d=usus/backup/N (partes). Nadie más la puede leer.
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
  if (!L.active()) L.resume(c.bp, c.sk, nsAuth);
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
async function nsConnect() {
  const v = ($("#nsBunker")?.value || "").trim();
  if (!/^bunker:\/\/[0-9a-f]{64}/i.test(v)) { toast(T("Pega la dirección bunker://… de tu firmante (Amber, nsec.app…).")); $("#nsBunker")?.focus(); return; }
  nsBusy(T("Conectando… acepta la petición en tu bunker."));
  try {
    const L = await nsLib(), r = await nsTime(L.connect(v, null, nsAuth), 120000), pk = r.pubkey;
    const look = [...new Set([...NS_DEF, ...(r.bp.relays || [])])];
    let relays = NS_DEF, blossom = [], name = "";
    try { const ev = await L.get(look, { kinds: [10002], authors: [pk] }); const w = (ev?.tags || []).filter(t => t[0] === "r" && /^wss:\/\//.test(t[1] || "") && t[2] !== "read").map(t => t[1]); if (w.length) relays = w.slice(0, 6); } catch {}
    try { const ev = await L.get(look, { kinds: [10063], authors: [pk] }); blossom = (ev?.tags || []).filter(t => t[0] === "server" && /^https:\/\//.test(t[1] || "")).map(t => t[1]).slice(0, 3); } catch {}
    NS.save({ bp: { pubkey: r.bp.pubkey, relays: r.bp.relays || [] }, sk: r.sk, pubkey: pk, npub: L.npub(pk), name, relays, blossom });
    await nsRefreshProfile(true);
    toast(T("Cuenta de Nostr conectada"));
  } catch (e) { toast(T("No se pudo conectar: {x}. Revisa la dirección y que tu firmante esté abierto.", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
async function nsDisconnect() {
  if (!confirm(T("¿Desconectar la cuenta de Nostr de este perfil? Tus copias en Nostr no se borran."))) return;
  try { if (window.UsusNostr) await window.UsusNostr.disconnect(); } catch {}
  NS.save(null); toast(T("Cuenta de Nostr desconectada")); render();
}

/* Copia de seguridad cifrada para uno mismo */
async function nsBackupSave(auto) {
  if (!auto && !confirm(T("Se guardará en Nostr la copia completa de este perfil, cifrada para que solo tú puedas leerla. Tu bunker pedirá aprobar varias firmas. ¿Seguir?"))) return;
  nsBusy(T("Preparando la copia…"));
  try {
    const L = await nsSigner(), c = NS.cfg(), rel = nsRelays(), now = Math.floor(Date.now() / 1000);
    const z = await gzB64(JSON.stringify(backupObj())), parts = [];
    for (let i = 0; i < z.length; i += NS_PART) parts.push(z.slice(i, i + NS_PART));
    const put = async (d, text, k, n) => { nsBusy(T("Guardando {k} de {n}… acepta en tu bunker si lo pide.", { k, n }));
      const ev = await nsTime(L.sign({ kind: 30078, created_at: now, tags: [["d", d]], content: await nsTime(L.encrypt(c.pubkey, text), 90000) }), 90000);
      await nsTime(L.publish(rel, ev), 30000); };
    for (let i = 0; i < parts.length; i++) await put(`usus/backup/${i}`, parts[i], i + 1, parts.length + 1);
    await put("usus/backup", JSON.stringify({ v: 1, parts: parts.length, len: z.length, t: Date.now(), app: APP_VERSION, profile: profName(curProf()) }), parts.length + 1, parts.length + 1);
    NS.save({ ...NS.cfg(), lastBk: Date.now(), seen: now }); LS.set("wk.lastBackup", Date.now()); state.nsNewer = null;
    toast(T("Copia guardada en Nostr"));
  } catch (e) { toast(T("No se pudo guardar la copia en Nostr: {x}", { x: nsErr(e) }), 5000); }
  nsBusy(null);
}
async function nsBackupLoad() {
  nsBusy(T("Buscando tu copia en Nostr…"));
  try {
    const L = await nsSigner(), c = NS.cfg(), rel = nsRelays(), q = d => L.get(rel, { kinds: [30078], authors: [c.pubkey], "#d": [d] });
    const mev = await q("usus/backup");
    if (!mev) { toast(T("No hay ninguna copia de Usus en Nostr con esta cuenta")); nsBusy(null); return; }
    nsBusy(T("Descifrando… acepta en tu bunker si lo pide."));
    const man = JSON.parse(await nsTime(L.decrypt(c.pubkey, mev.content), 90000)); nsBusy(null);
    const when = new Date(man.t).toLocaleString(LOC(), { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    if (!confirm(T("Copia del {d} ({p}). Se combina con lo que hay en este perfil, como al importar un archivo. ¿Recuperarla?", { d: when, p: man.profile || "Usus" }))) return;
    let z = "";
    for (let i = 0; i < man.parts; i++) { nsBusy(T("Recuperando {k} de {n}…", { k: i + 1, n: man.parts }));
      const ev = await q(`usus/backup/${i}`); if (!ev) throw new Error(T("falta una parte")); z += await nsTime(L.decrypt(c.pubkey, ev.content), 90000); }
    if (z.length !== man.len) throw new Error(T("copia incompleta"));
    nsBusy(null); await importJSON(await gunB64(z));
    NS.save({ ...NS.cfg(), seen: mev.created_at }); state.nsNewer = null; render();
  } catch (e) { toast(T("No se pudo recuperar la copia: {x}", { x: nsErr(e) }), 5000); nsBusy(null); }
}

/* Sincronizar (3.7.0): copia sola al terminar cada sesión; al abrir, aviso si en Nostr hay una copia más nueva
   que la última que se guardó o recuperó aquí (se mira la fecha del índice, sin descifrar ni pedir nada al bunker). */
const nsAutoOn = () => NS.cfg()?.auto !== false;
function nsAutoBackup() { if (NS.cfg() && nsAutoOn() && !state.nsBusy) nsBackupSave(true); }
async function nsCheckNewer() {
  const c = NS.cfg(); if (!c) return;
  try {
    const L = await nsLib(), ev = await L.get(nsRelays(), { kinds: [30078], authors: [c.pubkey], "#d": ["usus/backup"] });
    if (ev && ev.created_at > (c.seen || 0) + 60 && ev.created_at * 1000 > (c.lastBk || 0) + 60e3) { state.nsNewer = { t: ev.created_at * 1000, at: ev.created_at }; render(); }
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
  const s = state.sessions.find(x => x.id === state.shareSess); if (!s) return;
  state.nsPost = { k: "sess", sid: s.id, text: sessText(s), img: !!SHOPT().img }; render();
}
async function nsPostRout() {
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
    : `<p>${T("Para publicar, conecta antes tu cuenta de Nostr en Ajustes → Perfil.")}</p>
      <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="ns-post-close">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="ns-go-set">${T("Ir a Perfil")}</button></div>`}
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
function nostrAccount() {
  const c = NS.cfg();
  if (!c) return `<h2>${T("Cuenta de Nostr")}</h2><div class="panel"><p class="muted" style="font-size:.88rem;margin:0 0 10px">${T("Conecta tu cuenta de Nostr con un bunker (Amber, nsec.app…) para guardar copias cifradas y publicar tus entrenos y rutinas. Usus no ve tu clave privada y solo se conecta cuando usas Nostr.")}</p>
    <label class="muted" for="nsBunker" style="font-size:.85rem">${T("Dirección del bunker")}</label>
    <div class="row" style="margin-top:4px;flex-wrap:nowrap"><input id="nsBunker" type="text" placeholder="bunker://…" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0"><button class="btn primary" data-act="ns-connect" ${state.nsBusy ? "disabled" : ""}>${T("Conectar")}</button></div>
    ${nsBusyLine()}</div>`;
  setTimeout(() => nsRefreshProfile(), 0);
  const p = c.prof || {}, name = p.display || c.name || T("Tu cuenta"), img = (u, cl, alt) => u ? `<img class="${cl}" src="${esc(u)}" alt="${alt}" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">` : "";
  const copy = (lab, val, shown) => `<div class="nslab">${lab}</div><div class="nscopy"><code>${esc(shown || val)}</code><button class="btn ghost small" data-nscopy="${esc(val)}">${T("Copiar")}</button></div>`;
  return `<h2>${T("Cuenta de Nostr")}</h2><div class="panel nsprof">
    <div class="nsban" style="background:${nsGrad(c.pubkey)}">${img(p.banner, "", "")}</div>
    <div class="nspic" style="background:${nsGrad(c.pubkey)}"><span aria-hidden="true">${esc(nsInit(name))}</span>${img(p.picture, "", "")}</div>
    <h3 class="nsname">${esc(name)}</h3>
    ${p.name || p.nip05 ? `<p class="nsids">${p.name ? `<span>@${esc(p.name)}</span>` : ""}${p.nip05 ? `<span class="nip">✓ ${esc(p.nip05.replace(/^_@/, ""))}</span>` : ""}</p>` : ""}
    ${p.about ? `<p class="nsabout">${esc(p.about)}</p>` : ""}
    <div class="nsstats"><div><b>${c.follows ?? "…"}</b><small>${T("Siguiendo")}</small></div><div><b>${nsRelays().length}</b><small>${T("Relays")}</small></div><div><b>Bunker</b><small>${T("Firma")}</small></div></div>
    ${copy(T("Clave pública"), c.npub || "")}
    ${p.lud16 ? copy("Lightning", p.lud16, "⚡ " + p.lud16) : ""}
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Usus no cambia tu perfil de Nostr: solo lo muestra.")}</p>
    <button class="btn" style="width:100%;margin-top:10px" data-act="ns-off">${T("Desconectar")}</button>
    ${nsBusyLine()}</div>`;
}
function nostrBackup(item) {
  const c = NS.cfg(), when = t => new Date(t).toLocaleDateString(LOC(), { day: "numeric", month: "short", year: "numeric" });
  return `<h2>Nostr</h2><div class="panel">${c ? `
    ${item(T("Guardar copia en Nostr"), T("La copia completa, cifrada para que solo tú puedas leerla.") + (c.lastBk ? " " + T("Última: {d}.", { d: when(c.lastBk) }) : ""), "ns-bk-save", T("Guardar"), true)}
    ${item(T("Recuperar de Nostr"), T("Trae tu copia y la combina con lo que hay en este perfil."), "ns-bk-load", T("Recuperar"))}
    <label class="srow" style="cursor:pointer"><span class="t">${T("Copia automática")}<small class="muted" style="display:block;font-size:.8rem">${T("Al terminar cada sesión. Al abrir Usus, avisa si hay una copia más nueva.")}</small></span><input type="checkbox" role="switch" id="nsAuto" ${nsAutoOn() ? "checked" : ""}></label>`
  : `${item(T("Copia en Nostr"), T("Conecta antes tu cuenta de Nostr en Ajustes → Perfil."), "ns-go-set", T("Ir a Perfil"))}`}
    ${nsBusyLine()}</div>`;
}
const NS_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c2-6 6-9 12-10M16 10c1.5-2 2-4 1.5-6-2 0-4 1-5 3"/><circle cx="7" cy="17" r="1"/></svg>';
