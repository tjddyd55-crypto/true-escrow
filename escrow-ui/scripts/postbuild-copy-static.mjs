import fs from "node:fs/promises";
import path from "node:path";

async function copyStaticAssets() {
  const source = path.join(process.cwd(), ".next", "static");
  const destination = path.join(process.cwd(), ".next", "standalone", ".next", "static");

  await fs.mkdir(path.dirname(destination), { recursive: true });

  try {
    await fs.access(source);
  } catch {
    console.warn(`[postbuild] Skip copy: source not found (${source})`);
    return;
  }

  await fs.cp(source, destination, { recursive: true, force: true });
  console.log(`[postbuild] Copied static assets to ${destination}`);
}

copyStaticAssets().catch((error) => {
  console.error("[postbuild] Failed to copy static assets:", error);
  process.exitCode = 1;
});
