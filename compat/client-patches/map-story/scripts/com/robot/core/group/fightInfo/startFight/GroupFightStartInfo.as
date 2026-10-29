package com.robot.core.group.fightInfo.startFight
{
   import flash.utils.IDataInput;
   
   public class GroupFightStartInfo
   {
      
      private var _isVsNPC:Boolean = false;
      
      private var _groupOneMembCnt:uint;
      
      private var _groupOneList:Array = [];
      
      private var _groupTwoMembCnt:uint;
      
      private var _groupTwoList:Array = [];
      
      public function GroupFightStartInfo(param1:IDataInput = null)
      {
         super();
         this._isVsNPC = Boolean(param1.readUnsignedByte());
         this._groupOneMembCnt = param1.readUnsignedByte();
         var _loc2_:uint = 0;
         while(_loc2_ < this._groupOneMembCnt)
         {
            this._groupOneList.push(new GroupFightPetInfo(param1));
            _loc2_++;
         }
         this._groupTwoMembCnt = param1.readUnsignedByte();
         var _loc3_:uint = 0;
         while(_loc3_ < this._groupTwoMembCnt)
         {
            this._groupTwoList.push(new GroupFightPetInfo(param1));
            _loc3_++;
         }
      }
      
      public function get groupOneMembCnt() : uint
      {
         return this._groupOneMembCnt;
      }
      
      public function get groupOneList() : Array
      {
         return this._groupOneList;
      }
      
      public function get groupTwoMembCnt() : uint
      {
         return this._groupTwoMembCnt;
      }
      
      public function get groupTwoList() : Array
      {
         return this._groupTwoList;
      }
   }
}

