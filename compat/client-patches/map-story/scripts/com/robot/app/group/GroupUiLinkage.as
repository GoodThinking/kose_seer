package com.robot.app.group
{
    import com.robot.core.config.ClientConfig;
    import com.robot.core.manager.AssetsManager;
    import com.robot.core.ui.alert.Alarm;
    import flash.display.DisplayObject;
    import flash.display.Loader;
    import flash.display.MovieClip;
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.events.SecurityErrorEvent;
    import flash.net.URLRequest;
    import flash.system.ApplicationDomain;
    import flash.system.LoaderContext;

    public final class GroupUiLinkage
    {
        public static const LIB_GROUP_MENU:String = "lib_group_menu";
        public static const LIB_GROUP_APPLY_MC:String = "lib_group_applyMC";
        public static const LIB_GROUP_INVITE_MC:String = "lib_group_inviteMC";
        public static const GROUP_INVITE_MC:String = "GroupInviteMC";
        public static const GP_INVITE_WAIT_PANEL:String = "GpInviteWaitePanel";
        public static const GP_MEMB_ITEM_LIST_MC:String = "GpMembItemList_mc";
        public static const GP_MEMB_ITEM_MC:String = "GpMembItem_mc";
        public static const GP_MEMB_ITEM_MC_VIP:String = "GpMembItem_mc_vip";
        public static const COMPOSE_MC:String = "ComposeMC";

        private static var _loader:Loader;
        private static var _domain:ApplicationDomain;
        private static var _callbacks:Array = [];

        public static function load(onReady:Function) : void
        {
            if(_domain != null)
            {
                onReady();
                return;
            }
            _callbacks.push(onReady);
            if(_loader != null)
            {
                return;
            }
            _loader = new Loader();
            _loader.contentLoaderInfo.addEventListener(Event.COMPLETE,onComplete);
            _loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,onError);
            _loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,onError);
            _loader.load(new URLRequest(ClientConfig.getResPath("groupTrainingUI.swf")),
                new LoaderContext(false,new ApplicationDomain(ApplicationDomain.currentDomain)));
        }

        private static function removeLoaderListeners() : void
        {
            _loader.contentLoaderInfo.removeEventListener(Event.COMPLETE,onComplete);
            _loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,onError);
            _loader.contentLoaderInfo.removeEventListener(SecurityErrorEvent.SECURITY_ERROR,onError);
        }

        private static function onComplete(event:Event) : void
        {
            removeLoaderListeners();
            _domain = _loader.contentLoaderInfo.applicationDomain;
            var callbacks:Array = _callbacks;
            _callbacks = [];
            for each(var callback:Function in callbacks)
            {
                callback();
            }
        }

        private static function onError(event:Event) : void
        {
            removeLoaderListeners();
            _callbacks = [];
            _loader.unload();
            _loader = null;
            Alarm.show("原生小队图形资源加载失败，请重新打开小队菜单。");
        }

        public static function getDisplayObject(name:String) : DisplayObject
        {
            var result:DisplayObject;
            if(name == LIB_GROUP_MENU || name == LIB_GROUP_APPLY_MC ||
                name == LIB_GROUP_INVITE_MC || name == GP_INVITE_WAIT_PANEL)
            {
                result = AssetsManager.getDisplayObject(name);
            }
            else
            {
                if(_domain == null)
                {
                    throw new Error("Original group artwork must load before opening the party interface");
                }
                var definition:Class = _domain.getDefinition(name) as Class;
                result = new definition() as DisplayObject;
            }
            result.name = name;
            return result;
        }

        public static function getMovieClip(name:String) : MovieClip
        {
            return getDisplayObject(name) as MovieClip;
        }

        public static function getSprite(name:String) : Sprite
        {
            return getDisplayObject(name) as Sprite;
        }
    }
}
