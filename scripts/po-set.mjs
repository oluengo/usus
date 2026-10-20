// Pone traducciones en los .po desde un JSON { "texto en castellano": { "ca": "…", "en": "…" } } (lo uso al añadir textos nuevos).
// Uso: node scripts/po-set.mjs nuevos.json
import { readFileSync, writeFileSync } from "node:fs";
const add = JSON.parse(readFileSync(process.argv[2], "utf8"));
const q = s => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
for (const l of ["ca", "en"]) {
  let po = readFileSync(`i18n/${l}.po`, "utf8"), n = 0;
  for (const [id, tr] of Object.entries(add)) {
    if (!tr[l]) continue;
    const re = new RegExp(`(^|\\n)((?:#[^\\n]*\\n)*)msgid ${q(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\nmsgstr "[^\\n]*"`);
    if (re.test(po)) { po = po.replace(re, (m, a, c) => `${a}${c.replace(/#, fuzzy\n/, "").replace(/, fuzzy/, "")}msgid ${q(id)}\nmsgstr ${q(tr[l])}`); n++; }
  }
  writeFileSync(`i18n/${l}.po`, po); console.log(l, n);
}
