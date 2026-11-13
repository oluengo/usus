# Usus translations

Usus is in **Spanish** (source language), **Catalan** and **English**: Spanish and English for international reach and Catalan for closeness. No more languages are planned. Translations are edited by hand in the `.po` files; to suggest a correction, open an [issue](https://github.com/oluengo/usus/issues).

## Files

| File | What it is | Edited? |
|---|---|---|
| `usus.pot` | Template with every text in the app, in Spanish | No: generated with `npm run i18n` |
| `ca.po`, `en.po` | Translations (gettext format) | Yes, by hand |

The exercise catalogue is translated separately, in `ejercicios.json`.

## How it works

1. In the code, every visible text goes inside `T("…")` (or `TN(n, "singular", "plural")` if it depends on a number). Texts stored in a list and translated later use `N_("…")`.
2. `npm run i18n` (or `node scripts/i18n.mjs all`):
   - **extract**: reads the code (`src/js/`) and updates `usus.pot` and the `.po` files. New texts stay untranslated; if a text changes slightly, the previous translation is kept and marked *needs review* (fuzzy).
   - **build**: generates the dictionary `src/js/90-i18n.js` with the reviewed translations (those *needing review* aren't used: the Spanish text shows) and rebuilds `index.html`.
   - **check**: counts what's missing and checks that the placeholders `{n}`, `{x}`… are the same in every language.
3. Publishing (web and APK) runs **build**, so translations reach the next version with no extra steps.
4. On every change GitHub checks that the template is up to date and that no placeholders are wrong ("Strings" workflow).

## Glossary

One word per concept, in the three languages:

| Spanish | Catalan | English | What it is |
|---|---|---|---|
| Rutina | Rutina | Routine | List of exercises you train |
| Sesión | Sessió | Session | One time you train |
| Plan | Pla | Plan | Order of variants by week |
| Variante | Variant | Variant | A, B, C… of a plan |
| Semana de descarga | Setmana de descàrrega | Deload week | Easy week within the plan |
| Serie | Sèrie | Set | |
| Repeticiones (reps) | Repeticions (reps) | Reps | |
| Descanso | Descans | Rest | |
| Lastre | Llast | Added weight | |
| Por lado | Per costat | Per side | |
| Superserie | Supersèrie | Superset | |
| Circuito | Circuit | Circuit | |
| Vuelta | Volta | Round | Of a superset or circuit |
| Sección | Secció | Section | Part of a routine (warm-up…) |
| Esfuerzo (PEM) | Esforç (PEM) | Effort (RPE) | 1–10 scale |
| RIR | RIR | RIR | Reps in reserve |
| Catálogo | Catàleg | Catalogue | List of exercises with cards |
| Ficha | Fitxa | Card | An exercise's details |
| Diario | Diari | Diary | |
| Copia de seguridad | Còpia de seguretat | Backup | |
| Perfil | Perfil | Profile | |

Style: sentence case (only the first letter capitalised), buttons start with a verb, informal "you" (*tú* in Spanish, *tu* in Catalan).
