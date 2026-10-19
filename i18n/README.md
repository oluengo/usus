# Traducciones de Usus

Usus está en **castellano** (idioma original), **català** y **English**. Los textos se traducen con [Weblate](https://weblate.org), una plataforma libre: cualquiera puede proponer o corregir traducciones desde el navegador, sin tocar código.

## Archivos

| Archivo | Qué es | ¿Se edita? |
|---|---|---|
| `usus.pot` | Plantilla con todos los textos de la app, en castellano | No: se genera con `npm run i18n` |
| `ca.po`, `en.po` | Traducciones (formato gettext) | Sí: en Weblate o a mano |

El catálogo de ejercicios se traduce aparte, en `ejercicios.json`.

## Cómo funciona

1. En el código, todo texto visible va dentro de `T("…")` (o `TN(n, "singular", "plural")` si depende de un número). Los textos que se guardan en una lista y se traducen después llevan `N_("…")`.
2. `npm run i18n` (o `node scripts/i18n.mjs all`):
   - **extract**: lee el código (`src/js/`) y actualiza `usus.pot` y los `.po`. Los textos nuevos quedan sin traducir; si un texto cambia un poco, se conserva la traducción anterior marcada como *por revisar* (fuzzy).
   - **build**: genera el diccionario `src/js/90-i18n.js` con las traducciones revisadas (las *por revisar* no se usan: se ve el castellano) y vuelve a montar `index.html`.
   - **check**: cuenta lo que falta y comprueba que los huecos `{n}`, `{x}`… sean los mismos en todos los idiomas.
3. Al publicar (web y APK) se ejecuta **build**, así que lo que se traduce en Weblate llega a la siguiente versión sin más pasos.
4. GitHub comprueba en cada cambio que la plantilla está al día y que no hay huecos mal (flujo «Textos»).

## Glosario

Una palabra por concepto, en los tres idiomas:

| Castellano | Català | English | Qué es |
|---|---|---|---|
| Rutina | Rutina | Routine | Lista de ejercicios que se entrena |
| Sesión | Sessió | Session | Una vez que entrenas |
| Plan | Pla | Plan | Orden de variantes por semanas |
| Variante | Variant | Variant | A, B, C… de un plan |
| Semana de descarga | Setmana de descàrrega | Deload week | Semana suave dentro del plan |
| Serie | Sèrie | Set | |
| Repeticiones (reps) | Repeticions (reps) | Reps | |
| Descanso | Descans | Rest | |
| Lastre | Llast | Added weight | Peso añadido |
| Por lado | Per costat | Per side | |
| Superserie | Supersèrie | Superset | |
| Circuito | Circuit | Circuit | |
| Vuelta | Volta | Round | De una superserie o circuito |
| Sección | Secció | Section | Parte de una rutina (calentamiento…) |
| Esfuerzo (PEM) | Esforç (PEM) | Effort (RPE) | Escala 1–10 |
| RIR | RIR | RIR | Repeticiones en reserva |
| Catálogo | Catàleg | Catalogue | Lista de ejercicios con ficha |
| Ficha | Fitxa | Card | Detalle de un ejercicio |
| Diario | Diari | Diary | |
| Copia de seguridad | Còpia de seguretat | Backup | |
| Perfil | Perfil | Profile | |

Estilo: frase normal (solo la primera mayúscula), botones con verbo, tuteo (en català també, «tu»).

## Configurar Weblate (una sola vez)

1. Pide alojamiento gratuito para proyectos libres en [hosted.weblate.org](https://hosted.weblate.org/hosting/) (plan *Libre*; Usus es MIT y público).
2. Crea el proyecto **Usus** y un componente **App** con:
   - Repositorio: `https://github.com/oluengo/usus.git`, rama **`beta`** (lo traducido se prueba primero en la beta).
   - Repositorio para enviar: `git@github.com:oluengo/usus.git` y, en GitHub → Settings → Deploy keys, la clave SSH de Weblate **con permiso de escritura**.
   - Formato: **gettext PO file** · Máscara: `i18n/*.po` · Plantilla para nuevos idiomas: `i18n/usus.pot` · Idioma de origen: **Spanish** · Licencia: **MIT**.
   - Complemento: **Update PO files to match POT (msgmerge)**.
3. Opcional: un componente de glosario con la tabla de arriba.
