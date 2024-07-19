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

1055
%{
#include "StdH.h"
%}

class CColorChanger: CRationalEntity {
name      "ColorChanger";
thumbnail "Thumbnails\\ColorChanger.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                 "Name" 'N' = "Color Changer",               // class name
  2 CEntityPointer m_penTarget         "Target" 'T' COLOR(C_RED|0xFF),             // send event to entity
  3 COLOR m_colColor     "Color" 'C' = (C_WHITE|CT_OPAQUE),
  4 FLOAT m_tmChange     "Color Change Time" = 1.0f,

components:

  1 model   MODEL_MARKER     "Models\\Editor\\ColorChanger.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\ColorChanger.tex"

functions:



procedures:

Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    if(m_penTarget != NULL && !IsOfClass(m_penTarget, "ModelHolder2") && !IsOfClass(m_penTarget, "ModelHolder3")
                           && !IsOfClass(m_penTarget, "UZModelHolder") && !IsOfClass(m_penTarget, "UZSkaModelHolder")
                           && !IsDerivedFromClass(m_penTarget, "Enemy Base")) {
      WarningMessage("Target must be ModelHolder2, ModelHolder3, UZModelHolder, UZSkaModelHolder, or EnemyBase!");
      m_penTarget = NULL;
    }

    // spawn in world editor
    autowait(0.1f);

    wait() {
      on (EBegin) : { resume; }
      on (ETrigger) : {
        EChangeColorValue eCCV;

        eCCV.cValue = m_colColor;
        eCCV.tmLength = m_tmChange;

        if(m_penTarget != NULL) {
          m_penTarget->SendEvent(eCCV);
        } 
        resume;
      }
      on (EEnd) : { stop; }
    }

    // cease to exist
    Destroy();

    return;
    }
  };