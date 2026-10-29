package com.robot.module.app.subMap
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.SuperMapXMLInfo;
   import com.robot.core.info.MapHotInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.MapConfig;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.mapTip.MapTip;
   import com.robot.core.ui.mapTip.MapTipInfo;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class Galaxy_1 extends Sprite implements IModule
   {

      private var intervalId:uint;

      private var myIcon:MovieClip;

      private var mapScrollRect:Rectangle;

      private var target:Number = 0;

      private var mc:MovieClip;

      private var isHited:Boolean = false;

      private var isPlanetHovered:Boolean = false;

      private var mapMC:MovieClip;

      public function Galaxy_1()
      {
         super();
      }

      public function destroy() : void
      {
         hide();
         SocketConnection.removeCmdListener(CommandID.MAP_HOT,onGetMapHot);
         mc.removeEventListener(Event.ENTER_FRAME,onMapEnter);
         mc = null;
         mapMC = null;
      }

      public function hide() : void
      {
         DisplayUtil.removeForParent(mc,false);
         isHited = false;
         isPlanetHovered = false;
      }

      public function show() : void
      {
         initGalaxy();
      }

      private function initGalaxy() : void
      {
         var i:int;
         var num:uint;
         var btn:SimpleButton = null;
         var id:uint = 0;
         var str:String = null;
         if(TasksManager.getTaskStatus(47) == TasksManager.COMPLETE)
         {
            mc["stones_mc"].visible = false;
         }
         if(TasksManager.getTaskStatus(19) == TasksManager.ALR_ACCEPT)
         {
            mc["task_19"].alpha = 1;
         }
         else
         {
            mc["task_19"].alpha = 0;
         }
         if(TasksManager.getTaskStatus(94) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(94,function(arr:Array):void
            {
               if(Boolean(arr[1]) && !arr[2])
               {
                  mc["task_17"].alpha = 1;
               }
               else
               {
                  mc["task_17"].alpha = 0;
               }
               if(Boolean(arr[2]) && !arr[3])
               {
                  mc["task_94"].alpha = 1;
               }
               else
               {
                  mc["task_94"].alpha = 0;
               }
            });
         }
         else
         {
            mc["task_17"].alpha = 0;
         }
         mc.scrollRect = mapScrollRect;
         mc.addEventListener(Event.ENTER_FRAME,onMapEnter);
         num = uint(mc.numChildren);
         for(i = 0; i < num; i++)
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
         }
         getHot();
      }

      private function changeMap(e:MouseEvent) : void
      {
         var name:String = (e.currentTarget as SimpleButton).name;
         var id:uint = uint(name.split("_")[1]);
         MapManager.changeMap(id);
      }

      public function setup() : void
      {
         mc = new galaxy_plant_1();
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

      private function onMapEnter(event:Event) : void
      {
         if(isPlanetHovered)
         {
            return;
         }
         // Use the fixed viewport, including empty space between moving planets.
         var mousex:Number = mc.parent.mouseX - mc.x;
         var mousey:Number = mc.parent.mouseY - mc.y;
         if(mousex >= 0 && mousex <= mapScrollRect.width && mousey >= 0 && mousey <= mapScrollRect.height)
         {
            isHited = true;
            target = 880 * mousex / mapScrollRect.width;
         }
         if(!isHited)
         {
            return;
         }
         if(Math.abs(target - mapScrollRect.x) < 2)
         {
            mapScrollRect.x = target;
         }
         else
         {
            mapScrollRect.x += (target - mapScrollRect.x) / 12;
         }
         mc.scrollRect = mapScrollRect;
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
         isPlanetHovered = true;
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
         for(var i:uint = 0; i < num; i++)
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
               for(j = 0; j < 5; j++)
               {
                  if(j < hot)
                  {
                     hotMC["mc_" + j].gotoAndStop(1);
                  }
                  else
                  {
                     hotMC["mc_" + j].gotoAndStop(2);
                  }
               }
            }
         }
      }

      private function initMyPostion() : void
      {
         var p:Point = SuperMapXMLInfo.getWorldMapPos(MapConfig.getSuperMapID(MainManager.actorInfo.mapID));
         var curtGalaxy:uint = uint(SuperMapXMLInfo.getCurrentGalaxy(MapConfig.getSuperMapID(MainManager.actorInfo.mapID)));
         if(p)
         {
            if(curtGalaxy == 1)
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
         isPlanetHovered = false;
         clearTimeout(intervalId);
         MapTip.hide();
      }
   }
}
