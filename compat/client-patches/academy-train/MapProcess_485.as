package com.robot.app.mapProcess
{
   import com.robot.app.task.petstory.app.train.TrainData;
   import com.robot.app.task.petstory.app.train.TrainGradePanel;
   import com.robot.app.task.petstory.app.train.TrainItemPanel;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.DisplayObject;
   import flash.display.InteractiveObject;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;

   // 精灵学院：只用场景原有物件做入口，不叠加文字。
   // 两位辅导员直接打开原版学习力训练室面板，右侧训练舱打开原版选房面板，中央终端打开经验训练室。
   public class MapProcess_485 extends BaseMapProcess
   {
      public function MapProcess_485()
      {
         super();
      }

      override protected function init() : void
      {
         if(conLevel["light"])
         {
            conLevel["light"].visible = false;
         }
         this.bindTarget(conLevel["lowGrade"],"初级班辅导员",this.onLowClick);
         this.bindTarget(conLevel["highGrade"],"高级班辅导员",this.onHighClick);
         this.bindTarget(conLevel["trainDoor"],"学习力训练室",this.onGradeClick);
         this.bindTarget(conLevel["testMC"],"经验训练室",this.onExpClick);
         this.bindTarget(conLevel["trialsMC"],"经验训练室",this.onExpClick);
         this.bindTarget(conLevel["door0_btn"],"精灵太空站",this.onExitClick);
      }

      private function bindTarget(obj:DisplayObject, tip:String, handler:Function) : void
      {
         var io:InteractiveObject = obj as InteractiveObject;
         if(!io)
         {
            return;
         }
         ToolTipManager.add(io,tip);
         io.addEventListener(MouseEvent.CLICK,handler);
         var sp:Sprite = obj as Sprite;
         if(sp)
         {
            sp.buttonMode = true;
            sp.mouseChildren = false;
         }
      }

      private function onLowClick(e:MouseEvent) : void
      {
         this.openLowTrainGradePanel();
      }

      private function onHighClick(e:MouseEvent) : void
      {
         this.openHighTrainGradePanel();
      }

      private function onGradeClick(e:MouseEvent) : void
      {
         TrainGradePanel.show(0);
      }

      private function onExpClick(e:MouseEvent) : void
      {
         TrainGradePanel.show(1);
      }

      private function onExitClick(e:MouseEvent) : void
      {
         MapManager.changeMap(102);
      }

      public function openHighTrainGradePanel() : void
      {
         TrainData.trainGrade = 1;
         new TrainItemPanel();
      }

      public function openLowTrainGradePanel() : void
      {
         TrainData.trainGrade = 0;
         new TrainItemPanel();
      }

      override public function destroy() : void
      {
         this.unbindTarget(conLevel["lowGrade"],this.onLowClick);
         this.unbindTarget(conLevel["highGrade"],this.onHighClick);
         this.unbindTarget(conLevel["trainDoor"],this.onGradeClick);
         this.unbindTarget(conLevel["testMC"],this.onExpClick);
         this.unbindTarget(conLevel["trialsMC"],this.onExpClick);
         this.unbindTarget(conLevel["door0_btn"],this.onExitClick);
      }

      private function unbindTarget(obj:DisplayObject, handler:Function) : void
      {
         var io:InteractiveObject = obj as InteractiveObject;
         if(io)
         {
            ToolTipManager.remove(io);
            io.removeEventListener(MouseEvent.CLICK,handler);
         }
      }
   }
}
