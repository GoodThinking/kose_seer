package com.robot.app.task.taskscollection
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class ITask
   {
      
      public var id:int;
      
      public var priority:int;
      
      public function ITask()
      {
         super();
      }
      
      public function initForMap(param1:BaseMapProcess) : void
      {
         throw new Error("need override");
      }
      
      public function destoryForMap() : void
      {
         throw new Error("need override");
      }
      
      public function hideInMap(param1:BaseMapProcess) : void
      {
         throw new Error("need override");
      }
   }
}

