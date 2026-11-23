# EASY-APP — Decide

Aplicación de decisiones grupales en tiempo real hecha con Vite, React, Tailwind CSS y Socket.IO.

## Desarrollo

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Configura `VITE_SOCKET_URL` en `.env` con la URL del servidor Socket.IO. Si se omite, el cliente conecta al mismo origen que la aplicación.

## Contrato del servidor

Las acciones del cliente emiten los siguientes eventos:

| Evento | Datos |
| --- | --- |
| `room:create` | `{ nickname, category }` |
| `room:join` | `{ nickname, code }` |
| `option:add` | `{ roomCode, text }` |
| `option:edit` | `{ roomCode, optionId, text }` |
| `option:delete` | `{ roomCode, optionId }` |
| `game:start` | `{ roomCode, mode }` |
| `roulette:spin` | `{ roomCode }` |
| `roulette:reroll` | `{ roomCode, excludedOptionId }` |
| `roulette:start` | `{ roomCode, mode, optionIds }` (desempate) |
| `elimination:ban` | `{ roomCode, optionId }` |
| `consensus:vote` | `{ roomCode, votes: [{ optionId, vote }] }` |

El servidor debe emitir `room:created`, `room:joined` y/o `room:update` con el estado actualizado de la sala. El cliente también acepta `room:updated` y `room:state`. El objeto de sala puede incluir `code`, `category`, `hostId`, `status`, `mode`, `players` (o `participants`), `options`, `eliminationState`, `consensusState` y `results`; los participantes deben tener `id` y `nickname`, y las propuestas `id`, `text` y `authorId`. Las respuestas de confirmación pueden devolver `{ ok: true, room, currentUser }`. Para rechazar una acción, el servidor puede responder `{ ok: false, message }` o emitir `room:error` / `room:join:error` / `room:create:error`.

Los giros se comunican mediante `roulette:spin` (o `roulette:result`) con un ganador identificado por `winnerId`, `optionId`, `winner` u `option`. Las actualizaciones del servidor son la fuente de verdad para el lobby, el estado de cada juego y los resultados.
