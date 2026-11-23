import useSocket from "./hooks/useSocket.js";
import Home from "./components/Home.jsx";
import Lobby from "./components/Lobby.jsx";
import RouletteGame from "./components/RouletteGame.jsx";
import EliminationGame from "./components/EliminationGame.jsx";
import ConsensusGame from "./components/ConsensusGame.jsx";
import Results from "./components/Results.jsx";

function normalized(value) {
  return String(value ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

export default function App() {
  const state = useSocket();
  const { room, currentUser, emit, connection, notice, clearNotice, spinResult } = state;

  if (!room) {
    return <Home connection={connection} emit={emit} notice={notice} clearNotice={clearNotice} />;
  }

  const status = normalized(room.status);
  const mode = normalized(room.mode);
  const consensusStatus = normalized(room.consensusState?.status ?? room.gameState?.consensus?.status);
  const isResults = ["results", "finished", "complete", "completed"].includes(status) ||
    consensusStatus === "results" || Boolean(room.results || room.result);

  if (isResults) {
    return <Results room={room} currentUser={currentUser} emit={emit} />;
  }

  if (mode === "roulette") {
    return <RouletteGame room={room} currentUser={currentUser} emit={emit} spinResult={spinResult} />;
  }
  if (mode === "elimination" || mode === "eliminationbyturns") {
    return <EliminationGame room={room} currentUser={currentUser} emit={emit} />;
  }
  if (mode === "consensus") {
    return <ConsensusGame room={room} currentUser={currentUser} emit={emit} />;
  }

  return <Lobby room={room} currentUser={currentUser} emit={emit} notice={notice} clearNotice={clearNotice} setNotice={state.setNotice} />;
}
