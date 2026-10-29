package com.robot.groupFight.manager.assetManager
{
   import flash.display.MovieClip;
   import flash.system.ApplicationDomain;
   
   public class SkillAssetsManager
   {
      
      private static var instance:SkillAssetsManager;
      
      private var assetsObj:Object;
      
      public function SkillAssetsManager()
      {
         super();
      }
      
      public static function getInstance() : SkillAssetsManager
      {
         if(!instance)
         {
            instance = new SkillAssetsManager();
         }
         return instance;
      }
      
      public function clearAll() : void
      {
         this.assetsObj = {};
      }
      
      public function addAsset(id:int, app:ApplicationDomain) : void
      {
         if(!this.assetsObj)
         {
            this.assetsObj = {};
         }
         this.assetsObj["asset_" + id] = app;
      }
      
      public function deleteAsset(id:int) : void
      {
         delete this.assetsObj["asset_" + id];
      }
      
      public function getAssetsByID(id:int) : MovieClip
      {
         var cls:Class = (this.assetsObj["asset_" + id] as ApplicationDomain).getDefinition("skill") as Class;
         return new cls() as MovieClip;
      }
   }
}

