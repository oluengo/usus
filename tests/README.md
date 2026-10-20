# Pruebas

Pruebas de la app con [Playwright](https://playwright.dev) en un Chromium con tamaño de móvil (Pixel 7). GitHub las ejecuta en cada cambio de `beta` y `main` (flujo «Pruebas»).

```
npm ci
npx playwright install chromium   # la primera vez
npm run www                        # genera www/ (lo usa la prueba del APK)
npm test
```

| Archivo | Qué comprueba |
|---|---|
| `arranque` | Abre en castellano, català e inglés y recorre todas las secciones sin errores |
| `sesion` | Superseries, circuitos por tiempo, ejercicios por lado y avisos sin vibración |
| `editor` | Secciones, agrupar, mover, guardar; catálogo al lado y arrastrar en pantalla ancha |
| `planes` | Varios planes: duplicar, crear, activar, borrar |
| `notas` | Terminar una sesión, añadir notas después y verlas en Stats |
| `imprimir` | Hojas por ejercicio y hoja de semanas |
| `compartir` | Enlace de rutina con secciones y superseries |
| `datos` | Exportar la copia completa e importarla en otra instalación |
| `beta` | La web beta guarda sus datos aparte |
| `apk` | Puente de Android: compartir, imprimir y botón Atrás |
| `plan-ia` | Crear plan con IA: pasos, indicaciones copiadas, respuesta revisada e importada; letras de variante libres |
| `guiado` | Plan guiado: preguntas, propuesta con molestia, ajustar y crear rutinas A/B y plan; fichas desde las rutinas |
| `catalogo` | Fichas del catálogo completas (es/ca/en, rol, rango, articulaciones) y progresiones coherentes |

Los datos de las pruebas son inventados (`tests/helpers.mjs`).
