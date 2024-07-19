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

1050
%{
#include "StdH.h"
#include "EntitiesMP/Player.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum StalkerType {
  0 STC_BALDRED        "Bald Red Shirt",
  1 STC_BALDBROWN      "Bald Brown Shirt",
  2 STC_BALDWHITE      "Bald White",
  3 STC_BALDREDGUNNER  "Pistol Bald Red Shirt",
  4 STC_BALDREDDUALGUNNER  "Dual Pistols Bald Red Shirt"
};

%{

  static INDEX idStalkerAnim_TPose = -1;
  static INDEX idStalkerAnim_Stand = -1;
  static INDEX idStalkerAnim_Walk  = -1;
  static INDEX idStalkerAnim_Run   = -1;
  static INDEX idStalkerAnim_RunKnife = -1;
  static INDEX idStalkerAnim_Wound   = -1;
  static INDEX idStalkerAnim_Melee1  = -1;
  static INDEX idStalkerAnim_Melee2  = -1;
  static INDEX idStalkerAnim_Melee3  = -1;
  static INDEX idStalkerAnim_Melee4  = -1;
  static INDEX idStalkerAnim_DeathFront = -1;
  static INDEX idStalkerAnim_DeathBack  = -1;
  static INDEX idStalkerAnim_RunMelee1  = -1;
  static INDEX idStalkerAnim_RunMelee2  = -1;
  static INDEX idStalkerAnim_RunMelee3  = -1;
  static INDEX idStalkerAnim_RunMelee4  = -1;
  static INDEX idStalkerAnim_FirePistol = -1;
  static INDEX idStalkerAnim_PistolReady = -1;
  static INDEX idStalkerAnim_FirePistolDual = -1;
  static INDEX idStalkerAnim_DualPistolReady = -1;

  static INDEX idStalkerBox_Stand = -1;
  static INDEX idStalkerBox_DeathFront = -1;
  static INDEX idStalkerBox_DeathBack = -1;

// info structure
static EntityInfo eiStalker = {
  EIBT_FLESH, 250.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CStalker: CEnemyBase {
name      "Stalker";
thumbnail "Thumbnails\\Stalker.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 BOOL m_bMoveFast "Move Fast" = FALSE,
  3 BOOL m_bKnifeHit = FALSE,
  4 enum StalkerType m_stChar "Character" 'C' = STC_BALDRED,   // character
  5 BOOL m_bJitterHead "Jitter Head" = FALSE,
  6 FLOAT m_fHeadJitterAmount "Head Jitter Amount" = 32.0f,
  7 BOOL m_bStartHidden "Start Hidden" = FALSE,

components:
  1 class   CLASS_BASE       "Classes\\EnemyBase.ecl",
  2 skamodel MODEL_STALKER   "Models\\NPCs\\Stalker\\Stalker.smc",
  3 skamodel MODEL_STALKER_BLUE   "Models\\NPCs\\Stalker\\StalkerBlue.smc",
  4 skamodel MODEL_STALKER_WHITE  "Models\\NPCs\\Stalker\\StalkerPale.smc",
  5 skamodel MODEL_STALKER_PISTOL "Models\\NPCs\\Stalker\\StalkerHandgunner.smc",
  6 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",
  7 skamodel MODEL_STALKER_DUALPISTOL "Models\\NPCs\\Stalker\\StalkerDualHandgunner.smc",

 10 sound   SOUND_SWING                "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
 11 sound   SOUND_KNIFE_HIT1            "Sounds\\Weapons\\MetalBladeSlice1.wav",
 12 sound   SOUND_KNIFE_HIT2            "Sounds\\Weapons\\MetalBladeSlice2.wav",
 13 sound   SOUND_KNIFE_HIT3            "Sounds\\Weapons\\MetalBladeSlice3.wav",
 14 sound   SOUND_KNIFE_HIT4            "Sounds\\Weapons\\MetalBladeSlice4.wav",
 15 sound   SOUND_KNIFE_HIT5            "Sounds\\Weapons\\MetalBladeSlice5.wav",
 16 sound   SOUND_CLASH1               "Sounds\\Weapons\\MetalBladeLightClash1.wav",
 17 sound   SOUND_CLASH2               "Sounds\\Weapons\\MetalBladeLightClash2.wav",
 18 sound   SOUND_CLASH3               "Sounds\\Weapons\\MetalBladeLightClash3.wav",
 19 sound   SOUND_PUNCH1               "Sounds\\Weapons\\Punch1.wav",
 20 sound   SOUND_PUNCH2               "Sounds\\Weapons\\Punch2.wav",
 21 sound   SOUND_PUNCH3               "Sounds\\Weapons\\Punch3.wav",
 22 sound   SOUND_PUNCH4               "Sounds\\Weapons\\Punch4.wav",
 23 sound   SOUND_BASH1                "Sounds\\Weapons\\PunchBash1.wav",
 24 sound   SOUND_BASH2                "Sounds\\Weapons\\PunchBash2.wav",
 25 sound   SOUND_BASH3                "Sounds\\Weapons\\PunchBash3.wav",
 25 sound   SOUND_BASH4                "Sounds\\Weapons\\PunchBash4.wav",
 26 sound   SOUND_FIRE                 "Models\\NPCs\\Gunman\\Sounds\\PistolAttack.wav",

 50 sound   SOUND_SIGHT1           "Models\\NPCs\\Stalker\\Sounds\\Sight1.wav",
 51 sound   SOUND_SIGHT2           "Models\\NPCs\\Stalker\\Sounds\\Sight2.wav",
 52 sound   SOUND_WOUND1           "Models\\NPCs\\Stalker\\Sounds\\Wound1.wav",
 53 sound   SOUND_WOUND2           "Models\\NPCs\\Stalker\\Sounds\\Wound2.wav",
 54 sound   SOUND_DEATH1           "Models\\NPCs\\Stalker\\Sounds\\Death1.wav",
 55 sound   SOUND_DEATH2           "Models\\NPCs\\Stalker\\Sounds\\Death2.wav",
 56 sound   SOUND_IDLE1            "Models\\NPCs\\Stalker\\Sounds\\Idle1.wav",
 57 sound   SOUND_IDLE2            "Models\\NPCs\\Stalker\\Sounds\\Idle2.wav",

functions:

  void CStalker(void) {
  // Get stalker animation IDs
  idStalkerAnim_TPose       = ska_GetIDFromStringTable("TPOSE");
  idStalkerAnim_Stand       = ska_GetIDFromStringTable("STAND");
  idStalkerAnim_Walk        = ska_GetIDFromStringTable("WALK");
  idStalkerAnim_Run         = ska_GetIDFromStringTable("RUN");
  idStalkerAnim_RunKnife    = ska_GetIDFromStringTable("RUNKNIFE");
  idStalkerAnim_Wound       = ska_GetIDFromStringTable("WOUND");
  idStalkerAnim_Melee1      = ska_GetIDFromStringTable("MELEE1");
  idStalkerAnim_Melee2      = ska_GetIDFromStringTable("MELEE2");
  idStalkerAnim_Melee3      = ska_GetIDFromStringTable("MELEE3");
  idStalkerAnim_Melee4      = ska_GetIDFromStringTable("MELEE4");
  idStalkerAnim_RunMelee1   = ska_GetIDFromStringTable("RUNMELEE1");
  idStalkerAnim_RunMelee2   = ska_GetIDFromStringTable("RUNMELEE2");
  idStalkerAnim_RunMelee3   = ska_GetIDFromStringTable("RUNMELEE3");
  idStalkerAnim_RunMelee4   = ska_GetIDFromStringTable("RUNMELEE4");
  idStalkerAnim_DeathFront  = ska_GetIDFromStringTable("DEATHFRONT");
  idStalkerAnim_DeathBack   = ska_GetIDFromStringTable("DEATHBACK");
  idStalkerAnim_FirePistol  = ska_GetIDFromStringTable("FIREPISTOL");
  idStalkerAnim_PistolReady  = ska_GetIDFromStringTable("PISTOLREADY");
  idStalkerAnim_FirePistolDual  = ska_GetIDFromStringTable("FIREPISTOLDUAL");
  idStalkerAnim_DualPistolReady  = ska_GetIDFromStringTable("DUALPISTOLREADY");

  // Get stalker collision box IDs
  idStalkerBox_Stand       = ska_GetIDFromStringTable("Stand");
  idStalkerBox_DeathFront  = ska_GetIDFromStringTable("DeathFront");
  idStalkerBox_DeathBack   = ska_GetIDFromStringTable("DeathBack");
};

void AdjustBones(void) {
    if(en_RenderType == RT_SKAMODEL) {
      if(m_bJitterHead && GetHealth() > 0) {
        // get head bone
        INDEX iBoneIDHead = ska_GetIDFromStringTable("Head");
        RenBone *rbHead = RM_FindRenBone(iBoneIDHead);

        if(rbHead != NULL) {
          // Set jittering rotation via quaternion
          FLOATquat3D quatRandomHead;
          FLOAT fHeadingRandom = FRnd() + 30.0f - 15.0f;
          FLOAT fPitchRandom = FRnd() + 15.0f - 15.0f;
          fHeadingRandom = Clamp(fHeadingRandom, -45.0f, 45.0f);
          fPitchRandom = Clamp(fPitchRandom, 15.0f, 30.0f);
          quatRandomHead.FromEuler(ANGLE3D(0.0f, -fPitchRandom + FRnd()*m_fHeadJitterAmount, -fHeadingRandom + FRnd()*m_fHeadJitterAmount));
          rbHead->rb_arRot.ar_qRot = quatRandomHead*rbHead->rb_arRot.ar_qRot;
        }
      }
    }
  }

// describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Stalker sliced %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiStalker;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmStalker, "Data\\Messages\\NPCs\\Stalker.txt");
    return fnmStalker;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheClass(CLASS_PROJECTILE, PRT_GUNMAN_BULLET);
    PrecacheSound(SOUND_FIRE);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_KNIFE_HIT1);
    PrecacheSound(SOUND_KNIFE_HIT2);
    PrecacheSound(SOUND_KNIFE_HIT3);
    PrecacheSound(SOUND_KNIFE_HIT4);
    PrecacheSound(SOUND_KNIFE_HIT5);
    PrecacheSound(SOUND_CLASH1);
    PrecacheSound(SOUND_CLASH2);
    PrecacheSound(SOUND_CLASH3);
    PrecacheSound(SOUND_PUNCH1);
    PrecacheSound(SOUND_PUNCH2);
    PrecacheSound(SOUND_PUNCH3);
    PrecacheSound(SOUND_PUNCH4);
    PrecacheSound(SOUND_BASH1);
    PrecacheSound(SOUND_BASH2);
    PrecacheSound(SOUND_BASH3);
    PrecacheSound(SOUND_BASH4);

    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_SIGHT2);
    PrecacheSound(SOUND_WOUND1);
    PrecacheSound(SOUND_WOUND2);
    PrecacheSound(SOUND_DEATH1);
    PrecacheSound(SOUND_DEATH2);
    PrecacheSound(SOUND_IDLE1);
    PrecacheSound(SOUND_IDLE2);
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
      if (IsOfClass(penInflictor, "Twitcher") || IsOfClass(penInflictor, "Stalker")
       || IsOfClass(penInflictor, "Shambler")) {
        SetTargetHardForce(penInflictor);
      }
    } else {
      // stalker can't harm stalker
      if (!IsOfClass(penInflictor, "Stalker")) {
        CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      }
    }
  };

  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = idStalkerAnim_Wound;
    StartSkaModelAnim(iAnim,AN_CLEAR,1,0);

    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
      INDEX iAnim;
      FLOAT3D vFront;
      GetHeadingDirection(0, vFront);
      FLOAT fDamageDir = m_vDamage%vFront;

      if (fDamageDir<0) {
        iAnim = idStalkerAnim_DeathFront;
      } else {
        iAnim = idStalkerAnim_DeathBack;
      }

      StartSkaModelAnim(iAnim,AN_CLEAR,1,0);

      return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    // yell
    ESound eSound;
    eSound.EsndtSound = SNDT_SHOUT;
    eSound.penTarget = m_penEnemy;
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, 30.0f));

    if(GetModelInstance()->IsAnimationPlaying(idStalkerAnim_DeathFront))
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idStalkerBox_DeathFront);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }
    else
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idStalkerBox_DeathBack);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }

    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartSkaModelAnim(idStalkerAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void WalkingAnim(void) {
    StartSkaModelAnim(idStalkerAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void RunningAnim(void) {
    if(m_bMoveFast) {
      StartSkaModelAnim(idStalkerAnim_RunKnife,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    } else {
      StartSkaModelAnim(idStalkerAnim_Run,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  // virtual sound functions
  void SightSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soVoice, SOUND_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("Stalker unknown sight sound");
    }
  };

  void IdleSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soVoice, SOUND_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("Stalker unknown idle sound");
    }
  };

  void WoundSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soVoice, SOUND_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_WOUND2, SOF_3D); break;
        default: ASSERTALWAYS("Stalker unknown wound sound");
    }
  };

  void DeathSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soVoice, SOUND_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_DEATH2, SOF_3D); break;
        default: ASSERTALWAYS("Stalker unknown death sound");
    }
  };

  FLOAT GetLockRotationSpeed(void) { return 500.0f;};

  procedures:

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    jump StalkerSlash();
    return EReturn();
  };

  Fire(EVoid) : CEnemyBase::Fire
  {
    if(m_stChar == STC_BALDREDDUALGUNNER) {
      autocall StalkerDualPistolAttack() EEnd;
      return EReturn();
    } else if(m_stChar == STC_BALDREDGUNNER) {
      autocall StalkerPistolAttack() EEnd;
      return EReturn();
    } else {
      return EReturn();
    }
  }

  // Stalker pistol attack
  StalkerPistolAttack(EVoid) {
    m_fLockOnEnemyTime = 0.525f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StartSkaModelAnim(idStalkerAnim_PistolReady,AN_CLEAR,1,0);
    autowait(0.375f);

    m_fLockOnEnemyTime = 0.125f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StartSkaModelAnim(idStalkerAnim_FirePistol,AN_CLEAR,1,0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.25f, 1.75f, -0.1f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // Stalker dual pistol attack
  StalkerDualPistolAttack(EVoid) {
    m_fLockOnEnemyTime = 0.525f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StartSkaModelAnim(idStalkerAnim_DualPistolReady,AN_CLEAR,1,0);
    autowait(0.375f);

    m_fLockOnEnemyTime = 0.125f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StartSkaModelAnim(idStalkerAnim_FirePistolDual,AN_CLEAR,1,0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.25f, 1.75f, -0.1f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.275f);

    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(-0.25f, 1.75f, -0.1f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.5f + FRnd()/3);

    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  StalkerSlash(EVoid) {
    if(m_stChar != STC_BALDWHITE) {
      switch(IRnd()%4)
      {
        case 0: StartSkaModelAnim(idStalkerAnim_Melee1,AN_CLEAR,1,0); break;
        case 1: StartSkaModelAnim(idStalkerAnim_Melee2,AN_CLEAR,1,0); break;
        case 2: StartSkaModelAnim(idStalkerAnim_Melee3,AN_CLEAR,1,0); break;
        case 3: StartSkaModelAnim(idStalkerAnim_Melee4,AN_CLEAR,1,0); break;
        default: ASSERTALWAYS("Stalker unknown melee attack animation");
      }
    } else {
      switch(IRnd()%3)
      {
        case 0: StartSkaModelAnim(idStalkerAnim_Melee1,AN_CLEAR,1,0); break;
        case 1: StartSkaModelAnim(idStalkerAnim_Melee2,AN_CLEAR,1,0); break;
        case 2: StartSkaModelAnim(idStalkerAnim_Melee4,AN_CLEAR,1,0); break;
        default: ASSERTALWAYS("Stalker unknown melee attack animation");
      }
    }

    m_bFistHit = FALSE;
    m_bKnifeHit = FALSE;
    autowait(0.375f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.35f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(!GetModelInstance()->IsAnimationPlaying(idStalkerAnim_Melee2)) {
          m_bKnifeHit = TRUE;
        }

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if(m_bKnifeHit) {
              if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
                switch(IRnd()%3)
                {
                  case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                  case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                  case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                  default: ASSERTALWAYS("Stalker unknown melee hit sound");
                }
              } else {
                if(m_stChar != STC_BALDWHITE && m_stChar != STC_BALDREDGUNNER && m_stChar != STC_BALDREDDUALGUNNER) {
                  switch(IRnd()%5)
                  {
                    case 0: PlaySound(m_soSound, SOUND_KNIFE_HIT1, SOF_3D); break;
                    case 1: PlaySound(m_soSound, SOUND_KNIFE_HIT2, SOF_3D); break;
                    case 2: PlaySound(m_soSound, SOUND_KNIFE_HIT3, SOF_3D); break;
                    case 3: PlaySound(m_soSound, SOUND_KNIFE_HIT4, SOF_3D); break;
                    case 4: PlaySound(m_soSound, SOUND_KNIFE_HIT5, SOF_3D); break;
                    default: ASSERTALWAYS("Stalker unknown melee hit sound");
                  }
                } else if(m_stChar == STC_BALDWHITE || m_stChar == STC_BALDREDGUNNER || m_stChar == STC_BALDREDDUALGUNNER) {
                  switch(IRnd()%4)
                  {
                    case 0: PlaySound(m_soSound, SOUND_BASH1, SOF_3D); break;
                    case 1: PlaySound(m_soSound, SOUND_BASH2, SOF_3D); break;
                    case 2: PlaySound(m_soSound, SOUND_BASH3, SOF_3D); break;
                    case 3: PlaySound(m_soSound, SOUND_BASH4, SOF_3D); break;
                    default: ASSERTALWAYS("Stalker unknown melee hit sound");
                  }
                }
              }
            } else {
              switch(IRnd()%4)
              {
                case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
                case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
                default: ASSERTALWAYS("Stalker unknown melee hit sound");
              }
            }
          } else {
            if(m_bKnifeHit && (m_stChar != STC_BALDWHITE && m_stChar != STC_BALDREDGUNNER && m_stChar != STC_BALDREDDUALGUNNER)) {
              switch(IRnd()%5)
                  {
                    case 0: PlaySound(m_soSound, SOUND_KNIFE_HIT1, SOF_3D); break;
                    case 1: PlaySound(m_soSound, SOUND_KNIFE_HIT2, SOF_3D); break;
                    case 2: PlaySound(m_soSound, SOUND_KNIFE_HIT3, SOF_3D); break;
                    case 3: PlaySound(m_soSound, SOUND_KNIFE_HIT4, SOF_3D); break;
                    case 4: PlaySound(m_soSound, SOUND_KNIFE_HIT5, SOF_3D); break;
                    default: ASSERTALWAYS("Stalker unknown melee hit sound");
                  }
            } else if(m_bKnifeHit && (m_stChar == STC_BALDWHITE || m_stChar == STC_BALDREDGUNNER || m_stChar == STC_BALDREDDUALGUNNER)) {
              switch(IRnd()%4)
              {
                case 0: PlaySound(m_soSound, SOUND_BASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_BASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_BASH3, SOF_3D); break;
                case 3: PlaySound(m_soSound, SOUND_BASH4, SOF_3D); break;
                default: ASSERTALWAYS("Stalker unknown melee hit sound");
              }
            } else {
              switch(IRnd()%4)
              {
                case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
                case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
                default: ASSERTALWAYS("Stalker unknown melee hit sound");
              }
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if(m_bKnifeHit) {
              if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
                switch(IRnd()%3)
                {
                  case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                  case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                  case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                  default: ASSERTALWAYS("Stalker unknown melee hit sound");
                }
              } else {
                if(m_stChar != STC_BALDWHITE && m_stChar != STC_BALDREDGUNNER && m_stChar != STC_BALDREDDUALGUNNER) {
                  switch(IRnd()%5)
                  {
                    case 0: PlaySound(m_soSound, SOUND_KNIFE_HIT1, SOF_3D); break;
                    case 1: PlaySound(m_soSound, SOUND_KNIFE_HIT2, SOF_3D); break;
                    case 2: PlaySound(m_soSound, SOUND_KNIFE_HIT3, SOF_3D); break;
                    case 3: PlaySound(m_soSound, SOUND_KNIFE_HIT4, SOF_3D); break;
                    case 4: PlaySound(m_soSound, SOUND_KNIFE_HIT5, SOF_3D); break;
                    default: ASSERTALWAYS("Stalker unknown melee hit sound");
                  }
                } else if(m_stChar == STC_BALDWHITE || m_stChar == STC_BALDREDGUNNER || m_stChar == STC_BALDREDDUALGUNNER) {
                  switch(IRnd()%4)
                  {
                    case 0: PlaySound(m_soSound, SOUND_BASH1, SOF_3D); break;
                    case 1: PlaySound(m_soSound, SOUND_BASH2, SOF_3D); break;
                    case 2: PlaySound(m_soSound, SOUND_BASH3, SOF_3D); break;
                    case 3: PlaySound(m_soSound, SOUND_BASH4, SOF_3D); break;
                    default: ASSERTALWAYS("Stalker unknown melee hit sound");
                  }
                }
              }
            } else {
              switch(IRnd()%4)
              {
                case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
                case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
                default: ASSERTALWAYS("Stalker unknown melee hit sound");
              }
            }
          } else {
            if(m_bKnifeHit && (m_stChar != STC_BALDWHITE && m_stChar != STC_BALDREDGUNNER && m_stChar != STC_BALDREDDUALGUNNER)) {
              switch(IRnd()%5)
                  {
                    case 0: PlaySound(m_soSound, SOUND_KNIFE_HIT1, SOF_3D); break;
                    case 1: PlaySound(m_soSound, SOUND_KNIFE_HIT2, SOF_3D); break;
                    case 2: PlaySound(m_soSound, SOUND_KNIFE_HIT3, SOF_3D); break;
                    case 3: PlaySound(m_soSound, SOUND_KNIFE_HIT4, SOF_3D); break;
                    case 4: PlaySound(m_soSound, SOUND_KNIFE_HIT5, SOF_3D); break;
                    default: ASSERTALWAYS("Stalker unknown melee hit sound");
                  }
            } else if(m_bKnifeHit && (m_stChar == STC_BALDWHITE || m_stChar == STC_BALDREDGUNNER || m_stChar == STC_BALDREDDUALGUNNER)) {
              switch(IRnd()%4)
              {
                case 0: PlaySound(m_soSound, SOUND_BASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_BASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_BASH3, SOF_3D); break;
                case 3: PlaySound(m_soSound, SOUND_BASH4, SOF_3D); break;
                default: ASSERTALWAYS("Stalker unknown melee hit sound");
              }
            } else {
              switch(IRnd()%4)
              {
                case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
                case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
                default: ASSERTALWAYS("Stalker unknown melee hit sound");
              }
            }
          }
        }

        if(m_bKnifeHit && (m_stChar == STC_BALDWHITE || m_stChar == STC_BALDREDGUNNER || m_stChar == STC_BALDREDDUALGUNNER)) {
          InflictDirectDamage(m_penEnemy, this, DMT_BLUNT, 10.0f, vPosition, vDirection, DBPT_GENERIC);
        } else if (m_bKnifeHit && m_stChar != STC_BALDWHITE && m_stChar != STC_BALDREDGUNNER && m_stChar != STC_BALDREDDUALGUNNER) {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 7.0f, vPosition, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_BLUNT, 4.0f, vPosition, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  };

  Sleep(EVoid)
  {
    StartSkaModelAnim(idStalkerAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    // start watching
    GetWatcher()->SendEvent(EStart());
    
    // repeat
    wait() {
      // if triggered
      on(ETrigger eTrigger) : {
        // remember enemy
        SetTargetSoft(eTrigger.penCaused);
        // wake up
        jump CEnemyBase::Active();
      }
      on(ETouch eTouch) : {
        if(IsDerivedFromClass(eTouch.penOther, "Enemy Base") || IsOfClass(eTouch.penOther, "Player")) {
          jump CEnemyBase::Active();
        }
      }
      on(ESound eSound) : {
        // if deaf then ignore the sound
        if (m_bDeaf) {
          resume;
        }

        // if the target is visible and can be set as new enemy
        if (SetTargetSoft(eSound.penTarget)) {
          // react to it
          jump CEnemyBase::Active();
        }
      }
      // if damaged
      on(EDamage eDamage) : {
        // wake up
        jump CEnemyBase::Active();
      }
      otherwise() : {
        resume;
      }
    }
  }

  // overridable called before main enemy loop actually begins
  PreMainLoop(EVoid) : CEnemyBase::PreMainLoop
  {
    // if sleeping
    if (m_bStartHidden) {
      m_bStartHidden = FALSE;
      // go to sleep until waken up
      wait() {
        on (EBegin) : {
          call Sleep();
        }
        on (EReturn) : {
          stop;
        };
        // if damaged
        on(EDamage eDamage) : {
          // wake up
          jump CEnemyBase::Active();
        }
        // if dead
        on(EDeath eDeath) : {
          // die
          jump CEnemyBase::Die(eDeath);
        }
      }
    }

    return EReturn();
  }

/************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    InitAsSkaModel();

    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_LESSER;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 1000.0f;
    m_fBlowUpSize = 2.0f;

    SetHealth(125.0f);
    m_fMaxHealth = 125.0f;
    m_fDamageWounded = 70.0f;
    m_iScore = 1000;

      switch(m_stChar)
      {
        case STC_BALDRED:
        {
          SetSkaModel(MODEL_STALKER);
          GetModelInstance()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
          ModelChangeNotify();
        } break;

        case STC_BALDBROWN:
        {
          SetSkaModel(MODEL_STALKER_BLUE);
          GetModelInstance()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
          ModelChangeNotify();
        } break;

        case STC_BALDWHITE:
        {
          SetHealth(150.0f);
          m_fMaxHealth = 150.0f;
          m_fDamageWounded = 80.0f;
          m_iScore = 2500;
          SetSkaModel(MODEL_STALKER_WHITE);
          GetModelInstance()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
          ModelChangeNotify();
        } break;

        case STC_BALDREDGUNNER:
        {
          m_iScore = 1500;
          SetSkaModel(MODEL_STALKER_PISTOL);
          GetModelInstance()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
          ModelChangeNotify();
        } break;

        case STC_BALDREDDUALGUNNER:
        {
          SetHealth(150.0f);
          m_fMaxHealth = 150.0f;
          m_fDamageWounded = 65.0f;
          m_iScore = 5000;
          SetSkaModel(MODEL_STALKER_DUALPISTOL);
          GetModelInstance()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
          ModelChangeNotify();
        } break;
      }
        

        // setup moving speed
        m_fWalkSpeed = FRnd() + 2.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*20.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 5.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 5.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 250.0f);
        if(m_bMoveFast && m_stChar == STC_BALDWHITE) {
          m_fAttackRunSpeed = FRnd() + 8.5f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*120 + 900.0f);
          m_fCloseRunSpeed = FRnd() + 8.5f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*120 + 900.0f);
        } else if(m_bMoveFast && m_stChar != STC_BALDWHITE) {
          m_fAttackRunSpeed = FRnd() + 7.5f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*90 + 750.0f);
          m_fCloseRunSpeed = FRnd() + 7.5f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*90 + 750.0f);
        }
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 2.5f;
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 0.85f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 100.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};