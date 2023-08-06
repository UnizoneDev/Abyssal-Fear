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

1022
%{
#include "StdH.h"
#include "Models/Props/Barrel1/Barrel1.h"
%}

uses "EntitiesMP/BasicEffects";

enum ExplosiveBarrelType {
  0 EBT_EXPLOSIVE        "Explosive Barrel",
  1 EBT_GREY             "Grey Barrel"
};

class CExplosiveBarrel: CMovableModelEntity {
name      "ExplosiveBarrel";
thumbnail "Thumbnails\\ExplosiveBarrel.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                    "Name" 'N' = "Explosive Barrel",              // class name
  2 enum ExplosiveBarrelType m_ebType     "Type" = EBT_EXPLOSIVE,                       // type


components:
  
  1 class   CLASS_BASIC_EFFECT  "Classes\\BasicEffect.ecl",
  2 model   MODEL_BARREL     "Models\\Props\\Barrel1\\Barrel1.mdl",
  3 texture TEXTURE_BARREL1   "Models\\Props\\Barrel1\\Barrel1.tex",
  4 texture TEXTURE_BARREL2   "Models\\Props\\Barrel1\\Barrel1b.tex"


functions:

  SLONG GetUsedMemory(void) {
    SLONG slUsedMemory = sizeof(CExplosiveBarrel) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();

    return slUsedMemory;
  };

  void Precache(void) {
    PrecacheModel(MODEL_BARREL);
    PrecacheTexture(TEXTURE_BARREL1);
    PrecacheTexture(TEXTURE_BARREL2);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIVEBARREL);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSION_DEBRIS);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSION_SMOKE);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIONSTAIN);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_SHOCKWAVE);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIVEBARREL_PLANE);
  };

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
      CMovableModelEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
  };

  void BarrelExplosion(void) {
  ESpawnEffect ese;
  FLOAT3D vPoint;
  FLOATplane3D vPlaneNormal;
  FLOAT fDistanceToEdge;

  // explosion
  ese.colMuliplier = C_WHITE|CT_OPAQUE;
  ese.betType = BET_EXPLOSIVEBARREL;
  ese.vStretch = FLOAT3D(1,1,1);
  SpawnEffect(GetPlacement(), ese);

  // explosion debris
  ese.betType = BET_EXPLOSION_DEBRIS;
  SpawnEffect(GetPlacement(), ese);

  // explosion smoke
  ese.betType = BET_EXPLOSION_SMOKE;
  SpawnEffect(GetPlacement(), ese);

  // on plane
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
};

// spawn effect
  void SpawnEffect(const CPlacement3D &plEffect, const class ESpawnEffect &eSpawnEffect)
  {
    CEntityPointer penEffect = CreateEntity(plEffect, CLASS_BASIC_EFFECT);
    penEffect->Initialize(eSpawnEffect);
  };

procedures:


  Main()
  {
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_SLIDING);
    SetCollisionFlags(ECF_MODEL);
    SetHealth(50.0f);
    SetModel(MODEL_BARREL);
    if(m_ebType == EBT_GREY) {
      SetModelMainTexture(TEXTURE_BARREL2);
    } else {
      SetModelMainTexture(TEXTURE_BARREL1);
    }
    ModelChangeNotify();

    // spawn in world editor
    autowait(0.1f);
    
    wait() {
      on (EDeath) : {
          InflictRangeDamage(this, DMT_EXPLOSION, 100.0f, GetPlacement().pl_PositionVector + FLOAT3D(0.0f, 1.0f, 0.0f), 4.0f, 8.0f, DBPT_GENERIC);
          BarrelExplosion();
          SwitchToEditorModel();
          SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
          SetCollisionFlags(ECF_IMMATERIAL);
          Destroy();
          stop;
      }
      on (ETimer) : { stop; }
      otherwise() : { resume; }
    }
    

    // cease to exist
    Destroy();

    return;
    }
  };