package com.robot.module.app
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.UIManager;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.Shape;
   import flash.display.SimpleButton;
   import flash.filters.GlowFilter;
   import flash.geom.Rectangle;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(frameRate="24",backgroundColor="#000000",width="960",height="560")]
   public class SptPanel extends Sprite implements IModule
   {
      
      // 全部 BOSS：由 scripts/build-boss-notes.cjs 按服务端 boss_abilities.json 和 Core 地图表生成，mech 是机制说明
      private const BOSSES:Array = [{"id":47,"name":"蘑菇怪","galaxy":"帕诺星系","loc":"克洛斯星林间","mapId":12,"lv":10,"hp":100,"sptId":1,"mech":"【毒孢子】用物理攻击打蘑菇怪，出手的精灵有30%几率中毒。它的技能PP无限。"}, {"id":34,"name":"钢牙鲨","galaxy":"帕诺星系","loc":"海洋星海底","mapId":22,"lv":25,"hp":200,"sptId":2,"mech":"【嗜血】钢牙鲨体力低于三成后，攻击必定暴击。"}, {"id":42,"name":"里奥斯","galaxy":"帕诺星系","loc":"火山星山洞深处","mapId":17,"lv":35,"hp":170,"sptId":3,"mech":"【不屈】里奥斯有两条命，第一次被击倒会满血复活。"}, {"id":50,"name":"阿克希亚","galaxy":"帕诺星系","loc":"塞西利亚星","mapId":40,"lv":65,"hp":600,"sptId":4,"mech":"【属性护盾】阿克希亚只受火系、战斗系技能的伤害，也不会陷入异常状态。"}, {"id":69,"name":"提亚斯","galaxy":"帕诺星系","loc":"云霄星最高层","mapId":27,"lv":50,"hp":500,"sptId":5,"mech":"【疾风之躯】提亚斯只会被必中技能命中，也不会陷入异常状态。"}, {"id":70,"name":"雷伊","galaxy":"帕诺星系","loc":"赫尔卡星荒地","mapId":32,"lv":70,"hp":2800,"sptId":6,"mech":"【属性护盾】雷伊只受地面系技能的伤害，也不会陷入异常状态。"}, {"id":88,"name":"纳多雷","galaxy":"帕诺星系","loc":"双子阿尔法星·阿尔法星岩地","mapId":106,"lv":70,"hp":900,"sptId":7,"mech":"【坚甲】纳多雷只有在防御或特防被降低时才会受到伤害，也不会陷入异常状态。"}, {"id":113,"name":"雷纳多","galaxy":"帕诺星系","loc":"双子贝塔星·贝塔星荒原","mapId":49,"lv":75,"hp":1000,"sptId":8,"mech":"【属性护盾】雷纳多只受火系、地面系、战斗系技能的伤害，也不会陷入异常状态。"}, {"id":132,"name":"尤纳斯","galaxy":"帕诺星系","loc":"拜伦号","mapId":314,"lv":70,"hp":2800,"sptId":9,"mech":"【破防】尤纳斯要先被贯穿水枪破防，之前打它无效；最后一击只能是里奥斯的幻影，持续伤害打不死它。免疫中毒、烧伤、冻伤，PP无限。"}, {"id":187,"name":"魔狮迪露","galaxy":"帕诺星系","loc":"斯诺岩洞","mapId":53,"lv":50,"hp":3000000,"sptId":10,"mech":"【300万体力】魔狮迪露有300万体力，属性克制对它无效，体力低于一半后必定先手并会秒杀；可用同生共死、镇魂歌这类招式。PP无限。"}, {"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"火山星","mapId":15,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"}, {"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"露希欧星","mapId":54,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"}, {"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"双子阿尔法星","mapId":105,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"}, {"id":393,"name":"上古炎兽","galaxy":"帕诺星系","loc":"火山星山洞","mapId":16,"lv":85,"hp":6500,"sptId":18,"mech":"【属性护盾】上古炎兽只受水系、地面系技能的伤害，也不会陷入异常状态。"}, {"id":811,"name":"始祖灵兽","galaxy":"帕诺星系","loc":"克洛斯星地心","mapId":13,"lv":85,"hp":8000,"sptId":20,"mech":"【异常破绽】始祖灵兽只有烧伤时才能被击倒，否则满血复活。烧伤技能必定命中它，烧伤持续两回合，之后一回合不会再烧伤；不会陷入其他异常。"}, {"id":74,"name":"果冻鸭","galaxy":"帕诺星系","loc":"赫尔卡星·精灵广场","mapId":34,"lv":45,"hp":1500,"sptId":30,"mech":"【属性护盾】果冻鸭只受草系、电系技能的伤害，也不会陷入异常状态。"}, {"id":74,"name":"果冻鸭","galaxy":"帕诺星系","loc":"拜伦号·闭锁空间","mapId":310,"lv":45,"hp":1500,"sptId":30,"mech":"【属性护盾】果冻鸭只受草系、电系技能的伤害，也不会陷入异常状态。"}, {"id":91,"name":"悠悠","galaxy":"帕诺星系","loc":"双子阿尔法星","mapId":105,"lv":50,"hp":4000,"sptId":35,"mech":"【悠然】悠悠每次受到攻击，有20%几率完全挡下这次伤害。"}, {"id":1232,"name":"芙洛","galaxy":"帕诺星系","loc":"北斗七星殿","mapId":733,"lv":75,"hp":7000,"sptId":66,"mech":"【疾风之躯】芙洛只会被必中技能命中，也不会陷入异常状态。"}, {"id":216,"name":"哈莫雷特","galaxy":"卡兰星系","loc":"尼古尔星","mapId":57,"lv":80,"hp":10000,"sptId":11,"mech":"【顺序破防】哈莫雷特只受水系、火系、草系技能按顺序轮流命中的伤害，打空也算一次；免疫异常、同生共死和百分比伤害。"}, {"id":274,"name":"塔克林","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":78,"hp":3000,"sptId":15,"mech":"【强化压制】塔克林出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。"}, {"id":391,"name":"塔西亚","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":70,"hp":10000,"sptId":16,"mech":"【龙之结界】用物理攻击打塔西亚，出手的精灵90%会害怕；出场特攻+2，免疫寄生、中毒、烧伤、冻伤和降能力，PP无限。"}, {"id":216,"name":"哈莫雷特","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":80,"hp":10000,"sptId":11,"mech":"【顺序破防】哈莫雷特只受水系、火系、草系技能按顺序轮流命中的伤害，打空也算一次；免疫异常、同生共死和百分比伤害。"}, {"id":413,"name":"塞维尔","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":80,"hp":4000,"sptId":19,"mech":"【属性护盾】塞维尔只受战斗系、龙系技能的伤害，也不会陷入异常状态。"}, {"id":264,"name":"奈尼芬多","galaxy":"卡兰星系","loc":"艾迪星","mapId":325,"lv":60,"hp":2500,"sptId":12,"mech":"【属性护盾】奈尼芬多只受光系、暗影系技能的伤害，也不会陷入异常状态。"}, {"id":421,"name":"厄尔塞拉","galaxy":"卡兰星系","loc":"塔克星·光之迷城","mapId":61,"lv":80,"hp":3000,"sptId":13,"mech":"【每日规则】周一免疫异常，周二闪避50%，周三反弹高伤害，周四每回合回1000，周五无异常时被击倒会复活，周六伤害减半，周日必先手、低血秒杀。"}, {"id":347,"name":"远古鱼龙","galaxy":"卡兰星系","loc":"尼古尔水帘","mapId":59,"lv":85,"hp":10000,"sptId":17,"mech":"【属性护盾】远古鱼龙只受草系、电系技能的伤害，也不会陷入异常状态。"}, {"id":479,"name":"冰洛伏特","galaxy":"卡兰星系","loc":"斯科尔高空塔","mapId":331,"lv":85,"hp":2000,"sptId":23,"mech":"【顺序破防】冰洛伏特只受火系、机械系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。"}, {"id":755,"name":"斯普林特","galaxy":"卡兰星系","loc":"地底古迹","mapId":495,"lv":80,"hp":2500,"sptId":76,"mech":"【异常破绽】斯普林特只有睡眠时才能被击倒，否则满血复活。睡眠技能必定命中它，睡眠持续两回合，之后一回合不会再睡眠；不会陷入其他异常。"}, {"id":1633,"name":"缪斯","galaxy":"卡兰星系","loc":"天蛇灵宫","mapId":932,"lv":80,"hp":2500,"sptId":65,"mech":"【顺序破防】缪斯只受光系、暗影系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。"}, {"id":538,"name":"克拉尼特","galaxy":"罗格星系","loc":"戴斯星","mapId":435,"lv":92,"hp":5000,"sptId":26,"mech":"【两种形态】克拉尼特有两条命：第一形态主要靠火龙红莲击，PP耗尽后很弱；被击倒后以第二形态满血复活，招式全部换掉。"}, {"id":587,"name":"墨杜萨","galaxy":"罗格星系","loc":"墨杜萨星·石化之城","mapId":438,"lv":85,"hp":9000,"sptId":27,"mech":"【属性护盾】墨杜萨只受光系、暗影系技能的伤害，也不会陷入异常状态。"}, {"id":672,"name":"亚伦斯","galaxy":"罗格星系","loc":"拓梯星·活力源泉","mapId":430,"lv":80,"hp":3000,"sptId":31,"mech":"【异常破绽】亚伦斯只有麻痹时才能被击倒，否则满血复活。麻痹技能必定命中它，麻痹持续两回合，之后一回合不会再麻痹；不会陷入其他异常。"}, {"id":474,"name":"该伊","galaxy":"罗格星系","loc":"陨石地带·巨型陨石","mapId":415,"lv":80,"hp":7000,"sptId":32,"mech":"【疾风之躯】该伊只会被必中技能命中，也不会陷入异常状态。"}, {"id":471,"name":"伊特","galaxy":"罗格星系","loc":"比格星·觅食林","mapId":414,"lv":80,"hp":10000,"sptId":33,"mech":"【属性护盾】伊特只受火系、飞行系技能的伤害，也不会陷入异常状态。"}, {"id":798,"name":"卡修斯","galaxy":"裂空星系","loc":"炫彩山山脚","mapId":445,"lv":80,"hp":4500,"sptId":57,"mech":"【多层护甲】卡修斯有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。"}, {"id":715,"name":"德拉萨","galaxy":"裂空星系","loc":"怀特矿场","mapId":486,"lv":85,"hp":8000,"sptId":58,"mech":"【属性护盾】德拉萨只受战斗系、龙系技能的伤害，也不会陷入异常状态。"}, {"id":804,"name":"迪符特","galaxy":"裂空星系","loc":"山神圣殿","mapId":450,"lv":85,"hp":3500,"sptId":59,"mech":"【多层护甲】迪符特有4层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。"}, {"id":875,"name":"布莱克","galaxy":"裂空星系","loc":"光明圣坛","mapId":9507,"lv":70,"hp":3000,"sptId":61,"mech":"【属性护盾】布莱克只受电系、光系技能的伤害，也不会陷入异常状态。只能派一只精灵出战。"}, {"id":300,"name":"虚无的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第1封印","mapId":108,"lv":100,"hp":7000,"sptId":0,"mech":"【虚无封印】除必中技能外，所有攻击都会落空；出场攻击、特攻+2。"}, {"id":300,"name":"元素的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第2封印","mapId":108,"lv":100,"hp":8000,"sptId":0,"mech":"【元素封印】只受光系、暗影系技能的伤害，持续伤害有效。"}, {"id":300,"name":"能量的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第3封印","mapId":108,"lv":100,"hp":9000,"sptId":0,"mech":"【能量封印】单次物理或特殊攻击伤害超过500时，出手的精灵被秒杀。"}, {"id":300,"name":"生命的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第4封印","mapId":108,"lv":100,"hp":10000,"sptId":0,"mech":"【生命封印】每回合回复2000体力，不会被降低能力。"}, {"id":300,"name":"轮回的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第5封印","mapId":108,"lv":100,"hp":10000,"sptId":0,"mech":"【轮回封印】有两条命，第二条命满体力满PP，不会被降低能力。"}, {"id":300,"name":"永恒的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第6封印","mapId":108,"lv":100,"hp":12000,"sptId":0,"mech":"【永恒封印】技能PP无限，出场攻击、特攻+2，不会被降低能力。"}, {"id":300,"name":"圣洁的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第7封印","mapId":108,"lv":100,"hp":16000,"sptId":0,"mech":"【圣洁封印】只受攻击技能附带的异常造成的伤害，属性技能的异常无效；出场攻击、特攻+2，不会被降低能力。"}, {"id":300,"name":"谱尼的真身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·谱尼真身","mapId":108,"lv":100,"hp":7000,"sptId":0,"mech":"【谱尼真身】有六条命，技能PP无限，无视速度必定先手，不会被降低能力。"}, {"id":501,"name":"巴斯特","galaxy":"神兽空间","loc":"玄武空间","mapId":401,"lv":85,"hp":4500,"sptId":29,"mech":"【坚甲】巴斯特只有在防御和特防都被降低时才会受到伤害，也不会陷入异常状态。"}, {"id":504,"name":"菲尼克斯","galaxy":"神兽空间","loc":"朱雀空间","mapId":318,"lv":100,"hp":1500,"sptId":60,"mech":"【朱雀三影】菲尼克斯有四条命：愤怒之影反弹1/4伤害；光芒之影必定先手、闪避20%、半血以下暴击；重生之影两条命，每回合回100。"}, {"id":468,"name":"罗德利斯","galaxy":"太空站挑战","loc":"太空站扩展","mapId":405,"lv":80,"hp":2200,"sptId":24,"mech":"【异常破绽】罗德利斯有两条命，都只有冻伤时才能被击倒，否则满血复活。冻伤技能必定命中它，冻伤持续两回合，之后一回合不会再冻伤；不会陷入其他异常。"}, {"id":426,"name":"迪尔科特","galaxy":"太空站挑战","loc":"太空站扩展","mapId":405,"lv":80,"hp":4000,"sptId":25,"mech":"【疾风之躯】迪尔科特只会被必中技能命中，也不会陷入异常状态。"}, {"id":115,"name":"巨型树妖","galaxy":"太空站挑战","loc":"精灵召唤场","mapId":502,"lv":40,"hp":2400,"sptId":0,"mech":"【召唤与护盾】在精灵召唤场点任一圆环召唤巨型树妖，一分钟内喷火命中五次打破防护罩，才能挑战它。"}, {"id":983,"name":"塔奇多克","galaxy":"太空站挑战","loc":"训练师之门（草系）","mapId":102,"lv":92,"hp":3000,"sptId":67,"mech":"【属性护盾】塔奇多克只受火系、飞行系技能的伤害，也不会陷入异常状态。"}, {"id":992,"name":"火噜噜","galaxy":"太空站挑战","loc":"训练师之门（火系）","mapId":102,"lv":100,"hp":3000,"sptId":68,"mech":"【属性护盾】火噜噜只受水系、地面系技能的伤害，也不会陷入异常状态。"}, {"id":1008,"name":"查德洛","galaxy":"太空站挑战","loc":"训练师之门（超能系）","mapId":102,"lv":100,"hp":4000,"sptId":69,"mech":"【属性护盾】查德洛只受光系、暗影系技能的伤害，也不会陷入异常状态。"}, {"id":1031,"name":"多尔尼","galaxy":"太空站挑战","loc":"训练师之门（水系）","mapId":102,"lv":100,"hp":3000,"sptId":70,"mech":"【属性护盾】多尔尼只受草系、电系技能的伤害，也不会陷入异常状态。"}, {"id":1051,"name":"加耶罗","galaxy":"太空站挑战","loc":"训练师之门（飞行系）","mapId":102,"lv":92,"hp":4000,"sptId":71,"mech":"【属性护盾】加耶罗只受电系、冰系技能的伤害，也不会陷入异常状态。"}, {"id":1079,"name":"岩锤怪","galaxy":"太空站挑战","loc":"训练师之门（地面系）","mapId":102,"lv":100,"hp":4000,"sptId":72,"mech":"【属性护盾】岩锤怪只受草系、水系技能的伤害，也不会陷入异常状态。"}, {"id":1083,"name":"LYN","galaxy":"太空站挑战","loc":"训练师之门（机械系）","mapId":102,"lv":85,"hp":3000,"sptId":73,"mech":"【属性护盾】LYN只受火系、地面系技能的伤害，也不会陷入异常状态。"}, {"id":1099,"name":"达克其","galaxy":"太空站挑战","loc":"训练师之门（暗影系）","mapId":102,"lv":92,"hp":4000,"sptId":74,"mech":"【属性护盾】达克其只受电系、光系技能的伤害，也不会陷入异常状态。"}, {"id":1111,"name":"菲尔洛","galaxy":"太空站挑战","loc":"训练师之门（冰系）","mapId":102,"lv":92,"hp":3000,"sptId":75,"mech":"【属性护盾】菲尔洛只受火系、战斗系技能的伤害，也不会陷入异常状态。"}, {"id":1127,"name":"卡莱洛","galaxy":"太空站挑战","loc":"训练师之门（光系）","mapId":102,"lv":100,"hp":6000,"sptId":77,"mech":"【属性护盾】卡莱洛只受草系技能的伤害，也不会陷入异常状态。"}, {"id":1138,"name":"哈尼卡","galaxy":"太空站挑战","loc":"训练师之门（龙系）","mapId":102,"lv":85,"hp":2500,"sptId":78,"mech":"【属性护盾】哈尼卡只受战斗系、龙系技能的伤害，也不会陷入异常状态。"}, {"id":1149,"name":"瓦尔普","galaxy":"太空站挑战","loc":"训练师之门（普通系）","mapId":102,"lv":75,"hp":2000,"sptId":79,"mech":"【属性护盾】瓦尔普只受普通系、战斗系技能的伤害，也不会陷入异常状态。"}, {"id":1208,"name":"佩吉克","galaxy":"太空站挑战","loc":"训练师之门（电系）","mapId":102,"lv":85,"hp":2500,"sptId":80,"mech":"【属性护盾】佩吉克只受地面系技能的伤害，也不会陷入异常状态。"}, {"id":1383,"name":"弗洛斯","galaxy":"太空站挑战","loc":"训练师之门（超能冰系）","mapId":102,"lv":92,"hp":3000,"sptId":81,"mech":"【属性护盾】弗洛斯只受火系、机械系技能的伤害，也不会陷入异常状态。"}, {"id":169,"name":"卡特斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场","mapId":110,"lv":80,"hp":5500,"sptId":28,"mech":"【异常破绽】卡特斯只有中毒时才能被击倒，否则满血复活。中毒技能必定命中它，中毒持续两回合，之后一回合不会再中毒；不会陷入其他异常。"}, {"id":171,"name":"魔牙鲨","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第1门","mapId":110,"lv":80,"hp":8000,"sptId":36,"mech":"【属性护盾】魔牙鲨只受草系、电系技能的伤害，也不会陷入异常状态。"}, {"id":174,"name":"贝鲁基德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第2门","mapId":110,"lv":80,"hp":4000,"sptId":37,"mech":"【异常破绽】贝鲁基德只有冻伤时才能被击倒，否则满血复活。冻伤技能必定命中它，冻伤持续两回合，之后一回合不会再冻伤；不会陷入其他异常。"}, {"id":177,"name":"巴弗洛","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第3门","mapId":110,"lv":80,"hp":6000,"sptId":38,"mech":"【疾风之躯】巴弗洛只会被必中技能命中，也不会陷入异常状态。"}, {"id":183,"name":"奇拉塔顿","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第3门","mapId":110,"lv":80,"hp":4500,"sptId":39,"mech":"【多层护甲】奇拉塔顿有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。"}, {"id":195,"name":"西萨拉斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第4门","mapId":110,"lv":80,"hp":6000,"sptId":40,"mech":"【坚甲】西萨拉斯只有在防御或特防被降低时才会受到伤害，也不会陷入异常状态。"}, {"id":192,"name":"克林卡修","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第4门","mapId":110,"lv":80,"hp":5000,"sptId":41,"mech":"【强化压制】克林卡修出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。"}, {"id":222,"name":"卡库","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":80,"hp":9000,"sptId":42,"mech":"【属性护盾】卡库只受飞行系、超能系技能的伤害，也不会陷入异常状态。"}, {"id":224,"name":"赫德卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":80,"hp":4000,"sptId":43,"mech":"【异常破绽】赫德卡只有麻痹时才能被击倒，否则满血复活。麻痹技能必定命中它，麻痹持续两回合，之后一回合不会再麻痹；不会陷入其他异常。"}, {"id":227,"name":"伊兰罗尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":80,"hp":2000,"sptId":44,"mech":"【多层护甲】伊兰罗尼有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。"}, {"id":356,"name":"斯加尔卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":80,"hp":2000,"sptId":45,"mech":"【属性护盾】斯加尔卡只受地面系技能的伤害，也不会陷入异常状态。"}, {"id":297,"name":"艾尔伊洛","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":80,"hp":5000,"sptId":46,"mech":"【强化压制】艾尔伊洛出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。"}, {"id":359,"name":"布林克克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":80,"hp":2000,"sptId":47,"mech":"【顺序破防】布林克克只受草系、电系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。"}, {"id":438,"name":"魔花使者","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":85,"hp":6000,"sptId":48,"mech":"【异常破绽】魔花使者只有烧伤时才能被击倒，否则满血复活。烧伤技能必定命中它，烧伤持续两回合，之后一回合不会再烧伤；不会陷入其他异常。"}, {"id":441,"name":"莫尔加斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":85,"hp":8000,"sptId":49,"mech":"【属性护盾】莫尔加斯只受草系、水系技能的伤害，也不会陷入异常状态。"}, {"id":435,"name":"萨诺拉斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":85,"hp":8000,"sptId":50,"mech":"【疾风之躯】萨诺拉斯只会被必中技能命中，也不会陷入异常状态。"}, {"id":656,"name":"帕多尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":75,"hp":2000,"sptId":51,"mech":"【异常破绽】帕多尼只有睡眠时才能被击倒，否则满血复活。睡眠技能必定命中它，睡眠持续两回合，之后一回合不会再睡眠；不会陷入其他异常。"}, {"id":659,"name":"加洛德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":75,"hp":2000,"sptId":52,"mech":"【强化压制】加洛德出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。"}, {"id":661,"name":"萨多拉尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":85,"hp":2000,"sptId":53,"mech":"【属性护盾】萨多拉尼只受战斗系、龙系技能的伤害，也不会陷入异常状态。"}, {"id":779,"name":"迪普利德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":85,"hp":4500,"sptId":54,"mech":"【坚甲】迪普利德只有在防御或特防被降低时才会受到伤害，也不会陷入异常状态。"}, {"id":784,"name":"拜洛亚斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":85,"hp":8500,"sptId":55,"mech":"【疾风之躯】拜洛亚斯只会被必中技能命中，也不会陷入异常状态。"}, {"id":782,"name":"阿克诺亚","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":85,"hp":5500,"sptId":56,"mech":"【异常破绽】阿克诺亚有两条命，都只有烧伤时才能被击倒，否则满血复活。烧伤技能必定命中它，烧伤持续两回合，之后一回合不会再烧伤；不会陷入其他异常。"}, {"id":1182,"name":"鳞甲魔鱼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":85,"hp":3000,"sptId":62,"mech":"【多层护甲】鳞甲魔鱼有4层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。"}, {"id":1185,"name":"艾斯德克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":80,"hp":3000,"sptId":63,"mech":"【异常破绽】艾斯德克只有害怕时才能被击倒，否则满血复活。害怕技能必定命中它，害怕持续两回合，之后一回合不会再害怕；不会陷入其他异常。"}, {"id":1187,"name":"狂狮迪卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":85,"hp":3500,"sptId":64,"mech":"【坚甲】狂狮迪卡只有在防御和特防都被降低时才会受到伤害，也不会陷入异常状态。"}, {"id":359,"name":"布林克克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第12门","mapId":110,"lv":85,"hp":1800,"sptId":47,"mech":"【顺序破防】布林克克只受草系、电系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。"}];
      
      private var _modalBg:Sprite;
      
      private var _panel:Sprite;
      
      private var _cardsArea:Sprite;
      
      private var _tabsContainer:Sprite;
      
      private var _filterBar:Sprite;
      
      private var _tabBtns:Array = [];
      
      private var _filterBtns:Array = [];
      
      private var _pageTxt:TextField;
      private var _previousPageButton:Sprite;
      private var _nextPageButton:Sprite;
      
      private var _summaryTxt:TextField;
      
      private var _currentGalaxy:String = "帕诺星系";
      
      private var _currentFilter:String = "全部";
      
      private var _curPage:int = 1;
      
      private var _pageSize:int = 6;
      
      private var _filteredBosses:Array = [];
      
      // 卡片头像框边长与头像图片边长
      private const AVATAR:Number = 40;

      private const AVATAR_IMG:Number = 34;

      private const GALAXIES:Array = ["全部","帕诺星系","卡兰星系","罗格星系","裂空星系","神兽空间","太空站挑战","暗黑武斗场","其他区域"];
      
      public function SptPanel()
      {
         super();
      }
      
      public function setup() : void
      {
         initUI();
         updateFilter();
      }
      
      public function init(param1:Object = null) : void
      {
         updateFilter();
      }
      
      public function show() : void
      {
         try
         {
            LevelManager.showOrRemoveMapLevelandToolslevel(false,true);
            LevelManager.appLevel.addChild(this);
            updateFilter();
         }
         catch(e:Error)
         {
         }
      }
      
      public function hide() : void
      {
         try
         {
            LevelManager.showOrRemoveMapLevelandToolslevel(true);
            DisplayUtil.removeForParent(this);
            ModuleManager.destroyForInstance(this);
         }
         catch(e:Error)
         {
         }
      }
      
      public function destroy() : void
      {
         this._filteredBosses = null;
         this._tabBtns = null;
         this._filterBtns = null;
         this._previousPageButton = null;
         this._nextPageButton = null;
      }
      
      private function initUI() : void
      {
         while(this.numChildren > 0)
         {
            this.removeChildAt(0);
         }
         _modalBg = new Sprite();
         _modalBg.graphics.beginFill(0,0.72);
         _modalBg.graphics.drawRect(0,0,960,560);
         _modalBg.graphics.endFill();
         addChild(_modalBg);
         _panel = new Sprite();
         _panel.x = (960 - 820) / 2;
         _panel.y = (560 - 500) / 2;
         drawPanelFrame(_panel,820,500);
         addChild(_panel);
         drawHeader();
         _tabsContainer = new Sprite();
         _tabsContainer.x = 24;
         _tabsContainer.y = 44;
         _panel.addChild(_tabsContainer);
         renderGalaxyTabs();
         _filterBar = new Sprite();
         _filterBar.x = 24;
         _filterBar.y = 76;
         _panel.addChild(_filterBar);
         renderFilterBar();
         _cardsArea = new Sprite();
         _cardsArea.x = 24;
         _cardsArea.y = 112;
         _panel.addChild(_cardsArea);
         drawFooter();
      }
      
      private function drawPanelFrame(s:Sprite, w:Number, h:Number) : void
      {
         var frame:Sprite = UIManager.getSprite("Panel_Background");
         frame.scale9Grid = new Rectangle(16,32,frame.width-32,frame.height-48);
         frame.width = w;
         frame.height = h;
         frame.mouseEnabled = frame.mouseChildren = false;
         s.addChild(frame);
      }
      
      
      private function drawHeader() : void
      {
         var bar:Sprite = UIManager.getSprite("Panel_TitleBar");
         bar.x = 230; bar.y = 4; bar.width = 360; bar.height = 12;
         bar.mouseEnabled = bar.mouseChildren = false;
         _panel.addChild(bar);
         var title:TextField = createLabel(_panel,230,19,360,22,16,0xFFFFFF,true,TextFormatAlign.CENTER);
         title.filters = [new GlowFilter(676248,0.8,4,4,10)];
         title.text = "赛尔先锋队 · 星际首领挑战终端";
         var closeBtn:SimpleButton = UIManager.getButton("Close_Btn");
         closeBtn.width = closeBtn.height = 26;
         closeBtn.x = 783; closeBtn.y = 7;
         closeBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            hide();
         });
         _panel.addChild(closeBtn);
      }
      
      private function renderGalaxyTabs() : void
      {
         var curX:Number;
         var i:int;
         var gName:String;
         var btn:Sprite;
         var w:Number;
         while(_tabsContainer.numChildren > 0)
         {
            _tabsContainer.removeChildAt(0);
         }
         _tabBtns = [];
         curX = 0;
         i = 0;
         while(i < GALAXIES.length)
         {
            gName = GALAXIES[i];
            btn = new Sprite();
            btn.x = curX;
            w = (772 - (GALAXIES.length - 1) * 6) / GALAXIES.length;
            drawTabBtn(btn,w,26,gName,_currentGalaxy == gName);
            btn.buttonMode = true;
            (function(targetGalaxy:String):void
            {
               btn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
               {
                  _currentGalaxy = targetGalaxy;
                  _curPage = 1;
                  renderGalaxyTabs();
                  updateFilter();
               });
            })(gName);
            _tabsContainer.addChild(btn);
            _tabBtns.push(btn);
            curX += w + 6;
            i++;
         }
      }
      
      private function drawTabBtn(s:Sprite, w:Number, h:Number, label:String, active:Boolean) : void
      {
         while(s.numChildren > 0) s.removeChildAt(0);
         nativeButton(s,w,h,label,active);
      }

      private function nativeButton(s:Sprite,w:Number,h:Number,title:String,active:Boolean = false):TextField
      {
         var up:DisplayObject = UIManager.getDisplayObject("Button_upSkin");
         var over:DisplayObject = UIManager.getDisplayObject("Button_overSkin");
         var down:DisplayObject = UIManager.getDisplayObject("Button_downSkin");
         up.width = over.width = down.width = w;
         up.height = over.height = down.height = h;
         s.addChild(new SimpleButton(active ? down : up,over,down,up));
         s.mouseChildren = true;
         var text:TextField = createLabel(s,0,(h-20)/2,w,20,12,0xFFFFFF,true,TextFormatAlign.CENTER);
         text.filters = [new GlowFilter(676248,0.8,4,4,10)];
         text.text = title;
         return text;
      }
      
      private function renderFilterBar() : void
      {
         var filterStates:Array;
         var fX:Number;
         var i:int;
         var stName:String;
         var fBtn:Sprite;
         var sLabel:TextField;
         while(_filterBar.numChildren > 0)
         {
            _filterBar.removeChildAt(0);
         }
         _filterBar.graphics.clear();
         _filterBar.graphics.lineStyle(1,1456476);
         _filterBar.graphics.beginFill(529700,0.9);
         _filterBar.graphics.drawRoundRect(0,0,772,30,6,6);
         _filterBar.graphics.endFill();
         _summaryTxt = createLabel(_filterBar,10,5,380,22,12,9222629,false);
         filterStates = ["全部","未击败","已击败"];
         fX = 430;
         i = 0;
         while(i < filterStates.length)
         {
            stName = filterStates[i];
            fBtn = new Sprite();
            fBtn.x = fX;
            fBtn.y = 4;
            nativeButton(fBtn,65,22,stName,_currentFilter == stName);
            (function(targetSt:String):void
            {
               fBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
               {
                  _currentFilter = targetSt;
                  _curPage = 1;
                  renderFilterBar();
                  updateFilter();
               });
            })(stName);
            _filterBar.addChild(fBtn);
            fX += 71;
            i++;
         }
         sLabel = createLabel(_filterBar,650,5,112,22,11,55551,false,TextFormatAlign.RIGHT);
         sLabel.text = "共收录 " + BOSSES.length + " 只首领";
      }
      
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
      
      private function updateFilter() : void
      {
         _filteredBosses = [];
         var i:int = 0;
         while(i < BOSSES.length)
         {
            var b:Object = BOSSES[i];
            if(!(_currentGalaxy != "全部" && b.galaxy != _currentGalaxy))
            {
               var def:Boolean = isBossDefeated(b);
               if(!(_currentFilter == "已击败" && !def))
               {
                  if(!(_currentFilter == "未击败" && def))
                  {
                     _filteredBosses.push(b);
                  }
               }
            }
            i++;
         }
         if(_summaryTxt)
         {
            _summaryTxt.text = "当前星系：" + _currentGalaxy + " | 筛选：" + _currentFilter + " | 共 " + _filteredBosses.length + " 个首领";
         }
         renderCards();
         updatePagination();
      }
      
      private function renderCards() : void
      {
         while(_cardsArea.numChildren > 0)
         {
            _cardsArea.removeChildAt(0);
         }
         if(_filteredBosses.length == 0)
         {
            var emptyBox:Sprite = new Sprite();
            emptyBox.x = 80;
            emptyBox.y = 100;
            var emptyTxt:TextField = createLabel(emptyBox,0,0,612,60,15,0x163F62,true,TextFormatAlign.CENTER);
            if(_currentFilter == "已击败")
            {
               emptyTxt.text = "当前星系下暂无已击败记录！\n点击上方【全部】或【未击败】查看星际首领并前往挑战！";
            }
            else
            {
               emptyTxt.text = "未找到符合条件的首领！可在上方星系标签栏切换分类。";
            }
            _cardsArea.addChild(emptyBox);
            return;
         }
         var startIdx:int = (_curPage - 1) * _pageSize;
         var endIdx:int = Math.min(_filteredBosses.length,startIdx + _pageSize);
         var i:int = startIdx;
         while(i < endIdx)
         {
            var b:Object = _filteredBosses[i];
            var slot:int = i - startIdx;
            var col:int = slot % 3;
            var row:int = Math.floor(slot / 3);
            var card:Sprite = createBossCard(b);
            card.x = col * 261;
            card.y = row * 172;
            _cardsArea.addChild(card);
            i++;
         }
      }
      
      private function createBossCard(b:Object) : Sprite
      {
         var nameTxt:TextField;
         var gBadge:TextField;
         var avatarBox:Sprite;
         var maskShape:Shape;
         var avatarImgHolder:Sprite;
         var locTxt:TextField;
         var lvTxt:TextField;
         var stTxt:TextField;
         var mechBox:Sprite;
         var mechTxt:TextField;
         var goBtn:Sprite;
         var c:Sprite = new Sprite();
         var w:Number = 250;
         var h:Number = 168;
         var defeated:Boolean = isBossDefeated(b);
         c.graphics.lineStyle(1.5,defeated ? 2452286 : 55551,0.85);
         c.graphics.beginFill(defeated ? 465451 : 597557,0.95);
         c.graphics.drawRoundRect(0,0,w,h,8,8);
         c.graphics.endFill();
         c.graphics.beginFill(defeated ? 1062434 : 863824);
         c.graphics.drawRoundRect(0,0,w,24,6,6);
         c.graphics.endFill();
         nameTxt = createLabel(c,10,3,145,20,12,defeated ? 8712359 : 16765440,true);
         nameTxt.text = b.name;
         gBadge = createLabel(c,155,3,85,20,11,6600182,false,TextFormatAlign.RIGHT);
         gBadge.text = b.galaxy;
         avatarBox = new Sprite();
         avatarBox.x = 10;
         avatarBox.y = 29;
         avatarBox.graphics.lineStyle(1.5,defeated ? 2452286 : 55551,0.7);
         avatarBox.graphics.beginFill(398372,1);
         avatarBox.graphics.drawRoundRect(0,0,AVATAR,AVATAR,6,6);
         avatarBox.graphics.endFill();
         maskShape = new Shape();
         maskShape.x = 10;
         maskShape.y = 29;
         maskShape.graphics.beginFill(16777215,1);
         maskShape.graphics.drawRoundRect(0,0,AVATAR,AVATAR,6,6);
         maskShape.graphics.endFill();
         c.addChild(maskShape);
         avatarImgHolder = new Sprite();
         avatarImgHolder.x = 10;
         avatarImgHolder.y = 29;
         avatarImgHolder.mask = maskShape;
         loadBossAvatar(avatarImgHolder,b.id);
         c.addChild(avatarBox);
         c.addChild(avatarImgHolder);
         locTxt = createLabel(c,58,26,184,18,11,9483736,false);
         locTxt.text = "位置：" + (b.loc ? b.loc : "星际区域");
         lvTxt = createLabel(c,58,40,184,18,11,57855,false);
         lvTxt.text = "等级：" + (b.lv ? b.lv + " 级" : "首领难度") + (b.hp ? "　体力：" + b.hp : "");
         stTxt = createLabel(c,58,54,184,18,11,defeated ? 7725727 : 16748544,true);
         stTxt.text = defeated ? "状态：✓ 已击败" : "状态：未战胜";
         mechBox = new Sprite();
         mechBox.x = 8;
         mechBox.y = 73;
         mechBox.graphics.lineStyle(1,1986174,0.8);
         mechBox.graphics.beginFill(398372,0.9);
         mechBox.graphics.drawRoundRect(0,0,w - 16,66,6,6);
         mechBox.graphics.endFill();
         mechTxt = createLabel(mechBox,3,1,w - 22,65,11,14085375,false);
         mechTxt.multiline = true;
         mechTxt.wordWrap = true;
         mechTxt.text = b.mech;
         mechTxt.mouseEnabled = true;
         mechTxt.addEventListener(MouseEvent.MOUSE_WHEEL,function(e:MouseEvent):void
         {
            var field:TextField = e.currentTarget as TextField;
            field.scrollV -= e.delta;
            e.stopPropagation();
         });
         c.addChild(mechBox);
         goBtn = new Sprite();
         goBtn.x = 143;
         goBtn.y = 140;
         nativeButton(goBtn,97,26,defeated ? "再次挑战" : "前往挑战");
         (function(targetBoss:Object):void
         {
            goBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               hide();
               if(targetBoss.mapId)
               {
                  MapManager.changeMap(targetBoss.mapId);
               }
            });
         })(b);
         c.addChild(goBtn);
         return c;
      }
      
      private function loadBossAvatar(holder:Sprite, petId:int) : void
      {
         var l:Loader = new Loader();
         l.contentLoaderInfo.addEventListener(Event.COMPLETE,function(e:Event):void
         {
            var domain:ApplicationDomain;
            var cls:Class;
            var itemObj:DisplayObject;
            var sc:Number;
            try
            {
               domain = l.contentLoaderInfo.applicationDomain;
               cls = null;
               if(domain)
               {
                  if(domain.hasDefinition("item"))
                  {
                     cls = domain.getDefinition("item") as Class;
                  }
                  else if(domain.hasDefinition("pet"))
                  {
                     cls = domain.getDefinition("pet") as Class;
                  }
               }
               if(cls != null)
               {
                  itemObj = new cls() as DisplayObject;
                  if(itemObj)
                  {
                     sc = Math.min(AVATAR_IMG / itemObj.width,AVATAR_IMG / itemObj.height);
                     if(isNaN(sc) || sc <= 0 || !isFinite(sc))
                     {
                        sc = 0.5;
                     }
                     itemObj.scaleX = itemObj.scaleY = sc;
                     itemObj.x = (AVATAR - itemObj.width) / 2;
                     itemObj.y = (AVATAR - itemObj.height) / 2;
                     holder.addChild(itemObj);
                     return;
                  }
               }
               if(l.content)
               {
                  l.content.width = AVATAR_IMG;
                  l.content.height = AVATAR_IMG;
                  l.content.x = (AVATAR - AVATAR_IMG) / 2;
                  l.content.y = (AVATAR - AVATAR_IMG) / 2;
                  holder.addChild(l.content);
               }
            }
            catch(err:Error)
            {
            }
         });
         l.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,function(e:IOErrorEvent):void
         {
            var l2:Loader;
            try
            {
               l2 = new Loader();
               l2.contentLoaderInfo.addEventListener(Event.COMPLETE,function(ev:Event):void
               {
                  var d2:ApplicationDomain;
                  var pCls:Class;
                  var pObj:DisplayObject;
                  try
                  {
                     d2 = l2.contentLoaderInfo.applicationDomain;
                     if(d2 && d2.hasDefinition("pet"))
                     {
                        pCls = d2.getDefinition("pet") as Class;
                        pObj = new pCls() as DisplayObject;
                        pObj.width = pObj.height = AVATAR_IMG;
                        pObj.x = pObj.y = (AVATAR - AVATAR_IMG) / 2;
                        holder.addChild(pObj);
                     }
                  }
                  catch(err2:Error)
                  {
                  }
               });
               l2.load(new URLRequest("/resource/groupFightResource/pet/" + petId + ".swf"));
            }
            catch(err3:Error)
            {
            }
         });
         l.load(new URLRequest("/resource/pet/head/" + petId + ".swf"));
      }
      
      private function drawFooter() : void
      {
         var prevBtn:Sprite;
         var nextBtn:Sprite;
         var ft:Sprite = new Sprite();
         ft.x = 24;
         ft.y = 458;
         _panel.addChild(ft);
         prevBtn = createPageButton(ft,40,0,"◀ 上一页");
         _previousPageButton = prevBtn;
         prevBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            if(_curPage > 1)
            {
               --_curPage;
               renderCards();
               updatePagination();
            }
         });
         nextBtn = createPageButton(ft,644,0,"下一页 ▶");
         _nextPageButton = nextBtn;
         nextBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            var total:int = Math.max(1,Math.ceil(_filteredBosses.length / _pageSize));
            if(_curPage < total)
            {
               ++_curPage;
               renderCards();
               updatePagination();
            }
         });
         _pageTxt = createLabel(ft,320,4,132,24,14,0x163F62,true,TextFormatAlign.CENTER);
         _pageTxt.text = "1 / 1";
      }
      
      private function createPageButton(parent:Sprite, x:Number, y:Number, label:String) : Sprite
      {
         var s:Sprite = new Sprite();
         s.x = x;
         s.y = y;
         nativeButton(s,88,28,label);
         parent.addChild(s);
         return s;
      }
      
      private function updatePagination() : void
      {
         var totalPages:int = Math.max(1,Math.ceil(_filteredBosses.length / _pageSize));
         _previousPageButton.mouseEnabled = _previousPageButton.mouseChildren = _curPage > 1;
         _nextPageButton.mouseEnabled = _nextPageButton.mouseChildren = _curPage < totalPages;
         _previousPageButton.alpha = _previousPageButton.mouseEnabled ? 1 : 0.45;
         _nextPageButton.alpha = _nextPageButton.mouseEnabled ? 1 : 0.45;
         if(_pageTxt)
         {
            _pageTxt.text = _curPage + " / " + totalPages;
         }
      }
      
      private function createLabel(parent:Sprite, x:Number, y:Number, w:Number, h:Number, size:int, color:uint, bold:Boolean = false, align:String = "left") : TextField
      {
         var t:TextField = new TextField();
         t.x = x;
         t.y = y;
         t.width = w;
         t.height = h;
         t.defaultTextFormat = new TextFormat("宋体",size,color,bold,null,null,null,null,align);
         t.selectable = false;
         t.mouseEnabled = false;
         parent.addChild(t);
         return t;
      }
   }
}

