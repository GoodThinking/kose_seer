package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.info.pet.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.MapLibManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.filters.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.utils.*;
   
   public class Task633 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var obstruction1MC:MovieClip;
      
      private static var obstruction2MC:MovieClip;
      
      private static var obstruction3MC:MovieClip;
      
      private static var obstruction4MC:MovieClip;
      
      private static var shovelMC:MovieClip;
      
      private static var stoneMC:MovieClip;
      
      private static var bucketMC:MovieClip;
      
      private static var ropeMC:MovieClip;
      
      private static var saveArr:Array;
      
      private static var _model:PetModel;
      
      private static var topStone:Shape;
      
      private static var stone1MC:MovieClip;
      
      private static var stone2MC:MovieClip;
      
      public function Task633()
      {
         super();
      }
      
      public static function initTaskForMap476(param1:BaseMapProcess) : void
      {
         var ret:uint = 0;
         var map:BaseMapProcess = param1;
         _map = map;
         _map.conLevel["stoneHit"].mouseEnabled = false;
         _map.conLevel["stoneHit"].mouseChildren = false;
         obstruction1MC = _map.conLevel["obstruction1MC"];
         obstruction2MC = _map.conLevel["obstruction2MC"];
         obstruction3MC = _map.conLevel["obstruction3MC"];
         obstruction4MC = _map.conLevel["obstruction4MC"];
         stone1MC = _map.conLevel["stone1MC"];
         stone2MC = _map.conLevel["stone2MC"];
         shovelMC = obstruction3MC["shovelMC"];
         stoneMC = obstruction3MC["stoneMC"];
         bucketMC = obstruction3MC["bucketMC"];
         ropeMC = obstruction3MC["ropeMC"];
         topStone = null;
         ret = uint(TasksManager.getTaskStatus(633));
         if(ret == TasksManager.UN_ACCEPT)
         {
            _map.depthLevel["kazi"].visible = false;
         }
         else if(ret != TasksManager.COMPLETE)
         {
            _map.depthLevel["kazi"].visible = false;
            saveArr = [null];
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_633.TASK_ID,function(param1:Array):void
            {
               var a:Array = param1;
               if(!a[0])
               {
                  TasksManager.complete(TaskController_633.TASK_ID,0,function(param1:Boolean):void
                  {
                     DebugTrace.show("第一步完成");
                  });
               }
               initHello1(a[1]);
               initHello2(a[2]);
               initHello3(a[3]);
               initHello4(a[4]);
               setKaZiFollow(true);
               if(Boolean(a[0]) && Boolean(a[1]) && Boolean(a[2]) && Boolean(a[3]) && Boolean(a[4]) && !a[5])
               {
                  completeStep(5);
               }
            });
            return;
         }
         initHello1(true);
         initHello2(true);
         initHello3(true);
         initHello4(true);
      }
      
      private static function initHello1(param1:Boolean) : void
      {
         if(Boolean(saveArr))
         {
            saveArr[1] = param1;
         }
         if(!param1)
         {
            obstruction1MC.buttonMode = true;
            obstruction1MC.addEventListener(MouseEvent.CLICK,obstruction1ClickHandler);
            addExcalMark("obstruction1",160,315);
         }
         else
         {
            obstruction1MC.gotoAndStop(5);
            obstruction1MC.mouseEnabled = false;
            obstruction1MC.mouseChildren = false;
         }
      }
      
      private static function initHello2(param1:Boolean) : void
      {
         if(Boolean(saveArr))
         {
            saveArr[2] = param1;
         }
         if(!param1)
         {
            obstruction2MC.buttonMode = true;
            stone1MC.buttonMode = stone2MC.buttonMode = true;
            obstruction2MC.addEventListener(MouseEvent.CLICK,obstruction2ClickHandler);
            stone1MC.addEventListener(MouseEvent.CLICK,stonesClickHandler);
            stone2MC.addEventListener(MouseEvent.CLICK,stonesClickHandler);
            addExcalMark("obstruction2",672,258);
            obstruction2MC.gotoAndStop(2);
         }
         else
         {
            stone1MC.gotoAndStop(2);
            obstruction2MC.gotoAndStop(1);
            obstruction2MC.mouseChildren = obstruction2MC.mouseEnabled = false;
         }
      }
      
      private static function initHello3(param1:Boolean) : void
      {
         if(Boolean(saveArr))
         {
            saveArr[3] = param1;
         }
         if(!param1)
         {
            shovelMC.buttonMode = stoneMC.buttonMode = bucketMC.buttonMode = ropeMC.buttonMode = true;
            shovelMC.addEventListener(MouseEvent.CLICK,shovelClickHandler);
            stoneMC.addEventListener(MouseEvent.CLICK,stoneClickHandler);
            bucketMC.addEventListener(MouseEvent.CLICK,bucketClickHandler);
            ropeMC.addEventListener(MouseEvent.CLICK,ropeClickHandler);
            addExcalMark("obstruction3",370,82);
         }
         else
         {
            stoneMC.gotoAndStop(3);
            obstruction3MC.mouseChildren = obstruction3MC.mouseEnabled = false;
            stoneMC.mouseChildren = stoneMC.mouseEnabled = false;
         }
      }
      
      private static function initHello4(param1:Boolean) : void
      {
         if(Boolean(saveArr))
         {
            saveArr[4] = param1;
         }
         if(!param1)
         {
            setTopStone(true);
            obstruction4MC.buttonMode = true;
            obstruction4MC.addEventListener(MouseEvent.CLICK,obstruction4ClickHandler);
            addExcalMark("obstruction4",715,54);
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
         }
         else
         {
            setTopStone(false);
            obstruction4MC.gotoAndStop(5);
            obstruction4MC.mouseChildren = obstruction4MC.mouseEnabled = false;
            _map.conLevel["stoneHit"].mouseChildren = _map.conLevel["stoneHit"].mouseEnabled = false;
         }
      }
      
      private static function addExcalMark(param1:String, param2:Number, param3:Number) : void
      {
         var _loc4_:MovieClip = AssetsManager.getMovieClip("lib_excalmatory_mark");
         if(_loc4_ == null)
         {
            return;
         }
         _loc4_.mouseEnabled = _loc4_.mouseChildren = false;
         _loc4_.filters = [new GlowFilter(0,1,2,2)];
         _loc4_.x = param2;
         _loc4_.y = param3 + 25;
         _loc4_.name = param1;
         _map.topLevel.addChild(_loc4_);
      }
      
      private static function removeExcalMark(param1:String) : void
      {
         var _loc2_:MovieClip = _map.topLevel.getChildByName(param1) as MovieClip;
         if(Boolean(_loc2_))
         {
            DisplayUtil.removeForParent(_loc2_);
         }
      }
      
      private static function completeStep(param1:uint = 0) : void
      {
         var n:uint = param1;
         if(Boolean(saveArr))
         {
            if(Boolean(saveArr[1]) && Boolean(saveArr[2]) && Boolean(saveArr[3]) && Boolean(saveArr[4]))
            {
               DebugTrace.show("所有精灵都已救出");
               AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_633_2"),function():void
               {
                  setKaZiFollow(false);
                  endHandler();
                  NpcDialog.show(NPC.SEER,["赛尔怎么可以流眼泪……不可以……绝不可以……但是我感觉眼眶湿湿的……卡茨！你……你一定要加油……"],["卡茨是赛尔最重要的朋友！！！"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_633_3"),function():void
                     {
                        TasksManager.completeFinal(TaskController_633.TASK_ID,function(param1:Boolean):void
                        {
                           ToolBarController.showOrHideAllUser(true);
                           DebugTrace.show("任务完成");
                           Task637.initTask_476(_map);
                        });
                     });
                  }]);
               });
            }
         }
      }
      
      private static function endHandler() : void
      {
         _map.depthLevel["kazi"].visible = true;
         _map.depthLevel["kazi"].gotoAndStop(1);
      }
      
      private static function setKaZiFollow(param1:Boolean) : void
      {
         var _loc2_:PetShowInfo = null;
         if(_model == null && param1)
         {
            _loc2_ = new PetShowInfo();
            _loc2_.userID = MainManager.actorInfo.userID;
            _loc2_.petID = 5018;
            _model = new PetModel(MainManager.actorModel);
            _model.mouseEnabled = false;
            _model.mouseChildren = false;
            _model.show(_loc2_);
         }
         else if(Boolean(_model) && !param1)
         {
            _model.destroy();
            _model = null;
         }
      }
      
      private static function setTopStone(param1:Boolean) : void
      {
         if(param1 && topStone == null)
         {
            topStone = new Shape();
            topStone.graphics.beginFill(26367);
            topStone.graphics.drawRect(0,0,20,40);
            topStone.graphics.endFill();
            _map.typeLevel.addChild(topStone);
            topStone.x = 780;
            topStone.y = 115;
            MapManager.currentMap.makeMapArray();
         }
         else if(!param1 && Boolean(topStone))
         {
            DisplayUtil.removeForParent(topStone);
            topStone = null;
            MapManager.currentMap.makeMapArray();
         }
      }
      
      private static function obstruction1ClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(obstruction1MC.currentFrame == 1)
         {
            AnimateManager.playMcAnimate(obstruction1MC,2,"mc2",function():void
            {
            });
         }
         else if(obstruction1MC.currentFrame == 2)
         {
            removeExcalMark("obstruction1");
            AnimateManager.playMcAnimate(obstruction1MC,3,"mc3",function():void
            {
               NpcDialog.show(NPC.HELLO,["恩人……恩人呢……大恩人……我先走了！你们可要保重……"],["(快去救其他精灵吧！)"],[function():void
               {
                  obstruction1MC.mouseEnabled = false;
                  obstruction1MC.mouseChildren = false;
                  AnimateManager.playMcAnimate(obstruction1MC,4,"mc4",function():void
                  {
                     TasksManager.complete(TaskController_633.TASK_ID,1,function(param1:Boolean):void
                     {
                        initHello1(true);
                        DebugTrace.show("第一个精灵解救成功");
                        completeStep(1);
                     });
                  });
               }]);
            });
         }
      }
      
      private static function obstruction2ClickHandler(param1:MouseEvent) : void
      {
         NpcDialog.show(NPC.HELLO,["痛……痛……痛……谁能帮我赶走它啊！o(╯□╰)o"],["(点击小石头扔它吧！)"]);
      }
      
      private static function stonesClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         stone1MC.mouseChildren = stone1MC.mouseEnabled = false;
         stone2MC.mouseChildren = stone2MC.mouseEnabled = false;
         removeExcalMark("obstruction2");
         stone1MC.gotoAndStop(2);
         AnimateManager.playMcAnimate(obstruction2MC,3,"mc3",function():void
         {
            AnimateManager.playMcAnimate(obstruction2MC,4,"mc4",function():void
            {
               NpcDialog.show(NPC.HELLO,["好险……原来传说中的莱克喜欢矿石……早说嘛……前面都吓死我了！哦对了，差点忘记谢谢你了……"],["时间不多了！你快走吧！"],[function():void
               {
                  obstruction2MC.mouseEnabled = false;
                  obstruction2MC.mouseChildren = false;
                  AnimateManager.playMcAnimate(obstruction2MC,5,"mc5",function():void
                  {
                     TasksManager.complete(TaskController_633.TASK_ID,2,function(param1:Boolean):void
                     {
                        initHello2(true);
                        DebugTrace.show("第二个精灵解救成功");
                        completeStep(2);
                     });
                  });
               }]);
            });
         });
      }
      
      private static function shovelClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(stoneMC.currentFrame == 1)
         {
            shovelMC.visible = false;
            AnimateManager.playMcAnimate(stoneMC,2,"mc2",function():void
            {
               stoneMC.gotoAndStop(3);
               shovelMC.visible = true;
            });
         }
         else if(stoneMC.currentFrame == 3)
         {
            AnimateManager.playMcAnimate(shovelMC,2,"mc2",function():void
            {
               shovelMC.gotoAndStop(1);
            });
         }
      }
      
      private static function stoneClickHandler(param1:MouseEvent) : void
      {
         if(stoneMC.currentFrame == 1)
         {
            NpcDialog.show(NPC.HELLO,["哟呼！上面的朋友！你能听到我说话吗？这里有个精灵……"],["(找一些工具来救它吧！)"]);
         }
      }
      
      private static function bucketClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(bucketMC.currentFrame == 1)
         {
            AnimateManager.playMcAnimate(bucketMC,2,"mc2",function():void
            {
               bucketMC.gotoAndStop(1);
            });
         }
      }
      
      private static function ropeClickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(stoneMC.currentFrame == 3)
         {
            removeExcalMark("obstruction3");
            if(ropeMC.currentFrame == 1)
            {
               AnimateManager.playMcAnimate(ropeMC,2,"mc2",function():void
               {
                  NpcDialog.show(NPC.HELLO,["泪流满面……你终于把我救上来了……下面好吓人……好阴暗……好潮湿……好……我觉得情况不妙！闪人……"],["糟糕……"],[function():void
                  {
                     obstruction3MC.mouseEnabled = false;
                     obstruction3MC.mouseChildren = false;
                     AnimateManager.playMcAnimate(ropeMC,3,"mc3",function():void
                     {
                        TasksManager.complete(TaskController_633.TASK_ID,3,function(param1:Boolean):void
                        {
                           initHello3(true);
                           DebugTrace.show("第三个精灵解救成功");
                           completeStep(3);
                        });
                     });
                  }]);
               });
            }
         }
         else
         {
            NpcDialog.show(NPC.SEER,["咦？好像有什么东西堵住洞口了！快用铲子把它移开吧！"],["(点击铲子试试)"]);
         }
      }
      
      private static function obstruction4ClickHandler(param1:MouseEvent) : void
      {
         NpcDialog.show(NPC.HELLO,["神马神马的都是浮云！来朵云让我过去吧！"],["(用射击打一些碎石来填补吧)"]);
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var evt:AimatEvent = param1;
         if(Boolean(_map.conLevel["stoneHit"].hitTestPoint(evt.info.endPos.x,evt.info.endPos.y)))
         {
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            obstruction4MC.mouseEnabled = false;
            obstruction4MC.mouseChildren = false;
            removeExcalMark("obstruction4");
            AnimateManager.playMcAnimate(obstruction4MC,3,"mc3",function():void
            {
               NpcDialog.show(NPC.HELLO,["快走吧！我感觉这里快不行了……"],["快……快离开这里！你的精灵族人还在等你！"],[function():void
               {
                  setTopStone(false);
                  AnimateManager.playMcAnimate(obstruction4MC,4,"mc4",function():void
                  {
                     TasksManager.complete(TaskController_633.TASK_ID,4,function(param1:Boolean):void
                     {
                        initHello4(true);
                        DebugTrace.show("第四个精灵解救成功");
                        completeStep(4);
                     });
                  });
               }]);
            });
         }
      }
      
      public static function initTaskForMap497(param1:BaseMapProcess) : void
      {
         var _loc2_:uint = 0;
         _map = param1;
         if(TasksManager.getTaskStatus(628) == TasksManager.COMPLETE)
         {
            _loc2_ = uint(TasksManager.getTaskStatus(633));
            if(_loc2_ == TasksManager.UN_ACCEPT)
            {
               _map.animatorLevel["pirate"].visible = true;
               _map.conLevel["task633Hit"].mouseEnabled = true;
               _map.conLevel["task633Hit"].mouseChildren = true;
               _map.conLevel["task633Hit"].buttonMode = true;
               _map.conLevel["task633Hit"].addEventListener(MouseEvent.CLICK,acceptTask633);
               _map.animatorLevel["pirate"].gotoAndStop(6);
            }
            else if(_loc2_ == TasksManager.ALR_ACCEPT)
            {
               DisplayUtil.removeForParent(_map.animatorLevel["pirate"]);
               setKaZiFollow(true);
            }
            else if(_loc2_ == TasksManager.COMPLETE)
            {
               DisplayUtil.removeForParent(_map.animatorLevel["pirate"]);
            }
         }
      }
      
      private static function acceptTask633(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         NpcDialog.show(NPC.KAZI,[MainManager.actorInfo.formatNick + "，我已经恢复咯！哈哈！是不是很意外呢！哦对了，这还要谢谢哈喽它们……"],["这真是太好了！","我一会再来找你"],[function():void
         {
            TasksManager.accept(TaskController_633.TASK_ID,function(param1:Boolean):void
            {
               var b:* = param1;
               if(Boolean(b))
               {
                  _map.conLevel["task633Hit"].visible = false;
                  AnimateManager.playMcAnimate(_map.animatorLevel["pirate"],7,"pirate7Mc",function():void
                  {
                     AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_633_1"),function():void
                     {
                        NpcDialog.show(NPC.HELLO,["SUN星球可能就要毁灭了，莱克是SUN星球的灾难预兆！"],["莱克？"],[function():void
                        {
                           var panel:* = undefined;
                           panel = undefined;
                           panel = MapLibManager.getMovieClip("infoPanel");
                           if(Boolean(panel))
                           {
                              LevelManager.topLevel.addChild(panel);
                              DisplayUtil.align(panel,null,AlignType.MIDDLE_CENTER);
                              LevelManager.closeMouseEvent();
                              panel.closeBTN.addEventListener(MouseEvent.CLICK,function(param1:MouseEvent):void
                              {
                                 var evt:* = param1;
                                 panel.closeBTN.removeEventListener(MouseEvent.CLICK,arguments.callee);
                                 DisplayUtil.removeForParent(panel);
                                 LevelManager.openMouseEvent();
                                 NpcDialog.show(NPC.HELLO,["正如你所看到的，看到它就意味着SUN星球会发生灾难，甚至是毁灭……糟糕！还有精灵在阳光大地！（第二场景）"],["你们先走！我和卡茨去救他们……哈喽精灵家族可不能全军覆没！"],[function():void
                                 {
                                    AnimateManager.playMcAnimate(_map.animatorLevel["pirate"],8,"pirate8Mc",function():void
                                    {
                                       var _loc1_:* = AssetsManager.getMovieClip("HelpUI_Arrow");
                                       if(Boolean(_loc1_))
                                       {
                                          _loc1_.mouseEnabled = _loc1_.mouseChildren = false;
                                          _loc1_.gotoAndStop(1);
                                          _loc1_.x = 758;
                                          _loc1_.y = 136;
                                          _loc1_.rotation = 70;
                                          _map.conLevel.addChild(_loc1_);
                                          setKaZiFollow(true);
                                          _model.pos = new Point(407,445);
                                       }
                                    });
                                 }]);
                              });
                           }
                        }]);
                     },false);
                  });
               }
            });
         }]);
      }
      
      public static function destroy() : void
      {
         if(!_map)
         {
            return;
         }
         setKaZiFollow(false);
         if(MapManager.currentMap.id == 497)
         {
            if(Boolean(_map.conLevel["task633Hit"]))
            {
               _map.conLevel["task633Hit"].removeEventListener(MouseEvent.CLICK,acceptTask633);
            }
         }
         if(MapManager.currentMap.id == 476)
         {
            AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            if(null != obstruction1MC)
            {
               obstruction1MC.removeEventListener(MouseEvent.CLICK,obstruction1ClickHandler);
            }
            if(null != obstruction2MC)
            {
               obstruction2MC.removeEventListener(MouseEvent.CLICK,obstruction2ClickHandler);
            }
            if(null != obstruction4MC)
            {
               obstruction4MC.removeEventListener(MouseEvent.CLICK,obstruction4ClickHandler);
            }
            if(null != bucketMC)
            {
               bucketMC.removeEventListener(MouseEvent.CLICK,bucketClickHandler);
            }
            if(null != bucketMC)
            {
               bucketMC.removeEventListener(MouseEvent.CLICK,bucketClickHandler);
            }
            if(null != ropeMC)
            {
               ropeMC.removeEventListener(MouseEvent.CLICK,ropeClickHandler);
            }
            if(null != shovelMC)
            {
               shovelMC.removeEventListener(MouseEvent.CLICK,shovelClickHandler);
            }
            if(null != stoneMC)
            {
               stoneMC.removeEventListener(MouseEvent.CLICK,stoneClickHandler);
            }
            if(null != stone1MC)
            {
               stone1MC.removeEventListener(MouseEvent.CLICK,stonesClickHandler);
            }
            if(null != stone2MC)
            {
               stone2MC.removeEventListener(MouseEvent.CLICK,stonesClickHandler);
            }
            ToolBarController.showOrHideAllUser(true);
            if(Boolean(saveArr))
            {
               saveArr.length = 0;
            }
         }
         _map = null;
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 476)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 497)
         {
            destroy();
         }
         _map = null;
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         _map = param1;
         if(MapManager.currentMap.id == 476)
         {
         }
         if(MapManager.currentMap.id == 497)
         {
            if(TasksManager.getTaskStatus(628) == TasksManager.COMPLETE || TasksManager.getTaskStatus(633) == TasksManager.COMPLETE)
            {
               DisplayUtil.removeForParent(_map.animatorLevel["pirate"]);
            }
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 476)
         {
            initTaskForMap476(param1);
         }
         if(MapManager.currentMap.id == 497)
         {
            initTaskForMap497(param1);
         }
      }
   }
}

