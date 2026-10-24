package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task626 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var infoPanel1:MovieClip;
      
      private static var infoPanel2:MovieClip;
      
      private static var doorMC:MovieClip;
      
      private static var wizardMC:MovieClip;
      
      private static var task626Accepted:Boolean;
      
      public function Task626()
      {
         super();
      }
      
      public static function initTaskForMap496(param1:BaseMapProcess) : void
      {
         _map = param1;
         initTask626MC();
      }
      
      private static function initTask626MC() : void
      {
         var ret:uint = 0;
         infoPanel1 = _map.topLevel["infoPanel1"];
         infoPanel2 = _map.topLevel["infoPanel2"];
         infoPanel1.visible = infoPanel2.visible = false;
         infoPanel1["closeBTN"].addEventListener(MouseEvent.CLICK,closeInfoPanel);
         infoPanel2["closeBTN"].addEventListener(MouseEvent.CLICK,closeInfoPanel);
         infoPanel1["key1MC"].alpha = infoPanel1["key2MC"].alpha = 0.5;
         doorMC = _map.conLevel["doorMC"];
         doorMC.buttonMode = true;
         doorMC.addEventListener(MouseEvent.CLICK,clickHandler);
         wizardMC = _map.animatorLevel["wizardMC"];
         _map.conLevel["infoBTN"].buttonMode = true;
         _map.conLevel["infoBTN"].addEventListener(MouseEvent.CLICK,showInfoPanel1);
         ret = uint(TasksManager.getTaskStatus(TaskController_626.TASK_ID));
         if(ret == TasksManager.UN_ACCEPT)
         {
            DisplayUtil.removeForParent(_map.conLevel["key1HitMC"]);
            _map.conLevel["key1MC"].visible = false;
            DisplayUtil.removeForParent(_map.conLevel["key2HitMC"]);
            _map.conLevel["key2MC"].visible = false;
            doorMC.mouseChildren = doorMC.mouseEnabled = false;
         }
         else if(ret == TasksManager.COMPLETE)
         {
            DisplayUtil.removeForParent(_map.conLevel["wizardMC"]);
            DisplayUtil.removeForParent(_map.conLevel["key1HitMC"]);
            _map.conLevel["key1MC"].visible = false;
            DisplayUtil.removeForParent(_map.conLevel["key2HitMC"]);
            _map.conLevel["key2MC"].visible = false;
            doorMC.mouseChildren = doorMC.mouseEnabled = false;
            doorMC.gotoAndStop(2);
            DisplayUtil.removeForParent(_map.typeLevel["stone"]);
            DisplayUtil.removeForParent(wizardMC);
            MapManager.currentMap.makeMapArray();
         }
         else
         {
            OgreController.isShow = false;
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_626.TASK_ID,function(param1:Array):void
            {
               var a:Array = param1;
               if(!a[0])
               {
                  NpcDialog.show(NPC.SEER,["这里看起来也好像是一个迷宫哦！咦？右上角似乎有点发光……那里会是什么？"],["（想办法走过去吧）"],[function():void
                  {
                     TasksManager.complete(TaskController_626.TASK_ID,0);
                     DebugTrace.show("第一步完成");
                  }]);
               }
               else if(!(Boolean(a[0]) && !a[1]))
               {
                  if(Boolean(a[0]) && Boolean(a[1]) && !a[2])
                  {
                     doorMC.mouseEnabled = false;
                     doorMC.mouseChildren = false;
                     doorMC.gotoAndStop(2);
                     DisplayUtil.removeForParent(_map.conLevel["key1HitMC"]);
                     _map.conLevel["key1MC"].visible = false;
                     DisplayUtil.removeForParent(_map.conLevel["key2HitMC"]);
                     _map.conLevel["key2MC"].visible = false;
                     DisplayUtil.removeForParent(_map.typeLevel["stone"]);
                     MapManager.currentMap.makeMapArray();
                     wizardMC.addEventListener(Event.ENTER_FRAME,function():void
                     {
                        if(wizardMC.currentFrame == 100)
                        {
                           wizardMC.removeEventListener(Event.ENTER_FRAME,arguments.callee);
                           wizardMC.stop();
                           NpcDialog.show(NPC.ELEMENT,["美利图陛下万岁！美利图陛下万岁！"],null,null,false,function():void
                           {
                              NpcDialog.show(NPC.SEER,["什么美利图……什么什么……难道是那条项链在作怪吗？"],["（鼠标点击它）"],[function():void
                              {
                                 _map.conLevel["wizardMC"].addEventListener(MouseEvent.CLICK,onAimatEnd);
                              }]);
                           });
                        }
                     });
                     wizardMC.gotoAndPlay(2);
                  }
               }
            });
         }
      }
      
      public static function key1ClickHandler() : void
      {
         DisplayUtil.removeForParent(_map.conLevel["key1HitMC"]);
         _map.conLevel["key1MC"].visible = false;
         Alarm.show("你已经找到光系水晶");
      }
      
      public static function key2ClickHandler() : void
      {
         DisplayUtil.removeForParent(_map.conLevel["key2HitMC"]);
         _map.conLevel["key2MC"].visible = false;
         Alarm.show("你已经找到太阳水晶");
      }
      
      private static function closeInfoPanel(param1:MouseEvent) : void
      {
         var _loc2_:MovieClip = param1.currentTarget.parent;
         if(_loc2_.name == "infoPanel1")
         {
            infoPanel1.visible = false;
         }
         else if(_loc2_.name == "infoPanel2")
         {
            infoPanel2.visible = false;
         }
      }
      
      private static function showInfoPanel1(param1:MouseEvent) : void
      {
         if(infoPanel1.visible)
         {
            infoPanel1.visible = false;
         }
         infoPanel2.visible = true;
      }
      
      private static function clickHandler(param1:MouseEvent) : void
      {
         if(doorMC.currentFrame == 1)
         {
            if(param1.target.name == "botDoorMC")
            {
               if(Point.distance(MainManager.actorModel.pos,new Point(620,390)) < 180)
               {
                  doorMC.gotoAndStop(2);
               }
            }
            else if(param1.target.name == "pointsMC")
            {
               if(Point.distance(MainManager.actorModel.pos,new Point(480,120)) < 160)
               {
                  NpcDialog.show(NPC.SEER,["咦……这里好像有什么东西？难道是入口吗？但是被树藤挡住了……"],["（想办法拉动树藤）"]);
               }
            }
         }
         else
         {
            check2Key();
         }
      }
      
      private static function check2Key() : void
      {
         if(!_map.conLevel["key1MC"].visible && !_map.conLevel["key2MC"].visible)
         {
            TasksManager.complete(TaskController_626.TASK_ID,1,function(param1:Boolean):void
            {
               var b:Boolean = param1;
               doorMC.mouseEnabled = false;
               doorMC.mouseChildren = false;
               DisplayUtil.removeForParent(_map.typeLevel["stone"]);
               MapManager.currentMap.makeMapArray();
               wizardMC.addEventListener(Event.ENTER_FRAME,function():void
               {
                  if(wizardMC.currentFrame == 100)
                  {
                     wizardMC.removeEventListener(Event.ENTER_FRAME,arguments.callee);
                     wizardMC.stop();
                     NpcDialog.show(NPC.ELEMENT,["美利图陛下万岁！美利图陛下万岁！"],null,null,false,function():void
                     {
                        NpcDialog.show(NPC.SEER,["什么美利图……什么什么……难道是那条项链在作怪吗？"],["（鼠标点击它）"],[function():void
                        {
                           _map.conLevel["wizardMC"].addEventListener(MouseEvent.CLICK,onAimatEnd);
                        }]);
                     });
                  }
               });
               wizardMC.gotoAndPlay(2);
               DebugTrace.show("门已打开，可以通过");
            });
         }
         else
         {
            infoPanel1["key1MC"].alpha = _map.conLevel["key1MC"].visible ? 0.5 : 1;
            infoPanel1["key2MC"].alpha = _map.conLevel["key2MC"].visible ? 0.5 : 1;
            infoPanel1.visible = true;
            if(infoPanel2.visible)
            {
               infoPanel2.visible = false;
            }
         }
      }
      
      private static function onAimatEnd(param1:Event) : void
      {
         var evt:Event = param1;
         _map.conLevel["wizardMC"].removeEventListener(MouseEvent.CLICK,onAimatEnd);
         AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("NecklaceLost"),function():void
         {
            NpcDialog.show(NPC.ELEMENT,["我……我是在哪里？我……我怎么了？！你们又是谁？"],null,null,false,function():void
            {
               NpcDialog.show(NPC.SEER,["可恶！看项链的设计一定又是海盗们的诡计！卡茨……卡茨的消失会和海盗有关系吗……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.ELEMENT,["美利图……好熟悉的名字……我想起来了！！！！"],["（艾里蒙特回忆）"],[function():void
                  {
                     CartoonManager.play(ClientConfig.getFullMovie("cartoon/task_626"),function():void
                     {
                        NpcDialog.show(NPC.SEER,["卡茨……海盗……怎么办！！一定是海盗把卡茨抓走了！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.ELEMENT,["我记得他们说要去黄色星球……好像是要利用它抓取更多能量精灵……他就好了还有你这个朋友牵挂，我……我……"],null,null,false,function():void
                           {
                              NpcDialog.show(NPC.SEER,["哦对了！你知道吗……马力一直都没忘记你这个朋友！两个人在一起需要互相谦让哦！快去麦兹星球找它吧！"],["友谊是最珍贵的！"],[function():void
                              {
                                 AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_626_2"),function():void
                                 {
                                    NpcDialog.show(NPC.SEER,["卡茨……你放心！我一定会救出你的！"],["（那个美利图又会是谁呢）"],[function():void
                                    {
                                       AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_626_3"),function():void
                                       {
                                          wizardMC.gotoAndStop(101);
                                          TasksManager.completeFinal(TaskController_626.TASK_ID,function(param1:Boolean):void
                                          {
                                             if(param1)
                                             {
                                                OgreController.isShow = true;
                                                ToolBarController.showOrHideAllUser(true);
                                                DebugTrace.show("第三步完成");
                                                DisplayUtil.removeForParent(_map.conLevel["wizardMC"]);
                                                DisplayUtil.removeForParent(_map.conLevel["key1HitMC"]);
                                                _map.conLevel["key1MC"].visible = false;
                                                DisplayUtil.removeForParent(_map.conLevel["key2HitMC"]);
                                                _map.conLevel["key2MC"].visible = false;
                                                doorMC.mouseEnabled = false;
                                                doorMC.mouseChildren = false;
                                                doorMC.gotoAndStop(2);
                                                DisplayUtil.removeForParent(_map.typeLevel["stone"]);
                                                DisplayUtil.removeForParent(wizardMC);
                                                MapManager.currentMap.makeMapArray();
                                                Task628.initTaskForMap496(_map);
                                             }
                                          });
                                       });
                                    }]);
                                 });
                              }]);
                           });
                        });
                     });
                  }]);
               });
            });
         });
      }
      
      public static function removeResource496_626() : void
      {
         infoPanel1 = _map.topLevel["infoPanel1"];
         infoPanel2 = _map.topLevel["infoPanel2"];
         infoPanel2.visible = false;
         infoPanel1.visible = false;
         doorMC = _map.conLevel["doorMC"];
         if(Boolean(doorMC))
         {
            _map.conLevel["wizardMC"].removeEventListener(MouseEvent.CLICK,onAimatEnd);
            _map.conLevel["infoBTN"].removeEventListener(MouseEvent.CLICK,showInfoPanel1);
            doorMC.removeEventListener(MouseEvent.CLICK,clickHandler);
            infoPanel1["closeBTN"].removeEventListener(MouseEvent.CLICK,closeInfoPanel);
            infoPanel2["closeBTN"].removeEventListener(MouseEvent.CLICK,closeInfoPanel);
         }
      }
      
      public static function initTaskForMap494(param1:BaseMapProcess) : void
      {
         _map = param1;
         _map.conLevel["stepMC"].visible = false;
         if(TasksManager.getTaskStatus(624) != TasksManager.COMPLETE)
         {
            removeResource494_626();
            return;
         }
         var _loc2_:uint = uint(TasksManager.getTaskStatus(TaskController_626.TASK_ID));
         switch(_loc2_)
         {
            case TasksManager.UN_ACCEPT:
               task626Accepted = false;
               OgreController.isShow = false;
               ToolBarController.showOrHideAllUser(false);
               ToolTipManager.add(_map.depthLevel["npc_626"],"卡茨");
               _map.depthLevel["npc_626"].buttonMode = true;
               _map.depthLevel["npc_626"].addEventListener(MouseEvent.CLICK,onNpcClick);
               break;
            case TasksManager.COMPLETE:
               task626Accepted = true;
               removeResource494_626();
               break;
            default:
               _map.conLevel["stepMC"].visible = true;
               task626Accepted = true;
               removeResource494_626();
         }
         _map.conLevel["startPoint"].buttonMode = true;
         _map.conLevel["startPoint"].addEventListener(MouseEvent.CLICK,onStartPointClick);
      }
      
      private static function onStartPointClick(param1:MouseEvent) : void
      {
         MapManager.changeMap(496);
      }
      
      private static function onNpcClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         if(!task626Accepted)
         {
            NpcDialog.show(NPC.KAZI,["谢谢……谢谢你为我所做的一切！恶由杂念而起，善由心境而发！我想我能够控制自己能力……"],["哇哇哇！！快来试试看威力吧……","我一会再来找你"],[function():void
            {
               TasksManager.accept(TaskController_626.TASK_ID,function(param1:Boolean):void
               {
                  var b:* = param1;
                  if(Boolean(b))
                  {
                     _map.depthLevel["npc_626"].visible = false;
                     task626Accepted = true;
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_626_1"),function():void
                     {
                        _map.conLevel["stepMC"].visible = true;
                        NpcDialog.show(NPC.SEER,["卡茨呢？咦……卡茨呢？"],["怎么会有这么多脚印……沿着过去看看！"],[function():void
                        {
                           var _loc1_:* = AssetsManager.getMovieClip("HelpUI_Arrow");
                           if(Boolean(_loc1_))
                           {
                              _loc1_.mouseEnabled = _loc1_.mouseChildren = false;
                              _loc1_.gotoAndStop(1);
                              _loc1_.x = 34;
                              _loc1_.y = -20;
                              _map.conLevel["startPoint"].addChild(_loc1_);
                           }
                        }]);
                     });
                     DebugTrace.show("接取任务成功");
                  }
               });
            }]);
         }
         else
         {
            MapManager.changeMap(496);
         }
      }
      
      public static function removeResource494_626() : void
      {
         if(Boolean(_map.depthLevel["npc_626"]))
         {
            _map.depthLevel["npc_626"].removeEventListener(MouseEvent.CLICK,onNpcClick);
            ToolTipManager.remove(_map.depthLevel["npc_626"]);
            DisplayUtil.removeForParent(_map.depthLevel["npc_626"]);
         }
      }
      
      public static function destroy() : void
      {
         OgreController.isShow = true;
         ToolBarController.showOrHideAllUser(true);
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 494)
         {
            removeResource494_626();
            _map.conLevel["startPoint"].removeEventListener(MouseEvent.CLICK,onStartPointClick);
         }
         else if(MapManager.currentMap.id == 496)
         {
            removeResource496_626();
         }
         _map = null;
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         _map = param1;
         if(MapManager.currentMap.id == 496)
         {
            removeResource496_626();
         }
         if(MapManager.currentMap.id == 494)
         {
            removeResource494_626();
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 496)
         {
            initTaskForMap496(param1);
         }
         if(MapManager.currentMap.id == 494)
         {
            initTaskForMap494(param1);
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 496)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 494)
         {
            destroy();
         }
         _map = null;
      }
   }
}

