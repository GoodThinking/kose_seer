package com.robot.core.group.fightInfo.fighting.item
{
   import flash.utils.IDataInput;
   
   public class GroupUseItemInfo
   {
      
      private var _userID:uint;
      
      private var _side:uint;
      
      private var _pos:uint;
      
      private var _itemID:uint;
      
      private var _monHp:uint;
      
      private var _chgHp:uint;
      
      public function GroupUseItemInfo(param1:IDataInput = null)
      {
         super();
         this._userID = param1.readUnsignedInt();
         this._side = param1.readUnsignedByte();
         this._pos = param1.readUnsignedByte();
         this._itemID = param1.readUnsignedInt();
         this._monHp = param1.readUnsignedInt();
         this._chgHp = param1.readUnsignedInt();
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get pos() : uint
      {
         return this._pos;
      }
      
      public function get itemID() : uint
      {
         return this._itemID;
      }
      
      public function get monHp() : uint
      {
         return this._monHp;
      }
      
      public function get chgHp() : uint
      {
         return this._chgHp;
      }
   }
}

