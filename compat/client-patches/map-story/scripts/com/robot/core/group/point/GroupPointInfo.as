package com.robot.core.group.point
{
   import flash.utils.IDataInput;
   
   public class GroupPointInfo
   {
      
      private var _userID:uint;
      
      private var _nick:String;
      
      private var _sctID:uint;
      
      private var _pointID:uint;
      
      public function GroupPointInfo(param1:IDataInput = null)
      {
         super();
         this._userID = param1.readUnsignedInt();
         this._nick = param1.readUTFBytes(16);
         this._sctID = param1.readUnsignedByte();
         this._pointID = param1.readUnsignedByte();
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get nick() : String
      {
         return this._nick;
      }
      
      public function get sctID() : uint
      {
         return this._sctID;
      }
      
      public function get pointID() : uint
      {
         return this._pointID;
      }
   }
}

