package com.robot.core.ui.nono
{
   import com.robot.app.nono.featureApp.App_700002;
   import com.robot.app.nono.featureApp.App_700018;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.net.SocketConnection;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.TimerEvent;
   import flash.text.TextField;
   import flash.utils.Timer;
   import flash.utils.getTimer;

   public class HatchStatusPanel
   {
      private static var panel:PetWorkflowUI;
      private static var state:Object;
      private static var owner:uint=0;
      private static var timer:Timer;
      private static var sampled:int=0;
      private static var lastQuery:int=-60000;
      private static var notice:Sprite;
      private static var seen:Array=[];
      private static var labels:Array=[];
      private static var page:uint=0;
      private static var forceQuery:Boolean=false;
      private static var watchedSocket:Object;
      private static var socketClosed:Boolean=false;

      public static function install():void
      {
         if(timer==null){timer=new Timer(1000);timer.addEventListener(TimerEvent.TIMER,tick);timer.start();}
      }
      private static function disconnect(event:Event):void
      {
         socketClosed=true;clearNotice();hide();state=null;lastQuery=-60000;
      }
      private static function connected(event:Event):void
      {
         socketClosed=false;state=null;lastQuery=-60000;
      }
      private static function watchSocket():void
      {
         var current:Object=SocketConnection.mainSocket;
         if(current===watchedSocket)return;
         if(watchedSocket!=null){watchedSocket.removeEventListener(Event.CLOSE,disconnect);watchedSocket.removeEventListener(Event.CONNECT,connected);}
         watchedSocket=current;socketClosed=false;
         if(watchedSocket!=null){watchedSocket.addEventListener(Event.CLOSE,disconnect);watchedSocket.addEventListener(Event.CONNECT,connected);}
      }
      public static function show():void
      {
         install();hide();page=0;
         panel=new PetWorkflowUI("精元孵化 · 实际进度",function():void{panel=null;labels=[];});
         render();refresh();
      }
      public static function hide():void { if(panel!=null)panel.close();panel=null;labels=[]; }
      public static function battleChanged():void { if(PetWorkflowClient.inBattle){clearNotice();hide();} }
      private static function refresh():void
      {
         if(owner==0||owner!=MainManager.actorID||MainManager.actorModel==null||socketClosed||watchedSocket==null||PetWorkflowClient.inBattle||PetWorkflowClient.busy(91023))return;
         lastQuery=getTimer();forceQuery=false;
         PetWorkflowClient.request(91023,{operation:"state"},function(value:Object):void{
            if(owner!=MainManager.actorID)return;
            if(value.ok){
               state=value;sampled=getTimer();
               var active:Object={};
               for each(var job:Object in state.jobs)active[job.key]=true;
               var retained:Array=[];
               for each(var key:String in seen)if(active[key])retained.push(key);
               if(retained.length!=seen.length){
                  seen=retained;PetWorkflowUI.saveLocal("hatchSeen",seen);
               }
               render();
            }
            else if(panel!=null)panel.message(String(value.error));
         });
      }
      private static function seconds(job:Object):uint
      {
         if(job.ready)return 0;
         return Math.max(0,Number(job.remaining)-Math.floor((getTimer()-sampled)/1000));
      }
      private static function timeText(job:Object):String
      {
         if(job.ready)return "已完成，可以领取";
         var left:uint=seconds(job);
         if(left==0)return "计时已到，正在核对服务端状态…";
         return Math.floor(left/3600)+"小时"+Math.floor(left%3600/60)+"分"+(left%60)+"秒";
      }
      private static function tick(event:TimerEvent):void
      {
         watchSocket();
         if(MainManager.actorID==0||MainManager.actorModel==null||socketClosed||watchedSocket==null){clearNotice();return;}
         if(owner!=MainManager.actorID){
            hide();clearNotice();state=null;owner=MainManager.actorID;lastQuery=-60000;
            var saved:Object=PetWorkflowUI.loadLocal("hatchSeen",[]);seen=saved is Array?saved as Array:[];
         }
         for each(var row:Object in labels)row.field.text=timeText(row.job);
         if(PetWorkflowClient.inBattle){clearNotice();return;}
         if(state!=null)for each(var job:Object in state.jobs){
            if(!job.ready&&seconds(job)==0)forceQuery=true;
            if(job.ready&&seen.indexOf(job.key)<0&&notice==null){
               seen.push(job.key);PetWorkflowUI.saveLocal("hatchSeen",seen);
               notice=PetWorkflowUI.button(LevelManager.appLevel,"孵化已完成 · 点击查看领取入口",330,72,288,function():void{clearNotice();show();});
            }
         }
         if(getTimer()-lastQuery>=60000||forceQuery&&getTimer()-lastQuery>=5000)refresh();
      }
      private static function clearNotice():void { if(notice!=null&&notice.parent)notice.parent.removeChild(notice);notice=null; }
      private static function openOriginal(kind:String):Function
      {
         return function():void{
            if(state==null||!state.hasNono||PetWorkflowClient.inBattle)return;
            hide();clearNotice();
            if(kind=="fusion")new App_700018(700018);else new App_700002(700002);
         };
      }
      private static function render():void
      {
         if(panel==null)return;
         panel.clear();labels=[];var body:Sprite=panel.body;
         PetWorkflowUI.text(body,"查看进度不会领取精灵，也不会消耗精元。",0,0,690,28,14,true);
         var count:uint=state==null?0:state.jobs.length;
         page=Math.min(page,Math.max(0,Math.ceil(count/4)-1));
         for(var i:uint=page*4;i<Math.min(count,(page+1)*4);i++){
            var job:Object=state.jobs[i];var y:Number=43+(i-page*4)*63;
            PetWorkflowUI.text(body,job.name+(job.level!=null?" · Lv."+job.level:""),0,y,405,26,16,true);
            labels.push({job:job,field:PetWorkflowUI.text(body,timeText(job),0,y+27,405,23,13)});
            PetWorkflowUI.button(body,job.kind=="fusion"?"打开元神珠转化仪":"原生查看 / 领取",445,y+8,235,openOriginal(job.kind),state.hasNono&&!PetWorkflowClient.inBattle);
         }
         if(count==0){
            PetWorkflowUI.text(body,state==null?"正在读取孵化状态…":"当前没有正在孵化或待领取的精元。",0,75,405,45,16,true);
            if(state!=null)PetWorkflowUI.button(body,"打开原生孵化仪",445,76,235,openOriginal("essence"),state.hasNono&&!PetWorkflowClient.inBattle);
         }
         PetWorkflowUI.button(body,"上一页",0,303,100,function():void{if(page>0)page--;render();},page>0);
         PetWorkflowUI.text(body,(page+1)+" / "+Math.max(1,Math.ceil(count/4)),118,309,100,24);
         PetWorkflowUI.button(body,"下一页",230,303,100,function():void{page++;render();},(page+1)*4<count);
         PetWorkflowUI.button(body,"刷新状态",445,303,235,refresh,!PetWorkflowClient.busy(91023));
         panel.message(state!=null&&!state.hasNono?"需要先获得NONO，才能使用原生孵化功能。":"本页只读；原生入口在孵化完成时直接领取。不改变时长和条件。");
      }
   }
}
