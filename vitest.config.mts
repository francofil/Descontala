import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Variables de .env.local para los tests de integración (si existe).
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/**/*.test.ts"], environment: "node", testTimeout: 20_000 },
});
