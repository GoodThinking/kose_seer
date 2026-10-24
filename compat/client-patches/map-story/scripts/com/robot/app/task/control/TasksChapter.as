package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.ITask;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.*;
   
   public class TasksChapter
   {
      
      public var id:int;
      
      public var name:String;
      
      public var prerequisiteTaskID:uint;
      
      public var tasks:Array = [];
      
      public function TasksChapter()
      {
         super();
      }
      
      public function get currentTask() : ITask
      {
         var _loc1_:ITask = null;
         var _loc2_:ITask = null;
         if(this.prerequisiteTaskID != 0 && TasksManager.getTaskStatus(this.prerequisiteTaskID) != TasksManager.COMPLETE)
         {
            return null;
         }
         for each(_loc2_ in this.tasks)
         {
            if(TasksManager.getTaskStatus(_loc2_.id) != TasksManager.COMPLETE)
            {
               if(_loc1_ == null || _loc2_.priority < _loc1_.priority)
               {
                  _loc1_ = _loc2_;
               }
            }
         }
         return _loc1_;
      }
      
      public function process() : void
      {
         var _loc1_:ITask = null;
         var _loc2_:ITask = this.currentTask;
         for each(_loc1_ in this.tasks)
         {
            if(_loc1_ != _loc2_)
            {
               _loc1_.hideInMap(MapProcessConfig.currentProcessInstance);
            }
            else
            {
               _loc2_.initForMap(MapProcessConfig.currentProcessInstance);
            }
         }
      }
   }
}

