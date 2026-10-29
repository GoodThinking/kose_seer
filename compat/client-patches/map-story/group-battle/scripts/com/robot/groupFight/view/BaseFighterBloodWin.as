package com.robot.groupFight.view
{
   import com.robot.core.config.PetStatusEffectConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.group.fightInfo.readyToFight.GroupReadyToFtUserInfo;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.info.fightInfo.PetStatusEffectInfo;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.manager.assetManager.PetAssetsManager;
   import flash.display.Bitmap;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.text.TextField;
   import flash.utils.getQualifiedClassName;
   import org.taomee.component.control.MLoadPane;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;
   
   public class BaseFighterBloodWin implements IFighterView
   {
      
      private var _ui:Sprite;
      
      private var _info:GroupFightPetInfo;
      
      private var _levelTxt:TextField;
      
      private var _hpTxt:TextField;
      
      private var _barMC:MovieClip;
      
      private var _nameTxt:TextField;
      
      private var _petMC:MovieClip;
      
      private var _effectIcon:MovieClip;
      
      private var _isShowHp:Boolean = false;
      
      protected var effectIconClsNames:Array = [];
      
      protected var effectIcons:Array = [];
      
      public function BaseFighterBloodWin(ui:Sprite)
      {
         super();
         this._ui = ui;
         this._levelTxt = ui["level_txt"];
         this._hpTxt = ui["hp_txt"];
         this._barMC = ui["hpBar"]["barMC"];
         this._nameTxt = ui["name_txt"];
         this._petMC = ui["iconMC"];
         this._effectIcon = ui["effectIcon"];
      }
      
      public function get isShowHp() : Boolean
      {
         return this._isShowHp;
      }
      
      public function set isShowHp(value:Boolean) : void
      {
         this._isShowHp = value;
         this._hpTxt.visible = this._isShowHp;
      }
      
      public function destroy() : void
      {
         if(Boolean(this._ui))
         {
            DisplayUtil.removeForParent(this._ui);
            this._ui = null;
         }
         this._levelTxt = null;
         this._hpTxt = null;
         this._barMC = null;
         this._nameTxt = null;
         this._petMC = null;
         this._info = null;
      }
      
      public function update(info:GroupFightPetInfo) : void
      {
         this._info = info;
         this.removeAllEffect();
         if(info.level <= 100)
         {
            this._levelTxt.text = info.level.toString();
         }
         else
         {
            this._levelTxt.text = "??";
         }
         this.showName(info);
         this.resetBar(info.hp,info.maxHP);
         this.showPetIcon(info);
      }
      
      public function showName(info:GroupFightPetInfo) : void
      {
         var rinfo:GroupReadyToFtUserInfo = FighterModelFactory.gpRdyToFtUsInfoMap.getValue(info.userID);
         if(Boolean(rinfo) && rinfo.nick != "")
         {
            this._nameTxt.text = rinfo.nick;
         }
         else
         {
            this._nameTxt.text = PetXMLInfo.getName(info.petID);
         }
      }
      
      public function resetBar(hp:Number, maxHp:Number) : void
      {
         var p:Number = NaN;
         if(maxHp == 0)
         {
            p = 1;
         }
         else
         {
            p = 1 - hp / maxHp;
         }
         this._barMC.x = -this._barMC.width * p + 20;
         this._hpTxt.text = hp + "/" + maxHp;
      }
      
      public function addEffect(cls:Class, info:PetStatusEffectInfo) : void
      {
         var mc:MovieClip = new cls() as MovieClip;
         var clsName:String = getQualifiedClassName(mc);
         this.effectIconClsNames.push(clsName);
         this.effectIcons.push(mc);
         this.addIcon(mc);
         mc.buttonMode = true;
         ToolTipManager.add(mc,PetStatusEffectConfig.tip(info));
      }
      
      public function removeAllEffect() : void
      {
         var i:MovieClip = null;
         this.effectIconClsNames = [];
         for each(i in this.effectIcons)
         {
            ToolTipManager.remove(i);
            DisplayUtil.removeForParent(i);
         }
         DisplayUtil.removeAllChild(this._effectIcon);
         this.effectIcons = [];
      }
      
      protected function addIcon(mc:MovieClip) : void
      {
         var x:Number = (mc.width + 2) * (this.effectIcons.length - 1);
         mc.x = x;
         this._effectIcon.addChild(mc);
      }
      
      private function showPetIcon(info:GroupFightPetInfo) : void
      {
         var _icon:MLoadPane;
         var bitmap:Bitmap;
         var _showMc:MovieClip = null;
         if(this._petMC.numChildren > 1)
         {
            this._petMC.removeChildAt(1);
         }
         _showMc = PetAssetsManager.getInstance().getAssetsByID(info.petID);
         _showMc.gotoAndStop(1);
         _showMc.addEventListener(Event.ENTER_FRAME,function():void
         {
            var mc:MovieClip = _showMc.getChildAt(0) as MovieClip;
            if(Boolean(mc))
            {
               mc.gotoAndStop(1);
               _showMc.removeEventListener(Event.ENTER_FRAME,arguments.callee);
            }
         });
         _icon = new MLoadPane(_showMc);
         if(_showMc.width > _showMc.height)
         {
            _icon.fitType = MLoadPane.FIT_WIDTH;
         }
         else
         {
            _icon.fitType = MLoadPane.FIT_HEIGHT;
         }
         _icon.setSizeWH(this._petMC.width,this._petMC.height);
         bitmap = DisplayUtil.copyDisplayAsBmp(_icon);
         this._petMC.addChildAt(bitmap,1);
      }
   }
}

