package com.robot.app.group.cmd
{
   import com.robot.app.group.manager.GroupNoticeManager;
   import com.robot.core.group.manager.GroupInviteManager;
   import com.robot.core.manager.bean.BaseBeanController;
   
   public class GroupNoticeCmdListener extends BaseBeanController
   {
      
      public function GroupNoticeCmdListener()
      {
         super();
      }
      
      override public function start() : void
      {
         GroupNoticeManager.setup();
         GroupInviteManager.setup();
         finish();
      }
   }
}

