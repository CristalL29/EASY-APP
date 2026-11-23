import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

function getRoom(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.room && typeof payload.room === "object") return payload.room;
  if (payload.code || payload.options || payload.players || payload.participants) return payload;
  return null;
}

function getUser(payload) {
  return payload?.currentUser ?? payload?.user ?? payload?.player ?? null;
}

function getMessage(payload, fallback) {
  if (typeof payload === "string") return payload;
  return payload?.message ?? payload?.error ?? payload?.reason ?? fallback;
}

export default function useSocket() {
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_SOCKET_URL;
    return io(url || window.location.origin, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }, []);
  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [notice, setNotice] = useState(null);
  const [spinResult, setSpinResult] = useState(null);

  const applyRoomPayload = useCallback((payload) => {
    const nextRoom = getRoom(payload);
    if (nextRoom) setRoom(nextRoom);
    const nextUser = getUser(payload);
    if (nextUser) setCurrentUser(nextUser);
    if (payload?.currentUserId && !nextUser) {
      setCurrentUser((current) => current ?? { id: payload.currentUserId });
    } else if (nextRoom && socket.id) {
      setCurrentUser((current) => current ?? { id: socket.id });
    }
  }, [socket]);

  useEffect(() => {
    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    const onConnectError = (error) => {
      setConnection("error");
      setNotice({ type: "error", message: `No se pudo conectar con el servidor: ${error.message}` });
    };
    const onRoomError = (payload) => {
      setNotice({ type: "error", message: getMessage(payload, "El servidor rechazó la solicitud.") });
    };
    const onRoomSuccess = (payload) => {
      applyRoomPayload(payload);
      setNotice(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:created", onRoomSuccess);
    socket.on("room:joined", onRoomSuccess);
    socket.on("room:update", onRoomSuccess);
    socket.on("room:updated", onRoomSuccess);
    socket.on("room:state", onRoomSuccess);
    socket.on("room:error", onRoomError);
    socket.on("room:join:error", onRoomError);
    socket.on("room:create:error", onRoomError);
    socket.on("error", onRoomError);
    socket.on("roulette:spin", setSpinResult);
    socket.on("roulette:result", setSpinResult);

    socket.connect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room:created", onRoomSuccess);
      socket.off("room:joined", onRoomSuccess);
      socket.off("room:update", onRoomSuccess);
      socket.off("room:updated", onRoomSuccess);
      socket.off("room:state", onRoomSuccess);
      socket.off("room:error", onRoomError);
      socket.off("room:join:error", onRoomError);
      socket.off("room:create:error", onRoomError);
      socket.off("error", onRoomError);
      socket.off("roulette:spin", setSpinResult);
      socket.off("roulette:result", setSpinResult);
      socket.disconnect();
    };
  }, [applyRoomPayload, socket]);

  const emit = useCallback((event, payload, { onAck } = {}) => {
    if (!socket.connected) {
      setNotice({ type: "error", message: "No hay conexión con el servidor. Inténtalo de nuevo en unos segundos." });
      return false;
    }

    socket.emit(event, payload, (response) => {
      if (response?.ok === false || response?.error) {
        setNotice({ type: "error", message: getMessage(response, "No se pudo completar la acción.") });
        return;
      }
      if (response) applyRoomPayload(response);
      onAck?.(response);
    });
    return true;
  }, [applyRoomPayload, socket]);

  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    room,
    currentUser,
    connection,
    notice,
    spinResult,
    emit,
    applyRoomPayload,
    setNotice,
    clearNotice,
  };
}
