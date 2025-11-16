import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const dest = path.join(__dirname, "..", "public", "pdf.worker.min.mjs");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("✓ PDF.js worker copied to public folder");
} else {
  console.warn("⚠ PDF.js worker file not found at:", src);
}

