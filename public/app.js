const presets = [
  { styleId: "claude", series: "AI 原生", name: "Claude 亚麻", description: "最新暖白工作台、陶土强调", primary: "#c96442", background: "#f7f6f2", sidebar: "#eeeae2", card: "#fffefa", text: "#2b2926", darkPrimary:"#e28c70", darkBackground:"#1d1c19", darkSidebar:"#171614", darkCard:"#292824", darkText:"#f2eee7", radius: 14 },
  { styleId: "chatgpt", series: "AI 原生", name: "ChatGPT 原生", description: "最新中性灰阶、悬浮输入框", primary: "#10a37f", background: "#f9f9f8", sidebar: "#f1f1ef", card: "#ffffff", text: "#212121", darkPrimary:"#19c79a", darkBackground:"#212121", darkSidebar:"#171717", darkCard:"#2f2f2f", darkText:"#ececec", radius: 18 },
  { styleId: "cj_mecha", series: "CJ 原创 IP", name: "NOVA 机甲姬", brandName:"NOVA", description: "电光蓝、机甲舱、速度线", primary: "#1769ff", background: "#edf4ff", sidebar: "#dce8fa", card: "#ffffff", text: "#102342", darkPrimary:"#62a2ff", darkBackground:"#071426", darkSidebar:"#0a1b33", darkCard:"#10233d", darkText:"#e7f2ff", radius: 12, asset: "/themes/cj-nova-scene.svg", brandAsset:"/themes/cj-nova-logo.svg", hangerAsset:"/themes/cj-nova-hanger.png", backgroundScope: "full", backgroundFit: "cover", backgroundPosition: "right", backgroundOverlay: .58, backgroundBlur: 0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"right-top", composerScale:.22, composerOverlap:.08, decorationOpacity:.96 },
  { styleId: "cj_shanhai", series: "CJ 原创 IP", name: "山海灵兽", brandName:"山海", description: "玉石青、丹霞红、东方留白", primary: "#147d70", background: "#f6f0e4", sidebar: "#e9e0cf", card: "#fffdf7", text: "#26352e", darkPrimary:"#5bc0ae", darkBackground:"#101916", darkSidebar:"#16221d", darkCard:"#1e2c25", darkText:"#f0eadc", radius: 20, asset: "/themes/cj-shanhai-scene.svg", brandAsset:"/themes/cj-shanhai-logo.svg", hangerAsset:"/themes/cj-shanhai-hanger.png", backgroundScope: "content", backgroundFit: "cover", backgroundPosition: "right", backgroundOverlay: .62, backgroundBlur: 0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"left-top", composerScale:.21, composerOverlap:.09, decorationOpacity:.96 },
  { styleId: "cj_pixel", series: "CJ 原创 IP", name: "BYTE 像素勇者", brandName:"BYTE", description: "掌机黄、像素蓝、闯关地图", primary: "#e45b2f", background: "#fff4cf", sidebar: "#f4df99", card: "#fffdf4", text: "#26335b", darkPrimary:"#ff8c5d", darkBackground:"#1c1830", darkSidebar:"#242044", darkCard:"#302b54", darkText:"#fff2c7", radius: 6, asset: "/themes/cj-byte-scene.svg", brandAsset:"/themes/cj-byte-logo.svg", hangerAsset:"/themes/cj-byte-hanger.png", backgroundScope: "content", backgroundFit: "cover", backgroundPosition: "center", backgroundOverlay: .54, backgroundBlur: 0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"right-top", composerScale:.21, composerOverlap:.08, decorationOpacity:.98 },
  { styleId: "cj_toy", series: "CJ 原创 IP", name: "MOCHI 潮玩星球", brandName:"MOCHI", description: "莓果粉、软糖紫、盲盒展台", primary: "#cc4fa3", background: "#fff0f7", sidebar: "#f4ddeb", card: "#fffafd", text: "#40243a", darkPrimary:"#ff79c6", darkBackground:"#21131d", darkSidebar:"#2b1826", darkCard:"#3a2032", darkText:"#ffeafa", radius: 24, asset: "/themes/cj-mochi-scene.svg", brandAsset:"/themes/cj-mochi-logo.svg", hangerAsset:"/themes/cj-mochi-hanger.png", backgroundScope: "full", backgroundFit: "cover", backgroundPosition: "right", backgroundOverlay: .64, backgroundBlur: 1, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"right-top", composerScale:.22, composerOverlap:.08, decorationOpacity:.97 },
  { styleId: "wps_mongoose", series: "WPS 家族", name: "金小獴上班搭子", brandName:"金小獴", description: "WPS 蓝、白色萌獴、轻办公", primary:"#286ff4", background:"#f4f8ff", sidebar:"#e8f0ff", card:"#ffffff", text:"#17233c", darkPrimary:"#72a4ff", darkBackground:"#101725", darkSidebar:"#151f32", darkCard:"#1e2a42", darkText:"#edf4ff", radius:18, asset:"/themes/wps-mongoose-scene.svg", brandAsset:"/themes/wps-mongoose-logo.svg", hangerAsset:"/themes/wps-mongoose-hanger.png", backgroundScope:"content", backgroundFit:"cover", backgroundPosition:"right", backgroundOverlay:.68, backgroundBlur:0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"left-top", composerScale:.18, composerOverlap:.08, decorationOpacity:.98 },
  { styleId: "wps_mongoose_crawl", series: "WPS 家族", name: "金小獴探头", brandName:"金小獴", description: "趴着爬出、好奇探头、清新蓝绿", primary:"#167f91", background:"#f2fbfc", sidebar:"#e0f3f5", card:"#ffffff", text:"#17343a", darkPrimary:"#67c9d3", darkBackground:"#0e1b20", darkSidebar:"#12262d", darkCard:"#19343c", darkText:"#e8fbfc", radius:22, asset:"/themes/wps-mongoose-crawl-scene.svg", brandAsset:"/themes/wps-mongoose-logo.svg", hangerAsset:"/themes/wps-mongoose-crawl-hanger.png", backgroundScope:"content", backgroundFit:"cover", backgroundPosition:"right", backgroundOverlay:.70, backgroundBlur:0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"right-top", composerScale:.20, composerOverlap:.30, decorationOpacity:.98 },
  { styleId: "wps_sister", series: "WPS 家族", name: "WPS 小表姐", brandName:"小表姐", description: "WPS 红、表格网格、活力助手", primary:"#e75252", background:"#fff6f3", sidebar:"#f8e8e3", card:"#fffefd", text:"#382425", darkPrimary:"#ff7d75", darkBackground:"#211516", darkSidebar:"#2b1a1c", darkCard:"#3a2426", darkText:"#fff0ed", radius:18, asset:"/themes/wps-sister-scene.svg", brandAsset:"/themes/wps-sister-avatar-v2.png", hangerAsset:"/themes/wps-sister-hanger.png", backgroundScope:"content", backgroundFit:"cover", backgroundPosition:"right", backgroundOverlay:.69, backgroundBlur:0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"right-top", composerScale:.30, composerOverlap:.08, decorationOpacity:.98 },
  { styleId: "wps_sister_cheer", series: "WPS 家族", name: "小表姐加油", brandName:"小表姐", description: "俏皮眨眼、点赞鼓劲、珊瑚暖黄", primary:"#ef5b4f", background:"#fff8ed", sidebar:"#fbe8d4", card:"#fffefb", text:"#3c2924", darkPrimary:"#ff8c78", darkBackground:"#211815", darkSidebar:"#2c201b", darkCard:"#3a2a23", darkText:"#fff2e8", radius:22, asset:"/themes/wps-sister-cheer-scene.svg", brandAsset:"/themes/wps-sister-avatar-v2.png", hangerAsset:"/themes/wps-sister-cheer-hanger.png", backgroundScope:"content", backgroundFit:"cover", backgroundPosition:"right", backgroundOverlay:.70, backgroundBlur:0, composerDecorationEnabled:true, composerDecorationSource:"hanger", composerAnchor:"right-top", composerScale:.22, composerOverlap:.08, decorationOpacity:.99 }
];

