'use strict';
// Original move IDs, parameters and soul rules are archived beside this module.
const data = require('./ChampionPetData.json');
const arities = require('./ChampionEffectArguments.json');
const species = new Set([3022, 3406, 3481]);
const fifth = {3022: 19230, 3406: 30949, 3481: 31351};
const custom = new Set([191,429,440,444,450,521,570,582,585,669,683,695,697,699,734,749,760,764,779,781,794,821,843,880,881,882,883,884,885,886,920,971,982,1014,1043,1060,1121,1136,1179,1209,1265,1266]);
const moves = new Map(data.moves.map(move => [Number(move.ID), move]));
const entries = new Map([...moves].map(([moveId, raw]) => {
  const ids = String(raw.SideEffect || '').trim().split(/\s+/).filter(Boolean).map(Number);
  const args = String(raw.SideEffectArg || '').trim().split(/\s+/).filter(Boolean).map(Number);
  let offset = 0;
  return [moveId, ids.map(effect => {
    const count = arities[effect];
    if (!Number.isInteger(count)) throw new Error(`Unknown champion effect ${effect}`);
    const values = args.slice(offset, offset + count);
    offset += count;
    return {id:effect,args:values};
  })];
}));
const identity = pet => `${pet.petId || pet.id}:${pet.catchTime || 0}`;
const id = pet => Number(pet?.petId || pet?.id);
const positive = pet => (pet.battleLevels || []).filter(value => value > 0).length;
class ChampionPetRuntime {
  static Fifth(petId) { return fifth[petId] || 0; }
  static Supported(petId) { return species.has(Number(petId)); }
  static Skills(pet) {
    const learned=pet.skillArray.filter(skill=>skill>0),extra=this.Fifth(pet.petId);
    if(extra&&!learned.includes(extra))learned.push(extra);
    return learned;
  }
  static async PersistPP(manager) {
    const battle=manager._currentBattle;
    if(!battle||battle.isPvp)return;
    const pet=battle.player,pets=manager.Player.PetManager.PetData,release=await pets.AcquireMutation();
    try {
      if(manager._currentBattle!==battle)return;
      const stored=pets.GetPetByCatchTime(pet.catchTime);
      if(!stored)throw new Error('Champion PP pet missing');
      const changed=pet.skills.some((skill,index)=>stored.skillPP?.[skill]!==pet.skillPP[index]);
      if(changed){
        const candidate=JSON.parse(JSON.stringify(stored));
        candidate.skillPP=Object.fromEntries(pet.skills.map((skill,index)=>[skill,pet.skillPP[index]]));
        await pets.CommitPetUpdate(stored,candidate);
      }
      manager.RememberBattlePetPP(pet);
    }finally{release();}
  }
  static State(pet) { return pet.championState || (pet.championState = {}); }
  static Foe(battle, pet) { return battle.player === pet ? battle.enemy : battle.player; }
  static Soul(pet) { return this.Supported(id(pet)) && !pet.championSoulDisabled; }
  static BossBattle(battle) { return battle?.battleType === 'BOSS'; }
  static BossTarget(battle, pet) { return this.BossBattle(battle) && battle.enemy === pet; }
  static PPCost(pet) { return this.R.Get(pet, 'chPPCost')?.factor || 1; }
  static Entries(skill) { return entries.get(Number(skill?.id)) || null; }
  static Has(skill, effect) { return entries.get(Number(skill?.id))?.some(entry => entry.id === effect) || false; }
  static RestoreState(battle, pet, side) {
    battle.championRosterState ||= new Map();
    const key = side + ':' + identity(pet);
    const previous = battle.championRosterState.get(key);
    if (previous) pet.championState = previous;
    else battle.championRosterState.set(key, this.State(pet));
    pet.championBattle = battle;
    const pending = battle.championPending?.[side];
    if (pending && pending.from !== identity(pet)) {
      delete battle.championPending[side];
      const state = this.State(pet);
      state.maxHpScale = (state.maxHpScale || 1) * (1 - pending.percent / 100);
    }
    const state = this.State(pet);
    if (state.maxHpScale && (state.maxHpApplied !== pet.maxHp || state.appliedScale !== state.maxHpScale)) {
      state.baseMaxHp ||= pet.maxHp;
      pet.maxHp = Math.max(1, Math.floor(state.baseMaxHp * state.maxHpScale));
      pet.hp = Math.min(pet.hp, pet.maxHp);
      state.maxHpApplied = pet.maxHp;
      state.appliedScale = state.maxHpScale;
    }
  }
  static FixedReduction(pet, amount) {
    if(amount<=0)return 0;
    const reduction = this.R.Get(pet,'chFixedReduction');
    if (reduction) { amount *= 1-reduction.percent/100; if (--reduction.count<=0) delete this.R.States(pet).chFixedReduction; }
    return Math.floor(amount);
  }
  static ReduceFixed(battle, pet, amount) {
    amount = this.FixedReduction(pet, amount);
    if (this.Soul(pet) && id(pet)===3022) amount *= 1-Math.max(0,75-Math.floor((pet.maxHp-pet.hp)*10/pet.maxHp)*15)/100;
    if (this.Soul(pet) && id(pet)===3481 && !this.BossBattle(battle) && this.State(pet).gayaHadStatus) amount*=.5;
    return Math.floor(amount);
  }
  static BeforeSwitch(battle, pet, side) {
    if (!battle || !pet) return;
    battle.championRosterState ||= new Map();
    battle.championRosterState.set(side + ':' + identity(pet), this.State(pet));
    delete pet.championState;
  }
  static BeginTurn(battle) {
    for (const side of ['player','enemy']) {
      const pet = battle[side], foe = battle[side === 'player' ? 'enemy' : 'player'];
      this.RestoreState(battle, pet, side);
      const state = this.State(pet);
      if (state.startedTurn === battle.turn) continue;
      state.startedTurn = battle.turn;
      state.previousDamage = state.damageThisTurn || 0;
      state.damageThisTurn = 0;
      state.reyChargeForUse = false;
      state.reyBuffKinds = positive(foe);
      state.reyFirst = positive(foe) === 0;
      state.gayaHadStatus = this.R.HasStatus(pet);
      state.hamoImmune = pet.hp > foe.hp;
    }
  }
  static EndTurn(battle) {
    for (const side of ['player','enemy']) {
      const pet = battle[side], foe = this.Foe(battle, pet), state = this.State(pet);
      if (pet.hp <= 0 || !this.Soul(pet)) continue;
      if (id(pet) === 3022 && pet.hp < foe.hp) this.R.Heal(pet, pet.maxHp / 3);
      if (this.BossBattle(battle)) continue;
      if (id(pet) === 3481 && !state.gayaHadStatus) this.R.Heal(pet, (pet.maxHp - pet.hp) * .4);
      if (id(pet) === 3406 && !state.reyUsed && pet.hp < foe.hp && pet.hp < pet.maxHp / 3) {
        state.reyUsed = true; state.reyCharges = 3;
        this.R.Heal(pet, pet.maxHp);
        pet.battleLevels.forEach((level, index) => { if (level < 0) pet.battleLevels[index] = 0; });
        pet.statusDurations.fill(0); pet.status = -1; pet.statusTurns = 0;
        this.R.ClearTurnEffects(foe);
        for (const key of ['shield','block','immuneTurn','immuneReflect','immuneCategory']) delete this.R.States(foe)[key];
      }
    }
  }
  static RefreshResult(battle, result) {
    for (const attack of [result.firstAttack,result.secondAttack]) {
      if (!attack) continue;
      const own = attack.userId === battle.userId ? battle.player : battle.enemy;
      const foe = this.Foe(battle, own);
      attack.attackerRemainHp = own.hp; attack.attackerMaxHp = own.maxHp;
      attack.defenderRemainHp = foe.hp; attack.defenderMaxHp = foe.maxHp;
    }
  }
  static PrepareDamage(attacker, defender, skill, defenderStats) {
    const state = this.State(attacker), battle = attacker.championBattle;
    const ignoresStages = this.Soul(attacker) && id(attacker) === 3481 && !this.BossBattle(battle);
    const ignore = this.R.Get(attacker, 'chIgnoreDefense');
    if (!ignoresStages && !ignore && !this.Has(skill,760)) return null;
    let levels = defender.battleLevels || defender.battleLv;
    if (ignoresStages && levels?.some((value,index) => (index === 1 || index === 3) && value > 0)) {
      levels = levels.map((value,index) => (index === 1 || index === 3) && value > 0 ? 0 : value);
    }
    if (ignore && skill.category !== 4) {
      defenderStats.def = Math.max(1, defenderStats.def * (1 - ignore.percent / 100));
      defenderStats.spDef = Math.max(1, defenderStats.spDef * (1 - ignore.percent / 100));
      state.consumeIgnoreDefense = true;
    }
    return {levels, minEffectiveness: this.Has(skill,760) ? 1 : 0};
  }
  static ClearStages(pet) {
    const count = (pet.battleLevels || []).reduce((sum,value) => sum + Math.abs(value), 0);
    pet.battleLevels.fill(0); return count;
  }
  static Reverse(pet) {
    let changed = false;
    pet.battleLevels.forEach((value,index) => { if (value < 0) { pet.battleLevels[index] = -value; changed = true; } });
    return changed;
  }
  static TakeBoosts(attacker, defender) {
    let changed = false;
    defender.battleLevels.forEach((value,index) => { if (value > 0) { this.R.Stage(attacker,index,value); defender.battleLevels[index] = 0; changed = true; } });
    return changed;
  }
  static Pending(battle, defender, percent, cap = 100) {
    const side = defender === battle.player ? 'player' : 'enemy';
    battle.championPending ||= {};
    const current = battle.championPending[side];
    battle.championPending[side] = {from:identity(defender), percent:Math.min(cap,(current?.percent || 0)+percent)};
  }
  static Apply(battle, attacker, defender, skill, effect, args, damage, first) {
    const R = this.R, put = (pet,key,turns,extra = {},self = true) => R.Put(pet,key,turns,extra,self);
    const during = turns => R.During(turns,first), next = turns => R.Next(turns);
    const clear = () => R.ClearTurnEffects(defender);
    switch (effect) {
      case 191: put(attacker,'statusImmune',during(args[0])); put(attacker,'chReflectStatus',during(args[0])); break;
      case 440: put(defender,'chPPCost',during(args[0]),{factor:args[1]},false); break;
      case 444:
        defender.skillPP?.forEach((pp,index) => {defender.skillPP[index] = Math.max(0,pp-1);});
        attacker.skillPP?.forEach((pp,index) => { const raw = require('../../../shared/config/game/GameConfig').GameConfig.GetSkillById(attacker.skills[index]); attacker.skillPP[index] = Math.min(Number(raw?.MaxPP) || pp,pp+1); }); break;
      case 450: R.Heal(attacker,R.Rand(args[0],args[1])); break;
      case 521: this.Reverse(attacker); break;
      case 570: put(attacker,'chAttackBlock',Infinity,{count:args[0]}); break;
      case 582: if (defender.hp > 0) put(attacker,'critAlways',next(args[0])); break;
      case 585: for(let i=0;i<6;i++)R.Stage(attacker,i,args[i]); break;
      case 669: if(defender.hp<=0)put(attacker,'chPriority',next(1),{amount:1}); break;
      case 695: put(attacker,'chStatusBlock',during(args[0]),{chance:args[1]}); break;
      case 734: if(!defender.battleLevels.some(value=>value!==0))R.Heal(attacker,args[0]); break;
      case 749: if(R.Chance(args[0]))for(let i=0;i<6;i++)R.Stage(defender,i,-args[1]); break;
      case 764: put(attacker,'chAttackPunish',during(args[0]),{divisor:args[1]}); break;
      case 781: if(clear())put(defender,'statusSealed',during(args[0]),{},false); break;
      case 794: if(defender.battleLevels.some(v=>v>0)){defender.battleLevels.forEach((v,i)=>{if(v>0)defender.battleLevels[i]=0;});put(attacker,'chAllAttackBlock',during(args[0]));} break;
      case 821: put(attacker,'chProtectedEffects',during(args[0])); break;
      case 843: put(attacker,'chPriority',next(args[0]),{amount:args[1]}); break;
      case 880: if(clear())put(attacker,'chPriority',next(1),{amount:args[0]}); break;
      case 883: this.Pending(battle,defender,args[0],args[1]); break;
      case 884: put(defender,'chFailNext',Infinity,{},false); break;
      case 885: {const amount=args[0]*(attacker.hp>defender.hp?2:1);for(let i=0;i<6;i++)R.Stage(attacker,i,amount);break;}
      case 886: put(attacker,'chIgnoreDefense',Infinity,{percent:args[0]}); break;
      case 920: if(defender.hp>0)put(attacker,'chDamageBoost',next(1),{percent:args[0]}); break;
      case 971: put(attacker,'chDrainOnUse',args[0],{divisor:args[1],threshold:args[2]}); break;
      case 982: if(R.Chance(args[0]+positive(attacker)*args[2]))R.Inflict(defender,args[1],3,skill.id); break;
      case 1014: {const amount=args[0]*(attacker.hp>attacker.maxHp/args[1]?2:1);for(let i=0;i<6;i++)R.Stage(attacker,i,amount);break;}
      case 1043: if(this.Reverse(attacker))put(attacker,'absorbToHp',during(args[0])); break;
      case 1060: if(this.TakeBoosts(attacker,defender))put(attacker,'chAllAttackBlock',during(args[0])); break;
      case 1121: put(attacker,'chFixedReduction',Infinity,{count:args[0],percent:args[1]}); break;
      case 1179: if(clear())put(attacker,'chNextDamage',Infinity,{count:args[0],percent:args[1]}); break;
      case 1265: put(attacker,'chAttackReduction',Infinity,{count:args[0],percent:args[1]}); break;
      case 1266: put(attacker,'chStatusPunish',during(args[0]),{count:args[1]}); break;
      // Effects settled before damage/priority or on the next opponent, not a second time after damage.
      case 429: case 683: case 697: case 699: case 760: case 779: case 881: case 882: case 1136: case 1209: break;
      default: throw new Error(`Unimplemented champion effect ${effect}`);
    }
  }
  static InstallAtomic() {
    if(this.atomicInstalled)return;
    this.atomicInstalled=true;
    const atomic=require('./effects/atomic/status/StatusEffects');
    const original=atomic.StatusInflictor.prototype.execute;
    const runtime=this;
    atomic.StatusInflictor.prototype.execute=function(context){
      const target=this.params.target==='self'?context.attacker:context.defender;
      if(target&&runtime.R.Get(target,'chReflectStatus')&&this.params.target!=='self'){
        if(runtime.R.Chance(this.params.probability??100))runtime.R.Inflict(context.attacker,this.params.status,this.params.duration||3,context.skillId);
        return [];
      }
      return original.call(this,context);
    };
    for(const type of [atomic.OnDamageStatus,atomic.OnHitStatus]){
      const apply=type.prototype.applyStatus;
      type.prototype.applyStatus=function(pet,status,duration){
        if(runtime.R.Get(pet,'chReflectStatus')||(id(pet)===3022&&runtime.State(pet).hamoImmune))return runtime.R.Inflict(pet,this.convertStatusIndex(status),duration||3);
        return apply.call(this,pet,status,duration);
      };
    }
  }
  static Install(R) {
    if (this.R) return;
    this.R = R;
    const wrap=(name,fn)=>{const original=R[name].bind(R);R[name]=(...args)=>fn(original,...args);};
    wrap('ArgCount',(base,effect)=>arities[effect]??base(effect));
    wrap('Handles',(base,effect,skill)=>custom.has(effect)||base(effect,skill));
    wrap('Entries',(base,skill)=>this.Entries(skill)||base(skill));
    wrap('Apply',(base,b,a,d,s,e,args,damage,first)=>custom.has(e)?this.Apply(b,a,d,s,e,args,damage,first):base(b,a,d,s,e,args,damage,first));
    wrap('ClearTurnEffects',(base,pet)=>R.Get(pet,'chProtectedEffects')?0:base(pet));
    wrap('IsStatusImmune',(base,pet)=>base(pet)||(this.Soul(pet)&&id(pet)===3022&&this.State(pet).hamoImmune));
    wrap('Inflict',(base,target,status,turns,skillId)=>{
      if(R.Get(target,'chReflectStatus')){const b=target.championBattle;const foe=b&&this.Foe(b,target);if(foe&&!R.IsStatusImmune(foe))base(foe,status,turns,skillId);return false;}
      return base(target,status,turns,skillId);
    });
    wrap('Priority',(base,b,pet,skill)=>{
      const state=this.State(pet),foe=this.Foe(b,pet);let amount=base(b,pet,skill)+(R.Get(pet,'chPriority')?.amount||0);
      if(this.Has(skill,881)&&R.HasDebuff(pet))amount+=3;
      if(this.Has(skill,779)&&R.HasBuff(foe))amount+=2;
      if(this.Soul(pet)&&id(pet)===3481&&!this.BossBattle(b)&&state.gayaNextTurn===b.turn)amount+=2;
      if(this.Soul(pet)&&id(pet)===3406&&!this.BossBattle(b))amount+=(state.reyFirst?1:0)+(state.reyCharges>0?3:0);
      return amount;
    });
    wrap('Power',(base,a,d,s,power)=>base(a,d,s,power)+(this.Has(s,882)?positive(a)*30:0));
    wrap('ResolveHit',(base,b,a,d,s,first,check)=>{
      const state=this.State(a);state.reyChargeForUse=state.reyCharges>0;if(state.reyCharges>0)state.reyCharges--;
      state.reyParalyzeChance=d.hp/d.maxHp*100;
      const consume=R.Get(a,'chFailNext');if(consume){delete R.States(a).chFailNext;return false;}
      if(s.category===4&&R.Get(d,'chStatusBlock')&&R.Chance(R.Get(d,'chStatusBlock').chance))return false;
      const hit=base(b,a,d,s,first,check);
      if(hit&&this.Has(s,1209))this.State(a).stageClearExtra=50*(this.ClearStages(a)+this.ClearStages(d));
      return hit;
    });
    wrap('AttackSide',(base,b,a,d,s,damage,first)=>{
      let value=base(b,a,d,s,damage,first),extra=0;
      const state=this.State(a),entries=this.Entries(s)||[];
      const boost=R.Get(a,'chDamageBoost');if(boost)value*=1+boost.percent/100;
      const next=R.Get(a,'chNextDamage');if(next){value*=1+next.percent/100;if(--next.count<=0)delete R.States(a).chNextDamage;}
      if(this.Soul(a)&&!this.BossBattle(b)){
        if(id(a)===3406){extra+=65*(state.reyBuffKinds||0);if(state.reyChargeForUse)value*=2;}
        if(id(a)===3481){if((state.previousDamage||0)<200)value*=2;extra+=Math.floor((state.previousDamage||0)/2);if(!(d.battleLevels[1]>0||d.battleLevels[3]>0))state.gayaNextTurn=b.turn+1;}
      }
      for(const e of entries){
        if(e.id===429)extra+=Math.min(e.args[2],e.args[0]+(R.Streak(b,a,s)-1)*e.args[1]);
        if(e.id===683)extra+=R.Rand(e.args[0],e.args[1]);
        if(e.id===1136&&a.hp>a.maxHp/e.args[0])extra+=Math.floor(a.hp/e.args[1]);
        if(e.id===1209)extra+=state.stageClearExtra||0;
      }
      state.stageClearExtra=0;
      state.extraFixedDamage=extra;
      return Math.floor(value);
    });
    wrap('Damage',(base,b,a,d,s,damage,kind,first)=>{
      this.State(a).extraFixedDamage=0;
      const damageResult=base(b,a,d,s,damage,kind,first);
      this.State(a).extraFixedDamage=0;
      return damageResult;
    });
    wrap('Lose',(base,b,source,pet,amount,skill,kind,mode)=>base(b,source,pet,kind==='fixed'?this.ReduceFixed(b,pet,amount):amount,skill,kind,mode));
    wrap('DefenderSide',(base,b,a,d,s,damage,kind)=>{
      const ignoreImmune=this.Has(s,699),ignoreCap=this.Has(s,697);
      const immune=R.Get(d,'immuneTurn'),category=R.Get(d,'immuneCategory');
      const blocked=!ignoreImmune&&(R.Get(d,'block')||R.Get(d,'genderShield')||R.Get(d,'immuneReflect')||R.Get(d,'chAllAttackBlock')||R.Get(d,'chAttackBlock')||(immune&&immune.turn===b.turn)||(category&&category.category===s.category));
      const extra=this.State(a).extraFixedDamage||0;
      if(kind==='attack'&&extra>0){
        this.State(a).extraFixedDamage=0;
        const allowed=require('./BossSpecialRules').BossSpecialRules.ModifyDamageToBoss(b,a,d,s,extra,'fixed');
        damage+=blocked?allowed:this.FixedReduction(d,allowed);
      }
      const states=R.States(d),removed=[];
      if(ignoreImmune)for(const key of ['immuneTurn','genderShield','immuneReflect','immuneCategory','block'])if(states[key]){removed.push([key,states[key]]);delete states[key];}
      if(ignoreCap&&states.cap){removed.push(['cap',states.cap]);delete states.cap;}
      let value;
      try{value=base(b,a,d,s,damage,kind);}finally{for(const [key,state]of removed)states[key]=state;}
      if(value<=0)return value;
      if(kind==='attack'&&!ignoreImmune&&(R.Get(d,'chAllAttackBlock')||R.Get(d,'chAttackBlock'))){const block=R.Get(d,'chAttackBlock');if(block&&--block.count<=0)delete states.chAttackBlock;return 0;}
      const reduction=R.Get(d,kind==='attack'?'chAttackReduction':'chFixedReduction');
      if(reduction){value*=1-reduction.percent/100;if(--reduction.count<=0)delete states[kind==='attack'?'chAttackReduction':'chFixedReduction'];}
      if(this.Soul(d)&&id(d)===3022){const reduction=Math.max(0,75-Math.floor((d.maxHp-d.hp)*10/d.maxHp)*15);value*=1-reduction/100;}
      if(this.Soul(d)&&id(d)===3481&&!this.BossBattle(b)&&this.State(d).gayaHadStatus)value*=.5;
      return Math.floor(value);
    });
    wrap('AfterAttack',(base,b,a,d,s,damage,first)=>{
      const state=this.State(a);state.damageThisTurn=(state.damageThisTurn||0)+damage;
      const attack=s.category===1||s.category===2;
      const punish=R.Get(d,attack?'chAttackPunish':'chStatusPunish');
      if(punish){
        if(attack){
          const target=this.State(a);target.baseMaxHp||=a.maxHp;
          target.maxHpScale=(target.maxHpScale||1)*(1-1/punish.divisor);
          a.maxHp=Math.max(1,Math.floor(target.baseMaxHp*target.maxHpScale));a.hp=Math.min(a.hp,a.maxHp);
          target.maxHpApplied=a.maxHp;target.appliedScale=target.maxHpScale;
        }else R.Put(d,'chAttackBlock',Infinity,{count:punish.count});
      }
      if(this.Soul(a)&&id(a)===3406&&!this.BossBattle(b)&&state.reyFirst&&attack&&R.Chance(state.reyParalyzeChance))R.Inflict(d,0,3,s.id);
      base(b,a,d,s,damage,first);
      if(s.id===20269)R.Stage(a,5,1);
      const drain=R.Get(a,'chDrainOnUse');if(drain){const amount=Math.floor(d.maxHp/drain.divisor)*(a.hp<a.maxHp/drain.threshold?2:1);const before=d.hp;R.Lose(b,a,d,amount,s,'fixed','percent');R.Heal(a,before-d.hp);}
      if(state.consumeIgnoreDefense){delete R.States(a).chIgnoreDefense;delete state.consumeIgnoreDefense;}
    });
    wrap('Pending',(base,b,pet,effect)=>{base(b,pet,effect);const side=pet===b.player?'player':'enemy';b.pendingEntry[side].fromIdentity=identity(pet);});
    wrap('OnEntry',(base,b)=>{for(const side of ['player','enemy']){this.RestoreState(b,b[side],side);const pending=b.pendingEntry?.[side];if(pending&&pending.from===b[side]&&pending.fromIdentity!==identity(b[side]))pending.from=null;}return base(b);});
    wrap('TurnEnd',(base,b)=>{base(b);this.EndTurn(b);});
  }
}
exports.ChampionPetRuntime=ChampionPetRuntime;
