package com.robot.app.group
{
   import com.robot.core.CommandID;
   import com.robot.core.info.InformInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.net.SocketConnection;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupInviteWaitPanel
   {
      
      private static var panel:MovieClip;
      
      private static var closeBtn:SimpleButton;
      
      public function GroupInviteWaitPanel()
      {
         super();
      }
      
      public static function show() : void
      {
         if(panel == null)
         {
            panel = GroupUiLinkage.getMovieClip(GroupUiLinkage.GP_INVITE_WAIT_PANEL);
         }
         closeBtn = panel["closeBtn"];
         closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         LevelManager.appLevel.addChild(panel);
         DisplayUtil.align(panel,null,AlignType.MIDDLE_CENTER);
         LevelManager.closeMouseEvent();
         SocketConnection.addCmdListener(CommandID.INFORM,onInform);
      }
      
      public static function hide() : void
      {
         LevelManager.openMouseEvent();
         DisplayUtil.removeForParent(panel);
      }
      
      private static function onClose(param1:MouseEvent) : void
      {
         LevelManager.openMouseEvent();
         DisplayUtil.removeForParent(panel);
      }
      
      private static function onInform(param1:SocketEvent) : void
      {
         var _loc2_:InformInfo = param1.data as InformInfo;
         if(_loc2_.type == CommandID.REPLY_JOIN_GROUP)
         {
            hide();
         }
      }
   }
}

