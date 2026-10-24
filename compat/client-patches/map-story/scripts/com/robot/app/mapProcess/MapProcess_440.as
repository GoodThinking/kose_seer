package com.robot.app.mapProcess
{
   import com.robot.app.task.control.*;
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.ui.alert.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import org.taomee.manager.*;
   
   public class MapProcess_440 extends BaseMapProcess
   {
      
      private var _errorArrow:int;
      
      private var _errorPassWord:int;
      
      private var _map:BaseMapProcess;
      
      private var _notice:AppModel;
      
      public function MapProcess_440()
      {
         super();
      }
      
      override protected function init() : void
      {
         this._map = this;
         conLevel["notice"].addEventListener(MouseEvent.CLICK,this.onNoticeClick);
         conLevel["arrow"]["arrow_3"].gotoAndStop(3);
         conLevel["arrow"]["arrow_4"].gotoAndStop(3);
         ToolTipManager.add(conLevel["arrow"],"机械装置");
         conLevel["arrow"].buttonMode = true;
         conLevel["arrow"].addEventListener(MouseEvent.CLICK,this.onArrowClick);
         ToolTipManager.add(conLevel["passWord"],"密码装置");
         conLevel["passWord"].buttonMode = true;
         conLevel["passWord"].addEventListener(MouseEvent.CLICK,this.onPassWordClick);
         topLevel["num"].visible = false;
         topLevel["input"].visible = false;
         topLevel["close"].visible = false;
         topLevel["input"].buttonMode = true;
         topLevel["input"].addEventListener(MouseEvent.CLICK,this.onInputClick);
         topLevel["close"].addEventListener(MouseEvent.CLICK,this.onCloseClick);
         topLevel["inputUI"].visible = false;
         var map:MapProcess_440 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task540.initTask_1(map);
         },this);
      }
      
      private function onNoticeClick(param1:MouseEvent) : void
      {
         if(!this._notice)
         {
            this._notice = new AppModel(ClientConfig.getAppModule("TaskIntro_540"),"正在加载面板");
            this._notice.setup();
         }
         this._notice.show();
      }
      
      private function onArrowClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ++this._errorArrow;
         if(this._errorArrow == 8)
         {
            conLevel["arrow"].visible = false;
            ToolTipManager.remove(conLevel["arrow"]);
            conLevel["arrow"].buttonMode = false;
            conLevel["arrow"].removeEventListener(MouseEvent.CLICK,this.onArrowClick);
            ToolTipManager.remove(conLevel["passWord"]);
            conLevel["passWord"].buttonMode = false;
            conLevel["passWord"].removeEventListener(MouseEvent.CLICK,this.onPassWordClick);
            AnimateManager.playMcAnimate(conLevel["control"],2,"mc",function():void
            {
               Task540.onActiveComplete(_map);
            });
         }
         else if(this._errorArrow < 8)
         {
            switch(e.target.name)
            {
               case "arrow_1":
                  this.gotoNextFrame(conLevel["arrow"]["arrow_1"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_2"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_3"]);
                  break;
               case "arrow_2":
                  this.gotoNextFrame(conLevel["arrow"]["arrow_1"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_2"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_4"]);
                  break;
               case "arrow_3":
                  this.gotoNextFrame(conLevel["arrow"]["arrow_1"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_3"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_4"]);
                  break;
               case "arrow_4":
                  this.gotoNextFrame(conLevel["arrow"]["arrow_2"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_3"]);
                  this.gotoNextFrame(conLevel["arrow"]["arrow_4"]);
            }
            if(conLevel["arrow"]["arrow_1"].currentFrame == 3 && conLevel["arrow"]["arrow_2"].currentFrame == 3 && conLevel["arrow"]["arrow_3"].currentFrame == 1 && conLevel["arrow"]["arrow_4"].currentFrame == 1)
            {
               Task540.onActiveComplete(this);
               conLevel["arrow"].removeEventListener(MouseEvent.CLICK,this.onArrowClick);
               conLevel["passWord"].removeEventListener(MouseEvent.CLICK,this.onPassWordClick);
            }
         }
      }
      
      private function onPassWordClick(param1:MouseEvent) : void
      {
         if(!topLevel["input"].visible)
         {
            conLevel.mouseEnabled = false;
            conLevel.mouseChildren = false;
            topLevel["num"].visible = true;
            topLevel["input"].visible = true;
            topLevel["close"].visible = true;
            topLevel["inputUI"].visible = true;
         }
      }
      
      private function onCloseClick(param1:MouseEvent) : void
      {
         conLevel.mouseEnabled = true;
         conLevel.mouseChildren = true;
         topLevel["num"].text = "";
         topLevel["num"].visible = false;
         topLevel["input"].visible = false;
         topLevel["close"].visible = false;
         topLevel["inputUI"].visible = false;
      }
      
      private function onInputClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var s:String = e.target.name;
         if(s == "ok")
         {
            if(topLevel["num"].text == "")
            {
               return;
            }
            if(topLevel["num"].text == "4632")
            {
               Task540.onActiveComplete(this._map);
               conLevel["arrow"].removeEventListener(MouseEvent.CLICK,this.onArrowClick);
               conLevel["passWord"].removeEventListener(MouseEvent.CLICK,this.onPassWordClick);
            }
            else
            {
               ++this._errorPassWord;
               if(this._errorPassWord == 3)
               {
                  conLevel["arrow"].visible = false;
                  ToolTipManager.remove(conLevel["arrow"]);
                  conLevel["arrow"].buttonMode = false;
                  conLevel["arrow"].removeEventListener(MouseEvent.CLICK,this.onArrowClick);
                  ToolTipManager.remove(conLevel["passWord"]);
                  conLevel["passWord"].buttonMode = false;
                  conLevel["passWord"].removeEventListener(MouseEvent.CLICK,this.onPassWordClick);
                  AnimateManager.playMcAnimate(conLevel["control"],2,"mc",function():void
                  {
                     Task540.onActiveComplete(_map);
                  });
               }
               else if(this._errorPassWord < 3)
               {
                  SimpleAlarm.show("密码错误！",true);
               }
            }
            this.onCloseClick(null);
         }
         else if(s == "cancel")
         {
            topLevel["num"].text = "";
         }
         else
         {
            topLevel["num"].text += s.split("_")[1];
         }
      }
      
      private function gotoNextFrame(param1:MovieClip) : void
      {
         if(param1.currentFrame == param1.totalFrames)
         {
            param1.gotoAndStop(1);
         }
         else
         {
            param1.gotoAndStop(param1.currentFrame + 1);
         }
      }
      
      override public function destroy() : void
      {
         Task540.destroy(this);
         conLevel["notice"].removeEventListener(MouseEvent.CLICK,this.onNoticeClick);
         ToolTipManager.remove(conLevel["arrow"]);
         conLevel["arrow"].removeEventListener(MouseEvent.CLICK,this.onArrowClick);
         ToolTipManager.remove(conLevel["passWord"]);
         conLevel["passWord"].removeEventListener(MouseEvent.CLICK,this.onPassWordClick);
         topLevel["input"].removeEventListener(MouseEvent.CLICK,this.onInputClick);
         topLevel["close"].removeEventListener(MouseEvent.CLICK,this.onCloseClick);
         if(this._notice) this._notice.destroy();
      }
   }
}

