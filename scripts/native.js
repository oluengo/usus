// Puente para la versión Android (Capacitor). Solo se incluye en el APK; la PWA no lo carga.
// - Compartir archivos (copias, CSV, análisis) con la hoja nativa de Android.
// - Pantalla encendida durante el entreno (wakeLock nativo).
// - Botón Atrás: cierra el diálogo abierto, vuelve de una pantalla (rutina, grupo de Ajustes), vuelve a Hoy o minimiza la app.
(function () {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const P = C.Plugins || {};
  try { Object.defineProperty(navigator, "standalone", { value: true, configurable: true }); } catch (e) {}

  const b64 = buf => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const abort = () => { const e = new Error("Share canceled"); e.name = "AbortError"; return e; };
  const cancelled = e => /cancel/i.test(String(e && (e.message || e.errorMessage || e)));

  navigator.canShare = data => !!data && (!!(data.files && data.files.length) || !!data.text || !!data.url || !!data.title);
  navigator.share = async data => {
    const opts = { title: data.title || "Usus", dialogTitle: data.title || "Usus" };
    if (data.text) opts.text = data.text;
    if (data.url) opts.url = data.url;
    if (data.files && data.files.length) {
      const files = [];
      for (const f of data.files) {
        const name = String(f.name || "usus.txt").replace(/[\\/:*?"<>|]/g, "_");
        const r = await P.Filesystem.writeFile({ path: "share/" + name, data: b64(await f.arrayBuffer()), directory: "CACHE", recursive: true });
        files.push(r.uri);
      }
      opts.files = files;
    }
    try { await P.Share.share(opts); } catch (e) { if (cancelled(e)) throw abort(); throw e; }
  };

  if (P.KeepAwake) {
    const wl = {
      request: async () => {
        await P.KeepAwake.keepAwake();
        const ls = [], s = { released: false, type: "screen",
          addEventListener: (t, f) => { if (t === "release") ls.push(f); }, removeEventListener: () => {},
          release: async () => { if (s.released) return; s.released = true; await P.KeepAwake.allowSleep(); ls.forEach(f => f()); } };
        return s;
      }
    };
    try { Object.defineProperty(navigator, "wakeLock", { value: wl, configurable: true }); } catch (e) {}
  }

  // Imprimir / guardar PDF: el WebView de Android no implementa window.print(); lo hace el plugin propio UsusPrint
  try { const pr = C.registerPlugin ? C.registerPlugin("UsusPrint") : P.UsusPrint; if (pr) window.ususPrint = name => pr.print({ name: String(name || "Usus") }).catch(() => {}); } catch (e) {}

  const CLOSE = '[data-act$="-close"],[data-act$="-cancel"],[data-act$="-back"],[data-act$="-no"]';
  if (P.App) P.App.addListener("backButton", () => {
    const modals = document.querySelectorAll(".modal");
    if (modals.length) { const m = modals[modals.length - 1], b = m.querySelector('.mfoot [data-act$="-back"]') || m.querySelector(CLOSE); if (b) b.click(); return; }   // en un proceso por pasos, Atrás vuelve al paso anterior
    const bk = [...document.querySelectorAll("#app [data-back]")].find(e => e.offsetParent);
    if (bk) { bk.click(); return; }
    const hoy = document.querySelector('#tabs [data-tab="train"]');
    if (hoy && hoy.getAttribute("aria-current") !== "page") { hoy.click(); return; }
    P.App.minimizeApp();
  });
})();
