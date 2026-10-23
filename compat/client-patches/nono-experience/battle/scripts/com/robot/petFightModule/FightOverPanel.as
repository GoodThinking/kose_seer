package com.robot.petFightModule
{
   import com.robot.app.automaticFight.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.FightOverInfo;
   import com.robot.core.manager.*;
   import flash.display.*;
   import flash.events.*;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class FightOverPanel
   {
      
      private static var bmp:Bitmap;
      
      private static var overData:FightOverInfo;
      
      public function FightOverPanel()
      {
         super();
      }
      
      public static function showLost(param1:Bitmap, param2:FightOverInfo) : void
      {
         if(AutomaticFightManager.isStart)
         {
            AutomaticFightManager.fightOver(param1);
            return;
         }
         overData = param2;
         bmp = param1;
         var _loc3_:MovieClip = new FightLostPanel();
         DisplayUtil.align(_loc3_,null,AlignType.MIDDLE_CENTER);
         MainManager.getStage().addChild(_loc3_);
         var _loc4_:SimpleButton = _loc3_["okBtn"];
         _loc4_.addEventListener(MouseEvent.CLICK,clickHandler);
      }
      
      private static function clickHandler(param1:MouseEvent) : void
      {
         var _loc2_:SimpleButton = param1.currentTarget as SimpleButton;
         DisplayUtil.removeForParent(_loc2_.parent);
         EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.PET_UPDATE_PROP,bmp));
         EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.ALARM_CLICK,overData));
      }
      
      public static function showWin(param1:Bitmap, param2:FightOverInfo) : void
      {
         if(AutomaticFightManager.isStart)
         {
            AutomaticFightManager.fightOver(param1);
            return;
         }
         overData = param2;
         bmp = param1;
         var _loc3_:MovieClip = new FightWinPanel();
         DisplayUtil.align(_loc3_,null,AlignType.MIDDLE_CENTER);
         MainManager.getStage().addChild(_loc3_);
         var _loc4_:SimpleButton = _loc3_["okBtn"];
         if(TaomeeManager.nextTowerMap != 0)
         {
            var template:MovieClip = new FightWinPanel();
            var next:SimpleButton = template["okBtn"];
            next.x = _loc4_.x + 66;
            next.y = _loc4_.y;
            _loc4_.x -= 66;
            _loc3_.addChild(next);
            labelTowerButton(_loc3_,_loc4_,"结束挑战");
            labelTowerButton(_loc3_,next,"继续下一层");
            _loc4_.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void
            {
               TaomeeManager.chooseTower(false);
               clickHandler(event);
            });
            next.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void
            {
               TaomeeManager.chooseTower(true);
               clickHandler(event);
            });
         }
         else _loc4_.addEventListener(MouseEvent.CLICK,clickHandler);
      }

      private static function labelTowerButton(panel:MovieClip,button:SimpleButton,text:String):void
      {
         button.width = 115;
         var bounds:* = button.getBounds(panel);
         var label:TextField = new TextField();
         label.defaultTextFormat = new TextFormat("_sans",14,0xFFFFFF,true,null,null,null,null,"center");
         label.text = text;
         label.background = true;
         label.backgroundColor = 0x167EB7;
         label.width = 100;
         label.height = 22;
         label.x = bounds.x + (bounds.width - label.width) / 2;
         label.y = bounds.y + (bounds.height - label.height) / 2;
         label.mouseEnabled = false;
         panel.addChild(label);
      }
   }
}

