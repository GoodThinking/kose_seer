package com.robot.core.group.chat
{
   import flash.utils.IDataInput;
   
   public class GroupChatMsgInfo
   {
      
      private var _userID:uint;
      
      private var _nick:String;
      
      private var _side:uint;
      
      private var _pos:uint;
      
      private var _type:uint;
      
      private var _len:uint;
      
      private var _msg:String;
      
      public function GroupChatMsgInfo(param1:IDataInput = null)
      {
         super();
         this._userID = param1.readUnsignedInt();
         this._nick = param1.readUTFBytes(16);
         this._side = param1.readUnsignedByte();
         this._pos = param1.readUnsignedByte();
         this._type = param1.readUnsignedInt();
         this._len = param1.readUnsignedInt();
         this._msg = param1.readUTFBytes(this._len);
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get nick() : String
      {
         return this._nick;
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get pos() : uint
      {
         return this._pos;
      }
      
      public function get type() : uint
      {
         return this._type;
      }
      
      public function get len() : uint
      {
         return this._len;
      }
      
      public function get msg() : String
      {
         return this._msg;
      }
   }
}

