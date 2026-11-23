const suggestions = {
  Comida: [
    "Tacos", "Sushi", "Pizza", "Hamburguesas", "Ramen",
    "Comida italiana", "Comida tailandesa", "Desayuno para cenar",
  ],
  Películas: [
    "Una comedia", "Ciencia ficción", "Una película de aventuras",
    "Un clásico", "Documental", "Película de misterio", "Animación",
  ],
  Otro: [
    "Noche de juegos", "Salir a caminar", "Escapada de fin de semana",
    "Probar algo nuevo", "Tarde de karaoke", "Visitar un museo",
  ],
};

export function getRandomSuggestion(category, existingOptions = []) {
  const existing = new Set(
    existingOptions
      .map((option) => String(option.text ?? option.name ?? "").trim().toLocaleLowerCase()),
  );
  const available = (suggestions[category] ?? suggestions.Otro).filter(
    (suggestion) => !existing.has(suggestion.toLocaleLowerCase()),
  );

  if (!available.length) return "";
  return available[Math.floor(Math.random() * available.length)];
}
