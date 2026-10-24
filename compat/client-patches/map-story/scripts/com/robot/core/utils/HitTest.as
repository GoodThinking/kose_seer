package com.robot.core.utils
{
   import flash.display.*;
   import flash.geom.*;
   
   public class HitTest
   {
      
      public function HitTest()
      {
         super();
      }
      
      public static function complexHitTestObject(param1:DisplayObject, param2:DisplayObject, param3:Number = 1) : Boolean
      {
         return complexIntersectionRectangle(param1,param2,param3).width != 0;
      }
      
      public static function intersectionRectangle(param1:DisplayObject, param2:DisplayObject) : Rectangle
      {
         if(!param1.root || !param2.root || !param1.hitTestObject(param2))
         {
            return new Rectangle();
         }
         var _loc3_:Rectangle = param1.getBounds(param1.root);
         var _loc4_:Rectangle = param2.getBounds(param2.root);
         var _loc5_:Rectangle = new Rectangle();
         _loc5_.x = Math.max(_loc3_.x,_loc4_.x);
         _loc5_.y = Math.max(_loc3_.y,_loc4_.y);
         _loc5_.width = Math.min(_loc3_.x + _loc3_.width - _loc5_.x,_loc4_.x + _loc4_.width - _loc5_.x);
         _loc5_.height = Math.min(_loc3_.y + _loc3_.height - _loc5_.y,_loc4_.y + _loc4_.height - _loc5_.y);
         return _loc5_;
      }
      
      public static function complexIntersectionRectangle(param1:DisplayObject, param2:DisplayObject, param3:Number = 1) : Rectangle
      {
         if(param3 <= 0)
         {
            throw new Error("ArgumentError: Error #5001: Invalid value for accuracy",5001);
         }
         if(!param1.hitTestObject(param2))
         {
            return new Rectangle();
         }
         var _loc4_:Rectangle = intersectionRectangle(param1,param2);
         if(_loc4_.width * param3 < 1 || _loc4_.height * param3 < 1)
         {
            return new Rectangle();
         }
         var _loc5_:BitmapData = new BitmapData(_loc4_.width * param3,_loc4_.height * param3,false,0);
         _loc5_.draw(param1,HitTest.getDrawMatrix(param1,_loc4_,param3),new ColorTransform(1,1,1,1,255,-255,-255,255));
         _loc5_.draw(param2,HitTest.getDrawMatrix(param2,_loc4_,param3),new ColorTransform(1,1,1,1,255,255,255,255),BlendMode.DIFFERENCE);
         var _loc6_:Rectangle = _loc5_.getColorBoundsRect(4294967295,4278255615);
         _loc5_.dispose();
         if(param3 != 1)
         {
            _loc6_.x /= param3;
            _loc6_.y /= param3;
            _loc6_.width /= param3;
            _loc6_.height /= param3;
         }
         _loc6_.x += _loc4_.x;
         _loc6_.y += _loc4_.y;
         return _loc6_;
      }
      
      protected static function getDrawMatrix(param1:DisplayObject, param2:Rectangle, param3:Number) : Matrix
      {
         var _loc4_:Point = null;
         var _loc5_:Matrix = null;
         var _loc6_:Matrix = param1.root.transform.concatenatedMatrix;
         _loc4_ = param1.localToGlobal(new Point());
         _loc5_ = param1.transform.concatenatedMatrix;
         _loc5_.tx = _loc4_.x - param2.x;
         _loc5_.ty = _loc4_.y - param2.y;
         _loc5_.a /= _loc6_.a;
         _loc5_.d /= _loc6_.d;
         if(param3 != 1)
         {
            _loc5_.scale(param3,param3);
         }
         return _loc5_;
      }
      
      public static function hitTest(param1:MovieClip, param2:MovieClip, param3:DisplayObject, param4:Number = 255) : Boolean
      {
         var _loc5_:Object = {};
         var _loc6_:Object = {};
         _loc5_.xMin = param1.getBounds(param3).x;
         _loc5_.xMax = param1.getBounds(param3).x + param1.getBounds(param3).width;
         _loc6_.xMin = param2.getBounds(param3).x;
         _loc6_.xMax = param2.getBounds(param3).x + param2.getBounds(param3).width;
         _loc5_.yMin = param1.getBounds(param3).y;
         _loc5_.yMax = param1.getBounds(param3).y + param1.getBounds(param3).height;
         _loc6_.yMin = param2.getBounds(param3).y;
         _loc6_.yMax = param2.getBounds(param3).y + param2.getBounds(param3).height;
         if(_loc5_.xMax < _loc6_.xMin + 1 || _loc6_.xMax < _loc5_.xMin + 1 || (_loc5_.yMax < _loc6_.yMin + 1 || _loc6_.yMax < _loc5_.yMin + 1))
         {
            return false;
         }
         var _loc7_:Object = {};
         _loc7_.xMin = Math.max(_loc5_.xMin,_loc6_.xMin);
         _loc7_.xMax = Math.min(_loc5_.xMax,_loc6_.xMax);
         _loc7_.yMin = Math.max(_loc5_.yMin,_loc6_.yMin);
         _loc7_.yMax = Math.min(_loc5_.yMax,_loc6_.yMax);
         var _loc8_:BitmapData = new BitmapData(_loc7_.xMax - _loc7_.xMin,_loc7_.yMax - _loc7_.yMin);
         var _loc9_:Matrix = param1.transform.concatenatedMatrix;
         _loc9_.tx -= _loc7_.xMin;
         _loc9_.ty -= _loc7_.yMin;
         _loc8_.draw(param1,_loc9_,new ColorTransform(1,1,1,1,255,-255,-255,param4));
         _loc9_ = param2.transform.concatenatedMatrix;
         _loc9_.tx -= _loc7_.xMin;
         _loc9_.ty -= _loc7_.yMin;
         _loc8_.draw(param2,_loc9_,new ColorTransform(1,1,1,1,255,255,255,param4),"difference");
         var _loc10_:Rectangle = _loc8_.getColorBoundsRect(4294967295,4278255615);
         if(_loc10_.width == 0)
         {
            return false;
         }
         return true;
      }
   }
}

