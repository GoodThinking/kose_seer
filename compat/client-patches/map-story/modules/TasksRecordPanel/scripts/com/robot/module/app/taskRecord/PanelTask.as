package com.robot.module.app.taskRecord
{
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.module.app.TasksRecordPanel;
   import com.robot.module.app.taskRecord.menu.NodeData;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.getDefinitionByName;
   import org.taomee.component.control.MLoadPane;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   
   public class PanelTask
   {
      
      private var _tasknameTxt:TextField;
      
      private var _taskintroTxt:TextField;
      
      private var _data:NodeData;
      
      private var _taskOutPutTxt:TextField;
      
      private var _showTaskProcessBtn:SimpleButton;
      
      private var _npcImageMC:MovieClip;
      
      private var _parent:TasksRecordPanel;
      
      private var _tasktipTxt:TextField;
      
      private var _gotoBtn:SimpleButton;
      
      public function PanelTask(data:NodeData, parent:TasksRecordPanel)
      {
         super();
         _data = data;
         _parent = parent;
      }
      
      private function addNpc() : void
      {
         var _url:String = "resource/taskNpc/" + _data.npc + ".swf";
         ResourceManager.getResource(_url,onNpcHandler,"npc");
      }
      
      private function initInfo() : void
      {
         _tasknameTxt.htmlText = _data.name;
         if(TasksManager.getTaskStatus(uint(_data.id)) == TasksManager.COMPLETE || _data.offline == "1")
         {
            _gotoBtn.visible = false;
            _showTaskProcessBtn.visible = false;
            _taskintroTxt.htmlText = "    " + _data.stopDes;
         }
         else if(TasksManager.getTaskStatus(uint(_data.id)) == TasksManager.ALR_ACCEPT)
         {
            _gotoBtn.visible = false;
            _showTaskProcessBtn.visible = true;
            _taskintroTxt.htmlText = "    " + _data.startDes;
         }
         else
         {
            _gotoBtn.visible = true;
            _showTaskProcessBtn.visible = false;
            _taskintroTxt.htmlText = "    " + _data.startDes;
         }
         var out:String = "";
         for(var i1:int = 0; i1 < _data.outPutArr.length; i1++)
         {
            out += _data.outPutArr[i1] + "\n";
         }
         _taskOutPutTxt.htmlText = out;
         if(_data.outPutArr.length > 2)
         {
            var rewardFormat:TextFormat = _taskOutPutTxt.getTextFormat();
            rewardFormat.leading = 0;
            _taskOutPutTxt.setTextFormat(rewardFormat);
         }
         addNpc();
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoHandler);
         _showTaskProcessBtn.addEventListener(MouseEvent.CLICK,onShowTaskHandler);
      }
      
      private function onGotoHandler(e:MouseEvent) : void
      {
         if(TasksManager.getTaskStatus(uint(_data.id)) == TasksManager.UN_ACCEPT)
         {
            MapManager.changeMap(uint(_data.mapId));
         }
         _parent.hide();
      }
      
      private function onNpcHandler(mc:DisplayObject) : void
      {
         var _icon:MLoadPane = null;
         if(mc)
         {
            _icon = new MLoadPane(mc);
            if(mc.width > mc.height)
            {
               _icon.fitType = MLoadPane.FIT_WIDTH;
            }
            else
            {
               _icon.fitType = MLoadPane.FIT_HEIGHT;
            }
            _icon.setSizeWH(120,120);
            _npcImageMC.addChild(mc);
         }
         if(TasksManager.getTaskStatus(uint(_data.id)) !== TasksManager.COMPLETE)
         {
            ToolTipManager.add(_npcImageMC,_data.tip);
         }
         else
         {
            ToolTipManager.remove(_npcImageMC);
         }
      }
      
      public function initPanel() : MovieClip
      {
         var panel:MovieClip = new Panel3();
         _tasknameTxt = panel["taskname"];
         _tasktipTxt = panel["tasktip"];
         _taskintroTxt = panel["taskintro"];
         _taskOutPutTxt = panel["taskOutPut"];
         _gotoBtn = panel["gotoBtn"];
         _showTaskProcessBtn = panel["showTaskProcess"];
         _npcImageMC = panel["npcImage"];
         if(_data.outPutArr.length > 2)
         {
            // The captured Panel3 places its two reward background layers immediately before this field.
            var rewardIndex:int = panel.getChildIndex(_taskOutPutTxt);
            for(var backgroundIndex:int = rewardIndex - 2; backgroundIndex < rewardIndex; backgroundIndex++)
            {
               var background:DisplayObject = panel.getChildAt(backgroundIndex);
               background.width = 220;
               background.height = 98;
            }
            _taskOutPutTxt.width = 210;
            _taskOutPutTxt.height = 86;
         }
         initInfo();
         return panel;
      }
      
      private function onShowTaskHandler(e:MouseEvent) : void
      {
         var path:String = null;
         var cls:Object = null;
         try
         {
            path = "com.robot.app.task.control.TaskController_" + _data.id;
            cls = getDefinitionByName(path) as Class;
            cls.showPanel();
            _parent.hide();
         }
         catch(e:Error)
         {
            trace("error==/==" + e.message);
         }
      }
   }
}

