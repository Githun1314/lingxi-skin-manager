import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { fileExists, findWindowsLingxiExecutable } from "./lib/windows-platform.mjs";

const execFileAsync = promisify(execFile);
const HOST = "127.0.0.1";
const PORT = 17363;
const DEBUG_PORT = 9229;
const PLATFORM = process.platform;
const IS_MACOS = PLATFORM === "darwin";
const IS_WINDOWS = PLATFORM === "win32";
const MAC_APP_PATH = "/Applications/WPS 灵犀.app";
const MAC_APP_EXECUTABLE = `${MAC_APP_PATH}/Contents/MacOS/WPS 灵犀`;
const PUBLIC_DIR = path.join(import.meta.dirname, "public");
const DATA_DIR = IS_WINDOWS
  ? path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Lingxi Skin Manager")
  : path.join(os.homedir(), "Library", "Application Support", "Lingxi Skin Manager");
const THEME_FILE = path.join(DATA_DIR, "theme.json");
const MAX_BODY = 8 * 1024 * 1024;
let cachedLingxiExecutable = null;

const DEFAULT_THEME = {
  name: "Claude 暖陶",
  styleId: "claude",
  primary: "#c15f3c",
  background: "#f4f0e8",
  sidebar: "#ebe4d8",
  card: "#fffdf9",
  text: "#2f2a25",
  darkPrimary: "#e28c70",
  darkBackground: "#1d1c19",
  darkSidebar: "#171614",
  darkCard: "#292824",
  darkText: "#f2eee7",
  radius: 16,
  brandImage: "",
  brandName: "灵犀",
  syncIdentityMemory: true,
  decorationImage: "",
  decorationOpacity: 0.22,
  decorationMode: "wallpaper",
  composerImage: "",
  composerDecorationEnabled: false,
  composerDecorationSource: "brand",
  composerAnchor: "right-top",
  composerScale: 0.2,
  composerOverlap: 0.32,
  backgroundScope: "content",
  backgroundFit: "cover",
  backgroundPosition: "center",
  backgroundOverlay: 0.52,
  backgroundBlur: 0,
  enabled: false
};

let currentTheme = await loadTheme();
const sessions = new Map();
let lastInjectionAt = null;
let lastError = "";
let polling = false;

function safeColor(value, fallback) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function sanitizeTheme(input = {}) {
  const safeImage = value => typeof value === "string" && /^data:image\/(png|jpeg|webp);base64,/i.test(value)
    ? value.slice(0, 7 * 1024 * 1024) : "";
  return {
    name: typeof input.name === "string" ? input.name.trim().slice(0, 30) || "我的皮肤" : "我的皮肤",
    styleId: ["claude", "chatgpt", "cj_mecha", "cj_shanhai", "cj_pixel", "cj_toy", "wps_mongoose", "wps_mongoose_crawl", "wps_sister", "wps_sister_cheer", "custom"].includes(input.styleId) ? input.styleId : "custom",
    primary: safeColor(input.primary, DEFAULT_THEME.primary),
    background: safeColor(input.background, DEFAULT_THEME.background),
    sidebar: safeColor(input.sidebar, DEFAULT_THEME.sidebar),
    card: safeColor(input.card, DEFAULT_THEME.card),
    text: safeColor(input.text, DEFAULT_THEME.text),
    darkPrimary: safeColor(input.darkPrimary, mix(safeColor(input.primary, DEFAULT_THEME.primary), "#ffffff", 0.26)),
    darkBackground: safeColor(input.darkBackground, mix(safeColor(input.background, DEFAULT_THEME.background), "#0e1116", 0.9)),
    darkSidebar: safeColor(input.darkSidebar, mix(safeColor(input.sidebar, DEFAULT_THEME.sidebar), "#10141b", 0.86)),
    darkCard: safeColor(input.darkCard, mix(safeColor(input.card, DEFAULT_THEME.card), "#1f2530", 0.82)),
    darkText: safeColor(input.darkText, mix(safeColor(input.text, DEFAULT_THEME.text), "#ffffff", 0.9)),
    radius: Math.round(clampNumber(input.radius, 6, 26, DEFAULT_THEME.radius)),
    brandImage: safeImage(input.brandImage),
    brandName: typeof input.brandName === "string" ? input.brandName.trim().slice(0, 12) || "灵犀" : "灵犀",
    syncIdentityMemory: input.syncIdentityMemory !== false,
    decorationImage: safeImage(input.decorationImage || input.image),
    decorationOpacity: clampNumber(input.decorationOpacity ?? input.imageOpacity, 0.05, 1, DEFAULT_THEME.decorationOpacity),
    decorationMode: (input.decorationMode || input.imageMode) === "mascot" ? "mascot" : "wallpaper",
    composerImage: safeImage(input.composerImage),
    composerDecorationEnabled: Boolean(input.composerDecorationEnabled),
    composerDecorationSource: ["brand", "decoration", "hanger"].includes(input.composerDecorationSource) ? input.composerDecorationSource : "brand",
    composerAnchor: ["right-top", "left-top", "right-bottom", "left-bottom", "top-center"].includes(input.composerAnchor) ? input.composerAnchor : DEFAULT_THEME.composerAnchor,
    composerScale: clampNumber(input.composerScale, 0.12, 0.34, DEFAULT_THEME.composerScale),
    composerOverlap: clampNumber(input.composerOverlap, 0.08, 0.7, DEFAULT_THEME.composerOverlap),
    backgroundScope: input.backgroundScope === "full" ? "full" : "content",
    backgroundFit: ["cover", "contain", "original", "tile"].includes(input.backgroundFit) ? input.backgroundFit : "cover",
    backgroundPosition: ["center", "top", "right", "left", "bottom"].includes(input.backgroundPosition) ? input.backgroundPosition : "center",
    backgroundOverlay: clampNumber(input.backgroundOverlay, 0.08, 0.88, DEFAULT_THEME.backgroundOverlay),
    backgroundBlur: Math.round(clampNumber(input.backgroundBlur, 0, 16, DEFAULT_THEME.backgroundBlur)),
    enabled: Boolean(input.enabled)
  };
}

async function loadTheme() {
  try {
    return sanitizeTheme(JSON.parse(await fs.readFile(THEME_FILE, "utf8")));
  } catch {
    return { ...DEFAULT_THEME };
  }
}

async function saveTheme(theme) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(THEME_FILE, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
  const match = theme.brandImage?.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/i);
  if (match) {
    const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    await fs.writeFile(path.join(DATA_DIR, `brand-logo.${extension}`), Buffer.from(match[2], "base64"));
  }
}

