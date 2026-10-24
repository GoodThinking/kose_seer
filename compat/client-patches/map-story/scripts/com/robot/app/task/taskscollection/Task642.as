package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.KTool;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.utils.*;
   
   public class Task642 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var yuanguPanel:MovieClip;
      
      private static var taskStep:int = -100;
      
      public function Task642()
      {
         super();
      }
      
      public static function initTaskForMap445(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         var nRet:uint = uint(TasksManager.getTaskStatus(TaskController_642.TASK_ID));
         if(nRet == TasksManager.UN_ACCEPT)
         {
            taskStep = -1;
            _map.conLevel["kaziMC"].visible = true;
            _map.conLevel["kaziMC"].buttonMode = true;
            _map.conLevel["kaziMC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
            ToolBarController.showOrHideAllUser(false);
         }
         else if(nRet == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_642.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  taskStep = 0;
               }
               else if(Boolean(param1[0]) && !param1[1])
               {
                  taskStep = 1;
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  taskStep = 2;
                  gotoStep3();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  taskStep = 3;
                  gotoStep4();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  taskStep = 4;
                  gotoStep5();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && Boolean(param1[4]) && !param1[5])
               {
                  taskStep = 5;
                  gotoStep6();
               }
               if(taskStep < 2)
               {
                  _map.conLevel["kaziMC"].visible = true;
                  _map.conLevel["kaziMC"].buttonMode = true;
                  _map.conLevel["kaziMC"].addEventListener(MouseEvent.CLICK,kaziClickHandler);
               }
            });
            ToolBarController.showOrHideAllUser(false);
         }
      }
      
      private static function kaziClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(taskStep == -1)
         {
            NpcDialog.show(NPC.KAZI,["是谁….究竟是谁！快出来吧！"],["咦！卡茨你怎么了！","我还是先看看吧！"],[function():void
            {
               TasksManager.accept(TaskController_642.TASK_ID,function(param1:Boolean):void
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
         else if(taskStep == 1)
         {
            gotoStep2();
         }
      }
      
      private static function gotoStep1() : void
      {
         NpcDialog.show(NPC.KAZI,["这究竟是什么地方？看上去有海盗来过的痕迹呢！难道是海盗的据点吗？"],["卡茨，终于找到你了，你没事吧！"],[function():void
         {
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_642_1"),function():void
            {
               NpcDialog.show(NPC.KAZI,["啊！！！为什么！你是谁！为什么老是能听见你的声音？这究竟是什么地方？"],["卡茨….你听见什么了！为什么我什么都没听见呢！"],[function():void
               {
                  NpcDialog.show(NPC.KAZI,["我听见有谁在呼唤我，这已经不是第一次了！自从我被赶出村庄后就一直有这样的感觉！但是每次我都听不清它在说什么！可恶！"],["卡茨我该怎么帮你呢？"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_642_2"),function():void
                     {
                        TasksManager.complete(TaskController_642.TASK_ID,0,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              DebugTrace.show("第一步完成");
                              taskStep = 1;
                              gotoStep2();
                           }
                        });
                     });
                  }]);
               }]);
            });
         }]);
      }
      
      private static function gotoStep2() : void
      {
         MainManager.actorModel.pos = new Point(362,450);
         NpcDialog.show(NPC.KAZI,["啊啊啊！太难受了！听上去它好像需要我去寻找什么！我想应该就在这附近！先找找，说不定能发现什么！"],["卡茨，让我来帮你一起找吧！"],[function():void
         {
            NpcDialog.show(NPC.KAZI,["你先等等，这里对我们来说很陌生，还是小心为妙，不过它好想在指引我怎么走，让我再仔细听听......."],["恩恩！"],[function():void
            {
               NpcDialog.show(NPC.KAZI,["等等，听到了，我终于听到了，小XIN你可要按照我走的路线行走哦！千万不可茹莽行事，我担心可能会有危险！"],["恩，放心吧！我一定按照卡茨的吩咐行事！(注意卡茨的指引！)"],[function():void
               {
                  TasksManager.complete(TaskController_642.TASK_ID,1,function(param1:Boolean):void
                  {
                     if(param1)
                     {
                        DebugTrace.show("第二步完成");
                        taskStep = 2;
                        gotoStep3();
                     }
                  });
               }]);
            }]);
         }]);
      }
      
      private static function gotoStep3() : void
      {
         MainManager.actorModel.pos = new Point(362,450);
         _map.conLevel["kaziMC"].visible = false;
         AnimateManager.playMcAnimate(_map.animatorLevel["kaziMC"],2,"mc2",function():void
         {
            _map.animatorLevel["kaziMC"].gotoAndStop(3);
            _map.animatorLevel["kaziMC"]["roadMC"].gotoAndPlay(2);
            MainManager.actorModel.addEventListener(RobotEvent.WALK_END,walkEndHandler);
         });
      }
      
      private static function walkEndHandler(param1:RobotEvent) : void
      {
         var evt:RobotEvent = param1;
         var pox:int = int(Point.distance(MainManager.actorModel.pos,new Point(140,295)));
         DebugTrace.show(pox);
         if(pox < 50)
         {
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,walkEndHandler);
            TasksManager.complete(TaskController_642.TASK_ID,2,function(param1:Boolean):void
            {
               if(param1)
               {
                  DebugTrace.show("第三步完成");
                  taskStep = 3;
                  gotoStep4();
               }
            });
         }
         else if(pox > 300)
         {
            _map.animatorLevel["kaziMC"]["tipMC"].gotoAndPlay(2);
         }
      }
      
      private static function gotoStep4() : void
      {
         MainManager.actorModel.pos = new Point(180,300);
         _map.animatorLevel["kaziMC"].gotoAndStop(3);
         _map.animatorLevel["kaziMC"]["roadMC"].gotoAndStop(1);
         _map.conLevel["stoneMC"].gotoAndStop(2);
         NpcDialog.show(NPC.SEER,["快看！那块石头....石头发亮了，原来还有这么隐秘的机关啊！让我去看看里面究竟藏着什么宝贝！"],null,null,false,function():void
         {
            _map.conLevel["stoneMC"].buttonMode = true;
            _map.conLevel["stoneMC"].addEventListener(MouseEvent.CLICK,stoneClickHandler1);
         });
      }
      
      private static function stoneClickHandler1(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(taskStep != 3)
         {
            return;
         }
         KTool.setActorVisible(false);
         _map.conLevel["stoneMC"].removeEventListener(MouseEvent.CLICK,stoneClickHandler1);
         AnimateManager.playMcAnimate(_map.conLevel["stoneMC"],3,"mc3",function():void
         {
            NpcDialog.show(NPC.SEER,["啊！疼....疼死人了，头好晕啊！这块石头既然敢欺负我，看我不把你砸烂！哼！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.KAZI,["小XIN，你没什么吧！小心啊！这块石头好像不欢迎你碰它哦！呵呵，还是让我试试吧！"],["卡茨你小心啊！我到现在还疼着呢！"],[function():void
               {
                  NpcDialog.show(NPC.KAZI,["呵呵，你先休息一下哦！这里就交给我吧！我想我会有办法的！"],["难道卡茨真的会有什么好办法吗？"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_642_3"),function():void
                     {
                        _map.conLevel["stoneMC"].gotoAndStop(4);
                        KTool.setActorVisible(true);
                        NpcDialog.show(NPC.KAZI,["这..这是什么？难道这块石板中会有什么不为人知的秘密吗？还是说是这块石板指引我来到这里呢？"],["点击石板试试！"],[function():void
                        {
                           MainManager.actorModel.pos = new Point(180,300);
                           _map.conLevel["stoneMC"].gotoAndStop(4);
                           _map.conLevel["stoneMC"].addEventListener(MouseEvent.CLICK,stoneClickHandler2);
                           yuanguPanel = _map.topLevel["yuanguPanel"];
                           yuanguPanel.visible = false;
                        }]);
                     });
                  }]);
               }]);
            });
         });
      }
      
      private static function stoneClickHandler2(param1:MouseEvent) : void
      {
         if(Boolean(yuanguPanel) && yuanguPanel.visible == false)
         {
            yuanguPanel.addEventListener("success",successHandler);
            yuanguPanel["closeBtn"].addEventListener(MouseEvent.CLICK,closeYuanguPanel);
            yuanguPanel["init"]();
            yuanguPanel.visible = true;
         }
      }
      
      private static function closeYuanguPanel(param1:MouseEvent = null) : void
      {
         if(Boolean(yuanguPanel))
         {
            yuanguPanel.removeEventListener("success",successHandler);
            yuanguPanel["closeBtn"].removeEventListener(MouseEvent.CLICK,closeYuanguPanel);
            yuanguPanel.visible = false;
         }
      }
      
      private static function successHandler(param1:Event) : void
      {
         var evt:Event = param1;
         _map.conLevel["stoneMC"].removeEventListener(MouseEvent.CLICK,stoneClickHandler2);
         _map.conLevel["stoneMC"].buttonMode = false;
         closeYuanguPanel();
         yuanguPanel.visible = true;
         AnimateManager.playMcAnimate(_map.topLevel["yuanguPanel"],2,"mc2",function():void
         {
            DisplayUtil.removeForParent(yuanguPanel);
            yuanguPanel = null;
            NpcDialog.show(NPC.KAZI,["我们之间的约定？？？奇怪，它究竟是谁呢！不过我感觉好像和它认识很久一样！"],["卡茨我们该怎么办呢？"],[function():void
            {
               NpcDialog.show(NPC.KAZI,["还是先想想吧！不过我的能量好像已经被它吸收了很多，现在还是先休息一下吧！正好我们也想想接下来该怎么办！"],["卡茨，你没什么事吧！我很担心你啊！"],[function():void
               {
                  KTool.setActorVisible(false);
                  _map.animatorLevel["kaziMC"].gotoAndStop(1);
                  AnimateManager.playMcAnimate(_map.animatorLevel["bossMC"],2,"mc2",function():void
                  {
                     NpcDialog.show(NPC.PIRATE_2,["哈哈哈！终于等到你们了，想不到炫彩山还有这样的秘密，看来这次收获不小啊！"],["海盗！海盗又出现了！可恶!"],[function():void
                     {
                        NpcDialog.show(NPC.KAZI,["哼哼！既然你来了就别想活着回去！难道你不知道我们的实力吗？像你这样的小喽喽根本就不是我们的对手！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.PIRATE_2,["哼哼！别以为我不知道，你的能量已经不多了，看我不好好收拾你们，相信你很快就会知道我的厉害了！"],["接招吧！"],[function():void
                           {
                              AnimateManager.playMcAnimate(_map.animatorLevel["bossMC"],3,"mc3",function():void
                              {
                                 NpcDialog.show(NPC.KAZI,["哼！你未必也太小看我了吧！想击败我还早的很呢！来吧！我不会败在你的手下！"],["卡茨，你别管我，快走，否则再这样下去你会受伤的！"],[function():void
                                 {
                                    NpcDialog.show(NPC.KAZI,["别管我，你快走！我还顶得住，你快走！！！！！"],["不行，我一定要想办法帮卡茨才行！"],[function():void
                                    {
                                       TasksManager.complete(TaskController_642.TASK_ID,3,function(param1:Boolean):void
                                       {
                                          if(param1)
                                          {
                                             DebugTrace.show("第四步完成");
                                             taskStep = 4;
                                             gotoStep5();
                                          }
                                       });
                                    }]);
                                 }]);
                              });
                           }]);
                        });
                     }]);
                  });
               }]);
            }]);
         });
      }
      
      private static function gotoStep5() : void
      {
         KTool.setActorVisible(true);
         MainManager.actorModel.pos = new Point(180,300);
         _map.animatorLevel["bossMC"].gotoAndStop(4);
         _map.animatorLevel["kaziMC"].gotoAndStop(1);
         NpcDialog.show(NPC.DUOTE,["海盗！又是海盗！我最讨厌海盗了！小个子，让我来帮你一起赶走这些令人讨厌的入侵者！"],["好啊！好啊！那太感谢你了！"],[function():void
         {
            NpcDialog.show(NPC.DUOTE,["不用谢，如果不是这些海盗的入侵，我们在炫彩山的生活也不会变成今天这样，炫彩山也不会失去它以往的面貌！"],["原来是这样，那让我们一起携手赶走海盗吧！（用头部射击海盗）"],[function():void
            {
               AnimateManager.playMcAnimate(_map.animatorLevel["bossMC"],5,"mc5",function():void
               {
                  _map.animatorLevel["bossMC"]["bloodMc"].data = {"blood":10};
                  AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
               });
            }]);
         }]);
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var bloodMc:MovieClip = null;
         var evt:AimatEvent = param1;
         var pirateHit:MovieClip = _map.animatorLevel["pirateHit"];
         if(pirateHit.hitTestPoint(evt.info.endPos.x,evt.info.endPos.y))
         {
            DebugTrace.show("被击中");
            bloodMc = _map.animatorLevel["bossMC"]["bloodMc"];
            bloodMc.data["blood"] -= 2;
            bloodMc["perTxt"].text = bloodMc.data["blood"] + "/10";
            bloodMc["perMc"].gotoAndStop(uint(101 - 10 * bloodMc.data["blood"]));
            if(bloodMc.data["blood"] <= 0)
            {
               AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
               DisplayUtil.removeForParent(bloodMc);
               DisplayUtil.removeForParent(pirateHit);
               NpcDialog.show(NPC.PIRATE_2,["可恶！你们竟然三对一，不过你们别得意，想要击败我就来炫彩山洞找我吧！哼哼，炫彩山分为5个领域，不过这里已经是海盗的天下了，哈哈哈！有本事就来闯闯吧"],["什么！海盗的天下！！！"],[function():void
               {
                  AnimateManager.playMcAnimate(_map.animatorLevel["bossMC"],6,"mc6",function():void
                  {
                     TasksManager.complete(TaskController_642.TASK_ID,4,function(param1:Boolean):void
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
            }
         }
      }
      
      private static function gotoStep6() : void
      {
         MainManager.actorModel.pos = new Point(180,300);
         _map.animatorLevel["bossMC"].gotoAndStop(7);
         NpcDialog.show(NPC.DUOTE,["看来海盗已经暂时被我们击退了，不过想要彻底瓦解海盗集团，唯一的办法就是解救炫彩山！海盗一日不除，炫彩山就一日不能恢复往日的绚丽！也许只有你们能帮我了！"],["放心吧！我们与海盗势不两立！我们一定不会让他们得逞！"],[function():void
         {
            NpcDialog.show(NPC.SEER,["看来炫彩山的事件是该向船长汇报一下了！也许他们会有什么好办法！对了，多特，你先帮我照顾一下卡茨哦！"],["这里就交给你了！"],[function():void
            {
               NpcDialog.show(NPC.SEER,["事不宜迟！我现在就去向船长汇报！"],["前往船长室！"],[function():void
               {
                  MapManager.changeMap(4);
               }]);
            }]);
         }]);
      }
      
      public static function checkTask() : void
      {
         TasksManager.getProStatusList(TaskController_642.TASK_ID,function(param1:Array):void
         {
            var a:Array = param1;
            if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && Boolean(a[4]) && !a[5])
            {
               NpcDialog.show(NPC.SEER,["船长.....船长，大事不好！炫彩山已经被海盗占领了！我刚从那边回来，顺便带了一些线索，请船长您看一下！"],["什么？！难到海盗又出没了！让我看看你带的东西！"],[function():void
               {
                  NpcDialog.show(NPC.SHIPER,["（船长观察了许久……）什么！难道是它！我知道了！小XIN，看来这次海盗的实力不小啊！解救炫彩山的任务刻不容缓！你准备好了吗？"],["为了宇宙的和平，XIN随时候命！"],[function():void
                  {
                     NpcDialog.show(NPC.SHIPER,["好！非常好！那我宣布：解救炫彩山任务开启，为了正义，为了XIN！出发！"],["海盗我一定会将你们彻底击败！"],[function():void
                     {
                        TasksManager.completeFinal(TaskController_642.TASK_ID,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              DebugTrace.show("任务完成");
                              taskStep = 6;
                           }
                        });
                     }]);
                  }]);
               }]);
            }
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
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,walkEndHandler);
            if(Boolean(_map.conLevel["kaziMC"]))
            {
               _map.conLevel["kaziMC"].removeEventListener(MouseEvent.CLICK,kaziClickHandler);
            }
            _map.conLevel["stoneMC"].removeEventListener(MouseEvent.CLICK,stoneClickHandler1);
            _map.conLevel["stoneMC"].removeEventListener(MouseEvent.CLICK,stoneClickHandler2);
            closeYuanguPanel();
            ToolBarController.showOrHideAllUser(true);
         }
         _map = null;
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 445)
         {
            initTaskForMap445(param1);
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 445)
         {
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 445)
         {
            destroy();
         }
      }
   }
}

