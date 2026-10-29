package com.robot.groupFight.control.panel
{
   import com.robot.groupFight.control.panel.ui.btns.EscapeBtn;
   import com.robot.groupFight.control.panel.ui.btns.FightBtn;
   import com.robot.groupFight.control.panel.ui.btns.IControlBtns;
   import com.robot.groupFight.control.panel.ui.btns.ItemBtn;
   import com.robot.groupFight.control.panel.ui.btns.PetBtn;
   import flash.display.Sprite;
   import org.taomee.utils.DisplayUtil;
   
   public class ToolBtnPanelObserver extends BasePanelObserver
   {
      
      private var _panel:Sprite;
      
      private var _fightBtn:IControlBtns;
      
      private var _itemBtn:IControlBtns;
      
      private var _escapeBtn:IControlBtns;
      
      private var _petBtn:IControlBtns;
      
      private var _btnArr:Array;
      
      public function ToolBtnPanelObserver(s:FightToolSubject, panel:Sprite, ctlPanel:ControlPanelObserver)
      {
         super(s);
         this._panel = panel;
         this._fightBtn = new FightBtn(panel["fightBtn"],ctlPanel);
         this._itemBtn = new PetBtn(panel["petBtn"],ctlPanel);
         this._escapeBtn = new ItemBtn(panel["itemBtn"],ctlPanel);
         this._petBtn = new EscapeBtn(panel["escapeBtn"],ctlPanel);
         this._btnArr = [this._fightBtn,this._itemBtn,this._petBtn,this._escapeBtn];
      }
      
      override public function open() : void
      {
         var i:IControlBtns = null;
         for each(i in this._btnArr)
         {
            i.openBtn();
         }
      }
      
      override public function close() : void
      {
         var i:IControlBtns = null;
         for each(i in this._btnArr)
         {
            i.closeBtn();
         }
      }
      
      override public function destroy() : void
      {
         var i:IControlBtns = null;
         for each(i in this._btnArr)
         {
            i.destroy();
         }
         this._btnArr = [];
         if(Boolean(this._panel))
         {
            DisplayUtil.removeAllChild(this._panel);
            DisplayUtil.removeForParent(this._panel);
            this._panel = null;
         }
      }
   }
}

