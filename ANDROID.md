# Usus para Android

La app Android es **la misma PWA** empaquetada con [Capacitor](https://capacitorjs.com): `index.html`, `ejercicios.json`, iconos y fuentes. No hay otro código de la app; solo un pequeño puente (`scripts/native.js`) que en el APK:

- comparte archivos (copias, CSV, análisis) con la hoja nativa de Android;
- mantiene la pantalla encendida durante el entreno;
- hace que el botón Atrás cierre el diálogo abierto, vuelva a Hoy o minimice la app.

Igual que la PWA: sin permisos especiales, sin conexión a ningún servidor y sin copia automática en la nube de Android. Los datos solo se mueven con la copia que exportas tú.

> **Los datos de la PWA y del APK están separados.** Para pasar de una a otra: Ajustes → Datos → exportar copia en la PWA e importarla en el APK.

## Cómo se compila

No hace falta ordenador: lo hace GitHub Actions (`.github/workflows/android.yml`).

| Qué haces | Qué obtienes |
|---|---|
| Crear la etiqueta `vX.Y.Z` (igual que `APP_VERSION`), o publicar una Release con esa etiqueta desde la web | Una **Release** con el APK y el AAB |
| «Run workflow» en Actions → Android | APK y AAB en *Artifacts* de esa ejecución (pruebas) |

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
- **IzzyOnDroid / F-Droid**: leen las Releases o compilan desde el código; sin dependencias de Google.
- **Google Play**: usa el `.aab`; cuenta de desarrollador y, en cuentas personales nuevas, prueba cerrada previa.

---

## English

The Android app is the **same PWA** packaged with Capacitor, plus a small bridge (`scripts/native.js`) for native file sharing, keeping the screen on while training and the Back button. GitHub Actions builds it: tag `vX.Y.Z` (matching `APP_VERSION`) → GitHub Release with APK and AAB; running the workflow by hand → APK and AAB in *Artifacts*. Signing uses the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` (see the `keytool` commands above). Keep the key safe: without it, no updates can be published. PWA and APK data are separate; move them with an exported backup.
