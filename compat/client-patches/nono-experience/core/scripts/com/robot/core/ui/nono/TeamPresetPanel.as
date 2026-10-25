package com.robot.core.ui.nono
{
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.Sprite;
   import flash.text.TextField;
   import flash.text.TextFieldType;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import flash.utils.setTimeout;
   import flash.utils.clearTimeout;
   import org.taomee.events.SocketEvent;

   public class TeamPresetPanel
   {
      private static var teams:Array=[];
      private static var pending:Boolean=false;
      private static var timeout:uint;
      private static var selected:uint=1;
      private static var memberPage:uint=0;
      private static var owner:uint=0;

      public static function show():void
      {
         if(owner!=MainManager.actorID){teams=[];owner=MainManager.actorID;}
         send({version:2,operation:0,slot:0});
      }

      private static function send(value:Object):void
      {
         if(pending)return;
         pending=true;
         var bytes:ByteArray=new ByteArray();
         bytes.writeUTFBytes(JSON.stringify(value));
         SocketConnection.addCmdListener(91003,onReply);
         timeout=setTimeout(onTimeout,8000);
         SocketConnection.send(91003,bytes);
      }

      private static function onTimeout():void
      {
         SocketConnection.removeCmdListener(91003,onReply);
         pending=false;
         Alarm.show("未收到队伍结果，请重新打开确认。不会自动重试保存或切换。");
      }

      private static function onReply(event:SocketEvent):void
      {
         SocketConnection.removeCmdListener(91003,onReply);
         clearTimeout(timeout);pending=false;
         var bytes:ByteArray=event.data as ByteArray;
         if(bytes==null||bytes.bytesAvailable<8){Alarm.show("队伍响应不完整，请重新打开确认。");return;}
         var size:uint=bytes.readUnsignedInt();
         if(size>bytes.bytesAvailable-4){Alarm.show("队伍响应长度无效。");return;}
         var value:Object=JSON.parse(bytes.readUTFBytes(size));
         var count:uint=bytes.readUnsignedInt();
         if(value.version!=2){Alarm.show("队伍版本已变化，请刷新客户端。");return;}
         if(count>0)PetManager.replaceBagSnapshot(bytes,count);
         if(value.teams!=null)teams=value.teams as Array;
         if(!value.ok){Alarm.show(String(value.error));return;}
         if(value.operation==3){selected=value.slot;showPreview();return;}
         var prefix:String=value.operation==1?"成员、首发与配招已保存。\n":value.operation==2?"队伍与配招已切换；未恢复体力或PP。\n":"";
         showList(prefix);
      }

      private static function showList(prefix:String=""):void
      {
         var options:Array=[];
         var callbacks:Array=[];
         for(var index:uint=1;index<=3;index++){
            var team:Object=teams[index-1];
            options.push((team==null?"队伍"+index:String(team.name))+(team!=null&&team.saved?"（已保存）":"（未保存）"));
            callbacks.push(openSlot(index));
         }
         options.push("关闭");
         NpcDialog.show(NPC.NONO,[prefix+"队伍预设保存成员顺序、首发及四个常规技能。不改变性格、学习力、刻印或装备。"],options,callbacks);
      }

      private static function openSlot(slot:uint):Function
      {
         return function():void{selected=slot;memberPage=0;showTeam();};
      }

      private static function skillText(ids:Array):String
      {
         var result:Array=[];
         for each(var id:uint in ids)result.push(SkillXMLInfo.getName(id));
         return result.join("、");
      }

      private static function showTeam():void
      {
         var team:Object=teams[selected-1];
         var message:String=team.saved?team.name+" · "+team.members.length+"只精灵，首发："+team.members[0].label:team.name+"尚未保存。先准备背包成员、首发及配招，再保存到此位置。";
         var options:Array=["查看切换预览","保存当前背包并命名"];
         var callbacks:Array=[preview,rename];
         if(team.saved){options.push("逐只查看成员与配招");callbacks.push(showMember);}
         options.push("返回队伍列表","关闭");callbacks.push(show);
         NpcDialog.show(NPC.NONO,[message],options,callbacks);
      }

      private static function showMember():void
      {
         var team:Object=teams[selected-1];
         if(!team.saved||team.members.length==0){showTeam();return;}
         var member:Object=team.members[memberPage];
         var message:String=team.name+" · "+(memberPage+1)+"/"+team.members.length+" "+member.label+(memberPage==0?"（首发）":"");
         message+="\n保存："+member.skillNames.join("、");
         message+="\n"+(member.error?"无法切换："+member.error:"当前："+skillText(member.current as Array));
         NpcDialog.show(NPC.NONO,[message],["下一只精灵","返回队伍操作"],[nextMember,showTeam]);
      }

      private static function nextMember():void
      {
         var team:Object=teams[selected-1];
         memberPage=(memberPage+1)%team.members.length;showMember();
      }

      private static function preview():void
      {
         send({version:2,operation:3,slot:selected});
      }

      private static function showPreview():void
      {
         var team:Object=teams[selected-1];
         if(team.error){NpcDialog.show(NPC.NONO,[team.name+"暂不能切换："+team.error],["逐只查看","返回队伍列表"],[showMember,show]);return;}
         var changes:uint=0;
         for each(var member:Object in team.members)if(member.current.join(",")!=member.skills.join(","))changes++;
         NpcDialog.show(NPC.NONO,["切换预览："+team.name+"，共"+team.members.length+"只，首发："+team.members[0].label+"。\n将修改"+changes+"只精灵的配招；不恢复体力或PP。"],["确认切换","逐只查看成员与配招","取消"],[apply,showMember,show]);
      }

      private static function apply():void
      {
         var team:Object=teams[selected-1];
         send({version:2,operation:2,slot:selected,revision:team.revision});
      }

      private static function rename():void
      {
         var team:Object=teams[selected-1];
         var input:TextField=new TextField();
         input.type=TextFieldType.INPUT;input.maxChars=12;input.multiline=false;
         input.defaultTextFormat=new TextFormat("宋体",16,0x163c66);
         input.background=true;input.backgroundColor=0xe4f5ff;input.border=true;input.borderColor=0x2875a5;
         input.x=50;input.y=112;input.width=240;input.height=28;input.text=String(team.name);
         var dialog:Sprite=Alert.show("保存当前背包及四个技能。\n请输入队伍名（1至12字）：",function():void{
            var name:String=input.text;
            if(team.saved)Alert.show("覆盖“"+team.name+"”的成员、首发和配招？",function():void{save(name);});
            else save(name);
         });
         var label:TextField=dialog["txt"] as TextField;
         label.autoSize="none";label.y=58;label.height=48;
         dialog.addChild(input);MainManager.getStage().focus=input;input.setSelection(0,input.text.length);
      }

      private static function save(name:String):void
      {
         var team:Object=teams[selected-1];
         send({version:2,operation:1,slot:selected,name:name,revision:team.revision});
      }
   }
}
