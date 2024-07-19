/* Copyright (c) 2021-2024 Uni Musuotankarep.
This program is free software; you can redistribute it and/or modify
it under the terms of version 2 of the GNU General Public License as published by
the Free Software Foundation


This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. */

1043
%{
#include "StdH.h"
#include "EntitiesMP/Player.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum CustomEnemyBehaviorType {
  0 CEBT_CHASER        "Chaser",          // chaser variant
  1 CEBT_MELEE         "Melee Grunt",     // melee only variant
  2 CEBT_RANGED        "Ranged Grunt",    // melee and ranged variant
  3 CEBT_DEFENSIVE     "Defensive Grunt", // melee only variant that can block attacks
  4 CEBT_LEAP          "Leaping Grunt",   // melee only variant that can leap or charge
  5 CEBT_STRAFE        "Strafing Grunt",  // melee only variant that can strafe and backpedal
  6 CEBT_TACTICAL      "Tactical Grunt",  // melee and ranged variant that can strafe and backpedal
  7 CEBT_WANDER        "Wanderer",        // wanderer variant
  8 CEBT_CHARGER       "Charger",         // melee only variant that can rush
  9 CEBT_COMBAT        "Combative Grunt", // melee only variant that can block attacks, strafe and backpedal
 10 CEBT_COMBATRANGED  "Ranged Combative Grunt", // melee and ranged variant that can block attacks, strafe and backpedal
};

enum CustomEnemySizeType {
  0 CEST_NORMAL     "Normal",         // average
  1 CEST_SHORT      "Short",          // midget
  2 CEST_TALL       "Tall",           // giant
  3 CEST_TINY       "Tiny",           // dwarf
};

