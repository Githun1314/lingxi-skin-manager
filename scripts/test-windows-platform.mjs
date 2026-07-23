import assert from "node:assert/strict";
import path from "node:path";
import {
  compareVersionNames,
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

console.log("Windows platform tests passed.");