const colorFields = ["primary", "background", "sidebar", "card", "text", "radius", "decorationOpacity", "backgroundOverlay", "backgroundBlur", "composerScale", "composerOverlap"];
const state = { brandImage: "", decorationImage: "", composerImage:"", decorationMode: "wallpaper", styleId: "claude", connected: false, sourceImage: null, darkPalette:null, previewMode:matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" };
const $ = selector => document.querySelector(selector);

function renderPresets() {
  $("#presets").innerHTML = presets.map((preset, index) => `
    <button class="preset" data-index="${index}" data-style="${preset.styleId}" data-series="${preset.series}" style="--preset-primary:${preset.primary};--preset-bg:${preset.background};--preset-sidebar:${preset.sidebar};${preset.asset ? `--preset-art:url('${preset.hangerAsset||preset.asset}')` : ""}">
      <span class="preset-swatch"><i class="side"></i><i class="orb"></i></span>
      <em>${preset.series}</em><strong>${preset.name}</strong><small>${preset.description}</small>
    </button>`).join("");
  document.querySelectorAll(".preset").forEach(button => button.addEventListener("click", () => applyPreset(presets[button.dataset.index], button)));
}

const themeAssetCache = new Map();
async function themeAssetDataUrl(asset, width=1920, height=1200) {
  const cacheKey = `${asset}:${width}x${height}`;
  if (themeAssetCache.has(cacheKey)) return themeAssetCache.get(cacheKey);
  const svg = await (await fetch(asset)).text();
  const source = URL.createObjectURL(new Blob([svg], { type:"image/svg+xml" }));
  try {
    const image = await new Promise((resolve,reject)=>{const item=new Image();item.onload=()=>resolve(item);item.onerror=reject;item.src=source;});
    const canvas = document.createElement("canvas"); canvas.width=width; canvas.height=height;
    canvas.getContext("2d").drawImage(image,0,0,width,height);
    const dataUrl = canvas.toDataURL("image/png",.92); themeAssetCache.set(cacheKey,dataUrl); return dataUrl;
  } finally { URL.revokeObjectURL(source); }
}

async function rawAssetDataUrl(asset) {
  const cacheKey=`raw:${asset}`;
  if(themeAssetCache.has(cacheKey)) return themeAssetCache.get(cacheKey);
  const blob=await (await fetch(asset)).blob();
  const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  themeAssetCache.set(cacheKey,dataUrl); return dataUrl;
}

async function applyPreset(preset, button) {
  button.disabled = true;
  Object.entries(preset).forEach(([key, value]) => { if ($(`#${key}`)) $(`#${key}`).value = value; });
  state.styleId = preset.styleId;
  state.darkPalette = { darkPrimary:preset.darkPrimary, darkBackground:preset.darkBackground, darkSidebar:preset.darkSidebar, darkCard:preset.darkCard, darkText:preset.darkText };
  if (preset.asset) {
    try {
      const brandSource = preset.brandAsset.endsWith(".svg") ? themeAssetDataUrl(preset.brandAsset,512,512) : rawAssetDataUrl(preset.brandAsset);
      const [wallpaper,brand,hanger] = await Promise.all([themeAssetDataUrl(preset.asset),brandSource,rawAssetDataUrl(preset.hangerAsset)]);
      state.decorationImage = wallpaper;
      state.brandImage = brand;
      state.composerImage = hanger;
      state.decorationMode = "wallpaper";
      $("#decorationOptions").hidden = false; $("#removeDecoration").hidden = false;
      $("#backgroundScope").value = preset.backgroundScope; $("#backgroundFit").value = preset.backgroundFit;
      $("#backgroundPosition").value = preset.backgroundPosition; $("#backgroundOverlay").value = Math.round(preset.backgroundOverlay*100);
      $("#backgroundBlur").value = preset.backgroundBlur;
      $("#brandName").value = preset.brandName;
      $("#brandPreview").style.backgroundImage = `url("${state.brandImage}")`; $("#brandPreview").textContent="";
      $("#removeBrandImage").hidden=false; $("#createLauncherButton").disabled=false;
      $("#composerDecorationEnabled").checked = true; $("#composerDecorationSource").value="hanger";
      $("#composerAnchor").value=preset.composerAnchor; $("#composerScale").value=Math.round(preset.composerScale*100); $("#composerOverlap").value=Math.round(preset.composerOverlap*100);
      $("#decorationOpacity").value=Math.round(preset.decorationOpacity*100);
      document.querySelectorAll("[data-decoration-mode]").forEach(item=>item.classList.toggle("active",item.dataset.decorationMode==="wallpaper"));
      renderDecorationControls();
    } catch { showNotice("主题背景加载失败，请重新选择一次。"); }
  } else {
    state.decorationImage=""; state.brandImage=""; state.composerImage=""; state.decorationMode="wallpaper";
    $("#brandName").value="灵犀"; $("#brandPreview").style.backgroundImage=""; $("#brandPreview").textContent="＋";
    $("#removeBrandImage").hidden=true; $("#createLauncherButton").disabled=true;
    $("#decorationOptions").hidden=true; $("#removeDecoration").hidden=true;
    $("#composerDecorationEnabled").checked=false; renderDecorationControls();
  }
  document.querySelectorAll(".preset").forEach(item => item.classList.toggle("active", item === button));
  updatePreview();
  button.disabled = false;
}

function mixHexColor(a,b,ratio){
  const parse=hex=>[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16));
  const [ar,ag,ab]=parse(a),[br,bg,bb]=parse(b);
  const channel=(x,y)=>Math.round(x*(1-ratio)+y*ratio).toString(16).padStart(2,"0");
  return `#${channel(ar,br)}${channel(ag,bg)}${channel(ab,bb)}`;
}

