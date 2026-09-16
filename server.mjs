import { createServer } from "node:http";
import next from "next";
import { WebSocketServer, WebSocket as WS } from "ws";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const backendWsUrl = `${backendUrl.replace(/^http/, "ws")}/ws/chat`;

// Keep in sync with SESSION_COOKIE in src/lib/session.ts — the WebSocket
// upgrade is a plain HTTP request outside Next's request pipeline, so we
// can't use next/headers here and read the cookie manually instead.
const SESSION_COOKIE = "geomap_token";

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const handleUpgrade = app.getUpgradeHandler();
  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    if (pathname !== "/ws/chat") {
      // Not our chat socket — hand it back to Next itself, which needs the
      // upgrade path for its own HMR WebSocket in dev.
      handleUpgrade(req, socket, head);
      return;
    }

    const token = getCookie(req.headers.cookie, SESSION_COOKIE);
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (clientWs) => {
      // The JWT never reaches the browser: it's read from the httpOnly
      // cookie above and only ever attached to the outbound backend
      // connection made here, server-side.
      const backendWs = new WS(`${backendWsUrl}?token=${encodeURIComponent(token)}`);
      const pending = [];
      let backendOpen = false;

      const closeBoth = () => {
        if (clientWs.readyState === WS.OPEN) clientWs.close();
        if (backendWs.readyState === WS.OPEN || backendWs.readyState === WS.CONNECTING) {
          backendWs.close();
        }
      };

      backendWs.on("open", () => {
        backendOpen = true;
        for (const msg of pending.splice(0)) backendWs.send(msg);
      });

      clientWs.on("message", (data) => {
        const text = data.toString();
        if (backendOpen) backendWs.send(text);
        else pending.push(text);
      });

      backendWs.on("message", (data) => {
        if (clientWs.readyState === WS.OPEN) clientWs.send(data.toString());
      });

      clientWs.on("close", closeBoth);
      clientWs.on("error", closeBoth);
      backendWs.on("close", closeBoth);
      backendWs.on("error", closeBoth);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (${dev ? "dev" : "production"})`);
  });
});
