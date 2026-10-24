# Usus para Android

La app Android es **la misma PWA** empaquetada con [Capacitor](https://capacitorjs.com): `index.html`, `ejercicios.json`, iconos y fuentes. No hay otro código de la app; solo un pequeño puente (`scripts/native.js`) que en el APK:

- comparte archivos (copias, CSV, análisis) con la hoja nativa de Android;
- mantiene la pantalla encendida durante el entreno;
- hace que el botón Atrás cierre el diálogo abierto, vuelva a Hoy o minimice la app.

Un solo permiso, **vibración** (avisos del descanso). Sin permiso de Internet ni de almacenamiento: importar y exportar usan el selector de archivos y el menú de compartir de Android. Sin copia automática en la nube de Android. Los datos solo se mueven con la copia que exportas tú ([privacidad](PRIVACY.md)). Cada compilación comprueba que el APK no pide otros permisos.

> **Los datos de la PWA y del APK están separados.** Para pasar de una a otra: Ajustes → Datos → exportar copia en la PWA e importarla en el APK.

El APK va firmado. Huella SHA-256 del certificado: `28:B6:FF:4A:8F:61:F6:88:D4:B4:9D:C7:E8:B7:2D:95:D5:D9:44:45:D2:A2:30:07:1A:FA:72:B1:B2:D0:3E:C8`.

## Cómo se compila

No hace falta ordenador: lo hace GitHub Actions (`.github/workflows/android.yml`).

| Qué haces | Qué obtienes |
|---|---|
| Publicar una Release con la etiqueta `vX.Y.Z` (igual que `APP_VERSION`) desde la web | El APK se adjunta a la **Release**, con las notas de CHANGELOG.md. El AAB queda en *Artifacts* |
| Push a la rama `android`, o «Run workflow» en Actions → Android | APK y AAB en *Artifacts* de esa ejecución (pruebas) |

La versión del APK sale de `APP_VERSION`: `2.2.1` → `versionName 2.2.1`, `versionCode 20201`.

## Clave de firma (una vez)

Android solo actualiza una app si la nueva versión está firmada **con la misma clave**. Si se pierde, no se puede publicar ninguna actualización con el mismo nombre de paquete (`io.github.oluengo.usus`).

1. Crear la clave (en cualquier equipo con Java):
   ```sh
   keytool -genkeypair -v -keystore usus.jks -alias usus -keyalg RSA -keysize 4096 -validity 10000
   base64 -w0 usus.jks > usus.jks.b64
   ```
2. En GitHub → *Settings → Secrets and variables → Actions → New repository secret*:
   - `ANDROID_KEYSTORE_BASE64`: contenido de `usus.jks.b64`
   - `ANDROID_KEYSTORE_PASSWORD`: contraseña del almacén
   - `ANDROID_KEY_ALIAS`: `usus`
   - `ANDROID_KEY_PASSWORD`: contraseña de la clave (la misma si no pusiste otra)
3. Guardar `usus.jks` y las contraseñas en un sitio seguro (gestor de contraseñas + copia). **Nunca** en el repositorio.

Sin estos secretos el proceso genera un APK de depuración: se instala, pero no se puede actualizar después con la versión firmada (hay que desinstalar, y se pierden los datos si no hay copia).

## Compilar en local (opcional)

Requiere Node 22, Java 21 y el SDK de Android (Android Studio).

```sh
npm ci
npm run sync          # copia la PWA a www/ y la pasa al proyecto Android
npx cap open android  # o: cd android && ./gradlew assembleDebug
```

## Tiendas

- **GitHub Releases**: listo. Con [Obtainium](https://github.com/ImranR98/Obtainium) el móvil avisa de cada versión nueva.
- **IzzyOnDroid**: toma el APK firmado de cada Release de GitHub. La ficha (título, descripciones, icono, capturas y novedades) está en `fastlane/metadata/android/{es-ES,ca,en-US}/`.
- **F-Droid**: compila desde el código con la misma ficha. Sin dependencias de Google ni rastreadores; un solo permiso (vibración).
- **Novedades de la ficha**: al publicar una versión, `node scripts/fastlane.mjs X.Y.Z` crea `changelogs/<versionCode>.txt` (3.4.0 → 30400) desde CHANGELOG.md, en los tres idiomas.
- **Zapstore** (sobre Nostr): `zapstore.yaml` apunta a las Releases de GitHub (solo `vX.Y.Z`, sin la beta) y toma la ficha de `fastlane/`. Tras publicar una Release: `zsp publish` con `SIGN_WITH=bunker://…` (mejor un bunker NIP-46 que la nsec). `zsp publish --check` muestra qué subiría sin publicar.
- **Google Play**: el `.aab` firmado sale en *Artifacts* de cada compilación de Release. Ver «Google Play» abajo.

### Google Play

1. **Cuenta**: Play Console, cuenta personal (pago único y verificación de identidad y de un móvil Android).
2. **Firma**: en «Firma de apps de Play», subir la clave actual (opción «Usar una clave de un almacén Java», con la herramienta PEPK). Así el APK de Play y el de GitHub/Zapstore/IzzyOnDroid llevan la misma firma y se actualizan entre sí. Si Google genera la suya, no.
3. **Ficha**: textos de `fastlane/metadata/android/` (Play admite poco HTML: quitar `<ul><li>`), icono 512×512, imagen destacada 1024×500 y capturas de `en-US/images/`.
4. **Formularios**:
   - Privacidad: `https://github.com/oluengo/usus/blob/main/PRIVACY.md`.
   - Seguridad de los datos: no recoge ni comparte datos; nada sale del dispositivo; no hay cuenta.
   - Apps de salud: declarar el registro de la regla (opcional, por perfil) y que no es un dispositivo médico.
   - Clasificación de contenido: cuestionario (sin contenido sensible). Público: mayores de edad o 13+; no dirigida a menores.
   - Anuncios: no. Acceso a la app: todo sin inicio de sesión.
5. **Prueba cerrada** (cuentas personales nuevas): 12 personas con la prueba activa 14 días seguidos. Después, pedir acceso a producción.
6. **Cada versión**: subir el `.aab` de la Release y las novedades de `changelogs/<versionCode>.txt`.

---

## English

The Android app is the **same PWA** packaged with Capacitor, plus a small bridge (`scripts/native.js`) for native file sharing, keeping the screen on while training and the Back button. GitHub Actions builds it: tag `vX.Y.Z` (matching `APP_VERSION`) or a Release published on the web → APK attached with notes from CHANGELOG.md; push to `android` or a manual run → APK and AAB in *Artifacts*. Only one permission (vibration); no Internet or storage permission. Signing uses the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` (see the `keytool` commands above). Keep the key safe: without it, no updates can be published. PWA and APK data are separate; move them with an exported backup. Signing certificate SHA-256: `28:B6:FF:4A:8F:61:F6:88:D4:B4:9D:C7:E8:B7:2D:95:D5:D9:44:45:D2:A2:30:07:1A:FA:72:B1:B2:D0:3E:C8`.

## Versión de pruebas (beta)

Lo nuevo se prueba primero en la rama `beta`, sin tocar la versión principal (`main`):

- **Web beta:** https://oluengo.github.io/usus/beta/ — guarda sus datos aparte de la web principal (para probar con tus datos, importa una copia de seguridad).
- **App «Usus Beta»:** se instala junto a la Usus normal (otra app, `io.github.oluengo.usus.beta`, con sus propios datos). Cada push a `beta` publica la pre-release **Usus Beta** en Releases (versión `X.Y.Z-beta.N`). En Obtainium se puede añadir aparte activando «incluir pre-releases».
- Cuando la beta está bien, se pasa a `main` y se publica la versión normal.