function derivedDarkPalette(light){
  return {
    darkPrimary:mixHexColor(light.primary,"#ffffff",.26),
    darkBackground:mixHexColor(light.background,"#0e1116",.9),
    darkSidebar:mixHexColor(light.sidebar,"#10141b",.86),
    darkCard:mixHexColor(light.card,"#1f2530",.82),
    darkText:mixHexColor(light.text,"#ffffff",.9)
  };
}

function currentTheme() {
  const light = {
    name: presets.find(item => item.styleId === state.styleId)?.name || "我的皮肤",
    styleId: state.styleId,
    primary: $("#primary").value,
    background: $("#background").value,
    sidebar: $("#sidebar").value,
    card: $("#card").value,
    text: $("#text").value,
    radius: Number($("#radius").value),
    brandImage: state.brandImage,
    brandName: $("#brandName").value.trim() || "灵犀",
    syncIdentityMemory: $("#syncIdentityMemory").checked,
    decorationImage: state.decorationImage,
    decorationOpacity: Number($("#decorationOpacity").value) / 100,
    decorationMode: state.decorationMode,
    composerImage: state.composerImage,
    composerDecorationEnabled: $("#composerDecorationEnabled").checked,
    composerDecorationSource: $("#composerDecorationSource").value,
    composerAnchor: $("#composerAnchor").value,
    composerScale: Number($("#composerScale").value) / 100,
    composerOverlap: Number($("#composerOverlap").value) / 100,
    backgroundScope: $("#backgroundScope").value,
    backgroundFit: $("#backgroundFit").value,
    backgroundPosition: $("#backgroundPosition").value,
    backgroundOverlay: Number($("#backgroundOverlay").value) / 100,
    backgroundBlur: Number($("#backgroundBlur").value),
    enabled: true
  };
  return { ...light, ...(state.darkPalette?.darkBackground ? state.darkPalette : derivedDarkPalette(light)) };
}

