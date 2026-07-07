const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
const jose = require("jose");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const token = parseCookie(socket.handshake.headers.cookie, "access_token");
      if (!token) return next(new Error("Unauthorized"));
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (typeof payload.sub !== "string") return next(new Error("Unauthorized"));
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  global.__io = io;

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});