package com.robot.groupFight.manager.assetManager
{
   import flash.display.MovieClip;
   import flash.system.ApplicationDomain;
   
   public class PetAssetsManager
   {
      
      private static var instance:PetAssetsManager;
      
      private var defaultID:int;
      
      private var assetsObj:Object;
      
      public function PetAssetsManager()
      {
         super();
      }
      
      public static function getInstance() : PetAssetsManager
      {
         if(!instance)
         {
            instance = new PetAssetsManager();
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
            this.defaultID = id;
         }
         this.assetsObj["asset_" + id] = app;
      }
      
      public function deleteAsset(id:int) : void
      {
         delete this.assetsObj["asset_" + id];
      }
      
      public function getAssetsByID(id:int) : MovieClip
      {
         var cls:Class = (this.assetsObj["asset_" + id] as ApplicationDomain).getDefinition("pet") as Class;
         return new cls() as MovieClip;
      }
      
      public function getDefaultPet() : MovieClip
      {
         return this.getAssetsByID(this.defaultID);
      }
      
      public function getLeftAttackMC(id:int) : MovieClip
      {
         var cls:Class = (this.assetsObj["asset_" + id] as ApplicationDomain).getDefinition("leftAttack") as Class;
         return new cls() as MovieClip;
      }
      
      public function getLeftAttackedMC(id:int) : MovieClip
      {
         var cls:Class = (this.assetsObj["asset_" + id] as ApplicationDomain).getDefinition("leftAttacked") as Class;
         return new cls() as MovieClip;
      }
      
      public function getRightAttackMC(id:int) : MovieClip
      {
         var cls:Class = (this.assetsObj["asset_" + id] as ApplicationDomain).getDefinition("rightAttack") as Class;
         return new cls() as MovieClip;
      }
      
      public function getRightAttackedMC(id:int) : MovieClip
      {
         var cls:Class = (this.assetsObj["asset_" + id] as ApplicationDomain).getDefinition("rightAttacked") as Class;
         return new cls() as MovieClip;
      }
   }
}

