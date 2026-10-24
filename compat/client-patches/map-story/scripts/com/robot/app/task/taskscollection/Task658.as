package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import org.taomee.manager.EventManager;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.MapLibManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import org.taomee.debug.*;
   import org.taomee.utils.*;
   
   public class Task658 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var bloodMc:MovieClip;
      
      private static var stoneMC:MovieClip;
      
      private static var taskStep:int = -100;
      
      private static var bossIDArr:Array = [743,772];
      
      private static var bossID:uint = 0;
      
      public function Task658()
      {
         super();
      }
      
      public static function completeTask() : void
      {
         if(TasksManager.getTaskStatus(TaskController_658.TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            return;
         }
         TasksManager.getProStatusList(TaskController_658.TASK_ID,function(param1:Array):void
         {
            var progress:Array = param1;
            if(Boolean(TasksManager.getTaskStatus(TaskController_658.TASK_ID) != TasksManager.ALR_ACCEPT || progress.length < 4 || !progress[0] || !progress[1] || !progress[2] || progress[3]) || Boolean(MapManager.currentMap == null) || MapManager.currentMap.id != 5)
            {
               return;
            }
            NpcDialog.show(NPC.SEER,["博士，告诉你个好消息，我和卡修斯终于解救了炫彩山，而且还遇到了神秘精灵始祖灵兽呢！哈哈！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.DOCTOR,["什么！难道传说是真的！始祖灵兽复苏了？看来三系灵兽都到齐了！如果是这样的话，我又有事做了！呵呵！"],["博士你在说什么啊！"],[function():void
               {
                  NpcDialog.show(NPC.DOCTOR,["呵呵！让我先研究一下，等我的消息吧！相信你一定会高兴的！"],["恩，好的！博士怎么越来越神秘了！"],[function():void
                  {
                     TasksManager.completeFinal(TaskController_658.TASK_ID,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           DebugTrace.show("任务完成");
                           taskStep = 4;
                        }
                     });
                  }]);
               }]);
            });
         });
      }
      
      public static function initTaskForMap448(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         var nRet:uint = uint(TasksManager.getTaskStatus(655));
         if(nRet != TasksManager.COMPLETE)
         {
            return;
         }
         _map = map;
         nRet = uint(TasksManager.getTaskStatus(TaskController_658.TASK_ID));
         if(nRet == TasksManager.UN_ACCEPT)
         {
            taskStep = -1;
            ToolBarController.showOrHideAllUser(false);
            _map.conLevel["nextMapHit"].visible = false;
            _map.conLevel["kazi2MC"].buttonMode = true;
            _map.conLevel["kazi2MC"].gotoAndStop(2);
            _map.conLevel["kazi2MC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
         }
         else if(nRet == TasksManager.ALR_ACCEPT)
         {
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_658.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  taskStep = 0;
                  gotoStep1();
               }
            });
         }
      }
      
      private static function kaziClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(taskStep == -1)
         {
            NpcDialog.show(NPC.KAXIUSI,["小XIN，难道炫彩山山顶就是所谓的圣神禁地？ 不管如何，我们要赶紧出发了！"],["嗯，绝不能让海盗的阴谋得逞！","等等，我先休息一会！"],[function():void
            {
               TasksManager.accept(TaskController_658.TASK_ID,function(param1:Boolean):void
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
      
      public static function initTaskForMap449(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         var nRet:uint = uint(TasksManager.getTaskStatus(TaskController_658.TASK_ID));
         if(nRet == TasksManager.ALR_ACCEPT)
         {
            OgreController.isShow = false;
            ToolBarController.showOrHideAllUser(false);
            _map.conLevel["holeHit"].visible = false;
            TasksManager.getProStatusList(TaskController_658.TASK_ID,function(param1:Array):void
            {
               var a:Array = param1;
               if(!a[0])
               {
                  taskStep = 0;
                  TasksManager.complete(TaskController_658.TASK_ID,0,function(param1:Boolean):void
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
            });
         }
         else
         {
            restoreFinishedMap449(_map);
         }
         _map.conLevel["pirateMC"].mouseChildren = false;
         _map.conLevel["pirateMC"].mouseEnabled = false;
      }
      
      private static function restoreFinishedMap449(param1:BaseMapProcess) : void
      {
         param1.conLevel["holeHit"].visible = true;
         param1.conLevel["mainMC"].gotoAndStop(12);
         param1.conLevel["stone1"].visible = false;
         param1.conLevel["stone2"].visible = false;
         param1.conLevel["stone3"].visible = false;
         param1.conLevel["pirateMC"]["pirate1"].gotoAndStop(4);
         param1.conLevel["pirateMC"]["pirate2"].gotoAndStop(4);
         param1.conLevel["pirateMC"]["pirate3"].gotoAndStop(4);
         param1.conLevel["pirateMC"].mouseChildren = false;
         param1.conLevel["pirateMC"].mouseEnabled = false;
         DisplayUtil.removeForParent(param1.typeLevel["pirMC"]);
         DisplayUtil.removeForParent(param1.animatorLevel["boatMC"]);
         MapManager.currentMap.makeMapArray();
      }
      
      private static function gotoStep2() : void
      {
         NpcDialog.show(NPC.KAXIUSI,["混蛋！山顶已经完全被海盗占领了，他们围着敲打的那尊石像我似乎在哪里见过，好熟悉啊..."],["石像..."],[function():void
         {
            NpcDialog.show(NPC.PIRATE,["谁！是谁在那儿！居然敢闯到这来，不想活命啦！"],["佐格！决战的时刻到了！"],[function():void
            {
               NpcDialog.show(NPC.NEW_ZOG,["艾利逊这个蠢货，竟然让他们逃脱了！机枪队赶紧给我上！"],null,null,false,function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["pirateMC"]["pirate1"],1,"mc1",function():void
                  {
                     AnimateManager.playMcAnimate(_map.conLevel["pirateMC"]["pirate2"],1,"mc1",function():void
                     {
                        AnimateManager.playMcAnimate(_map.conLevel["pirateMC"]["pirate3"],1,"mc1",function():void
                        {
                           NpcDialog.show(NPC.KAXIUSI,["小心，海盗的机枪攻势很危险！"],["我们要想办法躲避海盗的射击（利用附近的石块）"],[function():void
                           {
                              _map.conLevel["pirateMC"]["pirate1"].gotoAndStop(2);
                              _map.conLevel["pirateMC"]["pirate2"].gotoAndStop(2);
                              _map.conLevel["pirateMC"]["pirate3"].gotoAndStop(2);
                              bloodMc = MapLibManager.getMovieClip("bloodMc");
                              bloodMc.x -= 30;
                              bloodMc.y -= MainManager.actorModel.height;
                              bloodMc.name = "bloodMc";
                              bloodMc.data = {"blood":100};
                              bloodMc["perTxt"].text = bloodMc.data["blood"] + "/" + bloodMc.data["blood"];
                              MainManager.actorModel.sprite.addChild(bloodMc);
                              _map.conLevel["pirateMC"]["pirate1"].addEventListener("fire",fireHandler);
                              _map.conLevel["pirateMC"]["pirate2"].addEventListener("fire",fireHandler);
                              _map.conLevel["pirateMC"]["pirate3"].addEventListener("fire",fireHandler);
                              _map.conLevel["stone1"].addEventListener(MouseEvent.CLICK,stoneHandler);
                              _map.conLevel["stone2"].addEventListener(MouseEvent.CLICK,stoneHandler);
                              _map.conLevel["stone3"].addEventListener(MouseEvent.CLICK,stoneHandler);
                              _map.conLevel["hit1MC"].addEventListener(MouseEvent.CLICK,pirateHandler);
                              _map.conLevel["hit2MC"].addEventListener(MouseEvent.CLICK,pirateHandler);
                              _map.conLevel["hit3MC"].addEventListener(MouseEvent.CLICK,pirateHandler);
                           }]);
                        });
                     });
                  });
               });
            }]);
         }]);
      }
      
      private static function fireHandler(param1:Event) : void
      {
         var evt:Event = param1;
         var mc:MovieClip = evt.currentTarget as MovieClip;
         var fireMC:MovieClip = mc.getChildByName("fireMC") as MovieClip;
         if(Boolean(bloodMc) && fireMC.hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y))
         {
            DebugTrace.show("有攻击动作发生");
            if(bloodMc.data["blood"] > 0)
            {
               bloodMc.data["blood"] -= 20;
               if(bloodMc.data["blood"] < 0)
               {
                  bloodMc.data["blood"] = 0;
               }
               bloodMc["perTxt"].text = bloodMc.data["blood"] + "/" + 100;
               bloodMc["perMc"].gotoAndStop(uint(101 - bloodMc.data["blood"]));
               if(bloodMc.data["blood"] <= 0)
               {
                  NpcDialog.show(NPC.SEER,["哎呀！海盗的火力很猛啊！我们要坚持住！"],["躲避海盗的攻击（利用附近的石块）"],[function():void
                  {
                     bloodMc.data["blood"] = 100;
                     bloodMc["perTxt"].text = bloodMc.data["blood"] + "/" + 100;
                     bloodMc["perMc"].gotoAndStop(uint(101 - bloodMc.data["blood"]));
                  }]);
               }
            }
         }
      }
      
      private static function stoneHandler(param1:MouseEvent) : void
      {
         if(stoneMC == null)
         {
            stoneMC = param1.currentTarget as MovieClip;
            stoneMC.mouseEnabled = false;
            stoneMC.mouseChildren = false;
            stoneMC.startDrag();
         }
      }
      
      private static function pirateHandler(param1:MouseEvent) : void
      {
         var hitMC:MovieClip = null;
         var pirateMC:MovieClip = null;
         var evt:MouseEvent = param1;
         if(Boolean(stoneMC))
         {
            stoneMC.stopDrag();
            stoneMC.visible = false;
            stoneMC = null;
            hitMC = evt.currentTarget as MovieClip;
            hitMC.visible = false;
            if(hitMC.name == "hit1MC")
            {
               pirateMC = _map.conLevel["pirateMC"]["pirate1"];
            }
            else if(hitMC.name == "hit2MC")
            {
               pirateMC = _map.conLevel["pirateMC"]["pirate2"];
            }
            else if(hitMC.name == "hit3MC")
            {
               pirateMC = _map.conLevel["pirateMC"]["pirate3"];
            }
            pirateMC.gotoAndStop(3);
            if(!_map.conLevel["stone1"].visible && !_map.conLevel["stone2"].visible && !_map.conLevel["stone3"].visible)
            {
               if(Boolean(bloodMc))
               {
                  DisplayUtil.removeForParent(bloodMc);
                  bloodMc = null;
               }
               NpcDialog.show(NPC.SEER,["总算是搞定了！！"],null,null,false,function():void
               {
                  KTool.getFrameMc(_map.conLevel["mainMC"],2,"mc2",function(param1:DisplayObject):void
                  {
                     var o:DisplayObject = param1;
                     var mc:MovieClip = o as MovieClip;
                     AnimateManager.playMcAnimate(mc,1,"",function():void
                     {
                        TasksManager.complete(TaskController_658.TASK_ID,1,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              DebugTrace.show("第二步完成");
                              taskStep = 2;
                              gotoStep3();
                           }
                        });
                     });
                  });
               });
            }
         }
      }
      
      private static function gotoStep3() : void
      {
         var _loc1_:int = -1;
         if(Boolean(FightManager.isWin) && bossID != 0)
         {
            _loc1_ = int(bossIDArr.indexOf(bossID));
            if(_loc1_ >= 0)
            {
               bossIDArr.splice(_loc1_,1);
            }
            FightManager.isWin = false;
            bossID = 0;
         }
         if(bossIDArr.indexOf(743) >= 0 && bossIDArr.indexOf(772) >= 0)
         {
            _map.conLevel["mainMC"].gotoAndStop(3);
         }
         else if(bossIDArr.indexOf(743) < 0 && bossIDArr.indexOf(772) >= 0)
         {
            _map.conLevel["mainMC"]["monster1Hit"].visible = false;
            _map.conLevel["mainMC"].gotoAndStop(4);
         }
         else if(bossIDArr.indexOf(743) >= 0 && bossIDArr.indexOf(772) < 0)
         {
            _map.conLevel["mainMC"]["monster2Hit"].visible = false;
            _map.conLevel["mainMC"].gotoAndStop(5);
         }
         else if(bossIDArr.indexOf(743) < 0 && bossIDArr.indexOf(772) < 0)
         {
            _map.conLevel["mainMC"].gotoAndStop(6);
            _map.conLevel["mainMC"]["monster1Hit"].visible = false;
            _map.conLevel["mainMC"]["monster2Hit"].visible = false;
            fightSuccess();
         }
         _map.conLevel["stone1"].visible = false;
         _map.conLevel["stone2"].visible = false;
         _map.conLevel["stone3"].visible = false;
         _map.conLevel["pirateMC"]["pirate1"].gotoAndStop(4);
         _map.conLevel["pirateMC"]["pirate2"].gotoAndStop(4);
         _map.conLevel["pirateMC"]["pirate3"].gotoAndStop(4);
         DisplayUtil.removeForParent(_map.typeLevel["pirMC"]);
         MapManager.currentMap.makeMapArray();
         _map.conLevel["mainMC"]["monster1Hit"].buttonMode = true;
         _map.conLevel["mainMC"]["monster2Hit"].buttonMode = true;
         _map.conLevel["mainMC"]["monster1Hit"].addEventListener(MouseEvent.CLICK,monsterHandler);
         _map.conLevel["mainMC"]["monster2Hit"].addEventListener(MouseEvent.CLICK,monsterHandler);
      }
      
      private static function monsterHandler(param1:MouseEvent) : void
      {
         var _loc2_:MovieClip = param1.currentTarget as MovieClip;
         if(_loc2_.name == "monster1Hit")
         {
            bossID = 743;
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
            EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
            FightManager.fightWithBoss("丽萨克",0);
         }
         else if(_loc2_.name == "monster2Hit")
         {
            bossID = 772;
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
            EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
            FightManager.fightWithBoss("纳迪科",1);
         }
      }
      
      private static function onFightComplete(param1:PetFightEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         var _loc2_:FightOverInfo = param1.dataObj as FightOverInfo;
         if(_loc2_.winnerID != MainManager.actorID)
         {
            NpcDialog.show(NPC.SEER,["可恶！我竟然输了！难道一切就这么结束了吗？"],["（再次点击对战）"]);
         }
      }
      
      private static function fightSuccess() : void
      {
         NpcDialog.show(NPC.KAXIUSI,["不堪一击的家伙！"],["佐格，把你们的绝招都使出来吧！"],[function():void
         {
            KTool.setActorVisible(false);
            AnimateManager.playMcAnimate(_map.conLevel["mainMC"],7,"mc7",function():void
            {
               NpcDialog.show(NPC.DIFUTE,["这段时间正是我的休眠期，因此无法使出力量对抗，只能眼看着这群家伙肆无忌惮的侵略炫彩山！"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.DIFUTE,["然而你父母的出现，让我相信一切都是命运的安排！那时我把部分能量给予了正在母亲肚中的你。"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.DIFUTE,["而现在我会把所有的力量都赐予你！孩子！守护圣神禁地的使命就交给你了！"],["圣神禁地？圣神禁地到底在哪里啊？"],[function():void
                     {
                        AnimateManager.playMcAnimate(_map.conLevel["mainMC"],8,"mc8",function():void
                        {
                           CartoonManager.play(ClientConfig.getFullMovie("cartoon/task_658"),function():void
                           {
                              KTool.setActorVisible(true);
                              AnimateManager.playMcAnimate(_map.conLevel["mainMC"],9,"mc9",function():void
                              {
                                 NpcDialog.show(NPC.NEW_ZOG,["你这家伙怎么突然变成白色了！而山神怎么也在慢慢褪色啊！什么鬼玩意！"],["来吧！决战开始了！"],[function():void
                                 {
                                    AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_658_1"),function():void
                                    {
                                       TasksManager.complete(TaskController_658.TASK_ID,2,function(param1:Boolean):void
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
                           });
                        });
                     }]);
                  });
               });
            });
         }]);
      }
      
      private static function gotoStep4() : void
      {
         _map.conLevel["stone1"].visible = false;
         _map.conLevel["stone2"].visible = false;
         _map.conLevel["stone3"].visible = false;
         _map.conLevel["pirateMC"]["pirate1"].gotoAndStop(4);
         _map.conLevel["pirateMC"]["pirate2"].gotoAndStop(4);
         _map.conLevel["pirateMC"]["pirate3"].gotoAndStop(4);
         DisplayUtil.removeForParent(_map.typeLevel["pirMC"]);
         MapManager.currentMap.makeMapArray();
         _map.conLevel["mainMC"].gotoAndStop(10);
         _map.conLevel["mainMC"]["difuteHit"].buttonMode = true;
         _map.conLevel["mainMC"]["difuteHit"].addEventListener(MouseEvent.CLICK,difuteHandler);
      }
      
      private static function difuteHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         _map.conLevel["mainMC"]["difuteHit"].mouseChildren = false;
         _map.conLevel["mainMC"]["difuteHit"].mouseEnabled = false;
         NpcDialog.show(NPC.KAXIUSI,["都结束了，我一定会好好守护炫彩山！可是你口中的圣神禁地 到底在哪里？"],["卡修斯，快看啊！这里出现一道光门！"],[function():void
         {
            NpcDialog.show(NPC.KAXIUSI,["难道这就是父亲和山神说的圣神禁地？"],["圣神禁地！！！"],[function():void
            {
               AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_658_2"),function():void
               {
                  NpcDialog.show(NPC.SHIZU_LINGSHOU,["山神已经复苏，我也该回去了！卡修斯，请记住，守护怀特星是你的使命！"],["谨遵教诲！"],[function():void
                  {
                     NpcDialog.show(NPC.DIFUTE,["卡修斯，赶紧去找你的父母吧！请代我向他们表达敬意！如果有事就来这里找我！我会尽可能的帮助你们！"],["感谢山神！我这就回博士那里汇报一下！"],[function():void
                     {
                        AnimateManager.playMcAnimate(_map.conLevel["mainMC"],11,"mc11",function():void
                        {
                           MapManager.changeMap(5);
                        });
                     }]);
                  }]);
               });
            }]);
         }]);
      }
      
      public static function destroy() : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 448)
         {
            ToolBarController.showOrHideAllUser(true);
            if(Boolean(_map.conLevel["kazi2MC"]))
            {
               _map.conLevel["kazi2MC"].removeEventListener(MouseEvent.CLICK,kaziClickHandler);
            }
         }
         else if(MapManager.currentMap.id == 449)
         {
            KTool.setActorVisible(true);
            OgreController.isShow = true;
            ToolBarController.showOrHideAllUser(true);
            _map.conLevel["pirateMC"]["pirate1"].removeEventListener("fire",fireHandler);
            _map.conLevel["pirateMC"]["pirate2"].removeEventListener("fire",fireHandler);
            _map.conLevel["pirateMC"]["pirate3"].removeEventListener("fire",fireHandler);
            _map.conLevel["stone1"].removeEventListener(MouseEvent.CLICK,stoneHandler);
            _map.conLevel["stone2"].removeEventListener(MouseEvent.CLICK,stoneHandler);
            _map.conLevel["stone3"].removeEventListener(MouseEvent.CLICK,stoneHandler);
            _map.conLevel["hit1MC"].removeEventListener(MouseEvent.CLICK,pirateHandler);
            _map.conLevel["hit2MC"].removeEventListener(MouseEvent.CLICK,pirateHandler);
            _map.conLevel["hit3MC"].removeEventListener(MouseEvent.CLICK,pirateHandler);
            _map.conLevel["mainMC"]["monster1Hit"].removeEventListener(MouseEvent.CLICK,monsterHandler);
            _map.conLevel["mainMC"]["monster2Hit"].removeEventListener(MouseEvent.CLICK,monsterHandler);
            _map.conLevel["mainMC"]["difuteHit"].removeEventListener(MouseEvent.CLICK,difuteHandler);
            if(Boolean(bloodMc))
            {
               DisplayUtil.removeForParent(bloodMc);
               bloodMc = null;
            }
            if(Boolean(stoneMC))
            {
               stoneMC.stopDrag();
               stoneMC = null;
            }
         }
         _map = null;
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 448)
         {
            initTaskForMap448(param1);
         }
         if(MapManager.currentMap.id == 449)
         {
            initTaskForMap449(param1);
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         if(param1 != null && MapManager.currentMap != null && MapManager.currentMap.id == 449 && TasksManager.getTaskStatus(TaskController_658.TASK_ID) == TasksManager.COMPLETE)
         {
            restoreFinishedMap449(param1);
         }
      }
      
      override public function destoryForMap() : void
      {
         destroy();
      }
   }
}

