package com.robot.app.buyItem
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.GoldProductXMLInfo;
   import com.robot.core.config.xml.MoneyProductXMLInfo;
   import com.robot.core.config.xml.PetShopXMLInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.utils.TextFormatUtil;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;

   public class ProductAction
   {
      public static var productID:uint;
      private static var count:uint;
      setup();

      public function ProductAction() { super(); }

      private static function setup() : void
      {
         SocketConnection.addCmdListener(CommandID.GOLD_CHECK_REMAIN,onCheckGold);
      }

      public static function buyGoldProduct(param1:uint, param2:uint = 1) : void
      {
         productID = param1;
         count = param2;
         SocketConnection.send(CommandID.GOLD_CHECK_REMAIN);
      }

      private static function onCheckGold(param1:SocketEvent) : void
      {
         var event:SocketEvent = param1;
         var num:Number = (event.data as ByteArray).readUnsignedInt() / 100;
         var name:String = GoldProductXMLInfo.getNameByProID(productID);
         var price:Number = Number(GoldProductXMLInfo.getPriceByProID(productID));
         if(name == "" && price == 0)
         {
            name = PetShopXMLInfo.getNameByProID(productID);
            price = Number(PetShopXMLInfo.getPriceByProID(productID));
         }
         Alert.show(TextFormatUtil.getRedTxt(name) + "需要花费" + TextFormatUtil.getRedTxt(price.toString()) + "金豆，目前你拥有" + TextFormatUtil.getRedTxt(num.toString()) + "金豆，要确认购买吗？",function():void
         {
            var body:ByteArray = new ByteArray();
            body.writeShort(count);
            SocketConnection.send(CommandID.GOLD_BUY_PRODUCT,productID,body);
         });
      }

      public static function buyMoneyProduct(param1:uint, param2:uint = 1) : void
      {
         var proID:uint = param1;
         var quantity:uint = param2;
         if((proID == 200000 || proID == 200001 || proID == 200002) && !MainManager.actorInfo.vip)
         {
            Alarm.show("该商品需要超能NoNo才能购买。");
            return;
         }
         var price:Number = MoneyProductXMLInfo.getPriceByProID(proID);
         if(Boolean(MainManager.actorInfo.vip)) price *= MoneyProductXMLInfo.getVipByProID(proID);
         price = Math.round(price) * quantity;
         var coins:uint = MainManager.actorInfo.coins;
         var name:String = MoneyProductXMLInfo.getNameByProID(proID);
         if(price > coins)
         {
            Alarm.show("购买" + name + "需要" + price + "赛尔豆，当前余额为" + coins + "赛尔豆，余额不足。");
            return;
         }
         Alert.show("购买" + TextFormatUtil.getRedTxt(name) + "需要" + TextFormatUtil.getRedTxt(price.toString()) + "赛尔豆，当前余额为" + coins + "赛尔豆，确认购买吗？",function():void
         {
            productID = proID;
            count = quantity;
            var body:ByteArray = new ByteArray();
            body.writeShort(quantity);
            SocketConnection.send(CommandID.MONEY_BUY_PRODUCT,proID,body);
         });
      }
   }
}