function brandAssetUrl(theme) {
  const match = theme.brandImage?.match(/^data:image\/(png|jpeg|webp);base64,/i);
  if (!match) return "";
  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  return pathToFileURL(path.join(DATA_DIR, `brand-logo.${extension}`)).href;
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
}

function mix(hex, target, ratio) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const channel = key => Math.round(a[key] * (1 - ratio) + b[key] * ratio).toString(16).padStart(2, "0");
  return `#${channel("r")}${channel("g")}${channel("b")}`;
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildCss(theme) {
  if (!theme.enabled) return "";
  const primaryHover = mix(theme.primary, "#ffffff", 0.16);
  const primaryPressed = mix(theme.primary, "#000000", 0.13);
  const line = mix(theme.card, theme.text, 0.15);
  const mutedText = rgba(theme.text, 0.62);
  const darkPrimaryHover = mix(theme.darkPrimary, "#ffffff", 0.14);
  const darkPrimaryPressed = mix(theme.darkPrimary, "#000000", 0.16);
  const darkLine = mix(theme.darkCard, theme.darkText, 0.2);
  const darkMutedText = rgba(theme.darkText, 0.68);
  const primaryRgb = hexToRgb(theme.primary);
  const primaryLuminance = (0.2126 * primaryRgb.r + 0.7152 * primaryRgb.g + 0.0722 * primaryRgb.b) / 255;
  const onPrimary = primaryLuminance > 0.58 ? "#111111" : "#ffffff";
  const hasWallpaper = Boolean(theme.decorationImage && theme.decorationMode === "wallpaper");
  const wallpaperSize = { cover: "cover", contain: "contain", original: "auto", tile: "360px auto" }[theme.backgroundFit];
  const wallpaperRepeat = theme.backgroundFit === "tile" ? "repeat" : "no-repeat";
  const wallpaperTarget = theme.backgroundScope === "full" ? ".root" : ".rooter__core";
  const darkWallpaperOverlay = Math.min(0.94, Math.max(0.76, theme.backgroundOverlay + 0.18));
  const wallpaperCss = hasWallpaper ? `
#app, #copilot__root { position: relative !important; z-index: 1 !important; background: transparent !important; }
${wallpaperTarget} { position: relative !important; isolation: isolate !important; overflow: hidden !important; background: transparent !important; }
${wallpaperTarget}::before {
  content: "" !important; position: absolute !important; inset: -${theme.backgroundBlur + 8}px !important;
  pointer-events: none !important;
  background-image: linear-gradient(${rgba(theme.background, theme.backgroundOverlay)}, ${rgba(theme.background, theme.backgroundOverlay)}), url("${theme.decorationImage}") !important;
  background-size: ${wallpaperSize} !important; background-position: ${theme.backgroundPosition} !important;
  background-repeat: ${wallpaperRepeat} !important; filter: blur(${theme.backgroundBlur}px) !important;
}
.rooter__main { background: ${theme.backgroundScope === "content" ? "var(--lsm-sidebar)" : "transparent"} !important; backdrop-filter: none !important; }
${theme.backgroundScope === "full" ? `.rooter__core { background: transparent !important; backdrop-filter: none !important; }` : ""}
.lingxichat.cowork-chat-app, .cowork-workbench-panel, .assistant-workbench,
.assistant-workbench__body, .workbench-workflow { background: transparent !important; }
.claw-aside { background: var(--lsm-sidebar-glass) !important; backdrop-filter: blur(12px) !important; }
` : "";
  const styleCss = {
    claude: `.claw-home h1, .claw-home h2, .markdown h1, .markdown h2 { font-family: Georgia, "Songti SC", serif !important; letter-spacing: -.015em; } .input.chat__input { border: 1px solid color-mix(in srgb,var(--lsm-text) 11%,transparent) !important; box-shadow: 0 10px 32px color-mix(in srgb,var(--lsm-text) 7%,transparent) !important; } .cowork-home-projects__card { border-color: color-mix(in srgb,var(--lsm-text) 13%,transparent) !important; }`,
    chatgpt: `.claw-home, .rooter__core { letter-spacing: -.005em; } button { box-shadow: none !important; } .input.chat__input { border: 1px solid color-mix(in srgb,var(--lsm-text) 10%,transparent) !important; border-radius: 24px !important; box-shadow: 0 4px 22px color-mix(in srgb,var(--lsm-text) 6%,transparent) !important; } .claw-aside { border-right: 1px solid color-mix(in srgb,var(--lsm-text) 8%,transparent) !important; }`,
    cj_mecha: `.claw-aside__mac-logo { filter: drop-shadow(0 4px 10px ${rgba(theme.primary,.3)}); } button, [role="button"] { border-width: 1px !important; } .mock, [class*="status-dot"] { box-shadow: 0 0 12px ${rgba(theme.primary,.28)} !important; }`,
    cj_shanhai: `.claw-home h1, .claw-home h2, .markdown h1, .markdown h2 { font-family: "Songti SC", STSong, Georgia, serif !important; } .claw-aside__mac-logo { border-radius: 50% !important; }`,
    cj_pixel: `html, body, button, input, textarea { font-family: Menlo, Monaco, "PingFang SC", monospace !important; } img { image-rendering: pixelated; } button, [role="button"], [class*="card"] { border-radius: 5px !important; box-shadow: 3px 3px 0 ${rgba(theme.text,.13)} !important; }`,
    cj_toy: `button, [role="button"], [class*="card"], [class*="dialog"] { border-radius: ${Math.max(18,theme.radius)}px !important; } .claw-aside__mac-logo { filter: drop-shadow(0 5px 9px ${rgba(theme.primary,.2)}); }`,
    wps_mongoose: `.claw-home h1, .claw-home h2 { letter-spacing: -.02em; }`,
    wps_mongoose_crawl: `.claw-home h1, .claw-home h2 { letter-spacing: -.02em; }`,
    wps_sister: `.cowork-home-projects__grid { gap: 14px !important; }`,
    wps_sister_cheer: `.cowork-home-projects__grid { gap: 14px !important; }`,
    custom: ""
  }[theme.styleId] || "";

  return `
:root, html, html[theme-mode="light"] {
  --lsm-primary: ${theme.primary};
  --lsm-background: ${theme.background};
  --lsm-sidebar: ${theme.sidebar};
  --lsm-card: ${theme.card};
  --lsm-text: ${theme.text};
  --lsm-on-primary: ${onPrimary};
  --lsm-sidebar-glass: ${rgba(theme.sidebar, Math.min(0.94, theme.backgroundOverlay + 0.34))};
  --kd-color-brand-normal: ${theme.primary} !important;
  --kd-color-brand-hover: ${primaryHover} !important;
  --kd-color-brand-pressed: ${primaryPressed} !important;
  --kd-color-brand-light: ${rgba(theme.primary, 0.12)} !important;
  --kd-color-brand-disable: ${rgba(theme.primary, 0.38)} !important;
  --kd-color-primary: ${theme.primary} !important;
  --kd-color-icon-brand: ${theme.primary} !important;
  --kd-color-line-brand: ${theme.primary} !important;
  --kd-color-link: ${theme.primary} !important;
  --kd-color-background-bottom: ${theme.background} !important;
  --kd-color-background-group: ${theme.background} !important;
  --kd-color-background-base: ${theme.sidebar} !important;
  --kd-color-background-aside: ${theme.sidebar} !important;
  --kd-color-background-frame: ${mix(theme.sidebar, theme.text, 0.07)} !important;
  --kd-color-background-plate: ${theme.card} !important;
  --kd-color-background-top: ${theme.card} !important;
  --kd-color-background-middle: ${theme.card} !important;
  --kd-color-fill-base: ${theme.card} !important;
  --kd-color-fill-light: ${mix(theme.card, theme.background, 0.45)} !important;
  --kd-color-fill-regular: ${mix(theme.card, theme.text, 0.08)} !important;
  --kd-color-fill-medium: ${mix(theme.card, theme.text, 0.12)} !important;
  --kd-color-line-light: ${rgba(line, 0.52)} !important;
  --kd-color-line-regular: ${line} !important;
  --kd-color-text-primary: ${rgba(theme.text, 0.94)} !important;
  --kd-color-text-secondary: ${mutedText} !important;
  --kd-color-text-tertiary: ${rgba(theme.text, 0.48)} !important;
  --kd-color-icon-primary: ${rgba(theme.text, 0.86)} !important;
  --kd-color-icon-secondary: ${mutedText} !important;
  --kd-border-radius-middle: ${theme.radius}px !important;
  --kd-border-radius-large: ${theme.radius + 4}px !important;
}
html[theme-mode="dark"] {
  --lsm-primary: ${theme.darkPrimary};
  --lsm-background: ${theme.darkBackground};
  --lsm-sidebar: ${theme.darkSidebar};
  --lsm-card: ${theme.darkCard};
  --lsm-text: ${theme.darkText};
  --lsm-on-primary: #101114;
  --lsm-sidebar-glass: ${rgba(theme.darkSidebar, Math.min(0.96, theme.backgroundOverlay + 0.34))};
  --kd-color-brand-normal: ${theme.darkPrimary} !important;
  --kd-color-brand-hover: ${darkPrimaryHover} !important;
  --kd-color-brand-pressed: ${darkPrimaryPressed} !important;
  --kd-color-brand-light: ${rgba(theme.darkPrimary, 0.18)} !important;
  --kd-color-brand-disable: ${rgba(theme.darkPrimary, 0.4)} !important;
  --kd-color-primary: ${theme.darkPrimary} !important;
  --kd-color-icon-brand: ${theme.darkPrimary} !important;
  --kd-color-line-brand: ${theme.darkPrimary} !important;
  --kd-color-link: ${theme.darkPrimary} !important;
  --kd-color-background-bottom: ${theme.darkBackground} !important;
  --kd-color-background-group: ${theme.darkBackground} !important;
  --kd-color-background-base: ${theme.darkSidebar} !important;
  --kd-color-background-aside: ${theme.darkSidebar} !important;
  --kd-color-background-frame: ${mix(theme.darkSidebar, theme.darkText, 0.1)} !important;
  --kd-color-background-plate: ${theme.darkCard} !important;
  --kd-color-background-top: ${theme.darkCard} !important;
  --kd-color-background-middle: ${theme.darkCard} !important;
  --kd-color-fill-base: ${theme.darkCard} !important;
  --kd-color-fill-light: ${mix(theme.darkCard, theme.darkBackground, 0.42)} !important;
  --kd-color-fill-regular: ${mix(theme.darkCard, theme.darkText, 0.1)} !important;
  --kd-color-fill-medium: ${mix(theme.darkCard, theme.darkText, 0.15)} !important;
  --kd-color-line-light: ${rgba(darkLine, 0.58)} !important;
  --kd-color-line-regular: ${darkLine} !important;
  --kd-color-text-primary: ${rgba(theme.darkText, 0.96)} !important;
  --kd-color-text-secondary: ${darkMutedText} !important;
  --kd-color-text-tertiary: ${rgba(theme.darkText, 0.5)} !important;
  --kd-color-icon-primary: ${rgba(theme.darkText, 0.9)} !important;
  --kd-color-icon-secondary: ${darkMutedText} !important;
}
html, body { background: var(--lsm-background) !important; color: var(--lsm-text) !important; }
.claw-aside, [class*="aside"] { --kd-color-background-base: var(--lsm-sidebar) !important; }
.rooter__main {
  border-radius: 0 !important;
  overflow: hidden !important;
  background: var(--lsm-sidebar) !important;
}
.rooter__content,
.rooter__container {
  border-radius: 0 !important;
  overflow: hidden !important;
  background: transparent !important;
}
.rooter__core {
  border: 0 !important;
  border-radius: ${theme.radius}px 0 0 0 !important;
  overflow: hidden !important;
  background: var(--lsm-background) !important;
  background-clip: padding-box !important;
  box-shadow: none !important;
}
.claw-home {
  border-radius: ${theme.radius}px 0 0 0 !important;
  overflow: hidden auto !important;
  background: transparent !important;
  background-clip: padding-box !important;
}
.claw-aside__mac-logo { width: 28px !important; height: 28px !important; object-fit: contain !important; border-radius: 50% !important; border: 0 !important; outline: 0 !important; box-shadow: none !important; background: transparent !important; }
.claw-aside__mac-text { color: var(--lsm-text) !important; }
textarea, input, [contenteditable="true"] { caret-color: var(--lsm-primary) !important; }
button, [role="button"], [class*="card"], [class*="dialog"] { border-radius: ${theme.radius}px; }
.mode-trigger--active, .cowork-home-projects__tab--active, [class*="nav-item"][class*="active"], [class*="menu-item"][class*="active"], [aria-selected="true"] { color: var(--lsm-primary) !important; border-color: var(--lsm-primary) !important; }
.mode-trigger--active, [class*="nav-item"][class*="active"], [class*="menu-item"][class*="active"], [aria-selected="true"] { background-color: color-mix(in srgb,var(--lsm-primary) 12%,transparent) !important; }
.mode-trigger--active .mode-trigger__icon .kd-color-icon-primary { fill: var(--lsm-primary) !important; stroke: var(--lsm-primary) !important; }
.voice-send-btn, .kdv-button--primary, button[class*="primary"] { background-color: var(--lsm-primary) !important; border-color: var(--lsm-primary) !important; color: var(--lsm-on-primary) !important; }
.claw-aside__action { border-color: var(--lsm-primary) !important; color: var(--lsm-primary) !important; background-color: var(--lsm-card) !important; }
a, [class*="link"] { --kd-color-link: var(--lsm-primary) !important; }
::selection { background: color-mix(in srgb,var(--lsm-primary) 26%,transparent) !important; }
html[theme-mode="dark"] .claw-home { color: var(--lsm-text) !important; }
html[theme-mode="dark"] .input.chat__input,
html[theme-mode="dark"] .cowork-home-projects__card { background: var(--lsm-card) !important; color: var(--lsm-text) !important; }
html[theme-mode="dark"] .claw-input__inner { background: transparent !important; border: 0 !important; border-radius: ${theme.radius}px !important; box-shadow: none !important; }
html[theme-mode="dark"] .input.chat__input { border: 1px solid color-mix(in srgb,var(--lsm-text) 13%,transparent) !important; border-radius: ${theme.radius}px !important; overflow: hidden !important; }
html[theme-mode="dark"] .cowork-home-projects__card { border-color: color-mix(in srgb,var(--lsm-text) 15%,transparent) !important; }
html[theme-mode="dark"] .inputbox__textarea--placeholder,
html[theme-mode="dark"] .cowork-home-projects__description,
html[theme-mode="dark"] .cowork-home-projects__card p,
html[theme-mode="dark"] [class*="placeholder"] { color: color-mix(in srgb,var(--lsm-text) 70%,transparent) !important; opacity: 1 !important; }
html[theme-mode="dark"] ${wallpaperTarget}::before { background-image: linear-gradient(${rgba(theme.darkBackground, darkWallpaperOverlay)}, ${rgba(theme.darkBackground, darkWallpaperOverlay)}), url("${theme.decorationImage}") !important; }
${styleCss}
${wallpaperCss}
`;
}

