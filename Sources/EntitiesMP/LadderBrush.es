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
extern void JumpFromBouncer(CEntity *penToBounce, CEntity *penBouncer);
%}

enum LadderSounds {
  0 LS_NONE       "None",
  1 LS_METAL      "Metal",
  2 LS_WOOD       "Wood",
  3 LS_ROPE       "Rope",
};

class CLadderBrush: CRationalEntity {
name      "Ladder Brush";
thumbnail "Thumbnails\\LadderBrush.tbn";
features "HasName", "IsTargetable";

properties:

  1 CTString m_strName            "Name" 'N' = "Ladder Brush",       // class name
  2 BOOL m_bCanEnemiesUse         "Can Enemies Use" = FALSE,         // can field be used by NPCs
  3 enum LadderSounds m_elsLadderSounds "Ladder SFX Type" = LS_NONE,

{
  CFieldSettings m_fsField;
}

components:

  1 texture TEXTURE_LADDERBRUSH  "Models\\Editor\\LadderBrush.tex",


functions:

  void SetupBarrierSettings(void)
  {
    m_fsField.fs_toTexture.SetData(GetTextureDataForComponent(TEXTURE_LADDERBRUSH));
    m_fsField.fs_colColor = C_WHITE|CT_OPAQUE;
  }

  CFieldSettings *GetFieldSettings(void) {
    if (m_fsField.fs_toTexture.GetData()==NULL) {
      SetupBarrierSettings();      
    }
    return &m_fsField;
  };


  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CLadderBrush) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    return slUsedMemory;
  }


procedures:

  // check for players and enemies
  LadderMainLoop() {

    wait() {
      on (EBegin) : { resume; }
      on (EPass ePass) : { 

        if(m_bCanEnemiesUse) {
          if(IsDerivedFromClass(ePass.penOther, "Player") || IsDerivedFromClass(ePass.penOther, "Enemy Base"))
          {
            JumpFromBouncer(this, ePass.penOther);
            resume;
          }
          else
          {
            resume;
          }
        }
        else {
          if(IsDerivedFromClass(ePass.penOther, "Player"))
          {
            JumpFromBouncer(this, ePass.penOther);
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
    InitAsFieldBrush();
    SetPhysicsFlags(EPF_BRUSH_FIXED);

    SetCollisionFlags((ECBI_BRUSH)<<ECB_IS);

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