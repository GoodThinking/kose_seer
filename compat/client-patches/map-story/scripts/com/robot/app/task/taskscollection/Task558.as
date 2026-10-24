package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.MapLibManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.media.Sound;
   import flash.media.SoundChannel;
   import flash.ui.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task558
   {
      
      private static var _map:BaseMapProcess;
      
      private static var petMc0:MovieClip;
      
      private static var petMc1:MovieClip;
      
      private static var petMc2:MovieClip;
      
      private static var flowerMc0:MovieClip;
      
      private static var flowerMc1:MovieClip;
      
      private static var flowerMc2:MovieClip;
      
      private static var flowerMc3:MovieClip;
      
      private static var chongMc:MovieClip;
      
      private static var curMc:MovieClip;
      
      private static var fMc:MovieClip;
      
      private static var isPet1Ready:Boolean;
      
      private static var isCatchAble:Boolean;
      
      private static var mapMaskMc:MovieClip;
      
      private static var playerHitMc:MovieClip;
      
      private static var zhuiAniMc:MovieClip;
      
      private static var zhuiMc:MovieClip;
      
      private static var arrowMc0:MovieClip;
      
      private static var arrowMc1:MovieClip;
      
      private static var arrowMc2:MovieClip;
      
      private static var bridgeMc:MovieClip;
      
      private static var effSound:Sound;
      
      private static var effChannel:SoundChannel;
      
      private static var chongHold:int = 1;
      
      public function Task558()
      {
         super();
      }
      
      public static function initTask() : void
      {
         NpcDialog.show(NPC.IRIS,["菲尔纳星，这是一颗十分奇怪的星，上面的地理环境适合很多精灵居住，根据信号提示，我确信钥匙就在那里！"],["哔哔……纽斯新闻时间又到咯！"],[function():void
         {
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_558_0"),function():void
            {
               NpcDialog.show(NPC.IRIS,["我……我刚才说到哪里了？ 对了！新星球！赛尔，小飞艇位置已经锁定了，你准备好出发了吗？"],["GO！GO！GO！"],[function():void
               {
                  MapManager.changeMap(459);
               }]);
            });
         }]);
      }
      
      public static function initTask_459(param1:BaseMapProcess) : void
      {
         var i1:int = 0;
         var map:BaseMapProcess = param1;
         _map = map;
         isCatchAble = false;
         chongHold = 1;
         petMc0 = _map.conLevel["petMc0"];
         petMc1 = _map.conLevel["petMc1"];
         petMc2 = _map.conLevel["petMc2"];
         flowerMc0 = _map.conLevel["flowerMc0"];
         flowerMc1 = _map.conLevel["flowerMc1"];
         flowerMc2 = _map.conLevel["flowerMc2"];
         flowerMc3 = _map.conLevel["flowerMc3"];
         chongMc = _map.conLevel["chongMc"];
         curMc = _map.conLevel["curMc"];
         playerHitMc = _map.depthLevel["playerHitMc"];
         zhuiAniMc = _map.conLevel["zhuiAniMc"];
         zhuiMc = _map.conLevel["zhuiMc"];
         arrowMc0 = _map.conLevel["arrow0"];
         arrowMc1 = _map.conLevel["arrow1"];
         arrowMc2 = _map.conLevel["arrow2"];
         bridgeMc = _map.conLevel["bridgeMc"];
         arrowMc0.visible = false;
         arrowMc1.visible = false;
         arrowMc2.visible = false;
         curMc.visible = false;
         curMc.mouseChildren = false;
         curMc.mouseEnabled = false;
         zhuiAniMc.gotoAndStop(1);
         zhuiAniMc.visible = false;
         zhuiMc.visible = false;
         bridgeMc.mouseChildren = false;
         bridgeMc.mouseEnabled = false;
         i1 = 0;
         while(i1 < 4)
         {
            (_map.conLevel["fenMc" + i1] as MovieClip).visible = false;
            i1++;
         }
         petMc0.buttonMode = true;
         petMc1.buttonMode = true;
         flowerMc0.buttonMode = true;
         flowerMc1.buttonMode = true;
         flowerMc2.buttonMode = true;
         flowerMc3.buttonMode = true;
         chongMc.buttonMode = true;
         chongMc.visible = false;
         bridgeMc.visible = false;
         if(TasksManager.getTaskStatus(558) == TasksManager.UN_ACCEPT)
         {
            DisplayUtil.removeForParent(petMc0);
            petMc0 = null;
            DisplayUtil.removeForParent(petMc1);
            petMc1 = null;
            DisplayUtil.removeForParent(petMc2);
            petMc2 = null;
            DisplayUtil.removeForParent(flowerMc0);
            flowerMc0 = null;
            DisplayUtil.removeForParent(flowerMc1);
            flowerMc1 = null;
            DisplayUtil.removeForParent(flowerMc2);
            flowerMc2 = null;
            DisplayUtil.removeForParent(flowerMc3);
            flowerMc3 = null;
            DisplayUtil.removeForParent(chongMc);
            chongMc = null;
            DisplayUtil.removeForParent(curMc);
            curMc = null;
            DisplayUtil.removeForParent(playerHitMc);
            playerHitMc = null;
            DisplayUtil.removeForParent(zhuiAniMc);
            zhuiAniMc = null;
            DisplayUtil.removeForParent(zhuiMc);
            zhuiMc = null;
         }
         else if(TasksManager.getTaskStatus(558) == TasksManager.COMPLETE)
         {
            DisplayUtil.removeForParent(petMc0);
            petMc0 = null;
            DisplayUtil.removeForParent(petMc1);
            petMc1 = null;
            DisplayUtil.removeForParent(petMc2);
            petMc2 = null;
            DisplayUtil.removeForParent(flowerMc0);
            flowerMc0 = null;
            DisplayUtil.removeForParent(flowerMc1);
            flowerMc1 = null;
            DisplayUtil.removeForParent(flowerMc2);
            flowerMc2 = null;
            DisplayUtil.removeForParent(flowerMc3);
            flowerMc3 = null;
            DisplayUtil.removeForParent(chongMc);
            chongMc = null;
            DisplayUtil.removeForParent(curMc);
            curMc = null;
            DisplayUtil.removeForParent(playerHitMc);
            playerHitMc = null;
            DisplayUtil.removeForParent(zhuiAniMc);
            zhuiAniMc = null;
            DisplayUtil.removeForParent(zhuiMc);
            zhuiMc = null;
            bridgeMc.visible = true;
            mapMaskMc = _map.typeLevel["mapMask"];
            _map.typeLevel.removeChild(mapMaskMc);
            MapManager.currentMap.makeMapArray();
         }
         else if(TasksManager.getTaskStatus(TaskController_558.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_558.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               var a:Array = param1;
               if(!a[0])
               {
                  startProOne();
               }
               else if(Boolean(a[0]) && !a[1])
               {
                  startProTwo();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && !a[2])
               {
                  NpcDialog.show(NPC.SEER,["不行！我绝对不能轻举妄动！先去告诉爱丽丝吧！那两个精灵绝对不简单……"],["快返回赛尔号"],[function():void
                  {
                     if(_map != map) return;
                     MapManager.changeMap(9);
                  }]);
               }
            });
         }
      }
      
      private static function startProOne() : void
      {
         isPet1Ready = false;
         var map:BaseMapProcess = _map;
         NpcDialog.show(NPC.SMALL_PET,["谁能帮帮我？我被困在这里好久了……迪达和塔拉姆应该能够帮到你！"],["（登上山顶，解除锁扣）"],[function():void
         {
            if(_map != map) return;
            petMc0.addEventListener(MouseEvent.CLICK,onClickPetHadnler0);
            petMc1.addEventListener(MouseEvent.CLICK,onClickPetHadnler1);
            addFlowerEvent();
            chongMc.addEventListener(MouseEvent.CLICK,onClickChongHandler);
         }]);
      }
      
      private static function onClickPetHadnler0(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.DIDA_PET,["咕嘟咕嘟……人人都说我打喷嚏的时候威力最大了！"],["（我最最怕咕噜咕噜花粉了）"],[function():void
         {
         }]);
      }
      
      private static function onClickPetHadnler1(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.DALAMU_PET,["我饿了……如果有什么东西能给我吃该有多好！"],["（皮拉姆蚯蚓是塔拉姆最爱的精灵饲料）"],[function():void
         {
         }]);
      }
      
      private static function onClickChongHandler(param1:MouseEvent) : void
      {
         var strName:String = null;
         var id:int = 0;
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(Boolean(isPet1Ready) && !isCatchAble)
         {
            Mouse.hide();
            curMc.visible = true;
            MainManager.getStage().addEventListener(MouseEvent.MOUSE_MOVE,onCurUpdateHandler);
            isCatchAble = true;
         }
         else if(isCatchAble)
         {
            strName = e.target.name;
            id = int(strName.slice(3,4));
            if(id == chongHold)
            {
               chongMc.removeEventListener(Event.ENTER_FRAME,onChongFrameHandler);
               isCatchAble = false;
               MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onCurUpdateHandler);
               chongMc.removeEventListener(MouseEvent.CLICK,onClickChongHandler);
               AnimateManager.playMcAnimate(chongMc,2,"ani",function():void
               {
                  if(_map != map) return;
                  curMc.visible = false;
                  Mouse.show();
                  DragManager.add(chongMc,chongMc);
                  MainManager.getStage().addEventListener(MouseEvent.MOUSE_MOVE,onChongMoveHandler);
               });
            }
         }
      }
      
      private static function onChongMoveHandler(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(!arrowMc1.visible)
         {
            arrowMc1.visible = true;
         }
         if(petMc1.hitTestObject(chongMc))
         {
            MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onChongMoveHandler);
            arrowMc1.visible = false;
            DragManager.remove(chongMc);
            chongMc.visible = false;
            petMc1.mouseChildren = false;
            petMc1.mouseEnabled = false;
            effSound = MapLibManager.getSound("pet1Snd");
            effChannel = effSound.play();
            AnimateManager.playMcAnimate(petMc1,3,"ani",function():void
            {
               if(_map != map) return;
               petMc1["ani"].stop();
               mapMaskMc = _map.typeLevel["mapMask"];
               _map.typeLevel.removeChild(mapMaskMc);
               MapManager.currentMap.makeMapArray();
               playerHitMc.mouseChildren = false;
               playerHitMc.mouseEnabled = false;
               MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHandler);
            });
         }
      }
      
      private static function onWalkHandler(param1:RobotEvent) : void
      {
         var e:RobotEvent = param1;
         var map:BaseMapProcess = _map;
         if(playerHitMc.hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y))
         {
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHandler);
            EventManager.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHandler);
            AnimateManager.playMcAnimate(petMc1,4,"ani",function():void
            {
               if(_map != map) return;
               petMc1["ani"].stop();
               _map.typeLevel.addChild(mapMaskMc);
               MapManager.currentMap.makeMapArray();
               NpcDialog.show(NPC.SMALL_PET,["快！你已经能够上来了！快解开我的锁扣！"],["（左右两边都有）"],[function():void
               {
                  if(_map != map) return;
                  TasksManager.complete(TaskController_558.TASK_ID,0,function(param1:Boolean):void
                  {
                     if(_map != map) return;
                     if(param1)
                     {
                        startProTwo();
                     }
                  });
               }]);
            });
         }
      }
      
      private static function onCurUpdateHandler(param1:MouseEvent) : void
      {
         curMc.x = param1.stageX;
         curMc.y = param1.stageY;
      }
      
      private static function addFlowerEvent() : void
      {
         var _loc1_:MovieClip = null;
         var _loc2_:int = 0;
         while(_loc2_ < 4)
         {
            _loc1_ = _map.conLevel["flowerMc" + _loc2_] as MovieClip;
            _loc1_.addEventListener(MouseEvent.CLICK,onFlowerClickHandler);
            _loc2_++;
         }
      }
      
      private static function removeFlowerEvent() : void
      {
         var _loc1_:MovieClip = null;
         var _loc2_:int = 0;
         while(_loc2_ < 4)
         {
            _loc1_ = _map.conLevel["flowerMc" + _loc2_] as MovieClip;
            if(Boolean(_loc1_))
            {
               _loc1_.removeEventListener(MouseEvent.CLICK,onFlowerClickHandler);
            }
            _loc2_++;
         }
      }
      
      private static function onFlowerClickHandler(param1:MouseEvent) : void
      {
         var mc:MovieClip = null;
         var id:String = null;
         mc = null;
         id = null;
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         mc = e.currentTarget as MovieClip;
         mc.removeEventListener(MouseEvent.CLICK,onFlowerClickHandler);
         id = mc.name.slice(8,9);
         AnimateManager.playMcAnimate(mc,2,"ani",function():void
         {
            if(_map != map) return;
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_558_1"),function():void
            {
               if(_map != map) return;
               fMc = _map.conLevel["fenMc" + id] as MovieClip;
               mc.gotoAndStop(3);
               fMc.visible = true;
               fMc.buttonMode = true;
               MainManager.getStage().addEventListener(MouseEvent.MOUSE_MOVE,onDragFenHandler);
               fMc.addEventListener(MouseEvent.MOUSE_DOWN,onDownFenHandler);
               DragManager.add(fMc,fMc);
            });
         });
      }
      
      private static function onDownFenHandler(param1:MouseEvent) : void
      {
         var _loc2_:String = null;
         var _loc3_:MovieClip = param1.currentTarget as MovieClip;
         if(Boolean(_loc3_))
         {
            _loc2_ = _loc3_.name.slice(5,6);
            fMc = _map.conLevel["fenMc" + _loc2_] as MovieClip;
         }
      }
      
      private static function onDragFenHandler(param1:MouseEvent) : void
      {
         var i1:int = 0;
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(!arrowMc0.visible)
         {
            arrowMc0.visible = true;
         }
         if(petMc0.hitTestObject(fMc))
         {
            MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onDragFenHandler);
            arrowMc0.visible = false;
            removeFlowerEvent();
            i1 = 0;
            while(i1 < 4)
            {
               fMc = _map.conLevel["fenMc" + i1] as MovieClip;
               fMc.visible = false;
               DragManager.remove(fMc);
               i1++;
            }
            effSound = MapLibManager.getSound("pet0Snd");
            effChannel = effSound.play();
            AnimateManager.playMcAnimate(petMc0,2,"ani",function():void
            {
               if(_map != map) return;
               petMc0.gotoAndStop(1);
               effSound = MapLibManager.getSound("pet1FlySnd");
               effChannel = effSound.play();
               AnimateManager.playMcAnimate(petMc1,2,"ani",function():void
               {
                  if(_map != map) return;
                  var _loc1_:MovieClip = null;
                  chongMc.visible = true;
                  isPet1Ready = true;
                  chongMc.addEventListener(Event.ENTER_FRAME,onChongFrameHandler);
                  var _loc2_:int = 1;
                  while(_loc2_ < 4)
                  {
                     _loc1_ = chongMc["ani" + _loc2_] as MovieClip;
                     _loc1_.mouseChildren = false;
                     if(_loc2_ != 1)
                     {
                        _loc1_.gotoAndStop(1);
                        _loc1_.visible = false;
                     }
                     _loc2_++;
                  }
               });
            });
         }
      }
      
      private static function onChongFrameHandler(param1:Event) : void
      {
         var _loc2_:MovieClip = chongMc["ani" + chongHold] as MovieClip;
         if(_loc2_.currentFrame == _loc2_.totalFrames)
         {
            _loc2_.gotoAndStop(1);
            _loc2_.visible = false;
            ++chongHold;
            if(chongHold > 3)
            {
               chongHold = 1;
            }
            _loc2_ = chongMc["ani" + chongHold] as MovieClip;
            _loc2_.gotoAndPlay(1);
            _loc2_.visible = true;
         }
      }
      
      private static function startProTwo() : void
      {
         DisplayUtil.removeForParent(playerHitMc);
         MainManager.actorModel.stop();
         MainManager.actorModel.pos = new Point(500,250);
         petMc1.gotoAndStop(4);
         petMc2.buttonMode = true;
         petMc2.addEventListener(MouseEvent.CLICK,onClickPetHandler2);
      }
      
      private static function onClickPetHandler2(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         petMc2.removeEventListener(MouseEvent.CLICK,onClickPetHandler2);
         effSound = MapLibManager.getSound("pet2Snd");
         effChannel = effSound.play();
         AnimateManager.playMcAnimate(petMc2,2,"ani",function():void
         {
            if(_map != map) return;
            if(Boolean(petMc2["ani"]))
            {
               (petMc2["ani"] as MovieClip).stop();
               NpcDialog.show(NPC.SMALL_PET,["好人做到底吧……我的一个项链掉在海里了，可是我却不能靠近，你能不能帮我撩一下？"],["举手之劳啦！"],[function():void
               {
                  if(_map != map) return;
                  zhuiAniMc.visible = true;
                  AnimateManager.playMcAnimate(zhuiAniMc,0,"",function():void
                  {
                     if(_map != map) return;
                     zhuiAniMc.stop();
                     zhuiAniMc.buttonMode = true;
                     zhuiAniMc.addEventListener(MouseEvent.CLICK,onClickZhuiHandler);
                  });
               }]);
            }
         });
      }
      
      private static function onClickZhuiHandler(param1:MouseEvent) : void
      {
         zhuiAniMc.visible = false;
         zhuiMc.visible = true;
         DragManager.add(zhuiMc,zhuiMc);
         MainManager.getStage().addEventListener(MouseEvent.MOUSE_MOVE,onDragZhuiHandler);
      }
      
      private static function onDragZhuiHandler(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(!arrowMc2.visible)
         {
            arrowMc2.visible = true;
         }
         if(petMc2.hitTestObject(zhuiMc))
         {
            MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onDragZhuiHandler);
            arrowMc2.visible = false;
            zhuiMc.visible = false;
            AnimateManager.playMcAnimate(petMc2,4,"ani",function():void
            {
               if(_map != map) return;
               petMc2["ani"].stop();
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_558_2"),function():void
               {
                  if(_map != map) return;
                  AnimateManager.playMcAnimate(petMc2,5,"ani",function():void
                  {
                     if(_map != map) return;
                     petMc2["ani"].stop();
                     TasksManager.complete(TaskController_558.TASK_ID,1,function(param1:Boolean):void
                     {
                        if(_map != map) return;
                        var b:Boolean = param1;
                        if(b)
                        {
                           NpcDialog.show(NPC.SEER,["不行！我绝对不能轻举妄动！先去告诉爱丽丝吧！那两个精灵绝对不简单……"],["快返回赛尔号"],[function():void
                           {
                              if(_map != map) return;
                              MapManager.changeMap(9);
                           }]);
                        }
                     });
                  });
               });
            });
         }
      }
      
      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map != map) return;
         ToolBarController.showOrHideAllUser(true);
         if(Boolean(effChannel))
         {
            effChannel.stop();
            effChannel = null;
         }
         isCatchAble = false;
         chongHold = 1;
         EventManager.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHandler);
         if(Boolean(chongMc))
         {
            chongMc.removeEventListener(Event.ENTER_FRAME,onChongFrameHandler);
            DragManager.remove(chongMc);
            chongMc.removeEventListener(MouseEvent.CLICK,onClickChongHandler);
         }
         if(Boolean(petMc0))
         {
            petMc0.removeEventListener(MouseEvent.CLICK,onClickPetHadnler0);
         }
         if(Boolean(petMc1))
         {
            petMc1.removeEventListener(MouseEvent.CLICK,onClickPetHadnler1);
         }
         if(Boolean(petMc2))
         {
            petMc2.removeEventListener(MouseEvent.CLICK,onClickPetHandler2);
         }
         removeFlowerEvent();
         if(zhuiMc != null) DragManager.remove(zhuiMc);
         if(zhuiAniMc != null) zhuiAniMc.removeEventListener(MouseEvent.CLICK,onClickZhuiHandler);
         var _loc1_:int = 0;
         while(_loc1_ < 4)
         {
            fMc = _map.conLevel["fenMc" + _loc1_] as MovieClip;
            if(Boolean(fMc))
            {
               fMc.visible = false;
               fMc.removeEventListener(MouseEvent.MOUSE_DOWN,onDownFenHandler);
               DragManager.remove(fMc);
            }
            _loc1_++;
         }
         Mouse.show();
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHandler);
         MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onDragFenHandler);
         MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onCurUpdateHandler);
         MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onChongMoveHandler);
         MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,onDragZhuiHandler);
         if(Boolean(_map))
         {
            _map = null;
         }
      }
   }
}

