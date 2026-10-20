// Copia la PWA a www/ para empaquetarla. Sin service worker: dentro de la app los archivos ya van incluidos.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
rmSync("www", { recursive: true, force: true }); mkdirSync("www");
for (const f of ["index.html", "ejercicios.json", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "favicon-48.png", "LICENSE"]) cpSync(f, `www/${f}`);
cpSync("fonts", "www/fonts", { recursive: true });
// Puente nativo (compartir archivos, botón Atrás): solo en el APK.
cpSync("scripts/native.js", "www/native.js");
const html = readFileSync("www/index.html", "utf8");
if (!html.includes("</head>")) throw new Error("index.html sin </head>");
// Beta (USUS_BETA=1): app aparte «Usus Beta»; la web lo sabe por window.USUS_BETA.
const beta = process.env.USUS_BETA === "1";
writeFileSync("www/index.html", html.replace("<head>", beta ? '<head>\n<script>window.USUS_BETA=true</script>' : "<head>").replace("</head>", '<script src="native.js"></script>\n</head>'));
const v = /const APP_VERSION = "([\d.]+)"/.exec(readFileSync("index.html", "utf8"))[1];
writeFileSync("www/version.txt", v + "\n");
console.log("www/ listo · versión", v, beta ? "(beta)" : "");
