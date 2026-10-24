package com.robot.app.mapProcess.control
{
   import com.robot.app.panel.*;
   import com.robot.core.*;
   import com.robot.core.info.pet.PetShowInfo;
   import com.robot.core.manager.*;
   import com.robot.core.net.*;
   import flash.events.EventDispatcher;
   import flash.utils.*;
   import org.taomee.events.*;
   
   public class NinjaSocketCtrl extends EventDispatcher
   {
      
      private static var _instance:NinjaSocketCtrl;
      
      public static const RESET_SKILL:String = "reset_skill";
      
      public static const GET_NINJA_SKILL:String = "get_ninja_skill";
      
      public static const GET_ZHEN_YAN:String = "get_zhen_yan";
      
      public static const GET_PANEL_INFO:String = "get_panel_info";
      
      public static const GET_PET:String = "get_pet";
      
      public static const GET_NINJA_TOOLS:String = "get_ninja_tools";
      
      private var _petinfo:PetShowInfo;
      
      private var petid:uint;
      
      public function NinjaSocketCtrl()
      {
         super();
         if(_instance != null)
         {
            throw new Error("该类是单例模式");
         }
         _instance = this;
      }
      
      public static function get instance() : NinjaSocketCtrl
      {
         if(_instance == null)
         {
            _instance = new NinjaSocketCtrl();
         }
         return _instance;
      }
      
      public function getPanelInfo() : void
      {
         SocketConnection.addCmdListener(CommandID.GET_NINJA_PANEL_INFO,this.panelInfoHandler);
         SocketConnection.send(CommandID.GET_NINJA_PANEL_INFO);
      }
      
      private function panelInfoHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_PANEL_INFO,this.panelInfoHandler);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:Array = new Array();
         var _loc4_:int = 0;
         while(_loc4_ < 10)
         {
            _loc3_.push(_loc2_.readUnsignedInt());
            _loc4_++;
         }
         dispatchEvent(new DynamicEvent(NinjaSocketCtrl.GET_PANEL_INFO,_loc3_));
      }
      
      public function getZhenYan() : void
      {
         SocketConnection.addCmdListener(CommandID.GET_ZHEN_YAN,this.zhenYanHandler);
         SocketConnection.send(CommandID.GET_ZHEN_YAN);
      }
      
      private function zhenYanHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_ZHEN_YAN,this.zhenYanHandler);
         dispatchEvent(new DynamicEvent(NinjaSocketCtrl.GET_ZHEN_YAN));
      }
      
      public function getPet(param1:uint) : void
      {
         SocketConnection.addCmdListener(CommandID.GET_NINJA_PET,this.getPetHandler);
         SocketConnection.send(CommandID.GET_NINJA_PET,param1);
      }
      
      private function getPetHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_PET,this.getPetHandler);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         var _loc4_:uint = _loc2_.readUnsignedInt();
         var _loc5_:uint = _loc2_.readUnsignedInt();
         var _loc6_:Array = new Array();
         _loc6_.push(_loc4_);
         _loc6_.push(_loc5_);
         dispatchEvent(new DynamicEvent(NinjaSocketCtrl.GET_PET,_loc6_));
      }
      
      public function getNinjaTools() : void
      {
         SocketConnection.addCmdListener(CommandID.GET_NINJA_TOOLS,this.getNinjaToolsHandler);
         SocketConnection.send(CommandID.GET_NINJA_TOOLS);
      }
      
      private function getNinjaToolsHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_TOOLS,this.getNinjaToolsHandler);
         dispatchEvent(new DynamicEvent(NinjaSocketCtrl.GET_NINJA_TOOLS));
      }
      
      public function getNinjaSkill() : void
      {
         this._petinfo = MainManager.actorModel.pet.info;
         this.petid = this._petinfo.petID;
         var _loc1_:uint = uint(NinjaSpNoNoController.instance.skillIdArr.indexOf(this._petinfo.petID));
         if(NinjaSpNoNoController.instance.petIdArr.indexOf(this._petinfo.petID) < 2)
         {
            _loc1_ = 0;
         }
         else
         {
            _loc1_ = 1;
         }
         SkillReplacePanel.show(this._petinfo.catchTime,NinjaSpNoNoController.instance.skillIdArr[_loc1_],this.onClosegetNinjaSkill,this.onClosePanelHandler,SkillReplacePanel.SPECIAL);
      }
      
      private function onClosegetNinjaSkill(... rest) : void
      {
         var _loc2_:uint = uint(rest[0]);
         var _loc3_:uint = uint(rest[1]);
         SocketConnection.addCmdListener(CommandID.GET_NINJA_SKILL,this.getNinjaSkillHandler);
         SocketConnection.send(CommandID.GET_NINJA_SKILL,_loc2_,_loc3_);
      }
      
      private function onClosePanelHandler() : void
      {
         SocketConnection.addCmdListener(CommandID.GET_NINJA_SKILL,this.getNinjaSkillHandler);
         SocketConnection.send(CommandID.GET_NINJA_SKILL,this._petinfo.catchTime,0);
      }
      
      private function getNinjaSkillHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_SKILL,this.getNinjaSkillHandler);
         dispatchEvent(new DynamicEvent(NinjaSocketCtrl.GET_NINJA_SKILL,this.petid));
      }
      
      public function destory() : void
      {
         SocketConnection.removeCmdListener(CommandID.NOTE_UPDATE_PROP,this.onClosegetNinjaSkill);
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_SKILL,this.getNinjaSkillHandler);
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_TOOLS,this.getNinjaToolsHandler);
         SocketConnection.removeCmdListener(CommandID.GET_ZHEN_YAN,this.zhenYanHandler);
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_PANEL_INFO,this.panelInfoHandler);
         SocketConnection.removeCmdListener(CommandID.GET_NINJA_PET,this.getPetHandler);
      }
   }
}

