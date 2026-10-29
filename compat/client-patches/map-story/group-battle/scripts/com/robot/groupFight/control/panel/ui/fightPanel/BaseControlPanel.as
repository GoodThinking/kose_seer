package com.robot.groupFight.control.panel.ui.fightPanel
{
   import flash.display.Sprite;
   import flash.events.EventDispatcher;
   import gs.TweenLite;
   import org.taomee.effect.ColorFilter;
   
   public class BaseControlPanel extends EventDispatcher implements IControlPanel
   {
      
      public static const PANEL_HEIGHT:uint = 155;
      
      protected var _panel:Sprite;
      
      public function BaseControlPanel()
      {
         super();
      }
      
      public function destroy() : void
      {
         this._panel = null;
      }
      
      public function get panel() : Sprite
      {
         return this._panel;
      }
      
      public function show() : void
      {
         if(Boolean(this._panel))
         {
            TweenLite.to(this._panel,0.3,{"y":0});
            this.open();
         }
      }
      
      public function hide() : void
      {
         if(Boolean(this._panel))
         {
            TweenLite.to(this._panel,0.3,{"y":PANEL_HEIGHT});
         }
      }
      
      public function open() : void
      {
         if(Boolean(this._panel))
         {
            this._panel.mouseEnabled = true;
            this._panel.mouseChildren = true;
            this._panel.filters = [];
         }
      }
      
      public function close() : void
      {
         if(Boolean(this._panel))
         {
            this._panel.mouseEnabled = false;
            this._panel.mouseChildren = false;
            this._panel.filters = [ColorFilter.setGrayscale()];
         }
      }
   }
}

