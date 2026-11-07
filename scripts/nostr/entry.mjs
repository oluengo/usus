// Puente Nostr de Usus (se empaqueta en nostr.js con `npm run nostr`; la app lo carga solo al usar Nostr).
// Firma y cifrado los hace un firmante externo: Amber (NIP-55, en el APK, como en Wavestr), una extensión del navegador
// (NIP-07: Alby, nos2x…) o un bunker (NIP-46). Con solo la npub no se firma nada: es de solo lectura.
// Usus no ve ni guarda la nsec. Con bunker se guarda solo la clave de esa conexión, para no tener que reconectar.
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";
import { SimplePool } from "nostr-tools/pool";
import { generateSecretKey, getEventHash, verifyEvent } from "nostr-tools/pure";
import * as nip19 from "nostr-tools/nip19";
import { bytesToHex, hexToBytes } from "nostr-tools/utils";

const pool = new SimplePool();
let signer = null;

export async function connect(input, skHex, onauth) {
  const bp = await parseBunkerInput(String(input || "").trim());
  if (!bp) throw new Error("bunker");
  const sk = skHex ? hexToBytes(skHex) : generateSecretKey();
  const s = BunkerSigner.fromBunker(sk, bp, { pool, onauth });
  await s.connect();
  const pubkey = await s.getPublicKey();
  signer = s;
  return { pubkey, sk: bytesToHex(sk), bp };
}
/* Amber (NIP-55) a través del plugin nativo UsusSigner del APK. Se comprueba cada firma. */
const AMBER_PERMS = JSON.stringify([{ type: "sign_event", kind: 30078 }, { type: "sign_event", kind: 1 }, { type: "sign_event", kind: 24242 }, { type: "nip44_encrypt" }, { type: "nip44_decrypt" }]);
const plug = () => window.Capacitor?.Plugins?.UsusSigner;
const toHex = v => { v = String(v || "").trim(); if (/^[0-9a-f]{64}$/i.test(v)) return v.toLowerCase(); try { const d = nip19.decode(v); return d.type === "npub" ? d.data : null; } catch { return null; } };
function amberSigner(pubkey, pkg) {
  const current = nip19.npubEncode(pubkey), req = o => plug().request({ ...o, current, pkg });
  const text = r => { const v = r?.result || r?.signature; if (!v) throw new Error("rejected"); return v; };
  return {
    async getPublicKey() { return pubkey; },
    async signEvent(t) {
      const ev = { kind: t.kind, created_at: t.created_at, tags: t.tags || [], content: t.content || "", pubkey }; ev.id = getEventHash(ev);
      const r = await req({ type: "sign_event", content: JSON.stringify(ev), id: ev.id });
      let out = null; try { out = r.event ? JSON.parse(r.event) : null; } catch {}
      if (!out) { const sig = r.result || r.signature; if (sig && sig.length === 128) out = { ...ev, sig }; }
      if (!out || out.pubkey !== pubkey || out.kind !== ev.kind || !verifyEvent(out)) throw new Error("firma no válida");
      return out;
    },
    async nip44Encrypt(pk, t) { return text(await req({ type: "nip44_encrypt", content: t, pubkey: pk })); },
    async nip44Decrypt(pk, t) { return text(await req({ type: "nip44_decrypt", content: t, pubkey: pk })); },
    async close() {}
  };
}
export async function amberAvailable() { try { return !!(await plug()?.available())?.ok; } catch { return false; } }
export async function amberLogin() {
  if (!plug()) throw new Error("amber");
  const r = await plug().getPublicKey({ permissions: AMBER_PERMS }), pubkey = toHex(r?.result);
  if (!pubkey) throw new Error("amber");
  signer = amberSigner(pubkey, r.package || null);
  return { pubkey, pkg: r.package || null };
}
/* Extensión del navegador (NIP-07). También se comprueba cada firma. */
const ext = () => window.nostr;
function extSigner(pubkey) {
  const n44 = () => { const n = ext()?.nip44; if (!n) throw new Error("la extensión no cifra con NIP-44"); return n; };
  return {
    async getPublicKey() { return pubkey; },
    async signEvent(t) {
      const out = await ext().signEvent({ kind: t.kind, created_at: t.created_at, tags: t.tags || [], content: t.content || "" });
      if (!out || out.pubkey !== pubkey || out.kind !== t.kind || !verifyEvent(out)) throw new Error("firma no válida");
      return out;
    },
    nip44Encrypt: (pk, t) => n44().encrypt(pk, t),
    nip44Decrypt: (pk, t) => n44().decrypt(pk, t),
    async close() {}
  };
}
export const extAvailable = () => !!ext()?.getPublicKey;
export async function extLogin() {
  if (!extAvailable()) throw new Error("extensión");
  const pubkey = toHex(await ext().getPublicKey());
  if (!pubkey) throw new Error("extensión");
  signer = extSigner(pubkey);
  return { pubkey };
}
export function extResume(pubkey) { signer = extSigner(pubkey); return signer; }
/* npub (o clave pública en hex) → hex; null si no vale */
export const pubHex = v => toHex(v);
export function amberResume(pubkey, pkg) { signer = amberSigner(pubkey, pkg); return signer; }
export function resume(bp, skHex, onauth) { signer = BunkerSigner.fromBunker(hexToBytes(skHex), bp, { pool, onauth }); return signer; }
export const active = () => !!signer;
export async function disconnect() { try { await signer?.close(); } catch {} signer = null; }
export const sign = ev => signer.signEvent(ev);
export const encrypt = (pk, text) => signer.nip44Encrypt(pk, text);
export const decrypt = (pk, text) => signer.nip44Decrypt(pk, text);
export async function publish(relays, ev) { await Promise.any(pool.publish(relays, ev)); return ev; }
export const query = (relays, filter, maxWait = 6000) => pool.querySync(relays, filter, { maxWait });
export const get = (relays, filter, maxWait = 6000) => pool.get(relays, filter, { maxWait });
export const npub = hex => nip19.npubEncode(hex);
export const nevent = (id, relays, author) => nip19.neventEncode({ id, relays, author });
