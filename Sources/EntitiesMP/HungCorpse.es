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

1038
%{
#include "StdH.h"
#include "Models/NPCs/HungCorpse/HungCorpse.h"
%}

uses "EntitiesMP/EnemyBase";

enum HungCorpseType {
  0 HC_BROWN        "Brown",
  1 HC_BLACK        "Black",
};

%{

// info structure
static EntityInfo eiHungCorpse = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.0f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CHungCorpse: CEnemyBase {
name      "HungCorpse";
thumbnail "Thumbnails\\HungCorpse.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum HungCorpseType m_hcChar "Character" 'C' = HC_BROWN,   // character
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 model   MODEL_HUNGCORPSE		"Models\\NPCs\\HungCorpse\\HungCorpse.mdl",
  3 texture TEXTURE_HUNGCORPSE		"Models\\NPCs\\HungCorpse\\HungCorpse1.tex",
  4 texture TEXTURE_HUNGCORPSE2 	"Models\\NPCs\\HungCorpse\\HungCorpse1b.tex",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Hung Corpse bashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiHungCorpse;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmHungCorpse, "Data\\Messages\\NPCs\\HungCorpse.txt");
    return fnmHungCorpse;
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
    if (!IsOfClass(penInflictor, "HungCorpse")) {
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
    iAnim = HUNGCORPSE_ANIM_IDLE;
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
          iAnim = HUNGCORPSE_ANIM_DEFAULT;
        } else {
          iAnim = HUNGCORPSE_ANIM_DEFAULT;
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
    if(GetModelObject()->GetAnim()==HUNGCORPSE_ANIM_DEFAULT)
    {
      ChangeCollisionBoxIndexWhenPossible(HUNGCORPSE_COLLISION_BOX_DEFAULT);
    }
    else
    {
      ChangeCollisionBoxIndexWhenPossible(HUNGCORPSE_COLLISION_BOX_DEFAULT);
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(HUNGCORPSE_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(HUNGCORPSE_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
      StartModelAnim(HUNGCORPSE_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(HUNGCORPSE_ANIM_DEFAULT, AOF_LOOPING|AOF_NORESTART);
  };


  procedures:

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
    SetHealth(300.0f);
    m_fMaxHealth = 300.0f;
    m_fDamageWounded = 180.0f;
    m_iScore = 5000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        switch(m_hcChar)
        {
          case HC_BROWN:
          {
            SetModel(MODEL_HUNGCORPSE);
            SetModelMainTexture(TEXTURE_HUNGCORPSE);
            GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
            ModelChangeNotify();
            break;
          }
          case HC_BLACK:
          {
            SetModel(MODEL_HUNGCORPSE);
            SetModelMainTexture(TEXTURE_HUNGCORPSE2);
            GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
            ModelChangeNotify();
            break;
          }
        }

        m_fWalkSpeed = FRnd() + 1.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 3.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 3.0f;
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