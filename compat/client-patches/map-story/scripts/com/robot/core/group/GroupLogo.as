package com.robot.core.group
{
   import com.robot.core.event.RobotEvent;
   import com.robot.core.group.info.GroupInfo;
   import com.robot.app.group.GroupUiLinkage;
   import com.robot.core.mode.BasePeoleModel;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.filters.GlowFilter;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupLogo extends Sprite
   {
      
      private var _model:BasePeoleModel;
      
      private var _info:GroupInfo;
      
      private var _icon:MovieClip;
      
      private var _txt:TextField;
      
      public function GroupLogo(param1:BasePeoleModel)
      {
         super();
         this._model = param1;
      }
      
      public function destroy() : void
      {
         DisplayUtil.removeAllChild(this);
         this._model.removeEventListener(RobotEvent.WALK_START,this.onStartWalk);
         this._model.removeEventListener(RobotEvent.WALK_END,this.onEndWalk);
      }
      
      public function set info(param1:GroupInfo) : void
      {
         var _loc2_:TextFormat = null;
         DisplayUtil.removeAllChild(this);
         this._info = param1;
         if(this._info.leaderID == 0)
         {
            return;
         }
         if(!this._icon)
         {
            if(Boolean(this._model.info.vip))
            {
               this._icon = GroupUiLinkage.getMovieClip("GroupLeaderVipIcon");
            }
            else
            {
               this._icon = GroupUiLinkage.getMovieClip("GroupLeaderIcon");
            }
         }
         if(this._info.groupName.length == 0)
         {
         }
         if(!this._txt)
         {
            _loc2_ = new TextFormat();
            _loc2_.align = TextFormatAlign.LEFT;
            this._txt = new TextField();
            this._txt.defaultTextFormat = _loc2_;
            this._txt.textColor = 16777215;
         }
         if(Boolean(this._model.info.vip))
         {
            this._txt.htmlText = "<font color=\'#ff0000\'>" + this._info.groupName + "</font>";
         }
         else
         {
            this._txt.htmlText = this._info.groupName;
         }
         this.addChild(this._icon);
         this.addChild(this._txt);
         this._txt.x = this._icon.width - 3;
         this._txt.y = -14;
         this._txt.filters = [new GlowFilter(16776960,1,3,3)];
         this._txt.mouseEnabled = false;
         this._model.addEventListener(RobotEvent.WALK_START,this.onStartWalk);
         this._model.addEventListener(RobotEvent.WALK_END,this.onEndWalk);
      }
      
      private function onStartWalk(param1:RobotEvent) : void
      {
         this._icon.gotoAndStop(2);
      }
      
      private function onEndWalk(param1:RobotEvent) : void
      {
         this._icon.gotoAndStop(1);
      }
   }
}

