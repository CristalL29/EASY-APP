import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCw, Trophy } from "lucide-react";
import { getOptionId, getOptionText, getOptions, getRoomCode, isHost, sameId } from "../utils/room.js";

const colors = ["#5143d2", "#e75b72", "#149c87", "#e99b32", "#3869c8", "#a24db8", "#2f9bce", "#c45b35"];

function pointAt(angle, radius, center = 200) {
  const radians = (angle * Math.PI) / 180;
  return { x: center + radius * Math.cos(radians), y: center + radius * Math.sin(radians) };
}

function wedgePath(startAngle, endAngle) {
  const start = pointAt(startAngle, 190);
  const end = pointAt(endAngle, 190);
  return `M 200 200 L ${start.x} ${start.y} A 190 190 0 0 1 ${end.x} ${end.y} Z`;
}

function resolveWinner(result, options) {
  const target = result?.winner ?? result?.option ?? result?.winningOption ?? result;
  const id = target && typeof target === "object"
    ? result?.winnerId ?? result?.optionId ?? target.id ?? target._id ?? target.optionId
    : result?.winnerId ?? result?.optionId ?? target;
  const text = typeof target === "string" ? target : target?.text ?? target?.name;
  return options.find((option) =>
    (id != null && sameId(getOptionId(option), id)) ||
    (text && getOptionText(option) === text),
  );
}

export default function RouletteGame({ room, currentUser, emit, spinResult }) {
  const options = useMemo(() => getOptions(room).filter((option) => !option.isEliminated), [room]);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const lastResult = useRef(null);
  const code = getRoomCode(room);
  const host = isHost(room, currentUser);

  useEffect(() => {
    if (!spinResult || spinResult === lastResult.current || options.length === 0) return;
    lastResult.current = spinResult;
    const selected = resolveWinner(spinResult, options);
    if (!selected) return;
    const index = options.findIndex((option) => sameId(getOptionId(option), getOptionId(selected)));
    const segment = 360 / options.length;
    const centerAngle = -90 + (index + 0.5) * segment;
    const currentAngle = ((centerAngle + rotation) % 360 + 360) % 360;
    const adjustment = ((-90 - currentAngle) % 360 + 360) % 360;
    setWinner(null);
    setRotation((current) => current + 360 * 6 + adjustment);
    const timer = window.setTimeout(() => setWinner(selected), 5300);
    return () => window.clearTimeout(timer);
  }, [options, rotation, spinResult]);

  const wheelOptions = options.length > 0 ? options : [];

  return (
    <main className="page-glow min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand-700"><ArrowLeft size={17} /> Sala {code}</a>
        <section className="rounded-3xl border border-white bg-white p-6 text-center shadow-soft sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Modo de decisión</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">La ruleta decide</h1>
          <p className="mt-2 text-sm text-muted">Un giro y tendrán su respuesta.</p>

          <div className="relative mx-auto mt-8 aspect-square w-full max-w-[390px]">
            <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-brand-700 drop-shadow">
              <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 30 2 4h28L16 30Z" fill="currentColor" /></svg>
            </div>
            <svg
              viewBox="0 0 400 400"
              role="img"
              aria-label={`Ruleta con ${wheelOptions.length} opciones`}
              className="roulette-wheel h-full w-full overflow-visible drop-shadow-xl"
              style={{ "--wheel-rotation": `${rotation}deg` }}
            >
              <circle cx="200" cy="200" r="196" fill="white" />
              {wheelOptions.map((option, index) => {
                const segment = 360 / wheelOptions.length;
                const start = -90 + index * segment;
                const end = start + segment;
                const labelPosition = pointAt(start + segment / 2, 119);
                const fontSize = wheelOptions.length > 7 ? 10 : wheelOptions.length > 5 ? 12 : 14;
                const label = getOptionText(option);
                return (
                  <g key={getOptionId(option) ?? index}>
                    <path d={wedgePath(start, end)} fill={colors[index % colors.length]} stroke="white" strokeWidth="2" />
                    <text
                      x={labelPosition.x}
                      y={labelPosition.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={fontSize}
                      fontWeight="700"
                      transform={`rotate(${start + segment / 2 + 90}, ${labelPosition.x}, ${labelPosition.y})`}
                    >
                      {label.length > 22 ? `${label.slice(0, 20)}…` : label}
                    </text>
                  </g>
                );
              })}
              <circle cx="200" cy="200" r="28" fill="white" />
              <circle cx="200" cy="200" r="9" fill="#5143d2" />
            </svg>
          </div>

          {winner && (
            <div role="status" className="mx-auto mt-7 max-w-md rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-800">
              <Trophy className="mx-auto mb-2" size={24} />
              <p className="text-xs font-bold uppercase tracking-wider">La opción elegida</p>
              <p className="mt-1 text-xl font-black">{getOptionText(winner)}</p>
            </div>
          )}

          {host && (
            <button
              type="button"
              disabled={options.length < 2}
              onClick={() => emit("roulette:spin", { roomCode: code })}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCw size={17} /> Girar ruleta
            </button>
          )}
          {options.length < 2 && <p className="mt-3 text-xs text-muted">Se necesitan al menos 2 opciones activas.</p>}
        </section>
      </div>
    </main>
  );
}
