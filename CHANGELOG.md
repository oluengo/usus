# Changelog

Todas las versiones de Usus. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); numeración [SemVer](https://semver.org/lang/es/) (MAYOR.MENOR.PARCHE).

**Castellano** · [Català](#català) · [English](#english)

## [3.3.0] — en pruebas (beta)

- Crear plan con IA (Biblioteca → Plan y Progreso → Resumen): en 4 pasos (sobre ti, qué buscas, tu semana y para la IA) Usus prepara unas indicaciones con tus datos, cómo debe responder la IA y el enlace al catálogo, con el rango recomendado y las articulaciones de cada ejercicio. Las copias o exportas, las pegas en tu IA y su respuesta vuelve a Usus para revisarla antes de importar.
- Avisos claros: una IA no es un entrenador ni un profesional sanitario, y vas a compartir datos de salud con un servicio externo. Usus no envía nada. «Recordar mis respuestas» deja el formulario rellenado para la próxima vez.
- Al añadir un plan recibido o de la IA, si sus letras de variante ya las usan tus rutinas, se cambian por otras libres para no mezclar planes.
- Respuesta de la IA en un toque: copia su respuesta (o solo su bloque de código) y toca «Pegar respuesta de la IA». Si la guardas como archivo, Importar datos también la lleva a la revisión.

## [3.2.0] — 2026-10-20

- Plan guiado: unas preguntas (objetivo, días, minutos, material, molestias y nivel, con un test rápido o elegido) y Usus propone rutinas del catálogo a tu nivel, con calentamiento, principal, accesorios y vuelta a la calma. Revisas la propuesta, subes o bajas cada ejercicio en su escalera y se crean las rutinas (variantes A y B) y un plan en orden.
- Fichas desde cualquier sitio: toca el nombre de un ejercicio del catálogo en la rutina, antes de iniciar o en el Diario para ver cómo se hace. Si el perfil no tiene el catálogo activado, se pide activarlo.

## [3.1.0] — 2026-10-20

- Catálogo completo: 106 ejercicios nuevos (268 en total). Escaleras sin huecos, familias que tenían un solo nivel con entrada y siguiente paso, y bloques nuevos de anillas, paralelas, agarre, pino, movilidad y estiramientos, calentamiento, equilibrio y cardio.
- Cardio, nuevo tipo de movimiento en Ejercicios, y comba, nuevo material.
- Cada ficha indica su rol (principal, accesorio, movilidad, calentamiento o cardio), el rango recomendado por serie y las articulaciones que más carga. Al añadir un ejercicio del catálogo, las repeticiones o segundos salen en mitad de ese rango.

## [3.0.0] — 2026-10-20

Rediseño: estructura nueva, componentes unificados y glosario único (es/ca/en). Los datos no cambian: las copias de la 2.x se importan igual.

- Nueva estructura: Hoy · Biblioteca · Diario · Progreso · Ajustes. Biblioteca reúne Rutinas, Plan y Ejercicios; Stats pasa a llamarse Progreso.
- Hoy: lo que toca, arriba y con un único botón Empezar; accesos rápidos a otra rutina, sesión libre y actividad; los avisos, juntos en «Pendiente».
- Rutinas agrupadas por variante. Cada rutina se abre en su propia pantalla (en PC, al lado de la lista) con Empezar, Editar, Imprimir, Compartir y Duplicar.
- El plan de progresión pasa de Hoy a Biblioteca → Plan, junto a las rutinas que usa.
- Hoy, más limpio: lo que toca, la semana del plan en una línea (toca para verla) y un menú ⋯ con descarga esta semana o pausar el plan 1 a 4 semanas. «Rutinas y días» se eligen dentro del propio plan.
- Planes en orden: hoy toca la siguiente sesión que falte, sea el día que sea; si empiezas un domingo o fallas un día, se recupera, y la semana del plan pasa al hacerlas todas. Tus planes pasan solos a este modo desde la semana en la que ibas, y al editarlos puedes volver a una semana anterior para recuperarla.
- Entrenando: cabecera fija con el tiempo y el avance, series más grandes y una barra abajo con la acción que toca (marcar la serie, empezar la cuenta atrás, siguiente ejercicio o terminar).
- Progreso: el Resumen queda en cuatro tarjetas (esta semana, constancia, récords y peso), cada una con un enlace a su detalle; cifras y gráficos con un mismo estilo, y las notas del periodo pasan a Hábitos.
- Diario en filas: cada dato del día en una fila con su icono, detalle y valor (entreno primero); lo que falta, en «Añadir a este día». El peso se anota aquí.
- Ajustes en grupos, cada uno con su pantalla: Perfil, Entreno, Avisos, Apariencia e idioma, Datos y copias, y Acerca de. Interruptores para activar opciones.
- Editor de rutina más compacto en el móvil: cada ejercicio en una fila con su resumen; los detalles se abren al tocarla.
- Estilo unificado: un solo tipo de pestañas, botones con tamaños fijos y ventanas como hoja inferior en el móvil. El morado queda solo para la IA.
- Primer uso guiado en pasos: idioma y avisos, catálogo, material y cómo empezar (crear la primera rutina o importar una copia).
- Las traducciones pasan a archivos estándar (gettext) para poder traducir la app desde el navegador.
- Arreglo: al añadir un plan recibido se conserva su regla de subida, y el plan activo anterior queda guardado en Mis planes.

## [2.5.0] — 2026-10-17

### Modo diseño de rutinas
- **Secciones** dentro de la rutina: «Dividir en secciones» crea Calentamiento, Principal, Core y Vuelta a la calma (se renombran, reordenan, añaden o quitan). Opcional: una rutina sin secciones funciona como siempre.
- **Superseries y circuitos**: marca dos o más ejercicios y «Agrupar». Cada grupo tiene vueltas, descanso entre vueltas y descanso al terminar; cada ejercicio, su «descanso tras él» dentro de la vuelta.
- **Reordenar** con ↑ ↓ (salta grupos enteros y pasa de una sección a otra) o arrastrando desde ⋮⋮.
- Letras de orden (A, B, C1, C2…) y **duración aproximada** de la rutina.
- **Modo edición para PC o pantalla grande** (desde ~1000 px: ordenador, tablet en horizontal): se activa solo. Cada ejercicio en una fila tipo tabla, el **catálogo al lado** para tocar o arrastrar ejercicios a cualquier sección y una barra fija con Guardar. En el móvil, el editor lo indica.
- **Escritorio**: en pantalla grande las secciones (Hoy, Rutinas, Diario, Stats, Ajustes) pasan a una barra lateral, y Rutinas muestra la lista a la izquierda y la rutina elegida a la derecha, con sus ejercicios en tabla; el catálogo de ejercicios se ve en rejilla.

### Entrenar superseries y circuitos
- Las superseries y circuitos se entrenan como tales: A1 → A2 → descanso entre vueltas → A1…, con una barra que muestra la vuelta en curso y el orden. Con series por tiempo e inicio automático, la cuenta atrás encadena el circuito entero.

### Imprimir / PDF
- Botón **Imprimir** en cada rutina, dos formatos A4:
  - **Por ejercicio**: una hoja por ejercicio (o dos por hoja) con filas de fecha, series, lastre y notas para seguir su progresión. Por defecto deja fuera calentamiento y vuelta a la calma.
  - **Hoja de semanas**: la rutina entera en una hoja con 6 columnas de sesión y una fila de esfuerzo (PEM).
- En la app Android se usa el servicio de impresión del sistema («Guardar como PDF»), sin permisos nuevos.

### Cuenta atrás, desde cero
- Se rehace el motor de tiempos con cinco tramos y una regla para cada uno:
  - **Preparación**: antes de una serie por tiempo que arrancas tú (▶) o al reanudar una pausa. Al acabar, sonido de inicio.
  - **Serie por tiempo**: al acabar, sonido de fin y se marca hecha.
  - **Cambio de lado**: entre lado 1 y lado 2; ahora se ajusta en Ajustes → Entreno → Tiempos (5 s por defecto).
  - **Descanso entre series** y **entre ejercicios**: al acabar, si sigue una serie por tiempo con inicio automático, empieza sola (el final del descanso hace de preparación, sin una segunda cuenta atrás); si no, sonido de fin y espera.
- **Aviso final**: tic en los últimos segundos de *cualquier* cuenta atrás. Solo hay tres sonidos: tic, inicio y fin.
- La vibración pasa siempre por Ajustes → Avisos; con «Solo sonido» o «Desactivados» corta cualquier vibración en curso.
- La pantalla se mantiene encendida durante toda la sesión (no solo en las cuentas atrás) y se vuelve a pedir al volver a la app.

### Entrenar
- **RIR en series por tiempo**: «¿Cuánto más habrías aguantado?» (0, 5, 10, 15+ s), también en series encadenadas con inicio automático; se pregunta durante el descanso.
- **Ejercicio hecho**: bloque verde bien visible bajo la última serie, con el descanso que viene y el botón al siguiente ejercicio (o «Terminar y guardar»).

### Plan
- **Varios planes**: el plan activo es el que marca Hoy; los demás quedan guardados en **Mis planes** para activarlos, duplicarlos (preparar el siguiente bloque a partir del actual) o borrarlos. Cada plan puede tener nombre. Van en la copia de seguridad.

### Diario
- En una sesión ya terminada, **✎ Notas**: nota de la sesión y nota de cada ejercicio. Salen en Stats (puntos de notas y Notas del periodo).

## [2.3.0] — 2026-10-14

### Notas en Stats
- Los días con alguna nota llevan un **punto naranja** en Constancia, Carga semanal, Peso, Sueño, Pasos y el gráfico de progreso de cada ejercicio. Al tocarlo se abre una hoja con todo lo apuntado ese día (o esa semana): nota y etiquetas del Diario, sesión y PEM, notas y cambios de ejercicio, notas de actividad y de suplementos. Con **Abrir en el Diario** para editarlo.
- Constancia: los días con la etiqueta «No entrené» y sin sesión salen rayados, distintos de los días sin nada apuntado.
- **Notas del periodo** aparece en todas las pestañas de Stats (antes solo en Hábitos) y recoge notas de cualquier origen, no solo las del Diario.
- Stats → Ejercicios: al abrir un ejercicio, sus notas (✎) y sustituciones (⇄) bajo el gráfico.

### App Android
- Ajustes → App → **Actualizaciones** sustituye a «Instalar en el móvil» en el APK: versión instalada, botón a las versiones de GitHub, novedades, cómo recibir avisos con Obtainium y la huella de la firma. El APK sigue sin conectarse a Internet.

### Otros
- Nombre de ejemplo al crear un perfil: Cristina.

## [2.2.2] — 2026-10-13

### App para Android
- Primera versión de la **app para Android (APK)**, en [Releases](https://github.com/oluengo/usus/releases). Es la misma app que la PWA; cada una guarda sus datos aparte (se pasan con una copia de seguridad).
- Un solo permiso, vibración. Sin Internet ni almacenamiento: importar y exportar usan el selector de archivos y el menú de compartir de Android. Pantalla encendida durante el entreno y botón Atrás que cierra el diálogo abierto o vuelve a Hoy.
- Se puede instalar y actualizar con [Obtainium](https://github.com/ImranR98/Obtainium). Instrucciones en el [README](README.md#instalar) y en [ANDROID.md](ANDROID.md).
- En Android, la versión web avisa una vez de que existe la app (con «No, gracias» para no volver a verlo). En el README, el APK es la opción recomendada en Android y la PWA, para iPhone y ordenador.

### Catálogo traducido
- Las fichas de los 162 ejercicios (músculos, para qué sirve, cómo se hace, errores y alternativas), en **català** y **English**. Nombres de los ejercicios en català; la búsqueda también los encuentra.

### Sonido
- Avisos de sonido más suaves: tono puro, más grave y que se apaga solo, en lugar del pitido de onda cuadrada.

### Transparencia
- Ajustes → App → Acerca de y README: *Hecha con IA · probada por humanos*.
- Nueva página de [privacidad](PRIVACY.md).

## [2.2.1] — 2026-10-13

### Técnica de un ejercicio
- Nuevo campo **Técnica** (opcional) en los ejercicios del catálogo dentro de una rutina: tempo, pausa, rango, agarre… («bajada 3 s», «pausa 2 s», «agarre ancho»).
- Misma ficha y misma cadena de progresión que el ejercicio, pero historial, «Anterior», récords y propuestas del asistente aparte para cada técnica.
- Stats → Ejercicios: las variantes salen juntas bajo su ejercicio.
- Al vincular un nombre propio como «Fondos en paralelas (bajada 3 s)», lo que va entre paréntesis (salvo «por lado») pasa a ser la técnica.
- Va también en el análisis con IA y en el CSV (columna `tecnica`).

## [2.2.0] — 2026-10-13

### Esfuerzo
- Al terminar la sesión, **¿Cuánto te ha costado?**: PEM del 1 al 10 (esfuerzo percibido), opcional, con una descripción de cada nivel. Se puede poner o cambiar después en el Diario.
- **Carga** = PEM × minutos. Nuevo bloque en Stats → Entreno: carga semanal de las últimas 8 semanas, aviso si una semana supera en más de un 30 % la media de las 4 anteriores, y PEM media.
- **RIR por serie** (repeticiones en reserva, 0–4+), opcional y desactivado por defecto: al marcar una serie, en la tarjeta y en la pantalla de descanso. «Anterior» lo muestra.
- El asistente usa la PEM: 9–10 en dos sesiones seguidas sin llegar al objetivo también propone volver al paso anterior.
- Ajustes → Entreno → **Esfuerzo**: preguntar la PEM (activado) y RIR por serie (desactivado).

### Cambiar ejercicio y notas
- **⇄ Cambiar ejercicio** en la sesión: del catálogo (primero los del mismo tipo) o propio. Las series cuentan para el ejercicio que haces; la sesión recuerda a cuál sustituía y se puede deshacer.
- Al terminar, si cambiaste algo: **Cambiar también en la rutina** (si no, solo ese día). Si vuelves al original, la próxima vez recuerda por cuál lo cambiaste.
- **✎ Nota** por ejercicio (140 caracteres). Se ve la próxima vez junto a «Anterior» y en el Diario.
- PEM, carga, RIR, sustituciones y notas van en el análisis con IA y en el CSV.

## [2.1.0] — 2026-10-13

### Análisis con IA externa
- Stats → Resumen: **Analizar con IA externa**, marcado como externo. Usus genera un único texto (instrucciones + tus datos) para copiar o compartir con la IA que uses. Usus no envía nada.
- Período (4, 8, 12, 26 semanas o todo; 8 por defecto) y qué incluir: entrenos, peso, sueño, suplementos, actividad, notas y, en perfiles con ciclo, reglas y síntomas.
- **Sobre ti**, opcional y guiado: fecha de nacimiento (en el texto solo sale la edad), altura, experiencia, lesiones, molestias actuales, condiciones de salud, medicación y objetivos. Se guardan solo si se marca la casilla; se editan o borran en Ajustes → Cuerpo y van en la copia de seguridad.
- Instrucciones para la IA en el idioma de la app: sin diagnósticos, interpretar según los antecedentes, gráficos antes que texto, informe breve y PDF A4 listo para imprimir.
- Si la IA propone rutinas ajustadas, se pega su respuesta y se abre la pantalla de rutinas recibidas para actualizar o añadir.
- Aviso claro antes de exportar: datos de salud hacia un servicio externo.

### Datos en CSV
- Ajustes → Datos → **Datos en CSV** sustituye a «Sesiones en CSV»: un .zip con sesiones (una fila por serie), rutinas, diario, suplementos, peso, actividades y ciclo, más un archivo que explica cada columna.
- Separador y decimales según el idioma (`;` y coma en castellano y català, `,` y punto en inglés). UTF-8.

## [2.0.0] — 2026-10-12

### Catálogo de ejercicios (opcional, por perfil)
- Archivo aparte `ejercicios.json` con 162 ejercicios de calistenia: identificador fijo, nombre en castellano e inglés, patrón de movimiento, nivel (1–5, barras crecientes), tipo (repeticiones o tiempo), por lado, impacto y material (iconos).
- Ficha de cada ejercicio: músculos, para qué sirve, cómo se hace, errores típicos, alternativas caseras y progresión (cadena de pasos y variantes del mismo nivel).
- La primera vez, cada perfil elige si lo usa («Sí, dame toda la info» / «No, solo mis ejercicios»). Se cambia en Ajustes → App. Sin catálogo, todo funciona como antes.
- Rutinas → Ejercicios: búsqueda (también en inglés o por alias), filtro por movimiento y «Solo con mi material».
- Selector del catálogo en el editor de rutina y en la sesión; ficha con el botón **i**, también entrenando.
- Ejercicios propios con material: de la lista (con icono) u otro escrito (sin icono).
- **Vincular ejercicios**: propone para cada nombre que ya usas un ejercicio del catálogo; aceptar todo, elegir otro, dejar como propio o deshacer. Se conserva tu nombre. Historial, récords y estadísticas se agrupan por ejercicio vinculado.
- Ajustes → Entreno: **Mi material**. Funciona sin conexión (el catálogo se guarda con la app).
- Las fichas están, por ahora, solo en castellano (los nombres, también en inglés).

### Asistente de progresión
- Al terminar una sesión, por cada ejercicio del catálogo de la rutina: ▲ propuesta de subir al siguiente paso si llegas al objetivo en todas las series 2 (o 3) sesiones seguidas; ▼ propuesta de volver al anterior si te quedas por debajo del 60 % del objetivo 2 sesiones seguidas (o 50 % en 3, o nunca).
- Cada propuesta muestra tus series y deja **Cambiar en la rutina** (con objetivo de inicio ajustable), **Más tarde** o **No proponer**.
- Plan: nueva regla para la semana ↑ (solo recordatorio, +1 o +2 repeticiones por serie, +1 serie, o siguiente paso si llegaste al objetivo). Se aplica sola al empezar la semana a las rutinas de esa variante, con aviso en Hoy y **Deshacer**. Esas rutinas solo reciben propuestas de retroceder.
- Stats → Ejercicios: tu posición en la cadena (superado, actual, siguiente, meta).
- Las sesiones guardan la rutina de origen y el ejercicio del catálogo.

## [1.4.0] — 2026-10-12

### Avisos
- Nuevo apartado **Avisos durante el entreno** en Ajustes → App (antes «Avisos» en Entreno): sonido y vibración, solo sonido, solo vibración o desactivados.
- El botón **Probar** comprueba el modo elegido. El destello en pantalla se mantiene siempre.

## [1.3.1] — 2026-10-12

### Correcciones
- El service worker (`sw.js`) se había quedado vacío desde la 1.2.1: la app no se guardaba para usarla sin conexión. Restaurado.

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

### [3.3.0] — en proves (beta)

- Crea un pla amb IA (Biblioteca → Pla i Progrés → Resum): en 4 passos (sobre tu, què busques, la teva setmana i per a la IA) Usus prepara unes indicacions amb les teves dades, com ha de respondre la IA i l'enllaç al catàleg, amb el rang recomanat i les articulacions de cada exercici. Les copies o exportes, les enganxes a la teva IA i la resposta torna a Usus per revisar-la abans d'importar.
- Avisos clars: una IA no és un entrenador ni un professional sanitari, i compartiràs dades de salut amb un servei extern. Usus no envia res. «Recorda les meves respostes» deixa el formulari omplert per a la propera vegada.
- En afegir un pla rebut o de la IA, si les seves lletres de variant ja les fan servir les teves rutines, es canvien per altres de lliures per no barrejar plans.
- Resposta de la IA en un toc: copia la resposta (o només el bloc de codi) i toca «Enganxa la resposta de la IA». Si la deses com a fitxer, Importar dades també la porta a la revisió.

### [3.2.0] — 2026-10-20

- Pla guiat: unes preguntes (objectiu, dies, minuts, material, molèsties i nivell, amb un test ràpid o triat) i Usus proposa rutines del catàleg al teu nivell, amb escalfament, principal, accessoris i tornada a la calma. Revises la proposta, puges o baixes cada exercici a la seva escala i es creen les rutines (variants A i B) i un pla en ordre.
- Fitxes des de qualsevol lloc: toca el nom d'un exercici del catàleg a la rutina, abans d'iniciar o al Diari per veure com es fa. Si el perfil no té el catàleg activat, es demana activar-lo.

### [3.1.0] — 2026-10-20

- Catàleg complet: 106 exercicis nous (268 en total). Escales sense buits, famílies que tenien un sol nivell amb entrada i pas següent, i blocs nous d'anelles, paral·leles, presa, pi, mobilitat i estiraments, escalfament, equilibri i cardio.
- Cardio, nou tipus de moviment a Exercicis, i corda, nou material.
- Cada fitxa indica el seu rol (principal, accessori, mobilitat, escalfament o cardio), el rang recomanat per sèrie i les articulacions que més carrega. En afegir un exercici del catàleg, les repeticions o segons surten a la meitat d'aquest rang.

### [3.0.0] — 2026-10-20
- Nova estructura: Avui · Biblioteca · Diari · Progrés · Ajustos. Biblioteca aplega Rutines, Pla i Exercicis; Stats passa a dir-se Progrés.
- Avui: el que toca, a dalt i amb un sol botó Comença; accessos ràpids a una altra rutina, sessió lliure i activitat; els avisos, junts a «Pendent».
- Rutines agrupades per variant. Cada rutina s'obre a la seva pantalla (a l'ordinador, al costat de la llista) amb Comença, Edita, Imprimeix, Comparteix i Duplica.
- El pla de progressió passa d'Avui a Biblioteca → Pla, al costat de les rutines que fa servir.
- Avui, més net: el que toca, la setmana del pla en una línia (toca-la per veure-la) i un menú ⋯ amb descàrrega aquesta setmana o pausar el pla d'1 a 4 setmanes. «Rutines i dies» es trien dins del mateix pla.
- Plans en ordre: avui toca la següent sessió que falti, sigui el dia que sigui; si comences un diumenge o falles un dia, es recupera, i la setmana del pla passa en fer-les totes. Els teus plans passen sols a aquest mode des de la setmana on anaves, i en editar-los pots tornar a una setmana anterior per recuperar-la.
- Entrenant: capçalera fixa amb el temps i l'avanç, sèries més grans i una barra a baix amb l'acció que toca (marcar la sèrie, començar el compte enrere, exercici següent o acabar).
- Progrés: el Resum queda en quatre targetes (aquesta setmana, constància, rècords i pes), cadascuna amb un enllaç al seu detall; xifres i gràfics amb un mateix estil, i les notes del període passen a Hàbits.
- Diari en files: cada dada del dia en una fila amb la seva icona, detall i valor (l'entrenament primer); el que falta, a «Afegir a aquest dia». El pes s'anota aquí.
- Ajustos en grups, cadascun amb la seva pantalla: Perfil, Entrenament, Avisos, Aparença i idioma, Dades i còpies, i Quant a. Interruptors per activar opcions.
- Editor de rutina més compacte al mòbil: cada exercici en una fila amb el seu resum; els detalls s'obren en tocar-la.
- Estil unificat: un sol tipus de pestanyes, botons amb mides fixes i finestres com a full inferior al mòbil. El lila queda només per a la IA.
- Primer ús guiat en passos: idioma i avisos, catàleg, material i com començar (crear la primera rutina o importar una còpia).
- Les traduccions passen a fitxers estàndard (gettext) per poder traduir l'app des del navegador.
- Correcció: en afegir un pla rebut es conserva la seva regla de pujada, i el pla actiu anterior queda desat a Els meus plans.

### [2.5.0] — 2026-10-17
- Mode disseny de rutines: seccions, supersèries i circuits (voltes, descans entre voltes), reordenar amb ↑ ↓ o arrossegant, durada aproximada.
- Supersèries i circuits també en entrenar, amb la volta en curs a la vista i el compte enrere encadenat.
- Mode edició per a PC o pantalla gran (s'activa sol): cada exercici en una fila, catàleg al costat i barra fixa amb Desa.
- Escriptori: barra lateral de seccions; Rutines amb la llista a l'esquerra i la rutina a la dreta; catàleg en graella.
- Imprimir / PDF: un full per exercici (o dos per full) o full de setmanes amb 6 sessions.
- Compte enrere refet: preparació, sèrie, canvi de costat (ajustable), descansos; tres sons (tic, inici, fi); la vibració respecta sempre els avisos; pantalla encesa durant tota la sessió.
- RIR en sèries per temps; «Exercici fet» ben visible; notes editables en sessions acabades.
- Diversos plans: un d'actiu i la resta desats (activar, duplicar, esborrar).

### [2.3.0] — 2026-10-14
- Notes a Stats: punt taronja als dies amb nota (Constància, Càrrega, Pes, Son, Passos, progrés de cada exercici); en tocar-lo, tot el que vas apuntar aquell dia.
- Dies «No vaig entrenar» marcats a Constància; «Notes del període» a totes les pestanyes; notes de cada exercici al seu historial.
- App Android: Ajustos → App → Actualitzacions.

### [2.2.2] — 2026-10-13
- Primera versió de l'app per a Android (APK), a Releases: la mateixa app, amb les dades a part de les de la PWA. Un sol permís (vibració), sense Internet. Es pot actualitzar amb Obtainium.
- Fitxes del catàleg en català i English; noms dels exercicis en català.
- Avisos de so més suaus.
- «Feta amb IA · provada per humans» i pàgina de privacitat.

### [2.2.1] — 2026-10-13
- Tècnica d'un exercici (tempo, pausa, rang, presa): mateixa fitxa, historial i progressió a part.

### [2.2.0] — 2026-10-13
- Esforç de la sessió (PEM 1–10) i càrrega setmanal; RIR per sèrie opcional.
- Canviar un exercici només a la sessió i notes per exercici.

### [2.1.0] — 2026-10-13
- Analitzar amb IA externa: un text amb instruccions i les teves dades per a la IA que facis servir (informe amb gràfics i PDF A4). Dades opcionals per a l'anàlisi.
- Dades en CSV: un .zip amb una taula per tipus de dada.

### [2.0.0] — 2026-10-12
- Catàleg d'exercicis opcional per perfil (fitxes, material, nivell i progressió), vinculació dels teus exercicis i el meu material.
- Assistent de progressió: propostes de pujar o tornar al pas anterior en acabar la sessió, i pujada automàtica a la setmana ↑ del pla.

### [1.4.0] — 2026-10-12
- Avisos durant l'entrenament a Ajustos → App: so i vibració, només so, només vibració o desactivats.

### [1.3.1] — 2026-10-12
- Torna a funcionar sense connexió (el service worker estava buit des de la 1.2.1).

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

### [3.3.0] — in testing (beta)

- Create plan with AI (Library → Plan and Progress → Summary): in 4 steps (about you, what you're after, your week and for the AI) Usus prepares instructions with your data, how the AI should reply and the catalogue link, with each exercise's recommended range and joints. Copy or export them, paste them into your AI and its reply comes back to Usus to review before importing.
- Clear warnings: an AI isn't a coach or a health professional, and you'll be sharing health data with an external service. Usus sends nothing. “Remember my answers” keeps the form filled in for next time.
- When adding a received or AI plan, if its variant letters are already used by your routines, they're changed to free ones so plans don't get mixed.
- AI reply in one tap: copy its reply (or just its code block) and tap “Paste the AI's reply”. If you save it as a file, Import data also takes it to the review.

### [3.2.0] — 2026-10-20

- Guided plan: a few questions (goal, days, minutes, equipment, aches and level, with a quick test or your own choice) and Usus suggests catalogue routines at your level, with warm-up, main work, accessories and cool-down. Review the suggestion, move each exercise up or down its progression, and the routines (variants A and B) and an in-order plan are created.
- Cards from anywhere: tap the name of a catalogue exercise in a routine, before starting or in the Diary to see how it's done. If the profile doesn't have the catalogue turned on, you're asked to turn it on.

### [3.1.0] — 2026-10-20

- Complete catalogue: 106 new exercises (268 in total). Progressions without gaps, single-level families now with an entry and a next step, and new blocks for rings, parallel bars, grip, handstand, mobility and stretching, warm-up, balance and cardio.
- Cardio, a new movement type in Exercises, and jump rope, a new piece of equipment.
- Each card shows its role (main, accessory, mobility, warm-up or cardio), the recommended range per set and the joints it loads most. When you add an exercise from the catalogue, reps or seconds start in the middle of that range.

### [3.0.0] — 2026-10-20
- New layout: Today · Library · Diary · Progress · Settings. Library brings together Routines, Plan and Exercises; Stats is now called Progress.
- Today: what's on, at the top with a single Start button; shortcuts to another routine, a free session and an activity; reminders together under “To do”.
- Routines grouped by variant. Each routine opens on its own screen (on a computer, next to the list) with Start, Edit, Print, Share and Duplicate.
- The progression plan moves from Today to Library → Plan, next to the routines it uses.
- Cleaner Today: what's on, the plan week in one line (tap to see it) and a ⋯ menu to deload this week or pause the plan for 1 to 4 weeks. “Routines and days” are chosen inside the plan itself.
- In-order plans: today is the next session still to do, whatever the day; if you start on a Sunday or miss a day you catch up, and the plan week moves on when all are done. Your plans switch to this mode automatically from the week you were on, and when editing them you can go back to an earlier week to catch up.
- Training: a fixed header with time and progress, bigger sets and a bottom bar with the next action (mark the set, start the countdown, next exercise or finish).
- Progress: the Summary is now four cards (this week, consistency, records and weight), each linking to its details; figures and charts share one style, and period notes move to Habits.
- Diary in rows: each item of the day in a row with its icon, detail and value (training first); anything missing goes under “Add to this day”. Weight is logged here.
- Settings in groups, each with its own screen: Profile, Workout, Alerts, Appearance and language, Data and backups, and About. Switches to turn options on.
- More compact routine editor on phones: one row per exercise with its summary; tap it to open the details.
- Unified style: one kind of tabs, buttons with fixed sizes and dialogs as bottom sheets on phones. Purple is now only for AI.
- Guided first run in steps: language and notices, catalogue, equipment and how to start (create your first routine or import a backup).
- Translations move to standard files (gettext) so the app can be translated from the browser.
- Fix: adding a received plan keeps its progression rule, and the previous active plan is saved in My plans.

### [2.5.0] — 2026-10-17
- Routine design mode: sections, supersets and circuits (rounds, rest between rounds), reorder with ↑ ↓ or by dragging, estimated duration.
- Supersets and circuits while training too, with the current round in view and the countdown chained.
- Edit mode for PC or large screens (turns on by itself): one row per exercise, catalogue alongside and a fixed bar with Save.
- Desktop: sidebar for sections; Routines with the list on the left and the selected routine on the right; catalogue in a grid.
- Print / PDF: one sheet per exercise (or two per sheet) or a weekly sheet with 6 sessions.
- Countdown rebuilt: get-ready, set, side switch (adjustable), rests; three sounds (tick, start, end); vibration always follows alerts; screen stays on for the whole session.
- RIR for timed sets; clearly visible “Exercise done”; notes editable on finished sessions.
- Several plans: one active and the rest saved (activate, duplicate, delete).

### [2.3.0] — 2026-10-14
- Notes in Stats: an orange dot on days with a note (Consistency, Load, Weight, Sleep, Steps, each exercise's progress); tap it to see everything logged that day.
- “Didn't train” days marked in Consistency; “Notes for the period” in every tab; each exercise's notes in its history.
- Android app: Settings → App → Updates.

### [2.2.2] — 2026-10-13
- First Android app release (APK), in Releases: the same app, with its data kept apart from the PWA's. One permission only (vibration), no Internet. Can be updated with Obtainium.
- Catalogue cards in Català and English; exercise names in Català.
- Softer sound alerts.
- “Built with AI · tested by humans” and a privacy page.

### [2.2.1] — 2026-10-13
- Exercise technique (tempo, pause, range, grip): same card, separate history and progression.

### [2.2.0] — 2026-10-13
- Session effort (RPE 1–10) and weekly load; optional RIR per set.
- Swap an exercise for one session only, and notes per exercise.

### [2.1.0] — 2026-10-13
- Analyse with external AI: a text with instructions and your data for the AI you use (report with charts and an A4 PDF). Optional data for the analysis.
- Data as CSV: a .zip with one table per data type.

### [2.0.0] — 2026-10-12
- Optional exercise catalogue per profile (cards, equipment, level and progression), linking your exercises, and my equipment.
- Progression assistant: suggestions to step up or go back after a session, and automatic increases in the plan's ↑ week.

### [1.4.0] — 2026-10-12
- Training alerts in Settings → App: sound and vibration, sound only, vibration only or off.

### [1.3.1] — 2026-10-12
- Works offline again (the service worker had been empty since 1.2.1).

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
