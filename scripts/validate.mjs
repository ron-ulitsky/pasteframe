import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest.json must use Manifest V3.");
}

if (!manifest.content_scripts?.some((script) => script.matches?.includes("https://docs.google.com/document/*"))) {
  errors.push("A content script must target Google Docs documents.");
}

if (manifest.oauth2?.client_id?.startsWith("REPLACE_WITH")) {
  console.warn("Warning: Replace oauth2.client_id before publishing or testing Drive uploads.");
}

if (errors.length) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

console.log("Extension manifest looks valid.");

