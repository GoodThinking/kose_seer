package com.robot.groupFight.view
{
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import flash.display.Sprite;
   import org.taomee.manager.EventManager;
   
   public class PlayerFighterPetWin extends BaseFighterPetWin
   {
      
      private static const CWIDTH:Number = 45;
      
      private static const CHEIGHT:Number = 22.5;
      
      public var footCclMC:Sprite;
      
      public function PlayerFighterPetWin(info:GroupFightPetInfo)
      {
         super(info);
      }
      
      override protected function addPetMC() : void
      {
         super.addPetMC();
         this.footCclMC = this.drawFootCircle();
         petContainer.addChildAt(this.footCclMC,0);
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.ON_OPENNING));
      }
      
      private function drawFootCircle() : Sprite
      {
         var s:Sprite = new Sprite();
         s.graphics.lineStyle(1,65280);
         s.graphics.beginFill(65280,0.5);
         s.graphics.drawEllipse(-CWIDTH / 2,-CHEIGHT / 2,CWIDTH,CHEIGHT);
         s.graphics.endFill();
         return s;
      }
   }
}

