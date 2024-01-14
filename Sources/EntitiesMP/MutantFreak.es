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

1034
%{
#include "StdH.h"
#include "Models/NPCs/MutantFreak/MutantFreak1.h"
%}

uses "EntitiesMP/EnemyBase";

enum MutantFreakType {
  0 MFC_MUTANT1      "Mutant 1",
};

%{

// info structure
static EntityInfo eiMutantFreak = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CMutantFreak: CEnemyBase {
name      "Mutant Freak";
thumbnail "Thumbnails\\MutantFreak.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum MutantFreakType m_mfChar "Character" 'C' = MFC_MUTANT1,   // character

components:
  1 class     CLASS_BASE            "Classes\\EnemyBase.ecl",
  10 model    MODEL_MUTANT1         "Models\\NPCs\\MutantFreak\\Freak1\\MutantFreak1.mdl",
  11 texture  TEXTURE_MUTANT1       "Models\\NPCs\\MutantFreak\\MutantFreak1.tex",

  30 sound   SOUND_HIT              "Models\\NPCs\\Gunman\\Sounds\\Kick.wav",
  31 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  32 sound   SOUND_IDLE             "Models\\NPCs\\MutantFreak\\Sounds\\Mutant1Idle.wav",
  33 sound   SOUND_SIGHT            "Models\\NPCs\\MutantFreak\\Sounds\\Mutant1Sight.wav",
  34 sound   SOUND_WOUND            "Models\\NPCs\\MutantFreak\\Sounds\\Mutant1Wound.wav",
  35 sound   SOUND_DEATH            "Models\\NPCs\\MutantFreak\\Sounds\\Mutant1Death.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Mutant Freak slashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiMutantFreak;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmMutantFreak1, "Data\\Messages\\NPCs\\MutantFreak1.txt");
    switch(m_mfChar) {
    default: ASSERT(FALSE);
    case MFC_MUTANT1: return fnmMutantFreak1;
    }
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_IDLE);
    PrecacheSound(SOUND_SIGHT);
    PrecacheSound(SOUND_WOUND);
    PrecacheSound(SOUND_DEATH);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_mfChar) {
    case MFC_MUTANT1: { pes->es_strName+=" Three Arms"; } break;
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "Mutant Freak")) {
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
    INDEX iAnim;
    if(m_mfChar == MFC_MUTANT1)
    {
      iAnim = MUTANTFREAK1_ANIM_WOUND;
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

      if(m_mfChar == MFC_MUTANT1)
      {
        if (fDamageDir<0) {
          iAnim = MUTANTFREAK1_ANIM_DEATHFRONT;
        } else {
          iAnim = MUTANTFREAK1_ANIM_DEATHBACK;
        }
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
    // yell
    ESound eSound;
    eSound.EsndtSound = SNDT_SHOUT;
    eSound.penTarget = m_penEnemy;
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, 50.0f));

    if(GetModelObject()->GetAnim()==MUTANTFREAK1_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(MUTANTFREAK1_COLLISION_BOX_DEATHFRONT_BOX);
    }
    else if(GetModelObject()->GetAnim()==MUTANTFREAK1_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(MUTANTFREAK1_COLLISION_BOX_DEATHBACK_BOX);
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void WalkingAnim(void) {
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RunningAnim(void) {
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void BacksteppingAnim(void) {
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void JumpingAnim(void) {
    RunningAnim();
  };

  // virtual sound functions
  void IdleSound(void) {
    PlaySound(m_soSound, SOUND_IDLE, SOF_3D);
  };
  void SightSound(void) {
    PlaySound(m_soSound, SOUND_SIGHT, SOF_3D);
  };
  void WoundSound(void) {
    PlaySound(m_soSound, SOUND_WOUND, SOF_3D);
  };
  void DeathSound(void) {
    PlaySound(m_soSound, SOUND_DEATH, SOF_3D);
  };

procedures:
  
  Fire(EVoid) : CEnemyBase::Fire {
    return EReturn();
  };

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    switch(IRnd()%3)
    {
      case 0: jump SlashEnemyRight(); break;
      case 1: jump SlashEnemyLeft(); break;
      case 2: jump SlashEnemySlam(); break;
      default: ASSERTALWAYS("MutantFreak unknown melee attack");
    }

    return EReturn();
  };

  SlashEnemyRight(EVoid) {
    // close attack
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_MELEE1, 0);
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_mfChar == MFC_MUTANT1)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.5f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  SlashEnemyLeft(EVoid) {
    // close attack
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_MELEE2, 0);
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_mfChar == MFC_MUTANT1)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.5f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  SlashEnemySlam(EVoid) {
    // close attack
    if(m_mfChar == MFC_MUTANT1)
    {
      StartModelAnim(MUTANTFREAK1_ANIM_MELEE3, 0);
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_mfChar == MFC_MUTANT1)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 30.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.5f);
    MaybeSwitchToAnotherPlayer();

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
    m_ftFactionType = FT_LESSER;
    SetHealth(350.0f);
    m_fMaxHealth = 350.0f;
    m_fDamageWounded = 80.0f;
    m_iScore = 5000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    switch(m_mfChar)
    {
      case MFC_MUTANT1:
      {
        SetModel(MODEL_MUTANT1);
        SetModelMainTexture(TEXTURE_MUTANT1);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
    }

        // setup moving speed
        
        m_fWalkSpeed = FRnd() + 2.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 450.0f);
        m_fAttackRunSpeed = FRnd() + 4.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 200.0f);
        m_fCloseRunSpeed = FRnd() + 4.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 200.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 2.5f;
        m_fStopDistance = 1.75f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 100.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};