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

1047
%{
#include "StdH.h"
%}

uses "EntitiesMP/EnemyBase";

enum InfernalSpecterType {
  0 ISC_STANDARD   "Standard",    // standard variant
  1 ISC_STRONG     "Strong",      // wrath variant
};

%{

  static INDEX idInfernalSpecterAnim_TPose = -1;
  static INDEX idInfernalSpecterAnim_Stand = -1;
  static INDEX idInfernalSpecterAnim_Walk  = -1;
  static INDEX idInfernalSpecterAnim_Run   = -1;
  static INDEX idInfernalSpecterAnim_Wound   = -1;
  static INDEX idInfernalSpecterAnim_Jump    = -1;
  static INDEX idInfernalSpecterAnim_Melee1  = -1;
  static INDEX idInfernalSpecterAnim_Melee2  = -1;
  static INDEX idInfernalSpecterAnim_Fire    = -1;
  static INDEX idInfernalSpecterAnim_DeathFront = -1;
  static INDEX idInfernalSpecterAnim_DeathBack  = -1;
  static INDEX idInfernalSpecterAnim_FireStrong = -1;
  static INDEX idInfernalSpecterAnim_RunFire = -1;
  static INDEX idInfernalSpecterBox_Stand  = -1;
  static INDEX idInfernalSpecterBox_DeathFront   = -1;
  static INDEX idInfernalSpecterBox_DeathBack    = -1;

  static INDEX idInfernalSpecterBone_Head = -1;
  static INDEX idInfernalSpecterBone_Neck = -1;
  static INDEX idInfernalSpecterBone_Chest = -1;
  static INDEX idInfernalSpecterBone_MidTorso = -1;
  static INDEX idInfernalSpecterBone_LowerTorso = -1;
  static INDEX idInfernalSpecterBone_Pelvis = -1;

  static INDEX idInfernalSpecterBone_L_Shoulder = -1;
  static INDEX idInfernalSpecterBone_L_UpperArm = -1;
  static INDEX idInfernalSpecterBone_L_LowerArm = -1;
  static INDEX idInfernalSpecterBone_L_Hip = -1;
  static INDEX idInfernalSpecterBone_L_UpperLeg = -1;
  static INDEX idInfernalSpecterBone_L_LowerLeg = -1;
  static INDEX idInfernalSpecterBone_L_Foot = -1;
  static INDEX idInfernalSpecterBone_L_Toes = -1;

  static INDEX idInfernalSpecterBone_R_Shoulder = -1;
  static INDEX idInfernalSpecterBone_R_UpperArm = -1;
  static INDEX idInfernalSpecterBone_R_LowerArm = -1;
  static INDEX idInfernalSpecterBone_R_Hip = -1;
  static INDEX idInfernalSpecterBone_R_UpperLeg = -1;
  static INDEX idInfernalSpecterBone_R_LowerLeg = -1;
  static INDEX idInfernalSpecterBone_R_Foot = -1;
  static INDEX idInfernalSpecterBone_R_Toes = -1;

// info structure
static EntityInfo eiInfernalSpecter = {
  EIBT_FLESH, 400.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

// info structure
static EntityInfo eiInfernalSpecterStrong = {
  EIBT_FLESH, 800.0f,
  0.0f, 2.00f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CInfernalSpecter: CEnemyBase {
name      "InfernalSpecter";
thumbnail "Thumbnails\\InfernalSpecter.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum InfernalSpecterType m_isChar "Character" 'C' = ISC_STANDARD,      // character
  3 CEntityPointer m_penFlame,
  4 FLOAT m_fFireTime = 0.0f,           // time to fire flames
  5 CSoundObject m_soFlameStart,
  6 CSoundObject m_soFlameLoopStop,
  7 BOOL m_bFireRun = FALSE,
  8 BOOL m_bLongFistHit = FALSE,
  
components:
  1 class   CLASS_BASE				 "Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE         "Classes\\Projectile.ecl",

  3 skamodel MODEL_INFERNALSPECTER        "Models\\NPCs\\InfernalSpecterSKA\\InfernalSpecter.smc",
  4 skamodel MODEL_INFERNALSPECTERSTRONG  "Models\\NPCs\\InfernalSpecterSKA\\InfernalSpecterStrong.smc",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  12 sound   SOUND_FIRE             "Models\\NPCs\\InfernalSpecter\\Sounds\\Fire.wav",
  13 sound   SOUND_FLAME_START      "Models\\NPCs\\InfernalSpecter\\Sounds\\FlameStart.wav",
  14 sound   SOUND_FLAME_LOOP       "Models\\NPCs\\InfernalSpecter\\Sounds\\FlameLoop.wav",
  15 sound   SOUND_FLAME_STOP       "Models\\NPCs\\InfernalSpecter\\Sounds\\FlameStop.wav",

functions:

  void CInfernalSpecter(void) {
  // Get animation IDs
  idInfernalSpecterAnim_TPose       = ska_GetIDFromStringTable("TPOSE");
  idInfernalSpecterAnim_Stand       = ska_GetIDFromStringTable("STAND");
  idInfernalSpecterAnim_Walk        = ska_GetIDFromStringTable("WALK");
  idInfernalSpecterAnim_Run         = ska_GetIDFromStringTable("RUN");
  idInfernalSpecterAnim_Wound       = ska_GetIDFromStringTable("WOUND");
  idInfernalSpecterAnim_Jump        = ska_GetIDFromStringTable("JUMP");
  idInfernalSpecterAnim_Fire        = ska_GetIDFromStringTable("FIRE");
  idInfernalSpecterAnim_Melee1      = ska_GetIDFromStringTable("MELEE1");
  idInfernalSpecterAnim_Melee2      = ska_GetIDFromStringTable("MELEE2");
  idInfernalSpecterAnim_DeathFront  = ska_GetIDFromStringTable("DEATHFRONT");
  idInfernalSpecterAnim_DeathBack   = ska_GetIDFromStringTable("DEATHBACK");
  idInfernalSpecterAnim_FireStrong  = ska_GetIDFromStringTable("FIRESTRONG");
  idInfernalSpecterAnim_RunFire     = ska_GetIDFromStringTable("RUNFIRE");

  // Get collision box IDs
  idInfernalSpecterBox_Stand       = ska_GetIDFromStringTable("Stand");
  idInfernalSpecterBox_DeathFront  = ska_GetIDFromStringTable("DeathFront");
  idInfernalSpecterBox_DeathBack   = ska_GetIDFromStringTable("DeathBack");

  // Get bone IDs
  idInfernalSpecterBone_Head = ska_GetIDFromStringTable("Head");
  idInfernalSpecterBone_Neck = ska_GetIDFromStringTable("Neck");
  idInfernalSpecterBone_Chest = ska_GetIDFromStringTable("Chest");
  idInfernalSpecterBone_MidTorso = ska_GetIDFromStringTable("MidTorso");
  idInfernalSpecterBone_LowerTorso = ska_GetIDFromStringTable("LowerTorso");
  idInfernalSpecterBone_Pelvis = ska_GetIDFromStringTable("Pelvis");

  idInfernalSpecterBone_L_Shoulder = ska_GetIDFromStringTable("L_Shoulder");
  idInfernalSpecterBone_L_UpperArm = ska_GetIDFromStringTable("L_UpperArm");
  idInfernalSpecterBone_L_LowerArm = ska_GetIDFromStringTable("L_LowerArm");
  idInfernalSpecterBone_L_Hip      = ska_GetIDFromStringTable("L_Hip");
  idInfernalSpecterBone_L_UpperLeg = ska_GetIDFromStringTable("L_UpperLeg");
  idInfernalSpecterBone_L_LowerLeg = ska_GetIDFromStringTable("L_LowerLeg");
  idInfernalSpecterBone_L_Foot     = ska_GetIDFromStringTable("L_Foot");
  idInfernalSpecterBone_L_Toes     = ska_GetIDFromStringTable("L_Toes");

  idInfernalSpecterBone_R_Shoulder = ska_GetIDFromStringTable("R_Shoulder");
  idInfernalSpecterBone_R_UpperArm = ska_GetIDFromStringTable("R_UpperArm");
  idInfernalSpecterBone_R_LowerArm = ska_GetIDFromStringTable("R_LowerArm");
  idInfernalSpecterBone_R_Hip      = ska_GetIDFromStringTable("R_Hip");
  idInfernalSpecterBone_R_UpperLeg = ska_GetIDFromStringTable("R_UpperLeg");
  idInfernalSpecterBone_R_LowerLeg = ska_GetIDFromStringTable("R_LowerLeg");
  idInfernalSpecterBone_R_Foot     = ska_GetIDFromStringTable("R_Foot");
  idInfernalSpecterBone_R_Toes     = ska_GetIDFromStringTable("R_Toes");
};

  void AddDependentsToPrediction(void)
  {
    m_penFlame->AddToPrediction();
  }

  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("An Infernal Specter immolated %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    if(m_isChar == ISC_STRONG) {
      return &eiInfernalSpecterStrong;
    } else {
      return &eiInfernalSpecter;
    }
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmInfernalSpecter, "Data\\Messages\\NPCs\\InfernalSpecter.txt");
    return fnmInfernalSpecter;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_FIRE);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_FLAME_START);
    PrecacheSound(SOUND_FLAME_LOOP);
    PrecacheSound(SOUND_FLAME_STOP);
    PrecacheClass(CLASS_PROJECTILE, PRT_DOOMIMP_FIREBALL);
    PrecacheClass(CLASS_PROJECTILE, PRT_SHOOTER_FLAME);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_isChar) {
    case ISC_STANDARD: { pes->es_strName+=" Normal"; } break;
    case ISC_STRONG : { pes->es_strName+=" Enraged"; } break;
    }
    return TRUE;
  }

/* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // infernal specter cannot be burnt
    if(dmtType==DMT_BURNING || dmtType==DMT_HEAT) {
      return;
    }

    if(dmtType==DMT_DROWNING || dmtType==DMT_FREEZING) {
      fDamageAmmount *= 1.5;
    }

    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "InfernalSpecter")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    m_soFlameLoopStop.Stop();
    INDEX iAnim;
    iAnim = idInfernalSpecterAnim_Wound;
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
        iAnim = idInfernalSpecterAnim_DeathFront;
      } else {
        iAnim = idInfernalSpecterAnim_DeathBack;
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
    m_soFlameLoopStop.Stop();
    if(GetModelInstance()->IsAnimationPlaying(idInfernalSpecterAnim_DeathFront))
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idInfernalSpecterBox_DeathFront);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }
    else
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idInfernalSpecterBox_DeathBack);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }
    
    en_fDensity = 500.0f;
  };
  
  // virtual anim functions
  void StandingAnim(void) {
    StartSkaModelAnim(idInfernalSpecterAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void WalkingAnim(void) {
    StartSkaModelAnim(idInfernalSpecterAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void RunningAnim(void) {
    if(m_bFireRun) {
      StartSkaModelAnim(idInfernalSpecterAnim_RunFire,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    } else {
      StartSkaModelAnim(idInfernalSpecterAnim_Run,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartSkaModelAnim(idInfernalSpecterAnim_Jump,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  FLOAT GetLockRotationSpeed(void) { return 500.0f;};

  void RenderParticles(void) {
    FLOAT fTimeFactor=1.0f;
    FLOAT fPower=0.25f;
    FLOAT fDeathFactor=1.0f;
    if( m_fSpiritStartTime!=0.0f)
    {
      fDeathFactor=1.0f-Clamp((_pTimer->CurrentTick()-m_fSpiritStartTime)/1.0f, 0.0f, 1.0f);
    }

    Particles_Burning(this, fPower, fTimeFactor*fDeathFactor);
  }

  // fire flame
  void FireFlame(void) {
    // flame start position
    CPlacement3D plFlame;
    plFlame = GetPlacement();

    FLOAT3D vNormDir;
    AnglesToDirectionVector(plFlame.pl_OrientationAngle, vNormDir);
    plFlame.pl_PositionVector += vNormDir*0.1f;

    ASSERT(m_penEnemy != NULL);

    // target enemy body
    EntityInfo *peiTarget = (EntityInfo*) (m_penEnemy->GetEntityInfo());
    FLOAT3D vShootTarget;
    GetEntityInfoPosition(m_penEnemy, peiTarget->vTargetCenter, vShootTarget);

    // create flame
    PreparePropelledProjectile(plFlame, vShootTarget, FLOAT3D(0.0f, 2.1f, -0.15f), ANGLE3D(0, 0, 0));
    CEntityPointer penFlame = CreateEntity(plFlame, CLASS_PROJECTILE);
    // init and launch flame
    ELaunchProjectile eLaunch;
    eLaunch.penLauncher = this;
    eLaunch.prtType = PRT_SHOOTER_FLAME;
    penFlame->Initialize(eLaunch);
    // link last flame with this one (if not NULL or deleted)
    if (m_penFlame!=NULL && !(m_penFlame->GetFlags()&ENF_DELETED)) {
      ((CProjectile&)*m_penFlame).m_penParticles = penFlame;
    }
    // link to player weapons
    ((CProjectile&)*penFlame).m_penParticles = this;
    // store last flame
    m_penFlame = penFlame;
  };

  procedures:

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    m_soFlameLoopStop.Stop();
    if (m_isChar==ISC_STRONG) {
      if (CalcDist(m_penEnemy) < 3.0f) {
        jump SlashEnemySingle();
      } else if(CalcDist(m_penEnemy) < 10.0f && IsInPlaneFrustum(m_penEnemy, CosFast(30.0f))) {
        autocall InfernalSpecterFlamethrowerAttack() EEnd;
      }
    } else {
      if (CalcDist(m_penEnemy) < 3.0f) {
        jump SlashEnemySingle();
      }
    }

    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    switch(IRnd()%2)
    {
      case 0: StartSkaModelAnim(idInfernalSpecterAnim_Melee1,AN_CLEAR,1,0); break;
      case 1: StartSkaModelAnim(idInfernalSpecterAnim_Melee2,AN_CLEAR,1,0); break;
      default: ASSERTALWAYS("Infernal Specter unknown melee animation");
    }
    m_bFistHit = FALSE;
    m_bLongFistHit = FALSE;
    autowait(0.4f);
    FLOAT fShortCloseDistance = 2.5f;
    if (CalcDist(m_penEnemy) < fShortCloseDistance) {
      m_bFistHit = TRUE;
      if(GetModelInstance()->IsAnimationPlaying(idInfernalSpecterAnim_Melee1)) {
        m_bLongFistHit = TRUE;
      }
    }
    
    if (m_bFistHit) {
      if(m_bLongFistHit) {
        fShortCloseDistance = 3.0f;
      }

      if (CalcDist(m_penEnemy) < fShortCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        if (m_isChar==ISC_STRONG) {
          InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 15.0f, vPosition, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 10.0f, vPosition, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

  Fire(EVoid) : CEnemyBase::Fire
  {
    autocall InfernalSpecterFireballAttack() EEnd;
    return EReturn();
  };

  // Infernal Specter Fireball attack
  InfernalSpecterFireballAttack(EVoid) {
    m_fLockOnEnemyTime = 0.25f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.45f + FRnd()/4);

    StartSkaModelAnim(idInfernalSpecterAnim_Fire,AN_CLEAR,1,0);
    autowait(0.45f);
    m_fLockOnEnemyTime = 0.1f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    ShootProjectile(PRT_DOOMIMP_FIREBALL, FLOAT3D(0.0f, 2.1f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    return EEnd();
  };

  // Strong Infernal Specter Flamethrower attack
  InfernalSpecterFlamethrowerAttack(EVoid) {
    StandingAnim();
    autowait(0.45f + FRnd()/4);
    m_bFireRun = TRUE;
    StartSkaModelAnim(idInfernalSpecterAnim_FireStrong,AN_CLEAR,1,0);
    autowait(0.45f);

    m_soFlameStart.Set3DParameters(50.0f, 5.0f, 2.0f, 1.0f);
    m_soFlameLoopStop.Set3DParameters(50.0f, 5.0f, 2.0f, 1.0f);
    PlaySound(m_soFlameStart, SOUND_FLAME_START, SOF_3D|SOF_VOLUMETRIC);
    PlaySound(m_soFlameLoopStop, SOUND_FLAME_LOOP, SOF_3D|SOF_LOOP|SOF_VOLUMETRIC);

    m_fFireTime = 2.0f;
    m_fFireTime += _pTimer->CurrentTick();

    while(m_fFireTime > _pTimer->CurrentTick()) {
      m_fLockOnEnemyTime = 0.1f;
      autocall CEnemyBase::LockOnEnemy() EReturn;

      m_fMoveFrequency = 0.1f;
      wait(m_fMoveFrequency) {
        on (EBegin) : {
          FireFlame();

          m_vDesiredPosition = PlayerDestinationPos();
          m_dtDestination = DT_PLAYERCURRENT;

          // set speeds for movement towards desired position
          FLOAT3D vPosDelta = m_vDesiredPosition-GetPlacement().pl_PositionVector;
          FLOAT fPosDistance = vPosDelta.Length();
          SetSpeedsToDesiredPosition(vPosDelta, fPosDistance, m_dtDestination==DT_PLAYERCURRENT);

          if(GetSP()->sp_gdGameDifficulty>=CSessionProperties::GD_HARD) {
            m_fMoveSpeed *= 1.5f;
          } else {
            m_fMoveSpeed *= 1.25f;
          }

          // adjust direction and speed
          m_ulMovementFlags = SetDesiredMovement(); 
          MovementAnimation(m_ulMovementFlags);
          resume;
        }
        on (ETimer) : { stop; }
      }
    }

    FireFlame();
    // link last flame with nothing (if not NULL or deleted)
    if (m_penFlame!=NULL && !(m_penFlame->GetFlags()&ENF_DELETED)) {
      ((CProjectile&)*m_penFlame).m_penParticles = NULL;
      m_penFlame = NULL;
    }
    PlaySound(m_soFlameLoopStop, SOUND_FLAME_STOP, SOF_3D|SOF_VOLUMETRIC|SOF_SMOOTHCHANGE);

    autowait(0.5f + FRnd()/3);
    m_bFireRun = FALSE;
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    return EEnd();
  };


 /************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    InitAsSkaModel();
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_GREATER;
    if(m_isChar == ISC_STRONG) {
      SetHealth(500.0f);
      m_fMaxHealth = 500.0f;
      m_fDamageWounded = 210.0f;
      m_iScore = 50000;
    } else {
      SetHealth(350.0f);
      m_fMaxHealth = 350.0f;
      m_fDamageWounded = 110.0f;
      m_iScore = 25000;
    }
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        if(m_isChar == ISC_STRONG) {
          SetSkaModel(MODEL_INFERNALSPECTERSTRONG);
          GetModelInstance()->StretchModel(FLOAT3D(1.45f, 1.45f, 1.45f));
        } else {
          SetSkaModel(MODEL_INFERNALSPECTER);
          GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        }
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 3.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 5.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 300.0f);
        m_fCloseRunSpeed = FRnd() + 5.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 300.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        if(m_isChar==ISC_STRONG) {
          m_fCloseDistance = 25.0f;
        } else {
          m_fCloseDistance = 3.0f;
        }
        m_fStopDistance = 1.75f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 250.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};