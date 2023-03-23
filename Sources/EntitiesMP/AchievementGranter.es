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
 *  Achievement Granter
 */

1021
%{
#include "StdH.h"
#include "EntitiesMP/Player.h"
%}

enum AchievementType {
  0 AT_ALLENDINGS         "Obsessive",
  1 AT_DEATHWISH          "Deathwish",
  2 AT_GOODENDING         "End The Torment",
  3 AT_TREASURER          "Treasurer",
  4 AT_DIE10TIMES         "Keel Over And Die",
  5 AT_DISOBEYGUNMEN      "Scared Straight",
  6 AT_CURETWITCHERS      "Flap Your Hands",
  7 AT_ALLYABUSE          "Stop Freaking Betraying Me"
};

%{
  typedef void (*CProgressFunc)(INDEX, INDEX, INDEX);
  static CProgressFunc pProgressAchievement = NULL;

  void CAchievementGranter_OnInitClass(void) {
    pProgressAchievement = (CProgressFunc)_pShell->GetSymbol("ProgressAchievement", TRUE)->ss_pvValue;
  };
%}

class CAchievementGranter: CRationalEntity {
name      "AchievementGranter";
thumbnail "Thumbnails\\AchievementGranter.tbn";
features  "HasName", "IsTargetable", "ImplementsOnInitClass";

properties:

  1 CTString m_strName                    "Name" 'N' = "Achievement Granter",              // class name
  2 enum AchievementType m_atAchievement  "Achievement Type" 'T' = AT_ALLENDINGS,     // action to perform
  3 INDEX m_iProgressToAdd                "Progress To Add" = 1,

components:

  1 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"


functions:
  void AddProgress()
  {
    switch(m_atAchievement)
      {
        case AT_ALLENDINGS:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_DEATHWISH:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_GOODENDING:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_TREASURER:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_DIE10TIMES:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_DISOBEYGUNMEN:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_CURETWITCHERS:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
        case AT_ALLYABUSE:
        {
          pProgressAchievement(m_atAchievement, FALSE, m_iProgressToAdd);
          break;
        }
    }
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

    // spawn in world editor
    autowait(0.1f);

    
    wait() {
      on (ETrigger) : {
          AddProgress();
          resume;
      }
    }
    

    // cease to exist
    Destroy();

    return;
    }
  };