package com.robot.core.group.transform
{
   import com.robot.core.group.info.GroupIDInfo;
   import flash.utils.IDataInput;
   
   public class GpSuitTransformInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _trsfType:uint;
      
      public function GpSuitTransformInfo(param1:IDataInput = null)
      {
         super();
         this._groupIDInfo = new GroupIDInfo();
         this._groupIDInfo.svrID = param1.readUnsignedShort();
         this._groupIDInfo.seqID = param1.readUnsignedInt();
         this._groupIDInfo.time = param1.readUnsignedInt();
         this._trsfType = param1.readUnsignedInt();
      }
      
      public function get groupIDInfo() : GroupIDInfo
      {
         return this._groupIDInfo;
      }
   }
}

