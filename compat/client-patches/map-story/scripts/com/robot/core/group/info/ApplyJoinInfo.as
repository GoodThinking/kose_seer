package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class ApplyJoinInfo
   {
      
      private var _applierID:uint;
      
      private var _applierNick:String;
      
      public function ApplyJoinInfo(param1:IDataInput = null)
      {
         super();
         this._applierID = param1.readUnsignedInt();
         this._applierNick = param1.readUTFBytes(16);
      }
      
      public function get applierID() : uint
      {
         return this._applierID;
      }
      
      public function get applierNick() : String
      {
         return this._applierNick;
      }
   }
}

