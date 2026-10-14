import { ApplyDefaultSuperNono } from '../DefaultSuperNono';
import { createDefaultPlayerInfo } from '../../../../shared/models/PlayerModel';

describe('default super NoNo entitlement', () => {
  test('disabled preserves legacy player data', () => {
    const player = createDefaultPlayerInfo(123, 'test'), before = {...player};
    expect(ApplyDefaultSuperNono(player, false)).toBe(false); expect(player).toEqual(before);
  });
  test('grants both VIP and NoNo flags without spending balances or forcing follow', () => {
    const player = createDefaultPlayerInfo(123, 'test'); player.coins = 1234; player.gold = 77;
    expect(ApplyDefaultSuperNono(player, true)).toBe(true);
    expect(player).toMatchObject({hasNono:true,superNono:true,vip:1,viped:1,vipLevel:1,
      vipEndTime:0x7FFFFFFF,nonoSuperLevel:1,nonoState:1,coins:1234,gold:77});
    expect(ApplyDefaultSuperNono(player, true)).toBe(false);
  });
  test('retains existing higher levels, cosmetics, energy and follow bits', () => {
    const player = createDefaultPlayerInfo(123, 'test');
    Object.assign(player,{vipLevel:8,nonoSuperLevel:6,nonoSuperEnergy:900,nonoSuperStage:3,
      nonoState:7,nonoNick:'custom',nonoColor:123,vipEndTime:0x80000000});
    ApplyDefaultSuperNono(player,true);
    expect(player).toMatchObject({vipLevel:8,nonoSuperLevel:6,nonoSuperEnergy:900,nonoSuperStage:3,
      nonoState:7,nonoNick:'custom',nonoColor:123,vipEndTime:0x80000000});
  });
  test('an unowned NoNo gets valid initial power, mate and birth', () => {
    const player=createDefaultPlayerInfo(123,'test');Object.assign(player,{hasNono:false,nonoPower:0,nonoMate:0,nonoBirth:0});
    ApplyDefaultSuperNono(player,true);expect(player.nonoPower).toBe(10000);expect(player.nonoMate).toBe(10000);
    expect(player.nonoBirth).toBeGreaterThan(0);
  });
});
