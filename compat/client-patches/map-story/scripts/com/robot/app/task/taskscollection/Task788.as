package com.robot.app.task.taskscollection
{
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;

   public class Task788
   {
      private static var _map:BaseMapProcess;
      private static var _mcForMap684:MovieClip;
      private static const TASK_ID:uint = 788;
      private static var _hiddenActor:DisplayObject;
      private static var _hiddenPet:DisplayObject;
      private static var _actorWasVisible:Boolean;
      private static var _petWasVisible:Boolean;
      private static var _movementLocked:Boolean;
      private static var _raftDisabled:Boolean;

      public static function initTaskForMap683(map:BaseMapProcess) : void
      {
         _map = map;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
            {
               if(_map !== map) return;
               if(!progress[0]) goStep1();
               else removeAccept();
            });
         }
         else if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT)
         {
            CommonUI.addYellowExcal(map.conLevel["accept788"],30,0);
            map.conLevel["accept788"].buttonMode = true;
            map.conLevel["accept788"].addEventListener(MouseEvent.CLICK,onAcceptClick);
         }
         else removeAccept();
      }

      private static function removeAccept() : void
      {
         DisplayUtil.removeForParent(_map.conLevel["accept788"]);
         DisplayUtil.removeForParent(_map.conLevel["task_778_1"]);
      }

      private static function onAcceptClick(event:MouseEvent) : void
      {
         var owner:BaseMapProcess = _map;
         NpcDialog.show(NPC.LAIKE,["冰狐….冰狐来了！！！我刚刚听到泰若星深处有噪杂的声音，不知那里发生了什么事情？"],["冰狐是什么？？","我只是来逛逛！"],[function():void
         {
            if(_map !== owner) return;
            TasksManager.accept(TASK_ID,function(success:Boolean):void
            {
               if(_map !== owner || !success) return;
               CommonUI.removeYellowExcal(owner.conLevel["accept788"]);
               owner.conLevel["accept788"].buttonMode = false;
               owner.conLevel["accept788"].removeEventListener(MouseEvent.CLICK,onAcceptClick);
               goStep1();
            });
         }]);
      }

      public static function initTaskForMap684(map:BaseMapProcess) : void
      {
         _map = map;
         _mcForMap684 = map.animatorLevel["task_778_2"];
         _mcForMap684.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            DisplayUtil.removeForParent(_mcForMap684);
            DisplayUtil.removeForParent(map.conLevel["raftTig788"]);
            return;
         }
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(_map !== map) return;
            if(!progress[0]) return;
            _raftDisabled = true;
            map.conLevel["raftTig"].mouseChildren = false;
            map.conLevel["raftTig"].mouseEnabled = false;
            map.conLevel["raftTig1"].mouseChildren = false;
            map.conLevel["raftTig1"].mouseEnabled = false;
            if(!progress[1]) goStep2();
            else if(!progress[2]) goStep3();
            else if(!progress[3]) goStep4();
            else if(!progress[4]) goStep5();
            else releaseScene();
         });
      }

      private static function hideActors() : void
      {
         if(_hiddenActor != null) return;
         _hiddenActor = MainManager.actorModel;
         _actorWasVisible = _hiddenActor.visible;
         _hiddenActor.visible = false;
         _hiddenPet = MainManager.actorModel.pet;
         if(_hiddenPet != null)
         {
            _petWasVisible = _hiddenPet.visible;
            _hiddenPet.visible = false;
         }
      }

      private static function restoreActors() : void
      {
         if(_hiddenActor != null) _hiddenActor.visible = _actorWasVisible;
         if(_hiddenPet != null) _hiddenPet.visible = _petWasVisible;
         _hiddenActor = null;
         _hiddenPet = null;
      }

      private static function unlockMovement() : void
      {
         if(!_movementLocked) return;
         _movementLocked = false;
         LevelManager.openMouseEvent();
      }

      private static function releaseScene() : void
      {
         unlockMovement();
         restoreActors();
         ToolBarController.showOrHideAllUser(true);
         if(_raftDisabled)
         {
            _map.conLevel["raftTig"].mouseChildren = true;
            _map.conLevel["raftTig"].mouseEnabled = true;
            _map.conLevel["raftTig1"].mouseChildren = true;
            _map.conLevel["raftTig1"].mouseEnabled = true;
            _raftDisabled = false;
         }
      }

      private static function initRule(clip:MovieClip, visible:Boolean = false, frame:uint = 1, showOthers:Boolean = true, showSelf:Boolean = true) : void
      {
         clip.visible = visible;
         clip.gotoAndStop(frame);
         ToolBarController.showOrHideAllUser(showOthers);
         if(!showSelf) hideActors();
      }

      public static function goStep1() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         NpcDialog.show(NPC.LAIKE,["啊！你不会连0xff0000冰狐0xffffff都不知道吧？自从它的出现，整个裂空星际就被搞的乱七八糟，你看，连我们都要成为它的傀儡，真不甘心！"],["可恶的家伙！"],[function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.LAIKE,["哎…这次轮到0xff0000泡泡一族0xffffff了，看来冰狐一定是想扩大自己的势力！"],["什么！泡泡一族！"],[function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.SEER,["不行，我一定要弄清楚事情的真相，不能再让其他精灵深受其害了，还有莱克、丽萨克，你们也回到自己的星球吧！不要再助纣为虐了！"],["我现在就进去看看！"],[function():void
               {
            if(_map !== owner) return;
                  TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
                  {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                     CommonUI.addYellowArrow(_map.conLevel["door_0"],0,0,300);
                  });
               }]);
            }]);
         }]);
      }
      
      public static function goStep2() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap684,true,1,false);
         AnimateManager.playMcAnimate(_mcForMap684,1,"task_788_mc1",function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.ANYEBINGFU,["哼哼！如果你们肯为我效劳，今后一定可以成为精灵世界中的佼佼者！否则你们的后果就会像繁殖精灵一样！"],null,null,false,function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.SEER,["不好！泡泡一族果然被控制住了，但是怎么少了一个呢？神枪去哪里了！ 先让我观察一下！"],null,null,false,function():void
               {
            if(_map !== owner) return;
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_788_1"),function():void
                  {
            if(_map !== owner) return;
                     NpcDialog.show(NPC.SEER,["太好了，神枪没被抓到，我好像还感应到它正在向我求救！一定要想办法过去才行！"],["咦！河边有木筏，这就简单了！"],[function():void
                     {
            if(_map !== owner) return;
                        AnimateManager.playMcAnimate(_mcForMap684,2,"task_788_mc2",function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.SEER,["太好了，趁这家伙进去的时候，必须抓紧时间拯救泡泡一族，否则就没机会了！"],["继续前进！"],[function():void
                           {
            if(_map !== owner) return;
                              _movementLocked = true;
                              LevelManager.closeMouseEvent();
                              MainManager.actorModel.moveAndAction(new Point(100,250),function():void
                              {
            if(_map !== owner) return;
                                 unlockMovement();
                                 NpcDialog.show(NPC.SEER,["不好，这里有岩石断层，看来要过去还是有一定难度的！难道会有机关！"],["让我去附近找找！"],[function():void
                                 {
            if(_map !== owner) return;
                                    AnimateManager.playMcAnimate(_mcForMap684,3,"task_788_mc3",function():void
                                    {
            if(_map !== owner) return;
                                       CommonUI.addYellowArrow(_map.conLevel["bridge"],150,150,300);
                                    });
                                 }]);
                              });
                           }]);
                        });
                     }]);
                  });
               });
            });
         });
      }
      
      public static function onBridge() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         CommonUI.removeYellowArrow(_map.conLevel["bridge"]);
         NpcDialog.show(NPC.SEER,["哇！这也太神奇了吧！在这里居然会有这样天然的机关，大自然太不可思议啦！"],null,null,false,function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.SEER,["我还是抓紧时间去河边吧！利用木筏一定可以到达对岸的，泡泡一族你们等着我！"],["去河边准备木筏！"],[function():void
            {
            if(_map !== owner) return;
               CommonUI.addYellowArrow(_map.conLevel["raftTig788"],0,0,300);
               _map.conLevel["raftTig788"].visible = true;
               ToolTipManager.add(_map.conLevel["raftTig788"],"小木舟");
               _map.conLevel["raftTig788"].buttonMode = true;
               _map.conLevel["raftTig788"].addEventListener(MouseEvent.CLICK,onRaftClick);
            }]);
         });
      }
      
      private static function onRaftClick(param1:MouseEvent) : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         var event:MouseEvent = param1;
         CommonUI.removeYellowArrow(_map.conLevel["raftTig788"]);
         _map.conLevel["raftTig788"].visible = false;
         _map.conLevel["raftTig788"].buttonMode = false;
         _map.conLevel["raftTig788"].removeEventListener(MouseEvent.CLICK,onRaftClick);
         _movementLocked = true;
                              LevelManager.closeMouseEvent();
         MainManager.actorModel.moveAndAction(new Point(680,350),function():void
         {
            if(_map !== owner) return;
            unlockMovement();
            TasksManager.complete(TASK_ID,1,function(param1:Boolean):void
            {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
               goStep3();
            });
         });
      }
      
      public static function goStep3() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap684,true,4,false,false);
         _map.conLevel["raft_1"].visible = false;
         AnimateManager.playMcAnimate(_mcForMap684,4,"task_788_mc4",function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.SEER,["哈哈！这也太顺利了吧！一点阻碍都没有！莫非暗夜冰狐轻敌了？"],["不管了，先渡河再说！"],[function():void
            {
            if(_map !== owner) return;
               AnimateManager.playMcAnimate(_mcForMap684,5,"task_788_mc5",function():void
               {
            if(_map !== owner) return;
                  NpcDialog.show(NPC.ANYEBINGFU,["多管闲事的家伙，既然你能到这里来说明你也小有实力，不过这次你可没这么容易阻止我了！繁殖精灵的计划失败只是个意外，有本事过来再说吧！"],["什么！它想干嘛？"],[function():void
                  {
            if(_map !== owner) return;
                     AnimateManager.playMcAnimate(_mcForMap684,6,"task_788_mc6",function():void
                     {
            if(_map !== owner) return;
                        NpcDialog.show(NPC.ANYEBINGFU,["哈哈哈！不堪一击的家伙，现在你已经没有木筏了，看你怎么渡河，想救你的伙伴？做梦吧你！"],["可恶！！！"],[function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.SEER,["你也太小看我了吧！就你这点实力还想再精灵界立足，笑死人了！告诉你，我们赛尔是不会轻易认输的！"],["要想办法渡河才行！"],[function():void
                           {
            if(_map !== owner) return;
                              AnimateManager.playMcAnimate(_mcForMap684,7,"task_788_mc7",function():void
                              {
            if(_map !== owner) return;
                                 NpcDialog.show(NPC.SEER,["住手，你这个卑鄙的小人！有本事你就冲我来，何必为难这些精灵呢？"],["时间在你手中哦！"],[function():void
                                 {
            if(_map !== owner) return;
                                    NpcDialog.show(NPC.SEER,["看来木筏没受到多大损毁，如果能找到0xff0000残余的木块0xffffff我想就能重新出发了！"],["一定就在附近！"],[function():void
                                    {
            if(_map !== owner) return;
                                       _mcForMap684.gotoAndStop(8);
                                       restoreActors();
                                       MainManager.actorModel.x = 620;
                                       MainManager.actorModel.y = 400;
                                       CommonUI.addYellowArrow(_map.conLevel["raftTig2"],0,0,300);
                                       _map.conLevel["raftTig2"].buttonMode = true;
                                       _map.conLevel["raftTig2"].addEventListener(MouseEvent.CLICK,onRaftClick2);
                                    }]);
                                 }]);
                              });
                           }]);
                        }]);
                     });
                  }]);
               });
            }]);
         });
      }
      
      private static function onRaftClick2(param1:MouseEvent) : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         var event:MouseEvent = param1;
         CommonUI.removeYellowArrow(_map.conLevel["raftTig2"]);
         _map.conLevel["raftTig2"].buttonMode = false;
         _map.conLevel["raftTig2"].removeEventListener(MouseEvent.CLICK,onRaftClick2);
         NpcDialog.show(NPC.SEER,["耶，太棒了，终于倒找小木舟的部件，这次渡河不能再失败了！"],["立刻整修小木舟！"],[function():void
         {
            if(_map !== owner) return;
            hideActors();
            AnimateManager.playMcAnimate(_mcForMap684,9,"task_788_mc9",function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.SEER,["泡泡一族，我来了，这次一定不会让你们失望！暗夜冰狐我绝不会让你的阴谋得逞！"],["开始渡河！"],[function():void
               {
            if(_map !== owner) return;
                  TasksManager.complete(TASK_ID,2,function(param1:Boolean):void
                  {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                     goStep4();
                  });
               }]);
            });
         }]);
      }
      
      public static function goStep4() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap684,true,9,false,false);
         _map.conLevel["raft_1"].visible = false;
         AnimateManager.playMcAnimate(_mcForMap684,10,"task_788_mc10",function():void
         {
            if(_map !== owner) return;
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_788_2"),function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.ANYEBINGFU,["可恶，竟然没射中！气死我了！！！"],null,null,false,function():void
               {
            if(_map !== owner) return;
                  NpcDialog.show(NPC.SEER,["哇！那不是佐洛吗？幸好是它帮我挡了一下，否则我和小木舟估计又要受到重创了！"],["马上就要抵达对岸了！"],[function():void
                  {
            if(_map !== owner) return;
                     AnimateManager.playMcAnimate(_mcForMap684,11,"task_788_mc11",function():void
                     {
            if(_map !== owner) return;
                        NpcDialog.show(NPC.SEER,["暗夜冰狐，我来了！你的阴谋将由我粉碎，啊哈哈哈！"],["臭屁的小子！"],[function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.ANYEBINGFU,["别以为你这样就能战胜我，既然来到这里，那我就成全你们，一起死吧！"],["看你能不能过我这关再说！"],[function():void
                           {
            if(_map !== owner) return;
                              AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_788_3"),function():void
                              {
            if(_map !== owner) return;
                                 TasksManager.complete(TASK_ID,3,function(param1:Boolean):void
                                 {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                                    goStep5();
                                 });
                              });
                           }]);
                        }]);
                     });
                  }]);
               });
            });
         });
      }
      
      public static function goStep5() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap684,true,12,false,false);
         _map.conLevel["raft_1"].visible = false;
         NpcDialog.show(NPC.ANYEBINGFU,["哼哼！不错，有点意思！不过就算你们使出了全身的招数，还是无法伤害我的，别忘记，我暗夜冰狐，水晶和冰都是我最拿手的绝招！"],["可恶，这下可惨了！"],[function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.ANYEBINGFU,["你们别急着气馁，我的侵略才刚刚开始！我还没和你们玩够呢？今天就算你们走运，我们下次再见时，我可不会手下留情咯！"],["等等..冰狐，你到底想干什么！"],[function():void
            {
            if(_map !== owner) return;
               AnimateManager.playMcAnimate(_mcForMap684,12,"task_788_mc12",function():void
               {
            if(_map !== owner) return;
                  NpcDialog.show(NPC.ANYEBINGFU,["想干什么！我这次来的目的就是统治精灵界，我要成为精灵世界中最强的存在！"],["什么！你想统治精灵界？"],[function():void
                  {
            if(_map !== owner) return;
                     NpcDialog.show(NPC.ANYEBINGFU,["之前的繁殖精灵和泡泡一族只是我随便找的傀儡，只有找到双子星兄弟，我的梦想才能实现！我知道其中一个就在勇者之塔！"],["啊！勇者之塔？？双子星兄弟？？"],[function():void
                     {
            if(_map !== owner) return;
                        AnimateManager.playMcAnimate(_mcForMap684,13,"task_788_mc13",function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.SEER,["暗夜冰狐口中的双子星兄弟，难道会是肯？？？？下次它一定会比现在更强，我们一定要比他先找到双子星兄弟！"],null,null,false,function():void
                           {
            if(_map !== owner) return;
                              NpcDialog.show(NPC.SEER,["泡泡一族，我们有缘再见，大力好好照顾你的兄弟姐妹！"],["我先回去汇报了！"],[function():void
                              {
            if(_map !== owner) return;
                                 AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_788_4"),function():void
                                 {
            if(_map !== owner) return;
                                    TasksManager.complete(TASK_ID,4,function(success:Boolean):void
                                    {
                                       if(_map !== owner) return;
                                       releaseScene();
                                       if(!success) return;
                                       DisplayUtil.removeForParent(_mcForMap684);
                                       DisplayUtil.removeForParent(_map.conLevel["raftTig788"]);
                                       _map.conLevel["raft_1"].visible = true;
                                       MainManager.actorModel.x = 750;
                                       MainManager.actorModel.y = 400;
                                    });
                                 });
                              }]);
                           });
                        });
                     }]);
                  }]);
               });
            }]);
         }]);
      }
      
      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map !== map) return;
         if(map.conLevel["accept788"])
         {
            CommonUI.removeYellowExcal(map.conLevel["accept788"]);
            map.conLevel["accept788"].removeEventListener(MouseEvent.CLICK,onAcceptClick);
         }
         if(map.conLevel["raftTig788"])
         {
            ToolTipManager.remove(map.conLevel["raftTig788"]);
            CommonUI.removeYellowArrow(map.conLevel["raftTig788"]);
            map.conLevel["raftTig788"].removeEventListener(MouseEvent.CLICK,onRaftClick);
         }
         if(map.conLevel["raftTig2"])
         {
            CommonUI.removeYellowArrow(map.conLevel["raftTig2"]);
            map.conLevel["raftTig2"].removeEventListener(MouseEvent.CLICK,onRaftClick2);
         }
         if(map.conLevel["bridge"]) CommonUI.removeYellowArrow(map.conLevel["bridge"]);
         if(map.conLevel["door_0"]) CommonUI.removeYellowArrow(map.conLevel["door_0"]);
         releaseScene();
         _map = null;
         _mcForMap684 = null;
      }
   }
}
