package com.robot.app.group
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.MapEvent;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.net.SocketConnection;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import org.taomee.events.SocketEvent;
   
   public class GroupFightWaitPanel
   {
      
      private static var panel:MovieClip;
      
      private static var closeBtn:SimpleButton;
      
      private static var selectPanel:MovieClip;
      
      private static var userInfo:UserInfo;
      
      private static var seletctCloseBtn:SimpleButton;
      
      private static var singleBtn:SimpleButton;
      
      private static var multiBtn:SimpleButton;
      
      private static var isHide:Boolean = false;
      private static var waiting:Boolean = false;

      
      initHandler();
      
      public function GroupFightWaitPanel()
      {
         super();
      }
      
      private static function initHandler() : void
      {
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onMapSwitch);
      }
      
      private static function onMapSwitch(param1:MapEvent) : void
      {
         if(waiting)
         {
            waiting = false;
            SocketConnection.send(CommandID.CANCEL_SPRITE_BOSS_FT);
         }
      }
      
      public static function selectMode() : void
      {
         waiting = true;
         ModuleManager.showModule(ClientConfig.getAppModule("GpSpriteBossPanel"),"正在打开面板");
      }
      
      public static function show(param1:Boolean = true) : void
      {
         waiting = true;
         ModuleManager.showModule(ClientConfig.getAppModule("GpFightWaitPanel"),"正在打开面板",param1);
      }
      
      public static function hide(param1:SocketEvent = null) : void
      {
         waiting = false;
      }
   }
}

