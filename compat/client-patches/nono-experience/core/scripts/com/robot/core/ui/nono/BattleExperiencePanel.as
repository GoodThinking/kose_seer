package com.robot.core.ui.nono
{
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.UIManager;
   import flash.display.Sprite;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   import com.robot.core.ui.alert.Alarm;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import flash.utils.setTimeout;
   import flash.utils.clearTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.DisplayUtil;

   public class BattleExperiencePanel
   {
      private static var installed:Boolean=false;
      private static var owner:uint=0;
      private static var key:NonoShortcutKeyItem;
      private static var banner:TextField;
      private static var dialog:Sprite;
      private static var value:Object;
      private static var wanted:String="";
      private static var requestTimer:uint;
      private static var page:uint=0;
      private static var effectSide:uint=0;
      private static var effectPage:uint=0;
      private static var lastId:String="";
      private static var lastSeq:uint=0;

      private static function install():void
      {
         if(owner!=MainManager.actorID){value=null;lastId="";lastSeq=0;owner=MainManager.actorID;}
         if(!installed){SocketConnection.addCmdListener(91013,onReply);installed=true;}
      }

      public static function begin():void
      {
         install();end();clearTimeout(requestTimer);wanted="";lastId="";lastSeq=0;value=null;
         PetWorkflowClient.inBattle=true;HatchStatusPanel.battleChanged();
         key=new NonoShortcutKeyItem();
         key.setInfo("qx_skills","战况详情：效果、剩余回合和失败原因；查看不会暂停选招倒计时",showDetails);
         key.x=862;key.y=90;LevelManager.fightLevel.addChild(key);
         banner=new TextField();banner.defaultTextFormat=new TextFormat("宋体",12,0xffec9c);
         banner.x=330;banner.y=74;banner.width=330;banner.height=40;banner.multiline=true;banner.wordWrap=true;
         banner.mouseEnabled=false;banner.selectable=false;LevelManager.fightLevel.addChild(banner);
         SocketConnection.send(91013,0);
      }

      public static function end():void
      {
         hideBattleDialog();
         PetWorkflowClient.inBattle=false;HatchStatusPanel.battleChanged();
         if(key!=null){key.destroy();DisplayUtil.removeForParent(key);key=null;}
         if(banner!=null){DisplayUtil.removeForParent(banner);banner=null;}
      }

      public static function showDetails():void { request("details",0); }
      public static function showSummary():void { request("summary",1); }

      private static function hideBattleDialog():void
      {
         if(dialog!=null){DisplayUtil.removeForParent(dialog);dialog=null;}
      }

      private static function showDialog(message:String,options:Array,callbacks:Array=null):void
      {
         if(banner==null){NpcDialog.show(NPC.NONO,[message],options,callbacks);return;}
         hideBattleDialog();
         dialog=new Sprite();
         dialog.graphics.lineStyle(3,0xB4E8FF);
         dialog.graphics.beginFill(0x0B3156,0.98);
         dialog.graphics.drawRoundRect(0,0,620,244,18,18);
         dialog.graphics.endFill();
         dialog.graphics.lineStyle(1,0x58BAE8);
         dialog.graphics.moveTo(12,39);dialog.graphics.lineTo(608,39);
         dialog.x=(MainManager.getStage().stageWidth-620)/2;
         dialog.y=(MainManager.getStage().stageHeight-244)/2-20;
         var title:TextField=new TextField();
         title.defaultTextFormat=new TextFormat("宋体",18,0xFFFFFF,true);
         title.text="战况详情";title.x=18;title.y=9;title.width=210;title.height=26;
         title.mouseEnabled=false;title.selectable=false;dialog.addChild(title);
         var hint:TextField=new TextField();
         hint.defaultTextFormat=new TextFormat("宋体",12,0xFFEC9C);
         hint.text="查看不会暂停选招计时";hint.x=350;hint.y=15;hint.width=250;hint.height=20;
         hint.mouseEnabled=false;hint.selectable=false;dialog.addChild(hint);
         var body:TextField=new TextField();
         body.defaultTextFormat=new TextFormat("宋体",14,0xFFFFFF);
         body.text=message;body.x=18;body.y=47;body.width=584;body.height=108;
         body.multiline=true;body.wordWrap=true;body.mouseEnabled=false;body.selectable=false;
         dialog.addChild(body);
         for(var i:uint=0;i<options.length;i++)addOption(String(options[i]),callbacks==null?null:callbacks[i] as Function,18+(i%3)*200,164+Math.floor(i/3)*38);
         LevelManager.fightLevel.addChild(dialog);
      }

      private static function addOption(label:String,action:Function,x:Number,y:Number):void
      {
         var up:* = UIManager.getDisplayObject("Button_upSkin");
         var over:* = UIManager.getDisplayObject("Button_overSkin");
         var down:* = UIManager.getDisplayObject("Button_downSkin");
         up.width=over.width=down.width=184;up.height=over.height=down.height=28;
         var holder:Sprite=new Sprite();holder.x=x;holder.y=y;
         holder.addChild(new SimpleButton(up,over,down,up));
         var text:TextField=new TextField();
         var format:TextFormat=new TextFormat("宋体",13,0xFFFFFF,true);format.align="center";
         text.defaultTextFormat=format;text.text=label;text.width=184;text.height=24;text.y=4;
         text.mouseEnabled=false;text.selectable=false;holder.addChild(text);
         holder.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void{hideBattleDialog();if(action!=null)action();});
         dialog.addChild(holder);
      }

      private static function request(mode:String,operation:uint):void
      {
         install();if(wanted!="")return;
         wanted=mode;page=0;effectPage=0;effectSide=0;
         requestTimer=setTimeout(onTimeout,8000);
         SocketConnection.send(91013,operation);
      }

      private static function onTimeout():void
      {
         wanted="";Alarm.show("未收到战况，请稍后重新查看。");
      }

      private static function onReply(event:SocketEvent):void
      {
         var bytes:ByteArray=event.data as ByteArray;
         if(bytes==null||bytes.bytesAvailable==0)return;
         var next:Object=JSON.parse(bytes.readUTFBytes(bytes.bytesAvailable));
         if(next.version!=1)return;
         value=next;
         if(next.active&&banner!=null){
            var events:Array=next.events as Array;
            if(lastId!=String(next.id)){lastId=String(next.id);lastSeq=0;banner.text="";}
            if(events!=null&&events.length>0&&next.seq>lastSeq){
               var latest:Object=events[events.length-1];
               banner.text="第"+latest.turn+"回合："+latest.text;
               lastSeq=next.seq;
            }
         }
         if(wanted=="")return;
         if(wanted=="summary"&&next.operation!=1)return;
         clearTimeout(requestTimer);
         var mode:String=wanted;wanted="";
         if(!next.ok){Alarm.show(String(next.error));return;}
         if(mode=="summary")renderSummary();else renderDetails();
      }

      private static function renderDetails():void
      {
         if(value==null||!value.active){renderSummary();return;}
         var own:Boolean=effectSide==0;
         var actor:Object=own?value.own:value.foe;
         var effects:Array=actor.effects as Array;
         var message:String="第"+value.turn+"回合 · "+(own?"我方":"对方")+actor.name+" · "+effects.length+"项持续效果";
         showDialog(message,["逐项查看持续效果",own?"查看对方状态":"查看我方状态","查看最近结算","刷新状态","关闭"],
            [renderEffect,function():void{effectSide=1-effectSide;effectPage=0;renderDetails();},renderRecent,showDetails]);
      }

      private static function renderEffect():void
      {
         var actor:Object=effectSide==0?value.own:value.foe;
         var effects:Array=actor.effects as Array;
         var count:uint=Math.max(1,effects.length);
         effectPage%=count;
         var message:String=(effectSide==0?"我方：":"对方：")+actor.name+"（"+(effectPage+1)+"/"+count+"）\n"+(effects.length==0?"当前没有已生效的持续效果。":effects[effectPage]);
         var options:Array=[];
         var callbacks:Array=[];
         if(effects.length>1){options.push("下一项效果");callbacks.push(function():void{effectPage++;renderEffect();});}
         options.push("返回状态菜单","刷新状态","关闭");callbacks.push(renderDetails,showDetails);
         showDialog(message,options,callbacks);
      }

      private static function renderRecent():void
      {
         var lines:Array=[];
         for each(var event:Object in value.events)lines.push("第"+event.turn+"回合："+event.text);
         showDialog(lines.length==0?"本场尚无需要说明的失败或特殊效果。":lines.slice(-2).join("\n"),["返回状态菜单","刷新状态","关闭"],[renderDetails,showDetails]);
      }

      private static function renderSummary():void
      {
         var report:Object=value==null?null:value.report;
         if(report==null){showDialog("当前登录期间还没有已结束的战斗简报。简报只保留上一场，不是历史录像。",["关闭"]);return;}
         var own:Array=[];
         var enemy:Array=[];
         for each(var item:Object in report.lost)(item.side=="player"?own:enemy).push(item.name);
         var message:String="上一场："+report.result+"，共"+report.turns+"回合。\n我方累计伤害："+report.counters.player.damage+"；未命中或失效："+report.counters.player.misses+"次。\n我方被击倒："+(own.length?own.join("、"):"无")+"\n对方被击倒："+(enemy.length?enemy.join("、"):"无");
         showDialog(message,["查看关键结算","关闭"],[function():void{page=0;renderReportEvents();}]);
      }

      private static function renderReportEvents():void
      {
         var report:Object=value.report;
         var events:Array=report.events as Array;
         var lines:Array=[];
         var start:uint=page*2;
         for(var index:uint=start;index<Math.min(start+2,events.length);index++)lines.push("第"+events[index].turn+"回合："+events[index].text);
         var options:Array=[];
         var callbacks:Array=[];
         if(start+2<events.length){options.push("下一页");callbacks.push(function():void{page++;renderReportEvents();});}
         if(page>0){options.push("上一页");callbacks.push(function():void{page--;renderReportEvents();});}
         options.push("返回简报");callbacks.push(renderSummary);
         showDialog((report.truncated?"较早结算已省略，保留最近96条。\n":"")+(lines.length?lines.join("\n"):"本场没有额外的失败或特殊效果结算。"),options,callbacks);
      }
   }
}
