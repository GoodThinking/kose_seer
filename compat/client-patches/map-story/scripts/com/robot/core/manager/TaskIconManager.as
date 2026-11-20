package com.robot.core.manager
{
   import flash.display.DisplayObject;
   import flash.display.InteractiveObject;
   import flash.display.Loader;
   import flash.events.MouseEvent;
   import flash.external.ExternalInterface;
   import flash.filters.DropShadowFilter;
   import flash.net.URLRequest;
   import flash.net.navigateToURL;
   import org.taomee.component.UIComponent;
   import org.taomee.component.containers.HBox;
   import org.taomee.component.control.UIMovieClip;
   import org.taomee.component.layout.FlowLayout;
   import org.taomee.ds.HashMap;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.Utils;
   
   public class TaskIconManager
   {
      
      private static var box:HBox;
      
      private static var _loader:Loader;
      
      private static var iconArray:HashMap = new HashMap();
      
      private static var filter:DropShadowFilter = new DropShadowFilter(5,45,0,0.6);
      
      public function TaskIconManager()
      {
         super();
      }
      
      public static function setup(param1:Loader) : void
      {
         _loader = param1;
         box = new HBox();
         box.width = MainManager.getStageWidth() - 15;
         box.height = 94;
         box.gap = 10;
         box.halign = FlowLayout.RIGHT;
         box.valign = FlowLayout.MIDLLE;
         LevelManager.iconLevel.addChild(box);
         var guideIcon:InteractiveObject = getIcon("new_player_icon");
         if(guideIcon != null)
         {
            ToolTipManager.add(guideIcon,"赛尔号星际攻略档案（新窗口打开）");
            guideIcon.addEventListener(MouseEvent.CLICK,onOpenGuide);
            addIcon(guideIcon);
         }
      }

      private static function onOpenGuide(param1:MouseEvent) : void
      {
         var mapId:uint = MainManager.actorInfo != null ? uint(MainManager.actorInfo.mapID) : 0;
         var uid:uint = uint(MainManager.actorID);
         try
         {
            if(ExternalInterface.available)
            {
               ExternalInterface.call("openSeerGuide",mapId,uid);
               return;
            }
         }
         catch(e:Error)
         {
         }
         var qs:String = "";
         if(mapId > 0)
         {
            qs += "map=" + mapId;
         }
         if(uid > 0)
         {
            qs += (qs.length > 0 ? "&" : "") + "uid=" + uid;
         }
         navigateToURL(new URLRequest(qs.length > 0 ? "/guide/index.html?" + qs : "/guide/index.html"),"_blank");
      }
      
      public static function set rightInset(param1:Number) : void
      {
         box.width = MainManager.getStageWidth() - 15 - param1;
      }
      
      public static function getIcon(param1:String) : InteractiveObject
      {
         return Utils.getDisplayObjectFromLoader(param1,_loader) as InteractiveObject;
      }
      
      public static function addIcon(param1:DisplayObject) : void
      {
         var _loc2_:UIComponent = null;
         if(!iconArray.containsKey(param1))
         {
            _loc2_ = new UIMovieClip(param1);
            box.appendAt(_loc2_,0);
            param1.filters = [filter];
            iconArray.add(param1,_loc2_);
         }
      }
      
      public static function delIcon(param1:DisplayObject) : void
      {
         var _loc2_:UIComponent = null;
         if(iconArray.containsKey(param1))
         {
            _loc2_ = iconArray.getValue(param1) as UIComponent;
            box.remove(_loc2_);
            iconArray.remove(param1);
         }
      }
   }
}
