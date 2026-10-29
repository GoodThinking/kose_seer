package com.robot.core.group.point
{
   import com.robot.core.CommandID;
   import com.robot.core.event.MapEvent;
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alert;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import org.taomee.debug.DebugTrace;
   import org.taomee.manager.ToolTipManager;
   
   public class MapSeatPointConfig
   {
      
      private static var currentComp:MovieClip;
      
      private static var clickPoint:Point;
      
      private static var clickFroWalkPoint:Point;
      
      private static var xmlCls:Class = MapSeatPointConfig_xmlCls;
      
      public static var XML_DATA:XML = XML(new xmlCls());
      
      private static var compArray:Array = [];
      
      public function MapSeatPointConfig()
      {
         super();
      }
      
      public static function setup() : void
      {
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onMapChange);
      }
      
      public static function clear() : void
      {
         onMapChange(null);
      }
      
      private static function onMapChange(param1:MapEvent) : void
      {
         var _loc2_:MovieClip = null;
         for each(_loc2_ in compArray)
         {
            _loc2_.removeEventListener(Event.ENTER_FRAME,autoEnterFrame);
            _loc2_.removeEventListener(MouseEvent.CLICK,clickHandler);
            _loc2_.removeEventListener(MouseEvent.MOUSE_OVER,overHandler);
            _loc2_.removeEventListener(MouseEvent.MOUSE_OUT,outHandler);
            ToolTipManager.remove(_loc2_);
         }
         compArray = [];
      }
      
      public static function configMap(param1:int) : void
      {
         var xml:XML = null;
         var xmllist:XMLList = null;
         var i:XML = null;
         var name:String = null;
         var hit:String = null;
         var fun:String = null;
         var mc:MovieClip = null;
         var hitMC:MovieClip = null;
         var str:String = null;
         var mapID:int = param1;
         compArray = [];
         for each(var candidate:XML in XML_DATA.seat)
         {
            if(int(candidate.attribute("mapID")) == mapID)
            {
               xml = candidate;
               break;
            }
         }
         if(xml == null)
         {
            return;
         }
         xmllist = xml.descendants("point");
         if(xmllist == null)
         {
            return;
         }
         for each(i in xmllist)
         {
            name = i.attribute("mc").toString();
            hit = i.attribute("hitMC").toString();
            fun = i.attribute("fun").toString();
            mc = MapManager.currentMap.controlLevel.getChildByName(name) as MovieClip;
            hitMC = MapManager.currentMap.controlLevel.getChildByName(hit) as MovieClip;
            try
            {
               if(mc != hitMC)
               {
                  hitMC.mouseEnabled = false;
                  hitMC.mouseChildren = false;
               }
               hitMC["compMC"] = mc;
               mc.buttonMode = true;
               mc.mouseEnabled = true;
               mc.mouseChildren = false;
               mc.gotoAndStop(1);
            }
            catch(e:Error)
            {
               throw new Error(mapID + "号地图配置有误,comp name:" + name + " hit name:" + hit);
            }
            mc["hitMC"] = hitMC;
            mc["des"] = i.attribute("des").toString();
            mc["isStop"] = uint(i.attribute("isStop"));
            mc["isOnce"] = uint(i.attribute("isOnce"));
            mc["sctID"] = uint(i.parent().attribute("id"));
            mc["pointID"] = uint(i.attribute("id"));
            hitMC.fun = fun;
            if(!GroupManager.isInGroup)
            {
               mc.addEventListener(MouseEvent.CLICK,clickHandler);
               mc.addEventListener(MouseEvent.MOUSE_OVER,overHandler);
               mc.addEventListener(MouseEvent.MOUSE_OUT,outHandler);
            }
            else
            {
               mc.buttonMode = false;
               mc.mouseEnabled = false;
            }
            str = mc["des"].replace(/\$/g,"\r");
            if(str != "" && str != null)
            {
               ToolTipManager.add(mc,str);
            }
            compArray.push(mc);
         }
      }
      
      private static function clickHandler(param1:MouseEvent) : void
      {
         if(currentComp)
         {
            delEnterFrame();
         }
         var _loc2_:MovieClip = param1.currentTarget as MovieClip;
         var _loc3_:MovieClip = _loc2_["hitMC"];
         _loc3_["compMC"] = _loc2_;
         clickPoint = _loc3_.localToGlobal(new Point());
         clickFroWalkPoint = new Point(_loc3_.x,_loc3_.y);
         currentComp = _loc3_;
         if(currentComp)
         {
            addEnterFrame();
         }
      }
      
      public static function delEnterFrame() : void
      {
         if(currentComp)
         {
            currentComp.removeEventListener(Event.ENTER_FRAME,checkHit);
         }
         currentComp = null;
      }
      
      private static function addEnterFrame() : void
      {
         MainManager.actorModel.walkAction(clickFroWalkPoint);
         currentComp.addEventListener(Event.ENTER_FRAME,checkHit);
      }
      
      private static function checkHit(param1:Event) : void
      {
         var compMC:MovieClip = null;
         var sctID:uint = 0;
         var pointID:uint = 0;
         var event:Event = param1;
         var current:MovieClip = event.currentTarget as MovieClip;
         compMC = current["compMC"];
         var pp:Point = MainManager.actorModel.sprite.localToGlobal(new Point());
         if(Point.distance(pp,clickPoint) < 15)
         {
            if(currentComp["fun"] == "")
            {
               sctID = uint(compMC["sctID"]);
               pointID = uint(compMC["pointID"]);
               DebugTrace.show("sceID--->" + sctID + "--pointID--->" + pointID + "---->" + MainManager.actorID);
               Alert.show("你需要站位等待他人一起组成小队吗?",function():void
               {
                  compMC.gotoAndStop(2);
                  SocketConnection.send(CommandID.GROUP_SEAT_POINT,sctID,pointID);
               });
            }
            else
            {
               try
               {
                  MapProcessConfig.currentProcessInstance[currentComp["fun"]](compMC);
               }
               catch(e:Error)
               {
                  MapProcessConfig.currentProcessInstance[currentComp["fun"]]();
               }
            }
            MainManager.actorModel.skeleton.stop();
            delEnterFrame();
         }
      }
      
      private static function initAutoEvent(param1:MovieClip) : void
      {
         param1.addEventListener(Event.ENTER_FRAME,autoEnterFrame);
      }
      
      private static function autoEnterFrame(param1:Event) : void
      {
         var mc:MovieClip = null;
         var hitMC:MovieClip = null;
         var event:Event = param1;
         mc = event.currentTarget as MovieClip;
         hitMC = mc["hitMC"];
         var pp:Point = MainManager.actorModel.sprite.localToGlobal(new Point());
         if(hitMC.hitTestPoint(pp.x,pp.y,true))
         {
            if(!mc.isHit)
            {
               mc.isHit = true;
               if(mc["isOnce"] == 1)
               {
                  mc.removeEventListener(Event.ENTER_FRAME,autoEnterFrame);
               }
               try
               {
                  MapProcessConfig.currentProcessInstance[hitMC["fun"]]();
               }
               catch(e:Error)
               {
                  MapProcessConfig.currentProcessInstance[hitMC["fun"]](mc);
               }
            }
         }
         else
         {
            mc.isHit = false;
         }
      }
      
      private static function overHandler(param1:MouseEvent) : void
      {
         var _loc2_:MovieClip = param1.currentTarget as MovieClip;
         if(_loc2_["isStop"] == 0)
         {
            _loc2_.gotoAndStop(2);
         }
      }
      
      private static function outHandler(param1:MouseEvent) : void
      {
         var _loc2_:MovieClip = param1.currentTarget as MovieClip;
         if(_loc2_["isStop"] == 0)
         {
            _loc2_.gotoAndStop(1);
         }
      }
   }
}

