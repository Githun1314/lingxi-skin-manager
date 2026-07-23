import fs from "node:fs/promises";
import path from "node:path";

const executablePath = process.argv[2];
if (!executablePath) throw new Error("Usage: node set-windows-gui-subsystem.mjs <application.exe>");

const resolved = path.resolve(executablePath);
const executable = Buffer.from(await fs.readFile(resolved));
const peOffset = executable.readUInt32LE(0x3c);
const optionalHeaderOffset = peOffset + 24;
const magic = executable.readUInt16LE(optionalHeaderOffset);
if (magic !== 0x20b && magic !== 0x10b) {
  throw new Error("Unexpected Windows PE optional-header format.");
}

executable.writeUInt16LE(2, optionalHeaderOffset + 68);
await fs.writeFile(resolved, executable);
console.log(`Enabled the Windows GUI subsystem: ${resolved}`);
