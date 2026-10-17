package com.robot.core.info.moneyAndGold
{
   import flash.utils.IDataInput;

   public class MoneyBuyProductInfo
   {
      private var _spentCoins:uint;
      private var _coins:uint;

      public function MoneyBuyProductInfo(data:IDataInput)
      {
         super();
         data.readUnsignedInt();
         _spentCoins = data.readUnsignedInt();
         _coins = data.readUnsignedInt();
      }
      public function get spentCoins() : uint { return _spentCoins; }
      public function get coins() : uint { return _coins; }
   }
}
