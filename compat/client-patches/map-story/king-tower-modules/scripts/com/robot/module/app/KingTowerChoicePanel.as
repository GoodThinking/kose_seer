package com.robot.module.app
{
   import com.robot.app.mapProcess.MapProcess_10038;
   import com.robot.core.info.pet.PetListInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.utils.ByteArray;
   import org.taomee.effect.ColorFilter;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#ffffff", frameRate="24")]
   public class KingTowerChoicePanel extends Sprite implements IModule
   {
      private static const CHALLENGE_KING_TOWER:uint = 2482;
      private var _panel:MovieClip;
      private var _stage_Txt:TextField;
      private var _close_Btn:SimpleButton;
      private var _stage_Mc:MovieClip;
      private var _start_Btn:SimpleButton;
      private var _choice_Btn:SimpleButton;
      private var _continue_Btn:SimpleButton;
      private var _stageChoice_Btn:Array;
      private var _current:uint;
      private var _busy:Boolean = false;
      private var _entering:Boolean = false;

      public function KingTowerChoicePanel()
      {
         super();
      }

      public function init(data:Object = null) : void
      {
      }

      public function setup() : void
      {
         this._panel = new KingTowerChioceUI();
         this._stage_Txt = this._panel["stage_txt"];
         this._close_Btn = this._panel["close_btn"];
         this._stage_Mc = this._panel["stage_mc"];
         this._start_Btn = this._panel["start_btn"];
         this._choice_Btn = this._panel["choice_btn"];
         this._continue_Btn = this._panel["continue_btn"];
         this._stageChoice_Btn = [this._stage_Mc["stage1_btn"],this._stage_Mc["stage11_btn"],this._stage_Mc["stage21_btn"]];
         ToolTipManager.add(this._start_Btn,"从第一层重新挑战，最高通关记录和已领奖励不会重置");
      }

      public function show() : void
      {
         if(DisplayUtil.hasParent(this._panel))
         {
            return;
         }
         LevelManager.topLevel.addChild(this._panel);
         this._busy = true;
         this._stage_Mc.visible = false;
         this._start_Btn.visible = false;
         this._choice_Btn.visible = false;
         this._continue_Btn.visible = false;
         this._close_Btn.addEventListener(MouseEvent.CLICK,this.onCloseClick);
         this._start_Btn.addEventListener(MouseEvent.CLICK,this.onStartClick);
         this._choice_Btn.addEventListener(MouseEvent.CLICK,this.onChoiceClick);
         this._stage_Mc.addEventListener(MouseEvent.CLICK,this.onStageClick);
         this._continue_Btn.addEventListener(MouseEvent.CLICK,this.onContinueClick);
         SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         SocketConnection.send(CHALLENGE_KING_TOWER,0,0);
      }

      private function onProgress(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         this._busy = false;
         var data:ByteArray = event.data as ByteArray;
         var maximum:uint = data.readUnsignedInt();
         if(maximum == uint.MAX_VALUE)
         {
            return;
         }
         this._current = data.readUnsignedInt();
         this._stage_Txt.text = maximum.toString();
         this._start_Btn.visible = maximum < 10;
         this._choice_Btn.visible = maximum >= 10;
         this._continue_Btn.visible = true;
         var canContinue:Boolean = maximum > 0 && this._current < 30;
         this._continue_Btn.enabled = canContinue;
         this._continue_Btn.mouseEnabled = canContinue;
         this._continue_Btn.filters = canContinue ? [] : [ColorFilter.setGrayscale()];
         ToolTipManager.remove(this._continue_Btn);
         ToolTipManager.add(this._continue_Btn,canContinue ? "继续本轮第" + (this._current + 1) + "层" : "尚无未完成的本轮挑战");
         for(var index:int = 0; index < this._stageChoice_Btn.length; index++)
         {
            var button:SimpleButton = this._stageChoice_Btn[index] as SimpleButton;
            var enabled:Boolean = maximum >= index * 10;
            button.enabled = enabled;
            button.mouseEnabled = enabled;
            button.filters = enabled ? [] : [ColorFilter.setGrayscale()];
         }
      }

      private function onCloseClick(event:MouseEvent) : void
      {
         if(!this._entering)
         {
            this.hide();
         }
      }

      private function onStartClick(event:MouseEvent) : void
      {
         this.enterKingTower(1);
      }

      private function onContinueClick(event:MouseEvent) : void
      {
         this.enterKingTower(0);
      }

      private function onChoiceClick(event:MouseEvent) : void
      {
         if(!this._busy)
         {
            this._stage_Mc.visible = !this._stage_Mc.visible;
         }
      }

      private function onStageClick(event:MouseEvent) : void
      {
         var button:SimpleButton = event.target as SimpleButton;
         if(!button)
         {
            return;
         }
         var index:int = this._stageChoice_Btn.indexOf(button);
         if(index >= 0)
         {
            this.enterKingTower(index + 1);
         }
      }

      private function enterKingTower(checkpoint:uint) : void
      {
         if(this._busy)
         {
            return;
         }
         var found:Boolean = false;
         for each(var pet:PetListInfo in PetManager.getBagMap())
         {
            if(PetManager.getPetInfo(pet.catchTime).level == 100)
            {
               found = true;
               break;
            }
         }
         if(!found)
         {
            Alarm.show("需要携带至少一只100级精灵，才可挑战王者之塔。");
            return;
         }
         this._busy = true;
         this._entering = true;
         this._close_Btn.enabled = false;
         this._close_Btn.mouseEnabled = false;
         SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,this.onEntered);
         SocketConnection.send(CHALLENGE_KING_TOWER,1,checkpoint);
      }

      private function onEntered(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onEntered);
         this._busy = false;
         this._entering = false;
         this._close_Btn.enabled = true;
         this._close_Btn.mouseEnabled = true;
         var data:ByteArray = event.data as ByteArray;
         var stage:uint = data.readUnsignedInt();
         var count:uint = data.readUnsignedInt();
         if(stage == uint.MAX_VALUE)
         {
            return;
         }
         if(count < 1 || count > 5 || data.bytesAvailable < count * 4)
         {
            Alarm.show("楼层消息不完整，请重新选择入口。");
            return;
         }
         var monsters:Array = [];
         for(var index:int = 0; index < count; index++)
         {
            monsters.push(data.readUnsignedInt());
         }
         if(!MapProcess_10038.setEntry(0,stage,monsters))
         {
            Alarm.show("楼层无效，请重新选择入口。");
            return;
         }
         this.hide();
         MapManager.changeLocalMap(10038);
      }

      public function hide() : void
      {
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onEntered);
         this._busy = false;
         this._entering = false;
         this._close_Btn.enabled = true;
         this._close_Btn.mouseEnabled = true;
         DisplayUtil.removeForParent(this._panel);
         this._close_Btn.removeEventListener(MouseEvent.CLICK,this.onCloseClick);
         this._start_Btn.removeEventListener(MouseEvent.CLICK,this.onStartClick);
         this._choice_Btn.removeEventListener(MouseEvent.CLICK,this.onChoiceClick);
         this._stage_Mc.removeEventListener(MouseEvent.CLICK,this.onStageClick);
         this._continue_Btn.removeEventListener(MouseEvent.CLICK,this.onContinueClick);
      }

      public function destroy() : void
      {
         this.hide();
         ToolTipManager.remove(this._start_Btn);
         ToolTipManager.remove(this._continue_Btn);
      }
   }
}
