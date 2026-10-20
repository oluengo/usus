// Catálogo (ejercicios.json): fichas completas en es/ca/en, datos para el plan guiado y progresiones coherentes
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const A = JSON.parse(readFileSync("ejercicios.json", "utf8")), by = Object.fromEntries(A.exercises.map(e => [e.id, e]));
const MAT = [...readFileSync("src/js/03-catalogo.js", "utf8").matchAll(/^\s{2}(\w+): \[/gm)].map(m => m[1]);
const PATS = [...readFileSync("src/js/03-catalogo.js", "utf8").matchAll(/\["([a-z-]+)", (?:N_\()?"/g)].map(m => m[1]);
test("cada ficha está completa", () => {
  const ids = new Set();
  for (const e of A.exercises) {
    expect(ids.has(e.id), e.id).toBe(false); ids.add(e.id);
    expect(PATS, e.id).toContain(e.pattern);
    expect(["reps", "time"], e.id).toContain(e.type);
    expect(e.level >= 1 && e.level <= 5, e.id).toBe(true);
    for (const m of e.equip || []) expect(MAT, `${e.id}: ${m}`).toContain(m);
    for (const l of ["es", "ca", "en"]) {
      const i = e.info[l]; expect(e.name[l], `${e.id} ${l}`).toBeTruthy();
      expect(!!(i?.why && i.how?.length && i.errors?.length && i.muscles?.length), `${e.id} ${l}`).toBe(true);
    }
    expect(["main", "accessory", "mobility", "warmup", "cardio"], e.id).toContain(e.role);
    expect(e.dose.length === 2 && e.dose[0] > 0 && e.dose[0] <= e.dose[1], e.id).toBe(true);
    for (const j of e.joints) expect(["muneca", "hombro", "codo", "rodilla", "lumbar"], `${e.id}: ${j}`).toContain(j);
  }
});
test("progresiones y variantes apuntan a ejercicios que existen", () => {
  const inChain = new Set(A.chains.flat());
  for (const c of A.chains) for (const id of c) expect(by[id], id).toBeTruthy();
  for (const [v, b] of Object.entries(A.variants)) { expect(by[v], v).toBeTruthy(); expect(inChain.has(b), b).toBe(true); }
});
