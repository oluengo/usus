/* ---------- Arranque ---------- */
(async () => {
  setLang(detectLang());
  renderTabs();
  await store.init();
  const data = await store.load();
  state.routines = data.routines; state.sessions = data.sessions;
  migrateStored(); migrateTypes(); planMigrateOrder();
  applyTheme(curTheme());
  restorePlace();
  // Versión nueva: un aviso breve que se oculta solo; las novedades, en Ajustes → Acerca de
  if (LS.get("wk.welcomed", false) && LS.get("wk.seenVersion", null) !== APP_VERSION) { LS.set("wk.seenVersion", APP_VERSION); setTimeout(() => toast(T("Usus se ha actualizado a la versión {v}. Novedades en Ajustes → Acerca de.", { v: APP_VERSION }), 5000), 800); }
  if (LS.get("wk.catalog", null) === null) state.catAsk = true;
  if (catOn()) loadCatalog().then(c => { planUpCheck(); render(); }); else planUpCheck();
  render();
  await readShareHash();
  readShareTarget();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