function setTheme(theme) {
  colorFields.forEach(key => {
    const element = $(`#${key}`);
    if (!element || theme[key] === undefined) return;
    element.value = ["decorationOpacity", "backgroundOverlay", "composerScale", "composerOverlap"].includes(key) ? Math.round(theme[key] * 100) : theme[key];
  });
  state.styleId = theme.styleId || "custom";
  state.darkPalette = theme.darkBackground ? {darkPrimary:theme.darkPrimary,darkBackground:theme.darkBackground,darkSidebar:theme.darkSidebar,darkCard:theme.darkCard,darkText:theme.darkText} : null;
  state.brandImage = theme.brandImage || "";
  state.decorationImage = theme.decorationImage || theme.image || "";
  state.composerImage = theme.composerImage || "";
  state.decorationMode = theme.decorationMode || theme.imageMode || "wallpaper";
  $("#backgroundScope").value = theme.backgroundScope || "content";
  $("#backgroundFit").value = theme.backgroundFit || "cover";
  $("#backgroundPosition").value = theme.backgroundPosition || "center";
  $("#composerDecorationEnabled").checked = Boolean(theme.composerDecorationEnabled);
  $("#composerDecorationSource").value = theme.composerDecorationSource || "brand";
  $("#composerAnchor").value = theme.composerAnchor || "right-top";
  $("#brandName").value = theme.brandName || "灵犀";
  $("#syncIdentityMemory").checked = theme.syncIdentityMemory !== false;
  $("#brandPreview").style.backgroundImage = state.brandImage ? `url("${state.brandImage}")` : "";
  $("#brandPreview").textContent = state.brandImage ? "" : "＋";
  $("#removeBrandImage").hidden = !state.brandImage;
  $("#createLauncherButton").disabled = !state.brandImage;
  $("#decorationOptions").hidden = !state.decorationImage;
  $("#removeDecoration").hidden = !state.decorationImage;
  document.querySelectorAll("[data-decoration-mode]").forEach(button => button.classList.toggle("active", button.dataset.decorationMode === state.decorationMode));
  renderDecorationControls();
  document.querySelectorAll(".preset").forEach(button => button.classList.toggle("active", presets[button.dataset.index]?.styleId === state.styleId));
  updatePreview();
}

