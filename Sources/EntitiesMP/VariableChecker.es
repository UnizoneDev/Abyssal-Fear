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

1025
%{
#include "StdH.h"
%}

enum VariableCheckerType {
  0 VCT_HEALTH              "Health",
  1 VCT_XPOSITION           "X Pos",
  2 VCT_YPOSITION           "Y Pos",
  3 VCT_ZPOSITION           "Z Pos",
  4 VCT_HROTATION           "H Rot",
  5 VCT_PROTATION           "P Rot",
  6 VCT_BROTATION           "B Rot",
  7 VCT_XSPEED              "X Speed",
  8 VCT_YSPEED              "Y Speed",
  9 VCT_ZSPEED              "Z Speed",
 10 VCT_SPEED               "Total Speed"
};

enum VariableCheckerOperationType {
  0 VCOT_SAME           "==",
  1 VCOT_DIFFERENT      "!=",
  2 VCOT_LARGER         ">",
  3 VCOT_SMALLER        "<",
  4 VCOT_LARGERSAME     ">=",
  5 VCOT_SMALLERSAME    "<="
};

class CVariableChecker: CRationalEntity {
name      "VariableChecker";
thumbnail "Thumbnails\\VariableChecker.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                              "Name" 'N' = "Variable Checker",                // class name
  2 BOOL m_bActive                                  "Active" 'A' = TRUE,                            // is checker active
  3 CEntityPointer m_penTarget                      "Target" 'T' COLOR(C_RED|0xFF),                 // send event to entity
  4 enum EventEType m_eetEvent                      "Event type Target" 'G' = EET_TRIGGER,          // type of event to send
  5 CEntityPointer m_penCaused,
  6 enum VariableCheckerType m_vctType              "Variable to Check" = VCT_HEALTH,               // check value type
  7 enum VariableCheckerOperationType m_vcotType    "Operator Type" = VCOT_SAME,                    // operator type
  8 FLOAT m_fCheckValue                             "Float Value" = 0.0f,
  9 CEntityPointer m_penCheck                       "Entity to Check",
 10 BOOL m_bCompareCaller                           "Compare with caller" = FALSE,
 11 INDEX m_iCheckValue                             "Index Value" = 0,

components:

  1 model   MODEL_MARKER     "Models\\Editor\\VariableChecker.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\VariableChecker.tex"


functions:

  void CompareFloats(CEntity *penCaused, FLOAT fValue)
  {
    BOOL bResultCheck;

    switch(m_vcotType)
    {
      case VCOT_SAME:
      bResultCheck = (fValue == m_fCheckValue);
      break;

      case VCOT_DIFFERENT:
      bResultCheck = (fValue != m_fCheckValue);
      break;

      case VCOT_LARGER:
      bResultCheck = (fValue > m_fCheckValue);
      break;

      case VCOT_SMALLER:
      bResultCheck = (fValue < m_fCheckValue);
      break;

      case VCOT_LARGERSAME:
      bResultCheck = (fValue >= m_fCheckValue);
      break;

      case VCOT_SMALLERSAME:
      bResultCheck = (fValue <= m_fCheckValue);
      break;
    }

    if (bResultCheck) {
      SendToTarget(m_penTarget, m_eetEvent, m_penCaused);
    }
  };

  void CompareIntegers(CEntity *penCaused, INDEX iValue)
  {
    BOOL bResultCheck;

    switch(m_vcotType)
    {
      case VCOT_SAME:
      bResultCheck = (iValue == m_iCheckValue);
      break;

      case VCOT_DIFFERENT:
      bResultCheck = (iValue != m_iCheckValue);
      break;

      case VCOT_LARGER:
      bResultCheck = (iValue > m_iCheckValue);
      break;

      case VCOT_SMALLER:
      bResultCheck = (iValue < m_iCheckValue);
      break;

      case VCOT_LARGERSAME:
      bResultCheck = (iValue >= m_iCheckValue);
      break;

      case VCOT_SMALLERSAME:
      bResultCheck = (iValue <= m_iCheckValue);
      break;
    }

    if (bResultCheck) {
      SendToTarget(m_penTarget, m_eetEvent, m_penCaused);
    }
  };

  // Handle the main work.
  void DoComparison(CEntity *penCaused)
  {
    if(m_penCheck == NULL)
    {
      return;
    }

    if(m_bCompareCaller)
    {
      penCaused = FixupCausedToPlayer(this, penCaused);

      if (penCaused == NULL) {
        return;
      }
    }

    m_penCaused = penCaused;

    switch(m_vctType)
    {
      case VCT_HEALTH:
      if(!penCaused->IsLiveEntity())
      {
        return;
      }
      CompareFloats(penCaused, ((CLiveEntity&)*penCaused).GetHealth());
      break;

      case VCT_XPOSITION:
      CompareFloats(penCaused, penCaused->GetPlacement().pl_PositionVector(1));
      break;

      case VCT_YPOSITION:
      CompareFloats(penCaused, penCaused->GetPlacement().pl_PositionVector(2));
      break;

      case VCT_ZPOSITION:
      CompareFloats(penCaused, penCaused->GetPlacement().pl_PositionVector(3));
      break;

      case VCT_HROTATION:
      CompareFloats(penCaused, penCaused->GetPlacement().pl_OrientationAngle(1));
      break;

      case VCT_PROTATION:
      CompareFloats(penCaused, penCaused->GetPlacement().pl_OrientationAngle(2));
      break;

      case VCT_BROTATION:
      CompareFloats(penCaused, penCaused->GetPlacement().pl_OrientationAngle(3));
      break;

      case VCT_XSPEED:
      if(!penCaused->IsMovableEntity())
      {
        return;
      }
      CompareFloats(penCaused, ((CMovableEntity&)*penCaused).en_vCurrentTranslationAbsolute(1));
      break;

      case VCT_YSPEED:
      if(!penCaused->IsMovableEntity())
      {
        return;
      }
      CompareFloats(penCaused, ((CMovableEntity&)*penCaused).en_vCurrentTranslationAbsolute(2));
      break;

      case VCT_ZSPEED:
      if(!penCaused->IsMovableEntity())
      {
        return;
      }
      CompareFloats(penCaused, ((CMovableEntity&)*penCaused).en_vCurrentTranslationAbsolute(3));
      break;

      case VCT_SPEED:
      if(!penCaused->IsMovableEntity())
      {
        return;
      }
      CompareFloats(penCaused, ((CMovableEntity&)*penCaused).en_vCurrentTranslationAbsolute.Length());
      break;
    }
  };

procedures:
  
  Active() {
    m_bActive = TRUE;
    wait() {
      on (EBegin) : { resume; }
      on (ETrigger eTrigger) : { 
        DoComparison(eTrigger.penCaused);
        resume;
      }
      on (EDeactivate) : { jump Inactive(); }
    }
  };

  // I don't want to check your stuff now, leave me alone!
  Inactive() {
    m_bActive = FALSE;
    wait() {
      on (EBegin) : { resume; }
      on (EActivate) : { jump Active(); }
    }
  };

  Main() {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // spawn in world editor
    autowait(0.1f);

    if (m_bActive) {
      jump Active();
    } else {
      jump Inactive();
    }

    return;
  };

};