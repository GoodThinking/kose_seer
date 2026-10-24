package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.DisplayObjectContainer;
   import flash.events.*;
   import flash.utils.*;
   import org.taomee.utils.*;
   
   public class Task534
   {
      
      private static var _timer:Timer;
      
      private static var _isStone:Boolean;
      
      private static var _map:BaseMapProcess;
      private static var _mapId:uint;
      private static var _space:DisplayObjectContainer;
      
      public function Task534()
      {
         super();
      }
      
      public static function initTask() : void
      {
         NpcDialog.show(NPC.IRIS,["爱冒险的爱丽丝也会有畏惧的一天……知道吗，传说那颗星球上有一个怪兽！"],null,null,false,function():void
         {
            NpcDialog.show(NPC.IRIS,["只要被这个怪兽看到你就将成为她城堡里的一个装饰品……实在是太可怕了！你还是准备去吗？"],["我已经准备好了！出发吧！"],[function():void
            {
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_534_1"),function():void
               {
                  MapManager.changeMap(437);
               });
            }]);
         });
      }
      
      public static function initOuter(map:BaseMapProcess) : void
      {
         _map = map;
         _mapId = 437;
         _space = MapManager.currentMap.spaceLevel;
         if(TasksManager.getTaskStatus(TaskController_534.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_534.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(!param1[0])
               {
                  ToolBarController.showOrHideAllUser(false);
                  NpcDialog.show(NPC.SEER,["这个难道就是传说中的石化之城……这里看起来相当诡异啊！先看看周围有没有线索吧！"],["（仔细观察周围）"]);
               }
            });
         }
      }
      
      public static function complete_0() : void
      {
         var map:BaseMapProcess = _map;
         if(TasksManager.getTaskStatus(TaskController_534.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_534.TASK_ID,function(param1:Array):void
            {
               if(_map != map || _mapId != 437) return;
               if(!param1[0])
               {
                  TasksManager.complete(TaskController_534.TASK_ID,0);
               }
            });
         }
      }
      
      public static function initInner(map:BaseMapProcess) : void
      {
         _map = map;
         _mapId = 438;
         _space = MapManager.currentMap.spaceLevel;
         if(TasksManager.getTaskStatus(TaskController_534.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_534.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
               }
               else
               {
                  DisplayUtil.removeForParent(_map.conLevel["pet"]);
                  _map.conLevel["pet"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["petHealth"]);
                  _map.conLevel["petHealth"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["stone"]);
                  _map.conLevel["stone"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["revive"]);
                  _map.conLevel["revive"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["revivePet"]);
                  _map.conLevel["revivePet"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["fly"]);
                  _map.conLevel["fly"] = null;
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_map.conLevel["pet"]);
            _map.conLevel["pet"] = null;
            DisplayUtil.removeForParent(_map.conLevel["petHealth"]);
            _map.conLevel["petHealth"] = null;
            DisplayUtil.removeForParent(_map.conLevel["stone"]);
            _map.conLevel["stone"] = null;
            DisplayUtil.removeForParent(_map.conLevel["revive"]);
            _map.conLevel["revive"] = null;
            DisplayUtil.removeForParent(_map.conLevel["revivePet"]);
            _map.conLevel["revivePet"] = null;
            DisplayUtil.removeForParent(_map.conLevel["fly"]);
            _map.conLevel["fly"] = null;
         }
      }
      
      private static function startPro_1() : void
      {
         ToolBarController.showOrHideAllUser(false);
         _map.conLevel["pet"].visible = true;
         _map.conLevel["petHealth"].visible = true;
         _map.conLevel["stone"].visible = false;
         _map.conLevel["revivePet"].visible = false;
         _map.conLevel["fly"].visible = false;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_534_2"),function():void
         {
            NpcDialog.show(NPC.SEER,["什么……钥匙会说话？天！！！没时间想了！注意她的视线！"],["先找个石柱躲藏一下吧！"],[function():void
            {
               _timer = new Timer(1000);
               _timer.addEventListener(TimerEvent.TIMER,onTimer);
               _timer.start();
               AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
               _map.conLevel["pet"].addEventListener(Event.ENTER_FRAME,onEnterFrame);
            }]);
         });
      }
      
      private static function onTimer(param1:TimerEvent) : void
      {
         if(_map.conLevel["pet"].currentFrame == _map.conLevel["pet"].totalFrames)
         {
            _map.conLevel["pet"].gotoAndStop(1);
         }
         else
         {
            _map.conLevel["pet"].gotoAndStop(_map.conLevel["pet"].currentFrame + 1);
         }
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var e:AimatEvent = param1;
         if(e.info.userID == MainManager.actorID && _timer.running)
         {
            if(Boolean(_map.conLevel["hit"].hitTestPoint(e.info.endPos.x,e.info.endPos.y,true)))
            {
               var map:BaseMapProcess = _map;
               _timer.stop();
               AnimateManager.playMcAnimate(_map.conLevel["pet"]["mc"],2,"mc",function():void
               {
                  if(_map != map) return;
                  _map.conLevel["petHealth"].gotoAndStop(_map.conLevel["petHealth"].currentFrame + 1);
                  if(_map.conLevel["petHealth"].currentFrame == _map.conLevel["petHealth"].totalFrames)
                  {
                     _map.conLevel["hit"].visible = false;
                     _map.conLevel["pet"].visible = false;
                     _map.conLevel["petHealth"].visible = false;
                     _timer.reset();
                     _timer.removeEventListener(TimerEvent.TIMER,onTimer);
                     _map.conLevel["pet"].removeEventListener(Event.ENTER_FRAME,onEnterFrame);
                     AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
                     _map.conLevel["revive"].visible = true;
                     AnimateManager.playMcAnimate(_map.conLevel["revive"],0,"",function():void
                     {
                        NpcDialog.show(NPC.MODUSA,["我想我终于可以解脱了……对不起，是我害他们变成石像的……对不起……"],["怎么……原来她不是故意的？……难道……"],[function():void
                        {
                           AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_534_3"),function():void
                           {
                              _map.conLevel["revive"].visible = false;
                              _map.conLevel["revivePet"].visible = true;
                              NpcDialog.show(NPC.SEER,["是我……是我伤害了她吗……我该怎么办……我要怎么办……"],null,null,false,function():void
                              {
                                 AnimateManager.playMcAnimate(_map.conLevel["revivePet"],0,"",function():void
                                 {
                                    NpcDialog.show(NPC.SHENGMINGZHIYAO,["生命源于自然，自然归于精灵！生生不息……"],null,null,false,function():void
                                    {
                                       _map.conLevel["revivePet"].visible = false;
                                       _map.conLevel["fly"].visible = true;
                                       AnimateManager.playMcAnimate(_map.conLevel["fly"],0,"",function():void
                                       {
                                          _map.conLevel["fly"].visible = false;
                                          NpcDialog.show(NPC.SEER,["55555好感动！原来精灵与精灵之间也存在着真正的感情！谢谢你神奇的生命之匙……"],["为什么又是眼前一片漆黑……"],[function():void
                                          {
                                             AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_534_4"),function():void
                                             {
                                                NpcDialog.show(NPC.SEER,["赫尔卡星预言、神奇的钥匙……这一切看起来太不可思议了！赫尔卡星宝藏又会有什么样的秘密？先回去告诉爱丽丝吧！"],["准备返航！（返回赛尔号）"],[function():void
                                                {
                                                   TasksManager.complete(TaskController_534.TASK_ID,1,function(param1:Boolean):void
                                                   {
                                                      if(param1)
                                                      {
                                                         MapManager.changeMap(9);
                                                      }
                                                   });
                                                }]);
                                             });
                                          }]);
                                       });
                                    });
                                 });
                              });
                           });
                        }]);
                     });
                     return;
                  }
                  else if(MainManager.actorModel.pos.y < 240)
                  {
                     if(Math.abs(MainManager.actorModel.pos.x - 500) < 80)
                     {
                        _map.conLevel["pet"].gotoAndStop(4);
                     }
                     else if(MainManager.actorModel.pos.x < 500)
                     {
                        _map.conLevel["pet"].gotoAndStop(3);
                     }
                     else
                     {
                        _map.conLevel["pet"].gotoAndStop(5);
                     }
                  }
                  else if(Math.abs(MainManager.actorModel.pos.x - 500) < 80)
                  {
                     _map.conLevel["pet"].gotoAndStop(1);
                  }
                  else if(MainManager.actorModel.pos.x < 500)
                  {
                     _map.conLevel["pet"].gotoAndStop(2);
                  }
                  else
                  {
                     _map.conLevel["pet"].gotoAndStop(6);
                  }
                  _timer.start();
               });
            }
         }
      }
      
      private static function onEnterFrame(param1:Event) : void
      {
         if(Boolean(_map.conLevel["pet"]["hit"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y,true)))
         {
            if(!_isStone)
            {
               _isStone = true;
               ToolBarController.aimatOff();
               MainManager.actorModel.stop();
               MainManager.actorModel.visible = false;
               _space.mouseEnabled = false;
               _space.mouseChildren = false;
               _map.conLevel["stone"].gotoAndStop(2);
               _map.conLevel["stone"].visible = true;
               _map.conLevel["stone"].buttonMode = true;
               _map.conLevel["stone"].x = MainManager.actorModel.pos.x;
               _map.conLevel["stone"].y = MainManager.actorModel.pos.y;
               _map.conLevel["stone"].addEventListener(MouseEvent.CLICK,onStoneClick);
            }
         }
      }
      
      private static function onStoneClick(param1:MouseEvent) : void
      {
         var map:BaseMapProcess = _map;
         AnimateManager.playMcAnimate(_map.conLevel["stone"],2,"mc",function():void
         {
            if(_map != map) return;
            _isStone = false;
            ToolBarController.aimatOn();
            MainManager.actorModel.visible = true;
            _space.mouseEnabled = true;
            _space.mouseChildren = true;
            _map.conLevel["stone"].gotoAndStop(1);
            _map.conLevel["stone"].visible = false;
            _map.conLevel["stone"].removeEventListener(MouseEvent.CLICK,onStoneClick);
         });
      }
      
      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map != map) return;
         ToolBarController.showOrHideAllUser(true);
         _isStone = false;
         ToolBarController.aimatOn();
         MainManager.actorModel.visible = true;
         _space.mouseEnabled = true;
         _space.mouseChildren = true;
         if(_mapId == 438)
         {
            if(Boolean(_timer))
            {
               _timer.reset();
               _timer.removeEventListener(TimerEvent.TIMER,onTimer);
               _timer = null;
            }
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            if(Boolean(_map.conLevel["pet"]))
            {
               _map.conLevel["pet"].removeEventListener(Event.ENTER_FRAME,onEnterFrame);
            }
            if(Boolean(_map.conLevel["stone"]))
            {
               _map.conLevel["stone"].removeEventListener(MouseEvent.CLICK,onStoneClick);
            }
         }
         _map = null;
         _mapId = 0;
         _space = null;
      }
   }
}

