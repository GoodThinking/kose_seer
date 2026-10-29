package com.robot.core.group.fightInfo.readyToFight
{
   import flash.utils.IDataInput;
   
   public class ReadyToFightGroupInfo
   {
      
      private var _invitorID:uint = 1;
      
      private var _leaderID:uint;
      
      private var _groupMembCnt:uint;
      
      private var _groupList:Array = [];
      
      public function ReadyToFightGroupInfo(param1:IDataInput = null)
      {
         super();
         this._invitorID = param1.readUnsignedByte();
         this._leaderID = param1.readUnsignedInt();
         this._groupMembCnt = param1.readUnsignedByte();
         var _loc2_:uint = 0;
         while(_loc2_ < this._groupMembCnt)
         {
            this._groupList.push(new GroupReadyToFtUserInfo(param1));
            _loc2_++;
         }
      }
      
      public function get invitorID() : uint
      {
         return this._invitorID;
      }
      
      public function get leaderID() : uint
      {
         return this._leaderID;
      }
      
      public function get groupMembCnt() : uint
      {
         return this._groupMembCnt;
      }
      
      public function get groupList() : Array
      {
         return this._groupList;
      }
   }
}

