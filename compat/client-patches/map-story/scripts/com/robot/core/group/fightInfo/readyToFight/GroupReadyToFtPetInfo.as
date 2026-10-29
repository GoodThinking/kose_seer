package com.robot.core.group.fightInfo.readyToFight
{
   import flash.utils.IDataInput;
   
   public class GroupReadyToFtPetInfo
   {
      
      private var _id:uint;
      
      private var _moveCnt:uint;
      
      private var _moveList:Array = [];
      
      public function GroupReadyToFtPetInfo(param1:IDataInput = null)
      {
         super();
         this._id = param1.readUnsignedInt();
         this._moveCnt = param1.readUnsignedInt();
         var _loc2_:uint = 0;
         while(_loc2_ < this._moveCnt)
         {
            this._moveList.push(param1.readUnsignedInt());
            _loc2_++;
         }
      }
      
      public function get id() : uint
      {
         return this._id;
      }
      
      public function get moveCnt() : uint
      {
         return this._moveCnt;
      }
      
      public function get moveList() : Array
      {
         return this._moveList;
      }
   }
}

