package com.robot.module.app
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.UIManager;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.Loader;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.system.LoaderContext;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import gs.TweenMax;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   // Original Taomee SPT panels: SptBg_MC overview (3 cards per page) and SptChannelMc detail/teleport
   // (loaded from the original SptChannelPanel.swf). Bosses without original art reuse the original card
   // frame with the pet's own battle sprite. Data, defeat state and free map travel match the previous panel.
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class SptPanel extends Sprite implements IModule
   {
      private const BOSSES:Array = [{"id":1000,"name":"奥尔德·力量试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":132,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"奥尔德·智慧试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":100,"hp":10000,"sptId":133,"mech":"【智慧试炼】奥尔德体力10000，频繁使用圣洁光芒把挑战者的能力提升转到自己身上。"},{"id":1000,"name":"奥尔德·勇气试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":100,"hp":10000,"sptId":134,"mech":"【勇气试炼】奥尔德体力10000，单次攻击伤害被压低到约100。"},{"id":1000,"name":"奥尔德·正义试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":100,"hp":10000,"sptId":135,"mech":"【正义试炼】奥尔德体力10000，每回合让挑战者陷入烧伤、冻伤或混乱。"},{"id":1000,"name":"奥尔德·仁慈试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":100,"hp":10000,"sptId":136,"mech":"【仁慈试炼】奥尔德体力10000，攻击造成多少伤害就回复多少体力。"},{"id":1000,"name":"奥尔德·坚韧试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":100,"hp":10000,"sptId":137,"mech":"【坚韧试炼】奥尔德体力10000，每回合回复500体力，常用圣者之心并偷取强化。"},{"id":1000,"name":"光明异能王·奥尔德","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":100,"hp":2000,"sptId":131,"mech":"【奥尔德真身】五条命（2千/8千/2万/1.2万/5万）：攻击+2必先手；偷强化；每回合附加异常；PP无限并吸血；PP无限、2倍耗PP、偷强化、免疫瞬杀。"},{"id":47,"name":"蘑菇怪","galaxy":"帕诺星系","loc":"克洛斯星林间","mapId":12,"lv":10,"hp":100,"sptId":1,"mech":"【毒孢子】用物理攻击打蘑菇怪，出手的精灵有30%几率中毒。它的技能PP无限。"},{"id":34,"name":"钢牙鲨","galaxy":"帕诺星系","loc":"海洋星海底","mapId":22,"lv":25,"hp":200,"sptId":2,"mech":"【嗜血】钢牙鲨体力低于三成后，攻击必定暴击。"},{"id":42,"name":"里奥斯","galaxy":"帕诺星系","loc":"火山星山洞深处","mapId":17,"lv":35,"hp":170,"sptId":3,"mech":"【不屈】里奥斯有两条命，第一次被击倒会满血复活。"},{"id":50,"name":"阿克希亚","galaxy":"帕诺星系","loc":"塞西利亚星","mapId":40,"lv":80,"hp":3200,"sptId":4,"mech":"【寒意】每回合寒意+1，满3层时出战精灵被冻住一回合并冻伤。火系技能命中或更换精灵可清空寒意。"},{"id":69,"name":"提亚斯","galaxy":"帕诺星系","loc":"云霄星最高层","mapId":27,"lv":78,"hp":2800,"sptId":5,"mech":"【疾风对决】出场速度+2。它先出手的回合有50%几率闪开你的攻击（必中技能除外）；你先出手的回合它不闪避，受到的伤害+20%。"},{"id":70,"name":"雷伊","galaxy":"帕诺星系","loc":"赫尔卡星荒地","mapId":32,"lv":90,"hp":4500,"sptId":6,"mech":"【蓄雷】每回合蓄1层雷电，满5层放出瞬雷天闪，每层伤害+20%。先制技能命中减1层，地面系技能命中清空。技能先制+2，体力低于40%时必定致命一击，免疫异常。"},{"id":88,"name":"纳多雷","galaxy":"帕诺星系","loc":"双子阿尔法星·阿尔法星岩地","mapId":106,"lv":82,"hp":3600,"sptId":7,"mech":"【沙甲】每回合加1层沙甲，最多4层，每层让它受到的伤害-10%。连击技能每段剥1层，致命一击清空全部。每回合恢复100体力。"},{"id":113,"name":"雷纳多","galaxy":"帕诺星系","loc":"双子贝塔星·贝塔星荒原","mapId":49,"lv":85,"hp":3800,"sptId":8,"mech":"【属性复制】每3回合复制你出战精灵的全部能力提升。体力降到一半后进入过载：每回合特攻+1，同时自损5%体力。"},{"id":132,"name":"尤纳斯","galaxy":"帕诺星系","loc":"拜伦号","mapId":314,"lv":70,"hp":2800,"sptId":9,"mech":"【破防】尤纳斯要先被贯穿水枪破防，之前打它无效；最后一击只能是里奥斯的幻影，持续伤害打不死它。免疫中毒、烧伤、冻伤，PP无限。"},{"id":187,"name":"魔狮迪露","galaxy":"帕诺星系","loc":"斯诺岩洞","mapId":53,"lv":50,"hp":3000000,"sptId":10,"mech":"【300万体力】魔狮迪露有300万体力，属性克制对它无效，体力低于一半后必定先手并会秒杀；可用同生共死、镇魂歌这类招式。PP无限。"},{"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"火山星","mapId":15,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"},{"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"露希欧星","mapId":54,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"},{"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"双子阿尔法星","mapId":105,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"},{"id":393,"name":"上古炎兽","galaxy":"帕诺星系","loc":"火山星山洞","mapId":16,"lv":95,"hp":6500,"sptId":18,"mech":"【熔炉】温度每回合+1。到3级后每回合灼伤出战精灵1/8体力；到5级放出伤害+60%的苍炎日无极，然后归零。水系技能命中降2级，冰系技能命中或致命一击降1级。"},{"id":811,"name":"始祖灵兽","galaxy":"帕诺星系","loc":"克洛斯星地心","mapId":13,"lv":95,"hp":7500,"sptId":20,"mech":"【共生根须】根须缠住出战精灵，每回合吸取它1/8体力，自己回复5%体力。更换精灵或火系技能命中可摆脱，3回合后根须重新缠上。"},{"id":91,"name":"悠悠","galaxy":"帕诺星系","loc":"双子阿尔法星","mapId":105,"lv":50,"hp":4000,"sptId":35,"mech":"【悠然】悠悠每次受到攻击，有20%几率完全挡下这次伤害。"},{"id":216,"name":"哈莫雷特","galaxy":"卡兰星系","loc":"尼古尔星","mapId":57,"lv":80,"hp":10000,"sptId":11,"mech":"【顺序破防】哈莫雷特只受水系、火系、草系技能按顺序轮流命中的伤害，打空也算一次；免疫异常、同生共死和百分比伤害。"},{"id":274,"name":"塔克林","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":90,"hp":5500,"sptId":15,"mech":"【龙威】每回合结束时，出战精灵的攻击、特攻中较高的一项-1。换精灵重置，也可以用解除弱化的技能。"},{"id":391,"name":"塔西亚","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":70,"hp":10000,"sptId":16,"mech":"【龙之结界】用物理攻击打塔西亚，出手的精灵90%会害怕；出场特攻+2，免疫寄生、中毒、烧伤、冻伤和降能力，PP无限。"},{"id":216,"name":"哈莫雷特","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":80,"hp":10000,"sptId":11,"mech":"【顺序破防】哈莫雷特只受水系、火系、草系技能按顺序轮流命中的伤害，打空也算一次；免疫异常、同生共死和百分比伤害。"},{"id":413,"name":"塞维尔","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":90,"hp":5500,"sptId":19,"mech":"【不灭意志】第一次被打到濒死时撑住：3回合内攻击伤害无效、攻击+2。这3回合没击倒任何精灵，它就力竭倒下；击倒了则回复20%体力继续战斗。"},{"id":264,"name":"奈尼芬多","galaxy":"卡兰星系","loc":"艾迪星","mapId":325,"lv":85,"hp":4200,"sptId":12,"mech":"【念力镜】记住上一次受到的是物理还是特殊攻击，再受到同一类攻击时伤害-70%。物理、特殊交替出手。出场特攻、特防、速度+1。"},{"id":421,"name":"厄尔塞拉","galaxy":"卡兰星系","loc":"塔克星·光之迷城","mapId":61,"lv":80,"hp":3000,"sptId":13,"mech":"【每日规则】周一免疫异常，周二闪避50%，周三反弹高伤害，周四每回合回1000，周五无异常时被击倒会复活，周六伤害减半，周日必先手、低血秒杀。"},{"id":347,"name":"远古鱼龙","galaxy":"卡兰星系","loc":"尼古尔水帘","mapId":59,"lv":95,"hp":7000,"sptId":17,"mech":"【潮汐】三回合一循环：涨潮回合末回复300体力；满潮必定放出必中的滔天龙汲水；退潮不回血，受到的伤害+50%。免疫中毒、烧伤、冻伤。"},{"id":479,"name":"冰洛伏特","galaxy":"卡兰星系","loc":"斯科尔高空塔","mapId":331,"lv":90,"hp":5500,"sptId":23,"mech":"【次元冰魄】每4回合使出次元冰魄，伤害等于出战精灵已损失的体力，命中后冻住一回合。放招前把体力回满，或换上满血的精灵。"},{"id":755,"name":"斯普林特","galaxy":"卡兰星系","loc":"地底古迹","mapId":495,"lv":90,"hp":5500,"sptId":76,"mech":"【回旋闪避】每3回合有一个回旋闪避回合，你的攻击全部落空，那回合用强化、回复。你的攻击打空后，它的下一击用破绽打击，伤害+50%。"},{"id":538,"name":"克拉尼特","galaxy":"罗格星系","loc":"戴斯星","mapId":435,"lv":92,"hp":5000,"sptId":26,"mech":"【两种形态】克拉尼特有两条命：第一形态主要靠火龙红莲击，PP耗尽后很弱；被击倒后以第二形态满血复活，招式全部换掉。"},{"id":587,"name":"墨杜萨","galaxy":"罗格星系","loc":"墨杜萨星·石化之城","mapId":438,"lv":90,"hp":9000,"sptId":27,"mech":"【石化凝视】连续两回合使用同一个技能，出战精灵会被石化，下回合无法行动。每回合换着用技能，换精灵也会重新计算。"},{"id":672,"name":"亚伦斯","galaxy":"罗格星系","loc":"拓梯星·活力源泉","mapId":430,"lv":90,"hp":5500,"sptId":31,"mech":"【绝对零度】读条5回合，到点冻结出战精灵，直接倒下。读条期间累计造成1200伤害可打断：它下回合被冻住不行动，受到的伤害+30%。"},{"id":474,"name":"该伊","galaxy":"罗格星系","loc":"陨石地带·巨型陨石","mapId":415,"lv":90,"hp":7000,"sptId":32,"mech":"【以小搏大】威力120以上的技能对它伤害减半。多用中等威力、克制属性的技能。"},{"id":471,"name":"伊特","galaxy":"罗格星系","loc":"比格星·觅食林","mapId":414,"lv":90,"hp":8000,"sptId":33,"mech":"【扎根】每回合结束时回复300体力，之后每回合多回100，最多800。身上有异常时扎根中断，回复量重置。带上能让它中毒、麻痹、睡眠的技能。"},{"id":798,"name":"卡修斯","galaxy":"裂空星系","loc":"炫彩山山脚","mapId":445,"lv":90,"hp":5500,"sptId":57,"mech":"【万山绝影】每3回合结束时全能力+1，强化合计达到4级后攻击必中、必定致命一击。每被消除一次强化，它损失15%当前体力。"},{"id":715,"name":"德拉萨","galaxy":"裂空星系","loc":"怀特矿场","mapId":486,"lv":90,"hp":8000,"sptId":58,"mech":"【浩劫】每回合结束时双方各损失6%最大体力。拖得越久越亏，轮换精灵分摊损失。"},{"id":804,"name":"迪符特","galaxy":"裂空星系","loc":"山神圣殿","mapId":450,"lv":90,"hp":5500,"sptId":59,"mech":"【不知疲倦】每回合攻势+1层，每层伤害+10%，没有上限。体力每降25%清空一次层数和强化。持续压血线，别让它攒层。"},{"id":875,"name":"布莱克","galaxy":"裂空星系","loc":"光明圣坛","mapId":9507,"lv":90,"hp":5500,"sptId":61,"mech":"【决斗】只接受单挑。双方每损失20%体力，伤害+15%。残血时双方都很危险，先压低它的体力。"},{"id":300,"name":"虚无的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第1封印","mapId":108,"lv":100,"hp":7000,"sptId":0,"mech":"【虚无封印】除必中技能外，所有攻击都会落空；出场攻击、特攻+2。"},{"id":300,"name":"元素的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第2封印","mapId":108,"lv":100,"hp":8000,"sptId":0,"mech":"【元素封印】只受光系、暗影系技能的伤害，持续伤害有效。"},{"id":300,"name":"能量的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第3封印","mapId":108,"lv":100,"hp":9000,"sptId":0,"mech":"【能量封印】单次物理或特殊攻击伤害超过500时，出手的精灵被秒杀。"},{"id":300,"name":"生命的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第4封印","mapId":108,"lv":100,"hp":10000,"sptId":0,"mech":"【生命封印】每回合回复2000体力，不会被降低能力。"},{"id":300,"name":"轮回的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第5封印","mapId":108,"lv":100,"hp":10000,"sptId":0,"mech":"【轮回封印】有两条命，第二条命满体力满PP，不会被降低能力。"},{"id":300,"name":"永恒的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第6封印","mapId":108,"lv":100,"hp":12000,"sptId":0,"mech":"【永恒封印】技能PP无限，出场攻击、特攻+2，不会被降低能力。"},{"id":300,"name":"圣洁的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第7封印","mapId":108,"lv":100,"hp":16000,"sptId":0,"mech":"【圣洁封印】只受攻击技能附带的异常造成的伤害，属性技能的异常无效；出场攻击、特攻+2，不会被降低能力。"},{"id":300,"name":"谱尼的真身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·谱尼真身","mapId":108,"lv":100,"hp":7000,"sptId":0,"mech":"【谱尼真身】有六条命，技能PP无限，无视速度必定先手，不会被降低能力。"},{"id":501,"name":"巴斯特","galaxy":"神兽空间","loc":"玄武空间","mapId":401,"lv":90,"hp":5500,"sptId":29,"mech":"【双层装甲】物理、特殊各3层装甲，每层让对应伤害-20%；同类攻击每命中一次剥1层。每4回合结束时各长回1层。集中一种攻击先打穿。"},{"id":504,"name":"菲尼克斯","galaxy":"神兽空间","loc":"朱雀空间","mapId":318,"lv":100,"hp":1500,"sptId":60,"mech":"【朱雀三影】菲尼克斯有四条命：愤怒之影反弹1/4伤害；光芒之影必定先手、闪避20%、半血以下暴击；重生之影两条命，每回合回100。"},{"id":468,"name":"罗德利斯","galaxy":"太空站挑战","loc":"太空站扩展","mapId":405,"lv":90,"hp":5500,"sptId":24,"mech":"【浴火】两条命。第一条命被击倒后浴火重生，攻击、特攻+2，之后每回合结束时自焚8%最大体力。第二条命可以猛攻，也可以守住等它烧尽。"},{"id":426,"name":"迪尔科特","galaxy":"太空站挑战","loc":"太空站扩展","mapId":405,"lv":90,"hp":5500,"sptId":25,"mech":"【连段】连续命中会叠连段，每层伤害+25%（最多6层）。被你先出手命中，或它的攻击落空时连段中断。速度快的精灵更好打。"},{"id":115,"name":"巨型树妖","galaxy":"太空站挑战","loc":"精灵召唤场","mapId":502,"lv":40,"hp":2400,"sptId":0,"mech":"【召唤与护盾】在精灵召唤场点任一圆环召唤巨型树妖，一分钟内喷火命中五次打破防护罩，才能挑战它。"},{"id":983,"name":"塔奇多克","galaxy":"太空站挑战","loc":"训练师之门（草系）","mapId":102,"lv":85,"hp":3800,"sptId":67,"mech":"【藤蔓缠绕】被它命中的精灵会被藤蔓缠住，每回合速度-1、被吸取1/16体力给它回血。先制技能命中或更换精灵可以挣脱。"},{"id":992,"name":"火噜噜","galaxy":"太空站挑战","loc":"训练师之门（火系）","mapId":102,"lv":85,"hp":3800,"sptId":68,"mech":"【怒焰】每受到一次攻击怒气+1（最多5层），每层让它的火系伤害+15%；怒气满时放出怒焰火锤并清空。出手次数少、单发高更划算。"},{"id":1008,"name":"查德洛","galaxy":"太空站挑战","loc":"训练师之门（超能系）","mapId":102,"lv":85,"hp":3800,"sptId":69,"mech":"【念力屏障】你先出手打它时伤害-50%，后出手时全额。慢速高攻的精灵更好打。"},{"id":1031,"name":"多尔尼","galaxy":"太空站挑战","loc":"训练师之门（水系）","mapId":102,"lv":85,"hp":3800,"sptId":70,"mech":"【剧毒】被它命中的精灵身中剧毒，毒伤从1/16体力起每回合翻倍，最高1/4；剧毒不会致死。更换精灵会重置倍数，但毒不会解。"},{"id":1051,"name":"加耶罗","galaxy":"太空站挑战","loc":"训练师之门（飞行系）","mapId":102,"lv":85,"hp":3800,"sptId":71,"mech":"【浮空】第1回合起每4回合放出浮空连击，被击中的精灵2回合内物理技能都会落空。带特殊技能，或在它放招前换下精灵。"},{"id":1079,"name":"岩锤怪","galaxy":"太空站挑战","loc":"训练师之门（地面系）","mapId":102,"lv":85,"hp":3800,"sptId":72,"mech":"【碎甲连锤】每3回合使出疯狂连锤，每命中一段让出战精灵防御-1（每次最多-3）；防御降到-6时它的下一击必定击倒。更换精灵即可清除。"},{"id":1083,"name":"LYN","galaxy":"太空站挑战","loc":"训练师之门（机械系）","mapId":102,"lv":85,"hp":3800,"sptId":73,"mech":"【火力压制】某回合你对它造成的伤害不足300，下回合你必定后出手、攻击命中-20%。不要空过回合。"},{"id":1099,"name":"达克其","galaxy":"太空站挑战","loc":"训练师之门（暗影系）","mapId":102,"lv":85,"hp":3800,"sptId":74,"mech":"【灵魂深渊】每击倒你一只精灵，它回复30%体力、攻击+1。残血精灵及时撤下，不要送。"},{"id":1111,"name":"菲尔洛","galaxy":"太空站挑战","loc":"训练师之门（冰系）","mapId":102,"lv":85,"hp":3800,"sptId":75,"mech":"【冰封技能】你刚用过的技能会被冰封2回合，冰封中使用会落空。需要轮换着用技能。"},{"id":1127,"name":"卡莱洛","galaxy":"太空站挑战","loc":"训练师之门（光系）","mapId":102,"lv":85,"hp":3800,"sptId":77,"mech":"【致盲闪光】奇数回合强光刺眼，你的攻击命中-50%（必中技能除外）；偶数回合它过曝，受到的伤害+30%。强化、回复放在奇数回合。"},{"id":1138,"name":"哈尼卡","galaxy":"太空站挑战","loc":"训练师之门（龙系）","mapId":102,"lv":85,"hp":3800,"sptId":78,"mech":"【逆鳞】被致命一击或克制属性命中后激怒2回合，攻击+2、防御-2。可以趁它防御下降猛攻，也可以避开它的暴怒期。"},{"id":1149,"name":"瓦尔普","galaxy":"太空站挑战","loc":"训练师之门（普通系）","mapId":102,"lv":85,"hp":3200,"sptId":79,"mech":"【无相】同一属性的技能连续命中它，伤害逐次-25%（最低40%）；换一种属性立即恢复全额。配招要覆盖多种属性。"},{"id":1208,"name":"佩吉克","galaxy":"太空站挑战","loc":"训练师之门（电系）","mapId":102,"lv":85,"hp":3800,"sptId":80,"mech":"【蓄电池】电量12格，大招耗4、中招耗2、小招耗1。电量耗尽后瘫痪2回合，不能行动、受到的伤害+60%，之后重新充满。前几回合稳住，瘫痪时集火。"},{"id":1383,"name":"弗洛斯","galaxy":"太空站挑战","loc":"训练师之门（超能冰系）","mapId":102,"lv":85,"hp":3800,"sptId":81,"mech":"【星光位】每回合预告你技能栏的一个位置：该位技能对它的伤害×1.5，其余×0.8。看战报里的预告选招，四个技能都要有用。"},{"id":169,"name":"卡特斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场","mapId":110,"lv":80,"hp":3600,"sptId":28,"mech":"【舍身】每次攻击自损10%当前体力，伤害+50%。体力低于20%后，下一击必中并必定击倒出战精灵，之后它只剩1体力。可以在它跌破20%前一口气打完，或换上替身接这一击。"},{"id":171,"name":"魔牙鲨","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第1门","mapId":110,"lv":80,"hp":3600,"sptId":36,"mech":"【血腥味】你的出战精灵体力低于50%时，它必定先手、伤害+30%。及时回血，或换上满血的精灵。"},{"id":174,"name":"贝鲁基德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第2门","mapId":110,"lv":80,"hp":5000,"sptId":37,"mech":"【过热】每用一次火系技能过热+1，满4层后下回合冷却：不行动，受到的伤害+50%。冷却回合集中爆发。"},{"id":177,"name":"巴弗洛","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第3门","mapId":110,"lv":80,"hp":3600,"sptId":38,"mech":"【镇魂歌】第1回合起每3回合给出战精灵唱镇魂歌，3回合后的回合结束时它会倒下；在那之前换下精灵即可解除。"},{"id":183,"name":"奇拉塔顿","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第3门","mapId":110,"lv":80,"hp":3600,"sptId":39,"mech":"【震波】它的地面技能命中后再震伤出战精灵1/8体力，速度-1。飞行系精灵不受影响；换精灵可清除降速。"},{"id":195,"name":"西萨拉斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第4门","mapId":110,"lv":80,"hp":3600,"sptId":40,"mech":"【电荷】你每用一次特殊攻击，它充能1层；满3层放出必中、伤害翻倍的雷神。多用物理攻击，或在满层时换上抗电的精灵。"},{"id":192,"name":"克林卡修","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第4门","mapId":110,"lv":80,"hp":3600,"sptId":41,"mech":"【宝石】带着防御（受伤-30%）、速度（必定先手）、攻击（伤害+40%）三颗宝石，按这个顺序碎裂：体力每降25%碎一颗，被致命一击也碎一颗。"},{"id":222,"name":"卡库","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":82,"hp":3800,"sptId":42,"mech":"【破釜沉舟】双方造成的伤害都+50%。体力低于30%时，下回合放出一次先手必暴的绝招。拼输出，留一只精灵接绝招。"},{"id":224,"name":"赫德卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":82,"hp":3800,"sptId":43,"mech":"【攻防切换】每2回合切换形态：炮台形态伤害+40%、受到的伤害+30%；铁壁形态不攻击，受到的伤害-60%。铁壁回合回血、强化，炮台回合猛攻。"},{"id":227,"name":"伊兰罗尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":82,"hp":3800,"sptId":44,"mech":"【六芒星】每回合点亮一颗星，满6颗时对出战精灵造成50%最大体力的伤害后重置。致命一击或战斗系技能命中熄灭一颗；爆发前也可以换上体力多的精灵。"},{"id":356,"name":"斯加尔卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":82,"hp":3800,"sptId":45,"mech":"【定时炸弹】给出战精灵挂上炸弹，2回合后爆炸，扣40%最大体力。爆炸前换精灵，炸弹会转到换上的精灵身上，改为固定600伤害。体力多的精灵扛百分比，体力少的扛固定伤害更亏。"},{"id":297,"name":"艾尔伊洛","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":82,"hp":3800,"sptId":46,"mech":"【星体解离】你出战精灵的攻击与特攻、防御与特防互相对调，换上的精灵同样对调。带两种攻击都有的精灵，或改用另一类招式。"},{"id":359,"name":"布林克克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":82,"hp":3800,"sptId":47,"mech":"【酸雨】每回合交替腐蚀双方的防御、特防，每级让对应伤害+50%（最多4级），不受强化、消强影响。越拖双方越脆，比的是爆发。"},{"id":438,"name":"魔花使者","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":82,"hp":3800,"sptId":48,"mech":"【魔花绽放】体力降到75%、50%、25%时各开一朵花，每朵每回合回复150体力。单次伤害达到800击碎一朵。"},{"id":441,"name":"莫尔加斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":82,"hp":3800,"sptId":49,"mech":"【沙尘暴】你的攻击命中-25%。必中技能和地面系精灵不受影响。"},{"id":435,"name":"萨诺拉斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":82,"hp":3800,"sptId":50,"mech":"【燎原】被它的火系攻击命中会留下火种，每层每回合扣1/16体力，最多4层，不会自己熄灭。水系精灵不会着火，上场时熄灭全队的火种。"},{"id":656,"name":"帕多尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":82,"hp":3800,"sptId":51,"mech":"【演奏会】按固定曲目循环出招：摇篮曲→安可曲→黑暗狂响曲→十万分贝。被安可曲命中后，接下来2回合只能重复上一招（换精灵摆脱），所以安可曲前一回合要用对招。"},{"id":659,"name":"加洛德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":82,"hp":3800,"sptId":52,"mech":"【超能生长】每回合最大体力+300并回复300、伤害+5%，最多8档。被降低能力的回合不生长，并缩回一档。"},{"id":661,"name":"萨多拉尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":82,"hp":3800,"sptId":53,"mech":"【镜影】带着2个镜像，你的攻击有一定几率打中镜像（2个时三分之二，1个时一半），打中一次碎一个；连击技能打碎全部镜像并命中本体。每4回合补满。"},{"id":779,"name":"迪普利德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":87,"hp":3600,"sptId":54,"mech":"【黑色束带】两条命。被黑色束带命中的精灵3回合内不能换下，每回合特防-1。第二条命起，束带还会每回合吸取5%体力。"},{"id":784,"name":"拜洛亚斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":87,"hp":3600,"sptId":55,"mech":"【破兵】两条命。它每命中一次，你刚用的攻击技能本场威力-20（最低四成）。轮换技能。第二条命起，它每回合必定先手。"},{"id":782,"name":"阿克诺亚","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":87,"hp":3600,"sptId":56,"mech":"【冰冷支配】两条命。它的冰系攻击命中时30%几率冻伤，被冻伤的精灵每回合使出的技能随机。第二条命起，每回合结束时还有30%几率冻伤出战精灵。带解冻手段，或技能栏只放好招。"},{"id":1182,"name":"鳞甲魔鱼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":87,"hp":3600,"sptId":62,"mech":"【鳞甲】两条命。第一条命：单次伤害低于它最大体力8%会被弹开，要用高威力、克制或致命一击打穿。第二条命鳞甲剥落：门槛消失，它的攻击、速度+2。"},{"id":1185,"name":"艾斯德克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":87,"hp":3600,"sptId":63,"mech":"【念刃回响】两条命。它会在下回合用自己的能力回放你上回合用的攻击技能。用属性技能或它抗性的招式过渡。第二条命起回放伤害加倍。"},{"id":1187,"name":"狂狮迪卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":87,"hp":3600,"sptId":64,"mech":"【陨星】两条命。每3回合结束时陨星落地，扣出战精灵50%最大体力；那回合使用属性技能伤害减半。第二条命起每2回合一次，它的攻击、特攻+2。"},{"id":359,"name":"布林克克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第12门","mapId":110,"lv":87,"hp":3600,"sptId":47,"mech":"【酸雨·暴走】两条命。第一条命：每回合交替腐蚀双方的防御、特防，每级让对应伤害+50%（最多4级）。第二条命：混沌潮汐，每回合结束时双方的能力等级正负反转，强化会变成削弱。"},{"id":617,"name":"肯佩德","galaxy":"罗格星系","loc":"拉铂尔星","mapId":441,"lv":90,"hp":9000,"sptId":34,"mech":"【漩涡】每回合结束时卷走出战精灵最高的一级强化转给自己；没有强化时吸取1/10体力。别堆强化，或用消强技能清掉它卷走的。"},{"id":1156,"name":"威里特","galaxy":"太空站挑战","loc":"训练师之门（战斗系）","mapId":102,"lv":85,"hp":3800,"sptId":82,"mech":"【喋血】体力每损失10%，它的暴击率+10%。越打越危险，留好爆发，压低后一口气打完。"},{"id":1191,"name":"普兰特","galaxy":"太空站挑战","loc":"训练师之门（草超能系）","mapId":102,"lv":88,"hp":4500,"sptId":83,"mech":"【混沌绿光】你的精灵连续在场3回合就会陷入混乱2回合；它对身负异常的精灵伤害+50%。勤换精灵，或带解除异常的手段。"},{"id":1304,"name":"帕里斯","galaxy":"太空站挑战","loc":"训练师之门（水暗影系）","mapId":102,"lv":88,"hp":4500,"sptId":84,"mech":"【兽神双形态】被物理攻击打中后化为暗影形态：伤害+40%、受伤+25%；被特殊攻击打中后化为水之形态：受伤-25%、每回合回复4%体力。形态由你的出招决定。"}];

      private const GALAXIES:Array = ["全部","帕诺星系","卡兰星系","罗格星系","裂空星系","神兽空间","太空站挑战","暗黑武斗场","其他区域"];

      private const CARD_CLASSES:Array = [B1_MC,B2_MC,B3_MC,B4_MC,B5_MC,B6_MC,B7_MC,B8_MC,B9_MC,B10_MC,B11_MC,B12_MC,B13_MC,B14_MC,B15_MC,B16_MC,B17_MC,B18_MC,B19_MC,B20_MC];

      // B7/B8 are "not yet open" silhouettes in the original art; those bosses are open now.
      private const SILHOUETTE_CARDS:Array = [7,8];

      private const SCENE_PICTURES:int = 12;

      private const PAGE_SIZE:int = 3;

      private const CARD_STEP:Number = 153;

      private var _mainBgMc:Sprite;

      private var _iconMc:Sprite;

      private var _iconMask:Sprite;

      private var _tabs:Sprite;

      private var _pageTxt:TextField;

      private var _desMc:SptDisMc;

      private var _list:Array = [];

      private var _galaxy:String = "全部";

      private var _curPage:int = 1;

      private var _totalPage:int = 1;

      private var _channelClass:Class;

      private var _channelLoader:Loader;

      private var _pendingDetail:int = -1;

      private var _detailMc:MovieClip;

      private var _detailIndex:int = 0;

      private var _detailArt:Sprite;

      private var _locationPopup:Sprite;

      private var _artToken:int = 0;

      public function SptPanel()
      {
         super();
      }

      public function setup() : void
      {
         _mainBgMc = new SptBg_MC();
         _mainBgMc["dragMc"].buttonMode = true;
         _mainBgMc["dragMc"].addEventListener(MouseEvent.MOUSE_DOWN,onDragDown);
         _mainBgMc["closeBtn"].addEventListener(MouseEvent.CLICK,onClose);
         _mainBgMc["leftBtn"].addEventListener(MouseEvent.CLICK,onPrevPage);
         _mainBgMc["rightBtn"].addEventListener(MouseEvent.CLICK,onNextPage);
         _pageTxt = _mainBgMc["pageTxt"];
         _pageTxt.wordWrap = false;
         _pageTxt.multiline = false;
         hideIntroText(_mainBgMc.getChildAt(0) as DisplayObjectContainer);
         _iconMc = new Sprite();
         _iconMc.x = 45;
         _iconMc.y = 100;
         _mainBgMc.addChild(_iconMc);
         _iconMask = new Sprite();
         _iconMask.graphics.beginFill(0,1);
         _iconMask.graphics.drawRect(0,0,459,175);
         _iconMask.graphics.endFill();
         _iconMask.x = 45;
         _iconMask.y = 98;
         _mainBgMc.addChild(_iconMask);
         _iconMc.mask = _iconMask;
         _tabs = new Sprite();
         _tabs.x = 34;
         _tabs.y = 60;
         _mainBgMc.addChild(_tabs);
         loadChannel();
         selectGalaxy("帕诺星系");
      }

      public function init(param1:Object = null) : void
      {
      }

      public function show() : void
      {
         if(!DisplayUtil.hasParent(_mainBgMc))
         {
            LevelManager.appLevel.addChild(_mainBgMc);
         }
         DisplayUtil.align(_mainBgMc,null,AlignType.MIDDLE_CENTER);
      }

      public function hide() : void
      {
         closeLocationMenu();
         closeDetail();
         removeDes();
         DisplayUtil.removeForParent(_mainBgMc);
         ModuleManager.destroyForInstance(this);
      }

      public function destroy() : void
      {
         if(_mainBgMc)
         {
            LevelManager.stage.removeEventListener(MouseEvent.MOUSE_UP,onDragUp);
            DisplayUtil.removeForParent(_mainBgMc);
         }
         _mainBgMc = null;
         _iconMc = null;
         _list = null;
         _channelLoader = null;
      }

      private function hideIntroText(bg:DisplayObjectContainer) : void
      {
         var i:int = 0;
         if(bg == null)
         {
            return;
         }
         while(i < bg.numChildren)
         {
            if(bg.getChildAt(i) is TextField)
            {
               bg.getChildAt(i).visible = false;
            }
            i++;
         }
      }

      private function onClose(e:MouseEvent) : void
      {
         hide();
      }

      private function onDragDown(e:MouseEvent) : void
      {
         _mainBgMc.startDrag();
         LevelManager.stage.addEventListener(MouseEvent.MOUSE_UP,onDragUp);
      }

      private function onDragUp(e:MouseEvent) : void
      {
         if(_mainBgMc)
         {
            _mainBgMc.stopDrag();
         }
         LevelManager.stage.removeEventListener(MouseEvent.MOUSE_UP,onDragUp);
      }

      // ---------- data ----------

      private function isBossDefeated(b:Object) : Boolean
      {
         var sptId:int;
         var ach:Array;
         try
         {
            sptId = int(b.sptId);
            if(sptId >= 1 && sptId <= 200)
            {
               ach = MainManager.actorInfo.bossAchievement;
               if(ach && ach[sptId - 1] == true)
               {
                  return true;
               }
            }
            if(b.taskId && TasksManager.getTaskStatus(b.taskId) == TasksManager.COMPLETE)
            {
               return true;
            }
         }
         catch(err:Error)
         {
         }
         return false;
      }

      private function mergeDuplicateBosses(list:Array) : Array
      {
         var out:Array = [];
         var seen:Object = {};
         var i:int = 0;
         var b:Object;
         var key:String;
         var hit:Object;
         var k:String;
         while(i < list.length)
         {
            b = list[i];
            key = b.id + "/" + (b.sptId || 0) + "/" + b.lv + "/" + b.hp + "/" + b.mech;
            hit = seen[key];
            if(hit == null)
            {
               hit = {};
               for(k in b)
               {
                  hit[k] = b[k];
               }
               hit.maps = [{
                  "mapId":b.mapId,
                  "loc":b.loc
               }];
               seen[key] = hit;
               out.push(hit);
            }
            else
            {
               hit.maps.push({
                  "mapId":b.mapId,
                  "loc":b.loc
               });
            }
            i++;
         }
         return out;
      }

      private function stars(b:Object) : int
      {
         var lv:int = int(b.lv);
         if(lv <= 20)
         {
            return 1;
         }
         if(lv <= 40)
         {
            return 2;
         }
         if(lv <= 60)
         {
            return 3;
         }
         if(lv <= 80)
         {
            return 4;
         }
         return 5;
      }

      private function originalCard(b:Object) : int
      {
         var sptId:int = int(b.sptId);
         if(sptId >= 1 && sptId <= CARD_CLASSES.length && SILHOUETTE_CARDS.indexOf(sptId) < 0)
         {
            return sptId;
         }
         return 0;
      }

      private function countFor(galaxy:String) : int
      {
         var n:int = 0;
         var i:int = 0;
         while(i < BOSSES.length)
         {
            if(galaxy == "全部" || BOSSES[i].galaxy == galaxy)
            {
               n++;
            }
            i++;
         }
         return n;
      }

      // ---------- overview ----------

      private function selectGalaxy(galaxy:String) : void
      {
         var filtered:Array = [];
         var i:int = 0;
         _galaxy = galaxy;
         while(i < BOSSES.length)
         {
            if(galaxy == "全部" || BOSSES[i].galaxy == galaxy)
            {
               filtered.push(BOSSES[i]);
            }
            i++;
         }
         _list = mergeDuplicateBosses(filtered);
         _totalPage = Math.max(1,Math.ceil(_list.length / PAGE_SIZE));
         _curPage = 1;
         renderTabs();
         renderPage(0);
      }

      private function shortLabel(galaxy:String) : String
      {
         return galaxy.replace("星系","").replace("空间","").replace("挑战","").replace("武斗场","").replace("区域","");
      }

      private function renderTabs() : void
      {
         var x:Number = 0;
         var i:int = 0;
         var g:String;
         var btn:Sprite;
         var w:Number;
         while(_tabs.numChildren > 0)
         {
            _tabs.removeChildAt(0);
         }
         while(i < GALAXIES.length)
         {
            g = GALAXIES[i];
            if(g == "全部" || countFor(g) > 0)
            {
               w = shortLabel(g).length >= 3 ? 58 : 50;
               btn = new Sprite();
               btn.x = x;
               nativeButton(btn,w,22,shortLabel(g),g == _galaxy);
               (function(target:String):void
               {
                  btn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
                  {
                     if(target != _galaxy)
                     {
                        selectGalaxy(target);
                     }
                  });
               })(g);
               _tabs.addChild(btn);
               x += w + 4;
            }
            i++;
         }
      }

      private function nativeButton(s:Sprite, w:Number, h:Number, title:String, active:Boolean = false) : TextField
      {
         var up:DisplayObject = UIManager.getDisplayObject("Button_upSkin");
         var over:DisplayObject = UIManager.getDisplayObject("Button_overSkin");
         var down:DisplayObject = UIManager.getDisplayObject("Button_downSkin");
         up.width = over.width = down.width = w;
         up.height = over.height = down.height = h;
         s.addChild(new SimpleButton(active ? down : up,over,down,up));
         var tf:TextField = label(s,0,(h - 17) / 2,w,17,12,16777215,true,TextFormatAlign.CENTER);
         tf.text = title;
         tf.mouseEnabled = false;
         s.buttonMode = true;
         return tf;
      }

      private function label(parent:Sprite, x:Number, y:Number, w:Number, h:Number, size:int, color:uint, bold:Boolean = false, align:String = "left") : TextField
      {
         var tf:TextField = new TextField();
         var fmt:TextFormat = new TextFormat("宋体",size,color,bold);
         fmt.align = align;
         tf.defaultTextFormat = fmt;
         tf.selectable = false;
         tf.x = x;
         tf.y = y;
         tf.width = w;
         tf.height = h;
         parent.addChild(tf);
         return tf;
      }

      // Long boss names shrink until they fit the original fixed-width name field.
      private function fitText(tf:TextField, text:String) : void
      {
         var fmt:TextFormat;
         var size:int;
         tf.text = text;
         fmt = tf.getTextFormat(0,1);
         size = int(fmt.size);
         while(tf.textWidth > tf.width - 4 && size > 9)
         {
            fmt.size = --size;
            tf.setTextFormat(fmt);
         }
      }

      private function onPrevPage(e:MouseEvent) : void
      {
         if(_curPage > 1)
         {
            --_curPage;
            renderPage(-1);
         }
      }

      private function onNextPage(e:MouseEvent) : void
      {
         if(_curPage < _totalPage)
         {
            ++_curPage;
            renderPage(1);
         }
      }

      // dir: 0 no animation, 1 slide in from the right, -1 from the left (original 0.3s TweenMax slide).
      private function renderPage(dir:int) : void
      {
         var start:int = (_curPage - 1) * PAGE_SIZE;
         var i:int = 0;
         var card:MovieClip;
         removeDes();
         while(_iconMc.numChildren > 0)
         {
            _iconMc.removeChildAt(0);
         }
         while(i < PAGE_SIZE && start + i < _list.length)
         {
            card = makeCard(_list[start + i],start + i);
            card.x = CARD_STEP * i;
            _iconMc.addChild(card);
            i++;
         }
         _pageTxt.text = _curPage + "/" + _totalPage;
         _mainBgMc["leftMc"].visible = _curPage <= 1;
         _mainBgMc["rightMc"].visible = _curPage >= _totalPage;
         _iconMc.x = 45 + dir * CARD_STEP * PAGE_SIZE;
         if(dir != 0)
         {
            new TweenMax(_iconMc,0.3,{"x":45});
         }
      }

      private function makeCard(b:Object, index:int) : MovieClip
      {
         var n:int = originalCard(b);
         var card:MovieClip = new (CARD_CLASSES[n > 0 ? n - 1 : 0] as Class)() as MovieClip;
         var art:Rectangle;
         var holder:Sprite;
         fitText(card["name_txt"],b.name);
         card["leMc"].gotoAndStop(stars(b));
         card["win"].visible = isBossDefeated(b);
         card["mc2"].visible = false;
         if(n == 0)
         {
            art = card["mc1"].getBounds(card);
            card["mc1"].visible = false;
            holder = new Sprite();
            card.addChildAt(holder,card.getChildIndex(card["mc1"]));
            loadPet("/resource/groupFightResource/pet/" + b.id + ".swf",holder,art,false);
         }
         card.buttonMode = true;
         card.mouseChildren = false;
         card.addEventListener(MouseEvent.MOUSE_OVER,function(e:MouseEvent):void
         {
            showDes(b.mech);
         });
         card.addEventListener(MouseEvent.MOUSE_MOVE,function(e:MouseEvent):void
         {
            moveDes();
         });
         card.addEventListener(MouseEvent.MOUSE_OUT,function(e:MouseEvent):void
         {
            removeDes();
         });
         card.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            removeDes();
            openDetail(index);
         });
         return card;
      }

      // Loads a pet SWF exporting class "pet", fits it into area (bottom-centred), stopped on its first frame.
      // token >= 0 ties the load to the detail page that requested it; stale loads are dropped.
      private function loadPet(url:String, holder:Sprite, area:Rectangle, idle:Boolean, token:int = -1) : void
      {
         var l:Loader = new Loader();
         l.contentLoaderInfo.addEventListener(Event.COMPLETE,function(e:Event):void
         {
            var domain:ApplicationDomain = l.contentLoaderInfo.applicationDomain;
            var pet:DisplayObject;
            var r:Rectangle;
            var sc:Number;
            if(!domain.hasDefinition("pet") || token >= 0 && token != _artToken)
            {
               return;
            }
            pet = new (domain.getDefinition("pet") as Class)() as DisplayObject;
            if(pet is MovieClip && !idle)
            {
               MovieClip(pet).gotoAndStop(1);
            }
            r = pet.getBounds(pet);
            if(r.width <= 0 || r.height <= 0)
            {
               return;
            }
            sc = Math.min(area.width / r.width,area.height / r.height,idle ? 2 : 1.6);
            pet.scaleX = pet.scaleY = sc;
            pet.x = area.x + (area.width - r.width * sc) / 2 - r.x * sc;
            pet.y = area.y + area.height - r.height * sc - r.y * sc;
            holder.addChild(pet);
         });
         l.load(new URLRequest(url));
      }

      private function showDes(text:String) : void
      {
         if(!_desMc)
         {
            _desMc = new SptDisMc();
            _desMc.mouseEnabled = false;
            _desMc.mouseChildren = false;
         }
         _desMc["disTxt"].text = "描述:";
         _desMc["desTxt"].wordWrap = true;
         _desMc["desTxt"].text = "    " + text;
         _mainBgMc.addChild(_desMc);
         moveDes();
      }

      private function moveDes() : void
      {
         if(_desMc && _desMc.parent)
         {
            _desMc.x = Math.min(_mainBgMc.mouseX + 20,537 - _desMc.width);
            _desMc.y = Math.min(_mainBgMc.mouseY + 20,344 - _desMc.height);
         }
      }

      private function removeDes() : void
      {
         if(_desMc)
         {
            DisplayUtil.removeForParent(_desMc);
         }
      }

      // ---------- detail / teleport (original SptChannelMc) ----------

      private function loadChannel() : void
      {
         _channelLoader = new Loader();
         _channelLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(e:Event):void
         {
            var domain:ApplicationDomain = _channelLoader.contentLoaderInfo.applicationDomain;
            if(domain.hasDefinition("SptChannelMc"))
            {
               _channelClass = domain.getDefinition("SptChannelMc") as Class;
               if(_pendingDetail >= 0)
               {
                  openDetail(_pendingDetail);
               }
            }
         });
         _channelLoader.load(new URLRequest(ClientConfig.getAppModule("SptChannelPanel")),new LoaderContext(false,new ApplicationDomain(ApplicationDomain.currentDomain)));
      }

      private function openDetail(index:int) : void
      {
         if(_channelClass == null)
         {
            _pendingDetail = index;
            return;
         }
         _pendingDetail = -1;
         if(_detailMc == null)
         {
            _detailMc = new _channelClass() as MovieClip;
            _detailMc["closeBtn"].addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               closeDetail();
            });
            _detailMc["prevBtn"].addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               if(_detailIndex > 0)
               {
                  showDetail(_detailIndex - 1);
               }
            });
            _detailMc["nextBtn"].addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               if(_detailIndex < _list.length - 1)
               {
                  showDetail(_detailIndex + 1);
               }
            });
            _detailMc["sendBtn"].addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               travel(_list[_detailIndex]);
            });
            _detailMc["dragMc"].buttonMode = true;
            _detailMc["dragMc"].addEventListener(MouseEvent.MOUSE_DOWN,function(e:MouseEvent):void
            {
               _detailMc.startDrag();
               LevelManager.stage.addEventListener(MouseEvent.MOUSE_UP,onDetailDragUp);
            });
            _detailArt = new Sprite();
            _detailMc.addChildAt(_detailArt,_detailMc.getChildIndex(_detailMc["picMc"]) + 1);
         }
         LevelManager.appLevel.addChild(_detailMc);
         DisplayUtil.align(_detailMc,null,AlignType.MIDDLE_CENTER);
         showDetail(index);
      }

      private function onDetailDragUp(e:MouseEvent) : void
      {
         if(_detailMc)
         {
            _detailMc.stopDrag();
         }
         LevelManager.stage.removeEventListener(MouseEvent.MOUSE_UP,onDetailDragUp);
      }

      private function showDetail(index:int) : void
      {
         var b:Object = _list[index];
         var pic:MovieClip = _detailMc["picMc"];
         var sptId:int = int(b.sptId);
         var area:Rectangle;
         var cond:String = "Lv." + b.lv + (int(b.hp) > 0 ? "  体力" + b.hp : "");
         _detailIndex = index;
         ++_artToken;
         fitText(_detailMc["nameTxt"],b.name + (isBossDefeated(b) ? "（已战胜）" : ""));
         _detailMc["nameTxt1"].text = b.name;
         _detailMc["lvMc"].gotoAndStop(stars(b));
         _detailMc["seatTxt"].text = b.maps && b.maps.length > 1 ? b.maps[0].loc + " 等" + b.maps.length + "处" : b.loc;
         fitText(_detailMc["conTxt"],cond);
         _detailMc["desTxt"].wordWrap = true;
         _detailMc["desTxt"].text = "    " + b.mech;
         while(_detailArt.numChildren > 0)
         {
            _detailArt.removeChildAt(0);
         }
         _detailArt.graphics.clear();
         if(sptId >= 1 && sptId <= SCENE_PICTURES)
         {
            pic.visible = true;
            pic.gotoAndStop(sptId);
            return;
         }
         // No original scene picture: keep the frame's blue grid look and show the pet's battle sprite.
         pic.gotoAndStop(1);
         area = pic.getBounds(_detailMc);
         pic.visible = false;
         _detailArt.graphics.beginFill(1455206,1);
         _detailArt.graphics.drawRect(area.x,area.y,area.width,area.height);
         _detailArt.graphics.endFill();
         _detailArt.graphics.lineStyle(1,2380952,1);
         drawGrid(area);
         _detailArt.graphics.lineStyle(3,5223402,1);
         _detailArt.graphics.drawRoundRect(area.x + 1.5,area.y + 1.5,area.width - 3,area.height - 3,10,10);
         loadPet("/resource/fightResource/pet/swf/" + b.id + ".swf",_detailArt,new Rectangle(area.x + 12,area.y + 10,area.width - 24,area.height - 18),true,_artToken);
      }

      private function drawGrid(area:Rectangle) : void
      {
         var gx:Number = area.x + 16;
         var gy:Number = area.y + 16;
         while(gx < area.right)
         {
            _detailArt.graphics.moveTo(gx,area.y);
            _detailArt.graphics.lineTo(gx,area.bottom);
            gx += 16;
         }
         while(gy < area.bottom)
         {
            _detailArt.graphics.moveTo(area.x,gy);
            _detailArt.graphics.lineTo(area.right,gy);
            gy += 16;
         }
      }

      private function closeDetail() : void
      {
         if(_detailMc)
         {
            LevelManager.stage.removeEventListener(MouseEvent.MOUSE_UP,onDetailDragUp);
            DisplayUtil.removeForParent(_detailMc);
         }
      }

      private function travel(b:Object) : void
      {
         if(b.maps && b.maps.length > 1)
         {
            showLocationMenu(b);
            return;
         }
         hide();
         if(b.mapId)
         {
            MapManager.changeMap(b.mapId);
         }
      }

      private function showLocationMenu(b:Object) : void
      {
         var p:Sprite = new Sprite();
         var w:Number = 260;
         var h:Number = 44 + b.maps.length * 30;
         var i:int = 0;
         var row:Sprite;
         var title:TextField;
         closeLocationMenu();
         p.graphics.beginFill(597557,0.98);
         p.graphics.lineStyle(1.5,55551,0.9);
         p.graphics.drawRoundRect(0,0,w,h,10,10);
         p.graphics.endFill();
         title = label(p,10,6,w - 20,22,13,16765440,true);
         title.text = b.name + " · 选择传送地点";
         while(i < b.maps.length)
         {
            row = new Sprite();
            row.x = 10;
            row.y = 32 + i * 30;
            nativeButton(row,w - 20,24,b.maps[i].loc);
            (function(target:Object):void
            {
               row.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
               {
                  hide();
                  MapManager.changeMap(target.mapId);
               });
            })(b.maps[i]);
            p.addChild(row);
            i++;
         }
         row = new Sprite();
         row.x = 10;
         row.y = 32 + b.maps.length * 30;
         nativeButton(row,w - 20,24,"取消");
         row.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            closeLocationMenu();
         });
         p.addChild(row);
         _locationPopup = p;
         LevelManager.appLevel.addChild(p);
         DisplayUtil.align(p,null,AlignType.MIDDLE_CENTER);
      }

      private function closeLocationMenu() : void
      {
         if(_locationPopup)
         {
            DisplayUtil.removeForParent(_locationPopup);
            _locationPopup = null;
         }
      }
   }
}
