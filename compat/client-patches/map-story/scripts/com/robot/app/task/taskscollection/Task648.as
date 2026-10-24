package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.KTool;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.info.pet.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   
   public class Task648 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var _model:PetModel;
      
      private static var gamePanel:MovieClip;
      
      private static var taskStep:int = -100;
      
      private static var flowerNum:uint = 0;
      
      public function Task648()
      {
         super();
      }
      
      public static function initTaskForMap445(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         var nRet:uint = uint(TasksManager.getTaskStatus(642));
         _map = map;
         nRet = uint(TasksManager.getTaskStatus(648));
         if(nRet == TasksManager.UN_ACCEPT)
         {
            taskStep = -1;
            ToolBarController.showOrHideAllUser(false);
            _map.conLevel["kazi2MC"].visible = true;
            _map.conLevel["kazi2MC"].buttonMode = true;
            _map.conLevel["kazi2MC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
         }
         else if(nRet == TasksManager.ALR_ACCEPT)
         {
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_648.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  taskStep = 0;
                  _map.conLevel["kazi2MC"].visible = true;
                  _map.conLevel["kazi2MC"].buttonMode = true;
                  _map.conLevel["kazi2MC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
               }
               else if(Boolean(param1[0]) && !param1[1])
               {
                  taskStep = 1;
                  gotoStep2();
               }
            });
         }
      }
      
      private static function kaziClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(taskStep == -1)
         {
            NpcDialog.show(NPC.KAZI,[MainManager.actorInfo.formatNick + "，我和多特等你好久了！我们正讨论炫彩山的事呢！"],["恩，卡茨你怎么样了，好点了吗？","我等等再来找你们！"],[function():void
            {
               TasksManager.accept(TaskController_648.TASK_ID,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     DebugTrace.show("任务接取成功");
                     taskStep = 0;
                  }
               });
            }]);
         }
         else if(taskStep == 0)
         {
            gotoStep1();
         }
      }
      
      private static function gotoStep1() : void
      {
         NpcDialog.show(NPC.KAZI,["由于之前过多使用能量，我现在只能变成这个样子！对了！据多特了解，原来海盗已经捷足先登入侵了炫彩山。"],["啊！那这次海盗的目的究竟是什么呢？！"],[function():void
         {
            _map.conLevel["kazi2MC"].visible = false;
            AnimateManager.playMcAnimate(_map.animatorLevel["bossMC"],8,"mc8",function():void
            {
               NpcDialog.show(NPC.DUOTE,["炫彩山一直以来就是我们怀特星的生命支柱，一旦被海盗占据，后果不堪设想，我希望你们能帮忙解救炫彩山。"],["什么！生命支柱！"],[function():void
               {
                  NpcDialog.show(NPC.KAZI,["如果真是这样，形势很危急啊！时间不多了，我们马上出发。"],["好嘞！向炫彩山前进！"],[function():void
                  {
                     TasksManager.complete(TaskController_648.TASK_ID,0,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           DebugTrace.show("第一步完成");
                           taskStep = 1;
                           gotoStep2();
                        }
                     });
                  }]);
               }]);
            });
         }]);
      }
      
      private static function gotoStep2() : void
      {
         _map.conLevel["kazi2MC"].visible = false;
         AnimateManager.playMcAnimate(_map.animatorLevel["bossMC"],9,"mc9",function():void
         {
            _map.conLevel["nextMapHit"].mouseEnabled = true;
            _map.conLevel["nextMapHit"].mouseChildren = true;
         });
      }
      
      public static function initTaskForMap446(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         var nRet:uint = uint(TasksManager.getTaskStatus(648));
         if(nRet == TasksManager.ALR_ACCEPT)
         {
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_648.TASK_ID,function(param1:Array):void
            {
               var a:Array = param1;
               if(!a[0])
               {
                  taskStep = 0;
               }
               else if(Boolean(a[0]) && !a[1])
               {
                  taskStep = 1;
                  TasksManager.complete(TaskController_648.TASK_ID,1,function(param1:Boolean):void
                  {
                     if(param1)
                     {
                        DebugTrace.show("第二步完成");
                        taskStep = 2;
                        gotoStep3();
                     }
                  });
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && !a[2])
               {
                  taskStep = 2;
                  gotoStep3();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && !a[3])
               {
                  taskStep = 3;
                  gotoStep4();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && !a[4])
               {
                  taskStep = 4;
                  gotoStep5();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && Boolean(a[4]) && !a[5])
               {
                  taskStep = 5;
                  gotoStep6();
               }
               else if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && Boolean(a[4]) && Boolean(a[5]) && !a[6])
               {
                  taskStep = 6;
                  gotoStep7();
               }
            });
         }
         else
         {
            _map.conLevel["stoneMC"].gotoAndStop(5);
            _map.conLevel["bridleMC"].gotoAndStop(7);
         }
      }
      
      private static function gotoStep3() : void
      {
         setKaziFollow(true);
         MainManager.actorModel.pos = new Point(355,455);
         NpcDialog.show(NPC.KAZI,["你看，这里有大火灼烧的痕迹，我们要留意了，别中了海盗的埋伏！"],["放心，我会谨慎的！"],[function():void
         {
            AnimateManager.playMcAnimate(_map.conLevel["stoneMC"],1,"mc1",function():void
            {
               NpcDialog.show(NPC.KAZI,["快听!是谁在呼救！"],["好像是从那边的石堆里发出的！"],[function():void
               {
                  NpcDialog.show(NPC.KAZI,["我们快去看看！也许是这里的生还者！"],["恩，好的！(点击石堆)"],[function():void
                  {
                     _map.conLevel["stoneMC"].data = {"time":0};
                     _map.conLevel["stoneMC"].buttonMode = true;
                     _map.conLevel["stoneMC"].addEventListener(MouseEvent.CLICK,stoneClickHandler);
                  }]);
               }]);
            });
         }]);
      }
      
      private static function stoneClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(160,370),function():void
         {
            if(taskStep == 2)
            {
               AnimateManager.playMcAnimate(_map.conLevel["stoneMC"],2,"mc2",function():void
               {
                  _map.conLevel["stoneMC"].data["time"] += 1;
                  if(_map.conLevel["stoneMC"].data["time"] == 3)
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_648_1"),function():void
                     {
                        AnimateManager.playMcAnimate(_map.conLevel["stoneMC"],3,"mc3",function():void
                        {
                           TasksManager.complete(TaskController_648.TASK_ID,2,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 DebugTrace.show("第三步完成");
                                 taskStep = 3;
                                 gotoStep4();
                              }
                           });
                        });
                     });
                  }
               });
            }
            else if(taskStep == 3)
            {
               NpcDialog.show(NPC.YADING,["呜呜呜…."],["小家伙，是谁把你伤成这样的啊 ！"],[function():void
               {
                  NpcDialog.show(NPC.YADING,["我叫亚丁，是来这寻找食物的，想不到突然遇到了它….操纵火之神力的精灵，它用手中的火球攻击我！"],["炫彩山中竟然隐藏着如此凶悍的精灵。"],[function():void
                  {
                     NpcDialog.show(NPC.YADING,["额…伤口好疼！悬崖边有一种名叫“洛兰花”的神奇植物，据说能治百病，你们愿意去采集些来帮我疗伤吗？"],["好的！没问题，我和卡茨现在就去！"],[function():void
                     {
                        _map.conLevel["stoneMC"].mouseEnabled = false;
                        _map.conLevel["stoneMC"].mouseChildren = false;
                        initFlowers();
                        setKaziFollow();
                     }]);
                  }]);
               }]);
            }
         });
      }
      
      private static function setKaziFollow(param1:Boolean = true) : void
      {
         var _loc2_:PetShowInfo = null;
         if(param1)
         {
            if(_model == null)
            {
               _loc2_ = new PetShowInfo();
               _loc2_.userID = MainManager.actorInfo.userID;
               _loc2_.petID = 5018;
               _model = new PetModel(MainManager.actorModel);
               _model.mouseEnabled = false;
               _model.mouseChildren = false;
               _model.show(_loc2_);
            }
         }
         else if(Boolean(_model))
         {
            _model.destroy();
            _model = null;
         }
      }
      
      private static function initFlowers(param1:Boolean = true) : void
      {
         _map.conLevel["flower1"].buttonMode = _map.conLevel["flower2"].buttonMode = _map.conLevel["flower3"].buttonMode = param1;
         if(param1)
         {
            flowerNum = 0;
            (_map.conLevel["flower1"] as MovieClip).mouseChildren = false;
            (_map.conLevel["flower2"] as MovieClip).mouseChildren = false;
            (_map.conLevel["flower3"] as MovieClip).mouseChildren = false;
            _map.conLevel["flower1"].addEventListener(MouseEvent.CLICK,flowerClickHandler);
            _map.conLevel["flower2"].addEventListener(MouseEvent.CLICK,flowerClickHandler);
            _map.conLevel["flower3"].addEventListener(MouseEvent.CLICK,flowerClickHandler);
            _map.conLevel["bridleMC"].mouseChildren = _map.conLevel["bridleMC"].mouseEnabled = false;
         }
         else
         {
            _map.conLevel["flower1"].removeEventListener(MouseEvent.CLICK,flowerClickHandler);
            _map.conLevel["flower2"].removeEventListener(MouseEvent.CLICK,flowerClickHandler);
            _map.conLevel["flower3"].removeEventListener(MouseEvent.CLICK,flowerClickHandler);
            _map.conLevel["bridleMC"].mouseChildren = _map.conLevel["bridleMC"].mouseEnabled = true;
         }
      }
      
      private static function flowerClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = null;
         evt = param1;
         MainManager.actorModel.moveAndAction(new Point(416,370),function():void
         {
            var mc:MovieClip = evt.target as MovieClip;
            if(mc.currentFrame == 1)
            {
               mc.mouseEnabled = false;
               mc.mouseChildren = false;
               AnimateManager.playMcAnimate(mc,2,"mc2",function():void
               {
                  ++flowerNum;
                  if(flowerNum == 1)
                  {
                     NpcDialog.show(NPC.KAZI,["好香的气味啊！我怎么觉得有点头晕呢？ "],["别担心，可能是你刚刚恢复吧！（继续采集）"]);
                  }
                  else if(flowerNum == 2)
                  {
                     NpcDialog.show(NPC.KAZI,["我觉得这个花的气味有点不对劲，闻着有点浑身无力！ "],["我觉得很香啊！卡茨可别偷懒哦！（继续采集）"]);
                  }
                  else if(flowerNum == 3)
                  {
                     initFlowers(false);
                     NpcDialog.show(NPC.KAZI,["我快不行了，想睡觉，赶紧离开这个地方吧！"],["好了好了！收集齐了，咱们走。"],[function():void
                     {
                        AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_648_2"),function():void
                        {
                           TasksManager.complete(TaskController_648.TASK_ID,3,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 DebugTrace.show("第四步完成");
                                 taskStep = 4;
                                 gotoStep5();
                              }
                           });
                        });
                     }]);
                  }
               });
            }
         });
      }
      
      private static function gotoStep4() : void
      {
         setKaziFollow(true);
         _map.conLevel["stoneMC"].gotoAndStop(4);
         _map.conLevel["stoneMC"].removeEventListener(MouseEvent.CLICK,stoneClickHandler);
         _map.conLevel["stoneMC"].buttonMode = true;
         _map.conLevel["stoneMC"].addEventListener(MouseEvent.CLICK,stoneClickHandler);
      }
      
      private static function gotoStep5() : void
      {
         setKaziFollow(false);
         KTool.setActorVisible(false);
         _map.conLevel["stoneMC"].gotoAndStop(5);
         _map.conLevel["bridleMC"].gotoAndStop(2);
         NpcDialog.show(NPC.KAZI,["小XIN！小XIN！可恶！放我出去！你这个卑鄙的家伙！"],null,null,false,function():void
         {
            NpcDialog.show(NPC.YADING,["哈哈哈！谁都不可能逃出这个铁笼的！你就好好待着吧！我去向海盗兄弟报告了"],["可恶，又是海盗！我不会放过你们的！"],[function():void
            {
               AnimateManager.playMcAnimate(_map.conLevel["bridleMC"],2,"mc2",function():void
               {
                  NpcDialog.show(NPC.KAZI,["还是不行！现在完全使不上劲！"],["XIN你在哪里？"],[function():void
                  {
                     AnimateManager.playMcAnimate(_map.conLevel["bridleMC"],3,"mc3",function():void
                     {
                        TasksManager.complete(TaskController_648.TASK_ID,4,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              DebugTrace.show("第五步完成");
                              taskStep = 5;
                              gotoStep6();
                           }
                        });
                     });
                  }]);
               });
            }]);
         });
      }
      
      private static function gotoStep6() : void
      {
         KTool.setActorVisible(true);
         MainManager.actorModel.pos = new Point(550,480);
         _map.conLevel["stoneMC"].gotoAndStop(5);
         _map.conLevel["bridleMC"].gotoAndStop(4);
         NpcDialog.show(NPC.KAZI,["XIN，真是担心死我了！ "],["哈哈！放心吧！我没事，你呢？"],[function():void
         {
            NpcDialog.show(NPC.KAZI,["恩恩，这个铁笼很麻烦，我们得好好想想法子。"],["放心！我们不会输的!"],[function():void
            {
               _map.conLevel["bridleMC"].mouseEnabled = true;
               _map.conLevel["bridleMC"].mouseChildren = true;
               _map.conLevel["bridleMC"]["pointMC"].visible = true;
               _map.conLevel["bridleMC"]["bridleHit"].visible = true;
               _map.conLevel["bridleMC"]["bridleHit"].buttonMode = true;
               _map.conLevel["bridleMC"]["bridleHit"].addEventListener(MouseEvent.CLICK,pointClickHandler);
            }]);
         }]);
      }
      
      private static function pointClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(335,440),function():void
         {
            if(_map.conLevel["bridleMC"].currentFrame == 4)
            {
               if(gamePanel == null)
               {
                  gamePanel = _map.topLevel["gamePanel"];
                  gamePanel["init"]();
                  gamePanel.addEventListener("success",successHandler);
               }
               gamePanel.visible = true;
            }
         });
      }
      
      private static function successHandler(param1:Event) : void
      {
         var evt:Event = param1;
         DebugTrace.show("解密成功");
         _map.conLevel["bridleMC"]["pointMC"].visible = false;
         _map.conLevel["bridleMC"]["bridleHit"].visible = false;
         AnimateManager.playMcAnimate(_map.conLevel["bridleMC"],4,"mc4",function():void
         {
            NpcDialog.show(NPC.KAZI,["我们在炫彩山一定要小心谨慎，别再中了海盗们的诡计！这只大鸟是？"],["恩，我们俩可不能中途就倒下啊！"],[function():void
            {
               NpcDialog.show(NPC.TUONUKE,["我叫托鲁克，是爱丽丝的专属精灵。等等！你…你…和曾经救过我的两只精灵长得好像！难道你就是它们的…"],["大鸟你在说什么呀！"],[function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["bridleMC"],5,"mc5",function():void
                  {
                     TasksManager.complete(TaskController_648.TASK_ID,5,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           DebugTrace.show("第六步完成");
                           taskStep = 6;
                           gotoStep7();
                        }
                     });
                  });
               }]);
            }]);
         });
      }
      
      private static function gotoStep7() : void
      {
         _map.conLevel["stoneMC"].gotoAndStop(5);
         _map.conLevel["bridleMC"].gotoAndStop(5);
         _map.conLevel["bridleMC"]["birdHit"].visible = true;
         _map.conLevel["bridleMC"]["birdHit"].buttonMode = true;
         _map.conLevel["bridleMC"]["birdHit"].addEventListener(MouseEvent.CLICK,birdClickHandler);
      }
      
      private static function birdClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(550,485),function():void
         {
            NpcDialog.show(NPC.TUONUKE,["在XIN刚到达怀特星，我就被派出执行任务。我遭遇了海盗的袭击，坠落在炫彩山。如果不是巧遇那两个白色精灵，可能早已经没命了！"],["大鸟继续说下去！"],[function():void
            {
               NpcDialog.show(NPC.TUONUKE,["对了，它们临走时给了我一个晶球，说只要遇到它们的孩子晶球就会发生感应，你们看！"],["是什么东西呀！"],[function():void
               {
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_648_3"),function():void
                  {
                     NpcDialog.show(NPC.KAZI,["难道…难道它们是我的父母？我一定要找到它们，我发誓！！！"],["卡茨你别伤心，你这样我也很难过的，呜呜呜呜！"],[function():void
                     {
                        NpcDialog.show(NPC.TUONUKE,["卡茨，晶球就交给你了。这次收集炫彩山情报任务已经完成，我要去给爱丽丝汇报了！你们多多保重！"],["嗯，放心！我和卡茨的使命之旅才刚刚开始！"],[function():void
                        {
                           AnimateManager.playMcAnimate(_map.conLevel["bridleMC"],6,"mc6",function():void
                           {
                              TasksManager.completeFinal(TaskController_648.TASK_ID,function(param1:Boolean):void
                              {
                                 if(param1)
                                 {
                                    DebugTrace.show("任务完成");
                                    taskStep = 7;
                                    _map.conLevel["bridleMC"]["birdHit"].visible = false;
                                    ToolBarController.showOrHideAllUser(true);
                                    Task653.initTaskForMap446(_map);
                                 }
                              });
                           });
                        }]);
                     }]);
                  });
               }]);
            }]);
         });
      }
      
      public static function destroy() : void
      {
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 445)
         {
            if(Boolean(_map.conLevel["kazi2MC"]))
            {
               _map.conLevel["kazi2MC"].removeEventListener(MouseEvent.CLICK,kaziClickHandler);
            }
            ToolBarController.showOrHideAllUser(true);
         }
         else if(MapManager.currentMap.id == 446)
         {
            _map.conLevel["stoneMC"].removeEventListener(MouseEvent.CLICK,stoneClickHandler);
            _map.conLevel["bridleMC"]["bridleHit"].removeEventListener(MouseEvent.CLICK,pointClickHandler);
            _map.conLevel["bridleMC"]["birdHit"].removeEventListener(MouseEvent.CLICK,birdClickHandler);
            initFlowers(false);
            setKaziFollow(false);
            ToolBarController.showOrHideAllUser(true);
            if(Boolean(gamePanel))
            {
               gamePanel.removeEventListener("success",successHandler);
               gamePanel.destroy();
               gamePanel = null;
            }
         }
         _map = null;
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 445)
         {
            initTaskForMap445(param1);
         }
         if(MapManager.currentMap.id == 446)
         {
            initTaskForMap446(param1);
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 445)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 446)
         {
            destroy();
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 445)
         {
         }
         if(MapManager.currentMap.id == 446)
         {
            param1.conLevel["stoneMC"].gotoAndStop(5);
            param1.conLevel["bridleMC"].gotoAndStop(7);
         }
      }
   }
}

