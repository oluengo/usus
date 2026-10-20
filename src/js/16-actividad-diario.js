/* ---------- Actividad (caminata, carrera, bici…): registro a posteriori ---------- */
const ACT = {
  list: () => LS.get("wk.acts", []),
  save: l => LS.set("wk.acts", l),
  types: () => { const t = LS.get("wk.actTypes", null); return Array.isArray(t) && t.length ? t : ["Caminata", "Carrera", "Bici"]; },
  saveTypes: t => LS.set("wk.actTypes", t)
};
const BIKE_RX = /bici|bike|cycl|cicl/i;
const fmtActDur = m => { m = Math.round(m); return m < 60 ? `${m} min` : fmtHM(m); };
const MI = 1.609344;
const dU = () => LS.get("wk.distUnit", "km") === "mi" ? "mi" : "km";     // unidad de distancia a mostrar (se guarda siempre en km)
const toU = km => dU() === "mi" ? km / MI : km;
const fromU = v => dU() === "mi" ? v * MI : v;
const fmtKm = v => `${fmtNum(toU(v), toU(v) >= 100 ? 0 : 1)} ${dU()}`;
function actDetail(a) {
  const b = [];
  if (a.km) b.push(fmtKm(a.km));
  if (a.min) b.push(fmtActDur(a.min));
  if (a.km && a.min) {
    const d = toU(a.km);
    if (BIKE_RX.test(a.type)) b.push(`${fmtNum(d / (a.min / 60), 1)} ${dU() === "mi" ? "mph" : "km/h"}`);
    else { const sec = Math.round(a.min / d * 60); b.push(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} /${dU()}`); }
  }
  return b.join(" · ");
}
const actVals = f => ({ km: fromU(parseFloat(String(f.km).replace(",", ".")) || 0), min: (parseFloat(f.h) || 0) * 60 + (parseFloat(f.m) || 0) });
function actFormInit(k) { state.actForm = { type: ACT.types()[0], date: k || dayKey(Date.now()), km: "", h: "", m: "", note: "", newT: false }; }
function readActForm() {
  const f = state.actForm, g = id => document.getElementById(id); if (!f || !g("afk")) return;
  f.km = g("afk").value; f.h = g("afh").value; f.m = g("afm").value; f.note = g("afn").value;
  const d = g("afd").value; if (d) f.date = d > dayKey(Date.now()) ? dayKey(Date.now()) : d;
}
function actPreview(f) {
  const v = actVals(f); if (!v.km && !v.min) return `<span class="muted" style="font-weight:400">${T("Pon la distancia, el tiempo o los dos.")}</span>`;
  const d = actDetail({ type: f.type, km: v.km, min: v.min }); return esc(d);
}
function viewActForm() {
  const f = state.actForm, types = ACT.types(), now = Date.now();
  const when = [[0, T("Hoy")], [1, T("Ayer")], [2, T("Anteayer")]].map(([i, l]) => { const k = dayKey(addDays(now, -i)); return `<button data-awhen="${k}" class="${f.date === k ? "on" : ""}" aria-pressed="${f.date === k}">${l}</button>`; }).join("");
  return `<div class="row"><button class="btn small" data-act="act-cancel">← ${T("Cancelar")}</button></div>
    <h1 style="margin-top:12px">${T("Registrar actividad")}</h1>
    <h2 style="font-size:.95rem;margin:16px 0 0">${T("Tipo")}</h2>
    <div class="chips">${types.map(t => `<button data-atype="${esc(t)}" class="${f.type === t ? "on" : ""}" aria-pressed="${f.type === t}">${esc(t)}</button>`).join("")}<button class="ghostc" data-act="act-newtype">+ ${T("Otro")}</button></div>
    ${f.newT ? `<div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" id="afnt" placeholder="${T("Nombre (p. ej. Patinaje)")}" maxlength="24" style="flex:1"><button class="btn small primary" data-act="act-addtype">${T("Añadir")}</button></div>` : ""}
    <h2 style="font-size:.95rem;margin:16px 0 0">${T("Cuándo")}</h2>
    <div class="chips">${when}</div>
    <input type="date" id="afd" value="${f.date}" max="${dayKey(now)}" aria-label="${T("Elegir fecha")}" style="margin-top:8px">
    <h2 style="font-size:.95rem;margin:16px 0 8px">${T("Distancia y tiempo")}</h2>
    <div class="agrid"><label for="afk">${T("Distancia ({u})", { u: dU() })}<input type="text" id="afk" inputmode="decimal" autocomplete="off" value="${esc(f.km)}" placeholder="0,0"></label>
      <div style="display:grid;gap:4px"><span style="font-size:.8rem;color:var(--muted)">${T("Tiempo")}</span><div class="agrid" style="gap:6px"><input type="number" id="afh" inputmode="numeric" min="0" value="${esc(f.h)}" placeholder="h" aria-label="${T("Horas")}"><input type="number" id="afm" inputmode="numeric" min="0" max="59" value="${esc(f.m)}" placeholder="min" aria-label="${T("Minutos")}"></div></div></div>
    <div class="apv" id="apv" style="margin-top:12px">${actPreview(f)}</div>
    <input type="text" id="afn" value="${esc(f.note)}" placeholder="${T("Nota (opcional)")}" aria-label="${T("Nota (opcional)")}" style="margin-top:12px">
    <button class="btn primary" style="width:100%;margin-top:18px;padding:14px" data-act="act-save">${T("Guardar actividad")}</button>`;
}
function actCard(a) {
  return `<div class="panel actc"><div style="flex:1;min-width:0"><b>${esc(a.type)}</b><div class="muted" style="font-size:.9rem">${actDetail(a)}</div>${a.note ? `<div class="muted" style="font-size:.82rem;margin-top:2px">${esc(a.note)}</div>` : ""}</div>
    <button class="x" data-adel="${a.id}" aria-label="${T("Eliminar")}">×</button></div>`;
}
function sbActividad(now) {
  const all = ACT.list(), dd = DY.all(), stepsOf = k => +dd[k]?.steps || 0, hasSteps = Object.keys(dd).some(k => stepsOf(k) > 0);
  const u = dU(), goalKm = +LS.get("wk.actGoalKm", 0) || 0, goalSt = +LS.get("wk.actGoalSteps", 0) || 0;
  const ty = state.actType || "", met = state.actMet === "min" || state.actMet === "steps" ? state.actMet : "km", sel = all.filter(a => !ty || a.type === ty);
  const types = [...new Set([...ACT.types(), ...all.map(a => a.type)])];
  const W = 8, cur = weekStart(now), ws = Array.from({ length: W }, (_, i) => addDays(cur, -(W - 1 - i) * 7));
  const inW = (k, w) => { const t = keyTime(k); return t >= w && t < addDays(w, 7); };
  const tot = ws.map(w => { const x = sel.filter(a => inW(a.k, w)), sd = Object.keys(dd).filter(k => inW(k, w) && stepsOf(k) > 0);
    return { w, km: x.reduce((p, a) => p + a.km, 0), min: x.reduce((p, a) => p + a.min, 0), st: sd.length ? sd.reduce((p, k) => p + stepsOf(k), 0) / sd.length : 0 }; });
  const val = t => met === "km" ? toU(t.km) : met === "min" ? t.min : t.st;
  const goal = met === "km" ? toU(goalKm) : met === "steps" ? goalSt : 0;
  const mx = Math.max(1, goal, ...tot.map(val));
  const lab = v => met === "km" ? fmtNum(v, v < 10 ? 1 : 0) : met === "min" ? fmtNum(v / 60, 1) + " h" : v >= 1000 ? fmtNum(v / 1000, 1) + "k" : String(Math.round(v));
  const VW = 320, H = 150, bw = VW / W;
  let svg = `<svg class="achart" viewBox="0 0 ${VW} ${H + 34}" width="100%" role="img" aria-label="${T("Actividad por semana")}">`;
  tot.forEach((t, i) => { const v = val(t), bh = v / mx * H, x = i * bw + bw * .17, y = H - bh + 14, last = i === W - 1, hit = goal > 0 && v >= goal;
    svg += `<rect x="${x}" y="${y}" width="${bw * .66}" height="${v ? Math.max(bh, 2) : 0}" rx="4" style="fill:${hit ? "var(--ok)" : last ? "var(--accent)" : "color-mix(in srgb,var(--accent) 35%,var(--surface))"}"/>`;
    if (v) svg += `<text x="${x + bw * .33}" y="${y - 4}" text-anchor="middle">${lab(v)}</text>`;
    const d = new Date(t.w); svg += `<text x="${x + bw * .33}" y="${H + 30}" text-anchor="middle">${d.getDate()}/${d.getMonth() + 1}</text>`; });
  if (goal > 0) { const gy = H - goal / mx * H + 14; svg += `<line x1="0" x2="${VW}" y1="${gy}" y2="${gy}" stroke-dasharray="4 3" style="stroke:var(--ok)"/>`; }
  svg += `<line x1="0" x2="${VW}" y1="${H + 14}" y2="${H + 14}" style="stroke:var(--line)"/></svg>`;
  const k = (b, l) => `<div><b>${b}</b><span>${l}</span></div>`;
  let kp, goalRow = "";
  if (met === "steps") {
    const days = n => Object.keys(dd).filter(x => keyTime(x) > now - n * 864e5 && keyTime(x) <= now && stepsOf(x) > 0);
    const avg = n => { const d = days(n); return d.length ? Math.round(d.reduce((p, x) => p + stepsOf(x), 0) / d.length) : 0; };
    const d30 = days(30), bestK = d30.reduce((m, x) => (!m || stepsOf(x) > stepsOf(m)) ? x : m, null);
    kp = k(fmtNum(avg(7), 0), T("Media 7 días")) + k(fmtNum(avg(30), 0), T("Media 30 días")) + k(bestK ? fmtNum(stepsOf(bestK), 0) : "—", T("Mejor día"))
      + (goalSt ? k(`${d30.filter(x => stepsOf(x) >= goalSt).length}/${d30.length}`, T("Días con objetivo")) : k(String(d30.length), T("Días registrados")));
  } else {
    const d30 = sel.filter(a => keyTime(a.k) > now - 30 * 864e5), wk = tot[W - 1];
    const best = d30.reduce((m, a) => (!m || (a.km || 0) > (m.km || 0) || (!m.km && a.min > m.min)) ? a : m, null);
    kp = k(fmtKm(wk.km), `${T("Esta semana")} · ${fmtActDur(wk.min)}`) + k(fmtKm(d30.reduce((p, a) => p + a.km, 0)), `${T("30 días")} · ${fmtActDur(d30.reduce((p, a) => p + a.min, 0))}`)
      + k(String(d30.length), T("Salidas en 30 días")) + k(best ? (best.km ? fmtKm(best.km) : fmtActDur(best.min)) : "—", `${T("La más larga")}${best ? " · " + esc(best.type) : ""}`);
    if (goalKm > 0) { const wkAll = all.filter(a => inW(a.k, cur)).reduce((p, a) => p + a.km, 0), pct = Math.min(100, Math.round(wkAll / goalKm * 100));
      goalRow = `<div style="margin-top:12px"><div class="row" style="align-items:baseline"><span>${T("Objetivo semanal")}</span><span class="spacer"></span><b>${fmtKm(wkAll)} / ${fmtKm(goalKm)}</b></div>
        <div class="pbar"><i style="width:${pct}%;background:${pct >= 100 ? "var(--ok)" : "var(--accent)"}"></i></div></div>`; }
  }
  const hint = met === "steps" ? T("Media diaria de pasos por semana.") : met === "min" ? T("Horas por semana.") : T("Distancia por semana ({u}).", { u });
  const settings = state.actSet ? `<div class="panel" style="margin-top:12px;background:var(--bg)">
      <div class="muted" style="font-size:.85rem;margin-bottom:6px">${T("Unidad de distancia")}</div>
      <div class="chips" style="margin-top:0"><button data-aunit="km" class="${u === "km" ? "on" : ""}" aria-pressed="${u === "km"}">km</button><button data-aunit="mi" class="${u === "mi" ? "on" : ""}" aria-pressed="${u === "mi"}">mi</button></div>
      <div class="wrow" style="margin-top:12px"><label class="muted" for="gDist" style="font-size:.85rem">${T("Objetivo semanal ({u})", { u })}</label><input id="gDist" type="text" inputmode="decimal" value="${goalKm ? fmtNum(toU(goalKm), 1) : ""}" placeholder="0"><span></span></div>
      <div class="wrow" style="margin-top:10px"><label class="muted" for="gSteps" style="font-size:.85rem">${T("Objetivo diario de pasos")}</label><input id="gSteps" type="number" min="0" inputmode="numeric" value="${goalSt || ""}" placeholder="0"><span></span></div>
      <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Opcional. Vacío o 0 = sin objetivo. Los pasos se anotan en Diario → Pasos.")}</p></div>` : "";
  return `<div class="panel">
    ${met !== "steps" ? `<div class="chips" style="margin-top:0"><button data-atf="" class="${!ty ? "on" : ""}" aria-pressed="${!ty}">${T("Todas")}</button>${types.map(t => `<button data-atf="${esc(t)}" class="${ty === t ? "on" : ""}" aria-pressed="${ty === t}">${esc(t)}</button>`).join("")}</div>` : ""}
    <div class="chips" style="${met !== "steps" ? "" : "margin-top:0"}"><button data-amet="km" class="${met === "km" ? "on" : ""}" aria-pressed="${met === "km"}">${T("Distancia")}</button><button data-amet="min" class="${met === "min" ? "on" : ""}" aria-pressed="${met === "min"}">${T("Tiempo")}</button><button data-amet="steps" class="${met === "steps" ? "on" : ""}" aria-pressed="${met === "steps"}">${T("Pasos")}</button></div>
    <div class="kp2">${kp}</div>${goalRow}
    ${met === "steps" && !hasSteps ? `<p class="muted" style="margin:12px 0 0">${T("Anota tus pasos en Diario → Pasos para verlos aquí.")}</p>` : met !== "steps" && !all.length ? `<p class="muted" style="margin:12px 0 0">${T("Registra caminatas, carreras o bici con «Registrar actividad» en Hoy.")}</p>` : `<div class="chart" style="margin-top:10px">${svg}</div>
    <p class="muted" style="font-size:.78rem;margin:6px 0 0">${hint}${goal > 0 ? " " + T("Línea y barras verdes: objetivo.") : ""}</p>`}
    <div style="margin-top:10px"><button class="btn small" data-act="act-set" aria-expanded="${!!state.actSet}">${T("Unidad y objetivos")} ${state.actSet ? "▴" : "▾"}</button></div>${settings}</div>`;
}
const TAGS = [["skip", "No entrené"], ["pain", "Molestia"], ["tired", "Cansado"], ["great", "Gran sesión"]];
const toMin = hm => { if (!hm) return null; const [h, m] = hm.split(":").map(Number); return isFinite(h) ? h * 60 + (m || 0) : null; };
function sleepMin(sl) { const b = toMin(sl?.bed), w = toMin(sl?.wake); if (b === null || w === null) return null; let d = w - b; if (d <= 0) d += 1440; return d; }
const fmtHM = m => { m = Math.round(m); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
function sessionCard(s) {
  const d = new Date(s.start), mins = Math.round((s.end - s.start) / 60000), ed = state.sessNoteEd === s.id;
  return `<details class="sess"${ed || state.sessOpen === s.id ? " open" : ""}>
    <summary><div style="flex:1;min-width:0"><div style="font-weight:600">${esc(s.routine || T("Sesión libre"))} <span class="tagb">${T(CAT_NAME[catOf(s)] || "Otro")}</span> ${pemChip(s)}</div>
      <div class="muted" style="font-size:.875rem">${d.toLocaleTimeString(LOC(), { hour: "numeric", minute: "2-digit" })} · ${mins} min · ${doneSets(s)} ${T("series")} · ${fmtWork(sessionWork(s))}</div></div></summary>
    <div class="body">
      <table>${s.exercises.map(e => `<tr><td>${xLink(e, esc(exLabel(e)))}${e.from ? `<span class="hint2">${T("en lugar de {x}", { x: esc(e.from) })}</span>` : ""}${e.note ? `<span class="hint2">✎ ${esc(e.note)}</span>` : ""}</td><td class="muted">${e.sets.map(x => fmtSet(x, isTime(e), sideReps(e)) + (rirTxt(x, e) ? ` (${rirTxt(x, e)})` : "")).join(", ")}${sideReps(e) ? ` <span style="font-size:.75rem">(${T("izq/der")})</span>` : ""}${e.sets.some(x => rirTxt(x, e)) ? ` <span style="font-size:.75rem">(${T("RIR")})</span>` : ""}</td></tr>`).join("")}</table>
      ${ed ? `<div class="snoted"><label class="muted" for="ssn_${s.id}" style="font-size:.85rem">${T("Nota de la sesión")}</label><textarea id="ssn_${s.id}" data-ssnote="${s.id}" rows="2" maxlength="280" placeholder="${T("Cómo ha ido, molestias, cambios…")}">${esc(s.note || "")}</textarea>
        ${s.exercises.map((e, i) => `<label class="muted" style="font-size:.85rem;display:block;margin-top:8px" for="sxn_${s.id}_${i}">✎ ${esc(exLabel(e))}</label><input type="text" id="sxn_${s.id}_${i}" data-sxnote="${s.id}:${i}" maxlength="140" value="${esc(e.note || "")}">`).join("")}
        <button class="btn small primary" style="margin-top:10px" data-act="snote-done">${T("Hecho")}</button></div>`
        : `${s.note ? `<p style="margin:10px 0 0">✎ ${esc(s.note)}</p>` : ""}`}
      ${EFF().pem ? `<div style="margin-top:10px"><span class="muted" style="font-size:.85rem">${T("Esfuerzo de la sesión (PEM)")}</span>${pemPicker(s, "spem")}</div>` : ""}
      <div class="row" style="margin-top:10px">${ed ? "" : `<button class="btn small" data-snote="${s.id}">✎ ${T("Notas")}</button>`}<button class="btn small shbtn" data-shsess="${s.id}">${SHARE_ICO}${T("Compartir")}</button><span class="spacer"></span><button class="btn small danger" data-delsess="${s.id}">${T("Eliminar sesión")}</button></div>
    </div></details>`;
}
/* Iconos para añadir al día */
const DICO = {
  ses: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  sleep: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sup: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l5 7"/>',
  steps: '<path d="M7 18c-1.7 0-3-1.2-3-3s1.2-4 3-4 2.5 2 2.5 3.5S8.7 18 7 18zM16 12c-1.7 0-2.5-1.8-2.5-3.5S14.3 4 16 4s3 2.2 3 4-1.3 4-3 4zM5 21h4M14 15h4"/>',
  peso: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9a4 4 0 0 1 8 0zM12 9l1.5-2"/>',
  act: '<circle cx="13" cy="4.5" r="1.8"/><path d="M7 21l3-6 3 2v5M10 15l1-5-3 1-2 3M11 10l3 2 3-1"/>',
  note: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  cyc: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>'
};
function viewDiary() {
  const k = state.day || dayKey(Date.now()), t = keyTime(k), today = dayKey(Date.now());
  const e = DY.get(k), sl = e.sleep || {}, dur = sleepMin(sl), sp = DY.supps().filter(x => !x.archived), taken = e.supp || {};
  const sess = state.sessions.filter(x => dayKey(x.start) === k).sort((a, b) => a.start - b.start);
  const acts = ACT.list().filter(x => x.k === k);
  const dateTxt = new Date(t).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long", year: new Date(t).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  const manage = !!state.suppEdit;
  const nTaken = sp.filter(x => taken[x.id]?.taken).length, goalSt = +LS.get("wk.actGoalSteps", 0) || 0;
  const ws = weekStart(t), allD = DY.all(), allA = ACT.list(), cr = cycOn() ? cycCalc() : null;
  const strip = Array.from({ length: 7 }, (_, i) => { const dt = addDays(ws, i), kk = dayKey(dt), x = allD[kk] || {};
    const dots = [sleepMin(x.sleep) !== null, DY.supps().some(z => !z.archived && x.supp?.[z.id]?.taken), state.sessions.some(z => dayKey(z.start) === kk) || allA.some(z => z.k === kk), +x.steps > 0, !!(x.note || "").trim()];
    if (cycOn()) dots.push(cycKind(kk, cr) === "per" || !!(x.cyc?.sym || []).length);
    return `<button data-dsel="${kk}" ${kk > today ? "disabled" : ""} aria-pressed="${kk === k}" aria-label="${new Date(dt).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" })}"><span class="wd">${new Date(dt).toLocaleDateString(LOC(), { weekday: "narrow" })}</span><b>${new Date(dt).getDate()}</b><span class="dots">${dots.map(v => `<i class="${v ? "on" : ""}"></i>`).join("")}</span></button>`; }).join("");
  const miss = [], tile = (key, label, v, dsc, on, wide, keep) => { if (!on && !keep) { miss.push([key, label]); return ""; }
    return `<button class="srow drow${on ? " on" : ""}" data-dsh="${key}" aria-label="${esc(label)}${v ? ": " + esc(v) : ""}"><span class="dic"><svg viewBox="0 0 24 24" aria-hidden="true">${DICO[key] || DICO.note}</svg></span><span class="t">${label}${dsc ? `<small>${dsc}</small>` : ""}</span>${v ? `<b class="dv">${v}</b>` : ""}<span class="chev" aria-hidden="true">›</span></button>`; };
  const q = sl.q ? "★".repeat(sl.q) + "☆".repeat(5 - sl.q) : "";
  const actTxt = acts.map(a => esc(a.type) + (a.km ? " · " + fmtKm(a.km) : "") + (a.min ? " · " + fmtActDur(a.min) : "")).join("  ·  ");
  const SHN = { sleep: "Sueño", sup: "Suplementos", ses: "Entrenos del día", steps: "Pasos", peso: "Peso", act: "Actividad", note: "Notas del día", cyc: "Ciclo" };
  const dayW = W.list().find(x => dayKey(x.t) === k), lastW = W.list().slice(-1)[0];
  const SHB = {
    sleep: `    <div class="panel">
      <div class="wrow2"><label class="muted" for="slBed">${T("Acostarse")}</label><input type="time" id="slBed" value="${esc(sl.bed || "")}">
        <label class="muted" for="slWake">${T("Levantarse")}</label><input type="time" id="slWake" value="${esc(sl.wake || "")}"></div>
      <div class="row" style="margin-top:10px;align-items:center"><span class="muted" style="font-size:.85rem">${T("Calidad")}</span>
        <div class="stars" role="group" aria-label="${T("Calidad")}">${[1, 2, 3, 4, 5].map(q => `<button data-slq="${q}" class="${(sl.q || 0) >= q ? "on" : ""}" aria-label="${q}/5" aria-pressed="${sl.q === q}"></button>`).join("")}</div>
        <span class="spacer"></span><b>${dur !== null ? fmtHM(dur) : ""}</b></div>
      <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("La noche que termina este día.")}</p>
    </div>`,
    sup: `    <div class="sb-head"><span style="flex:1"></span><button class="btn ghost small" data-act="suppedit">${manage ? T("Hecho") : T("Gestionar")}</button></div>
    <div class="panel">
      ${manage ? `${DY.supps().map(x => `<div class="supm${x.archived ? " arch" : ""}">
          <input type="text" value="${esc(x.name)}" data-sn="${x.id}" aria-label="${T("Nombre")}" placeholder="${T("Nombre")}">
          <input type="text" value="${esc(x.dose ?? "")}" data-sd="${x.id}" aria-label="${T("Dosis")}" placeholder="${T("Dosis")}" inputmode="decimal">
          <input type="text" value="${esc(x.unit || "")}" data-su="${x.id}" aria-label="${T("Unidad")}" placeholder="${T("Unidad")}">
          <input type="text" value="${esc(x.when || "")}" data-sw="${x.id}" aria-label="${T("Momento")}" placeholder="${T("Momento (opcional)")}">
          <button class="btn small" data-sarch="${x.id}">${x.archived ? T("Reactivar") : T("Pausar")}</button>
          <button class="x" data-sdel="${x.id}" aria-label="${T("Eliminar")}">×</button></div>`).join("")}
        <button class="btn small" style="margin-top:10px" data-act="suppadd">${T("Añadir suplemento")}</button>
        <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Pausar lo oculta del diario sin borrar su historial.")}</p>`
      : sp.length ? sp.map(x => { const v = taken[x.id] || {}; return `<div class="supr">
          <button class="check ${v.taken ? "on" : ""}" data-stake="${x.id}" aria-pressed="${!!v.taken}" aria-label="${T("Tomado")}: ${esc(x.name)}">${CHECK}</button>
          <div style="flex:1;min-width:0"><div>${esc(x.name)}${x.when ? ` <span class="muted" style="font-size:.8rem">· ${esc(x.when)}</span>` : ""}</div>
            <input type="text" class="snote" data-snote="${x.id}" value="${esc(v.note || "")}" placeholder="${T("Nota")}" aria-label="${T("Nota")}: ${esc(x.name)}"></div>
          <input type="text" class="samt" data-samt="${x.id}" value="${esc(v.amount ?? x.dose ?? "")}" inputmode="decimal" aria-label="${T("Cantidad")}: ${esc(x.name)}"><span class="muted" style="font-size:.8rem;min-width:28px">${esc(x.unit || "")}</span>
        </div>`; }).join("")
      : `<p class="muted" style="margin:0">${T("Aún no tienes suplementos. Añádelos con Gestionar.")}</p>`}
    </div>`,
    ses: sess.length ? `<div class="list">${sess.map(sessionCard).join("")}</div>` : `<div class="empty">${T("Sin entrenos este día.")}</div>`,
    steps: `    <div class="panel row" style="align-items:center"><label class="muted" for="dSteps" style="flex:1">${T("Pasos del día")}</label>
      <input type="number" id="dSteps" inputmode="numeric" min="0" value="${+e.steps > 0 ? e.steps : ""}" placeholder="0" style="width:130px;text-align:right"></div>`,
    act: `${acts.length ? `<div class="list">${acts.map(actCard).join("")}</div>` : `<div class="empty">${T("Sin actividad este día.")}</div>`}<div style="margin-top:10px"><button class="btn small" data-act="act-open">+ ${T("Registrar")}</button></div>`,
    cyc: cycOn() ? cycSheet(k) : "",
    peso: `    <div class="panel">
      <input type="hidden" id="wDate" value="${k}">
      <div class="wrow"><label class="muted" for="wKg" style="font-size:.85rem">${T("Peso en kg")}</label><input id="wKg" type="text" inputmode="decimal" value="${dayW ? fmtNum(dayW.kg) : ""}" placeholder="${lastW ? fmtNum(lastW.kg) : "kg"}"><button class="btn primary small" data-act="w-add">${T("Guardar")}</button></div>
      ${dayW ? `<button class="btn ghost small danger" style="margin-top:8px" data-wdel="${dayW.id}">${T("Borrar registro")}</button>` : ""}
      <p class="muted" style="font-size:.8rem;margin:12px 0 0">${W.goal() ? `${T("Objetivo")}: ${fmtW(W.goal())} · ` : ""}<button class="verb" data-act="go-perfil">${T("Objetivo y recordatorio, en tu perfil")}</button></p>
            ${W.list().length ? `<div style="margin-top:12px">${W.list().slice(-6).reverse().map(x => `<div class="rowx" style="padding:6px 0;border-top:1px solid var(--line);align-items:center"><span>${new Date(x.t).toLocaleDateString(LOC(), { day: "numeric", month: "short", year: "numeric" })} · <b>${fmtW(x.kg)}</b></span><button class="x" data-wdel="${x.id}" aria-label="${T("Borrar registro")}">×</button></div>`).join("")}</div>` : ""}
    </div>`,
    note: `    <div class="panel">
      <textarea id="dNote" rows="3" placeholder="${T("Cómo ha ido, por qué no se ha podido entrenar, molestias…")}">${esc(e.note || "")}</textarea>
      <div class="chips">${TAGS.map(([tk, tn]) => `<button data-dtag="${tk}" class="${(e.tags || []).includes(tk) ? "on" : ""}" aria-pressed="${(e.tags || []).includes(tk)}">${T(tn)}</button>`).join("")}</div>
    </div>`
  };
  const sh = state.dsheet && SHB[state.dsheet] ? `<div class="modal" role="dialog" aria-modal="true" aria-label="${T(SHN[state.dsheet])}"><div class="mbox dsh">
      ${mHead("dshT", T(SHN[state.dsheet]), "dsheet-close")}
      ${SHB[state.dsheet]}
      <button class="dlink" data-dgo="${state.dsheet}">${T("Ver en Progreso")} →</button></div></div>` : "";
  return `
    <div class="dnav">
      <button class="mv" data-dmove="-1" aria-label="${T("Día anterior")}">‹</button>
      <div style="flex:1;text-align:center"><div style="font-size:1.3rem;font-weight:700">${k === today ? T("Hoy") : k === dayKey(addDays(Date.now(), -1)) ? T("Ayer") : T("Diario")}</div>
        <label class="muted" style="font-size:.85rem">${dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1)}<input type="date" id="dPick" value="${k}" max="${today}" aria-label="${T("Elegir fecha")}" class="dpick"></label></div>
      <button class="mv" data-dmove="1" aria-label="${T("Día siguiente")}" ${k >= today ? "disabled" : ""}>›</button>
    </div>
    ${k !== today ? `<div style="text-align:center;margin-top:6px"><button class="btn ghost small" data-dmove="today">${T("Ir a hoy")}</button></div>` : ""}
    <div class="wstrip">${strip}</div>
    ${(() => { const tl = `      ${sess.length ? tile("ses", T("Entreno"), `${Math.round(sess.reduce((p, z) => p + (z.end - z.start), 0) / 60000)} min`, `${sess.map(z => esc(z.routine || T("Sesión libre"))).join(" · ")} · ${TN(sess.reduce((p, z) => p + doneSets(z), 0), "{n} serie", "{n} series")}`, true) : ""}
      ${tile("act", T("Actividad"), acts.length ? (acts.some(a => a.km) ? fmtKm(acts.reduce((p, a) => p + (+a.km || 0), 0)) : fmtActDur(acts.reduce((p, a) => p + (+a.min || 0), 0))) : "—", actTxt, acts.length > 0)}
      ${tile("peso", T("Peso"), dayW ? fmtW(dayW.kg) : "—", !dayW && lastW ? `${T("último")}: ${fmtW(lastW.kg)}` : W.goal() ? `${T("objetivo")} ${fmtW(W.goal())}` : "", !!dayW)}
      ${tile("sleep", T("Sueño"), dur !== null ? fmtHM(dur) : "—", q, dur !== null)}
      ${tile("steps", T("Pasos"), +e.steps > 0 ? (+e.steps).toLocaleString(LOC()) : "—", goalSt ? `${T("objetivo")} ${goalSt.toLocaleString(LOC())}` : "", +e.steps > 0 && (!goalSt || e.steps >= goalSt))}
      ${tile("sup", T("Suplementos"), sp.length ? `${nTaken}/${sp.length}` : "—", sp.length ? T("tomados") : T("Sin suplementos"), sp.length > 0 && nTaken === sp.length, false, sp.length > 0)}
      ${cr ? (() => { const kd = cycKind(k, cr), ce = e.cyc || {}, dd = cr.last && k >= cr.last.s ? kDiff(k, cr.last.s) + 1 : null, ph = CYC.cfg().phase && cr.last && k >= cr.last.s ? cycPhase(cr, k) : null;
        return tile("cyc", T("Ciclo"), kd === "per" ? T("Regla") : dd ? T("Día {n}", { n: dd }) : "—", (ce.sym || []).length ? ce.sym.map(x => esc(T(x))).join(", ") : (ph && kd !== "per" ? ph : ""), kd === "per" || !!(ce.sym || []).length, true, true); })() : ""}
      ${tile("note", T("Notas del día"), "", [(e.note || "").trim() ? esc(e.note.trim().slice(0, 60)) + (e.note.trim().length > 60 ? "…" : "") : "", (e.tags || []).map(x => T((TAGS.find(z => z[0] === x) || [0, x])[1])).join(" · ")].filter(Boolean).join(" · "), !!(e.note || "").trim() || !!(e.tags || []).length)}`;
      return `${tl.trim() ? `<div class="lgroup dlist">${tl}</div>` : `<p class="muted" style="margin:14px 4px 0">${T("Nada anotado este día")}</p>`}
      ${miss.length ? `<p class="addh">${T("Añadir a este día")}</p><div class="lgroup dlist dadd" role="group" aria-label="${T("Añadir a este día")}">${miss.map(([kk, l]) => `<button class="srow drow" data-dsh="${kk}"><span class="dic"><svg viewBox="0 0 24 24" aria-hidden="true">${DICO[kk] || DICO.note}</svg></span><span class="t">${l}</span><span class="dplus" aria-hidden="true">+</span></button>`).join("")}</div>` : ""}`; })()}
    ${sh}`;
}

