package com.robot.app.task.petstory.app.train
{
   import com.robot.app.fightLevel.FightPetBagController;
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.CommandID;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetBookXMLInfo;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.utils.Direction;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import gs.TweenLite;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   public class TrainControl
   {
      private static var _map:BaseMapProcess;
      private static var _monIndex:uint;
      private static var _monId:uint;
      private static var _pet:MovieClip;

      public function TrainControl()
      {
         super();
      }

      public static function init(param1:BaseMapProcess) : void
      {
         _map = param1;
         if(MapManager.currentMap)
         {
            TrainData.roomId = MapManager.currentMap.id;
         }
         ToolBarController.panel.hide();
         LevelManager.iconLevel.visible = false;
         ToolBarController.showOrHideAllUser(false);
         if(_map.topLevel["level_con"] && _map.topLevel["level_con"]["level_mc"])
         {
            _map.topLevel["level_con"]["level_mc"].visible = false;
         }
         ToolTipManager.add(_map.conLevel["btn_1"],"精灵背包");
         ToolTipManager.add(_map.conLevel["btn_2"],"精灵仓库");
         ToolTipManager.add(_map.conLevel["leaveBtn"],"返回精灵学院");
         _map.conLevel["btn_1"].addEventListener(MouseEvent.CLICK,onMonsterHandler);
         _map.conLevel["btn_2"].addEventListener(MouseEvent.CLICK,onPetStorage);
         _map.conLevel["leaveBtn"].addEventListener(MouseEvent.CLICK,onLeaveHandler);

         cureBag();
         selectRoomMon();
         showRoomSign();
         if(TrainData.times == 0)
         {
            startGame();
         }
         else
         {
            createMon();
         }
      }

      public static function refreshTrainingTarget() : void
      {
         if(!_map)
         {
            return;
         }
         selectRoomMon();
         showRoomSign();
         if(TrainData.times == 0)
         {
            TrainData.times = 1;
         }
         createMon();
      }

      // 房门名牌是该房的学习力项目；经验训练借用房间时不显示，避免误导
      private static function showRoomSign() : void
      {
         var sign:MovieClip = _map.conLevel["adMC"] as MovieClip;
         if(sign)
         {
            sign.gotoAndStop(TrainData.ADMCFrame);
            sign.visible = TrainData.mode != 1;
         }
      }

      private static function getPetDisplayName(petId:uint) : String
      {
         var name:String = PetBookXMLInfo.getName(petId);
         if(!name || name == "")
         {
            name = PetXMLInfo.getName(petId);
         }
         return name && name != "" ? name : ("精灵#" + petId);
      }

      private static function onMonsterHandler(param1:MouseEvent) : void
      {
         FightPetBagController.show();
      }

      private static function onPetStorage(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("PetStorage"),"正在打开精灵仓库....");
      }

      private static function onLeaveHandler(param1:MouseEvent) : void
      {
         MapManager.changeMap(485);
      }

      private static function startGame() : void
      {
         selectRoomMon();
         ++TrainData.times;
         showLevel(TrainData.times);
      }

      private static function showLevel(param1:uint) : void
      {
         var frameIdx:uint = uint(((param1 > 0 ? param1 - 1 : 0) % 30) + 1);
         if(_map && _map.topLevel["level_con"] && _map.topLevel["level_con"]["level_mc"])
         {
            _map.topLevel["level_con"]["level_mc"].visible = true;
            _map.topLevel["level_con"]["level_mc"].gotoAndStop(frameIdx);
            AnimateManager.playMcAnimate(_map.topLevel["level_con"]["level_effect"],0,"",function():void
            {
               if(_map && _map.topLevel["level_con"] && _map.topLevel["level_con"]["level_mc"])
               {
                  _map.topLevel["level_con"]["level_mc"].visible = false;
               }
               createMon();
            });
         }
         else
         {
            createMon();
         }
      }

      private static function clearOldPet() : void
      {
         if(_pet != null)
         {
            TweenLite.killTweensOf(_pet);
            ToolTipManager.remove(_pet);
            _pet.removeEventListener(MouseEvent.CLICK,onClickFight);
            DisplayUtil.removeForParent(_pet);
            _pet = null;
         }
      }

      private static function createMon() : void
      {
         if(!_map)
         {
            return;
         }
         clearOldPet();
         if(TrainData.mode == 1)
         {
            _monIndex = 0;
            _monId = TrainData.getExpPetId(TrainData.expType,TrainData.expTier);
         }
         else
         {
            var list:Array = TrainData.monList;
            if(!list || list.length == 0)
            {
               selectRoomMon();
               list = TrainData.monList;
            }
            _monIndex = uint(Math.random() * list.length);
            _monId = uint(list[_monIndex]);
         }
         var reqId:uint = _monId;
         ResourceManager.getResource(ClientConfig.getPetSwfPath(reqId),function(param1:DisplayObject):void
         {
            if(!_map || reqId != _monId)
            {
               return;
            }
            clearOldPet();
            _pet = param1 as MovieClip;
            var tipText:String = getPetDisplayName(reqId);
            if(TrainData.mode == 1)
            {
               tipText += " Lv." + TrainData.TIER_LEVELS[TrainData.expTier];
            }
            ToolTipManager.add(_pet,tipText);
            _map.depthLevel.addChild(_pet);
            _pet.x = 480;
            _pet.y = 65;
            _pet.scaleX = _pet.scaleY = 1.5;
            _pet.buttonMode = true;
            _pet.addEventListener(MouseEvent.CLICK,onClickFight);
            petWalkToPoint(new Point(480,170));
         },"pet");
      }

      private static function petWalkToPoint(param1:Point) : void
      {
         var p:Point = param1;
         if(_map && _map.conLevel["petDoor"])
         {
            AnimateManager.playMcAnimate(_map.conLevel["petDoor"],1,"",function():void
            {
               if(_map && _map.conLevel["petDoor"])
               {
                  DisplayUtil.stopAllMovieClip(_map.conLevel["petDoor"]);
               }
            });
         }
         if(!_pet)
         {
            return;
         }
         var dir:String = Direction.getStr(new Point(_pet.x,_pet.y),p);
         _pet.gotoAndStop(dir);
         TweenLite.to(_pet,0.65,{
            "x":p.x,
            "y":p.y,
            "onComplete":onWalkCmp
         });
      }

      private static function onWalkCmp() : void
      {
         if(_pet)
         {
            DisplayUtil.stopAllMovieClip(_pet);
            _pet.buttonMode = true;
            _pet.addEventListener(MouseEvent.CLICK,onClickFight);
         }
      }

      private static function onClickFight(param1:MouseEvent) : void
      {
         triggerFight();
      }

      private static function triggerFight() : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onAlarmClickHandler);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onAlarmClickHandler);
         var petName:String = getPetDisplayName(_monId);
         if(TrainData.mode == 1)
         {
            var expParam:uint = TrainData.getExpParam2(TrainData.expType,TrainData.expTier);
            FightInviteManager.fightWithBoss(petName,expParam);
         }
         else
         {
            FightInviteManager.fightWithBoss(petName,_monIndex);
         }
      }

      private static function onAlarmClickHandler(param1:PetFightEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onAlarmClickHandler);
         GoOnGame();
      }

      // 进入训练室（含每场战斗后回到房间）时免费补满背包精灵的体力与PP
      private static function cureBag() : void
      {
         SocketConnection.addCmdListener(CommandID.PET_CURE,onCureDone);
         SocketConnection.send(CommandID.PET_CURE);
      }

      private static function onCureDone(e:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.PET_CURE,onCureDone);
         PetManager.upDate();
      }

      private static function selectRoomMon() : void
      {
         switch(TrainData.roomId)
         {
            case 488:
               TrainData.monList = [10,13,33,126,164];
               TrainData.ADMCFrame = 1;
               break;
            case 489:
               TrainData.monList = [228,330,228,330,228];
               TrainData.ADMCFrame = 2;
               break;
            case 490:
               TrainData.monList = [19,62,108,158,184];
               TrainData.ADMCFrame = 3;
               break;
            case 491:
               TrainData.monList = [232,328,232,328,232];
               TrainData.ADMCFrame = 4;
               break;
            case 492:
               TrainData.monList = [22,25,43,153,319];
               TrainData.ADMCFrame = 5;
               break;
            case 493:
               TrainData.monList = [56,105,456,482,111];
               TrainData.ADMCFrame = 6;
               break;
            case 470:
               TrainData.monList = [12,15,29,55,73];
               TrainData.ADMCFrame = 7;
               break;
            case 471:
               TrainData.monList = [229,331,229,331,229];
               TrainData.ADMCFrame = 8;
               break;
            case 472:
               TrainData.monList = [21,37,64,79,130];
               TrainData.ADMCFrame = 9;
               break;
            case 473:
               TrainData.monList = [234,32,234,32,234];
               TrainData.ADMCFrame = 10;
               break;
            case 474:
               TrainData.monList = [24,45,155,321,321];
               TrainData.ADMCFrame = 11;
               break;
            case 475:
               TrainData.monList = [58,107,458,58,458];
               TrainData.ADMCFrame = 12;
               break;
            default:
               TrainData.monList = [10,13,33,126,164];
               TrainData.ADMCFrame = 1;
         }
      }

      private static function GoOnGame() : void
      {
         ++TrainData.times;
         showLevel(TrainData.times);
      }

      public static function destory() : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onAlarmClickHandler);
         ToolBarController.panel.show();
         LevelManager.iconLevel.visible = true;
         ToolBarController.showOrHideAllUser(ToolBarController.panel.panelIsShow);
         if(_map)
         {
            ToolTipManager.remove(_map.conLevel["btn_1"]);
            ToolTipManager.remove(_map.conLevel["btn_2"]);
            ToolTipManager.remove(_map.conLevel["leaveBtn"]);
            _map.conLevel["btn_1"].removeEventListener(MouseEvent.CLICK,onMonsterHandler);
            _map.conLevel["btn_2"].removeEventListener(MouseEvent.CLICK,onPetStorage);
            _map.conLevel["leaveBtn"].removeEventListener(MouseEvent.CLICK,onLeaveHandler);
         }
         clearOldPet();
         _map = null;
      }
   }
}
