/* Copyright (c) 2021-2023 Uni Musuotankarep.
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

1024
%{
#include "StdH.h"
#include "Models/NPCs/RedDeath/RedDeath.h"
%}

uses "EntitiesMP/EnemyBase";

%{

// info structure
static EntityInfo eiRedDeath = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CRedDeath: CEnemyBase {
name      "RedDeath";
thumbnail "Thumbnails\\RedDeath.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 model   MODEL_REDDEATH		    "Models\\NPCs\\RedDeath\\RedDeath.mdl",
  3 texture TEXTURE_REDDEATH		"Models\\NPCs\\RedDeath\\FireBreather.tex",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  12 sound   SOUND_SIGHT1           "Models\\NPCs\\RedDeath\\Sounds\\Sight1.wav",
  13 sound   SOUND_SIGHT2           "Models\\NPCs\\RedDeath\\Sounds\\Sight2.wav",
  14 sound   SOUND_WOUND1           "Models\\NPCs\\RedDeath\\Sounds\\Wound1.wav",
  15 sound   SOUND_WOUND2           "Models\\NPCs\\RedDeath\\Sounds\\Wound2.wav",
  16 sound   SOUND_WOUND3           "Models\\NPCs\\RedDeath\\Sounds\\Wound3.wav",
  17 sound   SOUND_IDLE             "Models\\NPCs\\RedDeath\\Sounds\\Idle.wav",
  18 sound   SOUND_DEATH            "Models\\NPCs\\RedDeath\\Sounds\\Death.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Red Death bashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiRedDeath;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmRedDeath, "Data\\Messages\\NPCs\\RedDeath.txt");
    return fnmRedDeath;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_IDLE);
    PrecacheSound(SOUND_DEATH);
    PrecacheSound(SOUND_WOUND1);
    PrecacheSound(SOUND_WOUND2);
    PrecacheSound(SOUND_WOUND3);
    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_SIGHT2);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection) 
  {
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "RedDeath")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage) {
    INDEX iAnim;
    iAnim = REDDEATH_ANIM_WOUND;
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
          iAnim = REDDEATH_ANIM_FRONTDEATH;
        } else {
          iAnim = REDDEATH_ANIM_BACKDEATH;
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
    if(GetModelObject()->GetAnim()==REDDEATH_ANIM_FRONTDEATH)
    {
      ChangeCollisionBoxIndexWhenPossible(REDDEATH_COLLISION_BOX_DEATHBOX_FRONT);
    }
    else
    {
      ChangeCollisionBoxIndexWhenPossible(REDDEATH_COLLISION_BOX_DEATHBOX_BACK);
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(REDDEATH_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(REDDEATH_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
      StartModelAnim(REDDEATH_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(REDDEATH_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
  };

  // virtual sound functions
  void IdleSound(void) {
    PlaySound(m_soSound, SOUND_IDLE, SOF_3D);
  };

  void SightSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soSound, SOUND_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("RedDeath unknown sight sound");
    }
  };

  void WoundSound(void) {
    switch(IRnd()%3)
    {
        case 0: PlaySound(m_soSound, SOUND_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_WOUND2, SOF_3D); break;
        case 2: PlaySound(m_soSound, SOUND_WOUND3, SOF_3D); break;
        default: ASSERTALWAYS("RedDeath unknown wound sound");
    }
  };

  void DeathSound(void) {
    PlaySound(m_soSound, SOUND_DEATH, SOF_3D);
  };


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    switch(IRnd()%2)
    {
      case 0: jump SlashEnemySingle(); break;
      case 1: jump SlashEnemySingle2(); break;
      default: ASSERTALWAYS("Red Death unknown melee attack");
    }

    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    StartModelAnim(REDDEATH_ANIM_MELEE1, 0);
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 2.8f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, FLOAT3D(0, 0, 0), vDirection);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

  SlashEnemySingle2(EVoid) {
    // close attack
    StartModelAnim(REDDEATH_ANIM_MELEE2, 0);
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 2.8f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, FLOAT3D(0, 0, 0), vDirection);
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
    SetHealth(400.0f);
    m_fMaxHealth = 400.0f;
    m_fDamageWounded = 180.0f;
    m_iScore = 5000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        SetModel(MODEL_REDDEATH);
        SetModelMainTexture(TEXTURE_REDDEATH);
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

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};