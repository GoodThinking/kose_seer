package com.robot.app.mapProcess
{
   import com.robot.app.mapProcess.control.SpaceGuardController;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.AppModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import flash.events.MouseEvent;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_465 extends BaseMapProcess
   {
      private static const CHALLENGE_KING_TOWER:uint = 2482;
      private static var _recordText:String = "";
      private static var _owner:MapProcess_465;
      private var _panel:AppModel;
      private var _panelHero:AppModel;
      private var _disposed:Boolean = false;
      private var _busy:Boolean = true;
      private var _switching:Boolean = false;
      private var _resumeMode:uint = 0;
      private var _showRecordAfterProgress:Boolean = false;

      public function MapProcess_465()
      {
         super();
      }

      override protected function init() : void
      {
         _owner = this;
         _recordText = "";
         SpaceGuardController.addGuard();
         conLevel["king_door"].visible = true;
         conLevel["kingHero_door"].visible = false;
         conLevel["swit"].gotoAndStop(1);
         conLevel["mc_1"].visible = false;
         conLevel["mc_2"].visible = false;
         conLevel["mc_1"].mouseEnabled = conLevel["mc_1"].mouseChildren = false;
         conLevel["mc_2"].mouseEnabled = conLevel["mc_2"].mouseChildren = false;
         ToolTipManager.add(conLevel["swit"],"切换普通／极限模式");
         conLevel["swit"].buttonMode = true;
         conLevel["swit"].addEventListener(MouseEvent.CLICK,this.onSwitClick);
         SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         SocketConnection.send(CHALLENGE_KING_TOWER,0,0);
      }

      public static function showRecord() : void
      {
         if(!_owner || _owner._busy)
         {
            Alarm.show("正在读取挑战记录，请稍后再与守卫交谈。");
            return;
         }
         _owner._showRecordAfterProgress = true;
         _owner._busy = true;
         SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,_owner.onProgress);
         SocketConnection.send(CHALLENGE_KING_TOWER,0,0);
      }

      private function onProgress(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         this._busy = false;
         var showRecord:Boolean = this._showRecordAfterProgress;
         this._showRecordAfterProgress = false;
         var data:ByteArray = event.data as ByteArray;
         var normalMax:uint = data.readUnsignedInt();
         if(normalMax == uint.MAX_VALUE)
         {
            return;
         }
         var normalCurrent:uint = data.readUnsignedInt();
         var heroMax:uint = data.readUnsignedInt();
         var heroCurrent:uint = data.readUnsignedInt();
         this._resumeMode = data.readUnsignedInt();
         var points:uint = data.readUnsignedInt();
         _recordText = "普通模式最高通关：" + normalMax + "层。极限模式最高通关：" + heroMax + "层。王者塔成就点数：" + points + "。普通模式本轮" + (normalCurrent >= 30 ? "已通关" : "下一层为第" + (normalCurrent + 1) + "层") + "；极限模式本轮" + (heroCurrent >= 30 ? "已通关" : "下一层为第" + (heroCurrent + 1) + "层") + "。后十层为本服综合复习关。";
         if(showRecord)
         {
            Alarm.show(_recordText);
            return;
         }
         if(this._resumeMode == 1 || this._resumeMode == 2)
         {
            this._busy = true;
            SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,this.onResume);
            SocketConnection.send(CHALLENGE_KING_TOWER,this._resumeMode,0);
         }
      }

      private function onResume(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onResume);
         this._busy = false;
         var data:ByteArray = event.data as ByteArray;
         var stage:uint = data.readUnsignedInt();
         var count:uint = data.readUnsignedInt();
         if(stage == uint.MAX_VALUE)
         {
            return;
         }
         if(count < 1 || count > 5 || data.bytesAvailable < count * 4)
         {
            Alarm.show("续关消息不完整，请重新选择挑战入口。");
            return;
         }
         var monsters:Array = [];
         for(var index:int = 0; index < count; index++)
         {
            monsters.push(data.readUnsignedInt());
         }
         if(!MapProcess_10038.setEntry(this._resumeMode - 1,stage,monsters))
         {
            Alarm.show("续关楼层无效，请重新选择挑战入口。");
            return;
         }
         MapManager.changeLocalMap(10038);
      }

      private function onSwitClick(event:MouseEvent) : void
      {
         event.stopPropagation();
         if(this._busy || this._switching)
         {
            return;
         }
         this._switching = true;
         var hero:Boolean = conLevel["swit"].currentFrame == 1;
         conLevel["swit"].gotoAndStop(hero ? 2 : 1);
         conLevel["king_door"].visible = false;
         conLevel["kingHero_door"].visible = false;
         conLevel["mc_1"].visible = hero;
         conLevel["mc_2"].visible = !hero;
         AnimateManager.playMcAnimate(conLevel[hero ? "mc_1" : "mc_2"],0,"",function():void
         {
            if(_disposed)
            {
               return;
            }
            conLevel["king_door"].visible = !hero;
            conLevel["kingHero_door"].visible = hero;
            _switching = false;
         });
      }

      public function onKingDoorClick() : void
      {
         if(this._busy || this._switching || !conLevel["king_door"].visible)
         {
            return;
         }
         if(!this._panel)
         {
            this._panel = new AppModel(ClientConfig.getAppModule("KingTowerChoicePanel"),"正在加载王者之塔");
            this._panel.setup();
         }
         this._panel.show();
      }

      public function onKingHeroDoorClick() : void
      {
         if(this._busy || this._switching || !conLevel["kingHero_door"].visible)
         {
            return;
         }
         if(!this._panelHero)
         {
            this._panelHero = new AppModel(ClientConfig.getAppModule("KingTowerHeroChoicePanel"),"正在加载极限王者之塔");
            this._panelHero.setup();
         }
         this._panelHero.show();
      }

      override public function destroy() : void
      {
         this._disposed = true;
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onResume);
         if(this._panel)
         {
            this._panel.destroy();
            this._panel = null;
         }
         if(this._panelHero)
         {
            this._panelHero.destroy();
            this._panelHero = null;
         }
         if(_owner == this)
         {
            _owner = null;
         }
         SpaceGuardController.hideGuard();
         ToolTipManager.remove(conLevel["swit"]);
         conLevel["swit"].removeEventListener(MouseEvent.CLICK,this.onSwitClick);
      }
   }
}
