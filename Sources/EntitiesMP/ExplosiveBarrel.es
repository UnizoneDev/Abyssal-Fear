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

1022
%{
#include "StdH.h"
#include "Models/Props/Barrel1/Barrel1.h"
#include "Models/Props/Barrel2/Barrel2.h"
%}

uses "EntitiesMP/BasicEffects";
uses "EntitiesMP/Debris";

enum ExplosiveBarrelType {
  0 EBT_EXPLOSIVE        "Explosive Barrel",
  1 EBT_GREY             "Grey Barrel",
  2 EBT_WOOD1            "Wooden Barrel 1",
  3 EBT_WOOD2            "Wooden Barrel 2",
  4 EBT_WOOD3            "Wooden Barrel 3"
};

class CExplosiveBarrel: CMovableModelEntity {
name      "ExplosiveBarrel";
thumbnail "Thumbnails\\ExplosiveBarrel.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                    "Name" 'N' = "Explosive Barrel",              // class name
  2 enum ExplosiveBarrelType m_ebType     "Type" = EBT_EXPLOSIVE,                       // type
  3 CSoundObject m_soSound,        // sound channel
  4 INDEX m_ctDebrises          "Debris count" = 12,
  5 FLOAT m_fCandyEffect        "Debris blow power" = 0.0f,
  6 FLOAT m_fCubeFactor         "Cube factor" = 1.0f,
  7 COLOR m_colDebrises         "Color of debrises" = C_WHITE,


components:
  
  1 class   CLASS_BASIC_EFFECT  "Classes\\BasicEffect.ecl",
  2 model   MODEL_BARREL        "Models\\Props\\Barrel1\\Barrel1.mdl",
  3 texture TEXTURE_BARREL1     "Models\\Props\\Barrel1\\Barrel1.tex",
  4 texture TEXTURE_BARREL2     "Models\\Props\\Barrel1\\Barrel1b.tex",

  5 model   MODEL_BARRELWOOD      "Models\\Props\\Barrel2\\Barrel2.mdl",
  6 texture TEXTURE_BARRELWOOD1   "Models\\Props\\Barrel2\\Barrel2.tex",
  7 texture TEXTURE_BARRELWOOD2   "Models\\Props\\Barrel2\\Barrel2b.tex",
  8 texture TEXTURE_BARRELWOOD3   "Models\\Props\\Barrel2\\Barrel2c.tex",

  // ************** DEBRIS PARTS **************
 50 model     MODEL_WOOD         "Models\\Effects\\Debris\\WoodDebris.mdl",
 51 model     MODEL_METAL        "Models\\Effects\\Debris\\MetalDebris.mdl",
 52 texture   TEXTURE_WOOD1      "Models\\Effects\\Debris\\WoodDebris5.tex",
 53 texture   TEXTURE_WOOD2      "Models\\Effects\\Debris\\WoodDebris6.tex",
 54 texture   TEXTURE_WOOD3      "Models\\Effects\\Debris\\WoodDebris7.tex",
 55 texture   TEXTURE_METAL1     "Models\\Effects\\Debris\\MetalDebris5.tex",

  // ********** BULLET RICOCHETS **********
 100 sound   SOUND_METAL_BULLET1    "Sounds\\Materials\\Metal\\BulletMetal1.wav",
 101 sound   SOUND_METAL_BULLET2    "Sounds\\Materials\\Metal\\BulletMetal2.wav",
 102 sound   SOUND_METAL_BULLET3    "Sounds\\Materials\\Metal\\BulletMetal3.wav",
 103 sound   SOUND_METAL_BULLET4    "Sounds\\Materials\\Metal\\BulletMetal4.wav",
 104 sound   SOUND_METAL_BULLET5    "Sounds\\Materials\\Metal\\BulletMetal5.wav",

 105 sound   SOUND_WOOD_BULLET1     "Sounds\\Materials\\Wood\\BulletWood1.wav",
 106 sound   SOUND_WOOD_BULLET2     "Sounds\\Materials\\Wood\\BulletWood2.wav",
 107 sound   SOUND_WOOD_BULLET3     "Sounds\\Materials\\Wood\\BulletWood3.wav",
 108 sound   SOUND_WOOD_BULLET4     "Sounds\\Materials\\Wood\\BulletWood4.wav",
 109 sound   SOUND_WOOD_BULLET5     "Sounds\\Materials\\Wood\\BulletWood5.wav",

