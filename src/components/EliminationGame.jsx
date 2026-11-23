import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, ShieldX, Trophy } from "lucide-react";
import {
  getOptionId, getOptionText, getOptions, getPlayerId, getPlayerName,
  getPlayers, getRoomCode, sameId,
} from "../utils/room.js";

function getTurnId(turn) {
  return turn && typeof turn === "object" ? getPlayerId(turn) : turn;
}

export default function EliminationGame({ room, currentUser, emit }) {
  const options = getOptions(room);
  const players = getPlayers(room);
  const state = room?.eliminationState ?? room?.gameState?.elimination ?? {};
  const order = Array.isArray(state.turnOrder) ? state.turnOrder : players.map(getPlayerId);
  const turnIndex = Number(state.currentTurnIndex ?? 0);
  const currentTurn = order[turnIndex];
  const turnId = getTurnId(currentTurn);
  const playerOnTurn = players.find((player) => sameId(getPlayerId(player), turnId));
  const isMyTurn = sameId(currentUser?.id ?? currentUser?._id, turnId);
  const activeOptions = useMemo(() => options.filter((option) => !option.isEliminated), [options]);
  const code = getRoomCode(room);
  const deadline = state.deadlineAt ? new Date(state.deadlineAt).getTime()
    : state.turnStartedAt ? new Date(state.turnStartedAt).getTime() + 15000
      : null;
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const activeDeadline = deadline != null && Number.isFinite(deadline)
      ? deadline
      : Date.now() + 15000;
    const updateTime = () => {
      setSecondsLeft(Math.max(0, Math.ceil((activeDeadline - Date.now()) / 1000)));
    };
    updateTime();
    const timer = window.setInterval(updateTime, 250);
    return () => window.clearInterval(timer);
  }, [deadline, turnIndex, turnId]);

  const turnName = playerOnTurn
    ? getPlayerName(playerOnTurn)
    : currentTurn && typeof currentTurn === "object"
      ? getPlayerName(currentTurn)
      : "Participante";
  const winner = room?.winner ?? state.winner ?? activeOptions[0];

  return (
    <main className="page-glow min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft size={17} /> Sala {code}</a>
        <section className="rounded-3xl border border-white bg-white p-6 shadow-soft sm:p-9">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Modo de decisión</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Eliminación por turnos</h1>
            <p className="mt-2 text-sm text-muted">El grupo elimina opciones hasta que quede una.</p>
          </div>

          {activeOptions.length <= 1 ? (
            <div className="mt-8 rounded-2xl bg-emerald-50 p-7 text-center text-emerald-800">
              <Trophy className="mx-auto mb-3" size={30} />
              <p className="text-sm font-bold uppercase tracking-wide">¡Decisión tomada!</p>
              <p className="mt-2 text-2xl font-black">{getOptionText(winner ?? {}) || "Sin opciones restantes"}</p>
            </div>
          ) : (
            <>
              <div className="mx-auto mt-7 flex max-w-md items-center justify-between gap-4 rounded-2xl bg-brand-50 px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{isMyTurn ? "Es tu turno" : "Turno actual"}</p>
                  <p className="mt-1 text-lg font-extrabold text-ink">{turnName}</p>
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-black ${
                  secondsLeft <= 5 ? "bg-rose-100 text-rose-700" : "bg-white text-brand-700"
                }`}>
                  <Clock3 size={18} /> 00:{String(secondsLeft).padStart(2, "0")}
                </div>
              </div>
              <p className="mb-4 mt-7 text-center text-sm font-semibold text-muted">
                {isMyTurn ? "Elige la opción que quieres eliminar" : "Esperando a que la persona elija…"}
              </p>
              <ul className="space-y-2.5">
                {options.map((option, index) => {
                  const eliminated = Boolean(option.isEliminated);
                  return (
                    <li key={getOptionId(option) ?? index}>
                      <button
                        type="button"
                        disabled={!isMyTurn || eliminated}
                        onClick={() => emit("elimination:ban", {
                          roomCode: code,
                          optionId: getOptionId(option),
                        })}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${
                          eliminated
                            ? "border-slate-100 bg-slate-50 text-slate-400"
                            : isMyTurn
                              ? "border-slate-200 hover:border-rose-300 hover:bg-rose-50"
                              : "border-slate-100 bg-white"
                        } disabled:cursor-not-allowed`}
                      >
                        {eliminated
                          ? <ShieldX size={18} className="flex-none text-rose-400" />
                          : <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>}
                        <span className={`flex-1 text-sm font-bold ${eliminated ? "line-through opacity-60" : ""}`}>{getOptionText(option)}</span>
                        {eliminated && <span className="text-xs font-semibold text-rose-500">Eliminada</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
