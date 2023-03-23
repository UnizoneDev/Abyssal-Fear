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

407
%{
#include "StdH.h"
%}

uses "EntitiesMP/Marker";
uses "EntitiesMP/Player";

enum PlayerAutoAction {
  1 PAA_RUN               "Run",              // run to this marker
  2 PAA_WAIT              "Wait",             // wait given time
  3 PAA_USEITEM           "UseItem",          // use some item here
  4 PAA_STOREWEAPON       "StoreWeapon",      // put current weapon away
  5 PAA_DRAWWEAPON        "DrawWeapon",       // put current weapon back in hand
  6 PAA_LOOKAROUND        "LookAround",       // wait given time and look around
  7 PAA_RUNANDSTOP        "RunAndStop",       // run to this marker and stop at it
  8 PAA_ENDOFGAME         "EndOfGame",        // the game has ended - go to menu
  9 PAA_APPEARING         "Appearing",        // appearing with stardust effect
 10 PAA_WAITFOREVER       "WaitForever",      // wait trigger
 11 PAA_TELEPORT          "Teleport",         // teleport to new location
 12 PAA_PICKITEM          "PickItem",         // pick item
 13 PAA_FALLDOWN          "FallDown",         // falling from broken bridge
 14 PAA_FALLTOABYSS       "FallToAbyss",      // falling down into an abyss
 15 PAA_RELEASEPLAYER     "ReleasePlayer",    // return control to player from camera and similar
 16 PAA_TRAVELING_IN_BEAM "TravelingInBeam",  // traveling in space shpi beam
 17 PAA_LOGO_FIRE_MINIGUN "LogoFireMinigun",  // fire minigun in logo sequence
 18 PAA_STARTCREDITS      "StartCredits",     // start credits printout
 19 PAA_STARTINTROSCROLL  "StartIntroScroll", // start intro text scroll
 20 PAA_STOPSCROLLER      "StopScroller",     // stop intro scroll, or end-of-game credits
 21 PAA_NOGRAVITY         "NoGravity",        // deactivate gravity influence for player
 22 PAA_TURNONGRAVITY     "TurnOnGravity",    // turn on gravity
 23 PAA_LOGO_FIRE_INTROSE "SE Logo Fire",       // for SE intro
 24 PAA_INTROSE_SELECT_WEAPON "SE Logo draw weapon",
 25 PAA_STOPANDWAIT       "StopAndWait",      // stop immediately and wait
};

class CPlayerActionMarker: CMarker {
name      "PlayerActionMarker";
thumbnail "Thumbnails\\PlayerActionMarker.tbn";

properties:
  1 enum PlayerAutoAction m_paaAction "Action" 'A' = PAA_RUN, // what to do here
  2 FLOAT m_tmWait "Wait" 'W' = 0.0f, // how long to wait (if wait action)
  3 CEntityPointer m_penDoorController "Door for item" 'D', // where to use the item (if use action)
  4 CEntityPointer m_penTrigger "Trigger" 'G',  // triggered when player gets here
  5 FLOAT m_fSpeed "Speed" 'S' = 1.0f,    // how fast to run towards marker
  6 CEntityPointer m_penItem "Item to pick" 'I',

components:
  1 model   MODEL_MARKER     "Models\\Editor\\PlayerActionMarker.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\PlayerActionMarker.tex",

functions:
  const CTString &GetDescription(void) const {
    CTString strAction = PlayerAutoAction_enum.NameForValue(INDEX(m_paaAction));
    if (m_penTarget==NULL) {
      ((CTString&)m_strDescription).PrintF("%s (%s)-><none>", m_strName, strAction);
    } else {
      ((CTString&)m_strDescription).PrintF("%s (%s)->%s", m_strName, strAction, 
        m_penTarget->GetName());
    }
    return m_strDescription;
  }

  /* Check if entity can drop marker for making linked route. */
  BOOL DropsMarker(CTFileName &fnmMarkerClass, CTString &strTargetProperty) const {
    fnmMarkerClass = CTFILENAME("Classes\\PlayerActionMarker.ecl");
    strTargetProperty = "Target";
    return TRUE;
  }

  /* Handle an event, return false if the event is not handled. */
  BOOL HandleEvent(const CEntityEvent &ee)
  {
    // if triggered
    if (ee.ee_slEvent==EVENTCODE_ETrigger) {
      ETrigger &eTrigger = (ETrigger &)ee;
      // if triggered by a player
      if( IsDerivedFromClass(eTrigger.penCaused, "Player")) {
        // send it event to start auto actions from here
        EAutoAction eAutoAction;
        eAutoAction.penFirstMarker = this;
        eTrigger.penCaused->SendEvent(eAutoAction);
      }
      return TRUE;
    }
    return FALSE;
  }


procedures:
  Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    m_tmWait = ClampDn(m_tmWait, 0.05f);

    return;
  }
};

