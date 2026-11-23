import { useMemo, useState } from "react";
import { ArrowLeft, Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { getOptionId, getOptionText, getOptions, getRoomCode } from "../utils/room.js";

export default function ConsensusGame({ room, currentUser, emit }) {
  const options = useMemo(
    () => getOptions(room).filter((option) => !option.isEliminated),
    [room],
  );
  const code = getRoomCode(room);
  const [votes, setVotes] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const consensus = room?.consensusState ?? room?.gameState?.consensus ?? {};
  const hasVotedOnServer = (consensus.votedUserIds ?? consensus.completedUserIds ?? [])
    .some((id) => String(id) === String(currentUser?.id ?? currentUser?._id));
  const allVoted = options.length > 0 && options.every((option) => votes[getOptionId(option)] != null);

  function choose(optionId, vote) {
    if (submitted || hasVotedOnServer) return;
    setVotes((current) => ({ ...current, [optionId]: vote }));
  }

  function submitVotes() {
    if (!allVoted || submitted || hasVotedOnServer) return;
    const result = emit("consensus:vote", {
      roomCode: code,
      votes: options.map((option) => ({
        optionId: getOptionId(option),
        vote: votes[getOptionId(option)],
      })),
    });
    if (result) setSubmitted(true);
  }

  const waiting = submitted || hasVotedOnServer;

  return (
    <main className="page-glow min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft size={17} /> Sala {code}</a>
        <section className="rounded-3xl border border-white bg-white p-6 shadow-soft sm:p-9">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Modo de decisión</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Voten en grupo</h1>
            <p className="mt-2 text-sm text-muted">Tus votos son anónimos. Indica qué opciones te gustan.</p>
          </div>

          {waiting ? (
            <div role="status" className="mt-8 rounded-2xl bg-brand-50 px-6 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-brand-600"><Check size={24} /></span>
              <h2 className="mt-4 text-lg font-extrabold">¡Voto registrado!</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Esperando a que el resto del grupo termine de votar...</p>
            </div>
          ) : (
            <>
              <div className="mt-7 space-y-3">
                {options.map((option, index) => {
                  const id = getOptionId(option);
                  const vote = votes[id];
                  return (
                    <article key={id ?? index} className="rounded-2xl border border-slate-200 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                      <div className="mb-4 flex min-w-0 items-center gap-3 sm:mb-0">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                        <h2 className="break-words font-bold">{getOptionText(option)}</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          aria-pressed={vote === "LIKE"}
                          onClick={() => choose(id, "LIKE")}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${
                            vote === "LIKE" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          <ThumbsUp size={18} /> LIKE
                        </button>
                        <button
                          type="button"
                          aria-pressed={vote === "DISLIKE"}
                          onClick={() => choose(id, "DISLIKE")}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${
                            vote === "DISLIKE" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          <ThumbsDown size={18} /> DISLIKE
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={submitVotes}
                disabled={!allVoted}
                className="mt-6 w-full rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Enviar mis votos
              </button>
              {!allVoted && <p className="mt-2 text-center text-xs text-muted">Vota cada opción para continuar.</p>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
