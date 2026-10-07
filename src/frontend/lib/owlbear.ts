const pending = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void; timeout: number }>();
export type OwlbearPlayer = { id: string; name: string };
export type OwlbearTokenState = {
  tokenId: string; id?: string; exists: boolean; visible: boolean | null;
  createdUserId: string | null; owlTrackers?: { hp?: { value: number | null; max: number | null } | null; injuries?: number | null; tempHp?: number | null } | null;
};

export function requestOwlbear(command: string, payload: Record<string, unknown> = {}): Promise<any> {
  if (window.parent === window) return Promise.reject(new Error('This action is only available inside Owlbear Rodeo.'));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => { pending.delete(requestId); reject(new Error('Owlbear did not respond in time.')); }, 10000);
    pending.set(requestId, { resolve, reject, timeout });
    window.parent.postMessage({ type: 'ptu-owlbear-command', requestId, command, payload }, location.origin);
  });
}

export function listenOwlbear(onPlayers: (current: OwlbearPlayer | null, players: OwlbearPlayer[]) => void, onTokenState?: (state: OwlbearTokenState) => void) {
  const listener = (event: MessageEvent) => {
    if (event.origin !== location.origin) return;
    if (event.data?.type === 'ptu-owlbear-players') {
      const current = event.data.currentPlayer?.id ? { id: String(event.data.currentPlayer.id), name: String(event.data.currentPlayer.name || 'Player') } : null;
      const players = (Array.isArray(event.data.players) ? event.data.players : []).filter((player: any) => player?.id).map((player: any) => ({ id: String(player.id), name: String(player.name || 'Player') }));
      onPlayers(current, players); return;
    }
    if (event.data?.type === 'ptu-owlbear-token-state') {
      onTokenState?.(event.data as OwlbearTokenState); return;
    }
    if (event.data?.type !== 'ptu-owlbear-command-result') return;
    const request = pending.get(event.data.requestId); if (!request) return;
    clearTimeout(request.timeout); pending.delete(event.data.requestId);
    event.data.ok ? request.resolve(event.data) : request.reject(new Error(event.data.error || 'Owlbear command failed'));
  };
  window.addEventListener('message', listener);
  window.parent.postMessage({ type: 'ptu-request-owlbear-players' }, location.origin);
  return () => window.removeEventListener('message', listener);
}
