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

1009
%{
#include "StdH.h"
#include "EntitiesMP/Switch.h"
%}



class CSwitchChecker: CRationalEntity {
name      "SwitchChecker";
thumbnail "Thumbnails\\SwitchChecker.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName              "Name" 'N' = "Switch Checker",                    // class name
  2 CEntityPointer m_penTarget      "Target" 'T' COLOR(C_RED|0xFF),                 // send event to entity
  3 enum EventEType m_eetEvent      "Event type Target" 'G' = EET_TRIGGER,          // type of event to send
  4 CEntityPointer m_penCaused,     // who touched it last time

  5 CEntityPointer m_penSwitch1     "Switch 1" COLOR(C_RED|0xFF),
  6 CEntityPointer m_penSwitch2     "Switch 2" COLOR(C_RED|0xFF),
  7 CEntityPointer m_penSwitch3     "Switch 3" COLOR(C_RED|0xFF),
  8 CEntityPointer m_penSwitch4     "Switch 4" COLOR(C_RED|0xFF),
  13 CEntityPointer m_penSwitch5    "Switch 5" COLOR(C_RED|0xFF),
  14 CEntityPointer m_penSwitch6    "Switch 6" COLOR(C_RED|0xFF),
  15 CEntityPointer m_penSwitch7    "Switch 7" COLOR(C_RED|0xFF),
  16 CEntityPointer m_penSwitch8    "Switch 8" COLOR(C_RED|0xFF),

  9 enum SwitchPosition m_swpPosition1     "Correct Pos 1" = SWP_UP,
  10 enum SwitchPosition m_swpPosition2    "Correct Pos 2" = SWP_UP,
  11 enum SwitchPosition m_swpPosition3    "Correct Pos 3" = SWP_UP,
  12 enum SwitchPosition m_swpPosition4    "Correct Pos 4" = SWP_UP,
  17 enum SwitchPosition m_swpPosition5    "Correct Pos 5" = SWP_UP,
  18 enum SwitchPosition m_swpPosition6    "Correct Pos 6" = SWP_UP,
  19 enum SwitchPosition m_swpPosition7    "Correct Pos 7" = SWP_UP,
  20 enum SwitchPosition m_swpPosition8    "Correct Pos 8" = SWP_UP,


components:

  1 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"


functions:

procedures:

MainChecks() {
  BOOL bTrigger = TRUE;

  for (INDEX i = 0; i < 8; i++) {
    CEntityPointer &pen = (&m_penSwitch1)[i];

    if (pen == NULL) {
      continue;
    }

    CSwitch *psw = (CSwitch *)&*pen;
    SwitchPosition &swpPos = (&m_swpPosition1)[i];

    // At least one of the valid switches isn't in the correct position
    if (psw->m_swpPosition != swpPos) {
      bTrigger = FALSE;
      break;
    }
  }

  if (bTrigger) {
    SendToTarget(m_penTarget, m_eetEvent, m_penCaused);
  }

  return EReturn();
};


  Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // spawn in world editor
    autowait(0.1f);

    wait() {
        on (ETrigger eTrigger) : {
            call MainChecks(eTrigger);
            resume;
        }
    }

    // cease to exist
    Destroy();

    return;
  };

};