function updatePreview() {
  const theme = currentTheme();
  const window = $("#mockWindow");
  const palette = state.previewMode === "dark" ? {primary:theme.darkPrimary,background:theme.darkBackground,sidebar:theme.darkSidebar,card:theme.darkCard,text:theme.darkText} : theme;
  window.dataset.style = state.styleId;
  window.dataset.mode = state.previewMode;
  window.style.setProperty("--preview-primary", palette.primary);
  window.style.setProperty("--preview-bg", palette.background);
  window.style.setProperty("--preview-sidebar", palette.sidebar);
  window.style.setProperty("--preview-card", palette.card);
  window.style.setProperty("--preview-text", palette.text);
  window.style.setProperty("--preview-radius", `${theme.radius}px`);
  $("#radiusValue").textContent = `${theme.radius}px`;
  $("#decorationOpacityValue").textContent = `${Math.round(theme.decorationOpacity * 100)}%`;
  $("#backgroundOverlayValue").textContent = `${Math.round(theme.backgroundOverlay * 100)}%`;
  $("#backgroundBlurValue").textContent = `${theme.backgroundBlur}px`;
  $("#composerScaleValue").textContent = `${Math.round(theme.composerScale * 100)}%`;
  $("#composerOverlapValue").textContent = `${Math.round(theme.composerOverlap * 100)}%`;
  $("#previewBrandName").textContent = theme.brandName;
  const logo = $("#previewLogo");
  logo.style.backgroundImage = state.brandImage ? `url("${state.brandImage}")` : "";
  logo.textContent = state.brandImage ? "" : "✦";
  const wallpaper = $("#mockWallpaper");
  const mascot = $("#mockMascot");
  const overlayHex = Math.round(theme.backgroundOverlay * 255).toString(16).padStart(2,"0");
  const wallpaperVisible = state.decorationMode === "wallpaper" && state.decorationImage;
  wallpaper.style.backgroundImage = wallpaperVisible ? `linear-gradient(${palette.background}${overlayHex},${palette.background}${overlayHex}),url("${state.decorationImage}")` : "";
  wallpaper.style.backgroundSize = ({cover:"cover",contain:"contain",original:"auto",tile:"120px auto"})[theme.backgroundFit];
  wallpaper.style.backgroundRepeat = theme.backgroundFit === "tile" ? "repeat" : "no-repeat";
  wallpaper.style.backgroundPosition = theme.backgroundPosition;
  wallpaper.style.left = theme.backgroundScope === "content" ? "19.1%" : "0";
  wallpaper.style.filter = `blur(${theme.backgroundBlur}px)`;
  wallpaper.style.opacity = wallpaperVisible ? 1 : 0;
  const composerSource = theme.composerDecorationSource === "hanger" ? state.composerImage : theme.composerDecorationSource === "decoration" ? state.decorationImage : state.brandImage;
  const mascotImage = composerSource || (state.decorationMode === "mascot" ? state.decorationImage : "");
  const mascotVisible = (theme.composerDecorationEnabled || state.decorationMode === "mascot") && mascotImage;
  mascot.style.backgroundImage = mascotVisible ? `url("${mascotImage}")` : "";
  mascot.style.display = mascotVisible ? "block" : "none";
  mascot.style.opacity = theme.decorationOpacity;
  if (mascotVisible) {
    const input = $("#mockInput"), windowBox = $("#mockWindow"), inputRect=input.getBoundingClientRect(), windowRect=windowBox.getBoundingClientRect();
    const inputLeft=inputRect.left-windowRect.left, inputTop=inputRect.top-windowRect.top;
    const width = Math.max(54, Math.min(125, input.offsetWidth * theme.composerScale));
    const overlap = width * theme.composerOverlap;
    const anchorRatio = theme.composerAnchor.startsWith("left") ? .14 : theme.composerAnchor.startsWith("right") ? .86 : .5;
    const bottomAnchor = theme.composerAnchor === "right-bottom" || theme.composerAnchor === "left-bottom";
    const left = inputLeft + input.offsetWidth * anchorRatio - width / 2;
    const top = bottomAnchor ? inputTop + input.offsetHeight - overlap : inputTop - width + overlap;
    mascot.style.width=`${width}px`; mascot.style.height=`${width}px`;
    mascot.style.left=`${Math.max(4,Math.min(windowBox.clientWidth-width-4,left))}px`; mascot.style.top=`${Math.max(4,Math.min(windowBox.clientHeight-width-4,top))}px`; mascot.style.right="auto"; mascot.style.bottom="auto";
  }
}

