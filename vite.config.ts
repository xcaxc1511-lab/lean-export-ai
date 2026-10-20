// @leadconnector/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only, jsxSource fallback + tailwind config), @tanstack/devtools-vite source injection (data-tsd-source, dev-only),
//     HMR gate/flush, dev-server bridge controls, server diagnostics, lightningcss, and sandbox detection
//     (secure host allowlist, port/strictPort, watch ignores, and HMR overlay policy).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@leadconnector/vite-tanstack-config";

/**
 * Static export for GitHub Pages. Only active when GITHUB_PAGES_BASE is set
 * (e.g. "/lean-export-ai"), so dev, AI Studio and the default SSR build are unchanged.
 */
const pagesBase = process.env.GITHUB_PAGES_BASE?.replace(/\/+$/, "");

export default defineConfig({
  // Browser errors stay in the trusted parent-frame console-log flow;
  // do not expose the bridge collector on the public sandbox tunnel.
  devServerBridge: { errorCollector: false },
  ...(pagesBase !== undefined && { vite: { base: `${pagesBase}/` } }),
  // Do not set server.hmr.timeout — Vite 8 deprecated those websocket fields
  // (use server.ws.*). Overlay/host/port are package-owned; default WS timeout is 30s.
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: {
    allowedHosts: true, entry: "server" },
    ...(pagesBase !== undefined && {
      router: { basepath: pagesBase || "/" },
      prerender: { enabled: true, crawlLinks: true, failOnError: true },
    }),
  },
});
