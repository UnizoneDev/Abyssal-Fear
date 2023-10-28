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

enum SkaModelHeadCharacterType {
  0 SKHCT_CORPSE1RED "Corpse 1 Red",
  1 SKHCT_CORPSE1BROWN "Corpse 1 Brown",
};

enum SkaModelHeadAnimationType {
  0 SKHAT_TPOSE     "TPose",
  1 SKHAT_ONBACK    "On back",
  2 SKHAT_ONFRONT   "On front",
  3 SKHAT_CRUCIFIED "Crucified",
};

%{
  static INDEX idCorpseAnim_TPose      = -1;
  static INDEX idCorpseAnim_OnBack     = -1;
  static INDEX idCorpseAnim_OnFront    = -1;
  static INDEX idCorpseAnim_Crucified  = -1;
  static INDEX idCorpseBox_TPose       = -1;
  static INDEX idCorpseBox_OnBack      = -1;
  static INDEX idCorpseBox_OnFront     = -1;
%}

class CSkaModelHeadTest: CMovableModelEntity {
name      "SkaModelHeadTest";
thumbnail "Thumbnails\\SkaModelHeadTest.tbn";
features  "HasName";

properties:
  1 CTString m_strName                    "Name" 'N' = "Ska Model Head Test",              // class name
  2 FLOAT m_fToPlayer = 0.0f,
  3 FLOAT m_fToPlayerPitch = 0.0f,
  4 enum SkaModelHeadCharacterType m_skhcType "Character" 'C' = SKHCT_CORPSE1RED,
  5 enum SkaModelHeadAnimationType m_skhaType "Animation" 'A' = SKHAT_TPOSE,

components:

functions:

void CSkaModelHeadTest(void) {
  // Get animation IDs
  idCorpseAnim_TPose      = ska_GetIDFromStringTable("TPOSE");
  idCorpseAnim_OnBack     = ska_GetIDFromStringTable("ONBACK1");
  idCorpseAnim_OnFront    = ska_GetIDFromStringTable("ONFRONT1");
  idCorpseAnim_Crucified  = ska_GetIDFromStringTable("CRUCIFIED");

  // Get collision box IDs
  idCorpseBox_TPose       = ska_GetIDFromStringTable("DefaultTPose");
  idCorpseBox_OnBack      = ska_GetIDFromStringTable("DefaultOnBack");
  idCorpseBox_OnFront     = ska_GetIDFromStringTable("DefaultOnFront");
};

void BuildModelInstance() {
  en_pmiModelInstance = CreateModelInstance("SkaModelHeadTest");
  CModelInstance *pmi = GetModelInstance();
  try {
    // setup staring corpse
    pmi->AddMesh_t((CTString)"Models\\NPCs\\Corpse\\SKACorpse1\\Corpse1.bm");
    pmi->AddSkeleton_t((CTString)"Models\\NPCs\\Corpse\\SKACorpse1\\Corpse1.bs");
    pmi->AddAnimSet_t((CTString)"Models\\NPCs\\Corpse\\SKACorpse1\\Corpse1.ba");
    pmi->AddTexture_t((CTString)"Models\\NPCs\\Corpse\\Corpse1\\Corpse1.tex","Corpse1",NULL);
    pmi->AddColisionBox("DefaultTPose",FLOAT3D(-0.5f,0.0f,-0.5f),FLOAT3D(0.5f,2.125f,0.5f));

    // Set colision info
    SetSkaColisionInfo();
  } catch(char *strErr) {
    FatalError(strErr);
  }
};

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

    FLOAT3D vPlayerPos = FLOAT3D(0.0f, 0.0f, 0.0f);

    CPlayer *pTarget = AcquireViewTarget();
    if(pTarget) {
        if ((pTarget->GetFlags()&ENF_ALIVE) && !(pTarget->GetFlags()&ENF_DELETED)) {
           vPlayerPos = pTarget->GetLerpedPlacement().pl_PositionVector;
        }
    }

    FLOAT3D vToPlayer = (vPlayerPos - GetLerpedPlacement().pl_PositionVector).Normalize();
    FLOAT fHeadingTowardsPlayer = GetRelativeHeading(-vToPlayer); // CEnemyBase method
    FLOAT fPitchTowardsPlayer = GetRelativePitch(-vToPlayer); // CEnemyBase method

    fHeadingTowardsPlayer = Clamp(fHeadingTowardsPlayer, -45.0f, 45.0f); // Limit
    fPitchTowardsPlayer = Clamp(fPitchTowardsPlayer, -45.0f, -30.0f); // Limit

    FLOAT fDiff = fHeadingTowardsPlayer - m_fToPlayer;
    FLOAT fDiffPitch = fPitchTowardsPlayer - m_fToPlayerPitch;

    // Limit speed per tick (15.0f)
    m_fToPlayer += Min(Abs(fDiff), 15.0f) * Sgn(fDiff);
    m_fToPlayerPitch += Min(Abs(fDiffPitch), 15.0f) * Sgn(fDiffPitch);

    if (rb != NULL) {
        // Set rotation via quaternion
        FLOATquat3D quat;
        quat.FromEuler(ANGLE3D(0.0f, m_fToPlayerPitch, -m_fToPlayer));
        rb->rb_arRot.ar_qRot = quat;
    }
}

void PostMoving()
{
  CMovableModelEntity::PostMoving();
}

procedures:

  Main()
  {
    InitAsSkaModel();
    SetPhysicsFlags(EPF_MODEL_FIXED);
    SetCollisionFlags(ECF_MODEL_HOLDER);

    BOOL bLoadOK = TRUE;
    CTFileName fnCorpseModel = CTFILENAME("Models\\NPCs\\Corpse\\SKACorpse1\\Corpse1.smc");
    // try to load the model
    try {
      SetSkaModel_t(fnCorpseModel);
      // if failed
    } catch(char *strError) {
      WarningMessage(TRANS("Cannot load ska model '%s':\n%s"), (CTString&)fnCorpseModel, strError);
      bLoadOK = FALSE;
      // set colision info for default model
      //SetSkaColisionInfo();
    }
    if (!bLoadOK) {
      SetSkaModel(CTFILENAME("Models\\Editor\\Ska\\Axis.smc"));
    }

    switch(m_skhcType)
    {
      case SKHCT_CORPSE1RED:
      {
        
      }
      break;
      case SKHCT_CORPSE1BROWN:
      {
        
      }
      break;
    }

    switch(m_skhaType)
    {
      case SKHAT_TPOSE:
      {
       GetModelInstance()->AddAnimation(idCorpseAnim_TPose,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
       INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idCorpseBox_TPose);
       ASSERT(iBoxIndex>=0);
       ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      }
      break;

      case SKHAT_ONBACK:
      {
       GetModelInstance()->AddAnimation(idCorpseAnim_OnBack,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
       INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idCorpseBox_OnBack);
       ASSERT(iBoxIndex>=0);
       ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      }
      break;

      case SKHAT_ONFRONT:
      {
       GetModelInstance()->AddAnimation(idCorpseAnim_OnFront,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
       INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idCorpseBox_OnFront);
       ASSERT(iBoxIndex>=0);
       ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      }
      break;

      case SKHAT_CRUCIFIED:
      {
       GetModelInstance()->AddAnimation(idCorpseAnim_Crucified,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
       INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idCorpseBox_TPose);
       ASSERT(iBoxIndex>=0);
       ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      }
      break;
    }

    ModelChangeNotify();
    
    wait() {
        on(EBegin) : { resume; }
        otherwise() : { resume; }
    }

    Destroy();

    return;
  };
};