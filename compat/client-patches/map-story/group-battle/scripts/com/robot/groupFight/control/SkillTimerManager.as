package com.robot.groupFight.control
{
   import com.robot.core.group.event.GroupFightEvent;
   import flash.events.TimerEvent;
   import flash.utils.Timer;
   import org.taomee.manager.EventManager;
   
   public class SkillTimerManager
   {
      
      private static var timer:Timer;
      
      init();
      
      public function SkillTimerManager()
      {
         super();
      }
      
      private static function init() : void
      {
         timer = new Timer(30000,1);
      }
      
      public static function startTimer() : void
      {
         timer.reset();
         timer.addEventListener(TimerEvent.TIMER_COMPLETE,onTimeUp);
         timer.start();
      }
      
      public static function stopTimer() : void
      {
         timer.stop();
         timer.removeEventListener(TimerEvent.TIMER_COMPLETE,onTimeUp);
      }
      
      private static function onTimeUp(evt:TimerEvent) : void
      {
         timer.stop();
         timer.removeEventListener(TimerEvent.TIMER_COMPLETE,onTimeUp);
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.LOAD_ASSETS_TIME_OUT));
      }
   }
}

