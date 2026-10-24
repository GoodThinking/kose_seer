package com.robot.app.task.petstory
{
   import com.robot.app.fight.*;
   import com.robot.app.task.petstory.util.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.dispatcher.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   
   public class Task_639
   {
      
      private static var _instance:Task_639;
      
      private static const TASKID:uint = 639;
      
      private var _map:BaseMapProcess;
      
      private var _mc:MovieClip;
      
      public var fightOver:uint = 0;
      
      private var _kbMC:MovieClip;
      
      private var _overNum:uint = 0;
      
      private var _probability:uint;
      
      public function Task_639(param1:PrivateClass)
      {
         super();
      }
      
      public static function getInstance() : Task_639
      {
         if(_instance == null)
         {
            _instance = new Task_639(new PrivateClass());
         }
         return _instance;
      }
      
      public function init(param1:BaseMapProcess) : void
      {
         this._map = param1;
         this._mc = this._map.depthLevel["kubiMC"];
         this._mc.buttonMode = true;
         this._mc.addEventListener(MouseEvent.CLICK,this.onMosueNPC);
         this._kbMC = param1.depthLevel["kbMC"];
         this._kbMC.buttonMode = true;
         this._kbMC.addEventListener(MouseEvent.CLICK,this.onFightWithBoss);
         this._kbMC.visible = false;
         this.checkTask();
         this.checkRandom();
      }
      
      private function checkTask() : void
      {
         var status:uint = uint(TasksManager.getTaskStatus(TASKID));
         ToolBarController.showOrHideAllUser(false);
         if(status == TasksManager.UN_ACCEPT)
         {
            TasksManager.accept(TASKID,function(param1:Boolean):void
            {
               if(param1)
               {
                  playStory_1();
               }
            });
         }
         else if(status == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASKID,this.getTaskStates);
         }
         else if(status == TasksManager.COMPLETE)
         {
            this.hideMapMC();
         }
      }
      
      private function playStory_1() : void
      {
         MainManager.actorModel.pos = new Point(467,392);
         KTool.getFrameMc(this._mc,1,"",function(param1:DisplayObject):void
         {
            var o:DisplayObject = param1;
            var mc:MovieClip = o as MovieClip;
            AnimateManager.playMcAnimate(mc,1,"",function():void
            {
               dialogSwitch(1);
            });
         });
      }
      
      private function playStory_2() : void
      {
         KTool.getFrameMc(this._mc,2,"",function(param1:DisplayObject):void
         {
            var _loc2_:MovieClip = param1 as MovieClip;
            _loc2_.gotoAndStop(_loc2_.totalFrames);
         });
      }
      
      public function dialogSwitch(param1:uint) : void
      {
         var id:uint = param1;
         switch(id)
         {
            case 1:
               NpcDialog.show(NPC.JILIGUALA,["听说这次精灵嘉年华有很多比赛项目哦！看来是该我们秀一场的时候了，兄弟我们可要加油了！"],["嗯？我去打听一下发生什么事了！"],[function():void
               {
                  NpcDialog.show(NPC.WULIGULA,["啊哈！小XIN你也来参加比赛吗？太巧了，这次是我们培养多年的精灵名叫库比，看上去胖嘟嘟的，不过它可是运动高手啊！"],["真的吗？难道是精灵界的全能王！"],[function():void
                  {
                     NpcDialog.show(NPC.JILIGUALA,["哈哈哈！怕了吧！好好看着吧！我们的库比一定会赢得所有比赛的胜利，库比出动！"],["你们也太臭屁了吧！"],[function():void
                     {
                        KTool.getFrameMc(_mc,2,"",function(param1:DisplayObject):void
                        {
                           var o:* = param1;
                           var mc:* = o as MovieClip;
                           AnimateManager.playMcAnimate(mc,1,"",function():void
                           {
                              NpcDialog.show(NPC.JILIGUALA,["哇！看它兴奋的样子，多可爱啊！好像库比对翻越障碍跑很感兴趣啊！怎么样，有实力的话去挑战一下吧！"],["哼！我是不会轻易服输的！你们等着吧！"],[function():void
                              {
                                 NpcDialog.show(NPC.KUBI,["哼哼！别太高估自己的实力哦！我可不会手下留情的，如果你能战胜我，也许我会考虑拜你为师，不过对于你来说是不可能完成的任务。"],["什么！你….太可恶了，气死我了！"],[function():void
                                 {
                                    NpcDialog.show(NPC.JILIGUALA,["哈哈！别气…别气，这家伙没有坏意，它只是想激发你的潜能而已，因为它好久好久没有被击败了！快去找它较量一下吧！说不定你会有意外收获哦!"],["恩，我的精灵伙伴也不会轻易言败的！"],[function():void
                                    {
                                       NpcDialog.show(NPC.SEER,["我发誓一定会在翻越障碍赛和抢位子比赛中战胜全能高手—库比……."],["我现在就去参加这2项比赛！"],[function():void
                                       {
                                          TasksManager.complete(TASKID,0,function(param1:Boolean):void
                                          {
                                          });
                                       }]);
                                    }]);
                                 }]);
                              }]);
                           });
                        });
                     }]);
                  }]);
               }]);
               break;
            case 2:
               NpcDialog.show(NPC.SEER,["我发誓一定会在翻越障碍赛和抢位子比赛中战胜全能高手—库比……."],["我现在就去参加这2项比赛！"],[function():void
               {
               }]);
               break;
            case 3:
               NpcDialog.show(NPC.JILIGUALA,["咦？这么快就回来了，看你的样子一定是输给库比了！你可要多努力啊！相信通过你的努力一定可以超越他的！再去试试吧！"],["恩，我一定会继续努力多多参加比赛的！"],[function():void
               {
               }]);
               break;
            case 4:
               NpcDialog.show(NPC.KUBI,["可气…可气真可气啊！我竟然输了，一世英名毁于今朝啊！怎么办，不行我一定要赢回来！小XIN我现在要和你pk一次，如果你赢了我就拜你为师，怎么样！"],["哈哈！好啊！"],[function():void
               {
                  FightDispatcher.addEventListener(PetFightEvent.CATCH_PET,onCatchPetHandler);
                  FightDispatcher.addEventListener(PetFightEvent.ALARM_CLICK,onAlarmClickHandler);
                  FightManager.fightWithBoss("库比",2);
               }]);
               break;
            case 5:
               NpcDialog.show(NPC.KUBI,["哎…愿赌服输啊！看来你这个小老师我是认定了，我跟定你了！"],["耶，太棒了，我赢了全能选手咯！"],[function():void
               {
                  NpcDialog.show(NPC.JILIGUALA,["太好了，好好照顾库比哦！它可是我们兄弟俩最宝贝的精灵了，千万别欺负它哦！我们也该回瞭望舱了，否则被船长发现就不好了！"],["放心吧！我会好好珍惜库比的！"],[function():void
                  {
                     KTool.getFrameMc(_mc,3,"",function(param1:DisplayObject):void
                     {
                        var o:* = param1;
                        var mc:* = o as MovieClip;
                        AnimateManager.playMcAnimate(mc,1,"",function():void
                        {
                        });
                     });
                  }]);
               }]);
               break;
            case 6:
               NpcDialog.show(NPC.KUBI,["哈哈哈！你果然不是我的对手，有本事再赢我一次吧！我们赛场见！"],["啊啊啊啊！太可惜了，下次你就没这么走运了！哼……"],[function():void
               {
               }]);
               break;
            case 7:
               NpcDialog.show(NPC.KUBI,["哎哟..哎哟...你出手太重了啦！不过你还是抓不到我哦，嘿嘿！我们有缘再见吧！"],["可恶，在遇到你我一定抓到你的！"],[function():void
               {
               }]);
         }
      }
      
      private function getTaskStates(param1:Array) : void
      {
         if(!param1[0])
         {
            this.playStory_1();
         }
         else if(Boolean(param1[0]) && !param1[1])
         {
            this.playStory_2();
         }
      }
      
      private function hideMapMC() : void
      {
         ToolBarController.showOrHideAllUser(true);
         this._mc.visible = false;
      }
      
      public function destory() : void
      {
         if(Boolean(this._mc))
         {
            this._mc.removeEventListener(MouseEvent.CLICK,this.onMosueNPC);
            this._mc = null;
         }
         if(Boolean(this._kbMC))
         {
            this._kbMC.removeEventListener(MouseEvent.CLICK,this.onFightWithBoss);
         }
      }
      
      public function isCompleteActivity() : Boolean
      {
         if(TasksManager.getTaskStatus(TASKID) != TasksManager.COMPLETE && this._probability > 100 ? true : false)
         {
            return true;
         }
         return false;
      }
      
      public function checkRandom() : void
      {
         this._overNum = this.fightOver;
         if(this.fightOver == 2)
         {
            this.fightOver = 0;
            this.showMon();
         }
         else
         {
            this._kbMC.visible = false;
            CommonUI.removeYellowExcal(this._kbMC);
         }
         this.refreshRandom();
      }
      
      private function refreshRandom() : void
      {
         this._probability = uint(Math.random() * 100);
      }
      
      private function showMon() : void
      {
         this._kbMC.visible = true;
         CommonUI.addYellowExcal(this._kbMC,10,-30);
      }
      
      private function onFightWithBoss(param1:MouseEvent) : void
      {
         this.dialogSwitch(4);
      }
      
      private function onCatchPetHandler(param1:PetFightEvent) : void
      {
         var e:PetFightEvent = param1;
         FightDispatcher.removeEventListener(PetFightEvent.ALARM_CLICK,this.onAlarmClickHandler);
         FightDispatcher.removeEventListener(PetFightEvent.CATCH_PET,this.onCatchPetHandler);
         TasksManager.complete(TASKID,1,function(param1:Boolean):void
         {
            dialogSwitch(5);
         });
      }
      
      private function onAlarmClickHandler(param1:PetFightEvent) : void
      {
         FightDispatcher.removeEventListener(PetFightEvent.ALARM_CLICK,this.onAlarmClickHandler);
         FightDispatcher.removeEventListener(PetFightEvent.CATCH_PET,this.onCatchPetHandler);
         if(!FightManager.isWin)
         {
            this.dialogSwitch(6);
         }
         else
         {
            this.dialogSwitch(7);
         }
      }
      
      private function onMosueNPC(param1:MouseEvent) : void
      {
         switch(this._overNum)
         {
            case 0:
               this.dialogSwitch(2);
               break;
            case 1:
               CommonUI.removeYellowExcal(this._kbMC);
               this.dialogSwitch(3);
               break;
            case 2:
               CommonUI.removeYellowExcal(this._kbMC);
         }
      }
   }
}

class PrivateClass
{
   
   public function PrivateClass()
   {
      super();
   }
}
