/* Copyright (c) 2021-2024 Uni Musuotankarep
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

1033
%{
#include "StdH.h"
%}

uses "EntitiesMP/BasicEffects";

class CCustomFire: CMovableModelEntity {
name      "Custom Fire";
thumbnail "Thumbnails\\CustomFire.tbn";
features "HasName", "IsTargetable";
properties:

  1 CTString m_strName            "Name" 'N' = "Custom Fire",
  2 CTString m_strDescription = "",
  3 CTFileName m_fnmFireTexture  "Fire Texture" 'T' = CTFILENAME("Models\\Effects\\Flames\\Fire1.tex"),
  4 FLOAT m_fStretch "Stretch" = 1.0f,
  5 BOOL m_bActive "Active" = TRUE,
  6 FLOAT m_fHealth "Health" = 50.0f,
  7 BOOL m_bPlaySound "Play Sound" = TRUE,
  8 BOOL m_bGenerateSmoke "Generate Smoke" = TRUE,
  9 CSoundObject m_soSound,
 10 FLOAT m_fWaitTime = 0.0f,       // wait time
 11 FLOAT m_tmSpawn = 0.0f,  // when it was spawned
 12 BOOL m_bCauseDamage "Cause Damage" = TRUE,
 13 FLOAT m_fDamageAmount "Damage Amount" = 5.0f,
 14 RANGE m_fDamageFalloff "Damage Falloff" = 8.0f,
 15 RANGE m_fDamageHotSpot "Damage HotSpot" = 4.0f,
 16 FLOAT m_fDamageWait "Damage Wait" = 0.25f,
 17 FLOAT m_fSmokeStretch "Smoke Stretch" = 0.5f,
 18 CTFileName m_fnmFireSound  "Fire Sound" 'S' = CTFILENAME("SoundsMP\\Fire\\Burning.wav"),

  {
    CTextureObject m_toFire;
    CAutoPrecacheSound m_aps;
  }

components:
  1 class   CLASS_BASIC_EFFECT      "Classes\\BasicEffect.ecl",
  2 model   MODEL_FIRE              "Models\\Effects\\Flames\\Fire1.mdl",

functions:

  void Precache(void) {
    PrecacheClass(CLASS_BASIC_EFFECT, BET_FIRE_SMOKE);
    PrecacheModel(MODEL_FIRE);
    m_aps.Precache(m_fnmFireSound);
  }

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CMovableModelEntity::Read_t(istr);
    // setup beam texture
    m_toFire.SetData_t(m_fnmFireTexture);
  }

  void SetFireTexture(void)
  {
    try {
      m_toFire.SetData_t(m_fnmFireTexture);
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load fire texture: %s"), strError);
    }
  }

  // postmoving
  void PostMoving(void) {
    CMovableModelEntity::PostMoving();

    // if no air
    CContentType &ctDn = GetWorld()->wo_actContentTypes[en_iDnContent];
    // stop existing
    if (!(ctDn.ct_ulFlags&CTF_BREATHABLE_LUNGS)) {
      Destroy();
    }

    // never remove from list of movers
    en_ulFlags &= ~ENF_INRENDERING;
    // not moving in fact, only moving with its parent
    en_plLastPlacement = en_plPlacement;
  };

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
      if(dmtType != DMT_FREEZING && dmtType != DMT_DROWNING) { return; }
      CMovableModelEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
  };

  void CreateSmoke(void)
  {
    ESpawnEffect ese;

    // explosion smoke
    ese.betType = BET_FIRE_SMOKE;
    ese.vStretch = FLOAT3D(m_fSmokeStretch, m_fSmokeStretch, m_fSmokeStretch);
    ese.colMuliplier = C_WHITE|CT_OPAQUE;
    ese.vDirection = FLOAT3D( 0, 0, 0);
    SpawnEffect(GetPlacement(), ese);
  };

  // spawn effect
  void SpawnEffect(const CPlacement3D &plEffect, const class ESpawnEffect &eSpawnEffect)
  {
    CEntityPointer penEffect = CreateEntity(plEffect, CLASS_BASIC_EFFECT);
    penEffect->Initialize(eSpawnEffect);
  };

  // apply mirror and stretch to the entity
  void MirrorAndStretch(FLOAT fStretch, BOOL bMirrorX)
  {
    // stretch its ranges
    m_fDamageFalloff*=fStretch;
    m_fDamageHotSpot*=fStretch;
  }

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CCustomFire) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    slUsedMemory += m_strDescription.Length();
    slUsedMemory += m_fnmFireSound.Length();
    slUsedMemory += 1* sizeof(CSoundObject);
    return slUsedMemory;
  }

/************************************************************
 *                          MAIN                            *
 ************************************************************/

