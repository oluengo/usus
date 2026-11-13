// Store listing release notes (Zapstore): this version's section in CHANGELOG.md, written to
// fastlane/metadata/android/{es-ES,ca,en-US}/changelogs/<versionCode>.txt (plain text, max. 500).
// Usage: node scripts/fastlane.mjs 3.4.0   (no version: APP_VERSION). versionCode: 3.4.0 → 30400.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const v = process.argv[2] || readFileSync("src/js/01-base.js", "utf8").match(/APP_VERSION = "([\d.]+)"/)[1];
const [a, b, c] = v.split(".").map(Number), code = a * 10000 + b * 100 + (c || 0);
const log = readFileSync("CHANGELOG.md", "utf8"), esc = v.replace(/\./g, "\\.");
const m = new RegExp(`\\n## \\[${esc}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(log);
const en = m ? m[1].trim() : "";
if (!en) { console.error(`CHANGELOG.md has no version ${v}`); process.exit(1); }
const plain = t => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|__|`/g, "").replace(/^#+ /gm, "").replace(/^- /gm, "• ").trim();
// Max. 500: if it doesn't fit, drop parentheses first; if it still doesn't, cut at the last whole line
const short = t => t.length <= 500 ? t : t.replace(/ \([^()]*\)/g, "");
const cut0 = t => t.length <= 500 ? t : t.slice(0, t.lastIndexOf("\n", 497) > 0 ? t.lastIndexOf("\n", 497) : 497) + "\n…";
const txt = cut0(short(plain(en))) + "\n";
for (const loc of ["es-ES", "ca", "en-US"]) {
  const dir = `fastlane/metadata/android/${loc}/changelogs`; mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${code}.txt`, txt);
}
console.log(`fastlane: release notes for ${v} → changelogs/${code}.txt`);
