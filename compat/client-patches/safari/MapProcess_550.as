package com.robot.app.mapProcess
{
   import com.robot.core.controller.CameraController;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.text.TextField;
   import flash.text.TextFormat;

   // 克洛斯星的湿地（原版精灵捕猎场，2011-06/07）。简化版：当普通野外地图，捕猎场的精灵按普通野怪刷新。
   // 地图 1920×1120，镜头交给客户端已有的 CameraController（赫鲁卡城 461 同款，上下左右都能滚），LevelManager 的横向滚屏对 550 不生效。
   public class MapProcess_550 extends BaseMapProcess
   {

      // 捕猎场玩法的物件：精之子、传送阵、湖怪、钓竿、管理员、狐狸许愿、海报、陷阱、提示箭头、过场动画
      private static const HIDDEN_CONTROL:Array = ["mysteriousManMC","mysteriousManMCPop","sm_zone","sm_sprite","monster_dd","fishPole"];

      private static const HIDDEN_DEPTH:Array = ["glyNPCMc","fcsMc","foxWish_MC","addBtn","trap_0","trap_1","trap_2","guide_mc","lakeMonster"];

      private var backButton:Sprite;

      public function MapProcess_550()
      {
         super();
      }

      override protected function init() : void
      {
         var item:String = null;
         for each(item in HIDDEN_CONTROL)
         {
            conLevel[item].visible = false;
         }
         for each(item in HIDDEN_DEPTH)
         {
            depthLevel[item].visible = false;
         }
         topLevel["sendTTT"].visible = false;
         CameraController.setup(MapManager.currentMap,MainManager.actorModel,new Rectangle(0,0,1920,1120));
         this.initBackButton();
      }

      // 右上角的门原本通往烈焰丛林（这版没有），回克洛斯星放一个按钮在进场点旁边
      private function initBackButton() : void
      {
         var label:TextField = new TextField();
         var format:TextFormat = new TextFormat();
         this.backButton = new Sprite();
         this.backButton.graphics.lineStyle(2,9362175);
         this.backButton.graphics.beginFill(1455168,0.92);
         this.backButton.graphics.drawRoundRect(0,0,110,26,8,8);
         this.backButton.graphics.endFill();
         format.size = 14;
         format.color = 16777215;
         label.defaultTextFormat = format;
         label.text = "返回克洛斯星";
         label.width = 110;
         label.height = 22;
         label.x = 12;
         label.y = 3;
         label.selectable = false;
         label.mouseEnabled = false;
         this.backButton.addChild(label);
         this.backButton.x = 40;
         this.backButton.y = 960;
         this.backButton.buttonMode = true;
         this.backButton.mouseChildren = false;
         this.backButton.addEventListener(MouseEvent.CLICK,this.onBack);
         conLevel.addChild(this.backButton);
      }

      private function onBack(param1:MouseEvent) : void
      {
         MapManager.changeMap(10);
      }

      override public function destroy() : void
      {
         this.backButton.removeEventListener(MouseEvent.CLICK,this.onBack);
      }
   }
}
