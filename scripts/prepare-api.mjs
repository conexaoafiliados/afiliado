import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleRoot = path.join(root, "api", "_bundle");

function copyDir(name) {
  const src = path.join(root, name);
  const dest = path.join(bundleRoot, name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

fs.rmSync(bundleRoot, { recursive: true, force: true });
fs.mkdirSync(bundleRoot, { recursive: true });
copyDir("server");
copyDir("drizzle");
console.log("[prepare-api] Copied server/ and drizzle/ to api/_bundle/");
