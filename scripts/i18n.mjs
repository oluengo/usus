// Traducciones de Usus con gettext (.po), el formato estándar que usa Weblate.
// - El castellano es el idioma de origen: el texto que va en T("…") en index.html es el msgid.
// - i18n/usus.pot: plantilla con todos los textos (se genera, no se edita).
// - i18n/<idioma>.po: traducciones (las edita Weblate o a mano).
// - index.html lleva dentro el diccionario I18N generado a partir de los .po (entre las marcas I18N:start / I18N:end).
//
// Uso:
//   node scripts/i18n.mjs extract   lee index.html → usus.pot y actualiza los .po (nuevos vacíos; los que cambian, «fuzzy» con la traducción anterior)
//   node scripts/i18n.mjs build     .po → diccionario I18N dentro de index.html (solo traducciones revisadas, sin «fuzzy»)
//   node scripts/i18n.mjs check     comprueba: textos sin traducir, «fuzzy», huecos {n} distintos; sale con error si hay huecos mal
//   node scripts/i18n.mjs all       extract + build + check
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const HTML = "index.html", DIR = "i18n", POT = `${DIR}/usus.pot`;
const LANGS = { ca: { name: "Català", plural: "nplurals=2; plural=(n != 1);" }, en: { name: "English", plural: "nplurals=2; plural=(n != 1);" } };
const START = "/* I18N:start — generado por scripts/i18n.mjs a partir de i18n/*.po: no editar a mano */", END = "/* I18N:end */";

/* ---------- PO: leer y escribir ---------- */
const unq = s => JSON.parse(s.replace(/\t/g, "\\t"));
const q = s => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t") + '"';
function parsePO(text) {
  const out = [], lines = text.split(/\r?\n/); let e = null, field = null;
  const flush = () => { if (e && (e.id !== undefined)) out.push(e); e = null; field = null; };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) { flush(); continue; }
    if (!e) e = { comments: [], flags: [], refs: [], obsolete: false };
    let l = line;
    if (l.startsWith("#~")) { e.obsolete = true; l = l.replace(/^#~\s?/, ""); if (!l) continue; }
    if (l.startsWith("#,")) { e.flags.push(...l.slice(2).split(",").map(x => x.trim()).filter(Boolean)); continue; }
    if (l.startsWith("#:")) { e.refs.push(l.slice(2).trim()); continue; }
    if (l.startsWith("#")) { e.comments.push(l); continue; }
    let m;
    if ((m = /^msgctxt (".*")$/.exec(l))) { e.ctx = unq(m[1]); field = "ctx"; continue; }
    if ((m = /^msgid (".*")$/.exec(l))) { e.id = unq(m[1]); field = "id"; continue; }
    if ((m = /^msgid_plural (".*")$/.exec(l))) { e.idp = unq(m[1]); field = "idp"; continue; }
    if ((m = /^msgstr (".*")$/.exec(l))) { e.str = unq(m[1]); field = "str"; continue; }
    if ((m = /^msgstr\[(\d)\] (".*")$/.exec(l))) { (e.strs ||= [])[+m[1]] = unq(m[2]); field = "p" + m[1]; continue; }
    if ((m = /^(".*")$/.exec(l)) && field) {
      const v = unq(m[1]);
      if (/^p\d$/.test(field)) e.strs[+field.slice(1)] += v; else e[field] += v;
    }
  }
  flush();
  return out;
}
function writePO(header, entries) {
  const block = e => {
    const L = [], o = e.obsolete ? "#~ " : "";
    if (e.refs?.length && !e.obsolete) L.push(`#: ${e.refs.join(" ")}`);
    if (e.flags?.length) L.push(`#, ${[...new Set(e.flags)].join(", ")}`);
    if (e.ctx !== undefined) L.push(`${o}msgctxt ${q(e.ctx)}`);
    L.push(`${o}msgid ${q(e.id)}`);
    if (e.idp !== undefined) { L.push(`${o}msgid_plural ${q(e.idp)}`); (e.strs || ["", ""]).forEach((s, i) => L.push(`${o}msgstr[${i}] ${q(s || "")}`)); }
    else L.push(`${o}msgstr ${q(e.str || "")}`);
    return L.join("\n");
  };
  return [header, ...entries.map(block)].join("\n\n") + "\n";
}
const hdr = (lang) => [
  `# Usus · ${lang ? LANGS[lang].name : "plantilla"}`,
  `# Este archivo se traduce en Weblate o a mano. Licencia MIT, como la app.`,
  `msgid ""`, `msgstr ""`,
  `"Project-Id-Version: Usus\\n"`, `"MIME-Version: 1.0\\n"`, `"Content-Type: text/plain; charset=UTF-8\\n"`, `"Content-Transfer-Encoding: 8bit\\n"`,
  ...(lang ? [`"Language: ${lang}\\n"`, `"Plural-Forms: ${LANGS[lang].plural}\\n"`] : [`"Language: es\\n"`]),
].join("\n");

