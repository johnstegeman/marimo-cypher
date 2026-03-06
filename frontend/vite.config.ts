import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    target: "esnext",
    lib: {
      entry: "src/index.ts",
      // iife format bundles all dependencies and executes immediately,
      // so no bare-specifier resolution is needed in the browser.
      formats: ["iife"],
      name: "MarimoPluginCypher",
      fileName: () => "index.js",
    },
    rollupOptions: {
      // Keep @codemirror packages external so the plugin uses the same
      // instances already loaded by the marimo host, avoiding the
      // "multiple @codemirror/state instances" error.
      // Keep @codemirror and React packages external so the plugin uses the
      // same instances already loaded by the marimo host. This avoids:
      // - "multiple @codemirror/state instances" error
      // - React version mismatch (marimo uses React 19, this bundle would
      //   otherwise include React 18, causing panel rendering failures)
      external: [/^@codemirror\/.*/, "react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          "@codemirror/autocomplete": "__codemirror_autocomplete",
          "@codemirror/commands": "__codemirror_commands",
          "@codemirror/lang-sql": "__codemirror_lang_sql",
          "@codemirror/lint": "__codemirror_lint",
          "@codemirror/view": "__codemirror_view",
          "react": "__react",
          "react-dom": "__react_dom",
          "react/jsx-runtime": "__react_jsx_runtime",
        },
      },
    },
  },
  server: {
    port: 1337,
    cors: true,
  },
});
