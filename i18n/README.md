# Traducciones de Usus

Usus está en **castellano** (idioma original), **català** y **English**: castellano e inglés por alcance internacional y catalán por cercanía. No está previsto añadir más idiomas. Las traducciones se editan a mano en los `.po`; para proponer una corrección, abre una [incidencia](https://github.com/oluengo/usus/issues).

## Archivos

| Archivo | Qué es | ¿Se edita? |
|---|---|---|
| `usus.pot` | Plantilla con todos los textos de la app, en castellano | No: se genera con `npm run i18n` |
| `ca.po`, `en.po` | Traducciones (formato gettext) | Sí, a mano |

El catálogo de ejercicios se traduce aparte, en `ejercicios.json`.

## Cómo funciona

1. En el código, todo texto visible va dentro de `T("…")` (o `TN(n, "singular", "plural")` si depende de un número). Los textos que se guardan en una lista y se traducen después llevan `N_("…")`.
2. `npm run i18n` (o `node scripts/i18n.mjs all`):
   - **extract**: lee el código (`src/js/`) y actualiza `usus.pot` y los `.po`. Los textos nuevos quedan sin traducir; si un texto cambia un poco, se conserva la traducción anterior marcada como *por revisar* (fuzzy).
   - **build**: genera el diccionario `src/js/90-i18n.js` con las traducciones revisadas (las *por revisar* no se usan: se ve el castellano) y vuelve a montar `index.html`.
   - **check**: cuenta lo que falta y comprueba que los huecos `{n}`, `{x}`… sean los mismos en todos los idiomas.
3. Al publicar (web y APK) se ejecuta **build**, así que lo traducido llega a la siguiente versión sin más pasos.
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

