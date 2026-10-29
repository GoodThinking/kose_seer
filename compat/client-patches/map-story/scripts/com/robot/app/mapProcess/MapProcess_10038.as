package com.robot.app.mapProcess
{
   import com.robot.app.fightLevel.FightPetBagController;
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.MapEvent;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.info.fightInfo.attack.FightOverInfo;
   import com.robot.core.info.fightInfo.PetFightModel;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.NonoManager;
   import com.robot.core.manager.map.MapTransEffect;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Shape;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.utils.ByteArray;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_10038 extends BaseMapProcess
   {
      private static const START_KING_TOWER:uint = 2483;
      private static const LEAVE_KING_TOWER:uint = 2484;
      private static const POINTS:Array = [[2],[1,3],[1,2,3],[0,1,3,4],[0,1,2,3,4]];
      private static const TRAINERS:Array = ["冰系精灵训练师","机械系精灵训练师","飞行系精灵训练师","地面系精灵训练师","超能系精灵训练师","水系精灵训练师","火系精灵训练师","草系精灵训练师","战斗系精灵训练师","SPT先锋队基层部队队长","光系精灵训练师","火系精灵训练师","电系精灵训练师","地面系精灵训练师","超能系精灵训练师","暗影系精灵训练师","普通系精灵训练师","双属性精灵训练师","融合精灵训练师","光明卡修","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师","综合复习训练师"];
      private static var _stage:int;
      private static var _monID:Array;
      private static var _oldStage:int;
      private static var _oldMonID:Array;
      private static var _type:int;
      private static var _isFight:Boolean = false;
      private static var _entryReady:Boolean = false;

      private var _containers:Array;
      private var _models:Array = [];
      private var _disposed:Boolean = false;
      private var _generation:uint = 0;
      private var _introTimeout:uint = 0;
      private var _requestingStart:Boolean = false;
      private var _requestingLeave:Boolean = false;
      private var _canGoNext:Boolean = false;
      private var _transition:MapTransEffect;
      private var _npcHitArea:Shape;

      public function MapProcess_10038()
      {
         super();
      }

      public static function setEntry(mode:int, stage:int, monsters:Array) : Boolean
      {
         if(mode < 0 || mode > 1 || stage < 0 || stage >= 30 || !monsters || monsters.length < 1 || monsters.length > 5)
         {
            return false;
         }
         for each(var monster:uint in monsters)
         {
            if(monster == 0)
            {
               return false;
            }
         }
         _type = mode;
         _stage = stage;
         _monID = monsters.concat();
         _oldStage = stage;
         _oldMonID = monsters.concat();
         _isFight = false;
         _entryReady = true;
         return true;
      }

      override protected function init() : void
      {
         if(!_entryReady)
         {
            Alarm.show("请先从王者之塔入口选择挑战模式和楼层。",function():void
            {
               MapManager.changeMap(465);
            });
            return;
         }
         if(_type == 1)
         {
            MainManager.actorModel.hideNono();
         }
         ToolBarController.panel.hide();
         LevelManager.iconLevel.visible = false;
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         PetFightModel.status = PetFightModel.FIGHT_WITH_BOSS;
         ToolTipManager.add(conLevel["bag_btn"],"精灵背包");
         ToolTipManager.add(conLevel["leave_btn"],"返回王者之塔入口，保留已通关楼层");
         conLevel["bag_btn"].addEventListener(MouseEvent.CLICK,this.onBagClick);
         conLevel["leave_btn"].addEventListener(MouseEvent.CLICK,this.onLeaveClick);
         this._containers = [depthLevel["con_0"],depthLevel["con_1"],depthLevel["con_2"],depthLevel["con_3"],depthLevel["con_4"]];
         this.initMap();
      }

      private function isCurrent(generation:uint) : Boolean
      {
         return !this._disposed && this._generation == generation;
      }

      private function setTargetsEnabled(enabled:Boolean) : void
      {
         conLevel["npc"].buttonMode = enabled;
         conLevel["npc"].mouseEnabled = enabled;
         conLevel["npc"].mouseChildren = false;
         for each(var container:MovieClip in this._containers)
         {
            container.buttonMode = enabled;
            container.mouseEnabled = enabled;
            container.mouseChildren = false;
         }
      }

      private function updateNpcHitArea() : void
      {
         if(this._npcHitArea && this._npcHitArea.parent)
         {
            this._npcHitArea.parent.removeChild(this._npcHitArea);
         }
         var bounds:Rectangle = conLevel["npc"].getBounds(conLevel["npc"]);
         if(!this._npcHitArea)
         {
            this._npcHitArea = new Shape();
         }
         this._npcHitArea.graphics.clear();
         this._npcHitArea.graphics.beginFill(0,0);
         this._npcHitArea.graphics.drawRect(bounds.x,bounds.y,bounds.width,bounds.height);
         this._npcHitArea.graphics.endFill();
         conLevel["npc"].addChild(this._npcHitArea);
      }

      private function clearMonsterModels() : void
      {
         for each(var model:DisplayObject in this._models)
         {
            if(model.parent)
            {
               model.parent.removeChild(model);
            }
         }
         this._models.length = 0;
         if(this._containers)
         {
            for each(var container:MovieClip in this._containers)
            {
               ToolTipManager.remove(container);
               container.removeEventListener(MouseEvent.CLICK,this.onPetClick);
            }
         }
         conLevel["npc"].removeEventListener(MouseEvent.CLICK,this.onPetClick);
      }

      private function initMap() : void
      {
         var generation:uint = ++this._generation;
         clearTimeout(this._introTimeout);
         this._introTimeout = 0;
         this.clearMonsterModels();
         this._canGoNext = false;
         this.setTargetsEnabled(false);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
         typeLevel["mc"].y = 216;
         MapManager.currentMap.makeMapArray();
         for(var index:int = 0; index < 6; index++)
         {
            depthLevel["light_" + index].visible = false;
         }
         conLevel["door"].visible = false;
         conLevel["light"].gotoAndStop(1);
         conLevel["shin"].gotoAndStop(_type + 1);
         ToolTipManager.remove(conLevel["npc"]);
         conLevel["npc"].gotoAndStop(_isFight ? _stage + 1 : _stage + 2);
         this.updateNpcHitArea();
         if(_isFight)
         {
            conLevel["num"].gotoAndStop(_stage + 1);
            ToolTipManager.add(conLevel["npc"],TRAINERS[_stage - 1]);
            return;
         }
         conLevel["leave_btn"].enabled = false;
         conLevel["leave_btn"].mouseEnabled = false;
         conLevel["num"].gotoAndStop(_stage + 2);
         ToolTipManager.add(conLevel["npc"],TRAINERS[_stage]);
         conLevel[_type == 0 ? "level" : "level_hero"].gotoAndStop(_stage + 2);
         this._introTimeout = setTimeout(function():void
         {
            _introTimeout = 0;
            if(!isCurrent(generation))
            {
               return;
            }
            conLevel["level"].gotoAndStop(1);
            conLevel["level_hero"].gotoAndStop(1);
            conLevel["panel"].addEventListener(Event.ENTER_FRAME,onPanelEnter);
            conLevel["panel"].gotoAndPlay(2);
            AnimateManager.playMcAnimate(conLevel["capsule"],_monID.length + 1,"mc_" + _monID.length,function():void
            {
               if(!isCurrent(generation))
               {
                  return;
               }
               conLevel["capsule"].gotoAndStop(1);
               loadMonster(0,generation);
            });
         },2000);
      }

      private function onPanelEnter(event:Event) : void
      {
         if(conLevel["panel"].currentFrame == 15)
         {
            conLevel["panel"]["txt"].gotoAndStop(_stage + 2);
         }
         if(conLevel["panel"].currentFrame == 106)
         {
            conLevel["panel"]["txt"].gotoAndStop(1);
         }
         if(conLevel["panel"].currentFrame == conLevel["panel"].totalFrames)
         {
            conLevel["panel"].removeEventListener(Event.ENTER_FRAME,this.onPanelEnter);
            conLevel["panel"].gotoAndStop(1);
            conLevel["leave_btn"].enabled = true;
            conLevel["leave_btn"].mouseEnabled = true;
         }
      }

      private function loadMonster(index:int, generation:uint) : void
      {
         var monsterId:int = _monID[index];
         var position:int = POINTS[_monID.length - 1][index];
         ResourceManager.getResource(ClientConfig.getPetSwfPath(monsterId),function(display:DisplayObject):void
         {
            if(!isCurrent(generation))
            {
               return;
            }
            var container:MovieClip = _containers[position] as MovieClip;
            ToolTipManager.add(container,PetXMLInfo.getName(monsterId));
            container.addChild(display);
            _models.push(display);
            container.addEventListener(MouseEvent.CLICK,onPetClick);
            if(index + 1 < _monID.length)
            {
               loadMonster(index + 1,generation);
            }
            else
            {
               conLevel["npc"].addEventListener(MouseEvent.CLICK,onPetClick);
               setTargetsEnabled(true);
            }
         },"pet");
      }

      private function onPetClick(event:MouseEvent) : void
      {
         event.stopPropagation();
         if(this._requestingStart || this._requestingLeave || this._canGoNext || _isFight || this._transition)
         {
            return;
         }
         this._requestingStart = true;
         SocketConnection.addCmdListener(START_KING_TOWER,this.onBattleStarted);
         SocketConnection.send(START_KING_TOWER);
      }

      private function onBattleStarted(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(START_KING_TOWER,this.onBattleStarted);
         this._requestingStart = false;
         var data:ByteArray = event.data as ByteArray;
         var stage:uint = data.readUnsignedInt();
         var count:uint = data.readUnsignedInt();
         if(stage == uint.MAX_VALUE)
         {
            return;
         }
         if(stage < 1 || stage > 30 || count < 1 || count > 5 || data.bytesAvailable < count * 4)
         {
            Alarm.show("楼层消息不完整，请返回入口核对已保存进度。");
            return;
         }
         _oldStage = _stage;
         _oldMonID = _monID.concat();
         _stage = stage;
         _monID = [];
         for(var index:int = 0; index < count; index++)
         {
            _monID.push(data.readUnsignedInt());
         }
         _isFight = true;
         this.setTargetsEnabled(false);
      }

      private function onFightComplete(event:PetFightEvent) : void
      {
         _isFight = false;
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
         MainManager.actorModel.x = 484;
         MainManager.actorModel.y = 292;
         if(_type == 0)
         {
            MainManager.actorModel.showNono(NonoManager.info,MainManager.actorInfo.actionType);
         }
         var result:FightOverInfo = event.dataObj as FightOverInfo;
         var generation:uint = this._generation;
         if(result.winnerID == MainManager.actorID)
         {
            if(_stage == 30)
            {
               AnimateManager.playMcAnimate(topLevel["end"],0,"",function():void
               {
                  if(isCurrent(generation))
                  {
                     Alarm.show("恭喜通关王者之塔！已保存全部挑战记录，返回入口可重选楼层。",function():void
                     {
                        if(isCurrent(generation))
                        {
                           leaveFight();
                        }
                     });
                  }
               });
               return;
            }
            if(_type == 1 && _stage % 10 == 0)
            {
               Alarm.show("已通过极限模式第" + _stage + "层！返回入口后可整理背包，再选择下一段挑战。",function():void
               {
                  if(isCurrent(generation))
                  {
                     leaveFight();
                  }
               });
               return;
            }
            typeLevel["mc"].y = 0;
            MapManager.currentMap.makeMapArray();
            conLevel["leave_btn"].enabled = false;
            conLevel["leave_btn"].mouseEnabled = false;
            AnimateManager.playMcAnimate(conLevel["light"],2,"mc",function():void
            {
               if(!isCurrent(generation))
               {
                  return;
               }
               for(var index:int = 0; index < 6; index++)
               {
                  depthLevel["light_" + index].visible = true;
               }
               _canGoNext = true;
               conLevel["door"].visible = true;
               conLevel["leave_btn"].enabled = true;
               conLevel["leave_btn"].mouseEnabled = true;
            });
         }
         else if(result.reason == 1)
         {
            _stage = _oldStage;
            _monID = _oldMonID.concat();
            this.clearMonsterModels();
            this.loadMonster(0,generation);
         }
         else
         {
            Alarm.show("这次挑战未能通过。已通关楼层会保留，恢复精灵体力后可以继续。",function():void
            {
               if(isCurrent(generation))
               {
                  leaveFight();
               }
            });
         }
      }

      public function gotoNext() : void
      {
         if(!this._canGoNext || this._transition || this._requestingLeave)
         {
            return;
         }
         this._canGoNext = false;
         MainManager.actorModel.visible = false;
         MainManager.actorModel.hideNono();
         this._transition = new MapTransEffect(MapManager.currentMap,MapTransEffect.TOP);
         this._transition.addEventListener(MapEvent.MAP_EFFECT_COMPLETE,this.onFloorChanged);
         this._transition.star();
      }

      private function onFloorChanged(event:MapEvent) : void
      {
         this._transition.removeEventListener(MapEvent.MAP_EFFECT_COMPLETE,this.onFloorChanged);
         LevelManager.mapLevel.addChild(MapManager.currentMap.root);
         this._transition = null;
         MainManager.actorModel.x = 136;
         MainManager.actorModel.y = 450;
         MainManager.actorModel.visible = true;
         if(_type == 0)
         {
            MainManager.actorModel.showNono(NonoManager.info,MainManager.actorInfo.actionType);
         }
         this.initMap();
      }

      private function onBagClick(event:MouseEvent) : void
      {
         if(!this._requestingStart && !this._requestingLeave && !this._transition)
         {
            FightPetBagController.show();
         }
      }

      private function onLeaveClick(event:MouseEvent) : void
      {
         if(this._requestingStart || this._requestingLeave || this._transition || _isFight)
         {
            return;
         }
         var generation:uint = this._generation;
         Alert.show("离开王者之塔？已通关楼层保留，再次进入可继续。",function():void
         {
            if(isCurrent(generation))
            {
               leaveFight();
            }
         });
      }

      private function leaveFight() : void
      {
         if(this._requestingLeave)
         {
            return;
         }
         this._requestingLeave = true;
         SocketConnection.addCmdListener(LEAVE_KING_TOWER,this.onLeftTower);
         SocketConnection.send(LEAVE_KING_TOWER);
      }

      private function onLeftTower(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(LEAVE_KING_TOWER,this.onLeftTower);
         this._requestingLeave = false;
         var data:ByteArray = event.data as ByteArray;
         if(data.readUnsignedInt() != 1)
         {
            return;
         }
         _entryReady = false;
         _isFight = false;
         ToolBarController.panel.show();
         LevelManager.iconLevel.visible = true;
         MapManager.changeMap(465);
      }

      override public function destroy() : void
      {
         this._disposed = true;
         ++this._generation;
         clearTimeout(this._introTimeout);
         SocketConnection.removeCmdListener(START_KING_TOWER,this.onBattleStarted);
         SocketConnection.removeCmdListener(LEAVE_KING_TOWER,this.onLeftTower);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
         if(this._transition)
         {
            this._transition.removeEventListener(MapEvent.MAP_EFFECT_COMPLETE,this.onFloorChanged);
            this._transition.cancel();
            this._transition = null;
            MainManager.actorModel.visible = true;
         }
         if(_type == 1)
         {
            MainManager.actorModel.showNono(NonoManager.info,MainManager.actorInfo.actionType);
         }
         ToolTipManager.remove(conLevel["bag_btn"]);
         ToolTipManager.remove(conLevel["leave_btn"]);
         conLevel["bag_btn"].removeEventListener(MouseEvent.CLICK,this.onBagClick);
         conLevel["leave_btn"].removeEventListener(MouseEvent.CLICK,this.onLeaveClick);
         ToolTipManager.remove(conLevel["npc"]);
         conLevel["panel"].removeEventListener(Event.ENTER_FRAME,this.onPanelEnter);
         if(this._npcHitArea && this._npcHitArea.parent)
         {
            this._npcHitArea.parent.removeChild(this._npcHitArea);
         }
         this._npcHitArea = null;
         this.clearMonsterModels();
      }
   }
}
