/* ---------- Comidas (3.9.0): lo que comes cada día y preguntas para tu IA («¿qué ceno?») ----------
   Como el plan con IA: Usus solo prepara la pregunta, con lo comido, el entreno del día y tus preferencias, y la
   copias o compartes tú. Sin calorías, pesos ni dietas. Las intolerancias y preferencias van en Ajustes → Perfil
   (wk.food, por perfil y en la copia, apartado Ajustes); lo comido, en el diario (e.meals, apartado Diario).
   3.10.0: es ante todo un registro (también «entre horas» y agua en vasos, e.water); la pregunta para la IA va plegada
   debajo y se puede quitar en Perfil → Alimentación (wk.food.ai). Lo comido sale en el CSV y en el resumen para la IA. */
const FOOD_AL = [["lactosa", N_("Lactosa")], ["gluten", N_("Gluten")], ["huevo", N_("Huevo")], ["frutos", N_("Frutos secos")], ["cacahuete", N_("Cacahuete")],
  ["marisco", N_("Marisco")], ["pescado", N_("Pescado")], ["soja", N_("Soja")], ["sesamo", N_("Sésamo")], ["fructosa", N_("Fructosa")]];
const FOOD_DIET = [["todo", N_("Como de todo")], ["flex", N_("Flexitariana")], ["vegetariana", N_("Vegetariana")], ["vegana", N_("Vegana")], ["pesce", N_("Pescetariana")],
  ["sincerdo", N_("Sin cerdo")], ["halal", N_("Halal")], ["kosher", N_("Kosher")]];
const FOOD_GOAL = [["prot", N_("Más proteína")], ["verdura", N_("Más verdura y fruta")], ["ligero", N_("Comer más ligero")], ["energia", N_("Energía para entrenar")],
  ["musculo", N_("Ganar músculo")], ["procesados", N_("Menos ultraprocesados")], ["azucar", N_("Menos azúcar")]];
const FOOD_MEALS = [["b", N_("Desayuno")], ["l", N_("Comida")], ["s", N_("Merienda")], ["d", N_("Cena")], ["x", N_("Entre horas")]];   // x: picoteo (3.10.0)
const FOOD_Q = [["cena", N_("¿Qué ceno?")], ["antes", N_("Voy a comer…")], ["desayuno", N_("Desayuno")], ["libre", N_("Otra pregunta")]];
const FOOD = {
  get: () => ({ al: [], diet: "", goals: [], no: "", ai: true, ...(LS.get("wk.food", null) || {}) }),
  set(p) { LS.set("wk.food", { ...FOOD.get(), ...p }); }
};
const foodLab = (L, k) => T((L.find(x => x[0] === k) || [k, k])[1]);
const foodLower = s => s.charAt(0).toLowerCase() + s.slice(1);
/* Resumen de una línea por apartado (perfil, pregunta y plan con IA) */
function foodParts() {
  const f = FOOD.get(), P = {};
  if (f.diet && f.diet !== "todo") P.diet = foodLab(FOOD_DIET, f.diet);
  if (f.al.length) P.al = f.al.map(k => foodLab(FOOD_AL, k)).join(", ");
  if (f.no.trim()) P.no = f.no.trim();
  if (f.goals.length) P.goals = f.goals.map(k => foodLab(FOOD_GOAL, k)).join(", ");
  return P;
}
function foodSummary() {
  const P = foodParts();
  return [P.diet && T("Alimentación: {x}", { x: foodLower(P.diet) }), P.al && T("Sin: {x}", { x: P.al.toLowerCase() }), P.no && T("No me gusta: {x}", { x: P.no }), P.goals && T("Objetivos: {x}", { x: P.goals.toLowerCase() })].filter(Boolean).join(". ");
}

