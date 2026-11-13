# Usus for Android

The Android app is **the same PWA** packaged with [Capacitor](https://capacitorjs.com): `index.html`, `ejercicios.json`, icons and fonts. There is no other app code; only a small bridge (`scripts/native.js`) that, in the APK:

- shares files (backups, CSV, analysis) through Android's native share sheet;
- keeps the screen on while training;
- makes the Back button close the open dialog, go back to Today or minimise the app.

Two permissions: **vibration** (rest alerts) and **Internet**, used only if you connect Nostr (encrypted backup and posting). No storage permission: import and export use Android's file picker and share menu. No Android cloud backup. Every build checks that the APK asks for no other permissions ([privacy](PRIVACY.md)).

> **PWA and APK data are separate.** To move from one to the other: Settings → Data → export a backup in the PWA and import it in the APK.

The APK is signed. Certificate SHA-256 fingerprint: `28:B6:FF:4A:8F:61:F6:88:D4:B4:9D:C7:E8:B7:2D:95:D5:D9:44:45:D2:A2:30:07:1A:FA:72:B1:B2:D0:3E:C8`.

## How it is built

No computer needed: GitHub Actions does it (`.github/workflows/android.yml`).

| What you do | What you get |
|---|---|
| Publish a Release tagged `vX.Y.Z` (matching `APP_VERSION`) on the web | The APK is attached to the **Release**, with the notes from CHANGELOG.md |
| Push to the `android` branch, or "Run workflow" in Actions → Android | APK in that run's *Artifacts* (testing) |

The APK version comes from `APP_VERSION`: `2.2.1` → `versionName 2.2.1`, `versionCode 20201`.

## Signing key (once)

Android only updates an app if the new version is signed **with the same key**. If it is lost, no update can be published under the same package name (`io.github.oluengo.usus`).

1. Create the key (on any machine with Java):
   ```sh
   keytool -genkeypair -v -keystore usus.jks -alias usus -keyalg RSA -keysize 4096 -validity 10000
   base64 -w0 usus.jks > usus.jks.b64
   ```
2. On GitHub → *Settings → Secrets and variables → Actions → New repository secret*:
   - `ANDROID_KEYSTORE_BASE64`: contents of `usus.jks.b64`
   - `ANDROID_KEYSTORE_PASSWORD`: keystore password
   - `ANDROID_KEY_ALIAS`: `usus`
   - `ANDROID_KEY_PASSWORD`: key password (the same one if you didn't set another)
3. Keep `usus.jks` and the passwords somewhere safe (password manager + a copy). **Never** in the repository.

Without these secrets the build produces a debug APK: it installs, but it can't be updated later with the signed version (you have to uninstall, and data is lost without a backup).

## Building locally (optional)

Requires Node 22, Java 21 and the Android SDK (Android Studio).

```sh
npm ci
npm run sync          # copies the PWA to www/ and into the Android project
npx cap open android  # or: cd android && ./gradlew assembleDebug
```

## Where it is published

- **GitHub Releases**: the APK of each version. With [Obtainium](https://github.com/ImranR98/Obtainium) your phone is notified of every new version.
- **Zapstore** (on Nostr): `zapstore.yaml` points to the GitHub Releases (only `vX.Y.Z`, not the beta) and takes the store listing from `fastlane/metadata/android/{es-ES,ca,en-US}/`. After publishing a Release: `zsp publish` with `SIGN_WITH=bunker://…` (a NIP-46 bunker is better than the nsec). `zsp publish --check` shows what would be uploaded without publishing.
- **Store listing**: when a version is published, `node scripts/fastlane.mjs X.Y.Z` creates its release notes (`changelogs/<versionCode>.txt`, 3.5.1 → 30501) from CHANGELOG.md. The 4 screenshots (Today, training, countdown and progress), with made-up data and in all three languages: `node scripts/capturas.mjs`.

## Test version (beta)

New things are tested first on the `beta` branch, without touching the main version (`main`):

- **Web beta:** https://oluengo.github.io/usus/beta/ — keeps its data separate from the main web app (to test with your data, import a backup).
- **"Usus Beta" app:** installs next to the regular Usus (a separate app, `io.github.oluengo.usus.beta`, with its own data). Every push to `beta` publishes the **Usus Beta** pre-release in Releases (version `X.Y.Z-beta.N`). In Obtainium it can be added separately with "include pre-releases" on.
- When the beta is good, it is merged into `main` and the regular version is published.
