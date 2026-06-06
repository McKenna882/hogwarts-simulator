import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

var SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

interface UseSocketOptions {
  onMessageNew?: (msg: any) => void;
  onMessageStream?: (data: { messageId: string; chunk: string; conversationId: string }) => void;
  onMessageDone?: (data: { messageId: string; conversationId: string; content: string; createdAt: string }) => void;
  onMessageError?: (data: { message: string }) => void;
}

var globalSocket: Socket | null = null;

export function getSocket() { return globalSocket; }

export function useSocket(opts: UseSocketOptions) {
  var socketRef = useRef<Socket | null>(null);
  var optsRef = useRef(opts);
  optsRef.current = opts;

  var connect = useCallback(function () {
    var token = useAuthStore.getState().accessToken;
    if (!token || (socketRef.current && socketRef.current.connected)) return;
    var socket = io(SOCKET_URL + "/ws", {
      query: { token: token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socket.on("connect", function () { console.log("WS connected"); });
    socket.on("disconnect", function () { console.log("WS disconnected"); });
    socket.on("message:new", function (msg: any) { if (optsRef.current.onMessageNew) optsRef.current.onMessageNew(msg); });
    socket.on("message:stream", function (data: any) { if (optsRef.current.onMessageStream) optsRef.current.onMessageStream(data); });
    socket.on("message:done", function (data: any) { if (optsRef.current.onMessageDone) optsRef.current.onMessageDone(data); });
    socket.on("message:error", function (data: any) { if (optsRef.current.onMessageError) optsRef.current.onMessageError(data); });
    socketRef.current = socket;
    globalSocket = socket;
  }, []);

  var disconnect = useCallback(function () {
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = null;
    globalSocket = null;
  }, []);

  var sendMessage = useCallback(function (convId: string, content: string) {
    if (socketRef.current) socketRef.current.emit("chat:send", { conversationId: convId, content: content });
  }, []);

  var joinRoom = useCallback(function (convId: string) {
    if (socketRef.current) socketRef.current.emit("chat:join", convId);
  }, []);

  var leaveRoom = useCallback(function (convId: string) {
    if (socketRef.current) socketRef.current.emit("chat:leave", convId);
  }, []);

  useEffect(function () {
    return function () { disconnect(); };
  }, []);

  return { connect: connect, disconnect: disconnect, sendMessage: sendMessage, joinRoom: joinRoom, leaveRoom: leaveRoom };
}
