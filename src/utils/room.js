export function getOptions(room) {
  return Array.isArray(room?.options) ? room.options : [];
}

export function getPlayers(room) {
  const players = room?.players ?? room?.participants ?? room?.users;
  return Array.isArray(players) ? players : [];
}

export function getOptionId(option) {
  return option?.id ?? option?._id ?? option?.optionId ?? option?.text ?? option?.name;
}

export function getOptionText(option) {
  return String(option?.text ?? option?.name ?? option?.label ?? "");
}

export function getPlayerId(player) {
  return player?.id ?? player?._id ?? player?.userId;
}

export function getPlayerName(player) {
  return player?.nickname ?? player?.name ?? player?.username ?? "Participante";
}

export function sameId(first, second) {
  return first != null && second != null && String(first) === String(second);
}

export function isHost(room, currentUser) {
  return sameId(currentUser?.id ?? currentUser?._id, room?.hostId);
}

export function getRoomCode(room) {
  return room?.code ?? room?.roomCode ?? "";
}
