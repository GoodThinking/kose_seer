package com.robot.core.group.fightInfo.startFight
{
   import com.robot.core.config.xml.PetXMLInfo;
   import flash.geom.Point;
   import flash.utils.IDataInput;
   import org.taomee.debug.DebugTrace;
   
   public class GroupFightPetInfo
   {
      
      private var _side:uint = 1;
      
      private var _pos:uint = 0;
      
      private var _userID:uint;
      
      private var _errorType:uint;
      
      private var _petID:uint;
      
      private var _catchTime:uint;
      
      private var _hp:uint;
      
      private var _maxHP:uint;
      
      private var _lv:uint;
      
      private var _catchType:uint;
      
      private var _isShowFtHp:Boolean = false;
      
      public var point:Point;
      
      public var index:uint;
      
      public var isMember:Boolean = false;
      
      public function GroupFightPetInfo(param1:IDataInput = null)
      {
         super();
         this._side = param1.readUnsignedByte();
         this._pos = param1.readUnsignedByte();
         this._userID = param1.readUnsignedInt();
         this._errorType = param1.readUnsignedByte();
         this._petID = param1.readUnsignedInt();
         this._catchTime = param1.readUnsignedInt();
         this._hp = param1.readUnsignedInt();
         this._maxHP = param1.readUnsignedInt();
         this._lv = param1.readUnsignedInt();
         this._catchType = param1.readUnsignedInt();
         this._isShowFtHp = Boolean(param1.readUnsignedInt());
         if(this._hp > this._maxHP)
         {
            this._maxHP = this._hp;
         }
         DebugTrace.show("\r\rfigher：",this._userID,"pet：",this._petID,"name:",PetXMLInfo.getName(this._petID),"catchTime:",this._catchTime,"catchType",this._catchType,"\r\r");
      }
      
      public function get isShowFtHp() : Boolean
      {
         return this._isShowFtHp;
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get pos() : uint
      {
         return this._pos;
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get errorType() : uint
      {
         return this._errorType;
      }
      
      public function get petID() : uint
      {
         return this._petID;
      }
      
      public function set petID(param1:uint) : void
      {
         this._petID = param1;
      }
      
      public function get catchTime() : uint
      {
         return this._catchTime;
      }
      
      public function set catchTime(param1:uint) : void
      {
         this._catchTime = param1;
      }
      
      public function get hp() : uint
      {
         return this._hp;
      }
      
      public function set hp(param1:uint) : void
      {
         this._hp = param1;
      }
      
      public function get maxHP() : uint
      {
         return this._maxHP;
      }
      
      public function set maxHP(param1:uint) : void
      {
         this._maxHP = param1;
      }
      
      public function get level() : uint
      {
         return this._lv;
      }
      
      public function set level(param1:uint) : void
      {
         this._lv = param1;
      }
      
      public function get catchType() : uint
      {
         return this._catchType;
      }
   }
}

