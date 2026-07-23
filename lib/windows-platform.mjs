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
  return [...new Set([
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Office"),
    env.ProgramFiles && path.join(env.ProgramFiles, "Kingsoft", "WPS Office"),
    env["ProgramFiles(x86)"] && path.join(env["ProgramFiles(x86)"], "Kingsoft", "WPS Office"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Kingsoft", "WPS Lingxi"),
    env.ProgramFiles && path.join(env.ProgramFiles, "Kingsoft", "WPS Lingxi"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Programs", "Lingxi"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Programs", "lingxi-desktop"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Lingxi"),
    env.ProgramFiles && path.join(env.ProgramFiles, "Lingxi")
  ].filter(Boolean))];
}

const EXECUTABLE_NAMES = [
  path.join("office6", "wpslingxi.exe"),
  "wpslingxi.exe",
  "WPS Lingxi.exe",
  "WPS 灵犀.exe",
  "WPS灵犀.exe",
  "lingxi.exe",
  "lingxi-desktop.exe"
];

export async function findWindowsLingxiExecutable(env = process.env, fsApi = fs) {
  const explicit = env.LINGXI_APP_PATH;
  if (explicit && await fileExists(explicit, fsApi)) return explicit;

  for (const root of windowsLingxiRoots(env)) {
    for (const relative of EXECUTABLE_NAMES) {
      const candidate = path.join(root, relative);
      if (await fileExists(candidate, fsApi)) return candidate;
    }

    try {
      const entries = (await fsApi.readdir(root, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .sort((a, b) => compareVersionNames(a.name, b.name));
      for (const entry of entries) {
        for (const relative of EXECUTABLE_NAMES) {
          const candidate = path.join(root, entry.name, relative);
          if (await fileExists(candidate, fsApi)) return candidate;
        }
      }
    } catch {}
  }

  throw new Error("未找到 WPS 灵犀。请先安装 Windows 版灵犀，或设置 LINGXI_APP_PATH 指向灵犀主程序");
}