%{

// info structure
static EntityInfo eiCustomEnemy = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.75f, 0.0f,    // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

static EntityInfo eiCustomEnemyTall = {
  EIBT_FLESH, 400.0f,
  0.0f, 2.0f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

static EntityInfo eiCustomEnemyShort = {
  EIBT_FLESH, 150.0f,
  0.0f, 1.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

static EntityInfo eiCustomEnemyTiny = {
  EIBT_FLESH, 150.0f,
  0.0f, 1.25f, 0.0f,    // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CCustomEnemy: CEnemyBase {
name      "Custom Enemy";
thumbnail "Thumbnails\\CustomEnemy.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum CustomEnemyBehaviorType m_cebtAIType "Behavior Type" = CEBT_CHASER,
 72 enum CustomEnemySizeType m_cestSizeType "Size Type" = CEST_NORMAL,
  4 FLOAT m_fCustomHealth "Custom Health" = 100.0f,
  5 FLOAT m_fCustomDamageWounded "Custom Wounded Damage" = 150.0f,
  6 FLOAT m_fCustomWalkSpeed "Custom Walk Speed" = 3.0f,
  7 FLOAT m_fCustomAttackRunSpeed "Custom Attack Run Speed" = 5.0f,
  8 FLOAT m_fCustomCloseRunSpeed "Custom Close Run Speed" = 5.0f,
  9 FLOAT m_fCustomDensity "Custom Density" = 1000.0f,
 10 FLOAT m_fCustomBreathHoldTime "Custom Breath Hold Time" = 30.0f,
 11 enum FactionType m_ftCustomFactionType "Faction Type" = FT_NONE,

 12 ANGLE m_aCustomWalkRotateSpeed "Custom Walk Rotate Speed" = AngleDeg(10.0f),
 13 ANGLE m_aCustomAttackRotateSpeed "Custom Attack Rotate Speed" = AngleDeg(10.0f),
 14 ANGLE m_aCustomCloseRotateSpeed "Custom Close Rotate Speed" = AngleDeg(10.0f),
 15 FLOAT m_fCustomMeleeDamage "Custom Melee Damage" = 10.0f,
 16 FLOAT m_fCustomScore "Custom Score" = 1000.0f,

 17 CTFileName m_fnmCustomTexture  "Custom Texture" = CTFILENAME("Models\\NPCs\\Twitcher\\BladedTwitcherNew\\TwitcherBladed1.tex"),
 18 CTFileName m_fnmCustomModel    "Custom Model" = CTFILENAME("Models\\NPCs\\Twitcher\\BladedTwitcherNew\\TwitcherBladed.mdl"),
 19 CTFileName m_fnmSightSound     "Sight Sound" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareSight1.wav"),
 20 CTFileName m_fnmIdleSound      "Idle Sound" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareIdle1.wav"),
 21 CTFileName m_fnmWoundSound     "Wound Sound" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareWound1.wav"),
 22 CTFileName m_fnmDeathSound     "Death Sound" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareDeath1.wav"),
 23 CTFileName m_fnmActiveSound    "Active Sound" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareAttack1.wav"),
 60 CTFileName m_fnmPainSound      "Pain Sound" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareWound3.wav"),

 76 CTFileName m_fnmSightSound2    "Sight Sound 2" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareSight1.wav"),
 77 CTFileName m_fnmSightSound3    "Sight Sound 3" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareSight1.wav"),
 78 CTFileName m_fnmIdleSound2     "Idle Sound 2" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareSight1.wav"),
 79 CTFileName m_fnmIdleSound3     "Idle Sound 3" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareSight1.wav"),
 80 CTFileName m_fnmWoundSound2    "Wound Sound 2" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareWound1.wav"),
 81 CTFileName m_fnmWoundSound3    "Wound Sound 3" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareWound1.wav"),
 82 CTFileName m_fnmDeathSound2    "Death Sound 2" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareDeath1.wav"),
 83 CTFileName m_fnmDeathSound3    "Death Sound 3" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareDeath1.wav"),
 84 CTFileName m_fnmActiveSound2   "Active Sound 2" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareAttack1.wav"),
 85 CTFileName m_fnmActiveSound3   "Active Sound 3" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareAttack1.wav"),
 86 CTFileName m_fnmPainSound2     "Pain Sound 2" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareWound3.wav"),
 87 CTFileName m_fnmPainSound3     "Pain Sound 3" = CTFILENAME("Models\\NPCs\\Twitcher\\Sounds\\NightmareWound3.wav"),

 24 ANIMATION m_iEnemyStandAnim        "Stand Animation" = 0,
 63 ANIMATION m_iEnemyStandFightAnim   "Stand Fight Animation" = 0,
 25 ANIMATION m_iEnemyWalkAnim         "Walk Animation" = 0,
 26 ANIMATION m_iEnemyRunAnim          "Run Animation" = 0,
 27 ANIMATION m_iEnemyRotateAnim       "Rotate Animation" = 0,
 28 ANIMATION m_iEnemyBackpedalAnim    "Backpedal Animation" = 0,
 29 ANIMATION m_iEnemyStrafeLeftAnim   "Strafe Left Animation" = 0,
 30 ANIMATION m_iEnemyStrafeRightAnim  "Strafe Right Animation" = 0,
 31 ANIMATION m_iEnemyMeleeAnim        "Melee Animation" = 0,
 32 ANIMATION m_iEnemyRangedAnim       "Ranged Animation" = 0,
 33 ANIMATION m_iEnemyWoundAnim        "Wound Animation" = 0,
 34 ANIMATION m_iEnemyDeathAnim        "Death Animation" = 0,
 39 ANIMATION m_iEnemyJumpAnim         "Jump Animation" = 0,
 40 ANIMATION m_iEnemyBlockAnim        "Block Animation" = 0,
 49 ANIMATION m_iEnemyBackDeathAnim    "Back Death Animation" = 0,
 50 ANIMATION m_iEnemyHeadWoundAnim    "Head Wound Animation" = 0,

 35 CTFileName m_fnmMissSound      "Miss Sound" = CTFILENAME("Models\\Weapons\\Knife\\Sounds\\Swing.wav"),
 36 CTFileName m_fnmHitSound       "Hit Sound" = CTFILENAME("Models\\NPCs\\Abomination\\Sounds\\Hit.wav"),
 88 CTFileName m_fnmBlockHitSound  "Block Hit Sound" = CTFILENAME("Models\\NPCs\\Abomination\\Sounds\\Hit.wav"),
 37 CTFileName m_fnmFireSound      "Fire Sound" = CTFILENAME("Models\\NPCs\\Gunman\\Sounds\\PistolAttack.wav"),
 38 INDEX m_iDeathCollisionBox     "Death Collision Box" = 0,
 41 enum ProjectileType m_ptCustomProjectile "Custom Projectile" = PRT_GUNMAN_BULLET,
 42 FLOAT m_fCustomDeathDensity "Custom Death Density" = 500.0f,
 43 FLOAT m_fCustomMeleeRange "Custom Melee Range" = 3.0f,
 44 FLOAT m_fCustomStopDistance "Custom Stop Distance" = 1.5f,
 45 FLOAT m_fCustomAttackDistance "Custom Attack Distance" = 100.0f,
 46 FLOAT m_fCustomMeleeTime "Custom Melee Time" = 1.0f,
 47 FLOAT m_fCustomFireTime "Custom Fire Time" = 0.5f,
 48 FLOAT m_fCustomIgnoreRange "Custom Ignore Range" = 200.0f,
 51 BOOL m_bUseBackDeathAnim "Use Back Death Animation" = FALSE,
 52 BOOL m_bUseHeadWoundAnim "Use Head Wound Animation" = FALSE,
 53 INDEX m_iBackDeathCollisionBox     "Back Death Collision Box" = 0,
 54 enum DamageType m_dmtMeleeType "Melee Damage Type" = DMT_CLOSERANGE,    // type of melee damage
 55 CTStringTrans m_strMessage     "Kill Message" = "A Custom Enemy pwned",     // message
 56 INDEX m_iMeleeBlockChance      "Melee Block Chance" = 2,
 57 FLOAT m_fCustomBlowUpSize      "Custom Blow Up Size" = 4,
 58 FLOAT m_fCustomBlowUpAmount    "Custom Blow Up Amount" = 190.0f,
 59 INDEX m_fCustomBlowUpParts     "Custom Blow Up Parts" = 4,
 61 INDEX m_iStrafeChance          "Strafe Chance" = 2,
 62 INDEX m_iRandomMovementChoice = 0,
 64 FLOAT m_fCustomBlockStartTime "Custom Block Start Time" = 0.25f,
 65 FLOAT m_fCustomBlockWaitTime  "Custom Block Wait Time" = 1.0f,
 66 FLOAT m_fCustomMeleeStartTime "Custom Melee Start Time" = 0.30f,
 67 FLOAT m_fCustomMeleeEndTime   "Custom Melee End Time" = 0.30f,
 68 FLOAT m_fCustomRangedStartTime "Custom Ranged Start Time" = 0.25f,
 69 FLOAT m_fCustomRangedEndTime   "Custom Ranged End Time" = 0.50f,
 70 FLOAT m_fCustomRangedLockOnTime  "Custom Ranged Lock On Time" = 0.50f,
 71 FLOAT m_fCustomStrafeTime        "Custom Strafe Time" = 1.0f,
 73 FLOAT m_fCustomProjectileY  "Custom Projectile Y Position" = 1.0f,
 74 FLOAT m_fCustomProjectileX  "Custom Projectile X Position" = 0.0f,
 75 FLOAT m_fCustomProjectileZ  "Custom Projectile Z Position" = 0.0f,

  {
    CTextureObject m_toCustomTexture;
    CModelObject m_moCustomModel;
    CAutoPrecacheSound m_aps;
  }

components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      if(m_strMessage != "") {
        str.PrintF(m_strMessage+TRANS(" %s"), strPlayerName);
      }
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    if(m_cestSizeType == CEST_TINY) {
      return &eiCustomEnemyTiny;
    } else if(m_cestSizeType == CEST_SHORT) {
      return &eiCustomEnemyShort;
    } else if(m_cestSizeType == CEST_TALL) {
      return &eiCustomEnemyTall;
    } else {
      return &eiCustomEnemy;
    }
  };

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CEnemyBase::Read_t(istr);
    // setup beam texture
    m_moCustomModel.SetData_t(m_fnmCustomModel);
    m_toCustomTexture.SetData_t(m_fnmCustomTexture);
  }

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CCustomEnemy) - sizeof(CEnemyBase) + CEnemyBase::GetUsedMemory();
    // add some more
    slUsedMemory += m_strMessage.Length();
    return slUsedMemory;
  }

  void SetCustomTexture(void)
  {
    try {
      m_toCustomTexture.SetData_t(m_fnmCustomTexture);
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load custom enemy texture: %s"), strError);
    }
  }

  void Precache(void) {
    CEnemyBase::Precache();
    m_aps.Precache(m_fnmSightSound);
    m_aps.Precache(m_fnmSightSound2);
    m_aps.Precache(m_fnmSightSound3);
    m_aps.Precache(m_fnmIdleSound);
    m_aps.Precache(m_fnmIdleSound2);
    m_aps.Precache(m_fnmIdleSound3);
    m_aps.Precache(m_fnmWoundSound);
    m_aps.Precache(m_fnmWoundSound2);
    m_aps.Precache(m_fnmWoundSound3);
    m_aps.Precache(m_fnmDeathSound);
    m_aps.Precache(m_fnmDeathSound2);
    m_aps.Precache(m_fnmDeathSound3);
    m_aps.Precache(m_fnmActiveSound);
    m_aps.Precache(m_fnmActiveSound2);
    m_aps.Precache(m_fnmActiveSound3);
    m_aps.Precache(m_fnmMissSound);
    m_aps.Precache(m_fnmHitSound);
    m_aps.Precache(m_fnmBlockHitSound);
    m_aps.Precache(m_fnmFireSound);
    m_aps.Precache(m_fnmPainSound);
    m_aps.Precache(m_fnmPainSound2);
    m_aps.Precache(m_fnmPainSound3);
    PrecacheClass(CLASS_PROJECTILE, PRT_FLAME);
    PrecacheClass(CLASS_PROJECTILE, PRT_SHOOTER_FLAME);
    PrecacheClass(CLASS_PROJECTILE, PRT_AFTERBURNER_DEBRIS);
    PrecacheClass(CLASS_PROJECTILE, PRT_GUNMAN_BULLET);
    PrecacheClass(CLASS_PROJECTILE, PRT_DOOMIMP_FIREBALL);
    PrecacheClass(CLASS_PROJECTILE, PRT_ABOMINATION_SPIT);
    PrecacheClass(CLASS_PROJECTILE, PRT_SHOOTER_FIREBALL);
    PrecacheClass(CLASS_PROJECTILE, PRT_SHOOTER_SPIT);
    PrecacheClass(CLASS_PROJECTILE, PRT_SHAMBLER_BLOOD_BUNDLE);
    PrecacheClass(CLASS_PROJECTILE, PRT_MUTANT_SPIT);
  };

  /* Get anim data for given animation property - return NULL for none. */
  CAnimData *GetAnimData(SLONG slPropertyOffset) 
  {
    if (slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyStandAnim)     ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyStandFightAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyWalkAnim)      ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyRunAnim)       ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyRotateAnim)    ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyBackpedalAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyStrafeLeftAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyStrafeRightAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyMeleeAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyRangedAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyWoundAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyDeathAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyJumpAnim)  ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyBlockAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyBackDeathAnim) ||
        slPropertyOffset==offsetof(CCustomEnemy, m_iEnemyHeadWoundAnim)) {
      return GetModelObject()->GetData();
    } else {
      return CEntity::GetAnimData(slPropertyOffset);
    }
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    if(m_ibtBehavior != IBT_NONE) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      if(IsOfClass(penInflictor, "Custom Enemy")) {
        SetTargetHardForce(penInflictor);
        // if died of chainsaw
        if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
          // must always blowup
          m_fBlowUpAmount = 0;
        }
      }

      
    } else {
      // custom enemy can't harm custom enemy
      if (!IsOfClass(penInflictor, "Custom Enemy")) {
        CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
        // if died of chainsaw
        if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
          // must always blowup
          m_fBlowUpAmount = 0;
        }
      }
    }
  };

  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    if(m_bUseHeadWoundAnim) {
      if(dbptType == DBPT_HEAD) {
        iAnim = m_iEnemyHeadWoundAnim;
      } else {
        iAnim = m_iEnemyWoundAnim;
      }
    } else {
      iAnim = m_iEnemyWoundAnim;
    }
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    FLOAT3D vFront;
    GetHeadingDirection(0, vFront);
    FLOAT fDamageDir = m_vDamage%vFront;

    if (m_bUseBackDeathAnim) {
        if (fDamageDir<0) {
            iAnim = m_iEnemyDeathAnim;
        } else {
            iAnim = m_iEnemyBackDeathAnim;
        }
    } else {
      iAnim = m_iEnemyDeathAnim;
    }

    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    if(GetModelObject()->GetAnim()==m_iEnemyDeathAnim) {
      ChangeCollisionBoxIndexWhenPossible(m_iDeathCollisionBox);
    } else {
      ChangeCollisionBoxIndexWhenPossible(m_iBackDeathCollisionBox);
    }
    en_fDensity = m_fCustomDeathDensity;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(m_iEnemyStandAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void StandingAnimFight(void) {
    StartModelAnim(m_iEnemyStandFightAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(m_iEnemyWalkAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
    StartModelAnim(m_iEnemyRunAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    StartModelAnim(m_iEnemyRotateAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void StrafeLeftAnim(void) {
    StartModelAnim(m_iEnemyStrafeLeftAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void StrafeRightAnim(void) {
    StartModelAnim(m_iEnemyStrafeRightAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void BacksteppingAnim(void) {
    StartModelAnim(m_iEnemyBackpedalAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void JumpingAnim(void) {
    StartModelAnim(m_iEnemyJumpAnim, AOF_LOOPING|AOF_NORESTART);
  };

  void SightSound(void) {
    switch(IRnd()%3)
    {
      case 0: PlaySound(m_soVoice, m_fnmSightSound, SOF_3D); break;
      case 1: PlaySound(m_soVoice, m_fnmSightSound2, SOF_3D); break;
      case 2: PlaySound(m_soVoice, m_fnmSightSound3, SOF_3D); break;
      default: ASSERTALWAYS("Custom Enemy unknown sight sound");
    }
  };

  void IdleSound(void) {
    switch(IRnd()%3)
    {
      case 0: PlaySound(m_soVoice, m_fnmIdleSound, SOF_3D); break;
      case 1: PlaySound(m_soVoice, m_fnmIdleSound2, SOF_3D); break;
      case 2: PlaySound(m_soVoice, m_fnmIdleSound3, SOF_3D); break;
      default: ASSERTALWAYS("Custom Enemy unknown idle sound");
    }
  };

  void WoundSound(void) {
    switch(IRnd()%3)
    {
      case 0: PlaySound(m_soVoice, m_fnmWoundSound, SOF_3D); break;
      case 1: PlaySound(m_soVoice, m_fnmWoundSound2, SOF_3D); break;
      case 2: PlaySound(m_soVoice, m_fnmWoundSound3, SOF_3D); break;
      default: ASSERTALWAYS("Custom Enemy unknown wound sound");
    }
  };

  void DeathSound(void) {
    switch(IRnd()%3)
    {
      case 0: PlaySound(m_soVoice, m_fnmDeathSound, SOF_3D); break;
      case 1: PlaySound(m_soVoice, m_fnmDeathSound2, SOF_3D); break;
      case 2: PlaySound(m_soVoice, m_fnmDeathSound3, SOF_3D); break;
      default: ASSERTALWAYS("Custom Enemy unknown death sound");
    }
  };

  void ActiveSound(void) {
    switch(IRnd()%3)
    {
      case 0: PlaySound(m_soVoice, m_fnmActiveSound, SOF_3D); break;
      case 1: PlaySound(m_soVoice, m_fnmActiveSound2, SOF_3D); break;
      case 2: PlaySound(m_soVoice, m_fnmActiveSound3, SOF_3D); break;
      default: ASSERTALWAYS("Custom Enemy unknown active sound");
    }
  };

  void PainSound(void) {
    switch(IRnd()%3)
    {
      case 0: PlaySound(m_soVoice, m_fnmPainSound, SOF_3D); break;
      case 1: PlaySound(m_soVoice, m_fnmPainSound2, SOF_3D); break;
      case 2: PlaySound(m_soVoice, m_fnmPainSound3, SOF_3D); break;
      default: ASSERTALWAYS("Custom Enemy unknown pain sound");
    }
  };

  // --------------------------------------------------------------------------------------
  // Check if an entity is valid for being your new enemy.
  // --------------------------------------------------------------------------------------
  BOOL IsValidForEnemy(CEntity *penNewTarget)
  {
    // nothing is not allowed
    if (penNewTarget == NULL)
    {
      return FALSE;
    }

    // don't target the dead
    if (!(penNewTarget->GetFlags()&ENF_ALIVE))
    {
      return FALSE;
    }

    if (IsOfClass(penNewTarget, "Player"))
    {
      if((this->GetFaction() == FT_ALLY) || (this->GetFaction() == FT_VICTIM))
      {
        return FALSE;
      }

      return TRUE;
    }

    if (IsDerivedFromClass(penNewTarget, "Enemy Base")) {
      CEnemyBase &enEB = (CEnemyBase&)*penNewTarget;

      // don't target templates
      if (enEB.m_bTemplate) {
        return FALSE;
      }

      // don't target if the faction is not valid
      if(!enEB.IsFactionValid())
      {
        return FALSE;
      }

      // don't target your allies
      if(enEB.GetFaction() == this->GetFaction())
      {
        if(m_ibtBehavior != IBT_NONE && IsOfClass(penNewTarget, "Custom Enemy")) {
          return TRUE;
        }
        return FALSE;
      }

      // make exceptions for targets
      if((enEB.GetFaction() == FT_SHADOW) || (enEB.GetFaction() == FT_WILDLIFE))
      {
        return FALSE;
      }

      if((this->GetFaction() == FT_WILDLIFE || this->GetFaction() == FT_SHADOW) && (enEB.GetFaction() == FT_LESSER || enEB.GetFaction() == FT_GREATER))
      {
        return FALSE;
      }

      return TRUE;
    }

    return FALSE;
  }


  procedures:

  BlockEnemyMelee(EVoid) {
    StartModelAnim(m_iEnemyBlockAnim, 0);

    autowait(m_fCustomBlockStartTime);

    m_bIsBlocking = TRUE;

    autowait(m_fCustomBlockWaitTime);

    m_bIsBlocking = FALSE;

    return EReturn();
  }

  Fire(EVoid) : CEnemyBase::Fire
  {
    if(m_cebtAIType == CEBT_RANGED || m_cebtAIType == CEBT_TACTICAL || m_cebtAIType == CEBT_COMBATRANGED) {
      autocall RangedAttack() EEnd;
    }

    if(m_cebtAIType == CEBT_TACTICAL || m_cebtAIType == CEBT_COMBATRANGED) {
      m_fLockOnEnemyTime = m_fCustomStrafeTime;

      m_iRandomMovementChoice = IRnd()%m_iStrafeChance;

      if(m_iRandomMovementChoice == 1) {
        autocall CEnemyBase::StepBackwards() EReturn;
      } else if(m_iRandomMovementChoice == 3) {
        autocall CEnemyBase::StrafeLeftOrRightRandom() EReturn;
      }
    }

    return EReturn();
  };

  Hit(EVoid) : CEnemyBase::Hit
  {
    INDEX iRandomChoice = IRnd()%m_iMeleeBlockChance;

    if(m_cebtAIType == CEBT_DEFENSIVE || m_cebtAIType == CEBT_COMBAT || m_cebtAIType == CEBT_COMBATRANGED) {
      if(iRandomChoice == 1) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    }

    if(m_cebtAIType != CEBT_WANDER || m_cebtAIType != CEBT_CHASER) {
      autocall MeleeAttack() EEnd;
    }

    if(m_cebtAIType == CEBT_STRAFE || m_cebtAIType == CEBT_TACTICAL || m_cebtAIType == CEBT_COMBAT || m_cebtAIType == CEBT_COMBATRANGED) {
      m_fLockOnEnemyTime = m_fCustomStrafeTime;

      m_iRandomMovementChoice = IRnd()%m_iStrafeChance;

      if(m_iRandomMovementChoice == 1) {
        autocall CEnemyBase::StepBackwards() EReturn;
      } else if(m_iRandomMovementChoice == 3) {
        autocall CEnemyBase::StrafeLeftOrRightRandom() EReturn;
      }
    }

    return EReturn();
  };

  MeleeAttack(EVoid) {
    // close attack
    StartModelAnim(m_iEnemyMeleeAnim, 0);
    m_bFistHit = FALSE;
    autowait(m_fCustomMeleeStartTime);
    if (CalcDist(m_penEnemy) < m_fCustomMeleeRange) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCustomMeleeRange) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();
        
        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              PlaySound(m_soSound, m_fnmBlockHitSound, SOF_3D);
            } else {
              PlaySound(m_soSound, m_fnmHitSound, SOF_3D);
            }
          } else {
            PlaySound(m_soSound, m_fnmHitSound, SOF_3D);
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              PlaySound(m_soSound, m_fnmBlockHitSound, SOF_3D);
            } else {
              PlaySound(m_soSound, m_fnmHitSound, SOF_3D);
            }
          } else {
            PlaySound(m_soSound, m_fnmHitSound, SOF_3D);
          }
        }

        InflictDirectDamage(m_penEnemy, this, m_dmtMeleeType, m_fCustomMeleeDamage, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, m_fnmMissSound, SOF_3D);
    }

    autowait(m_fCustomMeleeEndTime);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  };

  RangedAttack(EVoid) {
    m_fLockOnEnemyTime = m_fCustomRangedLockOnTime;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(m_fCustomRangedStartTime + FRnd()/4);

    StartModelAnim(m_iEnemyRangedAnim, 0);
    ShootProjectile(m_ptCustomProjectile, FLOAT3D(m_fCustomProjectileX, m_fCustomProjectileY, m_fCustomProjectileZ), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, m_fnmFireSound, SOF_3D);

    autowait(m_fCustomRangedEndTime + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // --------------------------------------------------------------------------------------
  // Play wounding animation.
  // --------------------------------------------------------------------------------------
  BeWounded(EDamage eDamage)
  { 
    m_bIsBlocking = FALSE;
    m_bBlockFirearms = FALSE;
    StopMoving();
    // determine damage anim and play the wounding
    autowait(GetAnimLength(AnimForDamage(eDamage.fAmount, eDamage.dbptType)));
    return EReturn();
  };


  PreMainLoop(EVoid)
  {
    if(m_fnmPainSound != "") {
      m_bUsePainSound = TRUE;
    } else {
      m_bUsePainSound = FALSE;
    }
    return EReturn();
  }


  /************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);

    // setup visuals
    SetModel(m_fnmCustomModel);
    SetCustomTexture();

    try {
      GetModelObject()->mo_toTexture.SetData_t(m_fnmCustomTexture);
    } catch (char *strError) {
      WarningMessage(strError);
    }

    m_ftFactionType = m_ftCustomFactionType;
    SetHealth(m_fCustomHealth);
    m_fMaxHealth = m_fCustomHealth;
    m_fDamageWounded = m_fCustomDamageWounded;
    m_iScore = m_fCustomScore;
    en_tmMaxHoldBreath = m_fCustomBreathHoldTime;
    en_fDensity = m_fCustomDensity;
    m_fBlowUpSize = m_fCustomBlowUpSize;

        
        m_fWalkSpeed = FRnd() + m_fCustomWalkSpeed;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*m_aCustomWalkRotateSpeed + 500.0f);
        m_fAttackRunSpeed = FRnd() + m_fCustomAttackRunSpeed;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*m_aCustomAttackRotateSpeed + 245.0f);
        m_fCloseRunSpeed = FRnd() + m_fCustomCloseRunSpeed;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*m_aCustomCloseRotateSpeed + 245.0f);
        
        // setup attack distances
        m_fAttackDistance = m_fCustomAttackDistance;
        m_fCloseDistance = m_fCustomMeleeRange;
        m_fStopDistance = m_fCustomStopDistance;
        m_fAttackFireTime = m_fCustomFireTime;
        m_fCloseFireTime = m_fCustomMeleeTime;
        m_fIgnoreRange = m_fCustomIgnoreRange;
        // damage/explode properties
        m_fBlowUpAmount = m_fCustomBlowUpAmount;
        m_fBodyParts = m_fCustomBlowUpParts;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};