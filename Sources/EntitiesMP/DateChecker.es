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

1007
%{
#include "StdH.h"
%}



class CDateChecker: CRationalEntity {
name      "DateChecker";
thumbnail "Thumbnails\\DateChecker.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName              "Name" 'N' = "Date Checker",                    // class name
  2 INDEX m_iDayToCheck             "Day to Check" 'D' = 1,                         // day
  3 INDEX m_iMonthToCheck           "Month to Check" 'M' = 1,                       // month
  4 CEntityPointer m_penTarget      "Target" 'T' COLOR(C_RED|0xFF),                 // send event to entity
  5 enum EventEType m_eetEvent      "Event type Target" 'G' = EET_TRIGGER,          // type of event to send
  6 CEntityPointer m_penCaused,     // who touched it last time


components:

  1 model   MODEL_MARKER     "Models\\Editor\\DateChecker.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\DateChecker.tex"


functions:

procedures:

  Main() {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // spawn in world editor
    autowait(0.1f);

    wait() {
    on (ETrigger eTrigger) : {
            SYSTEMTIME SysTime = {};
            GetSystemTime(&SysTime);

            m_penCaused = eTrigger.penCaused;
            if(m_iDayToCheck == SysTime.wDay && m_iMonthToCheck == SysTime.wMonth)
                    {
                      SendToTarget(m_penTarget, m_eetEvent, m_penCaused);
                    }
            resume;
        }
    }
    

    // cease to exist
    Destroy();

    return;
  };

};