/* Ajustes → Perfil: apartados plegables con selectores */
function foodPanel() {
  const f = FOOD.get(), P = foodParts();
  const chips = (L, key, sel, one) => `<div class="chips fchips" role="group">${L.map(([k, n]) => { const on = one ? sel === k : sel.includes(k);
    return `<button data-food="${key}:${k}" class="${on ? "on" : ""}" aria-pressed="${on}">${T(n)}</button>`; }).join("")}</div>`;
  const fold = (id, title, sub, body) => `<details class="ffold" data-ffold="${id}"><summary class="srow"><span class="t">${title}<small data-fsum="${id}">${sub}</small></span><span class="fchev" aria-hidden="true"></span></summary><div class="fbody">${body}</div></details>`;
  return `<h2>${T("Alimentación")}</h2><div class="lgroup">
    ${fold("al", T("Intolerancias y alergias"), esc(P.al || T("Ninguna")), chips(FOOD_AL, "al", f.al))}
    ${fold("diet", T("Tipo de alimentación"), esc(foodLab(FOOD_DIET, f.diet || "todo")), chips(FOOD_DIET, "diet", f.diet || "todo", true))}
    ${fold("goals", T("Objetivos"), esc(P.goals || T("Ninguno")), chips(FOOD_GOAL, "goals", f.goals))}
    <div class="srow"><label class="t" for="foodNo">${T("No me gusta")}</label><input id="foodNo" type="text" value="${esc(f.no)}" placeholder="${T("Ej. setas, pescado azul")}" style="flex:1;min-width:0;max-width:60%"></div>
    <label class="srow"><span class="t">${T("Preguntas para tu IA")}<small>${T("«¿Qué como?» en Diario → Comidas")}</small></span><input type="checkbox" role="switch" id="foodAi" ${f.ai !== false ? "checked" : ""}></label>
  </div><p class="note">${T("Para las preguntas de comidas del Diario y el plan con IA. Solo en este dispositivo.")}</p>`;
}
/* Pulsar un selector: se guarda y se actualiza sin volver a pintar (así el apartado sigue abierto) */
function foodToggle(btn) {
  const [key, k] = btn.dataset.food.split(":"), f = FOOD.get();
  if (key === "diet") { FOOD.set({ diet: k }); btn.parentElement.querySelectorAll("button").forEach(b => { const on = b === btn; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); }
  else { const l = f[key].includes(k) ? f[key].filter(x => x !== k) : [...f[key], k]; FOOD.set({ [key]: l }); btn.classList.toggle("on"); btn.setAttribute("aria-pressed", l.includes(k)); }
  const P = foodParts(), sum = { al: P.al || T("Ninguna"), diet: foodLab(FOOD_DIET, FOOD.get().diet || "todo"), goals: P.goals || T("Ninguno") }[key], el = document.querySelector(`[data-fsum="${key}"]`);
  if (el) el.textContent = sum;
}

/* Diario: lo comido y la pregunta */
function foodTrain(k) {
  const ss = state.sessions.filter(s => dayKey(s.start) === k);
  if (ss.length) return T("He entrenado: {x}.", { x: ss.map(s => `«${s.routine || T("Sesión libre")}» (${Math.round((s.end - s.start) / 60000)} min)`).join(", ") });
  if (k !== dayKey(Date.now())) return T("Ese día no entrené.");
  const today = new Date().getDay(), pn = planNow(), rs = pn?.status === "on" ? suggestedFor(pn.w, today) : state.routines.filter(r => (r.days || []).includes(today));
  return rs.length ? T("Hoy me toca entrenar: {x}.", { x: rs.map(r => `«${r.name}»`).join(", ") }) : T("Hoy no entreno.");
}
function foodPrompt(k) {
  const e = DY.get(k), m = e.meals || {}, today = k === dayKey(Date.now()), q = state.foodQ || "cena", P = foodParts();
  const eaten = FOOD_MEALS.filter(([x]) => (m[x] || "").trim()).map(([x, n]) => `- ${T(n)}: ${m[x].trim()}`);
  const ask = {
    cena: T("¿Qué puedo cenar para equilibrar el día?"),
    antes: T("Voy a comer esto: «{x}». ¿Qué me recomiendas en las otras comidas para que el día quede equilibrado?", { x: (state.foodX?.antes || "").trim() || "…" }),
    desayuno: T("¿Qué me recomiendas para desayunar?"),
    libre: (state.foodX?.libre || "").trim() || "…"
  }[q];
  const L = [ask, "", today ? T("Hoy he comido:") : T("El {d} comí:", { d: new Date(keyTime(k)).toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" }) }),
    ...(eaten.length ? eaten : [`- ${T("Nada apuntado todavía")}`]), ...(+e.water ? [TN(+e.water, "Agua: {n} vaso", "Agua: {n} vasos")] : []), "", foodTrain(k)];
  const pr = [P.diet && T("Mi alimentación: {x}.", { x: foodLower(P.diet) }), P.al && T("Intolerancias o alergias: {x} (no las incluyas nunca).", { x: P.al.toLowerCase() }),
    P.no && T("No me gusta: {x}.", { x: P.no }), P.goals && T("Mis objetivos: {x}.", { x: P.goals.toLowerCase() })].filter(Boolean);
  if (pr.length) L.push(...pr);
  L.push("", T("Por favor:"), `- ${T("Dame 2 o 3 opciones saludables y sencillas, de casa, con ingredientes y pasos breves.")}`, `- ${T("Ten en cuenta lo que ya he comido y el entreno.")}`,
    `- ${T("Sin dietas, calorías ni pesos, y sin proponer saltarse comidas.")}`, `- ${T("Respeta siempre mis intolerancias y lo que no como.")}`, `- ${T("Recuerda que no es consejo médico ni nutricional.")}`);
  return L.join("\n");
}
function foodSheet(k, e) {
  const m = e.meals || {}, q = state.foodQ || "cena", P = foodParts(), has = Object.keys(P).length, wv = +e.water || 0;
  const nm = FOOD_MEALS.filter(([x]) => (m[x] || "").trim()).length;
  const inc = [TN(nm, "{n} comida apuntada", "{n} comidas apuntadas"), T("El entreno del día"), has ? T("Tus preferencias") : ""].filter(Boolean);
  const ai = FOOD.get().ai !== false ? `
    <details class="aiq"${state.foodAiOpen ? " open" : ""}><summary><span>${T("¿Qué como?")}</span><small class="muted">${T("con tu IA")}</small><span class="fchev" aria-hidden="true"></span></summary>
    <div class="panel" style="margin-top:8px">
      <div class="chips fchips" role="group" aria-label="${T("Pregunta")}" style="margin-top:0">${FOOD_Q.map(([x, n]) => `<button data-fq="${x}" class="${q === x ? "on" : ""}" aria-pressed="${q === x}">${T(n)}</button>`).join("")}</div>
      ${q === "antes" ? `<input type="text" id="fqAntes" data-fqx="antes" value="${esc(state.foodX?.antes || "")}" placeholder="${T("Ej. pizza para cenar")}" aria-label="${T("Qué vas a comer y cuándo")}" style="margin-top:10px">` : ""}
      ${q === "libre" ? `<input type="text" id="fqLibre" data-fqx="libre" value="${esc(state.foodX?.libre || "")}" placeholder="${T("Ej. ¿qué llevo al trabajo para picar?")}" aria-label="${T("Tu pregunta")}" style="margin-top:10px">` : ""}
      <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Incluye: {x}.", { x: inc.join(" · ") })}${has ? "" : ` <button class="verb" data-act="go-perfil">${T("Añade intolerancias y preferencias en tu perfil")}</button>`}</p>
      <div class="row" style="margin-top:10px"><button class="btn primary" style="flex:1" data-act="food-copy">${T("Copiar")}</button><button class="btn shbtn" style="flex:1" data-act="food-share">${SHARE_ICO}${T("Compartir")}</button></div>
      <p class="muted" style="font-size:.8rem;margin:6px 0 0">${T("Pégala en tu IA (ChatGPT, Claude, Gemini…). Usus no envía nada; nunca lleva tu peso ni el ciclo.")}</p>
      <details class="aimanual"><summary>${T("Ver la pregunta")}</summary><pre class="fprompt">${esc(foodPrompt(k))}</pre></details>
      <h3 class="wh">${T("Cuando la IA responda")}</h3>
      <button class="btn" style="width:100%" data-act="food-clip">${T("Pegar respuesta en las notas del día")}</button>
      <details class="aimanual"${state.foodManual ? " open" : ""}><summary>${T("O pégala a mano")}</summary>
        <textarea id="foodPaste" rows="3" placeholder="${T("Pega aquí la respuesta de la IA")}"></textarea>
        <button class="btn" style="width:100%;margin-top:8px" data-act="food-paste">${T("Guardar en las notas del día")}</button></details>
    </div></details>` : "";
  return `    <div class="panel fmeals">
      ${FOOD_MEALS.map(([x, n]) => `<label for="fm_${x}">${T(n)}</label><input type="text" id="fm_${x}" data-fmeal="${x}" value="${esc(m[x] || "")}" placeholder="—" maxlength="200">`).join("")}
      <span class="flab">${T("Agua")}</span><div class="fwater"><button class="btn small" data-act="food-water-" aria-label="${T("Un vaso menos")}" ${wv ? "" : "disabled"}>−</button><b aria-live="polite">${TN(wv, "{n} vaso", "{n} vasos")}</b><button class="btn small" data-act="food-water+" aria-label="${T("Un vaso más")}">+</button></div>
    </div>${ai}
`;
}
/* El plegable de la IA recuerda si está abierto (al cambiar de pregunta se vuelve a pintar) */
document.addEventListener("toggle", ev => { if (ev.target?.classList?.contains("aiq")) state.foodAiOpen = ev.target.open; }, true);
const foodTile = e => { const m = e.meals || {}, l = FOOD_MEALS.filter(([x]) => (m[x] || "").trim()), w = +e.water || 0;
  return [l.length ? String(l.length) : w ? TN(w, "{n} vaso", "{n} vasos") : "—", [l.map(([x]) => esc(m[x].trim())).join(" · ").slice(0, 70), l.length && w ? TN(w, "Agua: {n} vaso", "Agua: {n} vasos") : ""].filter(Boolean).join(" · "), l.length > 0 || w > 0]; };
function foodSaveAnswer(k, t) {
  t = (t || "").trim().slice(0, 4000); if (!t) { toast(T("Pega antes la respuesta")); return false; }
  const n = (DY.get(k).note || "").trim();
  DY.set(k, { note: `${n ? n + "\n\n" : ""}${T("Ideas para comer")}:\n${t}` }); state.foodManual = false;
  toast(T("Guardado en las notas del día")); render(); return true;
}
