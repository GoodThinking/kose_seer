import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import { PetCalculator } from './PetCalculator';
import { BaseProto } from '../../../shared/proto/base/BaseProto';
import { Logger } from '../../../shared/utils/Logger';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { CommandID } from '../../../shared/protocol/CommandID';

export const GROUP = 900002;
export function IsMutating(player:any):boolean {return !!player.CountermarkMutation;}
const TABLE = 'CREATE TABLE IF NOT EXISTS player_countermarks (owner_id INTEGER NOT NULL, mark_id INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(owner_id, mark_id))';
type Mark = {id:number; name:string; kind:'ability'|'skill'; price:number; minLevel:number; description:string; hp?:number; atk?:number; def?:number; spAtk?:number; spDef?:number; speed?:number; moveId?:number; priority?:number; power?:number; petIds?:number[]};
class Rejected extends Error { constructor(public code:number, message:string) {super(message);} }
export function Catalog(): Mark[] {
  const marks = (ConfigLoader.Instance.LoadJson('data/json/countermarks.json') as any)?.marks;
  if (!Array.isArray(marks) || new Set(marks.map(m => m.id)).size !== marks.length) throw Error('Invalid countermark catalog');
  for (const m of marks) {
    if (!Number.isSafeInteger(m.id) || m.id <= 0 || !['ability','skill'].includes(m.kind) || !Number.isSafeInteger(m.price) || m.price <= 0) throw Error('Invalid countermark');
    for (const key of ['hp','atk','def','spAtk','spDef','speed','power','priority']) if (m[key] !== undefined && (!Number.isSafeInteger(m[key]) || m[key] < 0)) throw Error('Invalid countermark stat');
  }
  return marks;
}
export function Slots(pet:any): {ability:number;skill:number} { return {ability:pet.countermarks?.ability || 0, skill:pet.countermarks?.skill || 0}; }
export function ApplyStats(pet:any, stats:any): any {
  const id = Slots(pet).ability;
  if (!id) return stats;
  const mark = Catalog().find(m => m.id === id && m.kind === 'ability');
  if (!mark || pet.level < mark.minLevel) return stats;
  const result = {...stats, maxHp:stats.maxHp + (mark.hp || 0)};
  for (const key of ['atk','def','spAtk','spDef','speed']) result[key] = stats[key] + ((mark as any)[key] || 0);
  result.hp = Math.min(result.maxHp, Math.max(0, pet.hp));
  return result;
}
export function BattlePet(pet:any): any {
  const copy = {...pet}; PetCalculator.UpdatePetStats(copy); return copy;
}
/** Return a per-actor copy; the shared skill registry and the opposing pet are untouched. */
export function Skill(pet:any, skill:any): any {
  const id = pet.countermarks?.skill || 0;
  if (!id) return skill;
  const mark = Catalog().find(m => m.id === id && m.kind === 'skill');
  if (!mark || pet.level < mark.minLevel || mark.moveId !== skill.id || (mark.petIds?.length && !mark.petIds.includes(pet.petId))) return skill;
  return {...skill, power:skill.power + (mark.power || 0), priority:(skill.priority || 0) + (mark.priority || 0)};
}
function esc(value:any):string {return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));}
function attrs(value:any):string {return Object.entries(value).filter(([,v]) => !Array.isArray(v)).map(([k,v]) => `${k}="${esc(v)}"`).join(' ');}
export async function Snapshot(player:any,error=0,message=''):Promise<string> {
  const db:any = DatabaseManager.Instance;
  const inventory = await db.WithConnection(async (d:any) => {await d.execute(TABLE); return d.query('SELECT mark_id, count FROM player_countermarks WHERE owner_id = ? ORDER BY mark_id',[player.Uid]);});
  return `<countermarks ${attrs({coins:player.Data.coins,error,message})}><catalog>${Catalog().map(m => `<mark ${attrs({...m,hp:m.hp||0,atk:m.atk||0,def:m.def||0,spAtk:m.spAtk||0,spDef:m.spDef||0,speed:m.speed||0,petIds:m.petIds?.join(',')||''})}/>`).join('')}</catalog><inventory>${inventory.map((m:any) => `<mark ${attrs({id:m.mark_id,count:m.count})}/>`).join('')}</inventory><pets>${player.PetManager.PetData.PetList.map((p:any) => `<pet ${attrs({catchTime:p.catchTime,id:p.petId,name:p.nick||GameConfig.GetPetById(p.petId)?.DefName||String(p.petId),level:p.level,inBag:p.isInBag?1:0,...Slots(p),...PetCalculator.CalculateStatsFromPet(p)})}/>`).join('')}</pets></countermarks>`;
}
export async function Operate(player:any,op:number,catchTime:number,markId:number,slot:number):Promise<void> {
  if (![0,1,2,3].includes(op)) throw new Rejected(5001,'无效操作');
  if (!op) return;
  const pets = player.PetManager.PetData, release = await pets.AcquireMutation();
  let gate:any, recovery:any;
  try {
    await pets.WaitForStagedSave(); await player.Data.WaitForExpAllocation(); await player.Data.WaitForCurrencyOperations();
    if (player.Session.Socket.destroyed || player.Session.Player !== player) throw new Rejected(5001,'会话已失效');
    if (player.BattleManager.GetCurrentBattle()) throw new Rejected(5001,'战斗中不能更改刻印');
    recovery = player.BattleManager.BeginOutOfBattleRecovery();
    if (!recovery) throw new Rejected(5001,'战斗或恢复操作处理中');
    gate = player.Data.BeginBalanceReward();
    player.CountermarkMutation = true;
    const marks = Catalog(), mark = marks.find(m => m.id === markId);
    if (op !== 3 && !mark) throw new Rejected(5001,'未知刻印');
    if ((op === 2 || op === 3) && slot !== 0 && slot !== 1) throw new Rejected(5001,'无效刻印孔');
    const field = slot === 0 ? 'ability' : 'skill';
    const staged = pets.PetList.map((p:any) => p.catchTime === catchTime ? {...p,countermarks:Slots(p)} : p);
    const target = staged.find((p:any) => p.catchTime === catchTime);
    if (op !== 1 && (!target || target.userId !== player.Uid)) throw new Rejected(5001,'精灵不属于当前用户');
    if (op === 2 && (target.level < mark!.minLevel || mark!.kind !== field || (mark!.petIds?.length && !mark!.petIds.includes(target.petId)))) throw new Rejected(5001,'刻印与精灵或孔位不匹配');
    const db:any = DatabaseManager.Instance;
    const transaction = async () => db.WithConnection(async (d:any) => {
      await d.execute(TABLE); await d.beginTransaction();
      try {
        const [wallet] = await d.query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id = ?',[player.Uid]);
        const [stored] = await d.query('SELECT pet_list FROM player_pets WHERE owner_id = ?',[player.Uid]);
        if (!wallet || !stored) throw Error('Countermark player missing');
        const keys = ['coins','gold','allocatableExp'], old = [wallet.coins,wallet.gold,wallet.allocatable_exp], dirty = player.Data.GetDirtyFields();
        const balance = keys.map((key,i) => {if (!dirty.includes(key) && player.Data[key] !== old[i]) throw Error('Countermark wallet stale');return dirty.includes(key) ? player.Data[key] : old[i];});
        if (balance.some(n => !Number.isSafeInteger(n) || n < 0 || n > 0x7fffffff)) throw Error('Invalid wallet');
        const inventory:any[] = await d.query('SELECT mark_id,count FROM player_countermarks WHERE owner_id = ?',[player.Uid]);
        const count = (id:number) => inventory.find(m => m.mark_id === id)?.count || 0;
        const set = async (id:number,n:number) => {if (inventory.some(m => m.mark_id === id)) await d.execute('UPDATE player_countermarks SET count = ? WHERE owner_id = ? AND mark_id = ?',[n,player.Uid,id]);else await d.execute('INSERT INTO player_countermarks(owner_id,mark_id,count) VALUES(?,?,?)',[player.Uid,id,n]);};
        if (op === 1) {
          if (count(markId) + staged.filter((p:any) => Slots(p).ability === markId || Slots(p).skill === markId).length >= 1) throw new Rejected(5001,'每种刻印限拥有一个');
          if (balance[0] < mark!.price) throw new Rejected(10016,'赛尔豆不足');
          balance[0] -= mark!.price; await set(markId,1);
        } else {
          const previous = target.countermarks[field];
          if (op === 2 && previous === markId) throw new Rejected(5001,'该刻印已装备');
          if (op === 2 && count(markId) < 1) throw new Rejected(5001,'未拥有该刻印');
          if (op === 3 && !previous) throw new Rejected(5001,'该孔未装备刻印');
          if (previous) await set(previous,count(previous)+1);
          if (op === 2) await set(markId,count(markId)-1);
          target.countermarks[field] = op === 2 ? markId : 0;
          PetCalculator.UpdatePetStats(target);
          const write = await d.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ? AND pet_list = ?',[JSON.stringify(staged),player.Uid,stored.pet_list]);
          if (write.affectedRows !== 1) throw Error('Concurrent pet update');
        }
        const write = await d.execute('UPDATE players SET coins = ?,gold = ?,allocatable_exp = ? WHERE user_id = ? AND coins = ? AND gold = ? AND allocatable_exp = ?',[...balance,player.Uid,...old]);
        if (write.affectedRows !== 1) throw Error('Concurrent wallet update');
        await d.commit(); gate.publish(...balance);

      } catch (error) {await d.rollback(); throw error;}
    });
    if (op === 1) await transaction();
    else await pets.CommitPetUpdate(pets.PetList.find((p:any) => p.catchTime === catchTime), target, transaction);
  } finally {player.CountermarkMutation = false; gate?.release(); recovery?.release(); release();}
}
class Packet extends BaseProto {
  constructor(private xml:string,private error:number) {super(CommandID.PET_COLLECT);}
  serialize():Buffer {const head=Buffer.alloc(8);head.writeUInt32BE(GROUP);head.writeUInt32BE(this.error,4);return Buffer.concat([head,Buffer.from(this.xml,'utf8')]);}
}
export async function Handle(player:any,body:Buffer):Promise<void> {
  let code=0,message='';
  try {if (body.length !== 20 || body.readUInt32BE(0) !== GROUP) throw new Rejected(5001,'刻印请求必须为20字节'); await Operate(player,body.readUInt32BE(4),body.readUInt32BE(8),body.readUInt32BE(12),body.readUInt32BE(16));}
  catch(error) {if (!(error instanceof Rejected)) Logger.Error('[Countermarks] Operation failed', error as Error);code=error instanceof Rejected ? error.code : 5000;message=error instanceof Rejected ? error.message : '刻印操作失败';}
  await player.SendPacket(new Packet(await Snapshot(player,code,message),code));
}
