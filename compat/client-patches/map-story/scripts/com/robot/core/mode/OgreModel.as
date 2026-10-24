package com.robot.core.mode
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.MovesLangXMLInfo;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.manager.*;
   import com.robot.core.net.SocketConnection;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.media.*;
   import flash.net.*;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import flash.utils.clearInterval;
   import flash.utils.clearTimeout;
   import flash.utils.setInterval;
   import flash.utils.setTimeout;
   import gs.TweenLite;
   import gs.easing.Back;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.*;
   import org.taomee.utils.DisplayUtil;
   import org.taomee.utils.MathUtil;
   import org.taomee.utils.MovieClipUtil;
   
   public class OgreModel extends BobyModel
   {
      private static var _previewTimer:uint;
      
      private static var _previewTimeout:uint;
      
      private static var _previews:Array = [];
      
      private static var _previewData:Object = {};
      
      public static var isShow:Boolean = true;

      public var isAutoTalk:Boolean = true;

      private var _isPurseFlag:Boolean = false;
      
      private var _id:uint;
      
      private var _index:uint;
      
      private var _obj:MovieClip;
      
      private var _dialogTime:uint;
      
      private const PATH_STR:String = "resource/pet/sound/";
      
      private var idList:Array = [1,4,7,19,27,53,59,62,65,102,108,122,133,143,164,203,217,219,237,240,254,269,281,284,378,422,482,509,580,588];
      
      private var _sound:Sound;
      
      private var _hint:TextField;
      
      public function OgreModel(param1:uint)
      {
         super();
         _speed = 2;
         mouseEnabled = false;
         this._index = param1;
      }
      
      private static function requestPreview() : void
      {
         SocketConnection.removeCmdListener(91004,onPreview);
         SocketConnection.addCmdListener(91004,onPreview);
         clearTimeout(_previewTimeout);
         _previewTimeout = setTimeout(function():void
         {
            SocketConnection.removeCmdListener(91004,onPreview);
         },8000);
         SocketConnection.send(91004,MapManager.currentMap.id);
      }
      
      private static function onPreview(event:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(91004,onPreview);
         clearTimeout(_previewTimeout);
         var bytes:ByteArray = event.data as ByteArray;
         if(bytes == null || bytes.bytesAvailable < 8)
         {
            return;
         }
         var map:uint = bytes.readUnsignedInt();
         var count:uint = bytes.readUnsignedInt();
         if(map != MapManager.currentMap.id || count > 9 || bytes.bytesAvailable != count * 24)
         {
            return;
         }
         _previewData = {};
         var i:uint = 0;
         while(i < count)
         {
            var slot:uint = bytes.readUnsignedInt();
            _previewData[slot] = {
               "id":bytes.readUnsignedInt(),
               "shiny":bytes.readUnsignedInt(),
               "min":bytes.readUnsignedInt(),
               "max":bytes.readUnsignedInt(),
               "owned":bytes.readUnsignedInt()
            };
            i++;
         }
         for each(var model:OgreModel in _previews)
         {
            model.updatePreview();
         }
      }
      
      private function updatePreview() : void
      {
         if(this._obj == null)
         {
            return;
         }
         var detail:Object = _previewData[this._index];
         var tip:String = PetXMLInfo.getName(this._id);
         if(detail != null && detail.id == this._id)
         {
            if(detail.min > 0)
            {
               tip += "\n等级：" + detail.min + (detail.min == detail.max ? "" : "–" + detail.max);
            }
            tip += detail.owned == 1 ? "\n已收集" : "\n尚未收集";
            if(this._hint == null)
            {
               this._hint = new TextField();
               this._hint.mouseEnabled = false;
               this._hint.width = 100;
               this._hint.height = 18;
               this._hint.x = -50;
               addChild(this._hint);
            }
            this._hint.defaultTextFormat = new TextFormat("_sans",11,detail.shiny > 0 ? 16764742 : 10024447,true,null,null,null,null,"center");
            this._hint.text = (detail.shiny > 0 ? "闪光 " : "") + (detail.owned == 1 ? "" : "未收集");
            this._hint.y = -this._obj.height - 16;
         }
         ToolTipManager.remove(this._obj);
         ToolTipManager.add(this._obj,tip);
      }
      
      override public function get width() : Number
      {
         if(Boolean(this._obj))
         {
            return this._obj.width;
         }
         return super.width;
      }
      
      override public function get height() : Number
      {
         if(Boolean(this._obj))
         {
            return this._obj.height;
         }
         return super.height;
      }
      
      public function get id() : uint
      {
         return this._id;
      }
      
      public function get index() : uint
      {
         return this._index;
      }

      public function get isPurseFlag() : Boolean
      {
         return this._isPurseFlag;
      }

      public function set isPurseFlag(value:Boolean) : void
      {
         this._isPurseFlag = value;
         if(value)
         {
            clearInterval(this._autoInvTime);
            this._autoInvTime = setInterval(this.onPursueWalk,MathUtil.randomHalfAdd(5000));
         }
         else
         {
            stopAutoWalk(true);
         }
      }

      private function onPursueWalk() : void
      {
         if(MapManager.isInMap && Boolean(this._walk))
         {
            this._walk.execute(this,new Point(MainManager.actorModel.x,MainManager.actorModel.y),false);
         }
      }
      
      override public function set direction(param1:String) : void
      {
         if(param1 == null || param1 == "")
         {
            return;
         }
         if(Boolean(this._obj))
         {
            this._obj.gotoAndStop(param1);
         }
      }
      
      override public function get centerPoint() : Point
      {
         _centerPoint.x = x;
         _centerPoint.y = y - 10;
         return _centerPoint;
      }
      
      override public function get hitRect() : Rectangle
      {
         _hitRect.x = x - this.width / 2;
         _hitRect.y = y - this.height;
         _hitRect.width = this.width;
         _hitRect.height = this.height;
         return _hitRect;
      }
      
      public function show(param1:uint, param2:Point) : void
      {
         if(Boolean(this._obj))
         {
            return;
         }
         this._id = param1;
         if(_previews.indexOf(this) < 0)
         {
            _previews.push(this);
         }
         _previewData = {};
         clearTimeout(_previewTimer);
         _previewTimer = setTimeout(requestPreview,0);
         pos = param2;
         autoRect = new Rectangle(param2.x - 20,param2.y - 20,40,40);
         alpha = 0;
         if(isShow)
         {
            ResourceManager.getResource(ClientConfig.getPetSwfPath(param1),this.onLoad,"pet");
         }
      }
      
      private function playSound() : void
      {
         if(Boolean(this._sound))
         {
            this._sound = null;
         }
         this._sound = new Sound();
         this._sound.load(new URLRequest(this.PATH_STR + this._id + ".mp3"));
         this._sound.play();
      }
      
      override public function destroy() : void
      {
         clearInterval(this._dialogTime);
         var previewIndex:int = _previews.indexOf(this);
         if(previewIndex >= 0)
         {
            _previews.splice(previewIndex,1);
         }
         if(this._obj != null)
         {
            ToolTipManager.remove(this._obj);
         }
         if(this._hint != null)
         {
            DisplayUtil.removeForParent(this._hint);
         }
         this._hint = null;
         super.destroy();
         if(Boolean(this._obj))
         {
            this._obj.removeEventListener(MouseEvent.CLICK,this.onClick);
         }
         removeEventListener(RobotEvent.WALK_START,this.onWalkStart);
         removeEventListener(RobotEvent.WALK_END,this.onWalkOver);
         ResourceManager.cancel(ClientConfig.getPetSwfPath(this._id),this.onLoad);
         this.effect("Pet_Effect_Out");
         TweenLite.to(this,1,{
            "alpha":0,
            "ease":Back.easeOut,
            "onComplete":this.onFinishTween
         });
      }
      
      private function effect(param1:String) : void
      {
         var _loc2_:MovieClip = UIManager.getMovieClip(param1);
         MovieClipUtil.playEndAndRemove(_loc2_);
         addChild(_loc2_);
      }
      
      private function onLoad(param1:DisplayObject) : void
      {
         var _loc2_:MovieClip = null;
         this._obj = param1 as MovieClip;
         this._obj.gotoAndStop(_direction);
         this._obj.buttonMode = true;
         this._obj.addEventListener(MouseEvent.CLICK,this.onClick);
         addChild(this._obj);
         this.effect("Pet_Effect_Over");
         MapManager.currentMap.depthLevel.addChild(this);
         TweenLite.to(this,1,{"alpha":1});
         if(this._isPurseFlag)
         {
            this.isPurseFlag = true;
         }
         else
         {
            starAutoWalk(3000);
         }
         MovieClipUtil.childStop(this._obj,1);
         addEventListener(RobotEvent.WALK_START,this.onWalkStart);
         addEventListener(RobotEvent.WALK_END,this.onWalkOver);
         this.updatePreview();
         if(this.isAutoTalk && Boolean(NonoManager.info))
         {
            if(Boolean(NonoManager.info.func[9]))
            {
               clearInterval(this._dialogTime);
               this._dialogTime = setInterval(this.onAutoDialog,MathUtil.randomHalfAdd(10000));
            }
         }
         if(this.idList.indexOf(this._id) > -1)
         {
            _loc2_ = AssetsManager.getMovieClip("pk_flash_mc");
            this._obj.addChildAt(_loc2_,0);
            this.playSound();
         }
      }
      
      private function onFinishTween() : void
      {
         DisplayUtil.removeForParent(this);
         this._obj = null;
      }
      
      private function onAutoDialog() : void
      {
         var _loc1_:String = MovesLangXMLInfo.getRandomLang(this._id);
         if(_loc1_ != "")
         {
            showBox(_loc1_);
         }
      }
      
      private function onClick(param1:MouseEvent) : void
      {
         dispatchEvent(new RobotEvent(RobotEvent.OGRE_CLICK));
      }
      
      private function onWalkStart(param1:Event) : void
      {
         var _loc2_:MovieClip = null;
         if(Boolean(this._obj))
         {
            _loc2_ = this._obj.getChildAt(0) as MovieClip;
            if(Boolean(_loc2_))
            {
               if(_loc2_.currentFrame == 1)
               {
                  _loc2_.gotoAndPlay(2);
               }
            }
         }
      }
      
      private function onWalkOver(param1:Event) : void
      {
         if(Boolean(this._obj))
         {
            MovieClipUtil.childStop(this._obj,1);
         }
      }
   }
}

