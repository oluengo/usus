/* ---------- Vista: Historial ---------- */
/* ---------- Diario: sueño, suplementos, notas y entrenos del día ---------- */
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const keyTime = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
const DY = {
  all: () => LS.get("wk.diary", {}),
  get: k => DY.all()[k] || {},
  set(k, patch) { const a = DY.all(); a[k] = { ...(a[k] || {}), ...patch }; LS.set("wk.diary", a); },
  supps: () => LS.get("wk.supps", []),
  saveSupps: l => LS.set("wk.supps", l)
};
