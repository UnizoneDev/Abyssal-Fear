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

1027
%{
#include "StdH.h"
%}



%{

%}

class export CWildlifeFood : CMovableModelEntity {
name      "Wildlife Food";
thumbnail "Thumbnails\\WildlifeFood.tbn";
features  "HasName";

properties:
  1 CTString m_strName                    "Name" 'N' = "Wildlife Food",              // class name

components:
  1 model   MODEL_APPLE     "Models\\Props\\Barrel1\\Barrel1.mdl",
  2 texture TEXTURE_APPLE   "Models\\Props\\Barrel1\\Barrel1.tex",


functions:

  SLONG GetUsedMemory(void) {
    SLONG slUsedMemory = sizeof(CWildlifeFood) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    return slUsedMemory;
  };

  void Precache(void) {
    PrecacheModel(MODEL_APPLE);
    PrecacheTexture(TEXTURE_APPLE);
  };

/* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection) 
  {
      CMovableModelEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
  };

procedures:

/************************************************************
 *                M  A  I  N    L  O  O  P                  *
 ************************************************************/

  // dummy main
  Main()
  {
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_SLIDING);
    SetCollisionFlags(ECF_MODEL);
    SetHealth(50.0f);
    SetModel(MODEL_APPLE);
    SetModelMainTexture(TEXTURE_APPLE);
    ModelChangeNotify();

    // spawn in world editor
    autowait(0.1f);
    
    wait() {
      on (EDeath) : {
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
