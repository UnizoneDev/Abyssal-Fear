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

1046
%{
#include "StdH.h"

#include "EntitiesMP/Player.h"

#include "Models/NPCs/WastePeople/WasterMale.h"
#include "Models/NPCs/WastePeople/WasterSword.h"
#include "Models/NPCs/WastePeople/WasterKnife.h"
%}

uses "EntitiesMP/EnemyDive";

enum WastePersonType {
  0 WPC_BROWNMALE        "Brown Haired Male Sword",
  1 WPC_BLACKMALE        "Black Haired Male Sword",
  2 WPC_BROWNMALEKNIFE   "Brown Haired Male Knife",
  3 WPC_BLACKMALEKNIFE   "Black Haired Male Knife",
};

%{

// info structure
static EntityInfo eiWastePerson = {
  EIBT_FLESH, 400.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

static EntityInfo eiWastePersonSwim = {
  EIBT_FLESH, 100.0f,
  0.0f, 0.0f, 0.0f,     // source (eyes)
  0.0f, 0.0f, 0.0f,     // target (body)
};

%}

class CWastePerson: CEnemyDive {
name      "WastePerson";
thumbnail "Thumbnails\\WastePerson.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum WastePersonType m_wpChar "Character" 'C' = WPC_BROWNMALE,   // character
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyDive.ecl",
  2 model   MODEL_WASTERMALE		"Models\\NPCs\\WastePeople\\WasterMale\\WasterMale.mdl",
  3 texture TEXTURE_WASTERMALE		"Models\\NPCs\\WastePeople\\WasterMale\\WasterMale1.tex",
  6 texture TEXTURE_WASTERMALE2 	"Models\\NPCs\\WastePeople\\WasterMale\\WasterMale2.tex",
  4 model   MODEL_WASTERSWORD		"Models\\NPCs\\WastePeople\\WasterWeapons\\WasterSword.mdl",
  5 texture TEXTURE_WASTERSWORD		"Models\\NPCs\\WastePeople\\WasterWeapons\\WasterSword.tex",
  7 model   MODEL_WASTERKNIFE		"Models\\NPCs\\WastePeople\\WasterWeapons\\WasterKnife.mdl",

  10 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  11 sound   SOUND_SLICE1           "Models\\NPCs\\Twitcher\\Sounds\\Slice1.wav",
  12 sound   SOUND_SLICE2           "Models\\NPCs\\Twitcher\\Sounds\\Slice2.wav",
  13 sound   SOUND_SLICE3           "Models\\NPCs\\Twitcher\\Sounds\\Slice3.wav",
  14 sound   SOUND_CLASH1           "Sounds\\Weapons\\MetalBladeClash1.wav",
  15 sound   SOUND_CLASH2           "Sounds\\Weapons\\MetalBladeClash2.wav",
  16 sound   SOUND_CLASH3           "Sounds\\Weapons\\MetalBladeClash3.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Waste Person sliced %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    if (m_bInLiquid) {
      return &eiWastePersonSwim;
    } else {
      return &eiWastePerson;
    }
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmWastePerson, "Data\\Messages\\NPCs\\WastePerson.txt");
    return fnmWastePerson;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_SLICE1);
    PrecacheSound(SOUND_SLICE2);
    PrecacheSound(SOUND_SLICE3);
    PrecacheSound(SOUND_CLASH1);
    PrecacheSound(SOUND_CLASH2);
    PrecacheSound(SOUND_CLASH3);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_wpChar) {
    case WPC_BROWNMALE: { pes->es_strName+=" Brown Hair"; } break;
    case WPC_BLACKMALE: { pes->es_strName+=" Black Hair"; } break;
    case WPC_BROWNMALEKNIFE: { pes->es_strName+=" Brown Hair Knife"; } break;
    case WPC_BLACKMALEKNIFE: { pes->es_strName+=" Black Hair Knife"; } break;
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "WastePerson")) {
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
    if (m_bInLiquid) {
      iAnim = WASTERMALE_ANIM_SWIMWOUND;
    } else {
      iAnim = WASTERMALE_ANIM_WOUNDSWORD;
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

    if (m_bInLiquid) {
      iAnim = WASTERMALE_ANIM_SWIMDEATH;
    } else {
      if (fDamageDir<0) {
        iAnim = WASTERMALE_ANIM_DEATHFRONT;
      } else {
        iAnim = WASTERMALE_ANIM_DEATHBACK;
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
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, 30.0f));

    if (m_bInLiquid) {
      ChangeCollisionBoxIndexWhenPossible(WASTERMALE_COLLISION_BOX_SWIM_DEFAULT);
    } else {
      if(GetModelObject()->GetAnim()==WASTERMALE_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(WASTERMALE_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else
      {
        ChangeCollisionBoxIndexWhenPossible(WASTERMALE_COLLISION_BOX_DEATHBOX_BACK);
      }
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    if (m_bInLiquid) {
      StartModelAnim(WASTERMALE_ANIM_SWIMIDLE, AOF_LOOPING|AOF_NORESTART);
    } else {
      StartModelAnim(WASTERMALE_ANIM_STANDSWORD, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void WalkingAnim(void) {
    if (m_bInLiquid) {
      StartModelAnim(WASTERMALE_ANIM_SWIMMOVE, AOF_LOOPING|AOF_NORESTART);
    } else {
      StartModelAnim(WASTERMALE_ANIM_WALKSWORD, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RunningAnim(void) {
    if (m_bInLiquid) {
      StartModelAnim(WASTERMALE_ANIM_SWIMMOVE, AOF_LOOPING|AOF_NORESTART);
    } else {
      StartModelAnim(WASTERMALE_ANIM_RUNSWORD, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void BacksteppingAnim(void) {
    if (m_bInLiquid) {
      StartModelAnim(WASTERMALE_ANIM_SWIMMOVE, AOF_LOOPING|AOF_NORESTART);
    } else {
      StartModelAnim(WASTERMALE_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void JumpingAnim(void) {
    StartModelAnim(WASTERMALE_ANIM_JUMPSWORD, AOF_LOOPING|AOF_NORESTART);
  };

  void ChangeCollisionToLiquid() {
    ChangeCollisionBoxIndexWhenPossible(WASTERMALE_COLLISION_BOX_SWIM_DEFAULT);
  };

  void ChangeCollisionToGround() {
    ChangeCollisionBoxIndexWhenPossible(WASTERMALE_COLLISION_BOX_DEFAULT);
  };

  procedures:

  BlockEnemyMelee(EVoid) {
    if(m_wpChar == WPC_BROWNMALEKNIFE || m_wpChar == WPC_BLACKMALEKNIFE) {
      return EReturn();
    }

    StartModelAnim(WASTERMALE_ANIM_BLOCK1, 0);

    autowait(0.25f);

    m_bIsBlocking = TRUE;

    autowait(1.25f);

    m_bIsBlocking = FALSE;

    autowait(0.25f);

    return EReturn();
  }

  // melee attack enemy
  GroundHit(EVoid) : CEnemyDive::GroundHit {
    jump WasterMaleSlash();
    return EReturn();
  };

  DiveHit(EVoid) : CEnemyDive::DiveHit {
    jump WasterMaleSlashSwim();
    return EReturn();
  };

  WasterMaleSlash(EVoid) {

    INDEX iRandomChoice = IRnd()%4;

    if(iRandomChoice == 1)
    {
      autocall BlockEnemyMelee() EReturn;
      return EReturn();
    }

    switch(IRnd()%6)
    {
      case 0: StartModelAnim(WASTERMALE_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(WASTERMALE_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(WASTERMALE_ANIM_MELEE3, 0); break;
      case 3: StartModelAnim(WASTERMALE_ANIM_MELEE4, 0); break;
      case 4: StartModelAnim(WASTERMALE_ANIM_MELEE5, 0); break;
      case 5: StartModelAnim(WASTERMALE_ANIM_MELEE6, 0); break;
      default: ASSERTALWAYS("Waster unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        if(m_wpChar == WPC_BROWNMALE || m_wpChar == WPC_BLACKMALE) {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  WasterMaleSlashSwim(EVoid) {

    if (CalcDist(m_penEnemy) > m_fCloseDistance) {
      // run to enemy
      m_fShootTime = _pTimer->CurrentTick() + 0.25f;
      return EReturn();
    }

    switch(IRnd()%2)
    {
      case 0: StartModelAnim(WASTERMALE_ANIM_SWIMMELEE1, 0); break;
      case 1: StartModelAnim(WASTERMALE_ANIM_SWIMMELEE2, 0); break;
      default: ASSERTALWAYS("Waster unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        if(m_wpChar == WPC_BROWNMALE || m_wpChar == WPC_BLACKMALE) {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
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
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS|EPF_HASGILLS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_LESSER;
    SetHealth(200.0f);
    m_fMaxHealth = 200.0f;
    m_fDamageWounded = 90.0f;
    m_iScore = 10000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 1000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
        SetModel(MODEL_WASTERMALE);
        switch(m_wpChar) {
          case WPC_BROWNMALE:
            SetModelMainTexture(TEXTURE_WASTERMALE);
            AddAttachment(WASTERMALE_ATTACHMENT_SWORD, MODEL_WASTERSWORD, TEXTURE_WASTERSWORD);
          break;
          case WPC_BLACKMALE:
            SetModelMainTexture(TEXTURE_WASTERMALE2);
            AddAttachment(WASTERMALE_ATTACHMENT_SWORD, MODEL_WASTERSWORD, TEXTURE_WASTERSWORD);
          break;
          case WPC_BROWNMALEKNIFE:
            SetModelMainTexture(TEXTURE_WASTERMALE);
            AddAttachment(WASTERMALE_ATTACHMENT_KNIFE, MODEL_WASTERKNIFE, TEXTURE_WASTERSWORD);
          break;
          case WPC_BLACKMALEKNIFE:
            SetModelMainTexture(TEXTURE_WASTERMALE2);
            AddAttachment(WASTERMALE_ATTACHMENT_KNIFE, MODEL_WASTERKNIFE, TEXTURE_WASTERSWORD);
          break;
        }

        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 3.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*20.0f + 525.0f);
        m_fAttackRunSpeed = FRnd() + 6.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 275.0f);
        m_fCloseRunSpeed = FRnd() + 6.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 275.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 3.0f;
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;

        // dive moving properties
        m_fDiveWalkSpeed = FRnd() + 4.5f;
        m_aDiveWalkRotateSpeed = FRnd()*10.0f + 550.0f;
        m_fDiveAttackRunSpeed = FRnd() + 7.5f;
        m_aDiveAttackRotateSpeed = FRnd()*25 + 300.0f;
        m_fDiveCloseRunSpeed = FRnd() + 7.5f;
        m_aDiveCloseRotateSpeed = FRnd()*50 + 300.0f;

        // attack properties
        m_fDiveAttackDistance = 100.0f;
        m_fDiveCloseDistance = 3.0f;
        m_fDiveStopDistance = 0.0f;
        m_fDiveAttackFireTime = 3.0f;
        m_fDiveCloseFireTime = 2.0f;
        m_fDiveIgnoreRange = 200.0f;


        // damage/explode properties
        m_fBlowUpAmount = 100.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyDive::MainLoop();
  };
};