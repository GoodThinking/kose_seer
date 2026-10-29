package com.robot.core.group.info
{
   import com.robot.core.config.xml.SeatPointXMLInfo;
   import com.robot.core.group.manager.GroupIDInfoManager;
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.group.manager.GroupMouseManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.mode.MapModel;
   import com.robot.core.utils.ArrayUtils;
   import flash.display.MovieClip;
   import org.taomee.ds.HashMap;
   
   public class GroupInfo
   {
      
      private var _groupIDInfo:GroupIDInfo;
      
      private var _leaderID:uint = 0;
      
      private var _memberList:Array = [];
      
      private var _sctPoint:Array = [];
      
      public var isLeader:Boolean = false;
      
      public var groupName:String = "";
      
      public var sctID:uint;
      
      public var pointID:uint;
      
      public var membModelMap:HashMap = new HashMap();
      
      public function GroupInfo()
      {
         super();
      }
      
      public function get groupIDInfo() : GroupIDInfo
      {
         return this._groupIDInfo;
      }
      
      public function set groupIDInfo(param1:GroupIDInfo) : void
      {
         this._groupIDInfo = param1;
      }
      
      public function get leaderID() : uint
      {
         return this._leaderID;
      }
      
      public function set leaderID(param1:uint) : void
      {
         this._leaderID = param1;
         if(this._leaderID != 0 && GroupManager.isInGroup && GroupIDInfoManager.checkIsSelfGp(this._groupIDInfo))
         {
            if(this._leaderID == MainManager.actorID)
            {
               this.isLeader = true;
               GroupMouseManager.openMouseEvent();
            }
            else
            {
               this.isLeader = false;
               GroupMouseManager.closeMouseEvent();
            }
         }
      }
      
      public function get memberList() : Array
      {
         return this._memberList;
      }
      
      public function set memberList(param1:Array) : void
      {
         var _loc2_:uint = 0;
         var _loc3_:BasePeoleModel = null;
         this._memberList = [];
         this.membModelMap.clear();
         if(this.leaderID != 0)
         {
            this._memberList = ArrayUtils.removeDuplicates(param1);
            var leaderIndex:int = this._memberList.indexOf(this.leaderID);
            if(leaderIndex > 0)
            {
               var first:uint = uint(this._memberList[0]);
               this._memberList[0] = this.leaderID;
               this._memberList[leaderIndex] = first;
            }
            for each(_loc2_ in this._memberList)
            {
               _loc3_ = UserManager.getUserModel(_loc2_);
               if(_loc3_)
               {
                  this.membModelMap.add(_loc2_,_loc3_);
               }
            }
         }
      }
      
      public function get sctPoint() : Array
      {
         return this._sctPoint;
      }
      
      public function set sctPoint(param1:Array) : void
      {
         var _loc3_:MovieClip = null;
         var _loc2_:MapModel = MapManager.currentMap;
         if(_loc2_)
         {
            _loc3_ = SeatPointXMLInfo.getSeatPointMC(_loc2_.id,param1[0],param1[1]);
            if(_loc3_)
            {
               _loc3_.buttonMode = false;
               _loc3_.mouseEnabled = false;
            }
         }
      }
   }
}

