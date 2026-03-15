import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Treat all .js files as JSX (common in projects that don't use .jsx extension)
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.js$/,
    exclude: [],
  },
  server: {
    port: 3000,
    host: true,
    // When running behind the nginx HTTPS proxy, tell the HMR client to
    // connect back through nginx (port 443) instead of directly to port 3000.
    hmr: process.env.HMR_CLIENT_PORT
      ? { clientPort: parseInt(process.env.HMR_CLIENT_PORT) }
      : true,
    watch: {
      usePolling: true,
      interval: 300,
    }
  },
});
