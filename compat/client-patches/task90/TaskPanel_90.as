package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_90;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.utils.TextFormatUtil;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_90 extends Sprite implements IModule
   {
      private var mainUI:MovieClip;
      private var _txt:TextField;
      private var _close_btn:SimpleButton;
      private var _tip_mc:MovieClip;
      private var _canDeliver:Boolean = false;

      public function TaskPanel_90()
      {
         super();
      }

      public function hide() : void
      {
         DisplayUtil.removeForParent(mainUI);
      }

      public function init(data:Object = null) : void
      {
      }

      public function show() : void
      {
         _canDeliver = false;
         _tip_mc.buttonMode = false;
         TasksManager.getProStatusList(TaskController_90.TASK_ID,function(arr:Array):void
         {
            if(!arr[0])
            {
               _tip_mc.gotoAndStop(1);
               _txt.htmlText = "    看看能不能直接用胶囊捕获这只皮皮" + TextFormatUtil.getRedTxt("（点击皮皮）");
               ToolTipManager.add(_tip_mc,"点击皮皮");
            }
            else if(Boolean(arr[0]) && !arr[1])
            {
               _tip_mc.gotoAndStop(2);
               _txt.htmlText = "    与" + TextFormatUtil.getRedTxt("野生的皮皮") + "对战，使用精灵胶囊捕获它！<br>    已经抓到了？" + TextFormatUtil.getRedTxt("点击下方胶囊图片交付任务") + "，背包或仓库中的皮皮均可。";
               _canDeliver = TasksManager.getTaskStatus(TaskController_90.TASK_ID) == TasksManager.ALR_ACCEPT;
               _tip_mc.buttonMode = _canDeliver;
               ToolTipManager.add(_tip_mc,"已捕获皮皮：点击交付任务，无需再次捕捉");
            }
            else if(Boolean(arr[1]) && !arr[2])
            {
               _tip_mc.gotoAndStop(3);
               _txt.htmlText = "    捕获的皮皮将成为你探索精灵世界的得力助手，或许将成为你日后最信赖伙伴。" + TextFormatUtil.getRedTxt("（你已经经历了在宇宙中探索精灵世界的第一关。）");
               ToolTipManager.add(_tip_mc,"皮皮是克洛斯星最常见的精灵");
            }
         });
         DisplayUtil.align(mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(mainUI);
      }

      private function clickDeliverHandler(e:MouseEvent) : void
      {
         if(!_canDeliver)
         {
            return;
         }
         TasksManager.complete(TaskController_90.TASK_ID,1,function(success:Boolean):void
         {
            if(success)
            {
               _canDeliver = false;
               hide();
            }
         });
      }

      private function clickCloseHandler(e:MouseEvent) : void
      {
         hide();
      }

      public function destroy() : void
      {
         _close_btn.removeEventListener(MouseEvent.CLICK,clickCloseHandler);
         _tip_mc.removeEventListener(MouseEvent.CLICK,clickDeliverHandler);
         ToolTipManager.remove(_tip_mc);
         _tip_mc = null;
         _close_btn = null;
         mainUI = null;
      }

      public function setup() : void
      {
         mainUI = new Task90PanelUI();
         _close_btn = mainUI["close_btn"];
         _txt = mainUI["txt"];
         _tip_mc = mainUI["tip"];
         _tip_mc.gotoAndStop(1);
         _tip_mc.mouseChildren = false;
         _tip_mc.addEventListener(MouseEvent.CLICK,clickDeliverHandler);
         _close_btn.addEventListener(MouseEvent.CLICK,clickCloseHandler);
      }
   }
}
