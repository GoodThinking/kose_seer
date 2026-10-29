package com.robot.core.group.fightInfo.fighting
{
   import flash.utils.IDataInput;
   import org.taomee.ds.HashMap;
   
   public class GpFtRelateNoticeInfo
   {
      
      private var _side:uint;
      
      private var _relationMap:HashMap = new HashMap();
      
      public function GpFtRelateNoticeInfo(param1:IDataInput = null)
      {
         var _loc4_:uint = 0;
         var _loc5_:uint = 0;
         var _loc6_:Array = null;
         var _loc7_:uint = 0;
         var _loc8_:uint = 0;
         var _loc9_:uint = 0;
         super();
         this._side = param1.readUnsignedByte();
         var _loc2_:uint = param1.readUnsignedByte();
         var _loc3_:uint = 0;
         while(_loc3_ < _loc2_)
         {
            _loc4_ = param1.readUnsignedShort();
            _loc5_ = param1.readUnsignedByte();
            _loc6_ = [];
            _loc7_ = 0;
            while(_loc7_ < _loc5_)
            {
               _loc8_ = param1.readUnsignedByte();
               _loc9_ = param1.readUnsignedInt();
               _loc6_.push(_loc8_);
               _loc7_++;
            }
            if(_loc6_.length > 0)
            {
               this._relationMap.add(_loc4_,_loc6_);
            }
            _loc3_++;
         }
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get relationMap() : HashMap
      {
         return this._relationMap;
      }
   }
}