procedures:
  
  Active() {
    ASSERT(m_bActive);
    SwitchToModel();

    if(m_bPlaySound) {
      PlaySound(m_soSound, m_fnmFireSound, SOF_3D|SOF_LOOP);
    }

    //main loop
    while (TRUE) {
      if(m_bGenerateSmoke) {
        CreateSmoke();
      }

      wait(m_fDamageWait) {
        on (EBegin) : {
          resume;
        }
        // if deactivated
        on (EDeactivate) : {
          // go to inactive state
          m_bActive = FALSE;
          jump Inactive();
        }

        on (EDeath) : { Destroy(); return; }

        on (ETimer) : {
          if(m_bCauseDamage) {
            InflictRangeDamage(this, DMT_BURNING, m_fDamageAmount, GetPlacement().pl_PositionVector+FLOAT3D(0.0f, 0.5f, 0.0f), m_fDamageHotSpot, m_fDamageFalloff, DBPT_GENERIC);
          }
          stop;
        }
      }
    }
  };

  Inactive() {
    ASSERT(!m_bActive);
    SwitchToEditorModel();

    while (TRUE) {
      // wait 
      wait() {
        // if activated
        on (EActivate) : {
          // go to active state
          m_bActive = TRUE;
          jump Active();
        }

        on (EDeath) : { Destroy(); return; }

        otherwise() : {
          resume;
        };
      };
      
      // wait a bit to recover
      autowait(0.1f);
    }
  }

  Main(EVoid)
  {
    // fall off and hot spot must be positive values
    if (m_fDamageFalloff<0) {
      m_fDamageFalloff = 0.0f;
    }
    if (m_fDamageHotSpot<0) {
      m_fDamageHotSpot = 0.0f;
    }
    // hot spot must be less or equal falloff
    if (m_fDamageHotSpot>m_fDamageFalloff) {
      m_fDamageHotSpot = m_fDamageFalloff;
    }

    // set appearance
    if (m_bActive) {
      InitAsModel();
      SetPhysicsFlags(EPF_MODEL_FIXED);
      SetCollisionFlags(ECF_FLAME);
    } else {
      InitAsEditorModel();
      SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
      SetCollisionFlags(ECF_IMMATERIAL);
    }

    SetFlags(GetFlags()|ENF_SEETHROUGH);

    m_tmSpawn = _pTimer->CurrentTick();
    m_fWaitTime = 0.25f;

    SetHealth(m_fHealth);
    SetModel(MODEL_FIRE);

    // setup texture
    SetFireTexture();

    m_strDescription.PrintF("%s", (CTString&)m_fnmFireSound.FileName());

    try {
      GetModelObject()->mo_toTexture.SetData_t(m_fnmFireTexture);
    } catch (char *strError) {
      WarningMessage(strError);
    }

    // set model stretch
    GetModelObject()->StretchModel(FLOAT3D(m_fStretch, m_fStretch, m_fStretch));
    ModelChangeNotify();

    // spawn in world editor
    autowait(0.1f);

    // set sound default parameters
    m_soSound.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f);

    // go into active or inactive state
    if (m_bActive) {
      jump Active();
    } else {
      jump Inactive();
    }

    // cease to exist
    Destroy();
    return;
  }
};