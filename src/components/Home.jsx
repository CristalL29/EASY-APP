import { useState } from "react";
import { ArrowRight, Clapperboard, Coffee, Link2, Sparkles, Users } from "lucide-react";

const categories = [
  { value: "Comida", label: "Comida", icon: Coffee },
  { value: "Películas", label: "Películas", icon: Clapperboard },
  { value: "Otro", label: "Otro", icon: Sparkles },
];

export default function Home({ connection, emit, notice, clearNotice }) {
  const queryCode = new URLSearchParams(window.location.search).get("code") ?? "";
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState("Comida");
  const [code, setCode] = useState(queryCode.toUpperCase().slice(0, 4));
  const [busy, setBusy] = useState(false);

  function createRoom(event) {
    event.preventDefault();
    clearNotice();
    if (!nickname.trim()) return;
    setBusy(true);
    emit("room:create", { nickname: nickname.trim(), category }, {
      onAck: (response) => {
        if (response?.ok === false || response?.error) setBusy(false);
      },
    });
    window.setTimeout(() => setBusy(false), 9000);
  }

  function joinRoom(event) {
    event.preventDefault();
    clearNotice();
    if (!nickname.trim() || code.trim().length !== 4) return;
    setBusy(true);
    emit("room:join", { nickname: nickname.trim(), code: code.trim().toUpperCase() });
    window.setTimeout(() => setBusy(false), 9000);
  }

  return (
    <main className="page-glow flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl">
        <header className="mb-9 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
            <Users size={27} strokeWidth={2.2} />
          </div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-brand-600">Decide juntos</p>
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Una decisión menos.</h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-muted">
            Reúne a tu grupo, comparte ideas y deja que todos decidan en tiempo real.
          </p>
        </header>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-white bg-white p-6 shadow-soft sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Crear una sala</h2>
                <p className="mt-1 text-sm text-muted">Tú serás el anfitrión.</p>
              </div>
              <span className="rounded-xl bg-brand-50 p-3 text-brand-600"><Sparkles size={20} /></span>
            </div>

            <form onSubmit={createRoom} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Tu apodo</span>
                <input
                  required
                  maxLength={24}
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold">¿Qué van a decidir?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      aria-pressed={category === value}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                        category === value
                          ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={17} />{label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={!nickname.trim() || busy || connection !== "connected"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? "Creando sala…" : "Crear sala"} <ArrowRight size={17} />
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white bg-white p-6 shadow-soft sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Unirse a una sala</h2>
                <p className="mt-1 text-sm text-muted">¿Ya tienes un código de invitación?</p>
              </div>
              <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Link2 size={20} /></span>
            </div>

            <form onSubmit={joinRoom} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Tu apodo</span>
                <input
                  required
                  maxLength={24}
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Código de sala</span>
                <input
                  required
                  minLength={4}
                  maxLength={4}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 4))}
                  placeholder="A7X9"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-lg font-bold uppercase tracking-[.25em] outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <button
                type="submit"
                disabled={!nickname.trim() || code.length !== 4 || busy || connection !== "connected"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? "Uniéndote…" : "Unirme a la sala"} <ArrowRight size={17} />
              </button>
            </form>
          </section>
        </div>

        <div className="mx-auto mt-5 flex min-h-7 max-w-4xl items-center justify-center gap-2 text-center text-xs text-muted">
          <span className={`h-2 w-2 rounded-full ${connection === "connected" ? "bg-emerald-500" : connection === "connecting" ? "animate-pulse bg-amber-400" : "bg-rose-500"}`} />
          {connection === "connected" ? "Conectado en tiempo real" : connection === "connecting" ? "Conectando con el servidor…" : "Sin conexión con el servidor"}
        </div>

        {notice && (
          <div role="alert" className={`mx-auto mt-3 max-w-2xl rounded-xl px-4 py-3 text-center text-sm font-medium ${
            notice.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            {notice.message}
          </div>
        )}
      </div>
    </main>
  );
}
