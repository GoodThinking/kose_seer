package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class GroupIDInfo
   {
      
      public var svrID:uint;
      
      public var seqID:uint;
      
      public var time:uint;
      
      public function GroupIDInfo(param1:IDataInput = null)
      {
         super();
         if(param1)
         {
            this.svrID = param1.readUnsignedShort();
            this.seqID = param1.readUnsignedInt();
            this.time = param1.readUnsignedInt();
         }
      }
   }
}

