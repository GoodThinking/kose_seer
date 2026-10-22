package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.alert.ItemInBagAlert;
   import flash.events.MouseEvent;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;

   // 北斗七星殿（2012-05/06）：七星连锁阵，按钮 1–7 依次是贪狼到破军，0 是中间的星灵王。
   // 这版开放前四道封印，规则与进度在服务端 BeidouSeals（2313/2311 的 900003 组）；主动画第 4n+1 帧是解开 n 道封印后的样子。
   public class MapProcess_733 extends BaseMapProcess
   {

      private static const GROUP:uint = 900003;

      private static const NAMES:Array = ["星灵王","贪狼","巨门","禄存","文曲","廉贞","武曲","破军"];

      private static const ERRORS:Array = ["","要先解除前面的封印。","今天的次数已经用完了，明天再来吧！","赛尔豆不足50000。","这道封印已经解除了。","文曲封印还没有解开，请耐心等待。","你的这种精元已经放不下了，先拿去孵化吧。","封印解除失败，请稍后再试。"];

      // 贪狼天数、今天已解、巨门次数、巨门今天次数、禄存已解、文曲开始时间、文曲已领、服务器时间
      private var status:Array;

      private var pending:Boolean = false;

      public function MapProcess_733()
      {
         super();
      }

      override protected function init() : void
      {
         var i:int = 0;
         while(i < NAMES.length)
         {
            conLevel["btn_" + i].addEventListener(MouseEvent.CLICK,this.onSeal);
            ToolTipManager.add(conLevel["btn_" + i],i == 0 ? NAMES[0] : NAMES[i] + "封印");
            i++;
         }
         conLevel["panelBtn"].addEventListener(MouseEvent.CLICK,this.onPanel);
         ToolTipManager.add(conLevel["panelBtn"],"七星连锁阵");
         conLevel["mainMC"].gotoAndStop(1);
         SocketConnection.addCmdListener(CommandID.IS_COLLECT,this.onStatus);
         SocketConnection.addCmdListener(CommandID.PET_COLLECT,this.onAction);
         SocketConnection.send(CommandID.IS_COLLECT,GROUP);
      }

      private function unlocked() : uint
      {
         var done:Array = [this.status[0] > 0,this.status[2] >= 4,this.status[4] > 0,this.status[6] > 0];
         var n:uint = 0;
         while(n < done.length && done[n])
         {
            n++;
         }
         return n;
      }

      private function onStatus(e:SocketEvent) : void
      {
         var data:ByteArray = e.data as ByteArray;
         data.position = 0;
         if(data.bytesAvailable >= 36 && data.readUnsignedInt() == GROUP)
         {
            this.status = [];
            while(this.status.length < 8)
            {
               this.status.push(data.readUnsignedInt());
            }
            conLevel["mainMC"].gotoAndStop(this.unlocked() * 4 + 1);
         }
         data.position = 0;
      }

      private function onAction(e:SocketEvent) : void
      {
         var data:ByteArray = e.data as ByteArray;
         data.position = 0;
         if(data.bytesAvailable < 20 || data.readUnsignedInt() != GROUP)
         {
            data.position = 0;
            return;
         }
         var seal:uint = data.readUnsignedInt();
         var error:uint = data.readUnsignedInt();
         var item:uint = data.readUnsignedInt();
         MainManager.actorInfo.coins = data.readUnsignedInt();
         data.position = 0;
         this.pending = false;
         if(error != 0)
         {
            Alarm.show(error < ERRORS.length ? ERRORS[error] : ERRORS[7]);
         }
         else if(item != 0)
         {
            ItemInBagAlert.show(item,"1个" + ItemXMLInfo.getName(item) + "已经放入你的储存箱！");
         }
         else if(seal == 2)
         {
            Alarm.show("巨门封印松动了！（" + (this.status[2] + 1) + "/4）");
         }
         else if(seal == 4)
         {
            Alarm.show("文曲封印开始解除，72小时后再来看看吧！");
         }
         SocketConnection.send(CommandID.IS_COLLECT,GROUP);
      }

      private function send(seal:uint) : void
      {
         if(this.pending)
         {
            return;
         }
         this.pending = true;
         SocketConnection.send(CommandID.PET_COLLECT,GROUP,seal);
      }

      private function onSeal(e:MouseEvent) : void
      {
         var seal:uint = uint(String(e.currentTarget.name).split("_")[1]);
         if(this.status == null)
         {
            return;
         }
         if(seal == 0)
         {
            Alarm.show("七道封印全部解除后，星灵王才会苏醒。");
            return;
         }
         if(seal > 4)
         {
            Alarm.show(NAMES[seal] + "封印尚未开放。");
            return;
         }
         if(seal > this.unlocked() + 1)
         {
            Alarm.show(ERRORS[1]);
            return;
         }
         switch(seal)
         {
            case 1:
               if(this.status[1] > 0)
               {
                  Alarm.show("今天已经解除过贪狼封印了，明天再来吧！");
                  return;
               }
               Alert.show("解除贪狼封印可以获得火星灵精元，每天只能解除一次。现在解除吗？",function():void
               {
                  send(1);
               });
               return;
            case 2:
               if(this.status[2] >= 4)
               {
                  send(2);
                  return;
               }
               if(this.status[3] >= 2)
               {
                  Alarm.show("巨门封印今天已经解除2次了，明天再来吧！");
                  return;
               }
               Alert.show("每次解除巨门封印需要50000赛尔豆，每天最多2次，解除4次后获得水星灵的精元（已解除" + this.status[2] + "/4）。确定解除吗？",function():void
               {
                  send(2);
               });
               return;
            case 3:
               if(this.status[4] > 0)
               {
                  Alarm.show("禄存封印已经解除了。");
                  return;
               }
               Alert.show("禄存封印的守护者芙洛出现了！它速度极快，攻击也很强。打败它就能获得飞星灵的精元，要挑战吗？",function():void
               {
                  FightInviteManager.fightWithBoss("芙洛");
               });
               return;
            case 4:
               if(this.status[6] > 0)
               {
                  Alarm.show("文曲封印已经解除了。");
                  return;
               }
               if(this.status[5] == 0)
               {
                  Alert.show("解除文曲封印需要耐心等待72小时，等待结束后获得冰星灵的精元。现在开始吗？",function():void
                  {
                     send(4);
                  });
                  return;
               }
               var left:int = int(this.status[5]) + 72 * 3600 - int(this.status[7]);
               if(left > 0)
               {
                  Alarm.show("文曲封印还要等待" + Math.floor(left / 3600) + "小时" + Math.ceil(left % 3600 / 60) + "分钟。");
                  return;
               }
               send(4);
               return;
         }
      }

      private function onPanel(e:MouseEvent) : void
      {
         if(this.status == null)
         {
            return;
         }
         Alarm.show("七星连锁阵：贪狼" + (this.status[0] > 0 ? "已解除" : "未解除") + "，巨门" + Math.min(this.status[2],4) + "/4，禄存" + (this.status[4] > 0 ? "已解除" : "未解除") + "，文曲" + (this.status[6] > 0 ? "已解除" : (this.status[5] > 0 ? "解除中" : "未解除")) + "。廉贞、武曲、破军尚未开放。");
      }

      override public function destroy() : void
      {
         var i:int = 0;
         SocketConnection.removeCmdListener(CommandID.IS_COLLECT,this.onStatus);
         SocketConnection.removeCmdListener(CommandID.PET_COLLECT,this.onAction);
         while(i < NAMES.length)
         {
            conLevel["btn_" + i].removeEventListener(MouseEvent.CLICK,this.onSeal);
            ToolTipManager.remove(conLevel["btn_" + i]);
            i++;
         }
         conLevel["panelBtn"].removeEventListener(MouseEvent.CLICK,this.onPanel);
         ToolTipManager.remove(conLevel["panelBtn"]);
      }
   }
}
