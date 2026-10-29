package com.robot.core.group.event
{
   import flash.events.Event;
   
   public class GroupFightEvent extends Event
   {
      
      public static const FIGHT_RESULT:String = "gp_fightResult";
      
      public static const ALARM_CLICK:String = "gp_alarmClick";
      
      public static const AUTO_USE_SKILL:String = "gp_autoUseSkill";
      
      public static const PET_WIN_CLICKED:String = "gp_petWin_clicked";
      
      public static const START_FIGHT:String = "gp_startFight";
      
      public static const USE_SKILL:String = "gp_useSkill";
      
      public static const USE_SKILL_AUTO:String = "gp_useSkill_auto";
      
      public static const USE_SKILL_SUC:String = "gp_useSkill_suc";
      
      public static const USE_SKILL_SUC_PP:String = "gp_useSkill_suc_pp";
      
      public static const USE_SKILL_SUC_ATTACK:String = "gp_useSkill_suc_attack";
      
      public static const USE_SKILL_FAIL:String = "gp_useSkill_Fail";
      
      public static const SKILL_MOVIE_DONE:String = "gp_skillMovieDone";
      
      public static const SKILL_ATTACK_DONE:String = "gp_skillAttackDone";
      
      public static const LOST_HP:String = "gp_lostHp";
      
      public static const GAIN_HP:String = "gp_gainHp";
      
      public static const REMAIN_HP:String = "gp_remainHp";
      
      public static const FIGHTER_NO_BLOOD:String = "gp_fighter_noBlood";
      
      public static const FIGHT_OVER:String = "gp_fightOver";
      
      public static const FIGHT_CLOSE:String = "gp_fightClose";
      
      public static const SPRITE_DIE:String = "gp_sprite_died";
      
      public static const NO_FIGHT_PET:String = "gp_no_fihgt_pet";
      
      public static const CHANGE_PET:String = "gp_changePet";
      
      public static const DIE_SPRITE_FLYEND:String = "gp_die_sprite_flyEnd";
      
      public static const PET_UPDATE_PROP:String = "gp_petUpdateProp";
      
      public static const PET_UPDATE_SKILL:String = "gp_petUpdateSkill";
      
      public static const BATTLE_OVER:String = "gp_battleOver";
      
      public static const ON_OPENNING:String = "gp_onOpenning";
      
      public static const USE_PET_ITEM:String = "gp_usePetItem";
      
      public static const ON_USE_PET_ITEM:String = "gp_onUsePetItem";
      
      public static const ESCAPE:String = "gp_escape";
      
      public static const PET_HAS_EXIST:String = "gp_petHasExist";
      
      public static const AUTO_SELECT_PET:String = "gp_autoSelectPet";
      
      public static const CATCH_SUCCESS:String = "gp_catchSuccess";
      
      public static const GET_FIGHT_INFO_SUCCESS:String = "gp_getFightInfoSuccess";
      
      public static const OPP_FIGHTER_PET_LIST:String = "opp_fighter_pet_list";
      
      public static const LOAD_ASSETS_TIME_OUT:String = "gp_load_assets_time_out";
      
      private var obj:Object;
      
      private var _fun:Function;
      
      public function GroupFightEvent(param1:String, param2:Object = null, param3:Function = null, param4:Boolean = false, param5:Boolean = false)
      {
         super(param1,param4,param5);
         this.obj = param2;
         this._fun = param3;
      }
      
      public function get dataObj() : Object
      {
         return this.obj;
      }
      
      public function get fun() : Function
      {
         return this._fun;
      }
   }
}

