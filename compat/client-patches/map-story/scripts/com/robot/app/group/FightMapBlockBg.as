package com.robot.app.group
{
   import flash.display.Sprite;
   import flash.geom.Point;
   import flash.text.TextField;
   import org.taomee.ds.HashMap;
   
   public class FightMapBlockBg
   {
      
      public static const stgWidth:Number = 950;
      
      public static const stgHeight:Number = 560;
      
      public static const blockWidth:Number = 80;
      
      public static const blockHeight:Number = blockWidth * Math.tan(45 / 2 / 180 * Math.PI);
      
      public static const pointMap:HashMap = new HashMap();
      
      private static const cols:uint = Math.ceil(stgWidth / (2 * blockWidth));
      
      private static const rows:uint = Math.ceil(stgHeight / (2 * blockHeight));
      
      public function FightMapBlockBg()
      {
         super();
      }
      
      public static function drawBg() : Sprite
      {
         var _loc3_:uint = 0;
         var _loc4_:TextField = null;
         var _loc5_:Sprite = null;
         var _loc6_:String = null;
         var _loc1_:Sprite = new Sprite();
         var _loc2_:uint = 0;
         while(_loc2_ < 2 * rows)
         {
            _loc3_ = 0;
            while(_loc3_ < cols)
            {
               _loc4_ = new TextField();
               _loc4_.textColor = 16750848;
               _loc5_ = drawBlock();
               if(_loc2_ % 2 == 0)
               {
                  _loc5_.x = _loc3_ * 2 * blockWidth + blockWidth;
               }
               else
               {
                  _loc5_.x = _loc3_ * 2 * blockWidth;
               }
               _loc5_.y = _loc2_ * blockHeight;
               _loc4_.x = 30;
               _loc4_.y = 15;
               _loc4_.htmlText = _loc2_ + "," + _loc3_ + "【" + Math.round(_loc5_.x) + "_" + Math.round(_loc5_.y) + "】";
               _loc6_ = _loc2_ + "_" + _loc3_;
               pointMap.add(_loc6_,new Point(Math.round(_loc5_.x),Math.round(_loc5_.y)));
               _loc3_++;
            }
            _loc2_++;
         }
         return _loc1_;
      }
      
      private static function drawBlock() : Sprite
      {
         var _loc1_:Sprite = new Sprite();
         _loc1_.graphics.lineStyle(1,16777215);
         _loc1_.graphics.moveTo(0,-blockHeight);
         _loc1_.graphics.lineTo(-blockWidth,0);
         _loc1_.graphics.lineTo(0,blockHeight);
         _loc1_.graphics.lineTo(blockWidth,0);
         _loc1_.graphics.lineTo(0,-blockHeight);
         return _loc1_;
      }
   }
}

