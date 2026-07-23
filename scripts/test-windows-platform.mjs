import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  compareVersionNames,
  findWindowsLingxiExecutable,
  isWindowsOfficeLingxiPlugin,
  windowsLingxiRoots
} from "../lib/windows-platform.mjs";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "lingxi-windows-test-"));
try {
  const env = {
    LOCALAPPDATA: path.join(tempRoot, "LocalAppData"),
    ProgramFiles: path.join(tempRoot, "ProgramFiles"),
    "ProgramFiles(x86)": path.join(tempRoot, "ProgramFiles-x86")
  };

  assert.deepEqual(
    ["12.1.0.100", "12.1.0.300", "12.1.0.20"].sort(compareVersionNames),
    ["12.1.0.300", "12.1.0.100", "12.1.0.20"]
  );
  assert.equal(new Set(windowsLingxiRoots(env)).size, windowsLingxiRoots(env).length);
  assert.ok(windowsLingxiRoots(env).every(root => !root.includes("WPS Office")));
  assert.equal(isWindowsOfficeLingxiPlugin("C:\\Program Files\\Kingsoft\\WPS Office\\office6\\wpslingxi.exe"), true);
  assert.equal(isWindowsOfficeLingxiPlugin("C:\\Program Files\\Kingsoft\\WPS Lingxi\\WPS 灵犀.exe"), false);

  const officePlugin = path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Office", "12.1.0.300", "office6", "wpslingxi.exe");
  await fs.mkdir(path.dirname(officePlugin), { recursive: true });
  await fs.writeFile(officePlugin, "");
  await assert.rejects(
    findWindowsLingxiExecutable({ ...env, LINGXI_APP_PATH: officePlugin }),
    /WPS Office 内置灵犀插件/
  );

  const older = path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Lingxi", "1.2.22", "WPS 灵犀.exe");
  const newer = path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Lingxi", "1.2.23", "WPS 灵犀.exe");
  await fs.mkdir(path.dirname(older), { recursive: true });
  await fs.mkdir(path.dirname(newer), { recursive: true });
  await fs.writeFile(older, "");
  await fs.writeFile(newer, "");
  assert.equal(await findWindowsLingxiExecutable(env), newer);

  const explicit = path.join(tempRoot, "custom", "lingxi-desktop.exe");
  await fs.mkdir(path.dirname(explicit), { recursive: true });
  await fs.writeFile(explicit, "");
  assert.equal(await findWindowsLingxiExecutable({ ...env, LINGXI_APP_PATH: explicit }), explicit);

  await fs.rm(path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Lingxi"), { recursive: true, force: true });
  await assert.rejects(findWindowsLingxiExecutable(env), /独立客户端/);

  const standalone = path.join(env.LOCALAPPDATA, "Programs", "lingxi-desktop", "lingxi-desktop.exe");
  await fs.mkdir(path.dirname(standalone), { recursive: true });
  await fs.writeFile(standalone, "");
  assert.equal(await findWindowsLingxiExecutable(env), standalone);

  console.log("Windows path discovery tests passed.");
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

if (process.argv.includes("--verify-current")) {
  assert.ok(process.env.LINGXI_APP_PATH, "LINGXI_APP_PATH is required for --verify-current");
  assert.equal(
    path.resolve(await findWindowsLingxiExecutable(process.env)),
    path.resolve(process.env.LINGXI_APP_PATH)
  );
  console.log(`Current Windows installation detected: ${process.env.LINGXI_APP_PATH}`);
}
