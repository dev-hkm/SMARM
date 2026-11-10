import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicRedirects = path.join(rootDir, "public", "_redirects");
const distDir = path.join(rootDir, "dist");
const distRedirects = path.join(distDir, "_redirects");
const uploadDir = path.join(rootDir, "cf-pages-upload");

await mkdir(distDir, { recursive: true });
await copyFile(publicRedirects, distRedirects);

await rm(uploadDir, { recursive: true, force: true });
await cp(distDir, uploadDir, { recursive: true });
