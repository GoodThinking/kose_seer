package com.robot.app.mapProcess
{
   import com.robot.app.sceneInteraction.MazeController;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.temp.AresiaSpacePrize;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.ItemInBagAlert;
   import com.robot.core.utils.CommonUI;
   import org.taomee.manager.ToolTipManager;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;

   public class MapProcess_309 extends BaseMapProcess
   {
      private static const PRIZE:uint = 2106;
      private var _progress:uint;
      private var _lastPlot:int;
      private var _chest:MovieClip;
      private var _arrow:MovieClip;
      private var _busy:Boolean;
      private var _dead:Boolean;
      private var _timer:uint;

      public function MapProcess_309() { super(); }

      override protected function init() : void
      {
         _progress = 0;
         _lastPlot = -1;
         _busy = false;
         _dead = false;
         MazeController.setup();
         _chest = conLevel["chestsMC"];
         _chest.gotoAndStop(1);
         _chest.mouseChildren = false;
         _chest.mouseEnabled = false;
         conLevel["completeLight"].gotoAndStop(1);
         ToolTipManager.add(conLevel["completeLight"],"沿平台逆时针经过六块踏板，点亮全部灯后开启宝箱；走错方向会重新归位");
         for(var i:uint = 0; i < 6; ++i)
         {
            conLevel["plot_" + i].mouseEnabled = false;
            conLevel["plot_" + i].mouseChildren = false;
         }
         render();
      }

      public function checkWalkPlot(hit:MovieClip) : void
      {
         if(_dead || _progress == 6) return;
         var index:int = int(hit.name.substr(5));
         if(index == _lastPlot) return;
         _lastPlot = index;
         if(index == _progress) ++_progress;
         else _progress = index == 0 ? 1 : 0;
         render();
         if(_progress == 6)
         {
            conLevel["completeLight"].gotoAndPlay(2);
            _chest.addEventListener(Event.ENTER_FRAME,onChestFrame);
            _chest.gotoAndPlay(2);
         }
      }

      private function render() : void
      {
         if(_arrow) CommonUI.removeYellowArrow(_arrow);
         _arrow = null;
         for(var i:uint = 0; i < 6; ++i)
         {
            conLevel["plot_" + i].gotoAndStop(i < _progress ? 2 : 1);
            conLevel["light_" + i].gotoAndStop(i < _progress ? 2 : 1);
         }
         if(_progress < 6)
         {
            _arrow = conLevel["plot_" + _progress];
            var bounds:Rectangle = _arrow.getBounds(_arrow);
            CommonUI.addYellowArrow(_arrow,bounds.x + bounds.width / 2,bounds.y + bounds.height / 2,300);
         }
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
         SocketConnection.addCmdListener(PRIZE,onPrize);
         _timer = setTimeout(onTimeout,5000);
         SocketConnection.send(PRIZE,0);
      }

      private function stopRequest() : void
      {
         if(_timer) clearTimeout(_timer);
         _timer = 0;
         _busy = false;
         SocketConnection.removeCmdListener(PRIZE,onPrize);
      }

      private function onPrize(event:SocketEvent) : void
      {
         stopRequest();
         if(_dead) return;
         var prize:AresiaSpacePrize = event.data as AresiaSpacePrize;
         if(!prize) { onTimeout(); return; }
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
         if(_arrow) CommonUI.removeYellowArrow(_arrow);
         if(_chest)
         {
            _chest.removeEventListener(Event.ENTER_FRAME,onChestFrame);
            _chest.removeEventListener(MouseEvent.CLICK,onChest);
            CommonUI.removeYellowArrow(_chest);
            ToolTipManager.remove(_chest);
         }
         ToolTipManager.remove(conLevel["completeLight"]);
         MazeController.destroy();
      }
   }
}
