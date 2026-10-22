package com.robot.module.app.subMap
{
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.MapConfig;
   import com.robot.core.ui.mapTip.MapTip;
   import com.robot.core.ui.mapTip.MapTipInfo;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.display.Sprite;
   import flash.geom.Rectangle;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   // 螺旋星系。星球图层 galaxy_plant_5 取自 XIN 站的星图模块，按钮名带原版地图号；
   // 这版只开放巨石星和艾伦星，其余星球（含 XIN 的返回飞船按钮）隐藏。
   public class Galaxy_5 extends Sprite implements IModule
   {

      // 按钮地图号 → 落地地图、地图表里的星球号（super）、星球在图层里的中心
      // 巨石星、艾伦星落地用剧情结束后的地图 925、926；XIN 星图没有艾伦星，借用这版不开放的天空之门（748）的海洋星球图
      private static const PLANETS:Object = {
         "702":{"map":925,"planet":702,"x":250,"y":125},
         "748":{"map":926,"planet":29,"x":510,"y":125}
      };

      private var intervalId:uint;

      private var myIcon:MovieClip;

      private var mc:MovieClip;

      private var mapMC:MovieClip;

      public function Galaxy_5()
      {
         super();
      }

      public function init(data:Object = null) : void
      {
         mapMC = data as MovieClip;
      }

      public function setup() : void
      {
         mc = new galaxy_plant_5();
         mc.x = 122;
         mc.y = 144;
         var i:int = 0;
         while(i < mc.numChildren)
         {
            var btn:DisplayObject = mc.getChildAt(i);
            var planet:Object = PLANETS[btn.name.split("_")[1]];
            if(planet)
            {
               var r:Rectangle = btn.getBounds(btn);
               btn.x = planet.x - (r.left + r.width / 2) * btn.scaleX;
               btn.y = planet.y - (r.top + r.height / 2) * btn.scaleY;
            }
            else
            {
               btn.visible = false;
            }
            i++;
         }
         mc.cacheAsBitmap = true;
         myIcon = new galaxy_my_icon();
         myIcon.mouseChildren = false;
         myIcon.mouseEnabled = false;
         DisplayUtil.FillColor(myIcon["mc"]["colorMC"],MainManager.actorInfo.color);
      }

      public function show() : void
      {
         for(var key:String in PLANETS)
         {
            var btn:DisplayObject = mc.getChildByName("plantBtn_" + key);
            btn.addEventListener(MouseEvent.CLICK,changeMap);
            btn.addEventListener(MouseEvent.MOUSE_OVER,onMosOver);
            btn.addEventListener(MouseEvent.MOUSE_OUT,onMosOut);
         }
         mapMC.addChildAt(mc,mapMC.getChildIndex(mapMC["galaxyMC"]) + 1);
         getHot();
      }

      // 世界地图重新打开时调用；这版服务端不给本星系发热度，只刷新玩家位置
      public function getHot() : void
      {
         var planet:uint = MapConfig.getSuperMapID(MainManager.actorInfo.mapID);
         for(var key:String in PLANETS)
         {
            if(PLANETS[key].planet == planet)
            {
               myIcon.x = PLANETS[key].x;
               myIcon.y = PLANETS[key].y;
               mc.addChild(myIcon);
               return;
            }
         }
         DisplayUtil.removeForParent(myIcon);
      }

      private function target(e:MouseEvent) : Object
      {
         return PLANETS[(e.currentTarget as DisplayObject).name.split("_")[1]];
      }

      private function changeMap(e:MouseEvent) : void
      {
         MapManager.changeMap(target(e).map);
      }

      private function onMosOver(e:MouseEvent) : void
      {
         var id:uint = target(e).map;
         intervalId = setTimeout(function():void
         {
            MapTip.show(new MapTipInfo(id));
         },500);
      }

      private function onMosOut(e:MouseEvent) : void
      {
         clearTimeout(intervalId);
         MapTip.hide();
      }

      public function hide() : void
      {
         clearTimeout(intervalId);
         MapTip.hide();
         DisplayUtil.removeForParent(mc,false);
      }

      public function destroy() : void
      {
         hide();
         for(var key:String in PLANETS)
         {
            var btn:DisplayObject = mc.getChildByName("plantBtn_" + key);
            btn.removeEventListener(MouseEvent.CLICK,changeMap);
            btn.removeEventListener(MouseEvent.MOUSE_OVER,onMosOver);
            btn.removeEventListener(MouseEvent.MOUSE_OUT,onMosOut);
         }
         mc = null;
         mapMC = null;
      }
   }
}
