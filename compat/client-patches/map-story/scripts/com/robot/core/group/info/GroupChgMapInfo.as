package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class GroupChgMapInfo
   {
      
      private var _leader:uint;
      
      private var _mapType:uint;
      
      private var _mapID:uint;
      
      public function GroupChgMapInfo(param1:IDataInput = null)
      {
         super();
         this._leader = param1.readUnsignedInt();
         this._mapType = param1.readUnsignedInt();
         this._mapID = param1.readUnsignedInt();
      }
      
      public function get leader() : uint
      {
         return this._leader;
      }
      
      public function get mapType() : uint
      {
         return this._mapType;
      }
      
      public function get mapID() : uint
      {
         return this._mapID;
      }
   }
}

