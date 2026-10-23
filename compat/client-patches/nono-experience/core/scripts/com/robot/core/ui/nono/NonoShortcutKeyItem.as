package com.robot.core.ui.nono
{
   import com.robot.core.manager.NonoManager;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;
   import org.taomee.utils.Utils;
   
   public class NonoShortcutKeyItem extends Sprite
   {
      
      private var _id:String;
      
      private var _icon:SimpleButton;
      
      private var _handler:Function;
      
      private var _tips:String;
      private var _resource:String;
      private var _badge:Sprite;
      
      public function NonoShortcutKeyItem()
      {
         super();
      }
      
      public function setInfo(param1:String, param2:String, param3:Function = null) : void
      {
         this.destroy();
         this._id = param1;
         this._tips = param2;
         this._handler = param3;
         this._resource = "resource/nono/shortcutKey/" + (param1.indexOf("qx_") == 0 ? "1" : param1) + ".swf";
         ResourceManager.getResource(this._resource,this.onComHandler);
      }
      
      private function onComHandler(param1:DisplayObject) : void
      {
         if(Boolean(param1))
         {
            this._icon = param1 as SimpleButton;
            this.addChild(this._icon);
            this._icon.x = this._icon.width / 2;
            this._icon.y = this._icon.height / 2;
            ToolTipManager.add(this._icon,this._tips);
            this._icon.addEventListener(MouseEvent.CLICK,this.onIconClickHandler);
            if(this._id.indexOf("qx_") == 0) this.drawServiceIcon();
         }
      }
      
      private function onIconClickHandler(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var cls:Class = null;
         if(uint(this._id) == 2)
         {
            if(Boolean(NonoManager.info.func[4]) || NonoManager.info.superNono)
            {
               if(this._handler != null)
               {
                  this._handler();
               }
            }
            else
            {
               Alarm.show("你的NoNo还没有开通这个功能哦!");
            }
         }
         else if(this._handler != null)
         {
            this._handler();
            if(this._id.indexOf("qx_") == 0) return;
         }
         try
         {
            cls = Utils.getClass("com.robot.app.nono.featureApp.App_" + this._id);
            if(Boolean(cls))
            {
               new cls(uint(this._id));
            }
         }
         catch(e:Error)
         {
         }
      }

      private function drawServiceIcon():void
      {
         // Retain the original NONO button's halo, rollover and pressed states.
         this._badge = new Sprite();
         this._badge.mouseEnabled = false;
         this._badge.mouseChildren = false;
         this._badge.x = this._icon.x;
         this._badge.y = this._icon.y;
         addChild(this._badge);
         var g:flash.display.Graphics = this._badge.graphics;
         g.beginFill(0xC2E9F4);
         g.drawCircle(0,0,10.5);
         g.endFill();
         g.lineStyle(1.5,0x274E65);
         g.beginFill(0xFFFFFF);
         if(this._id == "qx_skills")
         {
            g.moveTo(-8,-6);g.lineTo(-2,-7);g.lineTo(0,-5);g.lineTo(2,-7);g.lineTo(8,-6);g.lineTo(8,6);g.lineTo(2,5);g.lineTo(0,7);g.lineTo(-2,5);g.lineTo(-8,6);g.lineTo(-8,-6);
            g.moveTo(0,-5);g.lineTo(0,7);
         }
         else if(this._id == "qx_shop")
         {
            g.drawRoundRect(-7,-4,14,12,3);
            g.endFill();g.moveTo(-3,-4);g.lineTo(-3,-7);g.lineTo(3,-7);g.lineTo(3,-4);
         }
         else if(this._id == "qx_teams")
         {
            g.drawCircle(0,-5,3);g.drawCircle(-6,0,2.5);g.drawCircle(6,0,2.5);
            g.drawRoundRect(-4,0,8,8,4);g.drawRoundRect(-9,4,4,4,2);g.drawRoundRect(5,4,4,4,2);
         }
         else if(this._id == "qx_speed")
         {
            g.moveTo(-8,-7);g.lineTo(0,0);g.lineTo(-8,7);g.lineTo(-8,-7);
            g.moveTo(0,-7);g.lineTo(8,0);g.lineTo(0,7);g.lineTo(0,-7);
         }
         else if(this._id == "qx_back")
         {
            g.moveTo(-8,0);g.lineTo(0,-7);g.lineTo(0,-3);g.lineTo(8,-3);g.lineTo(8,4);g.lineTo(0,4);g.lineTo(0,8);g.lineTo(-8,0);
         }
         else
         {
            g.drawCircle(0,0,6);g.endFill();
            for(var i:int=0;i<8;i++)
            {
               var angle:Number = i * Math.PI / 4;
               g.moveTo(Math.cos(angle)*6,Math.sin(angle)*6);
               g.lineTo(Math.cos(angle)*9,Math.sin(angle)*9);
            }
            g.beginFill(0x55A7C4);g.drawCircle(0,0,2.5);
         }
         g.endFill();
      }
      
      public function destroy() : void
      {
         if(this._resource != null)
         {
            ResourceManager.cancel(this._resource,this.onComHandler);
            this._resource = null;
         }
         if(this._badge != null)
         {
            DisplayUtil.removeForParent(this._badge);
            this._badge = null;
         }
         if(Boolean(this._icon))
         {
            ToolTipManager.remove(this._icon);
            this._icon.removeEventListener(MouseEvent.CLICK,this.onIconClickHandler);
            DisplayUtil.removeForParent(this._icon);
            this._icon = null;
         }
      }
   }
}

