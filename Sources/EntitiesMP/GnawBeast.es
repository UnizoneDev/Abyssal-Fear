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

1044
%{
#include "StdH.h"
#include "Models/NPCs/GnawBeast/GnawBeast.h"
%}

uses "EntitiesMP/EnemyBase";

%{

// info structure
static EntityInfo eiGnawBeast = {
  EIBT_FLESH, 400.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CGnawBeast: CEnemyBase {
name      "GnawBeast";
thumbnail "Thumbnails\\GnawBeast.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 BOOL m_bStartsOutSlow "Starts out slow" = TRUE,
  3 BOOL m_bRandomRunAnim "Randomize run animation" = TRUE,
  4 INDEX m_iRunAnim = 0,
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 model   MODEL_GNAWBEAST		    "Models\\NPCs\\GnawBeast\\GnawBeast.mdl",
  3 texture TEXTURE_GNAWBEAST		"Models\\NPCs\\GnawBeast\\GnawBeast.tex",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  12 sound   SOUND_SIGHT1           "Models\\NPCs\\GnawBeast\\Sounds\\Sight1.wav",
  13 sound   SOUND_SIGHT2           "Models\\NPCs\\GnawBeast\\Sounds\\Sight2.wav",
  14 sound   SOUND_IDLE1            "Models\\NPCs\\GnawBeast\\Sounds\\Idle1.wav",
  15 sound   SOUND_IDLE2            "Models\\NPCs\\GnawBeast\\Sounds\\Idle2.wav",
  16 sound   SOUND_WOUND            "Models\\NPCs\\GnawBeast\\Sounds\\Wound.wav",
  17 sound   SOUND_DEATH            "Models\\NPCs\\GnawBeast\\Sounds\\Death.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Gnaw Beast pulverized %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiGnawBeast;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmGnawBeast, "Data\\Messages\\NPCs\\GnawBeast.txt");
    return fnmGnawBeast;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_SIGHT2);
    PrecacheSound(SOUND_IDLE1);
    PrecacheSound(SOUND_IDLE2);
    PrecacheSound(SOUND_WOUND);
    PrecacheSound(SOUND_DEATH);
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
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "GnawBeast")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }

      if(GetHealth()<=175.0f) {
        m_bStartsOutSlow = FALSE;
        m_fWalkSpeed = FRnd() + 3.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 6.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 6.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = GNAWBEAST_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    FLOAT3D vFront;
      GetHeadingDirection(0, vFront);
      FLOAT fDamageDir = m_vDamage%vFront;

      if (fDamageDir<0) {
          iAnim = GNAWBEAST_ANIM_DEATHFRONT;
        } else {
          iAnim = GNAWBEAST_ANIM_DEATHBACK;
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
    if(GetModelObject()->GetAnim()==GNAWBEAST_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(GNAWBEAST_COLLISION_BOX_DEATHBOX_FRONT);
    }
    else
    {
      ChangeCollisionBoxIndexWhenPossible(GNAWBEAST_COLLISION_BOX_DEATHBOX_BACK);
    }
    
    en_fDensity = 500.0f;
  };
  
  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(GNAWBEAST_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(GNAWBEAST_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
      if(m_bStartsOutSlow) {
        WalkingAnim();
      } else {
        if(m_bRandomRunAnim) {
          switch(m_iRunAnim)
          {
              case 0: StartModelAnim(GNAWBEAST_ANIM_RUN, AOF_LOOPING|AOF_NORESTART); break;
              case 1: StartModelAnim(GNAWBEAST_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART); break;
              default: ASSERTALWAYS("GnawBeast unknown run animation");
          }
        } else {
          StartModelAnim(GNAWBEAST_ANIM_RUN3, AOF_LOOPING|AOF_NORESTART);
        }
      }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(GNAWBEAST_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
  };

  // virtual sound functions
  void IdleSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soSound, SOUND_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("GnawBeast unknown idle sound");
    }
  };

  void SightSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soSound, SOUND_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("GnawBeast unknown sight sound");
    }
  };

  void WoundSound(void) {
    PlaySound(m_soSound, SOUND_WOUND, SOF_3D);
  };

  void DeathSound(void) {
    PlaySound(m_soSound, SOUND_DEATH, SOF_3D);
  };

  procedures:

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    jump SlashEnemySingle();
    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    switch(IRnd()%4)
    {
      case 0: StartModelAnim(GNAWBEAST_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(GNAWBEAST_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(GNAWBEAST_ANIM_MELEE3, 0); break;
      case 3: StartModelAnim(GNAWBEAST_ANIM_MELEE4, 0); break;
      default: ASSERTALWAYS("Gnaw Beast unknown melee animation");
    }
    m_bFistHit = FALSE;
    autowait(0.375f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(GetHealth()<=175.0f) {
          InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }


  // before main loop
  PreMainLoop(EVoid)
  {
    m_iRunAnim = IRnd()%2;
    
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
    SetHealth(400.0f);
    m_fMaxHealth = 400.0f;
    m_fDamageWounded = 190.0f;
    m_iScore = 25000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        SetModel(MODEL_GNAWBEAST);
        SetModelMainTexture(TEXTURE_GNAWBEAST);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();

        if(m_bStartsOutSlow) {
          m_fWalkSpeed = FRnd() + 1.5f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
          m_fAttackRunSpeed = FRnd() + 2.25f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
          m_fCloseRunSpeed = FRnd() + 2.25f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        } else {
          m_fWalkSpeed = FRnd() + 2.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
          m_fAttackRunSpeed = FRnd() + 4.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
          m_fCloseRunSpeed = FRnd() + 4.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        }
        
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 3.0f;
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
