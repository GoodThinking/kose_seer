package com.robot.app.mapProcess
{
   import com.robot.app.sceneInteraction.MazeController;
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.temp.AresiaSpacePrize;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.ItemInBagAlert;
   import com.robot.core.utils.CommonUI;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_304 extends BaseMapProcess
   {
      private var _left:MovieClip;
      private var _right:MovieClip;
      private var _chest:MovieClip;
      private var _direction:uint;
      private var _ready:Boolean;
      private var _busy:Boolean;
      private var _dead:Boolean;
      private var _timer:uint;

      public function MapProcess_304() { super(); }

      override protected function init() : void
      {
         _dead = false;
         _ready = false;
         _busy = false;
         MazeController.setup();
         var arrow:MovieClip = conLevel["arrowheadMC"];
         arrow.gotoAndStop(Math.floor(Math.random() * 5));
         // SWF frames start at one; the displayed arrow, not a possible random zero, defines the solution.
         _direction = arrow.currentFrame;
         _left = conLevel["btn_0"];
         _right = conLevel["btn_1"];
         _left.gotoAndStop(Math.floor(Math.random() * 5));
         _right.gotoAndStop(Math.floor(Math.random() * 5));
         for each(var knob:MovieClip in [_left,_right])
         {
            knob.buttonMode = true;
            knob.mouseChildren = false;
            knob.addEventListener(MouseEvent.CLICK,onKnob);
            ToolTipManager.add(knob,"点击旋转螺丝，让两侧螺丝的方向与中央箭头一致");
         }
         _chest = conLevel["chestsMC"];
         _chest.gotoAndStop(1);
         _chest.mouseChildren = false;
         _chest.mouseEnabled = false;
         checkAligned();
      }

      private function onKnob(event:MouseEvent) : void
      {
         if(_dead || _ready) return;
         var knob:MovieClip = event.currentTarget as MovieClip;
         knob.gotoAndStop(knob.currentFrame == knob.totalFrames ? 1 : knob.currentFrame + 1);
         checkAligned();
      }

      private function checkAligned() : void
      {
         if(_ready || _left.currentFrame != _direction || _right.currentFrame != _direction) return;
         _ready = true;
         _left.mouseEnabled = false;
         _right.mouseEnabled = false;
         _chest.addEventListener(Event.ENTER_FRAME,onChestFrame);
         _chest.gotoAndPlay(2);
      }

      private function onChestFrame(event:Event) : void
      {
         if(_dead || _chest.currentFrame != _chest.totalFrames) return;
         _chest.removeEventListener(Event.ENTER_FRAME,onChestFrame);
         _chest.mouseEnabled = true;
         _chest.buttonMode = true;
         _chest.addEventListener(MouseEvent.CLICK,onChest);
         ToolTipManager.add(_chest,"机关已解开：点击领取本房间的一次性胶囊补给");
         CommonUI.addYellowArrow(_chest,0,0,300);
      }

      private function onChest(event:MouseEvent) : void
      {
         if(_dead || _busy) return;
         _busy = true;
         SocketConnection.addCmdListener(CommandID.PRIZE_OF_ATRESIASPACE,onPrize);
         _timer = setTimeout(onTimeout,5000);
         SocketConnection.send(CommandID.PRIZE_OF_ATRESIASPACE,1);
      }

      private function stopRequest() : void
      {
         if(_timer) clearTimeout(_timer);
         _timer = 0;
         _busy = false;
         SocketConnection.removeCmdListener(CommandID.PRIZE_OF_ATRESIASPACE,onPrize);
      }

      private function onPrize(event:SocketEvent) : void
      {
         if(_dead || !_busy) return;
         var prize:AresiaSpacePrize = event.data as AresiaSpacePrize;
         if(!prize) { onTimeout(); return; }
         stopRequest();
         _chest.removeEventListener(MouseEvent.CLICK,onChest);
         _chest.mouseEnabled = false;
         _chest.buttonMode = false;
         _chest.visible = false;
         CommonUI.removeYellowArrow(_chest);
         ToolTipManager.remove(_chest);
         for each(var item:Object in prize.monBallList)
         {
            if(item.itemCnt > 0) ItemInBagAlert.show(item.itemID,item.itemCnt + "个<font color='#FF0000'>" + ItemXMLInfo.getName(item.itemID) + "</font>已经放入储存箱。");
         }
      }

      private function onTimeout() : void
      {
         stopRequest();
         if(!_dead) Alarm.show("宝箱回应尚未完成。可以重新点击宝箱读取结果；已保存的补给不会重复发放。");
      }

      override public function destroy() : void
      {
         _dead = true;
         stopRequest();
         for each(var knob:MovieClip in [_left,_right])
         {
            if(!knob) continue;
            knob.removeEventListener(MouseEvent.CLICK,onKnob);
            ToolTipManager.remove(knob);
         }
         if(_chest)
         {
            _chest.removeEventListener(Event.ENTER_FRAME,onChestFrame);
            _chest.removeEventListener(MouseEvent.CLICK,onChest);
            CommonUI.removeYellowArrow(_chest);
            ToolTipManager.remove(_chest);
         }
         MazeController.destroy();
      }
   }
}
