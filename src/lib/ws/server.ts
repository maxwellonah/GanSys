import type { IncomingMessage } from "node:http";
import type { WebSocket as WsSocket } from "ws";
import { WebSocketServer } from "ws";

import type { WsMessage } from "@/lib/types";

// Per-user socket registry: userId → set of open sockets
const registry = new Map<string, Set<WsSocket>>();

declare global {
  // eslint-disable-next-line no-var
  var __gansys_wss__: WebSocketServer | undefined;
}

export function broadcastToUser(userId: string, message: WsMessage): void {
  const sockets = registry.get(userId);
  if (!sockets?.size) return;
  const payload = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket.readyState === 1 /* OPEN */) {
      socket.send(payload);
    } else {
      sockets.delete(socket);
    }
  }
}

export function registerSocket(userId: string, socket: WsSocket): void {
  const sockets = registry.get(userId) ?? new Set();
  sockets.add(socket);
  registry.set(userId, sockets);

  socket.on("close", () => {
    sockets.delete(socket);
    if (!sockets.size) registry.delete(userId);
  });
}

export function createWss(): WebSocketServer {
  if (globalThis.__gansys_wss__) return globalThis.__gansys_wss__;

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (socket: WsSocket, req: IncomingMessage) => {
    // userId is passed as a query param: /api/ws?userId=xxx
    // In production this should be validated against the session cookie.
    const url = new URL(req.url ?? "", "http://localhost");
    const userId = url.searchParams.get("userId");
    if (!userId) {
      socket.close(4001, "Missing userId");
      return;
    }
    registerSocket(userId, socket);
    socket.send(JSON.stringify({ type: "connected" }));
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__gansys_wss__ = wss;
  }

  return wss;
}
