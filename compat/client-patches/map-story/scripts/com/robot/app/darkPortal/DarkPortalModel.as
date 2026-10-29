package com.robot.app.darkPortal
{
   import com.robot.app.fightLevel.FightPetBagController;
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.info.fightInfo.PetFightModel;
   import com.robot.core.manager.MapManager;
   import com.robot.core.mode.AppModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alert;
   import flash.display.SimpleButton;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.utils.ByteArray;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;
   
   public class DarkPortalModel
   {
      
      private static var _curBossId:uint;
      
      private static var _curDoor:uint;
      
      private static var _doorHanlder:Function;
      
      private static var _fiSucHandler:Function;
      
      private static var _panel:AppModel;
      
      private static var _curFun:Function;
      
      private static var _petBtn:SimpleButton;
      
      public static var doorIndex:uint = 0;
      
      private static const DARK_HINTS:Object = {
         "0":"【属性护盾】魔牙鲨只受草系、电系技能的伤害，也不会陷入异常状态。",
         "6":"【异常破绽】贝鲁基德只有冻伤时才能被击倒，否则满血复活。冻伤技能必定命中它，冻伤持续两回合，之后一回合不会再冻伤；不会陷入其他异常。",
         "12":"【疾风之躯】巴弗洛只会被必中技能命中，也不会陷入异常状态。",
         "13":"【多层护甲】奇拉塔顿有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。",
         "18":"【坚甲】西萨拉斯只有在防御或特防被降低时才会受到伤害，也不会陷入异常状态。",
         "19":"【强化压制】克林卡修出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。",
         "24":"【属性护盾】卡库只受飞行系、超能系技能的伤害，也不会陷入异常状态。",
         "25":"【异常破绽】赫德卡只有麻痹时才能被击倒，否则满血复活。麻痹技能必定命中它，麻痹持续两回合，之后一回合不会再麻痹；不会陷入其他异常。",
         "26":"【多层护甲】伊兰罗尼有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。",
         "30":"【属性护盾】斯加尔卡只受地面系技能的伤害，也不会陷入异常状态。",
         "31":"【强化压制】艾尔伊洛出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。",
         "32":"【顺序破防】布林克克只受草系、电系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。",
         "36":"【异常破绽】魔花使者只有烧伤时才能被击倒，否则满血复活。烧伤技能必定命中它，烧伤持续两回合，之后一回合不会再烧伤；不会陷入其他异常。",
         "37":"【属性护盾】莫尔加斯只受草系、水系技能的伤害，也不会陷入异常状态。",
         "38":"【疾风之躯】萨诺拉斯只会被必中技能命中，也不会陷入异常状态。",
         "42":"【异常破绽】帕多尼只有睡眠时才能被击倒，否则满血复活。睡眠技能必定命中它，睡眠持续两回合，之后一回合不会再睡眠；不会陷入其他异常。",
         "43":"【强化压制】加洛德出场能力提升，每受一次攻击，攻击和特攻再升1级；不会被降能力或秒杀，只能用消强技能清掉强化，也不会陷入异常。",
         "44":"【属性护盾】萨多拉尼只受战斗系、龙系技能的伤害，也不会陷入异常状态。",
         "48":"【坚甲】迪普利德只有在防御或特防被降低时才会受到伤害，也不会陷入异常状态。",
         "49":"【疾风之躯】拜洛亚斯只会被必中技能命中，也不会陷入异常状态。",
         "50":"【异常破绽】阿克诺亚有两条命，都只有烧伤时才能被击倒，否则满血复活。烧伤技能必定命中它，烧伤持续两回合，之后一回合不会再烧伤；不会陷入其他异常。",
         "54":"【多层护甲】鳞甲魔鱼有4层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。",
         "55":"【异常破绽】艾斯德克只有害怕时才能被击倒，否则满血复活。害怕技能必定命中它，害怕持续两回合，之后一回合不会再害怕；不会陷入其他异常。",
         "56":"【坚甲】狂狮迪卡只有在防御和特防都被降低时才会受到伤害，也不会陷入异常状态。",
         "60":"【属性研习】魔牙鲨只受草系、电系技能的伤害，也不会陷入异常状态。",
         "61":"【连击研习】奇拉塔顿有3层护甲：每段攻击打掉1层，打光前不受伤害，每回合恢复1层；连续攻击一次能打掉多层。不会陷入异常。",
         "62":"【必中研习】拜洛亚斯只会被必中技能命中，也不会陷入异常状态。",
         "66":"【顺序破防】布林克克只受草系、电系技能按顺序轮流命中的伤害，打错属性不掉血；它不会陷入异常状态。"
      };
      
      public function DarkPortalModel()
      {
         super();
      }
      
      public static function get curDoor() : uint
      {
         return _curDoor;
      }
      
      public static function set curDoor(param1:uint) : void
      {
         _curDoor = param1;
      }
      
      public static function get curBossId() : uint
      {
         return _curBossId;
      }
      
      public static function set curBossId(param1:uint) : void
      {
         _curBossId = param1;
      }
      
      public static function enterDarkProtal(param1:uint, param2:Function = null, param3:uint = 0) : void
      {
         doorIndex = param3;
         _curDoor = param1;
         _doorHanlder = param2;
         SocketConnection.addCmdListener(CommandID.OPEN_DARKPORTAL,onSucHandler);
         SocketConnection.send(CommandID.OPEN_DARKPORTAL,param1);
      }
      
      private static function onSucHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.OPEN_DARKPORTAL,onSucHandler);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         _curBossId = _loc3_;
         if(_doorHanlder != null)
         {
            _doorHanlder();
            _doorHanlder = null;
         }
         enterMap();
      }
      
      public static function enterMap() : void
      {
         var _loc1_:* = 502;
         var _loc2_:uint = uint(_curDoor + 1);
         if(_loc2_ > 6)
         {
            if(_loc2_ % 6 == 0)
            {
               _loc1_ += _loc2_ / 6;
            }
            else
            {
               _loc1_ += uint(_loc2_ / 6) + 1;
            }
         }
         else
         {
            _loc1_++;
         }
         if(_loc1_ >= 512)
         {
            _loc1_ += 5110 - 512;
         }
         MapManager.changeLocalMap(_loc1_);
      }
      
      public static function fightDarkProtal(param1:Function = null) : void
      {
         var func:Function = param1;
         var hint:String = DARK_HINTS[String(_curDoor)];
         if(hint == null)
         {
            startFight(func);
            return;
         }
         Alert.show(hint + "\r确定挑战吗？",function():void
         {
            startFight(func);
         });
      }
      
      private static function startFight(param1:Function) : void
      {
         _fiSucHandler = param1;
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         SocketConnection.addCmdListener(CommandID.FIGHT_DARKPORTAL,onFiHandler);
         SocketConnection.send(CommandID.FIGHT_DARKPORTAL);
      }
      
      private static function onFiHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.FIGHT_DARKPORTAL,onFiHandler);
         if(_fiSucHandler != null)
         {
            _fiSucHandler();
            _fiSucHandler = null;
         }
      }
      
      public static function leaveDarkProtal(param1:Function = null) : void
      {
         var func:Function = param1;
         SocketConnection.addCmdListener(CommandID.LEAVE_DARKPORTAL,function(param1:SocketEvent):void
         {
            SocketConnection.removeCmdListener(CommandID.LEAVE_DARKPORTAL,arguments.callee);
            if(func != null)
            {
               func();
            }
            MapManager.changeMap(110);
         });
         SocketConnection.send(CommandID.LEAVE_DARKPORTAL);
      }
      
      public static function showDoor(param1:uint, param2:Function = null) : void
      {
         destroyPanel();
         _curFun = param2;
         _panel = new AppModel(ClientConfig.getAppModule("DarkDoorChoicePanel_" + param1),"正在打开暗黑之门");
         _panel.setup();
         _panel.sharedEvents.addEventListener(Event.CLOSE,onCloseHandler);
         _panel.show();
      }
      
      private static function onCloseHandler(param1:Event) : void
      {
         if(_curFun != null)
         {
            _curFun();
            _curFun = null;
         }
      }
      
      public static function destroyPanel() : void
      {
         if(Boolean(_panel))
         {
            _panel.sharedEvents.removeEventListener(Event.CLOSE,onCloseHandler);
            _panel.destroy();
            _panel = null;
         }
      }
      
      public static function destroy() : void
      {
         destroyPanel();
         SocketConnection.removeCmdListener(CommandID.OPEN_DARKPORTAL,onSucHandler);
         SocketConnection.removeCmdListener(CommandID.FIGHT_DARKPORTAL,onFiHandler);
         onCloseHandler(null);
      }
      
      public static function showPetEnrichBlood() : void
      {
         setTimeout(function():void
         {
            _petBtn = MapManager.currentMap.controlLevel["petMc"];
            _petBtn.addEventListener(MouseEvent.CLICK,onClickHandler);
            ToolTipManager.add(_petBtn,"精灵背包");
         },200);
      }
      
      private static function onClickHandler(param1:MouseEvent) : void
      {
         FightPetBagController.show();
      }
      
      public static function des() : void
      {
         if(Boolean(_petBtn))
         {
            ToolTipManager.remove(_petBtn);
            _petBtn.addEventListener(MouseEvent.CLICK,onClickHandler);
            _petBtn = null;
         }
         FightPetBagController.destroy();
      }
   }
}

