# Tests

App tests with [Playwright](https://playwright.dev) in a phone-sized Chromium (Pixel 7). GitHub runs them on every change to `beta` and `main` ("Tests" workflow).

```
npm ci
npx playwright install chromium   # the first time
npm run www                        # generates www/ (used by the APK test)
npm test
```

| File | What it checks |
|---|---|
| `arranque` | Opens in Spanish, Catalan and English and goes through every section without errors |
| `sesion` | Supersets, timed circuits, per-side exercises and alerts without vibration |
| `editor` | Sections, grouping, moving, saving; catalogue alongside and dragging on wide screens |
| `planes` | Several plans: duplicate, create, activate, delete |
| `notas` | Finish a session, add notes afterwards and see them in Stats |
| `imprimir` | Per-exercise sheets and weeks sheet |
| `compartir` | Routine link with sections and supersets |
| `datos` | Export the full backup and import it into another installation |
| `beta` | The web beta keeps its data separate |
| `apk` | Android bridge: sharing, printing and the Back button |
| `plan-ia` | Create a plan with AI: steps, copied instructions, reviewed and imported answer; free variant letters |
| `guiado` | Guided plan: questions, proposal with discomfort, adjust and create A/B routines and plan; cards from the routines |
| `catalogo` | Complete catalogue cards (es/ca/en, role, range, joints) and consistent progressions |

Test data is made up (`tests/helpers.mjs`).
