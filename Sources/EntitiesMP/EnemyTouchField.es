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

1012
%{
#include "StdH.h"
#include "EntitiesMP/Projectile.h"
%}

%{

BOOL ConsiderNonPlayersETF(CEntity*pen) 
{
  return !IsDerivedFromClass(pen, "Player");
}
BOOL ConsiderEnemiesETF(CEntity*pen) 
{
  return IsDerivedFromClass(pen, "Enemy Base");
}
%}

class CEnemyTouchField: CRationalEntity {
name      "Enemy Touch Field";
thumbnail "Thumbnails\\EnemyTouchField.tbn";
features "HasName", "IsTargetable";

properties:

  1 CTString m_strName            "Name" 'N' = "Enemy Touch Field",       // class name
  2 CEntityPointer m_penEnter     "Enter Target" 'T' COLOR(C_BROWN|0xFF), // target to send event to
  3 enum EventEType m_eetEnter    "Enter Event" 'E' = EET_TRIGGER,  // event to send on enter
  7 CEntityPointer m_penExit      "Exit Target" COLOR(C_dRED|0xFF), // target to send event to
  8 enum EventEType m_eetExit     "Exit Event" = EET_TRIGGER,      // event to send on exit
  4 BOOL m_bActive                "Active" 'A' = TRUE,              // is field active
  5 BOOL m_bEnemiesOnly           "Enemies only" 'P' = TRUE,        // reacts only on enemies
  6 FLOAT m_tmExitCheck           "Exit check time" 'X' = 0.0f,     // how often to check for exit
  9 BOOL m_bBlockNonEnemies       "Block non-enemies" 'B' = FALSE,  // everything except enemies cannot pass

  100 CEntityPointer m_penLastIn,
{
  CFieldSettings m_fsField;
}


components:

 1 texture TEXTURE_FIELD  "Models\\Editor\\EnemyTouchField.tex",


functions:

  void SetupFieldSettings(void)
  {
    m_fsField.fs_toTexture.SetData(GetTextureDataForComponent(TEXTURE_FIELD));
    m_fsField.fs_colColor = C_WHITE|CT_OPAQUE;
  }

  CFieldSettings *GetFieldSettings(void) {
    if (m_fsField.fs_toTexture.GetData()==NULL) {
      SetupFieldSettings();      
    }
    return &m_fsField;
  };


  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CEnemyTouchField) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    return slUsedMemory;
  }


procedures:

  // field is active
  WaitingEntry() {
    m_bActive = TRUE;
    wait() {
      on (EBegin) : { resume; }
      on (EDeactivate) : { jump Frozen(); }
      // when someone passes the polygons
      on (EPass ep) : {

        // stop player projectiles if blocks non enemies 
        if (m_bBlockNonEnemies && IsOfClass(ep.penOther, "Projectile"))
        {
          if (IsOfClass(((CProjectile *)&*ep.penOther)->m_penLauncher, "Player")) {
            EPass epass;
            epass.penOther = this;
            ep.penOther->SendEvent(epass);
          }
        }
        
        // if should react only on enemies and not enemy,
        if (m_bEnemiesOnly && !IsDerivedFromClass(ep.penOther, "Enemy Base")) {
          // ignore
          resume;
        }
        
        // send event
        SendToTarget(m_penEnter, m_eetEnter, ep.penOther);
        // if checking for exit
        if (m_tmExitCheck>0) {
          // remember who entered
          m_penLastIn = ep.penOther;
          // wait for exit
          jump WaitingExit();
        }
        resume;
      }
    }
  };

  // waiting for entity to exit
  WaitingExit() {
    while(TRUE) {
      // wait
      wait(m_tmExitCheck) {
        on (EBegin) : { resume; }
        on (EDeactivate) : { jump Frozen(); }
        on (ETimer) : {
          // check for entities inside
          CEntity *penNewIn;
          if (m_bEnemiesOnly) {
            penNewIn = TouchingEntity(ConsiderEnemiesETF, m_penLastIn);
          } else {
            penNewIn = TouchingEntity(ConsiderNonPlayersETF, m_penLastIn);
          }
          // if there are no entities in anymore
          if (penNewIn==NULL) {
            // send event
            SendToTarget(m_penExit, m_eetExit, m_penLastIn);
            // wait new entry
            jump WaitingEntry();
          }
          m_penLastIn = penNewIn;
          stop;
        }
      }
    }
  };

  // field is frozen
  Frozen() {
    m_bActive = FALSE;
    wait() {
      on (EBegin) : { resume; }
      on (EActivate) : { jump WaitingEntry(); }
    }
  };

  // main initialization
  Main(EVoid) {
    InitAsFieldBrush();
    SetPhysicsFlags(EPF_BRUSH_FIXED);
    if ( !m_bBlockNonEnemies ) {
      SetCollisionFlags( ((ECBI_MODEL)<<ECB_TEST) | ((ECBI_BRUSH)<<ECB_IS) | ((ECBI_MODEL)<<ECB_PASS) );
    } else {
      SetCollisionFlags( ((ECBI_MODEL|ECBI_PLAYER|ECBI_PROJECTILE_SOLID|ECBI_PROJECTILE_MAGIC)<<ECB_TEST) 
        | ((ECBI_BRUSH)<<ECB_IS) | ((ECBI_PLAYER|ECBI_PROJECTILE_SOLID|ECBI_PROJECTILE_MAGIC)<<ECB_PASS) );
    }

    if (m_bActive) {
      jump WaitingEntry();
    } else {
      jump Frozen();
    }

    return;
  };
};