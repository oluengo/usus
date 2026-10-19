/* ---------- Ciclo menstrual (opcional, desactivado por defecto) ----------
   Reglas en wk.cycP [{id, s:"AAAA-MM-DD", e:"AAAA-MM-DD"|null}]; ajustes en wk.cyc; flujo y síntomas del día en el diario (campo cyc). */
const CYC_SYMS = ["Dolor", "Cansancio", "Hinchazón", "Dolor de cabeza", "Sensibilidad", "Ánimo bajo", "Irritabilidad", "Acné", "Antojos", "Insomnio"];
const CYC_REASONS = [["preg", "Embarazo"], ["lact", "Lactancia"], ["horm", "Anticonceptivo hormonal"], ["meno", "Perimenopausia o menopausia"], ["other", "Otro motivo"]];
const CYC = {
  cfg: () => ({ on: false, fert: true, phase: true, warn: true, warnDays: 2, pause: null, ack: false, ...(LS.get("wk.cyc", {}) || {}) }),
  set(patch) { LS.set("wk.cyc", { ...CYC.cfg(), ...patch }); },
  list: () => (LS.get("wk.cycP", []) || []).filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.s)).sort((a, b) => a.s < b.s ? -1 : 1),
  save: l => LS.set("wk.cycP", l),
  syms: () => { const l = LS.get("wk.cycSyms", null); return Array.isArray(l) ? l : CYC_SYMS.slice(); },
  saveSyms: l => LS.set("wk.cycSyms", l)
};
const cycOn = () => curProf().sex !== "m" && CYC.cfg().on;
const kAdd = (k, n) => dayKey(addDays(keyTime(k), n));
const kDiff = (a, b) => Math.round((keyTime(a) - keyTime(b)) / 864e5);
const kFmt = (k, o = { day: "numeric", month: "short" }) => new Date(keyTime(k)).toLocaleDateString(LOC(), o);
/* Cálculo: media de los últimos 6 ciclos (28 días hasta tener 2), ovulación 14 días antes de la regla siguiente, ventana fértil de −5 a +1 */
function cycCalc(today = dayKey(Date.now())) {
  const P = CYC.list().filter(x => x.s <= today), c = CYC.cfg();
  const lens = P.slice(1).map((x, i) => kDiff(x.s, P[i].s)).filter(n => n >= 15 && n <= 60).slice(-6);
  const avg = lens.length >= 2 ? lens.reduce((a, b) => a + b, 0) / lens.length : 28;
  const sd = lens.length >= 2 ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : null;
  const done = P.filter(x => x.e && x.e >= x.s).slice(-6).map(x => kDiff(x.e, x.s) + 1);
  const per = done.length ? Math.round(done.reduce((a, b) => a + b, 0) / done.length) : 5;
  const L = Math.round(avg), last = P[P.length - 1] || null;
  const spread = sd === null ? 3 : Math.max(1, Math.round(sd));
  const irregular = lens.length >= 3 && Math.max(...lens) - Math.min(...lens) > 7;
  const r = { P, lens, avg, sd, per, L, last, spread, irregular, today, paused: !!c.pause };
  if (!last) return r;
  const lastEnd = last.e || (kDiff(today, last.s) < 10 ? null : kAdd(last.s, per - 1));
  r.ongoing = !last.e && kDiff(today, last.s) < 10;
  r.lastEnd = lastEnd;
  r.day = kDiff(today, last.s) + 1;
  r.next = kAdd(last.s, L);
  r.late = today > r.next ? kDiff(today, r.next) : 0;
  r.proj = [1, 2, 3].map(n => { const st = kAdd(last.s, L * n), ov = kAdd(st, -14); return { start: st, end: kAdd(st, per - 1), ov, fa: kAdd(ov, -5), fb: kAdd(ov, 1) }; });
  r.cur = { ov: kAdd(last.s, L - 14) };
  r.cur.fa = kAdd(r.cur.ov, -5); r.cur.fb = kAdd(r.cur.ov, 1);
  return r;
}
/* Fase de un día del ciclo actual */
function cycPhase(r, k = r.today) {
  if (!r.last) return null;
  const c = CYC.cfg(), d = kDiff(k, r.last.s) + 1;
  if (r.ongoing || (r.lastEnd && k <= r.lastEnd)) return T("Menstruación");
  if (c.pause) return null;
  if (k < r.cur.fa) return T("Folicular");
  if (k <= r.cur.fb) return c.fert ? (k === r.cur.ov ? T("Ovulación (aprox.)") : T("Ventana fértil")) : (k < r.cur.ov ? T("Folicular") : T("Lútea"));
  return d > r.L + 10 ? null : T("Lútea");
}
/* Qué es cada día en el calendario: regla registrada, prevista, ovulación o ventana fértil */
function cycKind(k, r) {
  const c = CYC.cfg();
  for (const x of r.P) { const e = x.e || (x === r.last ? (r.ongoing ? r.today : r.lastEnd) : kAdd(x.s, r.per - 1)); if (k >= x.s && k <= e) return "per"; }
  if (!r.last || c.pause) return "";
  const cand = [r.cur, ...r.proj];
  for (const pj of r.proj) if (k > r.today && k >= pj.start && k <= pj.end) return "pred";
  if (c.fert) for (const x of cand) { if (k === x.ov) return "ov"; if (k >= x.fa && k <= x.fb) return "fert"; }
  return "";
}
function cycDisclaimer(short) {
  return short ? T("Estimación aproximada a partir de tus ciclos anteriores. No sirve como anticonceptivo ni como diagnóstico.")
    : T("Las fechas son una estimación aproximada a partir de tus ciclos anteriores. Los ciclos varían por estrés, enfermedad, viajes, medicación u otras causas. No sirve como método anticonceptivo, ni para buscar un embarazo con fiabilidad, ni como diagnóstico. Ante cualquier duda o cambio importante, consulta a un profesional sanitario.");
}
function cycStartOn(k) {
  const l = CYC.list(); if (l.some(x => x.s === k)) return;
  // si cae dentro de una regla ya registrada no crea otra
  if (l.some(x => x.e && k > x.s && k <= x.e)) { toast(T("Ese día ya está dentro de una regla registrada")); return false; }
  l.push({ id: uid(), s: k, e: null }); CYC.save(l); return true;
}
function cycEndOn(k) {
  const l = CYC.list(), x = [...l].reverse().find(z => z.s <= k); if (!x) return false;
  x.e = k; CYC.save(l); return true;
}
/* Tarjeta en Hoy */
function cycCard() {
  if (!cycOn()) return "";
  const c = CYC.cfg(), r = cycCalc(), today = r.today;
  const head = `<div class="row" style="align-items:center"><b style="flex:1">${T("Ciclo")}</b><button class="btn ghost small" data-cyc-open="${today}">${T("Calendario")} →</button></div>`;
  if (!r.last) return `<div class="panel" style="margin-top:12px">${head}
    <p class="muted" style="margin:6px 0 10px;font-size:.9rem">${T("Registra el primer día de tu última regla para empezar a calcular.")}</p>
    <div class="row"><input type="date" id="cycFirst" max="${today}" value="${today}" aria-label="${T("Primer día de la regla")}" style="flex:1"><button class="btn cycb small" data-act="cyc-first">${T("Guardar")}</button></div></div>`;
  const R = 38, C = 2 * Math.PI * R, frac = Math.min(1, r.day / r.L), ph = c.phase ? cycPhase(r) : null;
  let info = "";
  if (c.pause) info = `<div class="muted" style="font-size:.88rem">${T("Predicciones en pausa")}${c.pause.reason ? " · " + T((CYC_REASONS.find(x => x[0] === c.pause.reason) || [0, "Otro motivo"])[1]) : ""}</div>`;
  else {
    const left = kDiff(r.next, today);
    info = `<div class="muted" style="font-size:.88rem">${r.late ? T("La regla se retrasa {n} días respecto a la previsión ({d}).", { n: r.late, d: kFmt(r.next) })
        : T("Próxima regla: {d} (± {n} d) · en {m} días", { d: `<b style="color:var(--ink)">${kFmt(r.next)}</b>`, n: r.spread, m: left })}</div>
      ${c.fert && !r.late ? (today <= r.cur.fb ? `<div class="muted" style="font-size:.88rem">${T("Ovulación aprox.: {d} · ventana fértil {a} – {b}", { d: kFmt(r.cur.ov), a: kFmt(r.cur.fa), b: kFmt(r.cur.fb) })}</div>`
        : `<div class="muted" style="font-size:.88rem">${T("Próxima ovulación aprox.: {d}", { d: kFmt(r.proj[0].ov) })}</div>`) : ""}
      ${r.irregular ? `<div class="muted" style="font-size:.85rem">${T("Ciclos irregulares: la estimación es menos fiable.")}</div>` : ""}`;
  }
  const btn = r.ongoing ? `<button class="btn small" data-act="cyc-end">${T("Ha terminado hoy")}</button>` : `<button class="btn cycb small" data-act="cyc-start">${T("Me ha bajado hoy")}</button>`;
  return `<div class="panel" style="margin-top:12px">${head}
    <div class="cyc-ring" style="margin-top:8px">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${R}" fill="none" style="stroke:var(--line)" stroke-width="9"/>
        ${c.pause ? "" : `<circle cx="50" cy="50" r="${R}" fill="none" style="stroke:var(--cyc)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}" transform="rotate(-90 50 50)"/>`}
        <text x="50" y="${c.pause ? 56 : 49}" text-anchor="middle" font-size="24" font-weight="700" style="fill:var(--ink)">${r.day}</text>
        ${c.pause ? "" : `<text x="50" y="66" text-anchor="middle" font-size="10" style="fill:var(--muted)">${T("de ~{n}", { n: r.L })}</text>`}</svg>
      <div style="display:grid;gap:4px;min-width:0"><div><b>${r.ongoing ? T("Regla · día {n}", { n: r.day }) : T("Día {n} del ciclo", { n: r.day })}</b>${ph && !r.ongoing ? ` · ${ph}` : ""}</div>${info}</div>
    </div>
    <div class="row" style="margin-top:10px">${btn}<button class="btn small" data-cyc-open="${today}">${T("Síntomas")}</button></div>
    ${c.pause ? "" : `<p class="cyc-note">${cycDisclaimer(true)}</p>`}</div>`;
}
/* Aviso en Hoy unos días antes de la regla prevista (solo al abrir la app: no hay notificaciones) */
function cycBanner() {
  if (!cycOn()) return "";
  const c = CYC.cfg(); if (!c.warn || c.pause) return "";
  const r = cycCalc(); if (!r.last || r.ongoing) return "";
  const left = kDiff(r.next, r.today);
  if (left < 0 || left > c.warnDays || LS.get("wk.cycWarnSeen", "") === r.next) return "";
  return prow("var(--cyc)", left === 0 ? T("Hoy podría bajarte la regla") : left === 1 ? T("La regla podría bajarte mañana") : T("La regla podría bajarte en {n} días", { n: left }),
    T("Prevista para el {d} (± {n} d).", { d: kFmt(r.next, { weekday: "long", day: "numeric", month: "long" }), n: r.spread }), `<button class="btn ghost small" data-act="cyc-warn-ok">${T("Entendido")}</button>`);
}
/* Hoja del diario: regla del día, flujo, síntomas y calendario */
function cycSheet(k) {
  const c = CYC.cfg(), r = cycCalc(), e = DY.get(k).cyc || {}, kind = cycKind(k, r), syms = CYC.syms();
  const inPer = kind === "per", rec = CYC.list().find(x => x.s === k);
  const m = state.cycMonth || k.slice(0, 7), [yy, mm] = m.split("-").map(Number), first = new Date(yy, mm - 1, 1), off = (first.getDay() + 6) % 7, n = new Date(yy, mm, 0).getDate();
  const allD = DY.all(), today = dayKey(Date.now());
  let cal = ["L", "M", "X", "J", "V", "S", "D"].map(h => `<span class="h">${T(h)}</span>`).join("") + "<span></span>".repeat(off);
  for (let d = 1; d <= n; d++) { const dk = `${m}-${String(d).padStart(2, "0")}`, kd = cycKind(dk, r), sy = (allD[dk]?.cyc?.sym || []).length;
    cal += `<button class="${kd}${dk === k ? " sel" : ""}${sy ? " sym" : ""}" data-cyc-day="${dk}" ${dk > today ? "disabled" : ""} aria-label="${kFmt(dk, { day: "numeric", month: "long" })}">${d}</button>`; }
  const mName = first.toLocaleDateString(LOC(), { month: "long", year: "numeric" });
  const manage = !!state.cycSymEdit;
  return `<div class="panel"><b>${T("Regla")}</b>
      <div class="row" style="margin-top:8px">${rec ? `<span class="chip" style="border-color:var(--cyc);color:var(--cyc)">${T("Primer día")}</span><button class="btn small" data-act="cyc-del-start">${T("Quitar")}</button>`
        : inPer ? `<button class="btn small" data-act="cyc-end-day">${T("Termina este día")}</button>` : `<button class="btn cycb small" data-act="cyc-start-day">${T("Empieza este día")}</button>`}</div>
      ${inPer ? `<div class="muted" style="font-size:.85rem;margin-top:10px">${T("Cantidad")}</div><div class="chips" style="margin-top:6px">${[["l", "Leve"], ["m", "Moderada"], ["h", "Abundante"]].map(([v, l]) => `<button class="cy${e.flow === v ? " on" : ""}" data-cyc-flow="${v}" aria-pressed="${e.flow === v}">${T(l)}</button>`).join("")}</div>` : ""}
    </div>
    <div class="panel" style="margin-top:10px"><div class="row" style="align-items:center"><b style="flex:1">${T("Síntomas")}</b><button class="btn ghost small" data-act="cyc-sym-edit">${manage ? T("Hecho") : T("Gestionar")}</button></div>
      ${manage ? `${syms.map((x, i) => `<div class="csym"><input type="text" value="${esc(T(x))}" data-cyc-sname="${i}" aria-label="${T("Nombre")}" maxlength="28"><button class="x" data-cyc-sdel="${i}" aria-label="${T("Quitar")}">×</button></div>`).join("")}
          <div class="csym"><input type="text" id="cycNewSym" placeholder="${T("Nuevo síntoma")}" maxlength="28"><button class="btn small" data-act="cyc-sym-add">${T("Añadir")}</button></div>
          <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Quitar un síntoma lo oculta de la lista; los días ya anotados lo conservan.")}</p>`
        : `<div class="chips">${[...new Set([...syms, ...(e.sym || [])])].map(x => `<button class="cy${(e.sym || []).includes(x) ? " on" : ""}" data-cyc-sym="${esc(x)}" aria-pressed="${(e.sym || []).includes(x)}">${esc(T(x))}</button>`).join("")}</div>`}
    </div>
    <div class="panel" style="margin-top:10px">
      <div class="row" style="align-items:center"><button class="mv" data-cyc-m="-1" aria-label="${T("Mes anterior")}">‹</button><b style="flex:1;text-align:center">${mName.charAt(0).toUpperCase() + mName.slice(1)}</b><button class="mv" data-cyc-m="1" aria-label="${T("Mes siguiente")}">›</button></div>
      <div class="ccal">${cal}</div>
      <div class="clegend"><span><i style="background:var(--cyc)"></i>${T("Regla")}</span>${c.pause ? "" : `<span><i style="border:1.5px dashed var(--cyc)"></i>${T("Prevista")}</span>`}${c.fert && !c.pause ? `<span><i style="background:var(--fert);border:1px solid var(--fert-ink)"></i>${T("Fértil (est.)")}</span>` : ""}</div>
      ${c.pause ? "" : `<p class="cyc-note">${cycDisclaimer(true)}</p>`}
    </div>`;
}
/* Bloque de estadísticas */
function sbCiclo() {
  const c = CYC.cfg(), r = cycCalc();
  if (!r.last) return `<div class="panel muted">${T("Registra tus reglas en Diario → Ciclo para ver aquí la media, el historial y las próximas fechas.")}</div>`;
  const k = (b, l) => `<div><b>${b}</b><span>${l}</span></div>`;
  const kp = k(r.lens.length >= 2 ? `${fmtNum(r.avg, 1)} ${T("días")}` : "—", T("Duración media del ciclo")) + k(`${r.per} ${T("días")}`, T("Duración media de la regla"))
    + k(r.sd !== null ? `± ${fmtNum(r.sd, 1)} ${T("días")}` : "—", T("Variación entre ciclos")) + k(String(r.lens.length), T("Ciclos registrados"));
  const nx = c.pause ? `<p class="muted" style="margin:10px 0 0">${T("Predicciones en pausa.")}</p>` : `<div class="cnext">${r.proj.map((pj, i) => `
      ${c.fert && pj.ov >= r.today ? `<div><span class="muted">${T("Ovulación aprox.")} · ${T("fértil")} ${kFmt(pj.fa)} – ${kFmt(pj.fb)}</span><span class="muted">${kFmt(pj.ov)}</span></div>` : ""}
      <div><span>${T("Regla")} ${i + 1}${i === 0 && r.late ? ` · <span style="color:var(--cyc)">${T("retraso {n} d", { n: r.late })}</span>` : ""}</span><b>${kFmt(pj.start)} ± ${r.spread} d</b></div>`).join("")}</div>`;
  const rows = r.P.slice(1).map((x, i) => ({ s: r.P[i].s, len: kDiff(x.s, r.P[i].s) })).filter(x => x.len >= 15 && x.len <= 60).slice(-8).reverse(), mx = Math.max(35, ...rows.map(x => x.len));
  const hist = rows.length ? `<div class="chist">${rows.map(x => `<div class="r"><span>${kFmt(x.s)}</span><div class="t"><i style="width:${x.len / mx * 100}%"></i></div><span style="text-align:right">${x.len} d</span></div>`).join("")}</div>` : `<p class="muted" style="margin:8px 0 0">${T("Con dos reglas registradas verás aquí la duración de cada ciclo.")}</p>`;
  // síntomas más frecuentes (últimos 6 ciclos)
  const from = r.P.length > 6 ? r.P[r.P.length - 6].s : (r.P[0]?.s || r.today), cnt = {};
  Object.entries(DY.all()).forEach(([dk, v]) => { if (dk >= from) (v.cyc?.sym || []).forEach(x => cnt[x] = (cnt[x] || 0) + 1); });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 6);
  // entreno por fase: media de series por sesión (folicular vs lútea) en los ciclos registrados
  const ph = { m: [], f: [], l: [] };
  r.P.forEach((x, i) => { const nxS = r.P[i + 1]?.s || r.next || r.today, Lc = kDiff(nxS, x.s), e = x.e || kAdd(x.s, r.per - 1), ov = kAdd(nxS, -14);
    state.sessions.forEach(s => { const sk = dayKey(s.start); if (sk < x.s || sk >= nxS || Lc > 60) return; (sk <= e ? ph.m : sk <= ov ? ph.f : ph.l).push(doneSets(s)); }); });
  const avgS = a => a.length ? fmtNum(a.reduce((p, q) => p + q, 0) / a.length, 1) : "—";
  const train = ph.m.length + ph.f.length + ph.l.length ? `<div class="kp2">${k(avgS(ph.m), `${T("Menstruación")} · ${ph.m.length} ${T("sesiones")}`)}${k(avgS(ph.f), `${T("Folicular")} · ${ph.f.length} ${T("sesiones")}`)}${k(avgS(ph.l), `${T("Lútea")} · ${ph.l.length} ${T("sesiones")}`)}</div>
      <p class="muted" style="font-size:.78rem;margin:6px 0 0">${T("Media de series por sesión en cada fase. Solo informativo.")}</p>` : "";
  return `<div class="panel">
    <div class="kp2" style="margin-top:0">${kp}</div>
    ${r.irregular ? `<p class="muted" style="margin:10px 0 0;font-size:.85rem">${T("Ciclos irregulares: la estimación es menos fiable.")}</p>` : ""}
    <h3 class="wh">${T("Próximas fechas")}</h3>${nx}
    <h3 class="wh">${T("Historial")}</h3>${hist}
    ${top.length ? `<h3 class="wh">${T("Síntomas más frecuentes")}</h3><div class="chips" style="margin-top:6px">${top.map(([x, n]) => `<span class="chip">${esc(T(x))} · ${n}</span>`).join("")}</div>` : ""}
    ${train ? `<h3 class="wh">${T("Entreno por fase")}</h3>${train}` : ""}
    <p class="cyc-note">${cycDisclaimer(true)}</p></div>`;
}
/* Ajustes del ciclo */
function cycSettings() {
  const c = CYC.cfg(), sw = (id, on, l, sub) => `<label class="xtog swrow"><span>${l}${sub ? `<small>${sub}</small>` : ""}</span><input type="checkbox" role="switch" id="${id}" ${on ? "checked" : ""}></label>`;
  return `<div class="panel">
    ${sw("cycOn", c.on, T("Seguimiento del ciclo"), T("Desactivado por defecto. Al activarlo aparece en Hoy, Diario y Progreso; desactivado no se ve nada."))}
    ${c.on ? `${sw("cycFert", c.fert, T("Mostrar ovulación y ventana fértil (estimación)"))}
      ${sw("cycPhase", c.phase, T("Mostrar la fase del ciclo"))}
      ${sw("cycWarn", c.warn, T("Aviso en Hoy antes de la regla prevista"), T("Se ve al abrir la app; no hay notificaciones con el móvil bloqueado."))}
      ${c.warn ? `<div class="wrow" style="margin-top:8px"><label class="muted" for="cycWarnD" style="font-size:.85rem">${T("Días de antelación")}</label><input id="cycWarnD" type="number" min="1" max="7" inputmode="numeric" value="${c.warnDays}"><span></span></div>` : ""}
      ${sw("cycPause", !!c.pause, T("Pausar predicciones"), T("Con embarazo, lactancia, anticonceptivos hormonales o en la perimenopausia el ciclo cambia o desaparece, y una previsión basada en ciclos anteriores no sería fiable. En pausa puedes seguir anotando sangrado y síntomas."))}
      ${c.pause ? `<div class="wrow" style="margin-top:8px"><label class="muted" for="cycReason" style="font-size:.85rem">${T("Motivo (opcional)")}</label><select id="cycReason"><option value="">—</option>${CYC_REASONS.map(([v, l]) => `<option value="${v}" ${c.pause.reason === v ? "selected" : ""}>${T(l)}</option>`).join("")}</select><span></span></div>` : ""}
      <h3 class="wh">${T("Cómo se calcula")}</h3>
      <p class="muted" style="font-size:.85rem;margin:0">${T("Duración del ciclo: media de los últimos 6 (28 días hasta tener 2 registrados). Regla prevista: último inicio + esa media, con un margen según lo que varían tus ciclos. Ovulación aproximada: 14 días antes de la regla siguiente. Ventana fértil: de 5 días antes a 1 día después de la ovulación.")}</p>
      <p class="muted" style="font-size:.8rem;margin:8px 0 0"><b>${T("Aviso")}:</b> ${cycDisclaimer(false)}</p>
      <button class="btn small danger" style="margin-top:12px" data-act="cyc-wipe">${T("Borrar datos del ciclo")}</button>` : ""}
  </div>`;
}
function cycAckModal() {
  if (!state.cycAsk) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cyT"><div class="mbox">
    <h2 id="cyT" style="margin:0 0 8px">${T("Seguimiento del ciclo")}</h2>
    <p class="muted" style="margin:0">${cycDisclaimer(false)}</p>
    <div class="pcyc" style="margin-top:10px">${CYC_INFO()}</div>
    <p class="muted" style="margin:10px 0 0">${T("Los datos del ciclo se guardan solo en este dispositivo y van en la copia de seguridad completa.")}</p>
    <div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="cyc-ack-no">${T("Cancelar")}</button><button class="btn primary" style="flex:1" data-act="cyc-ack-ok">${T("Entendido, activar")}</button></div>
  </div></div>`;
}
