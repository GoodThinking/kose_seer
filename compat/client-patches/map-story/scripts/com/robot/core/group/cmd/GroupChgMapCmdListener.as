package com.robot.core.group.cmd
{
   import com.robot.core.CommandID;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.group.info.GroupChgMapInfo;
   import com.robot.core.group.transform.GpSuitTransformInfo;
   import com.robot.core.group.transform.GpSuitTrsfManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.manager.bean.BaseBeanController;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   
   public class GroupChgMapCmdListener extends BaseBeanController
   {
      private static var setupDone:Boolean = false;
      
      private var _trsfInfoList:Array = [];
      
      private var _cancelInfoList:Array = [];
      
      public function GroupChgMapCmdListener()
      {
         super();
      }
      
      override public function start() : void
      {
         setup();
         finish();
      }

      public function setup() : void
      {
         if(setupDone) return;
         setupDone = true;
         SocketConnection.addCmdListener(CommandID.GROUP_CHANGE_MAP,this.onGroupChgMap);
         SocketConnection.addCmdListener(CommandID.GROUP_SUIT_TRANSFORM,this.onGroupSuitTrsf);
         SocketConnection.addCmdListener(CommandID.CANCEL_GP_SUIT_TRASF,this.onCancelGpSuitTrsf);
         EventManager.addEventListener(RobotEvent.CREATED_MAP_USER,this.onCreateMapUser);
      }
      
      private function onGroupChgMap(param1:SocketEvent) : void
      {
         var _loc2_:GroupChgMapInfo = param1.data as GroupChgMapInfo;
         if(MapManager.currentMap.id != _loc2_.mapID)
         {
            MapManager.getMapController().changeMap(_loc2_.mapID);
         }
      }
      
      private function onGroupSuitTrsf(param1:SocketEvent) : void
      {
         var _loc2_:GpSuitTransformInfo = param1.data as GpSuitTransformInfo;
         GpSuitTrsfManager.transForm(_loc2_);
         this._trsfInfoList.push(_loc2_);
      }
      
      private function onCancelGpSuitTrsf(param1:SocketEvent) : void
      {
         var _loc2_:GpSuitTransformInfo = param1.data as GpSuitTransformInfo;
         GpSuitTrsfManager.cancelTransForm(_loc2_);
         this._cancelInfoList.push(_loc2_);
      }
      
      private function onCreateMapUser(param1:RobotEvent) : void
      {
         var _loc2_:GpSuitTransformInfo = null;
         var _loc3_:GpSuitTransformInfo = null;
         while(this._trsfInfoList.length > 0)
         {
            _loc2_ = this._trsfInfoList.shift();
            GpSuitTrsfManager.transForm(_loc2_);
         }
         while(this._cancelInfoList.length > 0)
         {
            _loc3_ = this._cancelInfoList.shift();
            GpSuitTrsfManager.cancelTransForm(_loc3_);
         }
      }
   }
}

