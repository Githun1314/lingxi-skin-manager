import assert from "node:assert/strict";
import path from "node:path";
import {
  compareVersionNames,
  findExecutableUnderRoot,
  findWindowsLingxiExecutable,
  isWindowsOfficeLingxiPlugin,
  windowsLingxiRoots
} from "../lib/windows-platform.mjs";

assert(compareVersionNames("1.10.0", "1.9.9") < 0);
assert(isWindowsOfficeLingxiPlugin("C:\\Users\\me\\AppData\\Local\\Kingsoft\\WPS Office\\office6\\wpslingxi.exe"));
assert(!isWindowsOfficeLingxiPlugin("C:\\Program Files\\lingxi-desktop\\WPS 灵犀.exe"));

const env = {
  ProgramFiles: "C:\\Program Files",
  LOCALAPPDATA: "C:\\Users\\me\\AppData\\Local"
};
assert(windowsLingxiRoots(env).includes(path.win32.join(env.ProgramFiles, "lingxi-desktop")));
assert(windowsLingxiRoots(env).includes(path.win32.join(env.LOCALAPPDATA, "lingxi-desktop")));

const expected = path.win32.join(env.ProgramFiles, "lingxi-desktop", "WPS 灵犀.exe");
const fsApi = {
  async access(file) {
    if (file !== expected) throw new Error("missing");
  },
  async readdir() {
    throw new Error("missing");
  }
};
assert.equal(await findWindowsLingxiExecutable(env, fsApi), expected);

const nestedRoot = path.win32.join(env.LOCALAPPDATA, "Programs", "lingxi-desktop");
const nestedExpected = path.win32.join(nestedRoot, "app-1.2.22", "client", "WPS 灵犀.exe");
const directories = new Map([
  [nestedRoot, ["app-1.2.22"]],
  [path.win32.join(nestedRoot, "app-1.2.22"), ["client"]],
  [path.win32.join(nestedRoot, "app-1.2.22", "client"), []]
]);
const nestedFsApi = {
  async access(file) {
    if (file !== nestedExpected) throw new Error("missing");
  },
  async readdir(directory) {
    if (!directories.has(directory)) throw new Error("missing");
    return directories.get(directory).map(name => ({ name, isDirectory: () => true }));
  }
};
assert.equal(await findExecutableUnderRoot(nestedRoot, nestedFsApi), nestedExpected);

const customExpected = "D:\\Apps\\WPS Lingxi\\WPS Lingxi.exe";
const customFsApi = {
  async access(file) {
    if (file !== customExpected) throw new Error("missing");
  },
  async readdir() {
    throw new Error("missing");
  }
};
assert.equal(
  await findWindowsLingxiExecutable(env, customFsApi, { candidateFiles: [customExpected] }),
  customExpected
);

const installerPath = "D:\\Downloads\\lingxi-desktop-1.2.22-setup.exe";
await assert.rejects(
  findWindowsLingxiExecutable(
    env,
    {
      access: async file => {
        if (file !== installerPath) throw new Error("missing");
      },
      readdir: async () => { throw new Error("missing"); }
    },
    { candidateFiles: [installerPath] }
  ),
  /未找到灵犀独立客户端/
);

await assert.rejects(
  findWindowsLingxiExecutable(
    env,
    { access: async () => { throw new Error("missing"); }, readdir: async () => { throw new Error("missing"); } },
    { candidateFiles: ["C:\\Program Files\\Kingsoft\\WPS Office\\office6\\wpslingxi.exe"] }
  ),
  /WPS Office 内置灵犀插件/
);

console.log("Windows platform tests passed.");
