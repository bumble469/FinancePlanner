import type { Server } from "socket.io";

declare global {
  var __io: Server | undefined;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  const io = global.__io;
  if (!io) {
    console.warn("[socket] io not initialized — is the app running via server.js?");
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}