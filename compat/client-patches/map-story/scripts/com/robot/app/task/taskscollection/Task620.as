package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.info.pet.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.filters.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task620
   {
      
      private static var _currentMap:BaseMapProcess;
      
      private static var player_mc:MovieClip;
      
      private static var key_mc:MovieClip;
      
      private static var npc_mc:MovieClip;
      
      private static var keyHit_mc:MovieClip;
      
      private static var npcHit_mc:MovieClip;
      
      private static var guideHit_mc:MovieClip;
      
      private static var guide_mc:MovieClip;
      
      private static var road_mc:MovieClip;
      
      private static var excalMark:MovieClip;
      
      private static var _panel:AppModel;
      
      private static var _model:PetModel;
      
      private static const TASK_ID:uint = TaskController_620.TASK_ID;
      
      private static var task_step:uint = 0;
      
      public function Task620()
      {
         super();
      }
      
      public static function initTask(param1:BaseMapProcess) : void
      {
         var sta:uint = 0;
         var map:BaseMapProcess = param1;
         _currentMap = map;
         key_mc = _currentMap.conLevel["key_mc"];
         player_mc = _currentMap.topLevel["player_mc"];
         npc_mc = _currentMap.conLevel["npc_mc"];
         guide_mc = _currentMap.topLevel["guide_mc"];
         guideHit_mc = _currentMap.topLevel["guideHit_mc"];
         keyHit_mc = _currentMap.conLevel["keyHit_mc"];
         npcHit_mc = _currentMap.conLevel["npcHit_mc"];
         road_mc = _currentMap.animatorLevel["road_mc"];
         if(!key_mc || !player_mc || !npc_mc || !guide_mc || !guideHit_mc || !keyHit_mc || !npcHit_mc || !road_mc)
         {
            DebugTrace.show("Task620 init skipped: missing map assets");
            return;
         }
         if(TasksManager.getTaskStatus(619) != TasksManager.COMPLETE)
         {
            delAll(map);
            return;
         }
         key_mc.visible = false;
         guideHit_mc.visible = false;
         guide_mc.visible = false;
         player_mc.visible = false;
         road_mc.visible = false;
         npc_mc.gotoAndStop(1);
         keyHit_mc.mouseChildren = false;
         keyHit_mc.mouseEnabled = false;
         guideHit_mc.buttonMode = true;
         ToolTipManager.add(guideHit_mc,"点击跳入奶油湾");
         guideHit_mc.addEventListener(MouseEvent.CLICK,guideHandler);
         MainManager.actorModel.visible = true;
         if(excalMark == null)
         {
            excalMark = AssetsManager.getMovieClip("lib_excalmatory_mark");
            if(Boolean(excalMark))
            {
               excalMark.mouseEnabled = excalMark.mouseChildren = false;
               excalMark.filters = [new GlowFilter(0,1,2,2)];
               excalMark.y = 5;
               excalMark.x = 15;
            }
         }
         if(Boolean(excalMark))
         {
            npc_mc.addChild(excalMark);
         }
         sta = uint(TasksManager.getTaskStatus(TASK_ID));
         task_step = 0;
         if(sta == TasksManager.UN_ACCEPT)
         {
            task_step = 0;
         }
         else if(sta == TasksManager.COMPLETE)
         {
            task_step = 6;
            destroy();
            delAll(map);
         }
         else if(sta == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  forFirstStep();
               }
               else if(Boolean(param1[0]) && !param1[1])
               {
                  forSecondStep();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  forThirdStep();
               }
            });
         }
      }
      
      public static function delAll(param1:BaseMapProcess) : void
      {
         DisplayUtil.removeForParent(param1.conLevel["key_mc"]);
         param1.conLevel["key_mc"] = null;
         DisplayUtil.removeForParent(param1.topLevel["player_mc"]);
         param1.topLevel["player_mc"] = null;
         DisplayUtil.removeForParent(param1.conLevel["npc_mc"]);
         param1.conLevel["npc_mc"] = null;
         DisplayUtil.removeForParent(param1.topLevel["guide_mc"]);
         param1.topLevel["guide_mc"] = null;
         DisplayUtil.removeForParent(param1.topLevel["guideHit_mc"]);
         param1.topLevel["guideHit_mc"] = null;
         DisplayUtil.removeForParent(param1.conLevel["keyHit_mc"]);
         param1.conLevel["keyHit_mc"] = null;
         DisplayUtil.removeForParent(param1.conLevel["npcHit_mc"]);
         param1.conLevel["npcHit_mc"] = null;
         DisplayUtil.removeForParent(param1.animatorLevel["road_mc"]);
         param1.animatorLevel["road_mc"] = null;
      }
      
      private static function forFirstStep() : void
      {
         key_mc.visible = false;
         keyHit_mc.mouseChildren = false;
         keyHit_mc.mouseEnabled = false;
         guideHit_mc.visible = true;
         guide_mc.visible = true;
         npc_mc.gotoAndStop(1);
         MainManager.actorModel.pos = new Point(555,450);
         task_step = 1;
      }
      
      private static function guideHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         task_step = 2;
         MainManager.actorModel.visible = false;
         player_mc.visible = true;
         guideHit_mc.visible = false;
         guide_mc.visible = false;
         AnimateManager.playMcAnimate(player_mc,1,"mc_1",function():void
         {
            AnimateManager.playMcAnimate(player_mc,2,"mc_2",function():void
            {
               playOverHandler();
            });
         });
      }
      
      private static function playOverHandler() : void
      {
         DebugTrace.show("洗完奶油浴");
         player_mc.visible = false;
         key_mc.visible = keyHit_mc.mouseChildren = keyHit_mc.mouseEnabled = true;
         MainManager.actorModel.pos = new Point(528,295);
         MainManager.actorModel.visible = true;
         task_step = 3;
      }
      
      public static function getKeyHandler() : void
      {
         TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
         {
            if(param1)
            {
               Alarm.show("找到钥匙");
               forSecondStep();
            }
         });
      }
      
      private static function forSecondStep() : void
      {
         key_mc.visible = keyHit_mc.mouseChildren = keyHit_mc.mouseEnabled = false;
         player_mc.visible = false;
         guide_mc.visible = guideHit_mc.visible = false;
         npc_mc.gotoAndStop(1);
         task_step = 4;
      }
      
      private static function useKeyHandler() : void
      {
         if(_panel == null)
         {
            _panel = new AppModel(ClientConfig.getAppModule("Task620PwdPanel"),"正在打开电子锁面板");
            _panel.setup();
            _panel.sharedEvents.addEventListener("success",successHandler);
            _panel.sharedEvents.addEventListener("failed",failedHandler);
         }
         _panel.init([1,7,6,0]);
         _panel.show();
      }
      
      public static function successHandler(param1:Event) : void
      {
         var evt:Event = param1;
         TasksManager.complete(TASK_ID,1,function(param1:Boolean):void
         {
            if(param1)
            {
               forThirdStep();
            }
         });
      }
      
      public static function failedHandler(param1:Event) : void
      {
         var evt:Event = param1;
         DebugTrace.show("解锁失败");
         NpcDialog.show(NPC.KANGKANG,["德拉萨容易健忘，所以一定把锁的密码记在什么地方了！我相信你能找到！"],["开锁"],[function():void
         {
            useKeyHandler();
         }]);
      }
      
      private static function forThirdStep() : void
      {
         DebugTrace.show("解锁成功");
         key_mc.visible = false;
         keyHit_mc.mouseChildren = false;
         keyHit_mc.mouseEnabled = false;
         if(Boolean(excalMark))
         {
            npc_mc.removeChild(excalMark);
            excalMark = null;
         }
         guideHit_mc.visible = false;
         guide_mc.visible = false;
         task_step = 5;
         MainManager.actorModel.pos = new Point(555,450);
         player_mc.visible = false;
         MainManager.actorModel.visible = true;
         AnimateManager.playMcAnimate(npc_mc,2,"mc_2",function():void
         {
            player_mc.visible = true;
            MainManager.actorModel.visible = false;
            AnimateManager.playMcAnimate(player_mc,3,"mc_3",function():void
            {
               var _loc1_:PetShowInfo = null;
               DebugTrace.show("带康康逃离");
               npc_mc.visible = player_mc.visible = false;
               npcHit_mc.mouseChildren = false;
               npcHit_mc.mouseEnabled = false;
               MainManager.actorModel.visible = true;
               if(_model == null)
               {
                  _loc1_ = new PetShowInfo();
                  _loc1_.userID = MainManager.actorInfo.userID;
                  _loc1_.petID = 716;
                  _model = new PetModel(MainManager.actorModel);
                  _model.mouseChildren = _model.mouseEnabled = false;
                  _model.show(_loc1_);
                  _model.addEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHAndler);
               }
               road_mc.visible = true;
               task_step = 6;
            });
         });
      }
      
      private static function onWalkHAndler(param1:RobotEvent) : void
      {
         if(task_step == 6 && Boolean(_model))
         {
            if(Point.distance(new Point(200,450),_model.pos) < 120)
            {
               task_step = 7;
               taskComplete();
            }
         }
      }
      
      private static function taskComplete() : void
      {
         DebugTrace.show("带康康逃离成功");
         NpcDialog.show(NPC.KANGKANG,["真是太感谢你了，重获自由的感觉真好！"],["嗯！我们一定要让大家都能自由自在的生活。"],[function():void
         {
            TasksManager.completeFinal(TASK_ID,function(param1:Boolean):void
            {
               DebugTrace.show("所有步骤完成");
               if(param1)
               {
                  _model.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHAndler);
                  _model.destroy();
                  _model = null;
                  road_mc.visible = false;
               }
            });
         }]);
      }
      
      public static function npcClickHandler() : void
      {
         DebugTrace.show("task_step: ",task_step);
         if(Boolean(excalMark))
         {
            npc_mc.removeChild(excalMark);
            excalMark = null;
         }
         if(task_step == 0)
         {
            if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT)
            {
               NpcDialog.show(NPC.KANGKANG,["救救我！我叫康康，我和伙伴们都被那个该死德拉萨抓到这里做了采矿劳工。"],["德拉萨是谁？"],[function():void
               {
                  NpcDialog.show(NPC.KANGKANG,["德拉萨是怀特星上的怪物，它力大无穷，喜欢研究矿物和泡鲜奶浴， 现在控制着这片区域。"],["我要怎样才能救你出去？"],[function():void
                  {
                     NpcDialog.show(NPC.KANGKANG,["你得先从它那找到开链锁的钥匙。记住！让你全身充满奶油味道，才可以逃过他敏锐的嗅觉。"],["我明白了，马上行动。"],[function():void
                     {
                        TasksManager.accept(TASK_ID,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              forFirstStep();
                           }
                        });
                     }]);
                  }]);
               }]);
            }
         }
         else if(task_step == 1)
         {
            NpcDialog.show(NPC.KANGKANG,["快去洗个奶油浴，然后到德拉萨那里找到开链锁的钥匙！"],["下一步"],[function():void
            {
               forFirstStep();
            }]);
         }
         else if(task_step == 3)
         {
            NpcDialog.show(NPC.KANGKANG,["赶紧到德拉萨的浴缸那里找开链锁的钥匙！"],["下一步"]);
         }
         else if(task_step == 4)
         {
            NpcDialog.show(NPC.KANGKANG,["钥匙找到了？你太厉害了。德拉萨容易健忘，所以一定把锁的密码刻记在什么地方！"],["开锁"],[function():void
            {
               useKeyHandler();
            }]);
         }
         else if(task_step == 5)
         {
            NpcDialog.show(NPC.KANGKANG,["康康：抓紧时间，要是被德拉萨发现我们可就完了！"],["别慌啊！"],[function():void
            {
               useKeyHandler();
            }]);
         }
      }
      
      public static function destroy() : void
      {
         if(Boolean(guideHit_mc))
         {
            guideHit_mc.removeEventListener(MouseEvent.CLICK,guideHandler);
            ToolTipManager.remove(guideHit_mc);
         }
         if(Boolean(excalMark))
         {
            DisplayUtil.removeForParent(excalMark);
            excalMark = null;
         }
         if(Boolean(_panel))
         {
            if(Boolean(_panel.sharedEvents))
            {
               _panel.sharedEvents.removeEventListener("success",successHandler);
               _panel.sharedEvents.removeEventListener("failed",failedHandler);
            }
            _panel.destroy();
            _panel = null;
         }
         if(Boolean(_model))
         {
            _model.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkHAndler);
            _model.destroy();
            _model = null;
         }
         _currentMap = null;
         player_mc = null;
         key_mc = null;
         npc_mc = null;
         keyHit_mc = null;
         npcHit_mc = null;
         guideHit_mc = null;
         guide_mc = null;
         road_mc = null;
      }
   }
}