function buildDomScript(theme) {
  const composerSource = theme.composerDecorationSource === "hanger" ? theme.composerImage : theme.composerDecorationSource === "decoration" ? theme.decorationImage : theme.brandImage;
  const payload = JSON.stringify({
    enabled: theme.enabled,
    brandImage: theme.enabled ? theme.brandImage : "",
    brandName: theme.enabled ? theme.brandName : "",
    decorationImage: theme.enabled ? theme.decorationImage : "",
    decorationMode: theme.decorationMode,
    decorationOpacity: theme.decorationOpacity,
    composerImage: theme.enabled && theme.composerDecorationEnabled ? (composerSource || theme.composerImage || theme.decorationImage || theme.brandImage) : "",
    composerAnchor: theme.composerAnchor,
    composerScale: theme.composerScale,
    composerOverlap: theme.composerOverlap
  });
  return `(() => {
    const p = ${payload};
    window.__lingxiSkinBrandPayload = p;
    const applyBrandIdentity = () => {
      const brand = window.__lingxiSkinBrandPayload || p;
      const imageSelectors = [
        '.claw-aside__mac-logo', '.assistant-island__icon', '.workbench-avatar__icon',
        '.claw-titlebar__logo', '.claw-titlebar__collapse-logo'
      ];
      document.querySelectorAll(imageSelectors.join(',')).forEach(image => {
        if (!image.dataset.lsmOriginalSrc) image.dataset.lsmOriginalSrc = image.src || '';
        image.src = brand.brandImage || image.dataset.lsmOriginalSrc;
        image.alt = brand.brandName || '灵犀';
      });
      const textSelectors = [
        '.claw-aside__mac-text', '.assistant-island__label', '.claw-loading-header__text',
        '.cowork-waiting-answer__text', '.workbench-header__title', '.env-switch__option-title',
        '.session-filter__item-label', '.mini-canvas-badge', '.claw-titlebar__text',
        '.agent__name', '.badge__label', '.cowork-client-header__title',
        '.cowork-home-projects__desc', '.cowork-home-projects__desc-card'
      ];
      document.querySelectorAll(textSelectors.join(',')).forEach(element => {
        const previousName = element.dataset.lsmBrandName || '';
        let officialText = element.textContent || '';
        if (previousName && officialText.includes(previousName)) officialText = officialText.split(previousName).join('灵犀');
        if (!element.dataset.lsmOriginalText && officialText.includes('灵犀')) element.dataset.lsmOriginalText = officialText;
        if (!officialText.includes('灵犀') && !brand.brandName && element.dataset.lsmOriginalText) officialText = element.dataset.lsmOriginalText;
        const nextText = brand.brandName && officialText.includes('灵犀') ? officialText.split('灵犀').join(brand.brandName) : officialText;
        element.dataset.lsmBrandName = brand.brandName || '';
        if (element.textContent !== nextText) element.textContent = nextText;
      });
      document.title = brand.brandName || '灵犀';
    };
    applyBrandIdentity();
    if (!window.__lingxiSkinBrandObserver) {
      let scheduled = false;
      window.__lingxiSkinBrandObserver = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; applyBrandIdentity(); window.__lingxiSkinPlaceDecoration?.(); });
      });
      window.__lingxiSkinBrandObserver.observe(document.body, { childList:true, subtree:true, characterData:true });
    }
    let layer = document.getElementById('lingxi-skin-decoration');
    const floatingImage = p.composerImage || (p.decorationMode === 'mascot' ? p.decorationImage : '');
    if (!floatingImage) { layer?.remove(); window.__lingxiSkinDecorationResizeObserver?.disconnect(); return true; }
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'lingxi-skin-decoration';
      document.body.insertBefore(layer, document.getElementById('app'));
    }
    Object.assign(layer.style, {
      position:'fixed', inset:'auto', backgroundImage:'url("' + floatingImage + '")',
      backgroundPosition:'center bottom', backgroundSize:'contain', backgroundRepeat:'no-repeat',
      opacity:String(p.decorationOpacity), pointerEvents:'none', zIndex:'20', filter:'drop-shadow(0 8px 10px rgba(20,28,48,.16))', transformOrigin:'center bottom', transition:'left .16s ease, top .16s ease, width .16s ease, height .16s ease'
    });
    const findComposer = () => ['.claw-input__container','.input.chat__input','.sender-input-container','.lingxichat .input__container']
      .flatMap(selector => [...document.querySelectorAll(selector)])
      .filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 240 && rect.height > 48 && rect.bottom > 0 && rect.top < innerHeight; })
      .sort((a,b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const placeDecoration = () => {
      const target = findComposer();
      if (!target || !layer.isConnected) { layer.style.display='none'; return; }
      const rect = target.getBoundingClientRect();
      const width = Math.min(220, Math.max(82, rect.width * p.composerScale));
      const height = width;
      const overlap = width * p.composerOverlap;
      const anchorRatio = p.composerAnchor.startsWith('left') ? .14 : p.composerAnchor.startsWith('right') ? .86 : .5;
      const bottomAnchor = p.composerAnchor === 'right-bottom' || p.composerAnchor === 'left-bottom';
      let left = rect.left + rect.width * anchorRatio - width / 2;
      let top = bottomAnchor ? rect.bottom - overlap : rect.top - height + overlap;
      left = Math.max(8, Math.min(innerWidth - width - 8, left));
      top = Math.max(38, Math.min(innerHeight - height - 8, top));
      Object.assign(layer.style,{display:'block',left:left+'px',top:top+'px',right:'auto',bottom:'auto',width:width+'px',height:height+'px'});
      if (window.__lingxiSkinDecorationTarget !== target) {
        window.__lingxiSkinDecorationResizeObserver?.disconnect();
        window.__lingxiSkinDecorationResizeObserver = new ResizeObserver(placeDecoration);
        window.__lingxiSkinDecorationResizeObserver.observe(target);
        window.__lingxiSkinDecorationTarget = target;
      }
    };
    window.__lingxiSkinPlaceDecoration = placeDecoration;
    if (!window.__lingxiSkinDecorationWindowBound) {
      addEventListener('resize', () => window.__lingxiSkinPlaceDecoration?.(), { passive:true });
      window.__lingxiSkinDecorationWindowBound = true;
    }
    placeDecoration();
    return true;
  })()`;
}

