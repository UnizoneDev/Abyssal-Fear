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

1002
%{
#include "StdH.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Player";

enum BlackStickmanActionType {
  0 BSAT_WALK          "Walk",
  1 BSAT_RUN           "Run",
  2 BSAT_FLY           "Fly",
};

enum BlackStickmanCharacterType {
  0 BSCT_NORMAL          "Vantablack",
  1 BSCT_TRANSLUCENT     "Translucent",
  2 BSCT_REFLECTIVE      "Purple Reflections",
};

enum BlackStickmanBehaviorType {
  0 BSBT_WANDER          "Wander",
  1 BSBT_CHASE           "Chase",
  2 BSBT_STARE           "Stare",
};

%{

  static INDEX idBlackStickmanAnim_TPose = -1;
  static INDEX idBlackStickmanAnim_Stand = -1;
  static INDEX idBlackStickmanAnim_Walk  = -1;
  static INDEX idBlackStickmanAnim_Run   = -1;
  static INDEX idBlackStickmanAnim_Fly   = -1;
  static INDEX idBlackStickmanAnim_Jump  = -1;
  static INDEX idBlackStickmanBox_Stand  = -1;
  static INDEX idBlackStickmanBox_Fly    = -1;

// info structure
static EntityInfo eiBlackStickman = {
  EIBT_SHADOW, 1000.0f,
  0.0f, 1.9f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CBlackStickman: CEnemyBase {
name      "BlackStickman";
thumbnail "Thumbnails\\BlackStickman.tbn";

properties:
  1 enum BlackStickmanActionType m_bsatType "Action Type" = BSAT_WALK,
  2 enum BlackStickmanCharacterType m_bsctType "Character" = BSCT_NORMAL,
  3 FLOAT m_fCheckGeometryWait = 2.0f,
  4 enum BlackStickmanBehaviorType m_bsbtType "AI Behavior" = BSBT_WANDER,
  5 FLOAT m_fToPlayer = 0.0f,
  6 FLOAT m_fToPlayerPitch = 0.0f,
  7 BOOL m_bJitterBones "Jitter Bones" = FALSE,
  
components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
 10 skamodel MODEL_BLACKSTICKMAN  "Models\\NPCs\\BlackStickmanSKA\\BlackStickman.smc",

 20 texture TEXTURE_BLACKSTICKMAN           "Models\\NPCs\\BlackStickman\\blackstickman.tex",
 21 texture TEXTURE_VANTABLACKSTICKMAN      "Models\\NPCs\\BlackStickman\\vantablackstickman.tex",
 22 texture TEX_BUMP_DETAIL                 "Models\\NPCs\\BlackStickman\\BlackStickmanDetail.tex",

 // ************** REFLECTIONS **************
 50 texture TEX_REFL_BWRIPLES01         "Models\\ReflectionTextures\\BWRiples01.tex",
 51 texture TEX_REFL_BWRIPLES02         "Models\\ReflectionTextures\\BWRiples02.tex",
 52 texture TEX_REFL_LIGHTMETAL01       "Models\\ReflectionTextures\\LightMetal01.tex",
 53 texture TEX_REFL_LIGHTBLUEMETAL01   "Models\\ReflectionTextures\\LightBlueMetal01.tex",
 54 texture TEX_REFL_DARKMETAL          "Models\\ReflectionTextures\\DarkMetal.tex",
 55 texture TEX_REFL_PURPLE01           "Models\\ReflectionTextures\\Purple01.tex",

 // ************** SPECULAR **************
 60 texture TEX_SPEC_WEAK               "Models\\SpecularTextures\\Weak.tex",
 61 texture TEX_SPEC_MEDIUM             "Models\\SpecularTextures\\Medium.tex",
 62 texture TEX_SPEC_STRONG             "Models\\SpecularTextures\\Strong.tex",


functions:

  void CBlackStickman(void) {
  // Get animation IDs
  idBlackStickmanAnim_TPose     = ska_GetIDFromStringTable("TPOSE");
  idBlackStickmanAnim_Stand     = ska_GetIDFromStringTable("STAND");
  idBlackStickmanAnim_Walk      = ska_GetIDFromStringTable("WALK");
  idBlackStickmanAnim_Run       = ska_GetIDFromStringTable("RUN");
  idBlackStickmanAnim_Fly       = ska_GetIDFromStringTable("FLY");
  idBlackStickmanAnim_Jump      = ska_GetIDFromStringTable("JUMP");

  // Get collision box IDs
  idBlackStickmanBox_Stand    = ska_GetIDFromStringTable("Stand");
  idBlackStickmanBox_Fly      = ska_GetIDFromStringTable("Fly");
};

  CPlayer *AcquireViewTarget() {
    // find actual number of players
    INDEX ctMaxPlayers = GetMaxPlayers();
    CEntity *penPlayer;

    for(INDEX i=0; i<ctMaxPlayers; i++) {
      penPlayer=GetPlayerEntity(i);
      if (penPlayer!=NULL && DistanceTo(this, penPlayer)<100.0f) {
            return (CPlayer *)penPlayer;   
      }
    }
    return NULL;
  };


  void AdjustBones(void) {
    if(m_bsbtType != BSBT_STARE && m_bJitterBones) {
      // Get arm and leg bones
      INDEX iBoneIDUpperArmLeft = ska_GetIDFromStringTable("L_UpperArm");
      INDEX iBoneIDLowerArmLeft = ska_GetIDFromStringTable("L_LowerArm");
      INDEX iBoneIDUpperArmRight = ska_GetIDFromStringTable("R_UpperArm");
      INDEX iBoneIDLowerArmRight = ska_GetIDFromStringTable("R_LowerArm");
      RenBone *rbUAL = RM_FindRenBone(iBoneIDUpperArmLeft);
      RenBone *rbLAL = RM_FindRenBone(iBoneIDLowerArmLeft);
      RenBone *rbUAR = RM_FindRenBone(iBoneIDUpperArmRight);
      RenBone *rbLAR = RM_FindRenBone(iBoneIDLowerArmRight);

      if (rbUAL != NULL && rbUAR != NULL && rbLAL != NULL && rbLAR != NULL) {
          // Set jittering rotation via quaternion
          FLOATquat3D quatRandomL;
          FLOATquat3D quatRandomR;
          FLOAT fHeadingRandom = FRnd() + 90.0f - 180.0f;
          FLOAT fPitchRandom = FRnd() + 90.0f - 180.0f;
          FLOAT fBankingRandom = FRnd() + 90.0f - 180.0f;
          fHeadingRandom = Clamp(fHeadingRandom, -30.0f, 30.0f);
          fPitchRandom = Clamp(fPitchRandom, -30.0f, 30.0f);
          fBankingRandom = Clamp(fBankingRandom, -30.0f, 30.0f);

          quatRandomL.FromEuler(ANGLE3D(fBankingRandom + FRnd()*8.0f, -fPitchRandom + FRnd()*8.0f, -fHeadingRandom + FRnd()*8.0f));
          quatRandomR.FromEuler(ANGLE3D(-fBankingRandom + FRnd()*8.0f, -fPitchRandom + FRnd()*8.0f, fHeadingRandom + FRnd()*8.0f));
          rbUAL->rb_arRot.ar_qRot = quatRandomL;
          rbUAR->rb_arRot.ar_qRot = quatRandomR;
          rbLAL->rb_arRot.ar_qRot = quatRandomL;
          rbLAR->rb_arRot.ar_qRot = quatRandomR;
      }
    }

    // Get head bone
    INDEX iBoneID = ska_GetIDFromStringTable("Head");
    RenBone *rb = RM_FindRenBone(iBoneID);

    FLOAT3D vPlayerPos = FLOAT3D(0.0f, 0.0f, 0.0f);

    CPlayer *pTarget = AcquireViewTarget();
    if(pTarget) {
        if ((pTarget->GetFlags()&ENF_ALIVE) && !(pTarget->GetFlags()&ENF_DELETED)) {
           vPlayerPos = pTarget->GetLerpedPlacement().pl_PositionVector;
        }
    }

    FLOAT3D vToPlayer = (vPlayerPos - GetLerpedPlacement().pl_PositionVector).Normalize();
    FLOAT fHeadingTowardsPlayer = GetRelativeHeading(vToPlayer); // CEnemyBase method
    FLOAT fPitchTowardsPlayer = GetRelativePitch(-vToPlayer); // CEnemyBase method

    fHeadingTowardsPlayer = Clamp(fHeadingTowardsPlayer, -45.0f, 45.0f); // Limit
    fPitchTowardsPlayer = Clamp(fPitchTowardsPlayer, 15.0f, 30.0f); // Limit

    FLOAT fDiff = fHeadingTowardsPlayer - m_fToPlayer;
    FLOAT fDiffPitch = fPitchTowardsPlayer - m_fToPlayerPitch;

    // Limit speed per tick (15.0f)
    m_fToPlayer += Min(Abs(fDiff), 15.0f) * Sgn(fDiff);
    m_fToPlayerPitch += Min(Abs(fDiffPitch), 15.0f) * Sgn(fDiffPitch);

    if (rb != NULL) {
        // Set rotation via quaternion
        FLOATquat3D quat;
        quat.FromEuler(ANGLE3D(0.0f, m_fToPlayerPitch, -m_fToPlayer));
        rb->rb_arRot.ar_qRot = quat;
    }
  }

  /* Read from stream. */
  void Read_t( CTStream *istr)
  {
    CMovableModelEntity::Read_t(istr);
  };

  // fuss functions
  void AddToFuss(void)
  {
    return;
  }

  void RemoveFromFuss(void)
  {
    return;
  }

  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("Black Stickman made %s feel an unknown fear"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiBlackStickman;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmBlackStickman,   "Data\\Messages\\NPCs\\BlackStickman.txt");
    return fnmBlackStickman;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheTexture(TEX_REFL_BWRIPLES01      );
    PrecacheTexture(TEX_REFL_BWRIPLES02      );
    PrecacheTexture(TEX_REFL_LIGHTMETAL01    );
    PrecacheTexture(TEX_REFL_LIGHTBLUEMETAL01);
    PrecacheTexture(TEX_REFL_DARKMETAL       );
    PrecacheTexture(TEX_REFL_PURPLE01        );
    PrecacheTexture(TEX_SPEC_WEAK            );
    PrecacheTexture(TEX_SPEC_MEDIUM          );
    PrecacheTexture(TEX_SPEC_STRONG          );
    PrecacheTexture(TEX_BUMP_DETAIL          );
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
    // black stickman cannot be telefragged
    if(dmtType==DMT_TELEPORT)
    {
      return;
    }
    
    // black stickman cannot be harmed by following kinds of damage:
    if(dmtType==DMT_CLOSERANGE ||
       dmtType==DMT_BULLET ||
       dmtType==DMT_IMPACT ||
       dmtType==DMT_CHAINSAW ||
       dmtType==DMT_EXPLOSION ||
       dmtType==DMT_PROJECTILE ||
       dmtType==DMT_CANNONBALL ||
       dmtType==DMT_CANNONBALL_EXPLOSION ||
       dmtType==DMT_PELLET ||
       dmtType==DMT_AXE ||
       dmtType==DMT_BLUNT ||
       dmtType==DMT_SHARP ||
       dmtType==DMT_STING ||
       dmtType==DMT_RIFLE ||
       dmtType==DMT_PUNCH ||
       dmtType==DMT_SHARPSTRONG)
    {
      return;
    }


    // black stickmen can't harm black stickmen
    if (!IsOfClass(penInflictor, "BlackStickman")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    return 0;
  };

  // death
  INDEX AnimForDeath(void) {
    return 0;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idBlackStickmanBox_Fly);
    ASSERT(iBoxIndex>=0);
    ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
    SetSkaColisionInfo();
    en_fDensity = 500.0f;
  };

  void ChooseAnimBSAT(void) {
    switch(m_bsatType)
    {
        case BSAT_WALK: GetModelInstance()->AddAnimation(idBlackStickmanAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
        break;
        case BSAT_RUN: GetModelInstance()->AddAnimation(idBlackStickmanAnim_Run,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
        break;
        case BSAT_FLY: GetModelInstance()->AddAnimation(idBlackStickmanAnim_Fly,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
        break;
    }
  };

  // virtual anim functions
  void StandingAnim(void) {
    GetModelInstance()->AddAnimation(idBlackStickmanAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void WalkingAnim(void) {
    ChooseAnimBSAT();
  };

  void RunningAnim(void) {
    ChooseAnimBSAT();
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    GetModelInstance()->AddAnimation(idBlackStickmanAnim_Jump,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  FLOAT GetLockRotationSpeed(void) { return 250.0f;};


  procedures:


  // wander randomly
  PerformAttack(EVoid) : CEnemyBase::PerformAttack
  {
    while (TRUE)
    {
      // ------------ Exit close attack if out of range or enemy is dead
      // if attacking is futile
      if (ShouldCeaseAttack())
      {
        SetTargetNone();
        return EReturn();
      }
      
      // stop moving
      SetDesiredTranslation(FLOAT3D(0.0f, 0.0f, 0.0f));
      SetDesiredRotation(ANGLE3D(0, 0, 0));

      // ------------ Wait for some time on the ground
      FLOAT fWaitTime = 0.25f+FRnd()*0.4f;
      wait( fWaitTime)
      {
        on (EBegin) : { resume; };
        on (ESound) : { resume; }     // ignore all sounds
        on (EWatch) : { resume; }     // ignore watch
        on (ETimer) : { stop; }       // timer tick expire
      }

      if(m_bsbtType == BSBT_STARE) {
        autocall StareAtPlayer() EReturn;
      } else if(m_bsbtType != BSBT_STARE) {
        autocall RandomWander() EReturn;
      }
    }
  }


  StareAtPlayer(EVoid)
  {
    m_vDesiredPosition = FLOAT3D(0.0f, 0.0f, 0.0f);
    m_fMoveFrequency = 0.0f;
    m_fMoveSpeed = 0.0f;
    m_aRotateSpeed = 0.0f;
    StandingAnim();
    m_fLockOnEnemyTime = 8.0f;
    while (TRUE) {
      autocall CEnemyBase::LockOnEnemy() EReturn;
      autowait(0.125f);
    }
  };


  RandomWander(EVoid)
  {
    if(m_bsbtType == BSBT_WANDER) {
      m_vDesiredPosition = FLOAT3D(FRnd()+10.0f-30.0f, 0.0f, FRnd()+10.0f-30.0f);
    } else if(m_bsbtType == BSBT_CHASE) {
      m_vDesiredPosition = PlayerDestinationPos();
      m_dtDestination = DT_PLAYERCURRENT;
    } else {
      m_vDesiredPosition = FLOAT3D(0.0f, 0.0f, 0.0f);
    }
    
    if(m_bsbtType != BSBT_STARE) {
      m_fMoveFrequency = 0.1f;
      m_fMoveSpeed = FRnd()+5.0f-2.5f;
      m_aRotateSpeed = 2*FRnd()+15.0f-45.0f;
      FLOAT fSpeedX = 0.0f;
      FLOAT fSpeedY = 0.0f;
      FLOAT fSpeedZ = -m_fMoveSpeed;

      FLOAT3D vTranslation(fSpeedX, fSpeedY, fSpeedZ);
      SetDesiredTranslation(vTranslation);
      ChooseAnimBSAT();
    } else {
      m_fMoveFrequency = 0.0f;
      m_fMoveSpeed = 0.0f;
      m_aRotateSpeed = 0.0f;
      StandingAnim();
    }
    

    // ------------ While wandering, adjust directions and randomize
    while (TRUE)
    {
      // adjust direction and speed only if moving
      if(m_bsbtType != BSBT_STARE || m_bsbtType != BSBT_CHASE) {
        m_fMoveSpeed = 0.0f;
        m_aRotateSpeed = FRnd()+40.0f-120.0f;
        FLOAT3D vTranslation = GetDesiredTranslation();
        SetDesiredMovement(); 
        SetDesiredTranslation(vTranslation);
      }

      ANGLE aHeadingRotation;
      
      if(m_bsbtType != BSBT_STARE || m_bsbtType != BSBT_CHASE)
      {
        switch(IRnd()%6)
        {
          case 0:
          {
            aHeadingRotation = +m_aRotateSpeed*FRnd()+50.0f-150.0f;
          }
          break;
          case 1:
          {
            aHeadingRotation = -m_aRotateSpeed*FRnd()-50.0f+150.0f;
          }
          break;
          case 2:
          {
            aHeadingRotation = +m_aRotateSpeed*FRnd()+60.0f-120.0f;
          }
          break;
          case 3:
          {
            aHeadingRotation = -m_aRotateSpeed*FRnd()-60.0f+120.0f;
          }
          break;
          case 4:
          {
            aHeadingRotation = +m_aRotateSpeed*FRnd()+90.0f-180.0f;
          }
          break;
          case 5:
          {
            aHeadingRotation = -m_aRotateSpeed*FRnd()-90.0f+180.0f;
          }
          break;
          default:
          {
            ASSERT(FALSE);
          }
          break;
        }
      }

      if(m_bsbtType != BSBT_STARE || m_bsbtType != BSBT_CHASE) {
        SetDesiredRotation(ANGLE3D(aHeadingRotation, 0, 0));
      }

      autowait(m_fCheckGeometryWait--);

      if(m_fCheckGeometryWait < 0)
      {
        m_fCheckGeometryWait = 2.0f;
      }
    }
  };


  Fire(EVoid) : CEnemyBase::Fire
  {
    return EReturn();
  };

  // hit enemy
  Hit(EVoid) : CEnemyBase::Hit
  {
    return EReturn();
  };


/************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    InitAsSkaModel();

    SetPhysicsFlags(EPF_MODEL_WALKING);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_SHADOW;
    SetHealth(5000.0f);
    m_fMaxHealth = 5000.0f;
    en_tmMaxHoldBreath = 60.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance
    switch(m_bsctType)
    {
      default:
      SetSkaModel(MODEL_BLACKSTICKMAN);
      break;

      case BSCT_NORMAL:
      SetSkaModel(MODEL_BLACKSTICKMAN);
      break;

      case BSCT_TRANSLUCENT:
      SetSkaModel(MODEL_BLACKSTICKMAN);
      break;

      case BSCT_REFLECTIVE:
      SetSkaModel(MODEL_BLACKSTICKMAN);
      break;
    }

        // setup moving speed
        m_fWalkSpeed = FRnd() + 1.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 5.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        m_fCloseRunSpeed = FRnd() + 5.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 7.0f;
        m_fStopDistance = 3.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 65.0f;
        m_fBodyParts = 4;
        m_fDamageWounded = 0.0f;
        m_iScore = 1000;
        m_sptType = SPT_SMOKE;

    // set stretch factors for height and width
    GetModelInstance()->StretchModel(FLOAT3D(1.0f, 1.0f, 1.0f));
    ModelChangeNotify();
    StandingAnim();

    if(m_bsatType == BSAT_FLY) {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idBlackStickmanBox_Fly);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};