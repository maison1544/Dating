export function getUserChatRoomPath(roomId: string) {
  return `/chat/${encodeURIComponent(roomId)}`;
}

export function getAgentChatRoomPath(roomId: string) {
  const params = new URLSearchParams({ chatId: roomId });
  return `/agent/chats?${params.toString()}`;
}
