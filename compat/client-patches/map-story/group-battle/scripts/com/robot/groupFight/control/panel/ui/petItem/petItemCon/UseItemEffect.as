package com.robot.groupFight.control.panel.ui.petItem.petItemCon
{
   import com.robot.core.group.fightInfo.fighting.item.GroupUseItemInfo;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.display.MovieClip;
   import flash.events.Event;
   import org.taomee.utils.DisplayUtil;
   
   public class UseItemEffect implements IUseItemEffect
   {
      
      protected var bottomMC:MovieClip;
      
      protected var effectMC:MovieClip;
      
      protected var model:BaseGroupFighterModel;
      
      protected var data:GroupUseItemInfo;
      
      public function UseItemEffect(mode:BaseGroupFighterModel, data:GroupUseItemInfo)
      {
         super();
         this.model = mode;
         this.data = data;
         this.play();
      }
      
      public function play() : void
      {
         if(!this.bottomMC)
         {
            this.bottomMC = new Gp_Item_Blood_Bottom();
            this.effectMC = new Gp_Item_Blood_Effect();
            this.effectMC.x = this.bottomMC.x;
            this.effectMC.y = this.bottomMC.y;
         }
         this.bottomMC.gotoAndPlay(2);
         this.effectMC.gotoAndPlay(2);
         this.model.petWin.petContainer.addChildAt(this.bottomMC,0);
         this.model.petWin.petContainer.addChild(this.effectMC);
         this.effectMC.addEventListener(Event.REMOVED_FROM_STAGE,this.onRemoved);
         this.effectMC.addFrameScript(71,this.finish);
         this.updateData();
      }

      private function onRemoved(event:Event) : void
      {
         if(event.target == effectMC) this.finish();
      }

      private function finish() : void
      {
         effectMC.removeEventListener(Event.REMOVED_FROM_STAGE,this.onRemoved);
         effectMC.gotoAndStop(1);
         bottomMC.gotoAndStop(1);
         effectMC.addFrameScript(71,null);
         DisplayUtil.removeForParent(bottomMC);
         DisplayUtil.removeForParent(effectMC);
         model = null;
         data = null;
      }
      
      public function updateData() : void
      {
      }
   }
}