/* ---------- Extraer textos de index.html ---------- */
function codeOf(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  return a >= 0 && b > a ? html.slice(0, a) + html.slice(b + END.length) : html;
}
const lit = String.raw`"((?:[^"\\\n]|\\.)*)"`;
function extract(html, keep = new Set()) {
  const code = codeOf(html), found = new Map(), add = (id, idp, ref) => {
    const k = id + (idp ? "\u0004" + idp : ""); if (!found.has(k)) found.set(k, { id, idp, refs: new Set() }); found.get(k).refs.add(ref);
  };
  const lineOf = i => code.slice(0, i).split("\n").length;
  for (const m of code.matchAll(new RegExp(String.raw`\b(?:T|N_)\(\s*` + lit, "g"))) add(unq('"' + m[1] + '"'), undefined, `index.html:${lineOf(m.index)}`);
  for (const m of code.matchAll(new RegExp(String.raw`\bTN\(\s*[^,]+,\s*` + lit + String.raw`\s*,\s*` + lit, "g"))) add(unq('"' + m[1] + '"'), unq('"' + m[2] + '"'), `index.html:${lineOf(m.index)}`);
  // Textos que se traducen con T(variable): se conservan si siguen apareciendo tal cual en el código
  for (const id of keep) if (!found.has(id) && code.includes(JSON.stringify(id))) add(id, undefined, "index.html (dinámico)");
  return [...found.values()];
}
const brace = s => /\{\w+\}/.test(s);
const holes = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(",");
function sim(a, b) {   // parecido 0–1 (distancia de Levenshtein)
  if (a === b) return 1; const n = a.length, m = b.length; if (!n || !m) return 0; if (Math.abs(n - m) / Math.max(n, m) > .5) return 0;
  let p = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) { const c = [i]; for (let j = 1; j <= m; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return 1 - p[m] / Math.max(n, m);
}
function cmdExtract() {
  const html = readFileSync(HTML, "utf8");
  const pos = Object.fromEntries(Object.keys(LANGS).map(l => [l, existsSync(`${DIR}/${l}.po`) ? parsePO(readFileSync(`${DIR}/${l}.po`, "utf8")).filter(e => e.id) : []]));
  const keep = new Set(Object.values(pos).flat().map(e => e.id));
  const src = extract(html, keep).sort((a, b) => a.id.localeCompare(b.id, "es"));
  const tmpl = src.map(s => ({ id: s.id, idp: s.idp, refs: [], flags: brace(s.id + (s.idp || "")) ? ["python-brace-format"] : [] }));
  writeFileSync(POT, writePO(hdr(null), tmpl));
  for (const l of Object.keys(LANGS)) {
    const old = new Map(pos[l].map(e => [e.id + (e.idp ? "\u0004" + e.idp : ""), e])), used = new Set();
    const out = tmpl.map(t => {
      const k = t.id + (t.idp ? "\u0004" + t.idp : ""), o = old.get(k);
      if (o) { used.add(k); return { ...t, str: o.str, strs: o.strs, flags: [...t.flags, ...(o.flags || []).filter(f => f === "fuzzy")] }; }
      // Texto cambiado: busca el más parecido entre los que ya no se usan y lo deja como «fuzzy»
      let best = null, bs = .72;
      for (const [ok, oe] of old) { if (used.has(ok) || tmpl.some(x => x.id === oe.id) || !(oe.str || oe.strs?.[0])) continue; const v = sim(t.id, oe.id); if (v > bs) { bs = v; best = oe; } }
      return best ? { ...t, str: best.str, strs: best.strs, flags: [...t.flags, "fuzzy"] } : { ...t, str: "", strs: t.idp ? ["", ""] : undefined };
    });
    const obs = pos[l].filter(e => !tmpl.some(t => t.id === e.id && t.idp === e.idp) && (e.str || e.strs?.some(Boolean))).map(e => ({ ...e, obsolete: true, refs: [] }));
    writeFileSync(`${DIR}/${l}.po`, writePO(hdr(l), [...out, ...obs.slice(0, 300)]));
  }
  console.log(`extract: ${tmpl.length} textos`);
}
/* ---------- Diccionario dentro de index.html ---------- */
function cmdBuild() {
  let html = readFileSync(HTML, "utf8");
  const dict = {};
  for (const l of Object.keys(LANGS)) {
    const d = {};
    for (const e of parsePO(readFileSync(`${DIR}/${l}.po`, "utf8"))) {
      if (!e.id || e.obsolete || e.flags.includes("fuzzy")) continue;
      if (e.idp !== undefined) { if (e.strs?.every(Boolean)) d[e.id + "\u0004" + e.idp] = e.strs; }
      else if (e.str) d[e.id] = e.str;
    }
    dict[l] = d;
  }
  const body = `${START}\nconst I18N = {\n${Object.entries(dict).map(([l, d]) => `  ${l}: {\n${Object.entries(d).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n")}\n  }`).join(",\n")}\n};\n${END}`;
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a < 0 || b < a) throw new Error("index.html sin las marcas I18N:start / I18N:end");
  html = html.slice(0, a) + body + html.slice(b + END.length);
  writeFileSync(HTML, html);
  console.log("build: " + Object.entries(dict).map(([l, d]) => `${l} ${Object.keys(d).length}`).join(" · "));
}
function cmdCheck() {
  const tmpl = parsePO(readFileSync(POT, "utf8")).filter(e => e.id), bad = [];
  for (const l of Object.keys(LANGS)) {
    const po = parsePO(readFileSync(`${DIR}/${l}.po`, "utf8")).filter(e => e.id && !e.obsolete);
    const miss = po.filter(e => !(e.str || e.strs?.every(Boolean))).length, fz = po.filter(e => e.flags.includes("fuzzy")).length;
    for (const e of po) {
      const tr = e.str || (e.strs || []).join(" "); if (!tr) continue;
      const want = holes(e.id + (e.idp ? " " + e.idp : "")), got = holes(e.str || (e.strs || []).at(-1) || "");
      if (e.idp === undefined && want !== got) bad.push(`${l}: huecos distintos en «${e.id.slice(0, 60)}» (${want} ≠ ${got})`);
    }
    console.log(`${l}: ${po.length - miss} de ${tmpl.length} traducidos${miss ? ` · ${miss} sin traducir` : ""}${fz ? ` · ${fz} por revisar (fuzzy)` : ""}`);
  }
  // El diccionario de index.html debe estar al día con los .po
  const html = readFileSync(HTML, "utf8"); cmdBuild(); const now = readFileSync(HTML, "utf8");
  if (now !== html) console.log("index.html: diccionario actualizado desde los .po");
  if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
}
/* ---------- Migración única: diccionario antiguo (claves = castellano) → .po ---------- */
function cmdMigrate() {
  let html = readFileSync(HTML, "utf8");
  const a = html.indexOf("const I18N = {"), b = html.indexOf("/* ---------- Arranque", a);
  if (html.includes(START)) throw new Error("ya migrado");
  const blockEnd = html.lastIndexOf("};", b) + 2;
  const I18N = new Function(html.slice(a, blockEnd).replace("const I18N =", "return"))();
  for (const l of Object.keys(LANGS)) {
    const entries = Object.entries(I18N[l] || {}).map(([id, str]) => ({ id, str, flags: brace(id) ? ["python-brace-format"] : [], refs: [] }));
    writeFileSync(`${DIR}/${l}.po`, writePO(hdr(l), entries));
  }
  html = html.slice(0, a) + `${START}\nconst I18N = {};\n${END}` + html.slice(blockEnd);
  writeFileSync(HTML, html);
  console.log("migrate: " + Object.keys(LANGS).map(l => `${l} ${Object.keys(I18N[l] || {}).length}`).join(" · "));
}
const cmd = process.argv[2];
const CMDS = { extract: cmdExtract, build: cmdBuild, check: cmdCheck, migrate: cmdMigrate, all: () => { cmdExtract(); cmdCheck(); } };
if (!CMDS[cmd]) { console.error("Uso: node scripts/i18n.mjs extract|build|check|all"); process.exit(2); }
CMDS[cmd]();