function renderDecorationControls() {
  const wallpaper = state.decorationMode === "wallpaper";
  $("#wallpaperOptions").hidden = !wallpaper;
  $("#mascotOpacityRow").hidden = !$("#composerDecorationEnabled").checked && state.decorationMode !== "mascot";
  $("#composerOptions").classList.toggle("enabled", $("#composerDecorationEnabled").checked);
}

function rgbToHex({ r, g, b }) { return `#${[r,g,b].map(value => Math.max(0,Math.min(255,Math.round(value))).toString(16).padStart(2,"0")).join("")}`; }
function mixRgb(a, b, ratio) { return { r: a.r*(1-ratio)+b.r*ratio, g: a.g*(1-ratio)+b.g*ratio, b: a.b*(1-ratio)+b.b*ratio }; }
function luminance(color) { return (.2126*color.r + .7152*color.g + .0722*color.b)/255; }
function saturation(color) { const max=Math.max(color.r,color.g,color.b), min=Math.min(color.r,color.g,color.b); return max ? (max-min)/max : 0; }

async function extractDesignerPalette(dataUrl) {
  const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=dataUrl; });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 72;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, 72, 72);
  const pixels = ctx.getImageData(0,0,72,72).data;
  const bins = new Map();
  for (let i=0;i<pixels.length;i+=16) {
    if (pixels[i+3] < 160) continue;
    const color = { r:pixels[i], g:pixels[i+1], b:pixels[i+2] };
    if (luminance(color) > .97 || luminance(color) < .025) continue;
    const key = `${Math.round(color.r/24)*24},${Math.round(color.g/24)*24},${Math.round(color.b/24)*24}`;
    const entry = bins.get(key) || { ...color, count:0 };
    entry.count += 1; bins.set(key, entry);
  }
  const colors = [...bins.values()].sort((a,b)=>b.count-a.count).slice(0,24);
  const fallback = { r:116,g:87,b:232,count:1 };
  const accent = colors.filter(c=>luminance(c)>.15&&luminance(c)<.82).sort((a,b)=>(saturation(b)*1.7+b.count/colors[0]?.count)-(saturation(a)*1.7+a.count/colors[0]?.count))[0] || colors[0] || fallback;
  const darkCandidate = [...colors].sort((a,b)=>luminance(a)-luminance(b))[0] || {r:35,g:33,b:40};
  const light = {r:255,g:255,b:255};
  const dark = {r:28,g:28,b:31};
  const accentIsDark = luminance(accent) < .42;
  const background = mixRgb(accent, light, accentIsDark ? .91 : .88);
  const sidebar = mixRgb(accent, light, accentIsDark ? .83 : .78);
  const card = mixRgb(accent, light, .965);
  const text = luminance(darkCandidate) < .36 ? mixRgb(darkCandidate,dark,.2) : dark;
  return { primary:rgbToHex(accent), background:rgbToHex(background), sidebar:rgbToHex(sidebar), card:rgbToHex(card), text:rgbToHex(text) };
}

