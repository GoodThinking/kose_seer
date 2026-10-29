package com.robot.core.group.info
{
   import flash.utils.IDataInput;
   
   public class GpInviteNoticeInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _groupName:String;
      
      private var _fromUserID:uint;
      
      private var _fromUserNick:String;
      
      private var _evtType:uint;
      
      private var _data:uint;
      
      private var _leaderID:uint;
      
      private var _membList:Array;
      
      public function GpInviteNoticeInfo(param1:IDataInput = null)
      {
         var _loc2_:uint = 0;
         super();
         this._groupIDInfo = new GroupIDInfo(param1);
         this._groupName = param1.readUTFBytes(16);
         this._fromUserID = param1.readUnsignedInt();
         this._fromUserNick = param1.readUTFBytes(16);
         this._evtType = param1.readUnsignedInt();
         this._data = param1.readUnsignedInt();
         this._leaderID = param1.readUnsignedInt();
         this._membList = [];
         var _loc3_:uint = 0;
         while(_loc3_ < 5)
         {
            _loc2_ = param1.readUnsignedInt();
            if(_loc2_ != 0)
            {
               this._membList.push(_loc2_);
            }
            _loc3_++;
         }
      }
      
      public function get groupIDInfo() : GroupIDInfo
      {
         return this._groupIDInfo;
      }
      
      public function get groupName() : String
      {
         return this._groupName;
      }
      
      public function get fromUserID() : uint
      {
         return this._fromUserID;
      }
      
      public function get fromUserNick() : String
      {
         return this._fromUserNick;
      }
      
      public function get evtType() : uint
      {
         return this._evtType;
      }
      
      public function get data() : uint
      {
         return this._data;
      }
      
      public function get leaderID() : uint
      {
         return this._leaderID;
      }
      
      public function get membList() : Array
      {
         return this._membList;
      }
   }
}

