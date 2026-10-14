package com.robot.app.task.tc
{
   import com.robot.app.task.newNovice.NewNoviceGuideTaskController;
   import com.robot.app.task.newNovice.NewNoviceStepFourController;
   import com.robot.app.task.newNovice.NewNpcDiaDialog;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.info.task.novice.NoviceFinishInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.ui.alert.ItemInBagAlert;
   import com.robot.core.utils.TextFormatUtil;
   import flash.utils.setTimeout;

   public class TaskClass_88
   {
      private var rewardText:String = "";

      public function TaskClass_88(param1:NoviceFinishInfo)
      {
         var reward:Object = null;
         var parts:Array = [];
         super();
         for each(reward in param1.monBallList)
         {
            if(uint(reward["itemID"]) == 1)
            {
               MainManager.actorInfo.coins += uint(reward["itemCnt"]);
            }
            parts.push(TextFormatUtil.getRedTxt(uint(reward["itemCnt"]).toString()) + ItemXMLInfo.getName(uint(reward["itemID"])));
         }
         this.rewardText = parts.join("、");
         TasksManager.setTaskStatus(88,TasksManager.COMPLETE);
         TasksManager.setTaskStatus(4,TasksManager.COMPLETE);
         NewNoviceGuideTaskController.showTip(1);
         if(NewNoviceStepFourController.isPlay)
         {
            MapManager.currentMap.btnLevel["comMc"].gotoAndPlay(2);
            setTimeout(this.showReward,3700);
         }
         else
         {
            this.showReward();
         }
      }

      private function showReward() : void
      {
         if(this.rewardText == "")
         {
            this.onHandler();
            return;
         }
         ItemInBagAlert.show(1,this.rewardText + "已经到账。",this.onHandler);
      }

      private function onHandler() : void
      {
         NewNoviceGuideTaskController.destroy();
         NewNpcDiaDialog.destroy();
         MapManager.changeMap(8);
      }
   }
}
