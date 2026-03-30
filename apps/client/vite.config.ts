import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0 exposes the server to Render's network
    host: "0.0.0.0",
    // Uses Render's PORT env var or defaults to 5173 locally
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
  },
});
