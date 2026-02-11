import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: [path.join(__dirname, "scripts", "vitest-setup.ts")],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.join(__dirname) },
  },
});
