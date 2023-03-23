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

1017
%{
#include "StdH.h"
#include "EntitiesMP/Player.h"
%}

enum GameCheckerEventType {
  0 GCET_CHEATDETECT         "Was Cheating Detected",
  1 GCET_GOLDENSWITCHES      "Were Golden Switches Used"
};

class CGameChecker: CRationalEntity {
name      "GameChecker";
thumbnail "Thumbnails\\GameChecker.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                    "Name" 'N' = "Game Checker",              // class name
  2 enum GameCheckerEventType m_gcetEvent "Action Type" 'T' = GCET_CHEATDETECT,     // action to perform
  3 CEntityPointer m_penCheckTarget       "Check target" 'D',                       // check target
  4 enum EventEType m_eetCheckType        "Check event type" 'F' = EET_TRIGGER,     // check event type
  5 CEntityPointer m_penCaused,                                                     // who touched it last time
  6 CEntityPointer m_penBadEndingTarget       "Bad ending target",                  // bad ending target
  7 enum EventEType m_eetBadEndingType        "Bad ending type" = EET_TRIGGER,      // bad ending type
  8 CEntityPointer m_penGoodEndingTarget      "Good ending target",                 // good ending target
  9 enum EventEType m_eetGoodEndingType       "Good ending type" = EET_TRIGGER,     // good ending type
 10 CEntityPointer m_penNeutralEndingTarget   "Neutral ending target",              // neutral ending target
 11 enum EventEType m_eetNeutralEndingType    "Neutral ending type" = EET_TRIGGER,  // neutral ending type

components:

  1 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"


functions:

  void CheckForCheats()
  {
    BOOL cht_bGhost = _pShell->GetINDEX("cht_bGhost");
    BOOL cht_bFly = _pShell->GetINDEX("cht_bFly");
    BOOL cht_bGod = _pShell->GetINDEX("cht_bGod");
    BOOL cht_bInvisible = _pShell->GetINDEX("cht_bInvisible");
    FLOAT cht_fTranslationMultiplier = _pShell->GetFLOAT("cht_fTranslationMultiplier");

    if(cht_bGhost == TRUE || cht_bFly == TRUE || cht_bGod == TRUE || cht_bInvisible == TRUE || cht_fTranslationMultiplier > 1.0f)
    {
      SendToTarget(m_penCheckTarget, m_eetCheckType, m_penCaused);
      return;
    }
  }

  void CheckForGoldenSwitches()
  {
    BOOL GoldenSwitch1 = _pShell->GetINDEX("sam_bGoldenSwitch1");
    BOOL GoldenSwitch2 = _pShell->GetINDEX("sam_bGoldenSwitch2");
    BOOL GoldenSwitch3 = _pShell->GetINDEX("sam_bGoldenSwitch3");
    BOOL GoldenSwitch4 = _pShell->GetINDEX("sam_bGoldenSwitch4");

    if(GoldenSwitch1 == FALSE && GoldenSwitch2 == FALSE && GoldenSwitch3 == FALSE && GoldenSwitch4 == FALSE)
    {
      SendToTarget(m_penBadEndingTarget, m_eetBadEndingType, m_penCaused);
    }
    else if(GoldenSwitch1 == TRUE && GoldenSwitch2 == TRUE && GoldenSwitch3 == TRUE && GoldenSwitch4 == TRUE)
    {
      SendToTarget(m_penGoodEndingTarget, m_eetGoodEndingType, m_penCaused);
    }
    else
    {
      SendToTarget(m_penNeutralEndingTarget, m_eetNeutralEndingType, m_penCaused);
    }
    
    return;
  }

procedures:

  PerformChecks()
  {
    while(TRUE)
    {
      switch(m_gcetEvent)
      {
        case GCET_CHEATDETECT:
        {
          CheckForCheats();
          break;
        }
        case GCET_GOLDENSWITCHES:
        {
          CheckForGoldenSwitches();
          break;
        }
      }
      autowait(0.1f);
    }

    return;
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
      on (EBegin) : { resume; }
      on (ETrigger) : {
          call PerformChecks();
          resume;
      }
      on (EEnd) : { stop; }
    }
    

    // cease to exist
    Destroy();

    return;
    }
  };