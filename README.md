<p align="center"><img src="icon-192.png" width="96" alt="Usus"></p>

<h1 align="center">Usus</h1>

<p align="center"><b>Registro de entrenos y hábitos. Sin cuentas, sin conexión, tus datos en tu móvil.</b><br><i>Calisthenics workout &amp; habit tracker. No accounts, works offline, your data stays on your phone.</i></p>

<p align="center"><a href="https://oluengo.github.io/usus/">Web</a> · <a href="https://oluengo.github.io/usus/app/">Abrir la app</a> · <a href="https://github.com/oluengo/usus/releases/latest">Descargar para Android</a> · <a href="#english">English</a></p>

<p align="center"><img src="capturas/portada.jpg" alt="Usus: Hoy, cuenta atrás, Diario y Progreso" width="100%"></p>

**Usus** (latín: *práctica, hábito*) registra tus entrenamientos y tus hábitos. Pensada para calistenia y entrenamiento en casa; vale para cualquier rutina de series y repeticiones. Gratis, sin anuncios. En català, castellano e inglés.

## Qué hace

- **Rutinas** con series, repeticiones o tiempo, por lado, lastre, secciones, superseries y circuitos. Se imprimen o se guardan en PDF.
- **Entrenar sin mirar:** un ejercicio por pantalla y cuenta atrás a pantalla completa, con sonido o vibración.
- **Progresión:** al terminar, Usus propone pasar al siguiente ejercicio o volver al anterior. Decides tú.
- **Catálogo de ejercicios** *(opcional)*: ficha de cada uno, material y progresión.
- **Plan guiado**, o **con IA** *(opcional, externa)*: rutinas a tu nivel y un plan que rota variantes en orden, con descargas y pausas.
- **Diario** de sueño, pasos, peso, actividad y notas, y **Progreso** con constancia, récords y hábitos.
- **Perfiles** para varias personas, registro opcional del **ciclo** y temas claro, oscuro y protector.
- **Compartir** entrenos y rutinas sin servidores; copias de seguridad y CSV.
- **Nostr** *(opcional)*: copia de seguridad cifrada solo para ti y publicar entrenos y rutinas. Entras con Amber, un bunker, la extensión del navegador o tu npub.

<table><tr>
<td width="25%"><img src="capturas/03-sesion.jpg" alt="Entrenando"></td>
<td width="25%"><img src="capturas/14-cuenta-atras.jpg" alt="Cuenta atrás"></td>
<td width="25%"><img src="capturas/04-plan.jpg" alt="Plan"></td>
<td width="25%"><img src="capturas/06-progreso.jpg" alt="Progreso"></td>
</tr></table>

## Instalar

