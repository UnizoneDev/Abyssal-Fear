/* Copyright (c) 2021-2023 Uni Musuotankarep
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

#include "StdH.h"
#include <Engine/CurrentVersion.h>
#include "MenuPrinting.h"
#include "MenuStuff.h"
#include "MAchievements.h"


CListHead _lhAllAchievements;
CListHead _lhFilteredAchievements;


void CAchievementsMenu::Initialize_t(void)
{
  gm_mgTitle.mg_boxOnScreen = BoxTitle();
  gm_mgTitle.mg_strText = TRANS("ACHIEVEMENTS");
  gm_lhGadgets.AddTail(gm_mgTitle.mg_lnNode);

  for (INDEX iLabel = 0; iLabel < ACHIEVEMENTS_ON_SCREEN; iLabel++)
  {
      INDEX iPrev = (ACHIEVEMENTS_ON_SCREEN + iLabel - 1) % ACHIEVEMENTS_ON_SCREEN;
      INDEX iNext = (iLabel + 1) % ACHIEVEMENTS_ON_SCREEN;
      // initialize label gadgets
      gm_mgAchievements[iLabel].mg_pmgUp = &gm_mgAchievements[iPrev];
      gm_mgAchievements[iLabel].mg_pmgDown = &gm_mgAchievements[iNext];
      gm_mgAchievements[iLabel].mg_boxOnScreen = BoxMediumRow(iLabel);
      gm_mgAchievements[iLabel].mg_pActivatedFunction = NULL; // never called!
      gm_lhGadgets.AddTail(gm_mgAchievements[iLabel].mg_lnNode);
  }

  gm_lhGadgets.AddTail(gm_mgArrowUp.mg_lnNode);
  gm_lhGadgets.AddTail(gm_mgArrowDn.mg_lnNode);
  gm_mgArrowUp.mg_adDirection = AD_UP;
  gm_mgArrowDn.mg_adDirection = AD_DOWN;
  gm_mgArrowUp.mg_boxOnScreen = BoxArrow(AD_UP);
  gm_mgArrowDn.mg_boxOnScreen = BoxArrow(AD_DOWN);
  gm_mgArrowUp.mg_pmgRight = gm_mgArrowUp.mg_pmgDown =
      &gm_mgAchievements[0];
  gm_mgArrowDn.mg_pmgRight = gm_mgArrowDn.mg_pmgUp =
      &gm_mgAchievements[ACHIEVEMENTS_ON_SCREEN - 1];

  gm_ctListVisible = ACHIEVEMENTS_ON_SCREEN;
  gm_pmgArrowUp = &gm_mgArrowUp;
  gm_pmgArrowDn = &gm_mgArrowDn;
  gm_pmgListTop = &gm_mgAchievements[0];
  gm_pmgListBottom = &gm_mgAchievements[ACHIEVEMENTS_ON_SCREEN - 1];

  gm_mgClearAchievements.mg_bfsFontSize = BFS_SMALL;
  gm_mgClearAchievements.mg_boxOnScreen = BoxBigRow(8);
  gm_mgClearAchievements.mg_strText = TRANS("CLEAR ACHIEVEMENTS");
  gm_mgClearAchievements.mg_strTip = TRANS("reset your progress");
  gm_lhGadgets.AddTail(gm_mgClearAchievements.mg_lnNode);
  gm_mgClearAchievements.mg_pmgUp = &gm_mgClearAchievements;
  gm_mgClearAchievements.mg_pmgDown = &gm_mgClearAchievements;
  gm_mgClearAchievements.mg_pActivatedFunction = NULL;
}


void CAchievementsMenu::StartMenu(void)
{
    // set default parameters for the list
    gm_iListOffset = 0;
    gm_ctListTotal = _lhFilteredAchievements.Count();
    gm_iListWantedItem = 0;
	CGameMenu::StartMenu();
}


void CAchievementsMenu::FillListItems(void)
{
    CGameMenu::FillListItems();

    //disable all items first
    for (INDEX i = 0; i < ACHIEVEMENTS_ON_SCREEN; i++) {
        gm_mgAchievements[i].mg_bEnabled = FALSE;
        gm_mgAchievements[i].mg_strText = TRANS("<empty>");
        gm_mgAchievements[i].mg_iInList = -2;
    }
}

