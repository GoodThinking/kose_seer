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
      private const BOSSES:Array = [{"id":1000,"name":"奥尔德·力量试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":132,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"奥尔德·智慧试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":133,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"奥尔德·勇气试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":134,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"奥尔德·正义试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":135,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"奥尔德·仁慈试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":136,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"奥尔德·坚韧试炼","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":137,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":1000,"name":"光明异能王·奥尔德","galaxy":"裂空星系","loc":"希尔星·异能神殿","mapId":677,"lv":80,"hp":2000,"sptId":131,"mech":"【力量试炼】奥尔德体力2000，天生攻击、特攻+2且必定先制，能力提升无法被消除。"},{"id":47,"name":"蘑菇怪","galaxy":"帕诺星系","loc":"克洛斯星林间","mapId":12,"lv":10,"hp":100,"sptId":1,"mech":"【毒孢子】用物理攻击打蘑菇怪，出手的精灵有30%几率中毒。它的技能PP无限。"},{"id":34,"name":"钢牙鲨","galaxy":"帕诺星系","loc":"海洋星海底","mapId":22,"lv":25,"hp":200,"sptId":2,"mech":"【嗜血】钢牙鲨体力低于三成后，攻击必定暴击。"},{"id":42,"name":"里奥斯","galaxy":"帕诺星系","loc":"火山星山洞深处","mapId":17,"lv":35,"hp":170,"sptId":3,"mech":"【不屈】里奥斯有两条命，第一次被击倒会满血复活。"},{"id":50,"name":"阿克希亚","galaxy":"帕诺星系","loc":"塞西利亚星","mapId":40,"lv":80,"hp":3200,"sptId":4,"mech":"【极度冰点】拥有本系冰霜护体（火、战斗、机械系克制攻击可破除护体造成额外伤害）；半血时触发凝冰觉醒提升特攻与双防。"},{"id":69,"name":"提亚斯","galaxy":"帕诺星系","loc":"云霄星最高层","mapId":27,"lv":78,"hp":2800,"sptId":5,"mech":"【疾风掠影】出场速度+2并有25%几率闪避普通攻击；使用电、冰系克制技能或必中招式可稳定压制。"},{"id":70,"name":"雷伊","galaxy":"帕诺星系","loc":"赫尔卡星荒地","mapId":32,"lv":90,"hp":5500,"sptId":6,"mech":"【雷神天威】技能先制+2，半血触发雷神觉醒；使用地面系、神秘系克制攻击可击碎雷电护体并压制其先制气场。"},{"id":88,"name":"纳多雷","galaxy":"帕诺星系","loc":"双子阿尔法星·阿尔法星岩地","mapId":106,"lv":82,"hp":3600,"sptId":7,"mech":"【大地壁垒】出场双防+1且每回合恢复250体力；使用草、水、冰系克制攻击可破除护体并压制回血。"},{"id":113,"name":"雷纳多","galaxy":"帕诺星系","loc":"双子贝塔星·贝塔星荒原","mapId":49,"lv":85,"hp":3800,"sptId":8,"mech":"【机械过载】半血以下触发过载觉醒（特攻+2、速度+1、暴击率大幅提升）；宜用火、地面、战斗系克制主攻速战速决。"},{"id":132,"name":"尤纳斯","galaxy":"帕诺星系","loc":"拜伦号","mapId":314,"lv":70,"hp":2800,"sptId":9,"mech":"【破防】尤纳斯要先被贯穿水枪破防，之前打它无效；最后一击只能是里奥斯的幻影，持续伤害打不死它。免疫中毒、烧伤、冻伤，PP无限。"},{"id":187,"name":"魔狮迪露","galaxy":"帕诺星系","loc":"斯诺岩洞","mapId":53,"lv":50,"hp":3000000,"sptId":10,"mech":"【300万体力】魔狮迪露有300万体力，属性克制对它无效，体力低于一半后必定先手并会秒杀；可用同生共死、镇魂歌这类招式。PP无限。"},{"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"火山星","mapId":15,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"},{"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"露希欧星","mapId":54,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"},{"id":261,"name":"盖亚","galaxy":"帕诺星系","loc":"双子阿尔法星","mapId":105,"lv":70,"hp":2000,"sptId":14,"mech":"【周几条件】盖亚每天换地方：周一、五在火山星，2回合内打败；周二、四、日在露希欧星，致命一击打败；周三、六在双子阿尔法星，10回合后打败。"},{"id":393,"name":"上古炎兽","galaxy":"帕诺星系","loc":"火山星山洞","mapId":16,"lv":95,"hp":8000,"sptId":18,"mech":"【熔岩领域】每回合灼烧全场非火系精灵，受物理攻击30%触发烧伤；使用水系、地面系克制攻击可熄灭当回合熔岩并造成破绽伤害。"},{"id":811,"name":"始祖灵兽","galaxy":"帕诺星系","loc":"克洛斯星地心","mapId":13,"lv":95,"hp":8500,"sptId":20,"mech":"【生灵赐福】每回合恢复350体力并净化1项自身弱化，半血触发古木觉醒；使用火、飞行、冰、机械系克制攻击可压制回血并造成高额伤害。"},{"id":91,"name":"悠悠","galaxy":"帕诺星系","loc":"双子阿尔法星","mapId":105,"lv":50,"hp":4000,"sptId":35,"mech":"【悠然】悠悠每次受到攻击，有20%几率完全挡下这次伤害。"},{"id":216,"name":"哈莫雷特","galaxy":"卡兰星系","loc":"尼古尔星","mapId":57,"lv":80,"hp":10000,"sptId":11,"mech":"【顺序破防】哈莫雷特只受水系、火系、草系技能按顺序轮流命中的伤害，打空也算一次；免疫异常、同生共死和百分比伤害。"},{"id":274,"name":"塔克林","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":90,"hp":5500,"sptId":15,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":391,"name":"塔西亚","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":70,"hp":10000,"sptId":16,"mech":"【龙之结界】用物理攻击打塔西亚，出手的精灵90%会害怕；出场特攻+2，免疫寄生、中毒、烧伤、冻伤和降能力，PP无限。"},{"id":216,"name":"哈莫雷特","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":80,"hp":10000,"sptId":11,"mech":"【顺序破防】哈莫雷特只受水系、火系、草系技能按顺序轮流命中的伤害，打空也算一次；免疫异常、同生共死和百分比伤害。"},{"id":413,"name":"塞维尔","galaxy":"卡兰星系","loc":"哈默星·龙王圣殿","mapId":348,"lv":90,"hp":5500,"sptId":19,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":264,"name":"奈尼芬多","galaxy":"卡兰星系","loc":"艾迪星","mapId":325,"lv":85,"hp":4200,"sptId":12,"mech":"【超能光障】自带特攻、特防与速度强化，半血触发精神觉醒；使用光、暗影、机械系克制技能可破除护体。"},{"id":421,"name":"厄尔塞拉","galaxy":"卡兰星系","loc":"塔克星·光之迷城","mapId":61,"lv":80,"hp":3000,"sptId":13,"mech":"【每日规则】周一免疫异常，周二闪避50%，周三反弹高伤害，周四每回合回1000，周五无异常时被击倒会复活，周六伤害减半，周日必先手、低血秒杀。"},{"id":347,"name":"远古鱼龙","galaxy":"卡兰星系","loc":"尼古尔水帘","mapId":59,"lv":95,"hp":8500,"sptId":17,"mech":"【深海祈雨】每回合恢复400体力，半血触发深海觉醒；使用草系、电系克制攻击可破除护体并令其当回合暂停回血。"},{"id":479,"name":"冰洛伏特","galaxy":"卡兰星系","loc":"斯科尔高空塔","mapId":331,"lv":90,"hp":5500,"sptId":23,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":755,"name":"斯普林特","galaxy":"卡兰星系","loc":"地底古迹","mapId":495,"lv":90,"hp":5500,"sptId":76,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":538,"name":"克拉尼特","galaxy":"罗格星系","loc":"戴斯星","mapId":435,"lv":92,"hp":5000,"sptId":26,"mech":"【两种形态】克拉尼特有两条命：第一形态主要靠火龙红莲击，PP耗尽后很弱；被击倒后以第二形态满血复活，招式全部换掉。"},{"id":587,"name":"墨杜萨","galaxy":"罗格星系","loc":"墨杜萨星·石化之城","mapId":438,"lv":90,"hp":9000,"sptId":27,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":672,"name":"亚伦斯","galaxy":"罗格星系","loc":"拓梯星·活力源泉","mapId":430,"lv":90,"hp":5500,"sptId":31,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":474,"name":"该伊","galaxy":"罗格星系","loc":"陨石地带·巨型陨石","mapId":415,"lv":90,"hp":7000,"sptId":32,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":471,"name":"伊特","galaxy":"罗格星系","loc":"比格星·觅食林","mapId":414,"lv":90,"hp":10000,"sptId":33,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":798,"name":"卡修斯","galaxy":"裂空星系","loc":"炫彩山山脚","mapId":445,"lv":90,"hp":5500,"sptId":57,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":715,"name":"德拉萨","galaxy":"裂空星系","loc":"怀特矿场","mapId":486,"lv":90,"hp":8000,"sptId":58,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":804,"name":"迪符特","galaxy":"裂空星系","loc":"山神圣殿","mapId":450,"lv":90,"hp":5500,"sptId":59,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":875,"name":"布莱克","galaxy":"裂空星系","loc":"光明圣坛","mapId":9507,"lv":90,"hp":5500,"sptId":61,"mech":"【星系霸主】只接受单挑决斗；具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":300,"name":"虚无的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第1封印","mapId":108,"lv":100,"hp":7000,"sptId":0,"mech":"【虚无封印】除必中技能外，所有攻击都会落空；出场攻击、特攻+2。"},{"id":300,"name":"元素的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第2封印","mapId":108,"lv":100,"hp":8000,"sptId":0,"mech":"【元素封印】只受光系、暗影系技能的伤害，持续伤害有效。"},{"id":300,"name":"能量的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第3封印","mapId":108,"lv":100,"hp":9000,"sptId":0,"mech":"【能量封印】单次物理或特殊攻击伤害超过500时，出手的精灵被秒杀。"},{"id":300,"name":"生命的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第4封印","mapId":108,"lv":100,"hp":10000,"sptId":0,"mech":"【生命封印】每回合回复2000体力，不会被降低能力。"},{"id":300,"name":"轮回的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第5封印","mapId":108,"lv":100,"hp":10000,"sptId":0,"mech":"【轮回封印】有两条命，第二条命满体力满PP，不会被降低能力。"},{"id":300,"name":"永恒的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第6封印","mapId":108,"lv":100,"hp":12000,"sptId":0,"mech":"【永恒封印】技能PP无限，出场攻击、特攻+2，不会被降低能力。"},{"id":300,"name":"圣洁的化身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·第7封印","mapId":108,"lv":100,"hp":16000,"sptId":0,"mech":"【圣洁封印】只受攻击技能附带的异常造成的伤害，属性技能的异常无效；出场攻击、特攻+2，不会被降低能力。"},{"id":300,"name":"谱尼的真身","galaxy":"神兽空间","loc":"勇者之塔神秘领域·谱尼真身","mapId":108,"lv":100,"hp":7000,"sptId":0,"mech":"【谱尼真身】有六条命，技能PP无限，无视速度必定先手，不会被降低能力。"},{"id":501,"name":"巴斯特","galaxy":"神兽空间","loc":"玄武空间","mapId":401,"lv":90,"hp":5500,"sptId":29,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":504,"name":"菲尼克斯","galaxy":"神兽空间","loc":"朱雀空间","mapId":318,"lv":100,"hp":1500,"sptId":60,"mech":"【朱雀三影】菲尼克斯有四条命：愤怒之影反弹1/4伤害；光芒之影必定先手、闪避20%、半血以下暴击；重生之影两条命，每回合回100。"},{"id":468,"name":"罗德利斯","galaxy":"太空站挑战","loc":"太空站扩展","mapId":405,"lv":90,"hp":5500,"sptId":24,"mech":"【星系霸主】拥有两条命；具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":426,"name":"迪尔科特","galaxy":"太空站挑战","loc":"太空站扩展","mapId":405,"lv":90,"hp":5500,"sptId":25,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":115,"name":"巨型树妖","galaxy":"太空站挑战","loc":"精灵召唤场","mapId":502,"lv":40,"hp":2400,"sptId":0,"mech":"【召唤与护盾】在精灵召唤场点任一圆环召唤巨型树妖，一分钟内喷火命中五次打破防护罩，才能挑战它。"},{"id":983,"name":"塔奇多克","galaxy":"太空站挑战","loc":"训练师之门（草系）","mapId":102,"lv":85,"hp":3800,"sptId":67,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":992,"name":"火噜噜","galaxy":"太空站挑战","loc":"训练师之门（火系）","mapId":102,"lv":85,"hp":3800,"sptId":68,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1008,"name":"查德洛","galaxy":"太空站挑战","loc":"训练师之门（超能系）","mapId":102,"lv":85,"hp":3800,"sptId":69,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1031,"name":"多尔尼","galaxy":"太空站挑战","loc":"训练师之门（水系）","mapId":102,"lv":85,"hp":3800,"sptId":70,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1051,"name":"加耶罗","galaxy":"太空站挑战","loc":"训练师之门（飞行系）","mapId":102,"lv":85,"hp":3800,"sptId":71,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1079,"name":"岩锤怪","galaxy":"太空站挑战","loc":"训练师之门（地面系）","mapId":102,"lv":85,"hp":3800,"sptId":72,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1083,"name":"LYN","galaxy":"太空站挑战","loc":"训练师之门（机械系）","mapId":102,"lv":85,"hp":3800,"sptId":73,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1099,"name":"达克其","galaxy":"太空站挑战","loc":"训练师之门（暗影系）","mapId":102,"lv":85,"hp":3800,"sptId":74,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1111,"name":"菲尔洛","galaxy":"太空站挑战","loc":"训练师之门（冰系）","mapId":102,"lv":85,"hp":3800,"sptId":75,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1127,"name":"卡莱洛","galaxy":"太空站挑战","loc":"训练师之门（光系）","mapId":102,"lv":85,"hp":3800,"sptId":77,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1138,"name":"哈尼卡","galaxy":"太空站挑战","loc":"训练师之门（龙系）","mapId":102,"lv":85,"hp":3800,"sptId":78,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1149,"name":"瓦尔普","galaxy":"太空站挑战","loc":"训练师之门（普通系）","mapId":102,"lv":85,"hp":3800,"sptId":79,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1208,"name":"佩吉克","galaxy":"太空站挑战","loc":"训练师之门（电系）","mapId":102,"lv":85,"hp":3800,"sptId":80,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1383,"name":"弗洛斯","galaxy":"太空站挑战","loc":"训练师之门（超能冰系）","mapId":102,"lv":85,"hp":3800,"sptId":81,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":169,"name":"卡特斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场","mapId":110,"lv":85,"hp":5200,"sptId":28,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":171,"name":"魔牙鲨","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第1门","mapId":110,"lv":85,"hp":5200,"sptId":36,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":174,"name":"贝鲁基德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第2门","mapId":110,"lv":85,"hp":5200,"sptId":37,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":177,"name":"巴弗洛","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第3门","mapId":110,"lv":85,"hp":5200,"sptId":38,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":183,"name":"奇拉塔顿","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第3门","mapId":110,"lv":85,"hp":5200,"sptId":39,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":195,"name":"西萨拉斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第4门","mapId":110,"lv":85,"hp":5200,"sptId":40,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":192,"name":"克林卡修","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第4门","mapId":110,"lv":85,"hp":5200,"sptId":41,"mech":"【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。"},{"id":222,"name":"卡库","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":92,"hp":7200,"sptId":42,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":224,"name":"赫德卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":92,"hp":7200,"sptId":43,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":227,"name":"伊兰罗尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第5门","mapId":110,"lv":92,"hp":7200,"sptId":44,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":356,"name":"斯加尔卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":92,"hp":7200,"sptId":45,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":297,"name":"艾尔伊洛","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":92,"hp":7200,"sptId":46,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":359,"name":"布林克克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第6门","mapId":110,"lv":92,"hp":7200,"sptId":47,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":438,"name":"魔花使者","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":92,"hp":7200,"sptId":48,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":441,"name":"莫尔加斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":92,"hp":7200,"sptId":49,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":435,"name":"萨诺拉斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第7门","mapId":110,"lv":92,"hp":7200,"sptId":50,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":656,"name":"帕多尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":92,"hp":7200,"sptId":51,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":659,"name":"加洛德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":92,"hp":7200,"sptId":52,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":661,"name":"萨多拉尼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第8门","mapId":110,"lv":92,"hp":7200,"sptId":53,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":779,"name":"迪普利德","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":100,"hp":6800,"sptId":54,"mech":"【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。"},{"id":784,"name":"拜洛亚斯","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":100,"hp":6800,"sptId":55,"mech":"【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。"},{"id":782,"name":"阿克诺亚","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第9门","mapId":110,"lv":100,"hp":6800,"sptId":56,"mech":"【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。"},{"id":1182,"name":"鳞甲魔鱼","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":100,"hp":6800,"sptId":62,"mech":"【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。"},{"id":1185,"name":"艾斯德克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":100,"hp":6800,"sptId":63,"mech":"【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。"},{"id":1187,"name":"狂狮迪卡","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第10门","mapId":110,"lv":100,"hp":6800,"sptId":64,"mech":"【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。"},{"id":359,"name":"布林克克","galaxy":"暗黑武斗场","loc":"暗黑武斗场·第12门","mapId":110,"lv":92,"hp":7200,"sptId":47,"mech":"【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。"},{"id":617,"name":"肯佩德","galaxy":"罗格星系","loc":"拉铂尔星","mapId":441,"lv":90,"hp":9000,"sptId":34,"mech":"【星系霸主】具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。"},{"id":1156,"name":"威里特","galaxy":"太空站挑战","loc":"训练师之门（战斗系）","mapId":102,"lv":85,"hp":3800,"sptId":82,"mech":"【本系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1191,"name":"普兰特","galaxy":"太空站挑战","loc":"训练师之门（草超能系）","mapId":102,"lv":88,"hp":4500,"sptId":83,"mech":"【双系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"},{"id":1304,"name":"帕里斯","galaxy":"太空站挑战","loc":"训练师之门（水暗影系）","mapId":102,"lv":88,"hp":4500,"sptId":84,"mech":"【双系主场】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！"}];

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
