/* ---------- Arranque ---------- */
(async () => {
  setLang(detectLang());
  renderTabs();
  await store.init();
  const data = await store.load();
  state.routines = data.routines; state.sessions = data.sessions;
  migrateStored(); migrateTypes();
  applyTheme(curTheme());
  restorePlace();
  if (LS.get("wk.welcomed", false) && LS.get("wk.seenVersion", null) !== APP_VERSION && CHANGES[0][0] === APP_VERSION) state.newsOpen = "new";
  if (LS.get("wk.catalog", null) === null) state.catAsk = true;
  if (catOn()) loadCatalog().then(c => { planUpCheck(); render(); }); else planUpCheck();
  render();
  await readShareHash();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
