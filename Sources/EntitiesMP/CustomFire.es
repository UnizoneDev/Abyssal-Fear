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
#include "Models/Effects/UniFire1/Fire1.h"
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
  5 BOOL m_bActive "Active" 'A' = TRUE,
  6 FLOAT m_fHealth "Health" = 50.0f,
  7 BOOL m_bPlaySound "Play Sound" = TRUE,
  8 BOOL m_bGenerateSmoke "Generate Smoke" = TRUE,
  9 CSoundObject m_soSound,
 10 BOOL m_bCauseDamage "Cause Damage" = TRUE,
 11 FLOAT m_fDamageAmount "Damage Amount" = 5.0f,
 12 RANGE m_fDamageFalloff "Damage Falloff" = 8.0f,
 13 RANGE m_fDamageHotSpot "Damage HotSpot" = 4.0f,
 14 FLOAT m_fDamageWait "Damage Wait" = 0.25f,
 15 FLOAT m_fSmokeStretch "Smoke Stretch" = 0.5f,
 16 CTFileName m_fnmFireSound  "Fire Sound" 'S' = CTFILENAME("Sounds\\Ambient\\Nature\\Fire1.wav"),
 17 RANGE m_rSoundFalloff "Sound Falloff" 'F' = 20.0f,
 18 RANGE m_rSoundHotSpot "Sound HotSpot" 'H' = 10.0f,
 19 FLOAT m_fSoundVolume "Sound Volume" 'V' = 1.0f,
 20 FLOAT m_fSoundPitch "Sound Pitch" 'P' = 1.0f,
 21 FLOAT m_fDamageHeight "Damage Height" = 0.5f,
 22 BOOL m_bAnimOnOff "Use On Off Anims" = FALSE,
 23 FLOAT m_fSmokeHeight "Smoke Height" = 0.25f,

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

    CPlacement3D pl = GetPlacement(); 
    pl.pl_PositionVector+FLOAT3D(0.0f, m_fSmokeHeight, 0.0f);
    SpawnEffect(pl, ese);
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
    m_rSoundFalloff*=fStretch;
    m_rSoundHotSpot*=fStretch;
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

    if(m_bAnimOnOff) {
      StartModelAnim(FIRE1_ANIM_FIREON, 0);
      autowait(GetModelObject()->GetCurrentAnimLength());
    }

    StartModelAnim(FIRE1_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);

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
            InflictRangeDamage(this, DMT_BURNING, m_fDamageAmount, GetPlacement().pl_PositionVector+FLOAT3D(0.0f, m_fDamageHeight, 0.0f), m_fDamageHotSpot, m_fDamageFalloff, DBPT_GENERIC);
          }
          stop;
        }
      }
    }
  };

  Inactive() {
    ASSERT(!m_bActive);
    SwitchToEditorModel();

    if(m_bAnimOnOff) {
      StartModelAnim(FIRE1_ANIM_FIREOFF, 0);
      autowait(GetModelObject()->GetCurrentAnimLength());
    }

    StartModelAnim(FIRE1_ANIM_FIRENOTBURNING, AOF_LOOPING|AOF_NORESTART);

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

    // validate range
    if (m_rSoundHotSpot<0.0f) { m_rSoundHotSpot = 0.0f; }
    if (m_rSoundFalloff<m_rSoundHotSpot) { m_rSoundFalloff = m_rSoundHotSpot; }

    // validate volume
    if (m_fSoundVolume<FLOAT(SL_VOLUME_MIN)) { m_fSoundVolume = FLOAT(SL_VOLUME_MIN); }
    if (m_fSoundVolume>FLOAT(SL_VOLUME_MAX)) { m_fSoundVolume = FLOAT(SL_VOLUME_MAX); }
    // validate pitch
    if (m_fSoundPitch < FLOAT(SL_PITCH_MIN)) { m_fSoundPitch = FLOAT(SL_PITCH_MIN); }
    if (m_fSoundPitch > FLOAT(SL_PITCH_MAX)) { m_fSoundPitch = FLOAT(SL_PITCH_MAX); }

    // set appearance
    if (m_bActive) {
      InitAsModel();
      SetPhysicsFlags(EPF_MODEL_FIXED);
      SetCollisionFlags(ECF_FLAME);
    } else {
      if(m_bAnimOnOff) {
        InitAsEditorModel();
      }
      SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
      SetCollisionFlags(ECF_IMMATERIAL);
    }

    SetFlags(GetFlags()|ENF_SEETHROUGH);

    SetHealth(m_fHealth);
    SetModel(MODEL_FIRE);
    StartModelAnim(FIRE1_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);

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
    m_soSound.Set3DParameters(FLOAT(m_rSoundFalloff), FLOAT(m_rSoundHotSpot), m_fSoundVolume, m_fSoundPitch);

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