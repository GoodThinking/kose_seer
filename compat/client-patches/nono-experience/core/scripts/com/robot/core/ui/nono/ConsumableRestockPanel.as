package com.robot.core.ui.nono
{
   import com.robot.core.manager.ItemManager;
   import com.robot.core.manager.MainManager;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.text.TextField;

   public class ConsumableRestockPanel
   {
      private static var panel:PetWorkflowUI;
      private static var state:Object;
      private static var selected:uint;
      private static var amount:uint=20;
      private static var mode:String="count";
      private static var query:String="";
      private static var page:uint=0;
      private static var search:TextField;
      private static var quantity:TextField;
      private static var preview:Object;
      private static var recent:Array=[];
      public static function show():void
      {
         hide();state=null;preview=null;query="";page=0;
         var saved:Object=PetWorkflowUI.loadLocal("restock",{});
         selected=uint(saved.itemId);amount=saved.amount==null?20:uint(saved.amount);mode=saved.mode=="target"?"target":"count";recent=saved.recent is Array?saved.recent:[];
         panel=new PetWorkflowUI("道具补货 · 赛尔豆消耗预览",function():void{panel=null;});
         render();send({operation:"state"});
      }
      public static function hide():void { if(panel!=null)panel.close();panel=null; }
      private static function send(input:Object):void
      {
         var owner:PetWorkflowUI=panel;
         if(owner==null||PetWorkflowClient.busy(91022))return;
         owner.message("正在读取实际库存和价格…");
         PetWorkflowClient.request(91022,input,function(value:Object):void{
            if(panel!==owner||owner.disposed)return;
            var local:Boolean=true;
            if(value.ok){
               state=value;preview=value.preview;
               MainManager.actorInfo.coins=uint(value.coins);
               if(selected==0&&state.products.length)selected=state.products[0].itemId;
               if(value.purchased!=null){
                  ItemManager.getPetItem();
                  var index:int=recent.indexOf(value.purchased.itemId);if(index>=0)recent.splice(index,1);recent.unshift(value.purchased.itemId);recent=recent.slice(0,12);
                  local=PetWorkflowUI.saveLocal("restock",{itemId:selected,amount:amount,mode:mode,recent:recent});
               }
            } else preview=null;
            render();owner.message(value.ok?(value.message!=null?String(value.message):"最近购买仅按本机当前账号记忆；不会自动补货。"):String(value.error));
            if(!local)owner.message("购买已完成；本机存储不可用，最近购买未能记住。");
         });render();
      }
      private static function choose(product:Object):Function
      {
         return function():void{selected=product.itemId;preview=null;render();};
      }
      private static function render():void
      {
         if(panel==null)return;
         panel.clear();var body:Sprite=panel.body;var waiting:Boolean=PetWorkflowClient.busy(91022);
         search=PetWorkflowUI.input(body,query,0,0,300);
         search.mouseEnabled=!waiting;
         search.addEventListener(Event.CHANGE,function(event:Event):void{
            query=search.text;page=0;render();if(panel!=null&&panel.stage){panel.stage.focus=search;search.setSelection(search.text.length,search.text.length);}
         });
         var rows:Array=[];var product:Object=null;
         if(state!=null)for each(var item:Object in state.products){
            if(item.itemId==selected)product=item;
            if(query==""||String(item.name).indexOf(query)>=0||String(item.itemId)==query)rows.push(item);
         }
         rows.sort(function(a:Object,b:Object):Number{
            var ai:int=recent.indexOf(a.itemId);var bi:int=recent.indexOf(b.itemId);
            if(ai<0)ai=999;if(bi<0)bi=999;
            return ai!=bi ? ai-bi : Number(a.itemId)-Number(b.itemId);
         });
         page=Math.min(page,Math.max(0,Math.ceil(rows.length/7)-1));
         for(var i:uint=page*7;i<Math.min(rows.length,(page+1)*7);i++){
            item=rows[i];
            PetWorkflowUI.button(body,(item.itemId==selected?"▶ ":"")+item.name+" · "+item.price+"豆",0,37+(i-page*7)*36,300,choose(item),!waiting);
         }
         if(rows.length==0)PetWorkflowUI.text(body,state==null?"读取中…":"没有匹配的可补货道具。",0,65,300,45);
         PetWorkflowUI.button(body,"上一页",0,303,90,function():void{if(page>0)page--;render();},!waiting&&page>0);
         PetWorkflowUI.text(body,(page+1)+" / "+Math.max(1,Math.ceil(rows.length/7)),105,309,90,24);
         PetWorkflowUI.button(body,"下一页",210,303,90,function():void{page++;render();},!waiting&&(page+1)*7<rows.length);
         PetWorkflowUI.text(body,"赛尔豆："+(state==null?"读取中":state.coins),330,0,360,30,17,true);
         if(product!=null){
            PetWorkflowUI.text(body,product.name,330,40,360,29,17,true);
            PetWorkflowUI.text(body,"当前库存 "+product.stock+" / "+product.max+" · 单价 "+product.price+"豆",330,76,360,25);
            PetWorkflowUI.button(body,mode=="count"?"✓ 购买数量":"购买数量",330,111,145,function():void{mode="count";preview=null;render();},!waiting);
            PetWorkflowUI.button(body,mode=="target"?"✓ 补到库存":"补到库存",490,111,145,function():void{mode="target";preview=null;render();},!waiting);
            PetWorkflowUI.text(body,mode=="count"?"本次买几个":"库存补到几个",330,154,150,26);
            quantity=PetWorkflowUI.input(body,String(amount),490,150,145,true);quantity.mouseEnabled=!waiting;
            quantity.addEventListener(Event.CHANGE,function(event:Event):void{
               var raw:String=quantity.text;var start:int=quantity.selectionBeginIndex;var end:int=quantity.selectionEndIndex;
               amount=uint(raw);preview=null;render();quantity.text=raw;
               if(panel.stage){panel.stage.focus=quantity;quantity.setSelection(start,end);}
               panel.message("数量已变化，请重新计算费用。");
            });
            PetWorkflowUI.button(body,"计算本次费用",330,194,180,function():void{preview=null;send({operation:"preview",itemId:selected,mode:mode,amount:amount});},!waiting);
            if(preview!=null){
               var detail:TextField=PetWorkflowUI.text(body,"本次购买 "+preview.count+" 个\n总价 "+preview.total+" 豆 · 剩余 "+preview.after+" 豆",330,239,360,57,14,true);detail.multiline=true;
               PetWorkflowUI.button(body,preview.count==0?"库存足够，无需购买":preview.after<0?"赛尔豆不足":"确认购买",330,303,222,apply,!waiting&&preview.count>0&&preview.after>=0);
            }
         }
         PetWorkflowUI.button(body,"刷新",610,303,80,function():void{preview=null;send({operation:"state"});},!waiting);
      }
      private static function apply():void
      {
         if(preview==null||panel==null)return;
         var value:Object=preview;preview=null;
         send({operation:"apply",itemId:value.itemId,mode:value.mode,amount:value.amount,revision:value.revision});
      }
   }
}
