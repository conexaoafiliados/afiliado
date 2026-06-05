import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [path.join(root, "api/trpc/handler.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: path.join(root, "api/trpc/bundle.mjs"),
  logLevel: "info",
});

console.log("[build-trpc-api] bundle.mjs gerado");
