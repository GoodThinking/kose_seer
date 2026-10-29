package com.robot.core.group.fightInfo.readyToFight
{
   import flash.utils.IDataInput;
   
   public class GroupReadyToFtUserInfo
   {
      
      private var _userID:uint;
      
      private var _nick:String;
      
      private var _monCnt:uint;
      
      private var _monList:Array = [];
      
      public function GroupReadyToFtUserInfo(param1:IDataInput = null)
      {
         super();
         this._userID = param1.readUnsignedInt();
         this._nick = param1.readUTFBytes(16);
         this._monCnt = param1.readUnsignedInt();
         var _loc2_:uint = 0;
         while(_loc2_ < this._monCnt)
         {
            this._monList.push(new GroupReadyToFtPetInfo(param1));
            _loc2_++;
         }
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get nick() : String
      {
         return this._nick;
      }
      
      public function get monCnt() : uint
      {
         return this._monCnt;
      }
      
      public function get monList() : Array
      {
         return this._monList;
      }
   }
}

