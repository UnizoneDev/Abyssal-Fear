/* Copyright (c) 2021-2022 Uni Musuotankarep
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

#ifndef SE_INCL_MENU_GADGET_ACHIEVEMENTBUTTON_H
#define SE_INCL_MENU_GADGET_ACHIEVEMENTBUTTON_H
#ifdef PRAGMA_ONCE
#pragma once
#endif

#include "MGButton.h"


class CMGAchievementButton : public CMGButton {
public:
	void OnActivate(void);
	void OnSetFocus(void);
};

#endif  /* include-once check. */