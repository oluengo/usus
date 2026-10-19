/* ---------- Compartir ----------
   Sin servidor: el móvil abre su menú de compartir (o se copia/descarga si no lo hay).
   Rutinas: enlace con los datos tras «#r=» (comprimidos, nunca llegan a ningún servidor) o archivo .json. */
const appURL = () => location.href.split(/[?#]/)[0].replace(/index\.html$/, "");
const SHARE_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
function saveFile(file) {
  const url = URL.createObjectURL(file), a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function shareOut({ title, text, url, file }) {
  const data = { title };
  if (text) data.text = text;
  if (url) data.url = url;
  if (file) { if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file]; else { saveFile(file); toast(T("Archivo guardado")); return true; } }
  if (navigator.share) { try { await navigator.share(data); return true; } catch (e) { if (e.name === "AbortError") return false; } }
  if (file) { saveFile(file); toast(T("Archivo guardado")); return true; }
  const ok = await copyText([text, url].filter(Boolean).join("\n"));
  toast(ok ? T("Copiado. Pégalo donde quieras.") : T("No se pudo copiar")); return ok;
}
/* La app */
const shareAppText = () => T("Usus: registro de entrenos y hábitos. Gratis, sin cuentas y tus datos se quedan en tu móvil.");
function shareAppBlock() {
  return `<p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("¿Le puede servir a alguien? Envíale el enlace.")}</p>
    <div class="row"><button class="btn primary shbtn" style="flex:1" data-act="share-app">${SHARE_ICO}${T("Compartir")}</button><button class="btn" style="flex:1" data-copy="${esc(appURL())}">${T("Copiar enlace")}</button></div>`;
}
/* Un entreno: texto o imagen */
const SHOPT = () => ({ img: true, ex: true, dur: true, pr: true, ...LS.get("wk.shareOpt", {}) });
const exMode = e => isTime(e) ? "time" : e.sets.some(z => +z.w > 0) ? "load" : "reps";
function sessPRs(s) {
  const prev = state.sessions.filter(x => x.start < s.start), out = new Set();
  s.exercises.forEach(e => {
    if (!e.sets.length) return;
    const k = exKey(e), m = exMode(e);
    const old = prev.flatMap(x => x.exercises.filter(y => exKey(y) === k && y.sets.length && exMode(y) === m)).map(y => bestOf(y, m));
    if (old.length && bestOf(e, m) > Math.max(...old)) out.add(e.name);
  });
  return out;
}
function setsShort(e) {
  const tm = isTime(e), sd = sideReps(e), v = e.sets.map(x => tm ? fmtSec(x.r) : sd ? `${x.r}/${R2(x)}` : String(x.r));
  const ws = [...new Set(e.sets.map(x => +x.w || 0))];
  const w = ws.length === 1 && ws[0] ? ` · +${fmtKg(ws[0])} kg` : ws.some(Boolean) ? " · " + T("con lastre") : "";
  return (v.every(z => z === v[0]) ? `${v.length} × ${v[0]}` : v.join(", ")) + w;
}
function sessShare(s) {
  const o = SHOPT(), pr = o.pr ? sessPRs(s) : new Set();
  const rows = s.exercises.filter(e => e.sets.length && (o.ex || pr.has(e.name))).map(e => ({ name: e.name, val: setsShort(e), pr: pr.has(e.name) }));
  const date = new Date(s.start).toLocaleDateString(LOC(), { weekday: "short", day: "numeric", month: "short" });
  const tot = T("{d} · {e} ejercicios · {s} series", { d: fmtDur(s.end - s.start), e: s.exercises.length, s: doneSets(s) });
  return { o, title: s.routine || T("Sesión libre"), date, tot, rows };
}
function sessText(s) {
  const x = sessShare(s), l = [x.title + " · " + x.date];
  if (x.o.dur) l.push(x.tot);
  if (x.rows.length) l.push("", ...x.rows.map(r => `• ${r.name}: ${r.val}${r.pr ? " · " + T("récord") + " 🏅" : ""}`));
  l.push("", T("Registrado con Usus") + " · " + appURL().replace(/^https?:\/\//, "").replace(/\/$/, ""));
  return l.join("\n");
}
const loadImg = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
async function sessCanvas(s) {
  const x = sessShare(s), cs = getComputedStyle(document.documentElement), c = k => cs.getPropertyValue(k).trim() || "#888";
  const F = (w, px) => `${w} ${px}px "Instrument Sans", system-ui, sans-serif`;
  try { await Promise.all([document.fonts.load(F(400, 36)), document.fonts.load(F(700, 36))]); } catch {}
  const W = 1080, P = 72, RH = 76, H = P + 88 + 40 + 84 + (x.o.dur ? 56 : 0) + 28 + x.rows.length * RH + 40 + 50 + P;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const fit = (t, max) => { if (g.measureText(t).width <= max) return t; while (t.length > 1 && g.measureText(t + "…").width > max) t = t.slice(0, -1); return t + "…"; };
  g.fillStyle = c("--bg"); g.fillRect(0, 0, W, H);
  g.fillStyle = c("--surface"); g.strokeStyle = c("--line"); g.lineWidth = 3;
  const rr = (x0, y0, w, h, r) => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r); g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath(); };
  rr(28, 28, W - 56, H - 56, 40); g.fill(); g.stroke();
  let y = P;
  const ic = await loadImg("icon-192.png");
  if (ic) { g.save(); rr(P, y, 80, 80, 20); g.clip(); g.drawImage(ic, P, y, 80, 80); g.restore(); }
  g.textBaseline = "middle"; g.fillStyle = c("--ink"); g.font = F(700, 44); g.fillText("Usus", P + (ic ? 104 : 0), y + 40);
  g.font = F(400, 34); g.fillStyle = c("--muted"); g.textAlign = "right"; g.fillText(x.date, W - P, y + 40); g.textAlign = "left";
  y += 88 + 40;
  g.fillStyle = c("--ink"); g.font = F(700, 62); g.fillText(fit(x.title, W - 2 * P), P, y + 36); y += 84;
  if (x.o.dur) { g.fillStyle = c("--muted"); g.font = F(400, 34); g.fillText(fit(x.tot, W - 2 * P), P, y + 20); y += 56; }
  y += 28;
  x.rows.forEach((r, i) => {
    if (i) { g.strokeStyle = c("--line"); g.lineWidth = 2; g.beginPath(); g.moveTo(P, y); g.lineTo(W - P, y); g.stroke(); }
    g.font = F(r.pr ? 700 : 400, 34); g.fillStyle = r.pr ? c("--accent") : c("--muted"); g.textAlign = "right";
    const val = r.val + (r.pr ? " · " + T("récord") : ""); g.fillText(val, W - P, y + RH / 2); const vw = g.measureText(val).width; g.textAlign = "left";
    g.font = F(400, 36); g.fillStyle = c("--ink"); g.fillText(fit(r.name, W - 2 * P - vw - 32), P, y + RH / 2);
    y += RH;
  });
  g.font = F(400, 28); g.fillStyle = c("--muted"); g.textAlign = "right"; g.fillText(appURL().replace(/^https?:\/\//, "").replace(/\/$/, ""), W - P, H - P - 10);
  return cv;
}
const fileSlug = t => (t || "usus").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "usus";
async function sessPreview() {
  const s = state.sessions.find(x => x.id === state.shareSess), im = document.getElementById("shPrev");
  if (!s || !im) return;
  const cv = await sessCanvas(s); if (state.shareSess === s.id && document.getElementById("shPrev") === im) im.src = cv.toDataURL("image/png");
}
async function sessShareGo(how) {
  const s = state.sessions.find(x => x.id === state.shareSess); if (!s) return;
  const o = SHOPT();
  if (how === "copy") { const ok = await copyText(sessText(s)); toast(ok ? T("Copiado") : T("No se pudo copiar")); return; }
  if (!o.img) { await shareOut({ title: s.routine || "Usus", text: sessText(s) }); return; }
  const cv = await sessCanvas(s), blob = await new Promise(ok => cv.toBlob(ok, "image/png"));
  const file = new File([blob], `usus-${fileSlug(s.routine)}-${dayKey(s.start)}.png`, { type: "image/png" });
  if (how === "save") { saveFile(file); toast(T("Imagen guardada")); return; }
  await shareOut({ title: s.routine || "Usus", file });
}
function savedModal() {
  const s = state.savedSess && state.sessions.find(x => x.id === state.savedSess); if (!s || state.shareSess) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="svT"><div class="mbox" style="text-align:center">
    <div class="svok">${CHECK}</div>
    <h2 id="svT" style="margin:0">${T("Sesión guardada")}</h2>
    <p class="muted" style="margin:2px 0 0">${esc(s.routine || T("Sesión libre"))}</p>
    <div class="svst"><div><b>${fmtDur(s.end - s.start)}</b><small>${T("duración")}</small></div><div><b>${s.exercises.length}</b><small>${T("ejercicios")}</small></div><div><b>${doneSets(s)}</b><small>${T("series")}</small></div></div>
    ${pemBlock(s)}${swapAskBlock(s)}${progCards()}
    <div class="row"><button class="btn" style="flex:1" data-act="saved-close">${T("Hecho")}</button><button class="btn primary shbtn" style="flex:1" data-shsess="${s.id}">${SHARE_ICO}${T("Compartir")}</button></div>
  </div></div>`;
}
function shareSessModal() {
  const s = state.shareSess && state.sessions.find(x => x.id === state.shareSess); if (!s) return "";
  const o = SHOPT(), ck = (id, k, l) => `<label class="shopt"><span>${l}</span><input type="checkbox" role="switch" id="${id}" ${o[k] ? "checked" : ""}></label>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="mbox dsh full"><button class="back" data-act="shsess-close">‹ ${T("Atrás")}</button>
    <div class="sb-head"><h2 id="shT" style="margin:0;flex:1">${T("Compartir entreno")}</h2><button class="btn small" data-act="shsess-close">${T("Cerrar")}</button></div>
    <div class="seg" style="margin:10px 0 12px" role="group" aria-label="${T("Formato")}"><button data-shimg="1" class="${o.img ? "on" : ""}" aria-pressed="${o.img}" style="text-align:center">${T("Imagen")}</button><button data-shimg="0" class="${o.img ? "" : "on"}" aria-pressed="${!o.img}" style="text-align:center">${T("Texto")}</button></div>
    ${o.img ? `<img id="shPrev" class="shprev" alt="${T("Vista previa")}">` : `<pre class="shtxt">${esc(sessText(s))}</pre>`}
    ${ck("shoEx", "ex", T("Ejercicios y series"))}${ck("shoDur", "dur", T("Duración y totales"))}${ck("shoPr", "pr", T("Récords"))}
    <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Solo sale lo que ves aquí. Nunca tu peso, el diario ni el ciclo.")}</p>
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="${o.img ? "shsess-save" : "shsess-copy"}">${o.img ? T("Guardar") : T("Copiar")}</button><button class="btn primary shbtn" style="flex:1" data-act="shsess-go">${SHARE_ICO}${T("Compartir")}</button></div>
  </div></div>`;
}
/* Rutinas y programa: enlace o archivo */
const b64u = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
async function packShare(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  try { if (typeof CompressionStream === "function") return "z" + b64u(new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer())); } catch {}
  return "j" + b64u(raw);
}
async function unpackShare(s) {
  const bytes = unb64u(s.slice(1));
  const raw = s[0] === "z" ? new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}
const rGroups = () => {
  const m = new Map(); state.routines.forEach(r => { const v = normVar(r.variant); if (!m.has(v)) m.set(v, []); m.get(v).push(r); });
  return [...m.entries()].sort((a, b) => (a[0] === "" ? -1 : b[0] === "" ? 1 : a[0].localeCompare(b[0])));
};
const gName = v => v ? T("Variante {v}", { v }) : T("Sin variante");
function sharePayload(ids, withPlan) {
  const p = PL.get(), routines = state.routines.filter(r => ids.includes(r.id)).map(({ id, ...r }) => ({ ...r, oid: r.oid || id }));
  const plan = withPlan && p?.phases?.length ? { phases: p.phases.map(x => ({ variant: normVar(x.variant), weeks: +x.weeks || 1 })), deload: p.deload || null, up: !!p.up, upRule: upRuleOf(p) } : null;
  return { app: "usus", shared: 1, routines, ...(plan ? { plan } : {}) };
}
function shareRoutModal() {
  const sh = state.rshare; if (!sh) return "";
  const sel = new Set(sh.sel), p = PL.get(), box = on => `<i class="cbx${on ? " on" : ""}">${on ? CHECK : ""}</i>`;
  const miss = sh.plan && p ? planVariants(p).filter(v => !state.routines.some(r => sel.has(r.id) && normVar(r.variant) === v)) : [];
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rsT"><div class="mbox dsh full"><button class="back" data-act="rs-close">‹ ${T("Atrás")}</button>
    <div class="sb-head"><h2 id="rsT" style="margin:0;flex:1">${T("Compartir rutinas")}</h2><button class="btn small" data-act="rs-close">${T("Cerrar")}</button></div>
    <p class="muted" style="font-size:.85rem;margin:6px 0 10px">${T("{n} de {m} seleccionadas · sin tus sesiones ni registros.", { n: sel.size, m: state.routines.length })}</p>
    <div class="rsl">${rGroups().map(([v, rs]) => { const k = rs.filter(r => sel.has(r.id)).length;
      return `<button class="rsg" data-rsg="${esc(v)}" aria-pressed="${k === rs.length}">${box(k === rs.length)}<b>${esc(gName(v))}</b><small>${k}/${rs.length}</small></button>`
        + rs.map(r => `<button class="rsr" data-rsr="${r.id}" aria-pressed="${sel.has(r.id)}">${box(sel.has(r.id))}<span>${esc(r.name)}</span></button>`).join(""); }).join("")}</div>
    ${p ? `<label class="shopt" style="margin-top:10px"><span>${T("Incluir plan de progresión")}<small class="muted" style="display:block;font-size:.78rem">${T("Fases, semanas y descargas. No tu fecha de inicio ni la de revisión.")}</small></span><input type="checkbox" role="switch" id="rsPlan" ${sh.plan ? "checked" : ""}></label>` : ""}
    ${miss.length ? `<p style="font-size:.8rem;color:var(--accent);margin:6px 0 0">${T("El plan usa la variante {v}, que no va incluida: esas semanas quedarán sin rutina.", { v: miss.join(", ") })}</p>` : ""}
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="rs-file" ${sel.size ? "" : "disabled"}>${T("Archivo")}</button><button class="btn primary shbtn" style="flex:1" data-act="rs-link" ${sel.size ? "" : "disabled"}>${SHARE_ICO}${T("Enlace")}</button></div>
  </div></div>`;
}
async function shareRoutGo(how) {
  const sh = state.rshare; if (!sh?.sel.length) return;
  const pay = sharePayload(sh.sel, sh.plan), n = pay.routines.length;
  const text = n === 1 ? T("Te paso la rutina «{x}» para Usus. Abre el enlace para añadirla.", { x: pay.routines[0].name }) : T("Te paso {n} rutinas para Usus. Abre el enlace para añadirlas.", { n });
  if (how === "file") {
    const name = `usus-${n === 1 ? fileSlug(pay.routines[0].name) : T("rutinas")}.json`;
    await shareOut({ title: name, file: new File([JSON.stringify(pay, null, 2)], name, { type: "application/json" }) }); return;
  }
  await shareOut({ title: "Usus", text, url: appURL() + "#r=" + await packShare(pay) });
}
/* Al recibir (enlace o archivo compartido) */
function sanitizeShared(j) {
  const rs = (Array.isArray(j?.routines) ? j.routines : []).filter(validRoutine).slice(0, 100).map(r => ({
    oid: typeof r.oid === "string" && /^[a-z0-9]{2,40}$/i.test(r.oid) ? r.oid : null,
    name: String(r.name).trim().slice(0, 80) || T("Rutina"), block: CAT_NAME[r.block] ? r.block : guessBlock(r.name), variant: normVar(r.variant),
    days: Array.isArray(r.days) ? [...new Set(r.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))] : [],
    ...(Array.isArray(r.secs) ? { secs: r.secs.filter(x => x && typeof x.id === "string" && /^[a-z0-9]{2,40}$/i.test(x.id)).slice(0, 12).map(x => ({ id: x.id, name: String(x.name || "").trim().slice(0, 40) || T("Sección") })) } : {}),
    ...(r.groups && typeof r.groups === "object" ? { groups: Object.fromEntries(Object.entries(r.groups).filter(([k, g]) => /^[a-z0-9]{2,40}$/i.test(k) && g && typeof g === "object").slice(0, 30).map(([k, g]) => [k, { kind: g.kind === "cir" ? "cir" : "sup", rounds: Math.max(1, Math.min(20, Math.round(+g.rounds || 3))), rest: Math.max(0, Math.min(3600, Math.round(+g.rest || 0))), restAfter: g.restAfter === null || g.restAfter === undefined || !isFinite(+g.restAfter) ? null : Math.max(0, Math.min(3600, Math.round(+g.restAfter))) }])) } : {}),
    exercises: r.exercises.filter(e => e && typeof e.name === "string" && e.name.trim()).slice(0, 60).map(e => ({
      ...(typeof e.sec === "string" && /^[a-z0-9]{2,40}$/i.test(e.sec) ? { sec: e.sec } : {}), ...(typeof e.grp === "string" && /^[a-z0-9]{2,40}$/i.test(e.grp) ? { grp: e.grp } : {}),
      name: e.name.trim().slice(0, 80), sets: Math.max(1, Math.min(30, Math.round(+e.sets || 3))), reps: Math.max(1, Math.min(3600, Math.round(+e.reps || 10))),
      type: e.type === "time" ? "time" : "reps", sides: !!e.sides, ...(+e.rest > 0 ? { rest: Math.min(3600, Math.round(+e.rest)) } : {}),
      ...(typeof e.xid === "string" && /^[a-z0-9-]{2,60}$/.test(e.xid) ? { xid: e.xid, ...(typeof e.tech === "string" && e.tech.trim() ? { tech: e.tech.trim().slice(0, 60) } : {}) } : {}), ...(Array.isArray(e.equip) && e.equip.some(k => MAT[k]) ? { equip: e.equip.filter(k => MAT[k]) } : {}), ...(typeof e.other === "string" && e.other.trim() ? { other: e.other.trim().slice(0, 40) } : {}),
      ...(e.restAfter !== null && e.restAfter !== undefined && e.restAfter !== "" && isFinite(+e.restAfter) ? { restAfter: Math.max(0, Math.min(3600, Math.round(+e.restAfter))) } : {}) }))
  }));
  rs.forEach(normRoutine);
  const p = j?.plan, ph = p && Array.isArray(p.phases) ? p.phases.filter(x => x && normVar(x.variant)).slice(0, 12).map(x => ({ variant: normVar(x.variant), weeks: Math.max(1, Math.min(12, Math.round(+x.weeks || 1))) })) : [];
  const plan = ph.length ? { phases: ph, deload: p.deload && +p.deload.weeks > 0 && +p.deload.every > 0 ? { weeks: Math.min(4, Math.round(+p.deload.weeks)), every: Math.min(26, Math.round(+p.deload.every)) } : { weeks: 0, every: 0 }, up: !!p.up, upRule: upRuleOf(p) } : null;
  if (!rs.length && !plan) return null;
  return { routines: rs, plan, sel: rs.map((_, i) => i), withPlan: !!plan, mode: {} };
}
const nextMonday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + (8 - d.getDay()) % 7); return dayKey(d.getTime()); };
function incomingModal() {
  const inc = state.incoming; if (!inc || !LS.get("wk.welcomed", false) || run) return "";
  const sel = new Set(inc.sel), box = on => `<i class="cbx${on ? " on" : ""}">${on ? CHECK : ""}</i>`, p = inc.plan;
  const phs = p ? p.phases.map(x => `${x.variant} ${T("{n} sem.", { n: x.weeks })}`).join(" → ") + (p.deload.weeks ? " · " + T("descarga {w} sem. cada {e}", { w: p.deload.weeks, e: p.deload.every }) : "") : "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="inT"><div class="mbox dsh full"><button class="back" data-act="in-no">‹ ${T("Atrás")}</button>
    <h2 id="inT" style="margin:0 0 4px">${inc.routines.length === 1 ? T("Te han compartido una rutina") : inc.routines.length ? T("Te han compartido {n} rutinas", { n: inc.routines.length }) : T("Te han compartido un plan")}</h2>
    <p class="muted" style="font-size:.85rem;margin:0 0 10px">${T("Revisa y elige qué añadir. No se borra nada de lo que ya tienes.")}</p>
    ${inc.routines.length ? `<div class="rsl">${inc.routines.map((r, i) => { const m = sharedMatch(r), upd = m && inc.mode[i] !== "new";
      return `<div class="rsrow"><button class="rsr" style="padding-left:12px" data-inr="${i}" aria-pressed="${sel.has(i)}">${box(sel.has(i))}<span style="flex:1;min-width:0">${esc(r.name)}<small class="muted" style="display:block;font-size:.78rem">${T("{e} ejercicios · {s} series", { e: r.exercises.length, s: r.exercises.reduce((a, e) => a + e.sets, 0) })}</small></span></button>
        ${m && sel.has(i) ? `<div class="rsmode"><small class="muted">${T("Ya la tienes: «{x}»", { x: esc(m.name) })}</small><div class="rsseg"><button data-inm="${i}:upd" class="${upd ? "on" : ""}" aria-pressed="${upd}">${T("Actualizar")}</button><button data-inm="${i}:new" class="${upd ? "" : "on"}" aria-pressed="${!upd}">${T("Añadir como nueva")}</button></div></div>` : ""}</div>`; }).join("")}</div>` : ""}
    ${p ? `<label class="shopt" style="margin-top:10px"><span>${T("Añadir el plan de progresión")}<small class="muted" style="display:block;font-size:.78rem">${esc(phs)}. ${T("Empieza el {d}.", { d: kFmt(nextMonday(), { weekday: "long", day: "numeric", month: "short" }) })}${PL.get() ? " " + T("Sustituirá tu plan actual.") : ""}</small></span><input type="checkbox" role="switch" id="inPlan" ${inc.withPlan ? "checked" : ""}></label>` : ""}
    <p class="muted" style="font-size:.78rem;margin:8px 0 0">${T("Si ya tienes una rutina con el mismo nombre, se añade como «(2)».")} ${T("Al actualizar se cambian los ejercicios; el nombre, los días, la variante y tus sesiones no se tocan.")}</p>
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="in-no">${T("Ahora no")}</button><button class="btn primary" style="flex:1" data-act="in-yes" ${sel.size || (p && inc.withPlan) ? "" : "disabled"}>${T("Añadir")}</button></div>
  </div></div>`;
}
/* Rutina recibida que ya tienes: misma rutina de origen (oid) o es tuya (su id) */
const sharedMatch = r => r.oid ? state.routines.find(x => x.oid === r.oid || x.id === r.oid) : null;
async function incomingAdd() {
  const inc = state.incoming; if (!inc) return;
  const names = new Set(state.routines.map(r => r.name.trim().toLowerCase())), add = []; let upd = 0;
  inc.routines.forEach((r, i) => {
    if (!inc.sel.includes(i)) return;
    const m = sharedMatch(r);
    if (m && inc.mode[i] !== "new") { m.exercises = JSON.parse(JSON.stringify(r.exercises)); m.block = r.block; m.oid = m.oid || r.oid; upd++; return; }
    let n = r.name, k = 2; while (names.has(n.toLowerCase())) n = `${r.name} (${k++})`; names.add(n.toLowerCase());
    const { oid, ...rest } = r; add.push({ ...rest, name: n, id: uid(), ...(oid ? { oid } : {}) });
  });
  state.routines.push(...add); await store.saveRoutines(state.routines);
  const plan = inc.plan && inc.withPlan;
  if (plan) PL.save({ enabled: true, start: nextMonday(), review: "", phases: inc.plan.phases.map(x => ({ id: uid(), ...x })), deload: inc.plan.deload, up: inc.plan.up });
  state.incoming = null; state.tab = add.length || upd ? "routines" : "train"; state.editing = null;
  const msg = [add.length ? (add.length === 1 ? T("Rutina añadida") : T("Añadidas {n} rutinas", { n: add.length })) : "", upd ? (upd === 1 ? T("1 rutina actualizada") : T("{n} rutinas actualizadas", { n: upd })) : "", plan ? T("plan añadido") : ""].filter(Boolean).join(" · ");
  toast(msg || T("Nada que añadir")); render(); window.scrollTo(0, 0);
}
async function readShareHash() {
  if (!location.hash.startsWith("#r=")) return;
  const h = location.hash.slice(3);
  try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  let inc = null; try { inc = sanitizeShared(await unpackShare(h)); } catch {}
  if (!inc) { toast(T("El enlace no es válido o está incompleto")); return; }
  state.incoming = inc; render();
}
window.addEventListener("hashchange", () => { readShareHash(); });
