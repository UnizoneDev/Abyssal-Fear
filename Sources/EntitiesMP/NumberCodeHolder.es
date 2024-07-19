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

1054
%{
#include "StdH.h"
%}

enum NumberCodeType {
  0 NCT_3     "Three Numbers",
  1 NCT_4     "Four Numbers",
  2 NCT_5     "Five Numbers",
};

class CNumberCodeHolder: CRationalEntity {
name      "NumberCodeHolder";
thumbnail "Thumbnails\\NumberCodeHolder.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName                 "Name" 'N' = "Number Code Holder",               // class name
  2 CEntityPointer m_penTarget         "Target" 'T' COLOR(C_RED|0xFF),              // send event to entity
  3 enum EventEType m_eetEvent         "Event type Target" 'G' = EET_TRIGGER,       // type of event to send
  4 CEntityPointer m_penCaused,        // who touched it last time

  // for passcode puzzles
  5 enum NumberCodeType m_nctAmount "Number Amount" = NCT_4,
  10 INDEX m_iCodeNumber1 "Code Number 1" = 1,
  11 INDEX m_iCodeNumber2 "Code Number 2" = 1,
  12 INDEX m_iCodeNumber3 "Code Number 3" = 1,
  13 INDEX m_iCodeNumber4 "Code Number 4" = 1,
  14 INDEX m_iCodeNumber5 "Code Number 5" = 1,
  15 INDEX m_iRightNumber1 "Correct Number 1" = 1,
  16 INDEX m_iRightNumber2 "Correct Number 2" = 1,
  17 INDEX m_iRightNumber3 "Correct Number 3" = 1,
  18 INDEX m_iRightNumber4 "Correct Number 4" = 1,
  19 INDEX m_iRightNumber5 "Correct Number 5" = 1,

  20 BOOL m_bRandomValues   "Apply RND values"   = FALSE, // apply random numerals

components:

  1 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"

functions:

  

procedures:

CheckNumbers() {
  BOOL bTrigger = TRUE;
  INDEX iAmount = 3;

  switch(m_nctAmount)
  {
    case NCT_3: iAmount = 3; break;
    case NCT_4: iAmount = 4; break;
    case NCT_5: iAmount = 5; break;
  }

  for (INDEX i = 0; i < iAmount; i++) {
    INDEX &pIndex = (&m_iCodeNumber1)[i];

    INDEX &pRightIndex = (&m_iRightNumber1)[i];

    // At least one of the valid numbers isn't in correct
    if (pIndex != pRightIndex) {
      bTrigger = FALSE;
      break;
    }
  }

  if (bTrigger) {
    SendToTarget(m_penTarget, m_eetEvent, m_penCaused);
  }

  return EReturn();
};

Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    m_iCodeNumber1 = Clamp(m_iCodeNumber1, INDEX(0), INDEX(9));
    m_iCodeNumber2 = Clamp(m_iCodeNumber2, INDEX(0), INDEX(9));
    m_iCodeNumber3 = Clamp(m_iCodeNumber3, INDEX(0), INDEX(9));
    m_iCodeNumber4 = Clamp(m_iCodeNumber4, INDEX(0), INDEX(9));
    m_iCodeNumber5 = Clamp(m_iCodeNumber5, INDEX(0), INDEX(9));
    m_iRightNumber1 = Clamp(m_iRightNumber1, INDEX(0), INDEX(9));
    m_iRightNumber2 = Clamp(m_iRightNumber2, INDEX(0), INDEX(9));
    m_iRightNumber3 = Clamp(m_iRightNumber3, INDEX(0), INDEX(9));
    m_iRightNumber4 = Clamp(m_iRightNumber4, INDEX(0), INDEX(9));
    m_iRightNumber5 = Clamp(m_iRightNumber5, INDEX(0), INDEX(9));

    if (m_bRandomValues) {
      m_bRandomValues = FALSE;
      m_iCodeNumber1 = IRnd() % 10;
      m_iCodeNumber2 = IRnd() % 10;
      m_iCodeNumber3 = IRnd() % 10;
      m_iCodeNumber4 = IRnd() % 10;
      m_iCodeNumber5 = IRnd() % 10;
    }

    // spawn in world editor
    autowait(0.1f);

    wait() {
      on (EBegin) : { resume; }
      on (ETrigger eTrigger) : {
          CheckNumbers(eTrigger);
          resume;
      }
      on (EChangeIntegerValue eChangeInt) : {
          switch(eChangeInt.EncodopType) {
            case NCOT_ADD: {
              switch(eChangeInt.iChangedValue) {
                case 1:
                m_iCodeNumber1 += eChangeInt.iValue;
                break;
                case 2:
                m_iCodeNumber2 += eChangeInt.iValue;
                break;
                case 3:
                m_iCodeNumber3 += eChangeInt.iValue;
                break;
                case 4:
                m_iCodeNumber4 += eChangeInt.iValue;
                break;
                case 5:
                m_iCodeNumber5 += eChangeInt.iValue;
                break;
              }
            } break;
            case NCOT_SUBTRACT: {
              switch(eChangeInt.iChangedValue) {
                case 1:
                m_iCodeNumber1 -= eChangeInt.iValue;
                break;
                case 2:
                m_iCodeNumber2 -= eChangeInt.iValue;
                break;
                case 3:
                m_iCodeNumber3 -= eChangeInt.iValue;
                break;
                case 4:
                m_iCodeNumber4 -= eChangeInt.iValue;
                break;
                case 5:
                m_iCodeNumber5 -= eChangeInt.iValue;
                break;
              }
            } break;
            case NCOT_MULTIPLY: {
              switch(eChangeInt.iChangedValue) {
                case 1:
                m_iCodeNumber1 *= eChangeInt.iValue;
                break;
                case 2:
                m_iCodeNumber2 *= eChangeInt.iValue;
                break;
                case 3:
                m_iCodeNumber3 *= eChangeInt.iValue;
                break;
                case 4:
                m_iCodeNumber4 *= eChangeInt.iValue;
                break;
                case 5:
                m_iCodeNumber5 *= eChangeInt.iValue;
                break;
              }
            } break;
            case NCOT_DIVIDE: {
              switch(eChangeInt.iChangedValue) {
                case 1:
                m_iCodeNumber1 /= eChangeInt.iValue;
                break;
                case 2:
                m_iCodeNumber2 /= eChangeInt.iValue;
                break;
                case 3:
                m_iCodeNumber3 /= eChangeInt.iValue;
                break;
                case 4:
                m_iCodeNumber4 /= eChangeInt.iValue;
                break;
                case 5:
                m_iCodeNumber5 /= eChangeInt.iValue;
                break;
              }
            } break;
            case NCOT_ASSIGN: {
              switch(eChangeInt.iChangedValue) {
                case 1:
                m_iCodeNumber1 = eChangeInt.iValue;
                break;
                case 2:
                m_iCodeNumber2 = eChangeInt.iValue;
                break;
                case 3:
                m_iCodeNumber3 = eChangeInt.iValue;
                break;
                case 4:
                m_iCodeNumber4 = eChangeInt.iValue;
                break;
                case 5:
                m_iCodeNumber5 = eChangeInt.iValue;
                break;
              }
            } break;
            default: break;
          }
          resume;
      }
      on (EEnd) : { stop; }
    }

    // cease to exist
    Destroy();

    return;
    }
  };