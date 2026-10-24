package com.robot.app.mapProcess
{
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.events.*;
   import org.taomee.manager.*;
   
   public class MapProcess_478 extends BaseMapProcess
   {
      
      private var hasClick_B:Boolean;
      
      private var panel:AppModel;
      
      private var panel_641:AppModel;
      
      public function MapProcess_478()
      {
         super();
      }
      
      override protected function init() : void
      {
         topLevel.mouseEnabled = false;
         topLevel.mouseChildren = false;
         conLevel["activity"].visible = false;
         conLevel["boss"].visible = false;
         var _loc1_:int = 0;
         while(_loc1_ < 5)
         {
            conLevel["pet" + _loc1_].visible = false;
            _loc1_++;
         }
         ToolTipManager.add(conLevel["hot_A"],"黑色花苞");
         conLevel["hot_A"].buttonMode = true;
         conLevel["hot_A"].addEventListener(MouseEvent.CLICK,this.onHotClick_A);
         ToolTipManager.add(conLevel["hot_B"],"藤蔓");
         conLevel["hot_B"].buttonMode = true;
         conLevel["hot_B"].addEventListener(MouseEvent.CLICK,this.onHotClick_B);
         ToolTipManager.add(conLevel["hot_C"],"石壁");
         conLevel["hot_C"].buttonMode = true;
         conLevel["hot_C"].addEventListener(MouseEvent.CLICK,this.onHotClick_C);
         ToolTipManager.add(conLevel["hot_D"],"绿叶");
         conLevel["hot_D"].buttonMode = true;
         conLevel["hot_D"].addEventListener(MouseEvent.CLICK,this.onHotClick_D);
         ToolTipManager.add(conLevel["pet0"],"皮卡");
         ToolTipManager.add(conLevel["pet1"],"刹洛眼");
         ToolTipManager.add(conLevel["pet2"],"尼奥");
         ToolTipManager.add(conLevel["pet3"],"佩希");
         ToolTipManager.add(conLevel["pet4"],"卡普");
         conLevel["poster"].buttonMode = true;
         ToolTipManager.add(conLevel["poster"],"微亮的石板");
         conLevel["poster"].addEventListener(MouseEvent.CLICK,this.onClickPoster);
         if(Boolean(topLevel["arrow"]))
         {
            topLevel["arrow"].visible = false;
         }
         if(Boolean(conLevel["arrow"]))
         {
            conLevel["arrow"].visible = false;
         }
      }
      
      private function onClickPoster(param1:Event) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("DreamSpacePanel"));
      }
      
      private function onHotClick_A(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         AnimateManager.playMcAnimate(conLevel["hot_A"],1,"mc",function():void
         {
         });
      }
      
      private function onHotClick_B(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         ToolTipManager.remove(conLevel["hot_B"]);
         conLevel["hot_B"].buttonMode = false;
         conLevel["hot_B"].removeEventListener(MouseEvent.CLICK,this.onHotClick_B);
         AnimateManager.playMcAnimate(conLevel["hot_B"],0,"",function():void
         {
            AnimateManager.playMcAnimate(conLevel["tree"],0,"",function():void
            {
               hasClick_B = true;
            });
         });
      }
      
      private function onHotClick_C(param1:MouseEvent) : void
      {
         if(this.hasClick_B)
         {
            if(!this.panel)
            {
               this.panel = new AppModel(ClientConfig.getAppModule("MapIntroPanel_478"),"正在加载面板");
               this.panel.setup();
            }
            this.panel.show();
         }
         else
         {
            NpcDialog.show(NPC.SEER,["咦？石壁上似乎写了上面？好像被树藤给挡住咯！"],["（点击树藤）"]);
         }
      }
      
      private function onHotClick_D(param1:MouseEvent) : void
      {
         if(!this.panel_641)
         {
            this.panel_641 = new AppModel(ClientConfig.getAppModule("TaskIntroPanel_641"),"正在加载面板");
            this.panel_641.setup();
         }
         this.panel_641.show();
      }
      
      override public function destroy() : void
      {
         ToolTipManager.remove(conLevel["poster"]);
         ToolTipManager.remove(conLevel["pet0"]);
         ToolTipManager.remove(conLevel["pet1"]);
         ToolTipManager.remove(conLevel["pet2"]);
         ToolTipManager.remove(conLevel["pet3"]);
         ToolTipManager.remove(conLevel["pet4"]);
         CommonUI.removeYellowExcal(conLevel["boss"]);
         ToolTipManager.remove(conLevel["hot_A"]);
         conLevel["hot_A"].removeEventListener(MouseEvent.CLICK,this.onHotClick_A);
         ToolTipManager.remove(conLevel["hot_B"]);
         conLevel["hot_B"].removeEventListener(MouseEvent.CLICK,this.onHotClick_B);
         ToolTipManager.remove(conLevel["hot_C"]);
         conLevel["hot_C"].removeEventListener(MouseEvent.CLICK,this.onHotClick_C);
         ToolTipManager.remove(conLevel["hot_D"]);
         conLevel["hot_D"].removeEventListener(MouseEvent.CLICK,this.onHotClick_D);
      }
   }
}

