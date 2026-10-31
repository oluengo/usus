// Usus está en /usus/app/; en /usus/ está la página de presentación.
// Este service worker sustituye al antiguo de /usus/:
// - borra de la caché lo que no es de la app (app/) ni de la beta (beta/);
// - guarda la página de presentación para que la app instalada antes de la mudanza abra también sin conexión
//   (la página detecta la app instalada y salta a app/, que tiene su propio service worker).
const CACHE = "landing-usus-1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add("./")).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil((async () => {
  const base = new URL("./", self.registration.scope).pathname;
  const keep = p => p.startsWith(base + "app/") || p.startsWith(base + "beta/");
  for (const name of await caches.keys()) {
    if (name.startsWith("landing-usus-")) { if (name !== CACHE) await caches.delete(name); continue; }
    if (!name.startsWith("usus-") || name.startsWith("usus-beta-")) continue;
    const c = await caches.open(name);
    for (const req of await c.keys()) if (!keep(new URL(req.url).pathname)) await c.delete(req);
  }
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url), base = new URL("./", self.registration.scope).pathname;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  if (url.pathname !== base && url.pathname !== base + "index.html") return;
  e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put("./", c)); } return r; })
    .catch(() => caches.match("./")));
});
