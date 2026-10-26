package com.robot.core.ui.nono
{
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.text.TextField;

   public class PetTrainingPanel
   {
      private static var panel:PetWorkflowUI;
      private static var state:Object;
      private static var chosen:uint=0;
      private static var target:TextField;
      private static var preview:Object;
      private static var targetLevel:uint=100;

      public static function show():void
      {
         hide();state=null;preview=null;chosen=0;
         panel=new PetWorkflowUI("经验分配仪 · 按目标等级培养",function():void{panel=null;});
         render();send({operation:"state"});
      }
      public static function hide():void { if(panel!=null)panel.close();panel=null; }
      private static function send(input:Object):void
      {
         var owner:PetWorkflowUI=panel;
         if(owner==null||PetWorkflowClient.busy(91021))return;
         owner.message("正在读取实际状态，请稍候…");
         PetWorkflowClient.request(91021,input,function(value:Object):void{
            if(panel!==owner||owner.disposed)return;
            if(value.ok){state=value;if(value.preview!=null)preview=value.preview;else preview=null;
               if(chosen==0&&state.pets.length)choose(state.pets[0],false);}
            else preview=null;
            render();owner.message(value.ok?(value.message!=null?String(value.message):"预览不会扣除经验；确认分配后才执行一次。"):String(value.error));
         });
         render();
      }
      private static function choose(pet:Object,redraw:Boolean=true):void
      {
         chosen=pet.catchTime;targetLevel=Math.min(100,pet.level+1);preview=null;
         if(redraw)render();
      }
      private static function chooseAction(pet:Object):Function { return function():void{choose(pet);}; }
      private static function render():void
      {
         if(panel==null)return;
         panel.clear();var body:Sprite=panel.body;
         var waiting:Boolean=PetWorkflowClient.busy(91021);
         PetWorkflowUI.text(body,"选择背包精灵",0,0,220,26,15,true);
         var pet:Object=null;
         if(state!=null){
            PetWorkflowUI.text(body,"可分配经验："+state.pool,240,0,440,27,16,true);
            for(var i:uint=0;i<state.pets.length;i++){
               var entry:Object=state.pets[i];if(entry.catchTime==chosen)pet=entry;
               PetWorkflowUI.button(body,(entry.catchTime==chosen?"▶ ":"")+entry.name+" Lv."+entry.level,0,38+i*45,214,chooseAction(entry),!waiting);
            }
         }
         if(pet==null){PetWorkflowUI.text(body,state==null?"读取中…":"背包没有可培养的精灵。",240,55,440,60,14);}
         else {
            PetWorkflowUI.text(body,pet.name+" · 当前 "+pet.level+"级",240,39,440,30,17,true);
            PetWorkflowUI.text(body,"目标等级",240,80,100,25);
            target=PetWorkflowUI.input(body,String(targetLevel),338,76,80,true);
            target.mouseEnabled=!waiting;
            target.addEventListener(Event.CHANGE,function(event:Event):void{
               var raw:String=target.text;var start:int=target.selectionBeginIndex;var end:int=target.selectionEndIndex;
               targetLevel=uint(raw);preview=null;render();target.text=raw;
               if(panel.stage){panel.stage.focus=target;target.setSelection(start,end);}
               panel.message("目标等级已变化，请重新计算所需经验。");
            });
            PetWorkflowUI.button(body,"升一级",430,76,104,function():void{targetLevel=Math.min(100,pet.level+1);preview=null;render();},!waiting&&pet.level<100);
            PetWorkflowUI.button(body,"升到100级",546,76,130,function():void{targetLevel=100;preview=null;render();},!waiting&&pet.level<100);
            PetWorkflowUI.button(body,"计算所需经验",240,122,176,function():void{preview=null;send({operation:"preview",catchTime:chosen,target:targetLevel});},!waiting&&pet.level<100);
            if(preview!=null){
               var lines:String=preview.from+"级 → "+preview.target+"级\n需要经验："+preview.cost+"\n分配后余额："+(Number(state.pool)-Number(preview.cost));
               for each(var form:Object in preview.forms)lines+="\n"+form.level+"级进化为"+form.name;
               var detail:TextField=PetWorkflowUI.text(body,lines,240,173,438,124,14,true);detail.multiline=true;detail.wordWrap=true;
               PetWorkflowUI.button(body,preview.affordable?"确认分配":"经验池不足",240,307,176,apply,!waiting&&preview.affordable);
            } else PetWorkflowUI.text(body,pet.level>=100?"已满级，不再消耗经验。":"按本服成长、当前经验和进化规则精确计算。",240,180,440,44,13);
         }
         PetWorkflowUI.button(body,"刷新实际状态",0,310,214,function():void{preview=null;send({operation:"state"});},!waiting);
      }
      private static function apply():void
      {
         if(preview==null||panel==null)return;
         var value:Object=preview;preview=null;
         send({operation:"apply",catchTime:value.catchTime,target:value.target,revision:value.revision});
      }
   }
}
