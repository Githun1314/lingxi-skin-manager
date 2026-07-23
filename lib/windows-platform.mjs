import fs from "node:fs/promises";
import path from "node:path";

export async function fileExists(file, fsApi = fs) {
  try {
    await fsApi.access(file);
    return true;
  } catch {
    return false;
  }
}

export function compareVersionNames(left, right) {
  const a = left.split(/[^0-9]+/).filter(Boolean).map(Number);
  const b = right.split(/[^0-9]+/).filter(Boolean).map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (b[index] || 0) - (a[index] || 0);
    if (difference) return difference;
  }
  return right.localeCompare(left);
}

export function windowsLingxiRoots(env = process.env) {
  const programFilesRoots = [...new Set([
    env.ProgramW6432,
    env.ProgramFiles,
    env["ProgramFiles(x86)"]
  ].filter(Boolean))];

  return [...new Set([
    ...programFilesRoots.flatMap(root => [
      path.join(root, "lingxi-desktop"),
      path.join(root, "Kingsoft", "WPS Lingxi"),
      path.join(root, "Kingsoft", "WPS 灵犀"),
      path.join(root, "Lingxi")
    ]),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Programs", "lingxi-desktop"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Programs", "Lingxi"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Lingxi"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Kingsoft", "WPS 灵犀"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Lingxi")
  ].filter(Boolean))];
}

const EXECUTABLE_NAMES = [
  "WPS 灵犀.exe",
  "WPS灵犀.exe",
  "WPS Lingxi.exe",
  "lingxi.exe",
  "lingxi-desktop.exe"
];

export function isWindowsOfficeLingxiPlugin(file) {
  if (!file) return false;
  const normalized = file.replaceAll("\\", "/").toLowerCase();
  return path.win32.basename(normalized) === "wpslingxi.exe"
    || /\/wps office(?:\/|$)/.test(normalized)
    || /\/office6(?:\/|$)/.test(normalized);
}

export async function findWindowsLingxiExecutable(env = process.env, fsApi = fs) {
  const explicit = env.LINGXI_APP_PATH;
  if (explicit && await fileExists(explicit, fsApi)) {
    if (isWindowsOfficeLingxiPlugin(explicit)) {
      throw new Error(
        "LINGXI_APP_PATH 指向的是 WPS Office 内置灵犀插件（wpslingxi.exe），不是 WPS 灵犀独立客户端。"
        + "请让 LINGXI_APP_PATH 指向“WPS 灵犀.exe”"
      );
    }
    return explicit;
  }

  for (const root of windowsLingxiRoots(env)) {
    for (const executableName of EXECUTABLE_NAMES) {
      const candidate = path.join(root, executableName);
      if (await fileExists(candidate, fsApi)) return candidate;
    }

    try {
      const entries = (await fsApi.readdir(root, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .sort((a, b) => compareVersionNames(a.name, b.name));
      for (const entry of entries) {
        for (const executableName of EXECUTABLE_NAMES) {
          const candidate = path.join(root, entry.name, executableName);
          if (await fileExists(candidate, fsApi)) return candidate;
        }
      }
    } catch {}
  }

  throw new Error(
    "未找到 WPS 灵犀独立客户端。请先安装 Windows 版灵犀，"
    + "或设置 LINGXI_APP_PATH 指向“WPS 灵犀.exe”"
  );
}
