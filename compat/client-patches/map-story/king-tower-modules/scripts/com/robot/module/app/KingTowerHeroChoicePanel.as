package com.robot.module.app
{
   import com.robot.app.mapProcess.MapProcess_10038;
   import com.robot.core.info.pet.PetListInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
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
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#ffffff", frameRate="24")]
   public class KingTowerHeroChoicePanel extends Sprite implements IModule
   {
      private static const CHALLENGE_KING_TOWER:uint = 2482;
      private var _panel:MovieClip;
      private var _stage_Txt:TextField;
      private var _close_Btn:SimpleButton;
      private var _stage_Mc:MovieClip;
      private var _start_Btn:SimpleButton;
      private var _choice_Btn:SimpleButton;
      private var _stageChoice_Btn:Array;
      private var _normalMax:uint;
      private var _heroCurrent:uint;
      private var _busy:Boolean = false;
      private var _entering:Boolean = false;

      public function KingTowerHeroChoicePanel()
      {
         super();
      }

      public function init(data:Object = null) : void
      {
      }

      public function setup() : void
      {
         this._panel = new KingTowerHeroChioceUI();
         this._stage_Txt = this._panel["stage_txt"];
         this._close_Btn = this._panel["close_btn"];
         this._stage_Mc = this._panel["stage_mc"];
         this._start_Btn = this._panel["start_btn"];
         this._choice_Btn = this._panel["choice_btn"];
         this._stageChoice_Btn = [this._stage_Mc["stage1_btn"],this._stage_Mc["stage11_btn"],this._stage_Mc["stage21_btn"]];
         ToolTipManager.add(this._start_Btn,"继续未完成的挑战，或重新从第一层开始");
      }

      public function show() : void
      {
         if(DisplayUtil.hasParent(this._panel))
         {
            return;
         }
         LevelManager.topLevel.addChild(this._panel);
         DisplayUtil.align(this._panel,null,AlignType.MIDDLE_CENTER);
         this._busy = true;
         this._stage_Mc.visible = false;
         this._start_Btn.visible = false;
         this._choice_Btn.visible = false;
         this._close_Btn.addEventListener(MouseEvent.CLICK,this.onCloseClick);
         this._start_Btn.addEventListener(MouseEvent.CLICK,this.onStartClick);
         this._choice_Btn.addEventListener(MouseEvent.CLICK,this.onChoiceClick);
         this._stage_Mc.addEventListener(MouseEvent.CLICK,this.onStageClick);
         SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         SocketConnection.send(CHALLENGE_KING_TOWER,0,0);
      }

      private function onProgress(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CHALLENGE_KING_TOWER,this.onProgress);
         this._busy = false;
         var data:ByteArray = event.data as ByteArray;
         var normalMax:uint = data.readUnsignedInt();
         if(normalMax == uint.MAX_VALUE)
         {
            return;
         }
         this._normalMax = normalMax;
         data.readUnsignedInt();
         var heroMax:uint = data.readUnsignedInt();
         this._heroCurrent = data.readUnsignedInt();
         this._stage_Txt.text = heroMax.toString();
         this._start_Btn.visible = heroMax < 10;
         this._choice_Btn.visible = heroMax >= 10;
         for(var index:int = 0; index < this._stageChoice_Btn.length; index++)
         {
            var button:SimpleButton = this._stageChoice_Btn[index] as SimpleButton;
            var required:uint = (index + 1) * 10;
            var enabled:Boolean = normalMax >= required;
            button.enabled = enabled;
            button.mouseEnabled = enabled;
            button.filters = enabled ? [] : [ColorFilter.setGrayscale()];
            ToolTipManager.remove(button);
            ToolTipManager.add(button,enabled ? "挑战极限第" + (index * 10 + 1) + "层起的十层关卡" : "先通过普通模式第" + required + "层");
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
         this.chooseEntry(1);
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
            this.chooseEntry(index + 1);
         }
      }

      private function chooseEntry(checkpoint:uint) : void
      {
         if(this._busy)
         {
            return;
         }
         if(this._heroCurrent > 0 && this._heroCurrent < 30 && this._heroCurrent % 10 != 0 && checkpoint == uint(this._heroCurrent / 10) + 1)
         {
            NpcDialog.show(NPC.SOLIDMAN,["本轮已通过极限第" + this._heroCurrent + "层。继续挑战须保留本轮背包成员；重新开始则可以使用当前背包，最高通关记录和已领奖励不会重置。"],["继续第" + (this._heroCurrent + 1) + "层","从第" + ((checkpoint - 1) * 10 + 1) + "层重新开始","先不挑战"],[function():void
            {
               if(DisplayUtil.hasParent(_panel))
               {
                  enterKingTower(0);
               }
            },function():void
            {
               if(DisplayUtil.hasParent(_panel))
               {
                  enterKingTower(checkpoint);
               }
            }]);
            return;
         }
         this.enterKingTower(checkpoint);
      }

      private function enterKingTower(checkpoint:uint) : void
      {
         if(this._busy)
         {
            return;
         }
         var required:uint = checkpoint ? checkpoint * 10 : uint(this._heroCurrent / 10 + 1) * 10;
         if(this._normalMax < required)
         {
            Alarm.show("需要先通过普通模式第" + required + "层，才可挑战这一段极限模式。");
            return;
         }
         var count:int = 0;
         for each(var pet:PetListInfo in PetManager.getBagMap())
         {
            if(PetManager.getPetInfo(pet.catchTime).level == 100)
            {
               count++;
            }
         }
         if(count < 3)
         {
            Alarm.show("需要携带至少三只100级精灵，才可挑战极限模式。");
            return;
         }
         this._busy = true;
         this._entering = true;
         this._close_Btn.enabled = false;
         this._close_Btn.mouseEnabled = false;
         SocketConnection.addCmdListener(CHALLENGE_KING_TOWER,this.onEntered);
         SocketConnection.send(CHALLENGE_KING_TOWER,2,checkpoint);
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
         if(!MapProcess_10038.setEntry(1,stage,monsters))
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
      }

      public function destroy() : void
      {
         this.hide();
         ToolTipManager.remove(this._start_Btn);
         for each(var button:SimpleButton in this._stageChoice_Btn)
         {
            ToolTipManager.remove(button);
         }
      }
   }
}
