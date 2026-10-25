package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.utils.CommonUI;
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;
   import flash.geom.Rectangle;
   import org.taomee.manager.ResourceManager;
   import org.taomee.utils.DisplayUtil;

   public class MapProcess_693 extends BaseMapProcess
   {
      private var _exit:Sprite;
      private var _bulu:Sprite;
      private var _destroyed:Boolean;
      private var _petURL:String;

      override protected function init() : void
      {
         conLevel["task_819_3"].visible = false;
         // These belong to a later, separate cultivation event, not the six-part fox chapter.
         for each(var name:String in ["task_1025","tianma","yier","ad","flower_0","flower_1","flower_2","flower_3","pojiasuosiTig"])
         {
            var old:DisplayObject = conLevel.getChildByName(name);
            if(old != null) old.visible = false;
         }
         _bulu = conLevel["bulu"] as Sprite;
         _bulu.visible = false;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            if(_destroyed) return;
            _bulu.visible = TasksManager.getTaskStatus(819) != TasksManager.ALR_ACCEPT;
            if(_bulu.visible)
            {
               _petURL = ClientConfig.getPetSwfPath(108);
               ResourceManager.getResource(_petURL,onBuluLoaded,"pet");
            }
         },this);
         _bulu.buttonMode = true;
         _bulu.mouseChildren = false;
         _bulu.addEventListener(MouseEvent.CLICK,onBulu);
         ToolTipManager.add(_bulu,"布鲁：仙境线索与返航");
         _exit = new Sprite();
         _exit.name = "shoreReturn";
         _exit.x = 850;
         _exit.y = 425;
         _exit.graphics.beginFill(0xffffff,0.01);
         _exit.graphics.drawEllipse(-35,-28,70,56);
         _exit.graphics.endFill();
         CommonUI.addYellowArrow(_exit);
         _exit.buttonMode = true;
         _exit.mouseChildren = false;
         _exit.addEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.add(_exit,"返回拉铂尔星岸边");
         topLevel.addChild(_exit);
      }

      private function onBuluLoaded(content:DisplayObject) : void
      {
         if(_destroyed) return;
         DisplayUtil.stopAllMovieClip(content);
         var bounds:Rectangle = content.getBounds(content);
         var scale:Number = Math.min(80 / bounds.width,85 / bounds.height);
         content.scaleX = content.scaleY = scale;
         content.x = -(bounds.x + bounds.width / 2) * scale;
         content.y = -bounds.bottom * scale;
         _bulu.addChild(content);
      }

      private function onBulu(event:MouseEvent) : void
      {
         var complete:Boolean = TasksManager.getTaskStatus(819) == TasksManager.COMPLETE;
         NpcDialog.show(NPC.BULU,[complete
            ? "这片仙境终于暂时恢复了平静。谢谢你保护这里的伙伴！想继续探索，可以返回岸边，或回船长室整理这次调查的线索。"
            : "这里是拉铂尔仙境。船长正在调查珀伽索斯和四位守护神的往事，你可以从任务档案查看当前线索。别担心，岸边的叶舟随时可以带你返航。"],["返回岸边","回船长室","继续探索"],[function():void
         {
            if(!_destroyed) MapManager.changeMap(81951);
         },function():void
         {
            if(!_destroyed) MapManager.changeMap(4);
         }]);
      }

      private function onExit(event:MouseEvent) : void
      {
         MapManager.changeMap(81951);
      }

      override public function destroy() : void
      {
         _destroyed = true;
         if(_petURL != null) ResourceManager.cancel(_petURL,onBuluLoaded);
         _bulu.removeEventListener(MouseEvent.CLICK,onBulu);
         ToolTipManager.remove(_bulu);
         _exit.removeEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.remove(_exit);
      }
   }
}
