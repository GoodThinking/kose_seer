package com.robot.core.dispatcher
{
   import flash.events.*;
   
   public class FightDispatcher
   {
      
      private static var _instance:EventDispatcher;
      
      private static var isSingle:Boolean = false;
      
      public function FightDispatcher()
      {
         super();
      }
      
      public static function dispatchEvent(param1:Event) : void
      {
         getInstance().dispatchEvent(param1);
      }
      
      public static function removeEventListener(param1:String, param2:Function, param3:Boolean = false) : void
      {
         getInstance().removeEventListener(param1,param2,param3);
      }
      
      public static function hasEventListener(param1:String) : Boolean
      {
         return getInstance().hasEventListener(param1);
      }
      
      public static function willTrigger(param1:String) : Boolean
      {
         return getInstance().willTrigger(param1);
      }
      
      private static function getInstance() : EventDispatcher
      {
         if(_instance == null)
         {
            isSingle = true;
            _instance = new EventDispatcher();
         }
         isSingle = false;
         return _instance;
      }
      
      public static function addEventListener(param1:String, param2:Function, param3:Boolean = false, param4:int = 0, param5:Boolean = false) : void
      {
         getInstance().addEventListener(param1,param2,param3,param4,param5);
      }
   }
}

