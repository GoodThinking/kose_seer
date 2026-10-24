package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import org.taomee.manager.EventManager;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.*;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.utils.*;
   
   public class Task768
   {
      
      private static var _map:BaseMapProcess;
      
      private static var fightGang:FightGang;
      
      private static var isFight:Boolean;
      
      private static var taskStep:int = -100;
      
      public function Task768()
      {
         super();
      }
      
      public static function initTaskForMap15(param1:BaseMapProcess, param2:Boolean = false) : void
      {
         _map = param1;
         _map.conLevel["beibeiNPC"].buttonMode = true;
         _map.conLevel["beibeiNPC"].addEventListener(MouseEvent.CLICK,npcClickHandler);
      }
      
      private static function npcClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(370,260),function():void
         {
            NpcDialog.show(NPC.BEIBEI,["好热呀！好热呀！好热呀！"],["#101危机四伏","嗯，免费的桑拿享受久了也不行啊！"],[function():void
            {
               TasksManager.accept(TaskController_768.TASK_ID,on768Back);
            }]);
         });
      }
      
      private static function on768Back(param1:Boolean) : void
      {
         var b:Boolean = param1;
         if(b)
         {
            DebugTrace.show("任务接取成功");
            taskStep = 0;
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_768_1"),function():void
            {
               var app:AppModel = null;
               app = null;
               app = ModuleManager.getModule(ClientConfig.getAppModule("TaskIntro_768"));
               app.setup();
               app.show();
               app.sharedEvents.addEventListener(Event.CLOSE,function(param1:Event):void
               {
                  app.sharedEvents.removeEventListener(Event.CLOSE,arguments.callee);
                  app.destroy();
                  app = null;
                  MapManager.changeMap(16);
               });
            },false);
         }
      }
      
      public static function initTaskForMap16(param1:BaseMapProcess, param2:Boolean = false) : void
      {
         var map:BaseMapProcess = param1;
         var lock:Boolean = param2;
         _map = map;
         TasksManager.getProStatusList(TaskController_768.TASK_ID,function(param1:Array):void
         {
            if(!param1[0])
            {
               taskStep = 0;
               _map.conLevel["xielingMC"].visible = true;
               _map.conLevel["xielingMC"].buttonMode = true;
               _map.conLevel["xielingMC"].addEventListener(MouseEvent.CLICK,xielingMCHandler);
            }
         });
      }
      
      private static function xielingMCHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(372,202),function():void
         {
            _map.conLevel["xielingMC"].gotoAndStop(1);
            _map.conLevel["xielingMC"].buttonMode = false;
            _map.conLevel["xielingMC"].mouseEnable = false;
            NpcDialog.show(NPC.SEER,["看来炎魔不是海盗的目标，这两个小兵正守在山洞深处入口，里奥斯危险啊！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.XIELING_ZHANSHI,["嘿嘿！臭铁皮，竟敢闯到这里来，我要你好看！"],["我就是来收拾你们的！（头部射击消灭邪灵战士）"],[function():void
               {
                  if(fightGang == null)
                  {
                     _map.conLevel["xielingMC"].visible = false;
                     fightGang = new FightGang(120,100,5);
                     fightGang.createOgre(2527,new Point(416,140),10,5);
                     fightGang.createOgre(2527,new Point(546,132),10,5);
                     fightGang.beginFight().addResponse(function():void
                     {
                        fightGang.destroyFight();
                        fightGang = null;
                        NpcDialog.show(NPC.SEER,["哼，知道我的厉害了吧！ "],["（点击移动堵住入口的石块）"],[function():void
                        {
                           TasksManager.complete(TaskController_768.TASK_ID,0,function():void
                           {
                              DebugTrace.show("第一步完成");
                              taskStep = 1;
                              _map.conLevel["xielingMC"].gotoAndStop(3);
                           });
                        }]);
                     },function():void
                     {
                        NpcDialog.show(NPC.SEER,["可恶！我一定要冲破你们的阻碍！"],["（用头部射击消灭敌人）"],[function():void
                        {
                           fightGang.beginFight();
                        }]);
                     });
                  }
               }]);
            });
         });
      }
      
      public static function initTaskForMap17(param1:BaseMapProcess, param2:Boolean = false) : void
      {
         var map:BaseMapProcess = param1;
         var lock:Boolean = param2;
         _map = map;
         DisplayUtil.removeForParent(_map.conLevel["task_532"]);
         TasksManager.getProStatusList(TaskController_768.TASK_ID,function(param1:Array):void
         {
            var a:Array = param1;
            if(Boolean(a[0]) && !a[1])
            {
               taskStep = 1;
               _map.depthLevel["bossHu"].visible = false;
               _map.conLevel["task_532_escape"].visible = false;
               if(isFight)
               {
                  return;
               }
               KTool.setActorVisible(false);
               OgreController.isShow = false;
               _map.conLevel["task768MC"].visible = true;
               AnimateManager.playMcAnimate(_map.conLevel["task768MC"],1,"mc1",function():void
               {
                  KTool.setActorVisible(true);
                  _map.conLevel["task768MC"].gotoAndStop(2);
                  _map.conLevel["task768MC"].buttonMode = true;
                  _map.conLevel["task768MC"].addEventListener(MouseEvent.CLICK,fightHandler);
               });
            }
         });
      }
      
      private static function fightHandler(param1:MouseEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         FightManager.fightWithBoss("海盗",3);
         isFight = true;
      }
      
      private static function onFightComplete(param1:PetFightEvent) : void
      {
         var evt:PetFightEvent = param1;
         if(MapManager.currentMap.id == 17)
         {
            isFight = false;
            DisplayUtil.removeForParent(_map.animatorLevel["task768MC"]);
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_768_3"),function():void
            {
               TasksManager.complete(TaskController_768.TASK_ID,1,function():void
               {
                  DebugTrace.show("第二步完成");
                  taskStep = 2;
                  MapManager.changeMap(484);
               });
            });
         }
      }
      
      public static function initTaskForMap484(param1:BaseMapProcess, param2:Boolean = false) : void
      {
         var map:BaseMapProcess = param1;
         var lock:Boolean = param2;
         _map = map;
         TasksManager.getProStatusList(TaskController_768.TASK_ID,function(param1:Array):void
         {
            if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
            {
               taskStep = 2;
               _map.conLevel["luluMC"].gotoAndStop(2);
            }
         });
         _map.conLevel["luluMC"].buttonMode = true;
         _map.conLevel["luluMC"].addEventListener(MouseEvent.CLICK,luluMCHandler);
      }
      
      private static function luluMCHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(606,410),function():void
         {
            if(taskStep == 2)
            {
               NpcDialog.show(NPC.LULU,["我要泡泡，我要抱抱，不要崇拜我，妹妹我只是个传说！"],["#101危机四伏","璐璐长的真可爱。"],[function():void
               {
                  _map.conLevel["luluMC"].gotoAndStop(1);
                  NpcDialog.show(NPC.SEER,["璐璐，怀特星有什么异常情况吗？"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.LULU,[MainManager.actorInfo.formatNick + "，邪灵组织刚刚来过，虽然被卡修斯击退了，但他们临走前释放了一只怪物！"],["什么？"],[function():void
                     {
                        CartoonManager.play(ClientConfig.getFullMovie("task_768_4"),function():void
                        {
                           NpcDialog.show(NPC.LULU,["据说那个可怕的东西原本是被封印在“缚妖炉”里的！可是现在却暗藏在了魔窟，卡修斯正在寻找它的踪迹呢！"],["嗯，我现在就赶过去，助卡修斯一臂之力！"],[function():void
                           {
                              TasksManager.complete(TaskController_768.TASK_ID,2,function():void
                              {
                                 DebugTrace.show("第三步完成");
                                 taskStep = 3;
                                 MapManager.changeMap(479);
                              });
                           }]);
                        });
                     }]);
                  });
               }]);
            }
            else
            {
               NpcDialog.show(NPC.LULU,["我要泡泡，我要抱抱，不要崇拜我，妹妹我只是个传说！"],["璐璐长的真可爱。"]);
            }
         });
      }
      
      public static function initTaskForMap479(param1:BaseMapProcess, param2:Boolean = false) : void
      {
         var map:BaseMapProcess = param1;
         var lock:Boolean = param2;
         _map = map;
         _map.conLevel["boss"].visible = false;
         _map.topLevel["machine1"].visible = false;
         _map.depthLevel["npc"].visible = false;
         TasksManager.getProStatusList(TaskController_768.TASK_ID,function(param1:Array):void
         {
            if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
            {
               taskStep = 3;
               if(isFight)
               {
                  _map.conLevel["kaxiusiMC"].gotoAndStop(1);
                  _map.conLevel["kaxiusiMC"].visible = true;
                  _map.topLevel["blackMC"].gotoAndStop(3);
                  return;
               }
               _map.conLevel["kaxiusiMC"].visible = true;
               _map.conLevel["kaxiusiMC"].gotoAndStop(2);
               _map.conLevel["kaxiusiMC"].buttonMode = true;
               _map.conLevel["kaxiusiMC"].addEventListener(MouseEvent.CLICK,kaxiusiMCHandler);
            }
         });
      }
      
      private static function kaxiusiMCHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(268,354),function():void
         {
            _map.conLevel["kaxiusiMC"].gotoAndStop(1);
            _map.conLevel["kaxiusiMC"].visible = true;
            _map.conLevel["kaxiusiMC"].mouseEnabled = false;
            _map.conLevel["kaxiusiMC"].mouseChildren = false;
            NpcDialog.show(NPC.SEER,["卡修斯！缚妖炉里的怪物找到了吗？"],null,null,false,function():void
            {
               NpcDialog.show(NPC.KAXIUSI_WHITE,[MainManager.actorInfo.formatNick + "，这个家伙神出鬼没，一会东一会西！要抓到它真不容易！"],["嗯，我帮你一起找！"],[function():void
               {
                  _map.topLevel["blackMC"].gotoAndStop(1);
               }]);
            });
         });
      }
      
      public static function checkTasks() : void
      {
         if(taskStep == 3)
         {
            _map.conLevel["kaxiusiMC"].gotoAndStop(1);
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_768_5"),function():void
            {
               NpcDialog.show(NPC.KAXIUSI_WHITE,["这家伙太狡猾了，它的存在就是怀特星暗藏的危险！"],["卡修斯！别着急，我们一定能把它赶出怀特星。"],[function():void
               {
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_768_6"),function():void
                  {
                     TasksManager.complete(TaskController_768.TASK_ID,3,function():void
                     {
                        DebugTrace.show("任务完成");
                        taskStep = 4;
                        isFight = false;
                     });
                  });
               }]);
            });
         }
      }
      
      public static function destroy() : void
      {
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 15)
         {
            _map.conLevel["beibeiNPC"].removeEventListener(MouseEvent.CLICK,npcClickHandler);
         }
         else if(MapManager.currentMap.id == 16)
         {
            _map.conLevel["xielingMC"].removeEventListener(MouseEvent.CLICK,xielingMCHandler);
            if(Boolean(fightGang))
            {
               fightGang.destroyFight();
               fightGang = null;
            }
         }
         else if(MapManager.currentMap.id == 17)
         {
            KTool.setActorVisible(true);
            OgreController.isShow = true;
            if(Boolean(_map.animatorLevel["task768MC"]))
            {
               _map.conLevel["task768MC"].removeEventListener(MouseEvent.CLICK,fightHandler);
            }
         }
         else if(MapManager.currentMap.id == 484)
         {
            _map.conLevel["luluMC"].removeEventListener(MouseEvent.CLICK,luluMCHandler);
         }
         else if(MapManager.currentMap.id == 479)
         {
            _map.conLevel["kaxiusiMC"].removeEventListener(MouseEvent.CLICK,kaxiusiMCHandler);
         }
         _map = null;
      }
   }
}

