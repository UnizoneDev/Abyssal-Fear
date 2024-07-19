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

1056
%{
#include "StdH.h"
%}

uses "EntitiesMP/BasicEffects";

class CCustomExplosion: CRationalEntity {
name      "CustomExplosion";
thumbnail "Thumbnails\\CustomExplosion.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName            "Name" 'N' = "Custom Explosion",
  2 CTString m_strDescription = "",
  3 FLOAT m_fStretch "Stretch" 'S' = 1.0f,
  4 FLOAT m_fDamageAmount "Damage Amount" 'A' = 100.0f,
  5 RANGE m_fDamageFalloff "Damage Falloff" 'F' = 8.0f,
  6 RANGE m_fDamageHotSpot "Damage HotSpot" 'H' = 4.0f,
  7 FLOAT m_fDamageHeight "Damage Height" = 1.0f,
  8 BOOL m_bGenerateStain "Generate Stain" 'G' = FALSE,

components:

  1 model   MODEL_MARKER        "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER      "Models\\Editor\\Vector.tex",
  3 class   CLASS_BASIC_EFFECT  "Classes\\BasicEffect.ecl"

functions:

  void Precache(void) {
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIVEBARREL);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSION_DEBRIS);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSION_SMOKE);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIONSTAIN);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_SHOCKWAVE);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIVEBARREL_PLANE);
  }

  // apply mirror and stretch to the entity
  void MirrorAndStretch(FLOAT fStretch, BOOL bMirrorX)
  {
    // stretch its ranges
    m_fDamageFalloff*=fStretch;
    m_fDamageHotSpot*=fStretch;
  }

// spawn effect
  void SpawnEffect(const CPlacement3D &plEffect, const class ESpawnEffect &eSpawnEffect)
  {
    CEntityPointer penEffect = CreateEntity(plEffect, CLASS_BASIC_EFFECT);
    penEffect->Initialize(eSpawnEffect);
  };

  void GenericExplosion(void) {
  ESpawnEffect ese;
  FLOAT3D vPoint;
  FLOATplane3D vPlaneNormal;
  FLOAT fDistanceToEdge;

  // explosion
  ese.colMuliplier = C_WHITE|CT_OPAQUE;
  ese.betType = BET_EXPLOSIVEBARREL;
  ese.vStretch = FLOAT3D(m_fStretch,m_fStretch,m_fStretch);
  SpawnEffect(GetPlacement(), ese);

  // explosion debris
  ese.betType = BET_EXPLOSION_DEBRIS;
  SpawnEffect(GetPlacement(), ese);

  // explosion smoke
  ese.betType = BET_EXPLOSION_SMOKE;
  SpawnEffect(GetPlacement(), ese);

  // on plane
  if(m_bGenerateStain) {
    if (GetNearestPolygon(vPoint, vPlaneNormal, fDistanceToEdge)) {
      if ((vPoint-GetPlacement().pl_PositionVector).Length() < 3.5f) {
        // stain
        ese.betType = BET_EXPLOSIONSTAIN;
        ese.vNormal = FLOAT3D(vPlaneNormal);
        SpawnEffect(CPlacement3D(vPoint, ANGLE3D(0, 0, 0)), ese);
        // shock wave
        ese.betType = BET_SHOCKWAVE;
        ese.vNormal = FLOAT3D(vPlaneNormal);
        SpawnEffect(CPlacement3D(vPoint, ANGLE3D(0, 0, 0)), ese);
        // second explosion on plane
        ese.betType = BET_EXPLOSIVEBARREL_PLANE;
        ese.vNormal = FLOAT3D(vPlaneNormal);
        SpawnEffect(CPlacement3D(vPoint+ese.vNormal/50.0f, ANGLE3D(0, 0, 0)), ese);
      }
    }
  }
};

procedures:

  Main()
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

    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);
    SetFlags(GetFlags() | ENF_SEETHROUGH);

    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // spawn in world editor
    autowait(0.1f);

    wait() {
      on (EBegin) : { resume; }
      on (ETrigger) : {
        InflictRangeDamage(this, DMT_EXPLOSION, m_fDamageAmount, GetPlacement().pl_PositionVector + FLOAT3D(0.0f, m_fDamageHeight, 0.0f), m_fDamageHotSpot, m_fDamageFalloff, DBPT_GENERIC);
        GenericExplosion();
        resume;
      }
      otherwise() : { resume; }
    }

    // cease to exist
    Destroy();

    return;
  }
};