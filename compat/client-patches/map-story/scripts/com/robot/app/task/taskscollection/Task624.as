package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.info.pet.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task624 extends ITask
   {
      
      public static var pro:int;
      
      private static var time:int;
      
      private static var pet:PetModel;
      
      private static var map:BaseMapProcess;
      
      private static var mazeApp:AppModel;
      
      private static var maliApp:AppModel;
      
      private static var maliDetector:AppModel;
      
      private static var dienVideo:AppModel;
      
      private static var b:Boolean = false;
      
      public function Task624()
      {
         super();
      }
      
      public static function initTask_484(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = null;
         m = param1;
         map = m;
         if(!TasksController.isKaxiusiTaskEnabled(TaskController_624.TASK_ID))
         {
            removeResource_484();
            return;
         }
         if(TasksManager.getTaskStatus(619) != TasksManager.COMPLETE)
         {
            removeResource_484();
            return;
         }
         if(TasksManager.getTaskStatus(TaskController_624.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            if(!BufferRecordManager.getState(MainManager.actorInfo,134))
            {
               AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_624_0"),function():void
               {
                  BufferRecordManager.setState(MainManager.actorInfo,134,true);
                  if(map === m && MapManager.currentMap != null && MapManager.currentMap.id == 484 && TasksManager.getTaskStatus(TaskController_624.TASK_ID) == TasksManager.UN_ACCEPT)
                  {
                     accept();
                  }
               });
            }
            else
            {
               accept();
            }
         }
         else
         {
            removeResource_484();
         }
      }
      
      private static function removeResource_484() : void
      {
         DisplayUtil.removeForParent(map.conLevel["npc_624"]);
         map.conLevel["npc_624"] = null;
         DisplayUtil.removeForParent(map.conLevel["npcHit_624"]);
         map.conLevel["npcHit_624"] = null;
      }
      
      private static function accept() : void
      {
         if(map == null || MapManager.currentMap == null || MapManager.currentMap.id != 484 || TasksManager.getTaskStatus(TaskController_624.TASK_ID) != TasksManager.UN_ACCEPT || map.conLevel["npcHit_624"] == null)
         {
            return;
         }
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         ToolTipManager.add(map.conLevel["npcHit_624"],"巧克利");
         map.conLevel["npcHit_624"].buttonMode = true;
         map.conLevel["npcHit_624"].addEventListener(MouseEvent.CLICK,onNpcClick);
      }
      
      private static function onNpcClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.QIAOKELI,["哼！这样的怪物呆在我们星球上！这是绝对不容许的……"],["卡茨……怎么了？！","我一会再过来。"],[function():void
         {
            TasksManager.accept(TaskController_624.TASK_ID,function(param1:Boolean):void
            {
               var b:* = param1;
               if(Boolean(b))
               {
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_624_1"),function():void
                  {
                     MapManager.changeMap(494);
                  });
               }
               else
               {
                  DebugTrace.show("接受任务失败");
               }
            });
         }]);
      }
      
      public static function initTask_494(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         map = m;
         map.depthLevel["stone"].mouseEnabled = false;
         map.depthLevel["stone"].mouseChildren = false;
         map.depthLevel["fakeStone"].mouseEnabled = false;
         map.depthLevel["fakeStone"].mouseChildren = false;
         if(TasksManager.getTaskStatus(TaskController_624.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            removeResource_494();
         }
         else if(TasksManager.getTaskStatus(TaskController_624.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_624.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  startPro_0();
               }
               else if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  startPro_2();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  startPro_3();
               }
               else
               {
                  removeResource_494();
               }
            });
         }
         else if(TasksManager.getTaskStatus(TaskController_624.TASK_ID) == TasksManager.COMPLETE)
         {
            map.depthLevel["stone"].mouseEnabled = true;
            map.depthLevel["stone"].mouseChildren = true;
            removeResource_494();
         }
      }
      
      public static function removeResource_494() : void
      {
         initMap(3);
         DisplayUtil.removeForParent(map.conLevel["npc_624"]);
         map.conLevel["npc_624"] = null;
         DisplayUtil.removeForParent(map.conLevel["mali"]);
         map.conLevel["mali"] = null;
         DisplayUtil.removeForParent(map.depthLevel["fakeStone"]);
      }
      
      private static function startPro_0() : void
      {
         pro = 0;
         initMap(pro);
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         AnimateManager.playMcAnimate(map.conLevel["npc_624"],1,"mc_1",function():void
         {
            NpcDialog.show(NPC.KAZI,["我出不去了……谁能救救我……我……走不出去……"],["是卡茨的声音！"],[function():void
            {
               NpcDialog.show(NPC.SEER,["糟糕！这里看起来像是一个巨大的紫色迷宫，卡茨好像被困住了……不管了！前进吧……"],["（救出卡茨）"],[function():void
               {
                  ToolTipManager.add(map.depthLevel["mirror_0"],"魔镜");
                  map.depthLevel["mirror_0"].buttonMode = true;
                  map.depthLevel["mirror_0"].addEventListener(MouseEvent.CLICK,onMirrorClick);
               }]);
            }]);
         });
      }
      
      private static function startPro_1() : void
      {
         pro = 1;
         initMap(pro);
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         ToolTipManager.add(map.depthLevel["mirror_1"],"魔镜");
         map.depthLevel["mirror_1"].buttonMode = true;
         map.depthLevel["mirror_1"].addEventListener(MouseEvent.CLICK,onMirrorClick);
      }
      
      private static function startPro_2() : void
      {
         pro = 2;
         initMap(pro);
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         map.conLevel["npc_624"].gotoAndStop(2);
         ToolTipManager.add(map.conLevel["npc_624"],"卡茨");
         map.conLevel["npc_624"].buttonMode = true;
         map.conLevel["npc_624"].addEventListener(MouseEvent.CLICK,onKaciClick);
      }
      
      private static function onKaciClick(param1:MouseEvent) : void
      {
         ToolTipManager.remove(map.conLevel["npc_624"]);
         map.conLevel["npc_624"].buttonMode = false;
         map.conLevel["npc_624"].removeEventListener(MouseEvent.CLICK,onKaciClick);
         var _loc2_:PetShowInfo = new PetShowInfo();
         _loc2_.userID = MainManager.actorInfo.userID;
         _loc2_.petID = 5018;
         pet = new PetModel(MainManager.actorModel);
         pet.show(_loc2_);
         pet.mouseEnabled = false;
         pet.mouseChildren = false;
         map.conLevel["npc_624"].visible = false;
         ToolTipManager.add(map.depthLevel["mirror_2"],"魔镜");
         map.depthLevel["mirror_2"].buttonMode = true;
         map.depthLevel["mirror_2"].addEventListener(MouseEvent.CLICK,onMirrorClick);
         map.depthLevel["fakeStone"].mouseEnabled = true;
         map.depthLevel["fakeStone"].mouseChildren = true;
         map.depthLevel["fakeStone"].addEventListener(MouseEvent.CLICK,onStoneClick);
      }
      
      private static function onStoneClick(param1:MouseEvent) : void
      {
         map.depthLevel["fakeStone"].removeEventListener(MouseEvent.CLICK,onStoneClick);
         DisplayUtil.removeForParent(map.depthLevel["fakeStone"]);
         continuePro_2(true);
      }
      
      private static function startPro_3() : void
      {
         pro = 3;
         initMap(pro);
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         map.conLevel["npc_624"].gotoAndStop(4);
         ToolTipManager.add(map.conLevel["mali"],"马力");
         map.conLevel["mali"].buttonMode = true;
         map.conLevel["mali"].addEventListener(MouseEvent.CLICK,onMaliClick);
      }
      
      private static function initMap(param1:int) : void
      {
         var _loc2_:int = 0;
         while(_loc2_ < param1)
         {
            if(Boolean(map.depthLevel["mirror_" + _loc2_]))
            {
               DisplayUtil.removeForParent(map.depthLevel["mirror_" + _loc2_]);
               map.depthLevel["mirror_" + _loc2_] = null;
            }
            if(Boolean(map.typeLevel["block_" + _loc2_]))
            {
               DisplayUtil.removeForParent(map.typeLevel["block_" + _loc2_]);
               map.typeLevel["block_" + _loc2_] = null;
            }
            _loc2_++;
         }
         MapManager.currentMap.makeMapArray();
      }
      
      private static function onMirrorClick(param1:MouseEvent) : void
      {
         if(!mazeApp)
         {
            mazeApp = new AppModel(ClientConfig.getAppModule("MirrorMaze"),"正在加载游戏");
            mazeApp.setup();
            mazeApp.sharedEvents.addEventListener("MazePass",onMazePass);
            mazeApp.sharedEvents.addEventListener("MazeFail",onMazeFail);
         }
         mazeApp.show();
         if(pro == 2)
         {
            DisplayUtil.removeForParent(map.depthLevel["fakeStone"]);
         }
      }
      
      private static function onMaliClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.MALI,["想要解除黑色家伙的内心阻碍，你就必须进入它的心境迷宫，准备好了吗？"],["准备好了！"],[function():void
         {
            if(!maliApp)
            {
               maliApp = new AppModel(ClientConfig.getAppModule("MaliGame"),"正在加载游戏");
               maliApp.setup();
               maliApp.sharedEvents.addEventListener("MaliPass",onMaliPass);
               maliApp.sharedEvents.addEventListener("MaliFail",onMaliFail);
            }
            maliApp.show();
         }]);
      }
      
      private static function onMazePass(param1:Event) : void
      {
         switch(pro)
         {
            case 0:
               continuePro_0(true);
               break;
            case 1:
               continuePro_1(true);
               break;
            case 2:
               continuePro_2(true);
         }
      }
      
      private static function onMazeFail(param1:Event) : void
      {
         var e:Event = param1;
         ++time;
         switch(pro)
         {
            case 0:
               if(time > 2)
               {
                  continuePro_0(false);
                  break;
               }
               NpcDialog.show(NPC.SEER,["糟糕……还是不行……到底怎么办呢？"],["再来试试看吧！","一会再来！"],[function():void
               {
                  mazeApp.show();
               }]);
               break;
            case 1:
               if(time > 2)
               {
                  continuePro_1(false);
                  break;
               }
               NpcDialog.show(NPC.SEER,["好像越来越难了……静下心来再看看！"],["再来试试看吧！","一会再来！"],[function():void
               {
                  mazeApp.show();
               }]);
               break;
            case 2:
               if(time > 2)
               {
                  continuePro_2(false);
                  break;
               }
               NpcDialog.show(NPC.SEER,["好像越来越难了……静下心来再看看！"],["再来试试看吧！","一会再来！"],[function():void
               {
                  mazeApp.show();
               }]);
         }
      }
      
      private static function onMaliPass(param1:Event) : void
      {
         var e:Event = param1;
         ToolTipManager.remove(map.conLevel["mali"]);
         map.conLevel["mali"].buttonMode = false;
         map.conLevel["mali"].removeEventListener(MouseEvent.CLICK,onMaliClick);
         AnimateManager.playMcAnimate(map.conLevel["npc_624"],4,"mc_4",function():void
         {
            NpcDialog.show(NPC.SEER,["卡茨你怎么了……卡茨你怎么了……"],null,null,false,function():void
            {
               NpcDialog.show(NPC.MALI,["刚才你已经利用暗影进入到它的心境，至于他能不能控制这股力量就看它的造化了……"],["前面看到石板上刻画的是你的故事吗？"],[function():void
               {
                  NpcDialog.show(NPC.MALI,["我很想他……虽然他拿走了金币……但是……谢谢你让我感受到了你对精灵的友谊，原来还有友谊存在……"],["马力……"],[function():void
                  {
                     AnimateManager.playMcAnimate(map.conLevel["npc_624"],5,"mc_5",function():void
                     {
                        AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_624_4"),function():void
                        {
                           TasksManager.completeFinal(TaskController_624.TASK_ID,function():void
                           {
                              if(!b)
                              {
                                 DebugTrace.show("FAIL");
                                 removeResource_494();
                              }
                           });
                        });
                     });
                  }]);
               }]);
            });
         });
      }
      
      private static function onMaliFail(param1:Event) : void
      {
         var e:Event = param1;
         NpcDialog.show(NPC.KAZI,["啊啊啊……好痛……我快受不了了……"],["卡茨你再忍一会……"],[function():void
         {
            maliApp.show();
         }]);
      }
      
      private static function continuePro_0(param1:Boolean) : void
      {
         var b:Boolean = false;
         b = param1;
         time = 0;
         ToolTipManager.remove(map.depthLevel["mirror_0"]);
         map.depthLevel["mirror_0"].buttonMode = false;
         map.depthLevel["mirror_0"].removeEventListener(MouseEvent.CLICK,onMirrorClick);
         AnimateManager.playMcAnimate(map.depthLevel["mirror_0"],0,"",function():void
         {
            DisplayUtil.removeForParent(map.depthLevel["mirror_0"]);
            map.depthLevel["mirror_0"] = null;
            DisplayUtil.removeForParent(map.typeLevel["block_0"]);
            map.typeLevel["block_0"] = null;
            MapManager.currentMap.makeMapArray();
            if(b)
            {
               NpcDialog.show(NPC.SEER,["好神奇的一个地方……设计它的人也一定超级厉害的……会是谁设计它的呢？"],["继续前进吧！"],[function():void
               {
                  completePro_0();
               }]);
            }
            else
            {
               NpcDialog.show(NPC.UNKONW_MALI,["想要救它是吧？好！我就让进来……呵呵！我到要看看你们的友情！"],["无论多辛苦！我一定会救出它！"],[function():void
               {
                  completePro_0();
               }]);
            }
         });
      }
      
      private static function completePro_0() : void
      {
         TasksManager.complete(TaskController_624.TASK_ID,0,function(param1:Boolean):void
         {
            if(param1)
            {
               startPro_1();
            }
            else
            {
               DebugTrace.show("FAIL");
            }
         });
      }
      
      private static function continuePro_1(param1:Boolean) : void
      {
         var b:Boolean = false;
         b = param1;
         time = 0;
         ToolTipManager.remove(map.depthLevel["mirror_1"]);
         map.depthLevel["mirror_1"].buttonMode = false;
         map.depthLevel["mirror_1"].removeEventListener(MouseEvent.CLICK,onMirrorClick);
         AnimateManager.playMcAnimate(map.depthLevel["mirror_1"],0,"",function():void
         {
            DisplayUtil.removeForParent(map.depthLevel["mirror_1"]);
            map.depthLevel["mirror_1"] = null;
            DisplayUtil.removeForParent(map.typeLevel["block_1"]);
            map.typeLevel["block_1"] = null;
            MapManager.currentMap.makeMapArray();
            if(b)
            {
               completePro_1();
            }
            else
            {
               NpcDialog.show(NPC.UNKONW_MALI,["你们走吧……"],["无论多辛苦！我一定会救出它！"],[function():void
               {
                  completePro_1();
               }]);
            }
         });
      }
      
      private static function completePro_1() : void
      {
         AnimateManager.playMcAnimate(map.conLevel["npc_624"],2,"mc_2",function():void
         {
            NpcDialog.show(NPC.KAZI,["卡茨好怕……我也不知道怎么回事……我一生气就会有奇怪的事情发生……我一受伤就会像变了一个人似的……"],["别怕！有我在就好！"],[function():void
            {
               NpcDialog.show(NPC.UNKONW_MALI,["除了我好朋友对我这样以外，我还从来没有看到过这样对待精灵的……我好想他……"],["谁？谁在那里说话？"],[function():void
               {
                  if(!maliDetector)
                  {
                     maliDetector = new AppModel(ClientConfig.getAppModule("MaliDetector"),"正在加载面板");
                     maliDetector.setup();
                  }
                  maliDetector.show();
               }]);
            }]);
         });
      }
      
      public static function onDetectorClose() : void
      {
         if(!dienVideo)
         {
            dienVideo = new AppModel(ClientConfig.getAppModule("DienVideo_624"),"正在加载面板");
            dienVideo.setup();
         }
         dienVideo.show();
      }
      
      public static function onVideoClose() : void
      {
         AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_624_2"),function():void
         {
            NpcDialog.show(NPC.SEER,["别怕……别怕……你一定能学会如何控制自己能力！我带你去找那个叫马力的精灵……"],["点击卡茨（把它带在身边）"],[function():void
            {
               TasksManager.complete(TaskController_624.TASK_ID,1,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     startPro_2();
                  }
                  else
                  {
                     DebugTrace.show("FAIL");
                  }
               });
            }]);
         });
      }
      
      private static function continuePro_2(param1:Boolean) : void
      {
         var b:Boolean = false;
         b = param1;
         time = 0;
         ToolTipManager.remove(map.depthLevel["mirror_2"]);
         map.depthLevel["mirror_2"].buttonMode = false;
         map.depthLevel["mirror_2"].removeEventListener(MouseEvent.CLICK,onMirrorClick);
         AnimateManager.playMcAnimate(map.depthLevel["mirror_2"],0,"",function():void
         {
            DisplayUtil.removeForParent(map.depthLevel["mirror_2"]);
            map.depthLevel["mirror_2"] = null;
            DisplayUtil.removeForParent(map.typeLevel["block_2"]);
            map.typeLevel["block_2"] = null;
            MapManager.currentMap.makeMapArray();
            if(b)
            {
               completePro_2();
            }
            else
            {
               NpcDialog.show(NPC.KAZI,["别在为我这样了……不值得……我只是一个没人要的精灵……一个被人唾弃的诅咒之子……"],["卡茨……"],[function():void
               {
                  completePro_2();
               }]);
            }
         });
      }
      
      private static function completePro_2() : void
      {
         pet.destroy();
         AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_624_3"),function():void
         {
            MainManager.actorModel.pos = new Point(704,130);
            map.conLevel["npc_624"].visible = true;
            map.conLevel["npc_624"].gotoAndStop(3);
            NpcDialog.show(NPC.SEER,["卡茨……是你的能量把我们带过来了吗？咦？不对啊！迪恩不是说这里会有马力，可是马力呢？"],null,null,false,function():void
            {
               NpcDialog.show(NPC.SEER,["咦？这里好像记录了什么……"],["（点击石像看看）"],[function():void
               {
                  b = true;
                  map.depthLevel["stone"].mouseEnabled = true;
                  map.depthLevel["stone"].mouseChildren = true;
               }]);
            });
         });
      }
      
      public static function finishPro_2() : void
      {
         if(b)
         {
            b = false;
            AnimateManager.playMcAnimate(map.conLevel["npc_624"],3,"mc_3",function():void
            {
               TasksManager.complete(TaskController_624.TASK_ID,2,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     startPro_3();
                  }
                  else
                  {
                     DebugTrace.show("FAIL");
                  }
               });
            });
         }
      }
      
      public static function destroy() : void
      {
         OgreController.isShow = true;
         ToolBarController.showOrHideAllUser(true);
         if(MapManager.currentMap.id == 484)
         {
            if(!map)
            {
               return;
            }
            if(Boolean(map.conLevel["npcHit_624"]))
            {
               ToolTipManager.remove(map.conLevel["npcHit_624"]);
               map.conLevel["npcHit_624"].removeEventListener(MouseEvent.CLICK,onNpcClick);
            }
         }
         if(MapManager.currentMap.id == 484)
         {
            if(!map)
            {
               return;
            }
            if(Boolean(map.depthLevel["mirror_0"]))
            {
               ToolTipManager.remove(map.depthLevel["mirror_0"]);
               map.depthLevel["mirror_0"].removeEventListener(MouseEvent.CLICK,onMirrorClick);
            }
            if(Boolean(map.depthLevel["mirror_1"]))
            {
               ToolTipManager.remove(map.depthLevel["mirror_1"]);
               map.depthLevel["mirror_1"].removeEventListener(MouseEvent.CLICK,onMirrorClick);
            }
            if(Boolean(map.depthLevel["mirror_2"]))
            {
               ToolTipManager.remove(map.depthLevel["mirror_2"]);
               map.depthLevel["mirror_2"].removeEventListener(MouseEvent.CLICK,onMirrorClick);
            }
            if(Boolean(map.conLevel["npc_624"]))
            {
               ToolTipManager.remove(map.conLevel["npc_624"]);
               map.conLevel["npc_624"].removeEventListener(MouseEvent.CLICK,onKaciClick);
            }
            if(Boolean(map.conLevel["mali"]))
            {
               ToolTipManager.remove(map.conLevel["mali"]);
               map.conLevel["mali"].removeEventListener(MouseEvent.CLICK,onMaliClick);
            }
         }
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         map = param1;
         if(MapManager.currentMap.id == 484)
         {
            removeResource_484();
         }
         if(MapManager.currentMap.id == 494)
         {
            removeResource_494();
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 484)
         {
            initTask_484(param1);
         }
         if(MapManager.currentMap.id == 494)
         {
            initTask_494(param1);
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 484)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 494)
         {
            destroy();
         }
         map = null;
      }
   }
}

