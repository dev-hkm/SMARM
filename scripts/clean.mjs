import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

for (const relativePath of ["dist", "cf-pages-upload"]) {
  await rm(path.join(rootDir, relativePath), { recursive: true, force: true });
}
