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

/*
 *  Looping Trigger.
 */
1016
%{
#include "StdH.h"
%}

class CLoopingTrigger : CRationalEntity {
name      "LoopingTrigger";
thumbnail "Thumbnails\\LoopingTrigger.tbn";
features "HasName", "IsTargetable";


properties:

  1 CTString m_strName            "Name" 'N' = "Looping Trigger",         // class name
  
  2 FLOAT m_fWaitTime             "Wait" 'W' = 0.0f,                      // wait before send events
  3 BOOL m_bActive                "Active" 'V' = TRUE,                    // starts in active/inactive state
  4 BOOL m_bAutoStart             "Auto start" 'A' = FALSE,               // trigger auto starts
  5 FLOAT m_fInbetweenWaitTime    "In-between Wait" = 1.0f,                // wait before send events
  6 CEntityPointer m_penCaused,                                           // who touched it last time
  7 CEntityPointer m_penTarget1    "Target 01" 'T' COLOR(C_RED|0xFF),        // send event to entity
  8 CEntityPointer m_penTarget2    "Target 02" COLOR(C_RED|0xFF),            // send event to entity
  9 CEntityPointer m_penTarget3    "Target 03" COLOR(C_RED|0xFF),        // send event to entity
 10 CEntityPointer m_penTarget4    "Target 04" COLOR(C_RED|0xFF),            // send event to entity
 11 CEntityPointer m_penTarget5    "Target 05" COLOR(C_RED|0xFF),            // send event to entity
 12 CEntityPointer m_penTarget6    "Target 06" COLOR(C_RED|0xFF),        // send event to entity
 13 CEntityPointer m_penTarget7    "Target 07" COLOR(C_RED|0xFF),            // send event to entity
 14 CEntityPointer m_penTarget8    "Target 08" COLOR(C_RED|0xFF),        // send event to entity
 15 CEntityPointer m_penTarget9    "Target 09" COLOR(C_RED|0xFF),            // send event to entity
 16 CEntityPointer m_penTarget10   "Target 10" COLOR(C_RED|0xFF),            // send event to entity
 17 enum EventEType m_eetEvent1    "Event type Target 01" 'G' = EET_TRIGGER,  // type of event to send
 18 enum EventEType m_eetEvent2    "Event type Target 02" = EET_TRIGGER,  // type of event to send
 19 enum EventEType m_eetEvent3    "Event type Target 03" = EET_TRIGGER,  // type of event to send
 20 enum EventEType m_eetEvent4    "Event type Target 04" = EET_TRIGGER,  // type of event to send
 21 enum EventEType m_eetEvent5    "Event type Target 05" = EET_TRIGGER,  // type of event to send
 22 enum EventEType m_eetEvent6    "Event type Target 06" = EET_TRIGGER,  // type of event to send
 23 enum EventEType m_eetEvent7    "Event type Target 07" = EET_TRIGGER,  // type of event to send
 24 enum EventEType m_eetEvent8    "Event type Target 08" = EET_TRIGGER,  // type of event to send
 25 enum EventEType m_eetEvent9    "Event type Target 09" = EET_TRIGGER,  // type of event to send
 26 enum EventEType m_eetEvent10   "Event type Target 10" = EET_TRIGGER,  // type of event to send

components:

  1 model   MODEL_MARKER     "Models\\Editor\\Trigger.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Camera.tex"


functions:

  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CLoopingTrigger) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    return slUsedMemory;
  }



procedures:

  SendEventToTargets()
  {
    // if needed wait some time before event is send
    if (m_fWaitTime > 0.0f)
    {
      wait (m_fWaitTime) {
        on (EBegin) : { resume; }
        on (ETimer) : { stop; }
        on (EDeactivate) : { pass; }
        otherwise(): { resume; }
      }
    }

    // send event to the target
    while(TRUE)
    {
      SendToTarget(m_penTarget1, m_eetEvent1, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget2, m_eetEvent2, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget3, m_eetEvent3, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget4, m_eetEvent4, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget5, m_eetEvent5, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget6, m_eetEvent6, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget7, m_eetEvent7, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget8, m_eetEvent8, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget9, m_eetEvent9, m_penCaused);
      autowait(m_fInbetweenWaitTime);
      SendToTarget(m_penTarget10, m_eetEvent10, m_penCaused);
      autowait(m_fInbetweenWaitTime);
    }

    return;
  };

  Active() {
    ASSERT(m_bActive);

    //main loop
    wait() {
      on (EBegin) : { 
        // if auto start send event on init
        if (m_bAutoStart) {
          call SendEventToTargets();
        }
        resume;
      }

      // cascade trigger
      on (ETrigger eTrigger) : {
        m_penCaused = eTrigger.penCaused;
        call SendEventToTargets();
        resume;
      }

      // if deactivated
      on (EDeactivate) : {
        // go to inactive state
        m_bActive = FALSE;
        jump Inactive();
      }
    }
  };

  Inactive() {
    ASSERT(!m_bActive);
    while (TRUE) {
      // wait 
      wait() {
        // if activated
        on (EActivate) : {
          // go to active state
          m_bActive = TRUE;
          jump Active();
        }
        otherwise() : {
          resume;
        };
      };
      
      // wait a bit to recover
      autowait(0.1f);
    }
  }


  Main(EVoid)
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // spawn in world editor
    autowait(0.1f);

    // go into active or inactive state
    if (m_bActive) {
      jump Active();
    } else {
      jump Inactive();
    }

    // cease to exist
    Destroy();

    return;
  }
};
