package com.robot.app.mapProcess.control
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.SpaceGuardXMLInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.mode.AppModel;

   public class SpaceGuardController
   {
      private static var guard:AppModel;

      public function SpaceGuardController()
      {
         super();
      }

      public static function addGuard() : void
      {
         hideGuard();
         guard = new AppModel(ClientConfig.getAppModule("honorsHall/SpaceGuard"),"正在加载卫兵");
         guard.setup();
         guard.show();
         guard.init(SpaceGuardXMLInfo.getPosi(MapManager.currentMap.id));
      }

      public static function hideGuard() : void
      {
         if(guard)
         {
            guard.destroy();
            guard = null;
         }
      }
   }
}