async function applyExtractedPalette() {
  if (!state.brandImage) return;
  try {
    const palette = await extractDesignerPalette(state.brandImage);
    Object.entries(palette).forEach(([key,value]) => $(`#${key}`).value = value);
    state.styleId = "custom";
    document.querySelectorAll(".preset").forEach(item => item.classList.remove("active"));
    $("#paletteResult").hidden = false;
    $("#paletteChips").innerHTML = Object.values(palette).map(color => `<i style="background:${color}" title="${color}"></i>`).join("");
    updatePreview();
    showNotice("已从形象中提取主色，并生成一套有对比度的界面配色。", true);
  } catch { showNotice("自动取色失败，你仍可以手动调整颜色。"); }
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "操作失败");
  return data;
}
function showNotice(message, success=false) { $("#notice").textContent=message; $("#notice").classList.toggle("success",success); }
function setBusy(button,busy,text) { if(!button.dataset.label) button.dataset.label=button.textContent; button.disabled=busy; button.textContent=busy?text:button.dataset.label; }
function renderStatus(status) {
  $("#launcherDescription").textContent="把这套 Logo 和名称生成到 Finder、启动台或程序坞；实际运行的仍是官方 WPS 灵犀。";
  state.connected=status.connected; $("#statusCard").classList.toggle("connected",status.connected);
  if(status.connected){$("#statusTitle").textContent="已连接灵犀";$("#statusText").textContent=status.enabled?"皮肤会在刷新后自动恢复":"可以直接应用皮肤";$("#actionHint").textContent="已连接，可以即时应用和调整";}
  else if(status.running){$("#statusTitle").textContent="灵犀正在运行";$("#statusText").textContent="需要重新启动一次以开启换肤";$("#actionHint").textContent="点击下方按钮重新连接，不会删除会话";}
  else{$("#statusTitle").textContent="等待连接灵犀";$("#statusText").textContent="保存后连接即可应用";$("#actionHint").textContent="第一次使用需要启动一次灵犀";}
}
async function refreshStatus(){try{renderStatus(await api("/api/status"));}catch{$("#statusTitle").textContent="管理器连接异常";}}
async function saveAndApply(){const b=$("#applyButton");setBusy(b,true,"正在应用…");showNotice("");try{const r=await api("/api/theme",{method:"POST",body:JSON.stringify(currentTheme())});renderStatus(r.status);const memory=r.memorySynced?"，名称已同步到记忆":"";showNotice(r.applied?`Logo、名称和皮肤已应用${memory}。`:"皮肤已保存，请点击“连接并重新启动灵犀”。",r.applied);}catch(e){showNotice(e.message);}finally{setBusy(b,false);}}
async function restartAndConnect(){const b=$("#connectButton");setBusy(b,true,"正在重新连接，约需几秒…");showNotice("灵犀会短暂关闭并重新打开，正在等待主界面加载。",true);try{await api("/api/theme",{method:"POST",body:JSON.stringify(currentTheme())});const r=await api("/api/restart",{method:"POST",body:"{}"});renderStatus(r.status);showNotice(`连接成功，Logo、名称和皮肤均已生效${r.memorySynced?"，名称已同步到记忆":""}。`,true);}catch(e){showNotice(`连接失败：${e.message}`);}finally{setBusy(b,false);}}
async function createPersonalLauncher(){const b=$("#createLauncherButton");if(!state.brandImage)return showNotice("请先上传 Logo 或形象，再生成应用入口。");setBusy(b,true,"正在生成…");try{await api("/api/theme",{method:"POST",body:JSON.stringify(currentTheme())});const r=await api("/api/create-launcher",{method:"POST",body:"{}"});showNotice(`已生成“${r.appName}”应用入口，并放到${r.locationLabel||"本机应用目录"}。`,true);}catch(e){showNotice(`生成失败：${e.message}`);}finally{setBusy(b,false);b.disabled=!state.brandImage;}}
async function resetTheme(){const b=$("#resetButton");setBusy(b,true,"恢复中…");try{const r=await api("/api/reset",{method:"POST",body:"{}"});setTheme(r.theme||{...presets[0],brandImage:"",brandName:"灵犀",syncIdentityMemory:true,decorationImage:"",decorationOpacity:.22,decorationMode:"wallpaper",backgroundScope:"content",backgroundFit:"cover",backgroundPosition:"center",backgroundOverlay:.52,backgroundBlur:0,enabled:false});$("#paletteResult").hidden=true;renderStatus(r.status);showNotice(r.applied?`已恢复灵犀默认 Logo、名称和皮肤${r.memoryRemoved?"，并移除品牌身份记忆":""}。`:"已取消皮肤，下次连接时保持默认。",true);}catch(e){showNotice(e.message);}finally{setBusy(b,false);}}

