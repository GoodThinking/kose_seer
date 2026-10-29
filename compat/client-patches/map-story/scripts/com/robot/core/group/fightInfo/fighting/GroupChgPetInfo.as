package com.robot.core.group.fightInfo.fighting
{
   import flash.utils.IDataInput;
   
   public class GroupChgPetInfo
   {
      
      private var _userID:uint;
      
      private var _petID:uint;
      
      private var _catchTime:uint;
      
      private var _level:uint;
      
      private var _hp:uint;
      
      private var _maxHp:uint;
      
      private var _skinId:uint;
      
      public function GroupChgPetInfo(param1:IDataInput = null)
      {
         super();
         this._userID = param1.readUnsignedInt();
         this._petID = param1.readUnsignedInt();
         this._catchTime = param1.readUnsignedInt();
         this._level = param1.readUnsignedInt();
         this._hp = param1.readUnsignedInt();
         this._maxHp = param1.readUnsignedInt();
         this._skinId = param1.readUnsignedInt();
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get petID() : uint
      {
         return this._petID;
      }
      
      public function get catchTime() : uint
      {
         return this._catchTime;
      }
      
      public function get level() : uint
      {
         return this._level;
      }
      
      public function get hp() : uint
      {
         return this._hp;
      }
      
      public function get maxHp() : uint
      {
         return this._maxHp;
      }
      
      public function get skinId() : uint
      {
         return this._skinId;
      }
   }
}

