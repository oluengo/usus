# Privacy

*Last updated: 4 November 2026*

Usus collects no data. There are no Usus accounts, servers, analytics, ads or trackers.

- **Where your data lives.** Routines, sessions, diary, weight, cycle, supplements, notes and anything you enter in “About you” are stored only in the app's storage on your phone (PWA: the browser's; APK: the app's). Nobody else can access it, including the developer.
- **What leaves your phone.** Only what you export: backups, CSV, shared routines or sessions and the “Analyse with external AI” text. You choose where it goes. If you paste it into an AI service, that service's policy applies, not Usus's.
- **Nostr (optional).** If you connect your Nostr account with a bunker (NIP-46), Usus never sees or stores your private key; it only keeps that connection's key and your public key. The Nostr backup is encrypted (NIP-44) so only you can read it, although relays store that it exists, its size and its date. What you publish (notes, images uploaded to Blossom) is public and stays on third-party relays and servers: Usus cannot delete it. Without connecting Nostr, Usus connects to nothing.
- **Connections.** The PWA only downloads its own files from [oluengo.github.io](https://oluengo.github.io/usus/) (GitHub Pages) to install and update; GitHub may log those visits like any website ([its policy](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)). After that it works offline. It only connects to Nostr relays and Blossom when you use Nostr.
- **APK permissions.** Vibration, for rest alerts; notifications and a foreground service, for the countdown notification during a session (nothing is sent anywhere); and Internet, used only for Nostr. Import and export use Android's file picker and share menu, with no storage permission. No Android cloud backup.
- **Deleting.** Settings → Data deletes the profile's data; uninstalling the app (or clearing the site's data in the browser) deletes everything.
- **Contact.** [GitHub issues](https://github.com/oluengo/usus/issues).
