package com.robot.app.mapProcess.control
{
   import com.robot.app.fight.*;
   import com.robot.core.*;
   import com.robot.core.animate.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.*;
   import com.robot.core.npc.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.utils.*;
   import org.taomee.events.SocketEvent;
   
   public class MysteryMon
   {
      
      private static var _map:BaseMapProcess;
      
      private static var _lightGroup:MovieClip;
      
      public function MysteryMon()
      {
         super();
      }
      
      public static function init(param1:BaseMapProcess) : void
      {
         _map = param1;
         _lightGroup = _map.conLevel["lightNPC"];
         _lightGroup.buttonMode = true;
         _lightGroup.addEventListener(MouseEvent.CLICK,lightNPCHandler);
         AnimateManager.playMcAnimate(_lightGroup,1,"mc1",null,false,false);
      }
      
      private static function lightNPCHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(BufferRecordManager.getState(MainManager.actorInfo,218))
         {
            if(_lightGroup.currentFrame == 1)
            {
               SocketConnection.addCmdListener(CommandID.GET_MYSTERY_MON_STAT,onGetMysteryMonStat);
               SocketConnection.send(CommandID.GET_MYSTERY_MON_STAT);
            }
            if(_lightGroup.currentFrame == 2)
            {
               lightNPCHandler2();
            }
         }
         else
         {
            NpcDialog.show(NPC.MIZHIGUANGTUAN,["你是谁啊？难道想和我一起玩？"],["咦，什么东西，竟然会说话！","啊，我只是过来随便走走的...."],[function():void
            {
               NpcDialog.show(NPC.MIZHIGUANGTUAN,["你也太小瞧我了吧，我当然会说话。如果你能帮我找到三种不同颜色的0xff0000光之碎片0xffffff，我就考虑陪你玩。"],["光之碎片是什么东西？","算了，我现在有其它事情要做。"],[function():void
               {
                  NpcDialog.show(NPC.MIZHIGUANGTUAN,["光之碎片分为0xff0000红、绿、蓝0xffffff三种，蕴藏了自然之光的能量，那可是我梦寐以求的东西啊。集齐那三种碎片，我才有足够的能量陪你玩一会哦。"],["好吧，那怎么才能获得光之碎片？"],[function():void
                  {
                     NpcDialog.show(NPC.MIZHIGUANGTUAN,["据说0xff0000阳光大地上的野怪0xffffff会有概率掉落光之碎片哦。但是因为现在我的光能不足，无法随意行动，就只能先拜托你了。"],["放心，交给我吧！"],[function():void
                     {
                        BufferRecordManager.setState(MainManager.actorInfo,218,true);
                     }]);
                  }]);
               }]);
            }]);
         }
      }
      
      private static function onGetMysteryMonStat(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_MYSTERY_MON_STAT,onGetMysteryMonStat);
         if(!_map || !_lightGroup || _lightGroup.currentFrame != 1)
         {
            return;
         }
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:Boolean = Boolean(_loc2_.readUnsignedInt());
         if(_loc3_)
         {
            AnimateManager.playMcAnimate(_lightGroup,2,"mc2");
         }
         else
         {
            NpcDialog.show(NPC.MIZHIGUANGTUAN,["你找齐三片光之碎片了吗？一定要加油哦"],["放心吧，我一定会找齐的！"]);
         }
      }
      
      private static function lightNPCHandler2() : void
      {
         FightManager.fightWithBoss("文文");
      }
      
      public static function destroy() : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_MYSTERY_MON_STAT,onGetMysteryMonStat);
         _lightGroup.removeEventListener(MouseEvent.CLICK,lightNPCHandler);
         _lightGroup = null;
         _map = null;
      }
   }
}

