package com.robot.groupFight.manager.assetManager
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.data.DoubleSkillTypeAssertXmlInfo;
   import flash.display.Loader;
   import flash.display.LoaderInfo;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.events.IOErrorEvent;
   import flash.net.URLRequest;
   import flash.events.SecurityErrorEvent;
   import org.taomee.manager.EventManager;
   import flash.system.ApplicationDomain;
   
   [Event(name="progress",type="com.robot.petFight.assetManager.AssetsEvent")]
   [Event(name="loadAllAssets",type="com.robot.petFight.assetManager.AssetsEvent")]
   public class AssetsLoadManager extends EventDispatcher
   {
      
      private static const PET_PATH:String = "groupFightResource/pet/";
      
      private static const SKILL_PATH:String = "groupFightResource/skill/";
      
      private var petIDArray:Array = [];
      
      private var skillIDArray:Array = [];
      
      private var petLoader:Loader;
      
      private var skillLoader:Loader;
      
      private var currentID:int;
      
      private var currentIndex:int = 0;
      
      private var _totalCnt:uint;
      
      private var _curtCnt:uint;
      
      public function AssetsLoadManager()
      {
         super();
         this.petLoader = new Loader();
         this.petLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,this.onLoadPetAsset);
         this.petLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,this.errorLoadHandler);
         this.petLoader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,this.errorLoadHandler);
         this.skillLoader = new Loader();
         this.skillLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,this.onLoadSkillAsset);
         this.skillLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,this.errorLoadHandler);
         this.skillLoader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,this.errorLoadHandler);
      }
      
      public function destroy() : void
      {
         this.stopAll();
         this.petLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE,this.onLoadPetAsset);
         this.petLoader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,this.errorLoadHandler);
         this.petLoader.contentLoaderInfo.removeEventListener(SecurityErrorEvent.SECURITY_ERROR,this.errorLoadHandler);
         this.skillLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE,this.onLoadSkillAsset);
         this.skillLoader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,this.errorLoadHandler);
         this.skillLoader.contentLoaderInfo.removeEventListener(SecurityErrorEvent.SECURITY_ERROR,this.errorLoadHandler);
         this.petLoader = null;
         this.skillLoader = null;
      }
      
      private function errorLoadHandler(event:Event) : void
      {
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.LOAD_ASSETS_TIME_OUT));
      }
      
      public function addPetID(... args) : void
      {
         var i:int = 0;
         for each(i in args)
         {
            if(this.petIDArray.indexOf(i) == -1) this.petIDArray.push(i);
         }
      }
      
      public function addSkillID(... args) : void
      {
         var i:int = 0;
         for each(i in args)
         {
            if(this.skillIDArray.indexOf(i) == -1) this.skillIDArray.push(i);
         }
      }
      
      private function stopAll() : void
      {
         try
         {
            this.petLoader.close();
         }
         catch(e:Error)
         {
         }
         try
         {
            this.skillLoader.close();
         }
         catch(e:Error)
         {
         }
      }
      
      public function loadAssets() : void
      {
         this._totalCnt = this.petIDArray.length + this.skillIDArray.length;
         trace("加载资源总个数-->宠物数【" + this.petIDArray.length + "】--技能数【" + this.skillIDArray.length + "】");
         this.loadPets();
      }
      
      private function loadPets() : void
      {
         var str:String = null;
         if(this.petIDArray.length == 0)
         {
            this.loadSkills();
            return;
         }
         if(this.currentIndex < this.petIDArray.length)
         {
            this.currentID = this.petIDArray[this.currentIndex];
            str = this.formatID(this.currentID);
            trace("AssetsLoading...pet",str);
            this.petLoader.load(new URLRequest(ClientConfig.getResPath(PET_PATH + this.currentID + ".swf")));
         }
         else
         {
            this.currentIndex = 0;
            this.loadSkills();
         }
      }
      
      private function onLoadPetAsset(event:Event) : void
      {
         var app:ApplicationDomain = (event.target as LoaderInfo).applicationDomain;
         PetAssetsManager.getInstance().addAsset(this.currentID,app);
         ++this.currentIndex;
         this.loadPets();
         ++this._curtCnt;
         var p:uint = Math.ceil(this._curtCnt / this._totalCnt * 100);
         dispatchEvent(new AssetsEvent(AssetsEvent.PROGRESS,p));
         trace("某赛尔精灵加载完成---------------------",this.currentID);
         trace("某技能加载完成-----百分比----【" + p + "】------------");
      }
      
      private function loadSkills() : void
      {
         var str:String = null;
         var arr:Array = null;
         var key:String = null;
         if(this.skillIDArray.length == 0)
         {
            SocketConnection.send(CommandID.GROUP_LOAD_PERCENT,100);
            dispatchEvent(new AssetsEvent(AssetsEvent.LOAD_ALL_ASSETS));
            return;
         }
         if(this.currentIndex < this.skillIDArray.length)
         {
            this.currentID = this.skillIDArray[this.currentIndex];
            str = SkillXMLInfo.getUrl(this.currentID);
            arr = str.split("_");
            if(arr.length == 3)
            {
               key = arr[0] + "_" + arr[1];
               str = DoubleSkillTypeAssertXmlInfo.getNewUrl(key) + "_" + arr[2];
            }
            trace("AssetsLoading...skill",str);
            this.skillLoader.load(new URLRequest(ClientConfig.getResPath(SKILL_PATH + str + ".swf")));
         }
         else
         {
            SocketConnection.send(CommandID.GROUP_LOAD_PERCENT,100);
            dispatchEvent(new AssetsEvent(AssetsEvent.LOAD_ALL_ASSETS));
            this.currentIndex = 0;
         }
      }
      
      private function onLoadSkillAsset(event:Event) : void
      {
         var p:uint = 0;
         var app:ApplicationDomain = (event.target as LoaderInfo).applicationDomain;
         SkillAssetsManager.getInstance().addAsset(this.currentID,app);
         ++this.currentIndex;
         trace("某技能加载完成---------------------",this.currentID);
         trace("某技能加载完成-----百分比----【" + p + "】------------");
         this.loadSkills();
         ++this._curtCnt;
         p = Math.ceil(this._curtCnt / this._totalCnt * 100);
         dispatchEvent(new AssetsEvent(AssetsEvent.PROGRESS,p));
      }
      
      private function formatID(id:uint, length:uint = 3) : String
      {
         var i:int = 0;
         var str:String = id.toString();
         var strLength:uint = uint(str.length);
         if(strLength < length)
         {
            for(i = 0; i < length - strLength; i++)
            {
               str = "0" + str;
            }
         }
         return str;
      }
   }
}

