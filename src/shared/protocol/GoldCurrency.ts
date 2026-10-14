/** Stored balances and prices are whole gold beans; wallet wire fields are hundredths. */
export function GoldToWire(gold: number): number {
  if (!Number.isSafeInteger(gold) || gold < 0 || gold > Math.floor(0xffffffff / 100)) {
    throw new Error('Gold balance cannot be encoded as uint32 hundredths');
  }
  return gold * 100;
}
