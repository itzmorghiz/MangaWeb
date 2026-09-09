import { build } from "vite";
import { resolve, dirname, relative } from "node:path";
import { globSync, mkdirSync, copyFileSync, existsSync } from "node:fs";

// Find all index.html files inside src/
const htmlFiles = globSync("src/**/index.html");

async function buildAllSingleFiles() {
    let isFirst = true;

    for (const file of htmlFiles) {
        const absolutePath = resolve(import.meta.dirname, file);

        // Determine output filename:
        // "src/index.html" -> "index.html"
        // "src/manga/index.html" -> "manga.html"
        const relativePath = relative("src", file);
        const outputName = relativePath === "index.html"
            ? "index.html"
            : `${dirname(relativePath).replace(/[\\/]/g, "_")}.html`;

        console.log(`\n📦 Building single-file output for: ${file} -> dist/${outputName}`);

        await build({
            build: {
                emptyOutDir: isFirst, // Wipe dist/ only on the first pass
                rollupOptions: {
                    input: absolutePath,
                    output: {
                        entryFileNames: outputName,
                    },
                },
            },
        });

        isFirst = false;
    }

    console.log("\n✅ All single-file pages built successfully!");
}

buildAllSingleFiles().catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
});