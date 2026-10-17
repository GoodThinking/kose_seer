package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import com.robot.core.CommandID;
   import com.robot.core.net.SocketConnection;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.text.TextField;
   import flash.utils.Timer;
   
   public class MapProcess_13 extends BaseMapProcess
   {
      
      private var _plMc:MovieClip;
      private var _miningTimer:Timer;
      private var _miningText:TextField;
      private var _waiting:Boolean = false;
      private var _hits:uint = 0;
      
      public function MapProcess_13()
      {
         super();
      }
      
      override protected function init() : void
      {
         this._plMc = conLevel["plMc"];
         this._plMc.mouseChildren = false;
         this._plMc.mouseEnabled = false;
         var _loc1_:int = 1;
         while(_loc1_ < 7)
         {
            this.conLevel["g" + _loc1_ + "Mc"].gotoAndStop(1);
            this.conLevel["g" + _loc1_ + "Mc"].buttonMode = true;
            this.conLevel["g" + _loc1_ + "Mc"].addEventListener(MouseEvent.CLICK,this.onMine);
            ToolTipManager.add(this.conLevel["g" + _loc1_ + "Mc"],"连续点击5秒，采集克洛斯金刚石");
            _loc1_++;
         }
         this._miningText = new TextField();
         this._miningText.width = 450;
         this._miningText.height = 30;
         this._miningText.x = 250;
         this._miningText.y = 70;
         this._miningText.mouseEnabled = false;
         topLevel.addChild(this._miningText);
      }

      private function onMine(event:MouseEvent) : void
      {
         if(this._miningTimer != null)
         {
            ++this._hits;
            this._miningText.text = "继续点击矿石！已点击 " + this._hits + " 次";
            return;
         }
         if(this._waiting) return;
         this._waiting = true;
         SocketConnection.addCmdListener(CommandID.JOIN_GAME,this.onMiningJoined);
         SocketConnection.send(CommandID.JOIN_GAME,1);
      }

      private function onMiningJoined(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onMiningJoined);
         this._waiting = false;
         this._hits = 1;
         this._miningText.text = "连续点击矿石，5秒后结算克洛斯金刚石";
         this._miningTimer = new Timer(5000,1);
         this._miningTimer.addEventListener(TimerEvent.TIMER_COMPLETE,this.onMiningFinished);
         this._miningTimer.start();
      }

      private function onMiningFinished(event:TimerEvent) : void
      {
         this._miningTimer.removeEventListener(TimerEvent.TIMER_COMPLETE,this.onMiningFinished);
         this._miningTimer = null;
         this._miningText.text = "";
         SocketConnection.send(CommandID.GAME_OVER,Math.min(100,this._hits),this._hits);
      }
      
      override public function destroy() : void
      {
         SocketConnection.removeCmdListener(CommandID.JOIN_GAME,this.onMiningJoined);
         if(this._waiting || this._miningTimer != null)
         {
            SocketConnection.send(CommandID.GAME_OVER,0,0);
         }
         if(this._miningTimer != null)
         {
            this._miningTimer.stop();
            this._miningTimer.removeEventListener(TimerEvent.TIMER_COMPLETE,this.onMiningFinished);
            this._miningTimer = null;
         }
         for(var i:int = 1; i < 7; ++i)
         {
            this.conLevel["g" + i + "Mc"].removeEventListener(MouseEvent.CLICK,this.onMine);
            ToolTipManager.remove(this.conLevel["g" + i + "Mc"]);
         }
         topLevel.removeChild(this._miningText);
         this._miningText = null;
         this._plMc = null;
      }
   }
}

