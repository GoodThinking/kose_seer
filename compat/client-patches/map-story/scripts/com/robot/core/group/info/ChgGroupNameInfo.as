package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class ChgGroupNameInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _leaderID:uint;
      
      private var _groupName:String;
      
      public function ChgGroupNameInfo(param1:IDataInput = null)
      {
         super();
         this._groupIDInfo = new GroupIDInfo(param1);
         this._leaderID = param1.readUnsignedInt();
         this._groupName = param1.readUTFBytes(16);
      }
      
      public function get groupIDInfo() : GroupIDInfo
      {
         return this._groupIDInfo;
      }
      
      public function get leaderID() : uint
      {
         return this._leaderID;
      }
      
      public function get groupName() : String
      {
         return this._groupName;
      }
   }
}

