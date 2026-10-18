package com.robot.module.app.subMap
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.SuperMapXMLInfo;
   import com.robot.core.info.MapHotInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.MapConfig;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.mapTip.MapTip;
   import com.robot.core.ui.mapTip.MapTipInfo;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   [SWF(frameRate="24",backgroundColor="#869ca7",width="500",height="375")]
   public class Galaxy_4 extends Sprite implements IModule
   {

      private var intervalId:uint;

      private var myIcon:MovieClip;

      private var mapScrollRect:Rectangle;

      private var mc:MovieClip;

      private var isHited:Boolean = false;

      private var mapMC:MovieClip;

      public function Galaxy_4()
      {
         super();
      }

      public function hide() : void
      {
         DisplayUtil.removeForParent(mc,false);
         isHited = false;
      }

      private function initGalaxy() : void
      {
         if(mc.getChildByName("plantBtn_318") == null)
         {
            var zhuqueDoor:Sprite = new Sprite();
            zhuqueDoor.graphics.beginFill(15228164);
            zhuqueDoor.graphics.drawCircle(0,0,14);
            zhuqueDoor.graphics.endFill();
            zhuqueDoor.x = 36;
            zhuqueDoor.y = 36;
            zhuqueDoor.name = "plantBtn_318";
            zhuqueDoor.buttonMode = true;
            zhuqueDoor.addEventListener(MouseEvent.CLICK,changeMap);
            mc.addChild(zhuqueDoor);
         }
         var btn:SimpleButton = null;
         var id:uint = 0;
         var str:String = null;
         var num:uint = uint(mc.numChildren);
         var i:int = 0;
         while(i < num)
         {
            btn = mc.getChildAt(i) as SimpleButton;
            if(btn)
            {
               btn.addEventListener(MouseEvent.CLICK,changeMap);
               id = uint(btn.name.split("_")[1]);
               str = MapConfig.getName(id) + "\r<font color=\'#ff0000\'>" + MapConfig.getDes(id) + "</font>";
               btn.addEventListener(MouseEvent.MOUSE_OVER,onMosOver);
               btn.addEventListener(MouseEvent.MOUSE_OUT,onMosOut);
            }
            i++;
         }
         getHot();
      }

      private function changeMap(e:MouseEvent) : void
      {
         var name:String = (e.currentTarget as DisplayObject).name;
         var id:uint = uint(name.split("_")[1]);
         MapManager.changeMap(id);
      }

      public function setup() : void
      {
         mc = new galaxy_plant_4();
         mc.cacheAsBitmap = true;
         addChild(mc);
         mc.x = 122;
         mc.y = 144;
         mapScrollRect = new Rectangle(0,0,763,260);
         myIcon = new galaxy_my_icon();
         myIcon.mouseChildren = false;
         myIcon.mouseEnabled = false;
         DisplayUtil.FillColor(myIcon["mc"]["colorMC"],MainManager.actorInfo.color);
      }

      public function init(data:Object = null) : void
      {
         mapMC = data as MovieClip;
      }

      public function getHot() : void
      {
         SocketConnection.addCmdListener(CommandID.MAP_HOT,onGetMapHot);
         SocketConnection.mainSocket.send(CommandID.MAP_HOT,[]);
         initMyPostion();
      }

      private function onMosOver(evt:MouseEvent) : void
      {
         var id:uint = 0;
         var btn:SimpleButton = evt.currentTarget as SimpleButton;
         id = uint(btn.name.split("_")[1]);
         intervalId = setTimeout(function():void
         {
            MapTip.show(new MapTipInfo(id));
         },500);
      }

      private function onGetMapHot(event:SocketEvent) : void
      {
         var btn:SimpleButton = null;
         var id:uint = 0;
         var str:String = null;
         var hotMC:MovieClip = null;
         var hot:uint = 0;
         var j:uint = 0;
         var index:int = mapMC.getChildIndex(mapMC["galaxyMC"]);
         mapMC.addChildAt(mc,index + 1);
         SocketConnection.removeCmdListener(CommandID.MAP_HOT,onGetMapHot);
         var data:MapHotInfo = event.data as MapHotInfo;
         var num:uint = uint(mc.numChildren);
         var i:uint = 0;
         while(i < num)
         {
            btn = mc.getChildAt(i) as SimpleButton;
            if(btn)
            {
               id = uint(btn.name.split("_")[1]);
               hotMC = mc.getChildByName("hotMC_" + id) as MovieClip;
               hot = Math.ceil(uint(data.infos.getValue(id)) / 10);
               if(hot > 5)
               {
                  hot = 5;
               }
               j = 0;
               while(j < 5)
               {
                  if(j < hot)
                  {
                     hotMC["mc_" + j].gotoAndStop(1);
                  }
                  else
                  {
                     hotMC["mc_" + j].gotoAndStop(2);
                  }
                  j++;
               }
            }
            i++;
         }
      }

      public function destroy() : void
      {
         hide();
         SocketConnection.removeCmdListener(CommandID.MAP_HOT,onGetMapHot);
         mc = null;
         mapMC = null;
      }

      private function initMyPostion() : void
      {
         var p:Point = SuperMapXMLInfo.getWorldMapPos(MapConfig.getSuperMapID(MainManager.actorInfo.mapID));
         var curtGalaxy:uint = SuperMapXMLInfo.getCurrentGalaxy(MapConfig.getSuperMapID(MainManager.actorInfo.mapID));
         if(p)
         {
            if(curtGalaxy == 4)
            {
               if(p.x != 0 || p.y != 0)
               {
                  myIcon.x = p.x;
                  myIcon.y = p.y;
                  mc.addChild(myIcon);
               }
            }
            else
            {
               DisplayUtil.removeForParent(myIcon);
            }
         }
         else
         {
            DisplayUtil.removeForParent(myIcon);
         }
      }

      private function onMosOut(evt:MouseEvent) : void
      {
         clearTimeout(intervalId);
         MapTip.hide();
      }

      public function show() : void
      {
         initGalaxy();
      }
   }
}
