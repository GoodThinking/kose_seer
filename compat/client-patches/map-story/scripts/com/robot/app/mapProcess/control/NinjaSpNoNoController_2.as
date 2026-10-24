package com.robot.app.mapProcess.control
{
   import com.robot.app.fight.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.net.*;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.*;
   
   public class NinjaSpNoNoController_2
   {
      
      public static var index:int;
      
      private static var map:BaseMapProcess;
      
      private static var dailog:Array;
      
      private static var functions:Array;
      
      private static var talkMC:MovieClip;
      
      private static var stoneDoorMC:MovieClip;
      
      private static var bossBtn:SimpleButton;
      
      private static var isStory:Boolean;
      
      private static var intro:AppModel;
      
      private static var train:AppModel;
      
      private static var isLoadingNinjaTrainingCandidates:Boolean;
      
      public static var frame:int;
      
      public function NinjaSpNoNoController_2()
      {
         super();
      }
      
      public static function init_480(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = null;
         m = param1;
         map = m;
         if(!BufferRecordManager.getState(MainManager.actorInfo,137))
         {
            map.conLevel["door_0"].mouseEnabled = false;
            map.conLevel["door_0"].mouseChildren = false;
            if(!BufferRecordManager.getState(MainManager.actorInfo,108))
            {
               NpcDialog.show(NPC.NINJA_NPC,["如今，你也大致对忍者精灵有了初步的认识了吧。"],["是的，略知一二。","不是很清楚，我是刚来的。"],[function():void
               {
                  map.conLevel["yesMc"].visible = false;
                  map.conLevel["arrowMc"].visible = false;
                  map.animatorLevel["aniMc01"].visible = false;
                  start();
               },function():void
               {
                  NpcDialog.show(NPC.NINJA_NPC,["好吧，那让我们时光倒流。"],null,null,false,function():void
                  {
                     NinjaSpNoNoController.instance.initMap480Main(m,true);
                  });
               }]);
            }
            else
            {
               map.conLevel["yesMc"].visible = false;
               map.conLevel["arrowMc"].visible = false;
               map.animatorLevel["aniMc01"].visible = false;
               start();
            }
         }
         else
         {
            NinjaSpNoNoController.instance.initMap480Main(m);
         }
      }
      
      public static function start() : void
      {
         NpcDialog.show(NPC.NINJA_NPC,["最近我一直会闪过【阿尔卡达】的影像，看来他的意念已经开始影响到我，武道会估计也马上就要打响了！"],["哈哈，让我来打倒他吧！"],[function():void
         {
            NpcDialog.show(NPC.NINJA_NPC,["好！虽然你有这个勇气，但是看来你的感知力还并不太灵敏。难道没发觉这里有什么地方不太对劲么？"],["（东看看，西看看）哇！老鼠！看来最近这里好久没打扫了！"],[function():void
            {
               NpcDialog.show(NPC.NINJA_NPC,["你........................"],["难道还有别的玄机?"],[function():void
               {
                  NpcDialog.show(NPC.NINJA_NPC,["宇宙之大，还有更多的东西需要探索呢！小赛尔！让我告诉你这里的秘密吧！"],null,null,false,function():void
                  {
                     AnimateManager.playMcAnimate(map.conLevel["openDoor"],0,"",function():void
                     {
                        BufferRecordManager.setState(MainManager.actorInfo,137,true,function():void
                        {
                           MapManager.changeMap(495);
                        });
                     });
                  });
               }]);
            }]);
         }]);
      }
      
      public static function init_495(param1:BaseMapProcess, param2:Boolean) : void
      {
         map = param1;
         isStory = param2;
         SocketConnection.removeCmdListener(CommandID.END_REN_TRAIN,onNinjaTrainingEnded);
         SocketConnection.addCmdListener(CommandID.END_REN_TRAIN,onNinjaTrainingEnded);
         ToolBarController.showOrHideAllUser(false);
         ToolTipManager.add(map.conLevel["mingwen"],"铭文");
         map.conLevel["mingwen"].buttonMode = true;
         map.conLevel["mingwen"].addEventListener(MouseEvent.CLICK,onIntroClick);
         ToolTipManager.add(map.conLevel["dao"],"忍刀");
         map.conLevel["dao"].buttonMode = true;
         map.conLevel["dao"].addEventListener(MouseEvent.CLICK,onRendaoClick);
         ToolTipManager.add(map.conLevel["gou"],"手甲钩");
         map.conLevel["gou"].buttonMode = true;
         map.conLevel["gou"].alpha = 1;
         map.conLevel["gou"].addEventListener(MouseEvent.CLICK,onShouJiaGouClick);
         ToolTipManager.add(map.conLevel["jian"],"手里剑");
         map.conLevel["jian"].buttonMode = true;
         map.conLevel["jian"].alpha = 1;
         map.conLevel["jian"].addEventListener(MouseEvent.CLICK,onShouLiJianClick);
         map.animatorLevel["bg"]["dao"].visible = true;
         map.animatorLevel["bg"]["gou"].visible = true;
         map.animatorLevel["bg"]["jian"].visible = true;
         map.animatorLevel["bg"]["dao"].visible = true;
         map.conLevel["dao"].gotoAndStop(map.conLevel["dao"].totalFrames);
         map.animatorLevel["bg"]["gou"].visible = true;
         map.conLevel["gou"].gotoAndStop(map.conLevel["gou"].totalFrames);
         map.animatorLevel["bg"]["jian"].visible = true;
         map.conLevel["jian"].gotoAndStop(map.conLevel["jian"].totalFrames);
         sptStory();
      }
      
      private static function sptStory() : void
      {
         talkMC = map.topLevel["talkMC"] as MovieClip;
         bossBtn = map.conLevel["bossBtn"] as SimpleButton;
         if(Boolean(bossBtn))
         {
            bossBtn.visible = true;
            bossBtn.mouseEnabled = true;
            bossBtn.removeEventListener(MouseEvent.CLICK,onMouseBoss);
            bossBtn.addEventListener(MouseEvent.CLICK,onMouseBoss);
            ToolTipManager.add(bossBtn,"挑战斯普林特");
         }
         if(Boolean(talkMC))
         {
            talkMC.gotoAndStop(talkMC.totalFrames >= 7 ? 7 : talkMC.totalFrames);
         }
         if(Boolean(map.conLevel["stoneDoorMC"]))
         {
            stoneDoorMC = map.conLevel["stoneDoorMC"]["door"] as MovieClip;
            if(Boolean(stoneDoorMC))
            {
               stoneDoorMC.gotoAndStop(stoneDoorMC.totalFrames);
            }
         }
      }
      
      private static function challenge() : void
      {
         NpcDialog.show(NPC.SEER,["沉睡多年的斯普林特已经苏醒，准备迎接这位冰·暗影系忍者之王的挑战吧！"],["挑战斯普林特！","下次再说！"],[function():void
         {
            fightWithBoss();
         }]);
      }
      
      private static function onMouseBoss(param1:MouseEvent) : void
      {
         challenge();
      }
      
      private static function fightWithBoss() : void
      {
         FightManager.fightWithBoss("斯普林特",1);
      }
      
      private static function onIntroClick(param1:MouseEvent) : void
      {
         frame = int(param1.target.name.split("_")[1]);
         if(!intro)
         {
            intro = new AppModel(ClientConfig.getAppModule("NinjaSpIntroPanel"),"正在加载面板");
            intro.setup();
         }
         intro.show();
      }
      
      private static function onRendaoClick(param1:MouseEvent) : void
      {
         index = 0;
         openNinjaTrainingPanel();
      }
      
      private static function openNinjaTrainingPanel() : void
      {
         if(isLoadingNinjaTrainingCandidates)
         {
            return;
         }
         isLoadingNinjaTrainingCandidates = true;
         SocketConnection.addCmdListener(CommandID.GET_REN_PET_INFO,onNinjaTrainingGiftReady);
         SocketConnection.send(CommandID.GET_REN_PET_INFO,index);
      }
      
      private static function onNinjaTrainingGiftReady(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_REN_PET_INFO,onNinjaTrainingGiftReady);
         PetManager.addEventListener(PetEvent.STORAGE_LIST,onNinjaTrainingStorageReady);
         PetManager.refreshStorageLists();
      }
      
      private static function onNinjaTrainingStorageReady(param1:PetEvent) : void
      {
         PetManager.removeEventListener(PetEvent.STORAGE_LIST,onNinjaTrainingStorageReady);
         isLoadingNinjaTrainingCandidates = false;
         PetManager.beginNinjaTrainingCandidateSelection();
         initPanel();
         SocketConnection.addCmdListener(CommandID.GET_REN_PET_INFO,onNinjaTrainingInfoLoaded,false,-1000);
      }
      
      private static function onNinjaTrainingInfoLoaded(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_REN_PET_INFO,onNinjaTrainingInfoLoaded);
         PetManager.endNinjaTrainingCandidateSelection();
      }
      
      private static function onNinjaTrainingEnded(param1:SocketEvent) : void
      {
         openNinjaTrainingPanel();
      }
      
      private static function onShouJiaGouClick(param1:MouseEvent) : void
      {
         index = 1;
         openNinjaTrainingPanel();
      }
      
      private static function onShouLiJianClick(param1:MouseEvent) : void
      {
         index = 2;
         openNinjaTrainingPanel();
      }
      
      private static function initPanel() : void
      {
         if(!train)
         {
            train = new AppModel(ClientConfig.getAppModule("NinjaSpTrainPanel"),"正在加载面板");
            train.setup();
         }
         train.show();
      }
      
      public static function destroy() : void
      {
         ToolBarController.showOrHideAllUser(true);
         PetManager.removeEventListener(PetEvent.STORAGE_LIST,onNinjaTrainingStorageReady);
         SocketConnection.removeCmdListener(CommandID.GET_REN_PET_INFO,onNinjaTrainingGiftReady);
         SocketConnection.removeCmdListener(CommandID.GET_REN_PET_INFO,onNinjaTrainingInfoLoaded);
         SocketConnection.removeCmdListener(CommandID.END_REN_TRAIN,onNinjaTrainingEnded);
         PetManager.endNinjaTrainingCandidateSelection();
         isLoadingNinjaTrainingCandidates = false;
         if(!map)
         {
            return;
         }
         if(Boolean(map.conLevel["mingwen"]))
         {
            ToolTipManager.remove(map.conLevel["mingwen"]);
            map.conLevel["mingwen"].removeEventListener(MouseEvent.CLICK,onIntroClick);
         }
         if(Boolean(map.conLevel["dao"]))
         {
            ToolTipManager.remove(map.conLevel["dao"]);
            map.conLevel["dao"].removeEventListener(MouseEvent.CLICK,onRendaoClick);
         }
         if(Boolean(map.conLevel["gou"]))
         {
            ToolTipManager.remove(map.conLevel["gou"]);
            map.conLevel["gou"].removeEventListener(MouseEvent.CLICK,onShouJiaGouClick);
         }
         if(Boolean(map.conLevel["jian"]))
         {
            ToolTipManager.remove(map.conLevel["jian"]);
            map.conLevel["jian"].removeEventListener(MouseEvent.CLICK,onShouLiJianClick);
         }
         if(Boolean(bossBtn))
         {
            ToolTipManager.remove(bossBtn);
            bossBtn.removeEventListener(MouseEvent.CLICK,onMouseBoss);
            bossBtn = null;
         }
         talkMC = null;
         stoneDoorMC = null;
      }
   }
}

