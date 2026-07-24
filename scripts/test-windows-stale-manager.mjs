import http from "node:http";

if (!process.argv.includes("--legacy-server")) {
  throw new Error("Use --legacy-server to run the stale-manager fixture.");
}

const server = http.createServer((request, response) => {
  if (request.url === "/api/status") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      platform: "win32",
      running: false,
      connected: false,
      enabled: false,
      lastInjectionAt: null,
      lastError: ""
    }));
    return;
  }
  if (request.url === "/api/meta") {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "legacy manager" }));
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end("<!doctype html><title>灵犀皮肤管理器</title><h1>把灵犀换成你的样子</h1>");
});

server.listen(17363, "127.0.0.1", () => {
  console.log("Legacy manager fixture: http://127.0.0.1:17363");
});
