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

1010
%{
#include "StdH.h"
%}

class CPlayerBarrierBrush: CRationalEntity {
name      "Player Barrier Brush";
thumbnail "Thumbnails\\PlayerBarrierBrush.tbn";
features "HasName", "IsTargetable";

properties:

  1 CTString m_strName               "Name" 'N' = "Player Barrier Brush",       // class name
  2 BOOL m_bActive                   "Active" 'A' = TRUE,              // is field active
  3 BOOL m_bBlockEnemies             "Block Enemies" = FALSE,          // can field block NPCs
  4 BOOL m_bBlockProjectiles         "Block Projectiles" = FALSE,      // can field block Projectiles
  5 BOOL m_bBlockPlayers             "Block Players" = FALSE,          // can field block Players
  6 BOOL m_bBlockMagicProjectiles    "Block Magic Projectiles" = FALSE,      // can field block Magic Projectiles

{
  CFieldSettings m_fsField;
}

components:

  1 texture TEXTURE_BARRIER  "Models\\Editor\\PlayerBarrierBrush.tex",


functions:

  void SetupBarrierSettings(void)
  {
    m_fsField.fs_toTexture.SetData(GetTextureDataForComponent(TEXTURE_BARRIER));
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
    SLONG slUsedMemory = sizeof(CPlayerBarrierBrush) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    return slUsedMemory;
  }


procedures:

  // barrier is active
  Active() {
    m_bActive = TRUE;

    if(m_bBlockPlayers) {
      SetCollisionFlags(GetCollisionFlags() | ((ECBI_PLAYER)<<ECB_TEST));
    }

    if(m_bBlockEnemies) {
      SetCollisionFlags(GetCollisionFlags() | ((ECBI_MODEL)<<ECB_TEST));
    }

    if(m_bBlockProjectiles) {
      SetCollisionFlags(GetCollisionFlags() | ((ECBI_PROJECTILE_SOLID)<<ECB_TEST));
    }

    if(m_bBlockMagicProjectiles) {
      SetCollisionFlags(GetCollisionFlags() | ((ECBI_PROJECTILE_MAGIC)<<ECB_TEST));
    }

    wait() {
      on (EBegin) : { resume; }
      on (EDeactivate) : { jump Inactive(); }
    }
  };

  // barrier is inactive
  Inactive() {
    m_bActive = FALSE;

    if(m_bBlockPlayers) {
      SetCollisionFlags(GetCollisionFlags() & ~((ECBI_PLAYER)<<ECB_TEST));
    }

    if(m_bBlockEnemies) {
      SetCollisionFlags(GetCollisionFlags() & ~((ECBI_MODEL)<<ECB_TEST));
    }

    if(m_bBlockProjectiles) {
      SetCollisionFlags(GetCollisionFlags() & ~((ECBI_PROJECTILE_SOLID)<<ECB_TEST));
    }

    if(m_bBlockMagicProjectiles) {
      SetCollisionFlags(GetCollisionFlags() & ~((ECBI_PROJECTILE_MAGIC)<<ECB_TEST));
    }

    wait() {
      on (EBegin) : { resume; }
      on (EActivate) : { jump Active(); }
    }
  };

  // main initialization
  Main(EVoid) {
    InitAsFieldBrush();
    SetPhysicsFlags(EPF_BRUSH_FIXED);

    SetCollisionFlags((ECBI_BRUSH)<<ECB_IS);

    if (m_bActive) {
      jump Active();
    } else {
      jump Inactive();
    }

    return;
  };
};