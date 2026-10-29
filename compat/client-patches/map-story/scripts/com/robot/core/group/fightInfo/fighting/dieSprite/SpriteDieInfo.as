package com.robot.core.group.fightInfo.fighting.dieSprite
{
   import flash.utils.IDataInput;
   
   public class SpriteDieInfo
   {
      
      private var _side:uint;
      
      private var _pos:uint;
      
      private var _evt:uint;
      
      private var _datad:uint;
      
      public function SpriteDieInfo(param1:IDataInput = null)
      {
         super();
         this._side = param1.readUnsignedByte();
         this._pos = param1.readUnsignedByte();
         this._evt = param1.readUnsignedByte();
         this._datad = param1.readUnsignedInt();
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get pos() : uint
      {
         return this._pos;
      }
      
      public function get evt() : uint
      {
         return this._evt;
      }
      
      public function get datad() : uint
      {
         return this._datad;
      }
   }
}

