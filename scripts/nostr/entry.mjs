// Puente Nostr de Usus (se empaqueta en nostr.js con `npm run nostr`; la app lo carga solo al usar Nostr).
// Firma y cifrado los hace el bunker del usuario (NIP-46): Usus no ve ni guarda la nsec.
// Solo se guarda la clave de esta conexión (no es la del usuario) para no tener que reconectar.
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";
import { SimplePool } from "nostr-tools/pool";
import { generateSecretKey } from "nostr-tools/pure";
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
