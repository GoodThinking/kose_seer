package com.robot.app.mapProcess
{
   import com.robot.app.control.*;
   import com.robot.app.task.petstory.*;
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.net.*;
   import com.robot.core.npc.*;
   import flash.events.*;
   import org.taomee.manager.*;
   
   public class MapProcess_498 extends BaseMapProcess
   {
      
      private var _shop:AppModel;
      
      public function MapProcess_498()
      {
         super();
      }
      
      override protected function init() : void
      {
         ToolTipManager.add(conLevel["hurdBtn"],"翻越障碍物");
         conLevel["hurdBtn"].buttonMode = true;
         conLevel["hurdBtn"].addEventListener(MouseEvent.CLICK,this.onMouseHurd);
         ToolTipManager.add(depthLevel["tugBtn"],"拔河大比拼");
         depthLevel["tugBtn"].buttonMode = true;
         depthLevel["tugBtn"].addEventListener(MouseEvent.CLICK,this.onTugBtn);
         ToolTipManager.add(depthLevel["jumpGameBtn"],"精灵攀高");
         depthLevel["jumpGameBtn"].buttonMode = true;
         depthLevel["jumpGameBtn"].addEventListener(MouseEvent.CLICK,this.onMouseJump);
         ToolTipManager.add(conLevel["robGameBtn"],"抢位置");
         conLevel["robGameBtn"].buttonMode = true;
         conLevel["robGameBtn"].addEventListener(MouseEvent.CLICK,this.onMouseRobLocality);
         ToolTipManager.add(conLevel["hitGameBtn"],"撞球");
         conLevel["hitGameBtn"].buttonMode = true;
         conLevel["hitGameBtn"].addEventListener(MouseEvent.CLICK,this.onMouseHitBall);
         ToolTipManager.add(conLevel["shop"],"嘉年华兑换点");
         conLevel["shop"].buttonMode = true;
         conLevel["shop"].addEventListener(MouseEvent.CLICK,this.onMouseShop);
         ToolTipManager.add(depthLevel["ferruleGameBtn"],"套圈");
         depthLevel["ferruleGameBtn"].buttonMode = true;
         depthLevel["ferruleGameBtn"].addEventListener(MouseEvent.CLICK,this.onMouseFerrule);
         conLevel["tangmi_mc"].buttonMode = true;
         conLevel["tangmi_mc"].addEventListener(MouseEvent.CLICK,this.onTangmi_mc);
         conLevel["hurdBtn"].vsible = true;
      }
      
      private function onTugBtn(param1:MouseEvent) : void
      {
         PetCarnivalController.getInstance().showRules(PetCarnivalController.TUG,[true,false,false,false,false]);
      }
      
      private function onMouseHurd(param1:MouseEvent) : void
      {
         PetCarnivalController.getInstance().showRules(PetCarnivalController.HURDLES,[false,false,false,false,true]);
      }
      
      private function onMouseJump(param1:MouseEvent) : void
      {
         PetCarnivalController.getInstance().showRules(PetCarnivalController.JUMP,[false,false,true,false,false]);
      }
      
      private function onMouseRobLocality(param1:MouseEvent) : void
      {
         PetCarnivalController.getInstance().showRules(PetCarnivalController.ROBLOCALITY,[true,false,false,false,true]);
      }
      
      private function onMouseHitBall(param1:MouseEvent) : void
      {
         SocketConnection.send(1022,86053868);
         PetCarnivalController.getInstance().showRules(PetCarnivalController.HITBALL,[true,false,false,false,true]);
      }
      
      private function onMouseFerrule(param1:MouseEvent) : void
      {
         SocketConnection.send(1022,86053869);
         PetCarnivalController.getInstance().showRules(PetCarnivalController.FERRULE,[true,false,true,false,false]);
      }
      
      private function onMouseShop(param1:MouseEvent) : void
      {
         if(!this._shop)
         {
            this._shop = new AppModel(ClientConfig.getAppModule("PetCarvinalShopPanel"),"正在加载面板....");
            this._shop.setup();
         }
         this._shop.show();
      }
      
      private function onTangmi_mc(param1:MouseEvent) : void
      {
         NpcDialog.show(NPC.TANGMI,["各位亲爱的小XIN，嘉年华积分还礼活动开始啦！积分越多获得的奖励就越丰厚哦！快去兑换点看看吧！很多惊喜等着你哦！"],["哈哈！太好了，我这就去附近的兑换点瞧瞧！"]);
      }
      
      override public function destroy() : void
      {
         ToolTipManager.remove(conLevel["hurdMC"]);
         ToolTipManager.remove(depthLevel["tugBtn"]);
         ToolTipManager.remove(depthLevel["jumpGameBtn"]);
         ToolTipManager.remove(conLevel["robGameBtn"]);
         ToolTipManager.remove(conLevel["hitGameBtn"]);
         ToolTipManager.remove(conLevel["shop"]);
         conLevel["hurdMC"].removeEventListener(MouseEvent.CLICK,this.onMouseHurd);
         depthLevel["tugBtn"].removeEventListener(MouseEvent.CLICK,this.onTugBtn);
         depthLevel["jumpGameBtn"].removeEventListener(MouseEvent.CLICK,this.onMouseJump);
         conLevel["robGameBtn"].removeEventListener(MouseEvent.CLICK,this.onMouseRobLocality);
         conLevel["hitGameBtn"].removeEventListener(MouseEvent.CLICK,this.onMouseHitBall);
         conLevel["shop"].removeEventListener(MouseEvent.CLICK,this.onMouseShop);
         Task636.destory();
         Task_639.getInstance().destory();
      }
   }
}

