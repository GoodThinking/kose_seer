import { ITaskBuffer } from '../../../DataBase/models/TaskData';

/** Decode a fixed Nieo 20-byte task buffer from either persisted layout. */
export function DecodeKoseTaskBuffer(buffer: ITaskBuffer | undefined, taskId: number): number[] {
  if (!buffer || Object.prototype.hasOwnProperty.call(buffer, 'xinBytes')) {
    throw new Error(`Unknown persisted task ${taskId} buffer shape`);
  }

  const keys = Object.keys(buffer).sort();
  const legacyKeys = ['0', '1', '2', '3', '4'];
  const progressKeys = Array.from({ length: 20 }, (_, i) => String(i));
  const sortedProgressKeys = [...progressKeys].sort();
  const legacy = keys.length === legacyKeys.length && keys.every((key, i) => key === legacyKeys[i]);
  const progress = keys.length === progressKeys.length &&
    keys.every((key, i) => key === sortedProgressKeys[i]);

  if (legacy) {
    const bytes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const value = buffer[i];
      if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
        throw new Error(`Invalid legacy task ${taskId} UInt32 buffer`);
      }
      const encoded = Buffer.alloc(4);
      encoded.writeUInt32BE(value, 0);
      bytes.push(...encoded);
    }
    return bytes;
  }

  if (progress) {
    const bytes = Array.from({ length: 20 }, (_, i) => buffer[i]);
    if (bytes.some(value => !Number.isInteger(value) || value < 0 || value > 0xff)) {
      throw new Error(`Invalid persisted task ${taskId} progress byte`);
    }
    return bytes;
  }

  throw new Error(`Unknown persisted task ${taskId} buffer shape`);
}
