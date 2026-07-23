const targets = await fetch("http://127.0.0.1:9229/json/list").then(response => response.json());
const pages = targets.filter(target => target.type === "page" && target.webSocketDebuggerUrl);
if (!pages.length) throw new Error("No debuggable Lingxi page was found.");

const target = pages.find(page => /lingxi|kdocs|wps/i.test(`${page.url} ${page.title}`)) || pages[0];
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
  const evaluated = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      title: document.title,
      url: location.href,
      readyState: document.readyState,
      text: (document.body?.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 4000),
      hasLoginButton: [...document.querySelectorAll("button, a, [role=button], div")].some(element => {
        const rect = element.getBoundingClientRect();
        return element.textContent?.trim() === "登录" && rect.width > 20 && rect.height > 15;
      }),
      htmlLength: (document.body?.innerHTML || "").length
    })`,
    returnByValue: true
  });
  console.log(evaluated.result?.value || "{}");
} finally {
  socket.close();
}
