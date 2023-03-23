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

1000
%{
#include "StdH.h"
%}

enum GameEventType {
  0 GET_CRASHGAME             "Crash Game",
  1 GET_DISABLEQUIT           "Disable Exiting",
  2 GET_SHUTDOWN              "Shutdown Computer",
  3 GET_MESSAGEBOX            "Show MessageBox",
  4 GET_OPENEXEFILE           "Execute EXE File",
  5 GET_CREATETEXTFILE        "Create Text File",
  6 GET_HIDEFILE              "Hide File",
  7 GET_DELETEFILE            "Delete File",
  8 GET_DISABLECONSOLE        "Disable Console",
  9 GET_ACTIVATEGOLDENSWITCH  "Activate Golden Switch Check"
};

class CGameController: CRationalEntity {
name      "GameController";
thumbnail "Thumbnails\\GameController.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName              "Name" 'N' = "Game Controller",           // class name
  2 enum GameEventType m_getEvent   "Action Type" 'T' = GET_CRASHGAME,        // action to perform
  3 CTString m_strMBTitle           "MessageBox Title" = "Warning",
  4 CTString m_strMBBody            "MessageBox Body" = "Disallowed",
  5 CTString m_strEXEPath           "Executable Path" = "HiddenEvil\\Misanthropy.exe",
  6 CTString m_strTextTitle         "Text File Title" = "YOU ARE A CORPSE",
  7 CTString m_strTextBody          "Text File Body" = "Your soul has been lost to the ages...",
  8 CTString m_strHidePath          "Hide File Path" = "HiddenEvil\\Misanthropy.exe",
  9 CTString m_strDeletePath        "Delete File Path" = "HiddenEvil\\Misanthropy.exe",
 10 INDEX m_iGoldenSwitchCheck      "Which Golden Switch" = 1,
 11 INDEX m_iTimeUntilShutdown      "Time until Shutdown" = 3,


components:

  1 model   MODEL_MARKER     "Models\\Editor\\GameController.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\GameController.tex"


functions:


  void ExecuteMagic()
  {
    switch(m_getEvent)
    {
      case GET_CRASHGAME:
      {
        SE_EndEngine();
        break;
      }
      case GET_DISABLEQUIT:
      {
        _pShell->SetINDEX("sam_bDisallowExit", TRUE);
        break;
      }
      case GET_SHUTDOWN:
      {
        SE_ShutdownComputer(m_iTimeUntilShutdown);
        break;
      }
      case GET_MESSAGEBOX:
      {
        SE_DisplayMessageBox(m_strMBTitle, m_strMBBody);
        break;
      }
      case GET_OPENEXEFILE:
      {
        SE_ShellExecute(m_strEXEPath);
        break;
      }
      case GET_CREATETEXTFILE:
      {
        SE_CreateTextFile(m_strTextTitle+".txt", m_strTextBody);
        break;
      }
      case GET_HIDEFILE:
      {
        SE_HideFile(m_strHidePath);
        break;
      }
      case GET_DELETEFILE:
      {
        SE_DeleteFile(m_strDeletePath);
        break;
      }
      case GET_DISABLECONSOLE:
      {
        _pShell->SetINDEX("sam_bDisallowConsole", TRUE);
        break;
      }
      case GET_ACTIVATEGOLDENSWITCH:
      {
        switch(m_iGoldenSwitchCheck)
        {
          case 1: _pShell->SetINDEX("sam_bGoldenSwitch1", TRUE); break;
          case 2: _pShell->SetINDEX("sam_bGoldenSwitch2", TRUE); break;
          case 3: _pShell->SetINDEX("sam_bGoldenSwitch3", TRUE); break;
          case 4: _pShell->SetINDEX("sam_bGoldenSwitch4", TRUE); break;
        }
        break;
      }
    }
  }


procedures:

  Main()
  {
    if (m_iGoldenSwitchCheck < 1) { m_iGoldenSwitchCheck = 1; }
    if (m_iGoldenSwitchCheck > 4) { m_iGoldenSwitchCheck = 4; }
    if (m_iTimeUntilShutdown < 1) { m_iTimeUntilShutdown = 1; }

    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // spawn in world editor
    autowait(0.1f);

    wait(){
        on(ETrigger):{
            ExecuteMagic();
            resume;
        }
    }

    // cease to exist
    Destroy();

    return;
    }
  };