  // ********** DESTROYED SOUNDS **********
 110 sound   SOUND_METAL_DESTROY1   "Sounds\\Breakables\\MetalBreak3.wav",
 111 sound   SOUND_METAL_DESTROY2   "Sounds\\Breakables\\MetalBreak4.wav",
 112 sound   SOUND_WOOD_DESTROY1    "Sounds\\Breakables\\WoodBreak2.wav",
 113 sound   SOUND_WOOD_DESTROY2    "Sounds\\Breakables\\WoodBreak3.wav"


functions:

  SLONG GetUsedMemory(void) {
    SLONG slUsedMemory = sizeof(CExplosiveBarrel) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();

    return slUsedMemory;
  };

  void Precache(void) {
    PrecacheModel(MODEL_BARREL);
    PrecacheTexture(TEXTURE_BARREL1);
    PrecacheTexture(TEXTURE_BARREL2);
    PrecacheTexture(TEXTURE_BARRELWOOD1);
    PrecacheTexture(TEXTURE_BARRELWOOD2);
    PrecacheTexture(TEXTURE_BARRELWOOD3);

    PrecacheModel(MODEL_WOOD);
    PrecacheModel(MODEL_METAL);
    PrecacheTexture(TEXTURE_METAL1);
    PrecacheTexture(TEXTURE_WOOD1);
    PrecacheTexture(TEXTURE_WOOD2);
    PrecacheTexture(TEXTURE_WOOD3);

    PrecacheSound(SOUND_METAL_DESTROY1);
    PrecacheSound(SOUND_METAL_DESTROY2);
    PrecacheSound(SOUND_WOOD_DESTROY1);
    PrecacheSound(SOUND_WOOD_DESTROY2);
    PrecacheSound(SOUND_METAL_BULLET1);
    PrecacheSound(SOUND_METAL_BULLET2);
    PrecacheSound(SOUND_METAL_BULLET3);
    PrecacheSound(SOUND_METAL_BULLET4);
    PrecacheSound(SOUND_METAL_BULLET5);
    PrecacheSound(SOUND_WOOD_BULLET1);
    PrecacheSound(SOUND_WOOD_BULLET2);
    PrecacheSound(SOUND_WOOD_BULLET3);
    PrecacheSound(SOUND_WOOD_BULLET4);
    PrecacheSound(SOUND_WOOD_BULLET5);
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

  void DebrisInitialize(EntityInfoBodyType eibtMaterialType, SLONG sModelID, SLONG sTextureID, FLOAT fEntSize, FLOATaabbox3D fBox)
  {
    FLOAT fEntitySize = pow(fBox.Size()(1)*fBox.Size()(2)*fBox.Size()(3)/m_ctDebrises, 1.0f/3.0f)*m_fCubeFactor;
    Debris_Begin(eibtMaterialType, DPT_NONE, BET_NONE, fEntitySize, FLOAT3D(1.0f,2.0f,3.0f),
    FLOAT3D(0,0,0), 1.0f+m_fCandyEffect/2.0f, m_fCandyEffect, m_colDebrises);
                    for(INDEX iDebris = 0; iDebris<m_ctDebrises; iDebris++) {
                        Debris_Spawn(this, this, sModelID, sTextureID, 0, 0, 0, IRnd()%4, 1.0f,
                        FLOAT3D(FRnd()*0.8f+0.1f, FRnd()*0.8f+0.1f, FRnd()*0.8f+0.1f));
                    }
  }

procedures:


  Main()
  {
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_PUSHAROUND);
    SetCollisionFlags(ECF_MODEL);
    SetHealth(50.0f);

    switch(m_ebType) {
      case EBT_EXPLOSIVE: { SetModel(MODEL_BARREL); SetModelMainTexture(TEXTURE_BARREL1); } break;
      case EBT_GREY: { SetModel(MODEL_BARREL); SetModelMainTexture(TEXTURE_BARREL2); } break;
      case EBT_WOOD1: { SetModel(MODEL_BARRELWOOD); SetModelMainTexture(TEXTURE_BARRELWOOD1); } break;
      case EBT_WOOD2: { SetModel(MODEL_BARRELWOOD); SetModelMainTexture(TEXTURE_BARRELWOOD2); } break;
      case EBT_WOOD3: { SetModel(MODEL_BARRELWOOD); SetModelMainTexture(TEXTURE_BARRELWOOD3); } break;
      default: break;
    }

    ModelChangeNotify();

    // spawn in world editor
    autowait(0.1f);
    
    wait() {
      on (EBegin) : {
          m_soSound.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
          resume;
      }
      on (EDamage eDamage) : {
          if(m_ebType == EBT_EXPLOSIVE || m_ebType == EBT_GREY) {
            switch(IRnd()%5) {
              case 0: { PlaySound(m_soSound, SOUND_METAL_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_METAL_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_METAL_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_METAL_BULLET4, SOF_3D); } break;
              case 4: { PlaySound(m_soSound, SOUND_METAL_BULLET5, SOF_3D); } break;
              default: break;
            }
          } else {
            switch(IRnd()%5) {
              case 0: { PlaySound(m_soSound, SOUND_WOOD_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_WOOD_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_WOOD_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_WOOD_BULLET4, SOF_3D); } break;
              case 4: { PlaySound(m_soSound, SOUND_WOOD_BULLET5, SOF_3D); } break;
              default: break;
            }
          }

          resume;
      }
      on (EDeath) : {
          // get your size
          FLOATaabbox3D box;
          GetSize(box);
          FLOAT fEntitySize = pow(box.Size()(1)*box.Size()(2)*box.Size()(3)/m_ctDebrises, 1.0f/3.0f)*m_fCubeFactor;

          switch(m_ebType) {
            case EBT_EXPLOSIVE:
            {
              switch(IRnd()%2)
              {
                case 0: PlaySound(m_soSound, SOUND_METAL_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_METAL_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("Explosive barrel unknown break sound");
              }
              DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL1, fEntitySize, box);
              InflictRangeDamage(this, DMT_EXPLOSION, 100.0f, GetPlacement().pl_PositionVector + FLOAT3D(0.0f, 1.0f, 0.0f), 4.0f, 8.0f, DBPT_GENERIC);
              BarrelExplosion();
              SwitchToEditorModel();
              SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
              SetCollisionFlags(ECF_IMMATERIAL);
              Destroy();
            }
            break;
            case EBT_GREY:
            {
              switch(IRnd()%2)
              {
                case 0: PlaySound(m_soSound, SOUND_METAL_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_METAL_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("Explosive barrel unknown break sound");
              }
              DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL1, fEntitySize, box);
              SwitchToEditorModel();
              SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
              SetCollisionFlags(ECF_IMMATERIAL);
              Destroy();
            }
            break;
            case EBT_WOOD1:
            {
              switch(IRnd()%2)
              {
                case 0: PlaySound(m_soSound, SOUND_WOOD_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_WOOD_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("Explosive barrel unknown break sound");
              }
              DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD1, fEntitySize, box);
              SwitchToEditorModel();
              SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
              SetCollisionFlags(ECF_IMMATERIAL);
              Destroy();
            }
            break;
            case EBT_WOOD2:
            {
              switch(IRnd()%2)
              {
                case 0: PlaySound(m_soSound, SOUND_WOOD_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_WOOD_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("Explosive barrel unknown break sound");
              }
              DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD2, fEntitySize, box);
              SwitchToEditorModel();
              SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
              SetCollisionFlags(ECF_IMMATERIAL);
              Destroy();
            }
            break;
            case EBT_WOOD3:
            {
              switch(IRnd()%2)
              {
                case 0: PlaySound(m_soSound, SOUND_WOOD_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_WOOD_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("Explosive barrel unknown break sound");
              }
              DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD3, fEntitySize, box);
              SwitchToEditorModel();
              SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
              SetCollisionFlags(ECF_IMMATERIAL);
              Destroy();
            }
            break;

            default: break;
          }
          
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