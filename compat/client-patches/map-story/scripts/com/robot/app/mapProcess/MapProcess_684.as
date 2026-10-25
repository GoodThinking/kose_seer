package com.robot.app.mapProcess
{
   import com.robot.app.spt.FightBossController;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task788;
   import com.robot.app.task.taskscollection.Task796;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.ActorModel;
   import com.robot.core.npc.*;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import gs.TweenLite;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   public class MapProcess_684 extends BaseMapProcess
   {
      private var _destroyed:Boolean;
      private var _crossing:Boolean;
      private var _inputLocked:Boolean;
      private var _voyage:TweenLite;
      private var _returnVoyage:TweenLite;
      private var _actor:ActorModel;
      private var _boat:MovieClip;
      private var _outward:Boolean;
      private var _boatX:Number;
      private var _boatY:Number;

      override protected function init() : void
      {
         animatorLevel["task_778_2"].visible = false;
         animatorLevel["task_811_4"].visible = false;
         conLevel["task_796_1"].visible = false;
         conLevel["eggTig"].visible = false;
         conLevel["raftTig788"].visible = false;
         conLevel["bubble"].visible = false;
         ToolTipManager.add(conLevel["raftTig"],"小木舟：靠近岸边后点击登船");
         ToolTipManager.add(conLevel["raftTig1"],"小木舟：靠近岸边后点击返航");
         ToolTipManager.add(conLevel["bridge"],"会伸展的枯枝：点击架起通路");
         ToolTipManager.add(conLevel["sptBoss"],"皮特萨罗的精灵蛋：点击唤醒并挑战");
         ToolTipManager.add(conLevel["door_1"],"冰封洞窟：先乘小木舟到上层河岸，再点击洞口");
         conLevel["vortex"].buttonMode = true;
         conLevel["vortex"].addEventListener(MouseEvent.CLICK,onVortexClick);
         conLevel["bridge"].buttonMode = true;
         conLevel["bridge"].addEventListener(MouseEvent.CLICK,onBridgeClick);
         conLevel["sptBoss"].buttonMode = true;
         conLevel["sptBoss"].addEventListener(MouseEvent.CLICK,onBossClick);
         enableRaft(MapManager.prevMapID != 685);
         var map:MapProcess_684 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task788.initTaskForMap684(map);
            Task796.initTaskForMap684(map);
         },this);
      }

      private function onVortexClick(event:MouseEvent) : void
      {
         MapManager.changeMap(687);
      }

      private function onBossClick(event:MouseEvent) : void
      {
         conLevel["bubble"].visible = false;
         AnimateManager.playMcAnimate(conLevel["sptBoss"],2,"flyMC",function():void
         {
            if(_destroyed) return;
            NpcDialog.show(NPC.PITESALUO,["你是谁家的孩子，这么没有教养！你不知道别人的东西不能乱碰吗？你最好离开这里否则我就对你不客气了！"],["我是来挑战你的！"],[function():void
            {
               if(_destroyed) return;
               FightBossController.fightBoss("皮特萨罗");
            }]);
         });
      }

      private function enableRaft(outward:Boolean) : void
      {
         if(_destroyed) return;
         conLevel["raftTig"].removeEventListener(MouseEvent.CLICK,onRaftClick);
         conLevel["raftTig1"].removeEventListener(MouseEvent.CLICK,onRaft2Click);
         conLevel["raftTig"].buttonMode = outward;
         conLevel["raftTig1"].buttonMode = !outward;
         if(outward) conLevel["raftTig"].addEventListener(MouseEvent.CLICK,onRaftClick);
         else conLevel["raftTig1"].addEventListener(MouseEvent.CLICK,onRaft2Click);
      }

      private function onRaftClick(event:MouseEvent) : void
      {
         startRaft(true);
      }

      private function onRaft2Click(event:MouseEvent) : void
      {
         startRaft(false);
      }

      private function startRaft(outward:Boolean) : void
      {
         if(_destroyed || _crossing) return;
         _outward = outward;
         MainManager.actorModel.moveAndAction(outward ? new Point(700,350) : new Point(750,220),onBoard);
      }

      private function onBoard() : void
      {
         if(_destroyed || _crossing) return;
         _crossing = true;
         conLevel["raftTig"].removeEventListener(MouseEvent.CLICK,onRaftClick);
         conLevel["raftTig1"].removeEventListener(MouseEvent.CLICK,onRaft2Click);
         _boat = conLevel[_outward ? "raft_1" : "raft_2"];
         _boatX = _boat.x;
         _boatY = _boat.y;
         _actor = MainManager.actorModel;
         _inputLocked = true;
         LevelManager.closeMouseEvent();
         _boat.x = 0;
         _boat.y = 0;
         _actor.addChildAt(_boat,0);
         _voyage = TweenLite.to(_actor,3,{
            "x":_outward ? 800 : 600,
            "y":_outward ? 250 : 300,
            "onComplete":onArrive
         });
      }

      private function onArrive() : void
      {
         if(_destroyed) return;
         _voyage = null;
         conLevel.addChildAt(_boat,0);
         _boat.x = _outward ? 800 : 600;
         _boat.y = _outward ? 250 : 300;
         _inputLocked = false;
         LevelManager.openMouseEvent();
         _returnVoyage = TweenLite.to(_boat,3,{
            "x":_outward ? 689 : 714,
            "y":_outward ? 357 : 259,
            "onComplete":onBoatReturned
         });
      }

      private function onBoatReturned() : void
      {
         if(_destroyed) return;
         _returnVoyage = null;
         _crossing = false;
         _actor = null;
         _boat = null;
         enableRaft(!_outward);
      }

      private function onBridgeClick(event:MouseEvent) : void
      {
         conLevel["bridge"].buttonMode = false;
         conLevel["bridge"].removeEventListener(MouseEvent.CLICK,onBridgeClick);
         AnimateManager.playMcAnimate(conLevel["bridge"],0,"",function():void
         {
            if(_destroyed) return;
            DisplayUtil.removeForParent(typeLevel["barrier"]);
            MapManager.currentMap.makeMapArray();
            ToolTipManager.remove(conLevel["bridge"]);
            if(TasksManager.getTaskStatus(796) == TasksManager.ALR_ACCEPT)
            {
               TasksManager.getProStatusList(796,function(progress:Array):void
               {
                  if(_destroyed) return;
                  if(progress[0] && !progress[1]) Task796.onBridge();
               });
            }
            else if(TasksManager.getTaskStatus(788) == TasksManager.ALR_ACCEPT)
            {
               TasksManager.getProStatusList(788,function(progress:Array):void
               {
                  if(_destroyed) return;
                  if(progress[0] && !progress[1]) Task788.onBridge();
               });
            }
         });
      }

      override public function destroy() : void
      {
         _destroyed = true;
         Task788.destroy(this);
         Task796.destroy(this);
         conLevel["vortex"].removeEventListener(MouseEvent.CLICK,onVortexClick);
         conLevel["raftTig"].removeEventListener(MouseEvent.CLICK,onRaftClick);
         conLevel["raftTig1"].removeEventListener(MouseEvent.CLICK,onRaft2Click);
         conLevel["bridge"].removeEventListener(MouseEvent.CLICK,onBridgeClick);
         conLevel["sptBoss"].removeEventListener(MouseEvent.CLICK,onBossClick);
         ToolTipManager.remove(conLevel["raftTig"]);
         ToolTipManager.remove(conLevel["raftTig1"]);
         ToolTipManager.remove(conLevel["bridge"]);
         ToolTipManager.remove(conLevel["sptBoss"]);
         ToolTipManager.remove(conLevel["door_1"]);
         if(_voyage != null) TweenLite.removeTween(_voyage);
         if(_returnVoyage != null) TweenLite.removeTween(_returnVoyage);
         if(_boat != null && _boat.parent == _actor)
         {
            conLevel.addChildAt(_boat,0);
            _boat.x = _boatX;
            _boat.y = _boatY;
         }
         if(_inputLocked) LevelManager.openMouseEvent();
         _voyage = null;
         _returnVoyage = null;
         _boat = null;
         _actor = null;
      }
   }
}
