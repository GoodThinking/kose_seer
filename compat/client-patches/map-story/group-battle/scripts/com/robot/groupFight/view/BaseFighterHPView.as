package com.robot.groupFight.view
{
   import com.robot.core.group.fightInfo.fighting.skill.SkillHurtInfo;
   import flash.display.Sprite;
   import flash.filters.GlowFilter;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import gs.TweenLite;
   import org.taomee.utils.DisplayUtil;
   
   public class BaseFighterHPView extends Sprite
   {
      
      private var lostHp:Number = 0;
      
      private var gainHp:Number = 0;
      
      private var remainHp:Number = 0;
      
      private var tf:TextFormat;
      
      private var tf2:TextFormat;
      
      private var tf3:TextFormat;
      
      public var hpTxt:TextField;
      
      public var gainHpTxt:TextField;
      
      public var changeHpTxt:TextField;
      
      public function BaseFighterHPView()
      {
         super();
         this.tf = new TextFormat();
         this.tf.font = "_sans";
         this.tf.color = 10027008;
         this.tf.size = 20;
         this.tf.bold = true;
         this.tf.align = TextFormatAlign.CENTER;
         this.tf2 = new TextFormat();
         this.tf2.font = "_sans";
         this.tf2.color = 52224;
         this.tf2.size = 20;
         this.tf2.bold = true;
         this.tf2.align = TextFormatAlign.CENTER;
         this.tf3 = new TextFormat();
         this.tf3.font = "_sans";
         this.tf3.color = 16724735;
         this.tf3.size = 20;
         this.tf3.bold = true;
         this.tf3.align = TextFormatAlign.CENTER;
         this.hpTxt = new TextField();
         this.hpTxt.autoSize = TextFieldAutoSize.CENTER;
         this.hpTxt.filters = [new GlowFilter(16776960,1,6,6,5)];
         this.hpTxt.width = 60;
         this.hpTxt.height = 18;
         this.hpTxt.embedFonts = false;
         this.gainHpTxt = new TextField();
         this.gainHpTxt.autoSize = TextFieldAutoSize.CENTER;
         this.gainHpTxt.filters = [new GlowFilter(16776960,1,6,6,5)];
         this.gainHpTxt.width = 60;
         this.gainHpTxt.height = 18;
         this.gainHpTxt.embedFonts = false;
         this.changeHpTxt = new TextField();
         this.changeHpTxt.autoSize = TextFieldAutoSize.CENTER;
         this.changeHpTxt.filters = [new GlowFilter(16777215,1,6,6,5)];
         this.changeHpTxt.width = 60;
         this.changeHpTxt.height = 18;
         this.changeHpTxt.embedFonts = false;
      }
      
      public function destroy() : void
      {
         if(Boolean(this.hpTxt))
         {
            TweenLite.killTweensOf(this.hpTxt);
            DisplayUtil.removeForParent(this.hpTxt);
            this.hpTxt = null;
         }
         if(Boolean(this.gainHpTxt))
         {
            TweenLite.killTweensOf(this.gainHpTxt);
            DisplayUtil.removeForParent(this.gainHpTxt);
            this.gainHpTxt = null;
         }
         if(Boolean(this.changeHpTxt))
         {
            TweenLite.killTweensOf(this.changeHpTxt);
            DisplayUtil.removeForParent(this.changeHpTxt);
            this.changeHpTxt = null;
         }
      }
      
      public function changeTxt(hp:int) : void
      {
         if(hp != 0)
         {
            this.changeHpTxt.x = -this.changeHpTxt.width / 2;
            this.changeHpTxt.y = -10;
            if(hp > 0)
            {
               this.changeHpTxt.text = "+" + hp.toString();
            }
            else
            {
               this.changeHpTxt.text = hp.toString();
            }
            this.changeHpTxt.setTextFormat(this.tf3);
            this.addChild(this.changeHpTxt);
            this.txtAnimate(this.changeHpTxt);
         }
      }
      
      public function hurtHpTxt(info:SkillHurtInfo) : void
      {
         var dmg:int = 0;
         if(Boolean(this.hpTxt))
         {
            this.hpTxt.x = -this.hpTxt.width / 2;
            this.hpTxt.y = -10;
         }
         if(info.atkTimes == 0)
         {
            this.hpTxt.text = "MISS";
         }
         else
         {
            dmg = int(info.dmg);
            if(dmg == 0)
            {
               return;
            }
            if(dmg >= 0)
            {
               this.hpTxt.text = info.effectName + "-" + dmg;
            }
            else
            {
               this.hpTxt.text = "+" + dmg;
            }
         }
         this.hpTxt.setTextFormat(this.tf);
         this.addChild(this.hpTxt);
         this.txtAnimate(this.hpTxt);
      }
      
      public function gainTxt(gainHp:uint) : void
      {
         if(Boolean(this.gainHpTxt))
         {
            this.gainHpTxt.x = -this.gainHpTxt.width / 2;
            this.gainHpTxt.y = -10;
         }
         if(gainHp >= 0)
         {
            this.gainHpTxt.text = "+" + gainHp.toString();
            this.gainHpTxt.setTextFormat(this.tf2);
         }
         else
         {
            this.gainHpTxt.text = gainHp.toString();
            this.gainHpTxt.setTextFormat(this.tf);
         }
         this.addChild(this.gainHpTxt);
         this.txtAnimate(this.gainHpTxt);
      }
      
      private function txtAnimate(txt:TextField) : void
      {
         TweenLite.to(txt,2,{
            "y":-30,
            "onComplete":this.onTweenComplete,
            "onCompleteParams":[txt]
         });
      }
      
      private function onTweenComplete(txt:TextField) : void
      {
         DisplayUtil.removeForParent(txt);
      }
   }
}

