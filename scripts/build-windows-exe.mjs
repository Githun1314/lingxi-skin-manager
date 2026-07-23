import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

if (process.platform !== "win32") {
  throw new Error("The Windows single-file executable must be built on a Windows runner.");
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 26) {
  throw new Error(`Node.js 26 or newer is required for --build-sea; current version is ${process.version}.`);
}

const root = path.resolve(import.meta.dirname, "..");
const workDir = path.join(root, "dist", "windows-sea");
const bundlePath = path.join(workDir, "server-bundle.mjs");
const configPath = path.join(workDir, "sea-config.json");
const outputPath = path.join(root, "dist", "WPS-Lingxi-Skin-Manager-Windows-x64.exe");

await fs.rm(workDir, { recursive: true, force: true });
await fs.mkdir(workDir, { recursive: true });

await build({
  entryPoints: [path.join(root, "server.mjs")],
  bundle: true,
  platform: "node",
  target: "node26",
  format: "esm",
  outfile: bundlePath,
  sourcemap: false,
  minify: false
});

async function collectAssets(directory, prefix = "") {
  const result = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const key = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(result, await collectAssets(absolute, key));
    else result[`public/${key}`] = absolute;
  }
  return result;
}

const seaConfig = {
  main: bundlePath,
  mainFormat: "module",
  output: outputPath,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false,
  execArgvExtension: "none",
  assets: await collectAssets(path.join(root, "public"))
};
await fs.writeFile(configPath, `${JSON.stringify(seaConfig, null, 2)}\n`);
execFileSync(process.execPath, ["--build-sea", configPath], { stdio: "inherit" });

// Use the Windows GUI subsystem so a command window does not remain open after
// users double-click the manager.
const executable = Buffer.from(await fs.readFile(outputPath));
const peOffset = executable.readUInt32LE(0x3c);
const optionalHeaderOffset = peOffset + 24;
const magic = executable.readUInt16LE(optionalHeaderOffset);
if (magic !== 0x20b && magic !== 0x10b) throw new Error("Unexpected Windows PE optional-header format.");
executable.writeUInt16LE(2, optionalHeaderOffset + 68);
await fs.writeFile(outputPath, executable);

const stat = await fs.stat(outputPath);
console.log(`Built ${outputPath} (${Math.round(stat.size / 1024 / 1024)} MiB)`);
