package com.robot.core.ui.nono
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.UIManager;
   import flash.display.DisplayObject;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.geom.Rectangle;
   import flash.net.SharedObject;
   import flash.text.TextField;
   import flash.text.TextFieldType;
   import flash.text.TextFormat;

   public class PetWorkflowUI extends Sprite
   {
      public var body:Sprite;
      public var status:TextField;
      public var disposed:Boolean = false;
      private var closed:Function;
      private var closeButton:SimpleButton;

      public function PetWorkflowUI(title:String, onClose:Function)
      {
         super();
         closed = onClose;
         var frame:Sprite = UIManager.getSprite("Panel_Background");
         frame.scale9Grid = new Rectangle(40,40,frame.width - 80,frame.height - 80);
         frame.width = 760;
         frame.height = 480;
         addChild(frame);
         var titleBar:Sprite = UIManager.getSprite("Panel_TitleBar");
         if(titleBar)
         {
            titleBar.x = 28;
            titleBar.y = 10;
            titleBar.width = 704;
            titleBar.mouseEnabled = false;
            titleBar.mouseChildren = false;
            addChild(titleBar);
         }
         var innerBg:Sprite = new Sprite();
         innerBg.graphics.lineStyle(1,3644614,0.85);
         innerBg.graphics.beginFill(598358,0.55);
         innerBg.graphics.drawRoundRect(46,60,668,362,12,12);
         innerBg.graphics.endFill();
         innerBg.mouseEnabled = false;
         innerBg.mouseChildren = false;
         addChild(innerBg);
         var heading:TextField = text(this,title,60,17,640,32,20,true);
         heading.filters = [new GlowFilter(676487,0.9,4,4,10)];
         closeButton = UIManager.getButton("Close_Btn");
         closeButton.x = 704;
         closeButton.y = 18;
         closeButton.width = 26;
         closeButton.height = 26;
         closeButton.addEventListener(MouseEvent.CLICK,onCloseClick);
         addChild(closeButton);
         body = new Sprite();
         body.x = 60;
         body.y = 68;
         body.scaleX = body.scaleY = 0.92;
         addChild(body);
         status = text(this,"",60,430,640,38,12,false);
         status.textColor = 16772529;
         status.multiline = true;
         status.wordWrap = true;
         LevelManager.appLevel.addChild(this);
         x = Math.round((960 - 760) / 2);
         y = Math.round((560 - 480) / 2);
      }

      private function onCloseClick(event:MouseEvent) : void
      {
         close();
      }

      public function close() : void
      {
         if(disposed)
         {
            return;
         }
         disposed = true;
         closeButton.removeEventListener(MouseEvent.CLICK,onCloseClick);
         if(parent)
         {
            parent.removeChild(this);
         }
         if(closed != null)
         {
            closed();
         }
      }

      public function clear() : void
      {
         while(body.numChildren)
         {
            body.removeChildAt(0);
         }
      }

      public function message(value:String) : void
      {
         status.text = value;
      }

      public static function text(parent:Sprite, value:String, x:Number, y:Number, w:Number, h:Number, size:int = 13, bold:Boolean = false) : TextField
      {
         var field:TextField = new TextField();
         field.defaultTextFormat = new TextFormat("宋体",size,16777215,bold);
         field.x = x;
         field.y = y;
         field.width = w;
         field.height = h;
         field.text = value;
         field.selectable = false;
         field.mouseEnabled = false;
         field.filters = [new GlowFilter(668267,0.85,3,3,4)];
         parent.addChild(field);
         return field;
      }

      public static function input(parent:Sprite, value:String, x:Number, y:Number, w:Number, numeric:Boolean = false) : TextField
      {
         var field:TextField = new TextField();
         field.defaultTextFormat = new TextFormat("宋体",14,1326945,true);
         field.x = x;
         field.y = y;
         field.width = w;
         field.height = 27;
         field.text = value;
         field.setTextFormat(field.defaultTextFormat);
         field.type = TextFieldType.INPUT;
         field.selectable = true;
         field.mouseEnabled = true;
         field.border = true;
         field.borderColor = 6208471;
         field.background = true;
         field.backgroundColor = 15268095;
         field.maxChars = numeric ? 5 : 30;
         if(numeric)
         {
            field.restrict = "0-9";
         }
         parent.addChild(field);
         return field;
      }

      private static function fallbackButtonSkin(w:Number, color:uint) : Sprite
      {
         var skin:Sprite = new Sprite();
         skin.graphics.lineStyle(1,1464198);
         skin.graphics.beginFill(color);
         skin.graphics.drawRoundRect(0,0,w,30,8,8);
         skin.graphics.endFill();
         skin.graphics.lineStyle(1,14546431,0.8);
         skin.graphics.drawRoundRect(2,2,w - 4,26,6,6);
         return skin;
      }

      public static function button(parent:Sprite, value:String, x:Number, y:Number, w:Number, callback:Function, enabled:Boolean = true) : Sprite
      {
         var item:Sprite = new Sprite();
         item.x = x;
         item.y = y;
         parent.addChild(item);
         var up:DisplayObject = UIManager.getDisplayObject("Button_upSkin");
         var over:DisplayObject = UIManager.getDisplayObject("Button_overSkin");
         var down:DisplayObject = UIManager.getDisplayObject("Button_downSkin");
         if(up && over && down)
         {
            up.width = over.width = down.width = w;
            up.height = over.height = down.height = 30;
            item.addChild(new SimpleButton(up,over,down,up));
         }
         else
         {
            item.addChild(new SimpleButton(fallbackButtonSkin(w,1604281),fallbackButtonSkin(w,2726868),fallbackButtonSkin(w,1138324),fallbackButtonSkin(w,1604281)));
         }
         var label:TextField = text(item,value,4,6,w - 8,22,12,true);
         var format:TextFormat = label.defaultTextFormat;
         format.align = "center";
         label.setTextFormat(format);
         item.mouseChildren = false;
         item.mouseEnabled = enabled;
         item.buttonMode = enabled;
         item.alpha = enabled ? 1 : 0.45;
         if(callback != null)
         {
            item.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void
            {
               callback();
            });
         }
         return item;
      }

      public static function loadLocal(key:String, initial:Object) : Object
      {
         try
         {
            var saved:SharedObject = SharedObject.getLocal("seer-workflow-" + MainManager.actorID);
            return saved.data[key] == null ? initial : saved.data[key];
         }
         catch(error:Error)
         {
            return initial;
         }
      }

      public static function saveLocal(key:String, value:Object) : Boolean
      {
         try
         {
            var saved:SharedObject = SharedObject.getLocal("seer-workflow-" + MainManager.actorID);
            saved.data[key] = value;
            return saved.flush() != "pending";
         }
         catch(error:Error)
         {
            return false;
         }
      }
   }
}
