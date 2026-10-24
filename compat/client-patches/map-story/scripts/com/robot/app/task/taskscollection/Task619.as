package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.utils.*;
   import org.taomee.debug.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task619 extends ITask
   {
      
      private static var map:BaseMapProcess;
      
      private static var canCross:Boolean;
      
      private static var blood:int;
      
      private static var timer:Timer;
      
      private static var bloodBar:MovieClip;
      
      private static var hasTalk_0:Boolean = false;
      
      private static var hasTalk_1:Boolean = false;
      
      public function Task619()
      {
         super();
      }
      
      public static function initTask_484(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         canCross = false;
         map = m;
         map.conLevel["arrow_619"].visible = false;
         if(TasksManager.getTaskStatus(616) != TasksManager.COMPLETE)
         {
            removeResource_484();
            return;
         }
         if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            accept();
         }
         else if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_619.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  startPro_0();
               }
               else
               {
                  removeResource_484();
               }
            });
         }
         else if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.COMPLETE)
         {
            removeResource_484();
         }
         Task616.showMap484Game(true);
      }
      
      private static function removeResource_484() : void
      {
         map.conLevel["npc_619"].visible = false;
         map.conLevel["arrow_619"].visible = false;
      }
      
      private static function accept() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         map.conLevel["npc_619"].visible = true;
         ToolTipManager.add(map.conLevel["npc_619"],"拉利");
         map.conLevel["npc_619"].buttonMode = true;
         map.conLevel["npc_619"].addEventListener(MouseEvent.CLICK,onNpcClick);
      }
      
      private static function onNpcClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.LALI,["别来叫我……别来问我……别来催我……我……我正在摘艾叶草……"],["说不定能从它的口中知道诅咒之子的下落。","我一会再来吧。"],[function():void
         {
            TasksManager.accept(TaskController_619.TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  ToolTipManager.remove(map.conLevel["npc_619"]);
                  map.conLevel["npc_619"].buttonMode = false;
                  map.conLevel["npc_619"].removeEventListener(MouseEvent.CLICK,onNpcClick);
                  startPro_0();
               }
               else
               {
                  DebugTrace.show("接受任务失败");
               }
            });
         }]);
      }
      
      private static function startPro_0() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         NpcDialog.show(NPC.SEER,["巧克利……"],["（小心……）"],[function():void
         {
            AnimateManager.playMcAnimate(map.conLevel["npc_619"],2,"mc_1",function():void
            {
               NpcDialog.show(NPC.LALI,["哎呀！都怪你啦！我本来都要摘到了！说吧说吧！找我干嘛呢！"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.SEER,["巧克利如果我有一样东西掉到河里了，那怎么找到它呢？"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.LALI,["我才不告诉你呢！不过如果你帮我摘到艾叶的话，我可能会考虑一下。"],["（帮忙摘艾叶）"],[function():void
                     {
                        canCross = true;
                     }]);
                  });
               });
            });
         }]);
      }
      
      public static function onLeafClick() : void
      {
         if(!canCross)
         {
            return;
         }
         canCross = false;
         AnimateManager.playMcAnimate(map.conLevel["npc_619"],3,"mc_2",function():void
         {
            NpcDialog.show(NPC.LALI,["沿着这里走，你就能到达怀特矿场，那里就是奶油湾的下游，你可以去那里看看！哦，对了，别怪没提醒你，那家伙不是好惹的……"],["额……那家伙？会什么样子呢？谢谢！"],[function():void
            {
               map.conLevel["arrow_619"].visible = true;
               TasksManager.complete(TaskController_619.TASK_ID,0,function(param1:Boolean):void
               {
                  if(!param1)
                  {
                     DebugTrace.show("第一步完成失败");
                  }
               });
            }]);
         });
      }
      
      public static function initTask_486(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         map = m;
         map.topLevel["arrow_619"].visible = false;
         if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            removeResource_486();
         }
         else if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_619.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
               }
               else
               {
                  removeResource_486();
               }
            });
         }
         else if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.COMPLETE)
         {
            removeResource_486();
         }
      }
      
      public static function removeResource_486() : void
      {
         DisplayUtil.removeForParent(map.conLevel["stone_0"]);
         map.conLevel["stone_0"] = null;
         DisplayUtil.removeForParent(map.conLevel["stone_1"]);
         map.conLevel["stone_1"] = null;
         DisplayUtil.removeForParent(map.conLevel["boss_619"]);
         map.conLevel["boss_619"] = null;
         DisplayUtil.removeForParent(map.animatorLevel["cord"]);
         map.animatorLevel["cord"] = null;
         DisplayUtil.removeForParent(map.depthLevel["npc_619"]);
         map.depthLevel["npc_619"] = null;
      }
      
      private static function startPro_1() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         NpcDialog.show(NPC.SEER,["咦？对岸好像有个精灵呢！你……好……请……问……"],["（它好像听不到哎）"],[function():void
         {
            NpcDialog.show(NPC.KANGKANG,["……#@……%￥"],["算了！先走过去再说吧！"],[function():void
            {
               initStats();
               timer.addEventListener(TimerEvent.TIMER,onTimer);
               AimatController.addEventListener(AimatEvent.PLAY_END,onAimat);
               MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,onWalk);
               ToolTipManager.add(map.conLevel["stone_0"],"石块");
               map.conLevel["stone_0"].buttonMode = true;
               DragManager.add(map.conLevel["stone_0"],map.conLevel["stone_0"]);
               map.conLevel["stone_0"].addEventListener(MouseEvent.MOUSE_UP,onStoneUp);
               ToolTipManager.add(map.conLevel["stone_1"],"石块");
               map.conLevel["stone_1"].buttonMode = true;
               DragManager.add(map.conLevel["stone_1"],map.conLevel["stone_1"]);
               map.conLevel["stone_1"].addEventListener(MouseEvent.MOUSE_UP,onStoneUp);
            }]);
         }]);
      }
      
      private static function initStats() : void
      {
         timer = new Timer(10000);
         timer.start();
         hasTalk_0 = false;
         hasTalk_1 = false;
         blood = 200;
         bloodBar = map.conLevel["bloodBar"];
         bloodBar.gotoAndStop(blood);
         bloodBar.x = -(bloodBar.width * 0.5);
         bloodBar.y = -60;
         MainManager.actorModel.addChild(bloodBar);
      }
      
      private static function onTimer(param1:TimerEvent) : void
      {
         if(timer.currentCount % 3 == 0)
         {
            map.animatorLevel["river"].gotoAndStop(1);
         }
         else
         {
            map.animatorLevel["river"].gotoAndStop(2);
         }
      }
      
      private static function onAimat(param1:AimatEvent) : void
      {
         if(map.depthLevel["flower"].currentFrame != 2)
         {
            if(Boolean(map.depthLevel["flower"].hitTestPoint(param1.info.endPos.x,param1.info.endPos.y,true)))
            {
               map.depthLevel["flower"].gotoAndStop(2);
            }
         }
      }
      
      private static function onWalk(param1:RobotEvent) : void
      {
         var e:RobotEvent = param1;
         if(map.depthLevel["flower"].currentFrame != 2)
         {
            if(Point.distance(MainManager.actorModel.pos,new Point(308,440)) < 100)
            {
               MainManager.actorModel.stopAutoWalk();
               MainManager.actorModel.hidePet();
               MainManager.actorModel.visible = false;
               AnimateManager.playMcAnimate(map.depthLevel["flower"],3,"mc",function():void
               {
                  blood -= 20;
                  if(checkBlood())
                  {
                     bloodBar.gotoAndStop(blood);
                     MainManager.actorModel.pos = new Point(80,480);
                     if(Boolean(MainManager.actorModel.pet))
                     {
                        MainManager.actorModel.showPet(MainManager.actorModel.pet.info);
                     }
                     MainManager.actorModel.visible = true;
                     NpcDialog.show(NPC.SEER,["……什么……什么情况啊！怎么会这样？难道和这棵草的颜色有关？"],["快用头部射击！"]);
                  }
               });
               return;
            }
         }
         if(map.animatorLevel["river"].currentFrame == 2)
         {
            if(Boolean(map.animatorLevel["riverHit"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y,true)))
            {
               MainManager.actorModel.stopAutoWalk();
               blood -= 30;
               if(checkBlood())
               {
                  bloodBar.gotoAndStop(blood);
                  MainManager.actorModel.pos = new Point(355,345);
                  NpcDialog.show(NPC.SEER,["好危险！差点点就被奶油湾的奶油冲走了……"],["注意河流的流速！"]);
               }
               return;
            }
         }
         if(!hasTalk_0)
         {
            if(Boolean(map.animatorLevel["taskHit"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y,true)))
            {
               MainManager.actorModel.stopAutoWalk();
               NpcDialog.show(NPC.KANGKANG,["嘘……嘘……你不能靠近这里的！有警报！只要你进来，我们的老大就会教训你！"],["你怎么看上去像是在逃难？"],[function():void
               {
                  CartoonManager.play(ClientConfig.getFullMovie("cartoon/task_619"),function():void
                  {
                     NpcDialog.show(NPC.KANGKANG,["我是唯一一个逃出来的精灵，但是我又怕……如果有什么重量的东西可以压住这根绳子，或许会有机会……"],["（看看四周）"],[function():void
                     {
                        hasTalk_0 = true;
                     }]);
                  });
               }]);
               return;
            }
         }
         if(!hasTalk_1)
         {
            if(Boolean(map.animatorLevel["stoneHit"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y,true)))
            {
               MainManager.actorModel.stopAutoWalk();
               if(map.animatorLevel["cord"].currentFrame == 3)
               {
                  NpcDialog.show(NPC.SEER,["你在这里有没有看到过一个昏迷的精灵？它浑身黑色的……"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.KANGKANG,["我们除了工作就是工作，根本不知道外界的事情！哦，对了？好像前几天多了一个工作的家伙，我不知道是不是你要找的那个？"],null,null,false,function():void
                     {
                        TasksManager.complete(TaskController_619.TASK_ID,1,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              hasTalk_1 = true;
                              map.topLevel["arrow_619"].visible = true;
                           }
                        });
                     });
                  });
               }
               else
               {
                  AnimateManager.playMcAnimate(map.conLevel["boss_619"],2,"mc",function():void
                  {
                     map.conLevel["boss_619"].gotoAndStop(1);
                     blood -= 50;
                     if(checkBlood())
                     {
                        bloodBar.gotoAndStop(blood);
                        MainManager.actorModel.pos = new Point(590,400);
                        NpcDialog.show(NPC.KANGKANG,["小心！当心惊扰德拉萨！周围或许会有什么能够压住警报线！我到底是逃还是不逃呢……"]);
                     }
                  });
               }
            }
         }
      }
      
      private static function onStoneUp(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         if(Boolean(map.animatorLevel["stoneHit"].hitTestPoint(e.currentTarget.x,e.currentTarget.y,true)))
         {
            e.currentTarget.visible = false;
            if(map.animatorLevel["cord"].currentFrame == 1)
            {
               AnimateManager.playMcAnimate(map.animatorLevel["cord"],2,"mc_1",function():void
               {
               });
            }
            else if(map.animatorLevel["cord"].currentFrame == 2)
            {
               AnimateManager.playMcAnimate(map.animatorLevel["cord"],3,"mc_2",function():void
               {
               });
            }
         }
      }
      
      private static function checkBlood() : Boolean
      {
         if(blood > 0)
         {
            return true;
         }
         NpcDialog.show(NPC.SEER,["啊……机械铠甲已经有点受损了！先撤退！！"],["稍作调整再进来吧！！"],[function():void
         {
            MapManager.changeMap(484);
         }]);
         return false;
      }
      
      public static function initTask_487(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         map = m;
         if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            removeResource_487();
         }
         else if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_619.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  startPro_2();
               }
               else
               {
                  removeResource_487();
               }
            });
         }
         else if(TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.COMPLETE)
         {
            removeResource_487();
         }
      }
      
      public static function removeResource_487() : void
      {
         DisplayUtil.removeForParent(map.depthLevel["pet_0"]);
         map.depthLevel["pet_0"] = null;
         DisplayUtil.removeForParent(map.depthLevel["pet_1"]);
         map.depthLevel["pet_1"] = null;
         DisplayUtil.removeForParent(map.depthLevel["pet_2"]);
         map.depthLevel["pet_2"] = null;
         DisplayUtil.removeForParent(map.depthLevel["pet_3"]);
         map.depthLevel["pet_3"] = null;
      }
      
      private static function startPro_2() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         NpcDialog.show(NPC.SEER,["要不一个个问过来吧，总会有线索的！"],["（分别点击他们）"],[function():void
         {
            var _loc1_:* = 0;
            while(_loc1_ < 4)
            {
               ToolTipManager.add(map.depthLevel["pet_" + _loc1_],"苦工");
               map.depthLevel["pet_" + _loc1_].buttonMode = true;
               map.depthLevel["pet_" + _loc1_].addEventListener(MouseEvent.CLICK,onPetClick);
               _loc1_++;
            }
         }]);
      }
      
      private static function onPetClick(param1:MouseEvent) : void
      {
         var i:int = 0;
         i = 0;
         var e:MouseEvent = param1;
         var mc:MovieClip = e.currentTarget as MovieClip;
         ToolTipManager.remove(mc);
         mc.buttonMode = false;
         mc.removeEventListener(MouseEvent.CLICK,onPetClick);
         i = int(mc.name.split("_")[1]);
         AnimateManager.playMcAnimate(mc,2,"mc_1",function():void
         {
            switch(i)
            {
               case 0:
                  NpcDialog.show(NPC.DBY_KANGKANG,["吃的好……睡的好……牙才好……咦？我看你牙不咋地……"],["你有看到一个黑色的精灵吗？看起来和你们不一样？"],[function():void
                  {
                     NpcDialog.show(NPC.DBY_KANGKANG,["俺看谁，谁都和我不一样呢！因为我有大板牙我怕谁！你说的是黑色的小东西？他可能在中间挖矿。"],["好，谢谢！"]);
                  }]);
                  break;
               case 1:
                  NpcDialog.show(NPC.MAZI_KANGKANG,["好了好了！马上就完工了，不要催我了！你催的我头越来越小……"],["找错了……不好意思……"]);
                  break;
               case 2:
                  NpcDialog.show(NPC.KSW_KANGKANG,["干啥呢！人家干活干的好好的！你唧唧歪歪个啥！"],["不……不好意思！我找错了……"]);
                  break;
               case 3:
                  NpcDialog.show(NPC.KAZI,["你……你想要干什么……"],["我不是要伤害你！别紧张……"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_619"),function():void
                     {
                        map.depthLevel["pet_3"].visible = false;
                        NpcDialog.show(NPC.KANGKANG,["哥们！先不说了，谢谢你救了我们，我们先开溜了！救命之恩以后报答你……"],["……"],[function():void
                        {
                           var t:* = undefined;
                           t = undefined;
                           var j:* = 0;
                           while(j < 3)
                           {
                              map.depthLevel["pet_" + j].gotoAndStop(3);
                              j++;
                           }
                           LevelManager.closeMouseEvent();
                           t = setTimeout(function():void
                           {
                              clearTimeout(t);
                              NpcDialog.show(NPC.SEER,["诅咒之子……我刚才明明看到是他救了我们的……但是它所释放出来的黑色能量实在太恐怖了！去问问博士吧……"],["（返回实验室）"],[function():void
                              {
                                 TasksManager.complete(TaskController_619.TASK_ID,2,function(param1:Boolean):void
                                 {
                                    if(param1)
                                    {
                                       MapManager.changeMap(5);
                                    }
                                 });
                              }]);
                           },1000);
                        }]);
                     });
                  }]);
            }
         });
      }
      
      public static function destroy() : void
      {
         var _loc1_:int = 0;
         OgreController.isShow = true;
         ToolBarController.showOrHideAllUser(true);
         if(Boolean(map))
         {
            if(MapManager.currentMap.id == 484)
            {
               if(Boolean(map.conLevel["npc_619"]))
               {
                  ToolTipManager.remove(map.conLevel["npc_619"]);
                  map.conLevel["npc_619"].removeEventListener(MouseEvent.CLICK,onNpcClick);
               }
            }
            else if(MapManager.currentMap.id == 486)
            {
               AimatController.removeEventListener(AimatEvent.PLAY_END,onAimat);
               MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalk);
               if(Boolean(timer))
               {
                  timer.removeEventListener(TimerEvent.TIMER,onTimer);
               }
               if(Boolean(map.conLevel["stone_0"]))
               {
                  ToolTipManager.remove(map.conLevel["stone_0"]);
                  DragManager.remove(map.conLevel["stone_0"]);
                  map.conLevel["stone_0"].removeEventListener(MouseEvent.MOUSE_UP,onStoneUp);
               }
               if(Boolean(map.conLevel["stone_1"]))
               {
                  ToolTipManager.remove(map.conLevel["stone_1"]);
                  DragManager.remove(map.conLevel["stone_1"]);
                  map.conLevel["stone_1"].removeEventListener(MouseEvent.MOUSE_UP,onStoneUp);
               }
               if(Boolean(bloodBar))
               {
                  DisplayUtil.removeForParent(bloodBar);
                  bloodBar = null;
               }
            }
            else if(MapManager.currentMap.id == 487)
            {
               _loc1_ = 0;
               while(_loc1_ < 4)
               {
                  if(Boolean(map.depthLevel["pet_" + _loc1_]))
                  {
                     ToolTipManager.remove(map.depthLevel["pet_" + _loc1_]);
                     map.depthLevel["pet_" + _loc1_].removeEventListener(MouseEvent.CLICK,onPetClick);
                  }
                  _loc1_++;
               }
            }
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         map = param1;
         if(MapManager.currentMap.id == 484)
         {
            removeResource_484();
         }
         if(MapManager.currentMap.id == 486)
         {
            initTask_486(map);
         }
         if(MapManager.currentMap.id == 487)
         {
            initTask_487(map);
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 484)
         {
            initTask_484(param1);
         }
         if(MapManager.currentMap.id == 486)
         {
            initTask_486(param1);
         }
         if(MapManager.currentMap.id == 487)
         {
            initTask_487(param1);
         }
         if(MapManager.currentMap.id == 5 && TasksManager.getTaskStatus(TaskController_619.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TaskController_619.startPro();
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 484)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 486)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 487)
         {
            destroy();
         }
         map = null;
      }
   }
}

