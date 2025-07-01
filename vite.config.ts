import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
	const env = loadEnv(mode, process.cwd(), '');

	return {
	plugins: [react(), TanStackRouterVite()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: true,
		hmr: {
			host: 'localhost',
			protocol: 'ws',
		},
		watch: {
			usePolling: true,
		},
		cors: true,
		// Allow access from ngrok
		allowedHosts: ['ace8-2405-4802-8150-44e0-871-cf8a-d77a-57d1.ngrok-free.app'],
		proxy: {
			'/api/resend': {
				target: 'https://api.resend.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/resend/, ''),
				headers: {
					'Authorization': `Bearer ${env.VITE_RESEND_API_KEY}`,
					'Content-Type': 'application/json'
				}
			}
		}
	}
	};
});