function loadImage(file, kind) {
  if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type)) return showNotice("请选择 PNG、JPG 或 WebP 图片。");
  if(file.size>5*1024*1024) return showNotice("图片超过 5MB，请压缩后再上传。");
  const reader=new FileReader();
  reader.onload=async()=>{
    if(kind==="brand"){
      state.brandImage=reader.result;state.sourceImage=file;$("#brandPreview").style.backgroundImage=`url("${state.brandImage}")`;$("#brandPreview").textContent="";$("#removeBrandImage").hidden=false;$("#createLauncherButton").disabled=false;await applyExtractedPalette();
    }else{
      state.decorationImage=reader.result;$("#decorationOptions").hidden=false;$("#removeDecoration").hidden=false;renderDecorationControls();showNotice("装饰图片已加入预览，点击应用后生效。",true);
    }
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function bindUpload(zoneSelector,inputSelector,kind){const zone=$(zoneSelector),input=$(inputSelector);zone.addEventListener("click",e=>{if(!e.target.classList.contains("text-button"))input.click();});zone.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")input.click();});input.addEventListener("change",e=>loadImage(e.target.files[0],kind));zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("drag");});zone.addEventListener("dragleave",()=>zone.classList.remove("drag"));zone.addEventListener("drop",e=>{e.preventDefault();zone.classList.remove("drag");loadImage(e.dataTransfer.files[0],kind);});}

renderPresets();
$("#previewModeToggle").textContent=state.previewMode==="dark"?"切到日间":"切到夜间";
colorFields.forEach(key=>$("#"+key).addEventListener("input",()=>{if(key!=="decorationOpacity"){state.styleId="custom";state.darkPalette=null;}updatePreview();}));
$("#previewModeToggle").addEventListener("click",()=>{state.previewMode=state.previewMode==="dark"?"light":"dark";$("#previewModeToggle").textContent=state.previewMode==="dark"?"切到日间":"切到夜间";updatePreview();});
$("#brandName").addEventListener("input",updatePreview);
document.querySelectorAll("[data-decoration-mode]").forEach(button=>button.addEventListener("click",()=>{state.decorationMode=button.dataset.decorationMode;if(state.decorationMode==="mascot"){$("#composerDecorationEnabled").checked=true;$("#composerDecorationSource").value="decoration";}document.querySelectorAll("[data-decoration-mode]").forEach(item=>item.classList.toggle("active",item===button));renderDecorationControls();updatePreview();}));
document.querySelectorAll("#backgroundScope,#backgroundFit,#backgroundPosition,#composerDecorationSource,#composerAnchor").forEach(element=>element.addEventListener("change",updatePreview));
$("#composerDecorationEnabled").addEventListener("change",()=>{renderDecorationControls();updatePreview();});
bindUpload("#brandUploadZone","#brandImageInput","brand");
bindUpload("#decorationUploadZone","#decorationImageInput","decoration");
$("#removeBrandImage").addEventListener("click",e=>{e.stopPropagation();state.brandImage="";$("#brandImageInput").value="";$("#brandPreview").style.backgroundImage="";$("#brandPreview").textContent="＋";$("#paletteResult").hidden=true;$("#createLauncherButton").disabled=true;e.currentTarget.hidden=true;updatePreview();});
$("#removeDecoration").addEventListener("click",e=>{e.stopPropagation();state.decorationImage="";$("#decorationImageInput").value="";$("#decorationOptions").hidden=true;e.currentTarget.hidden=true;updatePreview();});
$("#reExtractPalette").addEventListener("click",applyExtractedPalette);
$("#applyButton").addEventListener("click",saveAndApply);
$("#connectButton").addEventListener("click",restartAndConnect);
$("#createLauncherButton").addEventListener("click",createPersonalLauncher);
$("#resetButton").addEventListener("click",resetTheme);

const saved=await api("/api/theme").catch(()=>({...presets[0],brandImage:"",brandName:"灵犀",decorationOpacity:.22,backgroundOverlay:.52,backgroundBlur:0}));
setTheme(saved);await refreshStatus();setInterval(refreshStatus,4000);
