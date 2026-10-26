// Novedades de la ficha (Zapstore): la sección de esta versión en CHANGELOG.md, en
// fastlane/metadata/android/{es-ES,ca,en-US}/changelogs/<versionCode>.txt (texto plano, máx. 500).
// Uso: node scripts/fastlane.mjs 3.4.0   (sin versión: la de APP_VERSION). versionCode: 3.4.0 → 30400.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const v = process.argv[2] || readFileSync("src/js/01-base.js", "utf8").match(/APP_VERSION = "([\d.]+)"/)[1];
const [a, b, c] = v.split(".").map(Number), code = a * 10000 + b * 100 + (c || 0);
const log = readFileSync("CHANGELOG.md", "utf8"), esc = v.replace(/\./g, "\\.");
const part = re => (re.exec(log) || [, ""])[1].trim();
const es = part(new RegExp(`\\n## \\[${esc}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## )`));
const block = h => part(new RegExp(`\\n## ${h}\\n[\\s\\S]*?\\n### \\[${esc}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n### |\\n## |\\n---|$)`));
if (!es) { console.error(`CHANGELOG.md sin la versión ${v}`); process.exit(1); }
const plain = t => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|__|`/g, "").replace(/^#+ /gm, "").replace(/^- /gm, "• ").trim();
const cut = t => t.length <= 500 ? t : t.slice(0, t.lastIndexOf("\n", 497) > 0 ? t.lastIndexOf("\n", 497) : 497) + "\n…";
for (const [loc, txt] of [["es-ES", es], ["ca", block("Català") || es], ["en-US", block("English") || es]]) {
  const dir = `fastlane/metadata/android/${loc}/changelogs`; mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${code}.txt`, cut(plain(txt)) + "\n");
}
console.log(`fastlane: novedades de ${v} → changelogs/${code}.txt`);
