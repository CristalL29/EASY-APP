import { useMemo, useState } from "react";
import {
  Check, Clipboard, Crown, Lightbulb, Pencil, Plus, Sparkles, Trash2, Users, X,
} from "lucide-react";
import { getRandomSuggestion } from "../utils/suggestions.js";
import {
  getOptionId, getOptionText, getOptions, getPlayerId, getPlayerName,
  getPlayers, getRoomCode, isHost, sameId,
} from "../utils/room.js";

const modes = [
  { id: "roulette", title: "Ruleta", description: "Que el azar elija por ustedes.", icon: "🎡" },
  { id: "elimination", title: "Eliminación por turnos", description: "Descarten opciones hasta que quede una.", icon: "🗳️" },
  { id: "consensus", title: "Consenso", description: "Voten y encuentren la opción favorita.", icon: "🤝" },
];

export default function Lobby({ room, currentUser, emit, notice, clearNotice, setNotice }) {
  const [optionText, setOptionText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);
  const options = getOptions(room);
  const players = getPlayers(room);
  const host = isHost(room, currentUser);
  const ownOptions = useMemo(
    () => options.filter((option) => sameId(option.authorId, currentUser?.id ?? currentUser?._id)),
    [currentUser, options],
  );
  const maxReached = ownOptions.length >= 2;
  const code = getRoomCode(room);

  async function copyInvite() {
    const inviteUrl = `${window.location.origin}/?code=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement("textarea");
      input.value = inviteUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copiedText = document.execCommand("copy");
      input.remove();
      if (copiedText) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        setNotice({ type: "error", message: "No se pudo copiar el enlace. Comprueba los permisos del navegador." });
      }
    }
  }

  function addOption(event) {
    event.preventDefault();
    const text = optionText.trim();
    if (!text || maxReached) return;
    if (options.some((option) => getOptionText(option).trim().toLocaleLowerCase() === text.toLocaleLowerCase())) {
      setNotice({ type: "error", message: "Esa propuesta ya existe. Prueba con una idea diferente." });
      return;
    }
    clearNotice();
    emit("option:add", { roomCode: code, text });
    setOptionText("");
  }

  function beginEdit(option) {
    setEditingId(getOptionId(option));
    setEditText(getOptionText(option));
  }

  function saveEdit(option) {
    const text = editText.trim();
    if (!text) return;
    const optionId = getOptionId(option);
    const duplicate = options.some((other) =>
      !sameId(getOptionId(other), optionId) &&
      getOptionText(other).trim().toLocaleLowerCase() === text.toLocaleLowerCase(),
    );
    if (duplicate) {
      setNotice({ type: "error", message: "Esa propuesta ya existe. Elige un texto diferente." });
      return;
    }
    clearNotice();
    emit("option:edit", { roomCode: code, optionId, text });
    setEditingId(null);
    setEditText("");
  }

  function startGame(mode) {
    if (options.length < 2) return;
    emit("game:start", { roomCode: code, mode });
  }

  return (
    <main className="page-glow min-h-screen px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-lg font-black tracking-tight text-ink">decide<span className="text-brand-600">.</span></a>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-muted shadow-sm">
            <span className={`h-2 w-2 rounded-full ${room ? "bg-emerald-500" : "bg-slate-300"}`} />
            Sala en vivo
          </div>
        </header>

        <section className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500 p-6 text-white shadow-soft sm:p-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-white/75">Comparte este código para invitar</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <h1 className="font-mono text-4xl font-black tracking-[.2em] sm:text-5xl">{code || "----"}</h1>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/25"
                >
                  {copied ? <Check size={17} /> : <Clipboard size={17} />}
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
              </div>
              <p className="mt-4 text-sm text-white/80">Categoría: {room?.category ?? "Otro"}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15"><Users size={22} /></div>
              <div>
                <p className="text-2xl font-black leading-none">{players.length}</p>
                <p className="mt-1 text-xs font-medium text-white/75">{players.length === 1 ? "participante" : "participantes"}</p>
              </div>
            </div>
          </div>
        </section>

        {notice && (
          <div role="alert" className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            notice.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}>{notice.message}</div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-3xl border border-white bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold">En la sala</h2>
                <p className="mt-1 text-sm text-muted">Participantes conectados</p>
              </div>
              <Users className="text-brand-600" size={20} />
            </div>
            <ul className="space-y-2">
              {players.map((player, index) => {
                const playerId = getPlayerId(player);
                const playerIsHost = sameId(playerId, room?.hostId);
                const isYou = sameId(playerId, currentUser?.id ?? currentUser?._id);
                return (
                  <li key={playerId ?? index} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {getPlayerName(player).trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {getPlayerName(player)}{isYou && <span className="ml-1 font-normal text-muted">(tú)</span>}
                    </span>
                    {playerIsHost && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                        <Crown size={12} /> Anfitrión
                      </span>
                    )}
                  </li>
                );
              })}
              {players.length === 0 && <li className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-muted">Esperando a los participantes…</li>}
            </ul>
          </section>

          <section className="rounded-3xl border border-white bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">Ideas del grupo</h2>
                <p className="mt-1 text-sm text-muted">Cada persona puede proponer hasta 2 opciones.</p>
              </div>
              <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><Lightbulb size={19} /></span>
            </div>
            {!maxReached ? (
              <form onSubmit={addOption} className="mb-5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <input
                      value={optionText}
                      maxLength={40}
                      onChange={(event) => setOptionText(event.target.value)}
                      placeholder="Escribe una idea…"
                      aria-label="Nueva propuesta"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                    <p className="mt-1 text-right text-xs text-muted">{optionText.length}/40</p>
                  </div>
                  <div className="flex gap-2 sm:items-start">
                    <button
                      type="button"
                      onClick={() => setOptionText(getRandomSuggestion(room?.category, options))}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                    >
                      <Sparkles size={15} /> Sugerir idea
                    </button>
                    <button
                      type="submit"
                      disabled={!optionText.trim()}
                      className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Añadir propuesta"
                    >
                      <Plus size={19} />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Has alcanzado el límite de 2 opciones.</p>
            )}

            <ul className="space-y-2">
              {options.map((option, index) => {
                const optionId = getOptionId(option);
                const author = players.find((player) => sameId(getPlayerId(player), option.authorId));
                const owned = sameId(option.authorId, currentUser?.id ?? currentUser?._id);
                const editing = sameId(editingId, optionId);
                return (
                  <li key={optionId ?? index} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                    {editing ? (
                      <input
                        autoFocus
                        value={editText}
                        maxLength={40}
                        onChange={(event) => setEditText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEdit(option);
                          if (event.key === "Escape") setEditingId(null);
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-100"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 break-words text-sm font-semibold">{getOptionText(option)}</span>
                    )}
                    <span className="hidden text-xs text-muted sm:inline">{author ? getPlayerName(author) : "Participante"}</span>
                    {owned && (editing ? (
                      <>
                        <button type="button" onClick={() => saveEdit(option)} aria-label="Guardar edición" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><Check size={16} /></button>
                        <button type="button" onClick={() => setEditingId(null)} aria-label="Cancelar edición" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => beginEdit(option)} aria-label={`Editar ${getOptionText(option)}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                        <button type="button" onClick={() => emit("option:delete", { roomCode: code, optionId })} aria-label={`Eliminar ${getOptionText(option)}`} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                      </>
                    ))}
                  </li>
                );
              })}
              {options.length === 0 && <li className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-muted">Todavía no hay propuestas. ¡Añade la primera!</li>}
            </ul>
          </section>
        </div>

        {host && (
          <section className="mt-6 rounded-3xl border border-white bg-white p-6 shadow-soft sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-600">Panel del anfitrión</p>
              <h2 className="mt-1 text-xl font-extrabold">¿Cómo decidirán?</h2>
              <p className="mt-1 text-sm text-muted">Elige un modo cuando estén listas las propuestas.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {modes.map((mode) => (
                <button
                  type="button"
                  key={mode.id}
                  disabled={options.length < 2}
                  onClick={() => startGame(mode.id)}
                  className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/60 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:bg-white"
                >
                  <span className="text-2xl">{mode.icon}</span>
                  <span className="mt-3 block font-bold">{mode.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{mode.description}</span>
                </button>
              ))}
            </div>
            {options.length < 2 && <p className="mt-3 text-xs font-medium text-amber-700">Necesitan al menos 2 opciones para iniciar la decisión.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
