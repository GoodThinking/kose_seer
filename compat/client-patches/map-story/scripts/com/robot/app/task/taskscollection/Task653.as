package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.KTool;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Point;
   import org.taomee.debug.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task653 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var isFight:Boolean;
      
      private static var _fightOverHandled:Boolean;
      
      private static var _pirateFightInProgress:Boolean;
      
      private static var _pirateFightUiClean:Boolean;
      
      private static var _sceneGeneration:uint;
      
      private static var _monsterShots:uint;
      
      private static var _monsterSequenceStarted:Boolean;
      
      private static var _monsterHit:MovieClip;
      
      private static var _monsterScene:MovieClip;
      
      private static var taskStep:int = -100;
      
      private static const MONSTER_SHOTS_REQUIRED:uint = 3;
      
      public function Task653()
      {
         super();
      }
      
      public static function initTaskForMap446(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         var nRet:uint = uint(TasksManager.getTaskStatus(648));
         if(nRet == TasksManager.COMPLETE)
         {
            _map = map;
            nRet = uint(TasksManager.getTaskStatus(TaskController_653.TASK_ID));
            if(nRet == TasksManager.UN_ACCEPT)
            {
               taskStep = -1;
               ToolBarController.showOrHideAllUser(false);
               _map.conLevel["kaziMC"].visible = true;
               _map.conLevel["kaziMC"].buttonMode = true;
               _map.conLevel["kaziMC"].gotoAndStop(2);
               _map.conLevel["kaziMC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
            }
            else if(nRet == TasksManager.ALR_ACCEPT)
            {
               ToolBarController.showOrHideAllUser(false);
               TasksManager.getProStatusList(TaskController_653.TASK_ID,function(param1:Array):void
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
            NpcDialog.show(NPC.KAZI,[MainManager.actorInfo.formatNick + "，记忆晶球让我坚信，我的父母就在炫彩山中，继续前进吧！"],["恩，出发！","我们先在这休息会！"],[function():void
            {
               TasksManager.accept(TaskController_653.TASK_ID,function(param1:Boolean):void
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
         AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],3,"mc3",function():void
         {
            _map.conLevel["nextMapHit"].visible = true;
         });
      }
      
      public static function initTaskForMap447(param1:BaseMapProcess) : void
      {
         var nRet:uint;
         var map:BaseMapProcess = null;
         var generation:uint = 0;
         map = param1;
         clearMonsterAim();
         generation = ++_sceneGeneration;
         _monsterShots = 0;
         _monsterSequenceStarted = false;
         taskStep = -100;
         _map = map;
         nRet = uint(TasksManager.getTaskStatus(TaskController_653.TASK_ID));
         if(nRet == TasksManager.ALR_ACCEPT)
         {
            _map.conLevel["kaziMC"].visible = true;
            KTool.setActorVisible(false);
            OgreController.isShow = false;
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_653.TASK_ID,function(param1:Array):void
            {
               var a:Array;
               if(generation != _sceneGeneration || !isCurrentMap447(map))
               {
                  return;
               }
               a = param1;
               if(!a[0])
               {
                  taskStep = 0;
                  TasksManager.complete(TaskController_653.TASK_ID,0,function(param1:Boolean):void
                  {
                     if(generation != _sceneGeneration || !isCurrentMap447(map))
                     {
                        return;
                     }
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
                  if(!_pirateFightInProgress)
                  {
                     gotoStep3();
                  }
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && !a[3])
               {
                  taskStep = 3;
                  if(_pirateFightInProgress)
                  {
                     advanceAfterPirateFight();
                  }
                  else
                  {
                     gotoStep4();
                  }
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
         else if(nRet == TasksManager.COMPLETE)
         {
            _map.conLevel["kaziMC"].visible = false;
            _map.conLevel["linesMC"].gotoAndStop(3);
         }
         _map.topLevel["lightMC"].mouseEnabled = false;
         _map.topLevel["lightMC"].mouseChildren = false;
      }
      
      private static function gotoStep2() : void
      {
         _map.conLevel["kaziMC"].gotoAndStop(2);
         NpcDialog.show(NPC.KAZI,["嘘！你看，那边是机械要塞和海盗船，看来这里已经被海盗设为重要据点了！"],["嗯，我还发现远处的水面有一股奇特的蓝色能量！"],[function():void
         {
            AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],2,"mc2",function():void
            {
               TasksManager.complete(TaskController_653.TASK_ID,1,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     DebugTrace.show("第二步完成");
                     taskStep = 2;
                     gotoStep3();
                  }
               });
            });
         }]);
      }
      
      private static function gotoStep3() : void
      {
         AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],3,"mc3",function():void
         {
            NpcDialog.show(NPC.KAZI,["我们已经暴露了，这场战役不可避免！"],["卡茨，刚才你那一招太帅了！"],[function():void
            {
               NpcDialog.show(NPC.KAZI,["嗯，乘坐前面那个小木筏，让我们把海盗要塞闹个天翻地覆吧！"],["海盗我们来了！(点击小木筏)"],[function():void
               {
                  _map.conLevel["kaziMC"]["boatHit"].buttonMode = true;
                  _map.conLevel["kaziMC"]["boatHit"].addEventListener(MouseEvent.CLICK,boatClickHandler);
               }]);
            }]);
         });
      }
      
      private static function boatClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         _map.conLevel["kaziMC"]["boatHit"].mouseEnabled = false;
         _map.conLevel["kaziMC"]["boatHit"].mouseChildren = false;
         AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],4,"mc4",function():void
         {
            NpcDialog.show(NPC.PIRATE_2,["哈哈哈！你们坐的那个破玩意！啊哈哈！太搞笑了，我要把你们打个落花流水。"],null,null,false,function():void
            {
               NpcDialog.show(NPC.SEER,["好呀！那咱们就试试！"],["消灭海盗！（点击海盗杂兵进行对战）"],[function():void
               {
                  _map.conLevel["kaziMC"].gotoAndStop(5);
                  _map.conLevel["kaziMC"]["pirate1Hit"].buttonMode = true;
                  _map.conLevel["kaziMC"]["pirate1Hit"].addEventListener(MouseEvent.CLICK,pirateClickHandler);
                  _map.conLevel["kaziMC"]["pirate2Hit"].buttonMode = true;
                  _map.conLevel["kaziMC"]["pirate2Hit"].addEventListener(MouseEvent.CLICK,pirateClickHandler);
               }]);
            });
         });
      }
      
      private static function pirateClickHandler(param1:MouseEvent) : void
      {
         if(taskStep != 2 || Boolean(_pirateFightInProgress))
         {
            return;
         }
         _pirateFightInProgress = true;
         _fightOverHandled = false;
         _pirateFightUiClean = false;
         EventManager.removeEventListener(PetFightEvent.FIGHT_RESULT,onFightComplete);
         EventManager.addEventListener(PetFightEvent.FIGHT_RESULT,onFightComplete);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
         FightManager.fightWithBoss("海盗杂兵",0);
      }
      
      private static function onFightComplete(param1:PetFightEvent) : void
      {
         var evt:PetFightEvent = param1;
         var info:FightOverInfo = evt == null ? null : evt.dataObj as FightOverInfo;
         EventManager.removeEventListener(PetFightEvent.FIGHT_RESULT,onFightComplete);
         if(_fightOverHandled)
         {
            return;
         }
         if(info == null)
         {
            _pirateFightInProgress = false;
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
            return;
         }
         if(info.winnerID != MainManager.actorID)
         {
            _pirateFightInProgress = false;
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
            return;
         }
         _fightOverHandled = true;
         isFight = true;
         TasksManager.complete(TaskController_653.TASK_ID,2,function(param1:Boolean):void
         {
            if(param1)
            {
               DebugTrace.show("第三步完成");
               taskStep = 3;
               advanceAfterPirateFight();
            }
            else
            {
               _pirateFightInProgress = false;
               isFight = false;
               EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
               if(Boolean(_pirateFightUiClean) && Boolean(_map))
               {
                  gotoStep3();
               }
            }
         });
      }
      
      private static function onFightUiClean(param1:PetFightEvent) : void
      {
         _pirateFightUiClean = true;
         advanceAfterPirateFight();
      }
      
      private static function advanceAfterPirateFight() : void
      {
         if(!_pirateFightInProgress || taskStep != 3 || !_pirateFightUiClean || !_map)
         {
            return;
         }
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
         removePirateClickListeners();
         _pirateFightInProgress = false;
         gotoStep4();
      }
      
      private static function removePirateClickListeners() : void
      {
         if(!_map)
         {
            return;
         }
         _map.conLevel["kaziMC"]["pirate1Hit"].removeEventListener(MouseEvent.CLICK,pirateClickHandler);
         _map.conLevel["kaziMC"]["pirate2Hit"].removeEventListener(MouseEvent.CLICK,pirateClickHandler);
      }
      
      private static function gotoStep4() : void
      {
         _map.conLevel["kaziMC"].gotoAndStop(5);
         if(isFight)
         {
            isFight = false;
            NpcDialog.show(NPC.PIRATE_2,["哼哼！你们的冒险之旅才刚刚开始，前面会有“好东西”等着你们！哈哈哈！"],["“好东西”？看来前方一定有埋伏！"],[function():void
            {
               beatByBoat();
            }]);
         }
         else
         {
            beatByBoat();
         }
      }
      
      private static function beatByBoat() : void
      {
         AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],6,"mc6",function():void
         {
            NpcDialog.show(NPC.KAZI,["XIN，你没事吧！这个怪物在水中有优势，不好对付啊！"],["嗯嗯嗯…..等等，我想我有办法了！(用头部攻击怪物)"],[function():void
            {
               TasksManager.complete(TaskController_653.TASK_ID,3,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     DebugTrace.show("第四步完成");
                     taskStep = 4;
                     gotoStep5();
                  }
               });
            }]);
         });
      }
      
      private static function isCurrentMap447(param1:BaseMapProcess) : Boolean
      {
         return param1 != null && _map == param1 && MapManager.currentMap != null && MapManager.currentMap.id == 447 && MapManager.currentMap.controlLevel == param1.conLevel;
      }
      
      public static function resumeMonsterStage() : Boolean
      {
         if(MapManager.currentMap == null || MapManager.currentMap.id != 447 || TasksManager.getTaskStatus(TaskController_653.TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            return false;
         }
         var _loc1_:BaseMapProcess = MapProcessConfig.currentProcessInstance;
         if(_loc1_ == null || _loc1_.rootLevel != MapManager.currentMap.root)
         {
            return false;
         }
         if(Boolean(isCurrentMap447(_loc1_)) && taskStep == 4)
         {
            if(!_monsterSequenceStarted)
            {
               gotoStep5(false);
            }
         }
         else
         {
            initTaskForMap447(_loc1_);
         }
         return true;
      }
      
      private static function clearMonsterAim() : void
      {
         AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
         if(_monsterScene != null)
         {
            _monsterScene.removeEventListener(Event.ENTER_FRAME,onMonsterSceneReady);
            _monsterScene = null;
         }
         if(_monsterHit != null)
         {
            ToolTipManager.remove(_monsterHit);
            _monsterHit = null;
         }
      }
      
      private static function gotoStep5(param1:Boolean = true) : void
      {
         if(!isCurrentMap447(_map))
         {
            return;
         }
         clearMonsterAim();
         if(param1)
         {
            _monsterShots = 0;
         }
         _monsterSequenceStarted = false;
         var _loc2_:MovieClip = _map.conLevel["kaziMC"] as MovieClip;
         if(_loc2_ == null)
         {
            return;
         }
         _loc2_.visible = true;
         _loc2_.gotoAndStop(7);
         _monsterScene = _loc2_;
         if(!bindMonsterTarget())
         {
            _loc2_.addEventListener(Event.ENTER_FRAME,onMonsterSceneReady);
         }
      }
      
      private static function onMonsterSceneReady(param1:Event) : void
      {
         if(taskStep != 4 || !isCurrentMap447(_map))
         {
            clearMonsterAim();
            return;
         }
         bindMonsterTarget();
      }
      
      private static function bindMonsterTarget() : Boolean
      {
         if(_monsterScene == null)
         {
            return false;
         }
         var _loc1_:MovieClip = _monsterScene["mc7"] as MovieClip;
         var _loc2_:MovieClip = _monsterScene["monsterHit"] as MovieClip;
         if(_loc1_ == null || _loc2_ == null)
         {
            return false;
         }
         _monsterScene.removeEventListener(Event.ENTER_FRAME,onMonsterSceneReady);
         _monsterScene = null;
         _loc1_.gotoAndStop(1);
         _monsterHit = _loc2_;
         _monsterHit.visible = true;
         ToolTipManager.add(_monsterHit,"发光圆球：用头部射击圆球主体（" + _monsterShots + "/" + MONSTER_SHOTS_REQUIRED + "）");
         AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
         NpcDialog.show(NPC.KAZI,["右侧水面上带发光触角的圆球就是挡路的怪物。打开底部的头部射击，瞄准它的圆球主体，命中三次后我们一起击退它！"],["知道了，去射击圆球"]);
         return true;
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var hitPoint:Point;
         var map:BaseMapProcess = null;
         var generation:uint = 0;
         var evt:AimatEvent = param1;
         if(taskStep != 4 || Boolean(_monsterSequenceStarted) || !isCurrentMap447(_map) || _monsterHit == null || evt == null || evt.info == null || evt.info.endPos == null || evt.info.userID != MainManager.actorID)
         {
            return;
         }
         hitPoint = MapManager.currentMap.root.localToGlobal(evt.info.endPos);
         if(_monsterHit.hitTestPoint(hitPoint.x,hitPoint.y))
         {
            DebugTrace.show("击中了");
            ++_monsterShots;
            ToolTipManager.add(_monsterHit,"发光圆球：用头部射击圆球主体（" + _monsterShots + "/" + MONSTER_SHOTS_REQUIRED + "）");
            SimpleAlarm.show("命中圆球（" + _monsterShots + "/" + MONSTER_SHOTS_REQUIRED + "）");
            if(_monsterShots >= MONSTER_SHOTS_REQUIRED)
            {
               map = _map;
               generation = uint(_sceneGeneration);
               _monsterSequenceStarted = true;
               _monsterHit.visible = false;
               clearMonsterAim();
               NpcDialog.show(NPC.SEER,["可恶！这样下去不行，一定要找到它身上的弱点！"],["弱点…究竟在哪里呢？"],[function():void
               {
                  if(generation != _sceneGeneration || !isCurrentMap447(map))
                  {
                     return;
                  }
                  NpcDialog.show(NPC.KAZI,["小XIN，我发现每次攻击时，它的触角都会紧缩，似乎在躲避。也许触角就是它的弱点！"],["真的吗？那我们同时攻击一次！"],[function():void
                  {
                     if(generation != _sceneGeneration || !isCurrentMap447(map))
                     {
                        return;
                     }
                     AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],7,"mc7",function():void
                     {
                        if(generation != _sceneGeneration || !isCurrentMap447(map))
                        {
                           return;
                        }
                        NpcDialog.show(NPC.SEER,["耶！！！太棒了，我们联手击退了那个怪物！"],["用小木筏继续前进"],[function():void
                        {
                           if(generation != _sceneGeneration || !isCurrentMap447(map))
                           {
                              return;
                           }
                           AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],8,"mc8",function():void
                           {
                              if(generation != _sceneGeneration || !isCurrentMap447(map))
                              {
                                 return;
                              }
                              NpcDialog.show(NPC.KAZI,["XIN！那股蓝色能量似乎在向我们呼唤！"],["恩恩，先把那个海盗打跑！"],[function():void
                              {
                                 if(generation != _sceneGeneration || !isCurrentMap447(map))
                                 {
                                    return;
                                 }
                                 NpcDialog.show(NPC.PIRATE_2,["你们别过来啊！别过来！我可比你们想象的厉害！我会很多招式的！别惹我哦！"],["哈哈！瞧你那样就知道你害怕啦！"],[function():void
                                 {
                                    if(generation != _sceneGeneration || !isCurrentMap447(map))
                                    {
                                       return;
                                    }
                                    NpcDialog.show(NPC.PIRATE_2,["既然被你们看破，那..那我只好去找救兵了，你们等着，别走啊！"],["哈哈哈！没用的东西！"],[function():void
                                    {
                                       if(generation != _sceneGeneration || !isCurrentMap447(map))
                                       {
                                          return;
                                       }
                                       AnimateManager.playMcAnimate(_map.conLevel["kaziMC"],9,"mc9",function():void
                                       {
                                          if(generation != _sceneGeneration || !isCurrentMap447(map))
                                          {
                                             return;
                                          }
                                          TasksManager.complete(TaskController_653.TASK_ID,4,function(param1:Boolean):void
                                          {
                                             if(generation != _sceneGeneration || !isCurrentMap447(map))
                                             {
                                                return;
                                             }
                                             if(param1)
                                             {
                                                DebugTrace.show("第五步完成");
                                                taskStep = 5;
                                                gotoStep6();
                                             }
                                             else
                                             {
                                                gotoStep5();
                                                SimpleAlarm.show("进度未保存，请重新射击圆球三次后继续。");
                                             }
                                          });
                                       });
                                    }]);
                                 }]);
                              }]);
                           });
                        }]);
                     });
                  }]);
               }]);
            }
         }
      }
      
      private static function gotoStep6() : void
      {
         _map.conLevel["kaziMC"].gotoAndStop(10);
         NpcDialog.show(NPC.SEER,["快看看水里的蓝色能量到底是什么？"],["拉动链条（点击铁链）"],[function():void
         {
            _map.conLevel["linesMC"]["linesHit"].buttonMode = true;
            _map.conLevel["linesMC"]["linesHit"].addEventListener(MouseEvent.CLICK,linsClickHandler);
         }]);
      }
      
      private static function linsClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         _map.conLevel["linesMC"]["linesHit"].mouseEnabled = false;
         _map.conLevel["linesMC"]["linesHit"].mouseChildren = false;
         AnimateManager.playMcAnimate(_map.conLevel["linesMC"],2,"mc2",function():void
         {
            NpcDialog.show(NPC.KAZI,["咦！好像是巧克力一族啊！"],["巧克力？难道是……"],[function():void
            {
               AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_653_1"),function():void
               {
                  _map.conLevel["linesMC"].gotoAndStop(3);
                  _map.conLevel["kaziMC"].visible = false;
                  _map.conLevel["boatMC"].gotoAndStop(2);
                  NpcDialog.show(NPC.SEER,["快！卡茨，我们先离开这个地方！到达安全的地方再说！"],["恩，我们走！"],[function():void
                  {
                     AnimateManager.playMcAnimate(_map.conLevel["pirateMC"],1,"mc1",function():void
                     {
                        AnimateManager.playMcAnimate(_map.conLevel["boatMC"],2,"mc2",function():void
                        {
                           AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_653_2"),function():void
                           {
                              _map.conLevel["boatMC"].gotoAndStop(3);
                              DisplayUtil.removeForParent(_map.conLevel["pirateMC"]);
                              NpcDialog.show(NPC.KACI_MOTHER,["孩子，没想到你被赐予了如此强大的力量！我们赶紧去救你的父亲吧，他应该在上面一层！"],["什么！被什么赐予力量？我的父亲也被海盗困住了？"],[function():void
                              {
                                 NpcDialog.show(NPC.KACI_MOTHER,["嗯，我知道你心里现在有很多疑问，目前情况紧急，等危机解除后我会你解释清楚事情的来龙去脉。"],["我明白了！"],[function():void
                                 {
                                    NpcDialog.show(NPC.KAZI,["亲爱的母亲，炫彩山很危险，你又受了伤，你先回村庄，召集大伙一起来赶走海盗。相信我！我一定能够救出父亲！"],null,null,false,function():void
                                    {
                                       NpcDialog.show(NPC.KACI_MOTHER,["卡茨，我相信你！你说的很对，必须集合大家的力量才能解除炫彩山的困境！我现在就出发，你要小心！"],["嗯！我们会成功的！"],[function():void
                                       {
                                          TasksManager.completeFinal(TaskController_653.TASK_ID,function(param1:Boolean):void
                                          {
                                             if(param1)
                                             {
                                                DebugTrace.show("任务完成");
                                                taskStep = 6;
                                                _map.conLevel["boatMC"].visible = false;
                                                KTool.setActorVisible(true);
                                                OgreController.isShow = true;
                                                ToolBarController.showOrHideAllUser(true);
                                                Task655.initTaskForMap447(_map);
                                             }
                                          });
                                       }]);
                                    });
                                 }]);
                              }]);
                           });
                        });
                     });
                  }]);
               });
            }]);
         });
      }
      
      public static function destroy() : void
      {
         ++_sceneGeneration;
         clearMonsterAim();
         _monsterShots = 0;
         _monsterSequenceStarted = false;
         if(!_pirateFightInProgress)
         {
            EventManager.removeEventListener(PetFightEvent.FIGHT_RESULT,onFightComplete);
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightUiClean);
            isFight = false;
            _fightOverHandled = false;
            _pirateFightUiClean = false;
         }
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 446)
         {
            ToolBarController.showOrHideAllUser(true);
            _map.conLevel["kaziMC"].removeEventListener(MouseEvent.CLICK,kaziClickHandler);
         }
         else if(MapManager.currentMap.id == 447)
         {
            OgreController.isShow = true;
            ToolBarController.showOrHideAllUser(true);
            KTool.setActorVisible(true);
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            _map.conLevel["kaziMC"]["boatHit"].removeEventListener(MouseEvent.CLICK,boatClickHandler);
            removePirateClickListeners();
            _map.conLevel["linesMC"]["linesHit"].removeEventListener(MouseEvent.CLICK,linsClickHandler);
         }
         _map = null;
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 446)
         {
            initTaskForMap446(param1);
         }
         if(MapManager.currentMap.id == 447)
         {
            initTaskForMap447(param1);
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 446)
         {
         }
         if(MapManager.currentMap.id == 447)
         {
            param1.conLevel["linesMC"].gotoAndStop(3);
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 446)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 447)
         {
            destroy();
         }
      }
   }
}

