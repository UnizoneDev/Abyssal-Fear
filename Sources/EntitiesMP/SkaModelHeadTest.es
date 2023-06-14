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

1035
%{
#include "StdH.h"
%}

uses "EntitiesMP/Player";

class CSkaModelHeadTest: CMovableModelEntity {
name      "SkaModelHeadTest";
thumbnail "Thumbnails\\SkaModelHeadTest.tbn";
features  "HasName";

properties:
  1 CTString m_strName                    "Name" 'N' = "Ska Model Head Test",              // class name
  2 FLOAT m_fToPlayer = 0.0f,

components:

functions:

CPlayer *AcquireViewTarget() {
    // find actual number of players
    INDEX ctMaxPlayers = GetMaxPlayers();
    CEntity *penPlayer;

    for(INDEX i=0; i<ctMaxPlayers; i++) {
      penPlayer=GetPlayerEntity(i);
      if (penPlayer!=NULL && DistanceTo(this, penPlayer)<100.0f) {
            return (CPlayer *)penPlayer;   
      }
    }
    return NULL;
  };


void AdjustBones(void) {
    // Get head bone
    INDEX iBoneID = ska_GetIDFromStringTable("Head");
    RenBone *rb = RM_FindRenBone(iBoneID);

    if (rb != NULL) {
        // Set rotation via quaternion
        FLOATquat3D quat;
        quat.FromEuler(ANGLE3D(0.0f, -30.0f, -m_fToPlayer));
        rb->rb_arRot.ar_qRot = quat;
    }
}

void PostMoving()
{
  CMovableModelEntity::PostMoving();
  FLOAT3D vPlayerPos = FLOAT3D(0.0f, 0.0f, 0.0f);

  CPlayer *pTarget = AcquireViewTarget();
  if(pTarget) {
      if ((pTarget->GetFlags()&ENF_ALIVE) && !(pTarget->GetFlags()&ENF_DELETED)) {
         vPlayerPos = pTarget->GetLerpedPlacement().pl_PositionVector;
      }
  }

  FLOAT3D vToPlayer = (vPlayerPos - GetLerpedPlacement().pl_PositionVector).Normalize();
  FLOAT fHeadingTowardsPlayer = GetRelativeHeading(-vToPlayer); // CEnemyBase method

  fHeadingTowardsPlayer = Clamp(fHeadingTowardsPlayer, -45.0f, 45.0f); // Limit

  FLOAT fDiff = fHeadingTowardsPlayer - m_fToPlayer;

  // Limit speed per tick (15.0f)
  m_fToPlayer += Min(Abs(fDiff), 15.0f) * Sgn(fDiff);
}

procedures:

  Main()
  {
    InitAsSkaModel();
    SetPhysicsFlags(EPF_MODEL_FIXED);
    SetCollisionFlags(ECF_MODEL_HOLDER);

    BOOL bLoadOK = TRUE;
    CTFileName fnSinnerModel = CTFILENAME("Models\\NPCs\\Sinner\\SKASinnerTest\\Sinner1.smc");
    // try to load the model
    try {
      SetSkaModel_t(fnSinnerModel);
      // if failed
    } catch(char *strError) {
      WarningMessage(TRANS("Cannot load ska model '%s':\n%s"), (CTString&)fnSinnerModel, strError);
      bLoadOK = FALSE;
      // set colision info for default model
      //SetSkaColisionInfo();
    }
    if (!bLoadOK) {
      SetSkaModel(CTFILENAME("Models\\Editor\\Ska\\Axis.smc"));
    }

    ModelChangeNotify();

    // spawn in world editor
    autowait(0.1f);
    
    wait() {
        on(EBegin) : { resume; }
        otherwise() : { resume; }
    }

    Destroy();

    return;
  };
};