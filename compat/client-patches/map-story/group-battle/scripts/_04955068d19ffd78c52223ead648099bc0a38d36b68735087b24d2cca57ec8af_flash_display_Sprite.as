package
{
   import flash.display.Sprite;
   import flash.system.Security;
   
   [ExcludeClass]
   public class _04955068d19ffd78c52223ead648099bc0a38d36b68735087b24d2cca57ec8af_flash_display_Sprite extends Sprite
   {
      
      public function _04955068d19ffd78c52223ead648099bc0a38d36b68735087b24d2cca57ec8af_flash_display_Sprite()
      {
         super();
      }
      
      public function allowDomainInRSL(... rest) : void
      {
         Security.allowDomain.apply(null,rest);
      }
      
      public function allowInsecureDomainInRSL(... rest) : void
      {
         Security.allowInsecureDomain.apply(null,rest);
      }
   }
}