function buildLoadingScript(theme) {
  const payload = JSON.stringify({
    brandName: theme.enabled ? theme.brandName : "",
    brandImage: theme.enabled ? brandAssetUrl(theme) : "",
    primary: theme.enabled ? theme.primary : "#3c57ef",
    background: theme.enabled ? theme.background : "#ffffff",
    text: theme.enabled ? theme.text : "#0d0d0d",
    darkPrimary: theme.enabled ? theme.darkPrimary : "#7690ff",
    darkBackground: theme.enabled ? theme.darkBackground : "#17181c",
    darkText: theme.enabled ? theme.darkText : "#f4f4f5"
  });
  return `(() => {
    const p = ${payload};
    const dark = document.documentElement.getAttribute('theme-mode') === 'dark' || matchMedia('(prefers-color-scheme: dark)').matches;
    const primary = dark ? p.darkPrimary : p.primary;
    const background = dark ? p.darkBackground : p.background;
    const text = dark ? p.darkText : p.text;
    const image = document.querySelector('.mascot');
    const title = document.querySelector('#mainTitle');
    if (image) {
      if (!image.dataset.lsmOriginalSrc) image.dataset.lsmOriginalSrc = image.src || '';
      image.src = p.brandImage || image.dataset.lsmOriginalSrc;
      image.alt = p.brandName || '灵犀';
      image.style.borderRadius = p.brandImage ? '50%' : '';
      image.style.border = '0'; image.style.outline = '0'; image.style.boxShadow = 'none'; image.style.objectFit = 'contain';
    }
    if (title) {
      if (!title.dataset.lsmOriginalText) title.dataset.lsmOriginalText = title.textContent || '灵犀正在加载中，请稍等片刻';
      title.textContent = p.brandName ? title.dataset.lsmOriginalText.split('灵犀').join(p.brandName) : title.dataset.lsmOriginalText;
    }
    document.title = p.brandName || '灵犀';
    document.body.style.background = background;
    document.body.style.color = text;
    const styleId = 'lingxi-skin-loading-style';
    let style = document.getElementById(styleId);
    if (!style) { style = document.createElement('style'); style.id = styleId; document.head.appendChild(style); }
    style.textContent = '.title{color:' + text + '!important}.progress-fill{background:' + primary + '!important}.btn-primary{background:' + primary + '!important}';
    return { title:title?.textContent || '', image:image?.src || '' };
  })()`;
}

