package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.OgreController;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.AppModel;
   import com.robot.core.mode.OgreModel;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;

   public class Task796
   {
      private static const TASK_ID:uint = 796;
      private static var _mcForMap10053:MovieClip;
      private static var _mcForMap684:MovieClip;
      private static var _mcForMap685:MovieClip;
      private static var _map:BaseMapProcess;
      private static var _app:AppModel;
      private static var _introRunning:Boolean;
      private static var _iceHintReady:Boolean;
      private static var _movementLocked:Boolean;
      private static var _raftDisabled:Boolean;
      private static var _hiddenActor:DisplayObject;
      private static var _hiddenPet:DisplayObject;
      private static var _actorWasVisible:Boolean;
      private static var _petWasVisible:Boolean;
      private static var _ogresHidden:Boolean;
      private static var _ogresWereVisible:Boolean;
      private static var _nextTaskOwner:BaseMapProcess;

      public static function acceptTask() : void
      {
         goStep1();
      }

      public static function initTaskForMap9(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
               if(_map !== map) return;
               if(!param1[0])
               {
                  goStep1();
               }
            });
         }
      }
      
      public static function initTaskForMap684(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         _mcForMap684 = _map.conLevel["task_796_1"];
         _mcForMap684.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
               if(_map !== map) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  goStep2();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap684);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap684);
         }
      }
      
      public static function initTaskForMap685(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         _iceHintReady = false;
         _mcForMap685 = _map.animatorLevel["task_796_2"];
         _mcForMap685.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
               if(_map !== map) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  goStep3();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  goStep5();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && Boolean(param1[4]) && !param1[5])
               {
                  goStep6();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap685);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap685);
         }
      }
      
      public static function initTaskForMap10053(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         _mcForMap10053 = _map.animatorLevel["task_796_3"];
         _mcForMap10053.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
               if(_map !== map) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  goStep4();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap10053);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap10053);
         }
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

      private static function restoreRaft() : void
      {
         if(!_raftDisabled) return;
         _map.conLevel["raftTig"].mouseChildren = true;
         _map.conLevel["raftTig"].mouseEnabled = true;
         _raftDisabled = false;
      }

      private static function releaseScene() : void
      {
         unlockMovement();
         restoreActors();
         restoreRaft();
         ToolBarController.showOrHideAllUser(true);
         if(_ogresHidden)
         {
            OgreController.isShow = _ogresWereVisible;
            _ogresHidden = false;
         }
         _introRunning = false;
      }

      private static function initRule(clip:MovieClip, visible:Boolean = false, frame:uint = 1, showOthers:Boolean = true, showSelf:Boolean = true, showOgres:Boolean = true) : void
      {
         clip.visible = visible;
         clip.gotoAndStop(frame);
         ToolBarController.showOrHideAllUser(showOthers);
         if(!showSelf) hideActors();
         if(!showOgres && !_ogresHidden)
         {
            _ogresWereVisible = OgreModel.isShow;
            _ogresHidden = true;
            OgreController.isShow = false;
         }
      }

      public static function goStep1() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null || _introRunning) return;
         _introRunning = true;
         NpcDialog.show(NPC.SEER,["美丽的爱丽丝，我已经对0xff0000暗夜冰狐0xffffff的行踪有所了解，之前我已经将泡泡一族成功救出，看来这个0xff0000暗夜冰狐0xffffff不简单啊！"],null,null,false,function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.IRIS,["啊！真的啊！那可怎么办啊！要不我们问问博士派特，看看他有什么办法吧！"],["联线博士！"],[function():void
            {
            if(_map !== owner) return;
               if(!_app)
               {
                  _app = ModuleManager.getModule(ClientConfig.getAppModule("TaskIntro_796"),"正在连线……");
                  _app.setup();
                  _app.show();
               }
               else
               {
                  _app.show();
               }
            }]);
         });
      }
      
      public static function onVideoOver() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         NpcDialog.show(NPC.IRIS,[MainManager.actorInfo.nick + "，你一人前往可要小心哦！我会随时和你保持联系的！"],["恩恩，我一定会凯旋的！"],[function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.SEER,["暗夜冰狐，我这就来拆穿你的诡计，你就等着吧！"],["前往泰若星！"],[function():void
            {
            if(_map !== owner) return;
               TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
               {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                  var b:* = param1;
                  if(Boolean(b))
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_796_2"),function():void
                     {
            if(_map !== owner) return;
                        MapManager.changeMap(684);
                     });
                  }
               });
            }]);
         }]);
      }
      
      public static function goStep2() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap684,true,1,false);
         NpcDialog.show(NPC.SEER,["暗夜冰狐一定就在瀑布后的山洞中，我这次我倒要看看它还有什么伎俩！"],["继续前进！"],[function():void
         {
            if(_map !== owner) return;
            CommonUI.addYellowArrow(_map.conLevel["bridge"],150,150,300);
         }]);
      }
      
      public static function onBridge() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         CommonUI.removeYellowArrow(_map.conLevel["bridge"]);
         _raftDisabled = true;
         _map.conLevel["raftTig"].mouseChildren = false;
         _map.conLevel["raftTig"].mouseEnabled = false;
         NpcDialog.show(NPC.SEER,["咦？那里怎么会有蛋呢？好奇怪啊！我记得上次和暗夜冰狐在这里遭遇的时候，没有这些啊！"],["先过去看看！"],[function():void
         {
            if(_map !== owner) return;
            _map.conLevel["eggTig"].visible = true;
            CommonUI.addYellowArrow(_map.conLevel["eggTig"],0,0,300);
            ToolTipManager.add(_map.conLevel["eggTig"],"皮特萨罗的精灵蛋");
            _map.conLevel["eggTig"].buttonMode = true;
            _map.conLevel["eggTig"].addEventListener(MouseEvent.CLICK,onEggClick);
         }]);
      }
      
      private static function onEggClick(param1:MouseEvent) : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         var event:MouseEvent = param1;
         CommonUI.removeYellowArrow(_map.conLevel["eggTig"]);
         _map.conLevel["eggTig"].visible = false;
         _movementLocked = true;
         LevelManager.closeMouseEvent();
         MainManager.actorModel.moveAndAction(new Point(570,370),function():void
         {
            if(_map !== owner) return;
            unlockMovement();
            _map.conLevel["eggTig"].buttonMode = false;
            _map.conLevel["eggTig"].removeEventListener(MouseEvent.CLICK,onEggClick);
            ToolTipManager.remove(_map.conLevel["eggTig"]);
            _mcForMap684.gotoAndStop(2);
            hideActors();
            AnimateManager.playMcAnimate(_mcForMap684,2,"task_796_mc2",function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.PITESALUO,["你是谁家的孩子，这么没有教养！你不知道别人的东西不能乱碰吗？你最好离开这里否则我就对你不客气了！"],["别别…你误会了，我不是想要你的蛋！"],[function():void
               {
            if(_map !== owner) return;
                  NpcDialog.show(NPC.SEER,["我是来这里寻找0xff0000暗夜冰狐0xffffff的踪迹，正好看到这里有精灵蛋，我还以为是这家伙的呢！"],["什么！暗夜冰狐？？？"],[function():void
                  {
            if(_map !== owner) return;
                     AnimateManager.playMcAnimate(_mcForMap684,3,"task_796_mc3",function():void
                     {
            if(_map !== owner) return;
                        NpcDialog.show(NPC.PITESALUO,["如果这是真的，那我真把窝安错了地方，这样该有多危险！我之前听说这家伙无恶不作！"],["恩，不过你放心，这里很安全！"],[function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.PITESALUO,["真的吗？那太好了，之前我错怪你了！因为暗夜冰狐的能力实在太强大了，我还要帮我的孩子们找一个更安全的星球生活，你可要小心啊！"],["恩恩，我这就去前面的冰封洞窟！"],[function():void
                           {
            if(_map !== owner) return;
                              AnimateManager.playMcAnimate(_mcForMap684,4,"task_796_mc4",function():void
                              {
            if(_map !== owner) return;
                                 NpcDialog.show(NPC.SEER,["前面就是冰封洞窟，看来这里一定就是暗夜冰狐的老巢，让我去里面看看究竟吧！"],null,null,false,function():void
                                 {
            if(_map !== owner) return;
                                    TasksManager.complete(TASK_ID,1,function(success:Boolean):void
                                    {
                                       if(_map !== owner) return;
                                       if(!success) { releaseScene(); return; }
                                       restoreActors();
                                       restoreRaft();
                                       CommonUI.addYellowArrow(_map.conLevel["raftTig"],0,0,300);
                                       DisplayUtil.removeForParent(_map.conLevel["raftTig788"]);
                                    });
                                 });
                              });
                           }]);
                        }]);
                     });
                  }]);
               }]);
            });
         });
      }
      
      public static function goStep3() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap685,true,1,false);
         NpcDialog.show(NPC.SEER,["哇！这里就是暗夜冰狐的老巢，但是怎么不见它人呢？躲哪里去了啊！"],["让我先观察一下！"],[function():void
         {
            if(_map !== owner) return;
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_796_3"),function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.SEER,["什么？这里竟然被关押了这么多火系精灵，博士说的没错，福克斯果然也在这里，看来暗夜火狐一定是去了其他地方！"],["我要想办法过去才行！"],[function():void
               {
            if(_map !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap685,1,"task_796_mc1",function():void
                  {
            if(_map !== owner) return;
                     _iceHintReady = true;
                     if(_map.typeLevel.getChildByName("barrier") == null)
                     {
                        onShootIceOver();
                     }
                     else
                     {
                        NpcDialog.show(NPC.SEER,["冰锥？？？让我试试头部射击能不能把它射下来！"],["利用头部射击攻击冰锥！"]);
                        _map.conLevel["iceBridge"].buttonMode = true;
                        _map.conLevel["iceBridge"].addEventListener(MouseEvent.CLICK,onIceBridgeClick);
                        CommonUI.addYellowArrow(_map.conLevel["iceBridge"],-20,120,200);
                     }
                  });
               }]);
            });
         }]);
      }
      
      private static function onIceBridgeClick(param1:MouseEvent) : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         NpcDialog.show(NPC.SEER,["冰锥？？？让我试试头部射击能不能把它射下来！"],["利用头部射击攻击冰锥！"]);
      }
      
      public static function onShootIceOver() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null || !_iceHintReady) return;
         _iceHintReady = false;
         CommonUI.removeYellowArrow(_map.conLevel["iceBridge"]);
         _map.conLevel["iceBridge"].buttonMode = false;
         _map.conLevel["iceBridge"].removeEventListener(MouseEvent.CLICK,onIceBridgeClick);
         CommonUI.addYellowExcal(_map.conLevel["petTig"],50,0);
         _map.conLevel["petTig"].buttonMode = true;
         _map.conLevel["petTig"].addEventListener(MouseEvent.CLICK,onPetClick);
      }
      
      private static function onPetClick(param1:MouseEvent) : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         var event:MouseEvent = param1;
         CommonUI.removeYellowExcal(_map.conLevel["petTig"]);
         _map.conLevel["petTig"].buttonMode = false;
         _map.conLevel["petTig"].removeEventListener(MouseEvent.CLICK,onPetClick);
         _movementLocked = true;
         LevelManager.closeMouseEvent();
         MainManager.actorModel.moveAndAction(new Point(400,400),function():void
         {
            if(_map !== owner) return;
            unlockMovement();
            NpcDialog.show(NPC.FOX,["烈焰…烈焰丛林，快去那里，否则火狐长老就危险了！！" + MainManager.actorInfo.nick + "，你一定要拯救火狐一族，暗夜冰狐这次一定是为了复仇而来！"],["什么，看来一定要尽快赶到烈焰丛林才行！"],[function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.SEER,["那你们先在这里休息吧！我会尽快赶回来救你们的，你们一定要坚持住啊！"],["前往烈焰丛林！"],[function():void
               {
            if(_map !== owner) return;
                  TasksManager.complete(TASK_ID,2,function(param1:Boolean):void
                  {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                     if(param1)
                     {
                        MapManager.changeLocalMap(10053);
                     }
                  });
               }]);
            }]);
         });
      }
      
      public static function goStep4() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap10053,true,1,false,true,false);
         AnimateManager.playMcAnimate(_mcForMap10053,1,"task_796_mc1",function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.SEER,["哇！看这情况，大战即将开始，相信火狐长老一定可以好好修理暗夜冰狐！"],["长老加油！！！！"],[function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.ANYEBINGFU,["又是你，讨厌的臭铁皮！让你开开眼界吧！火狐一族，我要让你们彻底消失！"],["烈焰火狐接招吧！"],[function():void
               {
            if(_map !== owner) return;
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_796_4"),function():void
                  {
            if(_map !== owner) return;
                     MainManager.actorModel.x = 350;
                     MainManager.actorModel.y = 350;
                     _mcForMap10053.gotoAndStop(2);
                     NpcDialog.show(NPC.SEER,["可恶，难道就连火狐长老都不是它的对手吗？这个世界已经没有谁能阻止暗夜冰狐了吗？"],null,null,false,function():void
                     {
            if(_map !== owner) return;
                        AnimateManager.playMcAnimate(_mcForMap10053,2,"task_796_mc2",function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.SEER,["恩，小家伙们，你们放心，我发誓一定会把火狐长老救回来的！"],["我这就去冰封洞窟！"],[function():void
                           {
            if(_map !== owner) return;
                              TasksManager.complete(TASK_ID,3,function(param1:Boolean):void
                              {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                                 if(param1)
                                 {
                                    MapManager.changeMap(685);
                                 }
                              });
                           }]);
                        });
                     });
                  });
               }]);
            }]);
         });
      }
      
      public static function goStep5() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap685,true,2,false);
         AnimateManager.playMcAnimate(_mcForMap685,2,"task_796_mc2",function():void
         {
            if(_map !== owner) return;
            NpcDialog.show(NPC.SEER,["住手，暗夜冰狐！快点放了火狐长老还有这里的精灵，否则我要你好看！"],["哈哈哈！真是天大的笑话！"],[function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.ANYEBINGFU,["刚才你也看到了，按你现在的战斗力，你觉得能伤到我吗？我要的是火狐一族的力量，也就是九尾的力量！你还是速速逃命去吧！"],["你……"],[function():void
               {
            if(_map !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap685,3,"task_796_mc3",function():void
                  {
            if(_map !== owner) return;
                     NpcDialog.show(NPC.ANYEBINGFU,["嗯？又来几只找死的，正好这次一并把你们全部消灭！等吸收了你九尾的能量，我就宇宙无敌啦！"],null,null,false,function():void
                     {
            if(_map !== owner) return;
                        NpcDialog.show(NPC.HUOHUZHANGLAO,["冰狐，你是无法拥有九尾的能量，当年的事情只是一场误会而已！"],["不是误会，是你们火狐一手造成的！"],[function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.SEER,["当年？难道很早之前冰狐和火狐都已经认识了？他们之间发生什么了呢？"],["再继续观察！"],[function():void
                           {
            if(_map !== owner) return;
                              NpcDialog.show(NPC.FOX,["爷爷，我一定会救你出去的，暗夜冰狐我现在就挑战你！"],["就凭你，哼哼，来吧！"],[function():void
                              {
            if(_map !== owner) return;
                                 AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_796_5"),function():void
                                 {
            if(_map !== owner) return;
                                    _mcForMap685.gotoAndStop(4);
                                    NpcDialog.show(NPC.ANYEBINGFU,["不可能！这绝对不可能，一个小小的福克斯怎么会有九尾的力量？？"],null,null,false,function():void
                                    {
            if(_map !== owner) return;
                                       NpcDialog.show(NPC.HUOHUZHANGLAO,["冰狐，现在你应该知道我们火狐一族的实力吧！告诉你当年的事情完全是因为珀伽索斯，是它在从中捣鬼，所以火狐一族才会和冰狐一族发生战争！"],["我才不信！"],[function():void
                                       {
            if(_map !== owner) return;
                                          NpcDialog.show(NPC.HUOHUZHANGLAO,["其实当年是因为….."],null,null,false,function():void
                                          {
            if(_map !== owner) return;
                                             CartoonManager.play(ClientConfig.getFullMovie("cartoon/task_796"),function():void
                                             {
            if(_map !== owner) return;
                                                NpcDialog.show(NPC.HUOHUZHANGLAO,["孩子，要不是珀伽索斯，我们和冰狐一族也不会发生战争，都是它的诡计，最近我有预感，它已经出现了！我们现在更应该团结！"],["这是真的吗？"],[function():void
                                                {
            if(_map !== owner) return;
                                                   TasksManager.complete(TASK_ID,4,function(param1:Boolean):void
                                                   {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                                                      if(param1)
                                                      {
                                                         goStep6();
                                                      }
                                                   });
                                                }]);
                                             });
                                          });
                                       }]);
                                    });
                                 });
                              }]);
                           }]);
                        }]);
                     });
                  });
               }]);
            }]);
         });
      }
      
      public static function goStep6() : void
      {
         var owner:BaseMapProcess = _map;
         if(owner == null) return;
         initRule(_mcForMap685,true,4,false);
         NpcDialog.show(NPC.ANYEBINGFU,["可恶的珀伽索斯，因为它我做了多少错事，伤害繁殖精灵，威胁泡泡一族，现在就连你们也差点被我害的….我…."],["别难过了，孩子和我们回烈焰丛林吧！"],[function():void
         {
            if(_map !== owner) return;
            AnimateManager.playMcAnimate(_mcForMap685,4,"task_796_mc4",function():void
            {
            if(_map !== owner) return;
               NpcDialog.show(NPC.ANYEBINGFU,["什么！我这样对你们，你还让我回去？？？"],["孰人无过啊！"],[function():void
               {
            if(_map !== owner) return;
                  NpcDialog.show(NPC.HUOHUZHANGLAO,["走吧！到了烈焰丛林，相信我们一定可以和睦相处的，也让我们火狐一族弥补多年以来的宿愿，火狐和冰狐以后并成为0xff0000神狐一族0xffffff！"],["感谢你，长老！"],[function():void
                  {
            if(_map !== owner) return;
                     AnimateManager.playMcAnimate(_mcForMap685,5,"task_796_mc5",function():void
                     {
            if(_map !== owner) return;
                        NpcDialog.show(NPC.SANWEIHU,["感谢你，" + MainManager.actorInfo.nick + "！要不是你一直和暗夜冰狐抗衡发现这里，我们还不知道怎么办呢？"],["哈哈！这个是我应该的嘛！"],[function():void
                        {
            if(_map !== owner) return;
                           NpcDialog.show(NPC.SANWEIHU,["有空的话，多来烈焰丛林看看我们哦！"],["恩，一定会，我还要把你进化的事情告诉博士呢！"],[function():void
                           {
            if(_map !== owner) return;
                              NpcDialog.show(NPC.SEER,["保重！神狐一族！！我们后会有期哦！"],null,null,false,function():void
                              {
            if(_map !== owner) return;
                                 AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_796_6"),function():void
                                 {
            if(_map !== owner) return;
                                    TasksManager.complete(TASK_ID,5,function(param1:Boolean):void
                                    {
            if(_map !== owner) return;
            if(!param1) { releaseScene(); return; }
                                       if(param1)
                                       {
                                          DisplayUtil.removeForParent(_mcForMap685);
                                          releaseScene();
                                          _nextTaskOwner = _map;
                                          LevelManager.topLevel.addEventListener(Event.ENTER_FRAME,onNextTaskReady);
                                       }
                                    });
                                 });
                              });
                           }]);
                        }]);
                     });
                  }]);
               }]);
            });
         }]);
      }
      
      private static function clearNextTask() : void
      {
         LevelManager.topLevel.removeEventListener(Event.ENTER_FRAME,onNextTaskReady);
         _nextTaskOwner = null;
      }

      private static function onNextTaskReady(event:Event) : void
      {
         if(_nextTaskOwner == null || _nextTaskOwner !== _map || MapManager.currentMap == null || MapManager.currentMap.id != 685)
         {
            clearNextTask();
            return;
         }
         // The completion callback acknowledges the save before reward alarms finish.
         if(LevelManager.topLevel.numChildren != 0) return;
         var owner:BaseMapProcess = _nextTaskOwner;
         clearNextTask();
         Task801.initTaskForMap685(owner);
      }

      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map !== map) return;
         clearNextTask();
         if(map.conLevel["eggTig"])
         {
            map.conLevel["eggTig"].removeEventListener(MouseEvent.CLICK,onEggClick);
            ToolTipManager.remove(map.conLevel["eggTig"]);
            CommonUI.removeYellowArrow(map.conLevel["eggTig"]);
         }
         if(map.conLevel["petTig"])
         {
            map.conLevel["petTig"].removeEventListener(MouseEvent.CLICK,onPetClick);
            CommonUI.removeYellowExcal(map.conLevel["petTig"]);
         }
         if(map.conLevel["iceBridge"])
         {
            map.conLevel["iceBridge"].removeEventListener(MouseEvent.CLICK,onIceBridgeClick);
            CommonUI.removeYellowArrow(map.conLevel["iceBridge"]);
         }
         if(map.conLevel["bridge"]) CommonUI.removeYellowArrow(map.conLevel["bridge"]);
         if(map.conLevel["raftTig"]) CommonUI.removeYellowArrow(map.conLevel["raftTig"]);
         if(_app != null)
         {
            _app.destroy();
            _app = null;
         }
         releaseScene();
         _iceHintReady = false;
         _mcForMap10053 = null;
         _mcForMap684 = null;
         _mcForMap685 = null;
         _map = null;
      }
   }
}
