# Usus

Versión 1.0.0 · [Cambios](CHANGELOG.md) · Licencia MIT

**Castellano** · [Català](#català) · [English](#english)

App web instalable (PWA) para registrar entrenamientos: rutinas, series por repeticiones o por tiempo (con cuenta atrás y "por lado"), descansos por ejercicio, bloques (pecho, espalda, pierna…), diario con sueño, suplementos y notas, peso semanal, plan de progresión (rotación de variantes con descarga), seguimiento opcional del ciclo menstrual (estimación aproximada, desactivado por defecto) y estadísticas configurables. Funciona sin conexión y **guarda los datos solo en el dispositivo** (haz copias desde *Ajustes*).

**Instalar:** sube esta carpeta a cualquier alojamiento estático con HTTPS (Netlify, Cloudflare Pages, GitHub Pages…), ábrela en Chrome para Android y elige *Instalar app*.

**Aviso:** herramienta de registro, no consejo médico ni plan de entrenamiento. Se ofrece tal cual, sin garantías. Licencia MIT (ver `LICENSE`). Sin conexiones externas: la tipografía Instrument Sans va incluida (SIL OFL 1.1, `fonts/OFL.txt`).

**Añadir un idioma:** en `index.html`, (1) añade el código y el nombre en `LANGS`; (2) copia el bloque `ca` de `I18N` (al final del script), cambia el código y traduce el texto de la derecha (la clave de la izquierda es el texto en castellano; no la cambies). Lo que falte se muestra en castellano. Sube también la versión de `CACHE` en `sw.js`.

**Versiones:** se numeran MAYOR.MENOR.PARCHE (1.0.0). PARCHE = correcciones; MENOR = funciones nuevas compatibles; MAYOR = cambios que obligan a migrar datos. Cada versión se anota en `CHANGELOG.md` y en `CHANGES` dentro de `index.html` (aviso de novedades de la app).

---

## Català

App web instal·lable (PWA) per registrar entrenaments: rutines, sèries per repeticions o per temps (amb compte enrere i "per costat"), descansos per exercici, blocs (pit, esquena, cama…), diari amb son, suplements i notes, pes setmanal, pla de progressió (rotació de variants amb descàrrega), seguiment opcional del cicle menstrual (estimació aproximada, desactivat per defecte) i estadístiques configurables. Funciona sense connexió i **desa les dades només al dispositiu** (fes còpies des d'*Ajustos*).

**Instal·lar:** puja aquesta carpeta a qualsevol allotjament estàtic amb HTTPS (Netlify, Cloudflare Pages, GitHub Pages…), obre-la amb Chrome per a Android i tria *Instal·la l'aplicació*.

**Avís:** eina de registre, no consell mèdic ni pla d'entrenament. S'ofereix tal com és, sense garanties. Llicència MIT (vegeu `LICENSE`). Sense connexions externes: la tipografia Instrument Sans hi va inclosa (SIL OFL 1.1, `fonts/OFL.txt`).

**Afegir un idioma:** a `index.html`, (1) afegeix el codi i el nom a `LANGS`; (2) copia el bloc `ca` d'`I18N`, canvia'n el codi i tradueix el text de la dreta. El que falti es mostra en castellà. Puja també la versió de `CACHE` a `sw.js`.

**Versions:** es numeren MAJOR.MENOR.PEDAÇ (1.0.0). Pedaç = correccions; menor = funcions noves compatibles; major = canvis que obliguen a migrar dades. Cada versió s'anota a `CHANGELOG.md` i a `CHANGES` dins d'`index.html`.

---

## English

Installable web app (PWA) to log workouts: routines, rep- or time-based sets (with countdown and "per side"), per-exercise rest, blocks (chest, back, legs…), a diary with sleep, supplements and notes, weekly weight, a progression plan (variant rotation with deloads), optional menstrual cycle tracking (approximate estimate, off by default) and configurable statistics. Works offline and **stores data only on the device** (make backups from *Settings*).

**Install:** upload this folder to any static HTTPS host (Netlify, Cloudflare Pages, GitHub Pages…), open it in Chrome for Android and choose *Install app*.

**Notice:** a logging tool, not medical advice or a training plan. Provided as is, without warranty. MIT license (see `LICENSE`). No external connections: the Instrument Sans font is bundled (SIL OFL 1.1, `fonts/OFL.txt`).

**Add a language:** in `index.html`, (1) add the code and name to `LANGS`; (2) copy the `ca` block in `I18N` (end of the script), change the code and translate the right-hand text (the left-hand key is the Spanish text; don't change it). Missing strings fall back to Spanish. Also bump `CACHE` in `sw.js`.

**Versioning:** MAJOR.MINOR.PATCH (1.0.0). Patch = fixes; minor = new backwards-compatible features; major = changes that require migrating data. Every release is listed in `CHANGELOG.md` and in `CHANGES` inside `index.html` (the in-app what's new notice).
