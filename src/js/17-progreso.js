/* ---------- Vista: Estadísticas ---------- */
/* Categoría de una sesión según el nombre de su rutina */
/* Bloque de cada rutina: se elige en el editor. Para rutinas y sesiones antiguas sin bloque,
   se deduce por palabras del nombre (en cualquiera de los idiomas). */
const CATS = [
  ["diaria", "Diaria", /diari|daily|movilidad|mobilitat|mobility/i],
  ["empuje", "Empuje", /empuje|empenta|push/i], ["traccion", "Tracción", /tracci|pull|estirada/i],
  ["pierna", "Pierna", /pierna|cama\b|cames|leg/i], ["full", "Full body", /full|cos sencer|cuerpo completo/i],
  ["pecho", "Pecho", /pecho|pit\b|chest/i], ["espalda", "Espalda", /espalda|esquena|back/i],
  ["hombros", "Hombros", /hombro|espatll|shoulder/i], ["brazos", "Brazos", /brazo|braç|arm/i],
  ["core", "Core", /core|abdom/i], ["cardio", "Cardio", /cardio|correr|running|bici|cycl/i],
  ["otro", "Otro", /$^/]
];
const CAT_NAME = Object.fromEntries(CATS.map(c => [c[0], c[1]]));
const NOT_STRENGTH = ["diaria", "cardio", "otro"];
const guessBlock = name => (CATS.find(c => c[2].test(name || "")) || ["otro"])[0];
const catOf = s => s.block && CAT_NAME[s.block] ? s.block
  : (state.routines.find(r => r.name === s.routine)?.block || guessBlock(s.routine));
