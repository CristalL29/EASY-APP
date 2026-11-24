const demoPlayers = [
  { id: "demo-alex", nickname: "Alex" },
  { id: "demo-sam", nickname: "Sam" },
  { id: "demo-dani", nickname: "Dani" },
];

const demoOptions = {
  Comida: ["Tacos al pastor", "Sushi", "Pizza napolitana"],
  Películas: ["Coco", "Spider-Man: A través del Spider-Verso", "El viaje de Chihiro"],
  Otro: ["Ir al parque", "Visitar un museo", "Tarde de juegos"],
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createDemoRoom({ nickname, category, code }) {
  const user = { id: `demo-user-${randomId()}`, nickname };
  const players = [user, ...demoPlayers.map((player) => ({ ...player }))];
  const options = (demoOptions[category] ?? demoOptions.Otro).map((text, index) => ({
    id: `demo-option-${index + 1}`,
    text,
    authorId: players[(index % demoPlayers.length) + 1].id,
    isEliminated: false,
  }));

  return {
    code,
    category,
    hostId: user.id,
    status: "lobby",
    mode: null,
    players,
    options,
  };
}

export function createDemoCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}
