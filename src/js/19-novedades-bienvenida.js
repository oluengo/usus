/* ---------- Novedades (una vez por versión; historial al tocar la versión) ---------- */
const CHANGES = [  // Novedades: solo en castellano; las traducciones, en i18n/*.po
  ["3.5.1", [
    N_("Compartir con Usus: desde la app de tu IA, menú Compartir → Usus lleva su respuesta (texto o archivo) a la revisión, sin copiar ni pegar. En el APK y en la web instalada en Android."),
    N_("RIR sin contestar: si al acabar el descanso no has marcado cuántas te quedaban (o cuánto más habrías aguantado, en las series por tiempo), cuenta como 0. Con «×» la serie se queda sin valor."),
    N_("Ventanas: el título va pegado arriba del todo (al desplazar ya no asoma el contenido por encima) y con más aire respecto a lo que sigue."),
    N_("Al actualizar, en lugar de la ventana de novedades sale un aviso breve que se oculta solo. Las novedades siguen en Ajustes → Acerca de (tocando la versión).")
  ]],
  ["3.5.0", [
    N_("Reiniciar el plan: en el menú ⋯ del plan en Hoy o en Biblioteca → Plan, vuelve a la semana 1 desde hoy, sin semana elegida ni pausas. Tus rutinas, sesiones e historial no se tocan. Al terminar un plan, Hoy lo ofrece."),
    N_("Nuevo perfil: el catálogo de ejercicios se elige en el mismo formulario. Al crearlo, Usus entra en él sin más preguntas y avisa de que ya estás en el nuevo perfil. Con una sesión en curso, pide terminarla antes.")
  ]],
  ["3.4.0", [
    N_("Descanso entre ejercicios: debajo de «Siguiente», el próximo ejercicio del catálogo con su ficha resumida plegada; al abrirla, para qué sirve y cómo se hace (con tu nota si la tiene) y un enlace a la ficha completa."),
    N_("Primer uso: «Saltar la intro» en el asistente de bienvenida. Acepta el aviso, deja el catálogo activado y va directo a la app.")
  ]],
  ["3.3.0", [
    N_("Crear plan con IA (Biblioteca → Plan y Progreso → Resumen): en 4 pasos (sobre ti, qué buscas, tu semana y para la IA) Usus prepara unas indicaciones con tus datos, cómo debe responder la IA y el enlace al catálogo, con el rango recomendado y las articulaciones de cada ejercicio. Las copias o exportas, las pegas en tu IA y su respuesta vuelve a Usus para revisarla antes de importar."),
    N_("Avisos claros: una IA no es un entrenador ni un profesional sanitario, y vas a compartir datos de salud con un servicio externo. Usus no envía nada. «Recordar mis respuestas» deja el formulario rellenado para la próxima vez."),
    N_("Al añadir un plan recibido o de la IA, si sus letras de variante ya las usan tus rutinas, se cambian por otras libres para no mezclar planes."),
    N_("Respuesta de la IA en un toque: copia su respuesta (o solo su bloque de código) y toca «Pegar respuesta de la IA». Si la guardas como archivo, Importar datos también la lleva a la revisión."),
    N_("Ventanas con un mismo diseño: título arriba con ✕ para cerrar siempre en el mismo sitio, pasos con barra de progreso y Atrás/Siguiente abajo. Al cerrar un proceso a medias, Usus avisa de si se pierde o se guarda lo hecho. En Crear plan con IA ya se puede elegir el sexo.")
  ]],
  ["3.2.0", [
    N_("Plan guiado: unas preguntas (objetivo, días, minutos, material, molestias y nivel, con un test rápido o elegido) y Usus propone rutinas del catálogo a tu nivel, con calentamiento, principal, accesorios y vuelta a la calma. Revisas la propuesta, subes o bajas cada ejercicio en su escalera y se crean las rutinas (variantes A y B) y un plan en orden."),
    N_("Fichas desde cualquier sitio: toca el nombre de un ejercicio del catálogo en la rutina, antes de iniciar o en el Diario para ver cómo se hace. Si el perfil no tiene el catálogo activado, se pide activarlo.")
  ]],
  ["3.1.0", [
    N_("Catálogo completo: 106 ejercicios nuevos (268 en total). Escaleras sin huecos, familias que tenían un solo nivel con entrada y siguiente paso, y bloques nuevos de anillas, paralelas, agarre, pino, movilidad y estiramientos, calentamiento, equilibrio y cardio."),
    N_("Cardio, nuevo tipo de movimiento en Ejercicios, y comba, nuevo material."),
    N_("Cada ficha indica su rol (principal, accesorio, movilidad, calentamiento o cardio), el rango recomendado por serie y las articulaciones que más carga. Al añadir un ejercicio del catálogo, las repeticiones o segundos salen en mitad de ese rango.")
  ]],
  ["3.0.0", [
    N_("Nueva estructura: Hoy · Biblioteca · Diario · Progreso · Ajustes. Biblioteca reúne Rutinas, Plan y Ejercicios; Stats pasa a llamarse Progreso."),
    N_("Hoy: lo que toca, arriba y con un único botón Empezar; accesos rápidos a otra rutina, sesión libre y actividad; los avisos, juntos en «Pendiente»."),
    N_("Rutinas agrupadas por variante. Cada rutina se abre en su propia pantalla (en PC, al lado de la lista) con Empezar, Editar, Imprimir, Compartir y Duplicar."),
    N_("El plan de progresión pasa de Hoy a Biblioteca → Plan, junto a las rutinas que usa."),
    N_("Hoy, más limpio: lo que toca, la semana del plan en una línea (toca para verla) y un menú ⋯ con descarga esta semana o pausar el plan 1 a 4 semanas. «Rutinas y días» se eligen dentro del propio plan."),
    N_("Planes en orden: hoy toca la siguiente sesión que falte, sea el día que sea; si empiezas un domingo o fallas un día, se recupera, y la semana del plan pasa al hacerlas todas. Tus planes pasan solos a este modo desde la semana en la que ibas, y al editarlos puedes volver a una semana anterior para recuperarla."),
    N_("Entrenando: cabecera fija con el tiempo y el avance, series más grandes y una barra abajo con la acción que toca (marcar la serie, empezar la cuenta atrás, siguiente ejercicio o terminar)."),
    N_("Progreso: el Resumen queda en cuatro tarjetas (esta semana, constancia, récords y peso), cada una con un enlace a su detalle; cifras y gráficos con un mismo estilo, y las notas del periodo pasan a Hábitos."),
    N_("Diario en filas: cada dato del día en una fila con su icono, detalle y valor (entreno primero); lo que falta, en «Añadir a este día». El peso se anota aquí."),
    N_("Ajustes en grupos, cada uno con su pantalla: Perfil, Entreno, Avisos, Apariencia e idioma, Datos y copias, y Acerca de. Interruptores para activar opciones."),
    N_("Editor de rutina más compacto en el móvil: cada ejercicio en una fila con su resumen; los detalles se abren al tocarla."),
    N_("Estilo unificado: un solo tipo de pestañas, botones con tamaños fijos y ventanas como hoja inferior en el móvil. El morado queda solo para la IA."),
    N_("Primer uso guiado en pasos: idioma y avisos, catálogo, material y cómo empezar (crear la primera rutina o importar una copia)."),
    N_("Las traducciones pasan a archivos estándar (gettext) para poder traducir la app desde el navegador."),
    N_("Arreglo: al añadir un plan recibido se conserva su regla de subida, y el plan activo anterior queda guardado en Mis planes.")
  ]],
  ["2.5.0", [
    N_("Modo diseño de rutinas: secciones (calentamiento, principal, core, vuelta a la calma o las tuyas), superseries y circuitos con vueltas y descanso entre vueltas, reordenar con ↑ ↓ o arrastrando, y duración aproximada."),
    N_("Superseries y circuitos también al entrenar: A1 → A2 → descanso entre vueltas, con la vuelta en curso a la vista y la cuenta atrás encadenada."),
    N_("Modo edición para PC o pantalla grande: al abrir el editor en un ordenador o una tablet en horizontal, cada ejercicio va en una fila, con el catálogo al lado (toca o arrastra para añadir) y Guardar siempre a la vista."),
    N_("Imprimir o guardar en PDF una rutina: una hoja por ejercicio (o dos por hoja) para seguir su progresión, u hoja de semanas con la rutina entera y 6 sesiones."),
    N_("Cuenta atrás rehecha desde cero con cinco tramos y una regla para cada uno: preparación, serie, cambio de lado (ahora ajustable), descanso entre series y entre ejercicios. Al acabar un descanso, si sigue una serie por tiempo con inicio automático, empieza sola sin otra cuenta atrás; si no, espera."),
    N_("Tres sonidos: tic en los últimos segundos de cualquier cuenta atrás, inicio y fin. La vibración respeta siempre Ajustes → Avisos."),
    N_("La pantalla se mantiene encendida durante toda la sesión, no solo en las cuentas atrás."),
    N_("RIR también en series por tiempo: cuánto más habrías aguantado (0, 5, 10, 15+ s)."),
    N_("«Ejercicio hecho» bien visible, con el descanso que viene y el botón al siguiente."),
    N_("Diario: nota de la sesión y notas de cada ejercicio editables después de terminar."),
    N_("Varios planes: el activo marca Hoy y los demás quedan guardados para activar, duplicar o borrar. Cada plan puede tener nombre.")
  ]],
  ["2.3.0", [
    N_("Notas en Stats: los días con nota llevan un punto naranja en Constancia, Carga, Peso, Sueño, Pasos y el progreso de cada ejercicio. Al tocarlo ves todo lo apuntado ese día (diario, etiquetas, notas y cambios de ejercicio, actividad, suplementos) sin salir de Stats."),
    N_("Constancia marca aparte los días con «No entrené»."),
    N_("«Notas del periodo» en todas las pestañas de Stats, y las notas de cada ejercicio en su historial."),
    N_("App Android: Ajustes → App → Actualizaciones, con la versión instalada, el enlace a las versiones y cómo recibir avisos con Obtainium."),
    N_("Nombre de ejemplo en el perfil: Cristina.")
  ]],
  ["2.2.2", [
    N_("Primera versión de la app para Android (APK), en GitHub → Releases. Es la misma app; sus datos van aparte de los de la PWA (se pasan con una copia)."),
    N_("Fichas del catálogo en català e English, y nombres de los ejercicios en català."),
    N_("Avisos de sonido más suaves."),
    N_("En Android, la versión web avisa una vez de que existe la app."),
    N_("Ajustes → App → Acerca de: «Hecha con IA · probada por humanos».")
  ]],
  ["2.2.1", [
    N_("Técnica de un ejercicio (tempo, pausa, rango, agarre…): misma ficha del catálogo, pero su historial y su progresión van aparte. Se pone en el editor de rutina; en Stats, las variantes salen juntas bajo su ejercicio."),
    N_("Al vincular un nombre como «Fondos (bajada 3 s)», lo que va entre paréntesis pasa a ser la técnica.")
  ]],
  ["2.2.0", [
    N_("Esfuerzo de la sesión (PEM, 1–10) al terminar, opcional. Con la duración da la carga semanal, nuevo bloque en Stats → Entreno con aviso si una semana sube de golpe."),
    N_("RIR por serie (repeticiones en reserva), opcional en Ajustes → Entreno."),
    N_("Cambiar un ejercicio solo en la sesión (⇄): las series cuentan para el que haces y al terminar puedes pasarlo también a la rutina."),
    N_("Nota por ejercicio (✎): la verás la próxima vez junto a «Anterior».")
  ]],
  ["2.1.0", [
    N_("Analizar con IA externa (Stats → Resumen): Usus prepara un texto con tus datos y las instrucciones para que la IA que uses (ChatGPT, Claude, Gemini…) haga un informe con gráficos, listo para imprimir en A4. Usus no envía nada."),
    N_("Datos para el análisis: edad, altura, experiencia, lesiones, molestias y objetivos, opcionales. Solo se guardan si quieres (Ajustes → Cuerpo)."),
    N_("Si la IA propone rutinas ajustadas, pega su respuesta y elige cuáles actualizar."),
    N_("Datos en CSV (Ajustes → Datos): un .zip con una tabla por tipo de dato para analizarlos en una hoja de cálculo.")
  ]],
  ["2.0.0", [
    N_("Catálogo de ejercicios opcional: cada perfil decide si lo usa. Fichas con para qué sirve, cómo se hace, errores, material y progresión. Rutinas → Ejercicios, y al añadir ejercicios a una rutina o a la sesión."),
    N_("Vincular: une los ejercicios que ya usas con el catálogo para ver su ficha y juntar su historial. Tu nombre se conserva y se puede deshacer."),
    N_("Progresión: al terminar una sesión, propuesta de subir al siguiente ejercicio o de volver al anterior. Se ajusta en Ajustes → Entreno."),
    N_("Plan: la semana ↑ puede aplicar sola la subida (+reps, +1 serie o siguiente paso), con aviso en Hoy y opción de deshacer."),
    N_("Mi material (Ajustes → Entreno) y material en tus ejercicios propios.")
  ]],
  ["1.4.0", [
    N_("Avisos durante el entreno en Ajustes → App: sonido y vibración, solo sonido, solo vibración o desactivados, con botón para probar.")
  ]],
  ["1.3.1", [
    N_("Vuelve a funcionar sin conexión: desde la 1.2.1 la app no se guardaba en el móvil para usarla offline.")
  ]],
  ["1.3.0", [
    N_("Rutinas compartidas: si recibes otra vez una rutina que ya tienes (por ejemplo, una versión mejorada), puedes actualizarla en vez de duplicarla. Se cambian los ejercicios; tu nombre, días, variante y sesiones se mantienen.")
  ]],
  ["1.2.2", [
    N_("Al cambiar de perfil te quedas en la misma pantalla (por ejemplo, Ajustes) en vez de volver a Hoy.")
  ]],
  ["1.2.1", [
    N_("Ajustes reorganizado en pestañas: Entreno, Cuerpo, App y Datos. El perfil queda arriba; para cambiar o añadir perfiles, botón «Perfiles».")
  ]],
  ["1.2.0", [
    N_("Perfiles: varias personas en el mismo móvil, cada una con sus datos, ajustes y copia de seguridad. Se cambia desde Hoy o Ajustes. Se pueden copiar rutinas de un perfil a otro."),
    N_("En perfiles de mujer, registro de la regla opcional, solo en este móvil."),
    N_("Ajustes → Acerca de: código fuente e informar de problemas o proponer mejoras en GitHub.")
  ]],
  ["1.1.0", [
    N_("Compartir: la app desde Ajustes, un entreno como imagen o texto (al terminar o desde el Diario) y tus rutinas o el programa entero con su plan, por enlace o archivo. Quien abre el enlace elige qué añadir. Nada pasa por ningún servidor."),
    N_("Tema automático por defecto: sigue el modo claro u oscuro del móvil. Puedes cambiarlo en Ajustes → Apariencia."),
    N_("Icono nuevo.")
  ]],
  ["1.0.0", [
    N_("Primera versión de Usus: rutinas, temporizadores, plan de progresión, diario, estadísticas y seguimiento opcional del ciclo (se activa en Ajustes). Todo se guarda solo en tu móvil.")
  ]]
];
const chItems = c => c.map(x => T(x));
function newsModal() {
  if (!state.newsOpen || !LS.get("wk.welcomed", false) || run || state.incoming) return "";
  const all = state.newsOpen === "all", list = all ? CHANGES : CHANGES.slice(0, 1);
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="nwT"><div class="mbox">
    ${mHead("nwT", T("Qué hay de nuevo"), "news-close", { sub: all ? T("Historial de cambios") : T("Novedades · versión {v}", { v: APP_VERSION }) })}
    ${list.map(([v, c]) => `${all ? `<h3 class="wh">${T("Versión {v}", { v })}</h3>` : ""}<ul class="nwl">${chItems(c).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}
    <div class="row" style="margin-top:14px">${all ? "" : `<button class="btn" style="flex:1" data-act="news-all">${T("Ver historial")}</button>`}<button class="btn primary" style="flex:1" data-act="news-close">${T("Entendido")}</button></div>
  </div></div>`;
}
/* Primer uso: asistente en pasos (idioma y avisos → catálogo → mi material → cómo empezar).
   state.wiz = paso actual. El material solo se pregunta con el catálogo activado. */
const wizSteps = () => ["hola", "cat", ...(catOn() ? ["mat"] : []), "empezar"];
function welcomeModal() {
  if (LS.get("wk.welcomed", false)) return "";
  const steps = wizSteps(), i = Math.min(state.wiz || 0, steps.length - 1), st = steps[i];
  const dots = `<div class="wzdots" aria-hidden="true">${steps.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>`;
  const skip = st === "empezar" ? "" : `<button class="wzskip" data-act="wiz-skip">${st === "hola" ? T("Aceptar y saltar la intro") : T("Saltar la intro")}</button>`;
  const step = `<div class="wzhead"><p class="muted wzn">${T("Paso {n} de {t}", { n: i + 1, t: steps.length })}</p>${skip}</div>`;
  const back = i ? `<button class="btn" data-act="wiz-back">${T("Atrás")}</button>` : "";
  const next = (txt = T("Siguiente")) => `<div class="row wzbar">${back}<span class="spacer"></span><button class="btn primary" data-act="wiz-next">${txt}</button></div>`;
  let body = "";
  if (st === "hola") body = `
    <div class="langrow"><span aria-hidden="true">🌐</span><select id="langSel" aria-label="${T("Idioma")}">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" lang="${k}" ${LANG === k ? "selected" : ""}>${v.name}</option>`).join("")}</select></div>
    <h2 id="wlT" style="margin:0 0 6px">${T("Bienvenido a Usus")}</h2>
    <p class="muted" style="margin:0">${T("Antes de empezar:")}</p>
    <ul class="muted" style="padding-left:18px;margin:8px 0 0;line-height:1.5">
      <li>${T("Esta app es una herramienta de registro, no un consejo médico ni un plan de entrenamiento. Consulta con un profesional antes de empezar o cambiar tu actividad física.")}</li>
      <li>${T("Tus datos se guardan solo en este dispositivo. Haz copias desde Ajustes: si borras el navegador o desinstalas la app, se pierden.")}</li>
      <li>${T("Se ofrece tal cual, sin garantías de ningún tipo. La usas bajo tu responsabilidad.")}</li>
    </ul>${next(T("Entendido, empezar"))}`;
  else if (st === "cat") { const c = LS.get("wk.catalog", null); body = `
    <h2 id="wlT" style="margin:0 0 6px">${T("Catálogo de ejercicios")}</h2>
    <p class="muted" style="margin:0">${T("Usus incluye un catálogo opcional de {n} ejercicios de calistenia, cada uno con su ficha: para qué sirve, cómo se hace, errores típicos, material y progresión.", { n: CAT?.exercises.length || 162 })}</p>
    <div class="copt">
      <button data-act="wiz-cat-yes" class="${c === true ? "on" : ""}" aria-pressed="${c === true}"><b>${T("Sí, dame toda la info")}</b><small>${T("Para elegir ejercicios al crear rutinas y saber cómo avanzar.")}</small></button>
      <button data-act="wiz-cat-no" class="${c === false ? "on" : ""}" aria-pressed="${c === false}"><b>${T("No, solo mis ejercicios")}</b><small>${T("Si ya sabes lo que haces. Todo funciona igual, con menos información.")}</small></button>
    </div>
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Cada perfil decide. Se puede cambiar en Ajustes → App.")}</p>
    <div class="row wzbar">${back}</div>`; }
  else if (st === "mat") body = `
    <h2 id="wlT" style="margin:0 0 6px">${T("Mi material")}</h2>
    <p class="muted" style="margin:0">${T("Marca lo que tienes. En el catálogo, lo demás se ve en naranja y se puede ocultar. Sin nada marcado, no se filtra.")}</p>
    <div class="matsel">${MAT_SEL().map(([k, [n]]) => `<label><input type="checkbox" data-myeq="${k}" ${myEquip()?.includes(k) ? "checked" : ""}>${matIco(k)}${T(n)}</label>`).join("")}</div>
    <p class="muted" style="font-size:.8rem;margin:10px 0 0">${T("Opcional. Se puede cambiar en Ajustes → Entreno.")}</p>${next()}`;
  else body = `
    <h2 id="wlT" style="margin:0 0 6px">${T("¿Cómo quieres empezar?")}</h2>
    <div class="copt">
      <button data-act="wiz-new"><b>${T("Crear mi primera rutina")}</b><small>${T("Eliges los ejercicios, las series y los descansos.")}</small></button>
      <button data-act="wiz-imp"><b>${T("Importar una copia o rutinas")}</b><small>${T("Un archivo .json de Usus: una copia de seguridad o rutinas que te han pasado.")}</small></button>
      <button data-act="wiz-end"><b>${T("Echar un vistazo")}</b><small>${T("Ver la app primero. Las rutinas se crean en Biblioteca → Nueva rutina.")}</small></button>
    </div>
    <input type="file" id="wizFile" accept="application/json,.json" hidden>
    ${isNative() ? "" : `<details class="wzmore"><summary>${T("Instalar en el móvil")}</summary>${installBlock()}</details>`}
    <details class="wzmore"><summary>${T("Apoyar el proyecto")}</summary>${donateBlock()}</details>
    <div class="row wzbar">${back}</div>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="wlT"><div class="mbox">${dots}${step}${body}</div></div>`;
}
/* El aviso de primer uso, solo el texto (Ajustes → Acerca de) */
const NOTICE = () => `<ul class="muted" style="padding-left:18px;margin:8px 0 0;line-height:1.5">
      <li>${T("Esta app es una herramienta de registro, no un consejo médico ni un plan de entrenamiento. Consulta con un profesional antes de empezar o cambiar tu actividad física.")}</li>
      <li>${T("Tus datos se guardan solo en este dispositivo. Haz copias desde Ajustes: si borras el navegador o desinstalas la app, se pierden.")}</li>
      <li>${T("Se ofrece tal cual, sin garantías de ningún tipo. La usas bajo tu responsabilidad.")}</li>
    </ul>`;
function noticeModal() {
  if (!state.notice) return "";
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ntT"><div class="mbox">${mHead("ntT", T("Aviso"), "notice-close")}${NOTICE()}
    <button class="btn primary" style="width:100%;margin-top:16px" data-act="notice-close">${T("Entendido")}</button></div></div>`;
}
function wizDone() { LS.set("wk.welcomed", true); LS.set("wk.seenVersion", APP_VERSION); state.wiz = 0; state.catAsk = false; }