const isStrength = s => !NOT_STRENGTH.includes(catOf(s));
const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
const fmtClock = min => { min = Math.round(min); return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`; };
const median = a => { const b = [...a].sort((x, y) => x - y), h = b.length >> 1; return b.length % 2 ? b[h] : (b[h - 1] + b[h]) / 2; };
const TROPHY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/></svg>';

function bestOf(e, mode) {
  if (mode === "load") return Math.max(...e.sets.map(x => e1rm(x.w, x.r)));
  if (sideReps(e)) return Math.max(...e.sets.map(x => Math.min(+x.r || 0, +R2(x) || 0)));
  return Math.max(...e.sets.map(x => +x.r || 0));
}
const fmtVal = (mode, v) => mode === "time" ? fmtSec(v) : mode === "load" ? `${fmtKg(Math.round(v * 10) / 10)} kg` : `${Math.round(v)}`;
function exIndex() {
  const m = new Map();
  [...state.sessions].sort((a, b) => a.start - b.start).forEach(s => s.exercises.forEach(e => {
    const k = exKey(e);
    if (!m.has(k)) m.set(k, { key: k, name: exLabel(e), base: e.xid ? "x:" + e.xid : k, tech: e.xid ? techOf(e) : "", items: [] });
    m.get(k).items.push({ t: s.start, e });
  }));
  m.forEach(x => {
    x.mode = x.items.some(i => isTime(i.e)) ? "time" : x.items.some(i => i.e.sets.some(z => +z.w > 0)) ? "load" : "reps";
    x.pts = x.items.map(i => ({ t: i.t, v: bestOf(i.e, x.mode) }));
    for (const r of state.routines) { const re = r.exercises.find(z => exKey(z) === x.key); if (re) { x.target = +re.reps || 0; break; } }
  });
  return m;
}
function spark(pts, color) {
  const W = 72, H = 24, p = pts.slice(-8);
  if (p.length < 2) return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><circle cx="${W / 2}" cy="${H / 2}" r="3" fill="${color}"/></svg>`;
  const lo = Math.min(...p.map(z => z.v)), hi = Math.max(...p.map(z => z.v)), rg = hi - lo || 1;
  const pt = p.map((z, i) => `${(2 + i * (W - 4) / (p.length - 1)).toFixed(1)},${(hi === lo ? H / 2 : H - 3 - (z.v - lo) / rg * (H - 6)).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pt}"/></svg>`;
}

/* --- Bloques --- */
function sbResumen(S, now) {
  const dDays = new Set(S.map(s => dayStart(s.start)));   // racha: días seguidos con algún entreno
  let cur = 0, t = dayStart(now);
  if (!dDays.has(t)) t = addDays(t, -1);
  while (dDays.has(t)) { cur++; t = addDays(t, -1); }
  let best = 0, run = 0, prev = null;
  [...dDays].sort((a, b) => a - b).forEach(d => { run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  const t30 = S.filter(s => s.start >= now - 30 * 864e5).reduce((a, s) => a + Math.max(0, (s.end || s.start) - s.start), 0);
  return `<div class="panel"><div class="kpr"><div><b>${cur} ${cur === 1 ? T("día") : T("días")}</b><span>${T("Racha · mejor {n}", { n: best })}</span></div><div><b>${fmtDur(t30)}</b><span>${T("Entrenado 30 días")}</span></div></div></div>`;
}
function sbConstancia(S, now) {
  const lvl = new Map(), nd = noteDays(), D = DY.all();
  S.forEach(s => { const d = dayStart(s.start); lvl.set(d, Math.max(lvl.get(d) || 0, isStrength(s) ? 2 : catOf(s) === "diaria" ? 1 : 1)); });
  const first = addDays(weekStart(now), -77), today = dayStart(now);
  const DL = T("L,M,X,J,V,S,D").split(",");
  let h = "";
  for (let d = 0; d < 7; d++) {
    h += `<span class="dl">${d % 2 === 0 ? DL[d] : ""}</span>`;
    for (let w = 0; w < 12; w++) {
      const t = addDays(first, w * 7 + d), v = lvl.get(t) || 0;
      const dt = new Date(t);
      const k = dayKey(t), hasN = t <= today && nd.has(k), skip = !v && (D[k]?.tags || []).includes("skip");
      h += `<span class="${t > today ? "fut" : v === 2 ? "l2" : v === 1 ? "l1" : skip ? "skip" : ""}${hasN ? " n" : ""}" title="${dt.toLocaleDateString(LOC())}${hasN ? " · " + T("Con nota") : ""}" ${t <= today ? `${hasN ? "data-dnote" : "data-day"}="${k}" role="button" tabindex="0"` : ""}></span>`;
    }
  }
  h += `<span class="ml"></span>`;
  let lastM = -1;
  for (let w = 0; w < 12; w++) { const m = new Date(addDays(first, w * 7)).getMonth(); h += `<span class="ml">${m !== lastM ? MESES[m] : ""}</span>`; lastM = m; }
  return `<div class="panel"><div class="hm" role="img" aria-label="${T("Calendario de las últimas 12 semanas")}">${h}</div>
    <div class="legend"><span><i style="background:color-mix(in srgb,var(--ok) 55%,var(--surface))"></i>${T("Diaria / otras")}</span><span><i style="background:var(--accent)"></i>${T("Con fuerza")}</span><span><i style="background:var(--line)"></i>${T("Sin entrenar")}</span></span><span><i style="background:repeating-linear-gradient(45deg,var(--line) 0 2px,color-mix(in srgb,var(--warn) 45%,var(--surface)) 2px 4px)"></i>${T("No entrené")}</span><span><i style="background:var(--warn);border-radius:50%"></i>${T("Con nota")}</div></div>`;
}
function sbRecords(IX, now) {
  const recs = [];
  IX.forEach(x => { let best = null; x.pts.forEach(p => { if (best !== null && p.v > best) recs.push({ t: p.t, name: x.name, v: p.v, prev: best, mode: x.mode }); if (best === null || p.v > best) best = p.v; }); });
  const list = recs.filter(r => r.t >= now - 60 * 864e5).sort((a, b) => b.t - a.t).slice(0, 6);
  if (!list.length) return `<div class="panel muted">${T("Aún no hay récords en los últimos 60 días. Aparecen solos al superar tu mejor marca.")}</div>`;
  return `<div class="panel">${list.map(r => { const d = new Date(r.t); return `<div class="rec">${TROPHY}<span style="flex:1">${esc(r.name)} · <b>${fmtVal(r.mode, r.v)}</b> <span class="muted" style="font-size:.8rem">${T("antes")} ${fmtVal(r.mode, r.prev)}</span></span><span class="muted" style="font-size:.8rem">${d.getDate()} ${MESES[d.getMonth()]}</span></div>`; }).join("")}</div>`;
}
function sbEjercicios(IX, now) {
  const rows0 = [...IX.values()].filter(x => x.pts[x.pts.length - 1].t >= now - 60 * 864e5), lastT = x => x.pts[x.pts.length - 1].t, gT = {};
  rows0.forEach(x => { gT[x.base] = Math.max(gT[x.base] || 0, lastT(x)); });
  const rows = rows0.sort((a, b) => gT[b.base] - gT[a.base] || (a.base < b.base ? -1 : a.base > b.base ? 1 : 0) || (a.tech ? 1 : 0) - (b.tech ? 1 : 0) || lastT(b) - lastT(a));
  if (!rows.length) return `<div class="panel muted">${T("Sin ejercicios en los últimos 60 días.")}</div>`;
  return `<div class="panel" style="padding-top:6px;padding-bottom:6px">${rows.map(x => {
    const last = x.pts[x.pts.length - 1].v, prev = x.pts.length > 1 ? x.pts[x.pts.length - 2].v : null;
    const pct = x.target && x.mode !== "load" ? Math.round(last / x.target * 100) : null;
    const col = pct === null ? "var(--muted)" : pct >= 100 ? "var(--ok)" : pct >= 80 ? "var(--accent)" : "var(--danger)";
    const arrow = prev === null ? "" : last > prev ? "↑" : last < prev ? "↓" : "=";
    const open = state.statEx === x.key;
    const sub = `${fmtVal(x.mode, last)}${x.target && x.mode !== "load" ? ` · ${T("obj.")} ${fmtVal(x.mode, x.target)}` : ""}${sideReps(x.items[x.items.length - 1].e) ? " · " + T("peor lado") : ""}`;
    return `<button class="exr" data-statex="${esc(x.key)}" aria-expanded="${open}"><span><div class="nm">${esc(x.name)}</div><div class="sb">${sub}</div></span>${spark(x.pts, col)}<span class="pc" style="color:${col}">${arrow} ${pct !== null ? pct + "%" : ""}</span></button>${open ? `<div class="exd">${x.base.startsWith("x:") && catReady() ? chainBlock(x.base.slice(2)) : ""}${exerciseProgress(x.key, x.name)}</div>` : ""}`;
  }).join("")}<p class="muted" style="font-size:.78rem;margin:6px 0 4px">${T("% = última sesión sobre el objetivo de la rutina. Flecha = respecto a la sesión anterior. Toca para ver el gráfico.")}</p></div>`;
}
function sbEquilibrio(S, now) {
  const acc = new Map();
  S.filter(s => s.start >= now - 28 * 864e5).forEach(s => s.exercises.filter(sideReps).forEach(e => {
    const a = acc.get(e.name) || { l: 0, r: 0 }; e.sets.forEach(x => { a.l += +x.r || 0; a.r += +R2(x) || 0; }); acc.set(e.name, a);
  }));
  if (!acc.size) return `<div class="panel muted">${T("Sin ejercicios por lado en las últimas 4 semanas.")}</div>`;
  return `<div class="panel">${[...acc].map(([n, a]) => {
    const tot = a.l + a.r || 1, mx = Math.max(a.l, a.r) || 1, diff = Math.round((mx - Math.min(a.l, a.r)) / mx * 100);
    const weak = a.l < a.r ? T("izq.") : T("der.");
    return `<div style="margin-top:10px"><div class="rowx"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span><span>${a.l} / ${a.r}${diff > 10 ? ` <span style="color:var(--danger)">· ${weak} −${diff}%</span>` : ""}</span></div>
      <div class="pbar" style="display:flex"><i style="width:${a.l / tot * 100}%;background:var(--accent);border-radius:0"></i><i style="width:${a.r / tot * 100}%;background:var(--muted);border-radius:0"></i></div></div>`;
  }).join("")}<div class="legend"><span><i style="background:var(--accent)"></i>${T("Izquierdo")}</span><span><i style="background:var(--muted)"></i>${T("Derecho")}</span><span>${T("Reps de las últimas 4 semanas. Aviso si un lado rinde más de un 10% menos.")}</span></div></div>`;
}
function sbReparto(S, now) {
  const c = {}; S.filter(s => s.start >= now - 28 * 864e5).forEach(s => { const k = catOf(s); c[k] = (c[k] || 0) + s.exercises.reduce((a, e) => a + e.sets.length, 0); });
  const keys = CATS.map(z => z[0]).filter(k => c[k]);
  if (!keys.length) return `<div class="panel muted">${T("Sin sesiones en las últimas 4 semanas.")}</div>`;
  const mx = Math.max(...keys.map(k => c[k]));
  return `<div class="panel">${keys.map(k => `<div class="bar2"><span>${T(CAT_NAME[k])}</span><div class="pbar" style="margin:0"><i style="width:${c[k] / mx * 100}%;background:${k === "diaria" ? "var(--ok)" : "var(--accent)"}"></i></div><span style="text-align:right">${c[k]}</span></div>`).join("")}
    <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Series hechas por tipo en las últimas 4 semanas.")}</p></div>`;
}
function sbHorario(S, now) {
  const g = {}; S.filter(s => s.start >= now - 28 * 864e5).forEach(s => { const k = catOf(s), d = new Date(s.start); (g[k] = g[k] || []).push({ m: d.getHours() * 60 + d.getMinutes(), dur: Math.max(0, (s.end || s.start) - s.start) }); });
  const keys = CATS.map(z => z[0]).filter(k => g[k]);
  if (!keys.length) return `<div class="panel muted">${T("Sin sesiones en las últimas 4 semanas.")}</div>`;
  return `<div class="panel"><div class="hz h"><span>${T("Tipo")}</span><span>${T("Inicio")}</span><span>${T("Duración")}</span><span>${T("Ses.")}</span></div>${keys.map(k => {
    const a = g[k], m = median(a.map(y => y.m)), du = median(a.map(y => y.dur));
    return `<div class="hz"><span>${T(CAT_NAME[k])}</span><span>${fmtClock(m)}</span><span>${fmtDur(du)}</span><span>${a.length}</span></div>`;
  }).join("")}<p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Valores típicos (mediana) de las últimas 4 semanas: un día suelto a otra hora no los desvía.")}</p></div>`;
}
function sbPeso(now) {
  const l = W.list(), g = W.goal();
  if (!l.length) return `<div class="panel muted">${T("Registra tu peso (aviso los {d} en Entrenar, o en Datos → Peso) para ver la evolución.", { d: DIAS[W.day()] })}</div>`;
  const last = l[l.length - 1], first = l[0];
  const ref = [...l].reverse().find(x => x.t <= last.t - 26 * 864e5);
  const dl = (a, b) => { const v = Math.round((a - b) * 10) / 10; return `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtW(Math.abs(v)).replace(" kg", "")} kg`; };
  const kp = [[fmtW(last.kg), T("Último")], [ref ? dl(last.kg, ref.kg) : "—", T("4 semanas")], [l.length > 1 ? dl(last.kg, first.kg) : "—", T("Desde el inicio")]];
  if (g) kp.push([last.kg > g ? `${fmtW(last.kg - g)}` : T("Conseguido"), T("Para el objetivo ({g})", { g: fmtW(g) })]);
  let chart = "";
  if (l.length >= 2) {
    const WD = 640, H = 200, pl = 40, pr = 12, pt = 14, pb = 26;
    const trend = l.map((x, i) => { const w = l.slice(Math.max(0, i - 2), i + 1); return w.reduce((a, y) => a + y.kg, 0) / w.length; });
    const ys = [...l.map(x => x.kg), ...(g ? [g] : [])];
    let lo = Math.min(...ys) - 0.5, hi = Math.max(...ys) + 0.5;
    const X = i => pl + i / (l.length - 1) * (WD - pl - pr), Y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
    let sv = `<svg viewBox="0 0 ${WD} ${H}" role="img" aria-label="${T("Evolución del peso")}">`;
    for (let k = 0; k <= 3; k++) { const v = lo + (hi - lo) * k / 3; sv += `<line x1="${pl}" x2="${WD - pr}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line)"/><text x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${fmtNum(v)}</text>`; }
    if (g) sv += `<line x1="${pl}" x2="${WD - pr}" y1="${Y(g)}" y2="${Y(g)}" stroke-width="2" stroke-dasharray="6 5" style="stroke:var(--ok)"/><text x="${WD - pr}" y="${Y(g) - 6}" text-anchor="end" font-size="11" style="fill:var(--ok)">${T("objetivo")}</text>`;
    sv += `<polyline fill="none" stroke-width="2.5" stroke-linejoin="round" style="stroke:var(--accent)" points="${trend.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}"/>`;
    l.forEach((x, i) => { const d = new Date(x.t); sv += `<circle cx="${X(i)}" cy="${Y(x.kg)}" r="3.5" style="fill:var(--surface);stroke:var(--muted)" stroke-width="1.5"><title>${d.toLocaleDateString(LOC())} · ${fmtW(x.kg)}</title></circle>`; });
    const nd = noteDays(); l.forEach((x, i) => { const k = dayKey(x.t); if (nd.has(k)) sv += noteDot(X(i), Math.max(8, Y(x.kg) - 13), [k]); });
    const idx = l.length <= 6 ? l.map((_, i) => i) : [0, Math.floor(l.length / 3), Math.floor(2 * l.length / 3), l.length - 1];
    idx.forEach(i => { const d = new Date(l[i].t); sv += `<text x="${X(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === l.length - 1 ? "end" : "middle"}" font-size="11" style="fill:var(--muted)">${d.getDate()} ${MESES[d.getMonth()]}</text>`; });
    chart = `<div class="chart" style="margin-top:12px">${sv}</svg></div><div class="legend"><span><i style="background:var(--muted);border-radius:50%"></i>${T("Pesajes")}</span><span><i style="background:var(--accent)"></i>${T("Tendencia (media de 3)")}</span>${g ? `<span><i style="background:var(--ok)"></i>${T("Objetivo")}</span>` : ""}</div>`;
  }
  return `<div class="panel"><div class="kpr">${kp.map(([v, t]) => `<div><b>${v}</b><span>${t}</span></div>`).join("")}</div>${chart}</div>`;
}
const statsPer = () => { const v = +LS.get("wk.statsPer", 30); return [7, 30, 90].includes(v) ? v : 30; };
/* Objetivos de la semana: fuerza, diaria, distancia y pasos, con los objetivos que ya existen */
function sbObjetivos(S, now) {
  const wk = weekStart(now), inWk = S.filter(s => s.start >= wk), G = LS.get("wk.goals", { daily: 0, strength: 0 });
  const dW = new Set(inWk.filter(s => catOf(s) === "diaria").map(s => dayStart(s.start))).size;
  const fW = new Set(inWk.filter(isStrength).map(s => dayStart(s.start))).size;
  const goalKm = +LS.get("wk.actGoalKm", 0) || 0, goalSt = +LS.get("wk.actGoalSteps", 0) || 0;
  const km = ACT.list().filter(a => keyTime(a.k) >= wk && keyTime(a.k) < addDays(wk, 7)).reduce((p, a) => p + a.km, 0);
  const dd = DY.all(), sd = Object.keys(dd).filter(k => keyTime(k) >= wk && keyTime(k) < addDays(wk, 7) && +dd[k].steps > 0);
  const stAvg = sd.length ? sd.reduce((p, k) => p + +dd[k].steps, 0) / sd.length : 0;
  const rows = [];
  if (G.strength) rows.push([T("Fuerza"), `${fW}/${G.strength}`, fW / G.strength, "var(--accent)"]);
  if (G.daily) rows.push([T("Diaria"), `${dW}/${G.daily}`, dW / G.daily, "var(--ok)"]);
  if (goalKm) rows.push([T("Distancia"), `${fmtKm(km)} / ${fmtKm(goalKm)}`, km / goalKm, "var(--accent)"]);
  if (goalSt) rows.push([T("Pasos (media)"), `${fmtNum(stAvg, 0)} / ${fmtNum(goalSt, 0)}`, stAvg / goalSt, "var(--ok)"]);
  if (!rows.length) return `<div class="panel muted">${T("Aún no hay objetivos. Fija los de fuerza y diaria en Ajustes, y los de distancia y pasos en Actividad → Unidad y objetivos.")}</div>`;
  return `<div class="panel">${rows.map(([l, v, r, c], i) => `<div class="rowx"${i ? ' style="margin-top:10px"' : ""}><span>${l}</span><span>${v}</span></div><div class="pbar"><i style="width:${Math.min(100, Math.round(r * 100))}%;background:${r >= 1 ? "var(--ok)" : c}"></i></div>`).join("")}</div>`;
}
/* Pasos: barras diarias (7 y 30 días) o media por semana (90 días), con línea de objetivo */
function sbPasos(now) {
  const dd = DY.all(), per = statsPer(), goal = +LS.get("wk.actGoalSteps", 0) || 0, st = k => +dd[k]?.steps || 0;
  const nn = per <= 30 ? per : 91, days = Array.from({ length: nn }, (_, i) => dayKey(addDays(now, i - (nn - 1))));
  const rec = days.filter(k => st(k) > 0);
  if (!rec.length) return `<div class="panel muted">${T("Anota tus pasos en Diario → Pasos para verlos aquí.")}</div>`;
  const avg = rec.reduce((p, k) => p + st(k), 0) / rec.length, best = rec.reduce((m, k) => st(k) > st(m) ? k : m, rec[0]);
  const nd = noteDays();
  const bars = per <= 30 ? days.map(k => ({ v: st(k), l: new Date(keyTime(k)).getDate(), t: new Date(keyTime(k)).toLocaleDateString(LOC()), nk: nd.has(k) ? [k] : [] }))
    : Array.from({ length: 13 }, (_, w) => { const wk = days.slice(w * 7, w * 7 + 7), grp = wk.filter(k => st(k) > 0), d0 = new Date(keyTime(days[w * 7]));
      return { v: grp.length ? grp.reduce((p, k) => p + st(k), 0) / grp.length : 0, l: `${d0.getDate()}/${d0.getMonth() + 1}`, t: d0.toLocaleDateString(LOC()), nk: wk.filter(k => nd.has(k)) }; });
  const mx = Math.max(1, goal, ...bars.map(b => b.v)) * 1.12, VW = 640, H = 130, pb = 22, pt = 8, bw = VW / bars.length, Y = v => pt + (1 - v / mx) * (H - pb - pt);
  const every = bars.length > 20 ? 5 : bars.length > 8 ? 2 : 1;
  let sv = `<svg viewBox="0 0 ${VW} ${H}" role="img" aria-label="${T("Pasos")}">`;
  if (goal) sv += `<line x1="0" x2="${VW}" y1="${Y(goal)}" y2="${Y(goal)}" stroke-dasharray="6 5" style="stroke:var(--ok)"/>`;
  bars.forEach((b, i) => { const x = i * bw + bw * .18, hit = goal && b.v >= goal;
    if (b.v) sv += `<rect x="${x}" y="${Y(b.v)}" width="${bw * .64}" height="${H - pb - Y(b.v)}" rx="3" style="fill:${hit ? "var(--ok)" : "var(--accent)"}"><title>${b.t} · ${Math.round(b.v).toLocaleString(LOC())}</title></rect>`;
    if (i % every === every - 1 || i === bars.length - 1) sv += `<text x="${x + bw * .32}" y="${H - 6}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${b.l}</text>`; });
  bars.forEach((b, i) => { if (b.nk.length) sv += noteDot(i * bw + bw / 2, Math.max(8, (b.v ? Y(b.v) : H - pb) - 9), b.nk); });
  sv += "</svg>";
  const k = (b, l) => `<div><b>${b}</b><span>${l}</span></div>`;
  return `<div class="panel"><div class="kpis3">${k(fmtNum(avg, 0), T("Media diaria"))}${k(fmtNum(st(best), 0), T("Mejor día"))}${k(goal ? `${rec.filter(x => st(x) >= goal).length}/${rec.length}` : String(rec.length), goal ? T("Días con objetivo") : T("Días registrados"))}</div>
    <div class="chart" style="margin-top:10px">${sv}</div><p class="muted" style="font-size:.78rem;margin:6px 0 0">${per > 30 ? T("Media diaria de pasos por semana.") : T("Pasos por día.")}${goal ? " " + T("Línea y barras verdes: objetivo.") : ""}</p></div>`;
}
function sbSueno(now) {
  const all = DY.all(), per = statsPer(), days = Array.from({ length: per }, (_, i) => dayKey(addDays(now, -i)));
  const rec = days.map(k => ({ k, sl: all[k]?.sleep })).filter(x => sleepMin(x.sl) !== null);
  if (!rec.length) return `<div class="panel muted">${T("Registra tu sueño en el Diario para ver la evolución.")}</div>`;
  const durs = rec.map(x => sleepMin(x.sl)), avg = durs.reduce((a, b) => a + b, 0) / durs.length;
  const qs = rec.map(x => x.sl.q).filter(Boolean), qa = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : null;
  const beds = rec.map(x => { const m = toMin(x.sl.bed); return m < 720 ? m + 1440 : m; });
  const bedMed = median(beds) % 1440;
  // gráfico: noches (7 y 30 días) o media por semana (90 días)
  const nn = per <= 30 ? per : 91, nk = Array.from({ length: nn }, (_, i) => dayKey(addDays(now, i - (nn - 1)))), nv = nk.map(k => sleepMin(all[k]?.sleep));
  const nd = noteDays();
  const grp = per <= 30 ? nk.map((k, i) => ({ v: nv[i], l: new Date(keyTime(k)).getDate(), t: new Date(keyTime(k)).toLocaleDateString(LOC()), nk: nd.has(k) ? [k] : [] }))
    : Array.from({ length: 13 }, (_, w) => { const g = nv.slice(w * 7, w * 7 + 7).filter(v => v !== null), d0 = new Date(keyTime(nk[w * 7])); return { v: g.length ? g.reduce((p, q) => p + q, 0) / g.length : null, l: `${d0.getDate()}/${d0.getMonth() + 1}`, t: `${d0.toLocaleDateString(LOC())} · ${T("media")}`, nk: nk.slice(w * 7, w * 7 + 7).filter(k => nd.has(k)) }; });
  const mx = Math.max(600, ...grp.map(x => x.v).filter(v => v !== null)) * 1.1, WD = 640, H = 150, pb = 22, pt = 10, bw = WD / grp.length, ev = grp.length > 20 ? 5 : grp.length > 8 ? 2 : 1;
  let sv = `<svg viewBox="0 0 ${WD} ${H}" role="img" aria-label="${T("Horas de sueño")}">`;
  const Y = v => pt + (1 - v / mx) * (H - pb - pt);
  sv += `<line x1="0" x2="${WD}" y1="${Y(avg)}" y2="${Y(avg)}" stroke-width="1.5" stroke-dasharray="6 5" style="stroke:var(--ok)"/><text x="${WD - 4}" y="${Y(avg) - 5}" text-anchor="end" font-size="11" style="fill:var(--ok)">${T("media")} ${fmtHM(avg)}</text>`;
  grp.forEach((g, i) => { const x = i * bw + bw * 0.18;
    if (g.v !== null) sv += `<rect x="${x}" y="${Y(g.v)}" width="${bw * 0.64}" height="${H - pb - Y(g.v)}" rx="3" style="fill:var(--accent)"><title>${g.t} · ${fmtHM(g.v)}</title></rect>`;
    if (i % ev === ev - 1 || i === grp.length - 1) sv += `<text x="${x + bw * 0.32}" y="${H - 6}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${g.l}</text>`; });
  grp.forEach((g, i) => { if (g.nk.length) sv += noteDot(i * bw + bw / 2, Math.max(8, (g.v !== null ? Y(g.v) : H - pb) - 9), g.nk); });
  sv += "</svg>";
  // sueño de la noche antes de un día con o sin fuerza
  const withS = [], without = [];
  rec.forEach(x => { (state.sessions.some(z => dayKey(z.start) === x.k && isStrength(z)) ? withS : without).push(sleepMin(x.sl)); });
  const av = a => a.reduce((p, q) => p + q, 0) / a.length;
  const cmp = withS.length >= 3 && without.length >= 3 ? `<p class="muted" style="font-size:.8rem;margin:8px 0 0">${T("Noche antes de un día con fuerza: {a} · sin fuerza: {b}", { a: fmtHM(av(withS)), b: fmtHM(av(without)) })}</p>` : "";
  return `<div class="panel"><div class="kpis3"><div><b>${fmtHM(avg)}</b><span>${T("Media")}</span></div><div><b>${qa ? fmtNum(qa) + "/5" : "—"}</b><span>${T("Calidad")}</span></div><div><b>${fmtClock(bedMed)}</b><span>${T("Acostarse típico")}</span></div></div>
    <div class="chart" style="margin-top:10px">${sv}</div>${cmp}<p class="muted" style="font-size:.78rem;margin:6px 0 0">${T("{n} noches registradas en {d} días.", { n: rec.length, d: per })}</p></div>`;
}
function sbSupl(now) {
  const sp = DY.supps(), all = DY.all();
  if (!sp.length) return `<div class="panel muted">${T("Añade tus suplementos en Diario → Gestionar.")}</div>`;
  const rows = sp.filter(x => !x.archived).map(x => {
    const firstRec = Object.keys(all).filter(k => all[k]?.supp?.[x.id]).sort()[0];
    const from = Math.max(dayStart(now - (statsPer() - 1) * 864e5), Math.min(dayStart(x.created || now), firstRec ? keyTime(firstRec) : Infinity));
    let days = 0, tk = 0; for (let t = from; t <= now; t = addDays(t, 1)) { days++; if (all[dayKey(t)]?.supp?.[x.id]?.taken) tk++; }
    const pct = days ? Math.round(tk / days * 100) : 0, col = pct >= 90 ? "var(--ok)" : pct >= 60 ? "var(--accent)" : "var(--danger)";
    return `<div class="bar2"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.name)}</span><div class="pbar" style="margin:0"><i style="width:${pct}%;background:${col}"></i></div><span style="text-align:right">${pct}%</span></div>`;
  });
  if (!rows.length) return `<div class="panel muted">${T("No hay suplementos activos.")}</div>`;
  return `<div class="panel">${rows.join("")}<p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Días tomados en el periodo (o desde que lo añadiste).")}</p>${suplLog(now)}</div>`;
}
/* Registro de tomas: una fila por suplemento, una columna por día (los últimos 14). Toca una casilla para abrir ese día en el Diario */
function suplLog(now) {
  const sp = DY.supps().filter(x => !x.archived), all = DY.all(), N = 14;
  if (!sp.length) return "";
  const days = Array.from({ length: N }, (_, i) => dayStart(now - (N - 1 - i) * 864e5));
  const wd = t => new Date(t).toLocaleDateString(LOC(), { weekday: "narrow" });
  const head = `${days.map((t, i) => `<span class="sh${i === N - 1 ? " today" : ""}">${wd(t)}<br>${new Date(t).getDate()}</span>`).join("")}`;
  const rows = sp.map(x => {
    const firstRec = Object.keys(all).filter(k => all[k]?.supp?.[x.id]).sort()[0];
    const since = Math.min(dayStart(x.created || now), firstRec ? keyTime(firstRec) : Infinity);
    let tk = 0, ex = 0;
    const cells = days.map(t => { const k = dayKey(t), v = all[k]?.supp?.[x.id], lbl = new Date(t).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" });
      if (t < since && !v?.taken) return `<span class="sd na" aria-hidden="true"></span>`;
      ex++; if (v?.taken) tk++;
      return `<button class="sd${v?.taken ? " on" : ""}" data-day="${k}" title="${esc(lbl)}${v?.taken && v.amount ? " · " + esc(v.amount) : ""}" aria-label="${esc(x.name)} · ${esc(lbl)} · ${v?.taken ? T("Tomado") : T("No tomado")}"></button>`; }).join("");
    return `<span class="sn">${esc(x.name)}</span><span class="sc">${tk}/${ex}</span>${cells}`;
  }).join("");
  return `<h3 style="font-size:.95rem;margin:18px 0 0">${T("Registro de tomas · 14 días")}</h3>
    <div class="sgrid" role="group" aria-label="${T("Registro de tomas · 14 días")}">${head}${rows}</div>
    <p class="muted" style="font-size:.78rem;margin:10px 0 0">● ${T("Tomado")} · ○ ${T("No tomado")} · ${T("Toca un día para abrirlo en el Diario.")}</p>`;
}
/* Notas de un día, de todas partes: diario (nota y etiquetas), ejercicios (nota y cambio), actividades y suplementos */
function dayNotes(k) {
  const d = DY.get(k), o = { k, tags: d.tags || [], day: (d.note || "").trim(), ses: [], ex: [], act: [], sup: [] };
  state.sessions.filter(x => dayKey(x.start) === k).sort((a, b) => a.start - b.start).forEach(x => {
    o.ses.push({ n: x.routine || T("Libre"), pem: +x.pem || 0, min: Math.round((x.end - x.start) / 60000), note: (x.note || "").trim() });
    if ((x.note || "").trim()) o.snote = true;
    x.exercises.forEach(e => { if ((e.note || "").trim() || e.from) o.ex.push({ n: exLabel(e), note: (e.note || "").trim(), from: e.from || "" }); });
  });
  ACT.list().filter(a => a.k === k && (a.note || "").trim()).forEach(a => o.act.push({ n: a.type, note: a.note.trim() }));
  DY.supps().forEach(x => { const v = d.supp?.[x.id]; if ((v?.note || "").trim()) o.sup.push({ n: x.name, note: v.note.trim() }); });
  o.has = !!(o.tags.length || o.day || o.snote || o.ex.length || o.act.length || o.sup.length);
  return o;
}
/* Días con alguna nota (una pasada por todos los datos) */
function noteDays() {
  const z = new Set(), D = DY.all();
  Object.keys(D).forEach(k => { const e = D[k]; if ((e.tags || []).length || (e.note || "").trim() || Object.values(e.supp || {}).some(v => (v?.note || "").trim())) z.add(k); });
  state.sessions.forEach(x => { if ((x.note || "").trim() || x.exercises.some(e => (e.note || "").trim() || e.from)) z.add(dayKey(x.start)); });
  ACT.list().forEach(a => { if ((a.note || "").trim()) z.add(a.k); });
  return z;
}
const noteSnip = o => o.day || o.ses.map(x => x.note).find(Boolean) || o.ex.map(e => e.note || T("en lugar de {x}", { x: e.from })).find(Boolean) || o.act[0]?.note || o.sup[0]?.note || "";
const tagChips = tags => tags.map(t => { const x = TAGS.find(y => y[0] === t); return `<span class="dntag${t === "skip" ? " skip" : ""}">${esc(x ? T(x[1]) : t)}</span>`; }).join("");
/* Punto naranja en un gráfico: abre las notas de uno o varios días */
const noteDot = (x, y, keys) => `<g class="ndot" data-dnote="${keys.join(",")}" role="button" aria-label="${T("Ver notas")}"><circle cx="${x}" cy="${y}" r="20" fill="transparent"/><circle cx="${x}" cy="${y}" r="8" style="fill:var(--warn);stroke:var(--surface)" stroke-width="2.5"/><title>${T("Ver notas")}</title></g>`;
function dayNoteModal() {
  if (!state.dnote) return "";
  const days = state.dnote.map(dayNotes).filter(o => o.has);
  const fmt = k => new Date(keyTime(k)).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" });
  const one = days.length === 1;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="dnT"><div class="mbox dsh">
    ${mHead("dnT", one ? fmt(days[0].k) : T("Notas de la semana"), "dnote-close")}
    ${days.length ? days.map(o => `<div class="dnd">${one ? "" : `<b>${fmt(o.k)}</b>`}<div>${tagChips(o.tags)}</div>
      ${o.day ? `<div class="dnsrc">${T("Diario")}</div><div>${esc(o.day)}</div>` : ""}
      ${o.ses.length ? `<div class="dnsrc">${T("Sesión")}</div>${o.ses.map(x => `<div>${esc(x.n)} · ${x.min} min${x.pem ? ` · ${T("PEM")} ${x.pem}` : ""}${x.note ? `<div>✎ ${esc(x.note)}</div>` : ""}</div>`).join("")}` : ""}
      ${o.ex.length ? `<div class="dnsrc">${T("Ejercicios")}</div>${o.ex.map(e => `<div><b style="font-weight:600">${esc(e.n)}</b>${e.from ? ` · ⇄ ${T("en lugar de {x}", { x: esc(e.from) })}` : ""}${e.note ? ` · ✎ ${esc(e.note)}` : ""}</div>`).join("")}` : ""}
      ${o.act.length ? `<div class="dnsrc">${T("Actividad")}</div>${o.act.map(a => `<div>${esc(a.n)} · ${esc(a.note)}</div>`).join("")}` : ""}
      ${o.sup.length ? `<div class="dnsrc">${T("Suplementos")}</div>${o.sup.map(a => `<div>${esc(a.n)} · ${esc(a.note)}</div>`).join("")}` : ""}
      ${one ? "" : `<button class="btn small" style="margin-top:8px" data-day="${o.k}">${T("Abrir en el Diario")}</button>`}</div>`).join("") : `<p class="muted">${T("Sin notas en este periodo.")}</p>`}
    <div class="row" style="margin-top:14px">${one ? `<button class="btn" style="flex:1" data-day="${days[0].k}">${T("Abrir en el Diario")}</button>` : ""}<button class="btn primary" style="flex:1" data-act="dnote-close">${T("Cerrar")}</button></div>
  </div></div>`;
}
function sbNotas(now) {
  const all = DY.all(), per = statsPer(), from = dayStart(now - (per - 1) * 864e5), nd = noteDays();
  const keys = [...nd].filter(k => keyTime(k) >= from && keyTime(k) <= now).sort().reverse();
  const cnt = {}; keys.forEach(k => (all[k]?.tags || []).forEach(t => cnt[t] = (cnt[t] || 0) + 1));
  const lbl = `<p class="muted" style="font-size:.8rem;margin:0 0 6px">${T("Últimos {n} días", { n: per })}</p>`;
  if (!keys.length) return `<div class="panel muted">${lbl}${T("Sin notas en este periodo.")}</div>`;
  const items = keys.slice(0, 8).map(dayNotes);
  return `<div class="panel">${lbl}${Object.keys(cnt).length ? `<div class="chips" style="margin-top:0">${TAGS.filter(([t]) => cnt[t]).map(([t, n]) => `<span class="chip">${T(n)} · ${cnt[t]}</span>`).join("")}</div>` : ""}
    ${items.map(o => `<button class="noteb" data-dnote="${o.k}"><span class="muted" style="font-size:.8rem">${new Date(keyTime(o.k)).toLocaleDateString(LOC(), { weekday: "short", day: "numeric", month: "short" })}</span><span>${tagChips(o.tags)} ${esc((x => x.length > 140 ? x.slice(0, 140) + "…" : x)(noteSnip(o)))}</span></button>`).join("")}
    ${keys.length > 8 ? `<p class="muted" style="font-size:.8rem;margin:8px 0 0">${T("Y {n} días más en el Diario.", { n: keys.length - 8 })}</p>` : ""}</div>`;
}
const SB_CAT = { carga: "ent", ciclo: "cue", objetivos: "ent", resumen: "ent", records: "ent", constancia: "ent", ejercicios: "ent", equilibrio: "ent", reparto: "ent", horario: "ent", peso: "cue", sueno: "hab", pasos: "hab", actividad: "hab", suplementos: "hab", notas: "hab" };
const SB_TABS = [["res", "Resumen"], ["ent", "Entreno"], ["cue", "Cuerpo"], ["hab", "Hábitos"]];
const SBLOCKS = {
  objetivos: ["Objetivos de la semana", (S, IX, n) => sbObjetivos(S, n)],
  pasos: ["Pasos", (S, IX, n) => sbPasos(n)],
  sueno: ["Sueño", (S, IX, n) => sbSueno(n)],
  suplementos: ["Suplementos", (S, IX, n) => sbSupl(n)],
  actividad: ["Actividad", (S, IX, n) => sbActividad(n)],
  notas: ["Notas del periodo", (S, IX, n) => sbNotas(n)],
  peso: ["Peso", (S, IX, n) => sbPeso(n)],
  ciclo: ["Ciclo", () => sbCiclo()],
  resumen: ["Resumen", (S, IX, n) => sbResumen(S, n)],
  constancia: ["Constancia · 12 semanas", (S, IX, n) => sbConstancia(S, n)],
  carga: ["Carga semanal", (S, IX, n) => sbCarga(S, n)],
  records: ["Récords recientes", (S, IX, n) => sbRecords(IX, n)],
  ejercicios: ["Ejercicios vs objetivo", (S, IX, n) => sbEjercicios(IX, n)],
  equilibrio: ["Equilibrio izq. / der.", (S, IX, n) => sbEquilibrio(S, n)],
  reparto: ["Reparto por bloque", (S, IX, n) => sbReparto(S, n)],
  horario: ["Horario por bloque", (S, IX, n) => sbHorario(S, n)]
};
function statsOrder() {
  const saved = LS.get("wk.statsOrder", null);
  if (!saved) return ["constancia", "ejercicios", "records", "objetivos", "resumen", "carga", "equilibrio", "reparto", "horario", "peso", "ciclo", "sueno", "pasos", "actividad", "suplementos", "notas"];
  const o = saved.filter(k => SBLOCKS[k]);
  Object.keys(SBLOCKS).forEach(k => { if (!o.includes(k)) o.push(k); });
  return o;
}
/* Resumen: cuatro tarjetas fijas (semana, constancia, récords y peso); el detalle, en sus pestañas */
function viewResumen(S, IX, now) {
  const card = (t, body, to, more) => `<section class="rcard"><div class="rch"><h2>${t}</h2>${to ? `<button class="lnk" data-scat="${to}">${more} ›</button>` : ""}</div>${body}</section>`;
  const kp = l => `<div class="kpr">${l.map(([v, t]) => `<div><b>${v}</b><span>${t}</span></div>`).join("")}</div>`;
  /* Esta semana */
  const wk = weekStart(now), inWk = S.filter(s => s.start >= wk), tW = inWk.reduce((a, s) => a + Math.max(0, (s.end || s.start) - s.start), 0);
  const pn = typeof planNow === "function" ? planNow() : null, pw = pn?.status === "on" && pn.w?.seq ? pn.w : null;
  const G = LS.get("wk.goals", { daily: 0, strength: 0 }), fW = new Set(inWk.filter(isStrength).map(s => dayStart(s.start))).size, dW = new Set(inWk.filter(s => catOf(s) === "diaria").map(s => dayStart(s.start))).size;
  const bars = [...(pw ? [[T("Plan"), pw.done?.size || 0, pw.seq.length]] : []), ...(G.strength ? [[T("Fuerza"), fW, G.strength]] : []), ...(G.daily ? [[T("Diaria"), dW, G.daily]] : [])];
  const semana = kp([[inWk.length, (inWk.length === 1 ? T("sesión") : T("sesiones"))], [fmtDur(tW), T("Entrenado")]])
    + bars.map(([l, v, g]) => `<div class="rowx" style="margin-top:10px"><span>${l}</span><span>${v}/${g}</span></div><div class="pbar"><i style="width:${Math.min(100, Math.round(v / g * 100))}%;background:${v >= g ? "var(--ok)" : "var(--accent)"}"></i></div>`).join("");
  /* Constancia: racha y sesiones por semana (12 semanas) */
  const w0 = addDays(weekStart(now), -77), per = Array.from({ length: 12 }, (_, i) => new Set(S.filter(s => s.start >= addDays(w0, i * 7) && s.start < addDays(w0, i * 7 + 7)).map(s => dayStart(s.start))).size);
  const avg = per.slice(0, 11).reduce((a, b) => a + b, 0) / 11, mx = Math.max(1, ...per);
  let cur = 0; for (let i = per[11] ? 11 : 10; i >= 0 && per[i]; i--) cur++;   // semanas seguidas con algún entreno
  const VW = 320, H = 48, bw = VW / 12;
  let sv = `<svg viewBox="0 0 ${VW} ${H + 16}" role="img" aria-label="${T("Días entrenados por semana")}">`;
  per.forEach((v, i) => { const h = Math.max(v ? 3 : 0, v / mx * H); sv += `<rect x="${i * bw + bw * .18}" y="${H - h}" width="${bw * .64}" height="${h}" rx="3" style="fill:${i === 11 ? "var(--accent)" : "color-mix(in srgb,var(--accent) 45%,var(--surface))"}"><title>${v}</title></rect>`; if (!v) sv += `<rect x="${i * bw + bw * .18}" y="${H - 2}" width="${bw * .64}" height="2" rx="1" style="fill:var(--line)"/>`; });
  [0, 4, 8, 11].forEach(i => { const d = new Date(addDays(w0, i * 7)); sv += `<text x="${i === 11 ? VW : i * bw + bw / 2}" y="${H + 13}" text-anchor="${i === 11 ? "end" : "middle"}" font-size="11" style="fill:var(--muted)">${i === 11 ? T("esta sem.") : d.getDate() + " " + MESES[d.getMonth()]}</text>`; });
  sv += "</svg>";
  const constancia = kp([[cur === 12 ? "12+" : cur, T("Semanas seguidas")], [fmtNum(avg, 1), T("Días por semana (media)")]]) + `<div class="chart" style="margin-top:10px">${sv}</div>`;
  /* Récords */
  const recs = []; IX.forEach(x => { let b = null; x.pts.forEach(p => { if (b !== null && p.v > b) recs.push({ t: p.t, name: x.name, v: p.v, prev: b, mode: x.mode }); if (b === null || p.v > b) b = p.v; }); });
  const rl = recs.filter(r => r.t >= now - 60 * 864e5).sort((a, b) => b.t - a.t).slice(0, 3);
  const records = rl.length ? rl.map(r => { const d = new Date(r.t); return `<div class="rec">${TROPHY}<span style="flex:1;min-width:0">${esc(r.name)} · <b>${fmtVal(r.mode, r.v)}</b></span><span class="muted" style="font-size:.8rem">${d.getDate()} ${MESES[d.getMonth()]}</span></div>`; }).join("")
    : `<p class="muted" style="margin:0">${T("Aún no hay récords en los últimos 60 días. Aparecen solos al superar tu mejor marca.")}</p>`;
  /* Peso */
  const wl = W.list(); let peso = "";
  if (wl.length) {
    const last = wl[wl.length - 1], ref = [...wl].reverse().find(x => x.t <= last.t - 26 * 864e5), g = W.goal();
    const dv = ref ? Math.round((last.kg - ref.kg) * 10) / 10 : null;
    peso = `<div class="kpr wsp">${[[fmtW(last.kg), T("Último")], [dv === null ? "—" : `${dv > 0 ? "+" : dv < 0 ? "−" : ""}${fmtW(Math.abs(dv))}`, T("4 semanas")], ...(g ? [[last.kg > g ? fmtW(last.kg - g) : T("Conseguido"), T("Para el objetivo ({g})", { g: fmtW(g) })]] : [])].map(([v, t]) => `<div><b>${v}</b><span>${t}</span></div>`).join("")}</div>
      ${wl.length > 1 ? `<div class="rspark">${spark(wl.slice(-12).map(x => ({ v: x.kg })), "var(--accent)").replace('width="72" height="24"', 'preserveAspectRatio="none"')}</div>` : ""}`;
  }
  return `<div class="rgrid">${card(T("Esta semana"), semana, "", "")}${card(T("Constancia"), constancia, "ent", T("Calendario"))}${card(T("Récords recientes"), records, "ent", T("Ejercicios"))}${peso ? card(T("Peso"), peso, "cue", T("Detalle")) : ""}</div>
    <div class="aimini"><span>✦ ${T("Analizar con IA externa")} <span class="aibadge">${T("Externa")}</span></span><span class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small" data-act="ai-open">${T("Preparar análisis")}</button><button class="btn small aibtn" data-act="aip-open">✦ ${T("Crear plan con IA")}</button></span></div>`;
}
function viewStats() {
  const S = state.sessions;
  if (!S.length && !W.list().length && !Object.keys(DY.all()).length && !ACT.list().length) return `<div class="phead"><h1>${T("Progreso")}</h1></div><div class="empty">${T("Completa tu primera sesión para ver tu progreso.")}</div>`;
  const now = Date.now(), IX = exIndex(), ed = !!state.statsEdit, hid = LS.get("wk.statsHidden", []);
  const cat = SB_TABS.some(x => x[0] === state.statsCat) ? state.statsCat : (SB_TABS.some(x => x[0] === LS.get("wk.statsCat", "res")) ? LS.get("wk.statsCat", "res") : "res"), per = statsPer();
  const ord = statsOrder().filter(k => (SB_CAT[k] === cat || SB_CAT[k] === "*") && (ed || !hid.includes(k)) && (k !== "ciclo" || cycOn()));
  if (cat === "res") return `<div class="phead"><h1>${T("Progreso")}</h1></div>
    ${utabs(SB_TABS.map(([k, l]) => [k, T(l)]), cat, "scat", T("Progreso"))}${viewResumen(S, IX, now)}`;
  return `<div class="phead"><h1>${T("Progreso")}</h1><button class="btn ghost small" data-act="statsedit">${ed ? T("Hecho") : T("Ordenar")}</button></div>
    ${utabs(SB_TABS.map(([k, l]) => [k, T(l)]), cat, "scat", T("Progreso"))}
    ${cat === "hab" ? `<div class="perrow"><span>${T("Periodo")}</span>${[7, 30, 90].map(p => `<button data-sper="${p}" aria-pressed="${per === p}">${p} ${T("d")}</button>`).join("")}</div>` : ""}
    ${ed ? `<p class="muted" style="font-size:.85rem;margin:8px 0 0">${T("Ordena con ↑ ↓ y elige qué bloques ver.")}</p>` : ""}
    ${ord.map((k, i) => `<section class="sblock${ed && hid.includes(k) ? " hidb" : ""}" data-sb="${k}"><div class="sb-head"><h2>${T(SBLOCKS[k][0])}</h2>${ed ? `
      <button class="btn small" data-shide="${k}" aria-pressed="${!hid.includes(k)}">${hid.includes(k) ? T("Oculto") : T("Visible")}</button>
      <button class="mv" data-mv="${k}:-1" aria-label="${T("Subir")} ${T(SBLOCKS[k][0])}" ${i === 0 ? "disabled" : ""}>↑</button>
      <button class="mv" data-mv="${k}:1" aria-label="${T("Bajar")} ${T(SBLOCKS[k][0])}" ${i === ord.length - 1 ? "disabled" : ""}>↓</button>` : ""}</div>
      ${ed ? "" : SBLOCKS[k][1](S, IX, now)}</section>`).join("")}`;
}

function exerciseProgress(key, name) {
  name = name || key;
  const found = [...state.sessions].sort((a, b) => a.start - b.start)
    .map(s => ({ t: s.start, e: s.exercises.find(x => exKey(x) === key) })).filter(p => p.e);
  // Modo: tiempo (segundos), peso corporal (reps) o con carga (1RM estimado)
  let mode = found.some(p => isTime(p.e)) ? "time" : found.some(p => p.e.sets.some(x => +x.w > 0)) ? "load" : "reps";
  if (mode === "reps" && found.some(p => p.e.sides)) mode = "sides";
  const nd = noteDays();
  const pts = found.map(({ t, e }) => {
    const best = mode === "load" ? Math.max(...e.sets.map(x => e1rm(x.w, x.r))) : Math.max(...e.sets.map(x => +x.r || 0));
    const best2 = Math.max(...e.sets.map(x => +R2(x) || 0));
    const total = mode === "load" ? e.sets.reduce((a, x) => a + x.w * x.r, 0) : e.sets.reduce((a, x) => a + (+x.r || 0), 0);
    const maxW = Math.max(...e.sets.map(x => +x.w || 0));
    return { t, best, best2, total, maxW, note: (e.note || "").trim(), from: e.from || "" };
  });
  const nlist = [...pts].reverse().filter(p => p.note || p.from).slice(0, 8);
  const notesHtml = nlist.length ? `<p class="muted" style="margin:12px 0 0;font-size:.85rem">${T("Notas de este ejercicio")}</p><ul class="exnl">${nlist.map(p => `<li><span class="d">${new Date(p.t).toLocaleDateString(LOC(), { day: "numeric", month: "short" })}</span><span>${p.from ? `⇄ ${T("en lugar de {x}", { x: esc(p.from) })}` : ""}${p.from && p.note ? " · " : ""}${p.note ? `✎ ${esc(p.note)}` : ""}</span></li>`).join("")}</ul>` : "";
  const prB = Math.max(...pts.map(p => p.best)), prT = Math.max(...pts.map(p => p.total)), prW = Math.max(...pts.map(p => p.maxW));
  const M = {
    load: { unit: v => `${fmtKg(v)} kg`, label: T("1RM estimado (fórmula de Epley) por sesión"), cells: [[`${fmtKg(prW)} kg`, T("Peso máximo")], [`${fmtKg(prB)} kg`, T("1RM estimado")], [fmtVol(prT), T("Mejor volumen")]] },
    sides: { unit: v => `${Math.round(v)} reps`, label: T("Mejor serie por lado (reps) por sesión"), cells: [[`${prB}`, T("Mejor izq.")], [`${Math.max(...pts.map(p => p.best2))}`, T("Mejor der.")], [`${pts.length}`, T("Sesiones")]] },
    reps: { unit: v => `${Math.round(v)} reps`, label: T("Mejor serie (repeticiones) por sesión"), cells: [[`${prB}`, T("Mejor serie (reps)")], [`${prT}`, T("Más reps en una sesión")], [`${pts.length}`, T("Sesiones")]] },
    time: { unit: v => fmtSec(v), label: T("Mejor serie (segundos) por sesión"), cells: [[fmtSec(prB), T("Mejor serie")], [fmtSec(prT), T("Más tiempo en una sesión")], [prW ? `${fmtKg(prW)} kg` : `${pts.length}`, prW ? T("Lastre máximo") : T("Sesiones")]] }
  }[mode];
  const prs = `<div class="prs">${M.cells.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>`;
  if (pts.length < 2) return `<p class="muted" style="margin:14px 0 0">${T("Registra este ejercicio en al menos dos sesiones para ver la evolución.")}</p>${prs}${notesHtml}`;

  const W = 640, H = 220, pl = 40, pr = 12, pt = 16, pb = 28;
  const ys = mode === "sides" ? pts.flatMap(p => [p.best, p.best2]) : pts.map(p => p.best);
  let lo = Math.min(...ys) * 0.95, hi = Math.max(...ys) * 1.03 || 1;
  if (hi - lo < 4) { const mid = (Math.min(...ys) + Math.max(...ys)) / 2; lo = Math.max(0, mid - 2); hi = lo + 4; } // evita ejes con valores repetidos
  const X = i => pl + (i / (pts.length - 1)) * (W - pl - pr);
  const Y = v => pt + (1 - (v - lo) / (hi - lo || 1)) * (H - pt - pb);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(M.label)}: ${esc(name)}">`;
  for (let k = 0; k <= 3; k++) {
    const v = lo + (hi - lo) * k / 3, y = Y(v);
    svg += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" style="stroke:var(--line)"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${Math.round(v)}</text>`;
  }
  svg += `<polyline fill="none" stroke-width="2.5" stroke-linejoin="round" style="stroke:var(--accent)" points="${pts.map((p, i) => `${X(i)},${Y(p.best)}`).join(" ")}"/>`;
  if (mode === "sides") {
    svg += `<polyline fill="none" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round" style="stroke:var(--ink)" points="${pts.map((p, i) => `${X(i)},${Y(p.best2)}`).join(" ")}"/>`;
    pts.forEach((p, i) => { svg += `<circle cx="${X(i)}" cy="${Y(p.best2)}" r="4" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2"><title>${new Date(p.t).toLocaleDateString(LOC())} · ${T("der.")} ${p.best2} reps</title></circle>`; });
  }
  pts.forEach((p, i) => {
    const d = new Date(p.t);
    svg += `<circle cx="${X(i)}" cy="${Y(p.best)}" r="4" style="fill:var(--surface);stroke:var(--accent)" stroke-width="2"><title>${d.toLocaleDateString(LOC())} · ${M.unit(p.best)}</title></circle>`;
  });
  const idx = pts.length <= 6 ? pts.map((_, i) => i) : [0, Math.floor(pts.length / 3), Math.floor(2 * pts.length / 3), pts.length - 1];
  idx.forEach(i => { const d = new Date(pts[i].t); svg += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${d.getDate()} ${MESES[d.getMonth()]}</text>`; });
  pts.forEach((p, i) => { const k = dayKey(p.t); if (nd.has(k)) svg += noteDot(X(i), Math.max(8, Y(p.best) - 13), [k]); });
  svg += "</svg>";
  const legend = mode === "sides" ? `<p class="muted" style="margin:6px 0 0;font-size:.8rem"><span style="color:var(--accent)">━</span> ${T("Izquierdo")} · <span style="color:var(--ink)">╍</span> ${T("Derecho")}</p>` : "";
  return `<p class="muted" style="margin:14px 0 6px;font-size:.85rem">${M.label}</p><div class="chart">${svg}</div>${legend}${prs}${notesHtml}`;
}

