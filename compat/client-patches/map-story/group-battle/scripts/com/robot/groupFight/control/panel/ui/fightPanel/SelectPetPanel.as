package com.robot.groupFight.control.panel.ui.fightPanel
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.pet.PetSkillInfo;
   import com.robot.core.manager.UIManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.display.Bitmap;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.filters.DropShadowFilter;
   import flash.filters.GlowFilter;
   import gs.TweenLite;
   import gs.easing.Circ;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ResourceManager;
   import org.taomee.utils.DisplayUtil;
   
   public class SelectPetPanel extends BaseControlPanel implements IAutoActionPanel
   {
      
      private var replaceBtn:SimpleButton;
      
      private var index:uint = 0;
      
      private var lastTime:uint;
      
      private var currentTime:uint;
      
      private var petIconArray:Array = [];
      private var generation:uint;
      
      private var blueGlowFilter:GlowFilter = new GlowFilter(438748,1,3,3,20);
      
      private var yellowGlowFilter:GlowFilter = new GlowFilter(16776960,1,8,8,20);
      
      private var dropShadow:DropShadowFilter = new DropShadowFilter(3,45,0,0.6);
      
      private var mode:BaseGroupFighterModel;
      
      public function SelectPetPanel()
      {
         super();
         _panel = new ui_gp_PetChangePanel();
         this.replaceBtn = panel["okBtn"];
         this.replaceBtn.addEventListener(MouseEvent.CLICK,this.clickHandler);
         this.currentTime = FighterModelFactory.playerMode.info.catchTime;
         this.lastTime = this.currentTime;
         this.initPanel();
      }
      
      override public function destroy() : void
      {
         ++this.generation;
         this.replaceBtn.removeEventListener(MouseEvent.CLICK,this.clickHandler);
         for each(var icon:MovieClip in this.petIconArray)
         {
            TweenLite.killTweensOf(icon);
            icon.removeEventListener(MouseEvent.CLICK,this.showPet);
         }
         this.replaceBtn = null;
         this.petIconArray = [];
         super.destroy();
      }
      
      override public function show() : void
      {
         super.show();
         this.initPanel();
      }
      
      public function auto() : void
      {
         if(FighterPetInfoFactory.checkIsPetAllDie() != 0)
         {
            this.currentTime = FighterPetInfoFactory.checkIsPetAllDie();
            this.clickHandler(null);
         }
      }
      
      private function initPanel() : void
      {
         var icon:MovieClip = null;
         var array:Array = null;
         var count:uint = 0;
         var i:uint = 0;
         var sprite:MovieClip = null;
         ++this.generation;
         this.index = 0;
         for each(icon in this.petIconArray)
         {
            TweenLite.killTweensOf(icon);
            icon.removeEventListener(MouseEvent.CLICK,this.showPet);
            DisplayUtil.removeAllChild(icon);
            DisplayUtil.removeForParent(icon);
         }
         this.petIconArray = [];
         array = FighterPetInfoFactory.gfUserInfo.monInfoMap.getKeys();
         count = 0;
         for each(i in array)
         {
            sprite = new ui_PetIconMC();
            sprite.cacheAsBitmap = true;
            sprite.buttonMode = true;
            sprite.catchTime = i;
            sprite.x = 156 + 36 * count;
            sprite.y = 8;
            panel.addChild(sprite);
            this.petIconArray.push(sprite);
            if(i == this.currentTime)
            {
               sprite.filters = [this.yellowGlowFilter,this.dropShadow];
               sprite.scaleX = sprite.scaleY = 1.2;
            }
            else
            {
               sprite.filters = [this.blueGlowFilter,this.dropShadow];
               sprite.scaleX = sprite.scaleY = 0.8;
            }
            sprite.addEventListener(MouseEvent.CLICK,this.showPet);
            count++;
         }
         this.loadPetIcon();
         this.showPet();
      }
      
      private function loadPetIcon() : void
      {
         var url:String;
         var capT:uint = 0;
         var id:uint = 0;
         if(this.index == this.petIconArray.length)
         {
            return;
         }
         capT = uint(FighterPetInfoFactory.gfUserInfo.monInfoMap.getKeys()[this.index]);
         id = uint(FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(capT).id);
         url = ClientConfig.getPetSwfPath(id);
         var requestedGeneration:uint = this.generation;
         ResourceManager.getResource(url,function(dis:DisplayObject):void
         {
            if(panel == null || requestedGeneration != generation) return;
            var bitmap:Bitmap;
            var _showMc:MovieClip = null;
            _showMc = dis as MovieClip;
            if(Boolean(_showMc))
            {
               _showMc.gotoAndStop("rightdown");
               _showMc.addEventListener(Event.ENTER_FRAME,function():void
               {
                  var mc:MovieClip = _showMc.getChildAt(0) as MovieClip;
                  if(Boolean(mc))
                  {
                     mc.gotoAndStop(1);
                     _showMc.removeEventListener(Event.ENTER_FRAME,arguments.callee);
                  }
               });
            }
            bitmap = DisplayUtil.copyDisplayAsBmp(_showMc);
            Sprite(petIconArray[index]["iconMC"]).addChild(bitmap);
            ++index;
            loadPetIcon();
         },"pet");
      }
      
      private function showPet(event:MouseEvent = null) : void
      {
         var time:uint = 0;
         var id:uint = 0;
         var info:PetInfo = null;
         var skillInfo:PetSkillInfo = null;
         var mc:MovieClip = null;
         var skillMC:MovieClip = null;
         var damageNum:uint = 0;
         var typeID:uint = 0;
         var skillIcon:SimpleButton = null;
         this.clearSkillBtn();
         if(Boolean(event))
         {
            mc = event.currentTarget as MovieClip;
            time = uint(mc.catchTime);
            this.tweenPetIcon(mc);
         }
         else
         {
            time = this.currentTime;
         }
         info = FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(time);
         this.currentTime = time;
         panel["name_txt"].text = PetXMLInfo.getName(info.id);
         panel["level_txt"].text = "LV：" + info.level;
         panel["hp_txt"].text = info.hp + "/" + info.maxHp;
         panel["hpMC"].width = 110 * (info.hp / info.maxHp);
         var num:uint = 0;
         if(info.hp <= 0)
         {
            this.replaceBtn.mouseEnabled = false;
            this.replaceBtn.alpha = 0.5;
            this.replaceBtn.filters = [ColorFilter.setGrayscale()];
         }
         else
         {
            this.replaceBtn.mouseEnabled = true;
            this.replaceBtn.alpha = 1;
            this.replaceBtn.filters = [];
         }
         var skills:Array = info.skillArray;
         var count:uint = 0;
         for each(skillInfo in skills)
         {
            if(skillInfo.id != 0)
            {
               skillMC = panel["skillMc_" + count];
               skillMC["nameTxt"].text = skillInfo.name;
               damageNum = uint(SkillXMLInfo.getDamage(skillInfo.id));
               skillMC["migTxt"].text = "威力:" + damageNum.toString();
               skillMC["ppTxt"].text = "PP" + skillInfo.pp + "/" + skillInfo.maxPP;
               typeID = uint(SkillXMLInfo.getTypeID(skillInfo.id));
               skillIcon = UIManager.getButton("Icon_PetType_" + typeID);
               if(SkillXMLInfo.getCategory(skillInfo.id) == 4)
               {
                  skillIcon = UIManager.getButton("Icon_PetType_prop");
               }
               if(Boolean(skillIcon))
               {
                  DisplayUtil.removeAllChild(skillMC["iconMC"]);
                  skillMC["iconMC"].addChild(skillIcon);
               }
               count++;
            }
         }
      }
      
      private function tweenPetIcon(mc:MovieClip) : void
      {
         var i:MovieClip = null;
         for each(i in this.petIconArray)
         {
            if(i == mc)
            {
               TweenLite.to(i,0.3,{
                  "scaleX":1.5,
                  "scaleY":1.5,
                  "ease":Circ.easeOut
               });
               i.filters = [this.yellowGlowFilter,this.dropShadow];
            }
            else
            {
               TweenLite.to(i,0.3,{
                  "scaleX":0.8,
                  "scaleY":0.8,
                  "ease":Circ.easeOut
               });
               i.filters = [this.blueGlowFilter,this.dropShadow];
            }
         }
      }
      
      private function clickHandler(event:MouseEvent) : void
      {
         trace("上只精灵====" + this.lastTime);
         trace("开始换精灵====" + this.currentTime);
         if(this.lastTime != this.currentTime)
         {
            SocketConnection.send(CommandID.GROUP_FT_CHG_PET,this.currentTime);
         }
         this.lastTime = this.currentTime;
      }
      
      private function clearSkillBtn() : void
      {
         var skillMC:MovieClip = null;
         for(var i:uint = 0; i < 4; i++)
         {
            skillMC = panel["skillMc_" + i];
            skillMC["nameTxt"].text = "";
            skillMC["ppTxt"].text = "";
            skillMC["iconMC"].gotoAndStop(1);
         }
      }
   }
}

