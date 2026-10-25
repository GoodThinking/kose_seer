package com.robot.app.mapProcess
{
   import com.robot.app.task.taskscollection.Task819;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.ActorModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.utils.CommonUI;
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import gs.TweenLite;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   // Project-authored shore bridge. Map 515 now belongs to the current client's novice guide.
   public class MapProcess_81951 extends BaseMapProcess
   {
      private var _destroyed:Boolean;
      private var _queryPending:Boolean;
      private var _crossing:Boolean;
      private var _inputLocked:Boolean;
      private var _voyage:TweenLite;
      private var _actor:ActorModel;
      private var _boat:Sprite;
      private var _bulu:Sprite;
      private var _exit:Sprite;
      private var _petURL:String;

      override protected function init() : void
      {
         for each(var layer:Sprite in [conLevel,btnLevel,animatorLevel,topLevel])
         {
            for(var i:int = 0; i < layer.numChildren; i++) layer.getChildAt(i).visible = false;
         }
         _bulu = new Sprite();
         _bulu.name = "shoreBulu";
         _bulu.x = 410;
         _bulu.y = 365;
         _bulu.graphics.beginFill(0xffffff,0.01);
         _bulu.graphics.drawEllipse(-40,-70,80,90);
         _bulu.graphics.endFill();
         _bulu.buttonMode = true;
         _bulu.mouseChildren = false;
         _bulu.addEventListener(MouseEvent.CLICK,onBulu);
         ToolTipManager.add(_bulu,"布鲁：询问仙境与叶舟");
         conLevel.addChild(_bulu);
         _petURL = ClientConfig.getPetSwfPath(108);
         ResourceManager.getResource(_petURL,onBuluLoaded,"pet");

         _boat = new Sprite();
         _boat.name = "leafBoat";
         _boat.x = 700;
         _boat.y = 380;
         _boat.graphics.lineStyle(3,0x334d22);
         _boat.graphics.beginFill(0x7fa844);
         _boat.graphics.moveTo(-65,5);
         _boat.graphics.curveTo(-15,-38,80,-5);
         _boat.graphics.curveTo(35,40,-65,5);
         _boat.graphics.endFill();
         _boat.graphics.lineStyle(2,0xc6dc85);
         _boat.graphics.moveTo(-55,6);
         _boat.graphics.curveTo(15,8,72,-4);
         for(i = 0; i < 4; i++)
         {
            _boat.graphics.moveTo(-30+i*22,7);
            _boat.graphics.lineTo(-24+i*22,-12);
            _boat.graphics.moveTo(-20+i*20,8);
            _boat.graphics.lineTo(-8+i*20,22);
         }
         _boat.buttonMode = true;
         _boat.mouseChildren = false;
         _boat.addEventListener(MouseEvent.CLICK,onBoat);
         ToolTipManager.add(_boat,"叶舟：驶向拉铂尔仙境");
         conLevel.addChild(_boat);
         CommonUI.addYellowArrow(_boat);

         _exit = new Sprite();
         _exit.name = "captainReturn";
         _exit.x = 100;
         _exit.y = 450;
         _exit.graphics.beginFill(0xffffff,0.01);
         _exit.graphics.drawEllipse(-35,-28,70,56);
         _exit.graphics.endFill();
         CommonUI.addYellowArrow(_exit);
         _exit.buttonMode = true;
         _exit.mouseChildren = false;
         _exit.addEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.add(_exit,"返回船长室");
         conLevel.addChild(_exit);
      }

      private function onBuluLoaded(content:DisplayObject) : void
      {
         if(_destroyed) return;
         DisplayUtil.stopAllMovieClip(content);
         var bounds:Rectangle = content.getBounds(content);
         var scale:Number = Math.min(80 / bounds.width,85 / bounds.height);
         content.scaleX = content.scaleY = scale;
         content.x = -(bounds.x + bounds.width / 2) * scale;
         content.y = -bounds.bottom * scale;
         _bulu.addChild(content);
      }

      private function onBulu(event:MouseEvent) : void
      {
         if(_queryPending) return;
         if(TasksManager.getTaskStatus(819) == TasksManager.ALR_ACCEPT)
         {
            _queryPending = true;
            var map:MapProcess_81951 = this;
            TasksManager.getProStatusList(819,function(progress:Array):void
            {
               if(_destroyed) return;
               _queryPending = false;
               if(progress[0] && progress[1] && progress[2] && !progress[3])
                  Task819.initTaskForMap81951(map);
               else showBoatGuide();
            });
            return;
         }
         showBoatGuide();
      }

      private function showBoatGuide() : void
      {
         NpcDialog.show(NPC.BULU,["叶舟连接着岸边和拉铂尔仙境。点击那片大叶子，我就带你过去。想了解珀伽索斯的往事，可以先去船长室查看调查任务。"],["乘坐叶舟","返回船长室","暂时不去"],[function():void
         {
            if(!_destroyed) beginVoyage();
         },function():void
         {
            if(!_destroyed) MapManager.changeMap(4);
         }]);
      }

      private function onBoat(event:MouseEvent) : void
      {
         if(_crossing) return;
         NpcDialog.show(NPC.BULU,["准备好了吗？叶舟会带你前往拉铂尔仙境。"],["出发！","我再准备一下"],[function():void
         {
            if(!_destroyed) beginVoyage();
         }]);
      }

      private function beginVoyage() : void
      {
         if(_destroyed || _crossing) return;
         MainManager.actorModel.moveAndAction(new Point(700,380),onBoard);
      }

      private function onBoard() : void
      {
         if(_destroyed || _crossing) return;
         _crossing = true;
         _actor = MainManager.actorModel;
         _inputLocked = true;
         LevelManager.closeMouseEvent();
         CommonUI.removeYellowArrow(_boat);
         _boat.x = _boat.y = 0;
         _actor.addChildAt(_boat,0);
         _voyage = TweenLite.to(_actor,2.5,{"x":845,"y":330,"onComplete":onArrive});
      }

      private function onArrive() : void
      {
         if(_destroyed) return;
         _voyage = null;
         releaseBoat();
         MapManager.changeMap(693);
      }

      private function releaseBoat() : void
      {
         if(_boat != null && _boat.parent == _actor)
         {
            conLevel.addChild(_boat);
            _boat.x = 700;
            _boat.y = 380;
         }
         _actor = null;
         _crossing = false;
         if(_inputLocked)
         {
            _inputLocked = false;
            LevelManager.openMouseEvent();
         }
      }

      private function onExit(event:MouseEvent) : void
      {
         MapManager.changeMap(4);
      }

      override public function destroy() : void
      {
         _destroyed = true;
         if(_voyage != null)
         {
            _voyage.kill();
            _voyage = null;
         }
         releaseBoat();
         ResourceManager.cancel(_petURL,onBuluLoaded);
         _bulu.removeEventListener(MouseEvent.CLICK,onBulu);
         _boat.removeEventListener(MouseEvent.CLICK,onBoat);
         _exit.removeEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.remove(_bulu);
         ToolTipManager.remove(_boat);
         ToolTipManager.remove(_exit);
      }
   }
}
