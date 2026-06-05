import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [path.join(root, "api/trpc/handler.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: path.join(root, "api/trpc-handler.cjs"),
  logLevel: "info",
  external: [
    "postgres",
    "drizzle-orm",
    "drizzle-orm/*",
    "@supabase/supabase-js",
    "jose",
    "stripe",
    "@vercel/node",
  ],
});

console.log("[build-trpc-api] api/trpc-handler.cjs gerado");
