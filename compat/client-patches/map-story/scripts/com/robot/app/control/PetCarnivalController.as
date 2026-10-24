package com.robot.app.control
{
   import com.robot.app.control.petCarnival.*;
   import com.robot.app.fight.*;
   import com.robot.app.fightNote.*;
   import com.robot.app.panel.*;
   import com.robot.core.*;
   import com.robot.core.config.*;
   import com.robot.core.config.xml.*;
   import com.robot.core.event.*;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.net.*;
   import flash.events.*;
   import flash.utils.*;
   import org.taomee.debug.*;
   import org.taomee.events.SocketEvent;
   
   public class PetCarnivalController extends EventDispatcher
   {
      
      private static var _instance:PetCarnivalController;
      
      public static var HURDLES:String = "hurdles";
      
      public static var TUG:String = "tug";
      
      public static var JUMP:String = "jump";
      
      public static var ROBLOCALITY:String = "RobLocalityGame";
      
      public static var HITBALL:String = "HitBallGame";
      
      public static var FERRULE:String = "FerruleGame";
      
      private var _game:String;
      
      private var _attribute:Array;
      
      private var tugGame:AppModel;
      
      private var jumpGame:AppModel;
      
      private var rulesPanel:AppModel;
      
      private var startPanel:AppModel;
      
      private var pet:CarnivalPetInfo;
      
      private var tugInfo_0:CarnivalTugInfo;
      
      private var tugInfo_1:CarnivalTugInfo;
      
      public function PetCarnivalController()
      {
         super();
      }
      
      public static function getInstance() : PetCarnivalController
      {
         if(!_instance)
         {
            _instance = new PetCarnivalController();
         }
         return _instance;
      }
      
      public function get gameType() : String
      {
         return this._game;
      }
      
      public function get attribute() : Array
      {
         return this._attribute;
      }
      
      public function showRules(param1:String, param2:Array) : void
      {
         this._game = param1;
         this._attribute = param2;
         if(!this.rulesPanel)
         {
            this.rulesPanel = new AppModel(ClientConfig.getAppModule("PetCarnivalRulesPanel"),"正在加载游戏面板....");
            this.rulesPanel.setup();
         }
         this.rulesPanel.show();
      }
      
      public function showStart() : void
      {
         if(!this.startPanel)
         {
            this.startPanel = new AppModel(ClientConfig.getAppModule("PetCarnivalStartPanel"),"正在加载游戏面板....");
            this.startPanel.setup();
         }
         this.startPanel.show();
      }
      
      private function getState(param1:int) : int
      {
         var _loc2_:Date = new Date(param1 * 1000);
         var _loc3_:Date = SystemTimerManager.sysDate;
         return int(Math.floor(1 + Math.sin(Math.PI * 0.5 * (_loc2_.dayUTC - _loc3_.dayUTC))));
      }
      
      private function getValue(param1:int, param2:int, param3:int, param4:int) : int
      {
         var _loc5_:int = Math.floor((param1 - param2) / param3) + param4 - 1;
         if(_loc5_ < 1)
         {
            _loc5_ = 1;
         }
         if(_loc5_ > 5)
         {
            _loc5_ = 5;
         }
         return _loc5_;
      }
      
      public function getPet(param1:int = 0) : CarnivalPetInfo
      {
         if(param1 == 0)
         {
            return this.pet;
         }
         if(!this.pet)
         {
            this.pet = new CarnivalPetInfo();
         }
         var _loc2_:PetInfo = PetManager.getPetInfo(param1);
         var _loc3_:int = int(this.getState(param1));
         var _loc4_:XML = PetXMLInfo.getPetXML(_loc2_.id);
         this.pet.id = _loc2_.id;
         this.pet.state = _loc3_;
         this.pet.liLiang = this.getValue(_loc4_.@Atk,36,14,_loc3_);
         this.pet.naiJiu = this.getValue(_loc4_.@Def,40,10,_loc3_);
         this.pet.jiZhong = this.getValue(_loc4_.@SpDef,40,10,_loc3_);
         this.pet.jiQiao = this.getValue(_loc4_.@SpAtk,36,14,_loc3_);
         this.pet.sudu = this.getValue(_loc4_.@Spd,48,11,_loc3_);
         return this.pet;
      }
      
      public function petStorageClose() : void
      {
         _instance.dispatchEvent(new Event("PetStorageClose"));
      }
      
      public function start() : void
      {
         switch(this._game)
         {
            case HURDLES:
               this.startHurdles();
               break;
            case TUG:
               this.startTug();
               break;
            case JUMP:
               this.startJump();
               break;
            case ROBLOCALITY:
               this.startRobLocality();
               break;
            case HITBALL:
               this.startHitBall();
               break;
            case FERRULE:
               this.startFerrule();
         }
      }
      
      private function startJump() : void
      {
         FightManager.info = new FightTypeInfo();
         FightManager.info.type = 4;
         FightManager.info.bossRegion = 3;
         SocketConnection.addCmdListener(CommandID.JOIN_GAME,this.onBeginGame_5);
         SocketConnection.send(CommandID.JOIN_GAME,5);
      }
      
      private function startRobLocality() : void
      {
         FightManager.info = new FightTypeInfo();
         FightManager.info.type = 4;
         FightManager.info.bossRegion = 4;
         SocketConnection.addCmdListener(CommandID.JOIN_GAME,this.onBeginGame_4);
         SocketConnection.send(CommandID.JOIN_GAME,4);
      }
      
      private function startHitBall() : void
      {
         FightManager.info = new FightTypeInfo();
         FightManager.info.type = 4;
         SocketConnection.addCmdListener(CommandID.JOIN_GAME,this.onBeginGame_3);
         if(MapManager.currentMap.id == 40)
         {
            FightManager.info.bossRegion = 1;
            SocketConnection.send(CommandID.JOIN_GAME,1);
         }
         else
         {
            FightManager.info.bossRegion = 5;
            SocketConnection.send(CommandID.JOIN_GAME,5);
         }
      }
      
      private function startFerrule() : void
      {
         FightManager.info = new FightTypeInfo();
         FightManager.info.type = 4;
         FightManager.info.bossRegion = 6;
         SocketConnection.addCmdListener(CommandID.JOIN_GAME,this.onBeginGame_2);
         SocketConnection.send(CommandID.JOIN_GAME,6);
      }
      
      private function startHurdles() : void
      {
         FightManager.info = new FightTypeInfo();
         FightManager.info.type = 4;
         FightManager.info.bossRegion = 2;
         SocketConnection.addCmdListener(CommandID.JOIN_GAME,this.onBeginGame_1);
         SocketConnection.send(CommandID.JOIN_GAME,2);
      }
      
      private function onBeginGame_1(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onBeginGame_1);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         var _loc4_:CarnivalPetInfo = this.getPet();
         var _loc5_:Object = new Object();
         _loc5_.heroId = _loc4_.id;
         _loc5_.speed = _loc4_.sudu;
         _loc5_.fun = this.hurdReturnFunction;
         ModuleManager.showModule(ClientConfig.getAppModule("HurdlesPanel"),"正在打开跨栏面板....",_loc5_);
      }
      
      private function onBeginGame_2(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onBeginGame_2);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         ModuleManager.showModule(ClientConfig.getGameModule(FERRULE),"正在打开套圈游戏....",this.getPet());
         LevelManager.hideMapLevel();
         SoundManager.stopSound();
      }
      
      private function onBeginGame_3(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onBeginGame_3);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         ModuleManager.showModule(ClientConfig.getGameModule(HITBALL),"正在打开撞球游戏....",this.getPet());
         LevelManager.hideMapLevel();
         SoundManager.stopSound();
      }
      
      private function onBeginGame_4(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onBeginGame_4);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         ModuleManager.showModule(ClientConfig.getGameModule(ROBLOCALITY),"正在打开抢位置游戏....",this.getPet());
         LevelManager.hideMapLevel();
         SoundManager.stopSound();
      }
      
      private function onBeginGame_5(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onBeginGame_5);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         if(this.jumpGame == null)
         {
            this.jumpGame = new AppModel(ClientConfig.getGameModule("JumpSportGame"),"正在打开跳高游戏....");
            this.jumpGame.setup();
         }
         this.jumpGame.show();
         LevelManager.hideMapLevel();
      }
      
      private function hurdReturnFunction(param1:uint) : void
      {
         if(param1 == 1)
         {
            this.dispatchEvent(new CarnivalEvent(CarnivalEvent.HURDLES,0,true));
         }
         else
         {
            this.dispatchEvent(new CarnivalEvent(CarnivalEvent.HURDLES,0,false));
         }
      }
      
      private function startTug() : void
      {
         FightMatchingPanel.show(this.onWaitCloseClick);
         FightManager.info = new FightTypeInfo();
         FightManager.info.type = 4;
         FightManager.info.bossRegion = 1;
         SocketConnection.addCmdListener(CommandID.CARNIVAL_TUGSECCUSS,this.onGameStart);
         SocketConnection.send(CommandID.JOIN_GAME,1);
      }
      
      private function onWaitCloseClick() : void
      {
         SocketConnection.removeCmdListener(CommandID.CARNIVAL_TUGSECCUSS,this.onGameStart);
         SocketConnection.send(CommandID.LEAVE_GAME,0);
      }
      
      private function onGameStart(param1:SocketEvent) : void
      {
         var _loc2_:int = 0;
         var _loc3_:Array = null;
         var _loc4_:Array = null;
         var _loc5_:int = 0;
         FightMatchingPanel.hide();
         SocketConnection.removeCmdListener(CommandID.CARNIVAL_TUGSECCUSS,this.onGameStart);
         var _loc6_:ByteArray = param1.data as ByteArray;
         var _loc7_:int = 0;
         while(_loc7_ < 2)
         {
            _loc2_ = int(_loc6_.readUnsignedInt());
            _loc3_ = [];
            _loc4_ = [];
            _loc5_ = 0;
            while(_loc5_ < 6)
            {
               _loc3_.push(_loc6_.readUnsignedInt());
               _loc4_.push(_loc6_.readUnsignedInt());
               _loc5_++;
            }
            if(_loc2_ == MainManager.actorID)
            {
               this.setTugParam_0(_loc2_,_loc3_,_loc4_);
            }
            else
            {
               this.setTugParam_1(_loc2_,_loc3_,_loc4_);
            }
            _loc7_++;
         }
         this.startTugGame();
      }
      
      private function startTugGame() : void
      {
         if(!this.tugGame)
         {
            this.tugGame = new AppModel(ClientConfig.getGameModule("TugGame"),"正在打开加入拔河游戏....");
            this.tugGame.setup();
         }
         this.tugGame.show();
         MapManager.destroy();
      }
      
      private function setTugParam_0(param1:int, param2:Array, param3:Array) : void
      {
         this.tugInfo_0 = new CarnivalTugInfo();
         this.tugInfo_0.userID = param1;
         this.tugInfo_0.pets = param2;
         var _loc4_:int = 0;
         while(_loc4_ < 6)
         {
            DebugTrace.show(PetXMLInfo.getPetXML(param2[_loc4_]).@Atk + "========" + (this.getState(param3[_loc4_]) - 1) * 14);
            this.tugInfo_0.liLiang = this.tugInfo_0.liLiang + int(PetXMLInfo.getPetXML(param2[_loc4_]).@Atk) + (this.getState(param3[_loc4_]) - 1) * 14;
            _loc4_++;
         }
      }
      
      public function get TugParam_0() : CarnivalTugInfo
      {
         return this.tugInfo_0;
      }
      
      private function setTugParam_1(param1:int, param2:Array, param3:Array) : void
      {
         this.tugInfo_1 = new CarnivalTugInfo();
         this.tugInfo_1.userID = param1;
         this.tugInfo_1.pets = param2;
         var _loc4_:int = 0;
         while(_loc4_ < 6)
         {
            DebugTrace.show(PetXMLInfo.getPetXML(param2[_loc4_]).@Atk + "========" + (this.getState(param3[_loc4_]) - 1) * 14);
            this.tugInfo_1.liLiang = this.tugInfo_1.liLiang + int(PetXMLInfo.getPetXML(param2[_loc4_]).@Atk) + (this.getState(param3[_loc4_]) - 1) * 14;
            _loc4_++;
         }
      }
      
      public function get TugParam_1() : CarnivalTugInfo
      {
         return this.tugInfo_1;
      }
   }
}

