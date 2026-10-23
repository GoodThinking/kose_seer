package com.robot.app.fightNote
{
   import com.robot.app.automaticFight.AutomaticFightManager;
   import com.robot.app.info.fightInvite.InviteNoteInfo;
   import com.robot.app.protectSys.KillPluginSys;
   import com.robot.app.user.UserInfoController;
   import com.robot.core.CommandID;
   import com.robot.core.info.UserInfo;
   import com.robot.core.info.fightInfo.PetFightModel;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.alert.Answer;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.events.TextEvent;
   import flash.utils.setTimeout;
   
   public class FightInviteManager
   {
      
      private static var iconMC:MovieClip;
      
      private static var array:Array = [];
      
      private static var fightSwitch:Boolean = true;
      
      private static var NUM:Number = 0.03;
      
      public static var isKillBigPetB:Boolean = false;
      
      public static var isKillBigPetB0:Boolean = false;
      
      public static var isKillBigPetB1:Boolean = false;
      
      // 带锁的 BOSS（地图/编号）：挑战前先说明锁和钥匙，确认后再开打。与服务端 compat/server-patches/boss-locks/ 下的 locks.json、dark-portal.json 一致（暗黑门各门在 DarkPortalModel）
      private static const BOSS_HINTS:Object = {"102/201":"【属性护盾】塔奇多克只受火系、飞行系技能的伤害，也不会陷入异常状态。","102/202":"【属性护盾】火噜噜只受水系、地面系技能的伤害，也不会陷入异常状态。","102/203":"【属性护盾】查德洛只受光系、暗影系技能的伤害，也不会陷入异常状态。","102/204":"【属性护盾】多尔尼只受草系、电系技能的伤害，也不会陷入异常状态。","102/205":"【属性护盾】加耶罗只受电系、冰系技能的伤害，也不会陷入异常状态。","102/206":"【属性护盾】岩锤怪只受草系、水系技能的伤害，也不会陷入异常状态。","102/207":"【属性护盾】LYN只受火系、地面系技能的伤害，也不会陷入异常状态。","102/208":"【属性护盾】达克其只受电系、光系技能的伤害，也不会陷入异常状态。","102/209":"【属性护盾】菲尔洛只受火系、战斗系技能的伤害，也不会陷入异常状态。","102/210":"【属性护盾】卡莱洛只受草系技能的伤害，也不会陷入异常状态。","102/211":"【属性护盾】哈尼卡只受战斗系、龙系技能的伤害，也不会陷入异常状态。","102/212":"【属性护盾】瓦尔普只受普通系、战斗系技能的伤害，也不会陷入异常状态。","102/213":"【属性护盾】佩吉克只受地面系技能的伤害，也不会陷入异常状态。","102/214":"【属性护盾】弗洛斯只受火系、机械系技能的伤害，也不会陷入异常状态。","110/0":"【异常破绽】卡特斯只有中毒时才能被击倒，否则满血复活。中毒技能必定命中它，中毒持续两回合，之后一回合不会再中毒；不会陷入其他异常。","348/0":"【强化压制】塔克林出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。","348/3":"【属性护盾】塞维尔只受战斗系、龙系技能的伤害，也不会陷入异常状态。","59/0":"【属性护盾】远古鱼龙只受草系、电系技能的伤害，也不会陷入异常状态。","16/0":"【属性护盾】上古炎兽只受水系、地面系技能的伤害，也不会陷入异常状态。","13/0":"【异常破绽】始祖灵兽只有烧伤时才能被击倒，否则满血复活。烧伤技能必定命中它，烧伤持续两回合，之后一回合不会再烧伤；不会陷入其他异常。","331/0":"【顺序破防】冰洛伏特只受火系、机械系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。","405/0":"【异常破绽】罗德利斯有两条命，都只有冻伤时才能被击倒，否则满血复活。冻伤技能必定命中它，冻伤持续两回合，之后一回合不会再冻伤；不会陷入其他异常。","405/1":"【疾风之躯】迪尔科特只会被必中技能命中，也不会陷入异常状态。","438/0":"【属性护盾】墨杜萨只受光系、暗影系技能的伤害，也不会陷入异常状态。","401/1":"【坚甲】巴斯特只有在防御和特防都被降低时才会受到伤害，也不会陷入异常状态。","430/0":"【异常破绽】亚伦斯只有麻痹时才能被击倒，否则满血复活。麻痹技能必定命中它，麻痹持续两回合，之后一回合不会再麻痹；不会陷入其他异常。","415/0":"【疾风之躯】该伊只会被必中技能命中，也不会陷入异常状态。","411/0":"【疾风之躯】该伊只会被必中技能命中，也不会陷入异常状态。","414/0":"【属性护盾】伊特只受火系、飞行系技能的伤害，也不会陷入异常状态。","445/0":"【多层护甲】卡修斯有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。","486/0":"【属性护盾】德拉萨只受战斗系、龙系技能的伤害，也不会陷入异常状态。","450/0":"【多层护甲】迪符特有4层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。","495/0":"【异常破绽】斯普林特只有睡眠时才能被击倒，否则满血复活。睡眠技能必定命中它，睡眠持续两回合，之后一回合不会再睡眠；不会陷入其他异常。","932/0":"【顺序破防】缪斯只受光系、暗影系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。","733/0":"【疾风之躯】芙洛只会被必中技能命中，也不会陷入异常状态。","9507/0":"【属性护盾】布莱克只受电系、光系技能的伤害，也不会陷入异常状态。只能派一只精灵出战。","40/0":"【属性护盾】阿克希亚只受火系、战斗系技能的伤害，也不会陷入异常状态。","27/0":"【疾风之躯】提亚斯只会被必中技能命中，也不会陷入异常状态。","10/0":"【疾风之躯】闪光波克尔只会被必中技能命中，也不会陷入异常状态。","34/0":"【属性护盾】果冻鸭只受草系、电系技能的伤害，也不会陷入异常状态。","310/0":"【属性护盾】果冻鸭只受草系、电系技能的伤害，也不会陷入异常状态。","106/0":"【坚甲】纳多雷只有在防御或特防被降低时才会受到伤害，也不会陷入异常状态。","32/0":"【属性护盾】雷伊只受地面系技能的伤害，也不会陷入异常状态。","49/0":"【属性护盾】雷纳多只受火系、地面系、战斗系技能的伤害，也不会陷入异常状态。","325/0":"【属性护盾】奈尼芬多只受光系、暗影系技能的伤害，也不会陷入异常状态。"};
      
      private static var hinted:String;
      
      public function FightInviteManager()
      {
         super();
      }
      
      public static function fightWithPlayer(param1:UserInfo) : void
      {
         if(PetManager.length == 0)
         {
            Alarm.show("你没有带赛尔精灵，不能战斗!");
            return;
         }
         var _loc2_:PetInfo = PetManager.getPetInfo(PetManager.defaultTime);
         if(_loc2_ == null)
         {
            Alarm.show("你没有可出战的精灵！");
            return;
         }
         FightWaitPanel.selectMode(param1);
      }
      
      public static function fightWithNpc(param1:uint) : void
      {
         if(!fightSwitch)
         {
            return;
         }
         if(Math.random() < NUM && !AutomaticFightManager.isStart)
         {
            KillPluginSys.start();
            return;
         }
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         PetFightModel.status = PetFightModel.FIGHT_WITH_NPC;
         PetFightModel.enemyName = "野外精灵";
         SocketConnection.send(CommandID.FIGHT_NPC_MONSTER,param1);
         fightSwitch = false;
         changeSwitch();
      }
      
      public static function fightWithBoss(param1:String, param2:uint = 0, param3:Boolean = false) : void
      {
         var key:String = MainManager.actorInfo.mapID + "/" + param2;
         if(BOSS_HINTS[key] != null && hinted != key)
         {
            Alert.show(BOSS_HINTS[key] + "\r确定挑战吗？",function():void
            {
               hinted = key;
               fightWithBoss(param1,param2,param3);
            });
            return;
         }
         hinted = null;
         if(!fightSwitch)
         {
            return;
         }
         if(Math.random() < NUM && !AutomaticFightManager.isStart && !param3)
         {
            KillPluginSys.start();
            return;
         }
         PetFightModel.enemyName = param1;
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         PetFightModel.status = PetFightModel.FIGHT_WITH_BOSS;
         SocketConnection.send(CommandID.CHALLENGE_BOSS,param2);
         fightSwitch = false;
         changeSwitch();
      }
      
      public static function fightWithSpecial() : void
      {
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         PetFightModel.status = PetFightModel.FIGHT_WITH_NPC;
         PetFightModel.enemyName = "稀有精灵";
         SocketConnection.send(CommandID.FIGHT_SPECIAL_PET);
      }
      
      private static function changeSwitch() : void
      {
         setTimeout(function():void
         {
            fightSwitch = true;
         },1000);
      }
      
      public static function add(param1:InviteNoteInfo) : void
      {
         array.push(param1);
         checkLength();
      }
      
      private static function next() : InviteNoteInfo
      {
         var _loc1_:InviteNoteInfo = array.shift() as InviteNoteInfo;
         checkLength();
         return _loc1_;
      }
      
      private static function checkLength() : void
      {
         if(!iconMC)
         {
            iconMC = UIManager.getMovieClip("FightInvite_Icon");
            iconMC.buttonMode = true;
            iconMC.x = 320;
            iconMC.y = 20;
            iconMC.addEventListener(MouseEvent.CLICK,showInviteAnswer);
         }
         if(array.length > 0)
         {
            LevelManager.iconLevel.addChild(iconMC);
         }
         else
         {
            iconMC.parent.removeChild(iconMC);
         }
      }
      
      private static function showInviteAnswer(param1:MouseEvent) : void
      {
         var sprite:Sprite = null;
         var data:InviteNoteInfo = null;
         var type:uint = 0;
         var event:MouseEvent = param1;
         data = null;
         type = 0;
         var str:String = null;
         var acceptInvite:Function = null;
         var rejectInvite:Function = null;
         acceptInvite = function():void
         {
            if(PetManager.length == 0)
            {
               Alarm.show("你还没有带上赛尔精灵，不能接受对战");
               return;
            }
            PetFightModel.mode = type;
            PetFightModel.enemyName = data.nickName;
            PetFightModel.status = PetFightModel.FIGHT_WITH_PLAYER;
            SocketConnection.send(CommandID.HANDLE_FIGHT_INVITE,data.userID,1,type);
         };
         rejectInvite = function():void
         {
            SocketConnection.send(CommandID.HANDLE_FIGHT_INVITE,data.userID,0,type);
         };
         data = next();
         type = data.mode;
         if(type == PetFightModel.SINGLE_MODE)
         {
            str = "精灵单挑";
         }
         else
         {
            str = "多精灵对战";
         }
         sprite = Answer.show("<a href=\'event:\'><font color=\'#ff0000\'>" + data.nickName + "(" + data.userID + ")</font></a> 邀请你进行赛尔精灵对战，你愿意接受吗？\r\r<font color=\'#ff0000\'>对战模式：" + str + "</font>",acceptInvite,rejectInvite);
         sprite.addEventListener(TextEvent.LINK,function():void
         {
            UserInfoController.show(data.userID);
            LevelManager.topLevel.addChild(UserInfoController.panel);
         });
      }
   }
}

