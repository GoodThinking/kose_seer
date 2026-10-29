package com.robot.core.info.fightInfo
{
   import com.robot.core.config.PetStatusEffectConfig;
   import flash.utils.IDataInput;
   
   public class PetStatusEffectInfo
   {
      
      public var type:uint;
      
      public var id:uint;
      
      public var parm:uint;
      
      public var name:String;
      
      public var des:String;
      
      public var isShow:Boolean;
      
      public function PetStatusEffectInfo(param1:IDataInput)
      {
         super();
         this.type = param1.readUnsignedInt();
         this.id = param1.readUnsignedInt();
         this.parm = param1.readUnsignedInt();
         this.name = PetStatusEffectConfig.getName(this.type,this.id);
         this.des = PetStatusEffectConfig.getDescription(this.type,this.id);
         this.isShow = PetStatusEffectConfig.isShow(this.type,this.id);
      }
   }
}

