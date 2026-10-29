package com.robot.groupFight.control.panel
{
   import com.robot.core.CommandID;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import flash.display.Bitmap;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   public class FightOverPanel
   {
      private static var bmp:Bitmap;
      private static var overData:GroupFightOverInfo;
      private static var panel:MovieClip;
      private static var button:SimpleButton;

      public function FightOverPanel()
      {
         super();
      }

      public static function showWin(background:Bitmap, data:GroupFightOverInfo) : void
      {
         show(background,data,new GpFightWinPanel());
      }

      public static function showLost(background:Bitmap, data:GroupFightOverInfo) : void
      {
         show(background,data,new GpFightLostPanel());
      }

      private static function show(background:Bitmap, data:GroupFightOverInfo, movie:MovieClip) : void
      {
         destroy();
         bmp = background;
         overData = data;
         panel = movie;
         DisplayUtil.align(panel,null,AlignType.MIDDLE_CENTER);
         MainManager.getStage().addChild(panel);
         button = panel["okBtn"];
         button.addEventListener(MouseEvent.CLICK,clickHandler);
         SocketConnection.mainSocket.addEventListener(Event.CLOSE,onDisconnected);
      }

      public static function clickHandler(event:MouseEvent = null) : void
      {
         if(panel == null) return;
         SocketConnection.mainSocket.removeEventListener(Event.CLOSE,onDisconnected);
         button.removeEventListener(MouseEvent.CLICK,clickHandler);
         DisplayUtil.removeForParent(panel);
         panel = null;
         button = null;
         var background:Bitmap = bmp;
         var data:GroupFightOverInfo = overData;
         bmp = null;
         overData = null;
         EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.PET_UPDATE_PROP,background));
         EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.ALARM_CLICK,data));
         SocketConnection.send(CommandID.GROUP_FT_WIN_CLOSE);
      }

      private static function onDisconnected(event:Event) : void
      {
         destroy();
      }

      public static function destroy() : void
      {
         SocketConnection.mainSocket.removeEventListener(Event.CLOSE,onDisconnected);
         if(button != null) button.removeEventListener(MouseEvent.CLICK,clickHandler);
         DisplayUtil.removeForParent(panel);
         DisplayUtil.removeForParent(bmp);
         if(bmp != null && bmp.bitmapData != null) bmp.bitmapData.dispose();
         panel = null;
         button = null;
         bmp = null;
         overData = null;
      }
   }
}
