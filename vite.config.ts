/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "^/api/v1/users/[^/]+/cart": {
        target: "http://localhost:8085",
        changeOrigin: true,
      },
      "^/api/v1/carts": {
        target: "http://localhost:8085",
        changeOrigin: true,
      },
      "^/api/v1/projects": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "^/api/v1/project-categories": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "^/api/v1/rewards": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
