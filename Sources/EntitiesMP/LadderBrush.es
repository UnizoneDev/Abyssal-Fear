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

1006
%{
#include "StdH.h"
%}

enum LadderSounds {
  0 LS_NONE       "None",
  1 LS_METAL      "Metal",
  2 LS_WOOD       "Wood",
  3 LS_ROPE       "Rope",
};

class CLadderBrush: CMovableBrushEntity {
name      "Ladder Brush";
thumbnail "Thumbnails\\LadderBrush.tbn";
features "HasName", "IsTargetable";

properties:

  1 CTString m_strName            "Name" 'N' = "Ladder Brush",       // class name
  2 BOOL m_bCanEnemiesUse         "Can Enemies Use" = FALSE,         // can brush be used by NPCs
  3 enum LadderSounds m_elsLadderSounds "Ladder SFX Type" = LS_NONE,
  4 BOOL m_bDynamicShadows        "Dynamic shadows" = FALSE,            // if has dynamic shadows

components:


functions:

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CLadderBrush) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    return slUsedMemory;
  }

  void PostMoving()
  {
    CMovableBrushEntity::PostMoving();
  };


procedures:

  // check for players and enemies
  LadderMainLoop() {

    wait() {
      on (EBegin) : { resume; }
      on (ETouch eTouch) : { 

        if(m_bCanEnemiesUse) {
          if(IsDerivedFromClass(eTouch.penOther, "Player") || IsDerivedFromClass(eTouch.penOther, "Enemy Base"))
          {
            if (eTouch.penOther->GetPhysicsFlags()&EPF_MOVABLE)
            {
              eTouch.penOther->SetPhysicsFlags(eTouch.penOther->GetPhysicsFlags() | EPF_ONLADDER);
            }
            resume;
          }
          else
          {
            resume;
          }
        }
        else {
          if(IsDerivedFromClass(eTouch.penOther, "Player"))
          {
            if (eTouch.penOther->GetPhysicsFlags()&EPF_MOVABLE)
            {
              eTouch.penOther->SetPhysicsFlags(eTouch.penOther->GetPhysicsFlags() | EPF_ONLADDER);
            }
            resume;
          }
          else
          {
            resume;
          }
        }
        
      resume; }
    }
  };

  // main initialization
  Main(EVoid) {
    InitAsBrush();
    SetPhysicsFlags(EPF_BRUSH_MOVING);
    SetCollisionFlags(ECF_BRUSH);
    // non-zoning brush
    SetFlags(GetFlags()&~ENF_ZONING);

    // set dynamic shadows as needed
    if (m_bDynamicShadows) {
      SetFlags(GetFlags()|ENF_DYNAMICSHADOWS);
    } else {
      SetFlags(GetFlags()&~ENF_DYNAMICSHADOWS);
    }

    switch(m_elsLadderSounds)
    {
      default:
      break;
      case LS_NONE:
      break;
      case LS_METAL:
      break;
      case LS_WOOD:
      break;
      case LS_ROPE:
      break;
    }

    jump LadderMainLoop();

    return;
  };
};