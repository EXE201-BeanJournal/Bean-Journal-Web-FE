import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig(({ mode, command }) => {
  // Load all environment variables, including VITE_ prefixes
  const env = loadEnv(mode, process.cwd(), "");

  // Plugin to replace %VITE_*% placeholders in index.html
  const htmlTransformPlugin = {
    name: "html-transform",
    transformIndexHtml(html: string) {
      return html.replace(/%VITE_(.*?)%/g, (_match, key) => {
        return env[`VITE_${key}`] || "";
      });
    },
  };

  return {
    plugins: [htmlTransformPlugin, react(), TanStackRouterVite()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      hmr: {
        host: "localhost",
        protocol: "ws",
      },
      watch: {
        usePolling: true,
      },
      cors: true,
      allowedHosts: [
        "ace8-2405-4802-8150-44e0-871-cf8a-d77a-57d1.ngrok-free.app",
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["@tanstack/react-router"],
          },
        },
      },
      // Ensure smaller bundles and modern output
      target: "esnext",
      sourcemap: command === "serve",
    },
    define: {
      // Expose environment variables to client code
      __APP_TITLE__: JSON.stringify(env.VITE_PAGE_TITLE),
      __APP_DESC__: JSON.stringify(env.VITE_PAGE_DESCRIPTION),
      __CANONICAL_URL__: JSON.stringify(env.VITE_CANONICAL_URL),
    },
    // Add security headers in dev for preview
    ...(command === "serve" && {
      server: {
        headers: {
          "X-Robots-Tag": "index, follow",
        },
      },
    }),
  };
});
