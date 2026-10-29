package com.robot.groupFight.view.relation
{
   import com.robot.core.config.xml.GpFtRelationXMLInfo;
   import com.robot.core.effect.GlowTween;
   import com.robot.groupFight.view.interfaces.IPetRelation;
   import flash.display.InteractiveObject;
   
   public class PetRelationEffect implements IPetRelation
   {
      
      private var _intO:InteractiveObject;
      
      private var _gTween:GlowTween;
      
      public function PetRelationEffect(intO:InteractiveObject)
      {
         super();
         this._intO = intO;
      }
      
      public function show(relateID:uint) : void
      {
         var color:uint = 0;
         if(Boolean(this._intO))
         {
            color = uint(GpFtRelationXMLInfo.getRelationColor(relateID));
            if(Boolean(color))
            {
               this._gTween = new GlowTween(this._intO,color,true);
            }
         }
      }
      
      public function destroy() : void
      {
         if(Boolean(this._gTween))
         {
            this._gTween.remove();
            this._gTween = null;
         }
      }
   }
}

