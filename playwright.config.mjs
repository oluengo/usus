// Pruebas de la app (Playwright). Uso: npm test
import { defineConfig, devices } from "@playwright/test";
const exe = process.env.PW_CHROMIUM;   // en el entorno local de desarrollo, ruta a un Chromium ya instalado
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: "http://localhost:4321/", locale: "es-ES", ...(exe ? { launchOptions: { executablePath: exe } } : {}) },
  projects: [{ name: "movil", use: { ...devices["Pixel 7"], ...(exe ? { launchOptions: { executablePath: exe } } : {}) } }],
  webServer: { command: "node scripts/i18n.mjs build && node tests/serve.mjs 4321", url: "http://localhost:4321/", reuseExistingServer: !process.env.CI }
});
