package com.robot.core.config
{
   import com.robot.core.info.fightInfo.PetStatusEffectInfo;
   import com.robot.core.info.fightInfo.PetStatusEffectType;
   
   public class PetStatusEffectConfig
   {
      
      /* 异常状态配表
类：PetStatusEffectConfig
素材：战斗特效状态
Efftype：控制类异常状态配0 弱化类异常状态配1
ctrl：控制类异常状态
weaken：弱化类异常状态
dependent：附属类异常状态
Restriction：限制类异常状态
Derivation:衍化类异常状态
Un前缀代表非xxx异常状态
以上：0=检测、随机时均不包含，1=检测时包含，随机时不包含，2=检测、随机时均包含（游戏设定，附属类异常状态无法在非指名情况下随机出，但可以被计数，包括山神守护、两种免疫也作为附属类遵循此规则）



      */
      private static var xml:XML =
<BattleEffects>
	<BattleEffect Type="0" Name="异常状态">
		<SubEffect ID="0" Name="麻痹" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="1" Name="中毒" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="2" Name="烧伤" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="3" Name="寄生对手" Efftype="2" Ctrl="0" Unctrl="0" Weaken="0" Unweaken="0" Dependent="0" Undependent="0" Restriction="0" Unrestriction="0" Derivation="0" Underivation="0"/>
		<SubEffect ID="4" Name="寄生" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="5" Name="冻伤" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="6" Name="害怕" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="7" Name="疲惫" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="8" Name="睡眠" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="9" Name="石化" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="10" Name="混乱" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="11" Name="衰弱" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="12" Name="山神守护" Efftype="2" Ctrl="0" Unctrl="0" Weaken="0" Unweaken="0" Dependent="0" Undependent="0" Restriction="0" Unrestriction="0" Derivation="0" Underivation="0"/>
		<SubEffect ID="13" Name="易燃" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="14" Name="狂暴" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="15" Name="冰封" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="2" Underivation="0"/>
		<SubEffect ID="16" Name="流血" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="17" Name="免疫" Efftype="2" Ctrl="0" Unctrl="0" Weaken="0" Unweaken="0" Dependent="0" Undependent="0" Restriction="0" Unrestriction="0" Derivation="0" Underivation="0"/>
		<SubEffect ID="18" Name="免疫" Efftype="2" Ctrl="0" Unctrl="0" Weaken="0" Unweaken="0" Dependent="0" Undependent="0" Restriction="0" Unrestriction="0" Derivation="0" Underivation="0"/>
		<SubEffect ID="19" Name="瘫痪" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="0" Restriction="2" Unrestriction="0" Derivation="0" Underivation="2"/>
		<SubEffect ID="20" Name="失明" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="21" Name="异常免疫" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="22" Name="焚烬" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="2" Underivation="0"/>
		<SubEffect ID="23" Name="诅咒" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="2" Underivation="0"/>
		<SubEffect ID="24" Name="烈焰诅咒" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="25" Name="致命诅咒" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="26" Name="虚弱诅咒" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="27" Name="感染" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="2" Underivation="0"/>
		<SubEffect ID="28" Name="束缚" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="29" Name="失神" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="30" Name="沉默" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="31" Name="臣服" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="32" Name="凝滞" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="0" Restriction="2" Unrestriction="0" Derivation="0" Underivation="2"/>
		<SubEffect ID="33" Name="星赐" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="34" Name="星哲" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="35" Name="超频" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="36" Name="沸涌" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="37" Name="砥砺" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="38" Name="星赎" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="39" Name="神游" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="2" Underivation="0"/>
		<SubEffect ID="40" Name="空定" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="2" Underivation="0"/>
		<SubEffect ID="41" Name="狂信" Efftype="0" Ctrl="2" Unctrl="0" Weaken="0" Unweaken="2" Dependent="0" Undependent="2" Restriction="0" Unrestriction="2" Derivation="0" Underivation="2"/>
		<SubEffect ID="42" Name="雷解" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="43" Name="渐冻" Efftype="2" Ctrl="0" Unctrl="1" Weaken="0" Unweaken="1" Dependent="1" Undependent="0" Restriction="0" Unrestriction="1" Derivation="0" Underivation="1"/>
		<SubEffect ID="44" Name="魇昧" Efftype="1" Ctrl="0" Unctrl="2" Weaken="2" Unweaken="0" Dependent="0" Undependent="0" Restriction="2" Unrestriction="0" Derivation="0" Underivation="2"/>
	</BattleEffect>
	<BattleEffect Type="1" Name="战斗能力变化">
		<!-- 参数n 以6为基准  n-6为负数表示能力减弱了多少，为正数表示提升了多少 -->
		<SubEffect ID="1" Name="攻击"/>
		<SubEffect ID="2" Name="防御"/>
		<SubEffect ID="3" Name="特攻"/>
		<SubEffect ID="4" Name="特防"/>
		<SubEffect ID="5" Name="速度"/>
		<SubEffect ID="6" Name="命中"/>
	</BattleEffect>
	<BattleEffect Type="2" Name="印记">
        <SubEffect ID="1" Name="印记"/>
    </BattleEffect>
</BattleEffects>;
      
      private static const ABNORMAL_WEAK:Array = ["25%","50%","100%","250%","500%"];
      
      public function PetStatusEffectConfig()
      {
         super();
      }
      
      public static function getName(param1:uint, param2:uint) : String
      {
         var tl:XMLList = null;
         var il:XMLList = null;
         var type:uint = param1;
         var id:uint = param2;
         tl = xml.BattleEffect.(@Type == type.toString());
         if(tl)
         {
            il = tl[0].SubEffect.(@ID == id.toString());
            if(Boolean(il) && il[0].hasOwnProperty("@Name"))
            {
               return String(il[0].@Name);
            }
            return "";
         }
         return "";
      }
      
      public static function getEffType(param1:uint) : int
      {
         var tl:XMLList = null;
         var il:XMLList = null;
         var id:uint = param1;
         tl = xml.BattleEffect.(@Type == 0);
         if(tl)
         {
            il = tl[0].SubEffect.(@ID == id.toString());
            if(Boolean(il) && il[0].hasOwnProperty("@Efftype"))
            {
               return int(il[0].@Efftype);
            }
            return -1;
         }
         return -1;
      }
      
      public static function getDescription(param1:uint, param2:uint) : String
      {
         var tl:XMLList = null;
         var il:XMLList = null;
         var type:uint = param1;
         var id:uint = param2;
         tl = xml.BattleEffect.(@Type == type.toString());
         if(tl)
         {
            il = tl[0].SubEffect.(@ID == id.toString());
            if(Boolean(il) && il[0].hasOwnProperty("@des"))
            {
               return String(il[0].@des);
            }
            return "";
         }
         return "";
      }
      
      public static function getXml(param1:uint, param2:uint) : XML
      {
         var tl:XMLList = null;
         var il:XMLList = null;
         var type:uint = param1;
         var id:uint = param2;
         tl = xml.BattleEffect.(@Type == type.toString());
         if(tl)
         {
            il = tl[0].SubEffect.(@ID == id.toString());
            if(il)
            {
               return il[0];
            }
            return null;
         }
         return null;
      }
      
      public static function isShow(param1:uint, param2:uint) : Boolean
      {
         var tl:XMLList = null;
         var il:XMLList = null;
         var type:uint = param1;
         var id:uint = param2;
         tl = xml.BattleEffect.(@Type == type.toString());
         if(tl)
         {
            il = tl[0].SubEffect.(@ID == id.toString());
            if(Boolean(il) && il[0].hasOwnProperty("@isShow"))
            {
               return uint(il[0].@isShow) == 1;
            }
            return false;
         }
         return false;
      }
      
      public static function getEffIdsByEfftype(param1:uint) : Array
      {
         var arr:Array = null;
         var tl:XMLList = null;
         var il:XMLList = null;
         var item:* = undefined;
         var type:uint = param1;
         arr = new Array();
         tl = xml.BattleEffect.(@Type == 0);
         if(tl)
         {
            il = tl[0].SubEffect.(@Efftype == type.toString());
            if(il)
            {
               for each(item in il)
               {
                  arr.push(int(item.@ID));
               }
            }
         }
         return arr;
      }
      
      public static function tip(param1:PetStatusEffectInfo) : String
      {
         var _loc2_:String = null;
         switch(param1.type)
         {
            case PetStatusEffectType.ABNORMAL:
               if(param1.id == 15)
               {
                  _loc2_ = param1.name + " 持续" + param1.parm + "回合不能行动，冰封结束后陷入冻伤状态同时速度-1";
               }
               else if(param1.id == 11)
               {
                  _loc2_ = param1.name + ":" + ABNORMAL_WEAK[param1.parm - 1];
               }
               else if(param1.id == 17)
               {
                  _loc2_ = "免疫能力下降；免疫异常状态；PP无限；所有技能必中";
               }
               else if(param1.id == 18)
               {
                  _loc2_ = "免疫异常状态；PP无限";
               }
               else
               {
                  _loc2_ = param1.name + " 持续" + param1.parm + "回合";
               }
               break;
            case PetStatusEffectType.TRAIT:
               if(param1.parm > 6)
               {
                  _loc2_ = param1.name + "等级 +" + (param1.parm - 6);
               }
               else
               {
                  _loc2_ = param1.name + "等级 -" + (6 - param1.parm);
               }
               break;
            default:
               _loc2_ = param1.name + " 持续" + param1.parm + "回合";
         }
         return _loc2_;
      }
   }
}