function buildMemoryScript(theme, remove = false) {
  const payload = JSON.stringify({ name: theme.brandName, enabled: theme.enabled && theme.syncIdentityMemory, remove });
  return `(async () => {
    const p = ${payload};
    const path = 'wiki/profile/品牌助手身份';
    const endpoint = '/api/public/v1/agents/default/memory/pages/' + path;
    if (p.remove || !p.enabled || p.name === '灵犀') {
      const exists = await fetch(endpoint);
      if (exists.ok) {
        const removed = await fetch(endpoint, { method:'DELETE' });
        if (!removed.ok) throw new Error('移除品牌身份记忆失败');
      }
      return { ok:true, removed:exists.ok };
    }
    const content = '## 助手身份\\n\\n- 你在与用户对话时使用名称「' + p.name + '」。\\n- 不要自称“灵犀”；需要自我介绍时，请称为「' + p.name + '」。\\n- “灵犀”仅是原产品名称，不是你当前对用户使用的称呼。';
    const body = { front_matter:{ title:'品牌助手身份', summary:'助手当前对外名称为「' + p.name + '」，对话中不再自称“灵犀”。' }, content };
    const exists = await fetch(endpoint);
    const target = exists.ok ? endpoint : '/api/public/v1/agents/default/memory/pages';
    if (!exists.ok) body.path = path;
    const saved = await fetch(target, { method:exists.ok ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (!saved.ok) throw new Error('同步品牌身份记忆失败：' + saved.status);
    return { ok:true, created:!exists.ok };
  })()`;
}

async function getTargets() {
  const response = await fetch(`http://${HOST}:${DEBUG_PORT}/json/list`, { signal: AbortSignal.timeout(900) });
  if (!response.ok) throw new Error(`调试通道返回 ${response.status}`);
  return response.json();
}

