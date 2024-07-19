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

#ifndef SE_INCL_ACHIEVEMENTMANAGER_H
#define SE_INCL_ACHIEVEMENTMANAGER_H

#ifdef PRAGMA_ONCE
#pragma once
#endif

#include "Achievement.h"


class CAchievementManager
{
public:
    CStaticArray<CAchievement> sa_AchievementList;

public:
    CAchievementManager();

    // Alternative method instead of a constructor
    void Register(INDEX i, const CTString& strName, const CTString& strDescription, INDEX iMaxProgress, BOOL bHidden);

    void Unlock(INDEX i);

    void Progress(INDEX i, INDEX iAdd);
};

static void ProgressAchievement(void* pArgs);

extern CAchievementManager *_pAchManager;


#endif