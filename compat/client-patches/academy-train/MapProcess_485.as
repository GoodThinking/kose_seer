package com.robot.app.mapProcess
{
   import com.robot.app.task.petstory.app.train.TrainData;
   import com.robot.app.task.petstory.app.train.TrainGradePanel;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.DisplayObject;
   import flash.display.InteractiveObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   import flash.text.TextFormat;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   public class MapProcess_485 extends BaseMapProcess
   {
      private var _labels:Sprite;

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
         this.bindTarget(conLevel["lowGrade"],"初级学习力训练室（单场+5学习力）",this.onLowClick);
         this.bindTarget(conLevel["highGrade"],"高级学习力训练室（单场+10学习力）",this.onHighClick);
         this.bindTarget(conLevel["testMC"],"经验与学习力特训总台（按属性与阶段等级刷经验）",this.onExpClick);
         this.bindTarget(conLevel["trialsMC"],"经验特训传送台（按属性与阶段等级刷经验）",this.onExpClick);
         this.bindTarget(conLevel["trainDoor"],"进入综合训练室（可选刷学习力 / 刷经验）",this.onExpClick);
         this.bindTarget(conLevel["schoolBtn"],"打开学习力与经验特训手册",this.onExpClick);
         this.bindTarget(conLevel["door0_btn"],"返回精灵太空站",this.onExitClick);
         this.bindTarget(conLevel["door_663"],"进入综合训练室",this.onExpClick);

         this._labels = new Sprite();
         this._labels.mouseEnabled = false;
         this._labels.mouseChildren = false;
         this.addBadge("返回太空站",345,172,11525887);
         this.addBadge("初级学习力",412,216,6750054);
         this.addBadge("经验/学习力总台",484,185,16772252);
         this.addBadge("高级学习力",564,216,6750054);
         this.addBadge("综合训练室大门",625,172,16772252);
         this.addBadge("点击进入【按属性与阶段等级刷经验】",485,375,16772252);
         conLevel.addChild(this._labels);
      }

      private function bindTarget(obj:DisplayObject, tip:String, handler:Function) : void
      {
         if(!obj)
         {
            return;
         }
         var io:InteractiveObject = obj as InteractiveObject;
         if(io)
         {
            ToolTipManager.add(io,tip);
            io.addEventListener(MouseEvent.CLICK,handler);
         }
         var sp:Sprite = obj as Sprite;
         if(sp)
         {
            sp.buttonMode = true;
            sp.mouseChildren = false;
         }
      }

      private function addBadge(text:String, cx:Number, cy:Number, color:uint) : void
      {
         var tf:TextField = new TextField();
         var fmt:TextFormat = new TextFormat("宋体",13,color,true);
         tf.defaultTextFormat = fmt;
         tf.autoSize = TextFieldAutoSize.CENTER;
         tf.text = text;
         tf.selectable = false;
         tf.mouseEnabled = false;
         tf.filters = [new GlowFilter(668267,0.95,3,3,6)];
         tf.x = cx - tf.width / 2;
         tf.y = cy;
         this._labels.addChild(tf);
      }

      private function onLowClick(e:MouseEvent) : void
      {
         this.openLowTrainGradePanel();
      }

      private function onHighClick(e:MouseEvent) : void
      {
         this.openHighTrainGradePanel();
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
         TrainData.mode = 0;
         TrainData.trainGrade = 1;
         TrainGradePanel.show(0);
      }

      public function openLowTrainGradePanel() : void
      {
         TrainData.mode = 0;
         TrainData.trainGrade = 0;
         TrainGradePanel.show(0);
      }

      override public function destroy() : void
      {
         if(this._labels)
         {
            DisplayUtil.removeForParent(this._labels);
            this._labels = null;
         }
         this.unbindTarget(conLevel["lowGrade"],this.onLowClick);
         this.unbindTarget(conLevel["highGrade"],this.onHighClick);
         this.unbindTarget(conLevel["testMC"],this.onExpClick);
         this.unbindTarget(conLevel["trialsMC"],this.onExpClick);
         this.unbindTarget(conLevel["trainDoor"],this.onExpClick);
         this.unbindTarget(conLevel["schoolBtn"],this.onExpClick);
         this.unbindTarget(conLevel["door0_btn"],this.onExitClick);
         this.unbindTarget(conLevel["door_663"],this.onExpClick);
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
