package com.robot.groupFight.control
{
   import com.robot.core.group.fightInfo.fighting.skill.GpFtSkillHurtInfo;
   import com.robot.groupFight.control.skill.GankSkillAction;
   import com.robot.groupFight.control.skill.ISkillAction;
   import com.robot.groupFight.control.skill.MassSkillAction;
   import com.robot.groupFight.control.skill.SingleSkillAction;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   
   public class SkillActionPase
   {
      
      private static var _info:GpFtSkillHurtInfo;
      
      private static var _infoArr:Array;
      
      private static var _sInfo:SkillPlayInfo;
      
      private static var _gankArr:Array;
      
      private static var _massAttackArr:Array = [];
      
      private static var _isMassAttack:Boolean = false;
      
      public function SkillActionPase()
      {
         super();
      }
      
      public static function paseSkill(infoArr:Array) : ISkillAction
      {
         var ghInfo:GpFtSkillHurtInfo = null;
         var attackStr:String = null;
         var attackedStr:String = null;
         var cnt:uint = 0;
         var info:GpFtSkillHurtInfo = null;
         var sInfo:SkillPlayInfo = null;
         var i:int = 0;
         var gsAction:ISkillAction = null;
         var arr:Array = null;
         var gInfo:GpFtSkillHurtInfo = null;
         var massAction:ISkillAction = null;
         var str:String = "";
         for each(ghInfo in _infoArr)
         {
            attackStr = ghInfo.attackSkillHurtInfo.side + "_" + ghInfo.attackSkillHurtInfo.pos;
            attackedStr = ghInfo.attackedSkillHurtInfo.side + "_" + ghInfo.attackedSkillHurtInfo.pos;
            str += "【" + attackStr + "】--attack--->【" + attackedStr + "】\r";
         }
         trace(str);
         _gankArr = [];
         _infoArr = infoArr;
         _info = infoArr.shift();
         _sInfo = new SkillPlayInfo(_info);
         if(_info.isGank)
         {
            cnt = 0;
            for each(info in infoArr)
            {
               if(info.isGank)
               {
                  sInfo = new SkillPlayInfo(info);
                  _gankArr.push(sInfo);
                  infoArr.splice(cnt,1);
               }
               cnt++;
            }
         }
         if(_gankArr.length >= 1)
         {
            _gankArr.push(new SkillPlayInfo(_info));
            i = infoArr.indexOf(_info);
            if(i != -1)
            {
               infoArr.splice(i,1);
            }
            gsAction = new GankSkillAction(_sInfo,_gankArr);
            trace("合击----->" + _gankArr);
            return gsAction;
         }
         if(checkIsMassAttack())
         {
            arr = [];
            for each(gInfo in _massAttackArr)
            {
               if(Boolean(gInfo))
               {
                  arr.push(new SkillPlayInfo(gInfo));
               }
            }
            massAction = new MassSkillAction(_sInfo,arr);
            trace("群攻----->" + _sInfo.aedModel.info.point + arr.toString());
            return massAction;
         }
         var ssAction:ISkillAction = new SingleSkillAction(_sInfo);
         trace("单体攻击----->" + _sInfo.aedModel.info.point);
         return ssAction;
      }
      
      private static function checkIsMassAttack() : Boolean
      {
         var sidePos:String = null;
         var cnt:uint = 0;
         var check:Function = function():void
         {
            var nextInfo:GpFtSkillHurtInfo = _infoArr[cnt];
            var nextSP:String = nextInfo.attackSkillHurtInfo.side + "_" + nextInfo.attackSkillHurtInfo.pos;
            if(sidePos == nextSP)
            {
               ++cnt;
               _massAttackArr.push(nextInfo);
               if(cnt < _infoArr.length - 1)
               {
                  check();
               }
            }
         };
         if(_infoArr.length < 1)
         {
            return false;
         }
         _massAttackArr = [];
         sidePos = _info.attackSkillHurtInfo.side + "_" + _info.attackSkillHurtInfo.pos;
         check();
         if(_massAttackArr.length >= 1)
         {
            _infoArr.splice(0,_massAttackArr.length);
            _massAttackArr.push(_info);
            return true;
         }
         return false;
      }
   }
}