| | Cómo |
|---|---|
| **Web y PWA** (iPhone, ordenador, cualquier móvil) | Abre <https://oluengo.github.io/usus/app/> e instálala desde el navegador (Safari: Compartir → «Añadir a pantalla de inicio»; Chrome/Edge: icono de instalar). |
| **Android** | APK de la [última versión](https://github.com/oluengo/usus/releases/latest), o añade `https://github.com/oluengo/usus` en [Obtainium](https://github.com/ImranR98/Obtainium) para recibir las actualizaciones. También en Zapstore. |
| **Beta** | Web: <https://oluengo.github.io/usus/beta/>. Android: pre-release [Usus Beta](https://github.com/oluengo/usus/releases/tag/usus-beta) (en Obtainium, «incluir pre-releases»). Se instala aparte, con sus propios datos. |

Huella SHA-256 del certificado del APK: `28:B6:FF:4A:8F:61:F6:88:D4:B4:9D:C7:E8:B7:2D:95:D5:D9:44:45:D2:A2:30:07:1A:FA:72:B1:B2:D0:3E:C8`

La web y el APK guardan sus datos por separado: pásalos con una copia (Ajustes → Datos). Permisos y firma: [ANDROID.md](ANDROID.md).

## Privacidad

- Todo se guarda **solo en tu dispositivo**. No hay cuentas, servidor, analítica, publicidad ni rastreadores.
- Solo sale lo que tú exportas o compartes. Sin Nostr, Usus no se conecta a nada.
- Con Nostr, la copia va cifrada para que solo tú puedas leerla, y Usus nunca ve tu clave privada.

Detalles: [PRIVACY.md](PRIVACY.md).

## Desarrollo

Una sola página (`index.html`, generada desde `src/`) que funciona como PWA y, empaquetada con Capacitor, como APK.

- Código: [src/README.md](src/README.md) · Traducciones: [i18n/README.md](i18n/README.md) · Android: [ANDROID.md](ANDROID.md)

## Apoya el proyecto

Si Usus te resulta útil:

- **Lightning / zaps:** `oluengo@rizful.com`
- **Bitcoin:** `bc1pnvdct6hfnh67p7dcg2e5mdveyz8jlxuzv4yflkxqccc72qkuc8ls8raspa`
- **Nostr:** [npub1vuf2g6s0mcjr34lhkg2vvtj4x65w29xn28nznw9fhcqcpyr4zc9q6myguj](https://njump.me/npub1vuf2g6s0mcjr34lhkg2vvtj4x65w29xn28nznw9fhcqcpyr4zc9q6myguj)

---

[Novedades](CHANGELOG.md) · [Informar de un problema](https://github.com/oluengo/usus/issues) · [Licencia MIT](LICENSE)

<sub>Herramienta de registro, no consejo médico. Hecha con IA · probada por humanos.</sub>

---

<h2 id="english">English</h2>

**Usus** (Latin: *practice, habit*) logs your workouts and habits. Built for calisthenics and home training; it works for any routine of sets and reps. Free, no ads. In Catalan, Spanish and English.

**[Website](https://oluengo.github.io/usus/)** · **[Open the app](https://oluengo.github.io/usus/app/)** · **[Download for Android](https://github.com/oluengo/usus/releases/latest)**

### What it does

- **Routines** with sets, reps or time, per side, added weight, sections, supersets and circuits. Print them or save them as PDF.
- **Train hands-free:** one exercise per screen and a full-screen countdown with sound or vibration.
- **Progression:** after a session, Usus suggests moving to the next exercise or back to the previous one. You decide.
- **Exercise catalogue** *(optional)*: a card for each one, equipment and progression.
- **Guided plan**, or **with AI** *(optional, external)*: routines at your level and a plan that rotates variants in order, with deloads and pauses.
- **Diary** for sleep, steps, weight, activity and notes, and **Progress** with consistency, PRs and habits.
- **Profiles** for several people, optional **cycle** tracking and light, dark and protector themes.
- **Share** workouts and routines with no servers; backups and CSV.
- **Nostr** *(optional)*: a backup encrypted only for you and posting workouts and routines. Sign in with Amber, a bunker, a browser extension or your npub.

### Install

| | How |
|---|---|
| **Web and PWA** (iPhone, computer, any phone) | Open <https://oluengo.github.io/usus/app/> and install it from the browser (Safari: Share → “Add to Home Screen”; Chrome/Edge: install icon). |
| **Android** | The APK from the [latest release](https://github.com/oluengo/usus/releases/latest), or add `https://github.com/oluengo/usus` to [Obtainium](https://github.com/ImranR98/Obtainium) to get updates. Also on Zapstore. |
| **Beta** | Web: <https://oluengo.github.io/usus/beta/>. Android: the [Usus Beta](https://github.com/oluengo/usus/releases/tag/usus-beta) pre-release (in Obtainium, “include pre-releases”). Installs separately, with its own data. |

APK certificate SHA-256 fingerprint: `28:B6:FF:4A:8F:61:F6:88:D4:B4:9D:C7:E8:B7:2D:95:D5:D9:44:45:D2:A2:30:07:1A:FA:72:B1:B2:D0:3E:C8`

The web app and the APK keep separate data: move it with a backup (Settings → Data). Permissions and signing: [ANDROID.md](ANDROID.md#english).

### Privacy

- Everything is stored **only on your device**. No accounts, servers, analytics, ads or trackers.
- Only what you export or share leaves. Without Nostr, Usus connects to nothing.
- With Nostr, the backup is encrypted so only you can read it, and Usus never sees your private key.

Details: [PRIVACY.md](PRIVACY.md#english).

### Development

A single page (`index.html`, built from `src/`) that runs as a PWA and, packaged with Capacitor, as an APK.

- Code: [src/README.md](src/README.md) · Translations: [i18n/README.md](i18n/README.md) · Android: [ANDROID.md](ANDROID.md#english)

### Support the project

If you find Usus useful:

- **Lightning / zaps:** `oluengo@rizful.com`
- **Bitcoin:** `bc1pnvdct6hfnh67p7dcg2e5mdveyz8jlxuzv4yflkxqccc72qkuc8ls8raspa`
- **Nostr:** [npub1vuf2g6s0mcjr34lhkg2vvtj4x65w29xn28nznw9fhcqcpyr4zc9q6myguj](https://njump.me/npub1vuf2g6s0mcjr34lhkg2vvtj4x65w29xn28nznw9fhcqcpyr4zc9q6myguj)

---

[Changelog](CHANGELOG.md#english) · [Report a problem](https://github.com/oluengo/usus/issues) · [MIT License](LICENSE)

<sub>A logging tool, not medical advice. Built with AI · tested by humans. Screenshots in Spanish.</sub>
