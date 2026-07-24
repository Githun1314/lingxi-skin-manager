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
      path.win32.join(root, "lingxi-desktop"),
      path.win32.join(root, "Kingsoft", "WPS Lingxi"),
      path.win32.join(root, "Kingsoft", "WPS 灵犀"),
      path.win32.join(root, "Lingxi")
    ]),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "Programs", "lingxi-desktop"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "Programs", "Lingxi"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "lingxi-desktop"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "Kingsoft", "WPS Lingxi"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "Kingsoft", "WPS 灵犀"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "WPS Lingxi"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "WPS 灵犀"),
    env.LOCALAPPDATA && path.win32.join(env.LOCALAPPDATA, "Lingxi")
  ].filter(Boolean))];
}

export const WINDOWS_LINGXI_EXECUTABLE_NAMES = [
  "WPS 灵犀.exe",
  "WPS灵犀.exe",
  "WPS Lingxi.exe",
  "灵犀.exe",
  "lingxi.exe",
  "Lingxi Desktop.exe",
  "lingxi-desktop.exe"
];

export function isWindowsOfficeLingxiPlugin(file) {
  if (!file) return false;
  const normalized = file.replaceAll("\\", "/").toLowerCase();
  return path.win32.basename(normalized) === "wpslingxi.exe"
    || /\/wps office(?:\/|$)/.test(normalized)
    || /\/office6(?:\/|$)/.test(normalized);
}

function isLikelyLingxiExecutable(file) {
  if (!file || path.win32.extname(file).toLowerCase() !== ".exe") return false;
  const basename = path.win32.basename(file).toLowerCase();
  if (/(?:setup|install|unins|uninstall|update|updater|crashpad)/.test(basename)) return false;
  return WINDOWS_LINGXI_EXECUTABLE_NAMES.some(name => name.toLowerCase() === basename)
    || basename.includes("lingxi")
    || basename.includes("灵犀");
}

async function executableFromCandidate(candidate, fsApi = fs) {
  if (!candidate || !await fileExists(candidate, fsApi)) return "";
  if (isWindowsOfficeLingxiPlugin(candidate)) return "";
  if (isLikelyLingxiExecutable(candidate)) return candidate;
  return "";
}

export async function findExecutableUnderRoot(root, fsApi = fs, maxDepth = 3) {
  if (!root) return "";

  for (const executableName of WINDOWS_LINGXI_EXECUTABLE_NAMES) {
    const candidate = await executableFromCandidate(path.win32.join(root, executableName), fsApi);
    if (candidate) return candidate;
  }

  const queue = [{ directory: root, depth: 0 }];
  while (queue.length) {
    const { directory, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    let entries;
    try {
      entries = (await fsApi.readdir(directory, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .sort((a, b) => compareVersionNames(a.name, b.name));
    } catch {
      continue;
    }
    for (const entry of entries) {
      const nestedRoot = path.win32.join(directory, entry.name);
      for (const executableName of WINDOWS_LINGXI_EXECUTABLE_NAMES) {
        const candidate = await executableFromCandidate(path.win32.join(nestedRoot, executableName), fsApi);
        if (candidate) return candidate;
      }
      queue.push({ directory: nestedRoot, depth: depth + 1 });
    }
  }
  return "";
}

export async function findWindowsLingxiExecutable(env = process.env, fsApi = fs, options = {}) {
  const explicit = env.LINGXI_APP_PATH;
  if (explicit) {
    if (isWindowsOfficeLingxiPlugin(explicit)) {
      throw new Error(
        "LINGXI_APP_PATH 指向的是 WPS Office 内置灵犀插件（wpslingxi.exe），不是 WPS 灵犀独立客户端。"
        + "请改为选择灵犀独立客户端"
      );
    }
    const explicitFile = await executableFromCandidate(explicit, fsApi);
    if (explicitFile) return explicitFile;
    const explicitNested = await findExecutableUnderRoot(explicit, fsApi);
    if (explicitNested) return explicitNested;
    throw new Error("LINGXI_APP_PATH 指向的位置无效，请重新选择灵犀独立客户端");
  }

  let officePluginFound = false;
  for (const hint of options.candidateFiles || []) {
    if (isWindowsOfficeLingxiPlugin(hint)) {
      officePluginFound = true;
      continue;
    }
    const candidate = await executableFromCandidate(hint, fsApi);
    if (candidate) return candidate;
    const nested = await findExecutableUnderRoot(hint, fsApi, 2);
    if (nested) return nested;
  }

  for (const root of windowsLingxiRoots(env)) {
    const candidate = await findExecutableUnderRoot(root, fsApi);
    if (candidate) return candidate;
  }

  if (officePluginFound) {
    throw new Error(
      "检测到的是 WPS Office 内置灵犀插件，不是灵犀独立客户端。"
      + "请先安装官网桌面客户端，或点击“选择灵犀程序”指定独立客户端"
    );
  }

  throw new Error(
    "未找到灵犀独立客户端。若已安装，请点击“选择灵犀程序”并选择桌面快捷方式对应的独立客户端"
  );
}
