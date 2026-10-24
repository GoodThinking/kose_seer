package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.ogre.*;
   import com.robot.core.*;
   import com.robot.core.config.xml.*;
   import com.robot.core.dispatcher.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import com.robot.core.utils.*;
   import flash.events.*;
   import flash.utils.*;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.*;
   
   public class Task1129
   {
      
      private static var _taskState:uint;
      
      private static var _map:BaseMapProcess;
      
      private static var _date:Date;
      
      private static var _isFight:Boolean;
      
      public static var activeTime:Array = [new CronTimeVo("*","11-13","25-31","3","*","2016")];
      
      private static const TASK_ID:uint = 1129;
      
      public function Task1129()
      {
         super();
      }
      
      public static function initFor476(param1:BaseMapProcess) : void
      {
         _map = param1;
         _taskState = TasksManager.getTaskStatus(TASK_ID);
         switch(_taskState)
         {
            case TasksManager.UN_ACCEPT:
               beforeTask();
               break;
            case TasksManager.ALR_ACCEPT:
               TasksManager.getProStatusList(TASK_ID,checkStepFor476);
               break;
            case TasksManager.COMPLETE:
         }
      }
      
      public static function initFor352(param1:BaseMapProcess) : void
      {
         _map = param1;
         _taskState = TasksManager.getTaskStatus(TASK_ID);
         switch(_taskState)
         {
            case TasksManager.UN_ACCEPT:
               break;
            case TasksManager.ALR_ACCEPT:
               OgreController.isShow = false;
               TasksManager.getProStatusList(TASK_ID,checkStepFor352);
               break;
            case TasksManager.COMPLETE:
               onGetTime();
               startActivity();
         }
      }
      
      private static function checkStepFor476(param1:Array) : void
      {
         beforeTask();
      }
      
      private static function checkStepFor352(param1:Array) : void
      {
         if(Boolean(param1[0]) && !param1[1])
         {
            startStep1For352();
         }
         else
         {
            startActivity();
         }
      }
      
      private static function beforeTask() : void
      {
         _map.conLevel["lightAct"].visible = true;
         _map.conLevel["lightNPC"].visible = false;
         _map.conLevel["lightAct"].buttonMode = true;
         _map.conLevel["lightAct"].addEventListener(MouseEvent.CLICK,onClickLight0);
         CommonUI.addYellowExcal(_map.conLevel["lightAct"],440,105,1.5);
      }
      
      private static function onClickLight0(param1:Event) : void
      {
         CommonUI.removeYellowExcal(_map.conLevel["lightAct"]);
         TasksManager.accept(TASK_ID,startTask);
      }
      
      private static function startTask(param1:Boolean = true) : void
      {
         var b:Boolean = param1;
         _map.conLevel["lightNPC"].visible = true;
         NpcDialog.show(NPC.MIZHIGUANGTUAN,["你找到三片光之碎片了吗？一定要加油哦！"],["光之一族的灾难！","放心吧！我一定会找齐的！"],[function():void
         {
            NpcDialog.show(NPC.MIZHIGUANGTUAN,["你知道吗？最近光之一族正在日益减少，在这样下去光之一族就会彻底消失了！"],["什么！！！怎么会这样啊！"],[function():void
            {
               NpcDialog.show(NPC.MIZHIGUANGTUAN,["我也不知道什么原因，不过你可以去蜜桃森林看看，那里一定发生了什么！"],["恩，这可是大事，我现在就去~"],[function():void
               {
                  TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
                  {
                     MapManager.changeMap(352);
                  });
               }]);
            }]);
         }]);
      }
      
      private static function startStep1For352() : void
      {
         _map.depthLevel["npc"].visible = false;
         _map.depthLevel["activeNPC"].visible = true;
         _map.depthLevel["activeNPC"].buttonMode = true;
         _map.depthLevel["activeNPC"].addEventListener(MouseEvent.CLICK,onClickPeachDuoduo);
      }
      
      private static function onClickPeachDuoduo(param1:Event) : void
      {
         var e:Event = param1;
         NpcDialog.show(NPC.MITAODUODUO,["这里已经变的不像是蜜桃森林，什么都往这里放，真是的！"],["咦？这里究竟怎么了？"],[function():void
         {
            _map.conLevel["monsters"].visible = true;
            _map.conLevel["monsters"].gotoAndStop(1);
            NpcDialog.show(NPC.MITAODUODUO,["小XIN，你来的正好，快看看这些奇怪的蜜桃吧！光之一族也不知怎么了，居然会被困在里面，快想想办法吧！！！！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.MITAODUODUO,["啊…忘记告诉你了？0xff0000每天11:00-13:00是光之一族能量最强大的时候，0xffffff这个时候我想它们一定可以有所作为的，你到时候再来看看吧！"],["恩，时间一到我就会出现的！"],[function():void
               {
                  TasksManager.complete(TASK_ID,1,function(param1:Boolean):void
                  {
                     startActivity();
                  });
               }]);
            });
         }]);
      }
      
      private static function onClickPeachDuoduo1(param1:Event) : void
      {
         NpcDialog.show(NPC.MITAODUODUO,["哎…你怎么连这都不知道呢？0xff0000每天11:00-13:00是光之一族能量最强大的时候，0xffffff这个时候我想它们一定可以有所作为的，你到时候再来看看吧！"],["恩，时间一到我就会出现的！"],[]);
      }
      
      private static function onGetTime(param1:SocketEvent = null) : void
      {
         _date = SystemTimerManager.sysBJDate;
         if(SystemTimerManager.isActive(activeTime))
         {
            inTime();
         }
         else
         {
            outOfTime();
         }
      }
      
      public static function startActivity() : void
      {
         onGetTime();
         SocketConnection.addCmdListener(CommandID.SYSTEM_TIME,onGetTime);
      }
      
      private static function inTime() : void
      {
         DisplayUtil.removeForParent(_map.topLevel["dark"]);
         _map.depthLevel["npc"].visible = true;
         _map.depthLevel["activeNPC"].visible = false;
         _map.conLevel["monsters"].visible = true;
         _map.conLevel["monsters"].gotoAndStop(2);
         _map.conLevel["monsters"].buttonMode = true;
         _map.conLevel["monsters"].addEventListener(MouseEvent.CLICK,onClickBoss);
      }
      
      private static function onClickBoss(param1:Event) : void
      {
         SocketConnection.addCmdListener(CommandID.CHECK_LIGHT_BOSS,onCheckBoss);
         SocketConnection.send(CommandID.CHECK_LIGHT_BOSS);
      }
      
      private static function onCheckBoss(param1:SocketEvent) : void
      {
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         var _loc4_:uint = _loc2_.readUnsignedInt();
         if(_loc3_ == 0)
         {
            Alarm.show("光球中好像没有东西，再继续努力吧！");
         }
         else
         {
            fightBoss(_loc3_,_loc4_);
         }
      }
      
      private static function fightBoss(param1:uint, param2:uint) : void
      {
         _isFight = true;
         FightDispatcher.addEventListener(PetFightEvent.CATCH_PET,onFinishFight);
         FightDispatcher.addEventListener(PetFightEvent.ALARM_CLICK,onFinishFight);
         FightManager.fightWithBoss(PetXMLInfo.getName(param2),param1);
      }
      
      private static function onFinishFight(param1:PetFightEvent) : void
      {
         _isFight = false;
      }
      
      private static function outOfTime() : void
      {
         _map.conLevel["monsters"].visible = true;
         _map.conLevel["monsters"].gotoAndStop(1);
         _map.depthLevel["activeNPC"].visible = true;
         _map.depthLevel["npc"].visible = false;
         _map.depthLevel["activeNPC"].buttonMode = true;
         _map.depthLevel["activeNPC"].addEventListener(MouseEvent.CLICK,onClickPeachDuoduo1);
      }
      
      public static function destroy() : void
      {
         if(Boolean(_map) && Boolean(_map.conLevel["lightAct"]))
         {
            CommonUI.removeYellowArrow(_map.conLevel["lightAct"]);
            _map.conLevel["lightAct"].removeEventListener(MouseEvent.CLICK,onClickLight0);
         }
         if(Boolean(_map) && Boolean(_map.depthLevel["activeNPC"]))
         {
            _map.depthLevel["activeNPC"].removeEventListener(MouseEvent.CLICK,onClickPeachDuoduo);
            _map.depthLevel["activeNPC"].removeEventListener(MouseEvent.CLICK,onClickPeachDuoduo1);
         }
         if(Boolean(_map) && Boolean(_map.conLevel["monsters"]))
         {
            _map.conLevel["monsters"].removeEventListener(MouseEvent.CLICK,onClickBoss);
         }
         SocketConnection.removeCmdListener(CommandID.SYSTEM_TIME,onGetTime);
         if(!_isFight)
         {
            FightDispatcher.removeEventListener(PetFightEvent.CATCH_PET,onFinishFight);
            FightDispatcher.removeEventListener(PetFightEvent.ALARM_CLICK,onFinishFight);
         }
         OgreController.isShow = true;
         MainManager.selfVisible = true;
         _map = null;
      }
   }
}

