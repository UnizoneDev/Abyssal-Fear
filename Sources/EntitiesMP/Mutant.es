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

1057
%{
#include "StdH.h"
#include "EntitiesMP/Mihulai.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum MutantType {
  0 MUC_RED        "Red Mutant",
  1 MUC_GREEN      "Green Mutant",
  2 MUC_GRAY       "Gray Mutant"
};

%{

  static INDEX idMutantAnim_TPose = -1;
  static INDEX idMutantAnim_Stand = -1;
  static INDEX idMutantAnim_Walk  = -1;
  static INDEX idMutantAnim_Wound   = -1;
  static INDEX idMutantAnim_Jump    = -1;
  static INDEX idMutantAnim_Melee1  = -1;
  static INDEX idMutantAnim_Melee2  = -1;
  static INDEX idMutantAnim_Melee3  = -1;
  static INDEX idMutantAnim_DeathFront = -1;
  static INDEX idMutantAnim_DeathBack  = -1;
  static INDEX idMutantAnim_Birth   = -1;
  static INDEX idMutantAnim_Spit    = -1;
  static INDEX idMutantBox_Stand  = -1;
  static INDEX idMutantBox_DeathFront   = -1;
  static INDEX idMutantBox_DeathBack    = -1;

// info structure
static EntityInfo eiMutant = {
  EIBT_FLESH, 250.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

#define MIHULAI_BIRTH_LEFT  FLOAT3D(-0.35f, 1.125f, -0.5f)
#define MIHULAI_BIRTH_RIGHT FLOAT3D(0.35f, 1.125f, -0.5f)

%}

class CMutant: CEnemyBase {
name      "Mutant";
thumbnail "Thumbnails\\Mutant.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum MutantType m_muChar "Character" 'C' = MUC_RED,   // character
  3 FLOAT m_fFireTime = 0.0f,           // time to puke acidic blood
  4 INDEX m_iRangedAttackThreshold = 0,
  5 BOOL m_bBirthMihulai = FALSE,

components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 class   CLASS_MIHULAI         "Classes\\Mihulai.ecl",
  3 class   CLASS_BLOOD_UNI       "Classes\\BloodUni.ecl",
  4 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",
 10 skamodel MODEL_MUTANT_RED     "Models\\NPCs\\Mutant\\MutantRed.smc",
 11 skamodel MODEL_MUTANT_GREEN   "Models\\NPCs\\Mutant\\MutantGreen.smc",
 12 skamodel MODEL_MUTANT_GRAY    "Models\\NPCs\\Mutant\\MutantGray.smc",

 30 sound   SOUND_PUNCH1          "Sounds\\Weapons\\Punch1.wav",
 31 sound   SOUND_PUNCH2          "Sounds\\Weapons\\Punch2.wav",
 32 sound   SOUND_PUNCH3          "Sounds\\Weapons\\Punch3.wav",
 33 sound   SOUND_PUNCH4          "Sounds\\Weapons\\Punch4.wav",
 34 sound   SOUND_SWING           "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
 35 sound   SOUND_BIRTH           "Sounds\\GoreBlood\\GoreMutantBirth.wav",
 36 sound   SOUND_VOMIT           "Models\\NPCs\\Mutant\\Sounds\\MutantVomitAcid.wav",

 50 skamodel MODEL_MIHULAI		  "Models\\NPCs\\MihulaiSKA\\Mihulai.smc",

functions:

  void CMutant(void) {
  // Get mutant animation IDs
  idMutantAnim_TPose       = ska_GetIDFromStringTable("TPOSE");
  idMutantAnim_Stand       = ska_GetIDFromStringTable("STAND");
  idMutantAnim_Walk        = ska_GetIDFromStringTable("WALK");
  idMutantAnim_Wound       = ska_GetIDFromStringTable("WOUND");
  idMutantAnim_Jump        = ska_GetIDFromStringTable("JUMP");
  idMutantAnim_Melee1      = ska_GetIDFromStringTable("MELEE1");
  idMutantAnim_Melee2      = ska_GetIDFromStringTable("MELEE2");
  idMutantAnim_Melee3      = ska_GetIDFromStringTable("MELEE3");
  idMutantAnim_DeathFront  = ska_GetIDFromStringTable("DEATHFRONT");
  idMutantAnim_DeathBack   = ska_GetIDFromStringTable("DEATHBACK");
  idMutantAnim_Birth       = ska_GetIDFromStringTable("BIRTH");
  idMutantAnim_Spit        = ska_GetIDFromStringTable("SPIT");

  // Get mutant collision box IDs
  idMutantBox_Stand       = ska_GetIDFromStringTable("Stand");
  idMutantBox_DeathFront  = ska_GetIDFromStringTable("DeathFront");
  idMutantBox_DeathBack   = ska_GetIDFromStringTable("DeathBack");
};

// describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Mutant slashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiMutant;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmMutantRed, "Data\\Messages\\NPCs\\MutantRed.txt");
    static DECLARE_CTFILENAME(fnmMutantGreen, "Data\\Messages\\NPCs\\MutantGreen.txt");
    static DECLARE_CTFILENAME(fnmMutantGray, "Data\\Messages\\NPCs\\MutantGray.txt");
    switch(m_muChar) {
      default: ASSERT(FALSE);
      case MUC_RED: return fnmMutantRed;
      case MUC_GREEN: return fnmMutantGreen;
      case MUC_GRAY: return fnmMutantGray;
    }
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_PUNCH1);
    PrecacheSound(SOUND_PUNCH2);
    PrecacheSound(SOUND_PUNCH3);
    PrecacheSound(SOUND_PUNCH4);
    PrecacheSound(SOUND_SWING);
    if(m_muChar == MUC_GREEN) {
      PrecacheClass(CLASS_PROJECTILE, PRT_MUTANT_SPIT);
      PrecacheSound(SOUND_VOMIT);
    }
    if(m_muChar == MUC_GRAY) {
      PrecacheSkaModel(MODEL_MIHULAI);
      PrecacheClass(CLASS_MIHULAI);
      PrecacheSound(SOUND_BIRTH);
      PrecacheClass(CLASS_BLOOD_UNI);
    }
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_muChar) {
    case MUC_RED: { pes->es_strName+=" Red"; } break;
    case MUC_GREEN: { pes->es_strName+=" Green"; } break;
    case MUC_GRAY: { pes->es_strName+=" Gray"; } break;
    }
    return TRUE;
  };

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // mutant can't harm mutant
    if (!IsOfClass(penInflictor, "Mutant")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }
      if (m_muChar==MUC_GREEN) {
        m_iRangedAttackThreshold--;
      }
    }
  };

  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = idMutantAnim_Wound;
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
      iAnim = idMutantAnim_DeathFront;
    } else {
      iAnim = idMutantAnim_DeathBack;
    }

    if(m_bBirthMihulai) {
      iAnim = idMutantAnim_DeathBack;
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
    if(GetModelInstance()->IsAnimationPlaying(idMutantAnim_DeathFront))
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idMutantBox_DeathFront);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }
    else
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idMutantBox_DeathBack);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }

    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartSkaModelAnim(idMutantAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void WalkingAnim(void) {
    StartSkaModelAnim(idMutantAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void RunningAnim(void) {
    StartSkaModelAnim(idMutantAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartSkaModelAnim(idMutantAnim_Jump,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  virtual CEntityPointer SpawnMihulai(BOOL bBirthRight) {
    CPlacement3D plSpawn = GetPlacement();
    if(bBirthRight) {
      plSpawn.pl_PositionVector += MIHULAI_BIRTH_RIGHT*GetRotationMatrix();
    } else {
      plSpawn.pl_PositionVector += MIHULAI_BIRTH_LEFT*GetRotationMatrix();
    }

    return CreateEntity(plSpawn, CLASS_MIHULAI);
  };

  void BirthMihulai(void) {
    CEntityPointer pen = SpawnMihulai(FALSE);
    pen->Initialize();

    CEnemyBase *penEnemy = (CEnemyBase*)&*pen;
    penEnemy->m_bTemplate = FALSE;
    CMihulai *penMihulai = (CMihulai*)&*pen;
    penMihulai->m_mhChar = MHC_BABY1;

    pen->Reinitialize();

    pen = SpawnMihulai(TRUE);
    pen->Initialize();

    CEnemyBase *penEnemyRight = (CEnemyBase*)&*pen;
    penEnemyRight->m_bTemplate = FALSE;
    CMihulai *penMihulaiRight = (CMihulai*)&*pen;
    penMihulaiRight->m_mhChar = MHC_BABY1;

    pen->Reinitialize();
  };

  void BloodBurst(void) {
    CPlacement3D plSpawn = GetPlacement();
    plSpawn.pl_PositionVector += FLOAT3D(0.0f, 1.125f, -0.5f)*GetRotationMatrix();

    CEntity *penSpawn = CreateEntity(plSpawn, CLASS_BLOOD_UNI);
    ESpawnBlood eSpawnBlood;
    eSpawnBlood.colBurnColor = C_WHITE|CT_OPAQUE;
    eSpawnBlood.fDamagePower = 2.0f;
    eSpawnBlood.iAmount = 24;
    eSpawnBlood.sptType = SPT_BLOOD;
    eSpawnBlood.fSizeMultiplier = 0.75f;

    FLOAT3D vSpillDirection = en_vCurrentTranslationAbsolute*2.0f-en_vGravityDir*0.5f;

    eSpawnBlood.vDirection = vSpillDirection;
    eSpawnBlood.penOwner = this;

    penSpawn->Initialize(eSpawnBlood);
  };

  FLOAT GetLockRotationSpeed(void) { return 500.0f;};

  procedures:

  Fire(EVoid) : CEnemyBase::Fire
  {
    if (m_muChar==MUC_GREEN) {
      if(m_iRangedAttackThreshold <= 0) {
        if(GetSP()->sp_gdGameDifficulty>=CSessionProperties::GD_HARD) {
          m_iRangedAttackThreshold = 3;
        } else {
          m_iRangedAttackThreshold = 4;
        }
      
        if(!CanFireAtPlayer(1.5f, FALSE)) {
          return EReturn();
        }
        m_fFireTime = 1.5f;
        autocall MutantSpitAttack() EEnd;
      }
    }
    return EReturn();
  };

  // Mutant Vomit Spit attack
  MutantSpitAttack(EVoid) {
    m_fLockOnEnemyTime = 0.125f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    autowait(0.125f);
    m_fFireTime += _pTimer->CurrentTick();

    if(!CanFireAtPlayer(1.5f, FALSE)) {
      return EEnd();
    }
    
    StartSkaModelAnim(idMutantAnim_Spit,AN_CLEAR,1,0);
    autowait(0.375f);
    PlaySound(m_soSound, SOUND_VOMIT, SOF_3D);

    while (m_fFireTime > _pTimer->CurrentTick()) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;

      m_fMoveFrequency = 0.05f;
      wait(m_fMoveFrequency) {
        on(EBegin) : {
          FLOAT fVomitRandomX = FRnd() * 10.0f - 5.0f;
          ShootProjectile(PRT_MUTANT_SPIT, FLOAT3D(0.0f, 1.975f, 0.0f), ANGLE3D(fVomitRandomX, 0, 0));
          resume;
        }
        on (ETimer) : { stop; }
      }
    }

    autowait(0.125f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    if (m_muChar==MUC_GREEN) {
      m_iRangedAttackThreshold--;
    }

    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      jump SlashEnemySingle();
    }

    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    switch(IRnd()%3)
    {
      case 0: StartSkaModelAnim(idMutantAnim_Melee1,AN_CLEAR,1,0); break;
      case 1: StartSkaModelAnim(idMutantAnim_Melee2,AN_CLEAR,1,0); break;
      case 2: StartSkaModelAnim(idMutantAnim_Melee3,AN_CLEAR,1,0); break;
      default: ASSERTALWAYS("Mutant unknown melee animation");
    }
    m_bFistHit = FALSE;
    autowait(0.375f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Mutant unknown melee hit sound");
        }
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        if(GetModelInstance()->IsAnimationPlaying(idMutantAnim_Melee3)) {
          if(m_muChar == MUC_GRAY) {
            InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 16.0f, vPosition, vDirection, DBPT_GENERIC);
          } else {
            InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 14.0f, vPosition, vDirection, DBPT_GENERIC);
          }
        } else {
          if(m_muChar == MUC_GRAY) {
            InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 10.0f, vPosition, vDirection, DBPT_GENERIC);
          } else {
            InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 8.0f, vPosition, vDirection, DBPT_GENERIC);
          }
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  };

  Death(EVoid) : CEnemyBase::Death {
    if(m_muChar == MUC_GRAY) {
      m_bBirthMihulai = TRUE;
      StopMoving();
      StartSkaModelAnim(idMutantAnim_Birth,AN_CLEAR,1,0);
      autowait(1.175f);
      PlaySound(m_soSound, SOUND_BIRTH, SOF_3D);
      BirthMihulai();
      BloodBurst();
      LeaveStain(FALSE, RGBAToColor(250,20,20,255));
      autowait(0.875f);
    }
    jump CEnemyBase::Death();
  }

  // birth Mihulai action
  SpecialAction1(EVoid) : CEnemyBase::SpecialAction1 {
    if(m_muChar == MUC_GRAY) {
      StopMoving();
      StartSkaModelAnim(idMutantAnim_Birth,AN_CLEAR,1,0);
      autowait(1.175f);
      PlaySound(m_soSound, SOUND_BIRTH, SOF_3D);
      BirthMihulai();
      BloodBurst();
      LeaveStain(FALSE, RGBAToColor(250,20,20,255));
      autowait(0.875f);
    }

    return EReturn();
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
    m_ftFactionType = FT_LESSER;
    if(m_muChar == MUC_GRAY) {
      SetHealth(250.0f);
      m_fMaxHealth = 250.0f;
      m_fDamageWounded = 120.0f;
      m_iScore = 8000;
    } else {
      SetHealth(180.0f);
      m_fMaxHealth = 180.0f;
      m_fDamageWounded = 70.0f;
      m_iScore = 5000;
    }
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 1000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    switch(m_muChar)
    {
      case MUC_RED:
      {
        m_sptType = SPT_BLOOD;
        SetSkaModel(MODEL_MUTANT_RED);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case MUC_GREEN:
      {
        m_sptType = SPT_SLIME;
        SetSkaModel(MODEL_MUTANT_GREEN);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case MUC_GRAY:
      {
        m_sptType = SPT_BLOOD;
        SetSkaModel(MODEL_MUTANT_GRAY);
        GetModelInstance()->StretchModel(FLOAT3D(1.375f, 1.375f, 1.375f));
        ModelChangeNotify();
      } break;
    }

    if(m_muChar == MUC_GRAY) {
      m_fWalkSpeed = FRnd() + 2.0f;
      m_aWalkRotateSpeed = AngleDeg(FRnd()*20.0f + 450.0f);
      m_fAttackRunSpeed = FRnd() + 4.0f;
      m_aAttackRotateSpeed = AngleDeg(FRnd()*40 + 225.0f);
      m_fCloseRunSpeed = FRnd() + 4.0f;
      m_aCloseRotateSpeed = AngleDeg(FRnd()*40 + 225.0f);
    } else {
      m_fWalkSpeed = FRnd() + 3.0f;
      m_aWalkRotateSpeed = AngleDeg(FRnd()*20.0f + 500.0f);
      m_fAttackRunSpeed = FRnd() + 5.0f;
      m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 275.0f);
      m_fCloseRunSpeed = FRnd() + 5.0f;
      m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 275.0f);
    }

    // setup attack distances
    m_fAttackDistance = 100.0f;
    m_fCloseDistance = 2.75f;
    m_fStopDistance = 1.75f;
    m_fAttackFireTime = 0.75f;
    m_fCloseFireTime = 1.25f;
    m_fIgnoreRange = 200.0f;
    // damage/explode properties
    m_fBlowUpAmount = 150.0f;
    m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};