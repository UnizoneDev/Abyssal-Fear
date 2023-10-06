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
#include "Models/Props/Fruit/CitrusOrange.h"
%}

enum WildlifeFoodType {
  0 WFT_ORANGE        "Orange",
  1 WFT_MEAT          "Meat",
  2 WFT_GREENMEAT     "Green Meat"
};

class CWildlifeFood : CMovableModelEntity {
name      "Wildlife Food";
thumbnail "Thumbnails\\WildlifeFood.tbn";
features  "HasName";

properties:
  1 CTString m_strName                    "Name" 'N' = "Wildlife Food",              // class name
  2 enum WildlifeFoodType m_wfType        "Type" = WFT_ORANGE,                       // type
  3 RANGE m_fSmellRadius                  "Smell Radius" = 40.0f,                    // smell radius

components:
  1 model   MODEL_ORANGE     "Models\\Props\\Fruit\\CitrusOrange.mdl",
  2 texture TEXTURE_ORANGE   "Models\\Props\\Fruit\\CitrusOrange.tex",

  10 model   MODEL_FLESH          "Models\\Effects\\Debris\\FleshDebris.mdl",
  11 texture TEXTURE_FLESH_RED    "Models\\Effects\\Debris\\FleshDebrisRed.tex",
  12 texture TEXTURE_FLESH_GREEN  "Models\\Effects\\Debris\\FleshDebrisGreen.tex",


functions:

  SLONG GetUsedMemory(void) {
    SLONG slUsedMemory = sizeof(CWildlifeFood) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    return slUsedMemory;
  };

  void Precache(void) {
    PrecacheModel(MODEL_ORANGE);
    PrecacheTexture(TEXTURE_ORANGE);
  };

/* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
      CMovableModelEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
  };

procedures:

/************************************************************
 *                M  A  I  N    L  O  O  P                  *
 ************************************************************/

  // dummy main
  Main()
  {
    // smell radius must be positive value
    if (m_fSmellRadius<0) {
      m_fSmellRadius = 0.0f;
    }

    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_SLIDING);
    SetCollisionFlags(ECF_MODEL);
    SetHealth(40.0f);
    switch(m_wfType)
    {
      case WFT_ORANGE:
        SetModel(MODEL_ORANGE);
        SetModelMainTexture(TEXTURE_ORANGE);
        break;
      case WFT_MEAT:
        SetModel(MODEL_FLESH);
        SetModelMainTexture(TEXTURE_FLESH_RED);
        break;
      case WFT_GREENMEAT:
        SetModel(MODEL_FLESH);
        SetModelMainTexture(TEXTURE_FLESH_GREEN);
        break;
    }
    ModelChangeNotify();

    // spawn in world editor
    autowait(0.1f);
    
    while (TRUE) {
    wait(0.25f) {
      on (EBegin) : {
          resume;
      }
      on (EDeath) : {
          SwitchToEditorModel();
          SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
          SetCollisionFlags(ECF_IMMATERIAL);
          Destroy();
          stop;
      }
      on (ETimer) : {
        ESmell eSmell;
        eSmell.EsmltSmell = SMLT_FOOD;
        eSmell.penTarget = this;
        SendEventInRange(eSmell, FLOATaabbox3D(GetPlacement().pl_PositionVector, m_fSmellRadius)); 
        stop;
      }
      otherwise() : { resume; }
      }
    }

    // cease to exist
    Destroy();

    return;
    }
};
