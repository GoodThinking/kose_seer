package com.robot.groupFight.manager.assetManager
{
   import flash.events.Event;
   
   public class AssetsEvent extends Event
   {
      
      public static const PROGRESS:String = "progress";
      
      public static const LOAD_ALL_ASSETS:String = "loadAllAssets";
      
      private var _percent:Number;
      
      public function AssetsEvent(type:String, percent:Number = 100, bubbles:Boolean = false, cancelable:Boolean = false)
      {
         this._percent = percent;
         super(type,bubbles,cancelable);
      }
      
      public function get percent() : Number
      {
         return this._percent;
      }
   }
}

