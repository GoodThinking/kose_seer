package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
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
   
   public class Task641 extends ITask
   {
      
      private static var _kazi:PetModel;
      
      private static var _map:BaseMapProcess;
      
      private static var _ogre:Array = [];
      
      private static var _point:Point = new Point(660,380);
      
      private static var _num:int = 0;
      
      private static var _ogreNum:int = 0;
      
      public function Task641()
      {
         super();
      }
      
      public static function initTask_478(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         _map.conLevel["hot_D"].visible = false;
         _map.depthLevel["gaiya"].visible = false;
         _map.depthLevel["leiyi"].visible = false;
         _map.topLevel["arrow_640"].visible = false;
         if(TasksManager.getTaskStatus(637) != TasksManager.COMPLETE)
         {
            _map.conLevel["green"].visible = false;
            _map.depthLevel["kaxiu"].visible = false;
            _map.depthLevel["leiyi"].visible = false;
            _map.depthLevel["gaiya"].visible = false;
            _map.topLevel["arrow_640"].visible = false;
            return;
         }
         if(TasksManager.getTaskStatus(TaskController_641.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            accept();
         }
         else if(TasksManager.getTaskStatus(TaskController_641.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_641.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  startPro_0();
               }
               else
               {
                  if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
                  {
                     startPro_4();
                  }
                  _map.conLevel["hot_D"].visible = true;
                  _map.conLevel["green"].gotoAndStop(3);
                  DisplayUtil.removeForParent(_map.depthLevel["kaxiu"]);
                  _map.depthLevel["kaxiu"] = null;
               }
            });
         }
         else
         {
            _map.conLevel["hot_D"].visible = true;
            _map.conLevel["green"].gotoAndStop(3);
            DisplayUtil.removeForParent(_map.depthLevel["kaxiu"]);
            _map.depthLevel["kaxiu"] = null;
            DisplayUtil.removeForParent(_map.depthLevel["leiyi"]);
            _map.depthLevel["leiyi"] = null;
            DisplayUtil.removeForParent(_map.depthLevel["gaiya"]);
            _map.depthLevel["gaiya"] = null;
            DisplayUtil.removeForParent(_map.topLevel["arrow_640"]);
            _map.topLevel["arrow_640"] = null;
         }
      }
      
      public static function initTask_414(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         if(TasksManager.getTaskStatus(TaskController_641.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_641.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  startPro_3();
               }
            });
         }
      }
      
      private static function accept() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         _map.depthLevel["kaxiu"].visible = true;
         ToolTipManager.add(_map.depthLevel["kaxiu"],"卡修");
         _map.depthLevel["kaxiu"].gotoAndStop(2);
         _map.depthLevel["kaxiu"].buttonMode = true;
         _map.depthLevel["kaxiu"].addEventListener(MouseEvent.CLICK,onNpcClick);
      }
      
      private static function onNpcClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.KAXIU,["魔窟开启了！魔窟开启了！！！" + MainManager.actorInfo.formatNick + "，我们快冲进去吧！黑暗魔王一定就在里面！"],["这会不会是个陷阱？","我一会就来！"],[function():void
         {
            ToolTipManager.remove(_map.depthLevel["kaxiu"]);
            _map.depthLevel["kaxiu"].gotoAndStop(1);
            _map.depthLevel["kaxiu"].buttonMode = false;
            _map.depthLevel["kaxiu"].removeEventListener(MouseEvent.CLICK,onNpcClick);
            TasksManager.accept(TaskController_641.TASK_ID,function(param1:Boolean):void
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
         ToolTipManager.add(_map.depthLevel["kaxiu"],"卡修");
         _map.depthLevel["kaxiu"].buttonMode = true;
         _map.depthLevel["kaxiu"].addEventListener(MouseEvent.CLICK,onNpcClick_0);
      }
      
      private static function onNpcClick_0(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(_map.depthLevel["kaxiu"]);
         _map.depthLevel["kaxiu"].buttonMode = false;
         _map.depthLevel["kaxiu"].removeEventListener(MouseEvent.CLICK,onNpcClick_0);
         _map.conLevel["green"].visible = true;
         NpcDialog.show(NPC.KAXIU,["事不宜迟……我们快走吧！！！"],["谁？？"],[function():void
         {
            AnimateManager.playMcAnimate(_map.conLevel["green"],1,"mc_1",function():void
            {
               NpcDialog.show(NPC.GREEN_MYSTERY_PET,["笑话……就你们两个还想去挑战魔王？"],["谁？？？ "],[function():void
               {
                  NpcDialog.show(NPC.GREEN_MYSTERY_PET,["别管我是谁，你听着就好！记得去找雷神雷伊，战神盖亚！只有结合他们的力量，才会有一丝希望！ "],["不要走……你到底是谁啊！"],[function():void
                  {
                     AnimateManager.playMcAnimate(_map.conLevel["green"],2,"mc_2",function():void
                     {
                        NpcDialog.show(NPC.SEER,["刚才那个究竟是谁？算了，没时间考虑了！！事不宜迟，先去赫尔卡星遗迹找雷伊帮忙吧！人多力量大！走！"],["（前往赫尔卡星荒地）"],[function():void
                        {
                           TasksManager.complete(TaskController_641.TASK_ID,0,function(param1:Boolean):void
                           {
                              if(param1)
                              {
                                 MapManager.changeMap(32);
                              }
                           });
                        }]);
                     });
                  }]);
               }]);
            });
         }]);
      }
      
      public static function initTask_32(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         if(TasksManager.getTaskStatus(TaskController_641.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_641.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && !param1[1])
               {
                  startPro_1();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  startPro_2();
               }
            });
         }
      }
      
      private static function startPro_1() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         createPet();
         NpcDialog.show(NPC.SEER,["乌鸦……你研究雷伊这么久，你能透露它什么时候出现吗？"],null,null,false,function():void
         {
            NpcDialog.show(NPC.LEIYISEER,["请管我叫乌哥！哈哈，作为一个专业研究雷伊的赛尔，我想告诉你，我……不知道！哈哈哈……"],["不是你开玩笑的时候啦！危急关头！ "],[function():void
            {
               TasksManager.complete(TaskController_641.TASK_ID,1,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     startPro_2();
                  }
               });
            }]);
         });
      }
      
      private static function startPro_2() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         createPet();
         NpcDialog.show(NPC.LEIYISEER,["好吧，我只知道……当你虔诚的用头部射击水银湖，雷伊大人就可能会出现哦！"],["死马当活马医吧！（向着水银湖头部射击） "],[function():void
         {
            AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
         }]);
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var e:AimatEvent = param1;
         if(Boolean(_map.conLevel["hit_640"].hitTestPoint(e.info.endPos.x,e.info.endPos.y,true)))
         {
            ++_num;
            if(_num == 1)
            {
               NpcDialog.show(NPC.LEIYISEER,["我想下一次你射击，雷伊大人一定会出现！"]);
            }
            if(_num == 2)
            {
               AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
               NpcDialog.show(NPC.LEIYISEER,["囧……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.SEER,["算了……走吧！时间不多了！我们要不先去找盖亚吧……可是它也是行踪飘忽……"],["走吧…… "],[function():void
                  {
                     _map.conLevel["kaku_leiyi"].visible = true;
                     AnimateManager.playMcAnimate(_map.conLevel["kaku_leiyi"],1,"mc_1",function():void
                     {
                        NpcDialog.show(NPC.LEIYISEER,["雷……雷神！！！雷伊大人！！！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.SEER,["雷神，请求与我们并肩作战吧！我们需要你……魔窟的大门已经开启……"],null,null,false,function():void
                           {
                              NpcDialog.show(NPC.LEIYI,["事不宜迟，走！"],["可是……还要找到盖亚……但是它行踪飘忽不定！"],[function():void
                              {
                                 NpcDialog.show(NPC.LEIYI,["我知道它在哪里，跟我走吧！"],["（寻找盖亚）"],[function():void
                                 {
                                    TasksManager.complete(TaskController_641.TASK_ID,2,function(param1:Boolean):void
                                    {
                                       if(param1)
                                       {
                                          MapManager.changeMap(414);
                                       }
                                    });
                                 }]);
                              }]);
                           });
                        });
                     });
                  }]);
               });
            }
         }
      }
      
      private static function startPro_3() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_640_0"),function():void
         {
            NpcDialog.show(NPC.LEIYI,["我知道它在哪里，跟我走吧！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.GAIYA,["这个小子不错嘛！有两手！能干掉黑暗魔王，我再来和你干一场！"],["走！"],[function():void
               {
                  TasksManager.complete(TaskController_641.TASK_ID,3,function(param1:Boolean):void
                  {
                     if(param1)
                     {
                        MapManager.changeMap(478);
                     }
                  });
               }]);
            });
         });
      }
      
      private static function startPro_4() : void
      {
         OgreController.isShow = false;
         ToolBarController.showOrHideAllUser(false);
         createPet();
         _map.depthLevel["gaiya"].visible = true;
         _map.depthLevel["leiyi"].visible = true;
         _map.topLevel["arrow_640"].visible = true;
      }
      
      public static function initTaskForMap479(param1:BaseMapProcess) : void
      {
         var m:BaseMapProcess = param1;
         _map = m;
         if(TasksManager.getTaskStatus(TaskController_641.TASK_ID) == TasksManager.UN_ACCEPT)
         {
            removeResource_479();
         }
         else if(TasksManager.getTaskStatus(TaskController_641.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_641.TASK_ID,function(param1:Array):void
            {
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  startPro_4_1();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && Boolean(param1[4]) && !param1[5])
               {
                  startPro_5();
               }
               else
               {
                  removeResource_479();
               }
            });
         }
         else
         {
            removeResource_479();
         }
      }
      
      private static function removeResource_479() : void
      {
         DisplayUtil.removeForParent(_map.conLevel["boss"]);
         _map.conLevel["boss"] = null;
         DisplayUtil.removeForParent(_map.conLevel["leigai"]);
         _map.conLevel["leigai"] = null;
         DisplayUtil.removeForParent(_map.conLevel["kaxiu"]);
         _map.conLevel["kaxiu"] = null;
         DisplayUtil.removeForParent(_map.depthLevel["npc"]);
         _map.depthLevel["npc"] = null;
      }
      
      private static function startPro_4_1() : void
      {
         ToolBarController.showOrHideAllUser(false);
         NpcDialog.show(NPC.DIXIU,["黑暗源于新生！出来吧！我的黑暗子民……"],null,null,false,function():void
         {
            createOgre();
            NpcDialog.show(NPC.GAIYA,["少废话！上！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.GAIYA,["铁皮家伙！帮我们拖住那帮小兵，不然我们没办法集中战斗！"],["（消灭邪恶小兵）"],[function():void
               {
                  TasksManager.complete(TaskController_641.TASK_ID,4,function(param1:Boolean):void
                  {
                     if(param1)
                     {
                        startPro_5();
                     }
                  });
               }]);
            });
         });
      }
      
      private static function startPro_5() : void
      {
         var _loc1_:OgreModel = null;
         ToolBarController.showOrHideAllUser(false);
         if(_ogre.length == 0)
         {
            createOgre();
         }
         var _loc2_:int = int(_ogre.length);
         var _loc3_:int = 0;
         while(_loc3_ < _loc2_)
         {
            _loc1_ = _ogre[_loc3_] as OgreModel;
            _loc1_.isPurseFlag = true;
            _loc1_.addEventListener(MouseEvent.CLICK,onOgreClick);
            _loc3_++;
         }
      }
      
      private static function onOgreClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var o:OgreModel = e.target as OgreModel;
         if(o == null)
         {
            return;
         }
         o.removeEventListener(MouseEvent.CLICK,onOgreClick);
         o.destroy();
         o = null;
         ++_ogreNum;
         if(_ogreNum == 9)
         {
            AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_640_1"),function():void
            {
               _map.conLevel["kaxiu"].gotoAndStop(2);
               DisplayUtil.removeForParent(_map.conLevel["boss"]);
               _map.conLevel["boss"] = null;
               DisplayUtil.removeForParent(_map.depthLevel["npc"]);
               _map.depthLevel["npc"] = null;
               NpcDialog.show(NPC.SEER,["额……刚刚发生什么事情了，不好，魔王…魔王呢？！好疼啊！浑身像散架一下啊！"],null,null,false,function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["leigai"],0,"",function():void
                  {
                     NpcDialog.show(NPC.LEIYI,["小个子，你没事吧！之前由于暗黑能量大爆炸，我们都被震了好远，还好现在大家都没什么大碍！魔王也已经消失了！"],["真的吗！太好了！听到这个好消息，我已经没什么大碍了！"],[function():void
                     {
                        NpcDialog.show(NPC.GAIYA,["哼哼！果然不是我们的对手，这次的特训终于派上用处了！哈哈哈！无论有多么强大的敌人，只要同心协力，一定会被我们击败的！"],["糟糕！卡茨呢？卡茨怎么不见了！"],[function():void
                        {
                           NpcDialog.show(NPC.LEIYI,["快看！！远处山上有个黑影，是谁！难道是暗黑魔王的爪牙吗？不会，好像…经过刚才的大战卡茨进化了吗！"],["什么！卡茨竟然进化了，太神奇了！"],[function():void
                           {
                              NpcDialog.show(NPC.KAXIU,["炫彩山？感觉好奇怪啊！好像某种声音在指引我一样！我想其中一定有玄机！不管了，先进去看看吧！"],["卡茨！等等啊！卡茨………"],[function():void
                              {
                                 AnimateManager.playMcAnimate(_map.conLevel["kaxiu"],0,"",function():void
                                 {
                                    NpcDialog.show(NPC.SEER,["不好，卡茨一个人进入了神秘领域，看来我还是先回去报告这件事情吧！看看是不是博士他们是否知道真相！"],["我有预感，山中一定会有更多的冒险正等着我们！"],[function():void
                                    {
                                       AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_640_2"),function():void
                                       {
                                          TasksManager.completeFinal(TaskController_641.TASK_ID,function(param1:Boolean):void
                                          {
                                             if(param1)
                                             {
                                                DebugTrace.show("COMPLETE");
                                                removeResource_479();
                                             }
                                          });
                                       });
                                    }]);
                                 });
                              }]);
                           }]);
                        }]);
                     }]);
                  });
               });
            });
         }
      }
      
      private static function createPet() : void
      {
         var _loc1_:PetShowInfo = null;
         if(!_kazi)
         {
            _loc1_ = new PetShowInfo();
            _loc1_.userID = MainManager.actorInfo.userID;
            _loc1_.petID = 5023;
            _kazi = new PetModel(MainManager.actorModel);
            _kazi.show(_loc1_);
            _kazi.mouseEnabled = false;
            _kazi.mouseChildren = false;
         }
      }
      
      private static function createOgre() : void
      {
         var _loc1_:OgreModel = null;
         var _loc2_:int = 0;
         OgreModel.isShow = true;
         while(_loc2_ < 9)
         {
            _loc1_ = new OgreModel(_loc2_);
            _loc1_.mouseChildren = false;
            _loc1_.mouseEnabled = true;
            if(_loc2_ < 1)
            {
               _loc1_.show(5011,new Point(_point.x,_point.y));
            }
            else if(_loc2_ >= 1 && _loc2_ < 4)
            {
               _loc1_.show(756,new Point(_point.x - 60,_point.y + (_loc2_ - 1) * 20));
            }
            else
            {
               _loc1_.show(5006,new Point(_point.x - 120,_point.y + (_loc2_ - 4) * 20));
            }
            _ogre.push(_loc1_);
            _loc2_++;
         }
      }
      
      private static function destroy() : void
      {
         var _loc1_:OgreModel = null;
         _num = 0;
         _ogreNum = 0;
         OgreController.isShow = true;
         ToolBarController.showOrHideAllUser(ToolBarController.panel.panelIsShow);
         AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
         if(Boolean(_kazi))
         {
            _kazi.destroy();
            _kazi = null;
         }
         if(Boolean(_map))
         {
            if(Boolean(_map.depthLevel["kaxiu"]))
            {
               ToolTipManager.remove(_map.depthLevel["kaxiu"]);
               _map.depthLevel["kaxiu"].removeEventListener(MouseEvent.CLICK,onNpcClick);
               _map.depthLevel["kaxiu"].removeEventListener(MouseEvent.CLICK,onNpcClick_0);
            }
         }
         var _loc2_:int = int(_ogre.length);
         var _loc3_:int = 0;
         while(_loc3_ < _loc2_)
         {
            _loc1_ = _ogre[_loc3_] as OgreModel;
            _loc1_.removeEventListener(MouseEvent.CLICK,onOgreClick);
            _loc1_.destroy();
            _loc1_ = null;
            _loc3_++;
         }
         _ogre = [];
         _map = null;
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 32)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 414)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 478)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 479)
         {
            destroy();
         }
         _map = null;
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         _map = param1;
         if(MapManager.currentMap.id == 32)
         {
         }
         if(MapManager.currentMap.id == 414)
         {
         }
         if(MapManager.currentMap.id == 478)
         {
            _map.conLevel["hot_D"].visible = false;
            _map.depthLevel["gaiya"].visible = false;
            _map.depthLevel["leiyi"].visible = false;
            _map.topLevel["arrow_640"].visible = false;
         }
         if(MapManager.currentMap.id == 479)
         {
            removeResource_479();
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 32)
         {
            initTask_32(param1);
         }
         if(MapManager.currentMap.id == 414)
         {
            initTask_414(param1);
         }
         if(MapManager.currentMap.id == 478)
         {
            initTask_478(param1);
         }
         if(MapManager.currentMap.id == 479)
         {
            initTaskForMap479(param1);
         }
      }
   }
}

