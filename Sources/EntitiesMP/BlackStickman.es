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

1002
%{
#include "StdH.h"
#include "Models/NPCs/BlackStickman/BlackStickman.h"
#include "Models/NPCs/BlackStickman/BlackStickmanReflective.h"
#include "Models/NPCs/BlackStickman/BlackStickmanTranslucent.h"
%}

uses "EntitiesMP/EnemyBase";

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

#define MIPRATIO 0.003125f //(2*tan(90/2))/640

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
  31 FLOAT m_fMipAdd "Mip Add" = 0.0f,
  32 FLOAT m_fMipMul "Mip Mul" = 1.0f,
  //33 FLOAT m_fMipFadeDist "Mip Fade Dist" = 0.0f,
  //34 FLOAT m_fMipFadeLen  "Mip Fade Len" = 0.0f,
  33 FLOAT m_fMipFadeDist = 0.0f,
  34 FLOAT m_fMipFadeLen  = 0.0f,
  35 RANGE m_rMipFadeDistMetric "Mip Fade Dist (Metric)" = 128.0f,
  36 FLOAT m_fMipFadeLenMetric  "Mip Fade Len (Metric)" = 16.0f,
  
components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",

 10 model   MODEL_BLACKSTICKMAN             "Models\\NPCs\\BlackStickman\\BlackStickman.mdl",


 20 texture TEXTURE_BLACKSTICKMAN           "Models\\NPCs\\BlackStickman\\blackstickman.tex",
 21 model   MODEL_BLACKSTICKMANREFLECTIVE   "Models\\NPCs\\BlackStickman\\BlackStickmanReflective.mdl",
 22 model   MODEL_BLACKSTICKMANTRANSLUCENT  "Models\\NPCs\\BlackStickman\\BlackStickmanTranslucent.mdl",
 23 texture TEXTURE_VANTABLACKSTICKMAN      "Models\\NPCs\\BlackStickman\\vantablackstickman.tex",
 24 texture TEX_BUMP_DETAIL                 "Models\\NPCs\\BlackStickman\\BlackStickmanDetail.tex",


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
       dmtType==DMT_PROJECTILE||
       dmtType==DMT_CANNONBALL||
       dmtType==DMT_CANNONBALL_EXPLOSION||
       dmtType==DMT_PELLET||
       dmtType==DMT_AXE)
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
    ChangeCollisionBoxIndexWhenPossible(BLACKSTICKMAN_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 500.0f;
  };

  void ChooseAnimBSAT(void) {
    switch(m_bsatType)
    {
        case BSAT_WALK: StartModelAnim(BLACKSTICKMAN_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
        break;
        case BSAT_RUN: StartModelAnim(BLACKSTICKMAN_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
        break;
        case BSAT_FLY: StartModelAnim(BLACKSTICKMAN_ANIM_FLY, AOF_LOOPING|AOF_NORESTART);
        break;
    }
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(BLACKSTICKMAN_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
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


  /* Adjust model mip factor if needed. */
  void AdjustMipFactor(FLOAT &fMipFactor)
  {
    // if should fade last mip
    if (m_fMipFadeDist>0) {
      CModelObject *pmo = GetModelObject();
      if(pmo==NULL) {
        return;
      }
      // adjust for stretch
      FLOAT fMipForFade = fMipFactor;
      // TODO: comment the next 3 lines for mip factors conversion
      /*if (pmo->mo_Stretch != FLOAT3D(1,1,1)) {
        fMipForFade -= Log2( Max(pmo->mo_Stretch(1),Max(pmo->mo_Stretch(2),pmo->mo_Stretch(3))));
      }*/

      // if not visible
      if (fMipForFade>m_fMipFadeDist) {
        // set mip factor so that model is never rendered
        fMipFactor = UpperLimit(0.0f);
        return;
      }

      // adjust fading
      FLOAT fFade = (m_fMipFadeDist-fMipForFade);
      if (m_fMipFadeLen>0) {
        fFade/=m_fMipFadeLen;
      } else {
        if (fFade>0) {
          fFade = 1.0f;
        }
      }
      
      fFade = Clamp(fFade, 0.0f, 1.0f);
      // make it invisible
      pmo->mo_colBlendColor = (pmo->mo_colBlendColor&~255)|UBYTE(255*fFade);
    }

    fMipFactor = fMipFactor*m_fMipMul+m_fMipAdd;
  }


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

      autocall RandomWander() EReturn;
    }
  }


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
      FLOAT fSpeedX = 0.0f;
      FLOAT fSpeedY = 0.0f;
      FLOAT fSpeedZ = 0.0f;
      m_vDesiredPosition = FLOAT3D(0.0f, 0.0f, 0.0f);
      StandingAnim();
    }
    

    // ------------ While wandering, adjust directions and randomize
    while (TRUE)
    {
      // adjust direction and speed only if moving
      if(m_bsbtType != BSBT_STARE) {
        m_fMoveSpeed = 0.0f;
        m_aRotateSpeed = FRnd()+40.0f-120.0f;
        FLOAT3D vTranslation = GetDesiredTranslation();
        SetDesiredMovement(); 
        SetDesiredTranslation(vTranslation);
      }

      ANGLE aHeadingRotation;
      
      if(m_bsbtType != BSBT_STARE)
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

      if(m_bsbtType != BSBT_STARE) {
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
    InitAsModel();

    // TODO: decomment this AFTER mip factors conversion
    if (m_fMipFadeLenMetric>m_rMipFadeDistMetric) { m_fMipFadeLenMetric = m_rMipFadeDistMetric; }
    // TODO: decomment this for mip factors conversion
    /*if (m_fMipFadeLen<0.0f) { m_fMipFadeLen = 0.0f; }
    if (m_fMipFadeDist<0.0f) { m_fMipFadeDist = 0.0f; }
    if (m_fMipFadeLen>m_fMipFadeDist) { m_fMipFadeLen = m_fMipFadeDist; }

    // if metric mip values are not initialized, get values from old mip factors
    if ( m_fMipFadeDist>0.0f ) {
      CModelObject *pmo = GetModelObject();
      if (pmo!=NULL) {
        FLOAT fMipSizeFact = Log2( Max(pmo->mo_Stretch(1),Max(pmo->mo_Stretch(2),pmo->mo_Stretch(3))));
        m_rMipFadeDistMetric = pow(2.0f, m_fMipFadeDist+fMipSizeFact)/(1024.0f*MIPRATIO);
        m_fMipFadeLenMetric  = m_rMipFadeDistMetric - pow(2.0f, m_fMipFadeDist+fMipSizeFact-m_fMipFadeLen)/(1024.0f*MIPRATIO);
      } else {
        m_rMipFadeDistMetric = 0.0f;
        m_fMipFadeLenMetric  = 0.0f;
      }      
    } else {
      m_rMipFadeDistMetric = 0.0f;
      m_fMipFadeLenMetric  = 0.0f;     
    }*/
    
    // convert metric factors to mip factors
    if (m_rMipFadeDistMetric>0.0f) {
      m_fMipFadeDist = Log2(m_rMipFadeDistMetric*1024.0f*MIPRATIO);
      m_fMipFadeLen  = Log2((m_rMipFadeDistMetric+m_fMipFadeLenMetric)*1024.0f*MIPRATIO) - m_fMipFadeDist;
    } else {
      m_fMipFadeDist = 0.0f;
      m_fMipFadeLen  = 0.0f;
    }

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
      SetModel(MODEL_BLACKSTICKMAN);
      SetModelMainTexture(TEXTURE_BLACKSTICKMAN);
      break;

      case BSCT_NORMAL:
      SetModel(MODEL_BLACKSTICKMAN);
      SetModelMainTexture(TEXTURE_BLACKSTICKMAN);
      SetModelBumpTexture(TEX_BUMP_DETAIL);
      break;

      case BSCT_TRANSLUCENT:
      SetModel(MODEL_BLACKSTICKMANTRANSLUCENT);
      SetModelMainTexture(TEXTURE_VANTABLACKSTICKMAN);
      break;

      case BSCT_REFLECTIVE:
      SetModel(MODEL_BLACKSTICKMANREFLECTIVE);
      SetModelMainTexture(TEXTURE_VANTABLACKSTICKMAN);
      SetModelSpecularTexture(TEX_SPEC_STRONG);
      SetModelReflectionTexture(TEX_REFL_PURPLE01);
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
    GetModelObject()->StretchModel(FLOAT3D(1.0f, 1.0f, 1.0f));
    ModelChangeNotify();
    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};