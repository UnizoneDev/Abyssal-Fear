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

1051
%{
#include "StdH.h"
%}

uses "EntitiesMP/Player";

// switch events
event EControlLeft {};
event EControlRight {};
event EControlUp {};
event EControlDown {};

class CControllableSwitch : CMovableModelEntity {
name      "ControllableSwitch";
thumbnail "Thumbnails\\ControllableSwitch.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName "Name" 'N' = "Controllable Switch",
  2 CEntityPointer m_penCaused,    // for checking who caused it
  3 BOOL m_bUseable = FALSE,      // set while the switch can be triggered
  4 FLOAT m_fDistance "Distance" 'D' = 2.0f,
  5 CTString m_strMessage "Message" 'M' = "",

  6 CEntityPointer m_penTargetLeft     "Target Left" 'T' COLOR(C_RED|0xFF),                 // send event to entity
  7 CEntityPointer m_penTargetRight    "Target Right" 'Y' COLOR(C_RED|0xFF),
  8 CEntityPointer m_penTargetUp       "Target Up" 'U' COLOR(C_RED|0xFF),
  9 CEntityPointer m_penTargetDown     "Target Down" 'I' COLOR(C_RED|0xFF),
 10 enum EventEType m_eetEventLeft     "Event type Target Left" 'G' = EET_TRIGGER,  // type of event to send
 11 enum EventEType m_eetEventRight    "Event type Target Right" 'H' = EET_TRIGGER,
 12 enum EventEType m_eetEventUp       "Event type Target Up" 'J' = EET_TRIGGER,
 13 enum EventEType m_eetEventDown     "Event type Target Down" 'K' = EET_TRIGGER,

 14 FLOAT m_fWaitTime "Wait Time" 'W' = 0.05f,

components:

 1 model   MODEL_CONTROLLABLESWITCH     "Models\\Props\\Switch2\\Switch2.mdl",
 2 texture TEXTURE_CONTROLLABLESWITCH   "Models\\Props\\Switch2\\Switch2.tex",

 10 sound   SOUND_SILENCE               "Sounds\\Misc\\Silence.wav",

 functions:

  void Precache(void) {
    PrecacheSound(SOUND_SILENCE);
  }

  FLOAT GetDistance() const
  {
    return m_fDistance;
  }

  // test if this turret reacts on this entity
  BOOL CanReactOnEntity(CEntity *pen)
  {
    if (pen==NULL) {
      return FALSE;
    }
    // never react on non-live or dead entities
    if (!(pen->GetFlags()&ENF_ALIVE)) {
      return FALSE;
    }

    if(!IsDerivedFromClass(pen, "Player")) {
      return FALSE;
    }

    return TRUE;
  }

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CControllableSwitch) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strMessage.Length();
    return slUsedMemory;
  };

procedures:

  Idle() {
    m_bUseable = TRUE;

    //main loop
    wait() {
      on (EBegin) : {
        resume;
      }

      on (EControlLeft) : {
        SendToTarget(m_penTargetLeft, m_eetEventLeft, m_penCaused);
      }

      on (EControlRight) : {
        SendToTarget(m_penTargetRight, m_eetEventRight, m_penCaused);
      }

      on (EControlUp) : {
        SendToTarget(m_penTargetUp, m_eetEventUp, m_penCaused);
      }

      on (EControlDown) : {
        SendToTarget(m_penTargetDown, m_eetEventDown, m_penCaused);
      }
    }

    autowait(m_fWaitTime);
  };

  Main() {
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_FIXED);
    SetCollisionFlags(ECF_MODEL);

    // set appearance
    SetModel(MODEL_CONTROLLABLESWITCH);
    SetModelMainTexture(TEXTURE_CONTROLLABLESWITCH);

    wait() {
      on (EBegin) : { call Idle(); }

      // trigger event -> change switch
      on (ETrigger eTrigger) : {
        if (CanReactOnEntity(eTrigger.penCaused) && m_bUseable) {
          if(IsDerivedFromClass(eTrigger.penCaused, "Player")) {
            CPlayer *penPlayer = (CPlayer*)&*eTrigger.penCaused;
            if(!penPlayer->m_bIsOnController) {
              penPlayer->m_bIsOnController = TRUE;
              penPlayer->m_penController = this;
            } else {
              penPlayer->m_bIsOnController = FALSE;
              penPlayer->m_penController = NULL;
            }
          }
        }
        resume;
      }

      on (EEnd) : { stop; }
    }

    return;
  };
};
