package com.robot.app.task.control
{
   import com.robot.app.task.skeeClothTask.SkeeClothTaskController;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import org.taomee.manager.ToolTipManager;

   // Project-authored replacement: the historical captain-room puzzle asset is missing.
   public class TaskController_7
   {
      private static const TASK_ID:uint = 7;
      private static const COLORS:Array = [0xe85050,0x398ee8,0x32c868,0xf5d849];
      private static const NAMES:Array = ["红","蓝","绿","黄"];
      private static const SEQUENCE:Array = [2,3,1,0];
      private var map:BaseMapProcess;
      private var clue:Sprite;
      private var lock:Sprite;
      private var panel:Sprite;
      private var message:TextField;
      private var entered:uint;
      private var destroyed:Boolean;
      private var busy:Boolean;
      private var ready:Boolean;

      public function TaskController_7(owner:BaseMapProcess)
      {
         map = owner;
         // Compact, labeled additions beside the rear console and right-hand display.
         clue = makeMarker("颜色线索",0x245e73,130,24);
         clue.x = 800; clue.y = 245;
         clue.addEventListener(MouseEvent.CLICK,onClue);
         ToolTipManager.add(clue,"防寒套装：颜色线索");
         map.conLevel.addChildAt(clue,0);
         lock = makeMarker("颜色密码箱",0x775b3c,84,24);
         lock.x = 655; lock.y = 155;
         lock.addEventListener(MouseEvent.CLICK,onLock);
         ToolTipManager.add(lock,"防寒套装：颜色密码箱");
         map.conLevel.addChildAt(lock,0);
         TasksController.runAfterTrackedTaskStatus(function():void { if(!destroyed) ready = true; },owner);
      }

      private function makeMarker(label:String, color:uint, width:Number, height:Number) : Sprite
      {
         var marker:Sprite = new Sprite();
         marker.graphics.lineStyle(2,0xcce7ee);
         marker.graphics.beginFill(color);
         marker.graphics.drawRoundRect(0,0,width,height,8,8);
         marker.graphics.endFill();
         var text:TextField = makeText(label,width,height,13,0xffffff);
         marker.addChild(text);
         marker.mouseChildren = false;
         marker.buttonMode = true;
         return marker;
      }

      private function makeText(value:String, width:Number, height:Number, size:uint, color:uint) : TextField
      {
         var field:TextField = new TextField();
         field.defaultTextFormat = new TextFormat("_sans",size,color,true,null,null,null,null,"center");
         field.width = width; field.height = height;
         field.text = value;
         field.selectable = false; field.mouseEnabled = false;
         return field;
      }

      private function onClue(event:MouseEvent) : void
      {
         NpcDialog.show(NPC.SEER,["右侧面板显示的颜色顺序是：绿、黄、蓝、红。去后方颜色密码箱试试看吧。"],["知道了"]);
      }

      private function onLock(event:MouseEvent) : void
      {
         if(busy) return;
         if(!ready)
         {
            NpcDialog.show(NPC.SEER,["任务状态正在加载，请稍后再试。"],["知道了"]);
            return;
         }
         var status:uint = TasksManager.getTaskStatus(TASK_ID);
         if(status == TasksManager.COMPLETE)
         {
            NpcDialog.show(NPC.SHIPER,["防寒套装任务已经完成，感谢你的帮助！"],["知道了"]);
            return;
         }
         if(status == TasksManager.ALR_ACCEPT)
         {
            NpcDialog.show(NPC.SHIPER,["你已经接取防寒套装任务。收集植物纤维和炎晶后，将材料交给茜茜。"],["知道了"]);
            return;
         }
         if(status != TasksManager.UN_ACCEPT)
         {
            NpcDialog.show(NPC.SEER,["无法确定任务状态，请稍后再试。"],["知道了"]);
            return;
         }
         if(!hasPrerequisite())
         {
            NpcDialog.show(NPC.SHIPER,["请先完成一项初始精灵任务，再来接取防寒套装任务。"],["知道了"]);
            return;
         }
         openPanel();
      }

      private function hasPrerequisite() : Boolean
      {
         for each(var id:uint in [85,86,87,88])
            if(TasksManager.getTaskStatus(id) == TasksManager.COMPLETE) return true;
         return false;
      }

      private function openPanel() : void
      {
         closePanel();
         entered = 0;
         panel = new Sprite();
         panel.x = 315; panel.y = 155;
         panel.graphics.lineStyle(3,0x9cd6e2);
         panel.graphics.beginFill(0x193c51);
         panel.graphics.drawRoundRect(0,0,330,170,14,14);
         panel.graphics.endFill();
         panel.addChild(makeText("颜色密码箱",330,28,18,0xffffff));
         message = makeText("按顺序点击四种颜色",330,28,14,0xffffff);
         message.y = 35; panel.addChild(message);
         for(var i:uint = 0; i < 4; i++)
         {
            var button:Sprite = makeMarker(NAMES[i],COLORS[i],56,38);
            button.name = String(i);
            button.x = 30 + i * 72; button.y = 73;
            button.addEventListener(MouseEvent.CLICK,onColor);
            panel.addChild(button);
         }
         var close:Sprite = makeMarker("取消",0x506a79,76,28);
         close.x = 127; close.y = 130;
         close.addEventListener(MouseEvent.CLICK,onClose);
         panel.addChild(close);
         LevelManager.appLevel.addChild(panel);
      }

      private function onColor(event:MouseEvent) : void
      {
         var index:uint = uint(event.currentTarget.name);
         if(index != SEQUENCE[entered])
         {
            entered = 0;
            message.text = "颜色顺序错误，已重置，请重新输入。";
            return;
         }
         entered++;
         if(entered < 4)
         {
            message.text = "已输入 " + entered + "/4，继续选择颜色。";
            return;
         }
         closePanel();
         NpcDialog.show(NPC.SHIPER,["你解开了颜色密码箱。我们需要制作防寒套装，请收集植物纤维和炎晶，再把材料交给茜茜。愿意帮忙吗？"],["接受任务","暂时离开"],[acceptTask]);
      }

      private function acceptTask() : void
      {
         if(destroyed || busy) return;
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.UN_ACCEPT || !hasPrerequisite())
         {
            onLock(null);
            return;
         }
         busy = true;
         TasksManager.accept(TASK_ID,function(success:Boolean):void
         {
            busy = false;
            if(success) SkeeClothTaskController.setup();
            if(destroyed) return;
            if(success)
               NpcDialog.show(NPC.SHIPER,["防寒套装任务接取成功。植物纤维和炎晶可按任意顺序收集。"],["出发"]);
            else
               NpcDialog.show(NPC.SHIPER,["接取失败，请检查任务状态和前置任务后重试。"],["知道了"]);
         });
      }

      private function onClose(event:MouseEvent) : void { closePanel(); }

      private function closePanel() : void
      {
         if(panel && panel.parent) panel.parent.removeChild(panel);
         panel = null; message = null; entered = 0;
      }

      public function destroy() : void
      {
         destroyed = true;
         closePanel();
         clue.removeEventListener(MouseEvent.CLICK,onClue);
         lock.removeEventListener(MouseEvent.CLICK,onLock);
         ToolTipManager.remove(clue); ToolTipManager.remove(lock);
         if(clue.parent) clue.parent.removeChild(clue);
         if(lock.parent) lock.parent.removeChild(lock);
         clue = null; lock = null; map = null;
      }
   }
}
