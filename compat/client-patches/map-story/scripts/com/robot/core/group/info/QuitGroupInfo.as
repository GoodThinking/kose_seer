package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class QuitGroupInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _userID:uint;
      
      private var _userNick:String;
      
      private var _leaderID:uint;
      
      private var _leaderNick:String;
      
      public function QuitGroupInfo(param1:IDataInput = null)
      {
         super();
         this._groupIDInfo = new GroupIDInfo(param1);
         this._userID = param1.readUnsignedInt();
         this._userNick = param1.readUTFBytes(16);
         this._leaderID = param1.readUnsignedInt();
         this._leaderNick = param1.readUTFBytes(16);
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
   }
}

