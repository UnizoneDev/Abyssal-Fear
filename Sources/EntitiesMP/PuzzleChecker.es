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

1011
%{
#include "StdH.h"
%}

uses "EntitiesMP/PuzzleItem";
uses "EntitiesMP/Player";

class CPuzzleChecker: CRationalEntity {
name      "PuzzleChecker";
thumbnail "Thumbnails\\PuzzleChecker.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                 "Name" 'N' = "Puzzle Checker",               // class name
  2 CEntityPointer m_penTarget         "Target" 'T' COLOR(C_RED|0xFF),              // send event to entity
  3 enum EventEType m_eetEvent         "Event type Target" 'G' = EET_TRIGGER,       // type of event to send
  4 CEntityPointer m_penCaused,        // who touched it last time

  5 enum PuzzleItemType m_pzitType1    "Item Type 1" = PIT_LEVERHANDLE,
  6 enum PuzzleItemType m_pzitType2    "Item Type 2" = PIT_LEVERHANDLE,
  7 enum PuzzleItemType m_pzitType3    "Item Type 3" = PIT_LEVERHANDLE,
  8 enum PuzzleItemType m_pzitType4    "Item Type 4" = PIT_LEVERHANDLE,


components:

  1 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"


functions:

procedures:

MainChecks() {
  BOOL bTrigger = TRUE;

  if (IsDerivedFromClass(m_penCaused, "Player")) {
    CPlayer *penPlayer = (CPlayer*)&*m_penCaused;
    // if he has the items
    ULONG ulPuzzleItem1 = (1<<INDEX(m_pzitType1));
    ULONG ulPuzzleItem2 = (1<<INDEX(m_pzitType2));
    ULONG ulPuzzleItem3 = (1<<INDEX(m_pzitType3));
    ULONG ulPuzzleItem4 = (1<<INDEX(m_pzitType4));

    if (penPlayer->m_ulPuzzleItems&ulPuzzleItem1) {
      // use the key
      penPlayer->m_ulPuzzleItems&=~ulPuzzleItem1;
    } else {
      bTrigger = FALSE;
    }

    if (penPlayer->m_ulPuzzleItems&ulPuzzleItem2) {
      // use the key
      penPlayer->m_ulPuzzleItems&=~ulPuzzleItem2;
    } else {
      bTrigger = FALSE;
    }

    if (penPlayer->m_ulPuzzleItems&ulPuzzleItem3) {
      // use the key
      penPlayer->m_ulPuzzleItems&=~ulPuzzleItem3;
    } else {
      bTrigger = FALSE;
    }

    if (penPlayer->m_ulPuzzleItems&ulPuzzleItem4) {
      // use the key
      penPlayer->m_ulPuzzleItems&=~ulPuzzleItem4;
    } else {
      bTrigger = FALSE;
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