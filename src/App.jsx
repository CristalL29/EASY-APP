import useSocket from "./hooks/useSocket.js";
import Home from "./components/Home.jsx";
import Lobby from "./components/Lobby.jsx";
import RouletteGame from "./components/RouletteGame.jsx";
import EliminationGame from "./components/EliminationGame.jsx";
import ConsensusGame from "./components/ConsensusGame.jsx";
import Results from "./components/Results.jsx";

function DemoIndicator({ enabled }) {
  if (!enabled) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full border border-emerald-200 bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
      Modo demo · datos ficticios
    </div>
  );
}

function normalized(value) {
  return String(value ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

export default function App() {
  const state = useSocket();
  const { room, currentUser, emit, connection, isDemo, notice, clearNotice, spinResult } = state;

  if (!room) {
    return <Home connection={connection} isDemo={isDemo} emit={emit} notice={notice} clearNotice={clearNotice} />;
  }

  const status = normalized(room.status);
  const mode = normalized(room.mode);
  const consensusStatus = normalized(room.consensusState?.status ?? room.gameState?.consensus?.status);
  const isResults = ["results", "finished", "complete", "completed"].includes(status) ||
    consensusStatus === "results" || Boolean(room.results || room.result);

  if (isResults) {
    return <><DemoIndicator enabled={isDemo} /><Results room={room} currentUser={currentUser} emit={emit} /></>;
  }

  if (mode === "roulette") {
    return <><DemoIndicator enabled={isDemo} /><RouletteGame room={room} currentUser={currentUser} emit={emit} spinResult={spinResult} /></>;
  }
  if (mode === "elimination" || mode === "eliminationbyturns") {
    return <><DemoIndicator enabled={isDemo} /><EliminationGame room={room} currentUser={currentUser} emit={emit} /></>;
  }
  if (mode === "consensus") {
    return <><DemoIndicator enabled={isDemo} /><ConsensusGame room={room} currentUser={currentUser} emit={emit} /></>;
  }

  return <Lobby room={room} currentUser={currentUser} isDemo={isDemo} emit={emit} notice={notice} clearNotice={clearNotice} setNotice={state.setNotice} />;
}
