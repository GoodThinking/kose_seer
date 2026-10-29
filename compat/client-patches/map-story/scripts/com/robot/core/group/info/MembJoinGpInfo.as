package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class MembJoinGpInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _userID:uint;
      
      private var _userNick:String;
      
      private var _leaderID:uint;
      
      private var _leaderNick:String;
      
      private var _membList:Array;
      
      public function MembJoinGpInfo(param1:IDataInput = null)
      {
         var _loc3_:uint = 0;
         super();
         this._groupIDInfo = new GroupIDInfo(param1);
         this._userID = param1.readUnsignedInt();
         this._userNick = param1.readUTFBytes(16);
         this._leaderID = param1.readUnsignedInt();
         this._leaderNick = param1.readUTFBytes(16);
         this._membList = [];
         var _loc2_:uint = 0;
         while(_loc2_ < 5)
         {
            _loc3_ = param1.readUnsignedInt();
            if(_loc3_ != 0)
            {
               this._membList.push(_loc3_);
            }
            _loc2_++;
         }
      }
      
      public function get groupIDInfo() : GroupIDInfo
      {
         return this._groupIDInfo;
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get userNick() : String
      {
         return this._userNick;
      }
      
      public function set userNick(param1:String) : void
      {
         this._userNick = param1;
      }
      
      public function get leaderID() : uint
      {
         return this._leaderID;
      }
      
      public function get leaderNick() : String
      {
         return this._leaderNick;
      }
      
      public function get membList() : Array
      {
         return this._membList;
      }
   }
}

