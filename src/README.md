# Código de Usus

La app es una sola página (`index.html` en la raíz), pero se escribe por partes aquí y se monta con:

```
npm run build        # traducciones (i18n/*.po → js/90-i18n.js) + monta index.html
```

`index.html` se genera y se sube al repositorio tal cual (la web, el APK y las pruebas lo usan): **no lo edites a mano**, edita `src/` y monta. GitHub comprueba en cada cambio que esté al día (flujo «Textos»).

| Archivo | Qué es |
|---|---|
| `index.html` | Esqueleto de la página. `/*@css*/` y `/*@js*/` marcan dónde van los estilos y el código. |
| `css/*.css` | Estilos, en orden de nombre: base y temas, catálogo, progresión e IA, compartir y diario, editor, estructura 3.0, pantalla ancha, imprimible. |
| `js/*.js` | Código, en orden de nombre. Todo va dentro del mismo bloque `(() => { … })()`, así que las partes se ven entre sí como si fueran un solo archivo; el orden importa solo para lo que se ejecuta al cargar (`99-arranque.js` va el último). |
| `js/90-i18n.js` | Diccionario de traducciones. Lo genera `scripts/i18n.mjs` desde `i18n/*.po`: no se edita a mano. |

Partes del código: `01-base` (utilidades, idiomas, almacenamiento, estado) · `02-plan` · `03-catalogo` · `04-secciones-grupos` · `05-progresion` · `06-ia-csv` · `07-esfuerzo-notas` · `08-iconos-render` · `10-hoy-sesion` · `11-foco` (cuenta atrás) · `12-rutinas-editor` · `13-imprimir` · `14-diario-datos` · `15-ciclo` · `16-actividad-diario` · `17-progreso` · `18-ajustes` · `19-novedades-bienvenida` · `20-compartir` · `21-perfiles` · `22-acerca` · `23-formato-datos` · `30-eventos` · `99-arranque`.

Para probar: `npm test` (monta antes de arrancar; ver `tests/README.md`).
