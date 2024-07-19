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

1040
%{
#include "StdH.h"
#include "Models/NPCs/Yaraka/Yaraka.h"
%}

uses "EntitiesMP/EnemyBase";

%{

// info structure
static EntityInfo eiYaraka = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CYaraka: CEnemyBase {
name      "Yaraka";
thumbnail "Thumbnails\\Yaraka.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,

components:
  1 class   CLASS_BASE			"Classes\\EnemyBase.ecl",
  2 model   MODEL_YARAKA		"Models\\NPCs\\Yaraka\\Yaraka.mdl",
  3 texture TEXTURE_YARAKA		"Models\\NPCs\\Yaraka\\Yaraka.tex",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",


functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("Yaraka slashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiYaraka;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmYaraka, "Data\\Messages\\NPCs\\Yaraka.txt");
    return fnmYaraka;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
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
    // hung corpse can't harm hung corpse
    if (!IsOfClass(penInflictor, "Yaraka")) {
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
    iAnim = YARAKA_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = YARAKA_ANIM_DEATH;

    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(YARAKA_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(YARAKA_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(YARAKA_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
    StartModelAnim(YARAKA_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(YARAKA_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
  };

  void DodgeLeftAnim(void) {
    StartModelAnim(YARAKA_ANIM_DODGELEFT, AOF_LOOPING|AOF_NORESTART);
  };

  void DodgeRightAnim(void) {
    StartModelAnim(YARAKA_ANIM_DODGERIGHT, AOF_LOOPING|AOF_NORESTART);
  };


  procedures:

  DodgeRandom(EVoid) {
    m_fLockOnEnemyTime = 1.5f;

    switch(IRnd()%2)
    {
        case 0: jump CEnemyBase::DodgeLeft(); break;
        case 1: jump CEnemyBase::DodgeRight(); break;
        default: ASSERTALWAYS("Yaraka unknown dodge choice");
    }

    return EReturn();
  }

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    switch(IRnd()%3)
    {
      case 0: jump SlashEnemySingle1(); break;
      case 1: jump SlashEnemySingle2(); break;
      case 2: jump SlashEnemySlam(); break;
      default: ASSERTALWAYS("Yaraka unknown melee attack");
    }

    return EReturn();
  };

  SlashEnemySingle1(EVoid) {
    INDEX iRandomChoice = IRnd()%3;
    if(iRandomChoice == 1) {
      autocall DodgeRandom() EReturn;
      return EReturn();
    }

    StartModelAnim(YARAKA_ANIM_MELEE1, 0);

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

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 8.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  SlashEnemySingle2(EVoid) {
    INDEX iRandomChoice = IRnd()%3;
    if(iRandomChoice == 1) {
      autocall DodgeRandom() EReturn;
      return EReturn();
    }

    StartModelAnim(YARAKA_ANIM_MELEE2, 0);

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

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 8.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  SlashEnemySlam(EVoid) {
    INDEX iRandomChoice = IRnd()%3;
    if(iRandomChoice == 1) {
      autocall DodgeRandom() EReturn;
      return EReturn();
    }

    // close attack
    StartModelAnim(YARAKA_ANIM_MELEE3, 0);

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

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
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
    m_ftFactionType = FT_GREATER;
    SetHealth(1000.0f);
    m_fMaxHealth = 1000.0f;
    m_fDamageWounded = 220.0f;
    m_iScore = 50000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        SetModel(MODEL_YARAKA);
        SetModelMainTexture(TEXTURE_YARAKA);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 2.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 5.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 5.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 2.75f;
        m_fStopDistance = 1.75f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 250.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in this class
    jump CEnemyBase::MainLoop();
  };
};