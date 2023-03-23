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

1005
%{
#include "StdH.h"
%}

class CPlayerParenter: CRationalEntity {
name      "PlayerParenter";
thumbnail "Thumbnails\\PlayerParenter.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName              "Name" 'N' = "Player Parenter",           // class name
  2 CEntityPointer m_penTarget      "Entity To Parent" COLOR(C_RED|0xFF),
  3 CEntityPointer m_penCaused,                                               // player who is going to have something attached to them


components:

  1 model   MODEL_MARKER     "Models\\Editor\\PlayerParenter.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\PlayerParenter.tex"


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

    // spawn in world editor
    autowait(0.1f);

    wait(){
        on (ETrigger eTrigger) : {
            CEntity *penCaused;
            penCaused = FixupCausedToPlayer(this, eTrigger.penCaused, FALSE);
            if( IsDerivedFromClass(penCaused, "Player"))
            {
              m_penCaused = penCaused;
              // if we have causer
                if (penCaused!=NULL)
                {
                  m_penTarget->SetParent(penCaused);
                }
            }
            resume;
        }
        on (EDeactivate eDeactivate) : {
            m_penTarget->SetParent(NULL);
            resume;
        }
    }

    // cease to exist
    Destroy();

    return;
    }
  };
