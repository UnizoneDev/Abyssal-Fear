/* Copyright (c) 2021-2024 Uni Musuotankarep
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


#include "StdAfx.h"
#include "AchievementManager.h"


CAchievementManager::CAchievementManager()
{
    _pShell->DeclareSymbol("void ProgressAchievement(INDEX, INDEX, INDEX);", &ProgressAchievement);

    sa_AchievementList.New(10);
    // CAchievement(strName, strDescription, ctMaxProgress, bHidden) constructor
    sa_AchievementList[0] = CAchievement("Obsessive", "Find all endings.", 0, FALSE);  // get all endings
    sa_AchievementList[1] = CAchievement("Deathwish", "Kill 50 hostiles.", 50, FALSE); // kill 50 demons
    sa_AchievementList[2] = CAchievement("End the torment", "Make Satan perish.", 0, FALSE); // achieve the good ending
    sa_AchievementList[3] = CAchievement("Treasurer", "Find 15 hidden areas.", 15, TRUE); // find 15 secrets
    sa_AchievementList[4] = CAchievement("Keel over and die", "Pass away 10 times.", 10, TRUE); // die 10 times
    sa_AchievementList[5] = CAchievement("Scared straight?", "Murder 30 gunmen", 30, FALSE); // kill 30 gunmen
    sa_AchievementList[6] = CAchievement("Flap your hands!", "Kill 50 twitchers.", 50, FALSE); // kill 50 twitchers
    sa_AchievementList[7] = CAchievement("Stop freaking betraying me!", "Betray 10 allies fatally.", 10, FALSE); // kill 10 allies
    sa_AchievementList[8] = CAchievement("The time has come", "Murder 40 sinners", 40, FALSE);  // kill 40 sinners
    sa_AchievementList[9] = CAchievement("It was just a bad dream", "Wake up from this nightmare.", 0, TRUE); // achieve the secret ending
};

// Alternative method instead of a constructor
void CAchievementManager::Register(INDEX i, const CTString& strName, const CTString& strDescription, INDEX iMaxProgress, BOOL bHidden) {
    sa_AchievementList[i].ach_strTitle = strName;
    sa_AchievementList[i].ach_strDescription = strDescription;
    sa_AchievementList[i].ach_iMaxProgress = iMaxProgress;
    sa_AchievementList[i].ach_bHidden = bHidden;
};

void CAchievementManager::Unlock(INDEX i) {
    sa_AchievementList[i].ach_bUnlocked = TRUE;
};

void CAchievementManager::Progress(INDEX i, INDEX iAdd) {
    sa_AchievementList[i].Progress(iAdd);
};

static void ProgressAchievement(void* pArgs) {
    INDEX i = NEXTARGUMENT(INDEX);
    INDEX bUnlockImmediately = NEXTARGUMENT(INDEX);
    INDEX iAddProgress = NEXTARGUMENT(INDEX);

    if (bUnlockImmediately) {
        _pAchManager->Unlock(i);
    }
    else {
        _pAchManager->Progress(i, iAddProgress);
    }
};

CAchievementManager *_pAchManager = NULL;
