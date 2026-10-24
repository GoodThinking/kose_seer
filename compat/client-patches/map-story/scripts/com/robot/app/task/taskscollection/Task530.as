package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task530
   {
      
      private static var _map:BaseMapProcess;
      
      public function Task530()
      {
         super();
      }
      
      public static function initTask_1() : void
      {
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_530_1"),function():void
         {
            NpcDialog.show(NPC.IRIS,["我翻阅了所有的航行档案，最有可能的就是活力著称的拓梯星，你可以去那里看看哦！"],["太神奇了！我相信我一定能够找到活力之匙！出发！"],[function():void
            {
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_530_2"),function():void
               {
                  MapManager.changeMap(429);
               });
            }]);
         });
      }
      
      public static function initTask_2(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         if(TasksManager.getTaskStatus(TaskController_530.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_530.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  _map.conLevel["pet"].visible = true;
                  _map.conLevel["arrow"].visible = true;
                  startPro_0();
               }
               else
               {
                  DisplayUtil.removeForParent(_map.conLevel["pet"]);
                  _map.conLevel["pet"] = null;
                  DisplayUtil.removeForParent(_map.conLevel["arrow"]);
                  _map.conLevel["arrow"] = null;
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_map.conLevel["pet"]);
            _map.conLevel["pet"] = null;
            DisplayUtil.removeForParent(_map.conLevel["arrow"]);
            _map.conLevel["arrow"] = null;
         }
      }
      
      private static function startPro_0() : void
      {
         _map.conLevel["arrow"].visible = false;
         _map.conLevel["door_0"].visible = false;
         ToolBarController.showOrHideAllUser(false);
         NpcDialog.show(NPC.PET_SMALL,["嘻嘻！拓梯星又来新游客咯！又是一个来找钥匙的吗？"],null,null,false,function():void
         {
            NpcDialog.show(NPC.PET_SMALL,["哎呀！我都和你们说在活力源泉了！我可不管你咯，我要开始我的星球之旅咯！"],["谁……是谁在那里说话啊？是精灵！"],[function():void
            {
               AnimateManager.playMcAnimate(_map.conLevel["pet"],0,"",function():void
               {
                  NpcDialog.show(NPC.SEER,["慢着！它刚才说又是来找钥匙的？难道海盗已经捷足先登了？不行！快朝活力源泉方向去看看！"],["快前往活力源泉！"],[function():void
                  {
                     TasksManager.complete(TaskController_530.TASK_ID,0,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           _map.conLevel["arrow"].visible = true;
                           _map.conLevel["door_0"].visible = true;
                        }
                     });
                  }]);
               });
            }]);
         });
      }
      
      public static function initTask_3(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         if(TasksManager.getTaskStatus(TaskController_530.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_530.TASK_ID,function(param1:Array):void
            {
               var array:Array = param1;
               if(Boolean(array[0]) && !array[1])
               {
                  _map.conLevel["box"].buttonMode = true;
                  ToolTipManager.add(_map.conLevel["box"],"宝盒");
                  ToolBarController.showOrHideAllUser(false);
                  NpcDialog.show(NPC.SEER,["咦？石头上面怎么有个宝箱？难道是我要找的钥匙？我一定要想办法走上去！"],null,null,false,function():void
                  {
                     if(MainManager.actorInfo.superNono)
                     {
                        NpcDialog.show(NPC.SUPERNONO,["报告！报告！主人你有没有发现，左上角这个石头似乎可以击碎哦！"],["还好有你提醒呢！"],[function():void
                        {
                           CommonUI.addYellowArrow(_map.topLevel,187,141,135);
                        }]);
                     }
                     else
                     {
                        NpcDialog.show(NPC.NONO,["左上角这块石头看起来似乎和其它的不一样，难道暗藏玄机？"],["看我不把你击碎了！"],[function():void
                        {
                           CommonUI.addYellowArrow(_map.topLevel,187,141,135);
                        }]);
                     }
                     ToolTipManager.remove(_map.conLevel["stone"]);
                     ToolTipManager.add(_map.conLevel["stone"],"快用头部射击击碎浮石");
                  });
               }
               else
               {
                  _map.conLevel["box"].visible = false;
                  DisplayUtil.removeForParent(_map.conLevel["haidao"]);
                  _map.conLevel["haidao"] = null;
               }
            });
         }
         else
         {
            _map.conLevel["box"].visible = false;
            DisplayUtil.removeForParent(_map.conLevel["haidao"]);
            _map.conLevel["haidao"] = null;
         }
      }
      
      public static function startPro_1() : void
      {
         _map.conLevel["box"].visible = false;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_530_3"),function():void
         {
            NpcDialog.show(NPC.SEER,["怎么了？活力之匙怎么失去了耀眼的光彩？难道是我找错了？"],null,null,false,function():void
            {
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_530_4"),function():void
               {
                  AnimateManager.playMcAnimate(_map.conLevel["haidao"],0,"",function():void
                  {
                     NpcDialog.show(NPC.SEER,["失去光彩的活力之匙和那个传言中的死亡星球！这到底是怎么一回事？算了！还是先去问问爱丽丝吧！"],["快回资料室！"],[function():void
                     {
                        TasksManager.complete(TaskController_530.TASK_ID,1,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              MapManager.changeMap(9);
                           }
                        });
                     }]);
                  });
               });
            });
         });
      }
      
      public static function destory() : void
      {
         ToolBarController.showOrHideAllUser(true);
      }
   }
}
