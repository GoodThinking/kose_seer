package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.display.*;
   import flash.events.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task561
   {
      
      private static var _map:BaseMapProcess;
      private static var _hiddenActor:DisplayObject;
      private static var _hiddenPet:DisplayObject;
      private static var _actorWasVisible:Boolean;
      private static var _petWasVisible:Boolean;
      
      private static var _game:AppModel;
      
      private static var _panel:AppModel;
      
      public static var _num:Array = [false,false,false];
      
      public function Task561()
      {
         super();
      }
      
      public static function initTask() : void
      {
         resetRuntimeState();
         ToolBarController.showOrHideAllUser(false);
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_561_1"),function():void
         {
            NpcDialog.show(NPC.IRIS,["阿哆拉的牺牲只能让咤克斯短暂消失，我们一定要在海盗之前找到赫尔卡星宝藏，决不能让他们打开！！"],["谁……是谁在那里？快给我出来！"],[function():void
            {
               var continueAfterDisguise:* = undefined;
               if(MapManager.currentMap.id == 9)
               {
                  continueAfterDisguise = function():void
                  {
                     NpcDialog.show(NPC.IRIS,["糟糕……艾里逊竟然利用尼尔变身来骗取我们的钥匙……快！没时间了！快去赫鲁卡星看看！一定要阻止他！"],["出发！"],[function():void
                     {
                        AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_561_2"),function():void
                        {
                           ToolBarController.showOrHideAllUser(true);
                           MapManager.changeMap(459);
                        });
                     }]);
                  };
                  if(Boolean(MapManager.currentMap.topLevel["task_561"]))
                  {
                     AnimateManager.playMcAnimate(MapManager.currentMap.topLevel["task_561"],0,"",continueAfterDisguise);
                  }
                  else
                  {
                     continueAfterDisguise();
                  }
               }
            }]);
         });
      }
      
      private static function resetRuntimeState() : void
      {
         _num = [false,false,false];
      }
      
      public static function initTask_459(param1:BaseMapProcess) : void
      {
         _map = param1;
         ToolTipManager.add(_map.conLevel["xuanMc"],"赫鲁卡星");
         _map.conLevel["xuanMc"].buttonMode = true;
         _map.conLevel["xuanMc"].addEventListener(MouseEvent.CLICK,onXuanClick);
      }
      
      private static function onXuanClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         _map.conLevel["xuanMc"].removeEventListener(MouseEvent.CLICK,onXuanClick);
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_559_0"),function():void
         {
            if(_map != map) return;
            MapManager.changeMap(460);
         });
      }
      
      public static function initTask_460(param1:BaseMapProcess, param2:int) : void
      {
         var step:int = 0;
         var map:BaseMapProcess = param1;
         step = param2;
         _map = map;
         if(TasksManager.getTaskStatus(TaskController_561.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_561.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(!param1[0])
               {
                  startPro_0(step);
               }
               else
               {
                  DisplayUtil.removeForParent(_map.animatorLevel["task_561_1"]);
                  _map.animatorLevel["task_561_1"] = null;
                  DisplayUtil.removeForParent(_map.animatorLevel["task_561_2"]);
                  _map.animatorLevel["task_561_2"] = null;
                  DisplayUtil.removeForParent(_map.animatorLevel["guide_mc"]);
                  _map.animatorLevel["guide_mc"] = null;
                  DisplayUtil.removeForParent(_map.animatorLevel["guide_mc_0"]);
                  _map.animatorLevel["guide_mc_0"] = null;
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_map.animatorLevel["task_561_1"]);
            _map.animatorLevel["task_561_1"] = null;
            DisplayUtil.removeForParent(_map.animatorLevel["task_561_2"]);
            _map.animatorLevel["task_561_2"] = null;
            DisplayUtil.removeForParent(_map.animatorLevel["guide_mc_0"]);
            _map.animatorLevel["guide_mc_0"] = null;
         }
      }
      
      private static function startPro_0(param1:int) : void
      {
         var step:int = param1;
         var map:BaseMapProcess = _map;
         _map.animatorLevel["guide_mc"].visible = false;
         _map.animatorLevel["guide_mc_0"].visible = false;
         if(step == 0)
         {
            NpcDialog.show(NPC.SEER,["我的妈呀！每次来这里都是天旋地转……咦，这个难道是艾里逊小飞船留下的吗？"],["快跟过去看看！"],[function():void
            {
               if(_map != map) return;
               _map.animatorLevel["guide_mc"].visible = true;
            }]);
         }
         if(step == 1)
         {
            NpcDialog.show(NPC.NIER,["对……对不起！我不是故意要帮海盗的，只是他前面抓住了我的伙伴……"],["没关系，你和你的伙伴安全就好！"],[function():void
            {
               if(_map != map) return;
               NpcDialog.show(NPC.NIER,[MainManager.actorInfo.formatNick + "，你真好！对了！海盗是往赫鲁卡城去了，听他说那里似乎有什么藏宝图？"],null,null,false,function():void
               {
                  if(_map != map) return;
                  TasksManager.complete(TaskController_561.TASK_ID,0,function(param1:Boolean):void
                  {
                     if(_map != map) return;
                     if(param1)
                     {
                        _map.animatorLevel["guide_mc_0"].visible = true;
                     }
                  });
               });
            }]);
         }
      }
      
      public static function initTask_461(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         if(TasksManager.getTaskStatus(TaskController_561.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_561.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
                  return;
               }
               DisplayUtil.removeForParent(_map.topLevel["task_561_1"]);
               _map.topLevel["task_561_1"] = null;
               DisplayUtil.removeForParent(_map.conLevel["task_561_2"]);
               _map.conLevel["task_561_2"] = null;
               DisplayUtil.removeForParent(_map.conLevel["task_561_3"]);
               _map.conLevel["task_561_3"] = null;
               if(Boolean(param1[1]) && !param1[2])
               {
                  startPro_2();
               }
               else
               {
                  DisplayUtil.removeForParent(_map.conLevel["task_561_4"]);
                  _map.conLevel["task_561_4"] = null;
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_map.topLevel["task_561_1"]);
            _map.topLevel["task_561_1"] = null;
            DisplayUtil.removeForParent(_map.conLevel["task_561_2"]);
            _map.conLevel["task_561_2"] = null;
            DisplayUtil.removeForParent(_map.conLevel["task_561_3"]);
            _map.conLevel["task_561_3"] = null;
            DisplayUtil.removeForParent(_map.conLevel["task_561_4"]);
            _map.conLevel["task_561_4"] = null;
         }
      }
      
      private static function startPro_1() : void
      {
         _map.conLevel["task_561_4"].visible = false;
         if(!_num[0])
         {
            ToolTipManager.add(_map.topLevel["task_561_1"],"磁卡");
            _map.topLevel["task_561_1"].buttonMode = true;
            _map.topLevel["task_561_1"].addEventListener(MouseEvent.CLICK,onItemClick);
         }
         else
         {
            DisplayUtil.removeForParent(_map.topLevel["task_561_1"]);
            _map.topLevel["task_561_1"] = null;
         }
         if(!_num[1])
         {
            ToolTipManager.add(_map.conLevel["task_561_2"],"磁卡");
            _map.conLevel["task_561_2"].buttonMode = true;
            _map.conLevel["task_561_2"].addEventListener(MouseEvent.CLICK,onItemClick);
         }
         else
         {
            DisplayUtil.removeForParent(_map.conLevel["task_561_2"]);
            _map.conLevel["task_561_2"] = null;
         }
         if(!_num[2])
         {
            ToolTipManager.add(_map.conLevel["task_561_3"],"磁卡");
            _map.conLevel["task_561_3"].buttonMode = true;
            _map.conLevel["task_561_3"].addEventListener(MouseEvent.CLICK,onItemClick);
         }
         else
         {
            DisplayUtil.removeForParent(_map.conLevel["task_561_3"]);
            _map.conLevel["task_561_3"] = null;
         }
         checkNum();
      }
      
      private static function onItemClick(param1:MouseEvent) : void
      {
         var _loc2_:MovieClip = param1.currentTarget as MovieClip;
         ToolTipManager.remove(_loc2_);
         _loc2_.removeEventListener(MouseEvent.CLICK,onItemClick);
         _num[_loc2_.name.split("_")[2] - 1] = true;
         SimpleAlarm.show("你找到了一个藏宝磁卡");
         DisplayUtil.removeForParent(_loc2_);
         _loc2_ = null;
         checkNum();
      }
      
      private static function checkNum() : void
      {
         var map:BaseMapProcess = _map;
         if(Boolean(_num[0]) && Boolean(_num[1]) && Boolean(_num[2]))
         {
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_561_3"),function():void
            {
               if(_map != map) return;
               TasksManager.complete(TaskController_561.TASK_ID,1,function(param1:Boolean):void
               {
                  if(_map != map) return;
                  if(param1)
                  {
                     startPro_2();
                  }
               });
            });
         }
      }
      
      private static function startPro_2() : void
      {
         _map.conLevel["task_561_4"].visible = true;
         ToolTipManager.add(_map.conLevel["task_561_4"],"地穴");
         _map.conLevel["task_561_4"].buttonMode = true;
         _map.conLevel["task_561_4"].addEventListener(MouseEvent.CLICK,onDoorClick);
      }
      
      private static function onDoorClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         if(_map.conLevel["task_561_4"].currentFrame != _map.conLevel["task_561_4"].totalFrames)
         {
            AnimateManager.playMcAnimate(_map.conLevel["task_561_4"],0,"",function():void
            {
            });
         }
         else
         {
            if(!_game)
            {
               _game = new AppModel(ClientConfig.getGameModule("CipanPintuPanel"),"正在加载游戏");
               _game.setup();
               _game.sharedEvents.addEventListener("pintuComplete",onGameComplete);
            }
            _game.show();
         }
      }
      
      private static function onGameComplete(param1:Event) : void
      {
         var e:Event = param1;
         _game.sharedEvents.removeEventListener("pintuComplete",onGameComplete);
         var map:BaseMapProcess = _map;
         TasksManager.complete(TaskController_561.TASK_ID,2,function(param1:Boolean):void
         {
            if(_map != map) return;
            if(param1)
            {
               MapManager.changeMap(462);
            }
         });
      }
      
      public static function initTask_462(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         if(TasksManager.getTaskStatus(TaskController_561.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_561.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(Boolean(param1[2]) && !param1[3])
               {
                  startPro_3();
               }
               else
               {
                  DisplayUtil.removeForParent(_map.conLevel["ball"]);
                  _map.conLevel["ball"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["arrow"]);
                  _map.conLevel["arrow"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["task_561_1"]);
                  _map.conLevel["task_561_1"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["task_561_2"]);
                  _map.conLevel["task_561_2"] = null;
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_map.conLevel["ball"]);
            _map.conLevel["ball"] = null;
            DisplayUtil.removeForParent(_map.conLevel["arrow"]);
            _map.conLevel["arrow"] = null;
            DisplayUtil.removeForParent(_map.conLevel["task_561_1"]);
            _map.conLevel["task_561_1"] = null;
            DisplayUtil.removeForParent(_map.conLevel["task_561_2"]);
            _map.conLevel["task_561_2"] = null;
         }
      }
      
      private static function startPro_3() : void
      {
         ToolBarController.showOrHideAllUser(false);
         _map.conLevel["ball"].visible = false;
         _map.conLevel["arrow"].visible = false;
         ToolTipManager.add(_map.conLevel["clock"],"机械钟表");
         _map.conLevel["clock"].buttonMode = true;
         _map.conLevel["clock"].addEventListener(MouseEvent.CLICK,onClockClick);
         ToolTipManager.add(_map.conLevel["notice"],"机械装置");
         _map.conLevel["notice"].buttonMode = true;
         _map.conLevel["notice"].addEventListener(MouseEvent.CLICK,onNoticeClick);
      }
      
      private static function onNoticeClick(param1:MouseEvent) : void
      {
         if(!_panel)
         {
            _panel = new AppModel(ClientConfig.getAppModule("TaskIntroPanel_561"),"正在加载面板");
            _panel.setup();
         }
         _panel.show();
      }
      
      private static function onClockClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         _map.conLevel["clock"].stop();
         _map.conLevel["clock"].mouseEnabled = false;
         _map.conLevel["clock"].mouseChildren = false;
         if(_map.conLevel["clock"].currentFrame > 160 && _map.conLevel["clock"].currentFrame < 190)
         {
            AnimateManager.playMcAnimate(_map.conLevel["bird"],2,"mc_1",function():void
            {
               if(_map != map) return;
               _map.conLevel["bird"].gotoAndStop(1);
               ToolTipManager.remove(_map.conLevel["clock"]);
               _map.conLevel["clock"].removeEventListener(MouseEvent.CLICK,onClockClick);
               _map.conLevel["ball"].visible = true;
               _map.conLevel["arrow"].visible = true;
               ToolTipManager.add(_map.conLevel["ball"],"宝珠");
               DragManager.add(_map.conLevel["ball"],_map.conLevel["ball"]);
               _map.conLevel["ball"].addEventListener(MouseEvent.MOUSE_UP,onBallClick);
            });
         }
         else
         {
            AnimateManager.playMcAnimate(_map.conLevel["bird"],3,"mc_2",function():void
            {
               if(_map != map) return;
               _map.conLevel["clock"].play();
               _map.conLevel["clock"].mouseEnabled = true;
               _map.conLevel["clock"].mouseChildren = true;
            });
         }
      }
      
      private static function onBallClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(_map.conLevel["ball"].x > 734 && _map.conLevel["ball"].y > 152 && _map.conLevel["ball"].x < 808 && _map.conLevel["ball"].y < 206)
         {
            ToolTipManager.remove(_map.conLevel["ball"]);
            DragManager.remove(_map.conLevel["ball"]);
            _map.conLevel["ball"].removeEventListener(MouseEvent.MOUSE_UP,onBallClick);
            DisplayUtil.removeForParent(_map.conLevel["ball"]);
            _map.conLevel["ball"] = null;
            DisplayUtil.removeForParent(_map.conLevel["arrow"]);
            _map.conLevel["arrow"] = null;
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_561_4"),function():void
            {
               if(_map != map) return;
               hideActors();
               AnimateManager.playMcAnimate(_map.conLevel["task_561_1"],0,"",function():void
               {
                  if(_map != map) return;
                  AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_561_5"),function():void
                  {
                     if(_map != map) return;
                     AnimateManager.playMcAnimate(_map.conLevel["task_561_2"],0,"",function():void
                     {
                        if(_map != map) return;
                        restoreActors();
                        NpcDialog.show(NPC.DIEN,["我是来自未来空间的……"],["什么……"],[function():void
                        {
                           if(_map != map) return;
                           AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_561_6"),function():void
                           {
                              if(_map != map) return;
                              NpcDialog.show(NPC.DIEN,["这也就是我为什么讨厌赛尔号和赫尔卡星人的原因！但是没想到，你们为人忠厚老实，还热爱精灵……"],null,null,false,function():void
                              {
                                 if(_map != map) return;
                                 NpcDialog.show(NPC.DIEN,["我得先走了，我要看看咤克斯下一步的行踪，如果可能，我希望到时候你能帮助我……"],null,null,false,function():void
                                 {
                                    if(_map != map) return;
                                    NpcDialog.show(NPC.SEER,["什么……来自未来时空的迪恩！这太奇妙了！哎呀！快回赛尔号禀报咤克斯的情况！"],["返回赛尔号！"],[function():void
                                    {
                                       if(_map != map) return;
                                       TasksManager.complete(TaskController_561.TASK_ID,3,function(param1:Boolean):void
                                       {
                                          if(_map != map) return;
                                          if(param1)
                                          {
                                             MapManager.changeMap(9);
                                          }
                                       });
                                    }]);
                                 });
                              });
                           });
                        }]);
                     });
                  });
               });
            });
         }
         else
         {
            _map.conLevel["ball"].x = 307;
            _map.conLevel["ball"].y = 295;
         }
      }
      
      private static function hideActors() : void
      {
         if(_hiddenActor != null) return;
         _hiddenActor = MainManager.actorModel;
         _actorWasVisible = _hiddenActor.visible;
         _hiddenPet = MainManager.actorModel.pet;
         if(_hiddenPet != null)
         {
            _petWasVisible = _hiddenPet.visible;
            _hiddenPet.visible = false;
         }
         _hiddenActor.visible = false;
      }

      private static function restoreActors() : void
      {
         if(_hiddenActor != null) _hiddenActor.visible = _actorWasVisible;
         if(_hiddenPet != null) _hiddenPet.visible = _petWasVisible;
         _hiddenActor = null;
         _hiddenPet = null;
      }

      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map != map) return;
         restoreActors();
         ToolBarController.showOrHideAllUser(true);
         if(Boolean(_map.conLevel["xuanMc"]))
         {
            ToolTipManager.remove(_map.conLevel["xuanMc"]);
            _map.conLevel["xuanMc"].removeEventListener(MouseEvent.CLICK,onXuanClick);
         }
         if(Boolean(_map.topLevel["task_561_1"]))
         {
            ToolTipManager.remove(_map.topLevel["task_561_1"]);
            _map.topLevel["task_561_1"].removeEventListener(MouseEvent.CLICK,onItemClick);
         }
         if(Boolean(_map.conLevel["task_561_2"]))
         {
            ToolTipManager.remove(_map.conLevel["task_561_2"]);
            _map.conLevel["task_561_2"].removeEventListener(MouseEvent.CLICK,onItemClick);
         }
         if(Boolean(_map.conLevel["task_561_3"]))
         {
            ToolTipManager.remove(_map.conLevel["task_561_3"]);
            _map.conLevel["task_561_3"].removeEventListener(MouseEvent.CLICK,onItemClick);
         }
         if(Boolean(_map.conLevel["task_561_4"]))
         {
            ToolTipManager.remove(_map.conLevel["task_561_4"]);
            _map.conLevel["task_561_4"].removeEventListener(MouseEvent.CLICK,onDoorClick);
         }
         if(Boolean(_game))
         {
            _game.sharedEvents.removeEventListener("pintuComplete",onGameComplete);
            _game.destroy();
            _game = null;
         }
         if(Boolean(_map.conLevel["clock"]))
         {
            ToolTipManager.remove(_map.conLevel["clock"]);
            _map.conLevel["clock"].removeEventListener(MouseEvent.CLICK,onClockClick);
         }
         if(Boolean(_map.conLevel["notice"]))
         {
            ToolTipManager.remove(_map.conLevel["notice"]);
            _map.conLevel["notice"].removeEventListener(MouseEvent.CLICK,onNoticeClick);
         }
         if(Boolean(_map.conLevel["ball"]))
         {
            ToolTipManager.remove(_map.conLevel["ball"]);
            DragManager.remove(_map.conLevel["ball"]);
            _map.conLevel["ball"].removeEventListener(MouseEvent.MOUSE_UP,onBallClick);
         }
         if(_panel != null)
         {
            _panel.destroy();
            _panel = null;
         }
         _map = null;
      }
   }
}

