package com.robot.groupFight.control.panel.ui.btns
{
   import com.robot.core.CommandID;
   import com.robot.core.group.model.GroupFightModel;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.groupFight.control.panel.ControlPanelObserver;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   
   public class EscapeBtn extends ControlBtn
   {
      private var escapeAlert:Sprite;
      private var previousMouseChildren:Boolean;

      
      public function EscapeBtn(b:SimpleButton, ctlPanel:ControlPanelObserver)
      {
         super(b,ctlPanel);
         if(GroupFightModel.status == GroupFightModel.FIGHT_WITH_PLAYER)
         {
            closeBtn();
         }
      }
      
      override public function mosClick(evt:MouseEvent = null) : void
      {
         var mc:Sprite = null;
         if(this.escapeAlert != null)
         {
            return;
         }
         if(GroupFightModel.status == GroupFightModel.FIGHT_WITH_PLAYER)
         {
            closeBtn();
            mc = Alarm.show("用户之间对战不能随便逃跑哦！");
            LevelManager.fightLevel.addChild(mc);
         }
         else
         {
            this.previousMouseChildren = LevelManager.root.mouseChildren;
            LevelManager.root.mouseChildren = false;
            this.escapeAlert = Alert.show("你确定要逃离这次战斗吗？",function():void
            {
               escapeAlert = null;
               LevelManager.root.mouseChildren = previousMouseChildren;
               SocketConnection.send(CommandID.GROUP_FT_ESCAPE);
            },function():void
            {
               escapeAlert = null;
               LevelManager.root.mouseChildren = previousMouseChildren;
               ctlPanelOber.showFight();
            });
            MainManager.getStage().addChild(this.escapeAlert);
         }
      }

      override public function destroy() : void
      {
         if(this.escapeAlert != null)
         {
            this.escapeAlert.stopDrag();
            if(this.escapeAlert.parent != null)
            {
               this.escapeAlert.parent.removeChild(this.escapeAlert);
            }
            this.escapeAlert = null;
            LevelManager.root.mouseChildren = this.previousMouseChildren;
         }
         super.destroy();
      }
   }
}

