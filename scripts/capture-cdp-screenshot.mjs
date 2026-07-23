import fs from "node:fs/promises";

const outputPath = process.argv[2];
if (!outputPath) throw new Error("Usage: node capture-cdp-screenshot.mjs <output.png>");
const waitForContent = process.argv.includes("--wait-for-content");

const targets = await fetch("http://127.0.0.1:9229/json/list").then(response => response.json());
const pages = targets.filter(target => target.type === "page" && target.webSocketDebuggerUrl);
if (!pages.length) throw new Error("No debuggable Lingxi page was found.");

const target = pages.find(page => /lingxi|kdocs|wps/i.test(`${page.url} ${page.title}`)) || pages[0];
console.log(`Capturing target: ${target.title || "(untitled)"} ${target.url}`);

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result || {});
});

function send(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

try {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });
  if (waitForContent) {
    const deadline = Date.now() + 90_000;
    let state;
    do {
      const evaluated = await send("Runtime.evaluate", {
        expression: `JSON.stringify({
          readyState: document.readyState,
          textLength: (document.body?.innerText || "").trim().length,
          htmlLength: (document.body?.innerHTML || "").length,
          url: location.href
        })`,
        returnByValue: true
      });
      state = JSON.parse(evaluated.result?.value || "{}");
      if (
        /^https?:/i.test(state.url || "") &&
        state.readyState === "complete" &&
        state.textLength >= 20 &&
        state.htmlLength >= 200
      ) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } while (Date.now() < deadline);
    if ((state?.textLength || 0) < 20) {
      throw new Error(`Lingxi did not render meaningful page content within 90 seconds: ${JSON.stringify(state)}`);
    }
    console.log(`Rendered page ready: ${JSON.stringify(state)}`);
  }
  await new Promise(resolve => setTimeout(resolve, 1500));
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  await fs.writeFile(outputPath, Buffer.from(data, "base64"));
  console.log(`Saved Windows Lingxi screenshot: ${outputPath}`);
} finally {
  socket.close();
}
