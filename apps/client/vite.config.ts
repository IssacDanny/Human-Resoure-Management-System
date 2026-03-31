import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    // Add this section to fix the "Blocked request" error
    allowedHosts: ["human-resoure-management-system.onrender.com"],
  },
});
