import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import process from "node:process";
import { resolve, relative, sep, dirname } from "node:path";
import { globSync, readFileSync } from "node:fs";

const host = process.env.TAURI_DEV_HOST;

const pageInputs = Object.fromEntries(
  globSync("src/**/index.html").map((file) => {
    const key = file.replace(/^src\//, "").replace(/\/index\.html$/, "");
    return [key, resolve(import.meta.dirname, file)];
  })
);

const srcRoot = resolve(import.meta.dirname, "src");
const criticalCssPath = resolve(srcRoot, "styles/global.css");
const criticalCssEntryName = "__critical-css";

function inlineCriticalCss(): Plugin {
  let devServer: ViteDevServer | undefined;
  let builtCssContent = "";

  return {
    name: "inline-critical-css",

    configureServer(server) {
      devServer = server;
    },

    generateBundle: {
      order: "pre",
      handler(_, bundle) {
        const entry = Object.entries(bundle).find(([fileName, chunk]) => {
          if (chunk.type !== "asset") return false;
          if (fileName.endsWith(".css") && fileName.includes(criticalCssEntryName)) return true;
          const names = "names" in chunk ? chunk.names : [chunk.name];
          const originalNames = "originalFileNames" in chunk ? chunk.originalFileNames : [];
          return (
            names?.some((n) => n?.endsWith("global.css")) ||
            originalNames?.some((n) => n?.endsWith("global.css"))
          );
        });

        if (!entry) {
          this.warn("[inline-critical-css] Asset CSS critico non trovato nel bundle");
          return;
        }

        const [fileName, chunk] = entry;
        builtCssContent = String((chunk as { source: string | Uint8Array }).source);
        delete bundle[fileName];
      },
    },

    transformIndexHtml: {
      order: "post",
      async handler(html, ctx) {
        let cssContent = builtCssContent;

        if (devServer) {
          try {
            cssContent = readFileSync(criticalCssPath, "utf-8");
          } catch (e) {
            console.warn(
              `[inline-critical-css] Impossibile leggere il file CSS da disco: ${criticalCssPath}`
            );
          }
        }

        // Aggiorna i percorsi relativi delle risorse all'interno del CSS (es. url(...) di immagini o font)
        // in base alla posizione del file HTML corrente (ctx.filename) rispetto al file CSS.
        if (cssContent && ctx.filename) {
          const htmlDir = dirname(ctx.filename);
          const cssDir = dirname(criticalCssPath);

          cssContent = cssContent.replace(
            /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
            (match, quote, urlPath) => {
              // Salta data URI, URL assoluti o ancore
              if (
                urlPath.startsWith("data:") ||
                urlPath.startsWith("http://") ||
                urlPath.startsWith("https://") ||
                urlPath.startsWith("//") ||
                urlPath.startsWith("#")
              ) {
                return match;
              }

              try {
                // Risolve il percorso assoluto dell'asset partendo dalla cartella del CSS
                const absoluteAssetPath = resolve(cssDir, urlPath);
                // Calcola il nuovo percorso relativo dalla cartella del file HTML corrente all'asset
                let newRelativePath = relative(htmlDir, absoluteAssetPath);

                // Normalizza i separatori per la compatibilità cross-platform
                newRelativePath = newRelativePath.split(sep).join("/");
                if (!newRelativePath.startsWith(".") && !newRelativePath.startsWith("/")) {
                  newRelativePath = "./" + newRelativePath;
                }
                return `url(${quote}${newRelativePath}${quote})`;
              } catch {
                return match;
              }
            }
          );
        }

        return html.replace("<head>", `<head>\n    <style>${cssContent}</style>`);
      },
    },
  };
}

export default defineConfig(() => ({
  plugins: [inlineCriticalCss()],
  root: "src",

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "src/index.html"),
        [criticalCssEntryName]: criticalCssPath,
        ...pageInputs,
      },
    },
  },

  base: "./",
  publicDir: "../public",
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  resolve: {
    alias: {
      "@global": resolve(import.meta.dirname, "src/scripts/global/global.ts"),
    },
  },

  optimizeDeps: {
    include: ["@tauri-apps/plugin-http"],
  },
}));