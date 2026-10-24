package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.info.pet.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import flash.events.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task637 extends ITask
   {
      
      private static var _pet:PetModel;
      
      private static var _map:BaseMapProcess;
      
      private static var _fightOverHandled:Boolean;
      
      public function Task637()
      {
         super();
      }
      
      public static function initTask_476(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         if(TasksManager.getTaskStatus(633) != TasksManager.COMPLETE)
         {
            return;
         }
         if(TasksManager.getTaskStatus(TaskController_637.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            accept();
         }
         else if(TasksManager.getTaskStatus(TaskController_637.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_637.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  startPro_0();
               }
               else
               {
                  removeResource_476();
               }
            });
         }
         else
         {
            removeResource_476();
         }
      }
      
      private static function removeResource_476() : void
      {
         if(TasksManager.getTaskStatus(633) == TasksManager.COMPLETE || TasksManager.getTaskStatus(633) == TasksManager.UN_ACCEPT)
         {
            DisplayUtil.removeForParent(_map.depthLevel["kazi"]);
            _map.depthLevel["kazi"] = null;
         }
      }
      
      private static function accept() : void
      {
         OgreController.isShow = false;
         ToolTipManager.add(_map.depthLevel["kazi"],"卡茨");
         _map.depthLevel["kazi"].gotoAndStop(2);
         _map.depthLevel["kazi"].buttonMode = true;
         _map.depthLevel["kazi"].addEventListener(MouseEvent.CLICK,onNpcClick);
      }
      
      private static function onNpcClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.SEER,["卡茨……卡茨……你有没有感觉好一点？自从你把能量注射到星球以后，星球的震动频率就减缓了……"],["我好想卡茨……","我一会再来看你！"],[function():void
         {
            ToolTipManager.remove(_map.depthLevel["kazi"]);
            _map.depthLevel["kazi"].gotoAndStop(1);
            _map.depthLevel["kazi"].buttonMode = false;
            _map.depthLevel["kazi"].removeEventListener(MouseEvent.CLICK,onNpcClick);
            TasksManager.accept(TaskController_637.TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  startPro_0();
               }
            });
         }]);
      }
      
      private static function startPro_0() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         ToolTipManager.add(_map.depthLevel["kazi"],"卡茨");
         _map.depthLevel["kazi"].buttonMode = true;
         _map.depthLevel["kazi"].addEventListener(MouseEvent.CLICK,onNpcClick_0);
      }
      
      private static function onNpcClick_0(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(_map.depthLevel["kazi"]);
         _map.depthLevel["kazi"].buttonMode = false;
         _map.depthLevel["kazi"].removeEventListener(MouseEvent.CLICK,onNpcClick_0);
         NpcDialog.show(NPC.SEER,["还记得我第一次看到你的出生！超酷的呢！还记得我第一次来找你，你的能力让所有精灵惊呆了……"],["你醒过来吧……"],[function():void
         {
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_637_0"),function():void
            {
               _map.depthLevel["kazi"].gotoAndStop(3);
               NpcDialog.show(NPC.SEER,["卡……卡茨……你是卡茨？卡茨进化了？卡茨进化了？"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.KAXIU,[MainManager.actorInfo.formatNick + "，如果没有你的眼泪我可能已经长眠于此……是你把我从睡梦中唤醒的！"],["不许你再离开我了！"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_637_1"),function():void
                     {
                        NpcDialog.show(NPC.KAXIU,["那不是巧克利他们？他们一定有危险……走！快去看看！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.SEER,["可……可是他们当初把你给赶走的呀！你身体都还没恢复……"],null,null,false,function():void
                           {
                              NpcDialog.show(NPC.KAXIU,["诅咒之子嘛！没什么大不了！就算所有精灵都不要我，至少我有你这个朋友！事不宜迟！"],["（前往怀特星球）"],[function():void
                              {
                                 TasksManager.complete(TaskController_637.TASK_ID,0,function(param1:Boolean):void
                                 {
                                    if(param1)
                                    {
                                       MapManager.changeMap(484);
                                    }
                                 });
                              }]);
                           });
                        });
                     });
                  }]);
               });
            });
         }]);
      }
      
      public static function initTask_484(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         _map.conLevel["arrow_637"].visible = false;
         if(!TasksController.isKaxiusiTaskEnabled(TaskController_637.TASK_ID))
         {
            removeResource_484();
            return;
         }
         if(TasksManager.getTaskStatus(TaskController_637.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            removeResource_484();
         }
         else if(TasksManager.getTaskStatus(TaskController_637.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_637.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
               }
               else
               {
                  removeResource_484();
               }
            });
         }
         else
         {
            removeResource_484();
         }
      }
      
      private static function removeResource_484() : void
      {
         DisplayUtil.removeForParent(_map.conLevel["task_637"]);
         _map.conLevel["task_637"] = null;
         DisplayUtil.removeForParent(_map.conLevel["arrow_637"]);
         _map.conLevel["arrow_637"] = null;
      }
      
      private static function startPro_1() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         createPet();
         AnimateManager.playMcAnimate(_map.conLevel["task_637"],0,"",function():void
         {
            TasksManager.complete(TaskController_637.TASK_ID,1,function(param1:Boolean):void
            {
               if(param1)
               {
                  _map.conLevel["arrow_637"].visible = true;
               }
            });
         });
      }
      
      public static function initTask_478(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         _map.conLevel["seer"].visible = false;
         _map.topLevel["arrow"].visible = false;
         showElement("");
         if(TasksManager.getTaskStatus(TaskController_637.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            removeResource_478();
         }
         else if(TasksManager.getTaskStatus(TaskController_637.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_637.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  startPro_2();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  startPro_3();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  startPro_4();
               }
               else
               {
                  removeResource_478();
               }
            });
         }
         else
         {
            removeResource_478();
         }
      }
      
      private static function removeResource_478() : void
      {
         DisplayUtil.removeForParent(_map.conLevel["seer"]);
         _map.conLevel["seer"] = null;
         DisplayUtil.removeForParent(_map.conLevel["arrow"]);
         _map.conLevel["arrow"] = null;
         DisplayUtil.removeForParent(_map.conLevel["boss_637"]);
         _map.conLevel["boss_637"] = null;
         DisplayUtil.removeForParent(_map.conLevel["grass"]);
         _map.conLevel["grass"] = null;
         DisplayUtil.removeForParent(_map.conLevel["water"]);
         _map.conLevel["water"] = null;
         DisplayUtil.removeForParent(_map.conLevel["fire"]);
         _map.conLevel["fire"] = null;
      }
      
      private static function startPro_2() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         createPet();
         showElement("");
         ToolTipManager.add(_map.conLevel["bossCon"],"魔王花苞");
         _map.conLevel["bossCon"].buttonMode = true;
         _map.conLevel["bossCon"].addEventListener(MouseEvent.CLICK,onBossConClick);
      }
      
      private static function onBossConClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(_map.conLevel["bossCon"]);
         _map.conLevel["bossCon"].buttonMode = false;
         _map.conLevel["bossCon"].removeEventListener(MouseEvent.CLICK,onBossConClick);
         AnimateManager.playMcAnimate(_map.topLevel["bossCon"],0,"",function():void
         {
            AnimateManager.playMcAnimate(_map.conLevel["boss_637"],2,"mc_1",function():void
            {
               NpcDialog.show(NPC.RED_BEELZEBUB,["黑暗力量会统治星球！我会帮咤克斯报仇的！波罗波罗叽哩呱啦！邪特从黑暗世界现身吧！帮我对付这两个蠢货！"],["什……什么……"],[function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["boss_637"],3,"mc_2",function():void
                  {
                     TasksManager.complete(TaskController_637.TASK_ID,2,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           startPro_3();
                        }
                     });
                  });
               }]);
            });
         });
      }
      
      private static function createPet() : void
      {
         var _loc1_:PetShowInfo = null;
         if(!_pet)
         {
            _loc1_ = new PetShowInfo();
            _loc1_.userID = MainManager.actorInfo.userID;
            _loc1_.petID = 5023;
            _pet = new PetModel(MainManager.actorModel);
            _pet.show(_loc1_);
            _pet.mouseEnabled = false;
            _pet.mouseChildren = false;
         }
      }
      
      public static function hidePet() : void
      {
         if(Boolean(_pet))
         {
            _pet.visible = false;
         }
      }
      
      private static function startPro_3() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         if(Boolean(_pet))
         {
            _pet.destroy();
            _pet = null;
         }
         showActor(false);
         showElement("grass");
         _map.conLevel["seer"].visible = true;
         _map.conLevel["boss_637"].gotoAndStop(4);
         NpcDialog.show(NPC.SEER,["吖！好像被困住了！糟糕……怎么办呢？火克草！我是不是可以利用火把呢？"],["（快看看周围哪里有火把）"],[function():void
         {
            ToolTipManager.add(_map.conLevel["grassHot"],"火把");
            _map.conLevel["grassHot"].buttonMode = true;
            _map.conLevel["grassHot"].addEventListener(MouseEvent.CLICK,onGrassHotClick);
         }]);
      }
      
      private static function onGrassHotClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(_map.conLevel["grassHot"]);
         _map.conLevel["grassHot"].buttonMode = false;
         _map.conLevel["grassHot"].removeEventListener(MouseEvent.CLICK,onGrassHotClick);
         AnimateManager.playMcAnimate(_map.conLevel["grass"],2,"mc",function():void
         {
            showElement("water");
            NpcDialog.show(NPC.SEER,["天啊！又出来一堵水墙！这个我知道，草克水！看我不把你们吸光！"],["（看看周围有什么吸水的植物）"],[function():void
            {
               ToolTipManager.add(_map.conLevel["waterHot"],"树根");
               _map.conLevel["waterHot"].buttonMode = true;
               _map.conLevel["waterHot"].addEventListener(MouseEvent.CLICK,onWaterHotClick);
            }]);
         });
      }
      
      private static function onWaterHotClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(_map.conLevel["waterHot"]);
         _map.conLevel["waterHot"].buttonMode = false;
         _map.conLevel["waterHot"].removeEventListener(MouseEvent.CLICK,onWaterHotClick);
         AnimateManager.playMcAnimate(_map.conLevel["water"],2,"mc",function():void
         {
            showElement("fire");
            NpcDialog.show(NPC.SEER,["还……还有？粘液！恩粘液应该可以扑灭这些火！"],["（抬头看看吧，可能会有发现哦！）"],[function():void
            {
               ToolTipManager.add(_map.conLevel["fireHot"],"露珠花苞");
               _map.conLevel["fireHot"].buttonMode = true;
               _map.conLevel["fireHot"].addEventListener(MouseEvent.CLICK,onFireHotClick);
            }]);
         });
      }
      
      private static function onFireHotClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(_map.conLevel["fireHot"]);
         _map.conLevel["fireHot"].buttonMode = false;
         _map.conLevel["fireHot"].removeEventListener(MouseEvent.CLICK,onFireHotClick);
         AnimateManager.playMcAnimate(_map.conLevel["fire"],2,"mc",function():void
         {
            NpcDialog.show(NPC.SEER,["可恶！竟然用三堵墙困住我！看我不好好收拾你们！"],["（点击它们进行对战吧！）"],[function():void
            {
               TasksManager.complete(TaskController_637.TASK_ID,3,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     startPro_4();
                  }
               });
            }]);
         });
      }
      
      private static function showElement(param1:String) : void
      {
         _map.conLevel["grass"].visible = false;
         _map.conLevel["water"].visible = false;
         _map.conLevel["fire"].visible = false;
         if(param1 != "")
         {
            _map.conLevel[param1].visible = true;
         }
      }
      
      private static function startPro_4() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         createPet();
         showActor(true);
         showElement("");
         _map.conLevel["seer"].visible = false;
         _map.topLevel["arrow"].visible = true;
         _fightOverHandled = false;
         ToolTipManager.add(_map.conLevel["boss_637"],"邪特");
         _map.conLevel["boss_637"].gotoAndStop(4);
         _map.conLevel["boss_637"].buttonMode = true;
         _map.conLevel["boss_637"].addEventListener(MouseEvent.CLICK,onBossClick);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightOver);
      }
      
      private static function onBossClick(param1:MouseEvent) : void
      {
         FightManager.fightWithBoss("邪特",0);
      }
      
      private static function onFightOver(param1:PetFightEvent) : void
      {
         var e:PetFightEvent = param1;
         var info:FightOverInfo = e == null ? null : e.dataObj as FightOverInfo;
         if(Boolean(_fightOverHandled) || info == null || info.winnerID != MainManager.actorID)
         {
            return;
         }
         _fightOverHandled = true;
         _map.topLevel["arrow"].visible = false;
         ToolTipManager.remove(_map.conLevel["boss_637"]);
         _map.conLevel["boss_637"].removeEventListener(MouseEvent.CLICK,onBossClick);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightOver);
         NpcDialog.show(NPC.XIETE,["啊……啊……黑……黑暗……力量……永无边……"],["休想！"],[function():void
         {
            if(Boolean(_pet))
            {
               _pet.destroy();
               _pet = null;
            }
            AnimateManager.playMcAnimate(_map.conLevel["boss_637"],5,"mc_3",function():void
            {
               NpcDialog.show(NPC.KAXIU,["糟糕！让那个家伙逃走了……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.RED_BEELZEBUB,["别高兴的太早了！我只是还没有完全成型并不是怕你们！后会有期！我会让你们领教什么才是黑暗！什么才是可怕！哈哈哈哈……"],["笑声好可怕……"],[function():void
                  {
                     NpcDialog.show(NPC.KAXIU,["黑暗能力的爆发，这似乎也是我为什么会进化的原因吧！我想我能对付它！我需要短暂的离开一段时间……"],null,null,false,function():void
                     {
                        AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_637_2"),function():void
                        {
                           _map.conLevel["boss_637"].visible = false;
                           TasksManager.completeFinal(TaskController_637.TASK_ID,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 Task641.initTask_478(_map);
                              }
                           });
                        });
                     });
                  }]);
               });
            });
         }]);
      }
      
      private static function showActor(param1:Boolean) : void
      {
         if(param1)
         {
            if(Boolean(MainManager.actorModel.pet))
            {
               MainManager.actorModel.showPet(MainManager.actorModel.pet.info);
            }
            MainManager.actorModel.visible = true;
         }
         else
         {
            MainManager.actorModel.hidePet();
            MainManager.actorModel.visible = false;
         }
      }
      
      public static function destroy() : void
      {
         OgreController.isShow = true;
         ToolBarController.showOrHideAllUser(true);
         if(Boolean(_pet))
         {
            _pet.destroy();
            _pet = null;
         }
         showActor(true);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightOver);
         _fightOverHandled = false;
         if(Boolean(_map))
         {
            if(Boolean(_map.depthLevel["kazi"]))
            {
               ToolTipManager.remove(_map.depthLevel["kazi"]);
               _map.depthLevel["kazi"].removeEventListener(MouseEvent.CLICK,onNpcClick);
               _map.depthLevel["kazi"].removeEventListener(MouseEvent.CLICK,onNpcClick_0);
            }
            if(Boolean(_map.conLevel["bossCon"]))
            {
               ToolTipManager.remove(_map.conLevel["bossCon"]);
               _map.conLevel["bossCon"].removeEventListener(MouseEvent.CLICK,onBossConClick);
            }
            if(Boolean(_map.conLevel["grassHot"]))
            {
               ToolTipManager.remove(_map.conLevel["grassHot"]);
               _map.conLevel["grassHot"].removeEventListener(MouseEvent.CLICK,onGrassHotClick);
            }
            if(Boolean(_map.conLevel["waterHot"]))
            {
               ToolTipManager.remove(_map.conLevel["waterHot"]);
               _map.conLevel["waterHot"].removeEventListener(MouseEvent.CLICK,onWaterHotClick);
            }
            if(Boolean(_map.conLevel["fireHot"]))
            {
               ToolTipManager.remove(_map.conLevel["fireHot"]);
               _map.conLevel["fireHot"].removeEventListener(MouseEvent.CLICK,onFireHotClick);
            }
            if(Boolean(_map.conLevel["boss_637"]))
            {
               ToolTipManager.remove(_map.conLevel["boss_637"]);
               _map.conLevel["boss_637"].removeEventListener(MouseEvent.CLICK,onBossClick);
            }
         }
         _map = null;
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         _map = param1;
         if(MapManager.currentMap.id == 476)
         {
            removeResource_476();
         }
         if(MapManager.currentMap.id == 478)
         {
            removeResource_478();
         }
         if(MapManager.currentMap.id == 484)
         {
            removeResource_484();
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 476)
         {
            initTask_476(param1);
         }
         if(MapManager.currentMap.id == 478)
         {
            initTask_478(param1);
         }
         if(MapManager.currentMap.id == 484)
         {
            initTask_484(param1);
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 476)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 478)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 484)
         {
            destroy();
         }
         _map = null;
      }
   }
}

