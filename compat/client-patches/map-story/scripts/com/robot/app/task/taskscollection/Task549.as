package com.robot.app.task.taskscollection
{
   import com.robot.app.buyItem.*;
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.ui.*;
   import flash.utils.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task549
   {
      
      private static var _map:BaseMapProcess;
      
      private static var _timer:Timer;
      
      private static var _bitmap:Bitmap;
      
      private static var _bitmapData:BitmapData;
      
      private static var _num:int;
      
      private static var _app:AppModel;
      private static var _hiddenActor:DisplayObject;
      private static var _hiddenPet:DisplayObject;
      private static var _actorWasVisible:Boolean;
      private static var _petWasVisible:Boolean;
      
      public function Task549()
      {
         super();
      }
      
      public static function initTask() : void
      {
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_549_1"),function():void
         {
            NpcDialog.show(NPC.IRIS,["╮(╯▽╰)╭，有新闻就有纽斯……好吧，回到我们的正题！其实隐身之匙在极其神秘的拉铂尔星上……"],null,null,false,function():void
            {
               NpcDialog.show(NPC.IRIS,["它一直存在于罗格星系中，但是根本没有航行人员能够发现它！我也是得到了不明信号的提示，才找到的！"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.IRIS,["哦，对了，茜茜的新发明0xff0000巡查眼镜0xffffff在这次任务中应该可以帮到你，那里地形险恶，务必要带上它！"],["巡查眼镜……"],[function():void
                  {
                     var continueWithGlasses:* = undefined;
                     if(MapManager.currentMap.id == 9)
                     {
                        continueWithGlasses = function():void
                        {
                           var owner:DisplayObject = MapManager.currentMap.root;
                           ItemManager.getCloth(function():void
                           {
                              if(MapManager.currentMap.root != owner) return;
                              if(!ItemManager.containsCloth(100564))
                              {
                                 ItemAction.buyItem(100564,false);
                              }
                              NpcDialog.show(NPC.IRIS,["准备好出发了吗？我已经锁定了星球的方位，快装备上0xff0000巡查眼镜0xffffff出发吧……"],["全速前进！"],[function():void
                              {
                                 AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_549_2"),function():void
                                 {
                                    MapManager.changeMap(441);
                                 });
                              }]);
                           });
                        };
                        if(Boolean(MapManager.currentMap.topLevel["eyeGlass"]))
                        {
                           AnimateManager.playMcAnimate(MapManager.currentMap.topLevel["eyeGlass"],0,"",continueWithGlasses);
                        }
                        else
                        {
                           continueWithGlasses();
                        }
                     }
                  }]);
               });
            });
         });
      }
      
      public static function initTask_441(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         if(TasksManager.getTaskStatus(TaskController_549.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            _map.conLevel["jump"].play();
            _map.topLevel["camera"].visible = true;
            _map.conLevel["jump"].visible = true;
            _map.conLevel["shadow"].visible = true;
            _map.conLevel["mud"].visible = true;
            _map.conLevel["animate"].visible = true;
            TasksManager.getProStatusList(TaskController_549.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(!param1[0])
               {
                  startPro_0();
               }
               else if(Boolean(param1[0]))
               {
                  DisplayUtil.removeForParent(_map.conLevel["hit"]);
                  _map.conLevel["hit"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["jump"]);
                  _map.conLevel["jump"] = null;
                  DisplayUtil.removeForParent(_map.topLevel["camera"]);
                  _map.topLevel["camera"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["shadow"]);
                  _map.conLevel["shadow"] = null;
               }
               if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]))
               {
                  DisplayUtil.removeForParent(_map.conLevel["mud"]);
                  _map.conLevel["mud"] = null;
               }
               if(Boolean(param1[1]) && !param1[2])
               {
                  startPro_2();
               }
               else if(Boolean(param1[1]) && Boolean(param1[2]))
               {
                  DisplayUtil.removeForParent(_map.conLevel["key"]);
                  _map.conLevel["key"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["animate"]);
                  _map.conLevel["animate"] = null;
               }
               if(!param1[0] || !param1[1] || !param1[2])
               {
                  ToolBarController.showOrHideAllUser(false);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_map.conLevel["hit"]);
            _map.conLevel["hit"] = null;
            DisplayUtil.removeForParent(_map.conLevel["jump"]);
            _map.conLevel["jump"] = null;
            DisplayUtil.removeForParent(_map.topLevel["camera"]);
            _map.topLevel["camera"] = null;
            DisplayUtil.removeForParent(_map.conLevel["shadow"]);
            _map.conLevel["shadow"] = null;
            DisplayUtil.removeForParent(_map.conLevel["mud"]);
            _map.conLevel["mud"] = null;
            DisplayUtil.removeForParent(_map.conLevel["key"]);
            _map.conLevel["key"] = null;
            DisplayUtil.removeForParent(_map.conLevel["animate"]);
            _map.conLevel["animate"] = null;
         }
      }
      
      private static function startPro_0() : void
      {
         _num = 0;
         Mouse.hide();
         _map.conLevel["shadow"].visible = false;
         _map.conLevel["mud"].visible = false;
         _map.conLevel["animate"].visible = false;
         hideActors();
         _timer = new Timer(2000);
         _timer.addEventListener(TimerEvent.TIMER,onTimer);
         _bitmapData = new BitmapData(320,180,true,0);
         _bitmap = new Bitmap(_bitmapData);
         _map.topLevel["camera"]["container"].addChild(_bitmap);
         _map.topLevel["camera"].addEventListener(MouseEvent.CLICK,onMouseClick);
         _map.topLevel["camera"].addEventListener(MouseEvent.MOUSE_MOVE,onMouseMove);
      }
      
      private static function onMouseClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(e.stageX > 160 && e.stageX < 800 && e.stageY > 90 && e.stageY < 410)
         {
            _map.topLevel["camera"].mouseEnabled = false;
            _map.topLevel["camera"].mouseChildren = false;
            AnimateManager.playMcAnimate(_map.topLevel["camera"],1,"star",function():void
            {
               if(_map != map) return;
               var source:BitmapData = null;
               _map.topLevel["camera"]["star"].visible = false;
               _map.conLevel["hit"].x = _map.topLevel["camera"].x;
               _map.conLevel["hit"].y = _map.topLevel["camera"].y;
               if(HitTest.hitTest(_map.conLevel["jump"],_map.conLevel["hit"],_map.conLevel))
               {
                  ++_num;
                  if(_num >= 3)
                  {
                     _timer.start();
                  }
                  else
                  {
                     Mouse.show();
                     NpcDialog.show(NPC.SEER,["哇！那个黑影是什么？"],["（继续捕捉它的黑影）"],[function():void
                     {
                        if(_map != map) return;
                        Mouse.hide();
                        _timer.start();
                     }]);
                  }
               }
               else
               {
                  Mouse.show();
                  NpcDialog.show(NPC.SEER,["那个黑影究竟是什么？先捕捉到它的影像再说吧！"],["（点击鼠标左键，拍摄黑影的样子）"],[function():void
                  {
                     if(_map != map) return;
                     Mouse.hide();
                     _timer.start();
                  }]);
               }
               source = new BitmapData(960,560);
               source.draw(MapManager.currentMap.root);
               _bitmapData.copyPixels(source,new Rectangle(_map.topLevel["camera"].x - 160,_map.topLevel["camera"].y - 90,320,180),new Point(0,0));
               source.dispose();
               _bitmap.visible = true;
            });
         }
      }
      
      private static function onMouseMove(param1:MouseEvent) : void
      {
         if(param1.stageX > 160 && param1.stageX < 800)
         {
            _map.topLevel["camera"].x = param1.stageX;
         }
         if(param1.stageY > 90 && param1.stageY < 410)
         {
            _map.topLevel["camera"].y = param1.stageY;
         }
      }
      
      private static function onTimer(param1:TimerEvent) : void
      {
         var e:TimerEvent = param1;
         var map:BaseMapProcess = _map;
         _timer.reset();
         if(_num >= 3)
         {
            Mouse.show();
            restoreActors();
            _timer.removeEventListener(TimerEvent.TIMER,onTimer);
            _map.topLevel["camera"].removeEventListener(MouseEvent.CLICK,onMouseClick);
            _map.topLevel["camera"].removeEventListener(MouseEvent.MOUSE_MOVE,onMouseMove);
            _timer = null;
            DisplayUtil.removeForParent(_map.conLevel["hit"]);
            _map.conLevel["hit"] = null;
            DisplayUtil.removeForParent(_map.conLevel["jump"]);
            _map.conLevel["jump"] = null;
            DisplayUtil.removeForParent(_map.topLevel["camera"]);
            _map.topLevel["camera"] = null;
            clearBitmap();
            _map.conLevel["shadow"].visible = true;
            AnimateManager.playMcAnimate(_map.conLevel["shadow"],0,"",function():void
            {
               if(_map != map) return;
               DisplayUtil.removeForParent(_map.conLevel["shadow"]);
               _map.conLevel["shadow"] = null;
               TasksManager.complete(TaskController_549.TASK_ID,0,function(param1:Boolean):void
               {
                  if(_map != map) return;
                  if(param1)
                  {
                     startPro_1();
                  }
               });
            });
         }
         else
         {
            _bitmap.visible = false;
            _map.topLevel["camera"].mouseEnabled = true;
            _map.topLevel["camera"].mouseChildren = true;
            _map.topLevel["camera"]["star"].visible = true;
         }
      }
      
      private static function startPro_1() : void
      {
         var map:BaseMapProcess = _map;
         _map.conLevel["mud"].visible = true;
         _map.conLevel["animate"].visible = false;
         NpcDialog.show(NPC.SEER,["咦？地上那一滩东西到底是什么？跟左边的红色露珠和蓝色露珠有关系吗？"],["（或许可以移动它们）"],[function():void
         {
            if(_map != map) return;
            CommonUI.addYellowArrow(_map.topLevel,440,428);
            ToolTipManager.add(_map.conLevel["mud"],"泥");
            _map.conLevel["mud"].buttonMode = true;
            _map.conLevel["mud"].addEventListener(MouseEvent.CLICK,onMudClick);
            ToolTipManager.add(_map.conLevel["ball_1"],"露珠");
            ToolTipManager.add(_map.conLevel["ball_2"],"露珠");
            DepthManager.bringToTop(_map.conLevel["ball_1"]);
            DepthManager.bringToTop(_map.conLevel["ball_2"]);
            DragManager.add(_map.conLevel["ball_1"],_map.conLevel["ball_1"]);
            DragManager.add(_map.conLevel["ball_2"],_map.conLevel["ball_2"]);
            _map.conLevel["ball_1"].addEventListener(MouseEvent.MOUSE_UP,onMouseUp_1);
            _map.conLevel["ball_2"].addEventListener(MouseEvent.MOUSE_UP,onMouseUp_2);
         }]);
      }
      
      private static function onMudClick(param1:MouseEvent) : void
      {
         CommonUI.removeYellowArrow(_map.topLevel);
         if(!_app)
         {
            _app = new AppModel(ClientConfig.getAppModule("TaskIntro_549"),"正在加载面板");
            _app.setup();
         }
         _app.show();
      }
      
      public static function tipDialog() : void
      {
         if(!_map) return;
         var map:BaseMapProcess = _map;
         NpcDialog.show(NPC.SEER,["嗯，看来是要把左边的红色露珠和蓝色露珠移动到右边的花托上！"],null,null,false,function():void
         {
            if(_map != map) return;
            CommonUI.addYellowArrow(_map.topLevel,71,207,45);
            CommonUI.addYellowArrow(_map.topLevel,82,96,45);
         });
      }
      
      private static function onMouseUp_1(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(_map.conLevel["ball_1"].x > 740 && _map.conLevel["ball_1"].x < 820 && _map.conLevel["ball_1"].y > 430 && _map.conLevel["ball_1"].y < 510)
         {
            CommonUI.removeYellowArrow(_map.topLevel);
            ToolTipManager.remove(_map.conLevel["ball_1"]);
            DragManager.remove(_map.conLevel["ball_1"]);
            _map.conLevel["ball_1"].removeEventListener(MouseEvent.MOUSE_UP,onMouseUp_1);
            DisplayUtil.removeForParent(_map.conLevel["ball_1"]);
            _map.conLevel["ball_1"] = null;
            AnimateManager.playMcAnimate(_map.conLevel["flower_1"],0,"",function():void
            {
               if(_map != map) return;
               if(!_map.conLevel["ball_1"] && !_map.conLevel["ball_2"])
               {
                  _map.conLevel["key"].alpha = 0.6;
                  ToolTipManager.remove(_map.conLevel["mud"]);
                  _map.conLevel["mud"].removeEventListener(MouseEvent.CLICK,onMudClick);
                  DisplayUtil.removeForParent(_map.conLevel["mud"]);
                  _map.conLevel["mud"] = null;
                  NpcDialog.show(NPC.SEER,["快看！树藤里面的是什么？一闪一闪的！难道这个就是隐身之匙？"],["它的周围可能会有机关！（周围看看）"],[function():void
                  {
                     if(_map != map) return;
                     TasksManager.complete(TaskController_549.TASK_ID,1,function(param1:Boolean):void
                     {
                        if(_map != map) return;
                        if(param1)
                        {
                           startPro_2();
                        }
                     });
                  }]);
               }
            });
         }
         else
         {
            _map.conLevel["ball_1"].x = 58;
            _map.conLevel["ball_1"].y = 246;
         }
      }
      
      private static function onMouseUp_2(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         if(_map.conLevel["ball_2"].x > 820 && _map.conLevel["ball_2"].x < 900 && _map.conLevel["ball_2"].y > 280 && _map.conLevel["ball_2"].y < 360)
         {
            if(Boolean(_map.conLevel["ball_1"]))
            {
               CommonUI.removeYellowArrow(_map.topLevel);
               CommonUI.removeYellowArrow(_map.topLevel);
               CommonUI.addYellowArrow(_map.topLevel,71,207,45);
            }
            else
            {
               CommonUI.removeYellowArrow(_map.topLevel);
            }
            ToolTipManager.remove(_map.conLevel["ball_2"]);
            DragManager.remove(_map.conLevel["ball_2"]);
            _map.conLevel["ball_2"].removeEventListener(MouseEvent.MOUSE_UP,onMouseUp_2);
            DisplayUtil.removeForParent(_map.conLevel["ball_2"]);
            _map.conLevel["ball_2"] = null;
            AnimateManager.playMcAnimate(_map.conLevel["flower_2"],0,"",function():void
            {
               if(_map != map) return;
               if(!_map.conLevel["ball_1"] && !_map.conLevel["ball_2"])
               {
                  _map.conLevel["key"].alpha = 0.6;
                  ToolTipManager.remove(_map.conLevel["mud"]);
                  _map.conLevel["mud"].removeEventListener(MouseEvent.CLICK,onMudClick);
                  DisplayUtil.removeForParent(_map.conLevel["mud"]);
                  _map.conLevel["mud"] = null;
                  NpcDialog.show(NPC.SEER,["快看！树藤里面的是什么？一闪一闪的！难道这个就是隐身之匙？"],["它的周围可能会有机关！（周围看看）"],[function():void
                  {
                     if(_map != map) return;
                     TasksManager.complete(TaskController_549.TASK_ID,1,function(param1:Boolean):void
                     {
                        if(_map != map) return;
                        if(param1)
                        {
                           startPro_2();
                        }
                     });
                  }]);
               }
            });
         }
         else
         {
            _map.conLevel["ball_2"].x = 58;
            _map.conLevel["ball_2"].y = 132;
         }
      }
      
      private static function startPro_2() : void
      {
         _map.conLevel["key"].alpha = 0.6;
         _map.conLevel["animate"].visible = false;
         ToolTipManager.add(_map.conLevel["tree"],"藤蔓");
         CommonUI.addYellowArrow(_map.topLevel,552,166,135);
         _map.conLevel["tree"].buttonMode = true;
         _map.conLevel["tree"].addEventListener(MouseEvent.CLICK,onTreeClick);
      }
      
      private static function onTreeClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var map:BaseMapProcess = _map;
         _map.conLevel["key"].alpha = 1;
         CommonUI.removeYellowArrow(_map.topLevel);
         ToolTipManager.remove(_map.conLevel["tree"]);
         _map.conLevel["tree"].buttonMode = false;
         _map.conLevel["tree"].removeEventListener(MouseEvent.CLICK,onTreeClick);
         AnimateManager.playMcAnimate(_map.conLevel["tree"],0,"",function():void
         {
            if(_map != map) return;
            DisplayUtil.removeForParent(_map.conLevel["key"]);
            _map.conLevel["key"] = null;
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_549_3"),function():void
            {
               if(_map != map) return;
               _map.conLevel["animate"].visible = true;
               AnimateManager.playMcAnimate(_map.conLevel["animate"],0,"",function():void
               {
                  if(_map != map) return;
                  NpcDialog.show(NPC.SEER,["化身之匙，这到底有着什么样的含义呢？化身……化身……还是先回赛尔号吧！"],["（返回赛尔号）"],[function():void
                  {
                     if(_map != map) return;
                     TasksManager.complete(TaskController_549.TASK_ID,2,function(param1:Boolean):void
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
      }
      
      private static function hideActors() : void
      {
         _hiddenActor = MainManager.actorModel;
         _actorWasVisible = _hiddenActor.visible;
         _hiddenActor.visible = false;
         _hiddenPet = MainManager.actorModel.pet;
         if(_hiddenPet)
         {
            _petWasVisible = _hiddenPet.visible;
            _hiddenPet.visible = false;
         }
      }

      private static function restoreActors() : void
      {
         if(!_hiddenActor) return;
         _hiddenActor.visible = _actorWasVisible;
         if(_hiddenPet) _hiddenPet.visible = _petWasVisible;
         _hiddenActor = null;
         _hiddenPet = null;
      }

      private static function clearBitmap() : void
      {
         if(_bitmap) DisplayUtil.removeForParent(_bitmap);
         if(_bitmapData) _bitmapData.dispose();
         _bitmap = null;
         _bitmapData = null;
      }

      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map != map) return;
         Mouse.show();
         ToolBarController.showOrHideAllUser(true);
         restoreActors();
         if(Boolean(_timer))
         {
            _timer.reset();
            _timer.removeEventListener(TimerEvent.TIMER,onTimer);
            _timer = null;
         }
         if(Boolean(_map))
         {
            if(Boolean(_map.topLevel["camera"]))
            {
               _map.topLevel["camera"].removeEventListener(MouseEvent.CLICK,onMouseClick);
               _map.topLevel["camera"].removeEventListener(MouseEvent.MOUSE_MOVE,onMouseMove);
            }
            if(Boolean(_map.conLevel["mud"]))
            {
               ToolTipManager.remove(_map.conLevel["mud"]);
               _map.conLevel["mud"].removeEventListener(MouseEvent.CLICK,onMudClick);
            }
            if(Boolean(_map.conLevel["ball_1"]))
            {
               ToolTipManager.remove(_map.conLevel["ball_1"]);
               DragManager.remove(_map.conLevel["ball_1"]);
               _map.conLevel["ball_1"].removeEventListener(MouseEvent.MOUSE_UP,onMouseUp_1);
            }
            if(Boolean(_map.conLevel["ball_2"]))
            {
               ToolTipManager.remove(_map.conLevel["ball_2"]);
               DragManager.remove(_map.conLevel["ball_2"]);
               _map.conLevel["ball_2"].removeEventListener(MouseEvent.MOUSE_UP,onMouseUp_2);
            }
            if(Boolean(_map.conLevel["tree"]))
            {
               ToolTipManager.remove(_map.conLevel["tree"]);
               _map.conLevel["tree"].removeEventListener(MouseEvent.CLICK,onTreeClick);
            }
         }
         clearBitmap();
         if(_app)
         {
            _app.destroy();
            _app = null;
         }
         CommonUI.removeYellowArrow(_map.topLevel);
         _map = null;
      }
   }
}

