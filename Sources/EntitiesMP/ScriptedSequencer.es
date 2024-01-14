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

1037
%{
#include "StdH.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/EnemyMarker";

enum EnemySoundType {
  0 EST_NONE         "None",
  1 EST_SIGHT        "Sight",
  2 EST_WOUND        "Wound",
  3 EST_DEATH        "Death",
  4 EST_IDLE         "Idle",
  5 EST_ACTIVE       "Active",
  6 EST_TAUNT        "Taunt",
  7 EST_LEADERSIGHT  "Leader Alert",
  8 EST_PAIN         "Pain",
  9 EST_QUESTION     "Question",
 10 EST_ANSWER       "Answer",
 11 EST_CUSTOM1      "Custom 1",
 12 EST_CUSTOM2      "Custom 2",
 13 EST_CUSTOM3      "Custom 3",
 14 EST_CUSTOM4      "Custom 4",
 15 EST_CUSTOM5      "Custom 5",
 16 EST_CUSTOM6      "Custom 6",
 17 EST_CUSTOM7      "Custom 7",
 18 EST_CUSTOM8      "Custom 8",
 19 EST_CUSTOM9      "Custom 9",
 20 EST_CUSTOM10     "Custom 10",
};

// event sent to the enemy/NPC that should do this
event EChangeSequence {
  INDEX iModelAnim,
  INDEX iModelCollisionBox,
  CEntityPointer penEnemyMarker,
  enum EnemySoundType estSoundType,
  BOOL bLoopAnimation,
  CTString strSkaModelAnim,
  CTString strSkaModelBox,
};

class CScriptedSequencer : CRationalEntity {
name      "ScriptedSequencer";
thumbnail "Thumbnails\\ScriptedSequencer.tbn";
features "HasName", "HasTarget", "IsTargetable";

properties:

  1 CTString m_strName                  "Name" 'N' = "Scripted Sequencer",           // class name
  2 INDEX m_iCollisionBox               "Collision Box" 'B' = 0,
  3 ANIMATION m_iEnemyAnim              "Enemy Animation" 'M' = 0,
  4 CEntityPointer m_penTarget          "Marker Target" 'T' COLOR(C_RED|0xFF),
  5 CEntityPointer m_penEnemy           "Enemy" COLOR(C_GREEN|0xFF),
  6 enum EnemySoundType m_estSoundType  "Enemy Sound Type" = EST_NONE,
  7 BOOL m_bLoopAnimation               "Loop Animation" = FALSE,
  8 CTString m_strSkaEnemyAnim          "Ska Enemy Animation" = "",
  9 CTString m_strSkaEnemyBox           "Ska Enemy Collision Box" = "",

components:

  1 model   MODEL_MARKER     "Models\\Editor\\ScriptedSequencer.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\ScriptedSequencer.tex"

functions:

  /* Get anim data for given animation property - return NULL for none. */
  CAnimData *GetAnimData(SLONG slPropertyOffset) 
  {
    CEntity *penTarget = m_penEnemy;

    if (penTarget==NULL) {
      return NULL;
    }

    // if enemy
    if (IsDerivedFromClass(penTarget, "Enemy Base")) {
      CEnemyBase *penEnemy = (CEnemyBase*)&*penTarget;
      if (slPropertyOffset==offsetof(CScriptedSequencer, m_iEnemyAnim)) {
        if(penEnemy->GetRenderType()==CEntity::RT_SKAMODEL) {
          return CEntity::GetAnimData(slPropertyOffset);
        } else {
          return penEnemy->GetModelObject()->GetData();
        }
      }
    }

    return CEntity::GetAnimData(slPropertyOffset);
  };

procedures:

  Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    if (m_penEnemy==NULL) {
      return;
    }

    // check enemy type
    if (m_penEnemy!=NULL && 
      !IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
      WarningMessage("Enemy target must be derived from EnemyBase!");
      m_penEnemy=NULL;
    }

    if (m_penTarget==NULL) {
      return;
    }

    // check marker type
    if (m_penTarget!=NULL && 
      !IsOfClass(m_penTarget, "Enemy Marker")) {
      WarningMessage("Marker Target must be EnemyMarker!");
      m_penTarget=NULL;
    }

    // spawn in world editor
    autowait(0.1f);
    
    wait() {
      on (EBegin) : { resume; }
      on (ETrigger) : {
          EChangeSequence eSequence;
          eSequence.iModelAnim = m_iEnemyAnim;
          eSequence.iModelCollisionBox = m_iCollisionBox;
          eSequence.penEnemyMarker = m_penTarget;
          eSequence.estSoundType = m_estSoundType;
          eSequence.bLoopAnimation = m_bLoopAnimation;
          eSequence.strSkaModelAnim = m_strSkaEnemyAnim;
          eSequence.strSkaModelBox = m_strSkaEnemyBox;
          m_penEnemy->SendEvent(eSequence);
          resume;
      }
      on (EEnd) : { stop; }
    }
    

    // cease to exist
    Destroy();

    return;
    }
  };