import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { createDemoCode, createDemoRoom } from "../utils/demoData.js";

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
  const isDemo = import.meta.env.VITE_USE_MOCK_DATA !== "false";
  const socket = useMemo(() => {
    if (isDemo) return null;
    const url = import.meta.env.VITE_SOCKET_URL;
    return io(url || window.location.origin, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }, [isDemo]);
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
    } else if (nextRoom && socket?.id) {
      setCurrentUser((current) => current ?? { id: socket.id });
    }
  }, [socket]);

  useEffect(() => {
    if (isDemo) {
      setConnection("connected");
      return undefined;
    }

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
  }, [applyRoomPayload, isDemo, socket]);

  const emit = useCallback((event, payload, { onAck } = {}) => {
    if (isDemo) {
      if (event === "room:create" || event === "room:join") {
        const code = event === "room:create" ? createDemoCode() : payload.code;
        const nextRoom = createDemoRoom({
          nickname: payload.nickname,
          category: payload.category ?? "Otro",
          code,
        });
        const user = nextRoom.players[0];
        setRoom(nextRoom);
        setCurrentUser(user);
        setSpinResult(null);
        setNotice(null);
        onAck?.({ ok: true, room: nextRoom, currentUser: user });
        return true;
      }

      if (!room) {
        setNotice({ type: "error", message: "Primero crea o únete a una sala demo." });
        return false;
      }

      if (event === "option:add") {
        setRoom((current) => ({
          ...current,
          options: [...current.options, {
            id: `demo-option-${Math.random().toString(36).slice(2, 10)}`,
            text: payload.text,
            authorId: currentUser?.id,
            isEliminated: false,
          }],
        }));
      } else if (event === "option:edit") {
        setRoom((current) => ({
          ...current,
          options: current.options.map((option) =>
            option.id === payload.optionId ? { ...option, text: payload.text } : option,
          ),
        }));
      } else if (event === "option:delete") {
        setRoom((current) => ({
          ...current,
          options: current.options.filter((option) => option.id !== payload.optionId),
        }));
      } else if (event === "game:start") {
        setRoom((current) => ({
          ...current,
          mode: payload.mode,
          status: "playing",
          eliminationState: {
            turnOrder: [currentUser?.id],
            currentTurnIndex: 0,
            turnStartedAt: new Date().toISOString(),
          },
          consensusState: { status: "voting", votedUserIds: [] },
          results: null,
          winner: null,
        }));
        setSpinResult(null);
      } else if (event === "roulette:spin") {
        const available = room.options.filter((option) => !option.isEliminated);
        const winner = available[Math.floor(Math.random() * available.length)];
        if (winner) setSpinResult({ winnerId: winner.id, createdAt: Date.now() });
      } else if (event === "elimination:ban") {
        setRoom((current) => ({
          ...current,
          options: current.options.map((option) =>
            option.id === payload.optionId ? { ...option, isEliminated: true } : option,
          ),
          eliminationState: {
            ...current.eliminationState,
            turnStartedAt: new Date().toISOString(),
          },
        }));
      } else if (event === "consensus:vote") {
        const votes = new Map(payload.votes.map(({ optionId, vote }) => [optionId, vote]));
        const options = room.options.map((option, index) => {
          const ownVote = votes.get(option.id);
          const approvals = Math.max(0, room.players.length - 1 - index);
          return {
            ...option,
            approvals: approvals + (ownVote === "LIKE" ? 1 : 0) - (ownVote === "DISLIKE" ? 1 : 0),
            disapprovals: index + (ownVote === "DISLIKE" ? 1 : 0),
          };
        });
        const winner = [...options].sort((a, b) => b.approvals - a.approvals)[0];
        setRoom((current) => ({
          ...current,
          options,
          winner: winner?.id,
          status: "results",
          results: { winner: winner?.id },
          consensusState: { status: "results", votedUserIds: current.players.map((player) => player.id) },
        }));
      } else if (event === "roulette:reroll") {
        setRoom((current) => ({
          ...current,
          mode: "roulette",
          status: "playing",
          options: current.options.map((option) =>
            option.id === payload.excludedOptionId ? { ...option, isEliminated: true } : option,
          ),
          winner: null,
          results: null,
        }));
        setSpinResult(null);
      } else if (event === "roulette:start") {
        const optionIds = new Set(payload.optionIds);
        setRoom((current) => ({
          ...current,
          mode: "roulette",
          status: "playing",
          options: current.options.map((option) => ({
            ...option,
            isEliminated: !optionIds.has(option.id),
          })),
          winner: null,
          results: null,
        }));
        setSpinResult(null);
      }

      setNotice(null);
      return true;
    }

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
  }, [applyRoomPayload, currentUser, isDemo, room, socket]);

  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    room,
    currentUser,
    connection,
    isDemo,
    notice,
    spinResult,
    emit,
    applyRoomPayload,
    setNotice,
    clearNotice,
  };
}
