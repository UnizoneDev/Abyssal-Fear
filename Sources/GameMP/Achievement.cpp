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
#include "Achievement.h"


CAchievement::CAchievement(CTString strTitle, CTString strDescription, INDEX MaxProgress, BOOL Hidden)
{
	ach_strTitle = strTitle;
	ach_strDescription = strDescription;
	ach_bUnlocked = FALSE;
	ach_iProgress = 0;
	ach_iMaxProgress = MaxProgress;
	ach_bHidden = Hidden;
}

void CAchievement::Unlock(void)
{
	ach_bUnlocked = TRUE;
}

void CAchievement::Lock(void)
{
	ach_bUnlocked = FALSE;
	ach_iProgress = 0;
}

void CAchievement::Progress(INDEX ctAdd)
{
	ach_iProgress += ctAdd;

	if (ach_iProgress >= ach_iMaxProgress)
	{
		Unlock();
	}
}
