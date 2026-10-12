# Changelog

Todas las versiones de Usus. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); numeración [SemVer](https://semver.org/lang/es/) (MAYOR.MENOR.PARCHE).

**Castellano** · [Català](#català) · [English](#english)

## [1.3.0] — 2026-10-12

### Compartir
- Las rutinas compartidas llevan su identificador de origen. Al recibir una que ya tienes (o una tuya que vuelve modificada), se ofrece **Actualizar** (por defecto) o **Añadir como nueva**.
- Al actualizar cambian los ejercicios y el bloque; el nombre, los días, la variante y las sesiones registradas se mantienen.
- Copiar rutinas a otro perfil también conserva el origen, para poder actualizarlas después.

## [1.2.2] — 2026-10-12

### Correcciones
- Al cambiar de perfil (o borrar uno) la app se queda en la misma pantalla y pestaña de Ajustes, en vez de volver a Hoy.

## [1.2.1] — 2026-10-12

### Cambios
- Ajustes reorganizado en pestañas: Entreno (tiempos, objetivos, avisos), Cuerpo (peso, ciclo), App (idioma, apariencia, acerca de, instalar, compartir, apoyar) y Datos (copias, perfil, zona peligrosa). Recuerda la última pestaña.
- El perfil queda arriba con «Editar» y «Perfiles» (cambiar o añadir).

## [1.2.0] — 2026-10-12

### Perfiles
- Varias personas en el mismo móvil. Cada perfil es independiente: rutinas, sesiones, diario, plan, peso, ciclo, idioma, tema, tiempos y copia de seguridad.
- Cambio de perfil desde Hoy o Ajustes (no con una sesión en curso).
- Al crear un perfil: nombre, sexo (no se puede cambiar después) y color; empezar vacío o copiando rutinas de otro perfil (sin registros).
- En perfiles de mujer, registro de la regla opcional y desactivado por defecto, con explicación de que todo queda en el móvil.
- Copiar rutinas a otro perfil y borrar un perfil (doble confirmación).
- Los datos existentes pasan a ser el primer perfil sin moverse (mismas claves).

### Acerca de
- Enlace al código fuente y accesos para informar de un problema o proponer una mejora en GitHub, con plantilla y datos técnicos opcionales.

### Correcciones
- Rutinas: el botón «Compartir» pasa a icono para que «Nueva rutina» no salte de línea en móviles estrechos.

## [1.1.0] — 2026-10-11

### Compartir
- Compartir la app desde Ajustes («Compartir» o «Copiar enlace»).
- Compartir un entreno como imagen o texto, al terminar la sesión o desde el Diario. Eliges si salen los ejercicios, la duración y los récords; nunca el peso, el diario ni el ciclo.
- Compartir rutinas: una sola (botón en cada rutina) o varias / el programa entero (botón «Compartir» en Rutinas), con el plan de progresión opcional (sin tus fechas). Por enlace o archivo .json.
- Al abrir un enlace o importar un archivo compartido, Usus muestra lo recibido y deja elegir qué añadir. Las rutinas con el mismo nombre se añaden como «(2)»; el plan empieza el lunes siguiente.
- Sin servidores: el enlace lleva los datos comprimidos tras «#», que no se envía a ningún sitio.

### Cambios
- Tema automático por defecto (sigue el modo claro u oscuro del dispositivo). Quien ya eligió un tema lo conserva.
- Icono nuevo.
- Al guardar una sesión aparece un resumen con «Compartir».

## [1.0.0] — 2026-10-11

Primera versión pública.

### Entreno
- Rutinas con bloques (pecho, espalda, pierna…), variantes y días de la semana.
- Series por repeticiones o por tiempo, con lastre, «por lado» (izquierda/derecha) y descanso propio por ejercicio.
- Pantalla de un ejercicio cada vez, con «Saltar» (pide confirmación si quedan series), «Siguiente ejercicio» y «Terminar y guardar».
- Cuenta atrás a pantalla completa: series por tiempo encadenadas, inicio automático opcional, cambio de lado, descansos entre series y entre ejercicios, ajuste −5 s / +5 s, pausa, saltar y parar.
- Pitidos y vibración configurables (cuenta atrás de inicio y aviso final); pantalla encendida durante la cuenta atrás.
- Pausa de la sesión completa (el tiempo en pausa no cuenta).
- Plan de progresión: rotación de variantes por semanas, semanas de descarga y fecha de revisión. La pestaña Hoy muestra qué toca cada día.

### Diario
- Por día: sueño (horas y calidad), suplementos (gestionables), entrenos, pasos, actividad (caminata, carrera, bici y tipos propios, en km o millas) y notas con etiquetas.
- Peso semanal con aviso el día de pesaje y objetivo opcional.

### Ciclo (opcional, desactivado por defecto)
- Registro de inicio y fin de la regla, cantidad y síntomas (lista editable).
- Estimación aproximada de la próxima regla, la ovulación y la ventana fértil (3 ciclos), con margen según la variación de tus ciclos y aviso de ciclos irregulares.
- Calendario mensual, tarjeta en Hoy, aviso configurable antes de la regla prevista y bloque en Stats (medias, historial, síntomas y series por fase).
- Pausa de predicciones con motivo (embarazo, lactancia, anticonceptivo hormonal, perimenopausia u otro).
- Es una estimación: no sirve como anticonceptivo ni como diagnóstico.

### Estadísticas
- Bloques por categoría (Resumen, Entreno, Cuerpo, Hábitos) que se pueden ordenar y ocultar: objetivos, constancia, récords, ejercicios, equilibrio izquierda/derecha, reparto y horario por bloque, peso, ciclo, sueño, pasos, actividad, suplementos y notas.

### Ajustes y datos
- Todo se guarda solo en el dispositivo; sin conexiones externas (tipografía incluida).
- Copia completa en JSON, solo rutinas, sesiones en CSV e importación combinando datos. Recordatorio de copia cada 30 días.
- Castellano, catalán e inglés; temas protector (oscuro cálido), oscuro, claro y automático.
- App web instalable (PWA) que funciona sin conexión.

---

## Català

### [1.3.0] — 2026-10-12

En rebre una rutina que ja tens, la pots actualitzar en lloc de duplicar-la.

### [1.2.2] — 2026-10-12

En canviar de perfil, et quedes a la mateixa pantalla.

### [1.2.1] — 2026-10-12

Ajustos reorganitzat en pestanyes (Entrenament, Cos, App, Dades).

### [1.2.0] — 2026-10-12

Perfils independents al mateix mòbil (dades, ajustos i còpia propis), registre de la regla opcional en perfils de dona, copiar rutines entre perfils, i enllaços al codi i per informar de problemes a GitHub.

### [1.1.0] — 2026-10-11

Compartir: l'app des d'Ajustos, un entrenament com a imatge o text i les rutines o el programa sencer amb el pla opcional, per enllaç o fitxer, sense servidors. Tema automàtic per defecte i icona nova.

### [1.0.0] — 2026-10-11

Primera versió pública: rutines amb sèries per repeticions o per temps, compte enrere encadenat amb inici automàtic, pausa de sessió, pla de progressió amb pantalla Avui, diari (son, suplements, passos, activitat, notes), pes setmanal, seguiment opcional del cicle (estimació aproximada, desactivat per defecte), estadístiques configurables, còpies JSON/CSV, tres idiomes i funcionament sense connexió. Dades només al dispositiu.

---

## English

### [1.3.0] — 2026-10-12

When you receive a routine you already have, you can update it instead of duplicating it.

### [1.2.2] — 2026-10-12

Switching profile keeps you on the same screen.

### [1.2.1] — 2026-10-12

Settings reorganised into tabs (Workout, Body, App, Data).

### [1.2.0] — 2026-10-12

Independent profiles on the same phone (own data, settings and backup), optional period log on women's profiles, copying routines between profiles, and links to the source code and to report problems on GitHub.

### [1.1.0] — 2026-10-11

Sharing: the app from Settings, a workout as an image or text, and routines or the whole programme with an optional plan, by link or file, with no servers. Automatic theme by default and a new icon.

### [1.0.0] — 2026-10-11

First public release: routines with rep- or time-based sets, chained countdowns with optional auto-start, session pause, progression plan with a Today screen, diary (sleep, supplements, steps, activity, notes), weekly weight, optional cycle tracking (approximate estimate, off by default), configurable stats, JSON/CSV backups, three languages and offline use. Data stays on the device.
