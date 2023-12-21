/* Copyright (c) 2002-2012 Croteam Ltd. 
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

302
%{
#include "StdH.h"
%}

uses "EntitiesMP/Marker";

enum SquadCommandType {
  0 SCT_TAKECOVER "Take Cover",
  1 SCT_MOVEIN "Move In",
  2 SCT_RUNAWAY "Run Away",
};

class CEnemyMarker: CMarker {
name      "Enemy Marker";
thumbnail "Thumbnails\\EnemyMarker.tbn";

properties:
  1 FLOAT m_fWaitTime "Wait Time" 'W' = 0.0f,     // time to wait(or do anything) until go to another marker
  3 RANGE m_fMarkerRange        "Marker Range" 'M' = 0.0f,  // range around marker (marker doesn't have to be hit directly)

 11 RANGE m_fPatrolAreaInner    "Patrol Area Inner" 'R' = 0.0f,     // patrol area inner circle
 12 RANGE m_fPatrolAreaOuter    "Patrol Area Outer" 'E' = 0.0f,     // patrol area outer circle
 13 FLOAT m_fPatrolTime         "Patrol Time" 'P' = 0.0f,           // time to patrol around
 14 enum BoolEType m_betRunToMarker  "Run to marker" 'O' = BET_IGNORE,   // run to marker
 15 enum BoolEType m_betFly     "Fly" 'F' = BET_IGNORE,             // fly if you can
 16 enum BoolEType m_betBlind   "Blind" 'B' = BET_IGNORE,
 17 enum BoolEType m_betDeaf    "Deaf"  'D' = BET_IGNORE,
 20 enum BoolEType m_betJump    "Jump"  'J' = BET_IGNORE,
 21 enum BoolEType m_betDormant "Dormant" = BET_IGNORE,
 22 enum BoolEType m_betHideBehindCover "Hide Behind Cover" = BET_IGNORE,
 23 enum BoolEType m_betCrouch "Crouch" = BET_IGNORE,
 24 enum BoolEType m_betAnosmic  "Anosmic" = BET_IGNORE,
 25 enum SquadCommandType m_sctCommand  "Command Type" = SCT_TAKECOVER,
 26 CEntityPointer m_penReachTarget "Reach target",                 // reach target
 27 enum EventEType m_eetReachType  "Reach event type" = EET_TRIGGER, // death event type

 18 BOOL m_bStartTactics          "Start Tactics" = FALSE, 

 28 CEntityPointer m_penRandomTarget1  "Random Target 1" COLOR(C_dGREEN|0xFF),
 29 CEntityPointer m_penRandomTarget2  "Random Target 2" COLOR(C_dGREEN|0xFF),
 30 CEntityPointer m_penRandomTarget3  "Random Target 3" COLOR(C_dGREEN|0xFF),
 31 CEntityPointer m_penRandomTarget4  "Random Target 4" COLOR(C_dGREEN|0xFF),
 32 CEntityPointer m_penRandomTarget5  "Random Target 5" COLOR(C_dGREEN|0xFF),
 33 CEntityPointer m_penRandomTarget6  "Random Target 6" COLOR(C_dGREEN|0xFF),
 34 CEntityPointer m_penRandomTarget7  "Random Target 7" COLOR(C_dGREEN|0xFF),
 35 CEntityPointer m_penRandomTarget8  "Random Target 8" COLOR(C_dGREEN|0xFF),

components:
  1 model   MODEL_MARKER     "Models\\Editor\\EnemyMarker.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\EnemyMarker.tex"

functions:
  /* Check if entity is moved on a route set up by its targets. */
  BOOL MovesByTargetedRoute(CTString &strTargetProperty) const {
    strTargetProperty = "Target";
    return TRUE;
  };
  
  /* Check if entity can drop marker for making linked route. */
  BOOL DropsMarker(CTFileName &fnmMarkerClass, CTString &strTargetProperty) const {
    fnmMarkerClass = CTFILENAME("Classes\\EnemyMarker.ecl");
    strTargetProperty = "Target";
    return TRUE;
  }

  BOOL IsTargetValid(SLONG slPropertyOffset, CEntity *penTarget)
  {
    if( slPropertyOffset == offsetof(CMarker, m_penTarget))
    {
      if (IsOfClass(penTarget, "Enemy Marker")) { return TRUE; }
      else { return FALSE; }
    }   
    return CEntity::IsTargetValid(slPropertyOffset, penTarget);
  }

procedures:
  Main() {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);
    
    if (m_strName=="Marker") {
      m_strName="Enemy Marker";
    }

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);
    return;
  }
};

