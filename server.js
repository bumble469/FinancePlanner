const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

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
    } catch (err) {
      console.error("[socket auth] verify failed:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  const editLocks = new Map(); // key: `${planId}:${itemType}:${itemId}` -> { userId, userName, socketId, updatedAt }
  const LOCK_TTL_MS = 90_000;

  function lockKey(planId, itemType, itemId) {
    return `${planId}:${itemType}:${itemId}`;
  }

  setInterval(() => {
    const now = Date.now();
    for (const [key, lock] of editLocks.entries()) {
      if (now - lock.updatedAt > LOCK_TTL_MS) {
        editLocks.delete(key);
        const [planId, itemType, itemId] = key.split(":");
        io.to(`plan:${planId}`).emit("editing:lock-released", { itemType, itemId });
      }
    }
  }, 30_000);

  io.on("connection", (socket) => {
    console.log("[socket] user connected:", socket.data.userId);
    socket.join(`user:${socket.data.userId}`);

    socket.on("join-plan", (planId) => {
      socket.join(`plan:${planId}`);
    });

    socket.on("leave-plan", (planId) => {
      socket.leave(`plan:${planId}`);
    });

    socket.on("editing:request-lock", ({ planId, itemType, itemId, userName }, cb) => {
      const key = lockKey(planId, itemType, itemId);
      const existing = editLocks.get(key);

      if (existing && existing.socketId !== socket.id) {
        return cb({ granted: false, lockedByName: existing.userName });
      }

      editLocks.set(key, { userId: socket.data.userId, userName, socketId: socket.id, updatedAt: Date.now() });
      socket.join(`editing:${key}`);
      socket.to(`plan:${planId}`).emit("editing:lock-granted-broadcast", { itemType, itemId, userName });
      cb({ granted: true });
    });

    socket.on("editing:heartbeat", ({ planId, itemType, itemId }) => {
      const key = lockKey(planId, itemType, itemId);
      const existing = editLocks.get(key);
      if (existing && existing.socketId === socket.id) {
        existing.updatedAt = Date.now();
      }
    });

    socket.on("editing:release-lock", ({ planId, itemType, itemId }) => {
      const key = lockKey(planId, itemType, itemId);
      const existing = editLocks.get(key);
      if (existing && existing.socketId === socket.id) {
        editLocks.delete(key);
        io.to(`plan:${planId}`).emit("editing:lock-released", { itemType, itemId });
      }
    });

    socket.on("disconnect", () => {
      for (const [key, lock] of editLocks.entries()) {
        if (lock.socketId === socket.id) {
          editLocks.delete(key);
          const [planId, itemType, itemId] = key.split(":");
          io.to(`plan:${planId}`).emit("editing:lock-released", { itemType, itemId });
        }
      }
    });
  });

  global.__io = io;

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});