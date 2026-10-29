package com.robot.groupFight.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.groupFight.control.panel.FightOverPanel;
   import com.robot.groupFight.data.FighterModelFactory;
   import flash.display.Bitmap;
   import flash.display.BitmapData;
   import flash.display.Sprite;
   import flash.events.Event;
   import org.taomee.utils.DisplayUtil;
   import org.taomee.manager.EventManager;

   public class GroupFightOverManager
   {
      private static var pendingAlert:Sprite;
      private static var pendingBackground:Bitmap;
      private static var generation:uint;
      public function GroupFightOverManager()
      {
         super();
      }

      public static function over(data:GroupFightOverInfo) : void
      {
         if(data == null) return;
         var pixels:BitmapData = new BitmapData(MainManager.getStageWidth(),MainManager.getStageHeight(),false);
         pixels.draw(MainManager.getStage());
         var background:Bitmap = new Bitmap(pixels);
         LevelManager.fightLevel.addChild(background);
         if(data.endReason == 1)
         {
            if(data.winnerID == FighterModelFactory.invitorID) FightOverPanel.showWin(background,data);
            else FightOverPanel.showLost(background,data);
            return;
         }
         var messages:Array = ["非法战斗","","队员掉线战斗结束","操作超时了，战斗结束！","这场战斗双方打成平手！^_^","很抱歉，系统出错，本次战斗结束","中途退出，战斗结束！"];
         var text:String = data.endReason < messages.length ? messages[data.endReason] : "本次战斗已结束。";
         pendingBackground = background;
         var token:uint = ++generation;
         SocketConnection.mainSocket.addEventListener(Event.CLOSE,onDisconnected);
         pendingAlert = Alarm.show(text,function():void
         {
            if(token != generation) return;
            SocketConnection.mainSocket.removeEventListener(Event.CLOSE,onDisconnected);
            pendingAlert = null;
            pendingBackground = null;
            EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.PET_UPDATE_PROP,background));
            EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.ALARM_CLICK,data));
            if(data.endReason == 6) SocketConnection.send(CommandID.GROUP_FT_WIN_CLOSE);
         });
         LevelManager.fightLevel.addChild(pendingAlert);
      }

      private static function onDisconnected(event:Event) : void
      {
         ++generation;
         SocketConnection.mainSocket.removeEventListener(Event.CLOSE,onDisconnected);
         DisplayUtil.removeForParent(pendingAlert);
         DisplayUtil.removeForParent(pendingBackground);
         if(pendingBackground != null) pendingBackground.bitmapData.dispose();
         pendingAlert = null;
         pendingBackground = null;
      }
   }
}
