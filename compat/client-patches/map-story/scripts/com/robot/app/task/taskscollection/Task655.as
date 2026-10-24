package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.KTool;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import flash.utils.*;
   import org.taomee.debug.*;
   import org.taomee.utils.*;
   
   public class Task655 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var pirateArr:Array;
      
      private static var fireArr:Array;
      
      private static var nTimer:uint;
      
      private static var gamePanel:MovieClip;
      
      private static var taskStep:int = -100;
      
      private static var seerPassed:Boolean = false;
      
      public function Task655()
      {
         super();
      }
      
      public static function initTaskForMap447(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         var nRet:uint = uint(TasksManager.getTaskStatus(653));
         if(nRet == TasksManager.COMPLETE)
         {
            _map = map;
            nRet = uint(TasksManager.getTaskStatus(TaskController_655.TASK_ID));
            if(nRet == TasksManager.UN_ACCEPT)
            {
               taskStep = -1;
               ToolBarController.showOrHideAllUser(false);
               _map.conLevel["kazi2MC"].buttonMode = true;
               _map.conLevel["kazi2MC"].gotoAndStop(2);
               _map.conLevel["kazi2MC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
            }
            else if(nRet == TasksManager.ALR_ACCEPT)
            {
               ToolBarController.showOrHideAllUser(false);
               TasksManager.getProStatusList(TaskController_655.TASK_ID,function(param1:Array):void
               {
                  if(!param1[0])
                  {
                     taskStep = 0;
                     gotoStep1();
                  }
               });
            }
         }
      }
      
      private static function kaziClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(taskStep == -1)
         {
            NpcDialog.show(NPC.KAXIUSI,[MainManager.actorInfo.formatNick + "，我们要抓紧时间了，我的父亲一定在山上面。"],["恩，出发！","我再四处看看！"],[function():void
            {
               TasksManager.accept(TaskController_655.TASK_ID,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     DebugTrace.show("任务接取成功");
                     taskStep = 0;
                     gotoStep1();
                  }
               });
            }]);
         }
         else if(taskStep == 0)
         {
            gotoStep1();
         }
      }
      
      private static function gotoStep1() : void
      {
         _map.conLevel["kazi2MC"].removeEventListener(MouseEvent.CLICK,kaziClickHandler);
         AnimateManager.playMcAnimate(_map.conLevel["kazi2MC"],3,"mc3",function():void
         {
            _map.conLevel["nextMapHit"].visible = true;
         });
      }
      
      public static function initTaskForMap448(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         var nRet:uint = uint(TasksManager.getTaskStatus(TaskController_655.TASK_ID));
         if(nRet == TasksManager.ALR_ACCEPT)
         {
            KTool.setActorVisible(false);
            OgreController.isShow = false;
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_655.TASK_ID,function(param1:Array):void
            {
               var a:Array = param1;
               if(!a[0])
               {
                  taskStep = 0;
                  TasksManager.complete(TaskController_655.TASK_ID,0,function(param1:Boolean):void
                  {
                     if(param1)
                     {
                        DebugTrace.show("第一步完成");
                        taskStep = 1;
                        gotoStep2();
                     }
                  });
               }
               else if(Boolean(a[0]) && !a[1])
               {
                  taskStep = 1;
                  gotoStep2();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && !a[2])
               {
                  taskStep = 2;
                  gotoStep3();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && !a[3])
               {
                  taskStep = 3;
                  gotoStep4();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && !a[4])
               {
                  taskStep = 4;
                  gotoStep5();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && Boolean(a[4]) && !a[5])
               {
                  taskStep = 5;
                  gotoStep6();
               }
            });
         }
         else if(nRet == TasksManager.UN_ACCEPT)
         {
            DisplayUtil.removeForParent(_map.conLevel["introMC"]);
         }
         else if(nRet == TasksManager.COMPLETE)
         {
            DisplayUtil.removeForParent(_map.conLevel["introMC"]);
         }
      }
      
      private static function LockSeer(param1:Boolean) : void
      {
         _map.conLevel["holeHit"].mouseChildren = _map.conLevel["holeHit"].mouseEnabled = !param1;
         MapManager.currentMap.spaceLevel.mouseChildren = MapManager.currentMap.spaceLevel.mouseEnabled = !param1;
      }
      
      private static function gotoStep2() : void
      {
         LockSeer(true);
         NpcDialog.show(NPC.KAXIUSI,["小XIN，你看！这里已经完全变成了海盗的精灵研究基地，他们肯定正进行着邪恶的计划！"],["恩，是啊！这里对精灵们来说简直就是地狱！"],[function():void
         {
            AnimateManager.playMcAnimate(_map.conLevel["introMC"],1,"mc1",function():void
            {
               _map.conLevel["introMC"].gotoAndStop(2);
               KTool.setActorVisible(true);
               NpcDialog.show(NPC.KAXIUSI,["天呐！那些炫彩山的精灵正被海盗进行实验呢！我们必须解救它们！"],["可恶的海盗集团！"],[function():void
               {
                  NpcDialog.show(NPC.PIRATE,["啊哈！这些家伙居然可以闯到这里来！ XIN，你带着朋友一起来羊入虎口了？哈哈哈！"],["海盗！停止你们愚蠢的行动吧！"],[function():void
                  {
                     NpcDialog.show(NPC.PIRATE,["哈哈哈！真是可笑，凭你们俩就想阻止我们的计划！兄弟们上！"],["（用头部射击攻击海盗）"],[function():void
                     {
                        pirateArr = [_map.conLevel["introMC"]["pirate1MC"],_map.conLevel["introMC"]["pirate2MC"],_map.conLevel["introMC"]["pirate3MC"]];
                        AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
                     }]);
                  }]);
               }]);
            });
         }]);
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var mc:MovieClip = null;
         mc = null;
         var evt:AimatEvent = param1;
         if(Boolean(pirateArr))
         {
            for each(mc in pirateArr)
            {
               if(mc.hitTestPoint(evt.info.endPos.x,evt.info.endPos.y))
               {
                  AnimateManager.playMcAnimate(mc,2,"mc2",function():void
                  {
                     pirateArr.splice(pirateArr.indexOf(mc),1);
                     DisplayUtil.removeForParent(mc);
                     if(pirateArr.length == 0)
                     {
                        AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
                        _map.conLevel["introMC"].gotoAndStop(3);
                        NpcDialog.show(NPC.SEER,["这些实验容器总算是停止工作了！"],null,null,false,function():void
                        {
                           TasksManager.complete(TaskController_655.TASK_ID,1,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 DebugTrace.show("第二步完成");
                                 taskStep = 2;
                                 gotoStep3();
                              }
                           });
                        });
                     }
                  });
                  break;
               }
            }
         }
      }
      
      private static function gotoStep3() : void
      {
         LockSeer(true);
         KTool.setActorVisible(false);
         AnimateManager.playMcAnimate(_map.conLevel["introMC"],4,"mc4",function():void
         {
            NpcDialog.show(NPC.KAXIUSI,["是谁的声音！难道是…难道是我的父亲在呼唤我吗？"],["（点击发出呼唤的装置）"],[function():void
            {
               _map.conLevel["machineHit"].buttonMode = true;
               _map.conLevel["machineHit"].addEventListener(MouseEvent.CLICK,machineClick);
            }]);
         });
      }
      
      private static function machineClick(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         _map.conLevel["machineHit"].buttonMode = false;
         _map.conLevel["machineHit"].mouseChildren = false;
         _map.conLevel["machineHit"].mouseEnabled = false;
         AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_655_1"),function():void
         {
            _map.conLevel["introMC"].gotoAndStop(5);
            KTool.setActorVisible(true);
            NpcDialog.show(NPC.NEW_ALLISON,["哈哈哈！上当了吧！我们的最新研究成果一定会让你记忆深刻的！哈哈哈！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.SEER,["卡茨！你没事吧！艾利逊我和你势不两立！"],["哈哈哈，就凭你！"],[function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["introMC"],6,"mc6",function():void
                  {
                     NpcDialog.show(NPC.NEW_ZOG,["好久不见啊！XIN，这次你休想从我手中逃脱！"],["哈哈！我脑海里就没有“逃跑”这个词！"],[function():void
                     {
                        NpcDialog.show(NPC.NEW_ZOG,["好！你就尝尝烈火的滋味吧！"],null,null,false,function():void
                        {
                           TasksManager.complete(TaskController_655.TASK_ID,2,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 DebugTrace.show("第三步完成");
                                 taskStep = 3;
                                 gotoStep4();
                              }
                           });
                        });
                     }]);
                  });
               }]);
            });
         });
      }
      
      private static function gotoStep4() : void
      {
         var _loc1_:MovieClip = null;
         LockSeer(false);
         MainManager.actorModel.pos = new Point(220,340);
         KTool.setActorVisible(true);
         _map.conLevel["introMC"].gotoAndStop(7);
         fireArr = [];
         var _loc2_:int = 1;
         while(_loc2_ <= 9)
         {
            _loc1_ = _map.conLevel["fire" + _loc2_ + "MC"];
            _loc1_.mouseEnabled = false;
            _loc1_.mouseChildren = false;
            _loc1_.gotoAndStop(2);
            fireArr.push(_loc1_);
            _loc2_++;
         }
         nTimer = setInterval(randomFire,5000);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,walkHandler);
      }
      
      private static function randomFire() : void
      {
         var _loc1_:MovieClip = null;
         var _loc2_:uint = 0;
         var _loc3_:Array = [0,6,4,5,8];
         var _loc4_:Array = [3,6,7,2,8];
         var _loc5_:Array = Math.random() * 2 >> 0 == 1 ? _loc3_ : _loc4_;
         if(Boolean(fireArr))
         {
            for each(_loc1_ in fireArr)
            {
               _loc2_ = uint(fireArr.indexOf(_loc1_));
               if(_loc5_.indexOf(_loc2_) >= 0)
               {
                  _loc1_.gotoAndStop(2);
               }
               else
               {
                  _loc1_.gotoAndStop(1);
               }
            }
         }
      }
      
      private static function destroyFires() : void
      {
         var _loc1_:MovieClip = null;
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,walkHandler);
         if(nTimer > 0)
         {
            clearInterval(nTimer);
            nTimer = 0;
         }
         if(Boolean(fireArr))
         {
            for each(_loc1_ in fireArr)
            {
               _loc1_.gotoAndStop(1);
            }
            fireArr.length = 0;
            fireArr = null;
         }
      }
      
      private static function walkHandler(param1:RobotEvent) : void
      {
         var _loc2_:MovieClip = null;
         if(Boolean(_map.conLevel["fireline1Hit"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y)))
         {
            seerPassed = false;
         }
         else if(Boolean(_map.conLevel["fireline2Hit"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y)) && taskStep == 3)
         {
            seerPassedFire();
            seerPassed = true;
         }
         if(Boolean(fireArr))
         {
            for each(_loc2_ in fireArr)
            {
               if(_loc2_.currentFrame == 2)
               {
                  if(_loc2_.hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y))
                  {
                     DebugTrace.show("碰到了火焰");
                     MainManager.actorModel.stop();
                     MainManager.actorModel.pos = seerPassed ? new Point(730,350) : new Point(220,340);
                     NpcDialog.show(NPC.SEER,["哇！好烫好烫！看来要闯过这个机关还是有一定难度的！"],["仔细观察火焰阵的规律！"]);
                     return;
                  }
               }
            }
         }
      }
      
      private static function seerPassedFire() : void
      {
         if(seerPassed)
         {
            return;
         }
         destroyFires();
         NpcDialog.show(NPC.SEER,["好险！差点我就要被烤焦了！"],null,null,false,function():void
         {
            NpcDialog.show(NPC.NEW_ZOG,["什么！！！火焰阵居然也抵挡不住你，呵呵！既然是这样那我们只好用绝招了！"],["看你们还能有什么绝招！"],[function():void
            {
               NpcDialog.show(NPC.NEW_ZOG,["艾利逊！！！你小子又在睡觉啊！听着，这里交给你了，我先和研究人员撤退，山顶上的事才是最重要的！"],null,null,false,function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["introMC"],8,"mc8",function():void
                  {
                     TasksManager.complete(TaskController_655.TASK_ID,3,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           DebugTrace.show("第四步完成");
                           taskStep = 4;
                           gotoStep5();
                        }
                     });
                  });
               });
            }]);
         });
      }
      
      private static function gotoStep5() : void
      {
         seerPassed = true;
         MainManager.actorModel.pos = new Point(730,350);
         KTool.setActorVisible(true);
         _map.conLevel["introMC"].gotoAndStop(9);
         NpcDialog.show(NPC.NEW_ALLISON,["展现我实力的时刻了！接招吧！小个子，呵呵呵！"],["看你能耍出什么花样！"],[function():void
         {
            NpcDialog.show(NPC.NEW_ALLISON,["我要开启引爆装置炸飞你们！啊哈哈！"],["糟了！如果炸弹装置被开启，那这些精灵都……"],[function():void
            {
               AnimateManager.playMcAnimate(_map.conLevel["introMC"],10,"mc10",function():void
               {
                  NpcDialog.show(NPC.SEER,["卡茨！卡茨！快醒醒啊！"],["可谁都没有想到此时卡茨已经..."],[function():void
                  {
                     _map.conLevel["introMC"].gotoAndStop(11);
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_655_2"),function():void
                     {
                        NpcDialog.show(NPC.SEER,["你刚刚怎么了，看上去好像变了一个人，好可怕啊！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.KAXIUSI,["是那个神秘的声音给了我力量！"],null,null,false,function():void
                           {
                              NpcDialog.show(NPC.KAXIUSI,["我们要抓紧时间解除引爆装置。"],["点击装置显示屏"],[function():void
                              {
                                 TasksManager.complete(TaskController_655.TASK_ID,4,function(param1:Boolean):void
                                 {
                                    if(param1)
                                    {
                                       DebugTrace.show("第五步完成");
                                       taskStep = 5;
                                       gotoStep6();
                                    }
                                 });
                              }]);
                           });
                        });
                     });
                  }]);
               });
            }]);
         }]);
      }
      
      private static function gotoStep6() : void
      {
         seerPassed = true;
         KTool.setActorVisible(true);
         MainManager.actorModel.pos = new Point(730,350);
         _map.conLevel["introMC"].gotoAndStop(11);
         _map.conLevel["gameHit"].buttonMode = true;
         _map.conLevel["gameHit"].addEventListener(MouseEvent.CLICK,showGamePanel);
         _map.conLevel["pointMC"].visible = true;
      }
      
      private static function showGamePanel(param1:MouseEvent) : void
      {
         if(!gamePanel)
         {
            _map.conLevel["pointMC"].visible = false;
            gamePanel = _map.topLevel["gamePanel"];
            gamePanel.visible = true;
            gamePanel.startPlay();
            gamePanel["closeBTN"].addEventListener(MouseEvent.CLICK,gameHandler);
            gamePanel.addEventListener("success",gameHandler);
            gamePanel.addEventListener("failed",gameHandler);
         }
      }
      
      private static function gameHandler(param1:Event) : void
      {
         if(param1.type == MouseEvent.CLICK)
         {
            destroyGamePanel();
            _map.conLevel["pointMC"].visible = true;
         }
         else if(param1.type == "success")
         {
            _map.conLevel["gameHit"].mouseChildren = false;
            _map.conLevel["gameHit"].mouseEnabled = false;
            destroyGamePanel();
            gameSuccessed();
         }
         else if(param1.type == "failed")
         {
            destroyGamePanel();
            _map.conLevel["pointMC"].visible = true;
            NpcDialog.show(NPC.SEER,["哎呀！看来我还要再试试！"],["再继续尝试"]);
         }
      }
      
      private static function gameSuccessed() : void
      {
         NpcDialog.show(NPC.SEER,["哈哈，终于成功啦！我是天才！"],["卡茨，那边还有一只精灵被关着!"],[function():void
         {
            AnimateManager.playMcAnimate(_map.conLevel["introMC"],12,"mc12",function():void
            {
               AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_655_3"),function():void
               {
                  _map.conLevel["introMC"].gotoAndStop(13);
                  NpcDialog.show(NPC.KACI_FATHER,["孩子！这一切的都是因为山神！海盗快要闯入山顶的圣神禁地啦！"],["山神？圣神禁地？父亲，你在说什么啊？"],[function():void
                  {
                     NpcDialog.show(NPC.KACI_FATHER,["海盗知道了炫彩山的传说，他们就是为了获取山神的能量而来！而现在正是山神的休眠期，这也是入侵的最佳时机！"],["难道一直在我身体里响起的声音也是……"],[function():void
                     {
                        NpcDialog.show(NPC.KACI_FATHER,["你身体里的能量就是命运的轮回！没时间解释那么多了，我先把试验容器的精灵救出来，你赶紧到山顶保护山神，绝对不能让海盗的计划得逞！"],["我知道了！立刻出发！"],[function():void
                        {
                           TasksManager.completeFinal(TaskController_655.TASK_ID,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 DebugTrace.show("任务完成");
                                 taskStep = 6;
                                 OgreController.isShow = true;
                                 ToolBarController.showOrHideAllUser(true);
                                 Task658.initTaskForMap448(_map);
                              }
                           });
                        }]);
                     }]);
                  }]);
               });
            });
         }]);
      }
      
      private static function destroyGamePanel() : void
      {
         if(Boolean(gamePanel))
         {
            gamePanel.visible = false;
            gamePanel.stopPlay();
            gamePanel["closeBTN"].removeEventListener(MouseEvent.CLICK,gameHandler);
            gamePanel.removeEventListener("success",gameHandler);
            gamePanel.removeEventListener("failed",gameHandler);
            gamePanel = null;
         }
      }
      
      public static function destroy() : void
      {
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 447)
         {
            ToolBarController.showOrHideAllUser(true);
            _map.conLevel["kazi2MC"].removeEventListener(MouseEvent.CLICK,kaziClickHandler);
         }
         else if(MapManager.currentMap.id == 448)
         {
            if(nTimer > 0)
            {
               clearInterval(nTimer);
            }
            OgreController.isShow = true;
            ToolBarController.showOrHideAllUser(true);
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            destroyFires();
            destroyGamePanel();
            _map.conLevel["machineHit"].removeEventListener(MouseEvent.CLICK,machineClick);
            _map.conLevel["gameHit"].removeEventListener(MouseEvent.CLICK,showGamePanel);
            KTool.setActorVisible(true);
            LockSeer(false);
         }
         _map = null;
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 447)
         {
            initTaskForMap447(param1);
         }
         if(MapManager.currentMap.id == 448)
         {
            initTaskForMap448(param1);
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 447)
         {
         }
         if(MapManager.currentMap.id == 448)
         {
         }
      }
      
      override public function destoryForMap() : void
      {
         destroy();
      }
   }
}

