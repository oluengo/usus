// Servidor estático mínimo para las pruebas (sirve la carpeta del proyecto). Uso: node tests/serve.mjs [puerto]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root = process.cwd(), port = +(process.argv[2] || 4321);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2", ".css": "text/css", ".svg": "image/svg+xml" };
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = normalize(join(root, p)); if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
  try { if ((await stat(f)).isDirectory()) { res.writeHead(301, { Location: p + "/" }).end(); return; }
    res.writeHead(200, { "Content-Type": types[extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }).end(await readFile(f)); }
  catch { res.writeHead(404).end("404"); }
}).listen(port, () => console.log(`http://localhost:${port}/`));
