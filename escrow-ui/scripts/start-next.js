const { spawn } = require("node:child_process");

const port = process.env.PORT || "8080";
const host = "0.0.0.0";

console.log(`Starting Next.js on http://${host}:${port}`);

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "start", "-p", port, "-H", host], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
