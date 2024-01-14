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

1036
%{
#include "StdH.h"
#include "Models/NPCs/Shambler/Shambler1.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum ShamblerSleepPositionType {
  0 SSP_FRONT      "Sleep Front",
  1 SSP_BACK       "Sleep Back",
};

enum ShamblerType {
  0 SHC_NORMAL1   "Normal 1",    // standard variant 1
  1 SHC_NORMAL2   "Normal 2",    // standard variant 2
};

%{

// info structure
static EntityInfo eiShambler = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CShambler: CEnemyBase {
name      "Shambler";
thumbnail "Thumbnails\\Shambler.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 BOOL m_bSleeping "Sleeping" 'S' = FALSE,  // set to make shambler sleep initally
  3 enum ShamblerSleepPositionType m_sspType "Sleep Position" = SSP_FRONT,
  4 enum ShamblerType m_shChar "Character" 'C' = SHC_NORMAL1,      // character
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE        "Classes\\Projectile.ecl",
  10 model   MODEL_SHAMBLER1		"Models\\NPCs\\Shambler\\Shambler1\\Shambler1.mdl",
  11 texture TEXTURE_SHAMBLER1		"Models\\NPCs\\Shambler\\Shambler1.tex",
  12 texture TEXTURE_SHAMBLER2		"Models\\NPCs\\Shambler\\Shambler2.tex",

  50 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  51 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  52 sound   SOUND_IDLE             "Models\\NPCs\\Shambler\\Sounds\\Idle.wav",
  53 sound   SOUND_SIGHT1           "Models\\NPCs\\Shambler\\Sounds\\Sight1.wav",
  54 sound   SOUND_SIGHT2           "Models\\NPCs\\Shambler\\Sounds\\Sight2.wav",
  55 sound   SOUND_WOUND            "Models\\NPCs\\Shambler\\Sounds\\Wound.wav",
  56 sound   SOUND_DEATH1           "Models\\NPCs\\Shambler\\Sounds\\Death1.wav",
  57 sound   SOUND_DEATH2           "Models\\NPCs\\Shambler\\Sounds\\Death2.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Shambler ruined %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiShambler;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmShambler, "Data\\Messages\\NPCs\\Shambler.txt");
    return fnmShambler;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_IDLE);
    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_SIGHT2);
    PrecacheSound(SOUND_WOUND);
    PrecacheSound(SOUND_DEATH1);
    PrecacheSound(SOUND_DEATH2);
    PrecacheClass(CLASS_PROJECTILE, PRT_MUTANT_SPIT);
    PrecacheClass(CLASS_PROJECTILE, PRT_SHAMBLER_BLOOD_BUNDLE);
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
    if (!IsOfClass(penInflictor, "Shambler")) {
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
    iAnim = SHAMBLER1_ANIM_WOUND;
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
        iAnim = SHAMBLER1_ANIM_DEATHFRONT;
      } else {
        iAnim = SHAMBLER1_ANIM_DEATHBACK;
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

    if(GetModelObject()->GetAnim()==SHAMBLER1_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(SHAMBLER1_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else
    {
      ChangeCollisionBoxIndexWhenPossible(SHAMBLER1_COLLISION_BOX_BACKDEATH_BOX);
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(SHAMBLER1_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(SHAMBLER1_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
    StartModelAnim(SHAMBLER1_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(SHAMBLER1_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
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
      default: ASSERTALWAYS("Shambler unknown sight sound");
    }
  };

  void WoundSound(void) {
    PlaySound(m_soSound, SOUND_WOUND, SOF_3D);
  };

  void DeathSound(void) {
    switch(IRnd()%2)
    {
      case 0: PlaySound(m_soSound, SOUND_DEATH1, SOF_3D); break;
      case 1: PlaySound(m_soSound, SOUND_DEATH2, SOF_3D); break;
      default: ASSERTALWAYS("Shambler unknown death sound");
    }
  };


  procedures:


  Fire(EVoid) : CEnemyBase::Fire
  {
    if (CalcDist(m_penEnemy) < 8.0f) {
      autocall Shambler1SpitAttack() EEnd;
      return EReturn();
    } else if (CalcDist(m_penEnemy) < 20.0f) {
      autocall Shambler1ThrowAttack() EEnd;
      return EReturn();
    }

    return EReturn();
  };

  // Shambler 1 Blood Spit Attack
  Shambler1SpitAttack(EVoid) {
    autowait(0.25f + FRnd()/4);

    StartModelAnim(SHAMBLER1_ANIM_SPIT, 0);

    autowait(0.375f);
    ShootProjectile(PRT_MUTANT_SPIT, FLOAT3D(0.0f, 1.75f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_HIT, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };

  // Shambler 1 Blood Bundle Throw Attack
  Shambler1ThrowAttack(EVoid) {
    // don't shoot if enemy above or below you too much
    if ( !IsInFrustum(m_penEnemy, CosFast(80.0f)) ) {
      return EEnd();
    }

    autowait(0.25f + FRnd()/4);

    switch(IRnd()%2)
    {
      case 0: 
      {
        StartModelAnim(SHAMBLER1_ANIM_THROW1, 0);
      };
      break;
      case 1:
      {
        StartModelAnim(SHAMBLER1_ANIM_THROW2, 0);
      };
      break;
      default: ASSERTALWAYS("Shambler unknown throw animation");
    }

    autowait(0.375f);
    ShootProjectile(PRT_SHAMBLER_BLOOD_BUNDLE, FLOAT3D(0.0f, 1.5f, -1.5f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_HIT, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    jump SlashEnemySingle();

    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    switch(IRnd()%2)
    {
      case 0: StartModelAnim(SHAMBLER1_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(SHAMBLER1_ANIM_MELEE2, 0); break;
      default: ASSERTALWAYS("Shambler unknown melee animation");
    }
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 2.8f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 6.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

  Sleep(EVoid)
  {
    // start sleeping anim
    if(m_sspType == SSP_FRONT) {
      StartModelAnim(SHAMBLER1_ANIM_DEADFRONT, AOF_LOOPING);
      ChangeCollisionBoxIndexWhenPossible(SHAMBLER1_COLLISION_BOX_FRONTDEATH_BOX);
    } else {
      StartModelAnim(SHAMBLER1_ANIM_DEADBACK, AOF_LOOPING);
      ChangeCollisionBoxIndexWhenPossible(SHAMBLER1_COLLISION_BOX_BACKDEATH_BOX);
    }
    
    // repeat
    wait() {
      // if triggered
      on(ETrigger eTrigger) : {
        // remember enemy
        SetTargetSoft(eTrigger.penCaused);
        // wake up
        jump WakeUp();
      }
      on(ETouch eTouch) : {
        if(IsDerivedFromClass(eTouch.penOther, "Enemy Base") || IsOfClass(eTouch.penOther, "Player")) {
          jump WakeUp();
        }
      }
      on(ESound eSound) : {
        // if deaf then ignore the sound
        if (m_bDeaf) {
          resume;
        }

        // if the target is visible and can be set as new enemy
        if (IsVisible(eSound.penTarget) && SetTargetSoft(eSound.penTarget)) {
          // react to it
          jump WakeUp();
        }
      }
      // if damaged
      on(EDamage eDamage) : {
        // wake up
        jump WakeUp();
      }
      otherwise() : {
        resume;
      }
    }
  }

  WakeUp(EVoid)
  {
    SetTargetHardForce(m_penEnemy);

    // wakeup anim
    SightSound();
    ChangeCollisionBoxIndexWhenPossible(SHAMBLER1_COLLISION_BOX_DEFAULT);

    if(m_sspType == SSP_FRONT) {
      StartModelAnim(SHAMBLER1_ANIM_GETUPFRONT, 0);
    } else {
      StartModelAnim(SHAMBLER1_ANIM_GETUPBACK, 0);
    }

    autowait(GetModelObject()->GetCurrentAnimLength());

    // trigger your target
    SendToTarget(m_penDeathTarget, m_eetDeathType);
    // proceed with normal functioning
    return EReturn();
  }

  // overridable called before main enemy loop actually begins
  PreMainLoop(EVoid) : CEnemyBase::PreMainLoop
  {
    // if sleeping
    if (m_bSleeping) {
      m_bSleeping = FALSE;
      // go to sleep until waken up
      wait() {
        on (EBegin) : {
          call Sleep();
        }
        on (EReturn) : {
          stop;
        };
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
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_LESSER;
    SetHealth(150.0f);
    m_fMaxHealth = 150.0f;
    m_fDamageWounded = 60.0f;
    m_iScore = 2500;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 1000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        switch(m_shChar) {
          case SHC_NORMAL1:
          SetModel(MODEL_SHAMBLER1);
          SetModelMainTexture(TEXTURE_SHAMBLER1);
          break;
          case SHC_NORMAL2:
          SetModel(MODEL_SHAMBLER1);
          SetModelMainTexture(TEXTURE_SHAMBLER2);
          break;
        }

        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 2.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 4.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 4.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 3.0f;
        m_fStopDistance = 1.5f;
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