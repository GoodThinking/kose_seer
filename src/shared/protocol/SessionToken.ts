import { randomBytes } from 'crypto';

/** 16 opaque wire bytes, persisted losslessly as canonical 32-character hex. */
export function NewSessionKey(): string { return randomBytes(16).toString('hex'); }

export function SessionKeyToWire(key: string | undefined): Buffer {
  if (typeof key !== 'string' || !/^[0-9a-f]{32}$/.test(key)) throw new Error('Invalid stored session key');
  return Buffer.from(key, 'hex');
}

export function SessionKeyFromWire(wire: Buffer | undefined): string {
  if (!Buffer.isBuffer(wire) || wire.length !== 16) throw new Error('Invalid session wire length');
  return wire.toString('hex');
}
