'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { applyRankings } = require('./pet-cultivation-rankings.cjs');
const attrs = text => Object.fromEntries([...text.matchAll(/([\w]+)="([^"]*)"/g)].map(m => [m[1], m[2].replaceAll('&amp;', '&').replaceAll('&quot;', '"')]));
const numbers = text => String(text || '').trim().split(/\s+/).filter(Boolean).map(Number);
const statKeys = ['HP', 'Atk', 'Def', 'SpAtk', 'SpDef', 'Spd'];
const statNames = ['体力', '攻击', '防御', '特攻', '特防', '速度'];
const tierNames = ['夯', '顶级', '人上人', 'NPC', '拉'];
const methodology = [
  '默认综合培养榜：种族40、技能35、已接入魂印15、环境适配10。分数是规则初评，不是胜率或逐只实战通关结论。',
  '种族基础同时比较总和、有效主攻、速度与生存分布；以当前终形目录分位计算，不把双攻简单重复加分。',
  '擂台榜提高速度和生存权重，按三座擂台当前固定阵容计算属性覆盖与开场速度。无战斗道具，不把吃药算作续航。',
  'Boss榜单独保留消强、削血与辅助接力的用途评价；低面板工具宠的专项价值不再冒充综合战力。',
  '夯≥85，顶级≥70，人上人≥55，NPC≥35，拉<35。当前形态独立评价；默认终形，可切换查看幼体，不借用进化后数值。',
  '比较基准为100级、31个体、合法510学习力及中性性格；不假定随机特性已开启。魂印只计算当前运行时已接入的能力，未知效果明确不加分。',
  '推荐四个常规技能与独立第五技能分开，均来自当前可学配置；实际配招仍需结合属性克制、队伍和具体选手。',
  '获取难度不扣战力分，查询不写玩家存档。未确认来源不等于已开放；Boss自身被动不能算给玩家同种精灵。'
];
// Four dimensions, not an unexplained tier override. Kits are checked against current learnable moves.
const curated = {
  '丽莎布布': {scores:[39,24,18,14],role:'续航消强',summary:'一只覆盖消强、双防强化、回复与寄生，适合长期攻坚。',moves:['叶绿光束','花草护体','光合作用','寄生种子'],ev:[0,4],why:'叶绿光束处理敌方强化；花草护体配合光合作用稳住回合。寄生有效时再提供持续削血与回复。',limit:'草系与寄生免疫Boss不能靠寄生；火、飞行等克制局面需换队友。可把寄生换成金光绿叶补输出。'},
  '哈莫雷特': {scores:[36,23,19,13],role:'强化站场',summary:'龙之意志同时提升多项能力，是稳定站场主力。',moves:['龙之意志','龙王灭碎阵','龙王波','回避'],ev:[0,1],why:'高体力与双防提供强化空间；强化后兼顾输出与生存，龙王波提供必中选择。',limit:'不是自己的Boss版本：没有水火草顺序护盾。连续强化怕消强与暴击，缺少直接回复，需要药品或队友。'},
  '谱尼': {scores:[38,24,20,14],role:'续航消强',summary:'高面板、消强、回复与回PP兼备，长期战斗能力突出。',moves:['圣灵魔闪光','圣堂之门','轮回','永恒'],ev:[0,3],why:'圣堂之门消强；轮回复满体力；永恒恢复技能PP，构成可持续作战的技能组。',limit:'玩家谱尼没有七封印或六条命。比例伤害仍受Boss规则限制；高伤害回合先处理生存。'},
  '布鲁克克': {scores:[38,22,15,12],role:'比例削血',summary:'海洋之心用机制弥补面板，高血量Boss的专职削血手。',moves:['海洋之心','洒水','吸水','蓝光水泵'],ev:[0,4],why:'海洋之心在本服按对手最大体力的1/4计算，经Boss免疫与减伤判定；比单纯堆输出更有效率。',limit:'哈莫雷特顺序护盾、谱尼封印等会阻止这种伤害。不是所有Boss都能四次解决；先确认机制再上场。'},
  '布林克克': {scores:[38,22,16,12],role:'比例削血',summary:'海洋之心配合攻击弱化，是高血量关卡的专用工具。',moves:['海洋之心','彷徨','吸水','混沌潮汐'],ev:[0,2],why:'海洋之心负责削血；彷徨降低物攻，为后续削血争取回合。',limit:'比例伤害和能力下降均可能被Boss免疫；不要把Boss布林克克的专属免疫当成自身能力。'},
  '斯普林特': {scores:[39,23,16,10],role:'自爆接力',summary:'灵魂寄托给下一只精灵两回合必暴，团队收益高于单宠面板。',moves:['灵魂寄托','黑暗遮蔽','虚空之身','紫雾霜冻'],ev:[0,5],why:'牺牲自己换下一只精灵的暴击窗口；适合让主攻手在有限安全回合爆发。',limit:'必须成功出手才有接力收益；耗掉一只队员，不适合无计划自爆。下一只仍受属性与Boss规则限制。'},
  '魔焰猩猩': {scores:[31,22,17,10],role:'强化输出',summary:'高速双攻手；绝命是额外解法，不是稳定通关保证。',moves:['觉醒','不灭之火','压迫','绝命火焰'],ev:[3,5],why:'觉醒提升双攻；压迫削弱物攻；绝命火焰提供低概率秒杀路线。',limit:'绝命火焰配置概率仅5%，免疫秒杀与特殊护盾可挡住它。稳定打法优先强化后用不灭之火。'},
  '鲁斯王': {scores:[29,21,18,12],role:'物攻主力',summary:'剑舞与高物攻提供可靠的水系输出，克制可作针对解法。',moves:['剑舞','湍流龙击打','克制','虚张声势'],ev:[0,1],why:'剑舞快速提升物攻，体力基础高；克制适合能承受对手攻击的特定局面。',limit:'反伤有先后手和承伤条件，不能当无条件固定伤害。缺少回复，持续站场需要补给。'},
  '盖亚': {scores:[30,22,17,12],role:'消强输出',summary:'消强、强攻、回复集中在一套技能中，适合攻坚。',moves:['石破天惊','返璞归真','神经修复','不灭斗气'],ev:[0,1],why:'石破天惊兼顾伤害和消强；返璞归真提高攻击与命中，神经修复提供续航。',limit:'战斗系有明确克制边界；先消强还是先强化取决于Boss伤害，不宜无脑叠满。'},
  '雷伊': {scores:[29,21,16,12],role:'高速电攻',summary:'神技配置已在本服技能表中，高速强化与消强形成完整输出链。',moves:['雷神觉醒','雷神天明闪','极光刃','雷祭'],ev:[1,5],why:'雷神觉醒提升进攻节奏；极光刃消强；雷祭只在不免疫麻痹的对局中提供控制。',limit:'体力与防御偏低，地面系对局不宜硬打。不能假设雷祭能控制全部Boss。'},
  '沙罗希瓦': {scores:[31,18,16,10],role:'比例削血',summary:'魑魅魍魉是削血手段，还能切换暗影输出。',moves:['魑魅魍魉','黑暗之核','暗影跳跃','魂之挽歌'],ev:[0,3],why:'按对手最大体力1/5削血，黑暗之核强化特攻，具备工具与输出两种用途。',limit:'比例削血被免疫时必须改走输出；暗影跳跃只能争取回合，不能无条件无限规避。'},
  '阿克希亚': {scores:[26,17,16,8],role:'秒杀专用',summary:'极度冰点提供特殊过关路线，但命中与免疫限制明显。',moves:['极度冰点','极冰风暴','寒流','寒冰护体'],ev:[0,3],why:'极度冰点可尝试秒杀允许此机制的Boss；特攻面板也能支持冰系输出。',limit:'技能效果概率100%不等于命中率100%；不能突破秒杀免疫或关卡护盾，不能作为稳定通用主力。'},
  '波克尔': {scores:[25,13,11,7],role:'压血工具',summary:'同生共死有独特压血作用，低面板也有专项价值。',moves:['同生共死','高速移动','燕返','手下留情'],ev:[1,5],why:'同生共死可在允许固定伤害的对局中压血；手下留情用于捕捉，不计入Boss机制分。',limit:'自身剩余体力与出手顺序决定效果。哈莫雷特等特殊Boss会阻挡，不能复制旧版无视机制打法。'},
  '查尔顿': {scores:[23,16,18,10],role:'防守消耗',summary:'双防与减伤技能突出，适合承伤争取回合。',moves:['坚韧','固若金汤','威慑','凶猛冲撞'],ev:[0,4],why:'坚韧提升双防，威慑降低敌方物攻；适合能被弱化、不会强制清场的Boss。',limit:'缺少直接回复且输出慢，不能仅靠高防保证通关；固定伤害、暴击与消强需另作处理。'},
  '卡鲁克斯': {scores:[27,19,17,11],role:'弱化物攻',summary:'破攻与破甲配合强化，是地面系攻坚选手。',moves:['破攻','破甲','大地之力','爆裂极突刺'],ev:[0,1],why:'先压低敌方攻击，再强化自身进攻；可兼任物攻队的破甲辅助。',limit:'能力下降免疫会削弱核心价值；地面系面对飞行等无效属性不要硬打。'},
  '丘波': {scores:[8,7,4,8],role:'进化前培养',summary:'当前形态缺少核心攻坚技能，不把进化后技能算给它。',moves:[],ev:[0,3],why:'种族值与技能池都处于早期阶段；先培养进化，再评价成型能力。',limit:'网上俗称的低级工具用法不能直接套到本服：当前可学表没有斜转以外的完整终形技能组。'}
};
function buildCatalogue({base, fusionBase = base, seaVortex}) {
  const inputs = [];
  function read(rel, dir = base) { const file = path.join(dir, rel); inputs.push(file); return fs.readFileSync(file, 'utf8'); }
  const json = rel => JSON.parse(read('app/config/data/json/' + rel));
  const petXml = read('app/config/data/xml/pets.xml');
  const pets = new Map([...petXml.matchAll(/<Monster\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Monster>)/g)].map(m => [Number(attrs(m[1]).ID), {...attrs(m[1]), body:m[2] || ''}]));
  const skills = new Map([...read('app/config/data/xml/skills.xml').matchAll(/<Move\b([^>]*?)\/>/g)].map(m => [Number(attrs(m[1]).ID), attrs(m[1])]));
  const sptXml = read('app/config/data/xml/spt.xml');
  const learnable = new Map([...sptXml.matchAll(/<Monster\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Monster>)/g)].map(m => [Number(attrs(m[1]).ID), m[2] || '']));
  const items = new Map([...read('app/config/data/xml/items.xml').matchAll(/<Item\b([^>]*?)\/?\s*>/g)].map(m => [Number(attrs(m[1]).ID), attrs(m[1])]));
  const maps = json('map-ogres.json').maps, acquisition = json('pet-acquisition.json'), branches = json('special-evolutions.json').branches;
  const abilities = json('pet_abilities.json').abilities, bosses = json('boss_abilities.json').bossConfigs;
  const typeFile = path.join(__dirname,'../compat/client-patches/fusion-manual/native-types.json');
  inputs.push(typeFile);
  const types = JSON.parse(fs.readFileSync(typeFile,'utf8')).types;
  const runtimeFile = path.join(__dirname,'../compat/server-patches/skill-effects/SkillEffectRuntime.ts');
  inputs.push(runtimeFile);
  const runtime = fs.readFileSync(runtimeFile,'utf8');
  const argCount = {...vm.runInNewContext('(' + runtime.match(/const ARG_COUNT[^=]*=\s*({[\s\S]*?});/)[1] + ')', {}, {timeout:1000}),
    ...JSON.parse(read('app/dist/GameServer/Game/Battle/ChampionEffectArguments.json'))};
  const descriptionsFile = path.join(__dirname,'../compat/server-patches/champion-pets/descriptions.json');
  inputs.push(descriptionsFile,path.join(__dirname,'pet-cultivation-rankings.cjs'));
  const specialDescriptions = JSON.parse(fs.readFileSync(descriptionsFile,'utf8'));
  const handler = read('app/dist/GameServer/Server/Packet/Recv/Pet/PetFusionHandler.js',fusionBase);
  const start = handler.indexOf('const RECIPES = ['), end = handler.indexOf('function petConfig(');
  if(start<0 || end<start) throw Error('Unknown fusion rule layout');
  const fusion = vm.runInNewContext(handler.slice(start,end)+';({RECIPES,MIRACLES,BEIGE})',{}, {timeout:1000});
  const name = id => pets.get(Number(id))?.DefName || '精灵#'+id;
  const mapName = id => maps[id]?.name || '地图#'+id;
  const direct = new Map();
  const add = (id, text, kind='task', target=null) => { id=Number(id); if(!direct.has(id))direct.set(id,[]); if(!direct.get(id).some(r=>r.text===text))direct.get(id).push({kind,text,...(target?{target}: {})}); };
  const giveItem = (id,text,kind='task',target=null) => { const item=items.get(Number(id)); if(Number(item?.BreedMonID)) add(item.BreedMonID,text+'获得'+item.Name+'，在基地分子转化仪孵化30分钟',kind,target); };
  const farms = Array.from({length:6},()=>[]);
  for(const [mid,map] of Object.entries(maps)) for(const o of map.ogres || []) {
    if(o.isBoss || Number(o.weight ?? 1)<=0)continue;
    if(o.catchable!==false)add(o.petId,map.name+'捕捉'+name(o.petId),'wild',{mapId:Number(mid)});
    const yields=numbers(pets.get(o.petId)?.YieldingEV);
    yields.forEach((v,i)=>{if(v>0&&yields.filter(n=>n>0).length===1)farms[i].push({level:o.level || o.minLevel || 100,text:map.name+' · '+name(o.petId)+'（基础每只+'+v+'）'});});
    for(const d of o.dropItems || []) if(d.dropRate>0)giveItem(d.itemId,map.name+'击败'+name(o.petId)+'掉落');
  }
  for(const id of acquisition.exchange.petIds)add(id,'每日签到：每天可选1只收藏精灵，1级入仓，北京时间00:00刷新','collection');
  for(const o of acquisition.wild || [])add(o.petId,(o.name || mapName(o.mapId))+'稀有野外遭遇后捕捉','wild',{mapId:Number(o.mapId)});
  for(const o of acquisition.mechanisms || [])add(o.petId,mapName(o.mapId)+'场景机关触发后捕捉'+(o.petId===153?'（寒流枪）':o.petId===178?'（堵住洞口）':''),'wild',{mapId:Number(o.mapId)});
  for(const o of acquisition.disguises || [])add(o.petId,'与'+o.hostIds.slice(0,3).map(name).join('、')+'等指定宿主对战时可能出现，出现后捕捉','wild');
  for(const boss of bosses) {
    const location=boss.mapId===514?'太空站左翼勇者之塔进入神秘领域':boss.mapId===110&&boss.param2>=1000?'暗黑武斗场第'+(Math.floor((boss.param2-1000)/6)+1)+'门':mapName(boss.mapId);
    const where=location+'击败'+boss.petName+(boss.comment?'；'+boss.comment:'')+(boss.hint?'；机制与前置：'+boss.hint:'');
    const target={mapId:boss.mapId===514?108:Number(boss.mapId)};
    if(boss.spt?.rewardPetId)add(boss.spt.rewardPetId,where+'，首次胜利奖励','boss',target);
    if(boss.spt?.rewardItemId)giveItem(boss.spt.rewardItemId,where+'，首次胜利','boss',target);
    for(const d of boss.drops || [])if((d.dropRate ?? d.rate ?? 1)>0)giveItem(d.itemId,where+'掉落','boss',target);
  }
  const tasks=json('tasks.json').tasks;
  for(const [id,t] of Object.entries(tasks)) {
    for(const p of t.rewards?.pets || []) {
      const detail=Number(id)===28?'：完成新手训练营后向实验室博士接取，经赫尔卡星神秘通道进入精灵广场，投石拾取机械残骸；在赫尔卡星遗迹检查巨型机器人的耳部并取得图纸，返回博士完成奇塔拼装。每号一次，奖励'+p.level+'级'+name(p.petId)+'，满包入仓库。':'';
      add(p.petId,'完成任务#'+id+'「'+(t.name || t.title || '任务奖励')+'」获得'+detail);
    }
    for(const item of t.rewards?.items || [])giveItem(item.itemId ?? item.id,'完成任务#'+id+'奖励');
  }
  for(const g of json('gacha_rewards.json'))giveItem(g.itemID,'瞭望露台扭蛋机随机抽取');
  const seaFile=path.join(base,'app/config/data/json/sea_vortex.json');
  if(seaVortex===undefined && fs.existsSync(seaFile))seaVortex=json('sea_vortex.json');
  if(seaVortex)for(const reward of seaVortex.rewards) {
    if(!reward.petId || reward.weight<=0)continue;
    add(reward.petId,'深海宫殿救援（'+seaVortex.mapId+'）：完成尼古尔湖初见（任务#'+seaVortex.introTaskId+'）后，从湖中旋涡进入。头部射击拖拽海盗'+seaVortex.shotsRequired+'次，或击败移动、驻守海盗，再开救援壳，可能触发'+reward.level+'级精灵捕捉战。需自行捕捉，可重复救援；待捕捉遭遇重登保留，实际开战后消耗。');
  }
  const arenaFile='app/dist/GameServer/Game/Battle/StarArenaCatalog.json';
  for(const arena of JSON.parse(read(arenaFile)).arenas)
    add(arena.rewardPetId,'从地图#'+arena.entryMapId+'的星系入口前往地图#'+arena.mapId+'，首冠后领取100级'+arena.rewardName+'；每号每星系仅一次，满包入仓库。');
  for(const id of [1,4,7])add(id,'创建角色时可选的初始精灵之一');
  const collectionSource=read('app/dist/GameServer/Game/Pet/CollectReward.js');
  const collectionLiteral=collectionSource.match(/exports\.COLLECT_GROUPS = ({[\s\S]*?\n});/);
  if(!collectionLiteral)throw Error('Unknown collection reward layout');
  const collections=vm.runInNewContext('('+collectionLiteral[1]+')',{}, {timeout:1000});
  for(const [group,c] of Object.entries(collections))for(const id of c.rewardIds) {
    add(id,group==='301'?'精灵王获胜10次后，到实验室领取对应收集奖励；同系初始精灵已拥有时不能重复领取。':'实验室「精灵收集奖励」第'+group+'组：先集齐'+c.families.map(f=>f.map(name).join('/')).join('、')+'各系至少一只，再领取奖励。');
  }
  const towerSource=read('app/dist/GameServer/Game/Battle/FreshTower.js');
  const towerIds=towerSource.match(/const STARTER_IDS = \[([\d,\s]+)\]/);
  if(!towerIds)throw Error('Unknown fresh tower reward layout');
  for(const id of towerIds[1].split(',').map(Number))add(id,'试炼之塔通关30层，补发尚未拥有的5级初始精灵');
  for(const r of fusion.RECIPES) {
    add(r.pet,'实验室固定融合：'+r.main.map(name).join('/')+' + '+r.sub.map(name).join('/')+' + '+items.get(r.essence).Name+'×1；消耗1000赛尔豆与双亲，元神珠孵化。详见旁边融合手册。');
    if(r.rare)add(r.rare.pet,'固定融合的稀有粉色元神珠分支；具体双亲、概率见融合手册');
  }
  for(const r of fusion.MIRACLES)for(const [id] of r.weights)add(id,'以'+name(r.main)+'为主宠的奇迹融合随机结果；完整副宠条件、材料与概率见融合手册');
  for(const id of fusion.BEIGE.pets)add(id,'未匹配固定或奇迹配方的米色元神珠结果之一；具体限制见融合手册');
  for(const farm of farms)farm.sort((a,b)=>a.level-b.level);
  function route(id,seen=new Set()) {
    if(seen.has(id))throw Error('Evolution cycle '+id);
    seen.add(id);
    const result=[...(direct.get(id)||[])];
    const p=pets.get(id), prev=pets.get(Number(p?.EvolvesFrom));
    if(prev && Number(prev.EvolvingLv)>0) {
      const branch=(branches[prev.EvolvFlag] || []).find(b=>b.petId===id);
      const ordinary=Number(prev.EvolvesTo)===id && Number(prev.EvolvFlag||0)===0;
      if(ordinary || branch) {
        const origin=route(Number(prev.ID),new Set(seen));
        const evolution=name(prev.ID)+'达到'+prev.EvolvingLv+'级'+(branch?.count?'，消耗'+(items.get(branch.itemId)?.Name || '道具#'+branch.itemId)+'×'+branch.count:'')+'后进化。';
        for(const source of origin)result.push({...source,kind:'evolution',text:evolution+'前置获取：'+source.text});
      }
    }
    return result;
  }
  function effectList(s) {
    const args=numbers(s.SideEffectArg); let offset=0;
    return numbers(s.SideEffect).map(id=>{const count=argCount[id]; const a=count===undefined?[]:args.slice(offset,offset+count); offset+=count || 0; return {id,a};});
  }
  function description(s) {
    const prefix=(Number(s.Category)===1?'物理':Number(s.Category)===2?'特殊':'属性')+' / 威力'+(s.Power || 0)+' / PP'+s.MaxPP+' / '+(Number(s.MustHit)===1?'必中':'命中'+(s.Accuracy || 100));
    if(specialDescriptions[s.ID])return prefix+'；'+specialDescriptions[s.ID].replace(/\r/g,'；');
    const parts=effectList(s).map(({id,a})=> {
      if(id===4 || id===5)return (id===4?'自身':'对手')+(['攻击','防御','特攻','特防','速度','命中'][a[0]] || '能力')+(a[2]>0?'+':'')+a[2]+'级（'+a[1]+'%）';
      if(id===28 && Number(s.Category)===4)return '削减对手最大体力的1/'+a[0]+'，受Boss免疫限制';
      if(id===36)return a[0]+'%秒杀效果，另需命中且Boss不免疫';
      if(id===13)return '寄生'+a[0]+'回合，草系/寄生免疫无效';
      if(id===33)return '消除对手能力提升';
      if(id===43)return '回复自身最大体力的1/'+a[0];
      if(id===1)return '吸收伤害的一部分回复体力';
      if(id===7)return '同生共死压血，受特殊Boss规则限制';
      if(id===71)return '自身阵亡，下一只精灵两回合必暴';
      if(id===87)return '恢复自身全部技能PP';
      if(id===52)return '规避攻击'+a[0]+'回合';
      if(id===49)return '抵挡'+a[0]+'点伤害';
      if([10,11,12,14,15,16,22].includes(id))return a[0]+'%异常效果，免疫目标无效';
      return null;
    }).filter(Boolean);
    return prefix+(parts.length?'；'+parts.join('；'):'；按游戏技能详情处理附加效果');
  }
  const result=[], learnById=new Map();
  for(const [id,p] of pets) {
    if(!statKeys.every(k=>p[k]!==undefined && Number.isFinite(Number(p[k]))))continue;
    const stats=statKeys.map(k=>Number(p[k])), total=stats.reduce((a,b)=>a+b,0);
    const moveSections=[p.body,learnable.get(id) || ''].map(body=>body.match(/<LearnableMoves>([\s\S]*?)<\/LearnableMoves>/)?.[1] || '').join('\n');
    const moveLevels=new Map();
    for(const match of moveSections.matchAll(/<Move\b([^>]*?)\/>/g)) {
      const move=attrs(match[1]), moveId=Number(move.ID), level=Number(move.LearningLv);
      if(level<=100 && skills.has(moveId))moveLevels.set(moveId,Math.min(moveLevels.get(moveId) ?? 100,level));
    }
    const learn=[...moveLevels].map(([moveId,level])=>({...skills.get(moveId),level}));
    learnById.set(id,learn);
    const has=fx=>learn.some(s=>effectList(s).some(e=>e.id===fx));
    const boost=learn.some(s=>effectList(s).some(e=>e.id===4&&[0,2].includes(e.a[0])&&e.a[1]===100&&e.a[2]>0));
    const heal=has(43), clear=has(33), percent=learn.some(s=>Number(s.Category)===4&&effectList(s).some(e=>e.id===28)), seed=has(13), relay=has(71);
    const physical=stats[1]>=stats[3], attackCat=physical?1:2;
    const attacks=learn.filter(s=>Number(s.Category)===attackCat).sort((a,b)=>Number(b.Power||0)-Number(a.Power||0));
    const stable=attacks.some(s=>Number(s.Power)>=90 && (Number(s.MustHit)===1||Number(s.Accuracy || 100)>=95));
    const utility=(heal?1:0)+(clear?1:0)+(boost?1:0)+(percent?1:0)+(seed?1:0)+(relay?1:0);
    const scores=[Math.min(40,(heal?10:0)+(clear?10:0)+(boost?7:0)+(percent?15:0)+(seed?8:0)+(relay?20:0)+(has(7)?8:0)+(has(36)?4:0)),Math.min(25,6+utility*4+(stable?3:0)),Math.round(Math.min(20,Math.max(0,(Math.max(stats[1],stats[3])+stats[0]+(stats[2]+stats[4])/2-140)/11))),Math.min(15,4+(stable?5:0)+(heal?3:0)+(attacks.some(s=>Number(s.MaxPP)>=10&&Number(s.Power)>=90)?2:0))];
    const c=curated[p.DefName];
    if(c)scores.splice(0,4,...c.scores);
    const score=scores.reduce((a,b)=>a+b,0), tier=score>=85?0:score>=70?1:score>=55?2:score>=35?3:4;
    const role=c?.role || (relay?'自爆接力':percent?'比例削血':seed&&heal?'寄生续航':clear?'消强辅助':heal?'续航站场':boost?'强化输出':physical?'物攻输出':'特攻输出');
    const preferred=c?.moves || [];
    for(const n of preferred)if(!learn.some(s=>s.Name===n))throw Error(p.DefName+' cannot learn '+n);
    const chosen=preferred.map(n=>learn.find(s=>s.Name===n));
    const rank=s=>effectList(s).reduce((v,e)=>v+({71:120,28:110,33:95,43:90,13:80,4:65,5:40,7:50,36:35,52:25}[e.id] || 0),0)+(Number(s.Category)===attackCat?Number(s.Power || 0)/3:0);
    const candidates=[...learn].sort((a,b)=>rank(b)-rank(a));
    if(!chosen.length && attacks.length)chosen.push(attacks[0]);
    for(const s of candidates)if(chosen.length<4&&!chosen.some(m=>m.ID===s.ID))chosen.push(s);
    const reasons=c?[c.why]:[
      '规则初评：'+[clear?'具备消强':null,heal?'具备直接回复':null,boost?'具备稳定攻击强化':null,percent?'具备比例削血':null,seed?'具备寄生':null,relay?'具备自爆接力':null].filter(Boolean).join('、')+(utility?'。':'未识别到高价值攻坚组合，主要依靠常规输出。'),
      '当前形态种族值合计'+total+'，主要输出采用'+(physical?'物攻':'特攻')+'；高面板不会自动得到高机制分。'
    ];
    reasons.push('评分：机制'+scores[0]+'/40 · 通用'+scores[1]+'/25 · 能力'+scores[2]+'/20 · 稳定'+scores[3]+'/15。');
    const caveats=[c?c.limit:'规则初评，不是逐只实战通关结论；未识别的特殊效果不加机制分，面对免疫Boss需调整。'];
    if(Number(p.EvolvesTo)>0)caveats.push('当前仍可进化为'+name(p.EvolvesTo)+'；本页不借用进化后种族值和技能。');
    caveats.push('Boss专属被动不计入玩家能力；异常、比例伤害与秒杀均服从关卡规则。');
    const ev=c?.ev || (percent || relay?[0,5]:heal?[0,physical?1:3]:[physical?1:3,0]);
    const training=[statNames[ev[0]]+'255 + '+statNames[ev[1]]+'255（总计510）。'+(relay?'优先确保能先出手接力。':percent?'先保证能活着连续施放削血技能。':'以100级Boss战为目标；速度只需达到具体关卡的先手线。')];
    for(const i of ev) { if(farms[i].length)training.push('刷'+statNames[i]+'：'+farms[i][0].text+'；启用学习力加成后以面板实得为准。'); }
    if(Number(p.EvolvesTo)>0)training.push('优先完成进化，再投入完整培养资源。');
    const ability=abilities.find(a=>a.name===((percent||relay||heal)?'坚硬':chosen.some(s=>Number(s.Accuracy || 100)<95)?'精准':types[p.Type] && Number(p.Type)<=16?abilities.find(a=>a.args?.[0]===Number(p.Type)&&a.effectId===2028)?.name:'坚硬')) || abilities.find(a=>a.name==='坚硬');
    const routes=route(id);
    result.push({id,name:p.DefName,type:types[p.Type] || '属性#'+p.Type,typeId:Number(p.Type),tier,featured:Boolean(c),score,role,summary:c?.summary || '规则初评 · '+role+'。'+(tier>=3?'优先比较同系完整技能组，再决定投入。':'具备可用于Boss战的技能组合。'),reasons,caveats,stats:{hp:stats[0],atk:stats[1],def:stats[2],spAtk:stats[3],spDef:stats[4],spd:stats[5],total},acquisition:routes.length?routes:[{kind:'unknown',text:'当前配置尚未确认获取途径；仅收录战斗数据，不代表已开放获取。'}],training,moves:chosen.map(s=>({id:Number(s.ID),name:s.Name,level:s.level,description:description(s)})),ability:{name:ability.name,description:ability.description+'。个体随机特性，非本物种专属；不保证能主动选择。'},search:[id,p.DefName,types[p.Type],role,...chosen.map(s=>s.Name)].join(' ')});
  }
  applyRankings(result,{read,pets,learnById,effectList,describe:description,farms});
  for(let tier=0;tier<5;tier++) {
    const rows=result.filter(p=>p.finalForm&&p.tier===tier).sort((a,b)=>b.score-a.score||a.id-b.id);
    rows.forEach((p,i)=>{p.featured=i<6;});
  }
  return {pets:result.sort((a,b)=>b.score-a.score||a.id-b.id),tiers:tierNames,methodology,inputs:[...new Set(inputs)]};
}
module.exports={buildCatalogue};
