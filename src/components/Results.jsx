import { ArrowLeft, Crown, RotateCw, Sparkles, Trophy } from "lucide-react";
import {
  getOptionId, getOptionText, getOptions, getRoomCode, isHost, sameId,
} from "../utils/room.js";

function scoreOf(option) {
  const approvals = Number(option.approvals ?? option.likes ?? option.likeCount ?? option.votes?.like ?? 0);
  const disapprovals = Number(option.disapprovals ?? option.dislikes ?? option.dislikeCount ?? option.votes?.dislike ?? 0);
  const supplied = option.approvalPercentage ?? option.approvalPercent ?? option.percentage;
  const percentage = Number.isFinite(Number(supplied))
    ? Number(supplied)
    : approvals + disapprovals > 0
      ? (approvals / (approvals + disapprovals)) * 100
      : Number(option.score ?? 0);
  return { approvals, disapprovals, percentage };
}

function getWinner(room, options) {
  const results = room?.results ?? room?.result ?? {};
  const target = room?.winner ?? results.winner ?? results.winningOption;
  if (target && typeof target === "object") {
    return options.find((option) =>
      sameId(getOptionId(option), target.id ?? target._id ?? target.optionId) ||
      getOptionText(option) === (target.text ?? target.name),
    ) ?? target;
  }
  if (target != null) {
    return options.find((option) =>
      sameId(getOptionId(option), target) || getOptionText(option) === String(target),
    );
  }
  return options.find((option) => option.isWinner) ?? null;
}

export default function Results({ room, currentUser, emit }) {
  const options = getOptions(room);
  const results = room?.results ?? room?.result ?? {};
  const consensus = room?.consensusState ?? {};
  const mode = String(room?.mode ?? "").toLowerCase();
  const host = isHost(room, currentUser);
  const winner = getWinner(room, options);
  const winnerId = winner ? getOptionId(winner) : null;
  const roomCode = getRoomCode(room);
  const rouletteOptions = options.filter((option) =>
    !option.isEliminated && !sameId(getOptionId(option), winnerId),
  );
  const rankedOptions = [...options]
    .map((option) => ({ option, ...scoreOf(option) }))
    .sort((a, b) => b.percentage - a.percentage || b.approvals - a.approvals);
  const topScore = rankedOptions[0]?.percentage;
  const tied = results.isTie ?? results.tie ?? consensus.isTie ?? (
    rankedOptions.length > 1 && rankedOptions[0].percentage === rankedOptions[1].percentage
  );
  const suppliedTieOptions = results.tiedOptions ?? results.tieOptions ?? consensus.tiedOptions ?? [];
  const tiedOptions = suppliedTieOptions.length
    ? suppliedTieOptions.map((item) => typeof item === "object"
      ? options.find((option) => sameId(getOptionId(option), getOptionId(item))) ?? item
      : options.find((option) => sameId(getOptionId(option), item))).filter(Boolean)
    : rankedOptions.filter((item) => item.percentage === topScore).map((item) => item.option);

  function reroll() {
    if (rouletteOptions.length < 2) return;
    emit("roulette:reroll", { roomCode, excludedOptionId: winnerId });
  }

  function tieBreak() {
    if (tiedOptions.length < 2) return;
    emit("roulette:start", {
      roomCode,
      mode: "consensus-tiebreak",
      optionIds: tiedOptions.map(getOptionId),
    });
  }

  return (
    <main className="page-glow min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft size={17} /> Sala {roomCode}</a>
        <section className="rounded-3xl border border-white bg-white p-6 shadow-soft sm:p-9">
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Trophy size={28} /></span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-brand-600">Resultado del grupo</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">¡Ya tienen un plan!</h1>
          </div>

          <div className="mt-7 rounded-2xl bg-gradient-to-br from-brand-700 to-emerald-400 px-5 py-7 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/75">Opción ganadora</p>
            <p className="mt-2 text-2xl font-black sm:text-3xl">{getOptionText(winner ?? {}) || "El grupo está decidiendo…"}</p>
          </div>

          {mode === "consensus" && (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Aprobación del grupo</h2>
                <Sparkles size={19} className="text-brand-600" />
              </div>
              <ol className="space-y-2">
                {rankedOptions.map(({ option, approvals, disapprovals, percentage }, index) => (
                  <li key={getOptionId(option) ?? index} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3">
                    <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-xs font-black ${
                      index === 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}>{index === 0 ? <Crown size={15} /> : index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{getOptionText(option)}</span>
                    <span className="text-right">
                      <span className="block text-sm font-black text-ink">{percentage.toFixed(0)}%</span>
                      <span className="block text-[10px] text-muted">{approvals} 👍 · {disapprovals} 👎</span>
                    </span>
                  </li>
                ))}
              </ol>
              {tied && (
                <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-bold">Hay un empate en el primer lugar.</p>
                  {host && (
                    <button
                      type="button"
                      disabled={tiedOptions.length < 2}
                      onClick={tieBreak}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <RotateCw size={15} /> Desempatar con ruleta
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {mode === "roulette" && host && (
            <div className="mt-6 rounded-xl bg-brand-50 p-4">
              <p className="text-sm font-bold text-brand-800">¿Quieren otro plan como alternativa?</p>
              <button
                type="button"
                disabled={rouletteOptions.length < 2}
                onClick={reroll}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RotateCw size={15} /> Girar de nuevo sin esta opción
              </button>
              {rouletteOptions.length < 2 && <p className="mt-2 text-xs text-muted">Se necesitan al menos 2 opciones disponibles además de la ganadora.</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
