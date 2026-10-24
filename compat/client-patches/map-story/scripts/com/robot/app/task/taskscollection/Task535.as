package com.robot.app.task.taskscollection
{
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.utils.DisplayUtil;

   public class Task535
   {
      public static const TASK_ID:uint = 535;
      private static var _map:BaseMapProcess;
      private static var _mapId:uint;
      private static var _phase:uint;
      private static var _active:Boolean;
      private static var _busy:Boolean;
      private static var _arriving:Boolean;
      private static var _walkAttempts:uint;
      private static var _avatar:MovieClip;
      private static var _boatIn:MovieClip;
      private static var _boatOut:MovieClip;
      private static var _nail:MovieClip;
      private static var _curtain:MovieClip;
      private static var _error:MovieClip;
      private static var _nailPosition:Point;
      private static var _curtainPosition:Point;
      private static var _drag:MovieClip;
      private static var _errorTarget:MovieClip;
      private static var _errorTimer:uint;
      private static var _plane:MovieClip;
      private static var _bridge:MovieClip;
      private static var _wood:MovieClip;
      private static var _planeWood:MovieClip;
      private static var _treasure:MovieClip;
      private static var _buttons:MovieClip;
      private static var _waiting:MovieClip;
      private static var _waitingFrame:uint;
      private static var _waitingAction:Function;
      private static var _moving:MovieClip;

      public static function initTask_1() : void
      {
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_535_1"),function():void
         {
            NpcDialog.show(NPC.IRIS,["看到了吗！这颗就是传说中的死亡星球—戴斯星！如果没有错，第二把生命钥匙就在这里！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.IRIS,["航行史书记载，那颗星球上的气体具有腐蚀作用！赛尔只有脱卸了身上的装备才可以在上面勉强行走…… "],["没时间了！我这就出发！"],[function():void
               {
                  AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_535_2"),function():void
                  {
                     _arriving = true;
                     MapManager.changeMap(435);
                  });
               }]);
            });
         });
      }

      public static function initMap(map:BaseMapProcess,mapId:uint) : void
      {
         _map = map;
         _mapId = mapId;
         _busy = false;
         _walkAttempts = 0;
         if(mapId == 435)
         {
            _avatar = map.conLevel["avatarMC"];
            _boatIn = map.animatorLevel["boatInMC"];
            _boatOut = map.animatorLevel["boatOutMC"];
            _nail = map.conLevel["nailMC"];
            _curtain = map.conLevel["curtainMC"];
            _error = map.animatorLevel["errorMC"];
            _nailPosition = new Point(_nail.x,_nail.y);
            _curtainPosition = new Point(_curtain.x,_curtain.y);
         }
         else
         {
            _plane = map.conLevel["planeMC"];
            _bridge = map.conLevel["brigeMC"];
            _wood = map.conLevel["woodMC"];
            _planeWood = map.conLevel["planeWoodMC"];
            _treasure = map.conLevel["treasureMC"];
            _buttons = map.conLevel["treasureBtn"];
         }
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(_map != map) return;
            var accepted:Boolean = TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT;
            _active = accepted && (mapId == 435 ? !progress[1] : progress[0] && progress[1] && !progress[2]);
            if(!_active)
            {
               showOrdinaryMap();
               return;
            }
            ToolBarController.showOrHideAllUser(false);
            if(mapId == 435)
            {
               _phase = progress[0] ? 1 : 0;
               _avatar.gotoAndStop(_phase == 0 ? 1 : 2);
               _avatar.buttonMode = true;
               _avatar.addEventListener(MouseEvent.CLICK,onAvatarClick);
               _boatIn.visible = true;
               _boatOut.visible = true;
               _boatOut.gotoAndStop(1);
               _error.visible = false;
               MainManager.actorModel.addEventListener(RobotEvent.WALK_START,onWalkStart);
               if(_phase == 1) enableDisguise();
               else _boatIn.gotoAndStop(1);
               if(_arriving)
               {
                  _arriving = false;
                  _busy = true;
                  MainManager.actorModel.visible = false;
                  map.conLevel["shipMC"].visible = false;
                  map.animatorLevel["shipInMC"].visible = true;
                  MainManager.actorModel.addEventListener(RobotEvent.WALK_START,stopWalking);
                  playScene(map.animatorLevel["shipInMC"],0,function():void
                  {
                     DisplayUtil.removeForParent(map.animatorLevel["shipInMC"]);
                     map.conLevel["shipMC"].visible = true;
                     MainManager.actorModel.visible = true;
                     MainManager.actorModel.removeEventListener(RobotEvent.WALK_START,stopWalking);
                     _busy = false;
                  });
               }
            }
            else
            {
               _phase = 0;
               _plane.visible = true;
               _plane.gotoAndStop(2);
               _plane.buttonMode = true;
               _plane.addEventListener(MouseEvent.CLICK,onPlaneClick);
               _bridge.addEventListener(MouseEvent.CLICK,onBridgeClick);
               _wood.addEventListener(MouseEvent.CLICK,onWoodClick);
               _planeWood.addEventListener(MouseEvent.CLICK,onPlaneWoodClick);
               _buttons.addEventListener(MouseEvent.CLICK,onDirectionClick);
               _treasure.addEventListener(MouseEvent.CLICK,onTreasureClick);
            }
         });
      }

      private static function showOrdinaryMap() : void
      {
         if(_mapId == 435)
         {
            DisplayUtil.removeForParent(_nail);
            DisplayUtil.removeForParent(_curtain);
            DisplayUtil.removeForParent(_boatIn);
            DisplayUtil.removeForParent(_error);
            DisplayUtil.removeForParent(_map.animatorLevel["shipInMC"]);
            Object(_map).initResource();
         }
         else
         {
            DisplayUtil.removeForParent(_map.depthLevel["mc"]);
            DisplayUtil.removeForParent(_wood);
            DisplayUtil.removeForParent(_treasure);
            DisplayUtil.removeForParent(_bridge);
            DisplayUtil.removeForParent(_planeWood);
            MapManager.currentMap.makeMapArray();
            _plane.visible = true;
            waitForChild(_plane,9,function(child:MovieClip):void
            {
               child.gotoAndStop(child.totalFrames);
            });
         }
      }

      private static function onWalkStart(event:RobotEvent) : void
      {
         if(MainManager.actorInfo.clothIDs.length == 0) return;
         stopWalking(event);
         if(++_walkAttempts % 2 == 0) showClothingHint();
      }

      private static function showClothingHint() : void
      {
         NpcDialog.show(NPC.SEER,["糟糕！这里的气体果然极具腐蚀！看来必须0xff0000脱去身上的装备0xffffff才能前行了！"],["左边的石块怎么看起来这么奇怪？"]);
      }

      private static function stopWalking(event:RobotEvent) : void
      {
         MainManager.actorModel.stop();
         MainManager.actorModel.skeleton.stop();
      }

      private static function onAvatarClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 0) return;
         if(MainManager.actorInfo.clothIDs.length > 0)
         {
            showClothingHint();
            return;
         }
         _busy = true;
         playScene(_boatIn,0,function():void
         {
            _avatar.gotoAndStop(2);
            NpcDialog.show(NPC.SEER,["这个到底是什么意思？难道我们需要伪装成它的样子？又或者是把它伪装成我们的样子？"],["看看周围吧，可能会有伪装的道具哦！"],[function():void
            {
               TasksManager.complete(TASK_ID,0,function(success:Boolean):void
               {
                  _busy = false;
                  if(success)
                  {
                     _phase = 1;
                     enableDisguise();
                  }
               });
            }]);
         });
      }

      private static function enableDisguise() : void
      {
         _boatIn.gotoAndStop(_boatIn.totalFrames);
         _avatar.mouseEnabled = false;
         _avatar.mouseChildren = false;
         _nail.buttonMode = true;
         _curtain.buttonMode = true;
         _nail.addEventListener(MouseEvent.MOUSE_DOWN,onDragStart);
         _curtain.addEventListener(MouseEvent.MOUSE_DOWN,onDragStart);
      }

      private static function resetError() : void
      {
         if(_errorTimer) clearTimeout(_errorTimer);
         _errorTimer = 0;
         if(_error) _error.visible = false;
         if(_errorTarget)
         {
            returnProp(_errorTarget);
            _errorTarget = null;
         }
      }

      private static function returnProp(prop:MovieClip) : void
      {
         _map.conLevel.addChild(prop);
         var position:Point = prop == _nail ? _nailPosition : _curtainPosition;
         prop.x = position.x;
         prop.y = position.y;
      }

      private static function onDragStart(event:MouseEvent) : void
      {
         if(_busy || _phase != 1) return;
         resetError();
         _drag = event.currentTarget as MovieClip;
         _map.topLevel.addChild(_drag);
         _drag.startDrag(false,new Rectangle(57,158,600,360));
         _drag.addEventListener(Event.ENTER_FRAME,onDragFrame);
         MainManager.getStage().addEventListener(MouseEvent.MOUSE_UP,onDragEnd);
      }

      private static function stopDrag() : MovieClip
      {
         var prop:MovieClip = _drag;
         if(prop)
         {
            prop.stopDrag();
            prop.removeEventListener(Event.ENTER_FRAME,onDragFrame);
         }
         _drag = null;
         MainManager.getStage().removeEventListener(MouseEvent.MOUSE_UP,onDragEnd);
         return prop;
      }

      private static function onDragEnd(event:MouseEvent) : void
      {
         var prop:MovieClip = stopDrag();
         if(prop) returnProp(prop);
      }

      private static function onDragFrame(event:Event) : void
      {
         var kind:int = -1;
         if(_drag["hitMC"].hitTestObject(MainManager.actorModel.skeleton.getBodyMC()["head"])) kind = _drag == _nail ? 0 : 2;
         if(_drag["hitMC"].hitTestObject(_map.conLevel["headHitMC"])) kind = _drag == _nail ? 1 : 3;
         if(kind == -1) return;
         var prop:MovieClip = stopDrag();
         if(kind == 0 || kind == 3)
         {
            _errorTarget = prop;
            _error.visible = true;
            _errorTimer = setTimeout(resetError,1000);
            return;
         }
         _busy = true;
         DisplayUtil.removeForParent(_nail);
         DisplayUtil.removeForParent(_curtain);
         DisplayUtil.removeForParent(_boatIn);
         MainManager.actorModel.visible = false;
         playScene(_boatOut,kind + 1,function():void
         {
            TasksManager.complete(TASK_ID,1,function(success:Boolean):void
            {
               if(success) MapManager.changeMap(436);
               else
               {
                  MainManager.actorModel.visible = true;
                  returnProp(_nail);
                  returnProp(_curtain);
                  _map.animatorLevel.addChild(_boatIn);
                  enableDisguise();
                  _busy = false;
               }
            });
         });
      }

      private static function onPlaneClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 0) return;
         _busy = true;
         MainManager.actorModel.visible = false;
         MainManager.actorModel.addEventListener(RobotEvent.WALK_START,stopWalking);
         playScene(_plane,3,function():void
         {
            _phase = 1;
            _busy = false;
            _bridge.buttonMode = true;
         });
      }

      private static function onBridgeClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 1) return;
         _busy = true;
         waitForChild(_plane,4,function(child:MovieClip):void
         {
            _moving = child;
            _moving.addEventListener(Event.ENTER_FRAME,onCrossBridge);
         });
      }

      private static function onCrossBridge(event:Event) : void
      {
         _moving.x += 10;
         if(_moving.x < 200) return;
         _moving.x = 200;
         _moving.removeEventListener(Event.ENTER_FRAME,onCrossBridge);
         _moving = null;
         playScene(_plane,5,function():void
         {
            DisplayUtil.removeForParent(_planeWood);
            _phase = 2;
            _busy = false;
            _wood.buttonMode = true;
         });
      }

      private static function onWoodClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 2) return;
         _busy = true;
         DisplayUtil.removeForParent(_wood);
         playScene(_plane,6,function():void
         {
            _map.conLevel.addChild(_planeWood);
            _planeWood.buttonMode = true;
            _phase = 3;
            _busy = false;
         });
      }

      private static function onPlaneWoodClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 3) return;
         _busy = true;
         playScene(_plane,7,function():void
         {
            playScene(_plane,8,function():void
            {
               _phase = 4;
               _busy = false;
            });
         });
      }

      private static function onDirectionClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 4 || !(event.target is SimpleButton)) return;
         if(event.target.name == "left") _treasure.x -= 20;
         else if(event.target.name == "right") _treasure.x += 20;
         else return;
         _treasure.x = Math.max(234,Math.min(900,_treasure.x));
         if(_treasure.x != 234) return;
         _busy = true;
         playScene(_plane,9,function():void
         {
            MainManager.actorModel.x = 448;
            MainManager.actorModel.y = 208;
            MainManager.actorModel.visible = true;
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_START,stopWalking);
            DisplayUtil.removeForParent(_map.depthLevel["mc"]);
            MapManager.currentMap.makeMapArray();
            DisplayUtil.removeForParent(_bridge);
            DisplayUtil.removeForParent(_planeWood);
            _buttons.mouseEnabled = false;
            _buttons.mouseChildren = false;
            _treasure.buttonMode = true;
            _phase = 5;
            _busy = false;
         });
      }

      private static function onTreasureClick(event:MouseEvent) : void
      {
         if(_busy || _phase != 5) return;
         var target:MovieClip = _map.conLevel["testMC"];
         MainManager.actorModel.walkAction(new Point(target.x,target.y),false);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,onReachTreasure);
      }

      private static function onReachTreasure(event:RobotEvent) : void
      {
         var target:MovieClip = _map.conLevel["testMC"];
         if(Point.distance(new Point(target.x,target.y),MainManager.actorModel.pos) >= 30) return;
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onReachTreasure);
         stopWalking(event);
         _busy = true;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_535_3"),function():void
         {
            NpcDialog.show(NPC.SEER,["这……这个……钥匙竟然会识别主人？"],["我的眼前怎么一片模糊……"],[function():void
            {
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_535_4"),function():void
               {
                  NpcDialog.show(NPC.SEER,["……又是赫尔卡星预言……石化之城！这到底是哪里呢？太神奇了……快带回去给爱丽丝看看！"],["起航返回赛尔号"],[function():void
                  {
                     TasksManager.complete(TASK_ID,2,function(success:Boolean):void
                     {
                        _busy = false;
                        if(success) MapManager.changeMap(9);
                     });
                  }]);
               });
            }]);
         });
      }

      private static function waitForChild(movie:MovieClip,frame:uint,action:Function) : void
      {
         _waiting = movie;
         _waitingFrame = frame;
         _waitingAction = action;
         movie.gotoAndStop(frame);
         movie.addEventListener(Event.ENTER_FRAME,onChildReady);
      }

      private static function onChildReady(event:Event) : void
      {
         if(_waiting.currentFrame != _waitingFrame || _waiting.numChildren == 0) return;
         var child:MovieClip = _waiting.getChildAt(0) as MovieClip;
         if(child == null) return;
         _waiting.removeEventListener(Event.ENTER_FRAME,onChildReady);
         _waiting = null;
         var action:Function = _waitingAction;
         _waitingAction = null;
         action(child);
      }

      private static function playScene(movie:MovieClip,frame:uint,callback:Function) : void
      {
         var map:BaseMapProcess = _map;
         var done:Function = function():void
         {
            if(_map == map) callback();
         };
         if(frame == 0) AnimateManager.playMcAnimate(movie,0,"",done);
         else waitForChild(movie,frame,function(child:MovieClip):void
         {
            AnimateManager.playMcAnimate(child,0,"",done);
         });
      }

      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map != map) return;
         stopDrag();
         resetError();
         if(_waiting) _waiting.removeEventListener(Event.ENTER_FRAME,onChildReady);
         if(_moving) _moving.removeEventListener(Event.ENTER_FRAME,onCrossBridge);
         if(_avatar) _avatar.removeEventListener(MouseEvent.CLICK,onAvatarClick);
         if(_nail) _nail.removeEventListener(MouseEvent.MOUSE_DOWN,onDragStart);
         if(_curtain) _curtain.removeEventListener(MouseEvent.MOUSE_DOWN,onDragStart);
         if(_plane) _plane.removeEventListener(MouseEvent.CLICK,onPlaneClick);
         if(_bridge) _bridge.removeEventListener(MouseEvent.CLICK,onBridgeClick);
         if(_wood) _wood.removeEventListener(MouseEvent.CLICK,onWoodClick);
         if(_planeWood) _planeWood.removeEventListener(MouseEvent.CLICK,onPlaneWoodClick);
         if(_buttons) _buttons.removeEventListener(MouseEvent.CLICK,onDirectionClick);
         if(_treasure) _treasure.removeEventListener(MouseEvent.CLICK,onTreasureClick);
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_START,onWalkStart);
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_START,stopWalking);
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onReachTreasure);
         MainManager.actorModel.visible = true;
         if(_active) ToolBarController.showOrHideAllUser(true);
         _map = null;
         _active = false;
         _busy = false;
         _waiting = null;
         _waitingAction = null;
         _moving = null;
         _avatar = _boatIn = _boatOut = _nail = _curtain = _error = null;
         _plane = _bridge = _wood = _planeWood = _treasure = _buttons = null;
         _nailPosition = _curtainPosition = null;
      }
   }
}
