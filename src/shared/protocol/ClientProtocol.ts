/** Client wire formats verified against the pinned client snapshots. */
export type ClientProtocol = 'kose' | 'xin-20261013';

export function ResolveClientProtocol(value: unknown): ClientProtocol {
  if (value === undefined) return 'kose';
  if (value === 'kose' || value === 'xin-20261013') return value;
  throw new Error(`Unsupported services.game.clientProtocol: ${String(value)}`);
}
