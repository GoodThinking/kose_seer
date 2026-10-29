package com.robot.app.buyCloth
{
   import com.robot.core.event.MCLoadEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.newloader.MCLoader;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.system.ApplicationDomain;
   import org.taomee.utils.DisplayUtil;

   public class BuyClothPanel extends Sprite
   {
      private var app:ApplicationDomain;
      private var _mainUI:MovieClip;
      private var _closeBtn:SimpleButton;
      private var _loader:MCLoader;
      private var _initialFrame:uint;
      private var _toolsOnly:Boolean;
      private var _disposed:Boolean;

      public function BuyClothPanel(path:String = "resource/module/clothBook/clothBook.swf", initialFrame:uint = 1, toolsOnly:Boolean = false)
      {
         super();
         this._initialFrame = initialFrame;
         this._toolsOnly = toolsOnly;
         this._loader = new MCLoader(path,LevelManager.topLevel,1,"正在打开装备列表");
         this._loader.addEventListener(MCLoadEvent.SUCCESS,this.onLoad);
         this._loader.doLoad();
      }

      public function show() : void
      {
         if(this._disposed || !this._mainUI || DisplayUtil.hasParent(this)) return;
         this.configurePage();
         LevelManager.appLevel.addChild(this);
         LevelManager.closeMouseEvent();
      }

      private function configurePage() : void
      {
         var page:MovieClip = this._mainUI["buyPanel"] as MovieClip;
         page.gotoAndStop(this._initialFrame);
         if(this._initialFrame == 1) (page["coverMC"] as MovieClip).stop();
         if(this._toolsOnly)
         {
            page["fowardBtn"].visible = false;
            page["nextBtn"].visible = false;
         }
      }

      public function destroy() : void
      {
         if(this._disposed) return;
         this._disposed = true;
         if(this._loader)
         {
            this._loader.removeEventListener(MCLoadEvent.SUCCESS,this.onLoad);
            this._loader.clear();
            this._loader = null;
         }
         if(this._closeBtn) this._closeBtn.removeEventListener(MouseEvent.CLICK,this.closeHandler);
         if(DisplayUtil.hasParent(this))
         {
            DisplayUtil.removeForParent(this);
            LevelManager.openMouseEvent();
         }
         this._closeBtn = null;
         this._mainUI = null;
         this.app = null;
      }

      private function onLoad(event:MCLoadEvent) : void
      {
         if(this._loader)
         {
            this._loader.removeEventListener(MCLoadEvent.SUCCESS,this.onLoad);
            this._loader = null;
         }
         if(this._disposed) return;
         this.app = event.getApplicationDomain();
         this._mainUI = new (this.app.getDefinition("BookPanel") as Class)() as MovieClip;
         this.configurePage();
         addChild(this._mainUI);
         this.x = 94;
         this.y = 34;
         this._closeBtn = this._mainUI["closeBtn"];
         this._closeBtn.addEventListener(MouseEvent.CLICK,this.closeHandler);
         LevelManager.appLevel.addChild(this);
         LevelManager.closeMouseEvent();
      }

      private function closeHandler(event:MouseEvent) : void
      {
         DisplayUtil.removeForParent(this);
         LevelManager.openMouseEvent();
      }
   }
}
