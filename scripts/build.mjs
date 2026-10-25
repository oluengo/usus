// Monta index.html a partir de src/:
//   src/index.html  esqueleto de la página, con las marcas /*@css*/ y /*@js*/
//   src/css/*.css   estilos, en orden de nombre (01-…, 02-…)
//   src/js/*.js     código, en orden de nombre; va todo dentro del mismo bloque (() => { … })()
//                   90-i18n.js es el diccionario de traducciones: lo genera scripts/i18n.mjs, no se edita a mano
// index.html se genera y se sube al repositorio (la web, el APK y las pruebas lo usan tal cual): no lo edites, edita src/.
// Uso: node scripts/build.mjs           escribe index.html
//      node scripts/build.mjs --check   falla si index.html no está al día con src/
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function assemble(root = ".") {
  const shell = readFileSync(`${root}/src/index.html`, "utf8");
  const cat = ext => readdirSync(`${root}/src/${ext}`).filter(f => f.endsWith("." + ext)).sort()
    .map(f => readFileSync(`${root}/src/${ext}/${f}`, "utf8")).join("");
  for (const m of ["/*@css*/\n", "/*@js*/\n"]) if (!shell.includes(m)) throw new Error(`src/index.html sin la marca ${m.trim()}`);
  return shell.replace("/*@css*/\n", () => cat("css")).replace("/*@js*/\n", () => cat("js"));
}
// versionCode de Android (3.5.0 → 30500) en un archivo propio, para que F-Droid lo lea al buscar versiones nuevas.
export function versionCode(html) { const [a, b, c] = /const APP_VERSION = "([\d.]+)"/.exec(html)[1].split(".").map(Number); return a * 10000 + b * 100 + (c || 0); }
const VC = "android/version-code.txt";
export function build(root = ".") { const h = assemble(root); writeFileSync(`${root}/index.html`, h); writeFileSync(`${root}/${VC}`, versionCode(h) + "\n"); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const h = assemble();
    if (h !== readFileSync("index.html", "utf8")) { console.error("index.html no está al día con src/. Ejecuta: npm run build"); process.exit(1); }
    let vc = ""; try { vc = readFileSync(VC, "utf8").trim(); } catch {}
    if (vc !== String(versionCode(h))) { console.error(`${VC} no coincide con APP_VERSION. Ejecuta: npm run build`); process.exit(1); }
    console.log("index.html al día con src/");
  } else { build(); console.log("index.html montado desde src/"); }
}
