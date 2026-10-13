// Notas de la Release: la sección de esta versión en CHANGELOG.md (castellano, català, English)
// y cómo instalar. Uso: node scripts/notes.mjs 2.2.2 [firma-sha256.txt] > notas.md
import { readFileSync, existsSync } from "node:fs";
const v = process.argv[2], sig = process.argv[3];
const log = readFileSync("CHANGELOG.md", "utf8");
const esc = v.replace(/\./g, "\\.");
const part = (re) => { const m = re.exec(log); return m ? m[1].trim() : ""; };
const es = part(new RegExp(`\\n## \\[${esc}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## )`));
const block = (h) => part(new RegExp(`\\n## ${h}\\n[\\s\\S]*?\\n### \\[${esc}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`));
const ca = block("Català"), en = block("English");
if (!es) { console.error(`CHANGELOG.md sin la versión ${v}`); process.exit(1); }
const hex = sig && existsSync(sig) ? (readFileSync(sig, "utf8").replace(/:/g, "").match(/\b[0-9A-Fa-f]{64}\b/) || [""])[0] : "";
const fp = hex.toUpperCase().replace(/(..)(?!$)/g, "$1:");
const out = [
  "**Castellano** · [Català](#català) · [English](#english)", "",
  es.replace(/^### /gm, "#### "), "",
  "**Instalar:** descarga `usus-" + v + ".apk` (abajo, en *Assets*) y ábrelo en el móvil, o añade `https://github.com/oluengo/usus` en [Obtainium](https://github.com/ImranR98/Obtainium) para recibir avisos de cada versión. Los datos del APK y de la PWA van por separado: pásalos con una copia de seguridad. [Más detalles](https://github.com/oluengo/usus#instalar).",
  "", "### Català", "", ca || "Vegeu el text en castellà.", "",
  "**Instal·lar:** baixa `usus-" + v + ".apk` (a sota, a *Assets*) i obre'l al mòbil, o afegeix `https://github.com/oluengo/usus` a Obtainium per rebre avisos de cada versió. Les dades de l'APK i de la PWA van per separat: passa-les amb una còpia de seguretat.",
  "", "### English", "", en || "See the Spanish text above.", "",
  "**Install:** download `usus-" + v + ".apk` (below, under *Assets*) and open it on your phone, or add `https://github.com/oluengo/usus` to Obtainium to get notified of every version. APK and PWA data are separate: move them with a backup. [More details](https://github.com/oluengo/usus#install).",
];
if (fp) out.push("", "<sub>SHA-256 del certificado de firma / signing certificate: `" + fp + "`</sub>");
console.log(out.join("\n"));
