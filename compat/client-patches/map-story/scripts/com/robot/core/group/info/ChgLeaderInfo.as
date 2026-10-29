package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class ChgLeaderInfo
   {
      
      public var groupIDInfo:GroupIDInfo;
      
      public var oldLeaderID:uint;
      
      public var leaderID:uint;
      
      public var leaderNick:String;
      
      public function ChgLeaderInfo(param1:IDataInput = null)
      {
         super();
      }
   }
}

