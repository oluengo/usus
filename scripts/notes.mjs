// Release notes: this version's section in CHANGELOG.md plus how to install.
// Usage: node scripts/notes.mjs 2.2.2 [firma-sha256.txt] > notas.md
import { readFileSync, existsSync } from "node:fs";
const v = process.argv[2], sig = process.argv[3];
const log = readFileSync("CHANGELOG.md", "utf8");
const esc = v.replace(/\./g, "\\.");
const m = new RegExp(`\\n## \\[${esc}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`).exec(log);
const en = m ? m[1].trim() : "";
if (!en) { console.error(`CHANGELOG.md has no version ${v}`); process.exit(1); }
const abs = (t) => t.replace(/\]\((?!https?:|#)([^)]+)\)/g, "](https://github.com/oluengo/usus/blob/main/$1)");
const hex = sig && existsSync(sig) ? (readFileSync(sig, "utf8").replace(/:/g, "").match(/\b[0-9A-Fa-f]{64}\b/) || [""])[0] : "";
const fp = hex.toUpperCase().replace(/(..)(?!$)/g, "$1:");
const out = [
  abs(en).replace(/^### /gm, "#### "), "",
  "**Install:** download `usus-" + v + ".apk` (below, under *Assets*) and open it on your phone, or add `https://github.com/oluengo/usus` to [Obtainium](https://github.com/ImranR98/Obtainium) to get notified of every version. APK and PWA data are separate: move them with a backup. [More details](https://github.com/oluengo/usus#install).",
];
if (fp) out.push("", "<sub>Signing certificate SHA-256: `" + fp + "`</sub>");
console.log(out.join("\n"));
