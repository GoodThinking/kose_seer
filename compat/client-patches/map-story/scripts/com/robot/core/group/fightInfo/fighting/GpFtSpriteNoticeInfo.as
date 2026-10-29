package com.robot.core.group.fightInfo.fighting
{
   import flash.utils.IDataInput;
   
   public class GpFtSpriteNoticeInfo
   {
      
      private var _turn:uint;
      
      private var _side:uint;
      
      private var _pos:uint;
      
      private var _batLvList:Array;
      
      private var _capTm:uint;
      
      private var _monID:uint;
      
      private var _curtHp:int;
      
      private var _maxHp:int;
      
      private var _chgHp:int;
      
      public function GpFtSpriteNoticeInfo(param1:IDataInput = null)
      {
         super();
         this._turn = param1.readUnsignedInt();
         this._side = param1.readUnsignedByte();
         this._pos = param1.readUnsignedByte();
         this._batLvList = [];
         var _loc2_:uint = 0;
         while(_loc2_ < 6)
         {
            this._batLvList.push(param1.readUnsignedByte());
            _loc2_++;
         }
         this._capTm = param1.readUnsignedInt();
         this._monID = param1.readUnsignedInt();
         this._curtHp = param1.readInt();
         this._maxHp = param1.readInt();
         this._chgHp = param1.readInt();
      }
      
      public function get turn() : uint
      {
         return this._turn;
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get pos() : uint
      {
         return this._pos;
      }
      
      public function get batLvList() : Array
      {
         return this._batLvList;
      }
      
      public function get capTm() : uint
      {
         return this._capTm;
      }
      
      public function get monID() : uint
      {
         return this._monID;
      }
      
      public function get curtHp() : int
      {
         return this._curtHp;
      }
      
      public function get maxHp() : int
      {
         return this._maxHp;
      }
      
      public function get chgHp() : int
      {
         return this._chgHp;
      }
   }
}

