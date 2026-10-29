package com.robot.app.group
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.mode.AppModel;
   
   public class GroupListController
   {
      
      private static var panel:AppModel;
      
      public function GroupListController()
      {
         super();
      }
      
      public static function showGroupList() : void
      {
         if(!panel)
         {
            panel = new AppModel(ClientConfig.getAppModule("GroupListPanel"),"正在打开小组列表");
         }
         panel.show();
      }
      
      public static function update() : void
      {
         if(panel)
         {
            panel.show();
         }
      }
   }
}

