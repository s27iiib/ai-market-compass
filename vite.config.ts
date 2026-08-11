import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(({ command }) => ({
  server: {
    port: 8080,
    strictPort: true,
    // Bind every interface so the dev server is reachable over both IPv4 and
    // IPv6 loopback, and from phones on the LAN for responsive testing.
    host: true,
  },

  resolve: {
    alias: { "@": srcDir },
    // A second copy of React (usually pulled in transitively) breaks hooks at
    // runtime; TanStack Query keeps its own module-level cache and must be
    // deduped for the same reason.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },

  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),

    tanstackStart({
      // Fail the build if client code imports server-only modules rather than
      // shipping them to the browser.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Route the bundled server entry through src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),

    // Nitro produces the production server bundle; it has no role in `vite dev`.
    ...(command === "build" ? [nitro({ preset: "node-server" })] : []),

    viteReact(),
  ],
}));
