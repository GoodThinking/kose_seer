package com.robot.groupFight.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.control.panel.ui.fightPanel.IAutoActionPanel;
   import flash.events.TimerEvent;
   import flash.text.TextField;
   import flash.utils.Timer;
   
   public class TimerManager
   {
      
      private static var txt:TextField;
      
      private static var timer:Timer;
      
      public static var autoAction:IAutoActionPanel;
      
      private static var autoTimer:Timer;
      
      public static const TIME_COUNT:uint = 20;
      
      private static const AUTO_TIMEC_CNT:uint = 12;
      
      private static var timeCount:uint = TIME_COUNT;
      
      public function TimerManager()
      {
         super();
      }
      
      public static function setup(_txt:TextField) : void
      {
         txt = _txt;
         txt.mouseEnabled = false;
         txt.visible = false;
         timer = new Timer(1000,TIME_COUNT);
         timer.addEventListener(TimerEvent.TIMER,onTimerHandler);
         autoTimer = new Timer(AUTO_TIMEC_CNT * 1000,1);
         autoTimer.addEventListener(TimerEvent.TIMER,onAutoTimer);
      }
      
      public static function autoChgPet() : void
      {
         autoTimer.reset();
         autoTimer.start();
      }
      
      private static function onAutoTimer(event:TimerEvent) : void
      {
         autoAction.auto();
      }
      
      public static function start() : void
      {
         timer.stop();
         timer.reset();
         timeCount = TIME_COUNT;
         timer.start();
      }
      
      public static function stop() : void
      {
         timer.reset();
         timer.stop();
         timeCount = TIME_COUNT;
      }
      
      public static function wait() : void
      {
         timer.reset();
         timer.stop();
         txt.text = "等待对方";
         timeCount = TIME_COUNT;
      }
      
      public static function clearTxt() : void
      {
         timeCount = TIME_COUNT;
         timer.reset();
         timer.stop();
         txt.text = "";
      }
      
      public static function eacapeWait() : void
      {
         timeCount = TIME_COUNT;
         timer.stop();
         txt.text = "等待结束战斗";
         clear();
      }
      
      private static function onTimerHandler(event:TimerEvent) : void
      {
         if(timeCount % 5 == 0)
         {
            SocketConnection.send(CommandID.GP_SKILL_WAIT_PERT,timeCount);
         }
         txt.visible = true;
         if(timer.currentCount == TIME_COUNT)
         {
            timeCount = TIME_COUNT;
            autoAction.auto();
            return;
         }
         if(timeCount > 0)
         {
            --timeCount;
         }
         txt.text = timeCount.toString();
      }
      
      public static function clear() : void
      {
         if(Boolean(timer))
         {
            timer.stop();
            timer.removeEventListener(TimerEvent.TIMER,onTimerHandler);
         }
         if(Boolean(autoTimer))
         {
            autoTimer.stop();
            autoTimer.removeEventListener(TimerEvent.TIMER,onAutoTimer);
         }
      }

      public static function destroy() : void
      {
         clear();
         autoAction = null;
         txt = null;
         timer = null;
         autoTimer = null;
      }
   }
}

