package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class AnswerJoinGpInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _leaderID:uint;
      
      private var _groupName:String;
      
      private var _membList:Array = [];
      
      public function AnswerJoinGpInfo(param1:IDataInput = null)
      {
         var _loc4_:uint = 0;
         super();
         this._groupIDInfo = new GroupIDInfo(param1);
         this._groupName = param1.readUTFBytes(16);
         this._leaderID = param1.readUnsignedInt();
         var _loc2_:uint = param1.readUnsignedByte();
         var _loc3_:uint = 0;
         while(_loc3_ < _loc2_)
         {
            _loc4_ = param1.readUnsignedInt();
            this._membList.push(_loc4_);
            _loc3_++;
         }
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
      
      public function get membList() : Array
      {
         return this._membList;
      }
   }
}