class CdpSession {
  constructor(target) {
    this.target = target;
    this.id = 0;
    this.pending = new Map();
    this.socket = null;
    this.styleSheetId = null;
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.target.webSocketDebuggerUrl);
      this.socket = socket;
      const timer = setTimeout(() => reject(new Error("连接灵犀页面超时")), 2500);
      socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("无法连接灵犀页面")); }, { once: true });
      socket.addEventListener("message", event => {
        const message = JSON.parse(event.data);
        if (!message.id) return;
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
      });
      socket.addEventListener("close", () => sessions.delete(this.target.id));
    });
    await this.send("DOM.enable");
    await this.send("CSS.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return reject(new Error("灵犀页面连接已断开"));
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`${method} 执行超时`));
      }, 3000);
    });
  }

  async setCss(css) {
    const value = JSON.stringify(css);
    const expression = `(() => {
      const id = 'lingxi-skin-theme-style';
      let style = document.getElementById(id);
      const css = ${value};
      if (!css) { style?.remove(); return { active:false }; }
      if (!style) { style = document.createElement('style'); style.id = id; document.head.appendChild(style); }
      style.textContent = css;
      return { active:true, length:css.length };
    })()`;
    const result = await this.send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "皮肤样式写入失败");
  }

  async applyDom(theme) {
    await this.send("Runtime.evaluate", { expression: buildDomScript(theme), returnByValue: true });
  }

  async applyLoading(theme) {
    const result = await this.send("Runtime.evaluate", { expression: buildLoadingScript(theme), returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "启动页品牌替换失败");
    return result.result?.value;
  }

  async syncIdentityMemory(theme, remove = false) {
    const result = await this.send("Runtime.evaluate", { expression: buildMemoryScript(theme, remove), awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "同步品牌身份记忆失败");
    if (result.result?.subtype === "error") throw new Error(result.result.description || "同步品牌身份记忆失败");
    return result.result?.value;
  }
}

async function sessionFor(target) {
  let session = sessions.get(target.id);
  if (!session || !session.socket || session.socket.readyState !== WebSocket.OPEN) {
    session = new CdpSession(target);
    await session.connect();
    sessions.set(target.id, session);
  }
  return session;
}

async function syncIdentityMemory(theme, remove = false) {
  const targets = await getTargets();
  const target = targets.find(item => item.type === "page" && /lingxi\.wps\.cn\/cowork/i.test(item.url));
  if (!target) throw new Error("灵犀主页面还未加载，暂时无法同步记忆");
  const session = await sessionFor(target);
  return session.syncIdentityMemory(theme, remove);
}

async function applyToLoadingTargets(targets = null) {
  const allTargets = targets || await getTargets();
  const loadingPages = allTargets.filter(target => target.type === "page" && /app\.asar\.unpacked\/resources\/loading\.html/i.test(target.url));
  for (const target of loadingPages) {
    const session = await sessionFor(target);
    await session.applyLoading(currentTheme);
  }
  return loadingPages.length;
}

async function applyToConnectedPages() {
  const targets = await getTargets();
  await applyToLoadingTargets(targets);
  const pages = targets.filter(target => target.type === "page" && /lingxi\.wps\.cn\/cowork/i.test(target.url));
  if (!pages.length) throw new Error("已连接调试通道，但灵犀主页面还未加载");
  const css = buildCss(currentTheme);
  for (const target of pages) {
    const session = await sessionFor(target);
    await session.setCss(css);
    await session.applyDom(currentTheme);
  }
  lastInjectionAt = new Date().toISOString();
  lastError = "";
  return pages.length;
}

async function restoreConnectedPages() {
  const targets = await getTargets();
  const pages = targets.filter(target => target.type === "page" && /lingxi\.wps\.cn\/cowork/i.test(target.url));
  for (const target of pages) {
    const session = await sessionFor(target);
    await session.setCss("").catch(() => {});
    await session.applyDom(currentTheme).catch(() => {});
    await session.send("Page.reload", { ignoreCache: false });
  }
  lastInjectionAt = null;
  lastError = "";
  return pages.length;
}

async function findLingxiExecutable() {
  if (cachedLingxiExecutable && await fileExists(cachedLingxiExecutable)) return cachedLingxiExecutable;
  if (IS_MACOS) {
    if (!await fileExists(MAC_APP_EXECUTABLE)) throw new Error("未找到 /Applications/WPS 灵犀.app");
    cachedLingxiExecutable = MAC_APP_EXECUTABLE;
    return cachedLingxiExecutable;
  }
  if (IS_WINDOWS) {
    cachedLingxiExecutable = await findWindowsLingxiExecutable();
    return cachedLingxiExecutable;
  }
  throw new Error(`暂不支持当前系统：${PLATFORM}`);
}

async function isLingxiRunning() {
  try {
    if (IS_WINDOWS) {
      const imageName = path.basename(await findLingxiExecutable());
      const { stdout } = await execFileAsync("tasklist.exe", ["/FI", `IMAGENAME eq ${imageName}`, "/FO", "CSV", "/NH"], { windowsHide: true });
      return stdout.toLowerCase().includes(`"${imageName.toLowerCase()}"`);
    }
    const executable = await findLingxiExecutable();
    const { stdout } = await execFileAsync("/usr/bin/pgrep", ["-f", `^${executable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function isConnected() {
  try {
    await getTargets();
    return true;
  } catch {
    return false;
  }
}

async function restartLingxi() {
  const executable = await findLingxiExecutable();
  const windowsImageName = IS_WINDOWS ? path.basename(executable) : "";
  if (IS_WINDOWS) {
    try { await execFileAsync("taskkill.exe", ["/IM", windowsImageName, "/T"], { windowsHide: true }); } catch {}
  } else {
    try {
      const { stdout } = await execFileAsync("/usr/bin/pgrep", ["-f", `^${executable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`]);
      for (const pid of stdout.trim().split(/\s+/).filter(Boolean)) process.kill(Number(pid), "SIGTERM");
    } catch {}
  }

  const stopDeadline = Date.now() + 9000;
  while (Date.now() < stopDeadline && await isLingxiRunning()) await new Promise(resolve => setTimeout(resolve, 300));

  if (IS_WINDOWS && await isLingxiRunning()) {
    try { await execFileAsync("taskkill.exe", ["/IM", windowsImageName, "/T", "/F"], { windowsHide: true }); } catch {}
    const forceDeadline = Date.now() + 3000;
    while (Date.now() < forceDeadline && await isLingxiRunning()) await new Promise(resolve => setTimeout(resolve, 200));
  }

  if (await isLingxiRunning()) {
    throw new Error("灵犀未能正常关闭，请先手动退出灵犀，再点击连接");
  }

  const child = IS_WINDOWS
    ? spawn(executable, [`--remote-debugging-port=${DEBUG_PORT}`, `--remote-debugging-address=${HOST}`], { detached: true, stdio: "ignore", windowsHide: false })
    : spawn("/usr/bin/open", ["-na", MAC_APP_PATH, "--args", `--remote-debugging-port=${DEBUG_PORT}`, `--remote-debugging-address=${HOST}`], { detached: true, stdio: "ignore" });
  child.unref();

  const deadline = Date.now() + 20000;
  let lastRestartError = "灵犀启动超时";
  while (Date.now() < deadline) {
    try {
      const count = await applyToConnectedPages();
      return { count };
    } catch (error) {
      lastRestartError = error.message;
      await new Promise(resolve => setTimeout(resolve, 140));
    }
  }
  throw new Error(lastRestartError);
}

function xmlEscape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function safeAppName(value) {
  const normalized = value.replace(/[<>:"/\\|?*\0]/g, " ").replace(/^\.+/, "").replace(/[. ]+$/, "").replace(/\s+/g, " ").trim().slice(0, 24);
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(normalized) || !normalized ? "我的灵犀" : normalized;
}

async function createMacPersonalLauncher() {
  if (!currentTheme.brandImage) throw new Error("请先上传品牌 Logo 或形象");
  const appName = safeAppName(currentTheme.brandName);
  const applicationsDir = path.join(os.homedir(), "Applications");
  await fs.mkdir(applicationsDir, { recursive: true });
  let appPath = path.join(applicationsDir, `${appName}.app`);
  for (let index = 2; index < 100; index += 1) {
    try { await fs.access(appPath); appPath = path.join(applicationsDir, `${appName} ${index}.app`); }
    catch { break; }
  }

  const contents = path.join(appPath, "Contents");
  const macos = path.join(contents, "MacOS");
  const resources = path.join(contents, "Resources");
  await fs.mkdir(macos, { recursive: true });
  await fs.mkdir(resources, { recursive: true });

  const bundleId = `local.lingxi.personal.${Date.now()}`;
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>launcher</string>
  <key>CFBundleIdentifier</key><string>${bundleId}</string>
  <key>CFBundleName</key><string>${xmlEscape(appName)}</string>
  <key>CFBundleDisplayName</key><string>${xmlEscape(appName)}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
</dict></plist>\n`;
  await fs.writeFile(path.join(contents, "Info.plist"), plist, "utf8");

  const launcher = `#!/bin/zsh
/usr/bin/open -b local.lingxi.skinmanager --args --background
for _ in {1..60}; do
  STATUS=$(/usr/bin/curl -fsS http://127.0.0.1:17363/api/status 2>/dev/null) && break
  /bin/sleep 0.1
done
if [[ "$STATUS" == *'"connected":true'* ]]; then
  /usr/bin/curl -fsS -X POST http://127.0.0.1:17363/api/apply -H 'Content-Type: application/json' --data '{}' >/dev/null
else
  /usr/bin/curl -fsS -X POST http://127.0.0.1:17363/api/restart -H 'Content-Type: application/json' --data '{}' >/dev/null
fi
`;
  const launcherPath = path.join(macos, "launcher");
  await fs.writeFile(launcherPath, launcher, { encoding: "utf8", mode: 0o755 });

  const match = currentTheme.brandImage.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/i);
  if (!match) throw new Error("Logo 图片格式无法生成应用图标");
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lingxi-icon-"));
  try {
    const inputPath = path.join(tempDir, `source.${match[1] === "jpeg" ? "jpg" : match[1]}`);
    const iconset = path.join(tempDir, "AppIcon.iconset");
    await fs.mkdir(iconset);
    await fs.writeFile(inputPath, Buffer.from(match[2], "base64"));
    const specs = [[16,"icon_16x16.png"],[32,"icon_16x16@2x.png"],[32,"icon_32x32.png"],[64,"icon_32x32@2x.png"],[128,"icon_128x128.png"],[256,"icon_128x128@2x.png"],[256,"icon_256x256.png"],[512,"icon_256x256@2x.png"],[512,"icon_512x512.png"],[1024,"icon_512x512@2x.png"]];
    for (const [size, fileName] of specs) {
      await execFileAsync("/usr/bin/sips", ["-s", "format", "png", "-z", String(size), String(size), inputPath, "--out", path.join(iconset, fileName)]);
    }
    await execFileAsync("/usr/bin/iconutil", ["-c", "icns", iconset, "-o", path.join(resources, "AppIcon.icns")]);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  await execFileAsync("/usr/bin/codesign", ["--force", "--deep", "--sign", "-", appPath]);
  spawn("/usr/bin/open", ["-R", appPath], { detached: true, stdio: "ignore" }).unref();
  return { appPath, appName, locationLabel: "Finder 的个人应用目录" };
}

function powerShellQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function createWindowsPersonalLauncher() {
  if (!currentTheme.brandImage) throw new Error("请先上传品牌 Logo 或形象");
  const appName = safeAppName(currentTheme.brandName);
  const localData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const launcherDir = path.join(localData, "Lingxi Skin Manager", "Launchers", `${appName}-${Date.now()}`);
  await fs.mkdir(launcherDir, { recursive: true });

  const match = currentTheme.brandImage.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/i);
  if (!match) throw new Error("Logo 图片格式无法生成应用图标");
  const sourceImage = path.join(launcherDir, `icon-source.${match[1] === "jpeg" ? "jpg" : match[1]}`);
  const iconPath = path.join(launcherDir, "AppIcon.ico");
  await fs.writeFile(sourceImage, Buffer.from(match[2], "base64"));

  const managerScript = path.join(import.meta.dirname, "server.mjs");
  const launchScript = path.join(launcherDir, "launch.ps1");
  const launchPowerShell = `$ErrorActionPreference = 'SilentlyContinue'\n` +
    `$node = ${powerShellQuote(process.execPath)}\n` +
    `$server = ${powerShellQuote(managerScript)}\n` +
    `$serverArgument = '"' + $server + '"'\n` +
    `try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:17363/api/status' -TimeoutSec 1 | Out-Null } catch { Start-Process -WindowStyle Hidden -FilePath $node -ArgumentList @($serverArgument) }\n` +
    `for ($i = 0; $i -lt 60; $i++) { try { $status = Invoke-RestMethod -Uri 'http://127.0.0.1:17363/api/status' -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 100 } }\n` +
    `if ($status.connected) { Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:17363/api/apply' -ContentType 'application/json' -Body '{}' | Out-Null } else { Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:17363/api/restart' -ContentType 'application/json' -Body '{}' | Out-Null }\n`;
  await fs.writeFile(launchScript, launchPowerShell, "utf8");

  const shortcutScript = path.join(launcherDir, "create-shortcuts.ps1");
  const powershellPath = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const shortcutArguments = `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${launchScript}"`;
  const shortcutPowerShell = `Add-Type -AssemblyName System.Drawing\n` +
    `$source = [System.Drawing.Image]::FromFile(${powerShellQuote(sourceImage)})\n` +
    `$bitmap = New-Object System.Drawing.Bitmap 256, 256\n` +
    `$graphics = [System.Drawing.Graphics]::FromImage($bitmap)\n` +
    `$graphics.Clear([System.Drawing.Color]::Transparent)\n` +
    `$ratio = [Math]::Min(256 / $source.Width, 256 / $source.Height)\n` +
    `$width = [int]($source.Width * $ratio); $height = [int]($source.Height * $ratio)\n` +
    `$graphics.DrawImage($source, [int]((256-$width)/2), [int]((256-$height)/2), $width, $height)\n` +
    `$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())\n` +
    `$stream = [System.IO.File]::Open(${powerShellQuote(iconPath)}, [System.IO.FileMode]::Create)\n` +
    `$icon.Save($stream); $stream.Close(); $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose()\n` +
    `$shell = New-Object -ComObject WScript.Shell\n` +
    `$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) ${powerShellQuote(`${appName}.lnk`)}\n` +
    `$startShortcut = Join-Path ([Environment]::GetFolderPath('Programs')) ${powerShellQuote(`${appName}.lnk`)}\n` +
    `foreach ($shortcutPath in @($desktopShortcut, $startShortcut)) {\n` +
    `  $shortcut = $shell.CreateShortcut($shortcutPath)\n` +
    `  $shortcut.TargetPath = ${powerShellQuote(powershellPath)}\n` +
    `  $shortcut.Arguments = ${powerShellQuote(shortcutArguments)}\n` +
    `  $shortcut.WorkingDirectory = ${powerShellQuote(launcherDir)}\n` +
    `  $shortcut.IconLocation = ${powerShellQuote(`${iconPath},0`)}\n` +
    `  $shortcut.Save()\n` +
    `}\n` +
    `Write-Output $desktopShortcut\n`;
  await fs.writeFile(shortcutScript, shortcutPowerShell, "utf8");
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", shortcutScript], { windowsHide: true });
  await fs.rm(shortcutScript, { force: true });
  const desktopShortcut = stdout.trim();
  spawn("explorer.exe", ["/select,", desktopShortcut], { detached: true, stdio: "ignore" }).unref();
  return { appPath: desktopShortcut, appName, locationLabel: "桌面和开始菜单" };
}

async function createPersonalLauncher() {
  if (IS_WINDOWS) return createWindowsPersonalLauncher();
  if (IS_MACOS) return createMacPersonalLauncher();
  throw new Error(`暂不支持当前系统：${PLATFORM}`);
}

async function statusPayload() {
  return {
    platform: PLATFORM,
    running: await isLingxiRunning(),
    connected: await isConnected(),
    enabled: currentTheme.enabled,
    lastInjectionAt,
    lastError
  };
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("上传内容过大，请使用 5MB 以内的图片");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function api(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/status") return sendJson(response, 200, await statusPayload());
    if (request.method === "GET" && url.pathname === "/api/theme") return sendJson(response, 200, currentTheme);

    if (request.method === "POST" && url.pathname === "/api/theme") {
      currentTheme = sanitizeTheme(JSON.parse(await readBody(request)));
      currentTheme.enabled = true;
      await saveTheme(currentTheme);
      let applied = false;
      try { await applyToConnectedPages(); applied = true; } catch (error) { lastError = error.message; }
      let memorySynced = false;
      let memoryRemoved = false;
      if (applied) {
        try {
          const memoryResult = await syncIdentityMemory(currentTheme, !currentTheme.syncIdentityMemory);
          memorySynced = currentTheme.syncIdentityMemory && Boolean(memoryResult?.ok);
          memoryRemoved = !currentTheme.syncIdentityMemory && Boolean(memoryResult?.removed);
        } catch (error) { lastError = error.message; }
      }
      return sendJson(response, 200, { ok: true, applied, memorySynced, memoryRemoved, status: await statusPayload() });
    }

    if (request.method === "POST" && url.pathname === "/api/apply") {
      currentTheme.enabled = true;
      await saveTheme(currentTheme);
      const count = await applyToConnectedPages();
      const memoryResult = await syncIdentityMemory(currentTheme, !currentTheme.syncIdentityMemory);
      const memorySynced = currentTheme.syncIdentityMemory && Boolean(memoryResult?.ok);
      const memoryRemoved = !currentTheme.syncIdentityMemory && Boolean(memoryResult?.removed);
      return sendJson(response, 200, { ok: true, count, memorySynced, memoryRemoved, status: await statusPayload() });
    }

    if (request.method === "POST" && url.pathname === "/api/reset") {
      currentTheme = { ...DEFAULT_THEME, enabled: false };
      await saveTheme(currentTheme);
      let memoryRemoved = false;
      try { memoryRemoved = Boolean((await syncIdentityMemory(currentTheme, true))?.removed); } catch (error) { lastError = error.message; }
      let applied = false;
      try { applied = (await restoreConnectedPages()) > 0; } catch (error) { lastError = error.message; }
      return sendJson(response, 200, { ok: true, applied, memoryRemoved, theme: currentTheme, status: await statusPayload() });
    }

    if (request.method === "POST" && url.pathname === "/api/restart") {
      const result = await restartLingxi();
      const memoryResult = await syncIdentityMemory(currentTheme, !currentTheme.syncIdentityMemory);
      const memorySynced = currentTheme.syncIdentityMemory && Boolean(memoryResult?.ok);
      const memoryRemoved = !currentTheme.syncIdentityMemory && Boolean(memoryResult?.removed);
      return sendJson(response, 200, { ok: true, ...result, memorySynced, memoryRemoved, status: await statusPayload() });
    }

    if (request.method === "POST" && url.pathname === "/api/create-launcher") {
      currentTheme.enabled = true;
      await saveTheme(currentTheme);
      const result = await createPersonalLauncher();
      return sendJson(response, 200, { ok: true, ...result });
    }

    return sendJson(response, 404, { ok: false, message: "接口不存在" });
  } catch (error) {
    lastError = error.message;
    return sendJson(response, 500, { ok: false, message: error.message, status: await statusPayload() });
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

async function serveStatic(response, url) {
  const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const normalized = path.normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  const file = path.join(PUBLIC_DIR, normalized);
  if (!file.startsWith(PUBLIC_DIR)) {
    response.writeHead(403); response.end(); return;
  }
  try {
    const data = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(data);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
  if (url.pathname.startsWith("/api/")) return api(request, response, url);
  return serveStatic(response, url);
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") process.exit(0);
  throw error;
});

server.listen(PORT, HOST, () => console.log(`Lingxi Skin Manager: http://${HOST}:${PORT}`));

setInterval(async () => {
  if (polling || !currentTheme.enabled) return;
  polling = true;
  try { await applyToConnectedPages(); } catch (error) { lastError = error.message; }
  finally { polling = false; }
}, 3500).unref();

setInterval(async () => {
  if (!currentTheme.enabled) return;
  try { await applyToLoadingTargets(); } catch {}
}, 650).unref();
